import { existsSync } from "node:fs";

// Load the repo-root .env into process.env if present (Node 20.6+, no dependencies).
const envUrl = new URL("../.env", import.meta.url);
if (existsSync(envUrl)) {
  process.loadEnvFile(envUrl);
}

export const CONFIG = {
  BASE_URL: process.env.POSTPROXY_BASE_URL ?? "https://api.postproxy.dev/api",
  API_KEY: process.env.POSTPROXY_API_KEY
};

if (!CONFIG.API_KEY) {
  throw new Error("POSTPROXY_API_KEY is not set. Add it to .env (see .env.example).");
}
