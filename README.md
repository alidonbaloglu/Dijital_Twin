# Digital Twin Factory Monitoring System

Dijital ikiz fabrika izleme sistemi - Gerçek zamanlı üretim hattı simülasyonu, 2D/3D görselleştirme ve layout düzenleme aracı.

## 🏗️ Proje Yapısı

```
Dijital_Twin/
├── Layaut/              # Frontend (React + TypeScript + Vite)
│   └── src/
│       ├── app/         # Uygulama ana bileşenleri
│       ├── components/  # UI ve Görselleştirme (2D/3D) bileşenleri
│       ├── data/        # Statik veri
│       ├── hooks/       # React hooks
│       ├── services/    # API servisleri
│       ├── styles/      # CSS stilleri
│       └── utils/       # Yardımcı fonksiyonlar (DXF parsers vb.)
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
- 🏭 **Çift Modlu Görselleştirme:** Hem 2D teknik çizim hem de 3D görselleştirme desteği.
- ✏️ **Gelişmiş Layout Editörü:**
    - **Sürükle & Bırak** ile simülasyon bileşenleri ekleme.
    - **Otomatik Kayıt (Auto-Save):** Yapılan her değişiklik anında sunucuya kaydedilir.
    - **Ayrılmış Paneller:** Solda bileşen paleti, sağda özellikler paneli.
    - **Dinamik Özellikler:** Konum, boyut, rotasyon, renk ve Z-index kontrolü.
- 📥 **Dosya İçe Aktarma:**
    - **DXF/DWG Import:** CAD çizimlerini layout'a dönüştürme.
    - **SVG Import:** Vektörel grafikleri bileşen olarak ekleme.
- 🧊 **3D Görüntüleyici:**
    - Oracle Controls (Döndürme, Yakınlaştırma, Kaydırma).
    - 2D layout ile tam senkronizasyon.
    - Düzenleme modunda anlık 3D önizleme.
- 📊 Gerçek zamanlı istasyon durumu takibi (5 saniyede bir güncelleme).
- 📱 Tam sayfa responsive tasarım.

### Backend
- 🗄️ SQLite veritabanı (hafif ve kurulumsuz).
- 🔌 RESTful API endpoints.
- 📈 İstasyon geçmişi ve performans takibi.
- ✅ Request validation ve hata yönetimi.
- 🔒 CORS desteği.

### 🏭 Simülatör
- 🔄 Gerçekçi üretim hattı simülasyonu.
- 📊 OEE (Overall Equipment Effectiveness) hesaplama.
- ⚠️ Rastgele hata, bakım ve duruş senaryoları.
- 🔗 6 istasyonlu sıralı üretim akışı.
- ⏱️ Cycle time ve buffer yönetimi.

## 🚀 Hızlı Başlangıç

### 1. Backend Kurulumu

```bash
cd backend
npm install

# Prisma veritabanı kurulumu
npm run db:generate
npm run db:migrate
npm run db:seed  # Başlangıç verilerini yükler

# Sunucuyu başlat
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacak.

### 2. Simülatörü Başlat (Opsiyonel)

```bash
cd backend
npm run simulate
```

Simülatör üretim hattını canlandırır:
- İstasyonlar arası parça akışı sağlanır.
- OEE değerleri hesaplanır.
- Rastgele arızalar oluşur (Frontend'de kırmızı/sarı uyarılar olarak görülür).

### 3. Frontend Kurulumu

```bash
cd Layaut
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışacak.

## 🖱️ Kontroller ve Kısayollar

| Aksiyon | 2D Editör | 3D Görünüm |
|---------|-----------|------------|
| **Seçim** | Sol Tık | - |
| **Taşıma (Pan)** | Orta Tuş / Alt + Sol Tık | Sağ Tık (Sürükle) |
| **Yakınlaştırma** | Mouse Tekerleği | Mouse Tekerleği |
| **Döndürme (Rotate)** | - | Sol Tık (Sürükle) |
| **Silme** | Seç + Delete | - |
| **İptal** | ESC | - |

## 🛠️ Teknolojiler

### Frontend
- **Core:** React 18, TypeScript, Vite
- **Görselleştirme:** Three.js, React Three Fiber, React Three Drei
- **Styling:** Tailwind CSS, Vanilla CSS
- **Utilities:** dxf-parser (CAD desteği)

### Backend
- **Runtime:** Node.js, Express
- **Database:** SQLite, Prisma ORM
- **Language:** TypeScript
- **Validation:** Express Validator

## 📋 NPM Komutları

### Backend
| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run simulate` | Üretim simülatörü |
| `npm run db:reset` | Veritabanını sıfırla ve yeniden seed et |
| `npm run db:studio` | Prisma Studio (Veritabanı GUI) |

### Frontend
| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Build önizleme |
