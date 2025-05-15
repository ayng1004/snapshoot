// services/geo-service/src/utils/geo.utils.js
/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Calculate a bounding box for a given point and radius
 * @param {number} lat - Latitude of center point
 * @param {number} lng - Longitude of center point
 * @param {number} radius - Radius in meters
 * @returns {Object} Bounding box coordinates
 */
const calculateBoundingBox = (lat, lng, radius) => {
  const R = 6371e3; // Earth's radius in meters
  
  // Angular distance in radians
  const radDist = radius / R;
  
  const radLat = (lat * Math.PI) / 180;
  const radLng = (lng * Math.PI) / 180;
  
  const minLat = radLat - radDist;
  const maxLat = radLat + radDist;
  
  // Adjust for longitude (varies with latitude)
  let deltaLng;
  if (minLat > -Math.PI / 2 && maxLat < Math.PI / 2) {
    const deltaLng = Math.asin(Math.sin(radDist) / Math.cos(radLat));
    const minLng = radLng - deltaLng;
    const maxLng = radLng + deltaLng;
    
    return {
      minLat: (minLat * 180) / Math.PI,
      maxLat: (maxLat * 180) / Math.PI,
      minLng: (minLng * 180) / Math.PI,
      maxLng: (maxLng * 180) / Math.PI
    };
  } else {
    // Edge case near poles
    return {
      minLat: Math.max(minLat, -Math.PI / 2) * 180 / Math.PI,
      maxLat: Math.min(maxLat, Math.PI / 2) * 180 / Math.PI,
      minLng: -180,
      maxLng: 180
    };
  }
};

module.exports = {
  calculateDistance,
  calculateBoundingBox
};