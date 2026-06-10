# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

R&D scratchpad for exploring the **PostProxy** API (`https://api.postproxy.dev/api`), a service for managing social-media profile groups and publishing/scheduling posts across platforms (Facebook, Twitter, LinkedIn, etc.). There is no application here — each file is a self-contained script that exercises one or two API endpoints. Scripts are grouped by service: `postProxy/` for the PostProxy API, `postiz/` for the Postiz API.

## Running scripts

ES modules (`"type": "module"`), run directly with Node's built-in `fetch` (no dependencies):

```bash
node postProxy/createProfileGroup.js
node postProxy/getConnectUrl.js
node postProxy/getProfileGroups.js
node postProxy/createPost.js
```

There is no build, lint, or test setup (`npm test` is a placeholder that exits 1).

## How these scripts work

Each file defines async functions but **invokes one at the bottom with hardcoded arguments** (e.g. `getProfiles("qDaFAA")`, `publishNow()`). To exercise a different function or input, edit/uncomment the call at the bottom of the file rather than passing CLI args. Commented-out call lines (e.g. `// schedulePost();`) are alternate entry points kept for reference.

Each service folder has its own `config.js` that loads the repo-root `.env` and exports `CONFIG` with `BASE_URL` and `API_KEY`; every script imports it and sends `Authorization: Bearer ${API_KEY}`.

## API workflow (the order these scripts model)

1. `postProxy/createProfileGroup.js` → `POST /profile_groups` creates a group, returns a `profile_group_id`.
2. `postProxy/getConnectUrl.js` → `POST /profile_groups/{id}/initialize_connection` starts an OAuth connection for a platform, returning a connect URL.
3. `postProxy/getProfileGroups.js` → lists groups (`GET /profile_groups`), profiles within a group (`GET /profiles?profile_group_id=`), and a profile's placements (`GET /profiles/{id}/placements`).
4. `postProxy/createPost.js` → `POST /posts?profile_group_id=` publishes now, or schedules by adding `post.scheduled_at` (ISO string). Targets are given via `profiles` (platform names or profile IDs); `platforms.facebook.page_id` is required for Facebook pages.

IDs like `qDaFAA` (a profile group) and `RYvUjp` (a profile) are live test values hardcoded throughout.
