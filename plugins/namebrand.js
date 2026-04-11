/**
 * namebrand.js — AI Generator Nama Brand + Logo dari Ruxa AI (Nano Banana)
 * Command: .namebrand
 * 10 TOKEN - menggunakan Nano Banana Basic + OpenAI
 */

require("dotenv").config()
const OpenAI = require("openai")
const { generateImage } = require("../ai/ruxaimage")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const TOKEN_COST = 10

module.exports = {
  name: "namebrand",
  alias: ["brandname", "namabrands", "brandai"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const input  = args.join(" ").trim()

    if (!input) {
      return sock.sendMessage(from, {
        text:
          `🏷️ *AI BRAND NAME GENERATOR*\n\n` +
          `Deskripsikan bisnismu, AI akan generate:\n` +
          `✅ 10 nama brand unik & memorable\n` +
          `📝 Slogan untuk setiap nama\n` +
          `🎨 Konsep visual & warna brand\n` +
          `🖼️ Logo konseptual (via Nano Banana AI)\n` +
          `📊 Analisis potensi pasar\n\n` +
          `Cara pakai:\n` +
          `*.namebrand <deskripsi bisnis kamu>*\n\n` +
          `Contoh:\n` +
          `• *.namebrand bisnis kopi artisanal target anak muda Jakarta*\n` +
          `• *.namebrand toko baju streetwear lokal distro Bandung*\n` +
          `• *.namebrand jasa desain grafis freelance modern minimalis*\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)}*`
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
        `🏷️ *AI Brand Generator Processing...*\n\n` +
        `💡 Brainstorming nama brand...\n` +
        `🎨 Merancang konsep visual...\n` +
        `🖼️ Generating logo konsep...\n\n` +
        `⏳ Tunggu sekitar 1-2 menit\n` +
        `🪙 *${TOKEN_COST} token* akan dipotong`
    })

    try {
      const remaining = useTokens(sender, TOKEN_COST)

      // Step 1: Generate brand names & concepts
      const brandAi = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah brand consultant dan naming expert kelas dunia.
Berikan output yang kreatif, unik, dan memorable untuk bisnis yang dideskripsikan.
Format output:
1. 🏷️ 10 NAMA BRAND (dengan penjelasan makna & asal kata)
2. 💬 SLOGAN untuk top 3 nama terbaik
3. 🎨 PALET WARNA REKOMENDASI (nama warna + hex code + alasan)
4. 📊 ANALISIS PASAR SINGKAT (target audience, positioning, kompetitor)
5. ⭐ REKOMENDASI UTAMA + ALASAN

Nama harus: unik, mudah diingat, mudah diucapkan, relevan dengan bisnis.`
          },
          { role: "user", content: `Bisnis saya: ${input}` }
        ],
        max_tokens: 1500
      })

      const brandResult = brandAi.choices[0].message.content

      // Step 2: Generate logo prompt
      const logoPromptAi = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Buat prompt untuk generate logo bisnis menggunakan AI image generator.
Output hanya prompt dalam bahasa Inggris. Format: modern logo, [bisnis type], [style], minimalist, vector, white background, professional.
Maksimal 50 kata.`
          },
          { role: "user", content: `Logo untuk bisnis: ${input}` }
        ],
        max_tokens: 100
      })

      const logoPrompt = logoPromptAi.choices[0].message.content.trim()

      // Kirim dulu hasil brand analysis
      await sock.sendMessage(from, {
        text:
          `🏷️ *HASIL BRAND GENERATOR AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 Bisnis: _${input}_\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${brandResult}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🖼️ Generating logo konsep... tunggu sebentar`
      })

      // Step 3: Generate logo image via Nano Banana
      try {
        const logoUrl = await generateImage({
          prompt: logoPrompt,
          model:  "nano-banana"
        })

        await sock.sendMessage(from, {
          image:   { url: logoUrl },
          caption:
            `🖼️ *LOGO KONSEP AI*\n\n` +
            `📝 Prompt: _${logoPrompt.slice(0, 100)}_\n` +
            `🤖 Model: *Nano Banana (Ruxa AI)*\n\n` +
            `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*\n\n` +
            `_💡 Gunakan sebagai referensi untuk desainer profesional!_`
        })
      } catch (logoErr) {
        console.log("[namebrand] Logo gen error:", logoErr.message)
        await sock.sendMessage(from, {
          text:
            `⚠️ Logo gagal di-generate, tapi brand analysis sudah selesai!\n\n` +
            `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*`
        })
      }

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_COST)
      console.log("[namebrand] ERROR:", err.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal generate brand: ${err.message}\n\n🪙 Token dikembalikan: *${TOKEN_COST}*`
      })
    }
  }
}
