/**
 * Illustrative venue names, approximate neighbourhood coordinates and simulated
 * feedback for the hackathon demo. No venue or rating should be interpreted
 * as verified, live, or real-world safety information.
 */
export const DEMO_PLACES = [
  {
    id: 'cp-cafe', name: 'Sample Café', area: 'Connaught Place, New Delhi',
    category: 'Café', emoji: '☕', lat: 28.6315, lng: 77.2167,
    description: 'A sample café listing near the city centre.',
    reviews: [
      { lighting: 5, staff: 4, washroom: 4, comfort: 4 },
      { lighting: 4, staff: 5, washroom: 3, comfort: 4 }
    ]
  },
  {
    id: 'khan-community', name: 'Sample Community Hub', area: 'Khan Market, New Delhi',
    category: 'Community', emoji: '🪴', lat: 28.6008, lng: 77.2271,
    description: 'A sample community gathering and shared activity space.',
    reviews: [
      { lighting: 4, staff: 5, washroom: 4, comfort: 5 },
      { lighting: 4, staff: 4, washroom: 4, comfort: 5 }
    ]
  },
  {
    id: 'hauz-study', name: 'Sample Study Spot', area: 'Hauz Khas, New Delhi',
    category: 'Café', emoji: '📚', lat: 28.5494, lng: 77.2001,
    description: 'A sample late-afternoon work and study location.',
    reviews: [
      { lighting: 3, staff: 4, washroom: 3, comfort: 4 },
      { lighting: 4, staff: 4, washroom: 4, comfort: 4 }
    ]
  },
  {
    id: 'saket-pharmacy', name: 'Sample Pharmacy', area: 'Saket, New Delhi',
    category: 'Pharmacy', emoji: '✚', lat: 28.5245, lng: 77.2066,
    description: 'A sample nearby essentials and pharmacy listing.',
    reviews: [
      { lighting: 4, staff: 4, washroom: 3, comfort: 3 }
    ]
  },
  {
    id: 'gurugram-workspace', name: 'Sample Workspace', area: 'Sector 29, Gurugram',
    category: 'Community', emoji: '💻', lat: 28.4676, lng: 77.0633,
    description: 'A sample shared work and meeting location.',
    reviews: [
      { lighting: 4, staff: 5, washroom: 4, comfort: 4 },
      { lighting: 5, staff: 4, washroom: 4, comfort: 5 }
    ]
  },
  {
    id: 'metro-transit', name: 'Sample Transit Point', area: 'Rajiv Chowk, New Delhi',
    category: 'Transit', emoji: '🚇', lat: 28.6327, lng: 77.2197,
    description: 'A sample transit listing for evaluating station access.',
    reviews: [
      { lighting: 4, staff: 3, washroom: 2, comfort: 3 }
    ]
  }
];

export const PLACE_CATEGORIES = ['All', 'Café', 'Community', 'Pharmacy', 'Transit'];
