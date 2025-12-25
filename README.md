# RestoByte - Restaurant Management System

RestoByte is a comprehensive SaaS-based Restaurant Management System designed to streamline operations for restaurants of all sizes. It features a modern React frontend and a robust Node.js/Express backend with PostgreSQL.

## 🚀 Features

*   **Dashboard:** Real-time overview of sales, orders, and restaurant performance.
*   **Menu Management:** Create and manage categories, items, variations, and pricing.
*   **Order Management:** Efficiently handle dine-in, takeaway, and delivery orders.
*   **Kitchen Display System (KDS):** Dedicated interface for kitchen staff to view and process orders.
*   **Inventory & Stock:** Track ingredients, suppliers, and stock levels.
*   **Reports & Analytics:** Detailed reports on sales, profits, taxes, and more.
*   **SaaS Capabilities:** Multi-tenant support for managing multiple restaurant subscriptions.
*   **User Management:** Role-based access control for admins, managers, waiters, and kitchen staff.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Backend:** Node.js, Express.js, TypeScript
*   **Database:** PostgreSQL 17 (via Docker), Prisma ORM
*   **Tools:** Docker, ESLint, Prettier

## 📦 Prerequisites

*   Node.js (v22 or higher recommended; v20.19+ minimum for Prisma 7)
*   npm or yarn
*   Docker & Docker Compose (for the database)

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/amdevan/Restobyte.git
cd Restobyte
```

### 2. Backend Setup

The backend handles the API and database connections.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    *Ensure `DATABASE_URL` matches your Docker configuration.*

4.  Start the PostgreSQL database using Docker:
    ```bash
    # Run from the root directory where docker-compose.yml is located
    docker-compose up -d
    ```

5.  Run database migrations:
    ```bash
    npx prisma migrate dev
    ```

6.  Start the backend server:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:3000`.

### Prisma 7 Notes

* Prisma 7 uses `prisma.config.ts` to configure the database connection URL.
* The `datasource url` is no longer set in `schema.prisma`.
* Generated client is imported from `backend/generated/prisma/client.js`.
* Regenerate client after schema changes:
  ```bash
  npx prisma generate
  ```
* Seed runs explicitly:
  ```bash
  npx prisma db seed
  ```
* Postgres adapter is used in code:
  ```ts
  import { PrismaPg } from '@prisma/adapter-pg';
  ```

### 3. Frontend Setup

The frontend is a React application built with Vite.

1.  Open a new terminal and navigate to the project root.

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📂 Project Structure

*   `backend/`: Node.js/Express API and Prisma ORM configuration.
*   `src/`: React frontend source code.
*   `docker-compose.yml`: Docker configuration for PostgreSQL.

## 🚀 Deployment

### Backend (Node.js/Express)

When deploying to platforms like Railway, Render, or Coolify:

*   **Build Pack:** `Nixpacks` (Recommended)
*   **Base Directory:** `backend`
*   **Build Command:** `npm run build`
*   **Start Command:** `npm start`
*   **Port:** `3000`
*   **Environment Variables:**
    *   `DATABASE_URL`: Connection string for your production PostgreSQL database (PostgreSQL 17 recommended).
    *   `JWT_SECRET`: A secure random string for authentication.

### Frontend (React/Vite)

*   **Build Pack:** `Static` or `Nixpacks`
*   **Base Directory:** `/` (Root)
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **Environment Variables:**
    *   `VITE_API_URL`: URL of your deployed backend (e.g., `https://api.yourdomain.com`).

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
