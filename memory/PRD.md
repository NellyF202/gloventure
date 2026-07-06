# GLO Venture — PRD

## Original Problem Statement
"Based on this PowerPoint presentation and constitution, create a full-stack website for GLO Venture, not a pitch deck, a retail rice delivery service with a WhatsApp system for orders and ordering online. Use the fonts and colors shown in the screenshot."

## Architecture
- Backend: FastAPI + MongoDB (Motor) + JWT (PyJWT) + bcrypt
- Frontend: React 19 + React Router 7 + Tailwind + shadcn primitives + sonner toasts + lucide-react icons
- Fonts: Playfair Display (display) + Manrope (body)
- Theme: cream #FAF3EC, forest green #1F5C3A, ochre #C5953E, dusty terracotta #F4DCD4

## User Personas
- Family / household buyer in Dowa or Dzaleka — wants quick rice delivery without market trips
- Bulk buyer (restaurant / chippy stand / mini-mart) — wants reliable 50kg supply
- GLO Venture admin (Founder/Logistics) — needs to view & manage incoming orders

## Core Requirements (static)
- Public marketing site matching reference screenshots
- Online order form (multi-quantity cart) with backend persistence
- Click-to-WhatsApp order shortcut to +265886750499 (pre-filled message)
- Hardcoded product catalogue (5kg, 25kg, 50kg) priced in MWK
- Admin login + dashboard with order list, status pipeline, stats
- Pay-on-delivery model (no online payment)

## Implemented (2026-02 — initial build)
- Backend: GET /api/products, POST /api/orders, GET /api/orders (admin), PATCH /api/orders/{id} (admin), POST /api/admin/login, GET /api/admin/me, GET /api/admin/stats. Admin auto-seeded on startup.
- Frontend pages: / (Landing), /order, /order/success, /admin/login, /admin/dashboard
- Status pipeline: pending → confirmed → out_for_delivery → delivered (or cancelled)
- 15/15 backend tests pass, full frontend E2E passes

## Backlog (P1)
- Twilio WhatsApp Business API for true 2-way messaging
- SMS notifications to customers (delivery dispatched / delivered)
- Online payment via PayChangu / Stripe + Mpamba mobile money
- Customer accounts with order history & re-order
- Coupon codes / loyalty for repeat customers
- Driver app for live delivery status

## Backlog (P2)
- Multi-product catalogue (maize flour, beans, oil) — manageable from admin
- Reports CSV export
- Delivery zone-based pricing
- Bulk-buyer B2B portal (restaurants, mini-marts)
