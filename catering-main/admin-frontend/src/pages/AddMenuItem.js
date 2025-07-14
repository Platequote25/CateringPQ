import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { addMenuItem, updateMenuItem, fetchMenuItems, fetchCategories } from '../redux/slices/catererSlice';
import '../App.css';
import { toast } from 'react-toastify';

const AddMenuItem = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const menuItems = useSelector(state => state.caterer.menuItems);
  const categories = useSelector(state => state.caterer.categories);
  const categoriesLoading = useSelector(state => state.caterer.categoriesLoading);
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  const types = [
    { label: 'Veg', value: 'veg' },
    { label: 'Non-Veg', value: 'non-veg' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    type: '',
    isPopular: false,
    isAvailable: true,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  useEffect(() => {
    if (isEditMode) {
      if (menuItems.length === 0) {
        dispatch(fetchMenuItems());
      } else {
        const item = menuItems.find(i => i._id === editId);
        if (item) {
          setFormData({
            name: item.name || '',
            description: item.description || '',
            price: item.price || '',
            category: item.category || '',
            type: item.type || '',
            isPopular: item.isPopular || false,
            isAvailable: item.isAvailable || true,
            image: null
          });
          setImagePreview(item.imageUrl || null);
        }
      }
    }
  }, [isEditMode, editId, menuItems, dispatch]);

  const handleInputChange = (e) => {
    const { name, type, checked, value, files } = e.target;
    if (name === 'image') {
      setFormData(prev => ({
        ...prev,
        image: files[0]
      }));
      if (files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(files[0]);
      } else {
        setImagePreview(null);
      }
    } else if (name === 'price') {
      // Validate price to prevent negative values
      const numValue = parseFloat(value);
      if (value === '' || (numValue >= 0 && !isNaN(numValue))) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'image') {
        if (value) formDataToSend.append('image', value);
      } else {
        formDataToSend.append(key, value);
      }
    });

    try {
      if (isEditMode) {
        await dispatch(updateMenuItem({ id: editId, menuItemData: formDataToSend }));
        toast.success('Dish updated successfully!');
      } else {
        const result = await dispatch(addMenuItem(formDataToSend));
        if (result.error) {
          if (formData.image) {
            const formDataWithoutImage = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
              if (key !== 'image') {
                formDataWithoutImage.append(key, value);
              }
            });
            const retryResult = await dispatch(addMenuItem(formDataWithoutImage));
            if (retryResult.error) {
              throw new Error(retryResult.error);
            }
            toast.success('Dish added successfully! (without image)');
          } else {
            throw new Error(result.error);
          }
        } else {
          toast.success('Dish added successfully!');
        }
      }
      await dispatch(fetchMenuItems());
      navigate('/caterer/menu');
    } catch (err) {
      let errorMsg = err?.message;
      if (!errorMsg && typeof err === 'object') {
        errorMsg = JSON.stringify(err);
      }
      toast.error(errorMsg || 'Failed to save menu item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-event-bg">
      <form className="add-event-card" onSubmit={handleSubmit}>
        <button type="button" className="add-event-close" onClick={() => navigate(-1)}>
          <span className="material-icons">close</span>
        </button>
        <h2 className="add-event-title">{isEditMode ? 'Edit Dish' : 'Add new dish'}</h2>
        <label className="add-event-label">
          Name
          <input 
            className="add-event-input" 
            name="name" 
            placeholder="Enter name" 
            value={formData.name} 
            onChange={handleInputChange} 
            required 
          />
        </label>
        <label className="add-event-label">
          Description
          <textarea 
            className="add-event-input" 
            name="description" 
            placeholder="Enter description" 
            value={formData.description} 
            onChange={handleInputChange} 
            rows={3}
          />
        </label>
        <label className="add-event-label">
          Price (in ₹)
          <input 
            className="add-event-input" 
            name="price" 
            type="number" 
            min="0"
            step="0.01"
            placeholder="Enter price in rupees" 
            value={formData.price} 
            onChange={handleInputChange} 
            required 
          />
        </label>
        <label className="add-event-label">
          Category
          {categoriesLoading ? (
            <div style={{ padding: '8px 0', color: '#888' }}>Loading categories...</div>
          ) : (
            <select
              className="add-event-input"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat._id || cat.name} value={cat.name || cat.value}>{cat.name || cat.value}</option>
              ))}
            </select>
          )}
        </label>
        <label className="add-event-label">
          Type
          <select
            className="add-event-input"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>Select type</option>
            {types.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <div className="add-event-label">
          <div className="flex items-center justify-between">
            <span>Popular</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                id="isPopular"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div className="add-event-label">
          <div className="flex items-center justify-between">
            <span>Available</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        <label className="add-event-label">
          Image
          <input
            className="add-event-input"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleInputChange}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', marginTop: 8, borderRadius: 8 }} />
          )}
        </label>
        <button
          className="add-event-save"
          type="submit"
          disabled={loading}
          style={{ width: '100%', marginTop: 16 }}
        >
          {loading ? 'Saving...' : isEditMode ? 'Update Dish' : 'Add Dish'}
        </button>
      </form>
      <style jsx>{`
        .toggle-switch {
          position: relative;
          width: 40px;
          height: 22px;
          display: inline-block;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          border-radius: 22px;
          transition: 0.3s;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
        }
        .toggle-switch input:checked + .toggle-slider {
          background-color: #ff5c8d;
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(18px);
        }
      `}</style>
    </div>
  );
};

export default AddMenuItem; 