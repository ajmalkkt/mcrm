import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, MapPin, CheckCircle2, AlertCircle, FileText, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { prospectsApi } from '../../api/prospects';
import { Prospect } from '../../types/prospect';

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProspect: Prospect) => void;
}

interface ProductOption {
  product_id: string;
  product_name: string;
}

interface ServicePlanOption {
  plan_id: string;
  plan_name: string;
  billing_cycle: string;
}

interface ServiceRow {
  id: number;
  productId: string;
  planId: string;
}

export const AddProspectModal: React.FC<AddProspectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    prospect_name: '',
    contact_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    geo_location: ''
  });
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([{ id: Date.now(), productId: '', planId: '' }]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [plansByProduct, setPlansByProduct] = useState<Record<string, ServicePlanOption[]>>({});
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await apiClient.get<{ data: ProductOption[] }>('/master-products');
        setProducts(response.data.data || []);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [isOpen]);

  const fetchPlans = async (productId: string) => {
    if (!productId) return [];
    if (plansByProduct[productId]) return plansByProduct[productId];

    try {
      setLoadingPlans(true);
      const response = await apiClient.get<{ data: ServicePlanOption[] }>(`/master-products/${productId}/plans`);
      const nextPlans = response.data.data || [];
      setPlansByProduct((prev) => ({ ...prev, [productId]: nextPlans }));
      return nextPlans;
    } catch (err) {
      console.error('Failed to fetch plans', err);
      return [];
    } finally {
      setLoadingPlans(false);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addServiceRow = () => {
    setServiceRows((prev) => [...prev, { id: Date.now() + Math.random(), productId: '', planId: '' }]);
  };

  const removeServiceRow = (id: number) => {
    setServiceRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  };

  const updateServiceRow = (id: number, field: 'productId' | 'planId', value: string) => {
    setServiceRows((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      if (field === 'productId') return { ...row, productId: value, planId: '' };
      return { ...row, planId: value };
    }));
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);
    setDocuments(fileList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prospect_name.trim() || !formData.email.trim() || !formData.contact_number.trim()) {
      setError('Name, contact number, and email are required.');
      return;
    }

    const primarySelection = serviceRows.find((row) => row.productId && row.planId) || serviceRows[0];

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await prospectsApi.createProspect({
        prospect_name: formData.prospect_name,
        contact_number: formData.contact_number,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        geo_location: formData.geo_location,
        preferred_product_id: primarySelection?.productId || undefined,
        preferred_plan_id: primarySelection?.planId || undefined,
        documents: documents.length > 0 ? documents : undefined,
        service_preferences: serviceRows.filter((row) => row.productId && row.planId).map((row) => ({
          product_id: row.productId,
          plan_id: row.planId
        }))
      });

      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create prospect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Add New Prospect</h3>
            <p className="text-xs text-slate-500">Enter prospect details and select their preferred service offering.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              1. Prospect Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Prospect Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="prospect_name"
                    value={formData.prospect_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Company or Individual Name"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="prospect@company.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Contact Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                  placeholder="+1 555-0199"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">2. Product & Service Plan Preference</h4>
              <button type="button" onClick={addServiceRow} className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800">
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="space-y-3">
              {serviceRows.map((row) => {
                const planOptions = row.productId ? plansByProduct[row.productId] || [] : [];
                return (
                  <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Product</label>
                      <select value={row.productId} onChange={async (e) => { const productId = e.target.value; updateServiceRow(row.id, 'productId', productId); if (productId) await fetchPlans(productId); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={loadingProducts}>
                        <option value="">Select product</option>
                        {products.map((product) => <option key={product.product_id} value={product.product_id}>{product.product_name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Plan</label>
                      <select value={row.planId} onChange={(e) => updateServiceRow(row.id, 'planId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" disabled={!row.productId || loadingPlans}>
                        <option value="">{!row.productId ? 'Select product first' : 'Select plan'}</option>
                        {planOptions.map((plan) => <option key={plan.plan_id} value={plan.plan_id}>{plan.plan_name} ({plan.billing_cycle})</option>)}
                      </select>
                    </div>

                    {serviceRows.length > 1 && (
                      <button type="button" onClick={() => removeServiceRow(row.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Section 3: Location Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              3. Location & Address
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Street Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address or building details"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State / Region</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State / Region"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">4. Supporting Documents (Optional)</h4>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 hover:bg-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="w-4 h-4" />
                <span>{documents.length > 0 ? `${documents.length} file(s) selected` : 'Upload documents'}</span>
              </div>
              <input type="file" multiple onChange={handleDocumentChange} className="hidden" />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60">
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};