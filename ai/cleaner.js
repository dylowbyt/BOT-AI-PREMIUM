const OpenAI = require("openai")
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function cleanCode(raw) {
  const prompt = `
Ubah kode ini jadi plugin WhatsApp Baileys:

${raw}

Format:
module.exports = { name, run }

Hanya kode.
`

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  })

  return res.choices[0].message.content
}

module.exports = { cleanCode }
