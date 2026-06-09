# CookieRisk Analyzer

Platform analisis risiko privasi berbasis web untuk mendeteksi, mengklasifikasikan, dan menilai third-party cookies pada sebuah website. Menggunakan framework **ISO 27005** dan **OWASP Risk Rating Methodology**, dengan pengecekan kepatuhan terhadap **GDPR** dan **UU PDP No. 27/2022**.

## Fitur Utama

- **Deteksi cookie otomatis** menggunakan headless Chromium (Playwright)
- **Klasifikasi tracker** via DuckDuckGo Tracker Radar + built-in database (60+ jaringan utama)
- **Risk scoring OWASP**: `Risk = Likelihood × Impact` (rentang 1–9)
- **Cek consent rejection**: cookies yang masih aktif setelah pengguna menolak consent
- **Compliance check**: GDPR (Art. 5, 7, 13) dan UU PDP No. 27/2022 (Pasal 20, 22, 5–15, 53)
- **Drill-down sub-faktor**: lihat alasan setiap skor diberikan
- **Dark mode + responsive design**
- **Export laporan**: JSON dan PDF (via print)

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend runtime | Node.js v18+ |
| Backend framework | Express.js |
| Headless browser | Playwright (Chromium) |
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Charting | Recharts |
| HTTP client | Axios |
| Deployment | Docker + Docker Compose |

## Struktur Proyek

```
cookierisk-analyzer/
├── backend/
│   ├── src/
│   │   ├── index.js                  # Entry point Express server
│   │   ├── scanner/
│   │   │   ├── cookieScanner.js      # Playwright scanning engine
│   │   │   └── trackerClassifier.js  # DuckDuckGo Radar + built-in lookup
│   │   ├── risk/
│   │   │   ├── likelihoodScoring.js  # Likelihood sub-factors (1-3)
│   │   │   ├── impactScoring.js      # Impact sub-factors (1-3)
│   │   │   └── riskCalculator.js     # OWASP Risk Score = L × I
│   │   ├── compliance/
│   │   │   ├── gdprChecker.js        # GDPR indicators
│   │   │   └── uupdpChecker.js       # UU PDP No. 27/2022 indicators
│   │   └── routes/
│   │       └── scanRoutes.js         # API routes
│   ├── tracker-radar/                # DuckDuckGo dataset (clone manual)
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ScanForm.jsx          # Form input URL & kategori
│   │   │   ├── RiskScoreCard.jsx     # Skor + gauge + drill-down
│   │   │   ├── CookieTable.jsx       # Tabel cookie dengan filter
│   │   │   ├── CompliancePanel.jsx   # Panel GDPR & UU PDP
│   │   │   └── ReportSummary.jsx     # Pie chart + rekomendasi
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Prerequisites

- **Node.js** v18 atau lebih baru
- **npm** v9 atau lebih baru
- **Docker** & **Docker Compose** (opsional, jika ingin deploy via container)
- **Git** untuk cloning

## Instalasi Manual

### 1. Clone repository

```bash
git clone https://github.com/username/cookierisk-analyzer.git
cd cookierisk-analyzer
```

### 2. Download DuckDuckGo Tracker Radar dataset (opsional tapi direkomendasikan)

```bash
git clone https://github.com/duckduckgo/tracker-radar.git backend/tracker-radar
```

> **Catatan:** Jika langkah ini dilewati, sistem tetap berfungsi menggunakan built-in tracker database (~60 jaringan utama). Dengan Tracker Radar terpasang, cakupan klasifikasi akan jauh lebih luas (ribuan domain).

### 3. Install backend

```bash
cd backend
npm install
npx playwright install chromium
```

### 4. Konfigurasi environment backend

```bash
cp .env.example .env
```

Isi `.env`:

```
BACKEND_PORT=3001
NODE_ENV=development
```

### 5. Install frontend

```bash
cd ../frontend
npm install
```

### 6. Jalankan backend (di terminal pertama)

```bash
cd backend
npm run dev
```

Backend akan listen di `http://localhost:3001`.

### 7. Jalankan frontend (di terminal kedua)

```bash
cd frontend
npm run dev
```

Frontend akan listen di `http://localhost:5173`. Vite secara otomatis mem-proxy `/api/*` ke backend.

## Instalasi via Docker

```bash
# Dari root folder proyek
docker-compose up --build
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001>

Untuk menjalankan di background: `docker-compose up -d --build`
Untuk stop: `docker-compose down`

## Cara Menggunakan

1. Buka frontend di browser.
2. Masukkan URL website target (mis. `https://example.com`).
3. Pilih kategori website (mempengaruhi skor Impact).
4. Klik **Scan Now**. Scanning butuh 30–90 detik karena menjalankan 3 iterasi baseline + 1 iterasi rejection.
5. Hasil akan ditampilkan dengan:
   - **Risk Score card** (Critical / High / Medium / Low) + drill-down sub-faktor
   - **Cookie Overview** dengan pie chart distribusi kategori
   - **Cookie Details Table** lengkap dengan filter dan pencarian
   - **Compliance Panel** GDPR & UU PDP
   - **Recommendations** prioritas High/Medium/Low
