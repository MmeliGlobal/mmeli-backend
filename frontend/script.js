// ========== GLOBALS ==========
const API = '/api';
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let map = null;
let appliedDiscount = null;
let currentDisplayLimit = 20;
let allShuffled = [];

// Category data (full)
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
  "Smartphones":"https://cdn-icons-png.flaticon.com/512/1055/1055685.png","Feature Phones":"https://cdn-icons-png.flaticon.com/512/180/180027.png","Accessories":"https://cdn-icons-png.flaticon.com/512/1510/1510665.png",
  "Cameras":"https://cdn-icons-png.flaticon.com/512/1046/1046773.png","Video Equipment":"https://cdn-icons-png.flaticon.com/512/1686/1686802.png","Farm Machinery":"https://cdn-icons-png.flaticon.com/512/2964/2964420.png",
  "Irrigation":"https://cdn-icons-png.flaticon.com/512/1591/1591730.png","Heavy Equipment":"https://cdn-icons-png.flaticon.com/512/2991/2991654.png","Materials":"https://cdn-icons-png.flaticon.com/512/1665/1665742.png",
  "Consumer Electronics":"https://cdn-icons-png.flaticon.com/512/2320/2320352.png","Tools":"https://cdn-icons-png.flaticon.com/512/1843/1843315.png","Fasteners":"https://cdn-icons-png.flaticon.com/512/1046/1046795.png",
  "Kitchen Appliances":"https://cdn-icons-png.flaticon.com/512/4060/4060889.png","Cleaning":"https://cdn-icons-png.flaticon.com/512/2195/2195960.png","Hair Products":"https://cdn-icons-png.flaticon.com/512/2909/2909902.png",
  "Salon Equipment":"https://cdn-icons-png.flaticon.com/512/3135/3135715.png","Raw Hair":"https://cdn-icons-png.flaticon.com/512/3508/3508206.png","Wigs":"https://cdn-icons-png.flaticon.com/512/2936/2936842.png",
  "Electric Bikes":"https://cdn-icons-png.flaticon.com/512/3095/3095722.png","Scooters":"https://cdn-icons-png.flaticon.com/512/1355/1355425.png","Home Furniture":"https://cdn-icons-png.flaticon.com/512/3448/3448609.png",
  "Office Furniture":"https://cdn-icons-png.flaticon.com/512/2672/2672223.png","Machines":"https://cdn-icons-png.flaticon.com/512/2140/2140641.png","Packaging":"https://cdn-icons-png.flaticon.com/512/2421/2421755.png",
  "Women Clothing":"https://cdn-icons-png.flaticon.com/512/921/921504.png","Men Clothing":"https://cdn-icons-png.flaticon.com/512/1087/1087811.png","Footwear":"https://cdn-icons-png.flaticon.com/512/2906/2906266.png",
  "Strength Equipment":"https://cdn-icons-png.flaticon.com/512/2121/2121811.png","Cardio":"https://cdn-icons-png.flaticon.com/512/2362/2362147.png","Poultry Equipment":"https://cdn-icons-png.flaticon.com/512/2752/2752783.png",
  "Livestock Equipment":"https://cdn-icons-png.flaticon.com/512/1995/1995584.png"
};
const defaultIcon = "https://cdn-icons-png.flaticon.com/512/456/456212.png";

// ========== HELPERS ==========
function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(API + endpoint, { ...options, headers }).then(r => r.json());
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

function escapeHtml(str) {
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// ========== CACHING & PRODUCT LOADING ==========
function cacheProducts(products) {
  localStorage.setItem('cachedProducts', JSON.stringify({ data: products, timestamp: Date.now() }));
}

function getCachedProducts() {
  const cached = localStorage.getItem('cachedProducts');
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < 10 * 60 * 1000) return data;
  return null;
}

async function loadProducts(forceRefresh = false) {
  const cached = !forceRefresh ? getCachedProducts() : null;
  if (cached && cached.length) {
    allProducts = cached;
    allShuffled = getShuffledWithPhoneBias(allProducts);
    currentDisplayLimit = 20;
    displayProducts(allShuffled.slice(0, currentDisplayLimit));
    buildMainMenu();
    if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
    refreshProductsInBackground();
    return;
  }
  await fetchFreshProducts();
}

async function fetchFreshProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error();
    const data = await res.json();
    allProducts = data;
    cacheProducts(allProducts);
    allShuffled = getShuffledWithPhoneBias(allProducts);
    currentDisplayLimit = 20;
    displayProducts(allShuffled.slice(0, currentDisplayLimit));
    buildMainMenu();
    if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
  } catch(e) {
    console.warn("Backend unreachable");
    document.getElementById('productsContainer').innerHTML = '<p>⚠️ Unable to load products. Check backend.</p>';
  }
}

async function refreshProductsInBackground() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error();
    const data = await res.json();
    allProducts = data;
    cacheProducts(allProducts);
    allShuffled = getShuffledWithPhoneBias(allProducts);
    if (document.getElementById('home').classList.contains('active')) {
      currentDisplayLimit = 20;
      displayProducts(allShuffled.slice(0, currentDisplayLimit));
    }
  } catch(e) {}
}

function displayProducts(products) {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  container.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `<img loading="lazy" src="${p.main_image || 'https://picsum.photos/300/200'}" alt="${escapeHtml(p.name)}"><div class="product-info"><div class="product-name">${escapeHtml(p.name)}</div><div class="product-price">$${p.price}</div></div>`;
    card.onclick = () => openProduct(p.id);
    container.appendChild(card);
  });
  document.getElementById('loadMoreBtn').style.display = (currentDisplayLimit >= allShuffled.length) ? 'none' : 'block';
}

