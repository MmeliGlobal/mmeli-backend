// ========== SUPABASE UPLOAD ==========
const SUPABASE_URL = 'https://proljdccjrifqgbmsyco.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xqZGNjanJpZnFnYm1zeWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc4ODAxOSwiZXhwIjoyMDkxMzY0MDE5fQ.VltzBUq-bLvu0Ny4jPy1kBp5E-4hffQgqFpqHrRWlZA';

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

// ========== BRAND LOGOS (Replace these URLs with your actual images) ==========
const brandLogos = {
    'Apple': 'https://i.imgur.com/K2XuSPe.png',
    'Samsung': 'https://i.imgur.com/2N9f6Yz.png',
    'Huawei': 'https://i.imgur.com/YAMWhAW.png',
    'Vivo': 'https://i.imgur.com/oz40UjB.png',
    'Oppo': 'https://i.imgur.com/VRdM5IO.png',
    'Xiaomi': 'https://i.imgur.com/qYbDrPd.jpeg',
    'Redmi': 'https://i.imgur.com/tMFLPae.jpeg',
    'Honor': 'https://i.imgur.com/6eNq7Xx.png',   // ← new working link
    'Realme': 'https://i.imgur.com/4QcVh8p.png'    // ← new working link
};

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
let searchDebounceTimer = null;

// ---------- OLD CATEGORY DATA (not used anymore) ----------
const categoryHierarchy = {};
const subcategoryIcons = {};
const defaultIcon = "https://cdn-icons-png.flaticon.com/512/456/456212.png";

// ---------- API helper ----------
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

// ---------- Load & display products (with retry and cache) ----------
async function loadProducts(retryCount = 0) {
    const container = document.getElementById('productsContainer');
    const maxRetries = 5;
    const delay = 2000;

    // Show cached products immediately (if any)
    const cached = localStorage.getItem('cachedProducts');
    if (cached) {
        try {
            allProducts = JSON.parse(cached);
            allShuffled = getShuffledWithPhoneBias(allProducts);
            displayProducts(allShuffled.slice(0, currentDisplayLimit));
            buildMainMenu();
            if (!sessionStorage.getItem('popupShown')) { showRandomPromo(); sessionStorage.setItem('popupShown', 'true'); }
        } catch(e) {}
    }

    // Attempt to fetch fresh data
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
        container.querySelectorAll('.error-msg').forEach(el => el.remove());
    } catch(e) {
        console.error('Fetch error:', e);
        if (retryCount < maxRetries) {
            const msg = document.createElement('p');
            msg.className = 'error-msg';
            msg.style.cssText = 'text-align:center; color:#856404;';
            msg.textContent = `Server is waking up... retrying (${retryCount+1}/${maxRetries})`;
            container.appendChild(msg);
            setTimeout(() => loadProducts(retryCount + 1), delay);
        } else {
            if (!cached) {
                container.innerHTML = `<p class="error-msg" style="text-align:center; padding:40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:#dc3545;"></i><br>
                    Server is not responding. Please <button onclick="loadProducts(0)" style="margin:10px; padding:8px 20px; background:#0d6efd; color:white; border:none; border-radius:20px; cursor:pointer;">Retry</button>
                </p>`;
            } else {
                container.innerHTML += `<p class="error-msg" style="text-align:center; color:#856404;">Using cached products. Server may be slow.</p>`;
            }
        }
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (products.length === 0) { container.innerHTML = '<p>No products found.</p>'; return; }
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Validate image URL – if invalid or empty, use fallback
        let imgSrc = p.main_image;
        if (!imgSrc || !imgSrc.startsWith('http')) {
            imgSrc = 'https://picsum.photos/300/200';
        }
        // Optional: log to check what's coming from backend
        // console.log(`Product: ${p.name}, Image: ${imgSrc}`);
        
        card.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://picsum.photos/300/200?grayscale';">`;
        card.innerHTML += `<div class="product-info"><div class="product-name">${escapeHtml(p.name)}</div><div class="product-price">$${p.price}</div></div>`;
        card.onclick = (e) => { e.stopPropagation(); openProduct(p.id); };
        container.appendChild(card);
    });
}

