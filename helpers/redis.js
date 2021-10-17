const Ioredis = require('ioredis');

const client = new Ioredis();

exports.redis = client;
