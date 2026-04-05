# Claux — Master Project Map
> **Base URL:** `https://claux.automizemedialabs.com`  
> Last updated: April 2026  
> Owner: Mayank Chansouria — 7smedtech@gmail.com

---

## 1. 🌐 Public-Facing Pages

| Route Name | Live URL | Purpose | Access |
|---|---|---|---|
| **Home** | [/](https://claux.automizemedialabs.com) | Main landing page — hero, features, testimonials, and CTA. | Public |
| **Pricing** | [/pricing](https://claux.automizemedialabs.com/pricing) | Full plan comparison (Starter / Growth / Dominator) with savings calculator and FAQ. | Public |
| **FAQ** | [/faq](https://claux.automizemedialabs.com/faq) | Standalone FAQ page for common product and billing questions. | Public |
| **Demo Page** | [/demo](https://claux.automizemedialabs.com/demo) | Gated demo video page shown after a visitor submits the lead capture form. | Public (post lead-gate) |
| **Case Studies** | [/case-studies/[id]](https://claux.automizemedialabs.com/case-studies/1) | Dynamic case study pages for individual client success stories. | Public |

---

## 2. 📣 Influencer Funnel

| Route Name | Live URL | Purpose | Access |
|---|---|---|---|
| **Affiliate Sign-Up** | [/affiliates](https://claux.automizemedialabs.com/affiliates) | Recruitment landing page where influencers and doctors apply to become Claux partners. | Public |
| **Referral Redirect** | [/ref/[code]](https://claux.automizemedialabs.com/ref/YOURCODE) | Smart redirect link that logs a click, sets a tracking cookie, and sends the visitor to the Partner Offer page. Share this link with audiences. | Public (tracked) |
| **Partner Offer Page** | [/partner-offer](https://claux.automizemedialabs.com/partner-offer) | Gated, high-FOMO pricing page shown to visitors who arrive via a referral link — includes a lead capture form, demo video, and discounted Razorpay checkout buttons. | Public (gated via lead form) |

### How the Funnel Works
```
Influencer shares  →  /ref/[code]  →  Cookie set + click logged
                                    ↓
                         /partner-offer?affiliate_code=CODE
                                    ↓
                    Lead fills form  →  POST /api/affiliate/partner-offer
                                    ↓
                    Clicks "Buy Now"  →  Razorpay link with ?notes[affiliate_code]=CODE
                                    ↓
                    Payment captured  →  Webhook  →  Commission credited
```

---

## 3. 🤝 Partner Portal (Influencer Login Area)

| Route Name | Live URL | Purpose | Access |
|---|---|---|---|
| **Partner Login** | [/affiliate/login](https://claux.automizemedialabs.com/affiliate/login) | Supabase-powered login page for partners — supports email/password and magic link sign-in. | Partner |
| **Partner Dashboard** | [/affiliate/dashboard](https://claux.automizemedialabs.com/affiliate/dashboard) | Full affiliate dashboard showing Total Earnings, This Month, Pending Payout, Total Referrals, link stats (clicks / sign-ups / paid), daily earnings chart, and recent referral table. | Partner only |

> **Auth flow:** Partners sign up via `/affiliates` → Supabase creates a user → they log in at `/affiliate/login` → session stored in `localStorage` → dashboard fetches data from `/api/affiliate/dashboard` using a Bearer token.

---

## 4. 🛡️ Admin Command Center

| Route Name | Live URL | Purpose | Access |
|---|---|---|---|
| **Admin Login** | [/login](https://claux.automizemedialabs.com/login) | Shared login page (also used for admin) — password or magic link. Redirects to `/admin/affiliates` on success. | Admin |
| **Affiliate Management** | [/admin/affiliates](https://claux.automizemedialabs.com/admin/affiliates) | Full admin control panel — Stats ribbon (total affiliates, total sales, pending payouts), partner table with Approve and Change Tier actions, and Pending Payouts table with Mark as Paid button. | Admin only (`7smedtech@gmail.com`) |

> **Protection:** The admin page checks the Supabase session client-side. Non-authed visitors are redirected to `/login`. Users signed in with the wrong email see an "Access Denied" screen with a sign-out button.

---

## 5. ⚙️ Backend API Pipes

### Affiliate APIs

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/affiliates/apply` | `POST` | Receives the partner sign-up form, creates an entry in `affiliates.affiliates` and `affiliates.affiliate_links`. | Public |
| `/api/affiliate/referrer` | `GET` | Returns the full name of an affiliate by their code — used by the Partner Offer page to display the referrer's name in the banner. | Public |
| `/api/affiliate/partner-offer` | `POST` | Captures lead data from the Partner Offer page form and inserts into `affiliates.referrals`. | Public |
| `/api/affiliate/dashboard` | `GET` | Returns the full dashboard data payload for the logged-in partner (earnings, referrals, link stats). | Partner (Bearer token) |

### Admin APIs

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/admin/affiliates` | `GET` | Returns all rows from `affiliates.affiliates` plus computed stats (total affiliates, total commissions, pending payouts). | Admin |
| `/api/admin/affiliates/[code]` | `PATCH` | Actions: `approve` (sets `status=active`) or `change_tier` (sets `current_tier` to BRONZE / SILVER / GOLD). | Admin |
| `/api/admin/commissions` | `GET` | Returns all rows from `affiliates.commissions` where `payout_status = 'pending'`. | Admin |
| `/api/admin/commissions/[id]` | `PATCH` | Marks a commission as paid (`payout_status = 'paid'`), stamps `paid_at`, and decrements `pending_payout` on the affiliate record. | Admin |

### Webhooks

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/api/webhooks/razorpay` | `POST` | Receives `payment.captured` events from Razorpay. Verifies HMAC-SHA256 signature, runs 3-step attribution (notes → referrals email → standard sale), calculates commission by tier, inserts into `affiliates.commissions`, and updates `total_earnings` + `pending_payout` on the affiliate record. | Razorpay signature (`RAZORPAY_WEBHOOK_SECRET`) |

### Utility

| Endpoint | Method | Purpose | Auth |
|---|---|---|---|
| `/ref/[code]` | `GET` (redirect) | Logs a click to `affiliates.affiliate_links`, sets a tracking cookie, and issues a 307 redirect to the Partner Offer page. | Public |
| `/api/test-affiliate` | `GET` | Development/debug endpoint for testing affiliate data flows. | Internal |

---

## 6. 🗄️ Supabase Schema Reference

All affiliate data lives in the **`affiliates`** Postgres schema (not the default `public`).

| Table | Key Columns | Purpose |
|---|---|---|
| `affiliates.affiliates` | `affiliate_code`, `full_name`, `email`, `current_tier`, `status`, `total_earnings`, `pending_payout`, `content_niche` | One row per partner — source of truth for identity, tier, and balances. |
| `affiliates.affiliate_links` | `affiliate_code`, `clicks`, `sign_ups`, `paid`, `conversion_rate` | Tracks link performance stats per partner. |
| `affiliates.referrals` | `affiliate_code`, `email`, `full_name`, `whatsapp`, `referral_status`, `source` | Every lead captured via the Partner Offer page form. |
| `affiliates.commissions` | `affiliate_code`, `payment_id`, `amount`, `commission_amount`, `rate`, `payout_status`, `payer_email` | One row per Razorpay payment attributed to a partner. |

---

## 7. 🔑 Environment Variables Checklist

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All client + server code | Required everywhere |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth (login, dashboard page) | Public — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | All server API routes | **Secret — never expose client-side** |
| `RAZORPAY_WEBHOOK_SECRET` | `/api/webhooks/razorpay` | Get from Razorpay Dashboard → Webhooks |
| `NEXT_PUBLIC_SITE_URL` | `/ref/[code]` redirects | Set to `https://claux.automizemedialabs.com` |
| `NEXT_PUBLIC_PARTNER_OFFER_URL` | `/ref/[code]` redirect target | Set to `https://claux.automizemedialabs.com/partner-offer` |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin panel auth check | Defaults to `7smedtech@gmail.com` if unset |

---

## 8. 🎯 Shareable Links for Influencers

Copy-paste these templates when onboarding a new partner:

```
Your personal referral link:
https://claux.automizemedialabs.com/ref/THEIR_CODE

Your partner dashboard:
https://claux.automizemedialabs.com/affiliate/dashboard

Login here:
https://claux.automizemedialabs.com/affiliate/login
```

> Replace `THEIR_CODE` with the partner's unique `affiliate_code` from the database.

---

## 9. 🗺️ Demo Environment (Internal UI Mockups)

These routes are pre-built demo screens used for product showcases — they are **not** connected to live data.

| Route | URL | Purpose |
|---|---|---|
| Demo Dashboard | [/dashboard](https://claux.automizemedialabs.com/dashboard) | Mock client dashboard home. |
| Agents View | [/dashboard/agents](https://claux.automizemedialabs.com/dashboard/agents) | Shows all 9 AI agents and their statuses. |
| Rankings | [/dashboard/rankings](https://claux.automizemedialabs.com/dashboard/rankings) | Mock keyword ranking tracker. |
| Reports | [/dashboard/reports](https://claux.automizemedialabs.com/dashboard/reports) | Mock monthly SEO report view. |
| Tasks | [/dashboard/tasks](https://claux.automizemedialabs.com/dashboard/tasks) | Mock AI task queue. |
| Billing | [/dashboard/billing](https://claux.automizemedialabs.com/dashboard/billing) | Mock billing and subscription screen. |
| Compare | [/compare](https://claux.automizemedialabs.com/compare) | Competitor comparison page used in demos. |
