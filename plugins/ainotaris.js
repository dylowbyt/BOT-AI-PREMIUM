/**
 * ainotaris.js — AI Generator Surat & Dokumen Resmi
 * Command: .ainotaris
 * 10 TOKEN
 */

require("dotenv").config()
const OpenAI = require("openai")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const TOKEN_COST = 10

const JENIS_DOKUMEN = {
  "perjanjian":    "Surat Perjanjian / MoU",
  "kontrak":       "Kontrak Kerja / Jasa",
  "sewa":          "Perjanjian Sewa Menyewa",
  "hutang":        "Surat Pernyataan Hutang Piutang",
  "kuasa":         "Surat Kuasa",
  "pernyataan":    "Surat Pernyataan",
  "kerjasama":     "Perjanjian Kerjasama Bisnis",
  "hibah":         "Akta Hibah / Sumbangan",
  "jual":          "Surat Perjanjian Jual Beli",
  "nda":           "Non-Disclosure Agreement (NDA)",
}

module.exports = {
  name: "ainotaris",
  alias: ["notaris", "surathukum", "dokumenhukum"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const sub    = args[0]?.toLowerCase()
    const detail = args.slice(1).join(" ").trim()

    if (!sub || sub === "list") {
      const listDokumen = Object.entries(JENIS_DOKUMEN)
        .map(([k, v]) => `• *.ainotaris ${k}* — ${v}`)
        .join("\n")

      return sock.sendMessage(from, {
        text:
          `⚖️ *AI NOTARIS — GENERATOR DOKUMEN HUKUM*\n\n` +
          `AI akan generate dokumen hukum resmi sesuai kebutuhanmu!\n\n` +
          `*Jenis Dokumen Tersedia:*\n` +
          `${listDokumen}\n\n` +
          `*Cara pakai:*\n` +
          `*.ainotaris <jenis> <detail pihak & isi perjanjian>*\n\n` +
          `*Contoh:*\n` +
          `*.ainotaris sewa Pihak 1: Budi (pemilik), Pihak 2: Siti (penyewa), objek: kos 3x4 di Jakarta, harga: 1.5jt/bulan, durasi: 1 tahun*\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)}*\n\n` +
          `_⚠️ Bukan pengganti konsultasi notaris/pengacara profesional_`
      })
    }

    const jenisDok = JENIS_DOKUMEN[sub]
    if (!jenisDok) {
      return sock.sendMessage(from, {
        text: `❌ Jenis dokumen *${sub}* tidak tersedia.\nKetik *.ainotaris list* untuk melihat pilihan.`
      })
    }

    if (!detail) {
      return sock.sendMessage(from, {
        text:
          `⚠️ Kamu perlu mengisi detail dokumen!\n\n` +
          `Format: *.ainotaris ${sub} <detail pihak & isi perjanjian>*\n\n` +
          `Sertakan: nama pihak, objek perjanjian, nilai/nominal, jangka waktu, dll`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < TOKEN_COST) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    await sock.sendMessage(from, {
      text:
        `⚖️ *AI Notaris sedang menyusun dokumen...*\n\n` +
        `📄 Jenis: *${jenisDok}*\n` +
        `⏳ Tunggu sebentar...\n` +
        `🪙 *${TOKEN_COST} token* akan dipotong`
    })

    try {
      const remaining = useTokens(sender, TOKEN_COST)

      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah notaris dan konsultan hukum Indonesia yang berpengalaman.
Buat dokumen hukum yang lengkap, formal, dan profesional berdasarkan informasi yang diberikan.
Gunakan bahasa hukum Indonesia yang tepat namun tetap mudah dipahami.
Sertakan: judul dokumen, tanggal, identitas pihak, isi pasal-pasal, ketentuan, sanksi, tanda tangan.
Format dengan rapi menggunakan angka pasal dan poin.
Tambahkan catatan disclaimer di bagian bawah.`
          },
          {
            role: "user",
            content: `Buat ${jenisDok} dengan detail berikut:\n\n${detail}`
          }
        ],
        max_tokens: 2000
      })

      const dokumen = ai.choices[0].message.content

      const tanggal = new Date().toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
      })

      await sock.sendMessage(from, {
        text:
          `⚖️ *${jenisDok.toUpperCase()}*\n` +
          `📅 Dibuat: ${tanggal}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${dokumen}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*\n\n` +
          `_⚠️ Dokumen ini dibuat oleh AI untuk referensi awal.\n` +
          `Konsultasikan dengan notaris/pengacara resmi sebelum digunakan secara hukum._`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_COST)
      console.log("[ainotaris] ERROR:", err.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal generate dokumen: ${err.message}\n\n🪙 Token dikembalikan: *${TOKEN_COST}*`
      })
    }
  }
}
