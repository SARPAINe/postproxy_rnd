import { existsSync } from "node:fs";

// Load .env into process.env if present (Node 20.6+, no dependencies).
if (existsSync(new URL(".env", import.meta.url))) {
  process.loadEnvFile(new URL(".env", import.meta.url));
}

export const CONFIG = {
  BASE_URL: process.env.POSTPROXY_BASE_URL ?? "https://api.postproxy.dev/api",
  API_KEY: process.env.POSTPROXY_API_KEY
};

if (!CONFIG.API_KEY) {
  throw new Error("POSTPROXY_API_KEY is not set. Add it to .env (see .env.example).");
}
