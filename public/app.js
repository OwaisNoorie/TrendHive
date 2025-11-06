// Utilities
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const formatRupees = (p) => `₹${(p/100).toFixed(2)}`;

const cartKey = 'trendhive_cart';
const getCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');
const setCart = (items) => { localStorage.setItem(cartKey, JSON.stringify(items)); updateCartBadge(); };
const addToCart = (product, qty=1) => {
  const cart = getCart();
  const found = cart.find(i => i.product_id === product.id);
  if (found) { found.quantity += qty; }
  else { cart.push({ product_id: product.id, title: product.title, price: product.price, quantity: qty }); }
  setCart(cart);
  alert('Added to cart!');
};

function updateCartBadge() {
  const count = getCart().reduce((n, i) => n + i.quantity, 0);
  const el = $('#cart-count');
  if (el) el.textContent = count;
}

// Pages
window.renderHome = async function() {
  updateCartBadge();
  const res = await fetch('/api/products');
  const products = await res.json();
  const grid = $('#product-grid');
  grid.innerHTML = products.map(p => `
    <div class="product-card card">
      <a href="/product.html?id=${p.id}">
        <img src="${p.image || 'images/shirt.jpg'}" alt="${p.title}" />
      </a>
      <h3>${p.title}</h3>
      <div class="muted">${p.stock} in stock</div>
      <div class="price">${formatRupees(p.price)}</div>
      <div style="display:flex; gap: 8px; margin-top: 10px;">
        <button onclick="location.href='/product.html?id=${p.id}'" class="btn">View</button>
        <button class="btn" onclick='(async()=>{ const p = await (await fetch("/api/products/${p.id}")).json(); addToCart(p, 1); })()'>Add</button>
      </div>
    </div>
  `).join('');
};

window.renderProduct = async function() {
  updateCartBadge();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const res = await fetch('/api/products/' + id);
  if (res.status !== 200) { $('#product-detail').textContent = 'Product not found'; return; }
  const p = await res.json();
  $('#product-detail').innerHTML = `
    <div>
      <img src="${p.image}" alt="${p.title}">
    </div>
    <div>
      <h1>${p.title}</h1>
      <div class="price">${formatRupees(p.price)}</div>
      <p>${p.description || ''}</p>
      <div style="display:flex; gap: 10px; align-items:center; margin: 10px 0;">
        <input id="qty" type="number" min="1" value="1" style="max-width: 100px;">
        <button id="add">Add to cart</button>
      </div>
      <div class="muted">${p.stock} in stock</div>
    </div>
  `;
  $('#add').addEventListener('click', () => {
    const qty = Math.max(1, parseInt($('#qty').value || '1', 10));
    addToCart(p, qty);
  });
};

window.renderCart = async function() {
  updateCartBadge();
  const cart = getCart();
  const container = $('#cart');
  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  // fetch latest prices
  const products = await (await fetch('/api/products')).json();
  const map = Object.fromEntries(products.map(p => [p.id, p]));
  let total = 0;
  container.innerHTML = `
    <table>
      <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>
        ${cart.map(item => {
          const p = map[item.product_id];
          const price = p ? p.price : item.price;
          const sub = price * item.quantity;
          total += sub;
          return `
            <tr>
              <td>${item.title}</td>
              <td>${formatRupees(price)}</td>
              <td>
                <input type="number" min="1" value="${item.quantity}" data-id="${item.product_id}" class="qty-input" style="max-width:80px">
              </td>
              <td>${formatRupees(sub)}</td>
              <td><button class="btn-remove" data-id="${item.product_id}">Remove</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
      <tfoot>
        <tr><td colspan="3" class="total">Total</td><td class="total">${formatRupees(total)}</td><td></td></tr>
      </tfoot>
    </table>
  `;

  // quantity changes
  $$('.qty-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const id = parseInt(inp.dataset.id, 10);
      const qty = Math.max(1, parseInt(inp.value || '1', 10));
      const cart = getCart();
      const it = cart.find(i => i.product_id === id);
      if (it) it.quantity = qty;
      setCart(cart);
      window.renderCart();
    });
  });
  // remove buttons
  $$('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const cart = getCart().filter(i => i.product_id !== id);
      setCart(cart);
      window.renderCart();
    });
  });

  // checkout
  $('#checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = getCart();
    const payload = {
      items,
      customer: {
        name: $('#name').value.trim(),
        email: $('#email').value.trim(),
        address: $('#address').value.trim()
      }
    };
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Order placed! Order #${data.order_id} • Total ${data.total_readable}`);
      setCart([]);
      location.href = '/';
    } else {
      alert(data.error || 'Order failed.');
    }
  });
};

window.renderAdmin = async function() {
  updateCartBadge();
  const res = await fetch('/api/orders');
  const orders = await res.json();
  if (!orders.length) { $('#orders').innerHTML = '<p>No orders yet.</p>'; return; }
  $('#orders').innerHTML = orders.map(o => `
    <div class="card" style="margin-bottom:12px">
      <div><strong>Order #${o.id}</strong> • ₹${(o.total_amount/100).toFixed(2)} • ${new Date(o.created_at).toLocaleString()}</div>
      <div>${o.customer_name} — ${o.customer_email}</div>
      <div class="muted">${o.customer_address}</div>
      <ul>
        ${o.items.map(it => `<li>Product ${it.product_id} × ${it.quantity} @ ₹${(it.price_each/100).toFixed(2)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
};

updateCartBadge();
