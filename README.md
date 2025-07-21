# Burç API

Türkçe burc yorumları ve bu burçların 17 farklı etiket ile özellikleri sunan RESTful API servisi. Aşk, kariyer ve daha fazlası...

## Özellikler

- 📅 Günlük, haftalık, aylık ve yıllık burc yorumları
- 🌟 Burçların gezegenleri, mottoları ve elementi bilgileri
- 🏷️ 17 farklı kategori ile detaylı yorumlar
- 🚀 Hızlı ve güvenilir API yanıtları

## Base URL

```
https://burcapi.herokuapp.com
```

## Desteklenen Burçlar

- koç, boğa, ikizler, yengeç, aslan, başak, terazi, akrep, yay, oğlak, kova, balık

## Zaman Bazlı Endpoints

### Günlük Burç Yorumu
```
GET /get/{burc}
```

**Açıklama:** Belirtilen burcun günlük yorumunu getirir.

**Parametre:**
- `burc` (string): Burç adı (örn: aslan, koç, balık)

**Örnek İstek:**
```
GET https://burcapi.herokuapp.com/get/aslan
```

**Örnek Yanıt:**
```json
{
  "Burc": "Aslan",
  "Gunluk": "Bugün enerjiniz yüksek olacak...",
  "Tarih": "2024-01-15"
}
```

### Haftalık Burç Yorumu
```
GET /get/{burc}/haftalik
```

**Açıklama:** Belirtilen burcun haftalık yorumunu getirir.

**Örnek İstek:**
```
GET https://burcapi.herokuapp.com/get/aslan/haftalik
```

### Aylık Burç Yorumu
```
GET /get/{burc}/aylik
```

**Açıklama:** Belirtilen burcun aylık yorumunu getirir.

**Örnek İstek:**
```
GET https://burcapi.herokuapp.com/get/aslan/aylik
```

### Yıllık Burç Yorumu
```
GET /get/{burc}/yillik
```

**Açıklama:** Belirtilen burcun yıllık yorumunu getirir.

**Örnek İstek:**
```
GET https://burcapi.herokuapp.com/get/aslan/yillik
```

## Kategori Bazlı Endpoints

### Kategori Yorumu
```
GET /gets/{burc}/{kategori}
```

**Açıklama:** Belirtilen burcun belirli bir kategorideki yorumunu getirir.

**Parametreler:**
- `burc` (string): Burç adı
- `kategori` (string): Kategori adı (aşağıdaki listeden)

**Örnek İstekler:**
```
GET https://burcapi.herokuapp.com/gets/aslan/ask
GET https://burcapi.herokuapp.com/gets/aslan/kariyer
GET https://burcapi.herokuapp.com/gets/koç/saglik
```

## Desteklenen Kategoriler

| Kategori | Endpoint | Açıklama |
|----------|----------|----------|
| AŞK | `/gets/{burc}/ask` | Aşk ve ilişki yorumları |
| KARİYER | `/gets/{burc}/kariyer` | Kariyer ve iş yaşamı |
| OLUMLU YÖNLER | `/gets/{burc}/olumlu-yonler` | Pozitif özellikler |
| SAĞLIK | `/gets/{burc}/saglik` | Sağlık ve wellness |
| STİL | `/gets/{burc}/stil` | Moda ve stil önerileri |
| ÜNLÜLER | `/gets/{burc}/unluler` | Ünlü kişiler |
| DİYET | `/gets/{burc}/diyet` | Beslenme önerileri |
| ZIT BURÇLARI | `/gets/{burc}/zit-burclari` | Uyumsuz burçlar |
| EĞLENCE HAYATI | `/gets/{burc}/eglence-hayati` | Sosyal yaşam |
| MAKYAJ | `/gets/{burc}/makyaj` | Makyaj önerileri |
| SAÇ STİLİ | `/gets/{burc}/sac-stili` | Saç bakımı ve stil |
| ŞİFALI BİTKİLER | `/gets/{burc}/sifali-bitkiler` | Doğal çözümler |
| FİLM ÖNERİLERİ | `/gets/{burc}/film-onerileri` | Film ve dizi tavsiyeleri |
| ÇOCUKLUĞU | `/gets/{burc}/cocuklugu` | Çocukluk özellikleri |
| KADINI | `/gets/{burc}/kadini` | Kadın özellikleri |
| ERKEĞİ | `/gets/{burc}/erkegi` | Erkek özellikleri |

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı istek |
| 404 | Burc veya kategori bulunamadı |
| 500 | Sunucu hatası |

## Kullanım Örnekleri

### JavaScript (Fetch)
```javascript
// Günlük aslan burcu
fetch('https://burcapi.herokuapp.com/get/aslan')
  .then(response => response.json())
  .then(data => console.log(data));

// Aşk kategorisi
fetch('https://burcapi.herokuapp.com/gets/aslan/ask')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Python (Requests)
```python
import requests

# Günlük yorum
response = requests.get('https://burcapi.herokuapp.com/get/aslan')
data = response.json()
print(data)

# Kariyer yorumu
response = requests.get('https://burcapi.herokuapp.com/gets/aslan/kariyer')
data = response.json()
print(data)
```

## Notlar

- Tüm yanıtlar JSON formatındadır
- API ücretsizdir ancak fair use politikası geçerlidir
- Günlük yorumlar her gün güncellenir
- Örneklerde aslan burcu kullanılmıştır

## Katkıda Bulunma

Bu projeye katkıda bulunmak için pull request gönderebilirsiniz.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
