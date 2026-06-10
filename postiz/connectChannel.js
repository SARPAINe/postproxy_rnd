import { CONFIG } from "./config.js";

// Platform to connect. One of: x, linkedin, facebook, instagram, youtube,
// tiktok, reddit, etc. Only OAuth-based integrations are supported.
const INTEGRATION = "facebook";

// GET /social/{integration} — https://docs.postiz.com/public-api/integrations/connect
// Returns an OAuth authorization URL; open it in a browser to authorize the
// connection. To re-auth an existing channel instead of adding a new one, pass
// its integration id as `refresh` (get the id from `node listIntegrations.js`).
async function connectChannel(integration, { refresh } = {}) {
  try {
    const url = new URL(`${CONFIG.BASE_URL}/social/${integration}`);
    if (refresh) url.searchParams.set("refresh", refresh);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CONFIG.API_KEY,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Connect channel failed:", res.status, err);
      throw new Error(res.status);
    }

    const data = await res.json();
    console.log("🔗 Open this URL to authorize the connection:\n", data.url);
    return data;
  } catch (err) {
    console.error("Error:", err.message);
  }
}

connectChannel(INTEGRATION);

// Re-authorize an existing channel:
// connectChannel("facebook", { refresh: "cmq7fo1k0005lmv0yj2lthait" });
