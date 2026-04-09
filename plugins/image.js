const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const OWNER_NUMBER = "6283866344919"

module.exports = {
  name: "image",
  alias: ["imgfree", "buatgambar", "generateimage"],

  async run(sock, m) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const prompt = text.replace(/^\.(image|imgfree|buatgambar|generateimage)\s*/i, "").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: `🎨 *AI IMAGE GENERATOR*\n━━━━━━━━━━━━━━━\nFormat: .image <deskripsi gambar>\n\nContoh:\n• .image kucing lucu pakai topi\n• .image sunset di pantai Bali\n• .image anime girl dengan pedang\n• .image logo bisnis modern\n\n💡 Semakin detail deskripsinya, semakin bagus hasilnya!\n⭐ Upgrade Premium untuk gambar lebih banyak & resolusi lebih tinggi`
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎨 Membuat gambar AI...\n\n⏳ Mohon tunggu sebentar~" })

      const res = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })

      const imageUrl = res.data[0]?.url

      if (!imageUrl) throw new Error("Tidak ada URL gambar dari API")

      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption: `🎨 *AI Image Generator*\n✏️ _${prompt}_`
      })

      // ===== TAWARAN PREMIUM SETELAH GENERATE =====
      await sock.sendMessage(from, {
        text: `✨ *SUKA FITUR AI IMAGE?* ✨\n━━━━━━━━━━━━━━━━━━\n\n🆓 Kamu baru pakai versi *GRATIS*\n\n🌟 *Upgrade ke PREMIUM* dan dapatkan:\n\n🎨 *Gambar lebih banyak* — tanpa batas harian\n🔥 *Resolusi lebih tinggi* — 1792x1024 HD\n🎬 *Generate VIDEO AI* — teks jadi video\n🗣️ *TTS Premium* — 7+ suara karakter\n⚡ *Prioritas server* — respon lebih cepat\n🛡️ *Tanpa antrian* — langsung proses\n\n💰 *Harga Premium:*\n• 1 Minggu  : Rp 15.000\n• 1 Bulan   : Rp 45.000\n• 3 Bulan   : Rp 99.000 (HEMAT 27%)\n\n📲 *Hubungi Owner untuk Daftar:*\nwa.me/${OWNER_NUMBER}\n\n_Ketik: .menu untuk semua fitur_`
      })

    } catch (err) {
      console.log("IMG ERROR:", err.message)

      // Jika error karena API key atau limit, tetap tampilkan premium offer
      if (err.message?.includes("quota") || err.message?.includes("limit") || err.message?.includes("billing")) {
        await sock.sendMessage(from, {
          text: `⚠️ *Limit generate gambar tercapai hari ini!*\n\n🌟 *Upgrade Premium* untuk limit tidak terbatas!\n\n📲 Hubungi owner: wa.me/${OWNER_NUMBER}`
        })
      } else {
        await sock.sendMessage(from, {
          text: `❌ Gagal generate gambar\n\n💡 *Tips:* Coba deskripsi lebih sederhana\nAtau hubungi owner: wa.me/${OWNER_NUMBER}`
        })
      }
    }
  }
}
