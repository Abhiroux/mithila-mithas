import { useState, useEffect } from 'react';
import MapModal from './MapModal';
import '../../pages/CheckoutPage.css';

export default function AddressForm({ onAddressSubmit, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    label: 'Home',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    isDefault: false
  });

  // Sync form data when initialData prop changes (e.g. switching address to edit)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const [errors, setErrors] = useState({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);

  const validate = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.street) newErrors.street = 'Street address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Valid 6-digit pincode is required';
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitNew = (e) => {
    e.preventDefault();
    if (validate()) {
      onAddressSubmit(formData);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          const data = await res.json();
          handleLocationSelect({ lat, lng, address: data.address });
        } catch (error) {
          console.error("Failed to detect location address", error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Could not get your location. Please check your permissions.");
        setLocationLoading(false);
      }
    );
  };

  const handleLocationSelect = (locationResult) => {
    if(locationResult.lat) setMapCenter({ lat: locationResult.lat, lng: locationResult.lng });
    if(!locationResult.address) return;
    
    const { address } = locationResult;
    const streetLabel = address.road || address.suburb || address.neighbourhood || address.pedestrian || '';
    const cityLabel = address.city || address.town || address.village || address.county || '';
    const stateLabel = address.state || '';
    const postcode = address.postcode || '';

    setFormData(prev => ({
      ...prev,
      street: streetLabel || prev.street,
      city: cityLabel || prev.city,
      state: stateLabel || prev.state,
      pincode: postcode || prev.pincode
    }));
  };

  return (
    <div className="address-form-container">
          <div className="location-actions" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '10px' }}
              onClick={handleDetectLocation}
              disabled={locationLoading}
            >
              <span className="material-icons-outlined" style={{ fontSize: '18px' }}>my_location</span>
              {locationLoading ? 'Detecting...' : 'Detect Location'}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '10px' }}
              onClick={() => setIsMapOpen(true)}
            >
              <span className="material-icons-outlined" style={{ fontSize: '18px' }}>map</span>
              Select on Map
            </button>
          </div>

          <form onSubmit={handleSubmitNew} className="new-address-form">
            <div className="form-group">
              <label>Label</label>
              <select 
                value={formData.label} 
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                className="form-control"
              >
                 <option value="Home">Home</option>
                 <option value="Work">Work</option>
                 <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className={`form-control ${errors.name ? 'error' : ''}`}
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Receiver's full name"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Street / Flat / Area</label>
              <input 
                type="text" 
                className={`form-control ${errors.street ? 'error' : ''}`}
                value={formData.street} 
                onChange={(e) => setFormData({...formData, street: e.target.value})} 
              />
              {errors.street && <span className="error-text">{errors.street}</span>}
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>City</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.city ? 'error' : ''}`}
                  value={formData.city} 
                  onChange={(e) => setFormData({...formData, city: e.target.value})} 
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>
              <div className="form-group half">
                <label>State</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.state ? 'error' : ''}`}
                  value={formData.state} 
                  onChange={(e) => setFormData({...formData, state: e.target.value})} 
                />
                {errors.state && <span className="error-text">{errors.state}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Pincode</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.pincode ? 'error' : ''}`}
                  value={formData.pincode} 
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})} 
                />
                {errors.pincode && <span className="error-text">{errors.pincode}</span>}
              </div>
              <div className="form-group half">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>Save Address</button>
          </form>

      <MapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        onSelectLocation={handleLocationSelect}
        initialPosition={mapCenter}
      />
    </div>
  );
}
