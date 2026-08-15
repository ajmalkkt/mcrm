-- Seed Initial Products
INSERT INTO Master_Product (product_id, product_name) VALUES
  ('p_fiber', 'Fiber Broadband'),
  ('p_mobile', 'Mobile Connections'),
  ('p_home_internet', 'Home 5G Internet')
ON CONFLICT (product_name) DO NOTHING;

-- Seed Service Plans
INSERT INTO Master_Service_Plan (plan_id, product_id, plan_name, billing_cycle) VALUES
  ('plan_fiber_500', 'p_fiber', 'Enterprise Fiber 500Mbps', 'MONTHLY'),
  ('plan_mobile_unl', 'p_mobile', 'Unlimited Corporate Mobile', 'MONTHLY')
ON CONFLICT DO NOTHING;