function loadMoreProducts() {
  currentDisplayLimit += 20;
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
}

// ========== MAIN MENU ==========
function buildMainMenu() {
  const mainMenu = document.getElementById('mainMenu');
  mainMenu.innerHTML = '';
  const categories = Object.keys(categoryHierarchy);
  const categoryImages = {
    'Phones':'https://cdn-icons-png.flaticon.com/512/1055/1055685.png','Cameras':'https://cdn-icons-png.flaticon.com/512/1046/1046773.png','Farming':'https://cdn-icons-png.flaticon.com/512/2964/2964420.png',
    'Construction':'https://cdn-icons-png.flaticon.com/512/2991/2991654.png','Electronics':'https://cdn-icons-png.flaticon.com/512/2320/2320352.png','Hardware':'https://cdn-icons-png.flaticon.com/512/1843/1843315.png',
    'Home Appliances':'https://cdn-icons-png.flaticon.com/512/4060/4060889.png','Beauty':'https://cdn-icons-png.flaticon.com/512/2909/2909902.png','Women Hair':'https://cdn-icons-png.flaticon.com/512/3508/3508206.png',
    'E-Bikes':'https://cdn-icons-png.flaticon.com/512/3095/3095722.png','Furniture':'https://cdn-icons-png.flaticon.com/512/3448/3448609.png','Industrial':'https://cdn-icons-png.flaticon.com/512/2140/2140641.png',
    'Fashion':'https://cdn-icons-png.flaticon.com/512/921/921504.png','Fitness':'https://cdn-icons-png.flaticon.com/512/2121/2121811.png','Animal':'https://cdn-icons-png.flaticon.com/512/2752/2752783.png',
    'Packaging':'https://cdn-icons-png.flaticon.com/512/2421/2421755.png'
  };
  categories.forEach(cat => {
    const div = document.createElement('div');
    div.innerHTML = `<img src="${categoryImages[cat] || defaultIcon}" style="width:20px;height:20px;"> ${cat}`;
    div.onclick = () => selectMainCategory(cat);
    mainMenu.appendChild(div);
  });
}

function selectMainCategory(cat) {
  const filtered = allProducts.filter(p => p.cat === cat);
  allShuffled = getShuffledWithPhoneBias(filtered);
  currentDisplayLimit = 20;
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
  const subMenu = document.getElementById('subMenu');
  subMenu.innerHTML = '';
  const subs = categoryHierarchy[cat];
  if (subs) {
    Object.keys(subs).forEach(sub => {
      const subDiv = document.createElement('div');
      subDiv.innerHTML = `<img src="${subcategoryIcons[sub] || defaultIcon}" style="width:20px;height:20px;margin-right:4px;"> ${sub}`;
      subDiv.onclick = () => {
        const leaves = categoryHierarchy[cat][sub];
        if (leaves) {
          const filtered = allProducts.filter(p => leaves.includes(p.subcat));
          allShuffled = getShuffledWithPhoneBias(filtered);
          currentDisplayLimit = 20;
          displayProducts(allShuffled.slice(0, currentDisplayLimit));
        }
      };
      subMenu.appendChild(subDiv);
    });
  }
}

// ========== PRODUCT & SOCIAL SHARING ==========
async function openProduct(id) {
  let product = allProducts.find(p => p.id == id);
  if (!product) {
    try {
      const res = await fetch(API + `/products/${id}`);
      if (!res.ok) throw new Error();
      product = await res.json();
    } catch(e) { alert('Product not found'); return; }
  }
  currentProduct = product;
  renderProductDetail(product);
  switchPage('productPage');
  // Update URL hash without reload
  history.pushState(null, '', `#/product/${id}`);
}

function renderProductDetail(p) {
  const container = document.getElementById('productDetailContainer');
  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-left">
        <div class="product-actions-top">
          <button class="back-btn-top" onclick="goBackHome()"><i class="fas fa-arrow-left"></i> Back</button>
          <button class="share-btn-top" onclick="shareProduct()"><i class="fas fa-share-alt"></i> Share</button>
        </div>
        <img src="${p.main_image}" style="width:100%; border-radius:16px;">
        <h2>${p.name}</h2>
        <p>${p.description || ''}</p>
        <div class="color-size-row">
          <div><label>Color:</label><select id="productColor">${(p.colors || ['Default']).map(c => `<option>${c}</option>`).join('')}</select></div>
          <div><label>Size:</label><select id="productSize">${(p.size_options || [{size:'Standard',price:p.price}]).map(s => `<option value="${s.price}">${s.size} - $${s.price}</option>`).join('')}</select></div>
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
  if (grid) grid.innerHTML = recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img loading="lazy" src="${p.main_image}"><div>${p.name}<br><strong>$${p.price}</strong></div></div>`).join('');
}

function shareProduct() {
  const url = `https://mmeliglobal.com/product/${currentProduct.id}`;
  const text = `Check out ${currentProduct.name} on Mmeli Global!`;
  if (navigator.share) navigator.share({ title: currentProduct.name, text, url });
  else alert(`Share via WhatsApp: https://wa.me/263776871711?text=${encodeURIComponent(text + ' ' + url)}`);
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

// ========== CART ==========
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }

