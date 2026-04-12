const checkLicense = require("./license-check");

const LICENSE_KEY = "ISI_LICENSE_KAMU";

async function startBot() {
  await checkLicense(LICENSE_KEY);

  console.log("🤖 Bot XYABOT AI aktif...");
  // lanjut logic bot kamu di sini
}

startBot();
