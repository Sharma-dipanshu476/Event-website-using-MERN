# Eventrix — MERN Event Organising Platform

Intermediate-level BCA project starter built with React + Vite, Express, MongoDB/Mongoose, JWT and bcrypt.

## Features
- Register and login with hashed passwords and JWT authentication
- User and Organizer roles
- Public event browsing, searching and category filtering
- Organizer event create/edit/delete
- Ticket booking with server-side availability validation
- My Bookings page
- Responsive UI with Eventrix purple/white theme
- Protected frontend routes and backend authorization middleware
- Email verification (6-digit OTP) on signup
- Login OTP (2-step login) sent to the user's email
- Razorpay payment gateway for paid events (UPI / cards / netbanking / wallets)
- Demo seed data instructions and API overview

## Requirements
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- npm

## 1. Backend setup
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and fill in values:
```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER/eventrix?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
Do not commit `.env` to GitHub. In Atlas, create a database user and allow your current IP in Network Access.
Run:
```bash
npm run dev
```
The server runs on http://localhost:5000.

## 2. Frontend setup
Open another terminal:
```bash
cd client
npm install
```
Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
Run:
```bash
npm run dev
```
Open http://localhost:5173.

## 3. How to test
1. Register an account and choose User or Organizer.
2. Log in.
3. Browse events.
4. An Organizer can open “Organise Event” and create an event.
5. A User can open an event and book tickets.
6. Check My Bookings for booking history.

For a real production system, don't let public visitors freely assign themselves privileged roles. For a college demo this starter exposes the Organizer option at registration; before deployment, change role assignment so an admin approves organizer accounts. Add email verification, password reset, rate limiting, secure cookie-based auth, payment-provider verification and automated tests before production use.

## API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (auth)
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events` (Organizer)
- `PUT /api/events/:id` (owner Organizer)
- `DELETE /api/events/:id` (owner Organizer)
- `POST /api/bookings` (auth)
- `GET /api/bookings/my` (auth)

## Main folders
- `client/src/components`: reusable UI and route protection
- `client/src/pages`: page-level components
- `client/src/context`: authentication state
- `client/src/services`: API client
- `server/models`: MongoDB schemas
- `server/routes`: API endpoints
- `server/controllers`: request logic
- `server/middleware`: JWT and role checks


## Email OTP + Payment setup (new)
Add these to `server/.env` (see `.env.example`):
```env
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_gmail_app_password      # Google Account -> Security -> App passwords
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx       # Razorpay Dashboard -> Settings -> API Keys (Test Mode)
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=                # optional but recommended
```
Then run `npm install` in `server` (no new package needed) and restart.

**Flows**
- Signup -> OTP emailed -> `/verify-otp` -> account verified and logged in.
- Login -> password check -> OTP emailed -> `/verify-otp` -> logged in. (Accounts with `twoFactorEnabled: false` and a verified email, like the demo organizer, skip the OTP.)
- Paid event: seats held 15 min -> Razorpay popup -> server verifies signature -> booking confirmed. Free events (price 0) confirm directly.

**Webhook (recommended)**: in Razorpay Dashboard -> Webhooks, add `https://YOUR-SERVER/api/payments/webhook`, enable `payment.captured` and `order.paid`, and put the same secret in `RAZORPAY_WEBHOOK_SECRET`. For local testing use a tunnel such as ngrok.

**Test payment**: in Test Mode use card `4111 1111 1111 1111`, any future expiry, any CVV, or UPI `success@razorpay`.
