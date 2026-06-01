# UniEats 🍽️

> A university campus food ordering platform — students browse restaurants, place orders, and track them live. Owners manage menus and incoming orders. Admins control the entire platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express.js · MVC architecture |
| Database | MongoDB · Mongoose |
| Auth | JWT (httpOnly cookies) · bcryptjs |
| Frontend | EJS templates · CSS3 · Vanilla JavaScript |
| Real-time | Socket.io |
| Security | Helmet · CORS · Mongo Sanitize · Rate limiting |

---

## Quick Start

### Step 1 — Install Node.js and MongoDB

- **Node.js**: Download from https://nodejs.org (choose the LTS version)
- **MongoDB**: Download from https://www.mongodb.com/try/download/community

After installing, confirm they work:
```
node --version
mongod --version
```

---

### Step 2 — Install project dependencies

Open a terminal inside the project folder and run:

```bash
npm install
```

This installs everything listed in `package.json`.

---

### Step 3 — Create your `.env` file

Copy the example file:

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/unieats

JWT_SECRET=replace_this_with_any_long_random_string
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

ADMIN_EMAIL=admin@unieats.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=System Admin
```

> ⚠️ Change `JWT_SECRET` to any random text — it protects user sessions.

---

### Step 4 — Start MongoDB

Open a **second terminal** and run:

```bash
mongod
```

Keep this terminal open while the app is running.

---

### Step 5 — Start the app

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
  UniEats is running → http://localhost:3000
  Mode: development
```

---

### Step 6 — Open in browser

```
http://localhost:3000
```

---

### Step 7 — Create your Admin account

While the server is running, open this URL in your browser **once**:

```
http://localhost:3000/api/admin/seed
```

This creates the admin user from your `.env` values. You only need to do this once.

---

## Test Accounts

| Role | How to get one |
|---|---|
| Admin | Seeded via `/api/admin/seed` (see Step 7) |
| Student | Register at `/auth/register` — select "Student" |
| Owner | Register at `/auth/register` — select "Restaurant Owner" |

Default admin credentials (if you kept the `.env` defaults):
```
Email:    admin@unieats.com
Password: Admin@123
```

---

## Project Structure

```
uni_eat-/
│
├── server.js               ← App entry point
├── .env.example            ← Environment variable template
├── package.json
│
├── src/
│   ├── config/
│   │   └── database.js     ← MongoDB connection
│   ├── models/             ← Mongoose schemas
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── Order.js
│   │   └── Notification.js
│   ├── controllers/        ← Business logic
│   │   ├── authController.js
│   │   ├── restaurantController.js
│   │   ├── orderController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── routes/             ← Route definitions
│   │   ├── pages.js        ← All HTML page routes
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js         ← JWT protect + restrictTo
│   │   └── errorHandler.js ← Global error handler
│   └── utils/
│       ├── ApiError.js     ← Custom error class
│       └── catchAsync.js   ← Async wrapper
│
├── views/                  ← EJS templates
│   ├── layouts/
│   │   ├── main.ejs        ← Public layout
│   │   ├── auth.ejs        ← Login/Register layout
│   │   └── dashboard.ejs   ← Admin/Owner layout
│   ├── partials/
│   │   ├── navbar.ejs
│   │   ├── sidebar.ejs
│   │   ├── footer.ejs
│   │   └── toast.ejs
│   ├── index.ejs           ← Landing page
│   ├── auth/               ← login, register, forgot-password
│   ├── student/            ← home, restaurant, cart, checkout, tracking, orders, profile
│   ├── owner/              ← dashboard, menu, orders
│   ├── admin/              ← dashboard, restaurants, users, orders
│   └── error.ejs
│
└── public/
    ├── css/
    │   ├── variables.css   ← Design tokens (colors, spacing, fonts)
    │   ├── global.css      ← Base styles, components, utilities
    │   ├── auth.css        ← Login / Register pages
    │   ├── student.css     ← Student-facing pages
    │   └── dashboard.css   ← Owner + Admin dashboards
    └── js/
        ├── main.js         ← Toast, API helper, logout, animations
        ├── cart.js         ← Cart module (localStorage)
        ├── auth.js         ← Login / Register forms
        ├── student.js      ← Restaurant browsing, cart interactions
        ├── checkout.js     ← Order placement
        ├── owner.js        ← Menu management, order status
        ├── admin.js        ← Admin CRUD operations
        └── profile.js      ← Profile & password update
```

---

## All Pages

| URL | Who can access |
|---|---|
| `/` | Everyone |
| `/auth/login` | Public |
| `/auth/register` | Public |
| `/auth/forgot-password` | Public |
| `/student/home` | Students |
| `/student/restaurant/:id` | Students |
| `/student/cart` | Students |
| `/student/checkout` | Students |
| `/student/tracking/:id` | Students |
| `/student/orders` | Students |
| `/student/profile` | Students |
| `/owner/dashboard` | Restaurant Owners |
| `/owner/menu/:restaurantId` | Restaurant Owners |
| `/owner/orders` | Restaurant Owners |
| `/admin/dashboard` | Admins |
| `/admin/restaurants` | Admins |
| `/admin/users` | Admins |
| `/admin/orders` | Admins |

---

## API Reference

All API responses follow `{ status, data }` format. Errors return `{ status, message }`.

### Auth  — `/api/auth`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register a new user | Public |
| POST | `/login` | Log in | Public |
| POST | `/logout` | Log out | Public |
| GET | `/me` | Get logged-in user | Required |
| PATCH | `/update-password` | Change password | Required |
| POST | `/forgot-password` | Request reset token | Public |
| PATCH | `/reset-password/:token` | Reset password | Public |

### Restaurants  — `/api/restaurants`

| Method | Path | Auth |
|---|---|---|
| GET | `/` | Public |
| GET | `/:id` | Public |
| POST | `/` | Admin |
| PUT | `/:id` | Admin / Owner |
| DELETE | `/:id` | Admin |
| PATCH | `/:id/assign-owner` | Admin |
| POST | `/:id/menu` | Admin / Owner |
| PUT | `/:id/menu` | Admin / Owner |
| DELETE | `/:id/menu` | Admin / Owner |

### Orders  — `/api/orders`

| Method | Path | Auth |
|---|---|---|
| POST | `/` | Student |
| GET | `/my` | Student |
| GET | `/:id` | Any authenticated |
| PATCH | `/:id/status` | Admin / Owner |
| GET | `/restaurant/:restaurantId` | Admin / Owner |
| GET | `/` | Admin |

### Users  — `/api/users`

| Method | Path | Auth |
|---|---|---|
| PATCH | `/me` | Any authenticated |
| GET | `/notifications` | Any authenticated |
| PATCH | `/notifications/read` | Any authenticated |
| GET | `/` | Admin |
| PATCH | `/:id` | Admin |
| DELETE | `/:id` | Admin |

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWTs stored in **httpOnly cookies** — safe from XSS
- **Helmet** sets secure HTTP headers automatically
- **express-mongo-sanitize** blocks NoSQL injection
- **Rate limiting** on auth endpoints: 10 requests per 15 minutes
- All dashboard routes protected by role-based middleware

---

## Common Issues

**`MongooseServerSelectionError`** — MongoDB is not running. Start it with `mongod`.

**`JWT_SECRET` missing** — Make sure you created `.env` from `.env.example`.

**Port already in use** — Change `PORT=3000` in `.env` to another number like `5000`.

**`Cannot find module`** — Run `npm install` again.
