// ======================== GLOBAL VARIABLES ========================
const API = '/api';
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let map = null;
let currentMapMarker = null;
let appliedDiscount = null;
let currentDisplayCount = 150;
let shuffledProductOrder = [];
let currentFilteredProducts = []; // for load more with filters
let currentFilterType = 'all'; // 'all', 'category', 'subcategory', 'search'
let currentCategory = null;
let currentSubcategory = null;
let currentSearchQuery = '';
let checkoutData = { shippingAddress: '', deliveryMethod: 'standard', deliveryCost: 5 };

// Category hierarchy (same as original)
const categoryHierarchy = {
  "Phones": { "Smartphones": ["Android Phones", "iPhones", "Rugged Phones"], "Feature Phones": ["Keypad Phones"], "Accessories": ["Chargers", "Power Banks", "Phone Cases", "Screen Protectors"] },
  "Cameras": { "Cameras": ["Digital Cameras", "DSLR Cameras", "Mirrorless Cameras"], "Video Equipment": ["Camcorders", "Action Cameras"], "Accessories": ["Tripods", "Lighting", "Microphones"] },
  "Farming": { "Farm Machinery": ["Tractors", "Harvesting Machines", "Planting Machines"], "Irrigation": ["Water Pumps", "Systems"], "Tools": ["Hand Tools", "Power Tools"] },
  "Construction": { "Heavy Equipment": ["Excavators", "Loaders"], "Materials": ["Cement Products", "Steel Materials"], "Tools": ["Power Tools", "Hand Tools"] },
  "Electronics": { "Consumer Electronics": ["Televisions", "Audio"], "Accessories": ["Cables", "Adapters"], "Smart Devices": ["Smart Home", "Wearables"] },
  "Hardware": { "Tools": ["Hand Tools", "Power Tools"], "Fasteners": ["Screws", "Bolts & Nuts"], "Safety Equipment": ["Gloves", "Helmets"] },
  "Home Appliances": { "Kitchen Appliances": ["Refrigerators", "Cooking", "Small Appliances"], "Cleaning": ["Washing Machines", "Vacuum Cleaners"], "Climate": ["Air Conditioners", "Fans"] },
  "Beauty": { "Hair Products": ["Wigs", "Extensions", "Hair Care"], "Salon Equipment": ["Chairs", "Stations"], "Beauty Products": ["Skincare", "Makeup"] },
  "Women Hair": { "Raw Hair": ["Brazilian Hair", "Peruvian Hair"], "Wigs": ["Lace Front Wigs", "Full Lace Wigs"], "Accessories": ["Closures", "Frontals"] },
  "E-Bikes": { "Electric Bikes": ["City Bikes", "Off Road Bikes"], "Scooters": ["Electric Scooters", "Mobility Scooters"], "Accessories": ["Batteries", "Chargers"] },
  "Furniture": { "Home Furniture": ["Living Room", "Bedroom"], "Office Furniture": ["Chairs", "Desks"], "Outdoor": ["Garden Chairs", "Tables"] },
  "Industrial": { "Machines": ["CNC Machines", "Laser Machines"], "Packaging": ["Sealing Machines", "Filling Machines"], "Textile": ["Sewing Machines"] },
  "Fashion": { "Women Clothing": ["Dresses", "Tops", "Bottoms"], "Men Clothing": ["Shirts", "Pants"], "Footwear": ["Sneakers", "Sandals"], "Accessories": ["Bags", "Jewelry"] },
  "Fitness": { "Strength Equipment": ["Dumbbells", "Benches"], "Cardio": ["Treadmills", "Bikes"] },
  "Animal": { "Poultry Equipment": ["Incubators", "Feeders"], "Livestock Equipment": ["Drinkers", "Housing"] },
  "Packaging": { "Packaging": ["Cartons", "Plastic Packaging"], "Handling": ["Trolleys", "Pallet Equipment"] }
};
const subcategoryIcons = {
  "Smartphones": "https://cdn-icons-png.flaticon.com/512/1055/1055685.png", "Feature Phones": "https://cdn-icons-png.flaticon.com/512/180/180027.png", "Accessories": "https://cdn-icons-png.flaticon.com/512/1510/1510665.png",
  "Cameras": "https://cdn-icons-png.flaticon.com/512/1046/1046773.png", "Video Equipment": "https://cdn-icons-png.flaticon.com/512/1686/1686802.png", "Farm Machinery": "https://cdn-icons-png.flaticon.com/512/2964/2964420.png",
  "Irrigation": "https://cdn-icons-png.flaticon.com/512/1591/1591730.png", "Heavy Equipment": "https://cdn-icons-png.flaticon.com/512/2991/2991654.png", "Materials": "https://cdn-icons-png.flaticon.com/512/1665/1665742.png",
  "Consumer Electronics": "https://cdn-icons-png.flaticon.com/512/2320/2320352.png", "Tools": "https://cdn-icons-png.flaticon.com/512/1843/1843315.png", "Fasteners": "https://cdn-icons-png.flaticon.com/512/1046/1046795.png",
  "Kitchen Appliances": "https://cdn-icons-png.flaticon.com/512/4060/4060889.png", "Cleaning": "https://cdn-icons-png.flaticon.com/512/2195/2195960.png", "Hair Products": "https://cdn-icons-png.flaticon.com/512/2909/2909902.png",
  "Salon Equipment": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", "Raw Hair": "https://cdn-icons-png.flaticon.com/512/3508/3508206.png", "Wigs": "https://cdn-icons-png.flaticon.com/512/2936/2936842.png",
  "Electric Bikes": "https://cdn-icons-png.flaticon.com/512/3095/3095722.png", "Scooters": "https://cdn-icons-png.flaticon.com/512/1355/1355425.png", "Home Furniture": "https://cdn-icons-png.flaticon.com/512/3448/3448609.png",
  "Office Furniture": "https://cdn-icons-png.flaticon.com/512/2672/2672223.png", "Machines": "https://cdn-icons-png.flaticon.com/512/2140/2140641.png", "Packaging": "https://cdn-icons-png.flaticon.com/512/2421/2421755.png",
  "Women Clothing": "https://cdn-icons-png.flaticon.com/512/921/921504.png", "Men Clothing": "https://cdn-icons-png.flaticon.com/512/1087/1087811.png", "Footwear": "https://cdn-icons-png.flaticon.com/512/2906/2906266.png",
  "Strength Equipment": "https://cdn-icons-png.flaticon.com/512/2121/2121811.png", "Cardio": "https://cdn-icons-png.flaticon.com/512/2362/2362147.png", "Poultry Equipment": "https://cdn-icons-png.flaticon.com/512/2752/2752783.png",
  "Livestock Equipment": "https://cdn-icons-png.flaticon.com/512/1995/1995584.png"
};
const defaultIcon = "https://cdn-icons-png.flaticon.com/512/456/456212.png";