function loadMoreProducts() {
    currentDisplayLimit += 150;
    displayProducts(allShuffled.slice(0, currentDisplayLimit));
    if (currentDisplayLimit >= allShuffled.length) document.getElementById('loadMoreBtn').style.display = 'none';
}

// ---------- BRAND-BASED MENU (FIXED BRAND LIST WITH LOGOS) ----------
function buildMainMenu() {
    const mainMenu = document.getElementById('mainMenu');
    mainMenu.innerHTML = '';

    const brandList = ['Apple', 'Samsung', 'Huawei', 'Vivo', 'Oppo', 'Xiaomi', 'Redmi', 'Honor', 'Realme'];

    // "All Products" button
    const allDiv = document.createElement('div');
    allDiv.innerHTML = '📱 All Products';
    allDiv.onclick = () => {
        displayProducts(getShuffledWithPhoneBias(allProducts).slice(0, currentDisplayLimit));
        document.getElementById('subMenu').innerHTML = '';
    };
    mainMenu.appendChild(allDiv);

    // Brand buttons with logos
    brandList.forEach(brand => {
        const brandDiv = document.createElement('div');
        const imgUrl = brandLogos[brand] || 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png';
        brandDiv.innerHTML = `<img src="${imgUrl}" style="width:24px;height:24px;vertical-align:middle;margin-right:4px;" loading="lazy" onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/1055/1055685.png';"> ${brand}`;
        brandDiv.onclick = () => selectBrand(brand);
        mainMenu.appendChild(brandDiv);
    });

    // "Accessories" button
    const accDiv = document.createElement('div');
    accDiv.innerHTML = '🔌 Accessories';
    accDiv.onclick = () => {
        const accessories = allProducts.filter(p => p.cat === 'Accessories' || p.subcat === 'Accessories' || p.cat !== 'Phones');
        displayProducts(getShuffledWithPhoneBias(accessories));
        document.getElementById('subMenu').innerHTML = '';
    };
    mainMenu.appendChild(accDiv);
}

function selectBrand(brand) {
    const filtered = allProducts.filter(p => p.brand === brand);
    displayProducts(getShuffledWithPhoneBias(filtered));

    const subMenu = document.getElementById('subMenu');
    subMenu.innerHTML = '';
    const models = [...new Set(filtered.map(p => p.model).filter(m => m && m.trim() !== ''))];
    if (models.length > 0) {
        const allModelsDiv = document.createElement('div');
        allModelsDiv.innerHTML = `📱 All ${brand}`;
        allModelsDiv.onclick = () => {
            displayProducts(getShuffledWithPhoneBias(filtered));
        };
        subMenu.appendChild(allModelsDiv);

        models.forEach(model => {
            const modelDiv = document.createElement('div');
            modelDiv.innerHTML = `📱 ${model}`;
            modelDiv.onclick = () => {
                const modelFiltered = filtered.filter(p => p.model === model);
                displayProducts(getShuffledWithPhoneBias(modelFiltered));
            };
            subMenu.appendChild(modelDiv);
        });
    } else {
        const msg = document.createElement('div');
        msg.innerHTML = 'No models available';
        subMenu.appendChild(msg);
    }
}

// ---------- Product detail ----------
async function openProduct(id) {
    try {
        let product = allProducts.find(p => p.id == id);
        if (!product) { const res = await fetch(API + `/products/${id}`); if (!res.ok) throw new Error(); product = await res.json(); }
        currentProduct = product;
        renderProductDetail(product);
        switchPage('productPage');
        history.pushState(null, '', `#/product/${id}`);
    } catch(e) { alert('Could not open product'); }
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
                <img src="${p.main_image || 'https://picsum.photos/600/600'}" style="width:100%; border-radius:16px;" loading="eager" fetchpriority="high" onerror="this.onerror=null; this.src='https://picsum.photos/600/600?grayscale';">
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
    if (grid) grid.innerHTML = recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image || 'https://picsum.photos/120/120'}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://picsum.photos/120/120?grayscale';"><div>${p.name}<br><strong>$${p.price}</strong></div></div>`).join('');
}

function shareProduct() { alert('Share feature ready'); }

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

