# Digital Twin Factory Monitoring System

Dijital ikiz fabrika izleme sistemi - Full-stack uygulama.

## 🏗️ Proje Yapısı

```
Dijital_Twin/
├── Layaut/          # Frontend (React + TypeScript + Vite)
├── backend/         # Backend API (Node.js + Express + Prisma)
└── README.md        # Bu dosya
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
- 🗄️ PostgreSQL veritabanı entegrasyonu
- 🔌 RESTful API endpoints
- 📈 İstasyon geçmişi takibi
- ✅ Request validation
- 🔒 CORS desteği

## 🚀 Hızlı Başlangıç

### 1. Backend Kurulumu

```bash
cd backend
npm install

# PostgreSQL kurulumu gerekli (detaylar için backend/KURULUM.md)
# .env dosyası oluşturun ve DATABASE_URL'i ayarlayın

npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacak.

### 2. Frontend Kurulumu

```bash
cd Layaut
npm install

# .env dosyası oluşturun (opsiyonel)
# VITE_API_URL=http://localhost:3001

npm run dev
```

Frontend `http://localhost:5173` adresinde çalışacak.

## 📚 Dokümantasyon

- **Backend Kurulum:** `backend/KURULUM.md`
- **Backend API:** `backend/README.md`
- **Git Komutları:** `GIT_KOMUTLARI.md`

## 🔌 API Endpoints

- `GET /api/stations` - Tüm istasyonları getir
- `GET /api/stations/:id` - Belirli bir istasyonu getir
- `PUT /api/stations/:id/status` - İstasyon durumunu güncelle
- `PUT /api/stations/:id` - İstasyon bilgilerini güncelle
- `GET /api/stations/:id/history` - İstasyon geçmişini getir
- `GET /health` - Sunucu durumu

## 🎨 Durumlar

- 🟢 **RUNNING** - Çalışıyor
- 🟡 **STOPPED** - Durduruldu
- 🔴 **ERROR** - Hata
- 🔵 **MAINTENANCE** - Bakım

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
- PostgreSQL
- Express Validator

## 📝 Geliştirme Notları

- Frontend varsayılan olarak API'yi kullanır
- API bağlantı hatası durumunda mock data'ya geri döner
- Backend her 5 saniyede bir otomatik güncellenir
- Veritabanı değişiklikleri için Prisma migrations kullanılır
