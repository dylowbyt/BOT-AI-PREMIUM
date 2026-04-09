const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { OpenAI } = require("openai")
const axios = require("axios")
const brain = require("../ai/brain")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Mapping persona ke suara TikTok TTS
// (sesuai yang dilingkari di foto)
// Jessie Ceria    → en_female_f08_salut_dam  (default - ceria & natural)
// VA Menggoda     → en_female_emotional       (santai - hangat & menggoda)
// Anak Perempuan  → jp_female_sora            (anime - kawaii & lembut)
// Iola Manis      → en_female_f08_twinkle     (manja - manis & imut)
// Extra: Dan (anime biru) → jp_female_futurebass
// Extra: Faye     → en_female_ht_f08_glorious
const PERSONA_TIKTOK_VOICE = {
  default: "en_female_f08_salut_dam",
  santai:  "en_female_emotional",
  anime:   "jp_female_sora",
  manja:   "en_female_f08_twinkle"
}

const VOICE_ALIAS_TIKTOK = {
  "jessie":          "en_female_f08_salut_dam",
  "jessie ceria":    "en_female_f08_salut_dam",
  "va menggoda":     "en_female_emotional",
  "anak perempuan":  "jp_female_sora",
  "iola manis":      "en_female_f08_twinkle",
  "dan":             "jp_female_futurebass",
  "faye":            "en_female_ht_f08_glorious",
  "nova":            "en_female_f08_salut_dam",
  "fable":           "en_female_emotional",
  "shimmer":         "jp_female_sora",
  "alloy":           "en_female_f08_twinkle",
  "echo":            "en_us_002",
  "default":         "en_female_f08_salut_dam"
}

async function ttsViaTikTok(text, tiktokVoiceId) {
  const res = await axios.post(
    "https://tiktok-tts.weilnet.workers.dev/api/generation",
    { text: text.slice(0, 300), voice: tiktokVoiceId },
    { timeout: 20000 }
  )
  if (!res.data?.data) throw new Error("TikTok TTS gagal")
  return Buffer.from(res.data.data, "base64")
}

async function ttsViaOpenAI(text, persona) {
  const instructions = {
    default: "Bicara hangat, natural, dan ramah dalam Bahasa Indonesia.",
    santai:  "Bicara santai dan kasual dalam Bahasa Indonesia. Nada rileks seperti teman ngobrol.",
    anime:   "Bicara lembut, manis, dan kawaii dalam Bahasa Indonesia. Seperti gadis anime yang pemalu dan perhatian.",
    manja:   "Bicara manja dan menggoda dalam Bahasa Indonesia. Nada lembut, pelan, sedikit merajuk."
  }
  const voiceMap = { default: "nova", santai: "fable", anime: "shimmer", manja: "alloy" }

  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voiceMap[persona] || "nova",
    input: text.slice(0, 300),
    instructions: instructions[persona] || instructions.default,
    format: "opus"
  })
  return Buffer.from(await audio.arrayBuffer())
}

async function textToSpeech(text, persona = "default", voiceOverride = null) {
  let styled = text
  const lower = text.toLowerCase()

  if (/haha|wkwk|lol|ngakak|lucu/.test(lower)) {
    styled = styled + " hehe~"
  } else if (/sedih|capek|lelah|kecewa|hiks/.test(lower)) {
    styled = "..." + styled
  }
  if (persona === "anime" || persona === "manja") {
    styled = styled.replace(/\.$/, "~").replace(/!/g, "~!")
  }
  styled = styled
    .replace(/bacakan.*?:/gi, "")
    .replace(/dengan gaya.*?:/gi, "")
    .replace(/dalam bahasa indonesia.*?:/gi, "")
    .trim()

  // Tentukan voice TikTok yang akan dipakai
  let tiktokVoice = PERSONA_TIKTOK_VOICE[persona] || PERSONA_TIKTOK_VOICE["default"]
  if (voiceOverride) {
    tiktokVoice = VOICE_ALIAS_TIKTOK[voiceOverride.toLowerCase()] || tiktokVoice
  }

  // Coba TikTok TTS dulu (suara dari foto), fallback ke OpenAI
  try {
    return await ttsViaTikTok(styled, tiktokVoice)
  } catch {
    return await ttsViaOpenAI(styled, persona)
  }
}

let identity
try {
  identity = require("../ai/identity")
} catch {
  identity = {
    sistemPrompt: () => "Kamu adalah AI WhatsApp yang santai dan helpful."
  }
}