// ---------- Cart ----------
function updateCartCount() { document.getElementById('cartCount').innerText = cart.length; }

function renderCart() {
    const container = document.getElementById('cartList');
    if (!cart.length) { container.innerHTML = '<p>Cart is empty.</p>'; return; }
    let html = '', total = 0;
    cart.forEach((item, i) => {
        total += item.price;
        html += `<div class="cart-item"><div><img src="${item.image || 'https://picsum.photos/50/50'}" width="50" style="border-radius:8px;" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/50/50?grayscale';"> ${item.name} (${item.size}, ${item.color})</div><div>$${item.price} <button onclick="removeFromCart(${i})">Remove</button></div></div>`;
    });
    html += `<div class="cart-item"><strong>Total: $${total.toFixed(2)}</strong></div>`;
    container.innerHTML = html;
    loadCartRecommendations();
}

function removeFromCart(i) { cart.splice(i,1); localStorage.setItem('cart',JSON.stringify(cart)); updateCartCount(); renderCart(); }

async function loadCartRecommendations() {
    let recs = allProducts.slice(0,20);
    const grid = document.getElementById('cartRecommendations');
    if(grid) grid.innerHTML = `<h4>You may also like</h4><div class="recommend-grid">${recs.map(p => `<div class="recommend-card" onclick="openProduct(${p.id})"><img src="${p.main_image || 'https://picsum.photos/120/120'}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='https://picsum.photos/120/120?grayscale';"><div>${p.name}<br><strong>$${p.price}</strong></div></div>`).join('')}</div>`;
}

// ---------- Checkout ----------
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
        let total = cart.reduce((s,i)=>s+i.price,0);
        if (appliedDiscount) total -= appliedDiscount.amount;
        total += checkoutData.deliveryCost;
        document.getElementById('checkoutTotal').innerText = total.toFixed(2);
    }
}

async function applyDiscount() {
    const code = document.getElementById('promoCodeInput').value;
    if (!code) return;
    const total = cart.reduce((s,i)=>s+i.price,0);
    try {
        const res = await apiCall('/marketing/validate', { method:'POST', body: JSON.stringify({ code, cartTotal: total }) });
        if (res.discountAmount > 0) {
            appliedDiscount = { code, amount: res.discountAmount };
            let discountSpan = document.getElementById('discountDisplay');
            if (!discountSpan) {
                discountSpan = document.createElement('span');
                discountSpan.id = 'discountDisplay';
                document.getElementById('cartList').after(discountSpan);
            }
            discountSpan.innerHTML = `<br>Discount applied: -$${res.discountAmount.toFixed(2)}`;
            let total2 = cart.reduce((s,i)=>s+i.price,0) - res.discountAmount + checkoutData.deliveryCost;
            document.getElementById('checkoutTotal').innerText = total2.toFixed(2);
        } else {
            alert('Invalid or expired promo code.');
        }
    } catch(e) { alert(e.message); }
}

async function completeCheckout() {
    const trackingCode = 'MM' + Math.floor(Math.random()*1000000);
    let total = cart.reduce((s,i)=>s+i.price,0);
    if (appliedDiscount) total -= appliedDiscount.amount;
    total += checkoutData.deliveryCost;
    const order = {
        tracking_code: trackingCode,
        user_id: user.id,
        user_data: user,
        items: cart,
        total,
        status: 'Processing',
        paid: false,
        packed: false,
        shipped: false,
        delivered: false
    };
    try {
        await apiCall('/orders', { method:'POST', body: JSON.stringify(order) });
        const msg = `New order\nTracking: ${trackingCode}\nTotal: $${total}\nItems:\n` +
            cart.map(i => `${i.name} - $${i.price}`).join('\n');
        window.open(`https://wa.me/263776871711?text=${encodeURIComponent(msg)}`);
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
        appliedDiscount = null;
        alert(`Order placed! Tracking code: ${trackingCode}`);
        switchPage('home');
    } catch(e) { alert('Order failed: '+e.message); }
}

// ---------- Tracking ----------
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
        } else {
            L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global').openPopup();
        }
    } catch(e) { alert('Order not found'); }
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
    } catch(e) {
        document.getElementById('shipmentStatus').innerHTML = '<p style="color:red;">Shipment not found.</p>';
    }
}

