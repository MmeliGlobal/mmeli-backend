// ===== CONFIG =====
const API = '/api';
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentCategory = 'All';
let currentSubcategory = '';
let minPrice = '';
let maxPrice = '';
let currentUser = null;

// ===== SUBCATEGORY MAPPING =====
const subcategoryMap = {
  'Phones': ['Apple', 'Samsung', 'Google', 'Huawei', 'OnePlus'],
  'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer'],
  'Accessories': ['Chargers', 'Cases', 'Screen Protectors', 'Power Banks', 'Headphones'],
  'Tablets': ['Apple', 'Samsung', 'Lenovo', 'Microsoft']
};

// ===== CART =====
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
      saveCart(); updateCartBadges(); renderCartModal();
    });
  });
}
function addToCart(id, name, price, size, color) {
  const itemName = `${name} (${size}, ${color})`;
  const existing = cart.find(i => i.id == id && i.size === size && i.color === color);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ id, name: itemName, price, size, color, quantity: 1 });
  saveCart(); updateCartBadges(); renderCartModal();
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

// ===== TRACKING =====
function trackOrder() {
  const code = document.getElementById('trackCodeInput').value.trim();
  const resultDiv = document.getElementById('trackResult');
  const timelineDiv = document.getElementById('trackTimeline');
  if (!code) { resultDiv.innerHTML = '<span style="color:#dc2626;">Enter a tracking code</span>'; return; }
  resultDiv.innerHTML = '<span style="color:#1e3a8a;">Searching...</span>';
  // Simulate API call
  setTimeout(() => {
    const statuses = ['Ordered', 'Shipped', 'In Transit', 'Delivered'];
    const completed = Math.floor(Math.random() * statuses.length) + 1;
    const steps = statuses.map((s, i) => `<span class="step ${i < completed ? 'completed' : ''}">${s}</span>`).join('');
    resultDiv.innerHTML = `
      <div style="background:#f0f9ff; padding:12px; border-radius:12px;">
        <strong>Order #${code}</strong><br>
        Status: <span style="color:#16a34a; font-weight:700;">${statuses[completed-1]}</span><br>
        Estimated Delivery: ${new Date(Date.now() + 3*86400000).toLocaleDateString()}
      </div>
    `;
    timelineDiv.innerHTML = steps;
  }, 800);
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    allProducts = await res.json();
    renderProducts();
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch(e) {
    console.warn('Using cached or demo products');
    const cached = localStorage.getItem('cachedProducts');
    if (cached) { allProducts = JSON.parse(cached); renderProducts(); }
    else { allProducts = generateDemoProducts(); renderProducts(); }
  }
}

function generateDemoProducts() {
  const names = ['iPhone 15 Pro Max', 'Samsung Galaxy S24', 'MacBook Pro 14"', 'Dell XPS 16', 'iPad Pro', 'Sony Headphones', 'Apple Watch', 'Lenovo ThinkPad'];
  const cats = ['Phones','Phones','Laptops','Laptops','Tablets','Accessories','Accessories','Laptops'];
  const brands = ['Apple','Samsung','Apple','Dell','Apple','Sony','Apple','Lenovo'];
  return names.map((name, i) => ({
    id: i+1,
    name,
    description: 'Premium quality',
    price: 199 + i * 150,
    main_image: `https://picsum.photos/400/400?random=${i+10}`,
    cat: cats[i] || 'Phones',
    subcat: brands[i] || 'General',
    colors: ['Black', 'White', 'Gray', 'Silver'],
    size_options: [
      { size: '64GB', price: 199 + i * 150 },
      { size: '128GB', price: 199 + i * 150 + 100 },
      { size: '256GB', price: 199 + i * 150 + 200 }
    ],
    badge: i%2===0 ? 'Best Seller' : ''
  }));
}

