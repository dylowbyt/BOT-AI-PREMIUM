require("dotenv").config()
const fs   = require("fs")
const path = require("path")

function countPlugins() {
  try {
    const pluginDir = path.join(__dirname)
    const files     = fs.readdirSync(pluginDir).filter(f => f.endsWith(".js"))
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
  } catch { return 0 }
}

// ── Kategori & isinya ──────────────────────────────────────────
const CATEGORIES = [
  {
    no: 1,
    emoji: "🤖",
    title: "AI & Cerdas",
    desc: "Chat AI, analisis, & generator pintar",
    detail: `🤖 *AI & CERDAS*
━━━━━━━━━━━━━━━━━━━━

💬 *.ai <pesan>*  —  Chat dengan GPT-4o-mini
   Alias: .tanya .chat .gpt

📝 *.textsummarize <teks>*  —  Ringkas teks otomatis
   Alias: .ringkas

🔮 *.cekkodam [nama/foto]*  —  Baca kodam & aura  🆓
   Alias: .kodam .aura .cekAura

🐛 *.debugcode <kode/screenshot>*  —  Debug kode error  🆓
   Alias: .debug .fixcode .errorfix

🏷️ *.namebrand <deskripsi bisnis>*  —  Nama brand + logo  🪙10
   Alias: .brandname .brandai

⚖️ *.ainotaris <jenis> <detail>*  —  Dokumen hukum resmi  🪙10
   Alias: .notaris .surathukum
   Jenis: perjanjian kontrak sewa hutang kuasa
         pernyataan kerjasama hibah jual nda`
  },
  {
    no: 2,
    emoji: "🎬",
    title: "Video AI",
    desc: "Generate & edit video dengan AI",
    detail: `🎬 *VIDEO AI*
━━━━━━━━━━━━━━━━━━━━

🎥 *.aivideo <prompt>*  —  Generate video dari teks

📽️ *.j2v <teks>*  —  Text-to-Video (JSON2Video)
   Alias: .vid2 .jsonvideo

🎌 *.vanime*  —  Ubah video ke gaya anime

🔥 *.vidhd*  —  Video ke style HD/Anime

🎬 *.vidhr <prompt>*  —  Generate video dari deskripsi

🖼️ *.vidimg*  —  Gambar jadi video animasi
   Alias: .vdimg .img2vid

🗣️ *.vtalk <teks>*  —  Foto berbicara (talking photo)

📷 *.ptv*  —  Foto jadi video 5 detik

📺 *.statushd*  —  Optimasi video untuk Status WA

🎭 *.swapavatar*  —  Swap wajah ke video  🪙23
   Alias: .faceswap .gantiavatar

🌙 *.dreamvideo <deskripsi mimpi>*  —  Video dari mimpi  🪙23
   Alias: .mimpi2video .dreamgen

🧠 *.brainrot <topik>*  —  Konten brainrot absurd  🪙7/23
   Alias: .brainfood .absurd .gila
   (teks=7 token | kirim foto/video=23 token)`
  },
  {
    no: 3,
    emoji: "📸",
    title: "Foto & Gambar",
    desc: "Edit foto, generate gambar & gaya rambut",
    detail: `📸 *FOTO & GAMBAR*
━━━━━━━━━━━━━━━━━━━━

🎨 *.image <prompt>*  —  Generate gambar AI
   Alias: .buatgambar .generateimage

🖼️ *.imgai*  —  AI image processing

🔥 *.imgpro*  —  Pro image enhancement

⭐ *.imghd*  —  Upscale gambar ke HD

😂 *.memeai <teks>*  —  Buat meme otomatis

🤪 *.botak*  —  Efek kepala botak ke foto

🎭 *.aneh <efek>*  —  Filter foto unik
   Efek: triggered wasted jail wanted

👗 *.fasion [foto]*  —  Analisis outfit & saran style  🆓
   Alias: .fashion .outfitcheck .stylecheck

💇 *.messybun [foto] [gaya]*  —  Ganti gaya rambut  🪙4
   Alias: .trendhair .gantiram .hairai .hairstyle
   Gaya: messybun wolfcut bobcut curly
         buzzcut panjang kepang undercut

📸 *.hdpro [foto]*  —  Enhance foto Sony A1 quality  🪙3
   Alias: .hdphoto .enhancephoto .sonya1 .fotohd`
  },
  {
    no: 4,
    emoji: "🎵",
    title: "Download & Media",
    desc: "Download YouTube, TikTok, Spotify & lainnya",
    detail: `🎵 *DOWNLOAD & MEDIA*
━━━━━━━━━━━━━━━━━━━━

▶️ *.play <judul/url>*  —  Download audio YouTube MP3
   Alias: .yt .ytmp3 .dlmedia .musik

📹 *.ytb <judul/url>*  —  Download video YouTube MP4
   Alias: .video .youtube .ytmp4

🔍 *.ytbserch <kata kunci>*  —  Cari video YouTube
   Alias: .ytsearch .yts

🎧 *.spotify <judul>*  —  Cari & download lagu Spotify

📱 *.tt <url>*  —  Download TikTok tanpa watermark
   Alias: .tiktok

📸 *.pinterest <kata kunci>*  —  Download dari Pinterest

🔗 *.gsearch <keyword>*  —  Google Search + download
   Alias: .gs .cari .google

📂 *.get <keyword>*  —  Cari & download file

🖼️ *.toimg*  —  Konversi sticker ke gambar

🔗 *.tourl*  —  Upload media → URL publik

🧊 *.stickers*  —  Buat stiker dari gambar

📦 *.arsip*  —  Arsip & simpan pesan/media`
  },
  {
    no: 5,
    emoji: "📰",
    title: "Info & Berita",
    desc: "Berita, cuaca, gempa, jadwal & informasi",
    detail: `📰 *INFO & BERITA*
━━━━━━━━━━━━━━━━━━━━

📰 *.berita <topik>*  —  Berita terkini

📖 *.wikipedia <topik>*  —  Info dari Wikipedia

📚 *.kbbi <kata>*  —  Kamus Besar Bahasa Indonesia

🌏 *.cuaca <kota>*  —  Cuaca real-time

🌋 *.gempa*  —  Gempa terbaru dari BMKG

🗺️ *.googlemaps <tempat>*  —  Cari lokasi

🎌 *.animeinfo <judul>*  —  Info anime lengkap

🎬 *.jadwalfilm*  —  Jadwal film bioskop

⚽ *.jadwalbola*  —  Jadwal pertandingan bola

📺 *.jadwaltv*  —  Jadwal acara TV hari ini

😂 *.lucu*  —  Jokes & humor Indonesia
   Alias: .jokes .humor

🎲 *.random*  —  Pilih acak / lempar dadu
   Alias: .pilihkan .acak`
  },
  {
    no: 6,
    emoji: "🔍",
    title: "Cek & Validasi",
    desc: "Cek NIK, rekening, saham, obat & lainnya",
    detail: `🔍 *CEK & VALIDASI*
━━━━━━━━━━━━━━━━━━━━

🌐 *.cekip <ip>*  —  Info detail IP address

🪪 *.ceknik <NIK>*  —  Validasi & info NIK KTP

📋 *.ceknpwp <NPWP>*  —  Validasi NPWP

💸 *.cekpajak*  —  Hitung & cek pajak

✅ *.cekstatus <resi>*  —  Cek status pengiriman

🔗 *.ceklink <url>*  —  Cek keamanan URL

💊 *.cekobat <nama>*  —  Info obat dari BPOM

🥇 *.cekhargaemas*  —  Harga emas Antam hari ini

📈 *.ceknilaisaham <kode>*  —  Harga saham real-time

📞 *.nomorhp <nomor>*  —  Info operator HP

🚗 *.cekregno <plat>*  —  Cek plat nomor kendaraan

🏦 *.rekening <no.rek>*  —  Cek info rekening bank`
  },
  {
    no: 7,
    emoji: "🛠️",
    title: "Tools & Utilitas",
    desc: "Kalkulator, QR, translate, password & lainnya",
    detail: `🛠️ *TOOLS & UTILITAS*
━━━━━━━━━━━━━━━━━━━━

🔢 *.kalkulator <ekspresi>*  —  Hitung matematis
   Alias: .calc .hitung .math

🔄 *.konversi <nilai> <dari> ke <ke>*  —  Konversi satuan
   Alias: .convert

🔐 *.encode <mode> <teks>*  —  Enkripsi/dekripsi teks

📷 *.qrgen <teks/url>*  —  Generate QR code

📶 *.wifiqr <ssid> <password>*  —  Buat QR WiFi

🔗 *.shortlink <url>*  —  Persingkat URL

🔑 *.password <panjang>*  —  Generate password aman

🌐 *.translate <bahasa> <teks>*  —  Terjemahkan teks

🌈 *.warna <hex>*  —  Info warna hex/RGB

🔤 *.sensor <kata>*  —  Sensor kata kasar

🎂 *.umur <tanggal lahir>*  —  Hitung umur tepat

🏓 *.ping*  —  Cek status & speed bot`
  },
  {
    no: 8,
    emoji: "💰",
    title: "Keuangan",
    desc: "Kurs, kripto, saham, pajak & simulasi",
    detail: `💰 *KEUANGAN*
━━━━━━━━━━━━━━━━━━━━

💱 *.kurs <mata uang>*  —  Kurs mata uang hari ini

₿  *.kripto <simbol>*  —  Harga kripto real-time

📊 *.saham <kode>*  —  Harga saham Indonesia/global

📈 *.investasi <nominal> <bunga> <thn>*  —  Simulasi investasi

💳 *.kredit <harga> <dp> <tenor>*  —  Simulasi cicilan KPR

⚡ *.listrik <daya> <kwh>*  —  Hitung tagihan listrik

🏷️ *.diskon <harga> <persen>*  —  Hitung harga diskon

🏠 *.pbb <nilai tanah>*  —  Hitung Pajak Bumi & Bangunan

🕌 *.zakat <penghasilan>*  —  Hitung zakat maal

📒 *.uang <catatan>*  —  Catat pengeluaran harian`
  },
  {
    no: 9,
    emoji: "🕌",
    title: "Islami",
    desc: "Jadwal sholat, sahur, zakat, gizi & resep",
    detail: `🕌 *ISLAMI*
━━━━━━━━━━━━━━━━━━━━

🕐 *.jadwalsholat <kota>*  —  Jadwal sholat harian

🌙 *.jadwalsaur*  —  Jadwal sahur & imsakiyah

💰 *.zakat <penghasilan>*  —  Kalkulator zakat maal

🥗 *.gizi <makanan>*  —  Info kandungan gizi

🍳 *.resep <nama masakan>*  —  Resep masakan Indonesia`
  },
  {
    no: 10,
    emoji: "🎮",
    title: "Hiburan",
    desc: "Games, gosip AI, alibi, brainrot & seru-seruan",
    detail: `🎮 *HIBURAN*
━━━━━━━━━━━━━━━━━━━━

🎲 *.fun*  —  Mini games & aktivitas seru

🔢 *.tebak*  —  Tebak angka interaktif

🎯 *.random <pilihan1|pilihan2>*  —  Pilih secara acak
   Alias: .pilihkan .acak

💪 *.motivasi*  —  Quote motivasi harian

♈ *.zodiak <tanggal lahir>*  —  Ramalan zodiak

📖 *.peribahasa <kata kunci>*  —  Cari peribahasa

🔤 *.sinonim <kata>*  —  Sinonim & antonim kata

😂 *.lucu*  —  Jokes & humor Indonesia

🕵️ *.alibi <situasi>*  —  Generate alibi kocak & kreatif  🆓
   Alias: .buatalibi .alasan

📰 *.gossipai <nama>*  —  Gosip fiktif & dramatis  🆓
   Alias: .gosip .gossip .infoterkini

🧠 *.brainrot <topik>*  —  Konten brainrot absurd  🪙7/23
   Alias: .brainfood .absurd .gila`
  },
  {
    no: 11,
    emoji: "💪",
    title: "Gaya Hidup",
    desc: "AI Coach, cek mental, mood music & produktivitas",
    detail: `💪 *GAYA HIDUP*
━━━━━━━━━━━━━━━━━━━━

🏆 *.aicoach*  —  Personal life coach AI  🆓
   Alias: .coach .lifecoach .coaching
   Sub-cmd: goal • curhat • progress • plan • status • reset

🧠 *.cekmental <cerita>*  —  Analisis kondisi mental  🆓
   Alias: .mentalcheck .curhat .psikologi

🎵 *.moodmusic <mood/foto>*  —  Rekomendasi musik + lirik  🪙7
   Alias: .musikmood .songmood .playlistai

⏰ *.reminder <waktu> <pesan>*  —  Set pengingat otomatis

📝 *.catat <teks>*  —  Simpan catatan/to-do

🍅 *.pomodoro <menit>*  —  Timer Pomodoro fokus belajar

⏳ *.countdown <tanggal>*  —  Hitung mundur ke suatu tanggal

📒 *.logbook <catatan>*  —  Catat kegiatan harian

⭐ *.level*  —  Lihat XP & level kamu`
  },
  {
    no: 12,
    emoji: "👤",
    title: "Anonymous Chat",
    desc: "Chat anonim dengan stranger, pilih gender",
    detail: `👤 *ANONYMOUS CHAT*
━━━━━━━━━━━━━━━━━━━━

👤 *.anon*  —  Buka menu & info anon chat
   Alias: .chatanon .anonimus .stranger

👦 *.anon cowo*  —  Set gender cowo + cari random  🆓

👧 *.anon cewe*  —  Set gender cewe + cari random  🆓

🔍 *.anon carice*  —  Cari stranger cewe spesifik  🪙15/bln
   Alias: .anon caricewe

🔍 *.anon cariko*  —  Cari stranger cowo spesifik  🪙15/bln
   Alias: .anon caricowo

💳 *.anon premium*  —  Info & aktifkan premium filter

📊 *.anon status*  —  Lihat statistik online

❌ *.anon batal*  —  Keluar dari antrian

🚪 *.stop*  —  Keluar dari sesi anon chat
   Alias: .keluar .quit

_⚠️ Saat mode anon aktif, semua AI & fitur bot nonaktif_`
  },
  {
    no: 13,
    emoji: "⚙️",
    title: "Admin & Bot",
    desc: "Setting bot, autopilot, premium & token",
    detail: `⚙️ *ADMIN & BOT*
━━━━━━━━━━━━━━━━━━━━

🖼️ *.setbio <teks>*  —  Set bio bot

📸 *.setpp*  —  Set foto profil bot

ℹ️ *.botinfo*  —  Info & status bot

✏️ *.setname <nama>*  —  Ganti nama bot

🤖 *.autopilot*  —  Mode auto reply grup

🛡️ *.automod*  —  Auto moderasi grup

💎 *.premium*  —  Info & beli paket premium

🪙 *.token*  —  Cek saldo token kamu`
  }
]

