# Postiz vs PostProxy — Full Comparison

A feature-by-feature comparison for this use case: a **SaaS platform where your users
connect their own social channels and you publish/schedule on their behalf,
programmatically, per client.**

## TL;DR

**PostProxy** is an API-first, multi-tenant publishing **backend**. Clients are modeled as
**profile groups** that you create and manage entirely over the API, and a single publish
payload fans out to every platform.

**Postiz** is an end-user/open-source scheduling **app**. It has a public API, but it's a thin
surface — effectively four endpoints (list integrations, connect, upload, post). Its
multi-tenant concept, **"Customer groups," lives only in the UI and is not exposed over the
public API.**

For programmatic, multi-client/multi-tenant use → **PostProxy**. For a self-hosted, single-org
scheduling tool with AI authoring → **Postiz** is viable.

---

## ⚠️ The grouping gap (the deciding factor)

You asked specifically about creating groups. This is where the two products diverge hardest.

| | PostProxy | Postiz |
|---|---|---|
| Group concept | **Profile Group** (one per client/brand) | **Customer group** |
| Create a group **in the UI** | ✅ | ✅ |
| Create a group **via the API** | ✅ `POST /profile_groups` | ❌ **No endpoint** |
| Connect a channel **into** a specific group via API | ✅ `POST /profile_groups/{id}/initialize_connection` | ❌ Channels connect to the single org; no group param |
| List a group's channels via API | ✅ `GET /profiles?profile_group_id=` | ⚠️ `GET /integrations` returns the whole org, ungrouped |

- **PostProxy:** groups are first-class API objects — you can create a group, start a
  per-group OAuth connect flow, and list a group's channels entirely over the API.
- **Postiz:** the public API has **no group/customer/team object**. Connecting returns a
  single OAuth URL for the one org; you cannot create a customer or assign a channel to one
  over the API.

**Implication:** In Postiz you can *see* customer groups in the dashboard, but you **cannot
provision a new client, isolate their channels, or publish scoped-to-a-client purely through
code.** PostProxy is built around exactly this flow.

**How we resolve this in our app (if we self-host Postiz):** the missing group API is not a hard
blocker — we can model multi-tenancy in **our own application database** with `Organization` and
`Brand` entities, and map each Postiz channel (integration `id`) to a brand on our side. The grouping
then lives in our DB, and we filter `GET /integrations` by the channel IDs we've associated with a
given organization/brand. The trade-off vs PostProxy: we own that mapping, the provisioning logic,
and the channel-to-brand bookkeeping instead of getting it natively from the API.

---

## Full PostProxy feature list → Postiz equivalent

Status key: ✅ supported · ⚠️ limited / UI-only · ❌ not available

| PostProxy feature | PostProxy | Postiz (UI) | Postiz (public API) |
|---|---|---|---|
| **Profile / customer groups** | ✅ via API | ✅ UI only | ❌ no endpoint |
| **Create group programmatically** | ✅ `POST /profile_groups` | — | ❌ |
| **Per-group OAuth connect flow** | ✅ `initialize_connection` | ✅ UI connect | ⚠️ `GET /social/{integration}` (org-level, no group) |
| **Multi-tenant isolation** | ✅ native (group = client) | ⚠️ UI customers | ❌ |
| **Single payload → many platforms** | ✅ one publish endpoint | ✅ | ✅ `POST /posts` (per-platform `settings` block) |
| **Auto format conversion per platform** | ✅ | ⚠️ partial | ❌ you send platform-specific JSON |
| **Scheduling** | ✅ ~10 min – 30 days | ✅ | ✅ `type: "schedule"` |
| **Drafts** | ✅ | ✅ | ✅ `type: "draft"` |
| **Media upload** | ✅ | ✅ | ✅ `POST /upload` |
| **Facebook posts / Reels / Stories** | ✅ posts, reels, stories | ⚠️ posts | ⚠️ posts |
| **Webhooks** | ✅ post-event subscriptions | ✅ | ✅ |
| **Per-platform delivery results** | ✅ explicit per-platform outcomes | ⚠️ | ⚠️ |
| **Automatic retries / quota awareness** | ✅ deterministic retries | ❌ | ❌ you handle backoff |
| **Rate-limit handling** | ✅ queued & managed | ❌ | ⚠️ global 90/hr (100 cloud), not tiered |
| **OAuth token auto-refresh** | ✅ managed for you | ✅ | ✅ |
| **Official SDKs (Node/Python/Ruby)** | ✅ | — | ⚠️ REST only |
| **MCP / n8n / Make / Zapier** | ✅ | ⚠️ some | ⚠️ via REST |
| **AI copilot / AI image & video** | ❌ | ✅ | ❌ |
| **Advanced picture editor** | ❌ | ✅ | ❌ |
| **Analytics dashboard** | ⚠️ | ✅ | ⚠️ |
| **RSS auto-post / posting sets / signatures** | ❌ | ✅ | ❌ |
| **Self-hostable / open-source** | ❌ | ✅ | ✅ |
| **EU-hosted / GDPR** | ✅ | ⚠️ (self-host = your infra) | — |

