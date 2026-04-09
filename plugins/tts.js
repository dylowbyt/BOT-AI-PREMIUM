const axios = require("axios")

// Suara TikTok TTS yang tersedia (dari foto yang dilingkari + ekstra)
// Penggunaan: .tts <teks>            → suara default (Jessie Ceria)
//             .tts jessie <teks>     → Jessie Ceria
//             .tts anime <teks>      → Anak Perempuan (kawaii)
//             .tts manja <teks>      → Iola Manis
//             .tts menggoda <teks>   → VA Menggoda
//             .tts dan <teks>        → Dan (anime biru)
//             .tts faye <teks>       → Faye
//             .tts en <teks>         → English default
const TIKTOK_VOICES = {
  jessie:    "en_female_f08_salut_dam",
  anime:     "jp_female_sora",
  manja:     "en_female_f08_twinkle",
  menggoda:  "en_female_emotional",
  dan:       "jp_female_futurebass",
  faye:      "en_female_ht_f08_glorious",
  en:        "en_us_002",
  default:   "en_female_f08_salut_dam"
}

async function ttsViaTikTok(text, voiceId) {
  const res = await axios.post(
    "https://tiktok-tts.weilnet.workers.dev/api/generation",
    { text: text.slice(0, 300), voice: voiceId },
    { timeout: 20000 }
  )
  if (!res.data?.data) throw new Error("TikTok TTS tidak merespons")
  return Buffer.from(res.data.data, "base64")
}

module.exports = {
  name: "tts",

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (!args.length) {
      return sock.sendMessage(from, {
        text:
          "🎙️ *Text to Speech*\n\n" +
          "Contoh:\n" +
          "• `.tts halo dunia` — suara Jessie Ceria (default)\n" +
          "• `.tts anime kawaii desu ne~` — suara Anak Perempuan\n" +
          "• `.tts manja kamu baik banget~` — suara Iola Manis\n" +
          "• `.tts menggoda aku kangen kamu~` — suara VA Menggoda\n" +
          "• `.tts dan sugoi ne~` — suara anime biru\n" +
          "• `.tts faye hello there` — suara Faye\n" +
          "• `.tts en hello world` — suara English"
      })
    }

    const firstWord = args[0].toLowerCase()
    let voiceId = TIKTOK_VOICES["default"]
    let cleanText = args.join(" ")

    // Deteksi prefix suara
    if (TIKTOK_VOICES[firstWord]) {
      voiceId = TIKTOK_VOICES[firstWord]
      cleanText = args.slice(1).join(" ")
    }

    if (!cleanText.trim()) {
      return sock.sendMessage(from, { text: "⚠️ Masukkan teks setelah nama suara" })
    }

    cleanText = cleanText.trim().slice(0, 300)

    try {
      let audioBuffer = null

      // Opsi 1: TikTok TTS (suara karakter dari foto)
      try {
        audioBuffer = await ttsViaTikTok(cleanText, voiceId)
      } catch {}

      // Opsi 2: Fallback Google TTS
      if (!audioBuffer) {
        try {
          const lang = firstWord === "en" ? "en" : "id"
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${lang}&client=tw-ob`
          const res = await axios.get(googleUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Referer": "https://translate.google.com"
            }
          })
          if (res.data && res.data.byteLength > 1000) {
            audioBuffer = Buffer.from(res.data)
          }
        } catch {}
      }

      // Opsi 3: Fallback StreamElements
      if (!audioBuffer) {
        try {
          const seVoice = firstWord === "en" ? "Brian" : "id-ID-ArdiNeural"
          const seUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${seVoice}&text=${encodeURIComponent(cleanText)}`
          const res = await axios.get(seUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: { "User-Agent": "Mozilla/5.0" }
          })
          if (res.data && res.data.byteLength > 1000) {
            audioBuffer = Buffer.from(res.data)
          }
        } catch {}
      }

      if (!audioBuffer) throw new Error("Semua API TTS gagal")

      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        ptt: true
      })

    } catch (err) {
      console.log("TTS ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal TTS, server sedang down. Coba lagi nanti." })
    }
  }
}
