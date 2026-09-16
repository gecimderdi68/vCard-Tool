// index.html içindeki <script> bloğunu çıkarıp Node'da test eder: node test-vcf.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('script bloğu bulunamadı'); process.exit(1); }
const code = m[1];

// minimal DOM stub'ları (test yalnızca saf fonksiyonları kullanır)
const noop = () => {};
globalThis.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: noop,
  documentElement: { dataset: {} },
  createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop, remove: noop, click: noop }),
  body: { appendChild: noop },
};
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem: noop };
globalThis.Blob = class {};
globalThis.URL = { createObjectURL: () => '', revokeObjectURL: noop };
globalThis.FileReader = class { readAsText() {} };
globalThis.setTimeout = globalThis.setTimeout; // gerçek setTimeout yeterli

// bayrak listesini yükle (URL stub'lendiği için düz yol kullan)
try { new Function(readFileSync('assets/twemoji/flags.js', 'utf8'))(); }
catch (e) { console.error('flags.js yüklenemedi:', e.message); process.exit(1); }

const T = new Function(code + '\n;return __test;')();

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log('  ✓', name); }
  else { fail++; console.error('  ✗', name, '\n     got :', g, '\n     want:', w); }
};

/* ---------- parseVcf ---------- */
console.log('\n[1] parseVcf — temel');
{
  const vcf = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Ahmet Yilmaz',
    'N:Yilmaz;Ahmet;;;',
    'TEL;TYPE=CELL:+90 532 111 22 33',
    'EMAIL;TYPE=INTERNET:ahmet@mail.com',
    'END:VCARD',
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Celik;Ayse;;;',
    'TEL:0532 444 55 66',
    'END:VCARD',
  ].join('\r\n');
  const { people, warnings } = T.parseVcf(vcf);
  eq('2 kişi', people.length, 2);
  eq('FN isim', people[0].name, 'Ahmet Yilmaz');
  eq('telefon', people[0].phones, ['+90 532 111 22 33']);
  eq('e-posta', people[0].emails, ['ahmet@mail.com']);
  eq('N alanından isim (FN yok)', people[1].name, 'Ayse Celik');
  eq('uyarı yok', warnings, []);
}

console.log('\n[2] parseVcf — quoted-printable UTF-8');
{
  const vcf = [
    'BEGIN:VCARD',
    'VERSION:2.1',
    'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=C3=87elik;Ay=C5=9Fe;;;',
    'TEL;CELL:+905321112233',
    'END:VCARD',
  ].join('\r\n');
  const { people } = T.parseVcf(vcf);
  eq('QP isim decode', people[0].name, 'Ayşe Çelik');
}

console.log('\n[3] parseVcf — satır katlama (folding)');
{
  const vcf = [
    'BEGIN:VCARD',
    'FN:_deniz_test',
    'NOTE:Bu cok uzun bir',
    '  not satiridir',
    'END:VCARD',
  ].join('\r\n');
  const { people } = T.parseVcf(vcf);
  eq('folding birleşti', people[0].note, 'Bu cok uzun bir not satiridir');
  eq('FN korundu', people[0].name, '_deniz_test');
}

console.log('\n[4] parseVcf — Windows Live item grupları + PHOTO atlanır');
{
  const vcf = [
    'BEGIN:VCARD',
    'item1.N;ENCODING=QUOTED-PRINTABLE;CHARSET=UTF-8:Kaya;Mehmet;;;',
    'item1.TEL:+905330000000',
    'PHOTO;ENCODING=BASE64;JPEG:/9j/4AAQSkZJRg==',
    'END:VCARD',
  ].join('\r\n');
  const { people } = T.parseVcf(vcf);
  eq('item1.N isim', people[0].name, 'Mehmet Kaya');
  eq('item1.TEL', people[0].phones, ['+905330000000']);
  eq('PHOTO base64 satırı zarar vermedi', people[0].phones.length, 1);
}

/* ---------- normPhone ---------- */
console.log('\n[6] normPhone');
eq('0xx -> 90xx', T.normPhone('0532 111 22 33'), '905321112233');
eq('+90 -> 90', T.normPhone('+90 532 111 22 33'), '905321112233');
eq('905xx aynı kalır', T.normPhone('905321112233'), '905321112233');
eq('kısa numara dokunulmaz', T.normPhone('112'), '112');

