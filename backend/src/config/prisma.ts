import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to start the backend.");
}

function parseMariaDbConfig(urlStr: string) {
  try {
    const url = new URL(urlStr);
    const hasSslParam =
      url.searchParams.has("ssl") ||
      url.searchParams.has("ssl-mode") ||
      url.searchParams.has("sslmode");

    const isCloudHost =
      url.hostname.includes("aivencloud.com") ||
      url.hostname.includes("render.com") ||
      url.hostname.includes("cleardb.net") ||
      url.hostname.includes("amazonaws.com") ||
      (process.env.NODE_ENV === "production" &&
        url.hostname !== "localhost" &&
        url.hostname !== "127.0.0.1");

    const useSsl = hasSslParam || isCloudHost;

    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, "") || "defaultdb",
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectTimeout: 20000,
      acquireTimeout: 20000,
      connectionLimit: 10,
    };
  } catch {
    return urlStr;
  }
}

const config = parseMariaDbConfig(databaseUrl);
const adapter = new PrismaMariaDb(config as any);

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
