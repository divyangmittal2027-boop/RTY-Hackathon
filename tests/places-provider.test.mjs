import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOverpass, fetchPublicPlaces, makeOverpassQuery } from '../src/places-provider.mjs';

test('converts an OSM node into a public place without inventing ratings', () => {
  const rows = normalizeOverpass({
    elements: [
      { type:'node', id:123, lat:28.61,lon:77.21,tags:{ name:'Example Café',amenity:'cafe','addr:street':'Demo Street'} }
    ]
  });
  assert.equal(rows.length,1);
  assert.equal(rows[0].name,'Example Café');
  assert.equal(rows[0].lat,28.61);
  assert.equal(rows[0].amenity,'cafe');
  assert.equal(Object.hasOwn(rows[0],'score'),false);
});

test('supports center coordinates for OSM ways', () => {
  const rows=normalizeOverpass({
    elements:[{type:'way',id:55,center:{lat:28.62,lon:77.23},tags:{name:'Clinic Example',amenity:'clinic'}}]
  });
  assert.equal(rows[0].lng,77.23);
});

test('ignores unnamed places and missing coordinates', () => {
  assert.deepEqual(normalizeOverpass({elements:[
    {type:'node',id:1,lat:28.6,lon:77.2,tags:{amenity:'restaurant'}},
    {type:'node',id:2,lat:28.6,tags:{name:'Incomplete'}},
  ]}),[]);
});

test('falls back to another Overpass endpoint after a failed request',async()=>{
  let call=0;
  const request=async()=>{
    call++;
    if(call===1)return {ok:false,status:503};
    return {ok:true,json:async()=>({elements:[
      {type:'node',id:90,lat:28.63,lon:77.2,tags:{name:'Test Place',amenity:'restaurant'}}
    ]})};
  };
  const rows=await fetchPublicPlaces({lat:28.6,lng:77.2,request,endpoints:['https://one.test','https://two.test'],timeoutMs:1000});
  assert.equal(rows.length,1);
  assert.equal(call,2);
});

test('rejects non-finite coordinates to prevent invalid map pins',()=>{
  const rows=normalizeOverpass({elements:[{type:'node',id:2,lat:'no',lon:'longitude',tags:{name:'Bad Place'}}]});
  assert.equal(rows.length,0);
});

test('nearby scan includes cafes restaurants bakeries and food courts',()=>{
  const query=makeOverpassQuery(28.6139,77.209);
  assert.match(query,/cafe/);
  assert.match(query,/restaurant/);
  assert.match(query,/fast_food/);
  assert.match(query,/food_court/);
  assert.match(query,/bakery/);
  assert.match(query,/around:3500/);
});
