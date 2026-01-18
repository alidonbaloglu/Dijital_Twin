# Digital Twin Backend API

Dijital ikiz fabrika izleme sistemi - Backend API servisi.

## Teknolojiler

- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **Prisma** - ORM (Object-Relational Mapping)
- **SQLite** - Veritabanı (dosya tabanlı, kurulum gerektirmez!)
- **Express Validator** - Request validation

## 🚀 Hızlı Kurulum (SQLite)

### SQLite Kullanımı (Önerilen - Çok Kolay!)

**PostgreSQL kurulumu gerektirmez!** Sadece 3 adım:

```bash
cd backend
npm install
copy env.example.txt .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

**Detaylı rehber:** `KURULUM_SQLITE.md`

---

## Kurulum (PostgreSQL)

### 1. Bağımlılıkları Yükle

```bash
cd backend
npm install
```

### 2. Veritabanı Kurulumu

PostgreSQL'in yüklü ve çalışıyor olması gerekiyor.

#### PostgreSQL Kurulumu (Windows)

1. PostgreSQL'i indirin: https://www.postgresql.org/download/windows/
2. Kurulum sırasında şifre belirleyin
3. Varsayılan port: 5432

#### Veritabanı Oluşturma

```sql
CREATE DATABASE dijital_twin;
```

### 3. Environment Variables

`.env` dosyası oluşturun (`.env.example` dosyasını kopyalayın):

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dijital_twin?schema=public"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Örnek DATABASE_URL:**
```
postgresql://postgres:yourpassword@localhost:5432/dijital_twin?schema=public
```

### 4. Prisma Migrations

```bash
# Prisma client'ı generate et
npm run db:generate

# Veritabanı migration'larını çalıştır
npm run db:migrate

# Seed data'yı yükle (test verileri)
npm run db:seed
```

### 5. Sunucuyu Başlat

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Sunucu `http://localhost:3001` adresinde çalışacak.

## API Endpoints

### Stations

- `GET /api/stations` - Tüm istasyonları getir
- `GET /api/stations/:id` - Belirli bir istasyonu getir
- `PUT /api/stations/:id/status` - İstasyon durumunu güncelle
- `PUT /api/stations/:id` - İstasyon bilgilerini güncelle
- `GET /api/stations/:id/history` - İstasyon geçmişini getir

### Health Check

- `GET /health` - Sunucu durumu

## Örnek API Kullanımı

### Tüm İstasyonları Getir

```bash
curl http://localhost:3001/api/stations
```

### İstasyon Durumunu Güncelle

```bash
curl -X PUT http://localhost:3001/api/stations/ST01/status \
  -H "Content-Type: application/json" \
  -d '{"status": "RUNNING"}'
```

### İstasyon Bilgilerini Güncelle

```bash
curl -X PUT http://localhost:3001/api/stations/ST01 \
  -H "Content-Type: application/json" \
  -d '{
    "oee": 95.5,
    "productionCount": 1500,
    "targetCount": 1600,
    "cycleTime": 40
  }'
```

## Veritabanı Yönetimi

### Prisma Studio (GUI)

```bash
npm run db:studio
```

Bu komut bir web arayüzü açacak ve veritabanını görsel olarak yönetmenizi sağlar.

### Migration Oluşturma

```bash
npm run db:migrate
```

## Frontend Entegrasyonu

Frontend'de API'yi kullanmak için:

1. Backend'in çalıştığından emin olun
2. Frontend'de API base URL'ini ayarlayın
3. `mockProductionData.ts` yerine API çağrıları yapın

## Geliştirme

- `src/server.ts` - Ana sunucu dosyası
- `src/routes/stations.ts` - İstasyon route'ları
- `src/config/database.ts` - Prisma client konfigürasyonu
- `prisma/schema.prisma` - Veritabanı şeması

## Sorun Giderme

### Veritabanı Bağlantı Hatası

- PostgreSQL'in çalıştığından emin olun
- `.env` dosyasındaki `DATABASE_URL`'i kontrol edin
- Kullanıcı adı ve şifrenin doğru olduğundan emin olun

### Port Zaten Kullanılıyor

`.env` dosyasında `PORT` değerini değiştirin veya kullanan uygulamayı kapatın.
