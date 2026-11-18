/**
 * Public OSM directory discovery, authored during the Buildathon.
 * Returns place locations and names only. Never returns safety ratings.
 */
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export function normalizeOverpass(json) {
  const items = Array.isArray(json?.elements) ? json.elements : [];
  const seen = new Set();
  const results = [];
  for (const item of items) {
    const name = typeof item?.tags?.name === 'string' ? item.tags.name.trim() : '';
    const lat = Number(item?.lat ?? item?.center?.lat);
    const lng = Number(item?.lon ?? item?.center?.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180) continue;
    const id = 'osm-' + String(item.type) + '-' + String(item.id);
    if (seen.has(id)) continue;
    seen.add(id);
    const tags = item.tags || {};
    const amenity = tags.amenity || tags.shop || tags.tourism || tags.office || 'landmark';
    results.push({
      id, name, lat, lng,
      amenity: String(amenity),
      address: [tags['addr:street'],tags['addr:city']].filter(Boolean).join(', ') || 'OpenStreetMap public directory',
      source: 'OpenStreetMap',
    });
  }
  return results;
}

export function normalizePhoton(json) {
  const features=Array.isArray(json?.features)?json.features:[];
  const seen=new Set(),rows=[];
  for(const feature of features){
    const p=feature?.properties||{};
    const [lng,lat]=feature?.geometry?.coordinates||[];
    const name=typeof p.name==='string'?p.name.trim():'';
    const category=String(p.osm_value||'').toLowerCase();
    if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)continue;
    if(!['cafe','restaurant','fast_food','food_court'].includes(category))continue;
    const id='photon-'+String(p.osm_type||'N')+'-'+String(p.osm_id||name+'-'+lat+'-'+lng);
    if(seen.has(id))continue;
    seen.add(id);
    rows.push({id,name,lat,lng,amenity:category,
      address:[p.street,p.city,p.state].filter(Boolean).join(', ')||'OpenStreetMap public directory',
      source:'OpenStreetMap (Photon)'});
  }
  return rows;
}

async function fetchPhotonNearby({lat,lng,request,timeoutMs=6500}) {
  // The public Photon demo supports reverse lookups restricted by OSM amenity tag.
  // Queries are limited in number to respect its fair-use policy.
  const collected=[],seen=new Set();
  for(const amenity of ['cafe','restaurant']){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const url='https://photon.komoot.io/reverse?lat='+encodeURIComponent(lat)
        +'&lon='+encodeURIComponent(lng)
        +'&radius=3.5&limit=50&osm_tag=amenity:'+amenity;
      const res=await request(url,{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!res.ok)continue;
      const json=await res.json();
      for(const row of normalizePhoton(json)){
        if(seen.has(row.id))continue;
        seen.add(row.id);
        collected.push(row);
      }
    }catch{ /* One provider failure must not block the other. */ }
    finally{clearTimeout(timeout);}
  }
  return collected;
}

export function makeOverpassQuery(lat,lng) {
  const latitude=Number(lat),longitude=Number(lng);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){
    throw new RangeError('Invalid map coordinates');
  }
  const origin=latitude+','+longitude;
  // Public coverage is best-effort: the OSM database may omit some businesses.
  // Scan a walkable neighbourhood and avoid giant citywide queries that time out.
  return '[out:json][timeout:12];('
    +'nwr(around:3500,'+origin+')[amenity~"cafe|restaurant|fast_food|food_court|ice_cream|pharmacy|hospital|clinic|doctors|police"];'
    +'nwr(around:3500,'+origin+')[shop~"coffee|bakery|convenience"];'
    +'nwr(around:3500,'+origin+')[tourism~"attraction|museum|gallery"];'
    +');out center 250;';
}

export async function fetchPublicPlaces({
  lat,lng,request=fetch,endpoints=OVERPASS_ENDPOINTS,timeoutMs=7000
}) {
  const query=makeOverpassQuery(lat,lng);
  let lastError=new Error('Public place directory unavailable');
  for(const endpoint of endpoints) {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),timeoutMs);
    try {
      const url=endpoint+'?data='+encodeURIComponent(query);
      const response=await request(url,{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('Overpass responded '+response.status);
      const json=await response.json();
      const rows=normalizeOverpass(json);
      if(rows.length) return rows;
      throw new Error('Empty OpenStreetMap directory response');
    } catch(error) {
      lastError=error instanceof Error?error:new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
  const photon=await fetchPhotonNearby({lat,lng,request,timeoutMs:Math.min(timeoutMs,6500)});
  if(photon.length)return photon;
  throw lastError;
}
