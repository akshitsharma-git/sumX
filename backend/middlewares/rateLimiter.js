const { RateLimiterRedis } = require("rate-limiter-flexible");
const redis = require("../redis.js");

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rate-limit",
  points: process.env.NODE_ENV==="production"?20:100,
  duration: 60,
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const result = await rateLimiter.consume(req.ip);
    console.log("Remaining:", result.remainingPoints);
    next();
  } catch (err) {
    console.error("Rate limiter error =>", err);
    return res.status(429).json({
      message: "Too Many Requests. Slow Down!",
    });
  }
};

module.exports = rateLimitMiddleware;
