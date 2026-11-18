import { DEMO_PLACES } from './places.mjs';
import { distanceKm } from './safety.mjs';

// Rebuilt during the Buildathon as a standalone map-first prototype.
// The earlier Naari repository is a design and workflow reference only.
// All ratings from the preset demo entries are fictional and labelled.
const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

const CITIES = [
  { id:'delhi', name:'Delhi', lat:28.6139, lng:77.2090, zoom:12 },
  { id:'gurugram', name:'Gurugram', lat:28.4595, lng:77.0266, zoom:12 },
  { id:'noida', name:'Noida', lat:28.5355, lng:77.3910, zoom:12 },
  { id:'ghaziabad', name:'Ghaziabad', lat:28.6692, lng:77.4538, zoom:12 }
];
const VIBES = ['Welcoming','Intrusive','Indifferent','Male-Dominated'];
const TAGS = ['Main character energy','peaceful','soft-girl approved',"girls' night coded",'overhyped','weird vibes','red flag'];
const INFRA = ['Secure locks','Well-lit at night','CCTV coverage','Deadbolt / chain','Ground-floor entry','Multiple exits','Female staff','Security on site'];
const FILTERS = [
  {id:'all',label:'All'},
  {id:'restaurant',label:'Restaurants'},
  {id:'cafe',label:'Cafés'},
  {id:'landmark',label:'Things to do'},
  {id:'help',label:'Nearby help'}
];
const REVIEWS_KEY='naari-map-reviews-2026-11-18';
const PLACES_KEY='naari-map-saved-public-places-2026-11-18';
const state = {
  city:CITIES[0], period:'day', filter:'all', query:'', selected:null,
  map:null, pins:new Map(), location:null, locationMarker:null, expanded:false,
  routeMode:false, safetyMode:false, external:loadKnownPlaces(), loading:false,
  reviews:loadSaved(), draft:null, searchTimer:null
};

