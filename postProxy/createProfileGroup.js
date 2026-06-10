import { CONFIG } from "./config.js";

async function createProfileGroup(userId) {
  const res = await fetch(`${CONFIG.BASE_URL}/profile_groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONFIG.API_KEY}`
    },
    body: JSON.stringify({
      profile_group:{
        name: `penta solutions-${userId}`
      }
    })
  });

  const data = await res.json();
  console.log("Profile Group Created:", data);

  return data; // should contain profile_group_id
}

// test run
createProfileGroup("1");