function initDefaultMap() {
    if (map) map.remove();
    map = L.map('map').setView([-17.825,31.033], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([-17.825,31.033]).addTo(map).bindPopup('Mmeli Global').openPopup();
}

// ---------- Auth ----------
async function register() {
    const name = document.getElementById('regName').value, phone = document.getElementById('regPhone').value, email = document.getElementById('regEmail').value, address = document.getElementById('regAddress').value, password = document.getElementById('regPassword').value;
    if (!name || !phone || !password) return alert('Name, phone, and password required');
    try {
        const data = await apiCall('/auth/register', { method:'POST', body: JSON.stringify({ name, phone, email, address, password }) });
        token = data.token; user = data.user;
        localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userName').innerText = user.name;
        alert('Registration successful! You are now logged in.');
    } catch(e) { alert('Registration failed: ' + e.message); }
}

async function login() {
    const phone = document.getElementById('loginEmail').value, password = document.getElementById('loginPassword').value;
    if (!phone || !password) return alert('Enter phone number and password');
    try {
        const data = await apiCall('/auth/login', { method:'POST', body: JSON.stringify({ phone, password }) });
        token = data.token; user = data.user;
        localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userName').innerText = user.name;
    } catch(e) { alert('Login failed: ' + e.message); }
}

function logout() { token=null; user=null; localStorage.clear(); location.reload(); }

async function showMyOrders() {
    const orders = await apiCall('/orders/my-orders');
    document.getElementById('customerData').innerHTML = `<h4>My Orders</h4>${orders.map(o=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;"><strong>${o.tracking_code}</strong> - ${o.status} - $${o.total} <button onclick="trackOrderCode('${o.tracking_code}')">Track</button></div>`).join('')}`;
}

async function showMyQuotations() {
    try {
        const quotes = await apiCall('/quotations/my-quotations');
        document.getElementById('customerData').innerHTML = `<h4>My Quotations</h4>${quotes.map(q=>`<div style="border:1px solid #ddd; padding:8px; margin:8px 0; border-radius:12px;">${q.quote_number} - $${q.total} <button onclick="viewQuote(${q.id})">View</button></div>`).join('')}`;
    } catch(e) { document.getElementById('customerData').innerHTML = '<p>No quotations yet.</p>'; }
}

async function viewQuote(id) {
    const q = await apiCall(`/quotations/${id}`);
    document.getElementById('quotePreview').innerHTML = `<pre>${JSON.stringify(q,null,2)}</pre>`;
    document.getElementById('quoteModal').style.display='flex';
}

function closeQuoteModal() { document.getElementById('quoteModal').style.display='none'; }

async function showMyReturns() {
    try {
        const returns = await apiCall('/returns/my-returns');
        document.getElementById('customerData').innerHTML = `<h4>My Returns</h4>${returns.map(r=>`<div>Return for order #${r.order_id}: ${r.status} - ${r.reason}</div>`).join('')}`;
    } catch(e) { document.getElementById('customerData').innerHTML = '<p>No returns yet.</p>'; }
}

function showProfile() {
    document.getElementById('customerData').innerHTML = `<h4>Edit Profile</h4><input id="editName" value="${user.name}"><br><input id="editPhone" value="${user.phone || ''}"><br><input id="editAddress" value="${user.address || ''}"><br><button onclick="updateProfile()">Save Changes</button>`;
}

async function updateProfile() {
    const name = document.getElementById('editName').value, phone = document.getElementById('editPhone').value, address = document.getElementById('editAddress').value;
    const updated = await apiCall('/users/profile', { method:'PUT', body: JSON.stringify({ name, phone, address }) });
    user = updated; localStorage.setItem('user',JSON.stringify(user));
    document.getElementById('userName').innerText = user.name;
    alert('Profile updated'); showProfile();
}

function openShipmentTracking() {
    document.getElementById('shipmentTrackingModal').style.display = 'flex';
}
function closeShipmentModal() { document.getElementById('shipmentTrackingModal').style.display = 'none'; }

// ---------- Admin ----------
async function adminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    if (!email || !password) { alert('Please enter email and password'); return; }
    try {
        const data = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (!data.user || data.user.role !== 'admin') { throw new Error('Not an admin account. Use admin@mmeliglobal.com'); }
        token = data.token; user = data.user;
        localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('adminLoginDiv').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        initAdminCards();
        alert('Admin login successful');
    } catch (err) { alert('Admin login failed: ' + err.message); }
}

function initAdminCards() {
    document.querySelectorAll('.admin-card').forEach(card => {
        card.removeEventListener('click', card._listener);
        const handler = () => { const modalId = card.getAttribute('data-modal'); if (modalId) openAdminModal(modalId); };
        card.addEventListener('click', handler);
        card._listener = handler;
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

async function loadDashboardStats(container) {
    const stats = await apiCall('/dashboard/stats');
    container.innerHTML = `<h3>Dashboard</h3><div class="stats-grid"><div class="stats-card">📦 Orders<br>${stats.totalOrders}</div><div class="stats-card">💰 Revenue<br>$${stats.totalRevenue}</div><div class="stats-card">🛍️ Products<br>${stats.totalProducts}</div><div class="stats-card">👥 Customers<br>${stats.totalUsers}</div><div class="stats-card">📅 Today<br>${stats.todayOrders} orders</div><div class="stats-card">📈 Week Revenue<br>$${stats.weekRevenue}</div></div><button onclick="closeModal('modalDashboardStats')">Close</button>`;
}

async function loadProductsModal(container) {
    let products = await apiCall('/products');
    container.innerHTML = `<h3>Manage Products</h3><input type="text" id="productSearch" placeholder="Search..." onkeyup="filterProductList()" style="width:100%; margin-bottom:10px;"><div id="productListContainer">${products.map(p=>`<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding:8px;"><img src="${p.main_image || 'https://picsum.photos/50/50'}" width="50" style="border-radius:8px;" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/50/50?grayscale';"> ${p.name} - $${p.price} <div><button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div></div>`).join('')}</div><button onclick="closeModal('modalManageProducts')">Close</button>`;
    window.filterProductList = () => {
        const term = document.getElementById('productSearch').value.toLowerCase();
        const filtered = products.filter(p => p.name.toLowerCase().includes(term));
        document.getElementById('productListContainer').innerHTML = filtered.map(p=>`<div><img src="${p.main_image || 'https://picsum.photos/50/50'}" width="50" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/50/50?grayscale';"> ${p.name} - $${p.price} <button onclick="editProductModal(${p.id})">Edit</button> <button onclick="deleteProduct(${p.id})">Delete</button></div>`).join('');
    };
}

