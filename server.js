// Simple e-commerce backend with Express + better-sqlite3
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// DB setup
const db = new Database(path.join(__dirname, 'store.db'));
db.pragma('journal_mode = WAL');

// Create tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- price in paise (₹)
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price_each INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

// Seed sample products if empty
const row = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (row.c === 0) {
  const insert = db.prepare('INSERT INTO products (title, description, price, image, stock) VALUES (?, ?, ?, ?, ?)');
  insert.run('Classic Tee', 'Soft cotton tee for everyday wear.', 59900, 'images/shirt.jpg', 25);
  insert.run('Comfy Hoodie', 'Cozy fleece hoodie with kangaroo pocket.', 199900, 'images/hoodie.jpg', 15);
  insert.run('Denim Jacket', 'Iconic denim, slightly oversized fit.', 299900, 'images/jacket.jpg', 10);
  insert.run('Running Shoes', 'Lightweight trainers for daily runs.', 399900, 'images/shoes.jpg', 18);
  console.log('Seeded sample products.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
const formatRupees = (paise) => (paise / 100).toFixed(2);

// Routes
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

app.post('/api/orders', (req, res) => {
  try {
    const { items, customer } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!customer || !customer.name || !customer.email || !customer.address) {
      return res.status(400).json({ error: 'Missing customer information' });
    }

    // Validate inventory and compute total
    let total = 0;
    const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
    const insertOrder = db.prepare('INSERT INTO orders (customer_name, customer_email, customer_address, total_amount) VALUES (?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price_each) VALUES (?, ?, ?, ?)');

    const tx = db.transaction(() => {
      for (const it of items) {
        const p = getProduct.get(it.product_id);
        if (!p) throw new Error(`Product ${it.product_id} not found`);
        if (p.stock < it.quantity) throw new Error(`Insufficient stock for ${p.title}`);
        total += p.price * it.quantity;
      }
      const orderInfo = insertOrder.run(customer.name, customer.email, customer.address, total);
      const orderId = orderInfo.lastInsertRowid;
      for (const it of items) {
        const p = getProduct.get(it.product_id);
        updateStock.run(it.quantity, it.product_id, it.quantity);
        insertItem.run(orderId, it.product_id, it.quantity, p.price);
      }
      return orderId;
    });

    const orderId = tx();
    res.json({ ok: true, order_id: orderId, total_amount: total, total_readable: `₹${formatRupees(total)}` });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'Order failed' });
  }
});

// Admin: fetch orders (basic)
app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const withItems = orders.map(o => ({ 
    ...o, 
    items: itemsStmt.all(o.id) 
  }));
  res.json(withItems);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
