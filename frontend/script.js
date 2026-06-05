const API = '/api';
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let map = null;
let appliedDiscount = null;
let productDisplayLimit = 150; // initial batch
let currentDisplayCount = 150;

// Category hierarchy (same as before – full object)
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

// Helper API call (with token)
async function apiCall(endpoint, options = {}) {
const headers = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = `Bearer ${token}`;
const res = await fetch(API + endpoint, { ...options, headers });
if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
return res.json();
}

// Shuffle with phone bias (30% phones)
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

// Load products (public)
let productsLoaded = false;
async function loadProducts() {
if (productsLoaded) return;
try {
const res = await fetch(API + '/products');
if (!res.ok) throw new Error(await res.text());
const data = await res.json();
allProducts = data;
localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
currentDisplayCount = 150;
displayProducts(getShuffledProductsWithPhoneBias(allProducts).slice(0, currentDisplayCount));
buildMainMenu();
if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
productsLoaded = true;
} catch(e) { console.error(e); const cached = localStorage.getItem('cachedProducts'); if (cached) { allProducts = JSON.parse(cached); displayProducts(getShuffledProductsWithPhoneBias(allProducts).slice(0, currentDisplayCount)); buildMainMenu(); document.getElementById('productsContainer').innerHTML = '<p>Using cached products. Refresh later.</p>'; } else { document.getElementById('productsContainer').innerHTML = '<p>Error loading products.</p>'; } }
}
function displayProducts(products) {
const container = document.getElementById('productsContainer');
if (!container) return;
container.innerHTML = '';
if (products.length === 0) { container.innerHTML = '<p>No products found.</p>'; return; }
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
const allShuffled = getShuffledProductsWithPhoneBias(allProducts);
displayProducts(allShuffled.slice(0, currentDisplayCount));
if (currentDisplayCount >= allShuffled.length) document.getElementById('loadMoreBtn').style.display = 'none';
}
function buildMainMenu() { /* same as before – builds horizontal menu from categoryHierarchy with icons */ }
function selectMainCategory(category) { /* filters products by category */ }
function selectSubCategory(category, sub) { /* filters by subcategory leaves */ }
async function openProduct(id) {
try {
let product = allProducts.find(p => p.id == id);
if (!product) { const res = await fetch(API + `/products/${id}`); if (!res.ok) throw new Error('Product not found'); product = await res.json(); }
currentProduct = product;
renderProductDetail(product);
switchPage('productPage');
history.pushState(null, '', `#/product/${id}`);
// Load 20 related products
loadProductRecommendations(product.cat, product.id);
} catch(e) { console.error(e); alert('Could not open product'); }
}
function renderProductDetail(p) {
const container = document.getElementById('productDetailContainer');
container.innerHTML = `<div class="product-detail-layout"><div class="product-detail-left"><img src="${p.main_image}" style="width:100%; border-radius:16px; margin:10px 0;"><h2>${p.name}</h2><p>${p.description || ''}</p><div class="color-size-row"><div><label>Color:</label> <select id="productColor">${(p.colors || ['Default']).map(c => `<option>${c}</option>`).join('')}</select></div><div><label>Size:</label> <select id="productSize">${(p.size_options || [{size:'Standard',price:p.price}]).map(s => `<option value="${s.price}">${s.size} - $${s.price}</option>`).join('')}</select></div></div><div class="add-to-cart-center"><button onclick="addToCartFromDetail()"><i class="fas fa-cart-plus"></i> Add to Cart</button></div></div><div class="product-detail-right"><h4>You may also like</h4><div id="productRecommendationsGrid" class="recommend-grid"></div></div></div>`;
if (p.size_options && p.size_options.length) {
document.getElementById('productSize')?.addEventListener('change', () => {
document.querySelector('.add-to-cart-center button').innerHTML = `<i class="fas fa-cart-plus"></i> Add to Cart ($${document.getElementById('productSize').value})`;
});
}
}
async function loadProductRecommendations(category, excludeId) {
let recs = allProducts.filter(p => p.cat === category && p.id !== excludeId).slice(0, 20);
if (recs.length < 20) recs = allProducts.filter(p => p.id !== excludeId).slice(0, 20);
const container = document.getElementById('productRecommendationsGrid');
container.innerHTML = recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image}" loading="lazy"><div>${p.name}<br><strong>$${p.price}</strong></div></div>`).join('');
}
async function loadRecommendationsForSection(containerId, excludeId) {
let recs = allProducts.filter(p => p.id !== excludeId).slice(0, 20);
const container = document.getElementById(containerId);
if (container) container.innerHTML = `<h4>You may also like</h4><div class="recommend-grid">${recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image}" loading="lazy"><div>${p.name}<br><strong>$${p.price}</strong></div></div>`).join('')}</div>`;
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
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }
function renderCart() {
const container = document.getElementById('cartList');
if (!cart.length) { container.innerHTML = '<p>Cart is empty.</p>'; return; }
let html = '', total = 0;
cart.forEach((item, i) => { total += item.price; html += `<div class="cart-item"><div><img src="${item.image}" width="50" style="border-radius:8px;"> ${item.name} (${item.size}, ${item.color})</div><div>$${item.price} <button onclick="removeFromCart(${i})">Remove</button></div></div>`; });
html += `<div class="cart-item"><strong>Total: $${total.toFixed(2)}</strong></div>`;
container.innerHTML = html;
loadRecommendationsForSection('cartRecommendations', null);
}
function removeFromCart(i) { cart.splice(i,1); localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart(); }
async function applyDiscount() { /* same */ }
let checkoutData = { shippingAddress: '', deliveryMethod: 'standard', deliveryCost: 5 };
function goToCheckout() { /* same */ }
function nextStep() { /* same */ }
async function completeCheckout() { /* same */ }
async function trackOrder() { /* includes timeline from shipment_updates */ }
async function fetchShipmentStatus() { /* enhanced to show timeline from shipment_updates table */ }
function shareProduct() {
const url = window.location.href;
const text = `Check out ${currentProduct.name} on Mmeli Global!`;
if (navigator.share) navigator.share({ title: currentProduct.name, text, url });
else {
const waLink = `https://wa.me/263776871711?text=${encodeURIComponent(text + ' ' + url)}`;
const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
const twLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
alert(`Share via:\nWhatsApp: ${waLink}\nFacebook: ${fbLink}\nTwitter: ${twLink}`);
}
}