// ======================== HELPER FUNCTIONS ========================
function showSpinner() { document.getElementById('loadingSpinner').style.display = 'block'; }
function hideSpinner() { document.getElementById('loadingSpinner').style.display = 'none'; }

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + endpoint, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

async function adminApiCall(endpoint, options = {}) {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) throw new Error('Admin not logged in');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };
  const res = await fetch(API + endpoint, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Admin request failed');
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

function getShuffledProductsWithPhoneBias(products) {
  const phones = products.filter(p => p.cat === 'Phones');
  const nonPhones = products.filter(p => p.cat !== 'Phones');
  let targetPhoneCount = Math.ceil(products.length * 0.3);
  targetPhoneCount = Math.min(targetPhoneCount, phones.length);
  let targetNonPhoneCount = products.length - targetPhoneCount;
  targetNonPhoneCount = Math.min(targetNonPhoneCount, nonPhones.length);
  const selectedPhones = shuffleArray([...phones]).slice(0, targetPhoneCount);
  const selectedNonPhones = shuffleArray([...nonPhones]).slice(0, targetNonPhoneCount);
  return shuffleArray([...selectedPhones, ...selectedNonPhones]);
}

function setShuffledProductOrder() {
  if (allProducts.length) {
    shuffledProductOrder = getShuffledProductsWithPhoneBias(allProducts);
  }
}

function displayProducts(products) {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (!products.length) { container.innerHTML = '<p>No products found.</p>'; return; }
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `<img src="${p.main_image || 'https://picsum.photos/300/200'}" alt="${escapeHtml(p.name)}"><div class="product-info"><div class="product-name">${escapeHtml(p.name)}</div><div class="product-price">$${p.price}</div></div>`;
    card.onclick = (e) => { e.stopPropagation(); openProduct(p.id); };
    container.appendChild(card);
  });
}

function loadMoreProducts() {
  currentDisplayCount += 150;
  let productsToShow = [];
  if (currentFilterType === 'all') {
    productsToShow = shuffledProductOrder.slice(0, currentDisplayCount);
  } else if (currentFilterType === 'category') {
    const filtered = allProducts.filter(p => p.cat === currentCategory);
    productsToShow = filtered.slice(0, currentDisplayCount);
  } else if (currentFilterType === 'subcategory') {
    const leafs = categoryHierarchy[currentCategory][currentSubcategory];
    const filtered = allProducts.filter(p => p.cat === currentCategory && leafs.includes(p.subcat));
    productsToShow = filtered.slice(0, currentDisplayCount);
  } else if (currentFilterType === 'search') {
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(currentSearchQuery) || (p.description && p.description.toLowerCase().includes(currentSearchQuery)));
    productsToShow = filtered.slice(0, currentDisplayCount);
  }
  displayProducts(productsToShow);
  if (productsToShow.length === allProducts.filter(p => true).length) {
    document.getElementById('loadMoreBtn').style.display = 'none';
  } else {
    document.getElementById('loadMoreBtn').style.display = 'block';
  }
}

// ======================== PAGE NAVIGATION & DEEP LINKING ========================
function switchPage(pageId, productId = null) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'cart') renderCart();
  if (pageId === 'account') {
    if (user) {
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('userName').innerText = user.name;
    } else {
      document.getElementById('loginBox').style.display = 'block';
      document.getElementById('dashboard').style.display = 'none';
    }
  }
  if (pageId === 'tracking' && map === null) initMap();
  if (pageId === 'adminDashboard') {
    if (localStorage.getItem('adminToken')) document.getElementById('adminPanel').style.display = 'block';
    else document.getElementById('adminLoginDiv').style.display = 'block';
  }
  if (pageId === 'productPage' && productId) {
    openProduct(productId);
  }
  let hash = '#/' + pageId;
  if (productId) hash += '/product/' + productId;
  history.pushState(null, '', hash);
}

function handleHash() {
  const hash = window.location.hash.slice(2); // remove #/
  if (!hash) {
    resetHome();
    return;
  }
  const parts = hash.split('/');
  if (parts[0] === 'product' && parts[1]) {
    const productId = parseInt(parts[1]);
    if (productId && !isNaN(productId)) {
      switchPage('productPage', productId);
    } else {
      resetHome();
    }
  } else if (['home', 'cart', 'tracking', 'promo', 'account', 'adminDashboard', 'checkoutPage'].includes(parts[0])) {
    switchPage(parts[0]);
  } else {
    resetHome();
  }
}

function goBackHome() {
  resetHome();
}

function resetHome() {
  currentFilterType = 'all';
  currentDisplayCount = 150;
  displayProducts(shuffledProductOrder.slice(0, currentDisplayCount));
  document.getElementById('subMenu').innerHTML = '';
  switchPage('home');
}

// ======================== PRODUCT LOADING & DISPLAY ========================
async function loadProducts() {
  showSpinner();
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    allProducts = await res.json();
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
    setShuffledProductOrder();
    displayProducts(shuffledProductOrder.slice(0, currentDisplayCount));
    buildMainMenu();
    if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
  } catch(e) {
    console.error(e);
    const cached = localStorage.getItem('cachedProducts');
    if (cached) {
      allProducts = JSON.parse(cached);
      setShuffledProductOrder();
      displayProducts(shuffledProductOrder.slice(0, currentDisplayCount));
      buildMainMenu();
      document.getElementById('productsContainer').innerHTML += '<p style="color:orange;">Using cached products. Refresh later.</p>';
    } else {
      document.getElementById('productsContainer').innerHTML = '<p>Error loading products.</p>';
    }
  } finally {
    hideSpinner();
  }
}