// ===== RENDER PRODUCTS WITH SIZE/COLOR PRICE UPDATE =====
function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  let filtered = [...allProducts];
  if (currentCategory !== 'All') filtered = filtered.filter(p => p.cat === currentCategory);
  if (currentSubcategory) filtered = filtered.filter(p => p.subcat === currentSubcategory);
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
    // Build size and color dropdowns
    const sizes = p.size_options && p.size_options.length ? p.size_options : [{ size: 'Standard', price: p.price }];
    const colors = p.colors && p.colors.length ? p.colors : ['Default'];
    let sizeOpts = sizes.map(s => `<option value="${escapeHtml(s.size)}" data-price="${s.price}">${escapeHtml(s.size)}</option>`).join('');
    let colorOpts = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    const basePrice = sizes[0].price;

    card.innerHTML = `
      <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://picsum.photos/400/400?random=${p.id}'">
      <div class="product-info">
        ${badge}
        <h3>${escapeHtml(p.name)}</h3>
        <div class="desc">${escapeHtml(p.description || '')}</div>
        <div class="price" data-base-price="${basePrice}">$${basePrice.toFixed(2)}</div>
        <div class="size-color-row">
          <select class="size-select">${sizeOpts}</select>
          <select class="color-select">${colorOpts}</select>
        </div>
        <button class="add-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${basePrice}">Add to Cart</button>
      </div>
    `;

    // Price update on size change
    const priceSpan = card.querySelector('.price');
    const sizeSelect = card.querySelector('.size-select');
    const addBtn = card.querySelector('.add-btn');
    sizeSelect.addEventListener('change', function() {
      const selected = this.options[this.selectedIndex];
      const newPrice = parseFloat(selected.dataset.price);
      priceSpan.innerText = `$${newPrice.toFixed(2)}`;
      addBtn.dataset.price = newPrice;
    });

    // Click card to open product modal
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('select')) openProductModal(p.id);
    });

    // Add to cart
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const size = sizeSelect.value;
      const color = card.querySelector('.color-select').value;
      const price = parseFloat(this.dataset.price);
      addToCart(p.id, p.name, price, size, color);
    });

    container.appendChild(card);
  });
}

// ===== PRODUCT MODAL (with size/color) =====
function openProductModal(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) { alert('Product not found'); return; }
  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductDesc').innerText = product.description || '';
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

  // Sizes & Colors
  const sizeSelect = document.getElementById('modalSizeSelect');
  const colorSelect = document.getElementById('modalColorSelect');
  const sizes = product.size_options && product.size_options.length ? product.size_options : [{ size: 'Standard', price: product.price }];
  const colors = product.colors && product.colors.length ? product.colors : ['Default'];
  sizeSelect.innerHTML = sizes.map(s => `<option value="${escapeHtml(s.size)}" data-price="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`).join('');
  colorSelect.innerHTML = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  const priceDisplay = document.getElementById('modalProductPrice');
  const updateModalPrice = () => {
    const selected = sizeSelect.options[sizeSelect.selectedIndex];
    const price = parseFloat(selected.dataset.price);
    priceDisplay.innerText = `$${price.toFixed(2)}`;
  };
  sizeSelect.addEventListener('change', updateModalPrice);
  updateModalPrice();

  // Modal add to cart
  const modalAddBtn = document.getElementById('modalAddToCartBtn');
  const newBtn = modalAddBtn.cloneNode(true);
  modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);
  newBtn.addEventListener('click', function() {
    const size = sizeSelect.value;
    const color = colorSelect.value;
    const price = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.price);
    addToCart(product.id, product.name, price, size, color);
    document.getElementById('productModal').classList.remove('active');
  });

  // Related products
  const relatedGrid = document.getElementById('relatedProductsGrid');
  relatedGrid.innerHTML = '';
  const related = allProducts.filter(p => p.cat === product.cat && p.id !== product.id).slice(0,4);
  related.forEach(p => {
    const card = document.createElement('div');
    card.className = 'related-card';
    card.innerHTML = `
      <img src="${p.main_image || 'https://picsum.photos/200/200?random='+p.id}" alt="${p.name}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="price">$${p.price}</div>
    `;
    card.addEventListener('click', () => openProductModal(p.id));
    relatedGrid.appendChild(card);
  });

  modal.classList.add('active');
}
function closeProductModal() { document.getElementById('productModal').classList.remove('active'); }

