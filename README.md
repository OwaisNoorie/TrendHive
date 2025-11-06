# 🛍️ TrendHive — Modern E-Commerce Web App

**TrendHive** is a full-stack fashion e-commerce web application built using **HTML, CSS, and JavaScript (frontend)** with a **Node.js (Express) + SQLite (via sql.js)** backend.  
It allows users to browse products, add them to cart, and place orders — all stored persistently in a lightweight SQL database.

---

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | **HTML5, CSS3, JavaScript (ES6)** | Structure, responsive UI, and dynamic interactions |
| **Backend** | **Node.js (Express.js)** | REST API and server logic |
| **Database** | **SQLite (sql.js)** | Persistent local database using WebAssembly — no native binaries required |
| **Storage** | **LocalStorage (Browser)** | Stores cart data client-side |
| **API Format** | **RESTful JSON** | Communication between frontend and backend |
| **Hosting Compatibility** | Works locally or can be deployed on Render / Railway / Vercel |

---

## ✨ Features

✅ **Home Page** — Displays all products dynamically.  
✅ **Product Detail Page** — Shows product info and allows adding to cart.  
✅ **Cart & Checkout** — Persistent cart with order placement.  
✅ **Admin Page** — Lists all orders.  
✅ **Zero Native Dependencies** — Runs on Node 24+ without Visual Studio Build Tools.

---

## 🧩 Folder Structure

```
trendhive/
├── public/              # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── product.html
│   ├── cart.html
│   ├── admin.html
│   ├── styles.css
│   ├── app.js
│   └── images/
│
├── server.js            # Express backend with sql.js
├── package.json         # Dependencies and scripts
├── store.sqlite         # Auto-created local database
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/trendhive.git
cd trendhive
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Run the server
```bash
npm start
```
Then open [http://localhost:3000](http://localhost:3000)

---

## 🧠 API Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| **GET** | `/api/products` | Fetch all products |
| **GET** | `/api/products/:id` | Fetch details of a specific product |
| **POST** | `/api/orders` | Create a new order (checkout) |
| **GET** | `/api/orders` | Retrieve all orders (Admin view) |

Example `/api/orders` request body:
```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "customer": {
    "name": "Owais Noorie",
    "email": "owais@example.com",
    "address": "Bangalore, India"
  }
}
```

---

## 💾 Database Schema

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  price INTEGER,
  image TEXT,
  stock INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  customer_email TEXT,
  customer_address TEXT,
  total_amount INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  price_each INTEGER
);
```

---

## 🔧 GitHub Push Guide

To publish this project to GitHub:

```bash
# 1. Initialize Git
git init
git add .
git commit -m "Initial commit - TrendHive eCommerce"

# 2. Create a new repo on GitHub named 'trendhive'
# Then connect your local folder to it:
git remote add origin https://github.com/<your-username>/trendhive.git

# 3. Push your project
git branch -M main
git push -u origin main
```

Your repo will be live at:  
👉 https://github.com/<your-username>/trendhive

---

## 👨‍💻 Author

**Owais Noorie**  
B.Tech in Information Technology  
💼 Full-Stack Developer | AI/ML Enthusiast  
📧 owais.noorie@example.com  
🌐 [LinkedIn](https://linkedin.com/in/owaisnoorie)

---

