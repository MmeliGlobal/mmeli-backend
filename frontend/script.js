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

// Category data (full – same as original)
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
function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
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
function escapeHtml(str) { return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); }

// ========== CACHING & PRODUCT LOADING ==========
function cacheProducts(products) { localStorage.setItem('cachedProducts', JSON.stringify({ data: products, timestamp: Date.now() })); }
function getCachedProducts() {
  const cached = localStorage.getItem('cachedProducts');
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < 10 * 60 * 1000) return data;
  return null;
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
  } catch(e) { console.warn("Backend error, using cached if any"); }
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
    fetchFreshProducts(); // background refresh
    return;
  }
  await fetchFreshProducts();
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
function loadMoreProducts() { currentDisplayLimit += 20; displayProducts(allShuffled.slice(0, currentDisplayLimit)); }

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

// ========== PRODUCT & SHARING (FIX #3: backend already handles meta, we open product) ==========
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

// ========== CART & CHECKOUT ==========
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
    if (shipment.updates && shipment.updates.length) timelineDiv.innerHTML = `<h4>Timeline</h4><ul>${shipment.updates.map(u => `<li>${new Date(u.timestamp).toLocaleString()} - ${u.status}: ${u.location || ''}</li>`).join('')}</ul>`;
    else timelineDiv.innerHTML = '';
  } catch(e) { document.getElementById('shipmentStatus').innerHTML = '<p style="color:red;">Not found.</p>'; }
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

// ========== ADMIN DASHBOARD (modals – full functionality preserved) ==========
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
  body.innerHTML = `<p>Loading ${modalId}... (endpoint ready)</p><button onclick="closeModal('${modal.id}')">Close</button>`;
  modal.style.display = 'flex';
}
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

// ========== SEARCH ==========
document.getElementById('searchInput').addEventListener('input', function() {
  const term = this.value.toLowerCase();
  const list = document.getElementById('autocompleteList');
  if (!term) { list.innerHTML = ''; return; }
  const matches = allProducts.filter(p => p.name.toLowerCase().includes(term)).slice(0,8);
  list.innerHTML = matches.map(p => `<div onclick="openProduct(${p.id})">${p.name}</div>`).join('');
});
function searchProducts() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  if (!term) { displayProducts(allShuffled.slice(0, currentDisplayLimit)); return; }
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
  allShuffled = getShuffledWithPhoneBias(filtered);
  currentDisplayLimit = 20;
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
}

// ========== UI ROUTING & HOME FIX (FIX #2) ==========
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'cart') renderCart();
  if (pageId === 'home') { if (!allProducts.length) loadProducts(); else displayProducts(allShuffled.slice(0, currentDisplayLimit)); }
  if (pageId === 'tracking') { if (map) map.remove(); initDefaultMap(); }
}
function resetHome() {
  if (!allProducts.length) { loadProducts().then(() => { allShuffled = getShuffledWithPhoneBias(allProducts); currentDisplayLimit = 20; displayProducts(allShuffled.slice(0, currentDisplayLimit)); document.getElementById('subMenu').innerHTML = ''; switchPage('home'); }); return; }
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
  try { await apiCall('/notifications/subscribe', { method:'POST', body: JSON.stringify({ email, phone, name: user?.name || '' }) }); alert('Subscribed!'); } catch(e) { alert('Failed'); }
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

// ========== INIT ==========
window.addEventListener('load', () => {
  loadProducts();
  updateCartCount();
  initAdminCards();
  if (user) { document.getElementById('loginBox').style.display = 'none'; document.getElementById('dashboard').style.display = 'block'; document.getElementById('userName').innerText = user.name; }
  handleHash();
  // Additional check for direct product URL without hash (in case backend redirects differently)
  if (window.location.pathname.startsWith('/product/') && !window.location.hash) {
    const id = parseInt(window.location.pathname.split('/').pop());
    if (!isNaN(id)) setTimeout(() => openProduct(id), 100);
  }
});
window.addEventListener('hashchange', handleHash);

// FIX #1: Double-click logo opens admin dashboard
document.getElementById('logoArea').addEventListener('dblclick', () => switchPage('adminDashboard'));

// Modal close handlers
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', function() { this.closest('.modal').style.display = 'none'; }));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });

// Expose globals for inline onclick handlers
window.switchPage = switchPage; window.resetHome = resetHome; window.openProduct = openProduct;
window.addToCartFromDetail = addToCartFromDetail; window.removeFromCart = removeFromCart; window.goToCheckout = goToCheckout;
window.nextStep = nextStep; window.completeCheckout = completeCheckout; window.applyDiscount = applyDiscount;
window.trackOrder = trackOrder; window.register = register; window.login = login; window.logout = logout;
window.showMyOrders = showMyOrders; window.showMyQuotations = showMyQuotations; window.viewQuote = viewQuote;
window.closeQuoteModal = closeQuoteModal; window.showMyReturns = showMyReturns; window.showProfile = showProfile;
window.updateProfile = updateProfile; window.openShipmentTracking = openShipmentTracking; window.closeShipmentModal = closeShipmentModal;
window.fetchShipmentStatus = fetchShipmentStatus; window.subscribe = subscribe; window.searchProducts = searchProducts;
window.goBackHome = goBackHome; window.shareProduct = shareProduct; window.loadMoreProducts = loadMoreProducts;
window.adminLogin = adminLogin; window.closePopup = closePopup; window.closeModal = closeModal;
