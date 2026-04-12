const axios = require("axios");

async function checkLicense(key) {
  try {
    const res = await axios.post("http://localhost:3000/validate", { key });

    if (res.data.status !== "valid") {
      console.log("❌ License:", res.data.status);
      process.exit(1);
    }

    console.log("✅ License valid");
    return true;

  } catch (err) {
    console.log("❌ Cannot connect to license server");
    process.exit(1);
  }
}

module.exports = checkLicense;
