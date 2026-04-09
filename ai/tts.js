require("dotenv").config()

const { OpenAI } = require("openai")
const { spawnSync } = require("child_process")
const fs = require("fs")
const os = require("os")
const crypto = require("crypto")
const path = require("path")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PERSONA_VOICE_MAP = {
  default: { voice: "nova",    speed: 1.0  },
  santai:  { voice: "fable",   speed: 0.95 },
  anime:   { voice: "shimmer", speed: 1.0  },
  manja:   { voice: "alloy",   speed: 0.92 }
}

const VOICE_ALIAS_MAP = {
  brian:   "onyx",
  amy:     "nova",
  cowok:   "onyx",
  cewek:   "nova",
  justin:  "echo",
  joanna:  "shimmer",
  matthew: "fable",
  alloy:   "alloy",
  echo:    "echo",
  fable:   "fable",
  onyx:    "onyx",
  nova:    "nova",
  shimmer: "shimmer"
}

function resolveVoice(voice = "nova") {
  return VOICE_ALIAS_MAP[(voice || "nova").toLowerCase()] || "nova"
}

function getVoiceConfig(persona, voiceOverride) {
  if (voiceOverride) {
    return { voice: resolveVoice(voiceOverride), speed: 1.0 }
  }
  return PERSONA_VOICE_MAP[persona] || PERSONA_VOICE_MAP["default"]
}

function mp3ToOgg(mp3Buffer) {
  const id = crypto.randomBytes(6).toString("hex")
  const tmpIn = path.join(os.tmpdir(), `tts_${id}.mp3`)
  const tmpOut = path.join(os.tmpdir(), `tts_${id}.ogg`)

  try {
    fs.writeFileSync(tmpIn, mp3Buffer)

    const result = spawnSync("ffmpeg", [
      "-y",
      "-i", tmpIn,
      "-c:a", "libopus",
      "-b:a", "64k",
      "-ar", "48000",
      "-ac", "1",
      tmpOut
    ], { timeout: 30000 })

    if (result.status !== 0) {
      const errMsg = result.stderr ? result.stderr.toString() : "unknown error"
      throw new Error("ffmpeg error: " + errMsg.slice(-200))
    }

    return fs.readFileSync(tmpOut)
  } finally {
    try { fs.unlinkSync(tmpIn) } catch {}
    try { fs.unlinkSync(tmpOut) } catch {}
  }
}

async function textToSpeech(text, persona = "default", voiceOverride = null) {
  const { voice, speed } = getVoiceConfig(persona, voiceOverride)

  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: voice,
    input: text,
    speed: speed
  })

  const mp3Buffer = Buffer.from(await mp3.arrayBuffer())
  const oggBuffer = mp3ToOgg(mp3Buffer)
  return oggBuffer
}

module.exports = { textToSpeech, resolveVoice, getVoiceConfig, PERSONA_VOICE_MAP }
