import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCatererProfile, fetchCatererProfile } from '../../redux/slices/catererSlice';
import CatererNavbar from './CatererNavbar';
import { toast } from 'react-toastify';
import axios from 'axios';

const Settings = () => {
  const dispatch = useDispatch();
  const { catererInfo, loading, error } = useSelector(state => state.caterer);
  
  // Configuration for API requests
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  };
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  const [dynamicPricing, setDynamicPricing] = useState([
    { min: 1, max: 10, discount: 0 },
  ]);
  const [pricingError, setPricingError] = useState('');
  const [discountsSaved, setDiscountsSaved] = useState(false);
  const [miscCost, setMiscCost] = useState(0);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  
  useEffect(() => {
    if (catererInfo) {
      setFormData({
        businessName: catererInfo.businessName || '',
        email: catererInfo.email || '',
        phone: catererInfo.phone || '',
        address: catererInfo.address || '',
        description: catererInfo.description || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      // Load dynamic pricing from backend
      setDynamicPricing(
        Array.isArray(catererInfo.dynamicPricing) && catererInfo.dynamicPricing.length > 0
          ? catererInfo.dynamicPricing
          : [{ min: 1, max: 10, discount: 0 }]
      );
      setMiscCost(typeof catererInfo.miscCost === 'number' ? catererInfo.miscCost : 0);
      if (catererInfo.businessLogo) {
        setLogoPreview(catererInfo.businessLogo);
      }
    }
  }, [catererInfo]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };
  
  const handlePricingChange = (idx, field, value) => {
    setDynamicPricing(pricing => pricing.map((rule, i) =>
      i === idx ? { ...rule, [field]: value } : rule
    ));
  };
  
  const handleAddRule = () => {
    setDynamicPricing(pricing => [...pricing, { min: '', discount: '' }]);
  };
  
  const handleRemoveRule = (idx) => {
    setDynamicPricing(pricing => pricing.filter((_, i) => i !== idx));
  };
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleLogoUpload = async () => {
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append('image', logoFile);
    try {
      const response = await axios.post('/api/caterer/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.url; // Assuming backend returns { url: '...' }
    } catch (err) {
      toast.error('Failed to upload logo');
      return null;
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number should be 10 digits';
    }
    
    // Only validate password fields if user is trying to change it
    if (formData.currentPassword || formData.newPassword || formData.confirmNewPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (formData.newPassword !== formData.confirmNewPassword) {
        errors.confirmNewPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validatePricing = () => {
    for (let rule of dynamicPricing) {
      if (!rule.min || rule.discount === '') {
        setPricingError('All fields are required for each rule.');
        return false;
      }
    }
    setPricingError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (validateForm()) {
      if (!validatePricing()) return;

      let logoUrl = formData.businessLogo;
      if (logoFile) {
        logoUrl = await handleLogoUpload();
        if (!logoUrl) return; // Stop if upload failed
      }

      // Only include profile fields for profile update
      const profileData = {
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        dynamicPricing: dynamicPricing,
        miscCost: Number(miscCost),
        businessLogo: logoUrl // Add logo URL
      };

      try {
        // If changing password, call password change API first
        if (formData.currentPassword && formData.newPassword) {
          const response = await axios.put(
            '/api/caterer/change-key',
            { currentPassword: formData.currentPassword, newPassword: formData.newPassword },
            config
          );

          if (response.data.success) {
            // Store new token
            localStorage.setItem('token', response.data.token);
            
            setSuccessMessage('Password updated successfully');
            setFormData({
              ...formData,
              currentPassword: '',
              newPassword: '',
              confirmNewPassword: ''
            });
            dispatch(fetchCatererProfile());
          }
        }

        // Update profile (without password fields)
        await dispatch(updateCatererProfile(profileData)).unwrap();
        toast.success('Profile updated successfully');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        dispatch(fetchCatererProfile());
        setSuccessMessage('Profile updated successfully');
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('password')) {
          setFormErrors({
            ...formErrors,
            currentPassword: err.message
          });
        } else {
          toast.error(err.message || 'Failed to update profile');
        }
      }
    }
  };
  
  const handleSaveDiscounts = () => {
    if (!validatePricing()) return;
    dispatch(updateCatererProfile({ dynamicPricing, miscCost: Number(miscCost) }))
      .unwrap()
      .then(() => {
        toast.success('Discount rules updated successfully');
        setDiscountsSaved(true);
        dispatch(fetchCatererProfile());
      })
      .catch(() => setDiscountsSaved(false));
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <CatererNavbar />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500 ">
            Manage your catering business profile and account settings
          </p>
        </div>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="settings-grid-layout">
          <div className="settings-grid-left">
            <form onSubmit={handleSubmit}>
              <div className="add-event-card">
                {/* Business Info Section */}
                <div style={{paddingTop: 8, paddingBottom: 8}}>
                  <h3 className="add-event-title text-center">Business Information</h3>
                  <label className="add-event-label">Business Name *
                    <input
                      type="text"
                      name="businessName"
                      id="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className={`add-event-input${formErrors.businessName ? ' border-red-300' : ''}`}
                    />
                    {formErrors.businessName && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.businessName}</p>
                    )}
                  </label>
                  <label className="add-event-label">Email Address *
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`add-event-input${formErrors.email ? ' border-red-300' : ''}`}
                    />
                    {formErrors.email && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </label>
                  <label className="add-event-label">Phone Number
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`add-event-input${formErrors.phone ? ' border-red-300' : ''}`}
                    />
                    {formErrors.phone && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </label>
                  <label className="add-event-label">Business Address
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="add-event-input"
                    />
                  </label>
                  <label className="add-event-label">Business Description
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="add-event-input"
                    />
                    <span className="text-xs text-gray-500">Brief description of your catering business</span>
                  </label>
                  <div className="form-group">
                    <label>Business Logo</label>
                    {logoPreview && <img src={logoPreview} alt="Logo Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>
                {/* Password Section */}
                <div className="mt-10 pt-10 border-t border-gray-200">
                  <h3 className="add-event-title text-center">Change Password</h3>
                  <label className="add-event-label">Current Password
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className={`add-event-input${formErrors.currentPassword ? ' border-red-300' : ''}`}
                    />
                    {formErrors.currentPassword && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.currentPassword}</p>
                    )}
                  </label>
                  <label className="add-event-label">New Password
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={`add-event-input${formErrors.newPassword ? ' border-red-300' : ''}`}
                    />
                    {formErrors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.newPassword}</p>
                    )}
                  </label>
                  <label className="add-event-label">Confirm New Password
                    <input
                      type="password"
                      name="confirmNewPassword"
                      id="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleInputChange}
                      className={`add-event-input${formErrors.confirmNewPassword ? ' border-red-300' : ''}`}
                    />
                    {formErrors.confirmNewPassword && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.confirmNewPassword}</p>
                    )}
                  </label>
                </div>
                {/* Save Button Only */}
                <div className="mt-10 pt-5 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      style={{ borderRadius: '999px' }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="settings-grid-right">
            <div className="add-event-card dynamic-pricing-card" style={{ border: '2px solid #ff5c8d', paddingRight: 24 }}>
              <h3 className="add-event-title text-center" style={{ color: '#ff5c8d' }}>Dynamic Pricing (Discounts)</h3>
              {/* Show saved discount rules */}
              {Array.isArray(dynamicPricing) && dynamicPricing.length > 0 && dynamicPricing.some(r => r.min && r.discount !== '') && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Saved Discount Rules:</strong>
                  <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {dynamicPricing.filter(r => r.min && r.discount !== '').map((rule, idx) => (
                      <li key={idx} style={{ padding: '4px 0', color: '#ff5c8d', fontWeight: 500 }}>
                        From {rule.min} guests: {rule.discount}% off
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Discount rule editor */}
              {dynamicPricing.map((rule, idx) => (
                <div key={idx} className="dynamic-pricing-row">
                  <input
                    type="number"
                    min="1"
                    placeholder="Min guests"
                    value={rule.min}
                    onChange={e => handlePricingChange(idx, 'min', e.target.value)}
                    className="add-event-input dynamic-pricing-input"
                  />
                  <span>Discount (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Discount"
                    value={rule.discount}
                    onChange={e => handlePricingChange(idx, 'discount', e.target.value)}
                    className="add-event-input dynamic-pricing-input"
                  />
                  <button type="button" onClick={() => handleRemoveRule(idx)} className="dynamic-pricing-remove">Remove</button>
                </div>
              ))}
              <button type="button" onClick={handleAddRule} style={{ color: '#fff', background: '#ff5c8d', border: 'none', borderRadius: 6, padding: '8px 16px', marginTop: 8, cursor: 'pointer' }}>Add Rule</button>
              {pricingError && <div style={{ color: '#ff5c8d', marginTop: 8 }}>{pricingError}</div>}
              <button type="button" onClick={handleSaveDiscounts} className="orderflow-btn" style={{ marginTop: 16, background: '#ff5c8d', color: '#fff' }}>Save Discounts</button>
              {discountsSaved && <div style={{ color: '#16a34a', marginTop: 8 }}>Discount rules saved!</div>}
            </div>
            <div className="add-event-card" style={{ border: '2px solid #ff5c8d', padding: 24, marginTop: 24 }}>
              <h3 className="add-event-title" style={{ color: '#ff5c8d', marginBottom: 16 }}>Miscellaneous Cost</h3>
              <label style={{ fontWeight: 600, color: '#222' }}>
                Default Miscellaneous Cost (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={miscCost}
                  onChange={e => setMiscCost(e.target.value)}
                  className="add-event-input dynamic-pricing-input"
                  style={{ marginLeft: 12, width: 160 }}
                />
              </label>
              <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>This cost will be added to every order by default. You can update it anytime.</div>
              <button type="button" onClick={handleSaveDiscounts} className="orderflow-btn" style={{ marginTop: 16, background: '#ff5c8d', color: '#fff' }}>Save Miscellaneous Cost</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
.settings-grid-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 40px;
  align-items: flex-start;
  margin-top: 32px;
}
.settings-grid-left, .settings-grid-right {
  min-width: 0;
}
.settings-grid-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (max-width: 1200px) {
  .settings-grid-layout {
    grid-template-columns: 1fr !important;
    display: block !important;
    gap: 16px !important;
  }
  .settings-grid-left, .settings-grid-right {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .add-event-card {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    padding: 12px !important;
    box-sizing: border-box;
  }
}
@media (max-width: 700px) {
  .settings-grid-layout {
    display: block;
  }
  .settings-grid-right {
    flex-direction: column;
    gap: 16px;
  }
  .settings-grid-right > .add-event-card {
    margin-top: 16px !important;
  }
  .dynamic-pricing-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .dynamic-pricing-input, .dynamic-pricing-remove {
    width: 100% !important;
    min-width: 0 !important;
  }
  .add-event-card.dynamic-pricing-card {
    padding: 8px !important;
  }
  /* Miscellaneous Cost input responsive fix */
  .add-event-card input[type="number"].dynamic-pricing-input {
    width: 100% !important;
    margin-left: 0 !important;
    margin-bottom: 12px;
    box-sizing: border-box;
  }
  .add-event-card label[style] {
    display: block !important;
  }
}
@media (max-width: 600px) {
  .add-event-card {
    padding: 8px !important;
  }
  .add-event-card input, .add-event-card button {
    width: 100% !important;
    min-width: 0 !important;
    margin-bottom: 8px;
  }
  .add-event-card .add-event-title {
    font-size: 1.1rem !important;
  }
}
.add-event-card.dynamic-pricing-card {
  max-width: 100%;
  overflow-x: auto;
  padding: 16px;
}
.dynamic-pricing-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  width: 100%;
}
.dynamic-pricing-input {
  border-color: #ff5c8d;
  width: 100px;
  flex: 1 1 100px;
  min-width: 80px;
}
.dynamic-pricing-remove {
  color: #fff;
  background: #ff5c8d;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  flex: 0 0 auto;
  min-width: 80px;
}
`}</style>
    </div>
  );
};

export default Settings;