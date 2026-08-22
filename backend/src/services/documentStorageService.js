const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const config = require('../config/env');

const normalizeStorageDriver = (driver = config.storage?.driver || 'LOCAL') => {
  const value = String(driver || 'LOCAL').trim().toUpperCase();
  if (value === 'AZURE_BLOB' || value === 'BLOB') return 'AZURE_BLOB';
  if (value === 'S3') return 'S3';
  return 'LOCAL';
};

const getSafeFileName = (fileName = 'document') => {
  const safeName = String(fileName).replace(/[\\/]+/g, '_').replace(/\s+/g, '_');
  return safeName || 'document';
};

const decodeBinaryPayload = (doc = {}) => {
  if (doc.file_buffer || doc.fileBuffer) {
    return Buffer.isBuffer(doc.file_buffer || doc.fileBuffer)
      ? doc.file_buffer || doc.fileBuffer
      : Buffer.from(String(doc.file_buffer || doc.fileBuffer), 'base64');
  }

  if (doc.file_content || doc.fileContent) {
    const content = doc.file_content || doc.fileContent;
    return Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'base64');
  }

  if (doc.file && typeof doc.file === 'object') {
    if (Buffer.isBuffer(doc.file.buffer)) return doc.file.buffer;
    if (typeof doc.file.data === 'string') return Buffer.from(doc.file.data, 'base64');
    if (doc.file.content) return Buffer.from(doc.file.content, 'base64');
  }

  return null;
};

const ensureDirectory = (targetDir) => {
  fs.mkdirSync(targetDir, { recursive: true });
};

const persistLocalDocument = async ({ entityType, entityId, fileName, buffer }) => {
  const baseDir = path.resolve(process.cwd(), config.storage?.localDir || './uploads');
  const targetDir = path.join(baseDir, String(entityType || 'misc').toLowerCase(), String(entityId || 'unknown'));
  ensureDirectory(targetDir);

  const safeName = getSafeFileName(fileName);
  const targetFile = path.join(targetDir, safeName);
  fs.writeFileSync(targetFile, buffer);

  return {
    file_path_or_uri: `LOCAL://${path.relative(baseDir, targetFile).replace(/\\/g, '/')}`,
    storage_driver: 'LOCAL',
  };
};

const persistS3Document = async ({ entityType, entityId, fileName, buffer, mimeType }) => {
  const bucket = config.storage?.s3?.bucket;
  const region = config.storage?.s3?.region || 'us-east-1';

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET_NAME is not configured.');
  }

  const s3Client = new S3Client({
    region,
    credentials: config.storage?.s3?.accessKeyId && config.storage?.s3?.secretAccessKey
      ? {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey,
        }
      : undefined,
  });

  const key = `documents/${String(entityType || 'misc').toLowerCase()}/${String(entityId || 'unknown')}/${Date.now()}-${getSafeFileName(fileName)}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream',
  }));

  return {
    file_path_or_uri: `S3://${bucket}/${key}`,
    storage_driver: 'S3',
    s3_url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
  };
};

const persistAzureBlobDocument = async ({ entityType, entityId, fileName, buffer, mimeType }) => {
  const connectionString = config.storage?.azure?.connectionString;
  const accountName = config.storage?.azure?.accountName;
  const accountKey = config.storage?.azure?.accountKey;
  const containerName = config.storage?.azure?.containerName || 'documents';

  if (!connectionString && (!accountName || !accountKey)) {
    throw new Error('Azure Blob storage credentials are not configured.');
  }

  const blobServiceClient = connectionString
    ? BlobServiceClient.fromConnectionString(connectionString)
    : new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new StorageSharedKeyCredential(accountName, accountKey)
      );

  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const blobName = `documents/${String(entityType || 'misc').toLowerCase()}/${String(entityId || 'unknown')}/${Date.now()}-${getSafeFileName(fileName)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: mimeType || 'application/octet-stream',
    },
  });

  return {
    file_path_or_uri: `AZURE_BLOB://${containerName}/${blobName}`,
    storage_driver: 'AZURE_BLOB',
    blob_url: blockBlobClient.url,
  };
};

const saveDocument = async ({ entityType, entityId, document, storageDriver = config.storage?.driver || 'LOCAL' }) => {
  const resolvedDriver = normalizeStorageDriver(storageDriver);
  const doc = document || {};
  const fileName = getSafeFileName(doc.file_name || doc.fileName || doc.name || 'document');
  const mimeType = doc.mime_type || doc.mimeType || 'application/octet-stream';
  const buffer = decodeBinaryPayload(doc) || Buffer.from('', 'utf8');

  const metadata = await (async () => {
    if (resolvedDriver === 'S3') {
      return persistS3Document({ entityType, entityId, fileName, buffer, mimeType });
    }

    if (resolvedDriver === 'AZURE_BLOB') {
      return persistAzureBlobDocument({ entityType, entityId, fileName, buffer, mimeType });
    }

    return persistLocalDocument({ entityType, entityId, fileName, buffer });
  })();

  return {
    ...metadata,
    file_name: fileName,
    mime_type: mimeType,
  };
};

const storeDocumentMetadata = async (clientTx, entityType, entityId, documents = []) => {
  const rows = Array.isArray(documents) ? documents.filter((doc) => doc && (doc.file_name || doc.fileName || doc.name || doc.file_content || doc.fileContent || doc.file_buffer || doc.fileBuffer)) : [];

  for (const doc of rows) {
    const fileName = doc.file_name || doc.fileName || doc.name || 'document';
    const resolvedDriver = normalizeStorageDriver(doc.storage_driver || doc.storageDriver || config.storage?.driver || 'LOCAL');
    const fileBuffer = decodeBinaryPayload(doc);

    let filePath = doc.file_path_or_uri || doc.filePathOrUri || doc.uri || doc.path || null;

    if (fileBuffer) {
      const savedDoc = await saveDocument({
        entityType,
        entityId,
        document: { ...doc, file_name: fileName },
        storageDriver: resolvedDriver,
      });
      filePath = savedDoc.file_path_or_uri || filePath || `LOCAL://${fileName}`;
    }

    if (!filePath) {
      filePath = `LOCAL://${getSafeFileName(fileName)}`;
    }

    await clientTx.query(
      `
        INSERT INTO Document_Store (
          entity_type,
          entity_id,
          file_name,
          file_path_or_uri,
          storage_driver
        )
        VALUES ($1, $2, $3, $4, $5);
      `,
      [entityType, entityId, getSafeFileName(fileName), filePath, resolvedDriver]
    );
  }
};

module.exports = {
  normalizeStorageDriver,
  saveDocument,
  storeDocumentMetadata,
};
