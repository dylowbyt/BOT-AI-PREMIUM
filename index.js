require("dotenv").config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const fs = require("fs")
const axios = require("axios")
const path = require("path")

const {
  handleCommand,
  getMemory,
  addBotReply,
  getSettings
} = require("./ai/brain")

const { startGempaMonitor } = require("./ai/gempaAlert")
const { startPaymentChecker } = require("./ai/paymentchecker")

const OpenAI = require("openai")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const processed = new Set()

setInterval(() => {
  if (processed.size > 5000) processed.clear()
}, 300000)

// ===== TTS — suara otomatis ikut persona =====
const PERSONA_VOICE_CONFIG = {
  default: {
    voice: "nova",
    instructions: "Bicara dengan nada hangat, natural, dan ramah dalam Bahasa Indonesia. Seperti orang yang berbicara langsung, bukan membaca teks. Jeda sewajarnya."
  },
  santai: {
    voice: "fable",
    instructions: "Bicara dengan nada santai dan kasual dalam Bahasa Indonesia. Seperti teman ngobrol yang asik. Nada rileks, tidak terburu-buru, sesekali ada sedikit keakraban."
  },
  galak: {
    voice: "onyx",
    instructions: "Bicara dengan nada tegas, lugas, dan berwibawa dalam Bahasa Indonesia. Suara dalam dan serius. Tidak basa-basi, langsung ke poin."
  },
  anime: {
    voice: "shimmer",
    instructions: "Bicara dengan nada ceria, playful, dan sedikit manja dalam Bahasa Indonesia. Seperti karakter anime perempuan yang energetik dan ekspresif. Nada naik-turun dengan semangat."
  }
}

async function textToSpeech(text, persona = "default", voiceOverride = null) {
  const config = PERSONA_VOICE_CONFIG[persona] || PERSONA_VOICE_CONFIG["default"]
  const voice = voiceOverride || config.voice
  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: voice,
    input: text,
    instructions: config.instructions,
    format: "opus"
  })
  return Buffer.from(await audio.arrayBuffer())
}

// ===== HELPER SEND =====
async function sendReply(sock, from, sender, text) {
  const userSetting = getSettings(sender)

  if (userSetting.mode === "voice") {
    try {
      const audioBuffer = await textToSpeech(
        text,
        userSetting.persona || "default",
        userSetting.voiceOverride || null
      )
      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      })
      return
    } catch (e) {
      console.log("TTS error:", e.message)
    }
  }

  await sock.sendMessage(from, { text })
}

