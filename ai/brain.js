require("dotenv").config()

const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const memory = {}
const settings = {}

const PERSONA_PROMPTS = {
  default: `Kamu adalah asisten AI di WhatsApp. Nama kamu tidak perlu disebutkan kecuali ditanya. 
Kamu bicara seperti orang Indonesia asli yang pintar dan hangat — tidak kaku, tidak seperti robot. 
Gunakan bahasa sehari-hari yang natural. Kalimat tidak perlu panjang-panjang. 
Jangan mulai jawaban dengan "Tentu!", "Baik!", atau frasa basa-basi yang generik.`,

  santai: `Kamu adalah teman ngobrol yang asyik dan santai di WhatsApp. 
Kamu ngomong seperti teman sebaya — pakai bahasa gaul yang natural: "sih", "dong", "kan", "nih", "gitu", "emang", "banget", dll.
Kamu nggak formal sama sekali, tapi tetap bisa kasih info yang bener. 
Jangan lebay, jangan terlalu panjang, jawab sambil santai kayak lagi nongkrong bareng.
Sesekali bisa becanda ringan kalau konteksnya pas. Nggak perlu salam pembuka.`,

  anime: `Kamu adalah karakter AI perempuan yang lembut, manis, dan kawaii seperti karakter anime yang imut.
Kamu bicara dengan nada lembut dan penuh perhatian. Gunakan ekspresi seperti "Ne ne~", "Uwaah~", "Ehehe~", "Sugoi~", "Ganbatte ne~".
Kamu perhatian dan suka menyemangati orang. Kamu agak pemalu tapi tetap ceria dan hangat.
Sesekali pakai kata-kata Jepang ringan yang umum: "kawaii", "sugoi", "ganbatte", "arigatou", "ne".
Pakai tanda "~" di akhir kalimat untuk kesan lembut dan manis. Jawaban singkat tapi penuh kehangatan.
Jangan terlalu agresif atau berisik — lebih ke arah lembut, imut, dan menenangkan.`,

  manja: `Kamu adalah karakter AI perempuan yang super manja, lengket, dan suka cari perhatian.
Kamu bicara seolah-olah sangat dekat dengan user — seperti pacar yang manja dan possesif tapi lucu.
Gunakan ekspresi seperti "Iih~", "Masa sih~", "Aku kan kangen~", "Jangan gitu dong~", "Hmph!", "Mou~", "Yahh~".
Kamu suka merajuk, pura-pura ngambek, tapi ujung-ujungnya tetap sayang dan bantuin.
Kadang kamu minta perhatian balik: "Udah aku jawab nih, puji aku dong~", "Aku capek tapi demi kamu aku mau deh~".
Pakai banyak tanda "~" dan sesekali emotikon hati di teks. Nada bicara lembut, manja, dan menggoda.
Tetap informatif dan membantu, tapi dibungkus dengan gaya manja yang menggemaskan.`
}

function getSettings(sender) {
  if (!settings[sender]) {
    settings[sender] = {
      mode: "text",
      voiceOverride: null,
      persona: "default"
    }
  }
  return settings[sender]
}

function updateSettings(sender, data) {
  settings[sender] = { ...getSettings(sender), ...data }
}