async function editProductModal(id) {
    const p = await apiCall(`/products/${id}`);
    const body = document.getElementById('modalManageProducts').querySelector('.modal-body');
    body.innerHTML = `<h3>Edit Product</h3><img src="${p.main_image || 'https://picsum.photos/80/80'}" width="80" id="editPreview" onerror="this.onerror=null; this.src='https://picsum.photos/80/80?grayscale';"><br><label>Upload New Image (optional)</label><input type="file" id="editImageFile" accept="image/*"><br><input id="editName" value="${p.name}"><br><input id="editPrice" value="${p.price}"><br><textarea id="editDesc">${p.description||''}</textarea><br><input id="editCat" value="${p.cat}"><br><input id="editSubcat" value="${p.subcat}"><br><input id="editColors" value="${(p.colors||[]).join(',')}"><br><input id="editSizes" value="${(p.size_options||[]).map(s=>`${s.size}:${s.price}`).join(',')}"><br><button onclick="updateProductWithImage(${id})">Update</button><button onclick="closeModal('modalManageProducts')">Cancel</button>`;
}

async function updateProductWithImage(id) {
    const name = document.getElementById('editName').value;
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDesc').value;
    const cat = document.getElementById('editCat').value;
    const subcat = document.getElementById('editSubcat').value;
    const colors = document.getElementById('editColors').value.split(',').map(c=>c.trim()).filter(c=>c);
    const sizeStr = document.getElementById('editSizes').value;
    const imageFile = document.getElementById('editImageFile').files[0];
    let main_image;
    if (imageFile) {
        try { main_image = await uploadImageToSupabase(imageFile); } catch(e) { alert('Image upload failed: ' + e.message); return; }
    } else {
        const existing = allProducts.find(p => p.id == id);
        if (!existing) { alert('Product not found in local cache. Please refresh.'); return; }
        main_image = existing.main_image;
        if (!main_image) { alert('No image available. Please upload one.'); return; }
    }
    if (!name || isNaN(price) || !cat || !subcat) { alert('Please fill required fields'); return; }
    let size_options = [];
    if (sizeStr) {
        sizeStr.split(',').forEach(pair => {
            let [s, p] = pair.split(':');
            if (s && p) size_options.push({ size: s.trim(), price: parseFloat(p) });
        });
    }
    if (size_options.length === 0) size_options = [{ size: 'Standard', price: price }];
    const productData = { name, description, cat, subcat, price, colors, size_options, main_image };
    try {
        await apiCall(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) });
        alert('Product updated successfully');
        closeModal('modalManageProducts');
        openAdminModal('manageProducts');
        loadProducts();
    } catch (err) { alert('Update failed: ' + err.message); }
}

