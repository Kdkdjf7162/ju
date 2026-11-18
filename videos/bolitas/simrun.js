const sim = require('./sim.js'); const S = sim.create(7); S.advanceTo(17);
require('fs').writeFileSync(__dirname + '/sound/events.json', JSON.stringify(S.events));
const ev = S.events; console.log('eventos', ev.length, 'bolitas', S.balls.length, 'primeros', ev.slice(0, 6).map(e => e.t + ':' + e.n).join(' '));
const at = k => (ev.find(e => e.n >= k) || {}).t; console.log('t para 8/32/128/256:', at(8), at(32), at(128), at(256));
