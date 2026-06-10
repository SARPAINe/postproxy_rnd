import { CONFIG } from "./config.js";

// Facebook channel (integration) id — get it from `node listIntegrations.js`.
const FACEBOOK_INTEGRATION_ID = "cmq7fo1k0005lmv0yj2lthait";

// POST /posts — https://docs.postiz.com/public-api/posts/create
async function createFacebookPost({ content, images = [], schedule } = {}) {
  try {
    const body = {
      // "now" publishes immediately, "schedule" publishes at `date`, "draft" saves it.
      type: schedule ? "schedule" : "now",
      // Required, UTC ISO 8601. For "now" it just needs to be a valid datetime.
      date: (schedule ?? new Date()).toISOString(),
      shortLink: false,
      tags: [],
      posts: [
        {
          integration: { id: FACEBOOK_INTEGRATION_ID },
          value: [
            {
              content,
              // Each image: { id, path } — see listIntegrations / upload docs.
              image: images,
            },
          ],
          settings: { __type: "facebook" },
        },
      ],
    };

    const res = await fetch(`${CONFIG.BASE_URL}/posts`, {
      method: "POST",
      headers: {
        Authorization: CONFIG.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Create post failed:", res.status, err);
      throw new Error(res.status);
    }

    const data = await res.json();
    console.log("✅ Post created:", JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.error("Error:", err.message);
  }
}

// Publish now:
createFacebookPost({
  content: "🚀 Hello Facebook, posted via the Postiz public API!",
});

// Schedule 30 minutes from now:
// const when = new Date();
// when.setMinutes(when.getMinutes() + 30);
// createFacebookPost({
//   content: "⏳ Scheduled via the Postiz public API",
//   schedule: when,
// });

// With an image:
// createFacebookPost({
//   content: "📸 With media",
//   images: [{ id: "media-id", path: "https://example.com/image.jpg" }],
// });