async function deleteProduct(id) {
    if(confirm('Delete product?')) await apiCall(`/products/${id}`, { method:'DELETE' });
    openAdminModal('manageProducts');
    loadProducts();
}

function showAddProductForm(container) {
    container.innerHTML = `<h3>Add Product</h3><input id="prodName" placeholder="Name"><br><input id="prodPrice" placeholder="Price"><br><input type="file" id="prodImageFile" accept="image/*" required><br><textarea id="prodDesc" placeholder="Description"></textarea><br><input id="prodCat" placeholder="Category"><br><input id="prodSubcat" placeholder="Subcategory"><br><input id="prodColors" placeholder="Colors (comma)"><br><input id="prodSizes" placeholder="Sizes (size:price, comma)"><br><button onclick="addProduct()">Save</button><button onclick="closeModal('modalAddProduct')">Cancel</button>`;
}

async function addProduct() {
    const name = document.getElementById('prodName').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const description = document.getElementById('prodDesc').value;
    const cat = document.getElementById('prodCat').value;
    const subcat = document.getElementById('prodSubcat').value;
    const colors = document.getElementById('prodColors').value.split(',').map(c=>c.trim()).filter(c=>c);
    const sizeStr = document.getElementById('prodSizes').value;
    const imageFile = document.getElementById('prodImageFile').files[0];
    if (!name || isNaN(price) || !cat || !subcat || !imageFile) {
        alert('Please fill all required fields and select an image');
        return;
    }
    let main_image;
    try { main_image = await uploadImageToSupabase(imageFile); } catch(e) { alert('Image upload failed: ' + e.message); return; }
    let size_options = [];
    if (sizeStr) {
        sizeStr.split(',').forEach(pair => {
            let [s, p] = pair.split(':');
            if (s && p) size_options.push({ size: s.trim(), price: parseFloat(p) });
        });
    }
    if (size_options.length === 0) size_options = [{ size: 'Standard', price: price }];
    const productData = { name, description, cat, subcat, price, colors, size_options, main_image };
    try {
        await apiCall('/products', { method: 'POST', body: JSON.stringify(productData) });
        alert('Product added successfully');
        closeModal('modalAddProduct');
        openAdminModal('manageProducts');
        loadProducts();
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
    alert('Discount added');
    openAdminModal('discounts');
}

async function deleteDiscount(id) {
    if(confirm('Delete discount?')) await apiCall(`/marketing/discounts/${id}`, { method:'DELETE' });
    openAdminModal('discounts');
}

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
    window.updatePolicy = async (key) => {
        const content = document.getElementById(`policy_${key}`).value;
        await apiCall(`/policies/${key}`, { method:'PUT', body: JSON.stringify({ content }) });
        alert('Policy updated');
        openAdminModal('managePolicies');
    };
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
    const save = async (img) => {
        await apiCall('/shipments', { method:'POST', body: JSON.stringify({ tracking_code, client, receiver, pickup, notes, image: img, paid, status:'pending' }) });
        alert('Shipment added');
        closeModal('modalManageShipments');
        openAdminModal('manageShipments');
    };
    if (file) {
        const reader = new FileReader();
        reader.onload = e => save(e.target.result);
        reader.readAsDataURL(file);
    } else save(null);
}