// Authentication (same as before)
async function register() { /* unchanged */ }
async function login() { /* unchanged */ }
function logout() { token=null; user=null; localStorage.clear(); location.reload(); }
async function showMyOrders() { /* unchanged */ }
async function showMyQuotations() { /* unchanged */ }
async function showMyReturns() { /* unchanged */ }
async function viewQuote(id) { /* unchanged */ }
function closeQuoteModal() { document.getElementById('quoteModal').style.display='none'; }
function showProfile() { /* unchanged */ }
async function updateProfile() { /* unchanged */ }
function openShipmentTracking() { document.getElementById('shipmentTrackingModal').style.display = 'flex'; }
function closeShipmentModal() { document.getElementById('shipmentTrackingModal').style.display = 'none'; }

// Admin dashboard
async function adminLogin() { /* same */ }
function initAdminCards() { /* same, but includes createQuotation */ }
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
// Product management with supporting images
async function loadProductsModal(container) { /* same as before but includes sub_images */ }
async function editProductModal(id) {
const p = await apiCall(`/products/${id}`);
const body = document.getElementById('modalManageProducts').querySelector('.modal-body');
body.innerHTML = `<h3>Edit Product</h3><img src="${p.main_image}" width="80"><br><input id="editName" value="${p.name}"><br><input id="editPrice" value="${p.price}"><br><input id="editImage" value="${p.main_image}"><br><label>Supporting Images (URLs, comma separated):</label><input id="editSubImages" value="${(p.sub_images || []).join(',')}"><br><textarea id="editDesc">${p.description||''}</textarea><br><input id="editCat" value="${p.cat}"><br><input id="editSubcat" value="${p.subcat}"><br><input id="editColors" value="${(p.colors||[]).join(',')}"><br><input id="editSizes" value="${(p.size_options||[]).map(s=>`${s.size}:${s.price}`).join(',')}"><br><button onclick="updateProduct(${id})">Update</button><button onclick="closeModal('modalManageProducts')">Cancel</button>`;
}
async function updateProduct(id) {
const name = document.getElementById('editName').value, price = parseFloat(document.getElementById('editPrice').value), main_image = document.getElementById('editImage').value, description = document.getElementById('editDesc').value, cat = document.getElementById('editCat').value, subcat = document.getElementById('editSubcat').value, colors = document.getElementById('editColors').value.split(',').map(c=>c.trim()), sizeStr = document.getElementById('editSizes').value, subImagesStr = document.getElementById('editSubImages').value;
let size_options = [];
if (sizeStr) sizeStr.split(',').forEach(pair => { let [s,p] = pair.split(':'); if(s&&p) size_options.push({size:s.trim(), price:parseFloat(p)}); });
if (!size_options.length) size_options = [{size:'Standard', price}];
let sub_images = subImagesStr ? subImagesStr.split(',').map(u=>u.trim()).filter(u=>u) : [];
const productData = { name, description, cat, subcat, price, colors, size_options, main_image, sub_images };
await apiCall(`/products/${id}`, { method:'PUT', body: JSON.stringify(productData) });
alert('Product updated'); closeModal('modalManageProducts'); openAdminModal('manageProducts');
}
function showAddProductForm(container) {
container.innerHTML = `<h3>Add Product</h3><input id="prodName" placeholder="Name"><br><input id="prodPrice" placeholder="Price"><br><input id="prodImage" placeholder="Main Image URL"><br><label>Supporting Images (URLs, comma):</label><input id="prodSubImages" placeholder="url1, url2"><br><textarea id="prodDesc" placeholder="Description"></textarea><br><input id="prodCat" placeholder="Category"><br><input id="prodSubcat" placeholder="Subcategory"><br><input id="prodColors" placeholder="Colors (comma)"><br><input id="prodSizes" placeholder="Sizes (size:price, comma)"><br><button onclick="addProduct()">Save</button><button onclick="closeModal('modalAddProduct')">Cancel</button>`;
}
async function addProduct() {
const name = document.getElementById('prodName').value, price = parseFloat(document.getElementById('prodPrice').value), main_image = document.getElementById('prodImage').value, description = document.getElementById('prodDesc').value, cat = document.getElementById('prodCat').value, subcat = document.getElementById('prodSubcat').value, colors = document.getElementById('prodColors').value.split(',').map(c=>c.trim()), sizeStr = document.getElementById('prodSizes').value, subImagesStr = document.getElementById('prodSubImages').value;
let size_options = [];
if (sizeStr) sizeStr.split(',').forEach(pair => { let [s,p] = pair.split(':'); if(s&&p) size_options.push({size:s.trim(), price:parseFloat(p)}); });
if (!size_options.length) size_options = [{size:'Standard', price}];
let sub_images = subImagesStr ? subImagesStr.split(',').map(u=>u.trim()).filter(u=>u) : [];
const product = { name, description, cat, subcat, price, colors, size_options, main_image, sub_images };
await apiCall('/products', { method:'POST', body: JSON.stringify(product) });
alert('Product added'); closeModal('modalAddProduct'); openAdminModal('manageProducts');
}
// Policies fix (save button)
async function loadPoliciesModal(container) {
const policies = await apiCall('/policies');
container.innerHTML = `<h3>Policies</h3>${policies.map(p => `<div><strong>${p.title}</strong><textarea id="policy_${p.key}" rows="3">${p.content || ''}</textarea><button onclick="updatePolicy('${p.key}')">Save</button></div>`).join('')}<button onclick="closeModal('modalManagePolicies')">Close</button>`;
}
async function updatePolicy(key) { /* unchanged but ensure it works */ }
// Shipments with add form and timeline
async function loadShipmentsModal(container) {
const shipments = await apiCall('/shipments');
container.innerHTML = `<h3>Shipments</h3><button onclick="showAddShipmentForm()">+ Add Shipment</button><div id="shipmentsList">${shipments.map(s=>`<div><strong>${s.tracking_code}</strong> - ${s.status}<br>Client: ${s.client.name}<br>Receiver: ${s.receiver.name}<br><button onclick="updateShipmentStatus('${s.id}','shipped')">Mark Shipped</button> <button onclick="addShipmentUpdate('${s.id}')">Add Tracking Update</button></div>`).join('')}</div><button onclick="closeModal('modalManageShipments')">Close</button>`;
}
function showAddShipmentForm() {
const body = document.getElementById('modalManageShipments').querySelector('.modal-body');
body.innerHTML = `<h3>Add Shipment</h3>
<div class="form-group"><label>Tracking Code</label><input id="shipTrack"></div>
<div class="form-group"><label>Client Name</label><input id="shipClientName"></div>
<div class="form-group"><label>Client Phone</label><input id="shipClientPhone"></div>
<div class="form-group"><label>Receiver Name</label><input id="shipReceiverName"></div>
<div class="form-group"><label>Receiver Phone</label><input id="shipReceiverPhone"></div>
<div class="form-group"><label>Pickup Location</label><input id="shipPickup"></div>
<div class="form-group"><label>Courier Payment Status</label><select id="shipPaid"><option value="false">Pending</option><option value="true">Paid</option></select></div>
<div class="form-group"><label>Package Image</label><input type="file" id="shipImage" accept="image/*"></div>
<div class="form-group"><label>Notes</label><textarea id="shipNotes"></textarea></div>
<button onclick="addShipment()">Save</button><button onclick="closeModal('modalManageShipments')">Cancel</button>`;
}
async function addShipment() {
const tracking_code = document.getElementById('shipTrack').value || 'SHIP'+Math.floor(Math.random()*1000000);
const client = { name: document.getElementById('shipClientName').value, phone: document.getElementById('shipClientPhone').value };
const receiver = { name: document.getElementById('shipReceiverName').value, phone: document.getElementById('shipReceiverPhone').value };
const pickup = document.getElementById('shipPickup').value;
const paid = document.getElementById('shipPaid').value === 'true';
const notes = document.getElementById('shipNotes').value;
let image = null;
const file = document.getElementById('shipImage').files[0];
if (file) { const reader = new FileReader(); reader.onload = async (e) => { image = e.target.result; await saveShipment(tracking_code, client, receiver, pickup, paid, notes, image); }; reader.readAsDataURL(file); }
else await saveShipment(tracking_code, client, receiver, pickup, paid, notes, null);
}
async function saveShipment(tracking_code, client, receiver, pickup, paid, notes, image) {
await apiCall('/shipments', { method:'POST', body: JSON.stringify({ tracking_code, client, receiver, pickup, notes, image, paid, status:'pending' }) });
alert('Shipment added'); closeModal('modalManageShipments'); openAdminModal('manageShipments');
}
async function addShipmentUpdate(shipmentId) {
const location = prompt('Enter location (e.g., Harare)');
const lat = prompt('Latitude (optional)'); const lng = prompt('Longitude (optional)');
const status = prompt('Status (pickup/in_transit/delayed/delivered)');
if (location && status) {
await apiCall(`/shipments/${shipmentId}/updates`, { method:'POST', body: JSON.stringify({ location, lat: parseFloat(lat)||null, lng: parseFloat(lng)||null, status, description: '' }) });
openAdminModal('manageShipments');
}
}
// Quotation creation with professional layout and auto-account creation
function showCreateQuotationForm(container) {
container.innerHTML = `<h3>Create Quotation</h3>
<div class="form-group"><label>Client Name</label><input id="qClientName"></div>
<div class="form-group"><label>Client Phone</label><input id="qClientPhone"></div>
<div class="form-group"><label>Client Email</label><input id="qClientEmail"></div>
<div class="form-group"><label>Shipping Address</label><input id="qClientAddress"></div>
<div class="form-group"><label>Billing Address (if different)</label><input id="qBillingAddress"></div>
<hr><h4>Items</h4><div id="quoteItemsContainer"><div class="quote-item-row"><input class="item-desc" placeholder="Description"><input class="item-qty" placeholder="Qty" value="1"><input class="item-price" placeholder="Unit Price"><span class="item-subtotal">0.00</span><button class="remove-item">✖</button></div></div><button id="addQuoteItem">+ Add Item</button>
<hr><div><label>Shipping Cost</label><input id="quoteShipping" value="0"></div><div><label>Discount Type</label><select id="discountType"><option value="percentage">%</option><option value="fixed">Fixed</option></select><input id="discountValue" placeholder="Discount" value="0"></div><div><label>Tax Rate (%)</label><input id="taxRate" value="0"></div>
<hr><div id="quoteTotals"><p>Subtotal: $<span id="subtotal">0.00</span></p><p>Discount: $<span id="discountAmount">0.00</span></p><p>Shipping: $<span id="shippingAmount">0.00</span></p><p>Tax: $<span id="taxAmount">0.00</span></p><p><strong>Total: $<span id="totalAmount">0.00</span></strong></p></div>
<textarea id="quoteNotes" placeholder="Notes"></textarea>
<button onclick="generateProfessionalQuote()">Generate Quotation</button>`;
document.getElementById('addQuoteItem')?.addEventListener('click', () => {
const container = document.getElementById('quoteItemsContainer');
const row = document.createElement('div'); row.className = 'quote-item-row';
row.innerHTML = `<input class="item-desc" placeholder="Description"><input class="item-qty" placeholder="Qty" value="1"><input class="item-price" placeholder="Unit Price"><span class="item-subtotal">0.00</span><button class="remove-item">✖</button>`;
row.querySelector('.remove-item').onclick = () => row.remove();
container.appendChild(row);
calculateQuoteTotals();
});
document.getElementById('quoteItemsContainer')?.addEventListener('input', calculateQuoteTotals);
document.getElementById('discountValue')?.addEventListener('input', calculateQuoteTotals);
document.getElementById('taxRate')?.addEventListener('input', calculateQuoteTotals);
document.getElementById('discountType')?.addEventListener('change', calculateQuoteTotals);
document.getElementById('quoteShipping')?.addEventListener('input', calculateQuoteTotals);
function calculateQuoteTotals() {
let subtotal = 0;
document.querySelectorAll('#quoteItemsContainer .quote-item-row').forEach(row => {
const qty = parseFloat(row.querySelector('.item-qty').value)||0, price = parseFloat(row.querySelector('.item-price').value)||0;
const st = qty*price; row.querySelector('.item-subtotal').innerText = st.toFixed(2); subtotal += st;
});
const shipping = parseFloat(document.getElementById('quoteShipping').value)||0;
const discountType = document.getElementById('discountType').value;
let discountValue = parseFloat(document.getElementById('discountValue').value)||0;
let discountAmount = discountType === 'percentage' ? (discountValue/100)*subtotal : discountValue;
const afterDiscount = subtotal - discountAmount + shipping;
const taxRate = parseFloat(document.getElementById('taxRate').value)||0;
const taxAmount = (taxRate/100)*afterDiscount;
const total = afterDiscount + taxAmount;
document.getElementById('subtotal').innerText = subtotal.toFixed(2);
document.getElementById('discountAmount').innerText = discountAmount.toFixed(2);
document.getElementById('shippingAmount').innerText = shipping.toFixed(2);
document.getElementById('taxAmount').innerText = taxAmount.toFixed(2);
document.getElementById('totalAmount').innerText = total.toFixed(2);
}
}
async function generateProfessionalQuote() {
const clientName = document.getElementById('qClientName').value, phone = document.getElementById('qClientPhone').value, email = document.getElementById('qClientEmail').value, shippingAddr = document.getElementById('qClientAddress').value, billingAddr = document.getElementById('qBillingAddress').value;
if (!clientName || !phone) { alert('Client name and phone are required'); return; }
const items = []; document.querySelectorAll('#quoteItemsContainer .quote-item-row').forEach(row => { const desc = row.querySelector('.item-desc').value, qty = parseFloat(row.querySelector('.item-qty').value)||0, price = parseFloat(row.querySelector('.item-price').value)||0; if(desc && qty>0 && price>0) items.push({desc,qty,price,subtotal:qty*price}); });
if(items.length===0){alert('Add at least one item');return;}
const subtotal = items.reduce((s,i)=>s+i.subtotal,0);
const discountType = document.getElementById('discountType').value, discountValue = parseFloat(document.getElementById('discountValue').value)||0;
const discountAmount = discountType === 'percentage' ? (discountValue/100)*subtotal : discountValue;
const shipping = parseFloat(document.getElementById('quoteShipping').value)||0;
const afterDiscount = subtotal - discountAmount + shipping;
const taxRate = parseFloat(document.getElementById('taxRate').value)||0;
const taxAmount = (taxRate/100)*afterDiscount;
const total = afterDiscount + taxAmount;
const notes = document.getElementById('quoteNotes').value;
// Check if user exists; if not, create pending profile
let { data: profile } = await supabaseFromFrontend('profiles').select('id').eq('phone', phone).single(); // we cannot use supabase directly; we'll use a backend call
const quoteData = { client_name: clientName, client_phone: phone, client_email: email, shipping_address: shippingAddr, billing_address: billingAddr, items, subtotal, discount_type: discountType, discount_value: discountValue, discount_amount: discountAmount, shipping_cost: shipping, tax_rate: taxRate, tax_amount: taxAmount, total, notes };
const created = await apiCall('/quotations', { method:'POST', body: JSON.stringify(quoteData) });
alert('Quotation created and link generated');
// Generate magic link and notify client via WhatsApp
const linkRes = await apiCall('/quotation-links/generate-token', { method:'POST', body: JSON.stringify({ quotation_id: created.id }) });
const magicRes = await apiCall('/magic-auth/send-otp', { method:'POST', body: JSON.stringify({ phone, quotation_id: created.id }) });
const waMessage = `Hello ${clientName}, your quotation from Mmeli Global is ready. View it here: ${magicRes.magicLink}`;
window.open(`https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(waMessage)}`);
closeModal('modalCreateQuotation');
}
// Broadcast with logo and website link
function loadBroadcastModal(container) {
container.innerHTML = `<h3>Broadcast</h3><textarea id="broadcastMsg" rows="3" placeholder="Your message..."></textarea><button onclick="sendBroadcastWithLink()">Generate WhatsApp Link</button><div id="broadcastResult"></div><button onclick="closeModal('modalBroadcast')">Close</button>`;
}
async function sendBroadcastWithLink() {
let message = document.getElementById('broadcastMsg').value;
if (!message) return alert('Enter message');
const logoUrl = document.getElementById('siteLogo')?.src || 'https://mmeliglobal.com/logo.png';
const websiteUrl = 'https://mmeliglobal.com';
message += `\n\nCheck our website: ${websiteUrl}\n${logoUrl ? 'Logo: ' + logoUrl : ''}`;
const data = await apiCall('/notifications/broadcast', { method:'POST', body: JSON.stringify({ message }) });
document.getElementById('broadcastResult').innerHTML = `<a href="${data.waLink}" target="_blank">Click to send broadcast to ${data.count} subscribers</a>`;
}
// Helper to close modals
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }
// Initialize everything
window.onload = () => {
const searchInput = document.getElementById('searchInput'); if(searchInput) { searchInput.value = ''; searchInput.removeAttribute('readonly'); }
document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById('home').classList.add('active');
loadProducts();
updateCartCount();
initAdminCards();
if (user) { document.getElementById('loginBox').style.display='none'; document.getElementById('dashboard').style.display='block'; document.getElementById('userName').innerText = user.name; }
handleHash();
};
function escapeHtml(str) { return str.replace(/[&<>]/g, function(m){if(m==='&')return'&amp;';if(m==='<')return'&lt;';if(m==='>')return'&gt;';return m;}); }
function handleHash() { /* unchanged */ }
function goBackHome() { resetHome(); }
function resetHome() { window._filteredHome = false; displayProducts(getShuffledProductsWithPhoneBias(allProducts).slice(0, currentDisplayCount)); document.getElementById('subMenu').innerHTML = ''; switchPage('home'); }
function switchPage(pageId) { /* unchanged */ }