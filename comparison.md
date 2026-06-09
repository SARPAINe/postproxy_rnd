# Postproxy vs Postiz: SaaS Social Media API Comparison

**Purpose**: Evaluate Postiz as an alternative to Postproxy for building a SaaS platform where users connect Facebook Pages and schedule posts.

**Key Finding**: Postproxy is **built for SaaS integration** while Postiz is **built for direct user adoption**. Postiz cannot replace Postproxy for our use case.

---

## Feature Comparison Table

| Feature | Postproxy | Postiz |
|---------|-----------|--------|
| **Primary Use Case** | Unified API for SaaS platforms | Social media scheduling tool for end users |
| **Facebook Pages Support** | ✅ Posts, Reels, Stories | ✅ Posts only |
| **Direct User OAuth to Your SaaS** | ✅ Yes - users connect FB Pages directly via your OAuth flow | ❌ No - users must have Postiz account first |
| **Multi-Tenant SaaS Architecture** | ✅ Native - Profile Groups for clients/brands | ❌ No - single Postiz organization per API key |
| **Single Publishing Endpoint** | ✅ One endpoint for all platforms | ❌ Multiple endpoints (`/posts`, `/integrations`, `/upload`) |
| **Scheduling Support** | ✅ Yes - 10 min to 30 days | ✅ Yes - via `type: "schedule"` |
| **OAuth2 for Third-Party Apps** | ✅ Yes - built for SaaS | ⚠️ Yes - but for users' own Postiz org |
| **Webhooks** | ✅ Yes - post event subscriptions | ✅ Yes - webhook support |
| **Comments API** | ✅ Read/reply to comments | ✅ Post comments feature |
| **Direct Messages** | ✅ Facebook Messenger, Instagram, Telegram | ❌ No |
| **Rate Limit Handling** | ✅ Automatic - queues & retries | ⚠️ Manual - 90-100 req/hr, you handle backing off |
| **Error Handling** | ✅ Automatic retries, error categorization | ❌ Manual - you implement retry logic |
| **Auto Format Conversion** | ✅ Yes - adapts content per platform | ❌ No - you provide platform-specific JSON |
| **Free Tier** | ✅ $0/mo - 10 posts/month, 2 Profile Groups | ✅ Free - but limited channels/posts |
| **Self-Hostable** | ❌ No | ✅ Yes - open-source |

---

## Critical Differences

### 1. User Authentication Flow

**Postproxy**
User on our app → Click "Connect Facebook" →
Facebook OAuth (through our app) →
User selects Facebook Page →
Page connected directly to OUR SaaS

text
- Users never see Postproxy
- We manage customer accounts via Profile Groups

**Postiz (❌ Not suitable):**
User → Sign up for Postiz separately →
Connect Facebook Pages in Postiz UI →
Gets Postiz API key →
text
- Users must have Postiz account first
- You cannot manage multiple customer accounts