async function updateShipmentStatus(id) {
    await apiCall(`/shipments/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'shipped' }) });
    openAdminModal('manageShipments');
}

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
    window.addQuoteItemRow = () => {
        const div = document.createElement('div');
        div.className = 'quote-item';
        div.innerHTML = '<input placeholder="Description"> <input placeholder="Qty" size="5"> <input placeholder="Price" size="8">';
        document.getElementById('quoteItems').appendChild(div);
    };
    window.generateQuoteAndSave = async () => {
        const client = { name: document.getElementById('qcName').value, phone: document.getElementById('qcPhone').value, email: document.getElementById('qcEmail').value, address: document.getElementById('qcAddress').value };
        if (!client.phone) { alert('Client phone number is required'); return; }
        const items = [];
        document.querySelectorAll('#quoteItems .quote-item').forEach(row => {
            const desc = row.children[0].value, qty = parseFloat(row.children[1].value) || 0, price = parseFloat(row.children[2].value) || 0;
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
            const result = await apiCall('/quotations', { method: 'POST', body: JSON.stringify({ client, items, subtotal, discount, shipping, tax_rate: taxRate, total }) });
            alert(`Quotation saved! ${result.new_user_created ? 'Client has been registered and login credentials sent via WhatsApp.' : 'Client notified.'}`);
            closeModal('modalCreateQuotation');
        } catch (err) { alert('Failed to create quotation: ' + err.message); }
    };
}

// ========== BULK UPLOAD MODAL HANDLER ==========
function showBulkUploadModal(container) {
    const modal = document.getElementById('modalBulkUpload');
    if (modal) {
        modal.style.display = 'flex';
        const fileInput = document.getElementById('bulkFileInput');
        if (fileInput) fileInput.value = '';
        document.getElementById('bulkMappingArea').style.display = 'none';
        document.getElementById('bulkProgressArea').style.display = 'none';
        document.getElementById('bulkStartBtn').style.display = 'none';
        if (!window._bulkListenerAttached) {
            document.getElementById('bulkFileInput').addEventListener('change', handleBulkFile);
            document.getElementById('bulkStartBtn').addEventListener('click', startBulkUpload);
            window._bulkListenerAttached = true;
        }
    }
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
        <div class="mapping-row"><span style="width:120px;">Product Name *</span><select id="bulkMapName"><option value="">-- Select --</option>${cols.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
        <div class="mapping-row"><span style="width:120px;">Price *</span><select id="bulkMapPrice"><option value="">-- Select --</option>${cols.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
        <div class="mapping-row"><span style="width:120px;">Description</span><select id="bulkMapDesc"><option value="">-- Ignore --</option>${cols.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
        <div class="mapping-row"><span style="width:120px;">Image URL</span><select id="bulkMapImage"><option value="">-- Ignore --</option>${cols.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
        <div class="mapping-row"><span style="width:120px;">Category</span><select id="bulkMapCat"><option value="">-- Ignore (General) --</option>${cols.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
        <div class="mapping-row"><span style="width:120px;">Subcategory</span><select id="bulkMapSubcat"><option value="">-- Ignore (General) --</option>${cols.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
    `;
    const lowerCols = cols.map(c=>c.toLowerCase());
    const nameIdx = lowerCols.findIndex(c=>c.includes('name')||c==='model');
    if(nameIdx!==-1) document.getElementById('bulkMapName').value = cols[nameIdx];
    const priceIdx = lowerCols.findIndex(c=>c.includes('price')||c.includes('usd'));
    if(priceIdx!==-1) document.getElementById('bulkMapPrice').value = cols[priceIdx];
    const descIdx = lowerCols.findIndex(c=>c.includes('description')||c.includes('desc'));
    if(descIdx!==-1) document.getElementById('bulkMapDesc').value = cols[descIdx];
    const imgIdx = lowerCols.findIndex(c=>c.includes('image')||c.includes('img')||c.includes('url'));
    if(imgIdx!==-1) document.getElementById('bulkMapImage').value = cols[imgIdx];
    const catIdx = lowerCols.findIndex(c=>c.includes('category'));
    if(catIdx!==-1) document.getElementById('bulkMapCat').value = cols[catIdx];
    const subcatIdx = lowerCols.findIndex(c=>c.includes('subcategory')||c.includes('subcat'));
    if(subcatIdx!==-1) document.getElementById('bulkMapSubcat').value = cols[subcatIdx];
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
    for (let row of bulkRows) {
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
        } catch(e) {
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

// ========== SEARCH, NAVIGATION, ETC. ==========
document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(searchDebounceTimer);
    const term = this.value.toLowerCase();
    const list = document.getElementById('autocompleteList');
    if (!term) { list.innerHTML = ''; list.style.display = 'none'; return; }
    searchDebounceTimer = setTimeout(() => {
        const matches = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)) || (p.cat && p.cat.toLowerCase().includes(term)) || (p.subcat && p.subcat.toLowerCase().includes(term))).slice(0,8);
        if (matches.length) {
            list.innerHTML = matches.map(p => `<div onclick="openProduct(${p.id})">${p.name} (${p.cat})</div>`).join('');
            list.style.display = 'block';
        } else {
            list.style.display = 'none';
        }
    }, 200);
});

