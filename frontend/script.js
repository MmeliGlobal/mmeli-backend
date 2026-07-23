// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://proljdccjrifqgbmsyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xqZGNjanJpZnFnYm1zeWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc4ODAxOSwiZXhwIjoyMDkxMzY0MDE5fQ.VltzBUq-bLvu0Ny4jPy1kBp5E-4hffQgqFpqHrRWlZA';

// ===== SAFELY CREATE SUPABASE CLIENT (rename to avoid conflicts) =====
let supabaseClient = null;
try {
  if (typeof window !== 'undefined' && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized.');
  } else {
    console.warn('⚠️ Supabase library not loaded – policies will not work.');
    // Dummy client
    supabaseClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => { throw new Error('Supabase client not available.'); }
          })
        })
      })
    };
  }
} catch (e) {
  console.error('❌ Failed to initialize Supabase:', e);
  supabaseClient = null;
}

// ===== CONFIG =====
const API = '/api';
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
function generateTrackingCode() {
  return 'MM' + Math.floor(100000 + Math.random() * 900000);
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

// ===== UPDATE SOCIAL META TAGS =====
function updateMetaTags(product) {
  if (!product) return;
  document.title = product.name + ' | Mmeli Global';
  const metaTags = [
    { property: 'og:title', content: product.name },
    { property: 'og:description', content: product.description || 'Shop premium phones & laptops at Mmeli Global' },
    { property: 'og:image', content: product.main_image || '' },
    { property: 'og:url', content: window.location.href },
    { property: 'og:type', content: 'product' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: product.name },
    { name: 'twitter:description', content: product.description || 'Check out this product on Mmeli Global' },
    { name: 'twitter:image', content: product.main_image || '' }
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

// ===== POLICY FUNCTIONS (using supabaseClient) =====
async function openPolicy(key) {
  const modal = document.getElementById('policyModal');
  const title = document.getElementById('policyModalTitle');
  const body = document.getElementById('policyModalBody');

  modal.classList.add('active');
  title.innerText = 'Loading...';
  body.innerHTML = '<p style="text-align:center; color:#94a3b8;">Loading policy...</p>';

  try {
    if (!supabaseClient) throw new Error('Supabase client not available.');
    const { data, error } = await supabaseClient
      .from('policies')
      .select('title, content')
      .eq('key', key)
      .single();
    if (error) throw error;
    if (!data) throw new Error('Policy not found');
    title.innerText = data.title || 'Policy';
    body.innerHTML = data.content || '<p>No content available.</p>';
  } catch (error) {
    console.error('Policy fetch error:', error);
    title.innerText = 'Error';
    body.innerHTML = '<p style="color: #dc2626;">Could not load policy. Please try again later.</p>';
  }
}
document.getElementById('closePolicyBtn')?.addEventListener('click', function() {
  document.getElementById('policyModal').classList.remove('active');
});
document.getElementById('policyModal')?.addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('active');
});

// ===== CART =====
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
    main_image: '',
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

function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  const hasImage = p.main_image && p.main_image.startsWith('http');
  const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : '';
  const sizes = p.size_options && p.size_options.length ? p.size_options : [{ size: 'Standard', price: p.price }];
  const colors = p.colors && p.colors.length ? p.colors : ['Default'];
  let sizeOpts = sizes.map(s => `<option value="${escapeHtml(s.size)}" data-price="${s.price}">${escapeHtml(s.size)}</option>`).join('');
  let colorOpts = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  const basePrice = sizes[0].price;
  const minOrder = p.min_order || 1;

  card.innerHTML = `
    <div class="image-wrapper">
      ${hasImage ? `<img class="lazy" data-src="${p.main_image}" alt="${escapeHtml(p.name)}" style="opacity:0; width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
      <div style="display:${hasImage ? 'none' : 'flex'}; align-items:center; justify-content:center; width:100%; height:100%; background:#f0f0f0; color:#999; font-size:0.9rem; font-weight:500; position:absolute; top:0; left:0;">No Image</div>
      <button class="share-btn-img" data-id="${p.id}"><i class="fas fa-share-alt"></i></button>
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

  const priceSpan = card.querySelector('.price');
  const sizeSelect = card.querySelector('.size-select');
  const addBtn = card.querySelector('.add-btn');
  sizeSelect.addEventListener('change', function() {
    const selected = this.options[this.selectedIndex];
    const newPrice = parseFloat(selected.dataset.price);
    priceSpan.innerText = `$${newPrice.toFixed(2)}`;
    addBtn.dataset.price = newPrice;
  });

  card.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && !e.target.closest('select')) openProductModal(p.id);
  });

  addBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const size = sizeSelect.value;
    const color = card.querySelector('.color-select').value;
    const price = parseFloat(this.dataset.price);
    const minQty = parseInt(this.dataset.min) || 1;
    addToCart(p.id, p.name, price, size, color, minQty);
  });

  const shareImgBtn = card.querySelector('.share-btn-img');
  shareImgBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    shareProduct(p.id);
  });

  if (hasImage) {
    const img = card.querySelector('.lazy');
    if (img && 'IntersectionObserver' in window) {
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
    } else if (img) {
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
  updateMetaTags(product);

  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductDesc').innerText = product.description || '';

  const mainImg = document.getElementById('modalProductImage');
  const noImgDiv = mainImg.nextElementSibling;
  const hasImage = product.main_image && product.main_image.startsWith('http');
  if (hasImage) {
    mainImg.src = product.main_image;
    mainImg.style.display = 'block';
    noImgDiv.style.display = 'none';
    mainImg.onerror = function() {
      this.style.display = 'none';
      noImgDiv.style.display = 'flex';
    };
  } else {
    mainImg.style.display = 'none';
    noImgDiv.style.display = 'flex';
  }

  const thumbContainer = document.getElementById('modalProductThumbnails');
  thumbContainer.innerHTML = '';
  const allImages = [];
  if (product.main_image) allImages.push(product.main_image);
  if (product.images && product.images.length) allImages.push(...product.images);
  const uniqueImages = allImages.filter(url => url && url.startsWith('http'));
  uniqueImages.slice(0, 6).forEach(img => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `<img src="${img}" alt="thumbnail" onerror="this.style.display='none'">`;
    div.addEventListener('click', () => {
      mainImg.src = img;
      mainImg.style.display = 'block';
      noImgDiv.style.display = 'none';
    });
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
    alert('Name, phone and password required');
    return;
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

// ===== ADMIN ADD PRODUCT =====
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

// ===== EDIT PRODUCT =====
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

// ===== ADMIN ORDER MANAGEMENT =====
async function loadOrdersModal(container) {
  const orders = await apiCall('/orders');
  container.innerHTML = `<h3>Orders</h3>`;
  if (!orders.length) {
    container.innerHTML += '<p>No orders yet.</p>';
    return;
  }
  orders.forEach(o => {
    const div = document.createElement('div');
    div.style.cssText = 'border:1px solid #ddd; padding:12px; margin:8px 0; border-radius:8px;';
    div.innerHTML = `
      <strong>${o.tracking_code}</strong> - ${o.status} - $${o.total}<br>
      <button onclick="updateOrderStatus('${o.id}','paid')">Mark Paid</button>
      <button onclick="updateOrderStatus('${o.id}','packed')">Mark Packed</button>
      <button onclick="updateOrderStatus('${o.id}','shipped')">Mark Shipped</button>
      <button onclick="updateOrderStatus('${o.id}','delivered')">Mark Delivered</button>
      <button onclick="generateShipment('${o.id}','${o.user_data?.phone || ''}','${o.tracking_code}')">Generate Shipment & Send</button>
    `;
    container.appendChild(div);
  });
  container.innerHTML += '<button onclick="closeModal(\'modalManageOrders\')">Close</button>';
}

async function generateShipment(orderId, phone, trackingCode) {
  if (!phone) { alert('Client phone number not available.'); return; }
  const shipmentCode = 'SHIP' + Math.floor(100000 + Math.random() * 900000);
  try {
    await apiCall('/shipments', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        tracking_code: shipmentCode,
        status: 'pending',
        client_phone: phone
      })
    });
    const baseUrl = window.location.origin + window.location.pathname;
    const trackLink = `${baseUrl}?shipment=${shipmentCode}`;
    const message = `📦 Your shipment has been generated!%0A%0A📦 Shipment Code: ${shipmentCode}%0A🔗 Track: ${trackLink}%0A%0AThank you for shopping with Mmeli Global.`;
    const waUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(waUrl, '_blank');
    alert('Shipment generated and WhatsApp link opened.');
  } catch (err) {
    alert('Failed to generate shipment: ' + err.message);
  }
}

