const db = require('../config/database');
const { masterProductQueries } = require('../constants/masterProductQueries');

const getAllProducts = async (includeInactive = false) => {
  const { rows } = await db.query(masterProductQueries.GET_ALL_PRODUCTS, [includeInactive]);
  return rows;
};

const getProductById = async (productId) => {
  const { rows } = await db.query(masterProductQueries.GET_PRODUCT_BY_ID, [productId]);
  return rows[0] || null;
};

const getServicePlans = async (productId = null) => {
  if (productId) {
    const { rows } = await db.query(masterProductQueries.GET_PLANS_BY_PRODUCT_ID, [productId]);
    return rows;
  }
  const { rows } = await db.query(masterProductQueries.GET_ALL_PLANS, [null]);
  return rows;
};

module.exports = {
  getAllProducts,
  getProductById,
  getServicePlans,
};