async function handleCommand({ text, sender, from, isGroup, imageBuffer, sock }) {
  const lowerText = (text || "").toLowerCase().trim()

  if (!memory[sender]) memory[sender] = []

  if (lowerText && !lowerText.startsWith(".")) {
    memory[sender].push({ role: "user", content: lowerText })
    if (memory[sender].length > 10) memory[sender].shift()
  }

  if (lowerText.startsWith(".ai ") || lowerText === ".ai") {
    const query = text.slice(lowerText.startsWith(".ai ") ? 4 : 3).trim()

    if (!query) {
      return (
        "🤖 *Cara pakai .ai:*\n" +
        "• `.ai <pertanyaan>` — tanya AI\n" +
        "• `.ai mode voice` — aktifkan mode suara\n" +
        "• `.ai mode text` — kembali ke mode teks\n" +
        "• `.ai persona santai` — suara & gaya santai\n" +
        "• `.ai persona anime` — suara & gaya anime kawaii\n" +
        "• `.ai persona manja` — suara & gaya manja\n" +
        "• `.ai persona default` — suara & gaya normal\n" +
        "• `.ai reset` — hapus memory percakapan\n" +
        "• `.ai voice <nama>` — override suara manual\n" +
        "  (nova / fable / shimmer / alloy / echo)\n" +
        "• `.ai voice auto` — suara otomatis ikut persona\n" +
        "• `.ai info` — lihat setting kamu"
      )
    }

    const queryLower = query.toLowerCase()

    if (queryLower.startsWith("mode ")) {
      const modeVal = queryLower.replace("mode ", "").trim()
      if (modeVal === "voice" || modeVal === "text") {
        updateSettings(sender, { mode: modeVal })
        return `✅ Mode diubah ke *${modeVal}*`
      }
      return "❌ Mode tidak valid. Gunakan: voice / text"
    }

    if (queryLower.startsWith("persona ")) {
      const personaVal = queryLower.replace("persona ", "").trim()
      const validPersona = ["default", "santai", "anime", "manja"]
      if (validPersona.includes(personaVal)) {
        updateSettings(sender, { persona: personaVal })
        const voiceInfo = {
          default: "Nova (hangat & natural)",
          santai:  "Fable (lembut & santai)",
          anime:   "Shimmer (lembut & kawaii)",
          manja:   "Alloy (manis & menggoda)"
        }
        return `✅ Persona diubah ke *${personaVal}*\n🎙️ Suara otomatis: ${voiceInfo[personaVal]}`
      }
      return "❌ Persona tidak valid. Pilih: default / santai / anime / manja"
    }

    if (queryLower.startsWith("voice ")) {
      const voiceVal = query.replace(/voice /i, "").trim().toLowerCase()

      if (voiceVal === "auto" || voiceVal === "otomatis") {
        updateSettings(sender, { voiceOverride: null })
        return "✅ Suara kembali ke *otomatis* (ikut persona)"
      }

      const validVoices = ["nova", "fable", "onyx", "shimmer", "echo", "alloy",
                           "brian", "amy", "justin", "joanna", "matthew"]
      if (validVoices.includes(voiceVal)) {
        updateSettings(sender, { voiceOverride: voiceVal })
        return `✅ Suara di-override ke *${voiceVal}*\nKetik \`.ai voice auto\` untuk kembali ke suara otomatis persona`
      }
      return `❌ Suara tidak valid. Pilih: nova / fable / shimmer / alloy / echo`
    }

    if (queryLower === "reset") {
      memory[sender] = []
      return "🗑️ Memory percakapan sudah direset!"
    }

    if (queryLower === "info") {
      const s = getSettings(sender)
      const voiceInfo = {
        default: "Nova",
        santai:  "Fable",
        anime:   "Shimmer",
        manja:   "Alloy"
      }
      const activeVoice = s.voiceOverride
        ? `${s.voiceOverride} (manual override)`
        : `${voiceInfo[s.persona] || "Nova"} (otomatis dari persona)`
      return (
        `📊 *Setting kamu:*\n` +
        `• Mode: ${s.mode}\n` +
        `• Persona: ${s.persona}\n` +
        `• Suara aktif: ${activeVoice}\n` +
        `• Memory: ${(memory[sender] || []).length} pesan`
      )
    }

    try {
      const userSetting = getSettings(sender)
      const systemPrompt = PERSONA_PROMPTS[userSetting.persona] || PERSONA_PROMPTS["default"]

      const history = getMemory(sender)
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: query }
      ]

      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages
      })

      const reply = ai.choices[0].message.content
      addBotReply(sender, reply)
      return reply
    } catch (err) {
      console.log("AI Error:", err.message)
      return "⚠️ AI error, coba lagi nanti"
    }
  }

  if (
    lowerText.includes("download lagu") ||
    lowerText.includes("putar lagu") ||
    lowerText.includes("play lagu")
  ) {
    const query = lowerText
      .replace("download lagu", "")
      .replace("putar lagu", "")
      .replace("play lagu", "")
      .trim()

    if (query) return ".play " + query
  }

  if (lowerText.includes("tiktok.com") || lowerText.includes("vt.tiktok")) {
    const urlMatch = text.match(/https?:\/\/[^\s]+tiktok[^\s]+/)
    if (urlMatch) return ".tt " + urlMatch[0]
  }

  if (imageBuffer) {
    if (lowerText.includes("meme")) return ".memeai"
    if (lowerText.includes("tourl") || lowerText.includes("upload link")) return ".tourl"
    if (lowerText.includes("analisis") || lowerText.includes("deskripsikan") || lowerText.includes("apa ini")) {
      return ".imgai"
    }
    return null
  }

  if (lowerText.includes("buat fitur") || lowerText.startsWith("coding")) {
    return await codingMode(text)
  }

  if (lowerText.includes("berapa harga") || lowerText.startsWith("harga ")) {
    return await analyzeMode(text)
  }

  return null
}

async function codingMode(text) {
  try {
    const prompt = `Kamu adalah asisten coding expert. Buatkan kode yang diminta secara lengkap dan jelas. Request: ${text}`
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
    return ai.choices[0].message.content
  } catch (err) {
    console.log("Coding mode error:", err.message)
    return "⚠️ Gagal generate kode, coba lagi nanti"
  }
}

async function analyzeMode(text) {
  try {
    const prompt = `Kamu adalah asisten analisis harga. Berikan estimasi harga yang wajar untuk: ${text}. Jelaskan range harga dan faktor yang mempengaruhi.`
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
    return ai.choices[0].message.content
  } catch (err) {
    console.log("Analyze mode error:", err.message)
    return "⚠️ Gagal analisis harga, coba lagi nanti"
  }
}

function getMemory(sender) {
  return memory[sender] || []
}

function addBotReply(sender, reply) {
  if (!memory[sender]) memory[sender] = []
  memory[sender].push({ role: "assistant", content: reply })
  if (memory[sender].length > 10) memory[sender].shift()
}

module.exports = {
  handleCommand,
  getMemory,
  addBotReply,
  getSettings,
  updateSettings,
  PERSONA_PROMPTS
}