function renderCart() {
  const container = document.getElementById('cartList');
  if (!cart.length) { container.innerHTML = '<p>Cart is empty.</p>'; return; }
  let html = '', total = 0;
  cart.forEach((item, i) => {
    total += item.price;
    html += `<div class="cart-item"><div><img src="${item.image}" width="50" style="border-radius:8px;"> ${item.name} (${item.size}, ${item.color})</div><div>$${item.price} <button onclick="removeFromCart(${i})">Remove</button></div></div>`;
  });
  html += `<div class="cart-item"><strong>Total: $${total.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
  loadCartRecommendations();
}

function removeFromCart(i) { cart.splice(i,1); localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart(); }

async function loadCartRecommendations() {
  let recs = allProducts.slice(0,20);
  const grid = document.getElementById('cartRecommendations');
  if(grid) grid.innerHTML = `<h4>You may also like</h4><div class="recommend-grid">${recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img loading="lazy" src="${p.main_image}"><div>${p.name}<br><strong>$${p.price}</strong></div></div>`).join('')}</div>`;
}

function goToCheckout() {
  if (!user) { alert('Please login first'); switchPage('account'); return; }
  if (!cart.length) { alert('Cart empty'); return; }
  document.getElementById('checkoutAddress').value = user.address || '';
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
  const order = { tracking_code: trackingCode, user_id: user.id, user_data: user, items: cart, total, status: 'Processing', paid: false, packed: false, shipped: false, delivered: false };
  try {
    await apiCall('/orders', { method:'POST', body: JSON.stringify(order) });
    let msg = `New order%0ATracking: ${trackingCode}%0ATotal: $${total}%0AItems:%0A` + cart.map(i=>`${i.name} - $${i.price}`).join('%0A');
    window.open(`https://wa.me/263776871711?text=${msg}`);
    cart = []; localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart(); appliedDiscount = null;
    alert(`Order placed! Tracking code: ${trackingCode}`);
    switchPage('home');
  } catch(e) { alert('Order failed: '+e.message); }
}

async function applyDiscount() {
  const code = document.getElementById('promoCodeInput').value;
  if (!code) return;
  const total = cart.reduce((s,i)=>s+i.price,0);
  try {
    const res = await apiCall('/marketing/validate', { method:'POST', body: JSON.stringify({ code, cartTotal: total }) });
    appliedDiscount = { code, amount: res.discountAmount };
    let discountSpan = document.getElementById('discountDisplay');
    if (!discountSpan) { discountSpan = document.createElement('span'); discountSpan.id = 'discountDisplay'; document.getElementById('cartList').after(discountSpan); }
    discountSpan.innerHTML = `<br>Discount applied: -$${res.discountAmount.toFixed(2)}`;
  } catch(e) { alert(e.message); }
}

// ========== TRACKING ==========
async function trackOrder() {
  const code = document.getElementById('trackCode').value.trim();
  if (!code) return alert('Enter tracking code');
  try {
    const order = await apiCall(`/orders/track/${code}`);
    document.getElementById('trackInfo').innerHTML = `<strong>Status:</strong> ${order.status}<br><strong>Items:</strong> ${order.items.map(i=>i.name).join(', ')}<br><strong>Total:</strong> $${order.total}`;
    const steps = ['Ordered','Paid','Packed','Shipped','Delivered'];
    const stepStatus = { Ordered:true, Paid:order.paid, Packed:order.packed, Shipped:order.shipped, Delivered:order.delivered };
    document.getElementById('trackTimeline').innerHTML = `<div class="timeline">${steps.map(s => `<div class="timeline-step ${stepStatus[s] ? 'completed' : ''}">${s}</div>`).join('')}</div>`;
    if (map) map.remove();
    map = L.map('map').setView([-17.825,31.033], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    if (order.location_lat && order.location_lng) {
      L.marker([order.location_lat, order.location_lng]).addTo(map).bindPopup('Current Location').openPopup();
      map.setView([order.location_lat, order.location_lng], 12);
    } else { L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global').openPopup(); }
  } catch(e) { alert('Order not found'); }
}

function initDefaultMap() {
  if (map) map.remove();
  map = L.map('map').setView([-17.825,31.033], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global').openPopup();
}

async function fetchShipmentStatus() {
  const code = document.getElementById('shipmentCode').value.trim();
  if (!code) return alert('Enter tracking code');
  try {
    const shipment = await apiCall(`/shipments/track/${code}`);
    document.getElementById('shipmentStatus').innerHTML = `<strong>Status:</strong> ${shipment.status}<br><strong>Client:</strong> ${shipment.client.name}<br><strong>Receiver:</strong> ${shipment.receiver.name}<br><strong>Notes:</strong> ${shipment.notes || '—'}`;
    const timelineDiv = document.getElementById('shipmentTimeline');
    if (shipment.updates && shipment.updates.length) {
      timelineDiv.innerHTML = `<h4>Tracking Timeline</h4><ul>${shipment.updates.map(u => `<li>${new Date(u.timestamp).toLocaleString()} - ${u.status}: ${u.location || ''}</li>`).join('')}</ul>`;
    } else timelineDiv.innerHTML = '';
  } catch(e) { document.getElementById('shipmentStatus').innerHTML = '<p style="color:red;">Shipment not found.</p>'; }
}

// ========== AUTH ==========
async function register() {
  const name = document.getElementById('regName').value, email = document.getElementById('regEmail').value, phone = document.getElementById('regPhone').value, address = document.getElementById('regAddress').value, password = document.getElementById('regPassword').value;
  if (!name || !email || !password) return alert('Fill required fields');
  try {
    const data = await apiCall('/auth/register', { method:'POST', body: JSON.stringify({ name, surname: '', email, phone, address, password }) });
    token = data.token; user = data.user; localStorage.setItem('token',token); localStorage.setItem('user',JSON.stringify(user));
    document.getElementById('loginBox').style.display='none'; document.getElementById('dashboard').style.display='block'; document.getElementById('userName').innerText = user.name;
    alert('Registration successful!');
  } catch(e) { alert('Registration failed: '+e.message); }
}

async function login() {
  const email = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
  if (!email || !password) return alert('Enter credentials');
  try {
    const data = await apiCall('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
    token = data.token; user = data.user; localStorage.setItem('token',token); localStorage.setItem('user',JSON.stringify(user));
    document.getElementById('loginBox').style.display='none'; document.getElementById('dashboard').style.display='block'; document.getElementById('userName').innerText = user.name;
  } catch(e) { alert('Login failed: '+e.message); }
}

function logout() { token=null; user=null; localStorage.clear(); location.reload(); }

async function showMyOrders() {
  const orders = await apiCall('/orders/my-orders');
  document.getElementById('customerData').innerHTML = `<h4>My Orders</h4>${orders.map(o=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;"><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total} <button onclick="trackOrderCode('${o.tracking_code}')">Track</button></div>`).join('')}`;
}

function trackOrderCode(code) { document.getElementById('trackCode').value = code; switchPage('tracking'); setTimeout(trackOrder, 100); }

async function showMyQuotations() {
  try {
    const quotes = await apiCall('/quotations/my-quotations');
    document.getElementById('customerData').innerHTML = `<h4>My Quotations</h4>${quotes.map(q=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;">${q.quote_number} - $${q.total} <button onclick="viewQuote(${q.id})">View</button></div>`).join('')}`;
  } catch(e) { document.getElementById('customerData').innerHTML = '<p>No quotations yet.</p>'; }
}

async function viewQuote(id) { const q = await apiCall(`/quotations/${id}`); document.getElementById('quotePreview').innerHTML = `<pre>${JSON.stringify(q,null,2)}</pre>`; document.getElementById('quoteModal').style.display='flex'; }
function closeQuoteModal() { document.getElementById('quoteModal').style.display='none'; }

async function showMyReturns() { try { const returns = await apiCall('/returns/my-returns'); document.getElementById('customerData').innerHTML = `<h4>My Returns</h4>${returns.map(r=>`<div>Return for order #${r.order_id}: ${r.status} - ${r.reason}</div>`).join('')}`; } catch(e) { document.getElementById('customerData').innerHTML = '<p>No returns yet.</p>'; } }

function showProfile() {
  document.getElementById('customerData').innerHTML = `<h4>Edit Profile</h4><input id="editName" value="${user.name}"><br><input id="editPhone" value="${user.phone || ''}"><br><input id="editAddress" value="${user.address || ''}"><br><button onclick="updateProfile()">Save Changes</button>`;
}

async function updateProfile() {
  const name = document.getElementById('editName').value, phone = document.getElementById('editPhone').value, address = document.getElementById('editAddress').value;
  const updated = await apiCall('/users/profile', { method:'PUT', body: JSON.stringify({ name, phone, address }) });
  user = updated; localStorage.setItem('user',JSON.stringify(user)); document.getElementById('userName').innerText = user.name; alert('Profile updated'); showProfile();
}

function openShipmentTracking() { document.getElementById('shipmentTrackingModal').style.display = 'flex'; }
function closeShipmentModal() { document.getElementById('shipmentTrackingModal').style.display = 'none'; }

// ========== ADMIN DASHBOARD (full preserved) ==========
async function adminLogin() {
  const email = document.getElementById('adminEmail').value, password = document.getElementById('adminPassword').value;
  try {
    const data = await apiCall('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
    if (!data.user || data.user.role !== 'admin') throw new Error('Not admin');
    token = data.token; user = data.user; localStorage.setItem('token',token); localStorage.setItem('user',JSON.stringify(user));
    document.getElementById('adminLoginDiv').style.display='none'; document.getElementById('adminPanel').style.display='block';
  } catch(e) { alert('Admin login failed: ' + e.message); }
}

function initAdminCards() {
  const container = document.getElementById('adminCardsContainer');
  const cards = [
    { name: '📊 Dashboard', modal: 'dashboardStats' }, { name: '🛍️ Products', modal: 'manageProducts' },
    { name: '➕ Add Product', modal: 'addProduct' }, { name: '📦 Orders', modal: 'manageOrders' },
    { name: '🏷️ Discounts', modal: 'discounts' }, { name: '🔄 Returns', modal: 'returns' },
    { name: '📦 Inventory', modal: 'inventory' }, { name: '📜 Policies', modal: 'managePolicies' },
    { name: '🚚 Shipments', modal: 'manageShipments' }, { name: '📢 Broadcast', modal: 'broadcast' },
    { name: '📄 Create Quotation', modal: 'createQuotation' }
  ];
  container.innerHTML = cards.map(c => `<div class="admin-card" data-modal="${c.modal}">${c.name}</div>`).join('');
  document.querySelectorAll('.admin-card').forEach(card => {
    card.addEventListener('click', () => {
      const modalId = card.getAttribute('data-modal');
      if (modalId) openAdminModal(modalId);
    });
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
  try {
    const stats = await apiCall('/dashboard/stats');
    container.innerHTML = `<h3>Dashboard</h3><div class="stats-grid"><div class="stats-card">📦 Orders<br>${stats.totalOrders}</div><div class="stats-card">💰 Revenue<br>$${stats.totalRevenue}</div><div class="stats-card">🛍️ Products<br>${stats.totalProducts}</div><div class="stats-card">👥 Customers<br>${stats.totalUsers}</div><div class="stats-card">📅 Today<br>${stats.todayOrders} orders</div><div class="stats-card">📈 Week Revenue<br>$${stats.weekRevenue}</div></div><button onclick="closeModal('modalDashboardStats')">Close</button>`;
  } catch(e) { container.innerHTML = '<p>Error loading stats</p>'; }
}

async function loadProductsModal(container) {
  let products = await apiCall('/products');
  container.innerHTML = `<h3>Manage Products</h3><input type="text" id="productSearch" placeholder="Search..." onkeyup="filterProductList()" style="width:100%; margin-bottom:10px;"><div id="productListContainer">${products.map(p=>`<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:8px;"><img src="${p.main_image}" width="50" style="border-radius:8px;"> ${p.name} - $${p.price} <div><button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div></div>`).join('')}</div><button onclick="closeModal('modalManageProducts')">Close</button>`;
  window.filterProductList = () => {
    const term = document.getElementById('productSearch').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(term));
    document.getElementById('productListContainer').innerHTML = filtered.map(p=>`<div><img src="${p.main_image}" width="50"> ${p.name} - $${p.price} <button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div>`).join('');
  };
}

async function editProductModal(id) {
  const p = await apiCall(`/products/${id}`);
  const body = document.getElementById('modalManageProducts').querySelector('.modal-body');
  body.innerHTML = `<h3>Edit Product</h3><img src="${p.main_image}" width="80"><br><input id="editName" value="${p.name}"><br><input id="editPrice" value="${p.price}"><br><input id="editImage" value="${p.main_image}"><br><label>Supporting Images (URLs, comma)</label><input id="editSubImages" value="${(p.sub_images || []).join(',')}"><br><textarea id="editDesc">${p.description||''}</textarea><br><input id="editCat" value="${p.cat}"><br><input id="editSubcat" value="${p.subcat}"><br><input id="editColors" value="${(p.colors||[]).join(',')}"><br><input id="editSizes" value="${(p.size_options||[]).map(s=>`${s.size}:${s.price}`).join(',')}"><br><button onclick="updateProduct(${id})">Update</button><button onclick="closeModal('modalManageProducts')">Cancel</button>`;
}

async function updateProduct(id) {
  const name = document.getElementById('editName').value;
  const price = parseFloat(document.getElementById('editPrice').value);
  const main_image = document.getElementById('editImage').value;
  const description = document.getElementById('editDesc').value;
  const cat = document.getElementById('editCat').value;
  const subcat = document.getElementById('editSubcat').value;
  const colors = document.getElementById('editColors').value.split(',').map(c=>c.trim()).filter(c=>c);
  const sizeStr = document.getElementById('editSizes').value;
  const subImagesStr = document.getElementById('editSubImages').value;
  if (!name || isNaN(price) || !main_image || !cat || !subcat) { alert('Please fill required fields'); return; }
  let size_options = [];
  if (sizeStr) {
    sizeStr.split(',').forEach(pair => {
      let [s, p] = pair.split(':');
      if (s && p) size_options.push({ size: s.trim(), price: parseFloat(p) });
    });
  }
  if (size_options.length === 0) size_options = [{ size: 'Standard', price: price }];
  let sub_images = subImagesStr ? subImagesStr.split(',').map(u => u.trim()).filter(u => u) : [];
  const productData = { name, description, cat, subcat, price, colors, size_options, main_image, sub_images };
  try {
    await apiCall(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });
    alert('Product updated successfully');
    closeModal('modalManageProducts');
    openAdminModal('manageProducts');
    loadProducts(true);
  } catch (err) { alert('Update failed: ' + err.message); }
}

async function deleteProduct(id) { if(confirm('Delete product?')) await apiCall(`/products/${id}`, { method:'DELETE' }); openAdminModal('manageProducts'); loadProducts(true); }

function showAddProductForm(container) {
  container.innerHTML = `<h3>Add Product</h3><input id="prodName" placeholder="Name"><br><input id="prodPrice" placeholder="Price"><br><input id="prodImage" placeholder="Main Image URL"><br><label>Supporting Images (URLs, comma)</label><input id="prodSubImages"><br><textarea id="prodDesc" placeholder="Description"></textarea><br><input id="prodCat" placeholder="Category"><br><input id="prodSubcat" placeholder="Subcategory"><br><input id="prodColors" placeholder="Colors (comma)"><br><input id="prodSizes" placeholder="Sizes (size:price, comma)"><br><button onclick="addProduct()">Save</button><button onclick="closeModal('modalAddProduct')">Cancel</button>`;
}

async function addProduct() {
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const main_image = document.getElementById('prodImage').value;
  const description = document.getElementById('prodDesc').value;
  const cat = document.getElementById('prodCat').value;
  const subcat = document.getElementById('prodSubcat').value;
  const colors = document.getElementById('prodColors').value.split(',').map(c=>c.trim()).filter(c=>c);
  const sizeStr = document.getElementById('prodSizes').value;
  const subImagesStr = document.getElementById('prodSubImages').value;
  if (!name || isNaN(price) || !main_image || !cat || !subcat) { alert('Please fill required fields'); return; }
  let size_options = [];
  if (sizeStr) {
    sizeStr.split(',').forEach(pair => {
      let [s, p] = pair.split(':');
      if (s && p) size_options.push({ size: s.trim(), price: parseFloat(p) });
    });
  }
  if (size_options.length === 0) size_options = [{ size: 'Standard', price: price }];
  let sub_images = subImagesStr ? subImagesStr.split(',').map(u => u.trim()).filter(u => u) : [];
  const productData = { name, description, cat, subcat, price, colors, size_options, main_image, sub_images };
  try {
    await apiCall('/products', { method: 'POST', body: JSON.stringify(productData) });
    alert('Product added successfully');
    closeModal('modalAddProduct');
    openAdminModal('manageProducts');
    loadProducts(true);
  } catch (err) { alert('Add failed: ' + err.message); }
}

async function loadOrdersModal(container) {
  const orders = await apiCall('/orders');
  container.innerHTML = `<h3>Orders</h3>${orders.map(o=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0;"><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total}<br><button onclick="updateOrderStatus('${o.id}','paid')">Mark Paid</button> <button onclick="updateOrderStatus('${o.id}','packed')">Mark Packed</button> <button onclick="updateOrderStatus('${o.id}','shipped')">Mark Shipped</button> <button onclick="updateOrderStatus('${o.id}','delivered')">Mark Delivered</button></div>`).join('')}<button onclick="closeModal('modalManageOrders')">Close</button>`;
}

async function updateOrderStatus(id, step) {
  const update = {};
  if (step === 'paid') update.paid = true;
  else if (step === 'packed') update.packed = true;
  else if (step === 'shipped') update.shipped = true;
  else if (step === 'delivered') update.delivered = true;
  await apiCall(`/orders/${id}/status`, { method:'PUT', body: JSON.stringify({ ...update, status: step.charAt(0).toUpperCase() + step.slice(1) }) });
  openAdminModal('manageOrders');
}

async function loadDiscountsModal(container) {
  const discounts = await apiCall('/marketing/discounts');
  container.innerHTML = `<h3>Discounts</h3><button onclick="showAddDiscountForm()">+ Add Discount</button><div id="discountsList">${discounts.map(d=>`<div>${d.code} - ${d.type} ${d.value}% - ${d.is_active?'Active':'Inactive'} <button onclick="deleteDiscount(${d.id})">Delete</button></div>`).join('')}</div><button onclick="closeModal('modalDiscounts')">Close</button>`;
}

function showAddDiscountForm() {
  const body = document.getElementById('modalDiscounts').querySelector('.modal-body');
  body.innerHTML = `<h3>Add Discount</h3><input id="discountCode" placeholder="Code"><select id="discountType"><option value="percentage">%</option><option value="fixed">Fixed</option></select><input id="discountValue" placeholder="Value"><input id="discountMinOrder" placeholder="Min Order"><button onclick="addDiscount()">Save</button><button onclick="closeModal('modalDiscounts')">Cancel</button>`;
}

async function addDiscount() {
  const code = document.getElementById('discountCode').value, type = document.getElementById('discountType').value, value = parseFloat(document.getElementById('discountValue').value), min_order = parseFloat(document.getElementById('discountMinOrder').value);
  await apiCall('/marketing/discounts', { method:'POST', body: JSON.stringify({ code, type, value, min_order, is_active: true }) });
  alert('Discount added'); openAdminModal('discounts');
}

async function deleteDiscount(id) { if(confirm('Delete discount?')) await apiCall(`/marketing/discounts/${id}`, { method:'DELETE' }); openAdminModal('discounts'); }

async function loadReturnsModal(container) {
  const returns = await apiCall('/returns');
  container.innerHTML = `<h3>Returns</h3>${returns.map(r=>`<div>Order ${r.order_id}: ${r.status} - ${r.reason} <button onclick="updateReturnStatus(${r.id},'approved')">Approve</button> <button onclick="updateReturnStatus(${r.id},'rejected')">Reject</button></div>`).join('')}<button onclick="closeModal('modalReturns')">Close</button>`;
}

async function updateReturnStatus(id, status) {
  await apiCall(`/returns/${id}/status`, { method:'PUT', body: JSON.stringify({ status }) });
  openAdminModal('returns');
}

async function loadInventoryModal(container) {
  const inv = await apiCall('/inventory');
  container.innerHTML = `<h3>Inventory</h3>${inv.map(i=>`<div>${i.products?.name}: ${i.quantity} in ${i.warehouse} <button onclick="updateStock(${i.id})">Update</button></div>`).join('')}<button onclick="closeModal('modalInventory')">Close</button>`;
}

async function updateStock(id) {
  const qty = prompt('New quantity');
  if (qty !== null) await apiCall(`/inventory/${id}`, { method:'PUT', body: JSON.stringify({ quantity: parseInt(qty) }) });
  openAdminModal('inventory');
}

async function loadPoliciesModal(container) {
  const policies = await apiCall('/policies');
  container.innerHTML = `<h3>Policies</h3>${policies.map(p => `<div><strong>${p.title}</strong><textarea id="policy_${p.key}" rows="3">${p.content || ''}</textarea><button onclick="updatePolicy('${p.key}')">Save</button></div>`).join('')}<button onclick="closeModal('modalManagePolicies')">Close</button>`;
  window.updatePolicy = async (key) => { const content = document.getElementById(`policy_${key}`).value; await apiCall(`/policies/${key}`, { method:'PUT', body: JSON.stringify({ content }) }); alert('Policy updated'); openAdminModal('managePolicies'); };
}

async function loadShipmentsModal(container) {
  const shipments = await apiCall('/shipments');
  container.innerHTML = `<h3>Shipments</h3><button onclick="showAddShipmentForm()">+ Add Shipment</button><div id="shipmentsList">${shipments.map(s=>`<div><strong>${s.tracking_code}</strong> - ${s.status}<br>Client: ${s.client.name}<br>Receiver: ${s.receiver.name}<br><button onclick="updateShipmentStatus('${s.id}','shipped')">Mark Shipped</button></div>`).join('')}</div><button onclick="closeModal('modalManageShipments')">Close</button>`;
}

function showAddShipmentForm() {
  const body = document.getElementById('modalManageShipments').querySelector('.modal-body');
  body.innerHTML = `<h3>Add Shipment</h3><div><label>Tracking Code</label><input id="shipTrack"></div><div><label>Client Name</label><input id="shipClientName"></div><div><label>Client Phone</label><input id="shipClientPhone"></div><div><label>Receiver Name</label><input id="shipReceiverName"></div><div><label>Receiver Phone</label><input id="shipReceiverPhone"></div><div><label>Pickup Location</label><input id="shipPickup"></div><div><label>Courier Payment Status</label><select id="shipPaid"><option value="false">Pending</option><option value="true">Paid</option></select></div><div><label>Package Image</label><input type="file" id="shipImage"></div><div><label>Notes</label><textarea id="shipNotes"></textarea></div><button onclick="addShipment()">Save</button><button onclick="closeModal('modalManageShipments')">Cancel</button>`;
}

async function addShipment() {
  const tracking_code = document.getElementById('shipTrack').value || 'SHIP'+Math.floor(Math.random()*1000000);
  const client = { name: document.getElementById('shipClientName').value, phone: document.getElementById('shipClientPhone').value };
  const receiver = { name: document.getElementById('shipReceiverName').value, phone: document.getElementById('shipReceiverPhone').value };
  const pickup = document.getElementById('shipPickup').value;
  const paid = document.getElementById('shipPaid').value === 'true';
  const notes = document.getElementById('shipNotes').value;
  const file = document.getElementById('shipImage').files[0];
  let image = null;
  const save = async (img) => { await apiCall('/shipments', { method:'POST', body: JSON.stringify({ tracking_code, client, receiver, pickup, notes, image: img, paid, status:'pending' }) }); alert('Shipment added'); closeModal('modalManageShipments'); openAdminModal('manageShipments'); };
  if (file) { const reader = new FileReader(); reader.onload = e => save(e.target.result); reader.readAsDataURL(file); } else save(null);
}

async function updateShipmentStatus(id) { await apiCall(`/shipments/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'shipped' }) }); openAdminModal('manageShipments'); }

function loadBroadcastModal(container) {
  container.innerHTML = `<h3>Broadcast</h3><textarea id="broadcastMsg" rows="3"></textarea><button onclick="sendBroadcast()">Generate WhatsApp Link</button><div id="broadcastResult"></div><button onclick="closeModal('modalBroadcast')">Close</button>`;
}

async function sendBroadcast() {
  let message = document.getElementById('broadcastMsg').value;
  if (!message) return alert('Enter message');
  const fullMessage = `${message}\n\nCheck our website: ${window.location.origin}`;
  const data = await apiCall('/notifications/broadcast', { method:'POST', body: JSON.stringify({ message: fullMessage }) });
  document.getElementById('broadcastResult').innerHTML = `<a href="${data.waLink}" target="_blank">Click to send broadcast to ${data.count} subscribers</a>`;
}

function showCreateQuotationForm(container) {
  container.innerHTML = `<h3>Create Quotation</h3><div>Client Name: <input id="qcName"></div><div>Client Phone: <input id="qcPhone"></div><div>Client Email: <input id="qcEmail"></div><div>Address: <input id="qcAddress"></div><hr><div id="quoteItems"><div class="quote-item"><input placeholder="Description"> <input placeholder="Qty" size="5"> <input placeholder="Price" size="8"></div></div><button onclick="addQuoteItemRow()">+ Add Item</button><hr><div>Shipping Cost: <input id="qcShipping" value="0"></div><div>Discount: <input id="qcDiscount" value="0"></div><div>Tax %: <input id="qcTax" value="0"></div><hr><div><strong>Total: $<span id="qcTotal">0.00</span></strong></div><button onclick="generateQuoteAndSave()">Generate & Save Quotation</button>`;
  window.addQuoteItemRow = () => { const div = document.createElement('div'); div.className = 'quote-item'; div.innerHTML = '<input placeholder="Description"> <input placeholder="Qty" size="5"> <input placeholder="Price" size="8">'; document.getElementById('quoteItems').appendChild(div); };
  window.generateQuoteAndSave = async () => {
    const client = { name: document.getElementById('qcName').value, phone: document.getElementById('qcPhone').value, email: document.getElementById('qcEmail').value, address: document.getElementById('qcAddress').value };
    const items = []; document.querySelectorAll('#quoteItems .quote-item').forEach(row => { const desc = row.children[0].value, qty = parseFloat(row.children[1].value)||0, price = parseFloat(row.children[2].value)||0; if(desc && qty>0 && price>0) items.push({desc, qty, price, subtotal: qty*price}); });
    const subtotal = items.reduce((s,i)=>s+i.subtotal,0);
    const shipping = parseFloat(document.getElementById('qcShipping').value)||0;
    const discount = parseFloat(document.getElementById('qcDiscount').value)||0;
    const taxRate = parseFloat(document.getElementById('qcTax').value)||0;
    const afterDiscount = subtotal - discount + shipping;
    const tax = (taxRate/100)*afterDiscount;
    const total = afterDiscount + tax;
    const quoteData = { client, items, subtotal, discount, shipping, tax_rate: taxRate, total, issue_date: new Date().toISOString().split('T')[0] };
    await apiCall('/quotations', { method:'POST', body: JSON.stringify(quoteData) });
    alert('Quotation saved! It will appear in client portal.');
    closeModal('modalCreateQuotation');
  };
}

function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

// ========== SEARCH ==========
document.getElementById('searchInput').addEventListener('input', function() {
  const term = this.value.toLowerCase();
  const list = document.getElementById('autocompleteList');
  if (!term) { list.innerHTML = ''; return; }
  const matches = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)) || (p.cat && p.cat.toLowerCase().includes(term)) || (p.subcat && p.subcat.toLowerCase().includes(term))).slice(0,8);
  list.innerHTML = matches.map(p => `<div onclick="openProduct(${p.id})">${p.name} (${p.cat})</div>`).join('');
});

