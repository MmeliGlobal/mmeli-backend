// ===== CONFIG =====
const API = '/api';
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentCategory = 'All';
let currentSubcategory = '';
let minPrice = '';
let maxPrice = '';

// ===== CART FUNCTIONS =====
function updateCartBadges() {
  const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  document.getElementById('cartCountBadge').innerText = total;
  document.getElementById('footerCartBadge').innerText = total;
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart() {
  const saved = localStorage.getItem('cart');
  if (saved) try { cart = JSON.parse(saved); } catch(e) {}
  updateCartBadges();
}
function renderCartModal() {
  const container = document.getElementById('cartItemsContainer');
  const totalContainer = document.getElementById('cartTotalContainer');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    totalContainer.innerText = 'Total: $0.00';
    return;
  }
  let html = '', total = 0;
  cart.forEach((item, i) => {
    const qty = item.quantity || 1;
    total += item.price * qty;
    html += `<div class="cart-item">
      <div><strong>${escapeHtml(item.name)}</strong> x ${qty}</div>
      <div>$${(item.price * qty).toFixed(2)} <button class="remove-item" data-index="${i}"><i class="fas fa-trash"></i></button></div>
    </div>`;
  });
  container.innerHTML = html;
  totalContainer.innerText = `Total: $${total.toFixed(2)}`;
  container.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', function() {
      cart.splice(parseInt(this.dataset.index), 1);
      saveCart();
      updateCartBadges();
      renderCartModal();
    });
  });
}
function addToCart(id, name, price, size, color) {
  const itemName = `${name} (${size}, ${color})`;
  const existing = cart.find(i => i.id == id && i.size === size && i.color === color);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ id, name: itemName, price, size, color, quantity: 1 });
  saveCart();
  updateCartBadges();
  renderCartModal();
  showToast(`${itemName} added`);
}
function showToast(msg) {
  const t = document.createElement('div');
  t.innerText = msg;
  t.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#0f172a; color:white; padding:8px 20px; border-radius:40px; font-size:0.8rem; z-index:1001;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]); }

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    allProducts = await res.json();
    renderProducts();
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch(e) {
    console.warn('Using cached products');
    const cached = localStorage.getItem('cachedProducts');
    if (cached) { allProducts = JSON.parse(cached); renderProducts(); }
    else { allProducts = generateDemoProducts(); renderProducts(); }
  }
}

function generateDemoProducts() {
  const names = ['iPhone 15', 'Galaxy S24', 'Sony Headphones', 'Dyson Vacuum', 'Nike Air Max', 'Canon Camera', 'John Deere Tractor', 'Makita Drill', 'Lace Wig', 'Electric Scooter', 'Samsung TV', 'MacBook Pro'];
  return names.map((name, i) => ({
    id: i+1,
    name,
    description: 'High quality product',
    price: 99 + i * 25,
    main_image: `https://picsum.photos/400/400?random=${i+10}`,
    cat: ['Phones','Cameras','Farming','Electronics','Hardware','Fashion','Phones','Electronics','Beauty','Electronics','Electronics','Electronics'][i] || 'Electronics',
    subcat: 'General',
    colors: ['Black', 'White'],
    size_options: [{ size: 'Standard', price: 99 + i * 25 }],
    badge: i%2===0 ? 'Best Seller' : ''
  }));
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  let filtered = [...allProducts];

  // Category filter
  if (currentCategory !== 'All') {
    filtered = filtered.filter(p => p.cat === currentCategory);
  }
  // Subcategory filter
  if (currentSubcategory) {
    filtered = filtered.filter(p => p.subcat === currentSubcategory);
  }
  // Price filter
  if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));

  if (!filtered.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">No products found</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const img = p.main_image || `https://picsum.photos/400/400?random=${p.id}`;
    const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : '';
    card.innerHTML = `
      <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://picsum.photos/400/400?random=${p.id}'">
      <div class="product-info">
        ${badge}
        <h3>${escapeHtml(p.name)}</h3>
        <div class="desc">${escapeHtml(p.description || '')}</div>
        <div class="price">$${p.price.toFixed(2)}</div>
        <button class="add-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}">Add to Cart</button>
      </div>
    `;
    // Click card to open detail
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') openProductModal(p.id);
    });
    // Add to cart button
    card.querySelector('.add-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      const size = 'Standard';
      const color = 'Default';
      addToCart(p.id, p.name, p.price, size, color);
    });
    container.appendChild(card);
  });
}

