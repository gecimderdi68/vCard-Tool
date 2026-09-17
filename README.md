# vCard Tool (ai code)

Telefonundan yedek aldığın **.vcf** kişi dosyalarını açan, isim + numaraları gösteren, **iki dosyayı karşılaştıran**, kopyaları **otomatik birleştiren** ve kişileri **düzenlemeye** izin veren modern & minimal uygulama.

> 🛡 **Gizlilik odaklı:** sunucu yok, veritabanı yok, çerez yok, analitik yok, günlük yok. Kişileriniz yalnızca tarayıcı sekmenizde işlenir, sekme kapanınca tamamen silinir. Emoji/bayrak görselleri tek istisna: CDN'den yalnızca **resim** olarak indirilir, kişi verisi hiçbir istekte yer almaz. Ayrıntılar: [PRIVACY.md](PRIVACY.md)

> Not: Kişi verilerin hiçbir sunucuya gönderilmez. Emoji/bayrak görselleri internetten yüklendiği için ilk açılışta bağlantı gerekir; sonrasında tarayıcı önbelleğe alır.

## Özellikler

- **Dosya yükleme:** Tek `📥 İçe Aktar` çipi vardır; her tıklama yeni bir dosya ekler (çoklu seçim destekli). Yüklenen her dosya **Tam Liste** yanında **kendi adıyla bir sekme** alır. Ayrıca **`.vcf` dosyalarını doğrudan sayfaya sürükleyip bırakabilirsin** — geçersiz dosya uyarısı alırsın.
- **Karşılaştır:** En az iki dosya yüklüyken `⚖️ Karşılaştır` → aynı kişiler `AYNI · A+B`, sadece bir dosyada olanlar `SADECE A` / `SADECE B` etiketiyle listelenir. Filtreler: *Tümü / Aynı numara + isim / Sadece A / Sadece B*.
- **Otomatik Birleştir:** En az iki dosya yüklüyken çalışır. Aynı numaralı (Türk numara biçimleri normalize edilerek: `0…` ↔ `+90…`) kişiler eşleştirilir; isim farklarını tek tek `◀ A` / `▶ B` ya da topluca karar verirsin. Numaralar + e-postalar birleşir, kopyalar silinir.
- **Düzenleme:** Her satırda `✏️` isim/numara/e-posta düzenleyici ve `🗑️` silme bulunur; değişiklikler anında listeye işlenir.
- **Dışa aktarma:** `📤 Dışa Aktar` o an **ekranda görünen listeyi** (aktif sekme + arama/filtre uygulanmış) vCard 3.0 olarak indirir; `📤 Seçiliyi Dışa Aktar` birleşik görünümdeki seçili kişileri indirir. Oluşturulan dosyanın kendi sekmesindeyken dışa aktarırsan indirilen dosya, oluştururken verdiğin adı taşır. Telefona geri aktarabilirsin.
- **vCard Oluştur:** `🗂️ vCard Oluştur` düğmesine bas, dosyaya bir isim ver ve **Oluştur** de: dosya yalnızca **site içinde (bellekte)** açılır, diske hiçbir şey yazılmaz. `👤 Yeni Kişi` ile kişileri ekle; işin bitince `📤 Dışa Aktar` dediğinde dosya, oluştururken verdiğin adla bilgisayarına iner.
- **Tema & dil:** Site **tarayıcının tema tercihine** göre (koyu/açık) ve **tarayıcı diline** göre (TR/EN) açılır. Üst çubuktan geçiş yapılabilir: tema butonu 🌙/🌞, dil butonu aktif dilin bayrağını gösterir (🇹🇷/🇬🇧). Yardım içeriği daima aktif dilde açılır.
- Numaraya tıkla-kopyala (numaranın yanında ülke bayrağı), akıllı arama (isim + numara + e-posta), arayüz ikonlarında Twemoji emojileri.
- **Dosya sekmeleri:** Her dosyanın sekmesinde sağda bir `✕` düğmesi vardır; tıklayınca onay sorulur ve dosya listeden kaldırılır. Dosya dışa aktarılmamışsa onay metni bunu özellikle belirtir.
- **Kapanış koruması:** Kaydedilmemiş değişiklik varken sekmeyi kapatırsan tarayıcı seni uyarır.
- **Bayrak & emoji görselleri (Twemoji):** Ülke bayrağı artık **telefon numarasının yanında** gösterilir. İsimlerdeki **tüm emojiler** (🇹🇷 ❤️ 👍🏽 👨‍👩‍👧 …) Twemoji SVG ile çizilir (Windows/ChromeOS bayrakları ve bazı emojileri çizemediği için). Görseller çalışma zamanında [jdecked/twemoji v15.1.0](https://github.com/jdecked/twemoji) depotundan **jsDelivr CDN** üzerinden otomatik çekilir — repoya gömülü dosya kullanılmaz. Kişi verisi hiçbir istekte yer almaz; CDN'e yalnızca görsel dosyası adı gider.

## Varlık güncelleme (geliştirici)

```bash
node tools/gen-icons.mjs       # PNG ikonları yenile (manifest + apple-touch + favicon)
```

**Bayraklar/emojiler:** Artık indirilmez; tarayıcı doğrudan Twemoji CDN'ini kullanır:
`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/<dosya>.svg` — kaynak: [jdecked/twemoji](https://github.com/jdecked/twemoji) — **© Twitter, Inc and other contributors**, lisans: **CC-BY 4.0**. (Repodaki eski `assets/twemoji/` klasörü kullanılmıyor; silinebilir.)

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
