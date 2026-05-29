import { loadEnvConfig } from "@next/env";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const connectionString =
  process.env.BETTER_AUTH_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Better Auth requires DATABASE_URL or BETTER_AUTH_DATABASE_URL");
}

const socialProviders = {
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: new Pool({
    connectionString,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  plugins: [nextCookies()],
});
