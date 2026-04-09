const axios = require("axios")

module.exports = {
  name: "tapaktilas",
  alias: ["reverseimage", "searchimage", "ceklinkimage"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url) {
      return sock.sendMessage(from, {
        text: "🔍 Contoh:\n.tapaktilas https://example.com/image.jpg\n\nAtau gunakan .cekurl untuk cek info URL gambar."
      })
    }

    if (!url.startsWith("http")) {
      return sock.sendMessage(from, { text: "❌ Masukkan URL gambar yang valid (dimulai dengan http/https)." })
    }

    await sock.sendMessage(from, {
      text: `🔍 *REVERSE IMAGE SEARCH*\n━━━━━━━━━━━━━━━\n🖼️ URL: ${url}\n\nGunakan link berikut untuk reverse search:\n\n📌 Google: https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}\n📌 TinEye: https://tineye.com/search?url=${encodeURIComponent(url)}\n📌 Bing: https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(url)}`
    })
  }
}
