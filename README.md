# WA AI Bot

Bot WhatsApp dengan AI berbasis OpenAI GPT-4o-mini.

## Setup

1. Copy `.env.example` ke `.env` lalu isi API key kamu:
   - `OPENAI_API_KEY` — wajib untuk fitur AI
   - `OPENWEATHER_API_KEY` — opsional, untuk fitur cuaca

2. Install dependencies:
   ```
   npm install
   ```

3. Jalankan bot:
   ```
   npm start
   ```

4. Scan QR yang muncul di terminal.

## Fitur

### Command `.ai`
- `.ai <pertanyaan>` — tanya AI
- `.ai mode voice` — aktifkan mode suara (TTS)
- `.ai mode text` — kembali ke teks
- `.ai persona santai` — persona santai/gaul
- `.ai persona galak` — persona tegas
- `.ai persona anime` — persona anime
- `.ai persona default` — persona normal
- `.ai voice Brian` — ganti suara (Brian/Amy/Justin/Joanna/dll)
- `.ai reset` — hapus memory percakapan
- `.ai info` — lihat setting

### Command lain
- `.menu` / `.help` — tampilkan menu
- `.ping` — cek bot aktif
- `.gempa` — info gempa terbaru dari BMKG
- `.cuaca <kota>` — info cuaca

### Auto-reply (private chat)
- Pesan biasa (non command) di private chat otomatis dijawab AI
- Menyebut "download lagu X" → otomatis trigger `.play X`
- Kirim link TikTok → otomatis trigger `.tt <url>`
- Ketik "harga X" → analisis harga oleh AI
- Ketik "buat fitur X" → coding mode AI

## Struktur File

```
wa-bot/
├── index.js          — entry point utama
├── package.json
├── .env              — API keys (buat dari .env.example)
├── ai/
│   ├── brain.js      — logic utama command & AI routing
│   ├── limit.js      — sistem limit penggunaan
│   ├── gempaAlert.js — monitor gempa otomatis dari BMKG
│   ├── github.js     — cari kode dari GitHub
│   ├── cleaner.js    — bersihkan kode pakai AI
│   └── installer.js  — install fitur otomatis
├── plugins/          — plugin command (auto-loaded)
│   ├── menu.js
│   ├── ping.js
│   ├── gempa.js
│   └── cuaca.js
└── session/          — session WhatsApp (auto-dibuat)
```