---

## API surface comparison

| | PostProxy | Postiz (public API) |
|---|---|---|
| Base URL | `https://api.postproxy.dev/api` | `https://api.postiz.com/public/v1` |
| Auth | `Authorization: Bearer <key>` | `Authorization: <key>` (or `pos_` OAuth token) |
| Groups/customers | `POST /profile_groups`, `GET /profile_groups` | ❌ none |
| Connect a channel | `POST /profile_groups/{id}/initialize_connection` | `GET /social/{integration}` |
| List channels | `GET /profiles?profile_group_id=` | `GET /integrations` |
| Channel placements/targets | `GET /profiles/{id}/placements` | ❌ |
| Publish / schedule | `POST /posts?profile_group_id=` | `POST /posts` |
| Media upload | ✅ | `POST /upload` |
| Rate limits | managed/queued | global 90/hr (100 cloud), **not** tiered by plan |

Postiz's public API is essentially **4 endpoints** (`/integrations`, `/social/{integration}`,
`/upload`, `/posts`). PostProxy exposes the full group → connect → profile → publish lifecycle.

---

## How automatic retries work in PostProxy

This is one of PostProxy's main selling points over a thin API like Postiz's, so it's worth
spelling out what it actually does — and what its docs do and don't promise.

**What PostProxy states:**
> "Social networks have rate limits that PostProxy handles automatically. If a post hits a rate
> limit, PostProxy queues it and retries when possible." It advertises **"deterministic retries,
> explicit per-platform results"** and **"automatic retries, rate limit handling, quota
> awareness, and clear publish state reporting."**

**The model, in practice:**
1. **You make one publish call** (`POST /posts`) targeting multiple platforms. PostProxy accepts
   it and takes ownership of delivery — your request returns without you having to block on each
   network.
2. **Each platform is delivered independently** and tracked with its own state. A real example
   from their site: *Twitter published 12:33 · LinkedIn processing · Threads failed 12:33 →
   retry scheduled 12:34 → published 12:35.* One platform failing does **not** fail the others.
3. **On a rate-limit or transient failure, PostProxy queues the post and retries when the network
   is available again** — you don't implement backoff yourself. "Quota awareness" means it tracks
   each network's limits and paces delivery rather than hammering and erroring.
4. **"Deterministic retries"** = predictable, repeatable retry behavior (not random/best-effort),
   with each attempt logged with a timestamp and outcome.
5. **You observe the result** via per-platform publish state (polled or via **webhooks** on post
   events), so you know exactly which platforms succeeded, are processing, or failed.

**What the public docs do *not* specify:** exact backoff intervals, maximum retry count, idempotency
keys, or queue prioritization. So treat "managed retries" as a reliability layer that removes your
need to write retry logic — but don't assume specific guarantees (e.g. an exact attempt cap) without
confirming with PostProxy.

**Contrast — Postiz:** the public API has **no managed retry layer.** It enforces a global
**~90 req/hr (100 on cloud)** limit and returns errors; **you** are responsible for catching
failures, backing off, and re-posting. There is no per-platform retry queue on your behalf.

---

## Pricing

The two products price on **different axes**, so tiers don't line up one-to-one:

- **PostProxy** charges by **profile groups + profiles + posts/engagements** (multi-tenant scale).
- **Postiz** charges by **channels + AI quota**, with unlimited posts on most tiers and a **free
  self-hosted** option.

### PostProxy (annual price in parentheses)

| Tier | Monthly | Profile groups | Profiles | Posts/mo | Engagements/mo | SSO |
|---|---|---|---|---|---|---|
| Free | $0 | 2 | 22 | 10 | 20 | — |
| Build | $17 ($12) | 10 | 110 | 120 | 240 | — |
| Grow | $49 ($35) | 20 | 220 | Unlimited | Unlimited | — |
| Scale | $99 ($79) | 50 | 550 | Unlimited | Unlimited | ✅ |
| Enterprise | $699 ($559) | 500 | 5,500 | Unlimited | Unlimited | ✅ + onboarding |

(Profiles = up to 11 platforms per group.)

### Postiz (cloud, monthly)

| Tier | Monthly | Channels | Posts/mo | Team | AI images/mo | AI videos/mo |
|---|---|---|---|---|---|---|
| Standard | $29 | 5 | 400 | — | — | 3 |
| Team | $39 | 10 | Unlimited | Unlimited | 100 | 10 |
| Pro | $49 | 30 | Unlimited | Unlimited | 300 | 30 |
| Ultimate | $99 | 100 | Unlimited | Unlimited | 500 | 60 |

All Postiz cloud tiers include API, webhooks, customer groups (UI), analytics, cross-posting.
**Self-hosting Postiz is free** (open-source; you run the infra).

---

## Platform support

| | PostProxy | Postiz |
|---|---|---|
| Platforms | Instagram, Facebook, Threads, TikTok, X, YouTube, LinkedIn, Pinterest, Bluesky, Telegram, Google Business (11) | 30+ integrations (incl. the above, plus Mastodon, Discord, Slack, Warpcast, etc.) |

