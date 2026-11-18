// Download a compact, fresh public directory during the 18 Nov Buildathon.
// Uses OSM Overpass rather than importing datasets from any earlier Naari app.
import { writeFileSync } from 'node:fs';
import { makeOverpassQuery, normalizeOverpass, OVERPASS_ENDPOINTS } from '../src/places-provider.mjs';

const now=new Date();
const localTime=new Intl.DateTimeFormat('en-CA',{
  timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',hourCycle:'h23',minute:'2-digit'
}).format(now);
console.log('Data capture at IST:',localTime);
const allowed=now>=new Date('2026-11-18T15:00:00+05:30')&&now<new Date('2026-11-18T19:00:00+05:30');
if(!allowed){console.log('Outside hacking window: not creating dataset.');process.exit(0);}

const centers=[
  {name:'Delhi',lat:28.6139,lng:77.2090},
  {name:'Gurugram',lat:28.4595,lng:77.0266},
  {name:'Noida',lat:28.5355,lng:77.3910}
];
const all=new Map();

for(const center of centers){
  let collected=false;
  const query=makeOverpassQuery(center.lat,center.lng);
  for(const endpoint of OVERPASS_ENDPOINTS){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),13000);
    try {
      const url=endpoint+'?data='+encodeURIComponent(query);
      const response=await fetch(url,{
        signal:controller.signal,
        headers:{Accept:'application/json','User-Agent':'NaariBuildathon/1.0 (educational map demo)'}
      });
      console.log(center.name,endpoint,'HTTP',response.status);
      if(!response.ok)throw new Error('HTTP '+response.status);
      const json=await response.json();
      const rows=normalizeOverpass(json).slice(0,130);
      if(!rows.length)throw new Error('No named places returned');
      rows.forEach(p=>all.set(p.id,p));
      collected=true;
      console.log('Collected',rows.length,'for',center.name);
      break;
    }catch(error){
      console.log('Provider failed:',center.name,endpoint,String(error).slice(0,190));
    }finally{clearTimeout(timer);}
  }
  if(!collected)console.log('No public listing data for',center.name);
}
if(!all.size){console.log('No data available: keep current app fallback.');process.exit(0);}
const output={
  source:'OpenStreetMap / Overpass API',
  licence:'Open Database Licence (ODbL) – © OpenStreetMap contributors',
  collectedAt:new Date().toISOString(),
  notice:'Public directory listings; no verified safety ratings.',
  places:[...all.values()].slice(0,300)
};
writeFileSync('src/public-places.json',JSON.stringify(output,null,2)+'\n','utf8');
console.log('Saved',output.places.length,'public place records to src/public-places.json');
