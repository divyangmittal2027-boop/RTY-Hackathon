import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSafetyScore, summarizeReviews, distanceKm } from '../src/safety.mjs';

test('safety score is missing when a place has no reviews', () => {
  assert.equal(calculateSafetyScore([]), null);
});

test('safety score uses the average of four rated dimensions', () => {
  const reviews = [{ lighting: 5, staff: 4, washroom: 3, comfort: 4 }];
  assert.equal(calculateSafetyScore(reviews), 4);
});

test('summary includes review count and dimension averages', () => {
  const summary = summarizeReviews([
    { lighting: 5, staff: 3, washroom: 4, comfort: 4 },
    { lighting: 3, staff: 5, washroom: 2, comfort: 2 }
  ]);
  assert.equal(summary.count, 2);
  assert.equal(summary.overall, 3.5);
  assert.equal(summary.metrics.lighting, 4);
  assert.equal(summary.metrics.washroom, 3);
});

test('invalid ratings cannot inflate the safety score', () => {
  assert.throws(() => calculateSafetyScore([
    { lighting: 10, staff: 5, washroom: 4, comfort: 4 }
  ]), /between 1 and 5/);
});

test('distance in kilometres is zero for identical coordinates', () => {
  assert.equal(distanceKm(28.6139, 77.2090, 28.6139, 77.2090), 0);
});

test('distance approximates central Delhi to Gurugram', () => {
  const km = distanceKm(28.6139, 77.2090, 28.4595, 77.0266);
  assert.ok(km > 23 && km < 28, 'expected roughly 25 km');
});