6. Export laporan via **Download JSON** atau **Download PDF Report**.

## API Endpoints

### `POST /api/scan`

**Request:**

```json
{
  "url": "https://example.com",
  "category": "news_media"
}
```

Kategori valid: `news_media`, `government`, `education`, `healthcare`, `ecommerce`, `other`.

**Response (200):**

```json
{
  "url": "https://example.com",
  "category": "news_media",
  "timestamp": "2026-05-19T10:00:00.000Z",
  "cookies": [
    {
      "name": "_ga",
      "domain": ".example.com",
      "category": "analytics",
      "owner": "Google LLC",
      "lifetimeDays": 730,
      "isSession": false,
      "sameSite": "Lax",
      "secure": true,
      "httpOnly": false,
      "persistsAfterRejection": true,
      "prevalence": 0.85
    }
  ],
  "riskScore": 7.2,
  "riskLevel": "High",
  "likelihoodScore": 2.5,
  "impactScore": 2.88,
  "likelihoodFactors": { /* breakdown 4 sub-faktor */ },
  "impactFactors": { /* breakdown 4 sub-faktor */ },
  "recommendations": [
    { "priority": "High", "title": "...", "description": "..." }
  ],
  "compliance": {
    "gdpr": { "overallScore": 50, "indicators": [...] },
    "uupdp": { "overallScore": 38, "indicators": [...] }
  },
  "scanMetadata": { /* metadata scanning */ }
}
```

### `GET /api/health`

```json
{ "status": "ok", "timestamp": "2026-05-19T10:00:00.000Z" }
```

## Metodologi Skoring

### Likelihood Sub-factors (1–3)

| Faktor | Kriteria | Skor |
|--------|----------|------|
| Jumlah domain third-party | 1–5 / 6–15 / 16+ | 1 / 2 / 3 |
| Tracker network terkenal | Tidak ada / 1–2 / 3+ | 1 / 2 / 3 |
| Persistensi cookie | Session / <30 hari / 30+ hari | 1 / 2 / 3 |
| Cross-domain tracking | Tidak terdeteksi / Diduga / Terkonfirmasi | 1 / 2 / 3 |

**Likelihood Score** = rata-rata 4 sub-faktor (skala 1–3).

### Impact Sub-factors (1–3)

| Faktor | Kriteria | Skor |
|--------|----------|------|
| Jenis data | Session only / Behavioral / Demographic+Location | 1 / 2 / 3 |
| Skala eksposur | Low / Medium / High | 1 / 2 / 3 |
| Sensitivitas kategori | Government/Education / E-Commerce/News / Healthcare | 1 / 2 / 3 |
| Pelanggaran privasi | Minimal / Moderate / Widespread | 1 / 2 / 3 |

**Impact Score** = rata-rata 4 sub-faktor (skala 1–3).

### Klasifikasi Risk Level

| Risk Level | Rentang Skor | Warna |
|-----------|-------------|-------|
| **Critical** | 8.0 – 9.0 | Merah |
| **High** | 6.0 – 7.9 | Oranye |
| **Medium** | 3.0 – 5.9 | Kuning |
| **Low** | 0.1 – 2.9 | Hijau |

Formula: **Risk Score = Likelihood × Impact** (rentang 1–9).

## Error Handling & Rate Limiting

- URL harus valid http/https — jika tidak, response 400.
- Timeout scan: 30 detik per iterasi. Jika website tidak merespons, response 504.
- Rate limit: maksimal **10 scan per menit per IP**.
- Domain yang tidak bisa diresolusi DNS akan return 400 dengan pesan jelas.

## Catatan Teknis

- Scanner menjalankan **3 iterasi baseline** untuk konsistensi, ditambah **1 iterasi rejection** yang mencoba klik tombol "Reject All" secara programatik.
- Deteksi consent banner berbasis selektor heuristik (Inggris dan Indonesia). Tidak semua banner kustom bisa di-detect.
- Verifikasi DPO dan purpose granularity pada UU PDP memerlukan parsing privacy policy yang berada di luar scope scanning otomatis — sistem hanya menandai presence dan menyarankan verifikasi manual.
- DDG Tracker Radar dataset bersifat opsional. Jika tidak ada, classifier menggunakan built-in database.

## Lisensi

MIT
# CookiesAnalyzer-Website
