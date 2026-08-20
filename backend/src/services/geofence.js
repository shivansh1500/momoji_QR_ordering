export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isWithinGeofence(restLat, restLng, custLat, custLng, radiusMeters) {
  const dist = getDistanceMeters(restLat, restLng, custLat, custLng);
  return dist <= radiusMeters;
}

export function isWithinOperatingHours(opening, closing) {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const [opH, opM] = opening.split(':').map(Number);
  const [clH, clM] = closing.split(':').map(Number);

  const opMins = opH * 60 + opM;
  const clMins = clH * 60 + clM;

  if (clMins > opMins) {
    return currentMins >= opMins && currentMins <= clMins;
  } else {
    return currentMins >= opMins || currentMins <= clMins;
  }
}
