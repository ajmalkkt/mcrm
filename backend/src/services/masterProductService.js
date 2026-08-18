import db from '../config/database.js';
import { masterProductQueries } from '../constants/masterProductQueries.js';


  /**
   * Get all products
   * @param {boolean} includeInactive 
   */
  export const getAllProducts = async (includeInactive = false) => {
    const { rows } = await db.query(masterProductQueries.GET_ALL_PRODUCTS, [includeInactive]);
    return rows;
  };

  /**
   * Get single product by ID
   * @param {string} productId 
   */
  export const getProductById = async (productId) => {
    const { rows } = await db.query(masterProductQueries.GET_PRODUCT_BY_ID, [productId]);
    return rows[0] || null;
  };

  /**
   * Get service plans (all or filtered by product_id)
   * @param {string|null} productId 
   */
  export const getServicePlans = async (productId = null) => {
    if (productId) {
      const { rows } = await db.query(masterProductQueries.GET_PLANS_BY_PRODUCT_ID, [productId]);
      return rows;
    }
    const { rows } = await db.query(masterProductQueries.GET_ALL_PLANS, [null]);
    return rows;
  };


export default { getAllProducts, getProductById, getServicePlans };