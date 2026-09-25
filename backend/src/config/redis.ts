import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
const redisOptions = {
  host: process.env.REDIS_HOST || process.env.REDISHOST || "localhost",
  port: Number(process.env.REDIS_PORT || process.env.REDISPORT || 6379),
  username: process.env.REDIS_USERNAME || process.env.REDISUSER || undefined,
  password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const createRedisConnection = (name: string) => {
  const connection = redisUrl
    ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
    : new IORedis(redisOptions);

  connection.on("connect", () => console.log(`[redis:${name}] connecting`));
  connection.on("ready", () => console.log(`[redis:${name}] ready`));
  connection.on("reconnecting", () => console.log(`[redis:${name}] reconnecting`));
  connection.on("error", (error) => console.error(`[redis:${name}] error`, error.message));

  return connection;
};