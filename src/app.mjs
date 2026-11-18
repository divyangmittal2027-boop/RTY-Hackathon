import { RATING_FIELDS, distanceKm, summarizeReviews } from './safety.mjs';
import { DEMO_PLACES, PLACE_CATEGORIES } from './places.mjs';

const STORAGE_KEY = 'naari-buildathon-reviews-v1';
const $ = (selector) => document.querySelector(selector);

const state = {
  category: 'All',
  query: '',
  selectedId: DEMO_PLACES[0].id,
  coords: null,
  ownReviews: readReviews(),
  ratingsDraft: {},
  map: null,
  markers: new Map(),
  userMarker: null
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function readReviews() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function persistReviews() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ownReviews));
    return true;
  } catch {
    return false;
  }
}

function reviewsFor(place) {
  const personal = state.ownReviews[place.id];
  return [...place.reviews, ...(personal ? [personal] : [])];
}

function summaryFor(place) {
  try {
    return summarizeReviews(reviewsFor(place));
  } catch {
    return summarizeReviews(place.reviews);
  }
}

function visiblePlaces() {
  const query = state.query.trim().toLocaleLowerCase();
  const places = DEMO_PLACES.filter((place) => (
    (state.category === 'All' || place.category === state.category)
    && (!query || `${place.name} ${place.area} ${place.category}`.toLocaleLowerCase().includes(query))
  ));

  if (state.coords) {
    places.sort((a, b) => (
      distanceKm(state.coords.lat, state.coords.lng, a.lat, a.lng)
      - distanceKm(state.coords.lat, state.coords.lng, b.lat, b.lng)
    ));
  }
  return places;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove('visible'), 3500);
}

function renderFilters() {
  $('#filters').innerHTML = PLACE_CATEGORIES.map((category) => (
    `<button type="button" class="filter-chip" data-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">${category}</button>`
  )).join('');

  $('#filters').querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      renderFilters();
      renderPlaces();
    });
  });
}

function renderPlaces() {
  const places = visiblePlaces();
  $('#results-count').textContent = `${places.length} place${places.length === 1 ? '' : 's'} to explore`;
  $('#order-label').textContent = state.coords ? 'Nearest first' : 'Demo listings';

  $('#places-list').innerHTML = places.length ? places.map((place) => {
    const { overall, count } = summaryFor(place);
    const distance = state.coords
      ? `<span class="place-distance">${distanceKm(state.coords.lat, state.coords.lng, place.lat, place.lng)} km</span>`
      : '';
    return `<button type="button" class="place-card" data-place="${place.id}" aria-current="${place.id === state.selectedId}">
        <span class="place-emoji" aria-hidden="true">${place.emoji}</span>
        <span class="place-info">
          <span class="place-name">${escapeHtml(place.name)}</span>
          <span class="place-area">${escapeHtml(place.area)}</span>
          <span class="place-bottom">
            <span class="score-chip ${overall === null ? 'no-score' : ''}">${overall === null ? 'Not rated' : '★ ' + overall.toFixed(1) + ' / 5'}</span>
            <span class="place-category">${count} demo rating${count === 1 ? '' : 's'}</span>
            ${distance}
          </span>
        </span>
      </button>`;
  }).join('') : '<div class="empty-state"><span>⌕</span>No places match that search.<br>Try another category or neighbourhood.</div>';

  $('#places-list').querySelectorAll('[data-place]').forEach((button) => {
    button.addEventListener('click', () => selectPlace(button.dataset.place, true));
  });
  refreshMarkers(places);
}

function selectPlace(id, moveMap = false) {
  const place = DEMO_PLACES.find((item) => item.id === id);
  if (!place) return;
  state.selectedId = id;
  renderPlaces();
  renderDetail();
  if (moveMap && state.map) {
    state.map.flyTo([place.lat, place.lng], Math.max(state.map.getZoom(), 13), { duration: 0.7 });
  }
}

