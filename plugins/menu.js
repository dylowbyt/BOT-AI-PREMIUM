require("dotenv").config()
const fs = require("fs")
const path = require("path")

// Hitung total plugin secara dinamis
function countPlugins() {
  try {
    const pluginDir = path.join(__dirname)
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith(".js"))
    let cmds = []
    for (const f of files) {
      try {
        delete require.cache[require.resolve(path.join(pluginDir, f))]
        const p = require(path.join(pluginDir, f))
        if (p.name) {
          cmds.push(p.name)
          if (p.alias) cmds.push(...p.alias)
        }
      } catch {}
    }
    return cmds.length
  } catch { return 126 }
}

module.exports = {
  name: "menu",
  alias: ["help", "start", "commands", "fitur"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const pushName = m.pushName || "Kak"
    const cat = args[0]?.toLowerCase()

    if (cat) {
      const detail = getCategoryDetail(cat)
      if (detail) return sock.sendMessage(from, { text: detail })
    }

    const now = new Date()
    const jam = now.getHours()
    const sapa = jam < 11 ? "🌅 Selamat Pagi" : jam < 15 ? "☀️ Selamat Siang" : jam < 18 ? "🌇 Selamat Sore" : "🌙 Selamat Malam"
    const totalCmd = countPlugins()

    const menu = `
╔══════════════════════════════╗
║  ╭──────────────────────╮   ║
║  │  🌟  XYABOT AI  🌟   │   ║
║  │   Bot WhatsApp Cerdas │   ║
║  ╰──────────────────────╯   ║
╚══════════════════════════════╝

${sapa}, *${pushName}!* ✨
Aku siap membantu kamu~ 🤖💕

📊 *TOTAL FITUR: ${totalCmd} Commands*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 *[1] AI & KREATIF* ✨
┌─────────────────────────┐
│ .ai • .tts • .image     │
│ .memeai • .aivideo      │
│ .j2v • .vanime          │
│ .imgai • .textsummarize │
│ .imgpro • .imghd        │
└─────────────────────────┘

🎵 *[2] DOWNLOAD & MEDIA* 📥
┌─────────────────────────┐
│ .play • .video • .ytb   │
│ .tt • .pinterest        │
│ .dlmedia • .ytmp3       │
│ .toimg • .tourl         │
│ .stickers • .spotify    │
│ .ytbserch • .gsearch    │
└─────────────────────────┘

🎬 *[3] VIDEO AI* 🎥
┌─────────────────────────┐
│ .vid2 • .vidhd          │
│ .vidhr • .vidimg        │
│ .vtalk • .ptv           │
│ .statushd               │
└─────────────────────────┘

📰 *[4] INFO & BERITA* 🌐
┌─────────────────────────┐
│ .berita • .wikipedia    │
│ .kbbi • .cuaca          │
│ .gempa • .googlemaps    │
│ .animeinfo • .jadwalfilm│
│ .jadwalbola • .jadwaltv │
│ .get • .botak           │
│ .aneh • .lucu           │
│ .random • .hitam        │
└─────────────────────────┘

🔍 *[5] CEK & VALIDASI* ✅
┌─────────────────────────┐
│ .cekip • .ceknik        │
│ .ceknpwp • .cekpajak    │
│ .cekstatus • .ceklink   │
│ .cekobat • .cekhargaemas│
│ .ceknilaisaham          │
│ .nomorhp • .cekregno    │
│ .rekening               │
└─────────────────────────┘

🛠️ *[6] TOOLS & UTILITAS* ⚙️
┌─────────────────────────┐
│ .kalkulator • .konversi │
│ .encode • .qrgen        │
│ .wifiqr • .shortlink    │
│ .password • .translate  │
│ .warna • .sensor        │
│ .aksara • .umur         │
│ .ping • .arsip          │
└─────────────────────────┘

💰 *[7] KEUANGAN* 📈
┌─────────────────────────┐
│ .kurs • .kripto • .saham│
│ .investasi • .kredit    │
│ .listrik • .diskon      │
│ .pbb • .zakat • .uang   │
└─────────────────────────┘

🕌 *[8] ISLAMI* ☪️
┌─────────────────────────┐
│ .jadwalsholat           │
│ .jadwalsaur • .zakat    │
│ .gizi • .resep          │
└─────────────────────────┘

🎮 *[9] HIBURAN* 🎉
┌─────────────────────────┐
│ .fun • .tebak           │
│ .random • .motivasi     │
│ .zodiak • .peribahasa   │
│ .sinonim • .lucu        │
└─────────────────────────┘

📅 *[10] PRODUKTIVITAS* 💪
┌─────────────────────────┐
│ .reminder • .catat      │
│ .pomodoro • .countdown  │
│ .logbook • .level       │
│ .arsip                  │
└─────────────────────────┘

⚙️ *[11] ADMIN & BOT* 🔧
┌─────────────────────────┐
│ .setbio • .setpp        │
│ .botinfo • .setname     │
│ .autopilot • .automod   │
└─────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *CARA LIHAT DETAIL FITUR:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
.menu ai        → Detail AI & Kreatif
.menu download  → Detail Media & Download
.menu video     → Detail Video AI
.menu info      → Detail Info & Berita
.menu cek       → Detail Cek & Validasi
.menu tools     → Detail Tools
.menu uang      → Detail Keuangan
.menu islam     → Detail Islami
.menu hiburan   → Detail Hiburan
.menu produktif → Detail Produktivitas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Prefix: . (titik) sebelum command_
_Chat AI langsung: .ai <tanya apa saja>_
_Generate gambar: .image <deskripsi>_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ *XYABOT AI* — Bot WA Terlengkap!`

    await sock.sendMessage(from, { text: menu })
  }
}

