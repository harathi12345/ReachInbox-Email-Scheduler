import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

const rawDatabaseUrl = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL is required to start the backend.");
}

function createPrismaClient(): PrismaClient {
  let pool: any;

  try {
    const url = new URL(rawDatabaseUrl);
    const sslParam = (
      url.searchParams.get("ssl") ||
      url.searchParams.get("ssl-mode") ||
      url.searchParams.get("sslmode") ||
      ""
    ).toLowerCase();

    let useSsl = false;
    if (["true", "1", "require", "required", "verify-ca", "verify-full"].includes(sslParam)) {
      useSsl = true;
    } else if (["false", "0", "disable", "disabled", "off"].includes(sslParam)) {
      useSsl = false;
    } else {
      const host = url.hostname.toLowerCase();
      useSsl =
        host.includes("aivencloud.com") ||
        host.includes("cleardb.net") ||
        (process.env.NODE_ENV === "production" &&
          host !== "localhost" &&
          host !== "127.0.0.1");
    }

    const poolConfig: any = {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, "") || "defaultdb",
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      allowPublicKeyRetrieval: true,
      connectTimeout: 20000,
      acquireTimeout: 20000,
      connectionLimit: 10,
    };

    pool = mariadb.createPool(poolConfig);
  } catch {
    const mariadbUrl = rawDatabaseUrl.replace(/^mysql:\/\//i, "mariadb://");
    pool = mariadb.createPool(mariadbUrl);
  }

  const adapter = new PrismaMariaDb(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
