# PITARA — Hidden Cinema

> A space where films get the audience they deserve.
> Real screenings. Real people. Real applause.

---

## Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Framework | Next.js 15.3 (App Router, stable)           |
| Language  | TypeScript                                  |
| Styling   | Tailwind CSS 4 + CSS custom properties      |
| Animation | GSAP 3 (ScrollTrigger, canvas animations)   |
| Auth      | Supabase Auth (Google OAuth)                |
| Database  | Supabase (Postgres + Row Level Security)    |
| Storage   | Supabase Storage (QR code images)           |
| Payments  | Razorpay (inline modal, no redirect)        |
| Hosting   | Vercel                                      |

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Environment
cp .env.local.example .env.local
# Fill in all values

# 3. Database
# Paste supabase-schema.sql into Supabase Dashboard → SQL Editor → Run

# 4. Supabase Auth — enable Google provider
# Dashboard → Authentication → Providers → Google
# Set: Site URL = http://localhost:3000
# Set Redirect URL = http://localhost:3000/api/auth/callback/google

# 5. Supabase Storage
# Dashboard → Storage → New bucket → name: "tickets" → Public: ON

# 6. Run
npm run dev
```

---

## Supabase Auth Setup

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Enable Google, paste your Google OAuth Client ID + Secret
3. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
4. In Google Cloud Console → OAuth Client → add Authorized redirect URI:
   `https://your-project.supabase.co/auth/v1/callback`
5. In Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/api/auth/callback/google`

---

## Razorpay Setup

1. [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys
2. Copy Key ID → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
3. Copy Key Secret → `RAZORPAY_KEY_SECRET`
4. Settings → Webhooks → Add → URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy webhook secret → `RAZORPAY_WEBHOOK_SECRET`

For local dev: use [ngrok](https://ngrok.com) to tunnel port 3000 and point webhook there.

---

## Admin Access

1. Open the live site, sign in with Google
2. Scroll to the footer → click the faint **Admin** text (bottom-right)
3. Enter `ADMIN_SECRET_CODE` from your `.env.local`
4. You're redirected to `/admin`

**Admin capabilities:**
- Create / Edit / Delete / Publish screenings
- View all bookings with attendee details
- Mark attendance ✓ / ✗
- Export all bookings as CSV

---

## Payment Flow

```
User clicks "Book Ticket"
  → POST /api/payments/create-order   (Razorpay order + pending DB booking)
  → Razorpay modal opens inline (no page redirect)
  → User pays with card / UPI / netbanking
  → handler() fires on success
  → POST /api/payments/verify         (HMAC signature check → confirm booking → QR)
  → Success panel appears in the card with QR code + download
  → /api/payments/webhook             (Razorpay server event safety net)
```

---

## Project Structure

```
pitara/
├── app/
│   ├── admin/                    Admin dashboard page
│   ├── api/
│   │   ├── admin/
│   │   │   ├── screenings/       All screenings (admin-only)
│   │   │   └── verify/           Admin code verification
│   │   ├── auth/
│   │   │   └── callback/google/  Supabase OAuth callback
│   │   ├── bookings/
│   │   │   ├── route.ts          List + CSV export
│   │   │   ├── [id]/route.ts     PATCH attendance
│   │   │   └── by-ref/route.ts   Fetch confirmed booking by ref
│   │   ├── payments/
│   │   │   ├── create-order/     Razorpay order creation
│   │   │   ├── verify/           HMAC verification + confirm booking
│   │   │   └── webhook/          Razorpay server-side events
│   │   └── screenings/
│   │       ├── route.ts          Public list
│   │       └── [id]/route.ts     GET / PUT / DELETE
│   ├── booking/success/          Post-payment ticket page
│   ├── hooks/
│   │   ├── useAudio.ts           Web Audio API sound system
│   │   └── useAuth.ts            Supabase Auth state hook
│   ├── lib/
│   │   ├── supabase-browser.ts   Client-side Supabase client
│   │   └── supabase-server.ts    Server-side + admin clients
│   ├── types/index.ts            TypeScript interfaces
│   ├── globals.css               Design tokens + utility classes
│   ├── layout.tsx                Root layout + Google Fonts
│   └── page.tsx                  Single-page cinematic experience
├── components/
│   ├── admin/AdminPopup.tsx      Themed admin login popup
│   ├── box/PitaraBox.tsx         3D vintage canvas box (full WebGL-style)
│   ├── effects/
│   │   ├── GrainOverlay.tsx      Animated film grain canvas
│   │   ├── DustParticles.tsx     Floating dust particles
│   │   └── AmbientDecorations.tsx Stars + arrows ambient motion
│   ├── layout/
│   │   ├── SiteNav.tsx           Fixed nav with Supabase Auth
│   │   └── SiteFooter.tsx        Footer with hidden admin link
│   ├── sections/
│   │   ├── OpeningSequence.tsx   3-line cinematic opening
│   │   ├── ScreeningsSection.tsx Screenings list with dialogue cards
│   │   ├── ScreeningCard.tsx     Accordion card + Razorpay booking
│   │   └── ContentSections.tsx  About / Manifesto / Join
│   ├── tickets/DigitalTicket.tsx Canvas ticket renderer + QR
│   └── ui/PitaraLogo.tsx         SVG logo with sketch-draw animation
├── middleware.ts                 Protect /admin route
├── supabase-schema.sql           Full schema + RLS + seed data
├── .env.local.example            All required env vars
└── README.md                     This file
```

---

## Deploy to Vercel

```bash
vercel deploy --prod
```

Set all `.env.local` variables in Vercel → Project → Settings → Environment Variables.
Update `NEXT_PUBLIC_APP_URL` to your production domain.
Update Supabase redirect URLs to your production domain.
Update Razorpay webhook URL to your production domain.

---

## Colour Palette

| Name   | Hex       | Usage                    |
|--------|-----------|--------------------------|
| Navy   | `#18196D` | Primary background       |
| Yellow | `#FFE100` | Primary text + accents   |
| Orange | `#CC3A00` | Secondary accents + CTA  |
| Cream  | `#f5eed8` | Body text                |
