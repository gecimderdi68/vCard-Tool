# Gizlilik

**VCF Kişi Yöneticisi** kişisel verilerinizi korumak için tasarlandı. Bu belge, uygulamanın veri davranışını açıkça ortaya koyar.

## Kısa özet

- ❌ Sunucu yok, veritabanı yok
- ❌ Analitik, izleme, günlükleme (logging) yok
- ❌ Çerez yok, localStorage/sessionStorage kullanımı yok
- ❌ Harici CDN, harici script, harici font yok
- ✅ Bayrak görselleri (Twemoji) dahi repoya gömülüdür — görseller kendi sitemizden yüklenir
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
- **Bayrak görselleri:** Numara ülkesinden otomatik gösterilen bayraklar Twemoji projesinden
  (CC-BY 4.0) alınmış ve **repoya gömülüdür** (`assets/twemoji/`). Çalışma zamanında
  `cdn.jsdelivr.net` gibi hiçbir üçüncü taraf sunucuya istek yapılmaz — CSP bunu da engeller
  (`img-src 'self'`).

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
Son güncelleme: 2026-09-16
