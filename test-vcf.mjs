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

console.log(`\n SONUÇ: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
