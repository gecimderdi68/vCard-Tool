# VCF Kişi Yöneticisi

Telefonundan yedek aldığın **.vcf** kişi dosyalarını açan, isim + numaraları gösteren, **iki dosyayı karşılaştıran**, kopyaları **otomatik birleştiren** ve kişileri **düzenlemeye** izin veren modern & minimal uygulama.

## Çalıştırma

Ekstra kurulum yok — `index.html` dosyasını çift tıklayıp tarayıcıda aç. Hepsi bu.

> Not: Uygulama tamamen tarayıcıda çalışır; kişi verilerin hiçbir sunucuya gönderilmez.

## Özellikler

- **Dosya yükleme:** Üstteki `1. Dosya yükle` / `2. Dosya yükle` çiplerine tıkla. Aynı slotu tekrar kullanarak dosya değiştirebilirsin.
- **Karşılaştır:** İki dosya yüklüyken `Karşılaştır` → aynı kişiler `AYNI · A+B`, sadece bir dosyada olanlar `SADECE A` / `SADECE B` etiketiyle listelenir. Filtreler: *Tümü / Aynı numara + isim / Sadece A / Sadece B*.
- **Otomatik Birleştir:** Aynı numaralı (Türk numara biçimleri normalize edilerek: `0…` ↔ `+90…`) kişiler eşleştirilir; isim farklarını tek tek `◀ A` / `▶ B` ya da topluca karar verirsin. Numaralar + e-postalar birleşir, kopyalar silinir.
- **Düzenleme:** `Düzenleme` modunda satır başına `✓ aynı` / `✗ farklı` işareti, `✎` isim/numara/e-posta düzenleyici, `🗑` silme.
- **Dışa aktarma:** `vCard ekle` tüm kişileri, `.vcf indir` görünen listeyi vCard 3.0 olarak indirir; telefona geri aktarabilirsin.
- Karanlık/aydınlık tema, numaraya tıkla-kopyala, akıllı arama (isim + numara + e-posta).

## Testler

```bash
node test-vcf.mjs
```

VCF ayrıştırıcı (v2.1/v3.0, quoted-printable, satır katlama, `item1.` grupları) ve birleştirme mantığını doğrular.