function renderDetail() {
  const place = DEMO_PLACES.find((item) => item.id === state.selectedId);
  if (!place) return;
  const summary = summaryFor(place);
  const myReview = state.ownReviews[place.id];
  const metricsHtml = RATING_FIELDS.map(({ key, label }) => (
    `<div class="metric-cell"><span>${label}</span><strong><b>★</b> ${summary.metrics[key]?.toFixed(1) || '—'}</strong></div>`
  )).join('');

  $('#place-detail').innerHTML = `
    <div class="detail-top">
      <div>
        <span class="detail-kicker">${escapeHtml(place.category)} · Demo listing</span>
        <h3>${escapeHtml(place.name)}</h3>
        <div class="detail-address">⌖ ${escapeHtml(place.area)}</div>
      </div>
      <div class="overall-rating ${summary.overall === null ? 'no-score' : ''}">
        <strong>${summary.overall?.toFixed(1) || '—'}</strong>
        <span>out of 5<br>${summary.count} sample rating${summary.count === 1 ? '' : 's'}</span>
      </div>
    </div>
    <div class="rating-grid">${metricsHtml}</div>
    <div class="detail-actions">
      <button type="button" id="rate-button" class="primary-button">${myReview ? '✎ Edit my rating' : '✦ Share my rating'}</button>
      <button type="button" id="directions-button" class="outline-button">↗ Open map directions</button>
      <span class="detail-note">✧ Your experience can help someone else</span>
    </div>
    ${myReview?.notes ? `<p class="review-note"><strong>Your note:</strong> ${escapeHtml(myReview.notes)}</p>` : ''}
  `;

  $('#rate-button').addEventListener('click', () => openRatingDialog(place));
  $('#directions-button').addEventListener('click', () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.lat + ',' + place.lng)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

function markerIcon(place, selected) {
  return window.L.divIcon({
    className: '',
    html: `<div class="map-marker ${selected ? 'selected' : ''}">${place.emoji}</div>`,
    iconSize: [40, 45], iconAnchor: [20, 40]
  });
}

function refreshMarkers(visible = visiblePlaces()) {
  if (!state.map || !window.L) return;
  const visibleIds = new Set(visible.map((place) => place.id));
  for (const place of DEMO_PLACES) {
    const marker = state.markers.get(place.id);
    if (!marker) continue;
    if (visibleIds.has(place.id)) {
      if (!state.map.hasLayer(marker)) marker.addTo(state.map);
      marker.setIcon(markerIcon(place, place.id === state.selectedId));
    } else if (state.map.hasLayer(marker)) {
      state.map.removeLayer(marker);
    }
  }
}

function initializeMap() {
  if (!window.L) {
    const fallback = $('#map-fallback');
    fallback.querySelector('.fallback-text').innerHTML = 'Map unavailable<small>You can still explore and rate sample places using the list.</small>';
    return;
  }
  try {
    $('#map-fallback').remove();
    state.map = window.L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([28.584, 77.205], 11);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);
    window.L.control.zoom({ position: 'bottomright' }).addTo(state.map);

    for (const place of DEMO_PLACES) {
      const marker = window.L.marker([place.lat, place.lng], {
        icon: markerIcon(place, place.id === state.selectedId)
      }).addTo(state.map);
      marker.on('click', () => selectPlace(place.id));
      marker.bindTooltip(escapeHtml(place.name));
      state.markers.set(place.id, marker);
    }
    refreshMarkers();
  } catch (error) {
    console.warn('Map could not initialize:', error);
  }
}