// ===== ALL ADMIN MODAL FUNCTIONS =====
async function loadDashboardStats(container) {
  try {
    const stats = await apiCall('/dashboard/stats');
    container.innerHTML = `<h3>Dashboard</h3>
      <div class="stats-grid">
        <div class="stats-card">📦 Orders<br>${stats.totalOrders}</div>
        <div class="stats-card">💰 Revenue<br>$${stats.totalRevenue}</div>
        <div class="stats-card">🛍️ Products<br>${stats.totalProducts}</div>
        <div class="stats-card">👥 Customers<br>${stats.totalUsers}</div>
        <div class="stats-card">📅 Today<br>${stats.todayOrders} orders</div>
        <div class="stats-card">📈 Week Revenue<br>$${stats.weekRevenue}</div>
      </div>
      <button onclick="closeModal('modalDashboardStats')">Close</button>`;
  } catch (e) { container.innerHTML = '<p>Could not load stats.</p>'; }
}
async function loadProductsModal(container) {
  try {
    const products = await apiCall('/products');
    container.innerHTML = `<h3>Manage Products</h3>
      <input type="text" id="productSearch" placeholder="Search..." onkeyup="filterProductList()" style="width:100%; margin-bottom:10px;">
      <div id="productListContainer">${products.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:8px;">
          <img src="${p.main_image || ''}" width="50" style="border-radius:8px;" onerror="this.style.display='none'">
          ${p.name} - $${p.price}
          <div>
            <button onclick="editProductModal(${p.id})">Edit</button>
            <button onclick="deleteProduct(${p.id})">Delete</button>
          </div>
        </div>
      `).join('')}</div>
      <button onclick="closeModal('modalManageProducts')">Close</button>`;
    window.filterProductList = function() {
      const term = document.getElementById('productSearch').value.toLowerCase();
      const filtered = products.filter(p => p.name.toLowerCase().includes(term));
      document.getElementById('productListContainer').innerHTML = filtered.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:8px;">
          <img src="${p.main_image || ''}" width="50" onerror="this.style.display='none'">
          ${p.name} - $${p.price}
          <div>
            <button onclick="editProductModal(${p.id})">Edit</button>
            <button onclick="deleteProduct(${p.id})">Delete</button>
          </div>
        </div>
      `).join('');
    };
  } catch (e) { container.innerHTML = '<p>Could not load products.</p>'; }
}
async function deleteProduct(id) {
  if (confirm('Delete product?')) {
    try {
      await apiCall(`/products/${id}`, { method: 'DELETE' });
      alert('Product deleted');
      openAdminModal('manageProducts');
      loadProducts();
    } catch (e) { alert('Delete failed: ' + e.message); }
  }
}
async function loadDiscountsModal(container) {
  try {
    const discounts = await apiCall('/marketing/discounts');
    container.innerHTML = `<h3>Discounts</h3>
      <button onclick="showAddDiscountForm()">+ Add Discount</button>
      <div id="discountsList">${discounts.map(d => `
        <div>${d.code} - ${d.type} ${d.value}% - ${d.is_active ? 'Active' : 'Inactive'}
          <button onclick="deleteDiscount(${d.id})">Delete</button>
        </div>
      `).join('')}</div>
      <button onclick="closeModal('modalDiscounts')">Close</button>`;
  } catch (e) { container.innerHTML = '<p>Could not load discounts.</p>'; }
}
function showAddDiscountForm() {
  const body = document.getElementById('modalDiscounts').querySelector('.modal-body');
  body.innerHTML = `
    <h3>Add Discount</h3>
    <input id="discountCode" placeholder="Code">
    <select id="discountType"><option value="percentage">%</option><option value="fixed">Fixed</option></select>
    <input id="discountValue" placeholder="Value">
    <input id="discountMinOrder" placeholder="Min Order">
    <button onclick="addDiscount()">Save</button>
    <button onclick="closeModal('modalDiscounts')">Cancel</button>
  `;
}
async function addDiscount() {
  const code = document.getElementById('discountCode').value;
  const type = document.getElementById('discountType').value;
  const value = parseFloat(document.getElementById('discountValue').value);
  const min_order = parseFloat(document.getElementById('discountMinOrder').value);
  try {
    await apiCall('/marketing/discounts', { method: 'POST', body: JSON.stringify({ code, type, value, min_order, is_active: true }) });
    alert('Discount added');
    openAdminModal('discounts');
  } catch (e) { alert('Add failed: ' + e.message); }
}
async function deleteDiscount(id) {
  if (confirm('Delete discount?')) {
    try {
      await apiCall(`/marketing/discounts/${id}`, { method: 'DELETE' });
      openAdminModal('discounts');
    } catch (e) { alert('Delete failed: ' + e.message); }
  }
}
async function loadReturnsModal(container) {
  try {
    const returns = await apiCall('/returns');
    container.innerHTML = `<h3>Returns</h3>
      ${returns.map(r => `
        <div>Order ${r.order_id}: ${r.status} - ${r.reason}
          <button onclick="updateReturnStatus(${r.id},'approved')">Approve</button>
          <button onclick="updateReturnStatus(${r.id},'rejected')">Reject</button>
        </div>
      `).join('')}
      <button onclick="closeModal('modalReturns')">Close</button>`;
  } catch (e) { container.innerHTML = '<p>Could not load returns.</p>'; }
}
async function updateReturnStatus(id, status) {
  try {
    await apiCall(`/returns/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    openAdminModal('returns');
  } catch (e) { alert('Update failed: ' + e.message); }
}
async function loadInventoryModal(container) {
  try {
    const inv = await apiCall('/inventory');
    container.innerHTML = `<h3>Inventory</h3>
      ${inv.map(i => `
        <div>${i.products?.name}: ${i.quantity} in ${i.warehouse}
          <button onclick="updateStock(${i.id})">Update</button>
        </div>
      `).join('')}
      <button onclick="closeModal('modalInventory')">Close</button>`;
  } catch (e) { container.innerHTML = '<p>Could not load inventory.</p>'; }
}
async function updateStock(id) {
  const qty = prompt('New quantity');
  if (qty !== null) {
    try {
      await apiCall(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify({ quantity: parseInt(qty) }) });
      openAdminModal('inventory');
    } catch (e) { alert('Update failed: ' + e.message); }
  }
}
async function loadPoliciesModal(container) {
  try {
    const policies = await apiCall('/policies');
    container.innerHTML = `<h3>Policies</h3>
      ${policies.map(p => `
        <div>
          <strong>${p.title}</strong>
          <textarea id="policy_${p.key}" rows="3">${p.content || ''}</textarea>
          <button onclick="updatePolicy('${p.key}')">Save</button>
        </div>
      `).join('')}
      <button onclick="closeModal('modalManagePolicies')">Close</button>`;
    window.updatePolicy = async (key) => {
      const content = document.getElementById(`policy_${key}`).value;
      try {
        await apiCall(`/policies/${key}`, { method: 'PUT', body: JSON.stringify({ content }) });
        alert('Policy updated');
        openAdminModal('managePolicies');
      } catch (e) { alert('Update failed: ' + e.message); }
    };
  } catch (e) { container.innerHTML = '<p>Could not load policies.</p>'; }
}
async function loadShipmentsModal(container) {
  try {
    const shipments = await apiCall('/shipments');
    container.innerHTML = `<h3>Shipments</h3>
      <button onclick="showAddShipmentForm()">+ Add Shipment</button>
      <div id="shipmentsList">${shipments.map(s => `
        <div>
          <strong>${s.tracking_code}</strong> - ${s.status}<br>
          Client: ${s.client.name}<br>
          Receiver: ${s.receiver.name}<br>
          <button onclick="updateShipmentStatus('${s.id}','shipped')">Mark Shipped</button>
        </div>
      `).join('')}</div>
      <button onclick="closeModal('modalManageShipments')">Close</button>`;
  } catch (e) { container.innerHTML = '<p>Could not load shipments.</p>'; }
}
function showAddShipmentForm() {
  const body = document.getElementById('modalManageShipments').querySelector('.modal-body');
  body.innerHTML = `
    <h3>Add Shipment</h3>
    <div><label>Tracking Code</label><input id="shipTrack"></div>
    <div><label>Client Name</label><input id="shipClientName"></div>
    <div><label>Client Phone</label><input id="shipClientPhone"></div>
    <div><label>Receiver Name</label><input id="shipReceiverName"></div>
    <div><label>Receiver Phone</label><input id="shipReceiverPhone"></div>
    <div><label>Pickup Location</label><input id="shipPickup"></div>
    <div><label>Courier Payment Status</label><select id="shipPaid"><option value="false">Pending</option><option value="true">Paid</option></select></div>
    <div><label>Package Image</label><input type="file" id="shipImage"></div>
    <div><label>Notes</label><textarea id="shipNotes"></textarea></div>
    <button onclick="addShipment()">Save</button>
    <button onclick="closeModal('modalManageShipments')">Cancel</button>
  `;
}
async function addShipment() {
  const tracking_code = document.getElementById('shipTrack').value || 'SHIP' + Math.floor(Math.random() * 1000000);
  const client = { name: document.getElementById('shipClientName').value, phone: document.getElementById('shipClientPhone').value };
  const receiver = { name: document.getElementById('shipReceiverName').value, phone: document.getElementById('shipReceiverPhone').value };
  const pickup = document.getElementById('shipPickup').value;
  const paid = document.getElementById('shipPaid').value === 'true';
  const notes = document.getElementById('shipNotes').value;
  const file = document.getElementById('shipImage').files[0];
  let image = null;
  const save = async (img) => {
    try {
      await apiCall('/shipments', { method: 'POST', body: JSON.stringify({ tracking_code, client, receiver, pickup, notes, image: img, paid, status: 'pending' }) });
      alert('Shipment added');
      closeModal('modalManageShipments');
      openAdminModal('manageShipments');
    } catch (e) { alert('Add failed: ' + e.message); }
  };
  if (file) {
    const reader = new FileReader();
    reader.onload = e => save(e.target.result);
    reader.readAsDataURL(file);
  } else save(null);
}
async function updateShipmentStatus(id) {
  try {
    await apiCall(`/shipments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'shipped' }) });
    openAdminModal('manageShipments');
  } catch (e) { alert('Update failed: ' + e.message); }
}
function loadBroadcastModal(container) {
  container.innerHTML = `
    <h3>Broadcast</h3>
    <textarea id="broadcastMsg" rows="3"></textarea>
    <button onclick="sendBroadcast()">Generate WhatsApp Link</button>
    <div id="broadcastResult"></div>
    <button onclick="closeModal('modalBroadcast')">Close</button>
  `;
}
async function sendBroadcast() {
  let message = document.getElementById('broadcastMsg').value;
  if (!message) return alert('Enter message');
  const fullMessage = `${message}\n\nCheck our website: ${window.location.origin}`;
  try {
    const data = await apiCall('/notifications/broadcast', { method: 'POST', body: JSON.stringify({ message: fullMessage }) });
    document.getElementById('broadcastResult').innerHTML = `<a href="${data.waLink}" target="_blank">Click to send broadcast to ${data.count} subscribers</a>`;
  } catch (e) { alert('Broadcast failed: ' + e.message); }
}
function showCreateQuotationForm(container) {
  container.innerHTML = `
    <h3>Create Quotation</h3>
    <div>Client Name: <input id="qcName"></div>
    <div>Client Phone: <input id="qcPhone"></div>
    <div>Client Email: <input id="qcEmail"></div>
    <div>Address: <input id="qcAddress"></div>
    <hr>
    <div id="quoteItems">
      <div class="quote-item">
        <input placeholder="Description"> <input placeholder="Qty" size="5"> <input placeholder="Price" size="8">
      </div>
    </div>
    <button onclick="addQuoteItemRow()">+ Add Item</button>
    <hr>
    <div>Shipping Cost: <input id="qcShipping" value="0"></div>
    <div>Discount: <input id="qcDiscount" value="0"></div>
    <div>Tax %: <input id="qcTax" value="0"></div>
    <hr>
    <div><strong>Total: $<span id="qcTotal">0.00</span></strong></div>
    <button onclick="generateQuoteAndSave()">Generate & Save Quotation</button>
  `;
  window.addQuoteItemRow = () => {
    const div = document.createElement('div');
    div.className = 'quote-item';
    div.innerHTML = '<input placeholder="Description"> <input placeholder="Qty" size="5"> <input placeholder="Price" size="8">';
    document.getElementById('quoteItems').appendChild(div);
  };
  window.generateQuoteAndSave = async () => {
    const client = {
      name: document.getElementById('qcName').value,
      phone: document.getElementById('qcPhone').value,
      email: document.getElementById('qcEmail').value,
      address: document.getElementById('qcAddress').value
    };
    if (!client.phone) { alert('Client phone number is required'); return; }
    const items = [];
    document.querySelectorAll('#quoteItems .quote-item').forEach(row => {
      const desc = row.children[0].value;
      const qty = parseFloat(row.children[1].value) || 0;
      const price = parseFloat(row.children[2].value) || 0;
      if (desc && qty > 0 && price > 0) items.push({ desc, qty, price, subtotal: qty * price });
    });
    if (items.length === 0) { alert('Add at least one item'); return; }
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const shipping = parseFloat(document.getElementById('qcShipping').value) || 0;
    const discount = parseFloat(document.getElementById('qcDiscount').value) || 0;
    const taxRate = parseFloat(document.getElementById('qcTax').value) || 0;
    const afterDiscount = subtotal - discount + shipping;
    const tax = (taxRate / 100) * afterDiscount;
    const total = afterDiscount + tax;
    try {
      const result = await apiCall('/quotations', {
        method: 'POST',
        body: JSON.stringify({ client, items, subtotal, discount, shipping, tax_rate: taxRate, total })
      });
      alert(`Quotation saved! ${result.new_user_created ? 'Client has been registered and login credentials sent via WhatsApp.' : 'Client notified.'}`);
      closeModal('modalCreateQuotation');
    } catch (err) { alert('Failed to create quotation: ' + err.message); }
  };
}

