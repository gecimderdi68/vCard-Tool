# Gizlilik

**vCard Tool** kişisel verilerinizi korumak için tasarlandı. Bu belge, uygulamanın veri davranışını açıkça ortaya koyar.

## Kısa özet

- ❌ Sunucu yok, veritabanı yok
- ❌ Analitik, izleme, günlükleme (logging) yok
- ❌ Çerez yok, localStorage/sessionStorage kullanımı yok
- ❌ Analitik, izleme, günlükleme (logging) yok
- ❌ Çerez yok, localStorage/sessionStorage kullanımı yok
- ⚠️ Tek dış kaynak: Twemoji SVG görselleri jsDelivr CDN'inden **resim olarak** indirilir (aşağıda ayrıntı)
- ✅ Kişileriniz yalnızca tarayıcı sekmenizde, bellekte işlenir
- ✅ Sekmeyi kapattığınız anda her şey tamamen silinir

## Veri akışı

```text
.vcf dosyanız  →  FileReader (tarayıcı belleği)  →  işleme  →  ekran / .vcf indirme
                        │
                        ✗ hiçbir ağ isteği YOK
```

1. **Yükleme:** `.vcf` dosyanız `FileReader` ile okunur. Dosya yalnızca tarayıcı belleğinde tutulur; hiçbir yere gönderilmez.
2. **İşleme:** Ayrıştırma, karşılaştırma, birleştirme, düzenleme — tümü JavaScript ile tarayıcıda yapılır.
3. **Dışa aktarma:** İndirdiğiniz `.vcf` dosyası tarayıcınızın indirme klasörüne kaydedilir.
4. **Kapatma:** Sekmeyi/kapattığınızda tüm kişiler bellekten silinir. Kalıcı hiçbir şey kalmaz.

## Teknik garantiler

- **Content-Security-Policy:** Sayfa `connect-src 'none'` ile yüklenir — tarayıcı, sayfanın
  fetch/XHR/WebSocket/beacon gibi **herhangi bir ağ isteği yapmasını teknik olarak engeller**.
  Bu bir "söz" değil, tarayıcı tarafından uygulanır.
- **Statik dosya:** Uygulama GitHub Pages'te yalnızca HTML/CSS/JS olarak yayınlanır;
  GitHub'ın statik dosya sunucusu içerik günlüğü (access log) tutmaz.
- **Kod denetlenebilir:** Tüm uygulama tek bir `index.html` dosyasıdır. Kaynağı görüntüleyerek
  ne yaptığını herkes doğrulayabilir.
- **Emoji/bayrak görselleri (dürüst istisna):** Bayraklar numaranın yanında, isimlerdeki tüm
  emojiler ise Twemoji SVG olarak çizilir (Windows/ChromeOS bunları çizemez). Görseller
  çalışma zamanında `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/…`
  adresinden **resim olarak** indirilir (Twemoji, CC-BY 4.0 — © Twitter, Inc and other
  contributors). Bu istekler **yalnızca görsel dosya adı** içerir; isim, numara, e-posta gibi
  hiçbir kişi verisi CDN'e gitmez. CSP bunu tekilleştirir: `img-src 'self' data:
  https://cdn.jsdelivr.net` — başka hiçbir dış kaynaktan içerik yüklenemez.
  `connect-src 'none'` devam eder: sayfa yine hiçbir veri **gönderemez**.

## Bilinen istisnalar (dürüstlük gereği)

- **Sunucu günlükleri:** GitHub Pages'in kendisi altyapısal HTTP istek günlükleri tutabilir
  (IP, tarih, istenen URL). Bunlar uygulamaya ait değildir; GitHub'ın [Gizlilik Sözleşmesi](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)'ne tabidir.
- **Sunucu tarafı hiçbir veri işlemez:** Kişi verileriniz bu günlüklere **girmez** — dosyanız
  hiçbir istekte yer almaz; tarayıcınızda kalır.
- **Kopyalama:** Bir numarayı kopyaladığınızda panonuz (clipboard) tarayıcınızın kontrolündedir;
  uygulama buna ek olarak hiçbir kayıt tutmaz.
- **İndirdiğiniz dosyalar:** `.vcf` indirmeleri tarayıcınızın indirme geçmişine işlenir; bu
  tarayıcınızın kendi davranışıdır.

## Değişiklikler

Bu belge uygulamada gizlilikle ilgili bir değişiklik olduğunda güncellenir.
Son güncelleme: 2026-09-16 (Twemoji CDN'e geçiş)
