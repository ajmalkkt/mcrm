export const PROSPECT_QUERIES = {
  CREATE_PROSPECT: `
    INSERT INTO Prospect (
      prospect_name,
      contact_number,
      email,
      address,
      city,
      state,
      country,
      geo_location,
      preferred_product_id,
      preferred_plan_id,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, 'NEW'))
    RETURNING *;
  `,

  GET_ALL_PROSPECTS: `
    SELECT 
      p.prospect_id,
      p.prospect_name,
      p.contact_number,
      p.email,
      p.address,
      p.city,
      p.state,
      p.country,
      p.geo_location,
      p.preferred_product_id,
      mp.product_name AS preferred_product_name,
      p.preferred_plan_id,
      msp.plan_name AS preferred_plan_name,
      p.status,
      p.created_at
    FROM Prospect p
    LEFT JOIN Master_Product mp ON p.preferred_product_id = mp.product_id
    LEFT JOIN Master_Service_Plan msp ON p.preferred_plan_id = msp.plan_id
    WHERE ($1::varchar IS NULL OR p.status = $1)
      AND ($2::varchar IS NULL OR p.prospect_name ILIKE $2 OR p.email ILIKE $2 OR p.contact_number ILIKE $2)
    ORDER BY p.created_at DESC;
  `,

  GET_PROSPECT_BY_ID: `
    SELECT 
      p.prospect_id,
      p.prospect_name,
      p.contact_number,
      p.email,
      p.address,
      p.city,
      p.state,
      p.country,
      p.geo_location,
      p.preferred_product_id,
      mp.product_name AS preferred_product_name,
      p.preferred_plan_id,
      msp.plan_name AS preferred_plan_name,
      p.status,
      p.created_at
    FROM Prospect p
    LEFT JOIN Master_Product mp ON p.preferred_product_id = mp.product_id
    LEFT JOIN Master_Service_Plan msp ON p.preferred_plan_id = msp.plan_id
    WHERE p.prospect_id = $1;
  `,

  UPDATE_PROSPECT: `
    UPDATE Prospect
    SET 
      prospect_name = COALESCE($2, prospect_name),
      contact_number = COALESCE($3, contact_number),
      email = COALESCE($4, email),
      address = COALESCE($5, address),
      city = COALESCE($6, city),
      state = COALESCE($7, state),
      country = COALESCE($8, country),
      geo_location = COALESCE($9, geo_location),
      preferred_product_id = COALESCE($10, preferred_product_id),
      preferred_plan_id = COALESCE($11, preferred_plan_id),
      status = COALESCE($12, status)
    WHERE prospect_id = $1
    RETURNING *;
  `,

  DELETE_PROSPECT: `
    DELETE FROM Prospect
    WHERE prospect_id = $1
    RETURNING prospect_id;
  `,

  // Transaction Queries for Conversion
  PROMOTE_CREATE_CLIENT_ACCOUNT: `
    INSERT INTO Client_Account (account_id, client_name, contact_number, address, latitude, longitude)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `,
  PROMOTE_CREATE_CLIENT_SERVICE: `
    INSERT INTO Client_Service (account_id, plan_id, start_date, end_date, status)
    VALUES ($1, $2, $3, $4, 'ACTIVE')
    RETURNING *;
  `,
  PROMOTE_TRANSFER_DOCUMENTS: `
    UPDATE Documents
    SET account_id = $1, prospect_id = NULL
    WHERE prospect_id = $2;
  `,
  PROMOTE_UPDATE_PROSPECT_STATUS: `
    UPDATE Prospect
    SET status = 'CONVERTED'
    WHERE prospect_id = $1;
  `,
  PROMOTE_ASSIGN_ACCOUNT_TO_USER: `
    INSERT INTO User_Account_Assignment (user_id, account_id)
    VALUES ($1, $2);
  `
};