// ── Main menu text ──────────────────────────────────────────────
function buildMainMenu(pushName, totalCmd) {
  const now  = new Date()
  const jam  = now.getHours()
  const sapa = jam < 11 ? "🌅 Selamat Pagi" : jam < 15 ? "☀️ Selamat Siang" : jam < 18 ? "🌇 Selamat Sore" : "🌙 Selamat Malam"

  const catList = CATEGORIES.map(c =>
    `${c.no.toString().padStart(2, " ")}. ${c.emoji} *${c.title}*\n    _${c.desc}_`
  ).join("\n\n")

  return `╔══════════════════════════════╗
║  ╭──────────────────────╮   ║
║  │  🌟  XYABOT AI  🌟   │   ║
║  │   Bot WhatsApp Cerdas │   ║
║  ╰──────────────────────╯   ║
╚══════════════════════════════╝

${sapa}, *${pushName}!* ✨
Aku siap membantu kamu~ 🤖💕

📊 *TOTAL: ${totalCmd} Commands & Fitur*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${catList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Ketik nomor kategori untuk detail:*
*.1* • *.2* • *.3* • ... • *.13*

_Contoh: .1 → lihat semua fitur AI & Cerdas_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆓 = Gratis  |  🪙 = Perlu Token
⭐ *XYABOT AI* — Bot WA Terlengkap!`
}

