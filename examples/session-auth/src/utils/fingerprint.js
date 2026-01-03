const crypto = require('crypto');

function getFingerprintComponents(req) {
  // req.ip depends on trust proxy; fine for local/dev examples
  const ip = req.ip || req.connection?.remoteAddress || '';
  const userAgent = req.get('user-agent') || '';
  return { ip, userAgent };
}

function computeFingerprint({ ip, userAgent }) {
  const raw = `${ip}::${userAgent}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { getFingerprintComponents, computeFingerprint };

