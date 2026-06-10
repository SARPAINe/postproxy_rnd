import { CONFIG } from "./config.js";

// Lists the connected channels (integrations). Use this to find the `id` of your
// Facebook channel, which createFacebookPost.js needs.
async function listIntegrations() {
  try {
    const res = await fetch(`${CONFIG.BASE_URL}/integrations`, {
      method: "GET",
      headers: {
        "Authorization": CONFIG.API_KEY,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("List integrations failed:", res.status, err);
      throw new Error(res.status);
    }

    const data = await res.json();
    console.log("🔌 Integrations:", JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listIntegrations();