async function openProduct(id) {
  showSpinner();
  try {
    let product = allProducts.find(p => p.id == id);
    if (!product) {
      const res = await fetch(API + `/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      product = await res.json();
    }
    currentProduct = product;
    renderProductDetail(product);
    switchPage('productPage', id);
    await loadProductRecommendations(product.cat, product.id);
  } catch(e) { console.error(e); alert('Could not open product'); }
  finally { hideSpinner(); }
}

function renderProductDetail(p) {
  const container = document.getElementById('productDetailContainer');
  container.innerHTML = `<div class="product-detail-layout">
    <div class="product-detail-left">
      <img src="${p.main_image}" style="width:100%; border-radius:16px; margin:10px 0;">
      <h2>${escapeHtml(p.name)}</h2>
      <p>${escapeHtml(p.description || '')}</p>
      <div class="color-size-row">
        <div><label>Color:</label> <select id="productColor">${(p.colors || ['Default']).map(c => `<option>${escapeHtml(c)}</option>`).join('')}</select></div>
        <div><label>Size:</label> <select id="productSize">${(p.size_options || [{size:'Standard',price:p.price}]).map(s => `<option value="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`).join('')}</select></div>
      </div>
      <div class="add-to-cart-center"><button id="addToCartDetailBtn"><i class="fas fa-cart-plus"></i> Add to Cart</button></div>
    </div>
    <div class="product-detail-right">
      <h4>You may also like</h4>
      <div id="productRecommendationsGrid" class="recommend-grid"></div>
    </div>
  </div>`;
  const btn = document.getElementById('addToCartDetailBtn');
  if (btn) btn.onclick = () => addToCartFromDetail();
  if (p.size_options && p.size_options.length) {
    document.getElementById('productSize')?.addEventListener('change', () => {
      if (btn) btn.innerHTML = `<i class="fas fa-cart-plus"></i> Add to Cart ($${document.getElementById('productSize').value})`;
    });
  }
}

async function loadProductRecommendations(category, excludeId) {
  if (!allProducts.length) return;
  let recs = allProducts.filter(p => p.cat === category && p.id !== excludeId).slice(0, 20);
  if (recs.length < 20) recs = allProducts.filter(p => p.id !== excludeId).slice(0, 20);
  const container = document.getElementById('productRecommendationsGrid');
  if (container) {
    container.innerHTML = recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image}" loading="lazy"><div>${escapeHtml(p.name)}<br><strong>$${p.price}</strong></div></div>`).join('');
  }
}

function loadRecommendationsForSection(containerId, excludeId) {
  if (!allProducts.length) return;
  let recs = allProducts.filter(p => p.id !== excludeId).slice(0, 20);
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<h4>You may also like</h4><div class="recommend-grid">${recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image}" loading="lazy"><div>${escapeHtml(p.name)}<br><strong>$${p.price}</strong></div></div>`).join('')}</div>`;
  }
}

// ======================== CART ========================
function updateCartCount() {
  document.getElementById('cartCount').innerText = cart.length;
}

function renderCart() {
  const container = document.getElementById('cartList');
  if (!cart.length) { container.innerHTML = '<p>Cart is empty.</p>'; loadRecommendationsForSection('cartRecommendations', null); return; }
  let subtotal = 0;
  cart.forEach(item => { subtotal += item.price; });
  let discountAmount = 0;
  let finalTotal = subtotal;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') discountAmount = (appliedDiscount.amount / 100) * subtotal;
    else discountAmount = appliedDiscount.amount;
    finalTotal = subtotal - discountAmount;
  }
  let html = '';
  cart.forEach((item, i) => {
    html += `<div class="cart-item"><div><img src="${item.image}" width="50" style="border-radius:8px;"> ${escapeHtml(item.name)} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</div><div>$${item.price} <button onclick="removeFromCart(${i})">Remove</button></div></div>`;
  });
  html += `<div class="cart-item"><strong>Subtotal: $${subtotal.toFixed(2)}</strong></div>`;
  if (appliedDiscount) {
    html += `<div class="cart-item"><strong>Discount: -$${discountAmount.toFixed(2)}</strong></div>`;
  }
  html += `<div class="cart-item"><strong>Total: $${finalTotal.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
  loadRecommendationsForSection('cartRecommendations', null);
}

function removeFromCart(i) {
  cart.splice(i,1);
  localStorage.setItem('cart',JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function addToCartFromDetail() {
  const sizeSelect = document.getElementById('productSize');
  const price = sizeSelect ? parseFloat(sizeSelect.value) : currentProduct.price;
  const size = sizeSelect ? sizeSelect.options[sizeSelect.selectedIndex].text.split(' - ')[0] : 'Standard';
  const color = document.getElementById('productColor')?.value || 'Default';
  cart.push({ id: currentProduct.id, name: currentProduct.name, price, size, color, image: currentProduct.main_image });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert('Added to cart');
}

async function applyDiscount() {
  const code = document.getElementById('promoCodeInput').value.trim();
  if (!code) { alert('Enter promo code'); return; }
  showSpinner();
  try {
    const res = await apiCall('/discounts/validate', { method: 'POST', body: JSON.stringify({ code }) });
    appliedDiscount = res;
    alert(`Discount applied: ${res.description || ''}`);
    renderCart();
  } catch(e) { alert('Invalid discount code'); }
  finally { hideSpinner(); }
}

// ======================== CHECKOUT ========================
function goToCheckout() {
  if (!cart.length) { alert('Cart is empty'); return; }
  checkoutData = { shippingAddress: '', deliveryMethod: 'standard', deliveryCost: 5 };
  document.getElementById('checkoutAddress').value = '';
  document.querySelectorAll('.checkout-step').forEach((step, idx) => {
    step.classList.remove('active');
    if (idx === 0) step.classList.add('active');
  });
  switchPage('checkoutPage');
}

function nextStep() {
  const steps = ['stepShipping', 'stepDelivery', 'stepPayment'];
  let currentIdx = steps.findIndex(step => document.getElementById(step).classList.contains('active'));
  if (currentIdx === 0) {
    const addr = document.getElementById('checkoutAddress').value;
    if (!addr) { alert('Enter shipping address'); return; }
    checkoutData.shippingAddress = addr;
  } else if (currentIdx === 1) {
    const delivery = document.querySelector('input[name="delivery"]:checked').value;
    checkoutData.deliveryMethod = delivery;
    checkoutData.deliveryCost = delivery === 'standard' ? 5 : 15;
  }
  if (currentIdx < steps.length - 1) {
    document.getElementById(steps[currentIdx]).classList.remove('active');
    document.getElementById(steps[currentIdx+1]).classList.add('active');
  }
}

async function completeCheckout() {
  if (!checkoutData.shippingAddress) { alert('Enter shipping address'); return; }
  let subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') discountAmount = (appliedDiscount.amount / 100) * subtotal;
    else discountAmount = appliedDiscount.amount;
  }
  let total = subtotal - discountAmount + checkoutData.deliveryCost;
  const orderData = {
    items: cart,
    address: checkoutData.shippingAddress,
    delivery: checkoutData.deliveryMethod,
    total: total,
    discount: appliedDiscount
  };
  showSpinner();
  try {
    const order = await apiCall('/orders', { method: 'POST', body: JSON.stringify(orderData) });
    const waMsg = `New order #${order.id}\nTotal: $${total.toFixed(2)}\nAddress: ${checkoutData.shippingAddress}\nPlease confirm payment.`;
    window.open(`https://wa.me/263776871711?text=${encodeURIComponent(waMsg)}`);
    cart = [];
    appliedDiscount = null;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Order placed! Check WhatsApp to complete payment.');
    switchPage('home');
  } catch(e) { alert('Order failed: ' + e.message); }
  finally { hideSpinner(); }
}

