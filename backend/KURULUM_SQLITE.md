# SQLite ile Kolay Kurulum (PostgreSQL Gerektirmez!)

## 🎉 SQLite Avantajları

- ✅ **Kurulum gerektirmez** - Dosya tabanlı
- ✅ **PostgreSQL gerekmez** - Tek dosya
- ✅ **Çok hızlı kurulum** - 2 dakika
- ✅ **Taşınabilir** - Tek dosya
- ✅ **Geliştirme için ideal**

## 🚀 Hızlı Kurulum (3 Adım)

### Adım 1: Backend Klasörüne Gidin

```bash
cd backend
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
npm install
```

### Adım 3: .env Dosyası Oluşturun

```bash
copy env.example.txt .env
```

`.env` dosyası şu şekilde olacak (zaten doğru!):
```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Hiçbir şey değiştirmenize gerek yok!** SQLite otomatik olarak `dev.db` dosyasını oluşturacak.

### Adım 4: Veritabanını Oluşturun

```bash
# Prisma client'ı generate et
npm run db:generate

# Veritabanı tablolarını oluştur (dev.db dosyası otomatik oluşur)
npm run db:migrate

# Test verilerini yükle
npm run db:seed
```

### Adım 5: Sunucuyu Başlatın

```bash
npm run dev
```

**Tamamlandı!** 🎉

---

## 📁 Oluşturulan Dosyalar

Backend klasöründe şu dosyalar oluşacak:

- `dev.db` - SQLite veritabanı dosyası (tek dosya!)
- `prisma/migrations/` - Migration dosyaları

---

## 🔍 Veritabanını Görüntüleme

### Prisma Studio (Önerilen)

```bash
npm run db:studio
```

Bu komut bir web arayüzü açacak (`http://localhost:5555`) ve veritabanını görsel olarak yönetmenizi sağlar.

### SQLite Browser (Opsiyonel)

1. **DB Browser for SQLite** indirin: https://sqlitebrowser.org/
2. `backend/dev.db` dosyasını açın
3. Verileri görüntüleyin ve düzenleyin

---

## 🔄 PostgreSQL'den SQLite'a Geçiş

Eğer daha önce PostgreSQL kullanıyorsanız:

1. `.env` dosyasını güncelleyin:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

2. Schema'yı güncelleyin (zaten yapıldı):
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Migration'ları sıfırlayın:
   ```bash
   # Eski migration'ları silin (opsiyonel)
   # prisma/migrations klasörünü silin
   
   # Yeni migration oluşturun
   npm run db:migrate
   
   # Seed data'yı yükleyin
   npm run db:seed
   ```

---

## ⚠️ Önemli Notlar

### SQLite Sınırlamaları

- **Production için:** PostgreSQL daha uygun (çoklu kullanıcı, performans)
- **Geliştirme için:** SQLite mükemmel (hızlı, kolay)
- **Dosya boyutu:** Büyük veriler için PostgreSQL tercih edilmeli

### Veritabanı Dosyası

- `dev.db` dosyası backend klasöründe oluşur
- Bu dosyayı `.gitignore`'a eklemedik (küçük olduğu için)
- İsterseniz `.gitignore`'a ekleyebilirsiniz

---

## 🆘 Sorun Giderme

### "database locked" Hatası

**Sebep:** Veritabanı başka bir işlem tarafından kullanılıyor

**Çözüm:**
- Prisma Studio'yu kapatın
- Backend sunucusunu durdurun
- Tekrar deneyin

### Migration Hatası

**Çözüm:**
```bash
# Veritabanını sıfırla
rm dev.db
rm -rf prisma/migrations

# Yeniden oluştur
npm run db:migrate
npm run db:seed
```

---

## 📊 Veritabanı Yönetimi

### Verileri Görüntüleme

```bash
npm run db:studio
```

### Veritabanını Sıfırlama

```bash
# Dosyayı sil
rm dev.db

# Migration'ları sıfırla
rm -rf prisma/migrations

# Yeniden oluştur
npm run db:migrate
npm run db:seed
```

---

## ✅ Kurulum Kontrolü

Kurulumun başarılı olduğunu kontrol edin:

1. `backend/dev.db` dosyası var mı? ✅
2. `npm run dev` çalışıyor mu? ✅
3. http://localhost:3001/api/stations çalışıyor mu? ✅

Hepsi ✅ ise kurulum tamamlandı!
