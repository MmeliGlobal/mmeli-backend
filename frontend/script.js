// ========== GLOBALS ==========
const API = '/api';
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let map = null;
let appliedDiscount = null;
let currentDisplayLimit = 150;
let allShuffled = [];

// Category data (same as before - keep as is)
const categoryHierarchy = { /* ... same object ... */ };
const subcategoryIcons = { /* ... same ... */ };
const defaultIcon = "https://cdn-icons-png.flaticon.com/512/456/456212.png";

// ========== API HELPER ==========
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

// ========== PRODUCTS & CATALOG ==========
function shuffleArray(arr) { /* same */ }
function getShuffledWithPhoneBias(products) { /* same */ }
async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    allProducts = data;
    allShuffled = getShuffledWithPhoneBias(allProducts);
    displayProducts(allShuffled.slice(0, currentDisplayLimit));
    buildMainMenu();
    if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch(e) {
    console.error(e);
    const cached = localStorage.getItem('cachedProducts');
    if (cached) {
      allProducts = JSON.parse(cached);
      allShuffled = getShuffledWithPhoneBias(allProducts);
      displayProducts(allShuffled.slice(0, currentDisplayLimit));
      buildMainMenu();
    } else {
      document.getElementById('productsContainer').innerHTML = '<p>Error loading products. Check backend.</p>';
    }
  }
}
function displayProducts(products) { /* same */ }
function loadMoreProducts() { /* same */ }
function buildMainMenu() { /* same */ }
function selectMainCategory(cat) { /* same */ }
function selectSubCategory(cat, sub) { /* same */ }

// ========== PRODUCT DETAIL ==========
async function openProduct(id) { /* same */ }
function renderProductDetail(p) { /* same */ }
async function loadProductRecommendations(cat, excludeId) { /* same */ }
function shareProduct() {
  const url = window.location.href;
  const text = `Check out ${currentProduct.name} on Mmeli Global!`;
  if (navigator.share) navigator.share({ title: currentProduct.name, text, url });
  else {
    const wa = `https://wa.me/263776871711?text=${encodeURIComponent(text + ' ' + url)}`;
    alert(`Share via WhatsApp: ${wa}`);
  }
}
function addToCartFromDetail() { /* same */ }
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }
function renderCart() { /* same */ }
function removeFromCart(i) { /* same */ }
async function loadCartRecommendations() { /* same */ }

// ========== CHECKOUT ==========
function goToCheckout() {
  if (!user) { alert('Please login first'); switchPage('account'); return; }
  if (!cart.length) { alert('Cart empty'); return; }
  document.getElementById('checkoutAddress').value = user.address || '';
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
  document.getElementById('stepShipping').classList.add('active');
  switchPage('checkoutPage');
}
let checkoutData = { shippingAddress: '', deliveryMethod: 'standard', deliveryCost: 5 };
function nextStep() { /* same */ }
async function completeCheckout() { /* same */ }
async function applyDiscount() { /* same */ }

