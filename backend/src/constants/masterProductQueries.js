const masterProductQueries = {
  GET_ALL_PRODUCTS: `
    SELECT 
      product_id,
      product_name,
      is_active,
      created_at
    FROM Master_Product
    WHERE ($1::boolean IS TRUE OR is_active = TRUE)
    ORDER BY product_name ASC;
  `,

  GET_PRODUCT_BY_ID: `
    SELECT product_id, product_name, is_active, created_at
    FROM Master_Product
    WHERE product_id = $1;
  `,

  GET_ALL_PLANS: `
    SELECT 
      sp.plan_id,
      sp.product_id,
      p.product_name,
      sp.plan_name,
      sp.billing_cycle,
      sp.created_at
    FROM Master_Service_Plan sp
    JOIN Master_Product p ON sp.product_id = p.product_id
    WHERE ($1::varchar IS NULL OR sp.product_id = $1)
    ORDER BY sp.plan_name ASC;
  `,

  GET_PLANS_BY_PRODUCT_ID: `
    SELECT 
      plan_id,
      product_id,
      plan_name,
      billing_cycle,
      created_at
    FROM Master_Service_Plan
    WHERE product_id = $1
    ORDER BY plan_name ASC;
  `
};

module.exports = { masterProductQueries };