import { existsSync } from "node:fs";

// Load the repo-root .env into process.env if present (Node 20.6+, no dependencies).
const envUrl = new URL("../.env", import.meta.url);
if (existsSync(envUrl)) {
  process.loadEnvFile(envUrl);
}

export const CONFIG = {
  // Cloud default; for self-hosted use https://{your-domain}/api/public/v1
  BASE_URL: process.env.POSTIZ_BASE_URL ?? "https://api.postiz.com/public/v1",
  API_KEY: process.env.POSTIZ_API_KEY
};

if (!CONFIG.API_KEY) {
  throw new Error("POSTIZ_API_KEY is not set. Add it to .env (see .env.example).");
}