Postiz advertises more raw integrations; PostProxy covers the major 11 with deeper publishing
(e.g. Reels/Stories on Facebook/Instagram).

---

## Self-hosting Postiz: where each credential comes from

If you self-host Postiz, **you** register your own developer app on each platform and paste the
resulting OAuth client credentials into Postiz's env. PostProxy hides all of this — it provides the
apps and manages OAuth for you. With self-hosted Postiz, every platform below is a separate signup,
app creation, and (for most) an app-review/permissions process before it works in production.

> **Common requirement:** almost every platform requires you to register an **OAuth redirect /
> callback URL**. For Postiz that is typically `https://<your-domain>/integrations/social/<platform>`
> (or the platform's specific callback path). Use your real public domain; many platforms reject
> `localhost` for production apps.

| Env var(s) | Platform | Where to create it | Notes / gotchas |
|---|---|---|---|
| `X_API_KEY`, `X_API_SECRET` | X (Twitter) | [developer.x.com](https://developer.x.com) → Developer Portal → Project & App → Keys & Tokens | "API Key/Secret" = the app's consumer key/secret. Needs a paid Basic+ tier for write/post access. |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn | [linkedin.com/developers](https://www.linkedin.com/developers/apps) → Create app | Request the "Share on LinkedIn" / "Sign In with LinkedIn" products; needs app review for posting. |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Reddit | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) → create app → type **web app** | Client ID is under the app name; secret beside it. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub | [github.com Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) | Used by Postiz for login / GitHub integration. |
| `BEEHIIVE_API_KEY`, `BEEHIIVE_PUBLICATION_ID` | Beehiiv | Beehiiv dashboard → Settings → **API** (paid plans) | Not OAuth — an API key + the publication ID you publish to. |
| `THREADS_APP_ID`, `THREADS_APP_SECRET` | Threads | [developers.facebook.com](https://developers.facebook.com/apps) → create app → add **Threads API** use case | Meta app; separate from the Facebook/IG product but same developer portal. |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Facebook (+ Instagram) | [developers.facebook.com](https://developers.facebook.com/apps) → create app → add **Facebook Login** + Pages/IG products | Requires Business Verification and App Review for `pages_manage_posts`, `instagram_content_publish`, etc. The big one. |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | YouTube | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → enable **YouTube Data API v3** → OAuth client ID | Needs OAuth consent screen + Google verification for the upload scope. |
| `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` | TikTok | [developers.tiktok.com](https://developers.tiktok.com) → create app → **Content Posting API** | "Client key/secret"; Content Posting API requires audit/approval. |
| `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` | Pinterest | [developers.pinterest.com](https://developers.pinterest.com) → create app | App starts in trial; request standard access for production. |
| `DRIBBBLE_CLIENT_ID`, `DRIBBBLE_CLIENT_SECRET` | Dribbble | [dribbble.com/account/applications/new](https://dribbble.com/account/applications/new) | Straightforward OAuth app registration. |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN_ID` | Discord | [discord.com/developers/applications](https://discord.com/developers/applications) → New Application → OAuth2 (+ **Bot** tab for the token) | Client ID/secret from OAuth2; the bot token is generated on the Bot tab. |
| `SLACK_ID`, `SLACK_SECRET`, `SLACK_SIGNING_SECRET` | Slack | [api.slack.com/apps](https://api.slack.com/apps) → Create New App → **Basic Information** | `SLACK_ID` = Client ID, `SLACK_SECRET` = Client Secret, `SLACK_SIGNING_SECRET` = Signing Secret (all on Basic Information). |
| `MASTODON_URL`, `MASTODON_CLIENT_ID`, `MASTODON_CLIENT_SECRET` | Mastodon | Your instance → **Preferences → Development → New application** | `MASTODON_URL` is the instance (default `https://mastodon.social`); create the app *on that instance* to get the client id/secret. |

**Practical takeaway:** this table is the real cost of self-hosting Postiz — ~14 platforms ×
(developer account + app creation + redirect URL + app review). Facebook/Instagram, YouTube, TikTok,
and X in particular gate posting behind verification/audit and (for X) a paid tier. **PostProxy
removes this entire column** — its hosted OAuth apps are already approved, so you only run the
connect flow. That convenience is a core part of what you pay PostProxy for.

---

## When to choose which

**Choose PostProxy if:**
- You're building a SaaS where **your users connect their own channels** and you publish per client.
- You need to **create and manage client groups programmatically** (provision, isolate, scope).
- You want **one payload → all platforms**, auto format conversion, and managed retries/rate limits.
- You need **engagement** (comments, DMs, reviews) over the API.

**Choose Postiz if:**
- You want a **self-hosted, open-source** scheduler for a **single organization**.
- You value **AI authoring** (copilot, AI images/videos) and an advanced editor.
- A thin API for "connect channels + post" is enough, and you don't need API-driven multi-tenancy.

**Bottom line:** Postiz cannot replace PostProxy for an API-driven multi-tenant SaaS — the
**absence of a group/customer API** is the dealbreaker. PostProxy is purpose-built for it.
