# Digital Twin Factory Monitoring System

Dijital ikiz fabrika izleme sistemi - Gerçek zamanlı üretim hattı simülasyonu ve izleme.

## 🏗️ Proje Yapısı

```
Dijital_Twin/
├── Layaut/              # Frontend (React + TypeScript + Vite)
│   └── src/
│       ├── app/         # Uygulama ana bileşenleri
│       ├── components/  # UI bileşenleri
│       ├── data/        # Statik veri
│       ├── hooks/       # React hooks
│       ├── services/    # API servisleri
│       └── styles/      # CSS stilleri
├── backend/             # Backend API (Node.js + Express + Prisma)
│   ├── prisma/          # Veritabanı şeması ve migrasyonlar
│   └── src/
│       ├── config/      # Konfigürasyon
│       ├── routes/      # API route'ları
│       ├── services/    # İş mantığı servisleri
│       ├── server.ts    # Ana sunucu
│       └── simulator.ts # Üretim hattı simülatörü
└── README.md            # Bu dosya
```

## ✨ Özellikler

### Frontend
- 🏭 İnteraktif üretim hattı görselleştirmesi
- 📊 Gerçek zamanlı istasyon durumu takibi
- 🎨 Modern ve responsive tasarım
- 📱 Tam sayfa layout desteği
- 🔔 İstasyon bilgileri popover'ı
- 🔄 Canlı veri güncellemesi (5 saniyede bir)

### Backend
- 🗄️ SQLite veritabanı (kolay kurulum)
- 🔌 RESTful API endpoints
- 📈 İstasyon geçmişi takibi
- ✅ Request validation
- 🔒 CORS desteği

### 🏭 Simülatör
- 🔄 Gerçekçi üretim hattı simülasyonu
- 📊 OEE (Overall Equipment Effectiveness) hesaplama
- ⚠️ Rastgele hata ve bakım senaryoları
- 🔗 6 istasyonlu sıralı üretim akışı
- ⏱️ Cycle time ve buffer yönetimi

## 🚀 Hızlı Başlangıç

### 1. Backend Kurulumu

```bash
cd backend
npm install

# Prisma client oluştur
npm run db:generate

# Veritabanı migrasyonu
npm run db:migrate

# Seed data (başlangıç verileri)
npm run db:seed

# Sunucuyu başlat
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacak.

### 2. Simülatörü Başlat (Opsiyonel)

```bash
cd backend
npm run simulate
```

Simülatör üretim hattını gerçekçi bir şekilde çalıştırır:
- 6 istasyon sırayla üretim yapar
- Cycle time'lara göre parça işlenir
- Rastgele hata/bakım olayları oluşur
- OEE değerleri hesaplanır

### 3. Frontend Kurulumu

```bash
cd Layaut
npm install

# .env dosyası oluşturun (opsiyonel)
# VITE_API_URL=http://localhost:3001

npm run dev
```

Frontend `http://localhost:5173` adresinde çalışacak.

## 📚 Dokümantasyon

- **Backend SQLite Kurulum:** `backend/KURULUM_SQLITE.md`
- **Backend API:** `backend/README.md`
- **Git Komutları:** `GIT_KOMUTLARI.md`

## 🔌 API Endpoints

- `GET /api/stations` - Tüm istasyonları getir
- `GET /api/stations/:id` - Belirli bir istasyonu getir
- `PUT /api/stations/:id/status` - İstasyon durumunu güncelle
- `PUT /api/stations/:id` - İstasyon bilgilerini güncelle
- `GET /api/stations/:id/history` - İstasyon geçmişini getir
- `GET /health` - Sunucu durumu

## 🏭 Üretim Hattı

Simülatör 6 istasyonlu bir üretim hattını modellemektedir:

| İstasyon | Tip | Cycle Time |
|----------|-----|------------|
| ST01 | Welding (Kaynak) | 6 sn |
| ST02 | Assembly (Montaj) | 5 sn |
| ST03 | Painting (Boya) | 8 sn |
| ST04 | Inspection (Kontrol) | 4 sn |
| ST05 | Testing (Test) | 7 sn |
| ST06 | Packaging (Paketleme) | 3 sn |

## 🎨 Durumlar

- 🟢 **RUNNING** - Çalışıyor
- 🔴 **STOPPED** - Durduruldu
- ❌ **ERROR** - Hata
- 🔧 **MAINTENANCE** - Bakım

## 🛠️ Teknolojiler

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- SVG (Inline)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- SQLite (kolay kurulum, geliştirme için ideal)
- Express Validator

## 📋 NPM Komutları

### Backend
| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run simulate` | Üretim simülatörü |
| `npm run db:generate` | Prisma client oluştur |
| `npm run db:migrate` | Veritabanı migrasyonu |
| `npm run db:seed` | Başlangıç verileri |
| `npm run db:studio` | Prisma Studio (DB yönetimi) |
| `npm run db:reset` | Veritabanını sıfırla |

### Frontend
| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Build önizleme |

## 📝 Geliştirme Notları

- Frontend varsayılan olarak API'yi kullanır
- API bağlantı hatası durumunda mock data'ya geri döner
- Simülatör 2 saniyede bir istasyonları günceller
- Veritabanı değişiklikleri için Prisma migrations kullanılır
- SQLite veritabanı `backend/prisma/dev.db` dosyasında saklanır
