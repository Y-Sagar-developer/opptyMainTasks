// ===== SHOPZONE STORE UTILITIES =====

const Store = {
  // Cart
  getCart() {
    return JSON.parse(localStorage.getItem('sz_cart') || '[]');
  },
  saveCart(cart) {
    localStorage.setItem('sz_cart', JSON.stringify(cart));
  },
  addToCart(product) {
    // this.getCart() అంటే ప్రస్తుత cart తీసుకో. this అంటే Store object తనే.
    const cart = this.getCart();
    const existing = cart.find(i => String(i.id) === String(product.id));
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    this.saveCart(cart);
    this.updateCartBadge();
  },
  removeFromCart(id) {
    const cart = this.getCart().filter(i => String(i.id) !== String(id));
    this.saveCart(cart);
    this.updateCartBadge();
  },
  updateQty(id, qty) {
    const cart = this.getCart();
    const item = cart.find(i => String(i.id) === String(id));
    if (item) {
      item.qty = qty;
      if (item.qty <= 0) return this.removeFromCart(id);
    }
    this.saveCart(cart);
    this.updateCartBadge();
  },
  clearCart() {
    localStorage.removeItem('sz_cart');
    this.updateCartBadge();
  },
// cart = [{price:100, qty:2}, {price:50, qty:3}]
// getCartCount() → 2 + 3 = 5 items
// getCartTotal() → (100×2) + (50×3) = 200 + 150 = $350
  getCartCount() {
    return this.getCart().reduce((sum, i) => sum + i.qty, 0);
  },
  getCartTotal() {
    return this.getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  
  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = this.getCartCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },



  // Orders
  getOrders() {
    return JSON.parse(localStorage.getItem('sz_orders') || '[]');
  },
  saveOrder(order) {
    const orders = this.getOrders();
    order.id    = 'ORD-' + Date.now();
    order.date  = new Date().toLocaleString();
    order.status = 'Pending';   // starts as Pending, admin changes it
    orders.unshift(order);
    localStorage.setItem('sz_orders', JSON.stringify(orders));
    return order.id;
  },
  // admin panel lo change 
  updateOrderStatus(id, status) {
    const orders = this.getOrders();
    const order  = orders.find(o => o.id === id);
    if (order) order.status = status;
    localStorage.setItem('sz_orders', JSON.stringify(orders));
  },
  deleteOrder(id) {
    const orders = this.getOrders().filter(o => o.id !== id);
    localStorage.setItem('sz_orders', JSON.stringify(orders));
  },
  // Get orders for a specific user email
  getOrdersByUser(email) {
    return this.getOrders().filter(o => o.userEmail === email);
  },

  // Admin Products
  getAdminProducts() {
    return JSON.parse(localStorage.getItem('sz_admin_products') || '[]');
  },
  saveAdminProduct(product) {
    const products = this.getAdminProducts();
    product.id = 'AP-' + Date.now();
    product.isAdmin = true;
    products.unshift(product);
    localStorage.setItem('sz_admin_products', JSON.stringify(products));
  },
  updateAdminProduct(id, updated) {
    const products = this.getAdminProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) products[idx] = { ...products[idx], ...updated };
    localStorage.setItem('sz_admin_products', JSON.stringify(products));
  },
  deleteAdminProduct(id) {
    const products = this.getAdminProducts().filter(p => p.id !== id);
    localStorage.setItem('sz_admin_products', JSON.stringify(products));
  }
};

// ===== TOAST =====
function showToast(message, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast ' + type;
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== STATUS BADGE =====
function statusBadge(status) {
  const map = {
    'Pending':    'badge-warning',
    'Processing': 'badge-info',
    'Completed':  'badge-success',
    'Cancelled':  'badge-danger'
  };
  return `<span class="badge ${map[status] || 'badge-info'}">${status}</span>`;
}

// ===== PRODUCT CARD BUILDER =====
function buildProductCard(product, showAddCart = true) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${product.image}" alt="${product.title}" loading="lazy" />
    </div>
    <div class="product-info">
      <div class="product-category">${product.category || ''}</div>
      <div class="product-title">${product.title}</div>
      <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
      ${showAddCart ? `<button class="btn-add-cart" data-id="${product.id}">🛒 Add to Cart</button>` : ''}
    </div>
  `;
  if (showAddCart) {
    card.querySelector('.btn-add-cart').addEventListener('click', function () {
      Store.addToCart(product);
      this.textContent = '✅ Added!';
      this.classList.add('added');
      setTimeout(() => {
        this.textContent = '🛒 Add to Cart';
        this.classList.remove('added');
      }, 1500);
      showToast('Added to cart!', 'success');
    });
  }
  return card;
}


