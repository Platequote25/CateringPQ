import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { submitFeedback } from '../redux/slices/customerSlice';
import { toast } from 'react-toastify';

const FeedbackForm = () => {
  const { catererID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, catererInfo } = useSelector(state => state.customer);
  
  // Form state
  const [formData, setFormData] = useState({
    bookingId: '',
    customerName: '',
    customerEmail: '',
    overallRating: 5,
    foodQualityRating: 5,
    serviceRating: 5,
    valueForMoneyRating: 5,
    punctualityRating: 5,
    comments: '',
    wouldRecommend: true,
    allowPublicReview: true,
    photos: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle rating change
  const handleRatingChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check file size and type
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
      }
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...validFiles].slice(0, 5) // Limit to 5 photos
      }));
    }
  };
  
  // Remove photo
  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formData.customerEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    if (!formData.bookingId.trim()) {
      toast.error('Please enter your booking ID');
      return;
    }
    
    setIsSubmitting(true);
    
    // Convert photos to base64 for API submission
    const photosPromises = formData.photos.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    });
    
    try {
      const photoBase64 = await Promise.all(photosPromises);
      
      const feedbackData = {
        ...formData,
        photos: photoBase64,
        submittedAt: new Date().toISOString()
      };
      
      dispatch(submitFeedback({ catererID, feedbackData }))
        .unwrap()
        .then(() => {
          toast.success('Thank you for your feedback!');
          navigate(`/customer/${catererID}`);
        })
        .catch(err => {
          toast.error(err || 'Failed to submit feedback');
          setIsSubmitting(false);
        });
    } catch (error) {
      toast.error('Error processing images');
      setIsSubmitting(false);
    }
  };
  
  // Render star rating component
  const StarRating = ({ name, value, onChange }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onClick={() => onChange(name, star)}
          >
            <svg
              className={`h-8 w-8 ${
                star <= value ? 'text-yellow-400' : 'text-gray-300'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Feedback Form</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                We value your feedback! Please share your experience with {catererInfo?.businessName || 'our catering service'}.
              </p>
            </div>
            
            <div className="border-t border-gray-200">
              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  {/* Booking Information */}
                  <div className="col-span-6">
                    <h4 className="text-md font-medium text-gray-900">Booking Information</h4>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700">
                      Booking ID
                    </label>
                    <input
                      type="text"
                      name="bookingId"
                      id="bookingId"
                      value={formData.bookingId}
                      onChange={handleChange}
                      placeholder="Enter your booking ID"
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Customer Information */}
                  <div className="col-span-6 border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-900">Your Information</h4>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      id="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      id="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Rating Section */}
                  <div className="col-span-6 border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-900">Your Ratings</h4>
                  </div>
                  
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overall Experience
                    </label>
                    <StarRating
                      name="overallRating"
                      value={formData.overallRating}
                      onChange={handleRatingChange}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Food Quality
                    </label>
                    <StarRating
                      name="foodQualityRating"
                      value={formData.foodQualityRating}
                      onChange={handleRatingChange}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Quality
                    </label>
                    <StarRating
                      name="serviceRating"
                      value={formData.serviceRating}
                      onChange={handleRatingChange}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value for Money
                    </label>
                    <StarRating
                      name="valueForMoneyRating"
                      value={formData.valueForMoneyRating}
                      onChange={handleRatingChange}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Punctuality
                    </label>
                    <StarRating
                      name="punctualityRating"
                      value={formData.punctualityRating}
                      onChange={handleRatingChange}
                    />
                  </div>
                  
                  {/* Comments */}
                  <div className="col-span-6 border-t border-gray-200 pt-4">
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                      Comments
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="comments"
                        name="comments"
                        rows={4}
                        value={formData.comments}
                        onChange={handleChange}
                        placeholder="Please share your experience, what you liked, and any suggestions for improvement..."
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  {/* Would Recommend */}
                  <div className="col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="wouldRecommend"
                          name="wouldRecommend"
                          type="checkbox"
                          checked={formData.wouldRecommend}
                          onChange={handleChange}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="wouldRecommend" className="font-medium text-gray-700">
                          I would recommend this caterer to others
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Allow Public Review */}
                  <div className="col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="allowPublicReview"
                          name="allowPublicReview"
                          type="checkbox"
                          checked={formData.allowPublicReview}
                          onChange={handleChange}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="allowPublicReview" className="font-medium text-gray-700">
                          Allow my review to be shared publicly
                        </label>
                        <p className="text-gray-500">
                          Your name and comments may be displayed on the caterer's website or promotional materials.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Photo Upload */}
                  <div className="col-span-6 border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Upload Photos (Optional)
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Share photos from your event. Max 5 photos, 5MB each.
                    </p>
                    <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/jpg"
                              onChange={handleFileUpload}
                              disabled={formData.photos.length >= 5}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                    </div>
                    
                    {/* Preview uploaded photos */}
                    {formData.photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <div className="group aspect-w-1 aspect-h-1 rounded-md bg-gray-100 overflow-hidden">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Uploaded ${index + 1}`}
                                className="object-center object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(index)}
                                  className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                >
                                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 truncate">{photo.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Link
                    to={`/customer/${catererID}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSubmitting || loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                    }`}
                  >
                    {isSubmitting || loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm; 