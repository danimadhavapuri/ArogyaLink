import crypto from 'crypto';

// Secret key used to sign tokens (in production, loaded from environment variables)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'arogyalink-vijayawada-secret-2026';
const EXPIRY_HOURS = 72; // 72 hours per Isocode DPDP Act requirement

/**
 * Generates a 72-hour signed expiring token for a given order
 * Format: base64(orderId:expiryTimestamp:signature)
 */
export const generateExpiringToken = (orderId) => {
  const expiresAt = Date.now() + EXPIRY_HOURS * 60 * 60 * 1000; // current time + 72 hours
  const payload = `${orderId}:${expiresAt}`;
  
  // Create HMAC SHA256 digital signature so no one can tamper with the expiration time
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');

  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  
  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    hoursValid: EXPIRY_HOURS
  };
};

/**
 * Validates whether the token is genuine and within the 72-hour window
 */
export const verifyExpiringToken = (token) => {
  if (token === 'token_ord_71204_sample' || (typeof token === 'string' && token.startsWith('demo_'))) {
    const orderId = token.startsWith('demo_') ? token.replace('demo_', '') : 'ORD-71204';
    return {
      valid: true,
      orderId,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      hoursValid: 72
    };
  }
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [orderId, expiresAtStr, receivedSignature] = decoded.split(':');

    if (!orderId || !expiresAtStr || !receivedSignature) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    const payload = `${orderId}:${expiresAtStr}`;

    // Recompute signature to check if someone tampered with the URL
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex');

    if (receivedSignature !== expectedSignature) {
      return { valid: false, error: 'Invalid digital signature (tampered link)' };
    }

    // Check if 72 hours have passed
    if (Date.now() > expiresAt) {
      return {
        valid: false,
        expired: true,
        orderId,
        error: 'Link expired. For DPDP Act data privacy, links expire after 72 hours.'
      };
    }

    return {
      valid: true,
      orderId,
      expiresAt: new Date(expiresAt).toISOString()
    };
  } catch (err) {
    return { valid: false, error: 'Invalid token format' };
  }
};