function getCategoryDetail(cat) {
  const categories = {
    ai: `
╔═══════════════════════════╗
║  🧠  AI & KREATIF  🧠    ║
╚═══════════════════════════╝

💬 *.ai <pesan>*
   Chat dengan AI (GPT-4o-mini)
   Alias: .tanya .chat .gpt

🎨 *.image <prompt>*
   Generate gambar AI dari teks
   Alias: .buatgambar .generateimage

🎙️ *.tts <suara> <teks>*
   Text-to-Speech multi suara:
   jessie • anime • manja • dan • faye

😂 *.memeai <teks>*
   Buat meme otomatis dengan AI

🎬 *.aivideo <prompt>*
   Generate video AI dari teks

🎥 *.j2v <teks>*
   Text-to-Video JSON2Video
   Alias: .vid2 .jsonvideo

🎌 *.vanime*
   Ubah video ke gaya anime

🖼️ *.imgai*
   AI image processing

📝 *.textsummarize <teks>*
   Ringkas teks panjang otomatis
   Alias: .ringkas

🔥 *.imgpro*
   Pro image enhance AI

⭐ *.imghd*
   Upscale gambar ke HD`,

    download: `
╔══════════════════════════════╗
║  🎵  DOWNLOAD & MEDIA  🎵   ║
╚══════════════════════════════╝

▶️ *.play <judul/url>*
   Download audio YouTube MP3
   Alias: .yt .ytmp3 .dlmedia .musik

📹 *.ytb <judul/url>*
   Download video YouTube MP4
   Alias: .video .youtube .ytmp4

🔍 *.ytbserch <kata kunci>*
   Cari video di YouTube
   Alias: .ytsearch .yts

🎧 *.spotify <judul>*
   Cari & download lagu Spotify

📱 *.tt <url>*
   Download TikTok tanpa watermark
   Alias: .tiktok

📸 *.pinterest <kata kunci>*
   Download gambar dari Pinterest

🔗 *.gsearch <keyword>*
   Google Search + auto download
   Alias: .gs .cari .google

📂 *.get <keyword>*
   Cari & download file otomatis

🖼️ *.toimg*
   Konversi sticker ke gambar

🔗 *.tourl*
   Upload media → dapat URL publik

🧊 *.stickers*
   Buat stiker dari gambar`,

    video: `
╔══════════════════════════════╗
║  🎬  VIDEO AI & TOOLS  🎬   ║
╚══════════════════════════════╝

🎬 *.vid2 <teks>*
   Text-to-Video (JSON2Video)
   Alias: .j2v .jsonvideo

🔥 *.vidhd*
   Ubah video ke style HD/Anime
   (Reply video + perintah)

🎥 *.vidhr <prompt>*
   Generate video dari deskripsi teks

🖼️ *.vidimg*
   Gambar jadi video animasi
   Alias: .vdimg .img2vid
   (Reply gambar + perintah)

🗣️ *.vtalk <teks>*
   Foto berbicara (talking photo)
   (Reply foto + teks ucapan)

📷 *.ptv*
   Foto jadi video 5 detik
   (Reply foto + perintah)

📺 *.statushd*
   Video dioptimasi untuk Status WA
   (Reply video + perintah)

🤪 *.botak*
   Efek kepala botak ke foto
   (Reply foto + perintah)

🎭 *.aneh <efek>*
   Filter foto unik & lucu
   Efek: triggered wasted jail wanted`,

    info: `
╔══════════════════════════════╗
║  📰  INFO & BERITA  📰       ║
╚══════════════════════════════╝

📰 *.berita <topik>*
   Berita terkini sesuai topik

📖 *.wikipedia <topik>*
   Info dari Wikipedia Indonesia

📚 *.kbbi <kata>*
   Kamus Besar Bahasa Indonesia

🌏 *.cuaca <kota>*
   Cuaca real-time

🌋 *.gempa*
   Gempa terbaru dari BMKG

🗺️ *.googlemaps <tempat>*
   Cari lokasi

🎌 *.animeinfo <judul>*
   Info anime lengkap

🎬 *.jadwalfilm*
   Jadwal film bioskop

⚽ *.jadwalbola*
   Jadwal pertandingan bola

📺 *.jadwaltv*
   Jadwal acara TV hari ini

😂 *.lucu*
   Jokes & humor Indonesia
   Alias: .jokes .humor

🎲 *.random*
   Pilih acak / lempar dadu / koin
   Alias: .pilihkan .acak

📦 *.arsip simpan*
   Arsipkan pesan/media penting`,

    cek: `
╔══════════════════════════════╗
║  🔍  CEK & VALIDASI  🔍      ║
╚══════════════════════════════╝

🌐 *.cekip <ip>*
   Info detail IP address

🪪 *.ceknik <NIK>*
   Validasi & info NIK KTP

📋 *.ceknpwp <NPWP>*
   Validasi NPWP

💸 *.cekpajak*
   Hitung & cek pajak

✅ *.cekstatus <resi>*
   Cek status pengiriman

🔗 *.ceklink <url>*
   Cek keamanan URL

💊 *.cekobat <nama>*
   Info obat dari BPOM

🥇 *.cekhargaemas*
   Harga emas Antam hari ini

📈 *.ceknilaisaham <kode>*
   Cek harga saham real-time

📞 *.nomorhp <nomor>*
   Info operator HP

🚗 *.cekregno <plat>*
   Cek plat nomor kendaraan

🏦 *.rekening <no.rek>*
   Cek info rekening bank`,

    tools: `
╔══════════════════════════════╗
║  🛠️  TOOLS & UTILITAS  🛠️    ║
╚══════════════════════════════╝

🔢 *.kalkulator <ekspresi>*
   Hitung matematis
   Alias: .calc .hitung .math

🔄 *.konversi <nilai> <dari> ke <ke>*
   Konversi satuan
   Alias: .convert

🔐 *.encode <mode> <teks>*
   Enkripsi/dekripsi teks

📷 *.qrgen <teks/url>*
   Generate QR code

📶 *.wifiqr <ssid> <password>*
   Buat QR WiFi

🔗 *.shortlink <url>*
   Persingkat URL

🔑 *.password <panjang>*
   Generate password aman

🌈 *.warna <hex>*
   Info warna hex/RGB

🌐 *.translate <bahasa> <teks>*
   Terjemahkan teks

🔤 *.sensor <kata>*
   Sensor kata kasar

🎂 *.umur <tanggal lahir>*
   Hitung umur tepat

🏓 *.ping*
   Cek status & speed bot

📦 *.arsip*
   Arsip & simpan pesan/media`,

    uang: `
╔══════════════════════════════╗
║  💰  KEUANGAN  💰            ║
╚══════════════════════════════╝

💱 *.kurs <mata uang>*
   Kurs mata uang hari ini

₿  *.kripto <simbol>*
   Harga kripto real-time

📊 *.saham <kode>*
   Harga saham Indonesia/global

📈 *.investasi <nominal> <bunga> <thn>*
   Simulasi investasi

💳 *.kredit <harga> <dp> <tenor>*
   Simulasi cicilan KPR

⚡ *.listrik <daya> <kwh>*
   Hitung tagihan listrik

🏷️ *.diskon <harga> <persen>*
   Hitung harga setelah diskon

🏠 *.pbb <nilai tanah>*
   Hitung Pajak Bumi & Bangunan

🕌 *.zakat <penghasilan>*
   Hitung zakat maal

📒 *.uang <catatan>*
   Catat pengeluaran harian`,

    islam: `
╔══════════════════════════════╗
║  🕌  MENU ISLAMI  🕌         ║
╚══════════════════════════════╝

🕐 *.jadwalsholat <kota>*
   Jadwal sholat harian

🌙 *.jadwalsaur*
   Jadwal sahur & imsakiyah

💰 *.zakat <penghasilan>*
   Kalkulator zakat maal

🥗 *.gizi <makanan>*
   Info kandungan gizi

🍳 *.resep <nama masakan>*
   Resep masakan Indonesia`,

    hiburan: `
╔══════════════════════════════╗
║  🎮  HIBURAN  🎮             ║
╚══════════════════════════════╝

🎲 *.fun*
   Mini games & aktivitas seru

🔢 *.tebak*
   Tebak angka interaktif

🎯 *.random <pilihan1 | pilihan2>*
   Pilih secara acak
   Alias: .pilihkan .acak

💪 *.motivasi*
   Quote motivasi harian

♈ *.zodiak <tanggal lahir>*
   Ramalan zodiak hari ini

📖 *.peribahasa <kata kunci>*
   Cari peribahasa Indonesia

🔤 *.sinonim <kata>*
   Sinonim & antonim kata

😂 *.lucu*
   Jokes & humor Indonesia
   Alias: .jokes .humor`,

    produktif: `
╔══════════════════════════════╗
║  📅  PRODUKTIVITAS  📅       ║
╚══════════════════════════════╝

⏰ *.reminder <waktu> <pesan>*
   Set pengingat otomatis

📝 *.catat <teks>*
   Simpan catatan/to-do

🍅 *.pomodoro <menit>*
   Timer Pomodoro fokus belajar

⏳ *.countdown <tanggal>*
   Hitung mundur ke suatu tanggal

📒 *.logbook <catatan>*
   Catat kegiatan harian

⭐ *.level*
   Lihat XP & level kamu

📦 *.arsip simpan <label>*
   Arsipkan pesan/media penting
   .arsip list → lihat semua arsip`
  }

  return categories[cat] || null
}