// ===== OPEN ADMIN MODAL =====
function openAdminModal(modalId) {
  const modal = document.getElementById(`modal${modalId.charAt(0).toUpperCase() + modalId.slice(1)}`);
  if (!modal) return;
  const body = modal.querySelector('.modal-body');
  switch (modalId) {
    case 'dashboardStats': loadDashboardStats(body); break;
    case 'manageProducts': loadProductsModal(body); break;
    case 'addProduct': showAddProductForm(body); break;
    case 'bulkUpload': showBulkUploadModal(body); break;
    case 'manageOrders': loadOrdersModal(body); break;
    case 'discounts': loadDiscountsModal(body); break;
    case 'returns': loadReturnsModal(body); break;
    case 'inventory': loadInventoryModal(body); break;
    case 'managePolicies': loadPoliciesModal(body); break;
    case 'manageShipments': loadShipmentsModal(body); break;
    case 'broadcast': loadBroadcastModal(body); break;
    case 'createQuotation': showCreateQuotationForm(body); break;
    default: return;
  }
  modal.style.display = 'flex';
}

// ===== BULK UPLOAD MODAL =====
function showBulkUploadModal(container) {
  container.innerHTML = `
    <h3>Bulk Upload</h3>
    <p>Upload an Excel file (.xlsx or .xls) with columns for product data.</p>
    <input type="file" id="bulkFileInput" accept=".xlsx,.xls">
    <div id="bulkMappingArea" style="display:none;"></div>
    <div id="bulkProgressArea" style="display:none;">
      <div style="background:#eee; height:20px; border-radius:10px; overflow:hidden;">
        <div id="bulkProgressFill" style="height:100%; width:0%; background:#4caf50;"></div>
      </div>
      <div id="bulkProgressText"></div>
      <div id="bulkStatusLog" style="max-height:200px; overflow-y:auto; background:#f9f9f9; padding:8px; border-radius:4px;"></div>
    </div>
    <button id="bulkStartBtn" style="display:none;">Start Upload</button>
    <button onclick="closeModal('modalBulkUpload')">Cancel</button>
  `;
  document.getElementById('bulkFileInput').addEventListener('change', handleBulkFile);
  document.getElementById('bulkStartBtn').addEventListener('click', startBulkUpload);
}
let bulkRows = null;
async function handleBulkFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'arraybuffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  if (!rows.length) { alert('No data found'); return; }
  bulkRows = rows;
  const cols = Object.keys(rows[0]);
  const mappingDiv = document.getElementById('bulkMappingArea');
  mappingDiv.innerHTML = `
    <h4>Map Columns</h4>
    <div class="mapping-row"><span style="width:120px;">Product Name *</span><select id="bulkMapName"><option value="">-- Select --</option>${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
    <div class="mapping-row"><span style="width:120px;">Price *</span><select id="bulkMapPrice"><option value="">-- Select --</option>${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
    <div class="mapping-row"><span style="width:120px;">Description</span><select id="bulkMapDesc"><option value="">-- Ignore --</option>${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
    <div class="mapping-row"><span style="width:120px;">Image URL</span><select id="bulkMapImage"><option value="">-- Ignore --</option>${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
    <div class="mapping-row"><span style="width:120px;">Category</span><select id="bulkMapCat"><option value="">-- Ignore (General) --</option>${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
    <div class="mapping-row"><span style="width:120px;">Subcategory</span><select id="bulkMapSubcat"><option value="">-- Ignore (General) --</option>${cols.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
  `;
  const lowerCols = cols.map(c => c.toLowerCase());
  const nameIdx = lowerCols.findIndex(c => c.includes('name') || c === 'model');
  if (nameIdx !== -1) document.getElementById('bulkMapName').value = cols[nameIdx];
  const priceIdx = lowerCols.findIndex(c => c.includes('price') || c.includes('usd'));
  if (priceIdx !== -1) document.getElementById('bulkMapPrice').value = cols[priceIdx];
  const descIdx = lowerCols.findIndex(c => c.includes('description') || c.includes('desc'));
  if (descIdx !== -1) document.getElementById('bulkMapDesc').value = cols[descIdx];
  const imgIdx = lowerCols.findIndex(c => c.includes('image') || c.includes('img') || c.includes('url'));
  if (imgIdx !== -1) document.getElementById('bulkMapImage').value = cols[imgIdx];
  const catIdx = lowerCols.findIndex(c => c.includes('category'));
  if (catIdx !== -1) document.getElementById('bulkMapCat').value = cols[catIdx];
  const subcatIdx = lowerCols.findIndex(c => c.includes('subcategory') || c.includes('subcat'));
  if (subcatIdx !== -1) document.getElementById('bulkMapSubcat').value = cols[subcatIdx];
  mappingDiv.style.display = 'block';
  document.getElementById('bulkStartBtn').style.display = 'block';
  document.getElementById('bulkProgressArea').style.display = 'none';
}
async function startBulkUpload() {
  const nameCol = document.getElementById('bulkMapName').value;
  const priceCol = document.getElementById('bulkMapPrice').value;
  if (!nameCol || !priceCol) { alert('Please map Name and Price columns'); return; }
  const descCol = document.getElementById('bulkMapDesc').value;
  const imgCol = document.getElementById('bulkMapImage').value;
  const catCol = document.getElementById('bulkMapCat').value;
  const subcatCol = document.getElementById('bulkMapSubcat').value;
  const products = [];
  for (const row of bulkRows) {
    let name = row[nameCol];
    let price = parseFloat(row[priceCol]);
    if (!name || isNaN(price)) continue;
    let description = descCol ? (row[descCol] || '') : '';
    let main_image = imgCol ? (row[imgCol] || '') : '';
    let cat = catCol ? (row[catCol] || 'General') : 'General';
    let subcat = subcatCol ? (row[subcatCol] || 'General') : 'General';
    products.push({ name, price, description, main_image, cat, subcat });
  }
  if (products.length === 0) { alert('No valid products found'); return; }
  const progressArea = document.getElementById('bulkProgressArea');
  const fill = document.getElementById('bulkProgressFill');
  const textDiv = document.getElementById('bulkProgressText');
  const logDiv = document.getElementById('bulkStatusLog');
  progressArea.style.display = 'block';
  logDiv.innerHTML = '';
  let completed = 0, success = 0, failed = 0;
  const total = products.length;
  const concurrency = 5;
  let idx = 0;
  function updateProgress() {
    const percent = (completed / total) * 100;
    fill.style.width = percent + '%';
    textDiv.innerText = `${completed}/${total} (${success} ok, ${failed} failed)`;
  }
  async function uploadOne(p) {
    try {
      const productData = {
        name: p.name,
        price: p.price,
        description: p.description,
        main_image: p.main_image,
        cat: p.cat,
        subcat: p.subcat,
        colors: [],
        size_options: [{ size: 'Standard', price: p.price }]
      };
      await apiCall('/products', { method: 'POST', body: JSON.stringify(productData) });
      success++;
      logDiv.innerHTML += `<div style="color:green;">✅ ${p.name}</div>`;
    } catch (e) {
      failed++;
      logDiv.innerHTML += `<div style="color:red;">❌ ${p.name}: ${e.message}</div>`;
    } finally {
      completed++;
      updateProgress();
      logDiv.scrollTop = logDiv.scrollHeight;
    }
  }
  async function worker() { while (idx < total) await uploadOne(products[idx++]); }
  await Promise.all(Array(concurrency).fill().map(() => worker()));
  logDiv.innerHTML += `<hr><strong>Done. ${success} added, ${failed} failed.</strong>`;
}

