import React, { useEffect, useState } from 'react';
import { createClientAccount } from '../../api/clientApi';
import { apiClient } from '../../api/client';
import { X, Plus, Trash2, Building2, User, Mail, Phone, MapPin, AlertCircle, FileText } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
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

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    client_code: '',
    client_name: '',
    contact_number: '',
    secondary_contact_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([{ id: Date.now(), productId: '', planId: '' }]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [plansByProduct, setPlansByProduct] = useState<Record<string, ServicePlanOption[]>>({});
  const [documents, setDocuments] = useState<Array<{ file_name: string; file_path_or_uri: string; storage_driver: 'LOCAL' | 'S3' | 'BLOB' }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await apiClient.get<{ data: ProductOption[] }>('/master-products');
        setProducts(response.data.data || []);
      } catch (err: any) {
        console.error('Failed to fetch products', err);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);
    setDocuments(fileList.map((file) => ({
      file_name: file.name,
      file_path_or_uri: `LOCAL://${file.name}`,
      storage_driver: 'LOCAL'
    })));
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
    setServiceRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === 'productId') {
          return { ...row, productId: value, planId: '' };
        }
        return { ...row, planId: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (documents.length === 0) {
      setError('At least one supporting document is required for the client account.');
      setLoading(false);
      return;
    }

    try {
      const validServices = serviceRows
        .filter((row) => row.productId && row.planId)
        .map((row) => ({
          plan_id: row.planId,
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'PENDING_PROVISION',
        }));

      const payload = {
        ...form,
        services: validServices,
        documents,
      };

      const created = await createClientAccount(payload);
      onSuccess?.(created.account_id || '');
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create client';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Add New Client Account</h3>
            <p className="text-xs text-slate-500">Create a verified client and assign one or more service plans.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">1. Client Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Client Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="client_name" value={form.client_name} onChange={handleChange} required placeholder="Client or Company Name" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Contact <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="contact_number" value={form.contact_number} onChange={handleChange} required placeholder="+1 555-0199" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secondary Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="secondary_contact_number" value={form.secondary_contact_number} onChange={handleChange} placeholder="Optional" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Email Address <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="client@company.com" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Client Code</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="client_code" value={form.client_code} onChange={handleChange} placeholder="Optional internal code" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">2. Address & Location</h4>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Street Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <textarea name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Street address or building details" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block font-bold text-slate-700 mb-1">City</label><input name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block font-bold text-slate-700 mb-1">State / Region</label><input name="state" value={form.state} onChange={handleChange} placeholder="State" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block font-bold text-slate-700 mb-1">Country</label><input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">3. Service Plans</h4>
              <button type="button" onClick={addServiceRow} className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"><Plus className="w-3.5 h-3.5" /> Add Service</button>
            </div>

            <div className="space-y-3">
              {serviceRows.map((row) => {
                const planOptions = row.productId ? plansByProduct[row.productId] || [] : [];
                return (
                  <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end bg-slate-50 p-2 rounded-lg border border-slate-200">
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
                        <option value="">Select plan</option>
                        {planOptions.map((plan) => <option key={plan.plan_id} value={plan.plan_id}>{plan.plan_name} ({plan.billing_cycle})</option>)}
                      </select>
                    </div>

                    {serviceRows.length > 1 && (
                      <button type="button" onClick={() => removeServiceRow(row.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">4. Supporting Documents (Required)</h4>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 hover:bg-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="w-4 h-4" />
                <span>{documents.length > 0 ? `${documents.length} file(s) selected` : 'Upload documents'}</span>
              </div>
              <input type="file" multiple onChange={handleDocumentChange} className="hidden" />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition">Cancel</button>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60">{loading ? 'Creating...' : 'Create Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
