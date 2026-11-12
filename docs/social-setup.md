# Connecting the pages that posts go out on

There are two ways in, and they end in the same encrypted row:

| | Who it is for | What it needs |
|---|---|---|
| **[Connect through Facebook](#the-owner-facing-way-connect-through-facebook)** | the hotel owner, in the product | a Meta app configured on the server, once |
| **[Paste a page token](#the-manual-way-paste-a-page-token)** | us: setup, support, a demo with no app | nothing but a browser |

**A hotel owner should be sent down the first one.** The second asks someone to open Graph API Explorer, grant six scopes and copy a credential out of a JSON response, which is fine for a developer and not something to ask of a customer. It is kept because it needs no Meta app at all, which is what let everything downstream be finished before there was one (M11), and because it is still the fastest way to connect a page by hand when something is wrong.

Both store the same thing. `POST /hotels/:hotelId/social-accounts` wants two things per page:

| Field | Facebook | Instagram |
|---|---|---|
| `accountName` | the **Page id** | the **Instagram Business account id** |
| `accessToken` | a **Page access token** | the same Page access token |

Neither is the display name or the `@handle`. Both are numeric ids.

## The thing worth knowing first

**App review is only needed to act on a page the app's own team does not administer.**

While a Meta app is in **Development mode**, it can do everything it asks for — but only on behalf of people who hold a role in it (Admin, Developer, Tester) and only on pages *they* administer. For a demo, a thesis defence or any hotel whose page you administer yourself, that is enough: add the account as a Tester, generate the token, paste it in, and posts go out for real.

Review and Business Verification become necessary the moment a hotel that is *not* on your app wants to connect its own page. That is weeks of waiting and can be refused, which is why it was kept off the critical path (M6).

## The owner-facing way: connect through Facebook

Three requests, and the owner never sees a token (M16):

```
GET  /hotels/:hotelId/social-accounts/facebook/authorize
       -> { authorizeUrl }            open it in the browser

     [ Facebook asks the owner which pages this app may post to ]
     [ it sends the browser to META_OAUTH_REDIRECT_URI?code=...&state=... ]

POST /hotels/:hotelId/social-accounts/facebook/exchange
       { code, state }
       -> { connectionToken, pages: [{ pageId, name, instagramId, connected }] }

POST /hotels/:hotelId/social-accounts/facebook/connect
       { connectionToken, pages: [{ pageId: "...", instagram: true }] }
       -> the connected accounts, tokens already encrypted
```

**Why the browser posts the code back instead of Facebook redirecting at the API.** A redirect carries no `Authorization` header, so a `GET /callback` would arrive unauthenticated and have to trust `state` for identity as well as for integrity. `META_OAUTH_REDIRECT_URI` is therefore a page in the frontend: it reads `code` and `state` out of its own query string and posts them to the API inside the owner's session. `state` is then left doing only what it is good at - it is encrypted with the hotel id in it, so a code obtained while connecting hotel A cannot be replayed onto hotel B by someone who owns both.

`connectionToken` is the user access token, encrypted, with ten minutes on it. It stands in for the token so the browser never holds one, and step three reads the pages from Facebook again rather than trusting anything handed back - a page the owner removed the app from in between is simply not in the answer.

### Setting it up, once for the whole system

1. An app (the same one as step 1 below), with **Facebook Login** added as a product.
2. **Facebook Login → Settings → Valid OAuth Redirect URIs**: add `META_OAUTH_REDIRECT_URI` exactly, including the scheme and any trailing slash. A mismatch here is the most common failure, and Facebook's message for it names the URI it expected.
3. Fill in `backend/.env`:

```
META_APP_ID=…
META_APP_SECRET=…
META_OAUTH_REDIRECT_URI=http://localhost:5173/social/facebook/callback
```

Leave `META_APP_ID` empty and those three endpoints answer `503 SOCIAL_OAUTH_DISABLED` while pasting keeps working.

### What app review actually gates

In **Development mode** this flow is real for anyone holding a role in the app - Admin, Developer or Tester - on the pages they administer. So **a hotel can connect its own page through the product today**, without review: invite their Facebook account under **App Roles → Testers**, they accept, and the button works.

Review and **Business Verification** are what open it to hotels outside the app. Verification wants a registered legal entity, which is a company matter rather than a code matter - so it was kept off the critical path, and nothing changes in the code when it clears: leaving Development mode is the whole migration.

## The manual way: paste a page token

This is the same credential by a slower route - it is what the three requests above do on the owner's behalf.

### 1. An app

[developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App** → use case **Other** → type **Business**. Note the **App ID** and **App Secret** from Settings → Basic; step 3 needs both.

### 2. A short-lived user token with the right permissions

Open the [Graph API Explorer](https://developers.facebook.com/tools/explorer), pick your app, then add these permissions and click **Generate Access Token**:

| Permission | Why |
|---|---|
| `pages_show_list` | to find the Page id at all |
| `pages_manage_posts` | to publish |
| `pages_read_engagement` | likes, comments and shares |
| `read_insights` | impressions, which is the `views` figure |
| `instagram_basic`, `instagram_content_publish` | only if Instagram is also being connected |

What you get is a **user** token that lasts an hour or two. It is not what to paste.

### 3. Make it long-lived

Exchange the short-lived user token for a 60-day one:

```
GET https://graph.facebook.com/v26.0/oauth/access_token
      ?grant_type=fb_exchange_token
      &client_id=<APP_ID>
      &client_secret=<APP_SECRET>
      &fb_exchange_token=<the token from step 2>
```

### 4. Read the Page tokens off it

```
GET https://graph.facebook.com/v26.0/me/accounts?access_token=<the 60-day user token>
```

Every page comes back with its own `id` and its own `access_token`. **A Page token derived from a long-lived user token does not expire.** That pair — `id` → `accountName`, `access_token` → `accessToken` — is what to paste, with `expiresAt` left out.

### 5. Check it before pasting

```
GET https://graph.facebook.com/debug_token
      ?input_token=<the page token>
      &access_token=<APP_ID>|<APP_SECRET>
```

`expires_at: 0` means it does not expire. Confirm the `scopes` list holds the permissions from step 2 — a token missing `read_insights` publishes fine and then reports every post as 0 views.

## Instagram: the same token, a different id

Through the owner-facing flow this is one field: `instagram: true` on a page whose `instagramId` is not null. By hand, it is one extra call.

Instagram publishing goes through the Facebook Page, so there is no second token either way. Two prerequisites:

1. The Instagram account is a **Business** or **Creator** account, not personal (Instagram app → Settings → Account type).
2. It is **linked to the Facebook Page** (Page → Settings → Linked accounts).

Then ask the Page for the linked account's id:

```
GET https://graph.facebook.com/v26.0/<PAGE_ID>
      ?fields=instagram_business_account
      &access_token=<the page token>
```

`instagram_business_account.id` is the `accountName`. The `accessToken` is the same Page token.

**Instagram has no text-only post.** Content scheduled to Instagram without a `mediaUrl` is refused with `501 SOCIAL_PLATFORM_UNSUPPORTED` before anything is sent, so the staff member is told to attach a photo rather than shown a Meta error code. The URL has to be publicly reachable — Instagram fetches the image itself, which is why generated content keeps a Cloudinary link rather than a local file.

## TikTok: not built, on purpose

A hotel can connect a TikTok account and schedule for it; the post will fail with `501 SOCIAL_PLATFORM_UNSUPPORTED` and the reason on the row. Two things stand in the way, and neither is work we skipped:

- **Its Content Posting API takes a video.** There is no text post. The AI writer produces words, and `marketing_content` carries no video, so a TikTok publisher would be a method that always fails (M12).
- **Direct posting needs an audited app.** Before the audit, an unaudited app may only post content that stays private to the account that owns it — which is not publishing.

If TikTok becomes a requirement, the order is: video on `marketing_content` → the audit request → the publisher. The registry already has the slot.

## Where this goes in the project

```
backend/.env
  META_GRAPH_VERSION=v26.0          # must be a version your app may call
  META_APP_ID=…                     # empty: the connect flow answers 503, pasting still works
  META_APP_SECRET=…                 # never leaves the server
  META_OAUTH_REDIRECT_URI=…         # must match the app's Valid OAuth Redirect URIs exactly
  BENEFICIARY_ENCRYPTION_KEY=…      # encrypts the tokens, the state and the connection token
```

Then, as the hotel's owner:

```
POST /api/v1/hotels/:hotelId/social-accounts
{ "platform": "FACEBOOK", "accountName": "<PAGE_ID>", "accessToken": "<PAGE_TOKEN>" }
```

The token is encrypted on the way in and has **no field in any response**: it is read only to hand to a publisher. Connecting is an owner's decision, not a staff member's, because the page posts under the hotel's name.

## When it stops working

| What you see | What it means |
|---|---|
| `usable: false` on the page | the stored `expiresAt` has passed; the publisher skips it. Reconnect |
| `failureReason: "…has no usable token: reconnect it"` | same, caught before the platform was called |
| `Error validating access token: Session has expired` | the platform rejected it. A user token was pasted instead of a Page token, or the password changed |
| `(#200) Requires pages_manage_posts` | step 2's permissions were not all granted |
| Published fine, `views: 0` forever | `read_insights` is missing from the token's scopes |
| `503 SOCIAL_OAUTH_DISABLED` | `META_APP_ID`, `META_APP_SECRET` or `META_OAUTH_REDIRECT_URI` is empty on the server |
| `400 SOCIAL_OAUTH_INVALID`, "not one we started" | the `state` or `connectionToken` was not signed by this server, or the key changed |
| `400 SOCIAL_OAUTH_INVALID`, "expired" | more than 15 minutes on the consent screen, or 10 minutes picking pages. Start again |
| `502` quoting "URL blocked" or "redirect_uri" | the redirect URI is not on the app's Valid OAuth Redirect URIs, character for character |
| `502 SOCIAL_OAUTH_FAILED`, "No Facebook Page" | the account administers no page, or declined the page on the consent screen |
| `400` naming a page, "no Instagram Business account" | that page has no linked Instagram; the page list says so in `instagramId` |

`failureReason` always carries the platform's own words, so the row says which of these it is instead of leaving an owner to guess.

> Meta retires a Graph API version roughly every two years and moves these screens around more often than that. The ids, the permissions and the exchange flow have been stable for years; if a URL in here 404s, the current path is in Meta's [Graph API changelog](https://developers.facebook.com/docs/graph-api/changelog).
