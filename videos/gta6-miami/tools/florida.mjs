// Contorno de Florida (us-atlas, Natural Earth 1:10m) proyectado a SVG + posición de Miami.
import fs from 'fs';
import { feature } from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';
const us = JSON.parse(fs.readFileSync('node_modules/us-atlas/states-10m.json', 'utf8'));
const states = feature(us, us.objects.states);
const fl = states.features.find(f => f.properties.name === 'Florida');
const W = 860, H = 980;
const proj = geoMercator().fitExtent([[30, 30], [W - 30, H - 30]], fl);
const path = geoPath(proj);
const d = path(fl);
const miami = proj([-80.1918, 25.7617]);
const out = { W, H, d, miami, keys: proj([-81.78, 24.55]), orlando: proj([-81.379, 28.538]), tampa: proj([-82.457, 27.95]) };
fs.writeFileSync('../public/florida.json', JSON.stringify(out));
console.log('path chars', d.length, 'miami', miami.map(Math.round), 'keys', out.keys.map(Math.round));
