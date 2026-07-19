// ===== CONFIG =====
const API = '/api'; // change to your full backend URL if needed
const DISPLAY_LIMIT = 20;
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentCategory = 'All';
let currentSubcategory = '';
let minPrice = '';
let maxPrice = '';
let currentUser = null;
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let mapInstance = null;
let currentDisplayLimit = DISPLAY_LIMIT;

// ===== SUBCATEGORY MAPPING =====
const subcategoryMap = {
  'Phones': ['Apple', 'Samsung', 'Google', 'Huawei', 'OnePlus'],
  'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer'],
  'Accessories': ['Chargers', 'Cases', 'Screen Protectors', 'Power Banks', 'Headphones'],
  'Tablets': ['Apple', 'Samsung', 'Lenovo', 'Microsoft']
};

// ===== UTILITY =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}
function showToast(msg) {
  const t = document.createElement('div');
  t.innerText = msg;
  t.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#0f172a; color:white; padding:8px 20px; border-radius:40px; font-size:0.8rem; z-index:1001;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}

// ===== SHARE =====
function shareProduct(productId) {
  const product = allProducts.find(p => p.id == productId);
  if (!product) { alert('Product not found'); return; }
  const baseUrl = window.location.origin + window.location.pathname;
  const productUrl = `${baseUrl}?product=${product.id}`;
  const message = `📱 *${product.name}*%0A💰 Price: $${product.price.toFixed(2)}%0A%0A${product.description || 'Check out this product'}%0A%0A👉 View product: ${productUrl}%0A%0A🛒 Shop more at Mmeli Global`;
  const phone = '263776871711';
  const waUrl = `https://wa.me/${phone}?text=${message}`;
  window.open(waUrl, '_blank');
}

// ===== UPDATE SOCIAL MEDIA META TAGS =====
function updateMetaTags(product) {
  if (!product) return;
  document.title = product.name + ' | Mmeli Global';

  const metaTags = [
    { property: 'og:title', content: product.name },
    { property: 'og:description', content: product.description || 'Shop premium phones & laptops at Mmeli Global' },
    { property: 'og:image', content: product.main_image || 'https://mmeliglobal.com/logo.png' },
    { property: 'og:url', content: window.location.href },
    { property: 'og:type', content: 'product' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: product.name },
    { name: 'twitter:description', content: product.description || 'Check out this product on Mmeli Global' },
    { name: 'twitter:image', content: product.main_image || 'https://mmeliglobal.com/logo.png' }
  ];

  metaTags.forEach(tag => {
    let meta;
    if (tag.property) {
      meta = document.querySelector(`meta[property="${tag.property}"]`);
    } else if (tag.name) {
      meta = document.querySelector(`meta[name="${tag.name}"]`);
    }
    if (meta) {
      meta.content = tag.content;
    } else {
      meta = document.createElement('meta');
      if (tag.property) meta.setAttribute('property', tag.property);
      if (tag.name) meta.setAttribute('name', tag.name);
      meta.content = tag.content;
      document.head.appendChild(meta);
    }
  });
}

// ===== CART (with quantity support) =====
function updateCartBadges() {
  const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = total;
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart() {
  const saved = localStorage.getItem('cart');
  if (saved) try { cart = JSON.parse(saved); } catch (e) {}
  updateCartBadges();
}
function renderCartModal() {
  const container = document.getElementById('cartItemsContainer');
  const totalContainer = document.getElementById('cartTotalContainer');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    if (totalContainer) totalContainer.innerText = 'Total: $0.00';
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
  if (totalContainer) totalContainer.innerText = `Total: $${total.toFixed(2)}`;
  container.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', function() {
      cart.splice(parseInt(this.dataset.index), 1);
      saveCart(); updateCartBadges(); renderCartModal();
    });
  });
}
function addToCart(id, name, price, size, color, qty = 1) {
  const itemName = `${name} (${size}, ${color})`;
  const existing = cart.find(i => i.id == id && i.size === size && i.color === color);
  if (existing) existing.quantity += qty;
  else cart.push({ id, name: itemName, price, size, color, quantity: qty });
  saveCart(); updateCartBadges(); renderCartModal();
  showToast(`${qty} × ${itemName} added`);
}

