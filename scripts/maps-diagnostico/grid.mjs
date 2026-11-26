// Pure: centre + spacing -> 5x5 grid of search points. Row 0 is the north edge, col 0 the west edge.
const M_PER_DEG_LAT = 111_320;
const SIZE = 5;

export function buildGrid(lat, lng, spacingMeters = 700) {
  const dLat = spacingMeters / M_PER_DEG_LAT;
  const dLng = spacingMeters / (M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  const mid = (SIZE - 1) / 2;
  const points = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      points.push({
        row,
        col,
        lat: row === mid && col === mid ? lat : round6(lat + (mid - row) * dLat),
        lng: row === mid && col === mid ? lng : round6(lng + (col - mid) * dLng),
      });
    }
  }
  return points;
}

const round6 = (n) => Math.round(n * 1e6) / 1e6;

export function haversineMeters(a, b) {
  const R = 6_371_000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