module.exports = {
  name: "ai",
  alias: [],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from

    const userSetting = brain.getSettings(sender)
    const history = brain.getMemory(sender)

    let text = args.join(" ")

    if (text.startsWith("mode ")) {
      const val = text.split(" ")[1]
      if (val === "voice" || val === "text") {
        brain.updateSettings(sender, { mode: val })
        return sock.sendMessage(from, { text: `✅ Mode diubah ke *${val}*` })
      }
      return sock.sendMessage(from, { text: "❌ Mode tidak valid. Gunakan: voice / text" })
    }

    if (text.startsWith("voice ")) {
      const val = text.split(" ").slice(1).join(" ").trim().toLowerCase()
      if (val === "auto" || val === "otomatis") {
        brain.updateSettings(sender, { voiceOverride: null })
        return sock.sendMessage(from, { text: "✅ Suara kembali ke *otomatis* (ikut persona)" })
      }
      const validVoices = Object.keys(VOICE_ALIAS_TIKTOK)
      if (VOICE_ALIAS_TIKTOK[val]) {
        brain.updateSettings(sender, { voiceOverride: val })
        return sock.sendMessage(from, { text: `✅ Suara di-override ke *${val}*` })
      }
      return sock.sendMessage(from, {
        text: `❌ Suara tidak valid.\nPilih: jessie ceria / va menggoda / anak perempuan / iola manis / dan / faye`
      })
    }

    if (text.startsWith("persona ")) {
      const val = text.split(" ")[1]
      const validPersona = ["default", "santai", "anime", "manja"]
      if (validPersona.includes(val)) {
        brain.updateSettings(sender, { persona: val })
        const voiceInfo = {
          default: "Jessie Ceria (ceria & natural)",
          santai:  "VA Menggoda (hangat & santai)",
          anime:   "Anak Perempuan (lembut & kawaii)",
          manja:   "Iola Manis (manis & manja)"
        }
        return sock.sendMessage(from, {
          text: `✅ Persona diubah ke *${val}*\n🎙️ Suara: ${voiceInfo[val]}`
        })
      }
      return sock.sendMessage(from, { text: "❌ Persona tidak valid. Pilih: default / santai / anime / manja" })
    }

    if (text === "reset") {
      brain.getMemory(sender).splice(0)
      return sock.sendMessage(from, { text: "🗑️ Memory direset!" })
    }

    if (text === "info") {
      const s = brain.getSettings(sender)
      const voiceInfo = {
        default: "Jessie Ceria",
        santai:  "VA Menggoda",
        anime:   "Anak Perempuan",
        manja:   "Iola Manis"
      }
      const activeVoice = s.voiceOverride
        ? `${s.voiceOverride} (manual override)`
        : `${voiceInfo[s.persona] || "Jessie Ceria"} (otomatis dari persona)`
      return sock.sendMessage(from, {
        text:
          `📊 *Setting kamu:*\n` +
          `• Mode: ${s.mode}\n` +
          `• Persona: ${s.persona}\n` +
          `• Suara aktif: ${activeVoice}\n` +
          `• Memory: ${(brain.getMemory(sender) || []).length} pesan`
      })
    }

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImage = m.message?.imageMessage
    const quotedImage = quoted?.imageMessage
    const hasImage = !!(directImage || quotedImage)

    if (!text && !hasImage) {
      return sock.sendMessage(from, {
        text:
          "🤖 *Cara pakai .ai:*\n" +
          "• `.ai <tanya>` — tanya AI\n" +
          "• `.ai mode voice` — mode suara\n" +
          "• `.ai mode text` — mode teks\n" +
          "• `.ai persona default` — suara Jessie Ceria\n" +
          "• `.ai persona santai` — suara VA Menggoda\n" +
          "• `.ai persona anime` — suara Anak Perempuan (kawaii)\n" +
          "• `.ai persona manja` — suara Iola Manis\n" +
          "• `.ai voice jessie ceria` — pilih suara manual\n" +
          "• `.ai voice anak perempuan` — suara anime\n" +
          "• `.ai voice va menggoda` — suara menggoda\n" +
          "• `.ai voice iola manis` — suara manis\n" +
          "• `.ai voice dan` — suara anime biru\n" +
          "• `.ai voice faye` — suara Faye\n" +
          "• `.ai voice auto` — suara otomatis ikut persona\n" +
          "• `.ai reset` — hapus memory\n" +
          "• `.ai info` — lihat setting\n" +
          "• kirim/reply gambar + `.ai` → analisa gambar"
      })
    }

    await sock.sendMessage(from, { text: "⏳..." })

    const PERSONA_PROMPTS = brain.PERSONA_PROMPTS || {}
    let systemPrompt = identity.sistemPrompt
      ? identity.sistemPrompt()
      : "Kamu adalah AI WhatsApp yang santai dan helpful."

    if (PERSONA_PROMPTS[userSetting.persona]) {
      systemPrompt = PERSONA_PROMPTS[userSetting.persona]
    } else {
      if (userSetting.persona === "santai") systemPrompt += "\nJawab santai dan gaul."
      if (userSetting.persona === "anime") systemPrompt += "\nJawab seperti karakter anime yang lembut dan kawaii."
      if (userSetting.persona === "manja") systemPrompt += "\nJawab dengan gaya manja dan menggoda."
    }

    try {
      let userContent = []

      if (text) {
        userContent.push({ type: "text", text })
      }

      if (hasImage) {
        try {
          const targetMsg = quotedImage
            ? { key: m.key, message: quoted }
            : m

          const buffer = await downloadMediaMessage(
            targetMsg,
            "buffer",
            {},
            {
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )

          const base64 = buffer.toString("base64")
          const mime = directImage?.mimetype || quotedImage?.mimetype || "image/jpeg"

          userContent.push({
            type: "image_url",
            image_url: { url: `data:${mime};base64,${base64}` }
          })

          if (!text) {
            userContent.unshift({ type: "text", text: "Analisis dan deskripsikan gambar ini dalam bahasa Indonesia" })
          }
        } catch (e) {
          console.log("Vision download error:", e.message)
          return sock.sendMessage(from, { text: "❌ Gagal membaca gambar" })
        }
      }

      if (userContent.length === 0) {
        userContent.push({ type: "text", text: "Halo" })
      }

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userContent }
        ],
        temperature: 0.7
      })

      const reply = res.choices[0].message.content
      brain.addBotReply(sender, reply)

      if (userSetting.mode === "voice") {
        try {
          const audioBuffer = await textToSpeech(
            reply,
            userSetting.persona,
            userSetting.voiceOverride || null
          )
          return sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: true
          })
        } catch (e) {
          console.log("TTS error:", e.message)
          return sock.sendMessage(from, { text: reply })
        }
      }

      return sock.sendMessage(from, { text: reply })

    } catch (err) {
      console.log("AI plugin error:", err.message)
      return sock.sendMessage(from, { text: "⚠️ AI error, coba lagi nanti" })
    }
  }
}