function searchProducts() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  if (!term) { displayProducts(allShuffled.slice(0, currentDisplayLimit)); return; }
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)) || (p.cat && p.cat.toLowerCase().includes(term)) || (p.subcat && p.subcat.toLowerCase().includes(term)));
  allShuffled = getShuffledWithPhoneBias(filtered);
  currentDisplayLimit = 20;
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
}

// ========== UI & ROUTING ==========
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'cart') renderCart();
  if (pageId === 'home') { if (!allProducts.length) loadProducts(); else displayProducts(allShuffled.slice(0, currentDisplayLimit)); }
  if (pageId === 'tracking') { if (map) map.remove(); initDefaultMap(); }
}

function resetHome() {
  allShuffled = getShuffledWithPhoneBias(allProducts);
  currentDisplayLimit = 20;
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
  document.getElementById('subMenu').innerHTML = '';
  switchPage('home');
  history.pushState(null, '', '/');
}

function goBackHome() { resetHome(); }

async function showRandomPromo() {
  try {
    const promo = await apiCall('/promotions/random');
    if (promo) {
      const popup = document.getElementById('popupPromo');
      document.getElementById('popupContent').innerHTML = `<img src="${promo.image_url || 'https://picsum.photos/300/150'}" width="100%"><div><strong>${promo.title}</strong><br>${promo.description}<br><a href="${promo.link}" target="_blank">Shop now</a></div>`;
      popup.style.display = 'block';
      setTimeout(() => popup.style.display = 'none', 8000);
    }
  } catch(e) {}
}

