# 🛒 MADHUKAR GENERAL STORE
### Production-Ready Scalable E-Commerce + Billing + Delivery Platform

This repository contains the complete full-stack web application for **Madhukar General Store**. It features two standalone frontend applications (Customer Storefront and Admin Management Portal) connected to a central modular backend API.

---

## 🏗️ Architecture

The codebase is organized with **2 separate frontend websites** and **1 shared backend API**:

```text
madhukar-general-store/
├── frontend/
│   ├── customer/         # 🌐 Customer Website (Next.js - Port 3000)
│   │   ├── src/app/      # Shop, Search, Cart, Checkout, Accounts, Invoices, Wishlist
│   │   └── package.json
│   │
│   └── admin/            # 🛠️ Admin & Staff Dashboard (Next.js - Port 3002)
│       ├── src/app/      # Products, Orders, Delivery PINs, Coupons, Billing & QR Scanner
│       └── package.json
│
├── backend/              # 🚀 Modular Express API Server (Node.js - Port 5000)
│   ├── src/controllers/  # Auth, Products, Orders, Admin, User, Invoices, Delivery
│   └── package.json
│
├── prisma/               # Database Schema & Seed Script
└── package.json          # Monorepo Orchestrator (npm workspaces)
```

---

## 🌐 Separate Deployment URLs

| Application | Local Port | Example Production URL |
| :--- | :--- | :--- |
| **Customer Storefront** | `http://localhost:3000` | `https://madhukargeneralstore.com` |
| **Admin & Staff Portal** | `http://localhost:3002` | `https://admin.madhukargeneralstore.com` |
| **Backend API** | `http://localhost:5000` | `https://api.madhukargeneralstore.com` |

*(When a customer places an order on `localhost:3000`, it immediately syncs via the shared backend API and appears live on the Admin portal at `localhost:3002`).*

---

## 🚀 How to Run in VS Code

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **VS Code**: Installed on your system

---

### Step-by-Step Guide

#### Step 1: Open Project in VS Code
1. Open VS Code.
2. Select **File > Open Folder...** and choose the `madhukar-general-store` directory.
3. Open a built-in terminal by pressing `Ctrl + ~` (or `Cmd + ~` on macOS), or select **Terminal > New Terminal**.

---

#### Step 2: Install Dependencies (**IMPORTANT - MUST DO FIRST**)
In your root terminal, run:
```bash
npm install
```
*(This automatically runs `npx prisma generate` and installs dependencies for root, `frontend/customer`, `frontend/admin`, and `backend`).*

---

#### Step 3: Setup Environment Variables
Check if `.env` exists in the root directory. If not, create a file named `.env` in the root folder with:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="madhukar-super-secret-jwt-key-2026"
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
RAZORPAY_KEY_ID="rzp_test_sample"
RAZORPAY_KEY_SECRET="rzp_test_secret"
```

---

#### Step 4: Setup & Seed Database
In your VS Code root terminal, run:

```bash
# Push Prisma Schema to database & generate client
npm run db:push

# Seed Sample Products, Categories, Delivery PINs & Test Credentials
npm run db:seed
```

---

#### Step 5: Start Development Servers

##### Option A: Start All Applications Together (Recommended)
From the root terminal, run:
```bash
npm run dev
```

You will see output in the VS Code terminal indicating all 3 servers are live:
- 🚀 **Backend API**: `http://localhost:5000`
- 🌐 **Customer Website**: `http://localhost:3000`
- 🛠️ **Admin Dashboard**: `http://localhost:3002`

##### Option B: Run Applications Separately
You can also run applications individually in separate terminals:
- **Backend API**: `npm run dev:backend` (or `cd backend && npm run dev`)
- **Customer Site**: `npm run dev:customer` (or `cd frontend/customer && npm run dev`)
- **Admin Site**: `npm run dev:admin` (or `cd frontend/admin && npm run dev`)

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Allowed Apps |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@madhukargeneralstore.com` | `Password123!` | Admin Portal (`:3002`) & Customer Site (`:3000`) |
| **Customer** | `customer@gmail.com` | `Password123!` | Customer Storefront (`:3000`) |
| **Delivery Staff** | `delivery@madhukargeneralstore.com` | `Password123!` | Admin/Delivery Portal (`:3002`) |

---

## 🧪 Running Tests & Build Checks

To verify all backend unit/integration tests:
```bash
npm test
```

To run production builds for both customer and admin websites:
```bash
npm run build
```
