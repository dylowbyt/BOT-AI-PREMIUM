const express = require("express");
const cors = require("cors");
const dayjs = require("dayjs");
const { addLicense, getLicense } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// tambah license manual
app.post("/add-license", (req, res) => {
  const { key, days } = req.body;

  const expires = dayjs().add(days, "day").format("YYYY-MM-DD");
  addLicense(key, expires);

  res.json({ success: true, key, expires });
});

// validasi license
app.post("/validate", (req, res) => {
  const { key } = req.body;

  const license = getLicense(key);

  if (!license) {
    return res.json({ status: "invalid" });
  }

  if (!license.active) {
    return res.json({ status: "inactive" });
  }

  if (dayjs().isAfter(dayjs(license.expires))) {
    return res.json({ status: "expired" });
  }

  return res.json({ status: "valid" });
});

// matikan license
app.post("/disable", (req, res) => {
  const { key } = req.body;
  const license = getLicense(key);

  if (license) {
    license.active = false;
  }

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("🚀 XYABOT License API running on port 3000");
});
