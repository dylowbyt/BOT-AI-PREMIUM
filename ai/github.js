const axios = require("axios")

async function searchGithub(query) {
  const res = await axios.get(
    `https://api.github.com/search/code?q=${query}+whatsapp`
  )

  if (!res.data.items.length) return null

  const item = res.data.items[0]

  const rawUrl = item.html_url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/")

  const code = await axios.get(rawUrl)
  return code.data
}

module.exports = { searchGithub }