function loadSaved() {
  try {
    const candidate=JSON.parse(localStorage.getItem(REVIEWS_KEY)||'{}');
    return candidate && typeof candidate==='object' && !Array.isArray(candidate)?candidate:{};
  } catch {return {};}
}
function loadKnownPlaces() {
  try {
    const stored=JSON.parse(localStorage.getItem(PLACES_KEY)||'[]');
    return Array.isArray(stored)?stored.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&typeof p.name==='string').slice(0,40):[];
  } catch {return [];}
}
function persistKnownPlace(p) {
  if(p.isDemo)return;
  try {
    const stored=loadKnownPlaces();
    const unique=[p,...stored.filter(x=>x.id!==p.id)].slice(0,40);
    localStorage.setItem(PLACES_KEY,JSON.stringify(unique));
  } catch {}
}
function persist() {
  try{localStorage.setItem(REVIEWS_KEY,JSON.stringify(state.reviews)); return true;}catch{return false;}
}
function icon(category) {
  return {cafe:'coffee',restaurant:'utensils',landmark:'map-pin',help:'shield-plus'}[category]||'map-pin';
}
function categoryFor(value='') {
  const s=String(value).toLowerCase();
  if(/pharmacy|hospital|police|clinic|doctor|health|fire_station/.test(s))return 'help';
  if(/restaurant|food_court|fast_food/.test(s))return 'restaurant';
  if(/cafe|coffee|bakery/.test(s))return 'cafe';
  return 'landmark';
}
const samples=DEMO_PLACES.map((p)=>{
  let category=categoryFor(p.category);
  if(p.category==='Café')category='cafe';
  if(p.category==='Pharmacy')category='help';
  if(p.category==='Community'||p.category==='Transit')category='landmark';
  return {...p,category, isDemo:true, address:p.area};
});
function allPlaces(){return [...samples,...state.external];}
function reviewsFor(place) {
  const demo=place.isDemo ? place.reviews.map((r)=>({
    safety:(r.lighting+r.staff+r.comfort)/3, hygiene:r.washroom, washroom:r.washroom,
    creep:Math.max(1,Math.min(10,11-(r.lighting*2)))
  })) : [];
  const mine=state.reviews[place.id];
  return mine?[...demo,mine]:demo;
}
function round1(n){return Math.round(n*10)/10;}
function rating(place){
  const reviews=reviewsFor(place);
  if(!reviews.length) return {count:0,score:null,color:'unknown',label:'Not yet rated',creep:null,safety:null,hygiene:null,washroom:null};
  const avg=(key)=>round1(reviews.reduce((sum,r)=>sum+Number(r[key]),0)/reviews.length);
  const [creep,safety,hygiene,washroom]=['creep','safety','hygiene','washroom'].map(avg);
  const score=Math.round(((safety+hygiene+washroom)/15*.8 + (11-creep)/10*.2)*100);
  // A day/night toggle cannot justify adjusting safety scores without time-specific evidence.
  const adjusted=score;
  const color=adjusted>=70?'green':adjusted>=45?'amber':'red';
  return {count:reviews.length,score:adjusted,color,label:color==='green'?'Feels safe':color==='amber'?'Stay aware':'Avoid',creep,safety,hygiene,washroom};
}
function filtered(){
  const query=state.query.trim().toLowerCase();
  return allPlaces().filter(p=>{
    if(state.filter!=='all' && p.category!==state.filter)return false;
    if(query&&!((p.name+' '+p.address+' '+p.category).toLowerCase().includes(query)))return false;
    if(!query&&!state.location){
      if(distanceKm(state.city.lat,state.city.lng,p.lat,p.lng)>32) return false;
    }
    if(!query&&state.location){
      if(distanceKm(state.location.lat,state.location.lng,p.lat,p.lng)>35)return false;
    }
    return true;
  }).sort((a,b)=>{
    if(state.location)return distanceKm(state.location.lat,state.location.lng,a.lat,a.lng)-distanceKm(state.location.lat,state.location.lng,b.lat,b.lng);
    const score=(p)=>rating(p).score??-1;
    return score(b)-score(a);
  });
}
function refreshIcons(){try{window.lucide?.createIcons();}catch{}}
function notify(message){
  const toast=$('#toast');toast.textContent=message;toast.classList.add('show');
  clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),3200);
}
function setMessage(message){
  const node=$('#location-message');
  node.textContent=message;
  node.hidden=!message;
  clearTimeout(setMessage.timer);
  if(message)setMessage.timer=setTimeout(()=>{node.hidden=true;},6500);
}
function renderCityChips(){
  $('#city-strip').innerHTML=`<button class="city-chip" data-open-cities>Country / Cities</button>`+
    CITIES.map(c=>`<button class="city-chip ${c.id===state.city.id?'active':''}" data-city="${c.id}">${esc(c.name)}</button>`).join('');
  $$('[data-open-cities]').forEach(b=>b.onclick=()=>switchTab('cities'));
  $$('#city-strip [data-city]').forEach(b=>b.onclick=()=>selectCity(b.dataset.city));
}
function selectCity(id){
  const city=CITIES.find(c=>c.id===id);if(!city)return;
  state.city=city;state.location=null;state.query='';$('#map-search').value='';
  state.external=[];state.filter='all';state.selected=null;state.routeMode=false;state.safetyMode=false;
  state.expanded=false;$('#places-sheet').classList.remove('expanded');
  renderCityChips();switchTab('map');renderSheet();renderPins();
  if(state.map)state.map.setView([city.lat,city.lng],city.zoom);
  fetchNearby(city.lat,city.lng);
  notify('Showing '+city.name+' · Live directory listings may take a moment');
}
function markerFor(place, selected){
  if(!window.L)return null;
  const r=rating(place);
  const style=r.color==='green'?'':r.color;
  const markup=`<div class="naari-pin ${style} category-${place.category} ${place.category==='help'?'help':''} ${selected?'active':''}">${r.score??'⌖'}</div>`;
  return window.L.divIcon({className:'',html:markup,iconSize:[38,40],iconAnchor:[19,19]});
}
function renderPins(){
  if(!state.map||!window.L)return;
  for(const marker of state.pins.values())state.map.removeLayer(marker);
  state.pins.clear();
  const all=filtered();
  // Do not saturate the map with unreliable user-generated pins.
  all.slice(0,85).forEach(p=>{
    const marker=window.L.marker([p.lat,p.lng],{icon:markerFor(p,state.selected?.id===p.id)});
    marker.bindTooltip(esc(p.name),{direction:'top'});
    marker.on('click',()=>openPlace(p.id));
    marker.addTo(state.map);state.pins.set(p.id,marker);
  });
}
function initMap(){
  if(!window.L){setMessage('Map tiles are unavailable; the places list still works.');return;}
  try{
    $('#safety-map').innerHTML='';
    state.map=window.L.map('safety-map',{zoomControl:false,scrollWheelZoom:true}).setView([state.city.lat,state.city.lng],state.city.zoom);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap contributors',maxZoom:19
    }).addTo(state.map);
    window.L.control.zoom({position:'bottomleft'}).addTo(state.map);
    renderPins();
  }catch(error){console.warn('Map failed:',error);setMessage('Map tiles failed. Browse locations from the places panel.');}
}
function renderSheet(){
  const sheet=$('#sheet-content');
  if(state.selected){renderDetails(sheet,state.selected);return;}
  if(state.safetyMode){renderSafety(sheet);return;}
  if(state.routeMode){renderRoutes(sheet);return;}
  const list=filtered();
  sheet.innerHTML=`
    <div class="sheet-heading">
      <div><h2>${state.location?'Near you':esc(state.city.name)}</h2><p>${list.length} places · ${state.external.length} public-directory listings</p></div>
      <span>${state.period==='day'?'☀':'☾'}</span>
    </div>
    <div class="place-loc">⌖ ${state.location?'Your approximate location':esc(state.city.name)} · ${state.location?'Nearby results':'Allow location to see places near you'}</div>
    <p class="sheet-explain">Explore restaurants, cafés, attractions and nearby help · Directory listings are not safety endorsements.</p>
    <div class="filter-row">${FILTERS.map(f=>`<button class="filter-pill ${state.filter===f.id?'selected':''}" data-filter="${f.id}">${f.label}</button>`).join('')}</div>
    ${state.loading?'<p class="data-notice">Finding nearby public places from OpenStreetMap…</p>':''}
    <p class="data-notice">Sample ratings are for illustration only. Public listings with grey pins have no community safety assessment.</p>
    <div id="list-places">
    ${list.length?list.slice(0,70).map(p=>{
      const r=rating(p);
      return `<button class="place-row" data-place="${esc(p.id)}">
        <span class="place-icon ${p.category}"><i data-lucide="${icon(p.category)}"></i></span>
        <span class="place-description"><strong>${esc(p.name)}</strong><small>${p.isDemo?'Sample community ratings · ':'Public listing · '}${esc(p.address||p.category)}${r.count?' · Creep '+r.creep+'/10':''}</small></span>
        <span class="score-disc ${r.color}">${r.score??'–'}</span>
      </button>`;
    }).join(''):'<div class="empty-list">No nearby places found. Try another category or city, or search for a specific place.</div>'}
    </div>`;
  sheet.querySelectorAll('[data-filter]').forEach(btn=>btn.onclick=()=>{state.filter=btn.dataset.filter;renderSheet();renderPins();});
  sheet.querySelectorAll('[data-place]').forEach(btn=>btn.onclick=()=>openPlace(btn.dataset.place));
  refreshIcons();
}
function openPlace(id){
  const p=allPlaces().find(x=>x.id===id);if(!p)return;
  state.selected=p;state.safetyMode=false;state.routeMode=false;
  $('#places-sheet').classList.add('expanded');state.expanded=true;
  renderSheet();renderPins();
  if(state.map)state.map.flyTo([p.lat,p.lng],Math.max(13,state.map.getZoom()),{duration:.5});
}
function backToPlaces(){
  state.selected=null;state.routeMode=false;state.safetyMode=false;
  state.expanded=false;$('#places-sheet').classList.remove('expanded');
  renderSheet();renderPins();
}
function detailMetric(label,value,max=5){
  const pct=value===null?0:value/max*100;
  return `<div class="metric"><span>${label}</span><b>${value===null?'—':value.toFixed(1)} <small>/ ${max}</small></b><div style="height:4px;background:#d7ddd2;margin-top:8px;border-radius:10px"><div style="height:4px;width:${pct}%;background:var(--sage);border-radius:10px"></div></div></div>`;
}
function renderDetails(sheet,p){
  const r=rating(p),owner=state.reviews[p.id];
  sheet.innerHTML=`
    <button class="sheet-back" id="detail-back">‹ All places</button>
    <h2 class="detail-title">${esc(p.name)}</h2><p class="detail-subtitle">⌖ ${esc(p.address||p.area||state.city.name)}</p>
    <div class="detail-score-row"><span class="score-disc ${r.color}" style="width:62px;height:62px;font-size:17px">${r.score??'—'}</span><p><b>${r.label}</b><br><small>${r.count} sample / local rating${r.count===1?'':'s'} · ${state.period==='day'?'Daytime':'After 11PM'} view</small></p></div>
    ${r.count?`<div class="detail-section"><h3>The five metrics</h3><div class="metric-grid">${detailMetric('Creep level',r.creep,10)}${detailMetric('Safety',r.safety)}${detailMetric('Hygiene',r.hygiene)}${detailMetric('Washroom',r.washroom)}</div></div>`:
    '<div class="demo-warning">Community safety has not yet been rated. A grey pin is not a safety endorsement.</div>'}
    ${p.isDemo?'<div class="demo-warning">This venue and its preset feedback are fictional demonstration data. The score is not a real safety assessment.</div>':'<div class="demo-warning">Public directory listing. Naari has not verified hours, service, safety, or staff.</div>'}
    <div class="actions-row"><button class="solid-button" id="rate-current">${owner?'Edit my rating':'Be the first one to rate'}</button><button class="outline-button" id="directions-current">Get directions ↗</button><button class="outline-button" id="route-current">Route</button></div>
    <p class="data-notice">${p.description?esc(p.description)+' · ':''}Your review stays on this device in the hackathon prototype.</p>
  `;
  $('#detail-back').onclick=backToPlaces;
  $('#rate-current').onclick=()=>openRate(p);
  $('#directions-current').onclick=()=>directions(p);
  $('#route-current').onclick=()=>{state.selected=null;state.routeMode=true;renderSheet();};
}
function directions(p){
  const link='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.lat+','+p.lng);
  window.open(link,'_blank','noopener,noreferrer');
}
function renderSafety(sheet){
  sheet.innerHTML=`<button class="sheet-back" id="safety-back">‹ All places</button>
  <h2 class="detail-title">Safety toolkit</h2><p class="sheet-explain">Important emergency resources in India. For immediate danger, contact official emergency services.</p>
  <div class="actions-row"><a class="solid-button" href="tel:112">Call emergency · 112</a><a class="outline-button" href="tel:1091">Women helpline · 1091</a><a class="outline-button" href="tel:108">Ambulance · 108</a></div>
  <div class="route-message"><span>ⓘ</span><span>Naari does not dispatch emergency responders and cannot certify any area as safe. Official help numbers are provided as links to your phone dialer.</span></div>
  <button class="outline-button" id="nearby-help-sheet">Find nearby help locations</button>`;
  $('#safety-back').onclick=backToPlaces;
  $('#nearby-help-sheet').onclick=()=>{state.safetyMode=false;state.filter='help';renderSheet();renderPins();};
}
function renderRoutes(sheet){
  const places=filtered().slice(0,20);
  sheet.innerHTML=`<button class="sheet-back" id="route-back">‹ All places</button><h2 class="detail-title">Plan your journey</h2>
  <div class="route-message"><span>⌖</span><span>Choose a destination below. Directions open in Google Maps. This prototype does not calculate verified safe routes or lighting coverage.</span></div>
  ${places.map(p=>`<button class="place-row" data-route-id="${esc(p.id)}"><span class="place-icon"><i data-lucide="navigation"></i></span><span class="place-description"><strong>${esc(p.name)}</strong><small>${esc(p.address||state.city.name)}</small></span><span>›</span></button>`).join('')}`;
  $('#route-back').onclick=backToPlaces;
  sheet.querySelectorAll('[data-route-id]').forEach(b=>b.onclick=()=>{const p=allPlaces().find(x=>x.id===b.dataset.routeId);if(p)directions(p);});
  refreshIcons();
}
function filterSearch(){
  state.query=$('#map-search').value.trim();
  $('#clear-search').hidden=!state.query;
  if(state.selected){state.selected=null;}
  renderSheet();renderPins();
  const matches=allPlaces().filter(p=>(p.name+' '+p.address).toLowerCase().includes(state.query.toLowerCase())).slice(0,8);
  const suggestion=$('#search-suggestions');
  suggestion.hidden=!state.query;
  suggestion.innerHTML=matches.map(p=>`<button class="suggestion" data-suggest="${esc(p.id)}"><i data-lucide="map-pin"></i><span>${esc(p.name)}</span><small>${esc(p.category)}</small></button>`).join('')+
  (state.query?`<button class="suggestion" data-web-search><i data-lucide="search"></i><span>Search OpenStreetMap for “${esc(state.query)}”</span></button>`:'');
  suggestion.querySelectorAll('[data-suggest]').forEach(b=>b.onclick=()=>{suggestion.hidden=true;openPlace(b.dataset.suggest);});
  const searchButton=suggestion.querySelector('[data-web-search]');
  if(searchButton)searchButton.onclick=()=>searchPublicPlace(state.query);
  refreshIcons();
}
async function searchPublicPlace(q){
  $('#search-suggestions').hidden=true;
  if(!q||q.length<3)return;
  notify('Searching public maps…');
  try {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);
    const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=in&q='+encodeURIComponent(q+' Delhi NCR');
    const res=await fetch(url,{signal:controller.signal,headers:{'Accept':'application/json'}});clearTimeout(timer);
    if(!res.ok)throw Error('search failed');
    const rows=await res.json();if(!rows.length){notify('No matching places. Try searching Google Maps.');return;}
    const found=rows.map(x=>({
      id:'n-'+x.place_id, name:x.name||x.display_name.split(',')[0],
      address:x.display_name.slice(0,180),category:categoryFor(x.type||x.class),
      lat:Number(x.lat),lng:Number(x.lon),isDemo:false,source:'OpenStreetMap'
    }));
    const seen=new Set(state.external.map(x=>x.id));state.external.push(...found.filter(x=>!seen.has(x.id)));
    state.query='';$('#map-search').value='';
    renderSheet();renderPins();openPlace(found[0].id);
  }catch{notify('Online search unavailable. Try another name or use Google Maps.');}
}
async function fetchNearby(lat,lng){
  state.loading=true;renderSheet();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  try {
    const data='[out:json][timeout:8];(node(around:2200,'+lat+','+lng+')[amenity~"cafe|restaurant|pharmacy|hospital|police|clinic"];way(around:2200,'+lat+','+lng+')[amenity~"cafe|restaurant|pharmacy|hospital|police|clinic"];);out center 55;';
    const response=await fetch('https://overpass.kumi.systems/api/interpreter?data='+encodeURIComponent(data),{signal:controller.signal});
    if(!response.ok)throw Error('Place provider unavailable');
    const json=await response.json();
    const places=(json.elements||[]).map(x=>{
      const lat=x.lat??x.center?.lat,lng=x.lon??x.center?.lon,name=x.tags?.name;
      if(!name||!Number.isFinite(lat)||!Number.isFinite(lng))return null;
      return {id:'osm-'+x.type+'-'+x.id,name,address:x.tags?.['addr:street']||x.tags?.['addr:city']||'Public OpenStreetMap listing',category:categoryFor(x.tags?.amenity),lat,lng,isDemo:false,source:'OpenStreetMap'};
    }).filter(Boolean).slice(0,45);
    const seen=new Set([...samples,...state.external].map(p=>p.id));
    state.external=[...state.external,...places.filter(p=>!seen.has(p.id))].slice(-100);
  }catch{setMessage('Public map listings are temporarily unavailable. Showing labelled sample places.');}
  finally{clearTimeout(timer);state.loading=false;renderSheet();renderPins();}
}
function locate(){
  if(!navigator.geolocation){setMessage('Location unavailable in this browser. Choose a city.');return;}
  $('#locate-me').disabled=true;setMessage('Finding your location…');
  navigator.geolocation.getCurrentPosition(({coords})=>{
    state.location={lat:coords.latitude,lng:coords.longitude};
    $('#locate-me').disabled=false;
    if(state.map){
      if(state.locationMarker)state.map.removeLayer(state.locationMarker);
      state.locationMarker=window.L.circleMarker([state.location.lat,state.location.lng],{radius:7,weight:3,color:'#fff',fillColor:'#4288e4',fillOpacity:1}).addTo(state.map);
      state.locationMarker.bindTooltip('Your approximate location');
      state.map.flyTo([state.location.lat,state.location.lng],14);
    }
    setMessage('Showing places near your approximate location');
    fetchNearby(state.location.lat,state.location.lng);
  },(e)=>{
    $('#locate-me').disabled=false;
    setMessage(e.code===1?'Location permission denied. You can still select a city.':'Device could not determine its location. Select a city instead.');
  },{enableHighAccuracy:false,timeout:10000,maximumAge:180000});
}
function switchTab(tab){
  $$('.tab').forEach(b=>{
    const active=b.dataset.tab===tab;
    b.classList.toggle('active',active);
    if(active)b.setAttribute('aria-current','page');
    else b.removeAttribute('aria-current');
  });
  ['map','cities','inbox','profile'].forEach(id=>{
    const node=$('#'+id+'-page');node.hidden=id!==tab;node.classList.toggle('view-active',id===tab);
  });
  if(tab==='map'&&state.map)requestAnimationFrame(()=>state.map.invalidateSize());
  if(tab==='cities')renderCityGrid();
  if(tab==='profile')renderProfile();
  try{history.replaceState(null,'',location.pathname+(tab==='map'?'':'#'+tab));}catch{}
  refreshIcons();
}
function renderCityGrid(){
  $('#cities-list').innerHTML=CITIES.map(c=>`<button class="city-tile ${state.city.id===c.id?'active':''}" data-choose="${c.id}"><b>⌖ ${c.name}</b><small>Explore places and services →</small></button>`).join('');
  $$('#cities-list [data-choose]').forEach(b=>b.onclick=()=>selectCity(b.dataset.choose));
}
function renderProfile(){
  $('#profile-city').textContent=state.city.name;
  const reviews=Object.entries(state.reviews);
  $('#my-ratings').innerHTML=reviews.length?reviews.map(([id,r])=>{
    const p=allPlaces().find(x=>x.id===id);
    return `<div class="rating-summary-row"><div><b>${esc(p?.name||'Previously rated place')}</b><small>Safety ${r.safety}/5 · Hygiene ${r.hygiene}/5 · Washroom ${r.washroom}/5</small></div><button data-edit="${esc(id)}">Edit</button></div>`;
  }).join(''):'<p class="data-notice">You haven’t rated any places on this device yet. Open a place from the Map tab to share your experience.</p>';
  $$('#my-ratings [data-edit]').forEach(b=>b.onclick=()=>{
    const p=allPlaces().find(x=>x.id===b.dataset.edit);
    if(p){switchTab('map');openPlace(p.id);openRate(p);}
    else notify('The original public listing is no longer in this demo session.');
  });
}
function openRate(place){
  state.selected=place;
  const prev=state.reviews[place.id]||{};
  state.draft={
    creep:prev.creep??3,safety:prev.safety??4,hygiene:prev.hygiene??4,washroom:prev.washroom??4,
    vibe:[...(prev.vibe||[])],tags:[...(prev.tags||[])],infra:[...(prev.infra||[])]
  };
  $('#rate-title').textContent=place.name;
  $('#rate-comment').value=prev.comment||'';
  drawRate();
  $('#rate-dialog').showModal();
}
function drawRate(){
  const d=state.draft;
  $('#creep-input').innerHTML=Array.from({length:10},(_,i)=>i+1).map(n=>`<button type="button" class="creep-button ${n<=d.creep?'selected':''}" data-creep="${n}" aria-pressed="${n===d.creep}">${n}</button>`).join('');
  $$('#creep-input [data-creep]').forEach(b=>b.onclick=()=>{d.creep=Number(b.dataset.creep);drawRate();});
  $('#creep-caption').textContent=d.creep<=3?'Secure — felt at ease':d.creep<=6?'Some discomfort':'Avoid — unsafe vibes';
  for(const key of ['safety','hygiene','washroom']){
    const element=$('#'+key+'-stars');
    element.innerHTML=[1,2,3,4,5].map(n=>`<button type="button" class="star-choice ${n<=d[key]?'selected':''}" data-star="${n}" aria-label="${key} ${n} stars" aria-pressed="${d[key]===n}">★</button>`).join('');
    element.querySelectorAll('[data-star]').forEach(b=>b.onclick=()=>{d[key]=Number(b.dataset.star);drawRate();});
  }
  for(const [key,items] of [['vibe',VIBES],['tags',TAGS],['infra',INFRA]]){
    const element=$('#'+key+'-input');
    element.innerHTML=items.map(t=>`<button type="button" class="choice-chip ${d[key].includes(t)?'selected':''}" data-choice="${esc(t)}" aria-pressed="${d[key].includes(t)}">${esc(t)}</button>`).join('');
    element.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
      const term=b.dataset.choice;
      d[key]=d[key].includes(term)?d[key].filter(x=>x!==term):[...d[key],term];
      drawRate();
    });
  }
}
function saveRate(e){
  e.preventDefault();
  if(!state.selected||!state.draft)return;
  const {creep,safety,hygiene,washroom}=state.draft;
  if([creep,safety,hygiene,washroom].some(x=>!Number.isFinite(x))){notify('Please complete every rating');return;}
  state.reviews[state.selected.id]={...state.draft,comment:$('#rate-comment').value.trim().slice(0,300),updatedAt:new Date().toISOString()};
  persistKnownPlace(state.selected);
  const saved=persist();$('#rate-dialog').close();renderSheet();renderPins();
  notify(saved?'Your rating is saved locally.':'Rating updated in this tab; storage was unavailable.');
}
function init(){
  renderCityChips();
  renderCityGrid();
  initMap();
  renderSheet();
  $$('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $('#profile-city-link').onclick=()=>switchTab('cities');
  $('#map-search').addEventListener('input',filterSearch);
  $('#map-search').addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();searchPublicPlace($('#map-search').value.trim());}
  });
  $('#clear-search').onclick=()=>{
    $('#map-search').value='';state.query='';$('#clear-search').hidden=true;
    $('#search-suggestions').hidden=true;renderSheet();renderPins();
  };
  $$('[data-period]').forEach(b=>b.onclick=()=>{
    state.period=b.dataset.period;
    $$('[data-period]').forEach(node=>{
      const active=node.dataset.period===state.period;
      node.classList.toggle('selected',active);node.setAttribute('aria-pressed',String(active));
    });
    renderSheet();renderPins();
  });
  $('#help-nearby').onclick=()=>{
    state.filter='help';state.selected=null;state.safetyMode=false;state.routeMode=false;
    state.expanded=true;$('#places-sheet').classList.add('expanded');
    renderSheet();renderPins();
  };
  $('#locate-me').onclick=locate;
  $('#open-routes').onclick=()=>{
    state.routeMode=true;state.safetyMode=false;state.selected=null;
    state.expanded=true;$('#places-sheet').classList.add('expanded');renderSheet();
  };
  $('#open-safety').onclick=()=>{
    state.safetyMode=true;state.routeMode=false;state.selected=null;
    state.expanded=true;$('#places-sheet').classList.add('expanded');renderSheet();
  };
  const handle=$('#toggle-sheet');
  let pointerStart=null, justDragged=false;
  handle.addEventListener('pointerdown',(event)=>{
    pointerStart=event.clientY;
    try{handle.setPointerCapture(event.pointerId);}catch{}
  });
  handle.addEventListener('pointerup',(event)=>{
    if(pointerStart===null)return;
    const delta=event.clientY-pointerStart;
    pointerStart=null;
    if(Math.abs(delta)>25){
      justDragged=true;
      state.expanded=delta<0;
      $('#places-sheet').classList.toggle('expanded',state.expanded);
    }
  });
  handle.onclick=()=>{
    if(justDragged){justDragged=false;return;}
    state.expanded=!state.expanded;
    $('#places-sheet').classList.toggle('expanded',state.expanded);
  };
  $('#rate-form').addEventListener('submit',saveRate);
  $('#rate-close').onclick=()=>$('#rate-dialog').close();
  $('#rate-dialog').addEventListener('click',e=>{if(e.target===$('#rate-dialog'))$('#rate-dialog').close();});
  const hash=(location.hash||'').replace('#','');
  if(['cities','inbox','profile'].includes(hash))switchTab(hash);
  refreshIcons();
  // Places are fetched independently; slow public providers never hold the map hostage.
  fetchNearby(state.city.lat,state.city.lng);
  // Match the original flow: request location without blocking map use.
  window.setTimeout(()=>{if(!state.location)locate();},1400);
}
init();
