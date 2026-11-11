// Lightweight sliding-window Rate Limiter (Zero external dependencies)
function createRateLimiter({ windowMs, maxRequests, message }) {
  const ipHits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipHits.entries()) {
      if (now - record.startTime > windowMs) {
        ipHits.delete(ip);
      }
    }
  }, Math.max(30000, Math.floor(windowMs / 2))).unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next(); // Skip throttling in automated tests

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';
    const now = Date.now();
    let record = ipHits.get(ip);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipHits.set(ip, record);
      return next();
    }

    record.count += 1;
    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((windowMs - (now - record.startTime)) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: message || 'Too many requests. Please slow down and try again later.',
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

// 1. Auth Rate Limiter: Max 10 attempts per 15 minutes per IP
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// 2. Tracking / Analytics Rate Limiter: Max 40 calls per minute per IP
export const trackRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 40,
  message: 'Analytics tracking rate limit exceeded.',
});