# VCF Kişi Yöneticisi

Telefonundan yedek aldığın **.vcf** kişi dosyalarını açan, isim + numaraları gösteren, **iki dosyayı karşılaştıran**, kopyaları **otomatik birleştiren** ve kişileri **düzenlemeye** izin veren modern & minimal uygulama.

> 🛡 **%100 gizlilik odaklı:** sunucu yok, veritabanı yok, çerez yok, analitik yok, günlük yok. Kişileriniz yalnızca tarayıcı sekmenizde işlenir, sekme kapanınca tamamen silinir. Ayrıntılar: [PRIVACY.md](PRIVACY.md)

## Çalıştırma

Ekstra kurulum yok — `index.html` dosyasını çift tıklayıp tarayıcıda aç. Hepsi bu.

> Not: Uygulama tamamen tarayıcıda çalışır; kişi verilerin hiçbir sunucuya gönderilmez. İnternet bağlantısı gerektirmez — GitHub Pages'ten bir kez yüklendikten sonra çevrimdışı bile çalışır.

## Özellikler

- **Dosya yükleme:** Üstteki `1. Dosya yükle` / `2. Dosya yükle` çiplerine tıkla. Aynı slotu tekrar kullanarak dosya değiştirebilirsin.
- **Karşılaştır:** İki dosya yüklüyken `Karşılaştır` → aynı kişiler `AYNI · A+B`, sadece bir dosyada olanlar `SADECE A` / `SADECE B` etiketiyle listelenir. Filtreler: *Tümü / Aynı numara + isim / Sadece A / Sadece B*.
- **Otomatik Birleştir:** Aynı numaralı (Türk numara biçimleri normalize edilerek: `0…` ↔ `+90…`) kişiler eşleştirilir; isim farklarını tek tek `◀ A` / `▶ B` ya da topluca karar verirsin. Numaralar + e-postalar birleşir, kopyalar silinir.
- **Düzenleme:** `Düzenleme` modunda satır başına `✓ aynı` / `✗ farklı` işareti, `✎` isim/numara/e-posta düzenleyici, `🗑` silme.
- **Dışa aktarma:** `vCard ekle` tüm kişileri, `.vcf indir` görünen listeyi vCard 3.0 olarak indirir; telefona geri aktarabilirsin.
- Karanlık/aydınlık tema, numaraya tıkla-kopyala, akıllı arama (isim + numara + e-posta).
- **Bayrak emojileri (Twemoji):** Numaranın ülke kodundan otomatik bayrak gösterilir; isim içindeki 🇹🇷 gibi bayrak emojileri de Twemoji SVG ile çizilir (Windows/ChromeOS bayrak emojisi çizemediği için). Bayraklar repoya gömülüdür (`assets/twemoji/`) — CDN yok.

## Varlık güncelleme (geliştirici)

```bash
node tools/fetch-twemoji.mjs   # bayrakları yenile (258 SVG + flags.js)
node tools/gen-icons.mjs       # PNG ikonları yenile (manifest + apple-touch + favicon)
```

**Bayraklar:** `assets/twemoji/` altına 258 bayrak SVG'si + `flags.js` listesini indirir. Kaynak: [twemoji](https://github.com/twitter/twemoji) v14.0.2 — **© Twitter, Inc and other contributors**, lisans: **CC-BY 4.0** ([LICENSE-NOTE.txt](assets/twemoji/LICENSE-NOTE.txt)). Uygulama çalışırken bu dosyalara yalnızca kendi sitemizden erişilir; üçüncü taraf sunucuya istek yapılmaz.

**İkonlar:** Bağımlılıksız saf Node PNG kodlayıcı ile üretilir; PWA manifesti + iOS ana ekran ikonu + favicon buradan beslenir.

## Testler

```bash
node test-vcf.mjs
```

VCF ayrıştırıcı (v2.1/v3.0, quoted-printable, satır katlama, `item1.` grupları) ve birleştirme mantığını doğrular.

## Otomatik yayın (GitHub Pages)

`.github/workflows/deploy.yml` sayesinde her `main` push'unda:

1. Testler + gizlilik denetimi çalışır (geçmezse yayın durur)
2. Site otomatik olarak GitHub Pages'e yayınlanır

**Tek seferlik kurulum:** Repo → **Settings → Pages** → Source: **GitHub Actions** seçin (Deploy from a branch *değil*). Bu workflow bu modu gerektirir.
