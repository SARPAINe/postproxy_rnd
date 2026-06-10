# PostProxy API — Developer Integration Guide

How to integrate the **PostProxy** API (`https://api.postproxy.dev/api`) into your SaaS, following the
end-user journey: **onboard → connect a social account → confirm what can be posted → publish / schedule.**

> Mental model: each **end-user (or workspace) in your SaaS maps to one PostProxy _profile group_**.
> Inside a group live the **profiles** (the user's connected social accounts), and each profile exposes
> **placements** (the concrete destinations you can target, e.g. a specific Facebook page).

---

## 0. Prerequisites

### Authentication
Every request is authenticated with your PostProxy API key as a Bearer token:

```http
Authorization: Bearer <POSTPROXY_API_KEY>
Content-Type: application/json
```

Keep the key server-side only. In this repo it is read from the repo-root `.env`:

```bash
# .env
POSTPROXY_API_KEY=your_key_here
POSTPROXY_BASE_URL=https://api.postproxy.dev/api   # optional, this is the default
```

> **Security:** the API key grants full account access. Never ship it to the browser/mobile client —
> proxy all PostProxy calls through your own backend.

### Base URL
```
https://api.postproxy.dev/api
```

---

## The onboarding journey at a glance

| Step | When it happens | Endpoint | Result you store |
|------|-----------------|----------|------------------|
| 1. Create profile group | User signs up / creates a workspace | `POST /profile_groups` | `profile_group_id` |
| 2. Start account connection | User clicks "Connect Facebook/X/…" | `POST /profile_groups/{id}/initialize_connection` | OAuth connect URL |
| 3. User authorizes | User returns via your `redirect_url` | — (handled by PostProxy OAuth) | — |
| 4. List connected profiles | After redirect / on dashboard load | `GET /profiles?profile_group_id={id}` | `profile_id`s |
| 5. List placements | Before composing a post | `GET /profiles/{id}/placements` | `page_id`s etc. |
| 6. Publish or schedule | User hits "Post" | `POST /posts?profile_group_id={id}` | `post_id` |

---

## Step 1 — Provision a profile group (sign-up)

Create one profile group per end-user/workspace at onboarding. Persist the returned
`profile_group_id` against that user in your database — it is the handle for every later call.

```http
POST /profile_groups
```
```json
{
  "profile_group": {
    "name": "Acme Co — user_12345"
  }
}
```

```js
async function createProfileGroup(name) {
  const res = await fetch(`${BASE_URL}/profile_groups`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ profile_group: { name } }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // → contains the new profile_group_id
}
```

> Tip: encode your own user ID in the `name` so groups are traceable back to your records.
> You can re-list all groups any time with `GET /profile_groups`.

---

## Step 2 — Start a social-account connection (OAuth)

When the user clicks "Connect Facebook" (or X, LinkedIn, etc.), ask PostProxy to begin an OAuth
handshake for that platform. You pass a `redirect_url` — your own callback page where the user lands
after authorizing.

```http
POST /profile_groups/{profile_group_id}/initialize_connection
```
```json
{
  "platform": "facebook",
  "redirect_url": "https://app.yoursaas.com/oauth/callback"
}
```

```js
async function initializeConnection(groupId, platform, redirectUrl) {
  const res = await fetch(`${BASE_URL}/profile_groups/${groupId}/initialize_connection`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ platform, redirect_url: redirectUrl }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // → contains the connect URL to redirect the user to
}
```

**What to do with the response:** take the returned connect URL and redirect the user's browser to it.
PostProxy handles the platform's OAuth consent screen.

Supported `platform` values include `facebook`, `twitter`, `linkedin`, etc.

---

## Step 3 — Handle the OAuth redirect

After the user authorizes, PostProxy sends them back to your `redirect_url`. At this point the social
account is attached to the profile group as a **profile**. Your callback page should simply route the
user back into your app and trigger Step 4 to refresh their connected accounts.

> Set `redirect_url` to a page you control and that is registered/allowed in your PostProxy app config.

---

## Step 4 — List connected profiles

Read which accounts are now connected inside the group. Each profile has a `profile_id` you'll use as a
posting target.

```http
GET /profiles?profile_group_id={profile_group_id}
```

```js
async function getProfiles(groupId) {
  const res = await fetch(`${BASE_URL}/profiles?profile_group_id=${groupId}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // → list of profiles (each with a profile_id + platform)
}
```

---

## Step 5 — List a profile's placements

Some platforms post to a sub-destination rather than the account itself (e.g. a **Facebook Page** vs. a
personal profile). Fetch placements to discover those targets — notably the `page_id` you'll need for
Facebook pages.

```http
GET /profiles/{profile_id}/placements?profile_group_id={profile_group_id}
```

```js
async function getProfilePlacements(profileId, groupId) {
  const res = await fetch(
    `${BASE_URL}/profiles/${profileId}/placements?profile_group_id=${groupId}`,
    { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // → placements, e.g. Facebook page_ids
}
```

---

## Step 6 — Publish a post

Now the user composes and posts. One call fans the post out to multiple targets at once.

```http
POST /posts?profile_group_id={profile_group_id}
```
```json
{
  "post": {
    "body": "🚀 Launching today!"
  },
  "profiles": ["facebook", "twitter"],
  "platforms": {
    "facebook": { "page_id": "331147600403460" }
  },
  "media": [
    "https://example.com/image.jpg"
  ]
}
```

### Field reference
| Field | Required | Notes |
|-------|----------|-------|
| `post.body` | ✅ | The text content of the post. |
| `profiles` | ✅ | Targets: either **platform names** (`"facebook"`, `"twitter"`) or specific **profile IDs** (`"RYvUjp"`). |
| `platforms.facebook.page_id` | conditionally | **Required when posting to a Facebook page.** Comes from Step 5 placements. |
| `media` | optional | Array of publicly reachable media URLs (images/video). |
| `post.scheduled_at` | optional | See Step 7 — presence of this field turns a publish into a schedule. |

```js
async function publishNow(groupId, payload) {
  const res = await fetch(`${BASE_URL}/posts?profile_group_id=${groupId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // → created post
}
```

---

## Step 7 — Schedule a post (instead of publishing now)

Scheduling is the **same call** as publishing — just add an ISO-8601 `post.scheduled_at`:

```json
{
  "post": {
    "body": "⏳ This goes out later",
    "scheduled_at": "2026-06-10T18:30:00.000Z"
  },
  "profiles": ["RYvUjp"],
  "platforms": {
    "facebook": { "page_id": "331147600403460" }
  }
}
```

```js
const scheduledTime = new Date();
scheduledTime.setMinutes(scheduledTime.getMinutes() + 30);

await publishNow(groupId, {
  post: { body: "⏳ This goes out later", scheduled_at: scheduledTime.toISOString() },
  profiles: ["RYvUjp"],
  platforms: { facebook: { page_id: "331147600403460" } },
});
```

> Always send `scheduled_at` as a UTC ISO string (`Date#toISOString()`).

---

## Error handling

Responses are not always JSON on failure — read the body as text before parsing so you don't mask the
real error:

```js
if (!res.ok) {
  const errorText = await res.text(); // may be plain text / HTML on 4xx/5xx
  throw new Error(`PostProxy ${res.status}: ${errorText}`);
}
```

Recommended handling per status:
- **401 / 403** — bad or missing API key.
- **404** — wrong `profile_group_id` / `profile_id`.
- **422** — invalid payload (e.g. Facebook page post missing `page_id`).
- **5xx** — retry with backoff; don't double-publish (treat as possibly-succeeded).

---

## End-to-end pseudo-flow for your SaaS backend

```text
onSignup(user):
    group = POST /profile_groups { name: "user_" + user.id }
    save user.profile_group_id = group.id

onConnectClick(user, platform):
    { url } = POST /profile_groups/{user.profile_group_id}/initialize_connection
                   { platform, redirect_url: OUR_CALLBACK }
    redirect(user → url)

onOAuthCallback(user):
    profiles = GET /profiles?profile_group_id={user.profile_group_id}
    for each fb profile: placements = GET /profiles/{id}/placements
    show connected accounts + selectable pages

onPost(user, draft):
    POST /posts?profile_group_id={user.profile_group_id}
         { post: { body, [scheduled_at] }, profiles, platforms, media }
```

---

*The runnable reference implementations for each step live alongside this guide in `postProxy/`
(`createProfileGroup.js`, `getConnectUrl.js`, `getProfileGroups.js`, `createPost.js`).*
