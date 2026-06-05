// ========== SAFE SUPABASE INITIALIZATION – NO GLOBAL VARIABLE CONFLICT ==========
(function() {
  if (window._sbClient) return;
  const SUPABASE_URL = 'https://proljdccjrifqgbmsyco.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xqZGNjanJpZnFnYm1zeWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc4ODAxOSwiZXhwIjoyMDkxMzY0MDE5fQ.VltzBUq-bLvu0Ny4jPy1kBp5E-4hffQgqFpqHrRWlZA';
  // Use the global 'supabase' constructor from the library (not our variable)
  window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
// Our client instance – using 'sb' to avoid conflict with library's 'supabase'
const sb = window._sbClient;

// ========== GLOBALS ==========
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentUser = null;
let session = null;
let map = null;
let appliedDiscount = null;
let currentDisplayLimit = 150;
let allShuffled = [];
let searchDebounceTimer = null;

// ---------- Helper Functions ----------
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getShuffledWithPhoneBias(products) {
  const phones = products.filter(p => p.cat === 'Phones');
  const nonPhones = products.filter(p => p.cat !== 'Phones');
  let targetPhone = Math.ceil(products.length * 0.3);
  targetPhone = Math.min(targetPhone, phones.length);
  let targetNon = products.length - targetPhone;
  targetNon = Math.min(targetNon, nonPhones.length);
  const selectedPhones = shuffleArray([...phones]).slice(0, targetPhone);
  const selectedNon = shuffleArray([...nonPhones]).slice(0, targetNon);
  return shuffleArray([...selectedPhones, ...selectedNon]);
}

// ---------- Category Data ----------
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

const categoryImages = {
  'Phones': 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png', 'Cameras': 'https://cdn-icons-png.flaticon.com/512/1046/1046773.png', 'Farming': 'https://cdn-icons-png.flaticon.com/512/2964/2964420.png',
  'Construction': 'https://cdn-icons-png.flaticon.com/512/2991/2991654.png', 'Electronics': 'https://cdn-icons-png.flaticon.com/512/2320/2320352.png', 'Hardware': 'https://cdn-icons-png.flaticon.com/512/1843/1843315.png',
  'Home Appliances': 'https://cdn-icons-png.flaticon.com/512/4060/4060889.png', 'Beauty': 'https://cdn-icons-png.flaticon.com/512/2909/2909902.png', 'Women Hair': 'https://cdn-icons-png.flaticon.com/512/3508/3508206.png',
  'E-Bikes': 'https://cdn-icons-png.flaticon.com/512/3095/3095722.png', 'Furniture': 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png', 'Industrial': 'https://cdn-icons-png.flaticon.com/512/2140/2140641.png',
  'Fashion': 'https://cdn-icons-png.flaticon.com/512/921/921504.png', 'Fitness': 'https://cdn-icons-png.flaticon.com/512/2121/2121811.png', 'Animal': 'https://cdn-icons-png.flaticon.com/512/2752/2752783.png',
  'Packaging': 'https://cdn-icons-png.flaticon.com/512/2421/2421755.png'
};

// ---------- Load Products from Supabase ----------
async function loadProducts() {
  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    allProducts = data || [];
    allShuffled = getShuffledWithPhoneBias(allProducts);
    displayProducts(allShuffled.slice(0, currentDisplayLimit));
    buildMainMenu();
    if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch (err) {
    console.error(err);
    const cached = localStorage.getItem('cachedProducts');
    if (cached) {
      allProducts = JSON.parse(cached);
      allShuffled = getShuffledWithPhoneBias(allProducts);
      displayProducts(allShuffled.slice(0, currentDisplayLimit));
      buildMainMenu();
      document.getElementById('productsContainer').innerHTML += '<p style="text-align:center;">Using cached products.</p>';
    } else {
      document.getElementById('productsContainer').innerHTML = '<p>Error loading products. Check Supabase.</p>';
    }
  }
}

function displayProducts(products) {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  container.innerHTML = '';
  if (products.length === 0) { container.innerHTML = '<p>No products found.</p>'; return; }
  products.forEach(p => {
    let extra = '';
    if (p.metadata) {
      if (p.metadata.storage) extra += ` ${p.metadata.storage}`;
      if (p.metadata.brand) extra += ` · ${p.metadata.brand}`;
    }
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.main_image || 'https://picsum.photos/300/200'}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://picsum.photos/300/200?grayscale'">
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}${extra}</div>
        <div class="product-price">$${p.price}</div>
      </div>`;
    card.onclick = (e) => { e.stopPropagation(); openProduct(p.id); };
    container.appendChild(card);
  });
}

function loadMoreProducts() {
  currentDisplayLimit += 150;
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
  if (currentDisplayLimit >= allShuffled.length) document.getElementById('loadMoreBtn').style.display = 'none';
}

// ---------- Menu Functions ----------
function buildMainMenu() {
  const mainMenu = document.getElementById('mainMenu');
  mainMenu.innerHTML = '';
  const categories = Object.keys(categoryHierarchy);
  categories.forEach(cat => {
    const catDiv = document.createElement('div');
    const imgUrl = categoryImages[cat] || defaultIcon;
    catDiv.innerHTML = `<img src="${imgUrl}" style="width:20px;height:20px;" loading="lazy"> ${cat}`;
    catDiv.onclick = () => selectMainCategory(cat);
    mainMenu.appendChild(catDiv);
  });
}

function selectMainCategory(cat) {
  const filtered = allProducts.filter(p => p.cat === cat);
  displayProducts(getShuffledWithPhoneBias(filtered));
  const subMenu = document.getElementById('subMenu');
  subMenu.innerHTML = '';
  const subs = categoryHierarchy[cat];
  if (subs) {
    Object.keys(subs).forEach(sub => {
      const subDiv = document.createElement('div');
      const iconUrl = subcategoryIcons[sub] || defaultIcon;
      subDiv.innerHTML = `<img src="${iconUrl}" style="width:20px;height:20px;margin-right:4px;" loading="lazy"> ${sub}`;
      subDiv.onclick = () => selectSubCategory(cat, sub);
      subMenu.appendChild(subDiv);
    });
  }
}

function selectSubCategory(cat, sub) {
  const leaves = categoryHierarchy[cat][sub];
  if (leaves) {
    const filtered = allProducts.filter(p => leaves.includes(p.subcat));
    displayProducts(getShuffledWithPhoneBias(filtered));
  }
}

// ---------- Product Detail ----------
async function openProduct(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;
  currentProduct = product;
  renderProductDetail(product);
  switchPage('productPage');
  history.pushState(null, '', `#/product/${id}`);
}

function renderProductDetail(p) {
  const container = document.getElementById('productDetailContainer');
  let extraInfo = '';
  if (p.metadata) {
    extraInfo = '<div class="product-metadata">';
    for (const [key, val] of Object.entries(p.metadata)) {
      if (val && key !== 'size_options') extraInfo += `<strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(val))}<br>`;
    }
    extraInfo += '</div>';
  }
  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-left">
        <div class="product-actions-top">
          <button class="back-btn-top" onclick="goBackHome()"><i class="fas fa-arrow-left"></i> Back</button>
          <button class="share-btn-top" onclick="shareProduct()"><i class="fas fa-share-alt"></i> Share</button>
        </div>
        <img src="${p.main_image}" style="width:100%; border-radius:16px;" onerror="this.src='https://picsum.photos/600/600?grayscale'">
        <h2>${escapeHtml(p.name)}</h2>
        <p>${escapeHtml(p.description || '')}</p>
        ${extraInfo}
        <div class="color-size-row">
          <div><label>Color:</label><select id="productColor">${(p.colors || ['Default']).map(c => `<option>${escapeHtml(c)}</option>`).join('')}</select></div>
          <div><label>Size:</label><select id="productSize">${(p.size_options || [{size:'Standard',price:p.price}]).map(s => `<option value="${s.price}">${escapeHtml(s.size)} - $${s.price}</option>`).join('')}</select></div>
        </div>
        <div class="add-to-cart-center"><button onclick="addToCartFromDetail()"><i class="fas fa-cart-plus"></i> Add to Cart</button></div>
      </div>
      <div class="product-detail-right">
        <h4>You may also like</h4>
        <div id="productRecommendGrid" class="recommend-grid"></div>
      </div>
    </div>
  `;
  loadProductRecommendations(p.cat, p.id);
}

async function loadProductRecommendations(cat, excludeId) {
  let recs = allProducts.filter(p => p.cat === cat && p.id !== excludeId).slice(0, 20);
  if (recs.length < 20) recs = allProducts.filter(p => p.id !== excludeId).slice(0, 20);
  const grid = document.getElementById('productRecommendGrid');
  if (grid) grid.innerHTML = recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image}" loading="lazy" onerror="this.src='https://picsum.photos/120/120?grayscale'"><div>${escapeHtml(p.name)}<br><strong>$${p.price}</strong></div></div>`).join('');
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

function shareProduct() {
  const url = window.location.href;
  const text = `Check out ${currentProduct.name} on Mmeli Global!`;
  if (navigator.share) navigator.share({ title: currentProduct.name, text, url });
  else {
    const wa = `https://wa.me/263776871711?text=${encodeURIComponent(text + ' ' + url)}`;
    alert(`Share via WhatsApp: ${wa}`);
  }
}

// ---------- Cart Functions ----------
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }

function renderCart() {
  const container = document.getElementById('cartList');
  if (!cart.length) { container.innerHTML = '<p>Cart is empty.</p>'; return; }
  let html = '', total = 0;
  cart.forEach((item, i) => {
    total += item.price;
    html += `<div class="cart-item"><div><img src="${item.image}" width="50" style="border-radius:8px;" onerror="this.src='https://picsum.photos/50/50?grayscale'"> ${escapeHtml(item.name)} (${escapeHtml(item.size)}, ${escapeHtml(item.color)})</div><div>$${item.price} <button onclick="removeFromCart(${i})">Remove</button></div></div>`;
  });
  html += `<div class="cart-item"><strong>Total: $${total.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
  loadCartRecommendations();
}

function removeFromCart(i) { cart.splice(i,1); localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart(); }

async function loadCartRecommendations() {
  let recs = allProducts.slice(0,20);
  const grid = document.getElementById('cartRecommendations');
  if(grid) grid.innerHTML = `<h4>You may also like</h4><div class="recommend-grid">${recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image}" loading="lazy" onerror="this.src='https://picsum.photos/120/120?grayscale'"><div>${escapeHtml(p.name)}<br><strong>$${p.price}</strong></div></div>`).join('')}</div>`;
}

function goToCheckout() {
  if (!currentUser) { alert('Please login first'); switchPage('account'); return; }
  if (!cart.length) { alert('Cart empty'); return; }
  document.getElementById('checkoutAddress').value = currentUser.user_metadata?.address || '';
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
  document.getElementById('stepShipping').classList.add('active');
  switchPage('checkoutPage');
}

let checkoutData = { shippingAddress: '', deliveryMethod: 'standard', deliveryCost: 5 };

function nextStep() {
  const active = document.querySelector('.checkout-step.active');
  if (active.id === 'stepShipping') {
    checkoutData.shippingAddress = document.getElementById('checkoutAddress').value;
    if (!checkoutData.shippingAddress) { alert('Enter address'); return; }
    active.classList.remove('active');
    document.getElementById('stepDelivery').classList.add('active');
  } else if (active.id === 'stepDelivery') {
    const selected = document.querySelector('input[name="delivery"]:checked').value;
    checkoutData.deliveryMethod = selected;
    checkoutData.deliveryCost = selected === 'express' ? 15 : 5;
    active.classList.remove('active');
    document.getElementById('stepPayment').classList.add('active');
  }
}

async function completeCheckout() {
  const trackingCode = 'MM' + Math.floor(Math.random()*1000000);
  let total = cart.reduce((s,i)=>s+i.price,0);
  if (appliedDiscount) total -= appliedDiscount.amount;
  total += checkoutData.deliveryCost;
  const order = {
    tracking_code: trackingCode,
    user_id: currentUser.id,
    user_data: { email: currentUser.email, phone: currentUser.phone, address: checkoutData.shippingAddress },
    items: cart,
    total,
    status: 'Processing',
    paid: false,
    packed: false,
    shipped: false,
    delivered: false,
    created_at: new Date()
  };
  const { error } = await sb.from('orders').insert([order]);
  if (error) { alert('Order failed: ' + error.message); return; }
  let msg = `New order%0ATracking: ${trackingCode}%0ATotal: $${total}%0AItems:%0A` + cart.map(i=>`${i.name} - $${i.price}`).join('%0A');
  window.open(`https://wa.me/263776871711?text=${msg}`);
  cart = []; localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart(); appliedDiscount = null;
  alert(`Order placed! Tracking code: ${trackingCode}`);
  switchPage('home');
}

async function applyDiscount() {
  const code = document.getElementById('promoCodeInput').value;
  if (!code) return;
  const total = cart.reduce((s,i)=>s+i.price,0);
  const discountAmount = total * 0.1;
  appliedDiscount = { code, amount: discountAmount };
  let discountSpan = document.getElementById('discountDisplay');
  if (!discountSpan) { discountSpan = document.createElement('span'); discountSpan.id = 'discountDisplay'; document.getElementById('cartList').after(discountSpan); }
  discountSpan.innerHTML = `<br>Discount applied: -$${discountAmount.toFixed(2)}`;
}

// ---------- Tracking ----------
async function trackOrder() {
  const code = document.getElementById('trackCode').value.trim();
  if (!code) return alert('Enter tracking code');
  const { data: order, error } = await sb.from('orders').select('*').eq('tracking_code', code).single();
  if (error || !order) { alert('Order not found'); return; }
  document.getElementById('trackInfo').innerHTML = `<strong>Status:</strong> ${order.status}<br><strong>Items:</strong> ${order.items.map(i=>i.name).join(', ')}<br><strong>Total:</strong> $${order.total}`;
  const steps = ['Ordered', 'Paid', 'Packed', 'Shipped', 'Delivered'];
  const stepStatus = { Ordered: true, Paid: order.paid, Packed: order.packed, Shipped: order.shipped, Delivered: order.delivered };
  document.getElementById('trackTimeline').innerHTML = `<div class="timeline">${steps.map(s => `<div class="timeline-step ${stepStatus[s] ? 'completed' : ''}">${s}</div>`).join('')}</div>`;
  if (map) map.remove();
  map = L.map('map').setView([-17.825,31.033], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function initDefaultMap() {
  if (map) map.remove();
  map = L.map('map').setView([-17.825,31.033], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global').openPopup();
}

// ---------- Auth ----------
async function initAuth() {
  const { data: { session: currentSession } } = await sb.auth.getSession();
  session = currentSession;
  if (session) {
    currentUser = session.user;
    const { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
    if (profile) currentUser.role = profile.role || 'customer';
    else currentUser.role = 'customer';
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userName').innerText = currentUser.user_metadata?.full_name || currentUser.email || currentUser.phone;
  } else {
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }
}

async function register() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const email = document.getElementById('regEmail').value;
  const address = document.getElementById('regAddress').value;
  const password = document.getElementById('regPassword').value;
  if (!name || !phone || !password) return alert('Name, phone, and password required');
  const { data, error } = await sb.auth.signUp({
    phone: phone,
    password: password,
    options: { data: { full_name: name, email, address } }
  });
  if (error) { alert('Registration failed: ' + error.message); return; }
  await sb.from('profiles').insert([{ id: data.user.id, name, phone, email, address, role: 'customer' }]);
  alert('Registration successful! Please verify your phone if required, then login.');
}

async function login() {
  const phone = document.getElementById('loginPhone').value;
  const password = document.getElementById('loginPassword').value;
  if (!phone || !password) return alert('Enter phone number and password');
  const { data, error } = await sb.auth.signInWithPassword({ phone, password });
  if (error) { alert('Login failed: ' + error.message); return; }
  session = data.session;
  currentUser = data.user;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  currentUser.role = profile?.role || 'customer';
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('userName').innerText = profile?.name || currentUser.phone;
}

async function logout() {
  await sb.auth.signOut();
  currentUser = null; session = null;
  localStorage.removeItem('cart');
  location.reload();
}

// ---------- Customer Dashboard ----------
async function showMyOrders() {
  const { data: orders, error } = await sb.from('orders').select('*').eq('user_id', currentUser.id);
  if (error) { document.getElementById('customerData').innerHTML = '<p>Error loading orders.</p>'; return; }
  document.getElementById('customerData').innerHTML = `<h4>My Orders</h4>${orders.map(o=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;"><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total} <button onclick="trackOrderCode('${o.tracking_code}')">Track</button></div>`).join('')}`;
}
function trackOrderCode(code) { document.getElementById('trackCode').value = code; switchPage('tracking'); setTimeout(trackOrder, 100); }
async function showMyQuotations() { document.getElementById('customerData').innerHTML = '<p>Quotations coming soon.</p>'; }
async function showMyReturns() { document.getElementById('customerData').innerHTML = '<p>Returns coming soon.</p>'; }
function showProfile() {
  document.getElementById('customerData').innerHTML = `<h4>Edit Profile</h4><input id="editName" value="${currentUser.user_metadata?.full_name || ''}"><br><input id="editPhone" value="${currentUser.phone || ''}"><br><input id="editAddress" value="${currentUser.user_metadata?.address || ''}"><br><button onclick="updateProfile()">Save Changes</button>`;
}
async function updateProfile() {
  const name = document.getElementById('editName').value;
  const address = document.getElementById('editAddress').value;
  const { error } = await sb.auth.updateUser({ data: { full_name: name, address } });
  if (error) alert('Update failed: ' + error.message);
  else alert('Profile updated');
  showProfile();
}
function openShipmentTracking() { document.getElementById('shipmentTrackingModal').style.display = 'flex'; }
function closeShipmentModal() { document.getElementById('shipmentTrackingModal').style.display = 'none'; }
async function fetchShipmentStatus() {
  const code = document.getElementById('shipmentCode').value.trim();
  if (!code) return alert('Enter tracking code');
  const { data: shipment, error } = await sb.from('shipments').select('*').eq('tracking_code', code).single();
  if (error) { document.getElementById('shipmentStatus').innerHTML = '<p style="color:red;">Shipment not found.</p>'; return; }
  document.getElementById('shipmentStatus').innerHTML = `<strong>Status:</strong> ${shipment.status}<br><strong>Client:</strong> ${shipment.client_name}<br><strong>Receiver:</strong> ${shipment.receiver_name}`;
}

// ---------- Admin Functions ----------
async function adminLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { alert('Admin login failed: ' + error.message); return; }
  const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).single();
  if (profile?.role !== 'admin') { alert('Not an admin'); await sb.auth.signOut(); return; }
  currentUser = data.user;
  currentUser.role = 'admin';
  document.getElementById('adminLoginDiv').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  initAdminCards();
}

function initAdminCards() {
  document.querySelectorAll('.admin-card').forEach(card => {
    card.onclick = () => {
      const modalId = card.getAttribute('data-modal');
      if (modalId) openAdminModal(modalId);
    };
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
    case 'bulkImport': break;
    default: return;
  }
  modal.style.display = 'flex';
}

async function loadDashboardStats(container) {
  const { count: products } = await sb.from('products').select('*', { count: 'exact', head: true });
  const { count: orders } = await sb.from('orders').select('*', { count: 'exact', head: true });
  container.innerHTML = `<h3>Dashboard</h3><div class="stats-grid"><div class="stats-card">📦 Orders<br>${orders}</div><div class="stats-card">🛍️ Products<br>${products}</div></div><button onclick="closeModal('modalDashboardStats')">Close</button>`;
}

async function loadProductsModal(container) {
  const { data: products } = await sb.from('products').select('*');
  container.innerHTML = `<h3>Manage Products</h3><input type="text" id="productSearch" placeholder="Search..." onkeyup="filterProductList()" style="width:100%; margin-bottom:10px;"><div id="productListContainer">${products.map(p=>`<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:8px;"><img src="${p.main_image}" width="50" style="border-radius:8px;" onerror="this.src='https://picsum.photos/50/50?grayscale'"> ${escapeHtml(p.name)} - $${p.price} <div><button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div></div>`).join('')}</div><button onclick="closeModal('modalManageProducts')">Close</button>`;
  window.filterProductList = () => {
    const term = document.getElementById('productSearch').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(term));
    document.getElementById('productListContainer').innerHTML = filtered.map(p=>`<div><img src="${p.main_image}" width="50" onerror="this.src='https://picsum.photos/50/50?grayscale'"> ${escapeHtml(p.name)} - $${p.price} <button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div>`).join('');
  };
}

async function editProductModal(id) {
  const { data: p } = await sb.from('products').select('*').eq('id', id).single();
  const body = document.getElementById('modalManageProducts').querySelector('.modal-body');
  body.innerHTML = `<h3>Edit Product</h3><img src="${p.main_image}" width="80" onerror="this.src='https://picsum.photos/80/80?grayscale'"><br>
    <input id="editName" value="${escapeHtml(p.name)}" placeholder="Name"><br>
    <input id="editPrice" value="${p.price}" placeholder="Price"><br>
    <textarea id="editDesc" placeholder="Description">${escapeHtml(p.description||'')}</textarea><br>
    <input id="editCat" value="${escapeHtml(p.cat||'')}" placeholder="Category"><br>
    <input id="editSubcat" value="${escapeHtml(p.subcat||'')}" placeholder="Subcategory"><br>
    <button onclick="updateProduct(${id})">Update</button>
    <button onclick="closeModal('modalManageProducts')">Cancel</button>`;
}

async function updateProduct(id) {
  const name = document.getElementById('editName').value;
  const price = parseFloat(document.getElementById('editPrice').value);
  const description = document.getElementById('editDesc').value;
  const cat = document.getElementById('editCat').value;
  const subcat = document.getElementById('editSubcat').value;
  const { error } = await sb.from('products').update({ name, price, description, cat, subcat }).eq('id', id);
  if (error) alert('Update failed: ' + error.message);
  else alert('Updated');
  closeModal('modalManageProducts');
  openAdminModal('manageProducts');
  loadProducts();
}

async function deleteProduct(id) {
  if(confirm('Delete product?')) {
    await sb.from('products').delete().eq('id', id);
    openAdminModal('manageProducts');
    loadProducts();
  }
}

function showAddProductForm(container) {
  container.innerHTML = `<h3>Add Product</h3>
    <input id="newName" placeholder="Name"><br>
    <input id="newPrice" placeholder="Price"><br>
    <textarea id="newDesc" placeholder="Description"></textarea><br>
    <input id="newCat" placeholder="Category"><br>
    <input id="newSubcat" placeholder="Subcategory"><br>
    <input id="newImage" placeholder="Image URL"><br>
    <button onclick="addProduct()">Save</button>
    <button onclick="closeModal('modalAddProduct')">Cancel</button>`;
}

async function addProduct() {
  const name = document.getElementById('newName').value;
  const price = parseFloat(document.getElementById('newPrice').value);
  const description = document.getElementById('newDesc').value;
  const cat = document.getElementById('newCat').value;
  const subcat = document.getElementById('newSubcat').value;
  const main_image = document.getElementById('newImage').value;
  if (!name || isNaN(price)) return alert('Name and price required');
  const { error } = await sb.from('products').insert([{ name, price, description, cat, subcat, main_image }]);
  if (error) alert('Add failed: ' + error.message);
  else alert('Product added');
  closeModal('modalAddProduct');
  loadProducts();
}

async function loadOrdersModal(container) {
  const { data: orders } = await sb.from('orders').select('*');
  container.innerHTML = `<h3>Orders</h3>${orders.map(o=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0;"><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total}</div>`).join('')}<button onclick="closeModal('modalManageOrders')">Close</button>`;
}

async function loadDiscountsModal(container) { container.innerHTML = `<h3>Discounts</h3><p>Coming soon</p><button onclick="closeModal('modalDiscounts')">Close</button>`; }
async function loadReturnsModal(container) { container.innerHTML = `<h3>Returns</h3><p>Coming soon</p><button onclick="closeModal('modalReturns')">Close</button>`; }
async function loadInventoryModal(container) { container.innerHTML = `<h3>Inventory</h3><p>Coming soon</p><button onclick="closeModal('modalInventory')">Close</button>`; }
async function loadPoliciesModal(container) { container.innerHTML = `<h3>Policies</h3><p>Coming soon</p><button onclick="closeModal('modalManagePolicies')">Close</button>`; }
async function loadShipmentsModal(container) { container.innerHTML = `<h3>Shipments</h3><p>Coming soon</p><button onclick="closeModal('modalManageShipments')">Close</button>`; }
function loadBroadcastModal(container) { container.innerHTML = `<h3>Broadcast</h3><textarea id="broadcastMsg" rows="3"></textarea><button onclick="sendBroadcast()">Generate WhatsApp Link</button><div id="broadcastResult"></div><button onclick="closeModal('modalBroadcast')">Close</button>`; }
async function sendBroadcast() {
  let message = document.getElementById('broadcastMsg').value;
  if (!message) return alert('Enter message');
  const waLink = `https://wa.me/?text=${encodeURIComponent(message + '\n\nCheck our website: ' + window.location.origin)}`;
  document.getElementById('broadcastResult').innerHTML = `<a href="${waLink}" target="_blank">Click to send broadcast</a>`;
}
function showCreateQuotationForm(container) { container.innerHTML = `<h3>Create Quotation</h3><p>Coming soon</p><button onclick="closeModal('modalCreateQuotation')">Close</button>`; }

// ---------- Bulk Import (Excel/CSV) ----------
async function importBulkProducts() {
  const fileInput = document.getElementById('bulkFileInput');
  const statusDiv = document.getElementById('bulkStatus');
  if (!fileInput.files.length) { statusDiv.innerHTML = '<span style="color:red;">Select a file first</span>'; return; }
  const clearMode = document.querySelector('input[name="clearMode"]:checked').value;
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      statusDiv.innerHTML = '<span style="color:blue;">Processing file...</span>';
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (!rows.length) throw new Error('File is empty');

      if (clearMode === 'all') {
        statusDiv.innerHTML = '<span>Clearing all existing products...</span>';
        await sb.from('products').delete().neq('id', 0);
      }

      const productsToUpsert = [];
      for (const row of rows) {
        let name = row['product_name'] || row['name'] || row['Product Name'] || 'Unnamed';
        let description = row['description'] || row['Description'] || '';
        let price = parseFloat(row['price_usd'] || row['price'] || row['Price'] || 0);
        let cat = row['category'] || row['cat'] || 'Uncategorized';
        let subcat = row['subcategory'] || row['subcat'] || '';
        let main_image = row['main_image'] || row['image_url'] || row['Image'] || 'https://picsum.photos/300/200';
        let colors = [];
        if (row['colors']) colors = row['colors'].split(',').map(c=>c.trim());
        let size_options = [];
        if (row['size_options']) {
          try { size_options = JSON.parse(row['size_options']); } catch(e) { /* ignore */ }
        }
        const knownKeys = ['product_name','name','Product Name','description','Description','price_usd','price','Price','category','cat','subcategory','subcat','main_image','image_url','Image','colors','size_options'];
        let metadata = {};
        for (let key in row) {
          if (!knownKeys.includes(key) && !key.startsWith('_')) {
            metadata[key] = row[key];
          }
        }
        if (Object.keys(metadata).length === 0) metadata = null;
        productsToUpsert.push({
          name: String(name).slice(0,255),
          description: String(description),
          price: isNaN(price) ? 0 : price,
          cat: String(cat),
          subcat: String(subcat),
          main_image: String(main_image),
          sub_images: [],
          colors: colors,
          size_options: size_options,
          metadata: metadata
        });
      }

      statusDiv.innerHTML = `<span>Importing ${productsToUpsert.length} products...</span>`;
      const chunkSize = 500;
      let success = 0, errors = 0;
      for (let i = 0; i < productsToUpsert.length; i += chunkSize) {
        const chunk = productsToUpsert.slice(i, i+chunkSize);
        const { error } = await sb.from('products').upsert(chunk, { onConflict: 'name' });
        if (error) {
          errors += chunk.length;
          console.error(error);
        } else {
          success += chunk.length;
        }
        statusDiv.innerHTML = `<span>Imported ${success} / ${productsToUpsert.length} ...</span>`;
        await new Promise(r => setTimeout(r, 50));
      }
      statusDiv.innerHTML = `<span style="color:green;">✅ Import complete! Inserted/Updated: ${success}, Errors: ${errors}</span>`;
      await loadProducts();
      if (document.getElementById('home').classList.contains('active')) {
        allShuffled = getShuffledWithPhoneBias(allProducts);
        displayProducts(allShuffled.slice(0, currentDisplayLimit));
      }
    } catch (err) {
      statusDiv.innerHTML = `<span style="color:red;">Import failed: ${err.message}</span>`;
    }
  };
  reader.readAsArrayBuffer(file);
}

// ---------- UI Helpers ----------
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'cart') renderCart();
  if (pageId === 'tracking') { if (map) map.remove(); initDefaultMap(); }
  if (pageId === 'adminDashboard' && currentUser?.role !== 'admin') {
    alert('Admin access only');
    switchPage('home');
  }
}

