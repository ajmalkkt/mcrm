// ✅ CORRECT (Default import)
import masterProductService from '../services/masterProductService.js';

  /**
   * GET /api/master-products
   */
  export const getProducts = async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const products = await masterProductService.getAllProducts(includeInactive);

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/master-products/:id
   */
  export const getProductById = async (req, res, next) => {
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
      next(error);
    }
  };

  /**
   * GET /api/master-products/plans
   * GET /api/master-products/:id/plans
   */
  export const getServicePlans = async (req, res, next) => {
    try {
      const productId = req.params.id || req.query.productId || null;
      const plans = await masterProductService.getServicePlans(productId);

      return res.status(200).json({
        success: true,
        count: plans.length,
        data: plans
      });
    } catch (error) {
      next(error);
    }
  };


export default { getProducts, getProductById, getServicePlans };