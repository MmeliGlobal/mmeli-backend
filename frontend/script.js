// ========== SUPABASE & CONFIG (from your original) ==========
const SUPABASE_URL = 'https://proljdccjrifqgbmsyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xqZGNjanJpZnFnYm1zeWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc4ODAxOSwiZXhwIjoyMDkxMzY0MDE5fQ.VltzBUq-bLvu0Ny4jPy1kBp5E-4hffQgqFpqHrRWlZA';

const API = '/api';
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let map = null;
let appliedDiscount = null;
let currentDisplayLimit = 150;
let allShuffled = [];

// ========== CART FUNCTIONS (keeping existing) ==========
function updateCartCount() {
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = cart.reduce((s,i) => s + (i.quantity || 1), 0);
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart() {
  const saved = localStorage.getItem('cart');
  if (saved) try { cart = JSON.parse(saved); updateCartCount(); } catch(e) {}
}
function renderCartModal() {
  const container = document.getElementById('cartItemsContainer');
  const totalContainer = document.getElementById('cartTotalContainer');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
    if (totalContainer) totalContainer.innerText = 'Total: $0';
    return;
  }
  let html = '', total = 0;
  cart.forEach((item, i) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    total += price * qty;
    html += `<div class="cart-item">
      <div><strong>${escapeHtml(item.name)}</strong> x ${qty}</div>
      <div>
        <span>$${(price * qty).toFixed(2)}</span>
        <button class="remove-item" data-index="${i}"><i class="fas fa-trash-alt"></i></button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  if (totalContainer) totalContainer.innerText = `Total: $${total.toFixed(2)}`;
}
function addToCart(id, name, price, size, color) {
  const item = { id, name: `${name} (${size}, ${color})`, price, size, color, quantity: 1 };
  const existing = cart.find(i => i.id == id && i.size === size && i.color === color);
  if (existing) existing.quantity++;
  else cart.push(item);
  saveCart();
  updateCartCount();
  renderCartModal();
  showToast(`${name} added to cart`);
}
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCartModal();
}
function showToast(msg) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.cssText = 'position:fixed; bottom:20px; left:20px; background:#0f172a; color:white; padding:8px 16px; border-radius:40px; font-size:0.75rem; z-index:1001';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

// ========== API HELPERS (same as before) ==========
async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + endpoint, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Request failed');
  }
  return res.json();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== LOAD PRODUCTS (from your backend) ==========
async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    allProducts = await res.json();
    allShuffled = shuffleArray([...allProducts]);
    renderAllSections();
    // Also store in local cache
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch (e) {
    console.error('Error loading products:', e);
    const cached = localStorage.getItem('cachedProducts');
    if (cached) {
      allProducts = JSON.parse(cached);
      allShuffled = shuffleArray([...allProducts]);
      renderAllSections();
      showToast('Using cached products (server may be slow)');
    } else {
      alert('Could not load products. Please check backend.');
    }
  }
}

// ========== RENDER PRODUCTS INTO GRIDS ==========
function renderAllSections() {
  const featuredGrid = document.getElementById('featuredGrid');
  const comboGrid = document.getElementById('comboGrid');
  const mostViewedGrid = document.getElementById('mostViewedGrid');
  const recommendedGrid = document.getElementById('recommendedGrid');

  // Take first 8 as featured, next 8 as combo (simple logic)
  const featured = allShuffled.slice(0, 8);
  const combo = allShuffled.slice(8, 16);
  const mostViewed = allShuffled.slice(16, 24);
  const recommended = allShuffled.slice(24, 32);

  if (featuredGrid) renderProductGrid(featuredGrid, featured);
  if (comboGrid) renderProductGrid(comboGrid, combo);
  if (mostViewedGrid) renderProductGrid(mostViewedGrid, mostViewed);
  if (recommendedGrid) renderProductGrid(recommendedGrid, recommended);

  // Enable load more buttons (simple implementation)
  document.querySelectorAll('.load-more-btn').forEach(btn => {
    btn.style.display = 'block';
  });
}

function renderProductGrid(container, products) {
  container.innerHTML = '';
  products.forEach(p => {
    const card = createProductCard(p);
    container.appendChild(card);
  });
}

function createProductCard(product) {
  const div = document.createElement('div');
  div.className = 'product-item';
  const imgSrc = product.main_image || 'https://via.placeholder.com/300?text=Product';
  const badge = product.badge || '';

  let colorOpts = ['Color'];
  if (product.colors && product.colors.length) {
    colorOpts = colorOpts.concat(product.colors);
  } else {
    colorOpts = ['Color', 'Black', 'White', 'Red', 'Blue', 'Green'];
  }
  let sizeOpts = ['Size'];
  if (product.size_options && product.size_options.length) {
    sizeOpts = sizeOpts.concat(product.size_options.map(s => s.size));
  } else {
    sizeOpts = ['Size', 'Standard', 'Large', 'XL'];
  }

  const price = product.price || 0;

  div.innerHTML = `
    <div class="product-img" data-product-id="${product.id}">
      <img class="lazy" data-src="${imgSrc}" alt="${escapeHtml(product.name)}" loading="lazy">
    </div>
    <div class="product-info">
      ${badge ? `<span class="combo-badge">${escapeHtml(badge)}</span>` : ''}
      <h3>${escapeHtml(product.name)}</h3>
      <div class="product-desc-price">
        <div class="product-desc">${escapeHtml(product.description || '')}</div>
        <div class="price" data-base-price="${price}">$${price.toFixed(2)}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <select class="size-select">${sizeOpts.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}</select>
        <select class="select-color">${colorOpts.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select>
      </div>
      <button class="add-to-cart" data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${price}">Add to cart</button>
    </div>
  `;
  // Lazy load image
  const img = div.querySelector('.product-img img');
  if (img) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  }
  // Click on image opens product detail
  div.querySelector('.product-img').addEventListener('click', () => {
    openProductModal(product.id);
  });
  // Add to cart
  const addBtn = div.querySelector('.add-to-cart');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const size = div.querySelector('.size-select').value;
    const color = div.querySelector('.select-color').value;
    if (size === 'Size' || color === 'Color') {
      alert('Please select both size and color');
      return;
    }
    addToCart(product.id, product.name, product.price, size, color);
  });
  return div;
}

// ========== PRODUCT MODAL (detail view) ==========
function openProductModal(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) { alert('Product not found'); return; }
  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductDesc').innerText = product.description || '';
  document.getElementById('modalProductPrice').innerHTML = `$${product.price.toFixed(2)}`;
  const mainImg = document.getElementById('modalProductImage');
  mainImg.src = product.main_image || 'https://via.placeholder.com/600?text=Product';
  // Thumbnails (if any)
  const thumbContainer = document.getElementById('modalProductThumbnails');
  thumbContainer.innerHTML = '';
  if (product.images && product.images.length) {
    product.images.forEach(img => {
      const thumb = document.createElement('div');
      thumb.className = 'thumbnail-item';
      thumb.innerHTML = `<img src="${img}" alt="thumbnail">`;
      thumb.addEventListener('click', () => { mainImg.src = img; });
      thumbContainer.appendChild(thumb);
    });
  }
  // Related products (simple: same category)
  const relatedGrid = document.getElementById('relatedProductsGrid');
  relatedGrid.innerHTML = '';
  const related = allProducts.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4);
  related.forEach(p => {
    const card = document.createElement('div');
    card.className = 'related-product-card';
    card.innerHTML = `
      <img src="${p.main_image || 'https://via.placeholder.com/120'}" alt="${p.name}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="price">$${p.price}</div>
    `;
    card.addEventListener('click', () => { openProductModal(p.id); });
    relatedGrid.appendChild(card);
  });
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

// ========== CART MODAL ==========
function openCartModal() {
  renderCartModal();
  document.getElementById('cartModal').classList.add('open');
}
function closeCartModal() {
  document.getElementById('cartModal').classList.remove('open');
}

// ========== SIDE DRAWER ==========
function openDrawer() {
  document.getElementById('sideDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('sideDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

// ========== SEARCH ==========
function handleSearch() {
  const term = document.getElementById('searchInput').value.toLowerCase().trim();
  const items = document.querySelectorAll('.product-item');
  items.forEach(item => {
    const name = item.querySelector('h3')?.innerText.toLowerCase() || '';
    const desc = item.querySelector('.product-desc')?.innerText.toLowerCase() || '';
    const show = term === '' || name.includes(term) || desc.includes(term);
    item.style.display = show ? '' : 'none';
  });
}

// ========== CURRENCY (placeholder – you can implement real exchange if needed) ==========
let currentCurrency = 'USD';
function setCurrency(currency) {
  currentCurrency = currency;
  document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.currency-btn[data-currency="${currency}"]`)?.classList.add('active');
  // Update all prices (simplistic: just re-render)
  renderAllSections();
}

// ========== ADMIN (keep existing – accessible via double-click logo or hidden) ==========
// ... (your existing admin functions, not shown for brevity – they remain the same)

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  updateCartCount();
  renderCartModal();

  // Load products
  loadProducts();

  // Event listeners for UI
  document.getElementById('cartIconBtn')?.addEventListener('click', openCartModal);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCartModal);
  document.getElementById('hamburgerBtn')?.addEventListener('click', openDrawer);
  document.getElementById('closeDrawerBtn')?.addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
  document.getElementById('closeModalBtn')?.addEventListener('click', closeProductModal);
  document.getElementById('productModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('productModal')) closeProductModal();
  });
  document.getElementById('cartModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('cartModal')) closeCartModal();
  });
  document.getElementById('searchInput')?.addEventListener('input', handleSearch);

  // Currency buttons
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
  });
  setCurrency('USD');

  // Load more buttons – simple: just load more products (you can implement pagination)
  document.querySelectorAll('.load-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // For demo, just re-shuffle and re-render
      allShuffled = shuffleArray([...allProducts]);
      renderAllSections();
      showToast('More products loaded');
    });
  });

  // Login modal (basic)
  document.getElementById('loginBtn')?.addEventListener('click', () => {
    document.getElementById('loginModal').classList.add('active');
  });
  document.getElementById('closeLoginBtn')?.addEventListener('click', () => {
    document.getElementById('loginModal').classList.remove('active');
  });
  document.getElementById('loginSubmitBtn')?.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if (email && pass) {
      localStorage.setItem('mmeliUser', JSON.stringify({ email }));
      alert(`Logged in as ${email}`);
      document.getElementById('loginModal').classList.remove('active');
    } else alert('Enter email and password');
  });

  // Checkout
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (!cart.length) { alert('Cart empty'); return; }
    if (!user) { alert('Please login first'); return; }
    // Use existing checkout flow
    // ... you can call your original checkout functions
    alert('Checkout – implement your own logic');
  });
});

// ========== HELPER ==========
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
}

// ========== INCLUDE YOUR EXISTING FUNCTIONS (checkout, admin, tracking, etc.) ==========
// They remain unchanged – paste them here or reference the original script.
// For brevity, they are omitted but you can copy them from your current script.