// ── Module export ───────────────────────────────────────────────
module.exports = {
  name: "menu",
  alias: [
    "help", "start", "commands", "fitur",
    "1","2","3","4","5","6","7","8","9","10","11","12","13"
  ],

  async run(sock, m, args) {
    const from     = m.key.remoteJid
    const pushName = m.pushName || "Kak"

    // Cek apakah dipanggil via .1 .2 dst
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()

    const numMatch = rawText.match(/^\.(\d+)$/)
    if (numMatch) {
      const no  = parseInt(numMatch[1])
      const cat = CATEGORIES.find(c => c.no === no)
      if (cat) {
        return sock.sendMessage(from, {
          text:
            `╔══════════════════════════════╗\n` +
            `║  ${cat.emoji}  ${cat.title.padEnd(20)}  ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `${cat.detail}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_Ketik *.menu* untuk kembali ke kategori_\n` +
            `🆓 = Gratis  |  🪙 = Perlu Token`
        })
      }
      return sock.sendMessage(from, {
        text: `❌ Kategori tidak ditemukan. Ketik *.menu* untuk lihat daftar.`
      })
    }

    // Cek argumen kategori (misal .menu ai)
    const arg = args[0]?.toLowerCase()
    if (arg) {
      const no  = parseInt(arg)
      const cat = isNaN(no)
        ? CATEGORIES.find(c => c.title.toLowerCase().includes(arg))
        : CATEGORIES.find(c => c.no === no)
      if (cat) {
        return sock.sendMessage(from, {
          text:
            `╔══════════════════════════════╗\n` +
            `║  ${cat.emoji}  ${cat.title.padEnd(20)}  ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `${cat.detail}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_Ketik *.menu* untuk kembali ke kategori_\n` +
            `🆓 = Gratis  |  🪙 = Perlu Token`
        })
      }
    }

    // Menu utama
    const totalCmd = countPlugins()
    await sock.sendMessage(from, { text: buildMainMenu(pushName, totalCmd) })
  }
}
