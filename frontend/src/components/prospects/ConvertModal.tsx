import React, { useState, useEffect } from 'react';
import { Prospect , ConvertProspectPayload} from '../../types/prospect';
import { prospectsApi} from '../../api/prospects';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  UserCheck,
  Hash
} from 'lucide-react';

interface ConvertProspectModalProps {
  isOpen: boolean;
  prospect: Prospect | null;
  onClose: () => void;
  onSuccess: (updatedProspectId: string, accountId: string) => void;
}

export const ConvertProspectModal: React.FC<ConvertProspectModalProps> = ({
  isOpen,
  prospect,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<ConvertProspectPayload>({
    account_id: '',
    client_name: '',
    contact_number: '',
    secondary_contact_number: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    latitude: null,
    longitude: null
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prospect) {
      // Parse geo_location (assuming "lat, long" string format if present)
      let lat: number | null = null;
      let lng: number | null = null;
      if (prospect.geo_location) {
        const parts = prospect.geo_location.split(',').map((p) => p.trim());
        if (parts.length === 2) {
          lat = parseFloat(parts[0]) || null;
          lng = parseFloat(parts[1]) || null;
        }
      }

      setFormData({
        account_id: `ACC-${Math.floor(100000 + Math.random() * 900000)}`, // Auto-suggested ID
        client_name: prospect.prospect_name || '',
        contact_number: prospect.contact_number || '',
        secondary_contact_number: '',
        email: prospect.email || '',
        address: prospect.address || '',
        city: (prospect as any).city || '',
        state: (prospect as any).state || '',
        country: (prospect as any).country || '',
        latitude: lat,
        longitude: lng
      });
      setError(null);
    }
  }, [prospect, isOpen]);

  if (!isOpen || !prospect) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' 
        ? (value === '' ? null : parseFloat(value))
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account_id.trim()) {
      setError('Business Account Number (account_id) is required.');
      return;
    }
    if (!formData.client_name.trim() || !formData.email.trim() || !formData.contact_number.trim()) {
      setError('Client name, primary contact number, and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await prospectsApi.convertProspect(prospect.prospect_id, formData);

      if (response.success) {
        onSuccess(prospect.prospect_id, response.data.account_id);
        onClose();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to convert prospect to client account.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Convert Prospect to Client Account</h3>
              <p className="text-xs text-slate-500">
                Create a verified <span className="font-semibold text-slate-700">Client_Account</span> record for {prospect.prospect_name}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Identifiers */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              1. Account Identification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Business Account Number (ID) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleChange}
                    required
                    placeholder="e.g. ACC-100293"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    required
                    placeholder="Client Company Name"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              2. Contact Information
            </h4>

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
                  onChange={handleChange}
                  required
                  placeholder="client@domain.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Primary Contact No. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                    placeholder="+1 555-0199"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Secondary Contact No.</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="secondary_contact_number"
                    value={formData.secondary_contact_number}
                    onChange={handleChange}
                    placeholder="Optional secondary number"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Geographic Location */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              3. Address & Location
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Street Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address or office building"
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
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State / Region"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude ?? ''}
                  onChange={handleChange}
                  placeholder="e.g. 12.971598"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude ?? ''}
                  onChange={handleChange}
                  placeholder="e.g. 77.594562"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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
              <span>{isSubmitting ? 'Converting...' : 'Convert to Client Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};