// ===== FILTERS =====
function populateSubcategories(category) {
  const subSelect = document.getElementById('subcategoryFilter');
  subSelect.innerHTML = '<option value="">All Subcategories</option>';
  if (category && subcategoryMap[category]) {
    subcategoryMap[category].forEach(sub => {
      subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
  }
}

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
  document.getElementById('searchInput').value = '';
  currentCategory = 'All'; currentSubcategory = ''; minPrice = ''; maxPrice = '';
  populateSubcategories('');
  renderProducts();
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip[data-category="All"]')?.classList.add('active');
  // Reset all product cards visibility
  document.querySelectorAll('.product-card').forEach(c => c.style.display = '');
}

// ===== ACCOUNT FUNCTIONS =====
function login() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) { alert('Enter email and password'); return; }
  // Mock login
  currentUser = { name: email.split('@')[0], email };
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('userName').innerText = currentUser.name;
  localStorage.setItem('mmeliUser', JSON.stringify(currentUser));
  showToast('Logged in');
}
function register() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const email = document.getElementById('regEmail').value;
  const address = document.getElementById('regAddress').value;
  const pass = document.getElementById('regPassword').value;
  if (!name || !phone || !pass) { alert('Name, phone and password required'); return; }
  currentUser = { name, email, phone, address };
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('userName').innerText = currentUser.name;
  localStorage.setItem('mmeliUser', JSON.stringify(currentUser));
  showToast('Registered successfully');
}
function logout() {
  currentUser = null;
  localStorage.removeItem('mmeliUser');
  document.getElementById('loginBox').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('customerData').innerHTML = '';
  showToast('Logged out');
}
function showMyOrders() {
  document.getElementById('customerData').innerHTML = '<div style="padding:12px; background:#f8fafc; border-radius:12px;">Your orders will appear here</div>';
}
function showMyQuotations() {
  document.getElementById('customerData').innerHTML = '<div style="padding:12px; background:#f8fafc; border-radius:12px;">Your quotations will appear here</div>';
}
function showMyReturns() {
  document.getElementById('customerData').innerHTML = '<div style="padding:12px; background:#f8fafc; border-radius:12px;">Your returns will appear here</div>';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  renderCartModal();
  loadProducts();

  // Restore user if exists
  const savedUser = localStorage.getItem('mmeliUser');
  if (savedUser) {
    try { currentUser = JSON.parse(savedUser); 
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('userName').innerText = currentUser.name;
    } catch(e) {}
  }

  // Category chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.category;
      document.getElementById('categoryFilter').value = cat === 'All' ? '' : cat;
      populateSubcategories(cat === 'All' ? '' : cat);
      applyFilters();
    });
  });

  // Filter events
  document.getElementById('categoryFilter').addEventListener('change', function() {
    const cat = this.value;
    populateSubcategories(cat);
    applyFilters();
    // Update active chip
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    const chip = document.querySelector(`.chip[data-category="${cat || 'All'}"]`);
    if (chip) chip.classList.add('active');
  });
  document.getElementById('subcategoryFilter').addEventListener('change', applyFilters);
  document.getElementById('minPrice').addEventListener('input', applyFilters);
  document.getElementById('maxPrice').addEventListener('input', applyFilters);

  // Search
  document.getElementById('searchInput').addEventListener('input', function() {
    const term = this.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const name = card.querySelector('h3')?.innerText.toLowerCase() || '';
      const desc = card.querySelector('.desc')?.innerText.toLowerCase() || '';
      card.style.display = term === '' || name.includes(term) || desc.includes(term) ? '' : 'none';
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

  // Tracking modal
  document.getElementById('footerTracking').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('trackingModal').classList.add('active');
  });
  document.getElementById('closeTrackingBtn').addEventListener('click', () => {
    document.getElementById('trackingModal').classList.remove('active');
  });
  document.getElementById('trackingModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('trackingModal')) document.getElementById('trackingModal').classList.remove('active');
  });
  document.getElementById('trackOrderBtn').addEventListener('click', trackOrder);
  document.getElementById('trackCodeInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') trackOrder(); });

  // Account modal
  document.getElementById('footerAccount').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('accountModal').classList.add('active');
  });
  document.getElementById('closeAccountBtn').addEventListener('click', () => {
    document.getElementById('accountModal').classList.remove('active');
  });
  document.getElementById('accountModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('accountModal')) document.getElementById('accountModal').classList.remove('active');
  });
  document.getElementById('loginSubmitBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);

  // More modal
  document.getElementById('footerMore').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('moreModal').classList.add('active');
  });
  document.getElementById('closeMoreBtn').addEventListener('click', () => {
    document.getElementById('moreModal').classList.remove('active');
  });
  document.getElementById('moreModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('moreModal')) document.getElementById('moreModal').classList.remove('active');
  });

  // Product modal
  document.getElementById('closeModalBtn').addEventListener('click', closeProductModal);
  document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('productModal')) closeProductModal();
  });

  // Footer Home = reset
  document.getElementById('footerHome').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.footer-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
    resetFilters();
    document.querySelector('.chip[data-category="All"]')?.classList.add('active');
    showToast('Refreshed');
  });

  // Footer Cart
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

  // Populate subcategories initially
  populateSubcategories('');
});