// ======================== CATEGORY MENU ========================
function buildMainMenu() {
  const container = document.getElementById('mainMenu');
  if (!container) return;
  container.innerHTML = '';
  for (let cat in categoryHierarchy) {
    const div = document.createElement('div');
    div.innerHTML = `<img src="${subcategoryIcons[cat] || defaultIcon}" width="20"> ${cat}`;
    div.onclick = () => selectMainCategory(cat);
    container.appendChild(div);
  }
}

function selectMainCategory(category) {
  currentFilterType = 'category';
  currentCategory = category;
  currentDisplayCount = 150;
  const filtered = allProducts.filter(p => p.cat === category);
  displayProducts(filtered.slice(0, currentDisplayCount));
  const subContainer = document.getElementById('subMenu');
  subContainer.innerHTML = '';
  const subs = categoryHierarchy[category];
  for (let sub in subs) {
    const div = document.createElement('div');
    div.innerHTML = `<img src="${subcategoryIcons[sub] || defaultIcon}" width="20"> ${sub}`;
    div.onclick = () => selectSubCategory(category, sub);
    subContainer.appendChild(div);
  }
}

function selectSubCategory(category, sub) {
  currentFilterType = 'subcategory';
  currentCategory = category;
  currentSubcategory = sub;
  currentDisplayCount = 150;
  const leafs = categoryHierarchy[category][sub];
  const filtered = allProducts.filter(p => p.cat === category && leafs.includes(p.subcat));
  displayProducts(filtered.slice(0, currentDisplayCount));
}

// ======================== SEARCH ========================
function searchProducts() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) { resetHome(); return; }
  currentFilterType = 'search';
  currentSearchQuery = query;
  currentDisplayCount = 150;
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)));
  displayProducts(filtered.slice(0, currentDisplayCount));
  const autocomplete = document.getElementById('autocompleteList');
  autocomplete.innerHTML = '';
  const matches = allProducts.filter(p => p.name.toLowerCase().startsWith(query)).slice(0,5);
  matches.forEach(p => {
    const div = document.createElement('div');
    div.innerText = p.name;
    div.onclick = () => { document.getElementById('searchInput').value = p.name; searchProducts(); autocomplete.innerHTML = ''; };
    autocomplete.appendChild(div);
  });
}

function handleScan(input) {
  if (input.files.length) {
    const fakeCode = input.files[0].name.split('.')[0];
    document.getElementById('searchInput').value = fakeCode;
    searchProducts();
  }
}

// ======================== USER AUTH & DASHBOARD ========================
async function register() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const address = document.getElementById('regAddress').value;
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !phone || !password) { alert('Fill all fields'); return; }
  showSpinner();
  try {
    const res = await apiCall('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, address, password }) });
    token = res.token;
    user = res.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    alert('Registration successful');
    switchPage('account');
  } catch(e) { alert(e.message); }
  finally { hideSpinner(); }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { alert('Enter email and password'); return; }
  showSpinner();
  try {
    const res = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    token = res.token;
    user = res.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    alert('Login successful');
    switchPage('account');
  } catch(e) { alert('Invalid credentials'); }
  finally { hideSpinner(); }
}

function logout() {
  token = null;
  user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  alert('Logged out');
  switchPage('account');
}

async function showMyOrders() {
  const container = document.getElementById('customerData');
  if (!container) return;
  showSpinner();
  try {
    const orders = await apiCall('/orders');
    if (!orders.length) { container.innerHTML = '<p>No orders yet.</p>'; return; }
    let html = '<h4>My Orders</h4><ul>';
    orders.forEach(o => { html += `<li>Order #${o.id} - Total $${o.total} - Status: ${o.status}</li>`; });
    html += '</ul>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error loading orders.</p>'; }
  finally { hideSpinner(); }
}

async function showMyQuotations() {
  const container = document.getElementById('customerData');
  showSpinner();
  try {
    const quotes = await apiCall('/quotations');
    if (!quotes.length) { container.innerHTML = '<p>No quotations.</p>'; return; }
    let html = '<h4>My Quotations</h4><ul>';
    quotes.forEach(q => { html += `<li>Quote #${q.id} - Total $${q.total} <button onclick="viewQuote(${q.id})">View</button></li>`; });
    html += '</ul>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error loading quotations.</p>'; }
  finally { hideSpinner(); }
}

async function showMyReturns() {
  const container = document.getElementById('customerData');
  showSpinner();
  try {
    const returns = await apiCall('/returns');
    if (!returns.length) { container.innerHTML = '<p>No returns.</p>'; return; }
    let html = '<h4>My Returns</h4><ul>';
    returns.forEach(r => { html += `<li>Return #${r.id} - Status: ${r.status}</li>`; });
    html += '</ul>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error loading returns.</p>'; }
  finally { hideSpinner(); }
}

