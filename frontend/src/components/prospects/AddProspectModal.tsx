import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProductPlanSelector } from '../common/ProductPlanSelector';
import { prospectsApi } from '../../api/prospects';
import { Prospect } from '../../types/prospect';

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProspect: Prospect) => void;
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
    geo_location: '',
    preferred_product_id: '',
    preferred_plan_id: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handlers specifically for the ProductPlanSelector
  const handleProductChange = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_product_id: productId,
      preferred_plan_id: '' // Clear plan when product changes
    }));
  };

  const handlePlanChange = (planId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_plan_id: planId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prospect_name.trim() || !formData.email.trim() || !formData.contact_number.trim()) {
      setError('Name, contact number, and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Submit to backend
      const response = await prospectsApi.createProspect({
        prospect_name: formData.prospect_name,
        contact_number: formData.contact_number,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        geo_location: formData.geo_location,
        preferred_product_id: formData.preferred_product_id || 'null',
        preferred_plan_id: formData.preferred_plan_id || 'null'
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

          {/* Section 2: Product & Plan Selection */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              2. Product & Service Plan Preference
            </h4>

            {/* Integrated ProductPlanSelector */}
            <ProductPlanSelector
              selectedProductId={formData.preferred_product_id}
              selectedPlanId={formData.preferred_plan_id}
              onProductChange={handleProductChange}
              onPlanChange={handlePlanChange}
              disabled={isSubmitting}
            />
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

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-semibold shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Create Prospect'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};