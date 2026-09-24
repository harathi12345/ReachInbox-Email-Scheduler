import IORedis from "ioredis";

const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
};

export const createRedisConnection = (name: string) => {
  const connection = new IORedis(redisOptions);

  connection.on("connect", () => console.log(`[redis:${name}] connecting`));
  connection.on("ready", () => console.log(`[redis:${name}] ready`));
  connection.on("reconnecting", () => console.log(`[redis:${name}] reconnecting`));
  connection.on("error", (error) => console.error(`[redis:${name}] error`, error.message));

  return connection;
};