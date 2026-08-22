const masterProductService = require('../services/masterProductService');

const getProducts = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const products = await masterProductService.getAllProducts(includeInactive);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await masterProductService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product.' });
  }
};

const getServicePlans = async (req, res) => {
  try {
    const productId = req.params.id || req.query.productId || null;
    const plans = await masterProductService.getServicePlans(productId);

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching service plans:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve service plans.' });
  }
};

module.exports = { getProducts, getProductById, getServicePlans };