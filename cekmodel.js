const axios = require("axios")

async function cekModels() {
  try {
    const res = await axios.get(
      "https://api.ruxa.ai/v1/models",
      {
        headers: {
          Authorization: `Bearer ${process.env.RUXA_API_KEY}`,
          "x-platform": "ruxa"
        }
      }
    )

    console.log("MODEL LIST:")
    console.log(JSON.stringify(res.data, null, 2))

  } catch (err) {
    console.log("ERROR:")
    console.log(err.response?.data || err.message)
  }
}

cekModels()
"start": "node cekmodel.js"
