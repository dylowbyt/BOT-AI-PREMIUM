// Simulasi database (ganti ke MongoDB nanti)
const licenses = [];

function addLicense(key, expires) {
  licenses.push({
    key,
    active: true,
    expires
  });
}

function getLicense(key) {
  return licenses.find(l => l.key === key);
}

module.exports = { licenses, addLicense, getLicense };