// ===== UPLOAD IMAGE TO SUPABASE =====
async function uploadImageToSupabase(file) {
  if (!file) return null;
  const fileName = Date.now() + '_' + file.name;
  const url = `${SUPABASE_URL}/storage/v1/object/products/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': file.type },
    body: file
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1/object/public/${data.Key}`;
}

// ===== API CALL =====
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

// ===== CLOSE MODAL =====
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  renderCartModal();
  loadProducts();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  if (productId) {
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
  document.getElementById('checkoutBtn').addEventListener('click', checkoutToWhatsApp);

  // Load More
  document.getElementById('loadMoreBtn').addEventListener('click', loadMoreProducts);

  // Tracking
  document.getElementById('footerTracking').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('trackingModal').classList.add('active');
    setTimeout(initTrackingMap, 300);
  });
  document.getElementById('closeTrackingBtn').addEventListener('click', function() {
    document.getElementById('trackingModal').classList.remove('active');
  });
  document.getElementById('trackingModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
  document.getElementById('trackOrderBtn').addEventListener('click', trackOrder);
  document.getElementById('trackCodeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') trackOrder();
  });

  // Footer
  document.getElementById('footerHome').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.footer-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    resetFilters();
    showToast('Refreshed');
  });
  document.getElementById('footerPromo').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('promoModal').classList.add('active');
  });
  document.getElementById('closePromoBtn').addEventListener('click', function() {
    document.getElementById('promoModal').classList.remove('active');
  });
  document.getElementById('promoModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });

  // Account
  document.getElementById('footerAccount').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('accountModal').classList.add('active');
  });
  document.getElementById('closeAccountBtn').addEventListener('click', function() {
    document.getElementById('accountModal').classList.remove('active');
  });
  document.getElementById('accountModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
  document.getElementById('loginSubmitBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);

  // More
  document.getElementById('footerMore').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('moreModal').classList.add('active');
  });
  document.getElementById('closeMoreBtn').addEventListener('click', function() {
    document.getElementById('moreModal').classList.remove('active');
  });
  document.getElementById('moreModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
  document.getElementById('adminLink').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('moreModal').classList.remove('active');
    switchPage('adminDashboard');
  });

  // Double-click logo
  document.getElementById('logoArea').addEventListener('dblclick', function(e) {
    e.preventDefault();
    switchPage('adminDashboard');
  });

  // Cart
  document.getElementById('cartIconBtn').addEventListener('click', function() {
    renderCartModal();
    document.getElementById('cartModal').classList.add('active');
  });
  document.getElementById('closeCartBtn').addEventListener('click', function() {
    document.getElementById('cartModal').classList.remove('active');
  });
  document.getElementById('cartModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });

  // Product modal
  document.getElementById('closeModalBtn').addEventListener('click', closeProductModal);
  document.getElementById('productModal').addEventListener('click', function(e) {
    if (e.target === this) closeProductModal();
  });

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

  // Admin card click (for admin cards inside admin panel)
  document.querySelectorAll('.admin-card').forEach(card => {
    card.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      if (modalId) openAdminModal(modalId);
    });
  });

  populateSubcategories('');
});
