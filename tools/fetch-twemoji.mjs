// Twemoji bayrak SVG'lerini indirip assets/twemoji/ içine yerleştirir.
// Çalıştırma: node tools/fetch-twemoji.mjs
// Kaynak: twemoji v14.0.2 (Twitter) GitHub deposu — lisans: CC-BY 4.0
// Görseller npm paketinde YOK; GitHub deposundaki assets/svg kullanılır (jsdelivr GH aynası).
// Bu script yalnızca geliştirme içindir; uygulamanın kendisi hiçbir ağ isteği yapmaz.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = 'v14.0.2';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'twemoji');
const LISTING = `https://data.jsdelivr.com/v1/package/gh/twitter/twemoji@${VERSION}/flat`;
const CDN = `https://cdn.jsdelivr.net/gh/twitter/twemoji@${VERSION}/assets/svg/`;

// Bayrak dosyaları: iki bölgesel gösterge (regional indicator) kod noktası
// U+1F1E6..U+1F1FF → hex "1f1e6".."1f1ff", dosya adı "1f1f9-1f1f7.svg" biçiminde.
const FLAG_RE = /^\/assets\/svg\/(1f1[e-f][0-9a-f])-(1f1[e-f][0-9a-f])\.svg$/;

console.log(`Twemoji v${VERSION} dosya listesi alınıyor...`);
const res = await fetch(LISTING);
if (!res.ok) { console.error('Liste alınamadı: HTTP ' + res.status); process.exit(1); }
const data = await res.json();
const flags = data.files
  .map(f => f.name)
  .map(n => n.match(FLAG_RE))
  .filter(Boolean)
  .map(m => `${m[1]}-${m[2]}`)
  .sort();
console.log(`${flags.length} bayrak bulundu.`);

mkdirSync(OUT, { recursive: true });

let done = 0, failed = [];
async function grab(name) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(CDN + name + '.svg');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const body = await r.text();
      if (!body.startsWith('<svg')) throw new Error('geçersiz içerik');
      writeFileSync(join(OUT, name + '.svg'), body);
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${flags.length}...`);
      return;
    } catch (e) {
      if (attempt === 3) failed.push(name + ' (' + e.message + ')');
      else await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
}

const POOL = 12;
let idx = 0;
await Promise.all(Array.from({ length: POOL }, async () => {
  while (idx < flags.length) { const n = flags[idx++]; await grab(n); }
}));

if (failed.length) {
  console.error('BAŞARISIZ (' + failed.length + '):\n' + failed.join('\n'));
  process.exit(1);
}

// Çalışma zamanı listesi: uygulama yalnızca bu dosyalara <img> üretir (404 önlenir)
writeFileSync(
  join(OUT, 'flags.js'),
  `/* ÜRETİLEN DOSYA — tools/fetch-twemoji.mjs ile yeniden üretilebilir. Elle düzenlemeyin. */\nwindow.TWEMOJI_FLAGS = ${JSON.stringify(flags)};\n`
);

writeFileSync(
  join(OUT, 'LICENSE-NOTE.txt'),
  `Twemoji bayrak görselleri\n=========================\nKaynak: https://github.com/twitter/twemoji (v${VERSION}, assets/svg)\nLisans: CC-BY 4.0 — https://creativecommons.org/licenses/by/4.0/\nTelif: Copyright (c) Twitter, Inc and other contributors\nDosya sayısı: ${flags.length}\nÜretim: tools/fetch-twemoji.mjs — ${new Date().toISOString().slice(0, 10)}\n\nNot: Bu görseller projeye GÖMÜLÜDÜR (same-origin statik dosyalar).\nUygulama çalışırken hiçbir üçüncü taraf sunucuya istek yapmaz.\n`
);

console.log(`TAMAM: ${flags.length} bayrak SVG + flags.js + LICENSE-NOTE.txt → assets/twemoji/`);
