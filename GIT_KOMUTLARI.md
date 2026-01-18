# Git Komutları - GitHub'a Yükleme Rehberi

## İlk Kurulum (Sadece Bir Kez)

```bash
# GitHub'da repo oluşturduktan sonra:
git remote add origin https://github.com/KULLANICI_ADINIZ/Dijital_Twin.git
git branch -M main
git push -u origin main
```

## Günlük Kullanım - Değişiklikleri GitHub'a Yükleme

### 1. Değişiklikleri Kontrol Et
```bash
git status
```

### 2. Değişiklikleri Stage'e Ekle
```bash
# Tüm değişiklikleri eklemek için:
git add .

# Sadece belirli bir dosyayı eklemek için:
git add dosya_adi.tsx
```

### 3. Commit Yap
```bash
git commit -m "commit mesajınız buraya"
```

**Örnek commit mesajları:**
- `git commit -m "yeni özellik eklendi"`
- `git commit -m "bug düzeltildi"`
- `git commit -m "stil güncellemesi"`
- `git commit -m "istasyon popover iyileştirildi"`

### 4. GitHub'a Push Et
```bash
git push origin main
```

## Tüm Adımları Tek Seferde

```bash
git add .
git commit -m "değişiklik açıklaması"
git push origin main
```

## Diğer Yararlı Komutlar

### Son commit'i değiştirmek (henüz push etmediyseniz)
```bash
git commit --amend -m "yeni mesaj"
```

### Son commit'i geri almak (henüz push etmediyseniz)
```bash
git reset --soft HEAD~1
```

### GitHub'dan son değişiklikleri çekmek
```bash
git pull origin main
```

### Commit geçmişini görmek
```bash
git log
```

### Hangi dosyaların değiştiğini görmek
```bash
git diff
```

## Önemli Notlar

⚠️ **Dikkat:**
- `git push` yapmadan önce mutlaka `git status` ile kontrol edin
- Commit mesajlarını açıklayıcı yazın
- Her mantıklı değişiklik için ayrı commit yapın
- Push etmeden önce kodunuzun çalıştığından emin olun
