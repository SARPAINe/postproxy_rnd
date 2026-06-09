import { CONFIG } from "./config.js";

async function publishNow() {
  try {
    const res = await fetch(`${CONFIG.BASE_URL}/posts?profile_group_id=qDaFAA`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post: {
          body: "🚀 This is an instant published targetting twitter and linkedin ... ",
        },
        profiles: ["facebook","twitter"], // or profile IDs
        // profiles: ["RYvUjp"], // it works
        // profile_group_id: "qDaFAA", // optional if profiles are provided
        // page_id: "331147600403460" // optional, required for facebook pages
        platforms: {
            facebook: {
            page_id: "331147600403460"
            }
        },
        media:[
          "https://wallpapers.com/images/featured/gohan-pictures-x1kxysrl6j2n8t8s.jpg"
        ]
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Publish failed:", err);
      throw new Error(res.status);
    }

    const data = await res.json();
    console.log("✅ Published instantly:", data);

    return data;
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function schedulePost() {
  try {
    // ⏰ set schedule time (example: 30 minutes from now)
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + 5);

    const res = await fetch(
      `${CONFIG.BASE_URL}/posts?profile_group_id=qDaFAA`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CONFIG.API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post: {
            body: "⏳ This post is scheduled via API",
            scheduled_at: scheduledTime.toISOString(), // 👈 ONLY CHANGE
          },

          profiles: ["RYvUjp"],

          platforms: {
            facebook: {
              page_id: "331147600403460",
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Schedule failed:", err);
      throw new Error(res.status);
    }

    const data = await res.json();
    console.log("📅 Scheduled successfully:", data);

    return data;
  } catch (err) {
    console.error("Error:", err.message);
  }
}


publishNow();
// schedulePost();