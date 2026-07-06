# GLO Venture — Retail Rice Delivery

Premium Malawian rice, delivered honestly. A full-stack web app for **GLO Venture**, a retail social enterprise serving families in **Dowa** and **Dzaleka** with stone-free, honestly-weighed rice via motorbike delivery — and an "Order via WhatsApp" shortcut for low-friction ordering.

> *Feeding communities → Sending girls to school.*

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Local development](#local-development)
- [API reference](#api-reference)
- [Admin access](#admin-access)
- [Testing](#testing)
- [Deployment notes](#deployment-notes)
- [Customising the catalogue](#customising-the-catalogue)
- [Contact](#contact)

---

## Features

**Customer-facing**
- Marketing landing page (Hero, Problem, Solution, Mission, How It Works, Products, Impact, Team, Footer)
- Product catalogue (5 kg, 25 kg, 50 kg bags) priced in **MWK**
- Cart-style order builder with running total
- **Two ordering paths** — both persist to MongoDB:
  1. **Online order** → saves the order, redirects to a confirmation page
  2. **Order via WhatsApp** → saves the order, opens `wa.me/<number>` with a pre-filled message
- Pay-on-delivery (no online payment integration by design)

**Admin**
- Email/password login (bcrypt + JWT)
- Live dashboard with totals, pending count, delivered count and revenue (MWK)
- Filterable order list with one-click status pipeline:
  `pending → confirmed → out_for_delivery → delivered` (or `cancelled`)
- One-tap **Call** and **WhatsApp** buttons per order

---

## Tech stack

| Layer        | Stack                                                                |
| ------------ | -------------------------------------------------------------------- |
| Frontend     | React 19, React Router 7, Tailwind CSS, shadcn/ui, lucide-react, sonner |
| Backend      | FastAPI, Motor (async MongoDB), PyJWT, bcrypt                         |
| Database     | MongoDB                                                              |
| Typography   | Playfair Display (display) · Manrope (body)                          |
| Theme        | Cream `#FAF3EC`, forest green `#1F5C3A`, ochre `#C5953E`, terracotta `#F4DCD4` |

---

## Project structure

```
/app
├── backend/
│   ├── server.py            # FastAPI app + routes + admin seed
│   ├── requirements.txt
│   ├── tests/
│   │   └── backend_test.py  # 15 pytest cases (run against live URL)
│   └── .env                 # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_*
│
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.js           # Router
│       ├── index.css        # Theme tokens, fonts, component styles
│       ├── lib/
│       │   └── api.js       # Axios client + token helpers + WhatsApp helpers
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   └── ui/          # shadcn primitives
│       └── pages/
│           ├── Landing.jsx
│           ├── Order.jsx
│           ├── OrderSuccess.jsx
│           ├── AdminLogin.jsx
│           └── AdminDashboard.jsx
│
├── memory/
│   ├── PRD.md
│   └── test_credentials.md
│
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18 and **Yarn** ≥ 1.22 (do **not** use npm — `yarn.lock` is the source of truth)
- **Python** ≥ 3.11
- **MongoDB** ≥ 6.0 running locally or a remote URI
- A WhatsApp business number (E.164 without `+`) for the click-to-WhatsApp link

---

## Environment variables

### `backend/.env`

```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="glo_venture"
CORS_ORIGINS="*"

# Auth
JWT_SECRET="change-me-to-a-random-64-char-hex"
ADMIN_EMAIL="admin@gloventure.mw"
ADMIN_PASSWORD="change-me-strong-password"

# WhatsApp (E.164 without +)
WHATSAPP_NUMBER="265886750499"
```

> **JWT_SECRET** — generate a strong one with:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```
> The admin user is **automatically seeded** on backend startup. If you change `ADMIN_PASSWORD` later, the seed routine re-hashes and updates the existing record on next startup.

### `frontend/.env`

```bash
REACT_APP_BACKEND_URL=https://your-deployed-backend.example.com
WDS_SOCKET_PORT=443
```

> The frontend always calls `${REACT_APP_BACKEND_URL}/api/...` — never hardcode the host.

The WhatsApp number on the **frontend** is read from `frontend/src/lib/api.js` (`WHATSAPP_PHONE`). Change it there if you want a different recipient for the click-to-WhatsApp link.

---

## Local development

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# create backend/.env with the variables shown above

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The API will be live at <http://localhost:8001>. All endpoints are prefixed with `/api`.

### 2. Frontend

```bash
cd frontend
yarn install
yarn start
```

The dev server listens on <http://localhost:3000>. Make sure `REACT_APP_BACKEND_URL` points to your backend (e.g. `http://localhost:8001` for local dev).

---

## API reference

All routes are prefixed with `/api`.

### Public

| Method | Path             | Description                                         |
| ------ | ---------------- | --------------------------------------------------- |
| GET    | `/api/`          | Health check                                        |
| GET    | `/api/products`  | List the 3 hardcoded rice bags                      |
| POST   | `/api/orders`    | Place a new order (returns `OrderResponse`)         |

**`POST /api/orders` body**

```json
{
  "customer_name": "Mary B.",
  "phone": "+265 999 000 111",
  "location": "Dowa",
  "address_details": "Near the market, blue gate",
  "items": [
    { "product_id": "rice-25kg", "quantity": 2 }
  ],
  "notes": "Please deliver after 4pm"
}
```

### Admin (Bearer JWT required)

| Method | Path                       | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| POST   | `/api/admin/login`         | Returns `{ access_token, user }`         |
| GET    | `/api/admin/me`            | Current admin profile                    |
| GET    | `/api/admin/stats`         | `{ total_orders, pending, delivered, revenue_mwk }` |
| GET    | `/api/orders`              | List all orders (newest first)           |
| PATCH  | `/api/orders/{order_id}`   | Update status (`pending`, `confirmed`, `out_for_delivery`, `delivered`, `cancelled`) |

**Auth header:**
```
Authorization: Bearer <access_token>
```

The token is also accepted via the `access_token` cookie. The frontend stores it in `localStorage` under the key `glo_admin_token`.

---

## Admin access

1. Make sure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `backend/.env`.
2. Start the backend — the admin user is seeded automatically.
3. Visit `/admin/login` and sign in.
4. You're redirected to `/admin/dashboard` to manage orders.

The current dev/staging credentials live in `memory/test_credentials.md`. **Rotate them before going to production.**

---

## Testing

The backend suite covers products, order creation, validation errors, JWT auth on protected endpoints, status updates and stats — **15 tests, ~2 s runtime**.

```bash
cd backend
pip install -r requirements.txt
python3 -m pytest tests/backend_test.py -q
```

Tests read `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env` (no hardcoded secrets) and target `REACT_APP_BACKEND_URL` from `frontend/.env`.

---

## Deployment notes

- **Backend** must bind to `0.0.0.0:8001` and serve under `/api/...` for the platform's ingress to route correctly.
- **Frontend** is a Create React App (CRA via craco) — `yarn build` produces the static bundle.
- All URLs come from environment variables — **never** hardcode `localhost:8001` or full preview hostnames in source.
- Set `JWT_SECRET` to a fresh 64-char random hex per environment. Don't reuse the dev secret in production.
- Set `CORS_ORIGINS` to your actual frontend origin (comma-separated for multiple) instead of `*` once you go live.
- Ensure the MongoDB instance is reachable from the backend container; the app calls `db.users.create_index("email", unique=True)` and `db.orders.create_index("created_at")` on startup.

---

## Customising the catalogue

Products are intentionally hardcoded in [`backend/server.py`](backend/server.py) (`PRODUCTS` list) — this matches the pitch-deck SKUs and avoids an unnecessary admin-CRUD layer for the MVP.

To change prices, sizes, copy or badges, edit the list:

```python
PRODUCTS = [
    Product(id="rice-5kg",  name="...", size_kg=5,  price_mwk=8500,  description="...", badge="Most popular"),
    Product(id="rice-25kg", name="...", size_kg=25, price_mwk=38000, description="...", badge="Best value"),
    Product(id="rice-50kg", name="...", size_kg=50, price_mwk=72000, description="...", badge="Bulk"),
]
```

Then restart the backend (or rely on hot reload). The frontend pulls fresh values from `GET /api/products` on every page load.

---

## Contact

**GLO Venture — Retail Rice Delivery**

- 📞  +265 886 750 499
- ✉️  Nellyhapp12@gmail.com
- 🔗  [LinkedIn](https://www.linkedin.com/company/glo-venture-retail-rice-delivery/)
- 📍  Dowa District & Dzaleka Refugee Camp, Malawi

> Built with care so more women can save hours, and more girls can stay in school.
