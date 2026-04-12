/**
 * ownerHelper.js — Helper terpusat untuk cek admin/owner
 *
 * WhatsApp Multi-Device menyimpan sender dalam format:
 *   628xxx:12@s.whatsapp.net  (dengan suffix device :12)
 *
 * Kita harus strip suffix itu sebelum membandingkan nomor.
 *
 * Gunakan fungsi ini di semua plugin agar konsisten.
 */

require("dotenv").config()
const identity = require("../plugins/identity")

/**
 * Bersihkan nomor sender dari suffix device & domain WA
 * "6283866344919:12@s.whatsapp.net" → "6283866344919"
 * "6283866344919@s.whatsapp.net"    → "6283866344919"
 */
function cleanNumber(sender) {
  return (sender || "")
    .replace(/@s\.whatsapp\.net$/, "")
    .replace(/@c\.us$/, "")
    .replace(/:\d+$/, "")
    .trim()
}

/**
 * Cek apakah sender adalah owner bot
 * Membaca dari ENV OWNER_NUMBER dulu, fallback ke identity.nomorPembuat
 */
function isOwner(sender) {
  const ownerNum = process.env.OWNER_NUMBER || identity.nomorPembuat
  return cleanNumber(sender) === cleanNumber(ownerNum)
}

/**
 * Cek apakah sender adalah admin bot
 * Membaca dari ENV ADMIN_NUMBER dulu, fallback ke OWNER_NUMBER / identity.nomorPembuat
 */
function isAdmin(sender) {
  const adminNum = process.env.ADMIN_NUMBER || process.env.OWNER_NUMBER || identity.nomorPembuat
  return cleanNumber(sender) === cleanNumber(adminNum)
}

/**
 * Cek apakah sender adalah admin atau owner (gabungan)
 */
function isAdminOrOwner(sender) {
  return isOwner(sender) || isAdmin(sender)
}

module.exports = { cleanNumber, isOwner, isAdmin, isAdminOrOwner }
