// Uygulama ikonlarını (PNG) sıfır bağımlılıkla üretir: node tools/gen-icons.mjs
// Tasarım: mavi→mor degrade zemin, beyaz kişi silueti, sağ altta yeşil artı rozeti.
// PNG kodlayıcı saf Node ile: node:zlib deflate + elle CRC32/IHDR/IDAT/IEND.
import { deflateSync, inflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icons');
mkdirSync(OUT, { recursive: true });

/* ---------- PNG kodlayıcı ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, W, H) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = W * 4;
  const raw = Buffer.alloc((stride + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (stride + 1)] = 0; // filtre: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- çizim yardımcıları (u,v ∈ [0,1] uzayı) ---------- */
const clamp01 = x => Math.max(0, Math.min(1, x));
const cov = sdf => clamp01(0.5 - sdf);            // ~1px kenar yumuşatma
const sdCircle = (px, py, cx, cy, r) => Math.hypot(px - cx, py - cy) - r;
const sdEllipse = (px, py, cx, cy, rx, ry) => Math.hypot((px - cx) / rx, (py - cy) / ry) - 1;
function sdRoundRect(px, py, half, r) {
  const qx = Math.abs(px) - (half - r), qy = Math.abs(py) - (half - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/* degrade + seçimli katmanlarla ikon çiz */
function drawIcon(size, { rounded = true, artScale = 1 } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const half = 0.5, cornerR = 0.22;
  const s = artScale, ox = 0.5 - 0.5 * s, oy = 0.5 - 0.5 * s; // maskable güvenli alan
  const P = (u, v) => [ox + u * s, oy + v * s];               // sanat uzayına ölçekle

  // kişi silueti (sanat uzayı koordinatları)
  const head = [0.44, 0.385, 0.125], body = [0.44, 0.80, 0.26, 0.205];
  // rozet (sanat uzayı)
  const badge = [0.72, 0.72, 0.155], bar = 0.036, arm = 0.105;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size, v = (y + 0.5) / size;
      const [su, sv] = P(u, v);
      const [hu, hv] = P(u, v), [bu, bv] = P(u, v);

      // zemin degrade #4F7CFF → #8B5CF6 (köşegen)
      const t = clamp01((u + v) / 2);
      let R = Math.round(79 + (139 - 79) * t);
      let G = Math.round(124 + (92 - 124) * t);
      let B = Math.round(255 + (246 - 255) * t);
      let A = 255;
      if (rounded) A = Math.round(255 * cov(sdRoundRect(u - half, v - half, half, cornerR)));

      // beyaz kişi silueti
      const dPerson = Math.min(
        sdCircle(su, sv, head[0], head[1], head[2]),
        sdEllipse(su, sv, body[0], body[1], body[2], body[3])
      );
      if (dPerson < 0.5) {
        const c = cov(dPerson);
        R = Math.round(R * (1 - c) + 255 * c);
        G = Math.round(G * (1 - c) + 255 * c);
        B = Math.round(B * (1 - c) + 255 * c);
      }

      // yeşil rozet + beyaz halka + beyaz artı
      const dB = sdCircle(bu, bv, badge[0], badge[1], badge[2]);
      const dRing = Math.abs(dB) - 0.014;             // halka bandı
      const cRing = cov(dRing);
      const cx = badge[0], cy = badge[1];
      const dPlus = Math.min(
        Math.max(Math.abs(bv - cy) - bar, Math.abs(bu - cx) - arm),      // yatay kol
        Math.max(Math.abs(bu - cx) - bar, Math.abs(bv - cy) - arm)       // dikey kol
      );
      const dGreen = Math.min(dB, dPlus);
      if (cov(dGreen) > 0) {
        const c = cov(dGreen);
        R = Math.round(R * (1 - c) + 34 * c);
        G = Math.round(G * (1 - c) + 197 * c);
        B = Math.round(B * (1 - c) + 94 * c);
      }
      if (cRing > 0) {
        R = Math.round(R * (1 - cRing) + 255 * cRing);
        G = Math.round(G * (1 - cRing) + 255 * cRing);
        B = Math.round(B * (1 - cRing) + 255 * cRing);
      }

      const i = (y * size + x) * 4;
      px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = A;
    }
  }
  return encodePNG(px, size, size);
}

/* ---------- üretim + yapı doğrulaması ---------- */
const targets = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['icon-maskable-512.png', 512, { rounded: false, artScale: 0.8 }],
  ['apple-touch-icon.png', 180, { rounded: false }],
  ['favicon-32.png', 32, { rounded: true }],
];

for (const [name, size, opts] of targets) {
  const buf = drawIcon(size, opts);
  writeFileSync(join(OUT, name), buf);
  // PNG yapı denetimi: imza + chunk yürüyüşü + IDAT geri açma
  if (!buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])))
    throw new Error(name + ': imza hatalı');
  let off = 8, w = 0, h = 0;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
    if (type === 'IDAT') {
      const raw = inflateSync(data);
      if (raw.length !== (w * 4 + 1) * h) throw new Error(name + ': IDAT boyutu uyuşmuyor');
    }
    off += 12 + len;
    if (type === 'IEND') break;
  }
  if (w !== size || h !== size) throw new Error(name + ': boyut uyuşmuyor');
  console.log(`  ✓ ${name} (${size}x${size}, ${buf.length} bayt)`);
}
console.log('TAMAM: ikonlar → assets/icons/');
