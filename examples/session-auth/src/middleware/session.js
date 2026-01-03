const { getFingerprintComponents, computeFingerprint } = require('../utils/fingerprint');

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'Session is required'
    });
  }

  // Fingerprint check (basic hijack detection)
  const { ip, userAgent } = getFingerprintComponents(req);
  const current = computeFingerprint({ ip, userAgent });
  const expected = req.session.fingerprint;

  if (expected && expected !== current) {
    // Destroy suspicious session
    const sid = req.sessionID;
    req.session.destroy(() => {});
    return res.status(401).json({
      success: false,
      error: 'Session invalid',
      message: 'Session fingerprint mismatch',
      data: { sessionId: `${process.env.REDIS_KEY_PREFIX || 'sess:'}${sid}` }
    });
  }

  next();
}

module.exports = { requireSession };

