const Redis = require('ioredis');
require('dotenv').config();

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
  console.log('Redis Connected...');
} else {
  console.warn('No REDIS_URL found. Caching disabled.');
  redis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    expire: async () => 1
  };
}

module.exports = redis;