async function viewQuote(id) {
  showSpinner();
  try {
    const quote = await apiCall(`/quotations/${id}`);
    const modal = document.getElementById('quoteModal');
    document.getElementById('quotePreview').innerHTML = `<pre>${JSON.stringify(quote, null, 2)}</pre>`;
    modal.style.display = 'flex';
  } catch(e) { alert('Cannot load quote'); }
  finally { hideSpinner(); }
}

function showProfile() {
  const container = document.getElementById('customerData');
  container.innerHTML = `<h4>Edit Profile</h4>
    <input id="editName" value="${user.name}" placeholder="Name">
    <input id="editEmail" value="${user.email}" placeholder="Email">
    <input id="editPhone" value="${user.phone}" placeholder="Phone">
    <input id="editAddress" value="${user.address || ''}" placeholder="Address">
    <button onclick="updateProfile()">Update</button>`;
}

async function updateProfile() {
  const name = document.getElementById('editName').value;
  const email = document.getElementById('editEmail').value;
  const phone = document.getElementById('editPhone').value;
  const address = document.getElementById('editAddress').value;
  showSpinner();
  try {
    const updated = await apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify({ name, email, phone, address }) });
    user = updated;
    localStorage.setItem('user', JSON.stringify(user));
    alert('Profile updated');
    showProfile();
  } catch(e) { alert('Update failed'); }
  finally { hideSpinner(); }
}

function openShipmentTracking() {
  document.getElementById('shipmentTrackingModal').style.display = 'flex';
}

function closeShipmentModal() {
  document.getElementById('shipmentTrackingModal').style.display = 'none';
}

// ======================== TRACKING & MAP ========================
function initMap() {
  if (document.getElementById('map') && typeof L !== 'undefined' && !map) {
    map = L.map('map').setView([-17.825, 31.033], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
    }).addTo(map);
  }
}

async function trackOrder() {
  const code = document.getElementById('trackCode').value.trim();
  if (!code) { alert('Enter tracking code'); return; }
  showSpinner();
  try {
    const shipment = await apiCall(`/shipments/track/${code}`);
    document.getElementById('trackInfo').innerHTML = `<p>Status: ${shipment.status}<br>Location: ${shipment.current_location || 'N/A'}</p>`;
    if (map && shipment.lat && shipment.lng) {
      map.setView([shipment.lat, shipment.lng], 12);
      if (currentMapMarker) map.removeLayer(currentMapMarker);
      currentMapMarker = L.marker([shipment.lat, shipment.lng]).addTo(map).bindPopup(shipment.status).openPopup();
    }
    const timeline = shipment.updates || [];
    const timelineHtml = `<div class="timeline">${timeline.map(u => `<div class="timeline-step completed">${u.status}<br><small>${u.location}</small></div>`).join('')}</div>`;
    document.getElementById('trackTimeline').innerHTML = timelineHtml;
  } catch(e) { document.getElementById('trackInfo').innerHTML = '<p>Tracking not found.</p>'; }
  finally { hideSpinner(); }
}

async function fetchShipmentStatus() {
  const code = document.getElementById('shipmentCode').value.trim();
  if (!code) { alert('Enter tracking code'); return; }
  showSpinner();
  try {
    const shipment = await apiCall(`/shipments/track/${code}`);
    document.getElementById('shipmentStatus').innerHTML = `<p>Status: ${shipment.status}</p>`;
    const timeline = shipment.updates || [];
    document.getElementById('shipmentTimeline').innerHTML = `<div class="timeline">${timeline.map(u => `<div class="timeline-step completed">${u.status}<br><small>${u.location}</small></div>`).join('')}</div>`;
  } catch(e) { document.getElementById('shipmentStatus').innerHTML = '<p>Not found.</p>'; }
  finally { hideSpinner(); }
}

// ======================== PROMO & NEWSLETTER ========================
async function showRandomPromo() {
  try {
    const promos = await apiCall('/promos');
    if (promos.length) {
      const promo = promos[Math.floor(Math.random() * promos.length)];
      const popup = document.getElementById('popupPromo');
      document.getElementById('popupContent').innerHTML = `<div class="popup-content"><h4>${promo.title}</h4><p>${promo.description}</p><button onclick="closePromoPopup()">Close</button></div>`;
      popup.style.display = 'block';
      setTimeout(() => popup.style.display = 'none', 10000);
    }
  } catch(e) { console.log('No promos'); }
}

function closePromoPopup() {
  document.getElementById('popupPromo').style.display = 'none';
}

