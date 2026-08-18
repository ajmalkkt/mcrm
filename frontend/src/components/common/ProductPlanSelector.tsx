import React, { useState, useEffect } from 'react';
import { Package, Layers, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

export interface Product {
  product_id: string;
  product_name: string;
  is_active: boolean;
}

export interface ServicePlan {
  plan_id: string;
  product_id: string;
  plan_name: string;
  billing_cycle: string;
}

interface ProductPlanSelectorProps {
  selectedProductId: string;
  selectedPlanId: string;
  onProductChange: (productId: string) => void;
  onPlanChange: (planId: string) => void;
  disabled?: boolean;
}

export const ProductPlanSelector: React.FC<ProductPlanSelectorProps> = ({
  selectedProductId,
  selectedPlanId,
  onProductChange,
  onPlanChange,
  disabled = false
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await apiClient.get<{ data: Product[] }>('/master-products');
        setProducts(response.data.data || []);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Fetch plans dynamically when selectedProductId changes
  useEffect(() => {
    if (!selectedProductId) {
      setPlans([]);
      onPlanChange('');
      return;
    }

    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await apiClient.get<{ data: ServicePlan[] }>(
          `/master-products/${selectedProductId}/plans`
        );
        setPlans(response.data.data || []);
      } catch (err) {
        console.error('Failed to load service plans', err);
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, [selectedProductId]);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProductId = e.target.value;
    onProductChange(newProductId);
    onPlanChange(''); // Reset selected plan on product switch
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Product Offering Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Product Offering
        </label>
        <div className="relative">
          <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedProductId}
            onChange={handleProductSelect}
            disabled={disabled || loadingProducts}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100"
          >
            <option value="">-- Select Product Offering --</option>
            {products.map((prod) => (
              <option key={prod.product_id} value={prod.product_id}>
                {prod.product_name}
              </option>
            ))}
          </select>
          {loadingProducts && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      {/* Dependent Plan Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Service Plan
        </label>
        <div className="relative">
          <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedPlanId}
            onChange={(e) => onPlanChange(e.target.value)}
            disabled={disabled || !selectedProductId || loadingPlans}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100"
          >
            <option value="">
              {!selectedProductId
                ? 'Select a product first'
                : loadingPlans
                ? 'Loading plans...'
                : plans.length === 0
                ? 'No plans available'
                : '-- Select Service Plan --'}
            </option>
            {plans.map((plan) => (
              <option key={plan.plan_id} value={plan.plan_id}>
                {plan.plan_name} ({plan.billing_cycle})
              </option>
            ))}
          </select>
          {loadingPlans && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
};