function renderRatingInputs() {
  $('#rating-inputs').innerHTML = RATING_FIELDS.map(({ key, label }) => (
    `<div class="rating-row">
      <label id="label-${key}">${escapeHtml(label)}<small>${{
        lighting: 'Visibility and lighting',
        staff: 'Helpful, respectful staff',
        washroom: 'Clean, accessible facilities',
        comfort: 'Overall experience'
      }[key]}</small></label>
      <div class="stars-input" role="group" aria-labelledby="label-${key}">
        ${[1,2,3,4,5].map((value) => (
          `<button type="button" class="star-button ${state.ratingsDraft[key] >= value ? 'active' : ''}" data-rating-field="${key}" data-rating-value="${value}" aria-label="${label}: ${value} out of 5" aria-pressed="${state.ratingsDraft[key] === value}">★</button>`
        )).join('')}
      </div>
    </div>`
  )).join('');
  $('#rating-inputs').querySelectorAll('[data-rating-field]').forEach((button) => {
    button.addEventListener('click', () => {
      state.ratingsDraft[button.dataset.ratingField] = Number(button.dataset.ratingValue);
      renderRatingInputs();
    });
  });
}

function openRatingDialog(place) {
  const myReview = state.ownReviews[place.id];
  state.ratingsDraft = Object.fromEntries(
    RATING_FIELDS.map(({ key }) => [key, myReview?.[key] || 0])
  );
  $('#review-title').textContent = myReview ? 'Edit your experience' : 'Share your experience';
  $('#review-subtitle').textContent = `${place.name} · ${place.area}`;
  $('#review-notes').value = myReview?.notes || '';
  renderRatingInputs();
  $('#review-dialog').showModal();
}

function submitReview(event) {
  event.preventDefault();
  const missing = RATING_FIELDS.filter(({ key }) => !state.ratingsDraft[key]);
  if (missing.length) {
    showToast('Please rate all four aspects before saving.');
    return;
  }
  const review = {
    ...state.ratingsDraft,
    notes: $('#review-notes').value.trim().slice(0, 280),
    updatedAt: new Date().toISOString()
  };
  state.ownReviews[state.selectedId] = review;
  const saved = persistReviews();
  $('#review-dialog').close();
  renderPlaces();
  renderDetail();
  showToast(saved ? 'Your rating was saved on this device ✦' : 'Rating updated for this session; local saving is unavailable.');
}

function locate() {
  const status = $('#location-status');
  if (!navigator.geolocation) {
    status.textContent = 'Location is unavailable in this browser.';
    return;
  }
  status.textContent = 'Requesting your location…';
  $('#locate-button').disabled = true;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.coords = { lat: coords.latitude, lng: coords.longitude };
      status.textContent = 'Showing distance from your location';
      $('#locate-button').disabled = false;
      renderPlaces();
      if (state.map && window.L) {
        if (state.userMarker) state.map.removeLayer(state.userMarker);
        state.userMarker = window.L.circleMarker([state.coords.lat, state.coords.lng], {
          radius: 7, weight: 3, color: '#fff', fillColor: '#2b9fff', fillOpacity: 1
        }).addTo(state.map);
        state.userMarker.bindTooltip('Your approximate location');
        if (distanceKm(state.coords.lat, state.coords.lng, 28.6139, 77.2090) < 100) {
          state.map.flyTo([state.coords.lat, state.coords.lng], 12);
        }
      }
      showToast('Places sorted by distance. All listings are demo samples.');
    },
    (error) => {
      status.textContent = error.code === 1
        ? 'Location permission denied. Showing New Delhi samples.'
        : 'Could not determine location. Showing New Delhi samples.';
      $('#locate-button').disabled = false;
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

$('#place-search').addEventListener('input', (event) => {
  state.query = event.target.value;
  renderPlaces();
});
$('#locate-button').addEventListener('click', locate);
$('#review-form').addEventListener('submit', submitReview);
$('#close-review').addEventListener('click', () => $('#review-dialog').close());
$('#review-dialog').addEventListener('click', (event) => {
  if (event.target === $('#review-dialog')) $('#review-dialog').close();
});

renderFilters();
renderPlaces();
renderDetail();
initializeMap();