// ========== TRACKING ==========
async function trackOrder() {
  const code = document.getElementById('trackCode').value.trim();
  if (!code) return alert('Enter tracking code');
  try {
    const order = await apiCall(`/orders/track/${code}`);
    document.getElementById('trackInfo').innerHTML = `<strong>Status:</strong> ${order.status}<br><strong>Items:</strong> ${order.items.map(i=>i.name).join(', ')}<br><strong>Total:</strong> $${order.total}`;
    const steps = ['Ordered', 'Paid', 'Packed', 'Shipped', 'Delivered'];
    const stepStatus = { Ordered: true, Paid: order.paid, Packed: order.packed, Shipped: order.shipped, Delivered: order.delivered };
    const timelineDiv = document.getElementById('trackTimeline');
    timelineDiv.innerHTML = `<div class="timeline">${steps.map(s => `<div class="timeline-step ${stepStatus[s] ? 'completed' : ''}">${s}</div>`).join('')}</div>`;
    if (map) map.remove();
    map = L.map('map').setView([-17.825,31.033], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    if (order.location_lat && order.location_lng) {
      L.marker([order.location_lat, order.location_lng]).addTo(map).bindPopup('Current Location').openPopup();
      map.setView([order.location_lat, order.location_lng], 12);
    } else { L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global').openPopup(); }
  } catch(e) { alert('Order not found'); }
}
function initDefaultMap() { /* same */ }
async function fetchShipmentStatus() { /* same */ }
function fetchCustomerShipment() {
  const code = document.getElementById('customerShipmentCode').value.trim();
  if (!code) return alert('Enter tracking code');
  fetchShipmentStatusDirect(code);
}
async function fetchShipmentStatusDirect(code) {
  try {
    const shipment = await apiCall(`/shipments/track/${code}`);
    document.getElementById('customerShipmentStatus').innerHTML = `<strong>Status:</strong> ${shipment.status}<br><strong>Client:</strong> ${shipment.client.name}<br><strong>Receiver:</strong> ${shipment.receiver.name}<br><strong>Notes:</strong> ${shipment.notes || '—'}`;
  } catch(e) { document.getElementById('customerShipmentStatus').innerHTML = '<p style="color:red;">Shipment not found.</p>'; }
}

// ========== AUTH & CUSTOMER PORTAL ==========
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

// Dedicated customer page functions
function switchToCustomerPage(page) {
  switch(page) {
    case 'orders':
      showMyOrdersInPage();
      switchPage('customerOrders');
      break;
    case 'quotations':
      showMyQuotationsInPage();
      switchPage('customerQuotations');
      break;
    case 'returns':
      showMyReturnsInPage();
      switchPage('customerReturns');
      break;
    case 'profile':
      showProfileInPage();
      switchPage('customerProfile');
      break;
    case 'trackShipment':
      switchPage('customerTrackShipment');
      break;
  }
}
async function showMyOrdersInPage() {
  const orders = await apiCall('/orders/my-orders');
  document.getElementById('ordersList').innerHTML = orders.map(o=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;"><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total} <button onclick="trackOrderCode('${o.tracking_code}')">Track</button></div>`).join('');
}
async function showMyQuotationsInPage() {
  try {
    const quotes = await apiCall('/quotations/my-quotations');
    document.getElementById('quotationsList').innerHTML = quotes.map(q=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;">${q.quote_number} - $${q.total} <button onclick="viewQuote(${q.id})">View</button></div>`).join('');
  } catch(e) { document.getElementById('quotationsList').innerHTML = '<p>No quotations yet.</p>'; }
}
async function showMyReturnsInPage() {
  try {
    const returns = await apiCall('/returns/my-returns');
    document.getElementById('returnsList').innerHTML = returns.map(r=>`<div>Return for order #${r.order_id}: ${r.status} - ${r.reason}</div>`).join('');
  } catch(e) { document.getElementById('returnsList').innerHTML = '<p>No returns yet.</p>'; }
}
function showProfileInPage() {
  document.getElementById('profileForm').innerHTML = `<input id="editName" value="${user.name}"><br><input id="editPhone" value="${user.phone || ''}"><br><input id="editAddress" value="${user.address || ''}"><br><button onclick="updateProfileInPage()">Save Changes</button>`;
}
async function updateProfileInPage() {
  const name = document.getElementById('editName').value, phone = document.getElementById('editPhone').value, address = document.getElementById('editAddress').value;
  const updated = await apiCall('/users/profile', { method:'PUT', body: JSON.stringify({ name, phone, address }) });
  user = updated; localStorage.setItem('user',JSON.stringify(user)); document.getElementById('userName').innerText = user.name; alert('Profile updated'); showProfileInPage();
}
async function viewQuote(id) { const q = await apiCall(`/quotations/${id}`); document.getElementById('quotePreview').innerHTML = `<pre>${JSON.stringify(q,null,2)}</pre>`; document.getElementById('quoteModal').style.display='flex'; }
function closeQuoteModal() { document.getElementById('quoteModal').style.display='none'; }
function openShipmentTracking() { document.getElementById('shipmentTrackingModal').style.display = 'flex'; }
function closeShipmentModal() { document.getElementById('shipmentTrackingModal').style.display = 'none'; }
function trackOrderCode(code) { document.getElementById('trackCode').value = code; switchPage('tracking'); setTimeout(trackOrder, 100); }

// ========== ADMIN LOGIN ==========
async function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  if (!email || !password) { alert('Please enter email and password'); return; }
  try {
    const response = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Login failed'); }
    const data = await response.json();
    if (!data.user || data.user.role !== 'admin') throw new Error('Not an admin account. Use admin@mmeliglobal.com');
    token = data.token; user = data.user; localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('adminLoginDiv').style.display = 'none'; document.getElementById('adminPanel').style.display = 'block';
    initAdminCards(); alert('Admin login successful');
  } catch(err) { alert('Admin login failed: ' + err.message); }
}
function initAdminCards() { /* same as before */ }
function openAdminModal(modalId) { /* same */ }
async function loadDashboardStats(container) { /* same */ }
async function loadProductsModal(container) { /* same */ }
async function editProductModal(id) { /* same */ }
async function updateProduct(id) { /* same */ }
async function deleteProduct(id) { /* same */ }
function showAddProductForm(container) { /* same */ }
async function addProduct() { /* same */ }
async function loadOrdersModal(container) { /* same */ }
async function updateOrderStatus(id, step) { /* same */ }
async function loadDiscountsModal(container) { /* same */ }
function showAddDiscountForm() { /* same */ }
async function addDiscount() { /* same */ }
async function deleteDiscount(id) { /* same */ }
async function loadReturnsModal(container) { /* same */ }
async function updateReturnStatus(id, status) { /* same */ }
async function loadInventoryModal(container) { /* same */ }
async function updateStock(id) { /* same */ }
async function loadPoliciesModal(container) { /* same */ }
async function loadShipmentsModal(container) { /* same */ }
function showAddShipmentForm() { /* same */ }
async function addShipment() { /* same */ }
async function updateShipmentStatus(id) { /* same */ }
function loadBroadcastModal(container) { /* same */ }
async function sendBroadcast() { /* same */ }
function showCreateQuotationForm(container) { /* same */ }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

// ========== POLICY MODAL ==========
async function showPolicy(type) {
  let title = '', key = '';
  switch(type) {
    case 'privacy': title = 'Privacy Policy'; key = 'privacy'; break;
    case 'terms': title = 'Terms of Service'; key = 'terms'; break;
    case 'shipping': title = 'Shipping Information'; key = 'shipping'; break;
    case 'returns': title = 'Returns & Refunds'; key = 'returns'; break;
    default: return;
  }
  try {
    const policy = await apiCall(`/policies/${key}`);
    document.getElementById('policyTitle').innerText = title;
    document.getElementById('policyContent').innerHTML = policy.content || 'Content not available.';
  } catch(e) {
    // Fallback to local text if backend fails
    const fallback = {
      privacy: 'We value your privacy. Your personal data is used only for order processing and will never be shared.',
      terms: 'By using our site, you agree to our terms and conditions. All sales are final unless damaged.',
      shipping: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 days. International rates apply.',
      returns: 'Returns accepted within 14 days of delivery. Items must be unused and in original packaging.'
    };
    document.getElementById('policyTitle').innerText = title;
    document.getElementById('policyContent').innerHTML = fallback[type];
  }
  document.getElementById('policyModal').style.display = 'flex';
}

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
  displayProducts(getShuffledWithPhoneBias(filtered).slice(0, currentDisplayLimit));
}

// ========== UI HELPERS ==========
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'cart') renderCart();
  if (pageId === 'home') loadProducts();
  if (pageId === 'tracking') { if (map) map.remove(); initDefaultMap(); }
}
function resetHome() {
  currentDisplayLimit = 150;
  allShuffled = getShuffledWithPhoneBias(allProducts);
  displayProducts(allShuffled.slice(0, currentDisplayLimit));
  document.getElementById('subMenu').innerHTML = '';
  switchPage('home');
}
function goBackHome() { resetHome(); }
async function showRandomPromo() { try { const promo = await apiCall('/promotions/random'); if (promo) { const popup = document.getElementById('popupPromo'); document.getElementById('popupContent').innerHTML = `<img src="${promo.image_url || 'https://picsum.photos/300/150'}" style="width:100%; border-radius:8px;"><div><strong>${promo.title}</strong><br>${promo.description}<br><a href="${promo.link}" target="_blank">Shop now</a></div>`; popup.style.display = 'block'; setTimeout(() => popup.style.display = 'none', 8000); } } catch(e) {} }
function closePopup() { document.getElementById('popupPromo').style.display = 'none'; }
async function subscribe() {
  const email = document.getElementById('subEmail').value, phone = document.getElementById('subPhone').value;
  if (!email && !phone) return alert('Enter email or phone');
  try { await apiCall('/notifications/subscribe', { method:'POST', body: JSON.stringify({ email, phone, name: user?.name || '' }) }); alert('Subscribed successfully!'); } catch(e) { alert('Subscription failed'); }
}
function handleHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#/home' || hash === '#/') resetHome();
  else if (hash.startsWith('#/product/')) { const id = hash.split('/').pop(); if (id && !isNaN(id)) openProduct(id); }
  else resetHome();
}
window.addEventListener('hashchange', handleHash);
function escapeHtml(str) { return str.replace(/[&<>]/g, function(m){if(m==='&')return'&amp;';if(m==='<')return'&lt;';if(m==='>')return'&gt;';return m;}); }

// ========== GLOBAL MODAL CLOSE ==========
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', function() { const modal = this.closest('.modal'); if(modal) modal.style.display = 'none'; });
});
window.addEventListener('click', (e) => { if(e.target.classList.contains('modal')) e.target.style.display = 'none'; });
document.querySelector('.close-popup')?.addEventListener('click', closePopup);

// ========== DOUBLE-CLICK LOGO ==========
const logoElem = document.getElementById('logoArea');
if (logoElem) logoElem.addEventListener('dblclick', (e) => { e.preventDefault(); switchPage('adminDashboard'); });

// ========== INITIALIZATION ==========
window.addEventListener('load', function() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
  updateCartCount();
  initAdminCards();
  if (user) {
    document.getElementById('loginBox').style.display='none';
    document.getElementById('dashboard').style.display='block';
    document.getElementById('userName').innerText = user.name;
    if (user.role === 'admin') { document.getElementById('adminLoginDiv').style.display = 'none'; document.getElementById('adminPanel').style.display = 'block'; }
  }
  resetHome();
  handleHash();
});
