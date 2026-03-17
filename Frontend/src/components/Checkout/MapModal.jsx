import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapModal.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapModal({ isOpen, onClose, onSelectLocation, initialPosition }) {
  const defaultPosition = { lat: 26.1542, lng: 85.8918 }; // Default to Darbhanga
  const [position, setPosition] = useState(initialPosition || defaultPosition);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!position) return;
    setLoading(true);

    try {
      // Reverse Geocoding using Nominatim API (OpenStreetMap)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      
      onSelectLocation({
        lat: position.lat,
        lng: position.lng,
        address: data.address
      });
      onClose();
    } catch (err) {
      console.error("Geocoding failed", err);
      // Fallback
      onSelectLocation({ lat: position.lat, lng: position.lng, address: {} });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-content" onClick={e => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>Select Delivery Location</h3>
          <button className="map-modal-close" onClick={onClose}>
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        
        <div className="map-container-wrapper">
          <MapContainer center={position} zoom={13} style={{ height: '300px', width: '100%' }}>
            <ChangeView center={position} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          <div className="map-instructions">
            Click on the map to place the pin at your exact delivery location.
          </div>
        </div>

        <div className="map-modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={loading || !position}
          >
            {loading ? 'Fetching Address...' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