function resetHome() {
  currentDisplayLimit = 150;
  allShuffled = getShuffledWithPhoneBias(allProducts);
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
  document.getElementById('subMenu').innerHTML = '';
  switchPage('home');
}

function goBackHome() { resetHome(); }

async function showRandomPromo() {
  const popup = document.getElementById('popupPromo');
  document.getElementById('popupContent').innerHTML = `<img src="https://picsum.photos/300/150" loading="lazy"><div><strong>Special Offer!</strong><br>Free shipping on orders over $500</div>`;
  popup.style.display = 'block';
  setTimeout(() => popup.style.display = 'none', 8000);
}
function closePopup() { document.getElementById('popupPromo').style.display = 'none'; }

async function subscribe() {
  const email = document.getElementById('subEmail').value;
  const phone = document.getElementById('subPhone').value;
  if (!email && !phone) return alert('Enter email or phone');
  alert('Subscribed successfully!');
}

function searchProducts() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  if (!term) { displayProducts(allShuffled.slice(0, currentDisplayLimit)); return; }
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
  displayProducts(getShuffledWithPhoneBias(filtered).slice(0, currentDisplayLimit));
}

function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

// ---------- Event Listeners ----------
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/product/')) {
    const id = hash.split('/').pop();
    if (id && !isNaN(id)) openProduct(id);
  } else { resetHome(); }
});

document.getElementById('searchInput').addEventListener('input', function() {
  clearTimeout(searchDebounceTimer);
  const term = this.value.toLowerCase();
  const list = document.getElementById('autocompleteList');
  if (!term) { list.innerHTML = ''; return; }
  searchDebounceTimer = setTimeout(() => {
    const matches = allProducts.filter(p => p.name.toLowerCase().includes(term)).slice(0,8);
    list.innerHTML = matches.map(p => `<div onclick="openProduct(${p.id})">${escapeHtml(p.name)}</div>`).join('');
  }, 200);
});

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', function() { this.closest('.modal').style.display = 'none'; });
});
window.addEventListener('click', (e) => { if(e.target.classList.contains('modal')) e.target.style.display = 'none'; });
document.querySelector('.close-popup')?.addEventListener('click', closePopup);
document.getElementById('logoArea')?.addEventListener('dblclick', () => switchPage('adminDashboard'));

// ---------- Start ----------
initAuth();
loadProducts();
updateCartCount();
initDefaultMap();