// ===== INIT PLUGIN FOLDER =====
if (!fs.existsSync("./plugins")) {
  fs.mkdirSync("./plugins", { recursive: true })
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      console.log("📱 QR TERDETEKSI")
      const qrImage = await QRCode.toDataURL(qr)
      console.log(qrImage)
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED")
      startGempaMonitor(sock)
      startPaymentChecker(sock)
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log("❌ Disconnect:", reason)

      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 5000)
      }
    }
  })

  sock.ev.on("messages.upsert", async (msg) => {
    try {
      const m = msg.messages[0]
      if (!m.message) return
      if (m.key.fromMe) return
      if (m.message?.protocolMessage) return

      const id = m.key.id
      if (processed.has(id)) return
      processed.add(id)

      const from = m.key.remoteJid

      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      let text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        ""

      text = text.trim()

      const isGroup = from.endsWith("@g.us")
      const sender = m.key.participant || m.key.remoteJid

      // ===== AUTOPILOT CHECK (semua pesan grup) =====
      if (isGroup) {
        try {
          const autopilot = require("./plugins/autopilot")
          if (autopilot?.check) {
            const blocked = await autopilot.check(sock, m, { text, sender, from, imageBuffer })
            if (blocked) return
          }
        } catch (e) {
          console.log("Autopilot load error:", e.message)
        }
      }

      if (isGroup && !text.startsWith(".")) return

      // ===== IMAGE DETECT =====
      const directImage = m.message?.imageMessage
      const quotedImage = quoted?.imageMessage
      const isImage = !!(directImage || quotedImage)

      let imageBuffer = null

      if (isImage) {
        try {
          const targetMsg = quotedImage
            ? { key: m.key, message: quoted }
            : m

          imageBuffer = await downloadMediaMessage(
            targetMsg,
            "buffer",
            {},
            {
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )
        } catch (e) {
          console.log("Download gambar error:", e.message)
        }
      }

      // ===== BRAIN =====
      let res = null
      let isFromAI = false

      try {
        res = await handleCommand({
          text,
          sender,
          from,
          isGroup,
          imageBuffer,
          sock
        })
      } catch (err) {
        console.log("Brain error:", err.message)
      }

      if (res) {
        if (res.startsWith(".")) {
          text = res.trim()
          isFromAI = true
        } else {
          await sendReply(sock, from, sender, res)
          return
        }
      }

      // ===== PLUGIN =====
      const pluginDir = "./plugins"
      const files = fs.existsSync(pluginDir)
        ? fs.readdirSync(pluginDir).filter(f => f.endsWith(".js"))
        : []

      const command = text.startsWith(".")
        ? text.slice(1).split(" ")[0].toLowerCase()
        : null

      for (let file of files) {
        let plugin
        try {
          delete require.cache[require.resolve(path.resolve(pluginDir, file))]
          plugin = require(path.resolve(pluginDir, file))
        } catch (e) {
          console.log("Plugin load error:", file, e.message)
          continue
        }

        if (!command) continue

        if (
          command === plugin.name ||
          (plugin.alias && plugin.alias.includes(command))
        ) {
          const args = text.slice(1).split(" ").slice(1)
          try {
            await plugin.run(sock, m, args)
          } catch (e) {
            console.log("Plugin run error:", file, e.message)
            await sock.sendMessage(from, { text: "❌ Error menjalankan fitur: " + e.message })
          }
          return
        }
      }

      if (isFromAI) {
        return sock.sendMessage(from, {
          text: "❌ Fitur tidak ditemukan"
        })
      }

      // ===== AUTO AI PRIVATE (SUPPORT VISION) =====
      if (!isGroup) {
        if (!text && !imageBuffer) return
        if (text.startsWith(".")) return

        try {
          const history = getMemory(sender)
          const userSetting = getSettings(sender)

          let identity
          try {
            identity = require("./plugins/identity")
          } catch {
            identity = null
          }

          const { PERSONA_PROMPTS } = require("./ai/brain")

          let systemPrompt = PERSONA_PROMPTS && PERSONA_PROMPTS[userSetting.persona]
            ? PERSONA_PROMPTS[userSetting.persona]
            : (identity && identity.sistemPrompt
                ? identity.sistemPrompt()
                : "Kamu adalah AI WhatsApp yang santai dan helpful."
              )

          let userContent = []

          if (text) {
            userContent.push({ type: "text", text })
          }

          if (imageBuffer) {
            const base64 = imageBuffer.toString("base64")
            const mime = directImage?.mimetype || quotedImage?.mimetype || "image/jpeg"
            userContent.push({
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${base64}`
              }
            })

            if (!text) {
              userContent.unshift({
                type: "text",
                text: "Analisis dan deskripsikan gambar ini dalam bahasa Indonesia"
              })
            }
          }

          if (userContent.length === 0) {
            userContent.push({ type: "text", text: "Halo" })
          }

          const ai = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...history,
              {
                role: "user",
                content: userContent
              }
            ]
          })

          const reply = ai.choices[0].message.content

          await sendReply(sock, from, sender, reply)
          addBotReply(sender, reply)

        } catch (err) {
          console.log("AI ERROR:", err.message)
          await sock.sendMessage(from, {
            text: "⚠️ AI error, coba lagi nanti"
          })
        }
      }

    } catch (err) {
      console.log("SYSTEM ERROR:", err)
    }
  })
}

setTimeout(startBot, 3000)
