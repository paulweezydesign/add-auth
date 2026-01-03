import crypto from 'crypto';

/**
 * Generate a session fingerprint based on client information
 */
export const generateFingerprint = (req) => {
  const ip = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  // Create a hash of the fingerprint data for privacy
  const fingerprintData = `${ip}:${userAgent}`;
  const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

  return {
    hash,
    ip,
    userAgent,
  };
};

/**
 * Validate session fingerprint
 */
export const validateFingerprint = (req, storedFingerprint) => {
  if (!storedFingerprint) {
    return false;
  }

  const currentFingerprint = generateFingerprint(req);

  // Strict validation - both IP and User-Agent must match
  const strictValidation = process.env.SESSION_STRICT_FINGERPRINT === 'true';

  if (strictValidation) {
    return currentFingerprint.hash === storedFingerprint.hash;
  }

  // Relaxed validation - only User-Agent must match (for mobile networks with changing IPs)
  return currentFingerprint.userAgent === storedFingerprint.userAgent;
};
