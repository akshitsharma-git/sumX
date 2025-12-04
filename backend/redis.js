const Redis = require("ioredis");

module.exports = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { tls: {} })
  : new Redis();
