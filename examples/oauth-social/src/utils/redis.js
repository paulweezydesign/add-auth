const Redis = require('ioredis');

function createRedisClient() {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
  });

  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  return client;
}

module.exports = { createRedisClient };