/* ---------- autoMerge ---------- */
console.log('\n[7] autoMerge — keep=1 (A kazanır)');
{
  const map = new Map([
    ['a1', { pid:'a1', slot:0, name:'Ahmet Yilmaz', phones:['+905321112233'], emails:['ahmet@mail.com'], note:'', custom:[] }],
    ['b1', { pid:'b1', slot:1, name:'Ahmet Yılmaz',  phones:['05321112233','05559998877'], emails:[], note:'', custom:[] }],
  ]);
  const res = T.autoMerge(map, 1);
  eq('1 kopya silindi', res.removed, ['b1']);
  const a = map.get('a1');
  eq('A ismi korundu', a.name, 'Ahmet Yilmaz');
  eq('numaralar birleşti', a.phones.length, 2);
  eq('e-posta korundu', a.emails, ['ahmet@mail.com']);
  eq('isim değişikliği sayıldı', res.changed, 1);
}

console.log('\n[8] autoMerge — keep=0 (B kazanır) + aynı isimde isim değişmez');
{
  const map = new Map([
    ['a1', { pid:'a1', slot:0, name:'Ayşe Demir', phones:['+905321112233'], emails:[], note:'', custom:[] }],
    ['b1', { pid:'b1', slot:1, name:'Ayşe Demir', phones:['905321112233'], emails:['ayse@mail.com'], note:'', custom:[] }],
  ]);
  const res = T.autoMerge(map, 0);
  eq('A silindi', res.removed, ['a1']);
  eq('B korundu, isim değişmedi', map.get('b1').name, 'Ayşe Demir');
  eq('e-posta B\'de', map.get('b1').emails, ['ayse@mail.com']);
  eq('isim değişikliği yok', res.changed, 0);
}

console.log('\n[9] rebuildCompare — ortak/sadece ayrımı');
{
  const map = new Map([
    ['a1', { pid:'a1', slot:0, name:'Ortak Kişi', phones:['+905321112233'], emails:[], note:'', custom:[] }],
    ['b1', { pid:'b1', slot:1, name:'Ortak Kişi', phones:['05321112233'], emails:[], note:'', custom:[] }],
    ['a2', { pid:'a2', slot:0, name:'Sadece A', phones:['+905331112233'], emails:[], note:'', custom:[] }],
    ['b2', { pid:'b2', slot:1, name:'Sadece B', phones:['+905441112233'], emails:[], note:'', custom:[] }],
  ]);
  const cmp = T.rebuildCompare(map);
  eq('pairs', [...cmp.pairs.entries()], [['a1','b1']]);
  eq('onlyA', cmp.onlyA, ['a2']);
  eq('onlyB', cmp.onlyB, ['b2']);
}

console.log('\n[10] parseVcf — bozuk/hileli girdiler çökmez');
{
  const { people } = T.parseVcf('BEGIN:VCARD\nEND:VCARD\n\n:rastgele\nTEL:satir boslugu\n BEGIN:VCARD');
  eq('boş vcard kişi üretmez', people.length, 0);
  const e = T.parseVcf('');
  eq('boş dosya', e.people, []);
}

console.log('\n[11] parseVcf — X- alanları kişiye karışmaz');
{
  const vcf = ['BEGIN:VCARD','FN:Test X','TEL:+905320000000','X-ANDROID-CUSTOM:vnd.android.cursor.item/nickname;nick','END:VCARD'].join('\r\n');
  const { people } = T.parseVcf(vcf);
  eq('isim', people[0].name, 'Test X');
  eq('tek numara', people[0].phones, ['+905320000000']);
}

/* ---------- bayrak / ülke tespiti ---------- */
console.log('\n[12] countryFromPhone — Türkiye biçimleri');
eq('05xx -> tr', T.countryFromPhone('05321112233'), 'tr');
eq('+90 -> tr', T.countryFromPhone('+90 532 111 22 33'), 'tr');
eq('90… -> tr', T.countryFromPhone('905321112233'), 'tr');
eq('532… (10 hane) -> tr', T.countryFromPhone('5321112233'), 'tr');
eq('0090… -> tr', T.countryFromPhone('00905321112233'), 'tr');