function closePopup() { document.getElementById('popupPromo').style.display = 'none'; }

async function subscribe() {
  const email = document.getElementById('subEmail').value, phone = document.getElementById('subPhone').value;
  if (!email && !phone) return alert('Enter email or phone');
  try { await apiCall('/notifications/subscribe', { method:'POST', body: JSON.stringify({ email, phone, name: user?.name || '' }) }); alert('Subscribed successfully!'); } catch(e) { alert('Subscription failed'); }
}

function handleHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#/home' || hash === '#/') {
    resetHome();
  } else if (hash.startsWith('#/product/')) {
    const id = parseInt(hash.split('/').pop());
    if (!isNaN(id)) openProduct(id);
  } else {
    resetHome();
  }
}

// ========== INITIALISATION ==========
window.addEventListener('load', () => {
  loadProducts();
  updateCartCount();
  initAdminCards();
  if (user) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userName').innerText = user.name;
  }
  handleHash();
  // Also handle direct product URLs (if backend redirected to /#/product/...)
  if (window.location.hash === '') {
    resetHome();
  }
});

window.addEventListener('hashchange', handleHash);

// Double-click logo opens admin dashboard (Issue #1)
document.getElementById('logoArea').addEventListener('dblclick', () => switchPage('adminDashboard'));