// ===== CHECKOUT (WhatsApp) =====
function checkoutToWhatsApp() {
  if (!cart.length) { alert('Cart is empty'); return; }
  let total = 0;
  let itemsText = cart.map(item => {
    const qty = item.quantity || 1;
    total += item.price * qty;
    return `${item.name} x ${qty} = $${(item.price * qty).toFixed(2)}`;
  }).join('%0A');
  const message = `🛒 *New Order Summary*%0A%0A${itemsText}%0A%0A💰 *Total: $${total.toFixed(2)}*%0A%0A📦 Please confirm payment and shipping address.`;
  const phone = '263776871711';
  const url = `https://wa.me/${phone}?text=${message}`;
  window.open(url, '_blank');
}

// ===== TRACKING =====
function initTrackingMap() {
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  const mapContainer = document.getElementById('trackMap');
  if (!mapContainer) return;
  mapInstance = L.map(mapContainer).setView([-17.825, 31.033], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance);
  L.marker([-17.825, 31.033]).addTo(mapInstance).bindPopup('Mmeli Global HQ').openPopup();
}
function trackOrder() {
  const code = document.getElementById('trackCodeInput').value.trim();
  const resultDiv = document.getElementById('trackResult');
  const timelineDiv = document.getElementById('trackTimeline');
  if (!code) { resultDiv.innerHTML = '<span style="color:#dc2626;">Enter a tracking code</span>'; return; }
  resultDiv.innerHTML = '<span style="color:#1e3a8a;">Searching...</span>';
  setTimeout(() => {
    const statuses = ['Ordered', 'Shipped', 'In Transit', 'Delivered'];
    const completed = Math.floor(Math.random() * statuses.length) + 1;
    const steps = statuses.map((s, i) => `<span class="step ${i < completed ? 'completed' : ''}">${s}</span>`).join('');
    resultDiv.innerHTML = `
      <div style="background:#f0f9ff; padding:12px; border-radius:12px;">
        <strong>Order #${code}</strong><br>
        Status: <span style="color:#16a34a; font-weight:700;">${statuses[completed-1]}</span><br>
        Estimated Delivery: ${new Date(Date.now() + 3 * 86400000).toLocaleDateString()}
      </div>
    `;
    timelineDiv.innerHTML = steps;
    if (mapInstance) {
      const lat = -17.825 + (Math.random() - 0.5) * 0.5;
      const lng = 31.033 + (Math.random() - 0.5) * 0.5;
      mapInstance.setView([lat, lng], 10);
      L.marker([lat, lng]).addTo(mapInstance).bindPopup('Current location of your order').openPopup();
    }
  }, 800);
}

// ===== PRODUCTS =====
function generateDemoProducts() {
  const names = ['iPhone 15 Pro Max', 'Samsung Galaxy S24', 'MacBook Pro 14"', 'Dell XPS 16', 'iPad Pro', 'Sony Headphones', 'Apple Watch', 'Lenovo ThinkPad'];
  const cats = ['Phones', 'Phones', 'Laptops', 'Laptops', 'Tablets', 'Accessories', 'Accessories', 'Laptops'];
  const brands = ['Apple', 'Samsung', 'Apple', 'Dell', 'Apple', 'Sony', 'Apple', 'Lenovo'];
  return names.map((name, i) => ({
    id: i + 1,
    name,
    description: 'Premium quality product',
    price: 199 + i * 150,
    main_image: `https://picsum.photos/400/400?random=${i + 100}`,
    images: [],
    cat: cats[i] || 'Phones',
    subcat: brands[i] || 'General',
    colors: ['Black', 'White', 'Gray', 'Silver'],
    size_options: [
      { size: '64GB', price: 199 + i * 150 },
      { size: '128GB', price: 199 + i * 150 + 100 },
      { size: '256GB', price: 199 + i * 150 + 200 }
    ],
    badge: i % 2 === 0 ? 'Best Seller' : '',
    min_order: i % 2 === 0 ? 5 : 1
  }));
}