function searchProducts() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    if (!term) { displayProducts(allShuffled.slice(0, currentDisplayLimit)); return; }
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)) || (p.cat && p.cat.toLowerCase().includes(term)) || (p.subcat && p.subcat.toLowerCase().includes(term)));
    displayProducts(getShuffledWithPhoneBias(filtered).slice(0, currentDisplayLimit));
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    if (pageId === 'cart') renderCart();
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

function trackOrderCode(code) {
    document.getElementById('trackCode').value = code;
    switchPage('tracking');
    setTimeout(trackOrder, 100);
}

async function showRandomPromo() {
    try {
        const promo = await apiCall('/promotions/random');
        if (promo) {
            const popup = document.getElementById('popupPromo');
            document.getElementById('popupContent').innerHTML = `<img src="${promo.image_url || 'https://picsum.photos/300/150'}" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/300/150?grayscale';"><div><strong>${promo.title}</strong><br>${promo.description}<br><a href="${promo.link}" target="_blank">Shop now</a></div>`;
            popup.style.display = 'block';
            setTimeout(() => popup.style.display = 'none', 8000);
        }
    } catch(e) {}
}

function closePopup() { document.getElementById('popupPromo').style.display = 'none'; }

async function subscribe() {
    const email = document.getElementById('subEmail').value, phone = document.getElementById('subPhone').value;
    if (!email && !phone) return alert('Enter email or phone');
    try {
        await apiCall('/notifications/subscribe', { method:'POST', body: JSON.stringify({ email, phone, name: user?.name || '' }) });
        alert('Subscribed successfully!');
    } catch(e) { alert('Subscription failed'); }
}

function handleHash() {
    const hash = window.location.hash;
    if (!hash || hash === '#/home' || hash === '#/') {
        resetHome();
    } else if (hash.startsWith('#/product/')) {
        const id = hash.split('/').pop();
        if (id && !isNaN(id)) openProduct(id);
    } else {
        resetHome();
    }
}

window.addEventListener('hashchange', handleHash);

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m){if(m==='&')return'&amp;';if(m==='<')return'&lt;';if(m==='>')return'&gt;';return m;});
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if(modal) modal.style.display = 'none';
    });
});
window.addEventListener('click', (e) => {
    if(e.target.classList.contains('modal')) e.target.style.display = 'none';
});

document.querySelector('.close-popup')?.addEventListener('click', closePopup);

const logoElem = document.getElementById('logoArea');
if (logoElem) {
    logoElem.addEventListener('dblclick', function(e) {
        e.preventDefault();
        switchPage('adminDashboard');
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ========== INIT ==========
window.addEventListener('load', function() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    updateCartCount();
    initAdminCards();
    if (user) {
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('userName').innerText = user.name;
        if (user.role === 'admin') {
            document.getElementById('adminLoginDiv').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
        }
    }
    loadProducts();
    handleHash();
});
