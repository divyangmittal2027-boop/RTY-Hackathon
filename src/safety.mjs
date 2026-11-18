/**
 * Naari's transparent rating model.
 * These are community opinions, not a guarantee of personal safety.
 */
export const RATING_FIELDS = [
  { key: 'lighting', label: 'Lighting' },
  { key: 'staff', label: 'Staff support' },
  { key: 'washroom', label: 'Washroom' },
  { key: 'comfort', label: 'Comfort' }
];

const round1 = (n) => Math.round((n + Number.EPSILON) * 10) / 10;

function validateReview(review) {
  for (const { key } of RATING_FIELDS) {
    const value = Number(review?.[key]);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      throw new RangeError(`Rating for ${key} must be between 1 and 5`);
    }
  }
}

export function summarizeReviews(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) {
    return { count: 0, overall: null, metrics: {} };
  }

  reviews.forEach(validateReview);
  const metrics = Object.fromEntries(
    RATING_FIELDS.map(({ key }) => [
      key,
      round1(reviews.reduce((sum, review) => sum + Number(review[key]), 0) / reviews.length)
    ])
  );
  const overall = round1(
    reviews.reduce(
      (sum, review) => sum + RATING_FIELDS.reduce((score, { key }) => score + Number(review[key]), 0) / RATING_FIELDS.length,
      0
    ) / reviews.length
  );
  return { count: reviews.length, overall, metrics };
}

export function calculateSafetyScore(reviews) {
  return summarizeReviews(reviews).overall;
}

export function distanceKm(latA, lngA, latB, lngB) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(latB - latA);
  const dLng = radians(lngB - lngA);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(dLng / 2) ** 2;
  return Math.round((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 10) / 10;
}
