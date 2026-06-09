import { CONFIG } from "./config.js";

async function initializeConnection(groupId) {
  try {
    const res = await fetch(
      `${CONFIG.BASE_URL}/profile_groups/${groupId}/initialize_connection`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CONFIG.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "facebook",
          redirect_url: "https://myapp.com/oauth/callback",
        }),
      }
    );

    // Always handle non-JSON error responses safely
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error:", errorText);
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log("Connection Initialized:", data);

    return data;
  } catch (err) {
    console.error("Request error:", err.message);
    throw err;
  }
}

// Example usage
initializeConnection("qDaFAA");