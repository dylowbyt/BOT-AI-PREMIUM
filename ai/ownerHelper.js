/**
 * ownerHelper.js — Helper terpusat untuk cek admin/owner
 * NOMOR ADMIN/OWNER DIPAKSA: 6283866344919
 */

// ✅ NOMOR OWNER & ADMIN — PAKSA HARDCODE
const OWNER_NUMBER = "6283866344919"
const ADMIN_NUMBER = "6283866344919"

/**
 * Bersihkan nomor sender dari suffix device & domain WA
 * "6283866344919:12@s.whatsapp.net" → "6283866344919"
 * "6283866344919@s.whatsapp.net"    → "6283866344919"
 * "083866344919"                    → "6283866344919"
 */
function cleanNumber(sender) {
  let num = (sender || "")
    .replace(/@s\.whatsapp\.net$/, "")
    .replace(/@c\.us$/, "")
    .replace(/:\d+$/, "")
    .trim()

  // Konversi 08xxx → 628xxx
  if (num.startsWith("0")) {
    num = "62" + num.slice(1)
  }

  return num
}

function isOwner(sender) {
  const cleaned = cleanNumber(sender)
  console.log(`[OWNER CHECK] sender raw: "${sender}" | cleaned: "${cleaned}" | OWNER_NUMBER: "${OWNER_NUMBER}" | match: ${cleaned === OWNER_NUMBER}`)
  return cleaned === OWNER_NUMBER
}

function isAdmin(sender) {
  const cleaned = cleanNumber(sender)
  console.log(`[ADMIN CHECK] sender raw: "${sender}" | cleaned: "${cleaned}" | ADMIN_NUMBER: "${ADMIN_NUMBER}" | match: ${cleaned === ADMIN_NUMBER}`)
  return cleaned === ADMIN_NUMBER
}

function isAdminOrOwner(sender) {
  return isOwner(sender) || isAdmin(sender)
}

module.exports = { cleanNumber, isOwner, isAdmin, isAdminOrOwner, OWNER_NUMBER, ADMIN_NUMBER }