// ===== CREATE PRODUCT CARD =====
function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  const imgSrc = p.main_image || '';
  const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : '';
  const sizes = p.size_options && p.size_options.length ? p.size_options : [{ size: 'Standard', price: p.price }];
  const colors = p.colors && p.colors.length ? p.colors : ['Default'];
  let sizeOpts = sizes.map(s => `<option value="${escapeHtml(s.size)}" data-price="${s.price}">${escapeHtml(s.size)}</option>`).join('');
  let colorOpts = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  const basePrice = sizes[0].price;
  const minOrder = p.min_order || 1;

  card.innerHTML = `
    <div class="image-wrapper" style="position:relative;">
      <img 
        class="lazy" 
        data-src="${imgSrc}" 
        alt="${escapeHtml(p.name)}" 
        style="opacity:0; width:100%; height:100%; object-fit:cover;"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      >
      <div style="display:none; align-items:center; justify-content:center; width:100%; height:100%; background:#f0f0f0; color:#999; font-size:0.8rem; position:absolute; top:0; left:0;">
        No Image
      </div>
      <!-- Share button on image -->
      <button class="share-btn-img" data-id="${p.id}" style="position:absolute; bottom:10px; right:10px; background:rgba(255,255,255,0.9); border:none; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#25D366; font-size:1.2rem; box-shadow:0 2px 8px rgba(0,0,0,0.15); transition:0.2s; z-index:5;"><i class="fas fa-share-alt"></i></button>
    </div>
    <div class="product-info">
      ${badge}
      <h3>${escapeHtml(p.name)}</h3>
      <div class="desc">${escapeHtml(p.description || '')}</div>
      <div class="price-min-row">
        <div class="price">$${basePrice.toFixed(2)}</div>
        <div class="min-order">Min: ${minOrder}</div>
      </div>
      <div class="size-color-row">
        <select class="size-select">${sizeOpts}</select>
        <select class="color-select">${colorOpts}</select>
      </div>
      <button class="add-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${basePrice}" data-min="${minOrder}">Add to Cart</button>
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

  // Card click -> open modal
  card.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('select')) openProductModal(p.id);
  });

  // Add to Cart – uses min order quantity
  addBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const size = sizeSelect.value;
    const color = card.querySelector('.color-select').value;
    const price = parseFloat(this.dataset.price);
    const minQty = parseInt(this.dataset.min) || 1;
    addToCart(p.id, p.name, price, size, color, minQty);
  });

  // Share button on image
  const shareImgBtn = card.querySelector('.share-btn-img');
  shareImgBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    shareProduct(p.id);
  });

  // Lazy load image
  const img = card.querySelector('.lazy');
  if (img && img.dataset.src) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = img.dataset.src;
            img.onload = () => { img.style.opacity = '1'; };
            observer.unobserve(img);
          }
        });
      });
      observer.observe(img);
    } else {
      img.src = img.dataset.src;
      img.style.opacity = '1';
    }
  }

  return card;
}

function renderProducts(append = false) {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  let filtered = [...allProducts];
  if (currentCategory !== 'All') filtered = filtered.filter(p => p.cat === currentCategory);
  if (currentSubcategory) filtered = filtered.filter(p => p.subcat === currentSubcategory);
  if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));

  filtered = shuffleArray(filtered);

  if (!filtered.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">No products found</div>';
    document.getElementById('loadMoreBtn').style.display = 'none';
    return;
  }
  const slice = filtered.slice(0, currentDisplayLimit);
  const hasMore = filtered.length > currentDisplayLimit;
  if (!append) container.innerHTML = '';
  slice.forEach(p => {
    const card = createProductCard(p);
    container.appendChild(card);
  });
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    loadMoreBtn.dataset.total = filtered.length;
    loadMoreBtn.dataset.loaded = currentDisplayLimit;
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadMoreProducts() {
  currentDisplayLimit += DISPLAY_LIMIT;
  renderProducts(true);
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    const total = parseInt(loadMoreBtn.dataset.total);
    const loaded = currentDisplayLimit;
    if (loaded >= total) loadMoreBtn.style.display = 'none';
  }
}

async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    allProducts = await res.json();
    currentDisplayLimit = DISPLAY_LIMIT;
    renderProducts();
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch (e) {
    console.warn('API failed – using demo products');
    allProducts = generateDemoProducts();
    currentDisplayLimit = DISPLAY_LIMIT;
    renderProducts();
  }
}

// ===== PRODUCT MODAL =====
function openProductModal(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) { alert('Product not found'); return; }
  
  // Update social media meta tags for this product
  updateMetaTags(product);

  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductDesc').innerText = product.description || '';
  const mainImg = document.getElementById('modalProductImage');
  mainImg.src = product.main_image || '';
  mainImg.onerror = function() { this.style.display = 'none'; };

  // Thumbnails
  const thumbContainer = document.getElementById('modalProductThumbnails');
  thumbContainer.innerHTML = '';
  const allImages = [];
  if (product.main_image) allImages.push(product.main_image);
  if (product.images && product.images.length) allImages.push(...product.images);
  const uniqueImages = [...new Set(allImages)];
  uniqueImages.slice(0, 6).forEach(img => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `<img src="${img}" alt="thumbnail" onerror="this.style.display='none'">`;
    div.addEventListener('click', () => { mainImg.src = img; mainImg.style.display = 'block'; });
    thumbContainer.appendChild(div);
  });

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

  const modalAddBtn = document.getElementById('modalAddToCartBtn');
  const newAddBtn = modalAddBtn.cloneNode(true);
  modalAddBtn.parentNode.replaceChild(newAddBtn, modalAddBtn);
  newAddBtn.addEventListener('click', function() {
    const size = sizeSelect.value;
    const color = colorSelect.value;
    const price = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.price);
    const minQty = product.min_order || 1;
    addToCart(product.id, product.name, price, size, color, minQty);
    modal.classList.remove('active');
  });

  const shareContainer = document.querySelector('.modal-share-container');
  if (shareContainer) {
    shareContainer.innerHTML = '';
    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn-modal';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share on WhatsApp';
    shareBtn.addEventListener('click', function() { shareProduct(product.id); });
    shareContainer.appendChild(shareBtn);
  }

  const relatedGrid = document.getElementById('relatedProductsGrid');
  relatedGrid.innerHTML = '';
  const related = allProducts.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 4);
  related.forEach(p => {
    const card = document.createElement('div');
    card.className = 'related-card';
    const imgSrc = p.main_image || '';
    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="price">$${p.price.toFixed(2)}</div>
    `;
    card.addEventListener('click', () => openProductModal(p.id));
    relatedGrid.appendChild(card);
  });

  modal.classList.add('active');
}
function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.remove('active');
}

