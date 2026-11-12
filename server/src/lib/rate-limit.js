// Lightweight sliding-window Rate Limiter (Zero external dependencies)
function createRateLimiter({ windowMs, maxRequests, message, keyOf }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(key);
      }
    }
  }, Math.max(30000, Math.floor(windowMs / 2))).unref();

  const ipOf = (req) =>
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next(); // Skip throttling in automated tests

    const key = keyOf ? keyOf(req, ipOf(req)) : ipOf(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      hits.set(key, record);
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

// 2. Tracking Rate Limiter
//
// The limit is per visitor, not per address. An office, a school or a mobile
// carrier shares one address, so with a limit per address the visitors behind
// it lost their views. The address still has a limit, but a much higher one,
// so that one visitor cannot fill the table with rubbish.
export const trackRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Analytics tracking rate limit exceeded.',
  keyOf: (req, ip) => {
    const visitor = req.headers['x-visitor-id'];
    return visitor ? `visitor:${String(visitor).slice(0, 40)}` : `ip:${ip}`;
  },
});

// 3. The same for a whole address: many visitors may share it, so the limit
//    is generous. It only stops a flood from one place.
export const trackIpLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 600,
  message: 'Analytics tracking rate limit exceeded.',
});
