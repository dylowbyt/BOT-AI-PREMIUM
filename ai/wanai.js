/**
 * wanai.js — Helper Swap Avatar Video via Ruxa AI / AIVideoAPI
 * Menggunakan AIVIDEO_API_KEY atau RUXA_API_KEY
 *
 * ENV yang dibutuhkan (salah satu):
 *   AIVIDEO_API_KEY — API Key dari aivideoapi.com (prioritas)
 *   RUXA_API_KEY    — API Key dari ruxa.ai (fallback)
 */

const axios = require("axios");
const FormData = require("form-data");

const API_KEY = process.env.AIVIDEO_API_KEY || process.env.RUXA_API_KEY;
const BASE_URL =
  process.env.SWAP_API_BASE_URL ||
  (process.env.AIVIDEO_API_KEY
    ? "https://api.aivideoapi.com"
    : "https://api.ruxa.ai/api/v1");

function getHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function uploadToCatbox(buffer, filename, contentType) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename, contentType });

  const res = await axios.post("https://catbox.moe/user.php", form, {
    headers: form.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const url = res.data?.trim();
  if (!url || !url.startsWith("http"))
    throw new Error("Gagal upload ke catbox.moe");
  return url;
}

function translateError(msg, httpStatus) {
  if (httpStatus === 401)
    return "API Key tidak valid atau sudah kedaluwarsa. Periksa AIVIDEO_API_KEY / RUXA_API_KEY";
  if (httpStatus === 402)
    return "Kredit API habis. Top up di dashboard API provider";
  if (httpStatus === 429)
    return "Terlalu banyak request. Tunggu sebentar lalu coba lagi";
  if (httpStatus === 404)
    return "Endpoint API tidak ditemukan (404). Periksa koneksi dan API Key";
  if (httpStatus === 500)
    return "Server API sedang bermasalah (500). Coba lagi beberapa menit";

  if (!msg) return "Terjadi kesalahan pada API";
  if (msg.includes("积分不足")) {
    const match = msg.match(/([\d.]+).*?([\d.]+)\s*积分/);
    if (match) {
      return (
        `Kredit API tidak mencukupi.\n\n` +
        `💰 Butuh: *${match[1]} kredit*\n` +
        `💳 Saldo sekarang: *${match[2]} kredit*\n\n` +
        `Top up di dashboard API provider`
      );
    }
    return "Kredit API tidak mencukupi. Top up di dashboard API provider";
  }
  if (msg.includes("未找到支持模型") || msg.includes("渠道")) {
    return "Model swap avatar tidak tersedia. Cek dashboard API provider";
  }
  return msg;
}

async function swapAvatarVideo({
  faceBuffer,
  videoBuffer,
  faceType = "image/jpeg",
  videoType = "video/mp4",
}) {
  if (!API_KEY)
    throw new Error(
      "AIVIDEO_API_KEY atau RUXA_API_KEY belum diset di environment",
    );

  const [faceUrl, videoUrl] = await Promise.all([
    uploadToCatbox(faceBuffer, "face.jpg", faceType),
    uploadToCatbox(videoBuffer, "video.mp4", videoType),
  ]);

  const createUrl = `${BASE_URL}/tasks/create`;
  const pollUrlBase = `${BASE_URL}/tasks/query`;

  let res;
  try {
    res = await axios.post(
      createUrl,
      {
        model: "wan-ai/video-reface",
        input: {
          source_image: faceUrl,
          target_video: videoUrl,
        },
      },
      { headers: getHeaders(), timeout: 30000 },
    );
  } catch (err) {
    const status = err.response?.status;
    const msg =
      err.response?.data?.message || err.response?.data?.error || err.message;

    if (status === 404) {
      throw new Error(
        `Endpoint swap avatar tidak ditemukan (404).\n` +
          `Base URL: ${BASE_URL}\n` +
          `Pastikan API Key dan endpoint sudah benar.`,
      );
    }
    if (status) throw new Error(translateError(msg, status));
    throw new Error(`Koneksi ke API gagal: ${err.message}`);
  }

  const data = res.data;

  if (data?.code && data.code !== 200) {
    throw new Error(translateError(data?.message));
  }

  const taskId = data?.data?.taskId || data?.uuid || data?.id || data?.task_id;
  if (!taskId) {
    if (data?.url || data?.video_url) return data.url || data.video_url;
    throw new Error(
      "Tidak ada task ID dari API. Response: " +
        JSON.stringify(data).slice(0, 300),
    );
  }

  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 6000));

    let queryRes;
    try {
      queryRes = await axios.get(`${pollUrlBase}/${taskId}`, {
        headers: getHeaders(),
        timeout: 15000,
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 404)
        throw new Error("Task tidak ditemukan. Coba generate ulang");
      if (status === 401) throw new Error(translateError(null, 401));
      console.log(`[wanai] Polling error (attempt ${i + 1}):`, err.message);
      continue;
    }

    const taskData = queryRes.data?.data || queryRes.data || {};
    const state = taskData.state || taskData.status || "";
    const stateLower = state.toLowerCase();

    if (
      stateLower === "success" ||
      stateLower === "succeeded" ||
      stateLower === "completed"
    ) {
      let parsed = {};
      try {
        parsed = JSON.parse(taskData.resultJson || "{}");
      } catch {}
      const url =
        parsed?.resultUrls?.[0] ||
        taskData.url ||
        taskData.video_url ||
        taskData.resultUrl;
      if (!url) throw new Error("Video selesai tapi URL tidak ditemukan");
      return url;
    }

    if (
      stateLower === "fail" ||
      stateLower === "failed" ||
      stateLower === "error"
    ) {
      throw new Error(
        "API gagal swap avatar: " +
          (taskData.error || taskData.message || state),
      );
    }
  }

  throw new Error(
    "Timeout (5 menit) menunggu hasil swap avatar. Coba lagi nanti",
  );
}

module.exports = { swapAvatarVideo, uploadToCatbox };
