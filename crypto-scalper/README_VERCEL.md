# Crypto Scalping Assistant - Vercel Deployment

Aplikasi ini sudah siap untuk di-deploy ke Vercel!

## 📋 Struktur Proyek

```
crypto-scalper/
├── api/
│   └── analyze.py          # Serverless function untuk analisis
├── public/
│   └── index.html          # Frontend static
├── vercel.json             # Konfigurasi Vercel
└── requirements.txt        # Dependencies Python
```

## 🚀 Cara Deploy ke Vercel

### Opsi 1: Menggunakan Vercel CLI (Recommended)

1. **Install Vercel CLI** (jika belum):
   ```bash
   npm install -g vercel
   ```

2. **Login ke Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd crypto-scalper
   vercel
   ```

4. **Deploy ke Production**:
   ```bash
   vercel --prod
   ```

### Opsi 2: Melalui GitHub

1. **Push kode ke GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Buka [vercel.com](https://vercel.com)**

3. **Import Project**:
   - Klik "Add New Project"
   - Pilih repository GitHub kamu
   - Vercel akan otomatis detect `vercel.json`
   - Klik "Deploy"

## 🎯 Fitur

- ✅ **Serverless API** - Analisis sentimen menggunakan Hugging Face
- ✅ **Static Frontend** - Modern UI dengan tema Light & Indigo
- ✅ **Auto-scaling** - Otomatis scale sesuai traffic
- ✅ **Global CDN** - Akses cepat dari mana saja

## 🔧 Testing Lokal (Optional)

Untuk testing serverless function secara lokal:

```bash
# Install Vercel CLI
npm install -g vercel

# Jalankan dev server
vercel dev
```

Lalu buka `http://localhost:3000`

## 📝 Catatan

- Fungsi serverless di `api/analyze.py` akan otomatis di-deploy sebagai Python function
- File static di `public/` akan di-serve melalui CDN Vercel
- Tidak perlu konfigurasi tambahan, semua sudah diatur di `vercel.json`

## ⚠️ Disclaimer

Aplikasi ini untuk tujuan edukasi dan testing. Bukan financial advice!
