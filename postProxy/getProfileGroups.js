import { CONFIG } from "./config.js";

async function getProfileGroups() {
  const res = await fetch(`${CONFIG.BASE_URL}/profile_groups`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONFIG.API_KEY}`
    },
  });

  const data = await res.json();

  console.log("Fetched Profile Groups:");
  console.log(data);
}

async function getProfiles(profile_group_id){
    const res = await fetch(`${CONFIG.BASE_URL}/profiles?profile_group_id=${profile_group_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CONFIG.API_KEY}`
        },
      });
    
      const data = await res.json();
    
      console.log("Fetched Profiles:");
      console.log(data); 
}

async function getProfilePlacements(id, profile_group_id){
    const res = await fetch(`${CONFIG.BASE_URL}/profiles/${id}/placements?profile_group_id=${profile_group_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CONFIG.API_KEY}`
        },
      });
    
      const data = await res.json();
    
      console.log("Fetched Profile Placements:");
      console.log(data); 
}

// test
getProfileGroups();
// getProfiles("qDaFAA");
// getProfilePlacements("RYvUjp", "qDaFAA");