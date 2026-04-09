const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const FormData = require("form-data")

async function uploadImage(buffer) {
  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    const r = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(), timeout: 20000
    })
    const raw = r.data?.data?.url
    if (raw?.startsWith("http")) return raw.replace("tmpfiles.org/", "tmpfiles.org/dl/")
  } catch {}

  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
    const r = await axios.post("https://0x0.st", form, {
      headers: form.getHeaders(), timeout: 20000
    })
    const url = r.data?.trim()
    if (url?.startsWith("http")) return url
  } catch {}

  return null
}

// FIX: Validasi response benar-benar gambar, bukan JSON error
function isValidImageBuffer(data) {
  if (!data || data.length < 100) return false
  const buf = Buffer.from(data)
  // Cek magic bytes: JPEG (FF D8), PNG (89 50), GIF (47 49), WEBP (52 49)
  return (buf[0] === 0xFF && buf[1] === 0xD8) ||
         (buf[0] === 0x89 && buf[1] === 0x50) ||
         (buf[0] === 0x47 && buf[1] === 0x49) ||
         (buf[0] === 0x52 && buf[1] === 0x49)
}

const effects = [
  { name: "Triggered 😤", key: "triggered" },
  { name: "Wasted 💀", key: "wasted" },
  { name: "Jail 🔒", key: "jail" },
  { name: "Wanted 🤠", key: "wanted" },
  { name: "Rainbow 🌈", key: "rainbow" },
  { name: "Blur 🌀", key: "blur" },
  { name: "Invert 🔄", key: "invert" }
]

module.exports = {
  name: "aneh",
  alias: ["weird", "filter", "efek"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const hasImage = m.message?.imageMessage || quoted?.imageMessage

    if (!hasImage) {
      const list = effects.map((e, i) => `${i + 1}. .aneh ${e.key} → ${e.name}`).join("\n")
      return sock.sendMessage(from, {
        text: `🎭 *FILTER FOTO ANEH*\n━━━━━━━━━━━━━━━\nReply foto dengan pilihan efek:\n\n${list}\n\n🎲 .aneh random — efek acak\n\n📌 Cara: Reply foto, lalu ketik .aneh <efek>`
      })
    }

    try {
      const pilihanEfek = args[0]?.toLowerCase()
      let efek
      if (!pilihanEfek || pilihanEfek === "random") {
        efek = effects[Math.floor(Math.random() * effects.length)]
      } else {
        efek = effects.find(e => e.key === pilihanEfek) || effects[Math.floor(Math.random() * effects.length)]
      }

      await sock.sendMessage(from, { text: `🎭 Menerapkan efek *${efek.name}*... ⏳` })

      // FIX: Pakai contextInfo untuk key quoted message yang benar
      let targetMsg
      if (quoted?.imageMessage) {
        const stanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId
        const participant = m.message?.extendedTextMessage?.contextInfo?.participant
        targetMsg = {
          key: { remoteJid: from, id: stanzaId, participant: participant || from },
          message: quoted
        }
      } else {
        targetMsg = m
      }

      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })

      if (!buffer || buffer.length < 100) throw new Error("Gagal download gambar")

      const imageUrl = await uploadImage(buffer)
      if (!imageUrl) throw new Error("Gagal upload gambar ke server")

      let resultBuffer = null

      // API 1: popcat.xyz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.popcat.xyz/${efek.key}?image=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 2: betabotz
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/filter/${efek.key}?url=${encodeURIComponent(imageUrl)}&apikey=beta`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 3: nexoracle
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/filter/${efek.key}?apikey=free&url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 4: siputzx
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/edit/${efek.key}?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      // API 5: ryzendesu
      if (!resultBuffer) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/image/filter/${efek.key}?url=${encodeURIComponent(imageUrl)}`,
            { responseType: "arraybuffer", timeout: 20000 }
          )
          if (isValidImageBuffer(r.data)) resultBuffer = Buffer.from(r.data)
        } catch {}
      }

      if (!resultBuffer) throw new Error("Semua server API sedang down, coba lagi nanti")

      await sock.sendMessage(from, {
        image: resultBuffer,
        caption: `🎭 Efek: *${efek.name}*`
      })

    } catch (err) {
      console.log("ANEH ERROR:", err?.message)
      sock.sendMessage(from, { text: `❌ Gagal apply efek\n_${err?.message || "Coba lagi nanti"}_` })
    }
  }
}
