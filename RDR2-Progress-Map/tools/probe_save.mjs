// Sonda de investigación: descifra un save PC de RDR2 con la clave pública
// conocida y busca marcas/estructuras legibles. Solo lectura; no escribe nada.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const KEY = Buffer.from('46ED8D3F9435E4EC122CB2E2AF97C57E4C5A8C3092C7844E11C686FF41DF410F', 'hex');
const file = process.argv[2];
if (!file) {
  console.error('uso: node tools/probe_save.mjs <SRDRxxxxx>');
  process.exit(1);
}
const buf = fs.readFileSync(file);
console.log('archivo', path.basename(file), buf.length, 'bytes');

function decrypt(offset) {
  const rest = buf.subarray(offset);
  const len = rest.length - (rest.length % 16);
  const d = crypto.createDecipheriv('aes-256-ecb', KEY, null);
  d.setAutoPadding(false);
  return Buffer.concat([d.update(rest.subarray(0, len)), d.final()]);
}

const marks = ['RSAV', 'CHKS', 'PSIN', 'PMAP', 'PSCH', 'PSIG', 'PSO', 'XML', '{'];
for (const off of [0x100, 0x104, 0x108, 0x10c, 0x110]) {
  const out = decrypt(off);
  const head = out.subarray(0, 48);
  const ascii = head.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
  const found = marks.filter((m) => out.subarray(0, 4096).includes(Buffer.from(m)));
  console.log('offset', '0x' + off.toString(16), 'len', out.length,
    '|', ascii.slice(0, 32), '| marcas:', found.join(',') || '-');
}

// Con el offset que parezca correcto, busca cadenas de interés.
const dec = decrypt(0x110);
const text = dec.toString('latin1');
const words = ['DINO', 'BONE', 'DREAM', 'CARV', 'TREASURE', 'CIGAR', 'ORCHID',
  'COLLECT', 'COMPENDIUM', 'STAT', 'PSO', 'RSAV', 'MARKER', 'HORSE', 'MONEY'];
for (const w of words) {
  const i = text.toUpperCase().indexOf(w);
  console.log(w.padEnd(11), i >= 0 ? 'offset 0x' + i.toString(16) : 'no');
}

// Volcado de las primeras cadenas ASCII largas del contenido descifrado.
let s = '';
const strings = [];
for (let i = 0; i < dec.length; i++) {
  const b = dec[i];
  if (b >= 0x20 && b < 0x7f) { s += String.fromCharCode(b); }
  else {
    if (s.length >= 6) strings.push('0x' + (i - s.length).toString(16) + ' ' + s);
    s = '';
    if (strings.length >= 25) break;
  }
}
console.log('\nprimeras cadenas ASCII:');
for (const x of strings) console.log(' ', x.slice(0, 120));