// ===== FILTERS =====
function populateSubcategories(category) {
  const subSelect = document.getElementById('subcategoryFilter');
  if (!subSelect) return;
  subSelect.innerHTML = '<option value="">All Subcategories</option>';
  if (category && subcategoryMap[category]) {
    subcategoryMap[category].forEach(sub => {
      subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
  }
}
function applyFilters() {
  const catFilter = document.getElementById('categoryFilter');
  const subFilter = document.getElementById('subcategoryFilter');
  const minInput = document.getElementById('minPrice');
  const maxInput = document.getElementById('maxPrice');
  if (!catFilter) return;
  currentCategory = catFilter.value || 'All';
  currentSubcategory = subFilter ? subFilter.value || '' : '';
  minPrice = minInput ? minInput.value || '' : '';
  maxPrice = maxInput ? maxInput.value || '' : '';
  currentDisplayLimit = DISPLAY_LIMIT;
  renderProducts();
}
function resetFilters() {
  const catFilter = document.getElementById('categoryFilter');
  const subFilter = document.getElementById('subcategoryFilter');
  const minInput = document.getElementById('minPrice');
  const maxInput = document.getElementById('maxPrice');
  const searchInput = document.getElementById('searchInput');
  if (catFilter) catFilter.value = '';
  if (subFilter) subFilter.value = '';
  if (minInput) minInput.value = '';
  if (maxInput) maxInput.value = '';
  if (searchInput) searchInput.value = '';
  currentCategory = 'All';
  currentSubcategory = '';
  minPrice = '';
  maxPrice = '';
  currentDisplayLimit = DISPLAY_LIMIT;
  populateSubcategories('');
  renderProducts();
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  const allChip = document.querySelector('.chip[data-category="All"]');
  if (allChip) allChip.classList.add('active');
}

// ===== ACCOUNT =====
function login() {
  const email = document.getElementById('loginEmail');
  const pass = document.getElementById('loginPassword');
  if (!email || !pass || !email.value || !pass.value) { alert('Enter email and password'); return; }
  currentUser = { name: email.value.split('@')[0], email: email.value };
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('userName').innerText = currentUser.name;
  localStorage.setItem('mmeliUser', JSON.stringify(currentUser));
  showToast('Logged in');
}
function register() {
  const name = document.getElementById('regName');
  const phone = document.getElementById('regPhone');
  const pass = document.getElementById('regPassword');
  if (!name || !phone || !pass || !name.value || !phone.value || !pass.value) {
    alert('Name, phone and password required'); return;
  }
  currentUser = { name: name.value, email: document.getElementById('regEmail')?.value || '', phone: phone.value, address: document.getElementById('regAddress')?.value || '' };
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

// ===== ADMIN =====
async function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (!email || !password) { alert('Please enter email and password'); return; }
  try {
    const response = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Login failed'); }
    const data = await response.json();
    if (!data.user || data.user.role !== 'admin') { throw new Error('Not an admin account. Use admin@mmeliglobal.com'); }
    token = data.token; user = data.user;
    localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('adminLoginDiv').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    alert('Admin login successful');
  } catch (err) { alert('Admin login failed: ' + err.message); }
}
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  if (pageId === 'adminDashboard') {
    const adminLoginDiv = document.getElementById('adminLoginDiv');
    const adminPanel = document.getElementById('adminPanel');
    if (adminLoginDiv && adminPanel) {
      if (user && user.role === 'admin') {
        adminLoginDiv.style.display = 'none';
        adminPanel.style.display = 'block';
      } else {
        adminLoginDiv.style.display = 'block';
        adminPanel.style.display = 'none';
      }
    }
  }
}

// ===== ADMIN ADD PRODUCT (with min_order) =====
function showAddProductForm(container) {
  container.innerHTML = `
    <h3>Add Product</h3>
    <input id="prodName" placeholder="Name"><br>
    <input id="prodPrice" placeholder="Price"><br>
    <input id="prodMinOrder" placeholder="Min Order (e.g., 1 for retail, 5 for wholesale)" value="1"><br>
    <textarea id="prodDesc" placeholder="Description"></textarea><br>
    <input id="prodCat" placeholder="Category"><br>
    <input id="prodSubcat" placeholder="Subcategory"><br>
    <input id="prodColors" placeholder="Colors (comma)"><br>
    <input id="prodSizes" placeholder="Sizes (size:price, comma)"><br>
    <div>
      <label>Main Image (upload)</label>
      <input type="file" id="prodMainImageFile" accept="image/*"><br>
      <small>Or enter URL:</small>
      <input id="prodMainImageUrl" placeholder="https://...">
    </div>
    <div>
      <label>Additional Images (upload multiple)</label>
      <input type="file" id="prodAdditionalImages" accept="image/*" multiple><br>
      <small>Or enter URLs (comma separated):</small>
      <input id="prodImagesUrls" placeholder="https://..., https://...">
    </div>
    <button onclick="addProduct()">Save</button>
    <button onclick="closeModal('modalAddProduct')">Cancel</button>
  `;
}

async function addProduct() {
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const min_order = parseInt(document.getElementById('prodMinOrder').value) || 1;
  const description = document.getElementById('prodDesc').value;
  const cat = document.getElementById('prodCat').value;
  const subcat = document.getElementById('prodSubcat').value;
  const colors = document.getElementById('prodColors').value.split(',').map(c=>c.trim()).filter(c=>c);
  const sizeStr = document.getElementById('prodSizes').value;
  const mainImageFile = document.getElementById('prodMainImageFile').files[0];
  const mainImageUrl = document.getElementById('prodMainImageUrl').value;
  const additionalFiles = document.getElementById('prodAdditionalImages').files;
  const additionalUrls = document.getElementById('prodImagesUrls').value.split(',').map(u=>u.trim()).filter(u=>u);

  if (!name || isNaN(price) || !cat || !subcat) {
    alert('Please fill required fields: Name, Price, Category, Subcategory');
    return;
  }

  let main_image = '';
  if (mainImageFile) {
    try {
      main_image = await uploadImageToSupabase(mainImageFile);
    } catch(e) {
      alert('Main image upload failed: ' + e.message);
      return;
    }
  } else if (mainImageUrl) {
    main_image = mainImageUrl;
  } else {
    alert('Please provide a main image (file or URL)');
    return;
  }

  const additionalImages = [];
  if (additionalFiles.length) {
    for (const file of additionalFiles) {
      try {
        const url = await uploadImageToSupabase(file);
        additionalImages.push(url);
      } catch(e) {
        alert('Additional image upload failed: ' + e.message);
        return;
      }
    }
  }
  if (additionalUrls.length) {
    additionalImages.push(...additionalUrls);
  }

  let size_options = [];
  if (sizeStr) {
    sizeStr.split(',').forEach(pair => {
      let [s, p] = pair.split(':');
      if (s && p) size_options.push({ size: s.trim(), price: parseFloat(p) });
    });
  }
  if (size_options.length === 0) size_options = [{ size: 'Standard', price: price }];

  const productData = {
    name, description, cat, subcat, price, colors, size_options, min_order,
    main_image,
    images: additionalImages
  };

  try {
    await apiCall('/products', { method: 'POST', body: JSON.stringify(productData) });
    alert('Product added successfully');
    closeModal('modalAddProduct');
    openAdminModal('manageProducts');
    loadProducts();
  } catch (err) {
    alert('Add failed: ' + err.message);
  }
}

// ===== EDIT PRODUCT (with min_order) =====
async function editProductModal(id) {
  const p = await apiCall(`/products/${id}`);
  const body = document.getElementById('modalManageProducts').querySelector('.modal-body');
  body.innerHTML = `
    <h3>Edit Product</h3>
    <img src="${p.main_image || ''}" width="80" id="editPreview" onerror="this.style.display='none'"><br>
    <label>Upload New Main Image (optional)</label>
    <input type="file" id="editImageFile" accept="image/*"><br>
    <input id="editName" value="${p.name}"><br>
    <input id="editPrice" value="${p.price}"><br>
    <input id="editMinOrder" value="${p.min_order || 1}"><br>
    <textarea id="editDesc">${p.description||''}</textarea><br>
    <input id="editCat" value="${p.cat}"><br>
    <input id="editSubcat" value="${p.subcat}"><br>
    <input id="editColors" value="${(p.colors||[]).join(',')}"><br>
    <input id="editSizes" value="${(p.size_options||[]).map(s=>`${s.size}:${s.price}`).join(',')}"><br>
    <div>
      <label>Additional Images (upload multiple)</label>
      <input type="file" id="editAdditionalImages" accept="image/*" multiple><br>
      <small>Or enter URLs (comma separated, will replace existing):</small>
      <input id="editImagesUrls" value="${(p.images||[]).join(', ')}" placeholder="https://..., https://...">
    </div>
    <button onclick="updateProductWithImage(${id})">Update</button>
    <button onclick="closeModal('modalManageProducts')">Cancel</button>
  `;
}

async function updateProductWithImage(id) {
  const name = document.getElementById('editName').value;
  const price = parseFloat(document.getElementById('editPrice').value);
  const min_order = parseInt(document.getElementById('editMinOrder').value) || 1;
  const description = document.getElementById('editDesc').value;
  const cat = document.getElementById('editCat').value;
  const subcat = document.getElementById('editSubcat').value;
  const colors = document.getElementById('editColors').value.split(',').map(c=>c.trim()).filter(c=>c);
  const sizeStr = document.getElementById('editSizes').value;
  const imageFile = document.getElementById('editImageFile').files[0];
  const additionalFiles = document.getElementById('editAdditionalImages').files;
  const imagesUrls = document.getElementById('editImagesUrls').value.split(',').map(u=>u.trim()).filter(u=>u);

  let main_image;
  if (imageFile) {
    try { main_image = await uploadImageToSupabase(imageFile); } catch(e) { alert('Image upload failed: ' + e.message); return; }
  } else {
    const existing = allProducts.find(p => p.id == id);
    if (!existing) { alert('Product not found in local cache. Please refresh.'); return; }
    main_image = existing.main_image;
    if (!main_image) { alert('No image available. Please upload one.'); return; }
  }

  if (!name || isNaN(price) || !cat || !subcat) {
    alert('Please fill required fields');
    return;
  }

  let size_options = [];
  if (sizeStr) {
    sizeStr.split(',').forEach(pair => {
      let [s, p] = pair.split(':');
      if (s && p) size_options.push({ size: s.trim(), price: parseFloat(p) });
    });
  }
  if (size_options.length === 0) size_options = [{ size: 'Standard', price: price }];

  const additionalImages = [];
  if (additionalFiles.length) {
    for (const file of additionalFiles) {
      try {
        const url = await uploadImageToSupabase(file);
        additionalImages.push(url);
      } catch(e) {
        alert('Additional image upload failed: ' + e.message);
        return;
      }
    }
  }
  if (imagesUrls.length) {
    additionalImages.push(...imagesUrls);
  }

  const productData = {
    name, description, cat, subcat, price, colors, size_options, min_order,
    main_image,
    images: additionalImages
  };

  try {
    await apiCall(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });
    alert('Product updated successfully');
    closeModal('modalManageProducts');
    openAdminModal('manageProducts');
    loadProducts();
  } catch (err) {
    alert('Update failed: ' + err.message);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  renderCartModal();
  loadProducts();

  // Check URL for product ID and update meta tags
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  if (productId) {
    // Wait for products to load, then find product and update meta
    const checkProduct = setInterval(() => {
      if (allProducts.length) {
        clearInterval(checkProduct);
        const product = allProducts.find(p => p.id == productId);
        if (product) updateMetaTags(product);
      }
    }, 100);
  }

  const savedUser = localStorage.getItem('mmeliUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('userName').innerText = currentUser.name;
    } catch (e) {}
  }

  // Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkoutToWhatsApp);

  // Load More
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreProducts);

  // Tracking
  const trackingLink = document.getElementById('footerTracking');
  const trackingModal = document.getElementById('trackingModal');
  if (trackingLink && trackingModal) {
    trackingLink.addEventListener('click', function(e) {
      e.preventDefault();
      trackingModal.classList.add('active');
      setTimeout(initTrackingMap, 300);
    });
  }
  const closeTrackingBtn = document.getElementById('closeTrackingBtn');
  if (closeTrackingBtn && trackingModal) {
    closeTrackingBtn.addEventListener('click', () => trackingModal.classList.remove('active'));
    trackingModal.addEventListener('click', (e) => {
      if (e.target === trackingModal) trackingModal.classList.remove('active');
    });
  }
  const trackBtn = document.getElementById('trackOrderBtn');
  if (trackBtn) trackBtn.addEventListener('click', trackOrder);
  const trackInput = document.getElementById('trackCodeInput');
  if (trackInput) trackInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') trackOrder(); });

  // Footer home
  const homeLink = document.getElementById('footerHome');
  if (homeLink) {
    homeLink.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.footer-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      resetFilters();
      showToast('Refreshed');
    });
  }

  // Promo
  const promoLink = document.getElementById('footerPromo');
  const promoModal = document.getElementById('promoModal');
  if (promoLink && promoModal) {
    promoLink.addEventListener('click', function(e) {
      e.preventDefault();
      promoModal.classList.add('active');
    });
  }
  const closePromoBtn = document.getElementById('closePromoBtn');
  if (closePromoBtn && promoModal) {
    closePromoBtn.addEventListener('click', () => promoModal.classList.remove('active'));
    promoModal.addEventListener('click', (e) => {
      if (e.target === promoModal) promoModal.classList.remove('active');
    });
  }

  // Account
  const accountLink = document.getElementById('footerAccount');
  const accountModal = document.getElementById('accountModal');
  if (accountLink && accountModal) {
    accountLink.addEventListener('click', function(e) {
      e.preventDefault();
      accountModal.classList.add('active');
    });
  }
  const closeAccountBtn = document.getElementById('closeAccountBtn');
  if (closeAccountBtn && accountModal) {
    closeAccountBtn.addEventListener('click', () => accountModal.classList.remove('active'));
    accountModal.addEventListener('click', (e) => {
      if (e.target === accountModal) accountModal.classList.remove('active');
    });
  }
  const loginBtn = document.getElementById('loginSubmitBtn');
  if (loginBtn) loginBtn.addEventListener('click', login);
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) registerBtn.addEventListener('click', register);

  // More
  const moreLink = document.getElementById('footerMore');
  const moreModal = document.getElementById('moreModal');
  if (moreLink && moreModal) {
    moreLink.addEventListener('click', function(e) {
      e.preventDefault();
      moreModal.classList.add('active');
    });
  }
  const closeMoreBtn = document.getElementById('closeMoreBtn');
  if (closeMoreBtn && moreModal) {
    closeMoreBtn.addEventListener('click', () => moreModal.classList.remove('active'));
    moreModal.addEventListener('click', (e) => {
      if (e.target === moreModal) moreModal.classList.remove('active');
    });
  }
  const adminLink = document.getElementById('adminLink');
  if (adminLink) {
    adminLink.addEventListener('click', function(e) {
      e.preventDefault();
      const moreModal = document.getElementById('moreModal');
      if (moreModal) moreModal.classList.remove('active');
      switchPage('adminDashboard');
    });
  }

  // Double-click logo
  const logoArea = document.getElementById('logoArea');
  if (logoArea) {
    logoArea.addEventListener('dblclick', function(e) {
      e.preventDefault();
      switchPage('adminDashboard');
    });
  }

  // Cart
  const cartIconBtn = document.getElementById('cartIconBtn');
  const cartModal = document.getElementById('cartModal');
  if (cartIconBtn && cartModal) {
    cartIconBtn.addEventListener('click', () => {
      renderCartModal();
      cartModal.classList.add('active');
    });
  }
  const closeCartBtn = document.getElementById('closeCartBtn');
  if (closeCartBtn && cartModal) {
    closeCartBtn.addEventListener('click', () => cartModal.classList.remove('active'));
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) cartModal.classList.remove('active');
    });
  }

  // Product modal
  const closeModalBtn = document.getElementById('closeModalBtn');
  const productModal = document.getElementById('productModal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeProductModal();
    });
  }

  // Category chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.category;
      const catFilter = document.getElementById('categoryFilter');
      if (catFilter) catFilter.value = cat === 'All' ? '' : cat;
      populateSubcategories(cat === 'All' ? '' : cat);
      applyFilters();
    });
  });

  // Filter dropdowns
  const catFilter = document.getElementById('categoryFilter');
  const subFilter = document.getElementById('subcategoryFilter');
  const minInput = document.getElementById('minPrice');
  const maxInput = document.getElementById('maxPrice');
  if (catFilter) {
    catFilter.addEventListener('change', function() {
      const cat = this.value;
      populateSubcategories(cat);
      applyFilters();
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      const chip = document.querySelector(`.chip[data-category="${cat || 'All'}"]`);
      if (chip) chip.classList.add('active');
    });
  }
  if (subFilter) subFilter.addEventListener('change', applyFilters);
  if (minInput) minInput.addEventListener('input', applyFilters);
  if (maxInput) maxInput.addEventListener('input', applyFilters);

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const term = this.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.product-card');
      cards.forEach(card => {
        const name = card.querySelector('h3')?.innerText.toLowerCase() || '';
        const desc = card.querySelector('.desc')?.innerText.toLowerCase() || '';
        card.style.display = term === '' || name.includes(term) || desc.includes(term) ? '' : 'none';
      });
    });
  }

  populateSubcategories('');
});