console.log('\n[13] countryFromPhone — diğer ülkeler');
eq('+1 -> us', T.countryFromPhone('+14155551234'), 'us');
eq('+44 -> gb', T.countryFromPhone('+442071234567'), 'gb');
eq('+33 -> fr', T.countryFromPhone('+33612345678'), 'fr');
eq('+49 -> de', T.countryFromPhone('+491711234567'), 'de');
eq('+971 -> ae', T.countryFromPhone('+971501234567'), 'ae');
eq('3 haneli kod +390 -> it', T.countryFromPhone('+390212345678'), 'it');
eq('çok kısa numara -> null', T.countryFromPhone('123'), null);
eq('bilinmeyen önek -> null', T.countryFromPhone('+87012345678'), null);
eq('0lı kısa numara -> null', T.countryFromPhone('0555'), null);

console.log('\n[14] ccToName / nameToCc dönüşümü');
eq('ccToName(tr)', T.ccToName('tr'), '1f1f9-1f1f7');
eq('nameToCc ters', T.nameToCc('1f1f9-1f1f7'), 'tr');
eq('round-trip de', T.nameToCc(T.ccToName('de')), 'de');

console.log('\n[15] flagForPhone — yalnızca indirilmiş bayraklar');
eq('tr bayrağı var', T.flagForPhone('05321112233'), '1f1f9-1f1f7');
eq('us bayrağı var', T.flagForPhone('+14155551234'), '1f1fa-1f1f8');
eq('de bayrağı var', T.flagForPhone('+491711234567'), '1f1e9-1f1ea');
{
  const flags = globalThis.TWEMOJI_FLAGS || [];
  eq('bayrak havuzu 258 dosya', flags.length, 258);
  eq('havuzda tr', flags.includes(T.ccToName('tr')), true);
  eq('havuzda jp', flags.includes(T.ccToName('jp')), true);
  eq('havuzda xx yok', flags.includes(T.ccToName('xx')), false);
}

console.log('\n[16] vcardFor NOTE ülke gömme + geri okuma');
{
  const p = { name: 'Test Kişi', phones: ['05321112233'], emails: [], note: 'yakın arkadaşım', noteCountry: null, custom: [] };
  const out = T.vcardFor(p);
  eq('NOTE parametresinde ülke', /NOTE;X-ABNOTE-COUNTRY=TR:/.test(out), true);
  eq('kullanıcı notu korundu (temiz)', out.includes('NOTE;X-ABNOTE-COUNTRY=TR:yakın arkadaşım'), true);
  const back = T.parseVcf(out);
  eq('geri okumada noteCountry=tr', back.people[0].noteCountry, 'tr');
  eq('geri okumada not temiz', back.people[0].note, 'yakın arkadaşım');
}
{
  const vcf = ['BEGIN:VCARD', 'FN:Alman Arkadas', 'TEL:+491711234567', 'NOTE;X-ABNOTE-COUNTRY=DE:Hallo', 'END:VCARD'].join('\r\n');
  const { people } = T.parseVcf(vcf);
  eq('X-ABNOTE-COUNTRY=DE okundu', people[0].noteCountry, 'de');
}

console.log('\n[17] richText — emoji bayrak render\u0131');
{
  const flagImgRe = /<img class="flag" src="assets\/twemoji\/1f1f9-1f1f7\.svg"/;
  eq('🇹🇷 SVG\u0027ye dönüşer', flagImgRe.test(T.richText('Ahmet \u{1F1F9}\u{1F1F7}')), true);
  eq('bayraksız isim bozulmaz', T.richText('Ayşe <Demir>'), 'Ayşe &lt;Demir&gt;');
  eq('bilinmeyen çift metin kalır', T.richText('\u{1F1FD}\u{1F1FF}'), '\u{1F1FD}\u{1F1FF}');
  eq('XSS denemesi zararsız', T.richText('<img src=x onerror=alert(1)>').includes('<img src=x'), false);
}

console.log(`\n SONUÇ: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