// ===== PRODUCT MODAL =====
function openProductModal(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) { alert('Product not found'); return; }
  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductDesc').innerText = product.description || '';
  document.getElementById('modalProductPrice').innerHTML = `$${product.price.toFixed(2)}`;
  const mainImg = document.getElementById('modalProductImage');
  mainImg.src = product.main_image || `https://picsum.photos/600/600?random=${product.id}`;

  // Thumbnails
  const thumbContainer = document.getElementById('modalProductThumbnails');
  thumbContainer.innerHTML = '';
  const thumbs = [product.main_image];
  if (product.images) thumbs.push(...product.images);
  thumbs.filter(Boolean).slice(0,4).forEach(img => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `<img src="${img}" alt="thumbnail">`;
    div.addEventListener('click', () => { mainImg.src = img; });
    thumbContainer.appendChild(div);
  });

  // Modal add to cart
  const modalAddBtn = document.getElementById('modalAddToCartBtn');
  const newBtn = modalAddBtn.cloneNode(true);
  modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);
  newBtn.addEventListener('click', function() {
    const size = document.getElementById('modalSizeSelect').value;
    const color = document.getElementById('modalColorSelect').value;
    if (size === 'Size' || color === 'Color') { alert('Select size and color'); return; }
    addToCart(product.id, product.name, product.price, size, color);
    document.getElementById('productModal').classList.remove('active');
  });

  // Related products
  const relatedGrid = document.getElementById('relatedProductsGrid');
  relatedGrid.innerHTML = '';
  const related = allProducts.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4);
  related.forEach(p => {
    const card = document.createElement('div');
    card.className = 'related-card';
    card.innerHTML = `
      <img src="${p.main_image || 'https://picsum.photos/200/200?random='+p.id}" alt="${p.name}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="price">$${p.price}</div>
    `;
    card.addEventListener('click', () => { openProductModal(p.id); });
    relatedGrid.appendChild(card);
  });

  modal.classList.add('active');
}
function closeProductModal() { document.getElementById('productModal').classList.remove('active'); }

// ===== FILTER FUNCTIONS =====
function applyFilters() {
  currentCategory = document.getElementById('categoryFilter').value || 'All';
  currentSubcategory = document.getElementById('subcategoryFilter').value || '';
  minPrice = document.getElementById('minPrice').value || '';
  maxPrice = document.getElementById('maxPrice').value || '';
  renderProducts();
}

function resetFilters() {
  document.getElementById('categoryFilter').value = '';
  document.getElementById('subcategoryFilter').value = '';
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  currentCategory = 'All';
  currentSubcategory = '';
  minPrice = '';
  maxPrice = '';
  renderProducts();
  // Reset active chip
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip[data-category="All"]')?.classList.add('active');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  renderCartModal();
  loadProducts();

  // Category chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.category;
      document.getElementById('categoryFilter').value = cat === 'All' ? '' : cat;
      applyFilters();
    });
  });

  // Filter inputs
  document.getElementById('categoryFilter').addEventListener('change', applyFilters);
  document.getElementById('subcategoryFilter').addEventListener('change', applyFilters);
  document.getElementById('minPrice').addEventListener('input', applyFilters);
  document.getElementById('maxPrice').addEventListener('input', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);

  // Search
  document.getElementById('searchInput').addEventListener('input', function() {
    const term = this.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const name = card.querySelector('h3')?.innerText.toLowerCase() || '';
      const desc = card.querySelector('.desc')?.innerText.toLowerCase() || '';
      const show = term === '' || name.includes(term) || desc.includes(term);
      card.style.display = show ? '' : 'none';
    });
  });

  // Cart modal
  document.getElementById('cartIconBtn').addEventListener('click', () => {
    renderCartModal();
    document.getElementById('cartModal').classList.add('active');
  });
  document.getElementById('closeCartBtn').addEventListener('click', () => {
    document.getElementById('cartModal').classList.remove('active');
  });
  document.getElementById('cartModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('cartModal')) document.getElementById('cartModal').classList.remove('active');
  });

  // Product modal
  document.getElementById('closeModalBtn').addEventListener('click', closeProductModal);
  document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('productModal')) closeProductModal();
  });

  // Footer navigation
  document.getElementById('footerHome').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.footer-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.getElementById('searchInput').value = '';
    resetFilters();
    document.querySelector('.chip[data-category="All"]')?.classList.add('active');
  });
  document.getElementById('footerCart').addEventListener('click', (e) => {
    e.preventDefault();
    renderCartModal();
    document.getElementById('cartModal').classList.add('active');
  });

  // Checkout
  document.getElementById('checkoutBtn').addEventListener('click', function() {
    if (!cart.length) { alert('Cart is empty'); return; }
    const total = cart.reduce((s,i) => s + i.price * i.quantity, 0);
    alert(`Proceed to checkout. Total: $${total.toFixed(2)}`);
  });
});