// Close modals
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', function() { this.closest('.modal').style.display = 'none'; });
});
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });

// Expose globals for inline onclick handlers
window.switchPage = switchPage;
window.resetHome = resetHome;
window.openProduct = openProduct;
window.addToCartFromDetail = addToCartFromDetail;
window.removeFromCart = removeFromCart;
window.goToCheckout = goToCheckout;
window.nextStep = nextStep;
window.completeCheckout = completeCheckout;
window.applyDiscount = applyDiscount;
window.trackOrder = trackOrder;
window.register = register;
window.login = login;
window.logout = logout;
window.showMyOrders = showMyOrders;
window.showMyQuotations = showMyQuotations;
window.viewQuote = viewQuote;
window.closeQuoteModal = closeQuoteModal;
window.showMyReturns = showMyReturns;
window.showProfile = showProfile;
window.updateProfile = updateProfile;
window.openShipmentTracking = openShipmentTracking;
window.closeShipmentModal = closeShipmentModal;
window.fetchShipmentStatus = fetchShipmentStatus;
window.subscribe = subscribe;
window.searchProducts = searchProducts;
window.goBackHome = goBackHome;
window.shareProduct = shareProduct;
window.loadMoreProducts = loadMoreProducts;
window.adminLogin = adminLogin;
window.closePopup = closePopup;
window.closeModal = closeModal;
window.editProductModal = editProductModal;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.addProduct = addProduct;
window.updateOrderStatus = updateOrderStatus;
window.addDiscount = addDiscount;
window.deleteDiscount = deleteDiscount;
window.updateReturnStatus = updateReturnStatus;
window.updateStock = updateStock;
window.updateShipmentStatus = updateShipmentStatus;
window.sendBroadcast = sendBroadcast;
window.generateQuoteAndSave = (window.generateQuoteAndSave);
window.addQuoteItemRow = (window.addQuoteItemRow);