async function subscribe() {
  const email = document.getElementById('subEmail').value;
  const phone = document.getElementById('subPhone').value;
  if (!email && !phone) { alert('Enter email or phone'); return; }
  showSpinner();
  try {
    await apiCall('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email, phone }) });
    alert('Subscribed!');
  } catch(e) { alert('Subscription failed'); }
  finally { hideSpinner(); }
}

// ======================== ADMIN DASHBOARD ========================
async function adminLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  showSpinner();
  try {
    const res = await fetch(API + '/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('adminToken', data.token);
    document.getElementById('adminLoginDiv').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    initAdminCards();
    alert('Admin login successful');
  } catch(e) { alert('Admin login failed'); }
  finally { hideSpinner(); }
}

function initAdminCards() {
  const cards = document.querySelectorAll('#adminCardsContainer .admin-card');
  cards.forEach(card => {
    card.removeEventListener('click', card._listener);
    const listener = () => {
      const modalId = card.getAttribute('data-modal');
      openAdminModal(modalId);
    };
    card.addEventListener('click', listener);
    card._listener = listener;
  });
}

function openAdminModal(modalId) {
  const modal = document.getElementById(`modal${modalId.charAt(0).toUpperCase() + modalId.slice(1)}`);
  if (!modal) return;
  const body = modal.querySelector('.modal-body');
  switch(modalId) {
    case 'dashboardStats': loadDashboardStats(body); break;
    case 'manageProducts': loadProductsModal(body); break;
    case 'addProduct': showAddProductForm(body); break;
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

async function loadDashboardStats(container) {
  showSpinner();
  try {
    const stats = await adminApiCall('/admin/stats');
    container.innerHTML = `<div class="stats-grid">
      <div class="stats-card">Products: ${stats.products}</div>
      <div class="stats-card">Orders: ${stats.orders}</div>
      <div class="stats-card">Users: ${stats.users}</div>
      <div class="stats-card">Revenue: $${stats.revenue}</div>
    </div>`;
  } catch(e) { container.innerHTML = '<p>Error loading stats</p>'; }
  finally { hideSpinner(); }
}

async function loadProductsModal(container) {
  showSpinner();
  try {
    const products = await adminApiCall('/products');
    let html = '<h3>Manage Products</h3><ul>';
    products.forEach(p => {
      html += `<li>${p.name} - $${p.price} <button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></li>`;
    });
    html += '</ul><button onclick="closeModal(\'modalManageProducts\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error</p>'; }
  finally { hideSpinner(); }
}

async function editProductModal(id) {
  showSpinner();
  const p = await adminApiCall(`/products/${id}`);
  const body = document.getElementById('modalManageProducts').querySelector('.modal-body');
  body.innerHTML = `<h3>Edit Product</h3>
    <input id="editName" value="${p.name}"><br>
    <input id="editPrice" value="${p.price}"><br>
    <input id="editImage" value="${p.main_image}"><br>
    <input id="editSubImages" value="${(p.sub_images || []).join(',')}"><br>
    <textarea id="editDesc">${p.description||''}</textarea><br>
    <input id="editCat" value="${p.cat}"><br>
    <input id="editSubcat" value="${p.subcat}"><br>
    <input id="editColors" value="${(p.colors||[]).join(',')}"><br>
    <input id="editSizes" value="${(p.size_options||[]).map(s=>`${s.size}:${s.price}`).join(',')}"><br>
    <button onclick="updateProduct(${id})">Update</button>
    <button onclick="closeModal('modalManageProducts')">Cancel</button>`;
  hideSpinner();
}

async function updateProduct(id) {
  const name = document.getElementById('editName').value;
  const price = parseFloat(document.getElementById('editPrice').value);
  const main_image = document.getElementById('editImage').value;
  const description = document.getElementById('editDesc').value;
  const cat = document.getElementById('editCat').value;
  const subcat = document.getElementById('editSubcat').value;
  const colors = document.getElementById('editColors').value.split(',').map(c=>c.trim());
  const sizeStr = document.getElementById('editSizes').value;
  let size_options = [];
  if (sizeStr) sizeStr.split(',').forEach(pair => { let [s,p] = pair.split(':'); if(s&&p) size_options.push({size:s.trim(), price:parseFloat(p)}); });
  if (!size_options.length) size_options = [{size:'Standard', price}];
  const sub_images = document.getElementById('editSubImages').value.split(',').map(u=>u.trim()).filter(u=>u);
  const productData = { name, description, cat, subcat, price, colors, size_options, main_image, sub_images };
  showSpinner();
  try {
    await adminApiCall(`/products/${id}`, { method:'PUT', body: JSON.stringify(productData) });
    alert('Product updated');
    closeModal('modalManageProducts');
    openAdminModal('manageProducts');
  } catch(e) { alert('Update failed'); }
  finally { hideSpinner(); }
}

async function deleteProduct(id) {
  if (confirm('Delete product?')) {
    showSpinner();
    try {
      await adminApiCall(`/products/${id}`, { method:'DELETE' });
      alert('Deleted');
      openAdminModal('manageProducts');
    } catch(e) { alert('Delete failed'); }
    finally { hideSpinner(); }
  }
}

function showAddProductForm(container) {
  container.innerHTML = `<h3>Add Product</h3>
    <input id="prodName" placeholder="Name"><br>
    <input id="prodPrice" placeholder="Price"><br>
    <input id="prodImage" placeholder="Main Image URL"><br>
    <input id="prodSubImages" placeholder="Supporting Images (comma)"><br>
    <textarea id="prodDesc" placeholder="Description"></textarea><br>
    <input id="prodCat" placeholder="Category"><br>
    <input id="prodSubcat" placeholder="Subcategory"><br>
    <input id="prodColors" placeholder="Colors (comma)"><br>
    <input id="prodSizes" placeholder="Sizes (size:price, comma)"><br>
    <button onclick="addProduct()">Save</button>
    <button onclick="closeModal('modalAddProduct')">Cancel</button>`;
}

async function addProduct() {
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const main_image = document.getElementById('prodImage').value;
  const description = document.getElementById('prodDesc').value;
  const cat = document.getElementById('prodCat').value;
  const subcat = document.getElementById('prodSubcat').value;
  const colors = document.getElementById('prodColors').value.split(',').map(c=>c.trim());
  const sizeStr = document.getElementById('prodSizes').value;
  let size_options = [];
  if (sizeStr) sizeStr.split(',').forEach(pair => { let [s,p] = pair.split(':'); if(s&&p) size_options.push({size:s.trim(), price:parseFloat(p)}); });
  if (!size_options.length) size_options = [{size:'Standard', price}];
  const sub_images = document.getElementById('prodSubImages').value.split(',').map(u=>u.trim()).filter(u=>u);
  const product = { name, description, cat, subcat, price, colors, size_options, main_image, sub_images };
  showSpinner();
  try {
    await adminApiCall('/products', { method:'POST', body: JSON.stringify(product) });
    alert('Product added');
    closeModal('modalAddProduct');
    openAdminModal('manageProducts');
  } catch(e) { alert('Add failed'); }
  finally { hideSpinner(); }
}

async function loadOrdersModal(container) {
  showSpinner();
  try {
    const orders = await adminApiCall('/admin/orders');
    let html = '<h3>Orders</h3><ul>';
    orders.forEach(o => { html += `<li>Order #${o.id} - $${o.total} - ${o.status} <button onclick="updateOrderStatus(${o.id}, 'shipped')">Mark Shipped</button></li>`; });
    html += '</ul><button onclick="closeModal(\'modalManageOrders\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error loading orders</p>'; }
  finally { hideSpinner(); }
}

async function updateOrderStatus(orderId, status) {
  showSpinner();
  try {
    await adminApiCall(`/admin/orders/${orderId}`, { method:'PUT', body: JSON.stringify({ status }) });
    alert('Order updated');
    openAdminModal('manageOrders');
  } catch(e) { alert('Update failed'); }
  finally { hideSpinner(); }
}

async function loadDiscountsModal(container) {
  showSpinner();
  try {
    const discounts = await adminApiCall('/admin/discounts');
    let html = '<h3>Discounts</h3><ul>';
    discounts.forEach(d => { html += `<li>${d.code} - ${d.amount}% <button onclick="deleteDiscount('${d.code}')">Delete</button></li>`; });
    html += '</ul><input id="newCode" placeholder="Code"><input id="newAmount" placeholder="Amount %"><button onclick="addDiscount()">Add</button><button onclick="closeModal(\'modalDiscounts\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error</p>'; }
  finally { hideSpinner(); }
}

async function addDiscount() {
  const code = document.getElementById('newCode').value;
  const amount = parseFloat(document.getElementById('newAmount').value);
  showSpinner();
  try {
    await adminApiCall('/admin/discounts', { method:'POST', body: JSON.stringify({ code, amount }) });
    alert('Discount added');
    openAdminModal('discounts');
  } catch(e) { alert('Add failed'); }
  finally { hideSpinner(); }
}

async function deleteDiscount(code) {
  showSpinner();
  try {
    await adminApiCall(`/admin/discounts/${code}`, { method:'DELETE' });
    openAdminModal('discounts');
  } catch(e) { alert('Delete failed'); }
  finally { hideSpinner(); }
}

async function loadReturnsModal(container) {
  showSpinner();
  try {
    const returns = await adminApiCall('/admin/returns');
    let html = '<h3>Returns</h3><ul>';
    returns.forEach(r => { html += `<li>Return #${r.id} - ${r.status} <button onclick="approveReturn(${r.id})">Approve</button></li>`; });
    html += '</ul><button onclick="closeModal(\'modalReturns\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error</p>'; }
  finally { hideSpinner(); }
}

async function approveReturn(id) {
  showSpinner();
  try {
    await adminApiCall(`/admin/returns/${id}/approve`, { method:'PUT' });
    alert('Return approved');
    openAdminModal('returns');
  } catch(e) { alert('Approval failed'); }
  finally { hideSpinner(); }
}

async function loadInventoryModal(container) {
  showSpinner();
  try {
    const products = await adminApiCall('/products');
    let html = '<h3>Inventory</h3><ul>';
    products.forEach(p => { html += `<li>${p.name} - Stock: <input id="stock_${p.id}" value="${p.stock || 0}"> <button onclick="updateStock(${p.id})">Update</button></li>`; });
    html += '</ul><button onclick="closeModal(\'modalInventory\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error</p>'; }
  finally { hideSpinner(); }
}

async function updateStock(id) {
  const stock = document.getElementById(`stock_${id}`).value;
  showSpinner();
  try {
    await adminApiCall(`/admin/products/${id}/stock`, { method:'PUT', body: JSON.stringify({ stock }) });
    alert('Stock updated');
    openAdminModal('inventory');
  } catch(e) { alert('Update failed'); }
  finally { hideSpinner(); }
}

async function loadPoliciesModal(container) {
  showSpinner();
  try {
    const policies = await adminApiCall('/policies');
    let html = '<h3>Policies</h3>';
    policies.forEach(p => {
      html += `<div><strong>${p.title}</strong><textarea id="policy_${p.key}" rows="3">${p.content || ''}</textarea><button onclick="updatePolicy('${p.key}')">Save</button></div>`;
    });
    html += '<button onclick="closeModal(\'modalManagePolicies\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error</p>'; }
  finally { hideSpinner(); }
}

async function updatePolicy(key) {
  const content = document.getElementById(`policy_${key}`).value;
  showSpinner();
  try {
    await adminApiCall(`/policies/${key}`, { method:'PUT', body: JSON.stringify({ content }) });
    alert('Policy updated');
    openAdminModal('managePolicies');
  } catch(e) { alert('Update failed'); }
  finally { hideSpinner(); }
}

async function loadShipmentsModal(container) {
  showSpinner();
  try {
    const shipments = await adminApiCall('/admin/shipments');
    let html = '<h3>Shipments</h3><button onclick="showAddShipmentForm()">+ Add Shipment</button><div>';
    shipments.forEach(s => {
      html += `<div><strong>${s.tracking_code}</strong> - ${s.status}<br>Client: ${s.client.name}<br><button onclick="addShipmentUpdate('${s.id}')">Add Update</button></div>`;
    });
    html += '</div><button onclick="closeModal(\'modalManageShipments\')">Close</button>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<p>Error</p>'; }
  finally { hideSpinner(); }
}

function showAddShipmentForm() {
  const body = document.getElementById('modalManageShipments').querySelector('.modal-body');
  body.innerHTML = `<h3>Add Shipment</h3>
    <input id="shipTrack" placeholder="Tracking Code"><br>
    <input id="shipClientName" placeholder="Client Name"><br>
    <input id="shipClientPhone" placeholder="Client Phone"><br>
    <input id="shipReceiverName" placeholder="Receiver Name"><br>
    <input id="shipReceiverPhone" placeholder="Receiver Phone"><br>
    <input id="shipPickup" placeholder="Pickup Location"><br>
    <select id="shipPaid"><option value="false">Pending</option><option value="true">Paid</option></select><br>
    <textarea id="shipNotes" placeholder="Notes"></textarea><br>
    <button onclick="addShipment()">Save</button>
    <button onclick="closeModal('modalManageShipments')">Cancel</button>`;
}

async function addShipment() {
  const tracking_code = document.getElementById('shipTrack').value || 'SHIP'+Math.floor(Math.random()*1000000);
  const client = { name: document.getElementById('shipClientName').value, phone: document.getElementById('shipClientPhone').value };
  const receiver = { name: document.getElementById('shipReceiverName').value, phone: document.getElementById('shipReceiverPhone').value };
  const pickup = document.getElementById('shipPickup').value;
  const paid = document.getElementById('shipPaid').value === 'true';
  const notes = document.getElementById('shipNotes').value;
  showSpinner();
  try {
    await adminApiCall('/admin/shipments', { method:'POST', body: JSON.stringify({ tracking_code, client, receiver, pickup, notes, paid, status:'pending' }) });
    alert('Shipment added');
    closeModal('modalManageShipments');
    openAdminModal('manageShipments');
  } catch(e) { alert('Add failed'); }
  finally { hideSpinner(); }
}

async function addShipmentUpdate(shipmentId) {
  const location = prompt('Location');
  const status = prompt('Status (pickup/in_transit/delivered)');
  if (location && status) {
    showSpinner();
    try {
      await adminApiCall(`/admin/shipments/${shipmentId}/updates`, { method:'POST', body: JSON.stringify({ location, status }) });
      openAdminModal('manageShipments');
    } catch(e) { alert('Update failed'); }
    finally { hideSpinner(); }
  }
}

function loadBroadcastModal(container) {
  container.innerHTML = `<h3>Broadcast</h3>
    <textarea id="broadcastMsg" rows="3" placeholder="Your message..."></textarea>
    <button onclick="sendBroadcast()">Send Broadcast</button>
    <button onclick="closeModal('modalBroadcast')">Close</button>`;
}

async function sendBroadcast() {
  const message = document.getElementById('broadcastMsg').value;
  if (!message) { alert('Enter message'); return; }
  showSpinner();
  try {
    await adminApiCall('/notifications/broadcast', { method:'POST', body: JSON.stringify({ message }) });
    alert('Broadcast sent');
    closeModal('modalBroadcast');
  } catch(e) { alert('Broadcast failed'); }
  finally { hideSpinner(); }
}

function showCreateQuotationForm(container) {
  container.innerHTML = `<h3>Create Quotation</h3>
    <input id="qClientName" placeholder="Client Name"><br>
    <input id="qClientPhone" placeholder="Client Phone"><br>
    <input id="qClientEmail" placeholder="Client Email"><br>
    <input id="qClientAddress" placeholder="Shipping Address"><br>
    <div id="quoteItemsContainer">
      <div class="quote-item-row"><input class="item-desc" placeholder="Description"><input class="item-qty" placeholder="Qty"><input class="item-price" placeholder="Unit Price"><span class="item-subtotal"></span><button class="remove-item">✖</button></div>
    </div>
    <button id="addQuoteItem">+ Add Item</button><br>
    <input id="quoteShipping" placeholder="Shipping Cost" value="0"><br>
    <select id="discountType"><option value="percentage">%</option><option value="fixed">Fixed</option></select>
    <input id="discountValue" placeholder="Discount" value="0"><br>
    <input id="taxRate" placeholder="Tax %" value="0"><br>
    <textarea id="quoteNotes" placeholder="Notes"></textarea><br>
    <button onclick="generateProfessionalQuote()">Generate Quotation</button>
    <button onclick="closeModal('modalCreateQuotation')">Cancel</button>`;
  
  // Attach remove listener to initial row
  const initialRow = document.querySelector('#quoteItemsContainer .quote-item-row');
  if (initialRow) {
    const rmBtn = initialRow.querySelector('.remove-item');
    if (rmBtn) rmBtn.onclick = () => initialRow.remove();
  }
  document.getElementById('addQuoteItem')?.addEventListener('click', () => {
    const containerDiv = document.getElementById('quoteItemsContainer');
    const row = document.createElement('div'); row.className = 'quote-item-row';
    row.innerHTML = `<input class="item-desc" placeholder="Description"><input class="item-qty" placeholder="Qty"><input class="item-price" placeholder="Unit Price"><span class="item-subtotal"></span><button class="remove-item">✖</button>`;
    row.querySelector('.remove-item').onclick = () => row.remove();
    containerDiv.appendChild(row);
  });
}

async function generateProfessionalQuote() {
  const client_name = document.getElementById('qClientName').value;
  const client_phone = document.getElementById('qClientPhone').value;
  const client_email = document.getElementById('qClientEmail').value;
  const shipping_address = document.getElementById('qClientAddress').value;
  if (!client_name || !client_phone) { alert('Name and phone required'); return; }
  const items = [];
  document.querySelectorAll('#quoteItemsContainer .quote-item-row').forEach(row => {
    const desc = row.querySelector('.item-desc').value;
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    if (desc && qty && price) items.push({ desc, qty, price, subtotal: qty*price });
  });
  if (!items.length) { alert('Add at least one item'); return; }
  const subtotal = items.reduce((s,i)=>s+i.subtotal,0);
  const discountType = document.getElementById('discountType').value;
  const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
  const discountAmount = discountType === 'percentage' ? (discountValue/100)*subtotal : discountValue;
  const shipping = parseFloat(document.getElementById('quoteShipping').value) || 0;
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
  const afterDiscount = subtotal - discountAmount + shipping;
  const taxAmount = (taxRate/100)*afterDiscount;
  const total = afterDiscount + taxAmount;
  const notes = document.getElementById('quoteNotes').value;
  const quoteData = { client_name, client_phone, client_email, shipping_address, items, subtotal, discount_type: discountType, discount_value: discountValue, discount_amount: discountAmount, shipping_cost: shipping, tax_rate: taxRate, tax_amount: taxAmount, total, notes };
  showSpinner();
  try {
    const created = await adminApiCall('/admin/quotations', { method:'POST', body: JSON.stringify(quoteData) });
    const magicLink = await adminApiCall('/magic-auth/send-otp', { method:'POST', body: JSON.stringify({ phone: client_phone, quotation_id: created.id }) });
    const waMsg = `Hello ${client_name}, your quotation from Mmeli Global is ready. View it here: ${magicLink.magicLink}`;
    window.open(`https://wa.me/${client_phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(waMsg)}`);
    alert('Quotation created and WhatsApp link generated');
    closeModal('modalCreateQuotation');
  } catch(e) { alert('Quotation failed: ' + e.message); }
  finally { hideSpinner(); }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function shareProduct() {
  const url = window.location.href;
  const text = `Check out ${currentProduct.name} on Mmeli Global!`;
  if (navigator.share) navigator.share({ title: currentProduct.name, text, url });
  else {
    alert(`Share via WhatsApp: https://wa.me/263776871711?text=${encodeURIComponent(text + ' ' + url)}`);
  }
}

// ======================== INITIALIZATION ========================
window.onload = () => {
  loadProducts();
  updateCartCount();
  if (user) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userName').innerText = user.name;
  }
  if (localStorage.getItem('adminToken')) {
    document.getElementById('adminLoginDiv').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    initAdminCards();
  }
  window.addEventListener('popstate', handleHash);
  handleHash();
};
