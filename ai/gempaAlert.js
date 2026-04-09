const axios = require("axios")

// ===== KONFIGURASI =====
// Nomor/grup yang menerima alert gempa
// Format: ["628xxxxx@s.whatsapp.net"] untuk private
//         ["120363xxx@g.us"] untuk grup
let TARGET_CHATS = []

// Minimum magnitude yang dikirim alertnya
const MIN_MAGNITUDE = 4.0

// Interval cek (dalam milidetik) — default 60 detik
const CHECK_INTERVAL = 60 * 1000

// Simpan ID gempa terakhir agar tidak kirim duplikat
let lastGempaId = null
let isRunning = false

// ===== FORMAT PESAN NATURAL DARI AI =====
function buatPesan(gempa) {
  const mag = parseFloat(gempa.Magnitude)
  const kedalaman = parseInt(gempa.Kedalaman)
  const jam = gempa.Jam
  const tanggal = gempa.Tanggal
  const wilayah = gempa.Wilayah
  const potensi = gempa.Potensi || ""

  // Tentukan level bahaya
  let level = ""
  let emoji = ""

  if (mag >= 7.0) {
    level = "SANGAT BERBAHAYA"
    emoji = "🚨🚨🚨"
  } else if (mag >= 6.0) {
    level = "BERBAHAYA"
    emoji = "🚨🚨"
  } else if (mag >= 5.0) {
    level = "WASPADA"
    emoji = "⚠️"
  } else {
    level = "RINGAN"
    emoji = "ℹ️"
  }

  const adaTsunami = potensi.toLowerCase().includes("tsunami")

  let pesan = `${emoji} *PERINGATAN GEMPA BUMI* ${emoji}\n`
  pesan += `━━━━━━━━━━━━━━━━━━\n`
  pesan += `📍 *Wilayah:* ${wilayah}\n`
  pesan += `💥 *Magnitudo:* M${gempa.Magnitude} — ${level}\n`
  pesan += `🕐 *Waktu:* ${tanggal} ${jam} WIB\n`
  pesan += `🌊 *Kedalaman:* ${gempa.Kedalaman} km\n`

  if (gempa.Lintang && gempa.Bujur) {
    pesan += `🗺️ *Koordinat:* ${gempa.Lintang}, ${gempa.Bujur}\n`
  }

  pesan += `━━━━━━━━━━━━━━━━━━\n`

  // Pesan AI yang natural
  if (adaTsunami) {
    pesan += `\n⚠️ *POTENSI TSUNAMI TERDETEKSI!*\n`
    pesan += `Segera jauhi pantai dan cari tempat tinggi!\n`
  } else if (mag >= 6.0) {
    pesan += `\nGempa ini cukup kuat. Segera cari tempat aman, hindari bangunan yang berpotensi runtuh. Tetap tenang dan waspada ya.\n`
  } else if (mag >= 5.0) {
    pesan += `\nGempa terasa cukup kencang. Harap waspada dan jauhi benda-benda berat yang bisa jatuh.\n`
  } else {
    pesan += `\nGempa skala kecil, biasanya tidak berbahaya. Tapi tetap waspada kalau ada guncangan susulan ya.\n`
  }

  pesan += `\n_Sumber: BMKG Indonesia_`

  return pesan
}

// ===== CEK GEMPA DARI BMKG =====
async function cekGempa(sock) {
  try {
    const res = await axios.get(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
      { timeout: 10000 }
    )

    const gempa = res.data?.Infogempa?.gempa

    if (!gempa) return

    // Buat ID unik dari kombinasi waktu + koordinat
    const gempaId = `${gempa.Tanggal}-${gempa.Jam}-${gempa.Lintang}-${gempa.Bujur}`

    // Kalau sudah pernah dikirim, skip
    if (gempaId === lastGempaId) return

    // Update ID terakhir
    lastGempaId = gempaId

    const magnitude = parseFloat(gempa.Magnitude)

    // Skip kalau di bawah minimum magnitude
    if (magnitude < MIN_MAGNITUDE) {
      console.log(`[GEMPA] M${gempa.Magnitude} di bawah threshold, skip`)
      return
    }

    console.log(`[GEMPA] ⚠️ Gempa baru terdeteksi! M${gempa.Magnitude} - ${gempa.Wilayah}`)

    const pesan = buatPesan(gempa)

    // Kirim ke semua target chat
    for (const chatId of TARGET_CHATS) {
      try {
        await sock.sendMessage(chatId, { text: pesan })
        console.log(`[GEMPA] Alert terkirim ke ${chatId}`)
      } catch (e) {
        console.log(`[GEMPA] Gagal kirim ke ${chatId}:`, e.message)
      }
    }

  } catch (err) {
    if (err.code !== "ECONNABORTED") {
      console.log("[GEMPA] Error cek BMKG:", err.message)
    }
  }
}

// ===== TAMBAH TARGET CHAT =====
function addTarget(chatId) {
  if (!TARGET_CHATS.includes(chatId)) {
    TARGET_CHATS.push(chatId)
    console.log(`[GEMPA] Target ditambahkan: ${chatId}`)
  }
}

// ===== HAPUS TARGET CHAT =====
function removeTarget(chatId) {
  TARGET_CHATS = TARGET_CHATS.filter(id => id !== chatId)
}

// ===== CEK DAFTAR TARGET =====
function getTargets() {
  return TARGET_CHATS
}

// ===== MULAI MONITORING =====
function startGempaMonitor(sock) {
  if (isRunning) return
  isRunning = true

  console.log(`[GEMPA] 🌍 Monitor gempa aktif (cek tiap ${CHECK_INTERVAL / 1000} detik, min M${MIN_MAGNITUDE})`)

  // Cek pertama langsung
  cekGempa(sock)

  // Lanjut setiap interval
  setInterval(() => cekGempa(sock), CHECK_INTERVAL)
}

module.exports = {
  startGempaMonitor,
  addTarget,
  removeTarget,
  getTargets
}
