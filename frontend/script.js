// ==================== DATA ====================
let shipments = JSON.parse(localStorage.getItem('shipments')) || {
    'SEA123456': { id: 'SEA123456', customer: 'John Doe', email: 'john@example.com', phone: '+263 777 123 456', status: 'In Transit', statusClass: 'status-transit', origin: 'Guiyang, China', destination: 'Beitbridge, Zimbabwe', currentLocation: 'Beira, Mozambique', estimatedDelivery: 'Apr 15, 2024', weight: 150, volume: 2.5, service: 'Sea Freight', paymentStatus: 'Paid', amountPaid: 850, packagingPhotos: [], timeline: [{ date: '2024-03-25', event: 'Picked up from sender', location: 'Guiyang' }] },
    'AIR789012': { id: 'AIR789012', customer: 'Jane Smith', email: 'jane@example.com', phone: '+263 778 456 789', status: 'In Transit', statusClass: 'status-transit', origin: 'Guangzhou, China', destination: 'Harare, Zimbabwe', currentLocation: 'Addis Ababa, Ethiopia', estimatedDelivery: 'Apr 5, 2024', weight: 25, volume: 0.5, service: 'Air Freight', paymentStatus: 'Paid', amountPaid: 450, packagingPhotos: [], timeline: [] },
    'DEL456789': { id: 'DEL456789', customer: 'Peter Johnson', email: 'peter@example.com', phone: '+263 779 789 012', status: 'Delivered', statusClass: 'status-delivered', origin: 'Shanghai, China', destination: 'Bulawayo, Zimbabwe', currentLocation: 'Bulawayo, Zimbabwe', estimatedDelivery: 'Mar 28, 2024', weight: 200, volume: 3.0, service: 'Sea Freight', paymentStatus: 'Paid', amountPaid: 1200, packagingPhotos: [], timeline: [] }
};
let services = JSON.parse(localStorage.getItem('services')) || [
    { icon: '🔍', title: 'Sourcing', description: 'Find reliable suppliers in China. Factory verification, supplier checks, sampling and negotiation.' },
    { icon: '🛒', title: 'Procurement', description: 'We purchase products on your behalf. Bulk purchasing, payment handling, contracts and quality control.' },
    { icon: '🚢', title: 'Shipping', description: 'Sea and air freight to Zimbabwe. Cargo consolidation, customs documentation, insurance available.' },
    { icon: '📦', title: 'Logistics', description: 'Warehousing and cargo handling. Storage, consolidation, inspection and inventory management.' },
    { icon: '🚚', title: 'Delivery', description: 'Door-to-door across Zimbabwe. Beitbridge clearing, distribution to Harare, Bulawayo and beyond.' }
];
let videos = JSON.parse(localStorage.getItem('videos')) || [
    { id: 'v1', category: 'sourcing', title: 'Factory Visit in Guangzhou', url: 'https://www.youtube.com/embed/xyz123', thumbnail: 'https://via.placeholder.com/300x200?text=Factory+Visit' },
    { id: 'v2', category: 'shipping', title: 'Cargo Loading Process', url: 'https://www.youtube.com/embed/abc456', thumbnail: 'https://via.placeholder.com/300x200?text=Cargo+Loading' }
];
let gallery = JSON.parse(localStorage.getItem('gallery')) || [
    { id: 'g1', category: 'packaging', image: 'https://via.placeholder.com/300x200?text=Packaging+1', caption: 'Secure packaging' },
    { id: 'g2', category: 'facility', image: 'https://via.placeholder.com/300x200?text=Warehouse', caption: 'Our warehouse' }
];
let customers = JSON.parse(localStorage.getItem('customers')) || [
    { email: 'john@example.com', name: 'John Doe', phone: '+263 777 123 456', password: 'pass123', shipments: ['SEA123456'] },
    { email: 'jane@example.com', name: 'Jane Smith', phone: '+263 778 456 789', password: 'pass123', shipments: ['AIR789012'] },
    { email: 'peter@example.com', name: 'Peter Johnson', phone: '+263 779 789 012', password: 'pass123', shipments: ['DEL456789'] }
];
let quotations = JSON.parse(localStorage.getItem('quotations')) || [
    { id: 'Q001', email: 'john@example.com', service: 'Sea Freight', amount: 850, status: 'accepted' },
    { id: 'Q002', email: 'jane@example.com', service: 'Air Freight', amount: 450, status: 'pending' }
];
let invoices = JSON.parse(localStorage.getItem('invoices')) || [
    { id: 'INV001', email: 'john@example.com', amount: 850, status: 'paid' }
];
let packingLists = JSON.parse(localStorage.getItem('packingLists')) || {
    'SEA123456': { items: ['Electronics - 10 boxes', 'Clothing - 5 cartons'], totalWeight: 150, totalVolume: 2.5 },
    'AIR789012': { items: ['Documents - 1 box'], totalWeight: 25, totalVolume: 0.5 }
};

let currentCustomer = null;
let adminLoggedIn = false;
let pendingPortalPage = null;

// ==================== HELPERS ====================
function saveAllData() {
    localStorage.setItem('shipments', JSON.stringify(shipments));
    localStorage.setItem('services', JSON.stringify(services));
    localStorage.setItem('videos', JSON.stringify(videos));
    localStorage.setItem('gallery', JSON.stringify(gallery));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('quotations', JSON.stringify(quotations));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('packingLists', JSON.stringify(packingLists));
}
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]); }

// ==================== PAGE NAVIGATION ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const page = document.getElementById(pageId + '-page');
    if (page) page.classList.add('active-page');
    // Update chips active
    document.querySelectorAll('.category-chip').forEach(chip => {
        if (chip.getAttribute('data-page') === pageId) chip.classList.add('active');
        else chip.classList.remove('active');
    });
    if (pageId === 'customer-portal') renderCustomerPortal();
    if (pageId === 'services') renderServicesPage();
    if (pageId === 'videos') renderVideosPage();
    if (pageId === 'pictures') renderGalleryPage();
    if (pageId === 'referral') updateReferralStats();
    if (pageId === 'admin') {
        renderAdminDashboard();
        renderAdminServices();
        renderAdminVideos();
        renderAdminGallery();
        renderAdminShipments();
        renderAdminCustomers();
        renderAdminQuotations();
    }
}

// ==================== RENDER PAGES ====================
function renderServicesPage() {
    const container = document.getElementById('services-grid');
    if (!container) return;
    container.innerHTML = '';
    services.forEach(s => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `<div class="service-icon">${s.icon}</div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description)}</p>`;
        container.appendChild(card);
    });
}
function renderVideosPage() {
    const sourcingGrid = document.getElementById('sourcing-videos-grid');
    const shippingGrid = document.getElementById('shipping-videos-grid');
    if (!sourcingGrid || !shippingGrid) return;
    sourcingGrid.innerHTML = ''; shippingGrid.innerHTML = '';
    videos.forEach(v => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `<img src="${v.thumbnail}" class="video-thumb" alt="${v.title}"><h4>${escapeHtml(v.title)}</h4>`;
        card.onclick = () => window.open(v.url, '_blank');
        if (v.category === 'sourcing') sourcingGrid.appendChild(card);
        else shippingGrid.appendChild(card);
    });
}
function renderGalleryPage() {
    const packagingGallery = document.getElementById('packaging-gallery');
    const facilityGallery = document.getElementById('facility-gallery');
    if (!packagingGallery || !facilityGallery) return;
    packagingGallery.innerHTML = ''; facilityGallery.innerHTML = '';
    gallery.forEach(g => {
        const img = document.createElement('img');
        img.src = g.image;
        img.alt = g.caption;
        img.className = 'gallery-img';
        if (g.category === 'packaging') packagingGallery.appendChild(img);
        else facilityGallery.appendChild(img);
    });
}

// ==================== TRACKING ====================
function trackPackage() {
    const id = document.getElementById('trackingInput').value.trim();
    const shipment = shipments[id];
    const resultDiv = document.getElementById('trackingResult');
    if (!shipment) { resultDiv.innerHTML = '<div style="color:red;">Not found</div>'; return; }
    resultDiv.innerHTML = `<div><strong>${shipment.id}</strong> - ${shipment.status}<br>Current: ${shipment.currentLocation}<br>Est: ${shipment.estimatedDelivery}</div>`;
}
function mobileTrackPackage() {
    const id = document.getElementById('mobileTrackingInput').value.trim();
    const shipment = shipments[id];
    const resultDiv = document.getElementById('mobileTrackingResult');
    if (!shipment) { resultDiv.innerHTML = '<div style="color:red;">Not found</div>'; return; }
    resultDiv.innerHTML = `<div><strong>${shipment.id}</strong> - ${shipment.status}<br>Current: ${shipment.currentLocation}<br>Est: ${shipment.estimatedDelivery}</div>`;
}

// ==================== CUSTOMER PORTAL ====================
function quickLogin(email) {
    const customer = customers.find(c => c.email === email);
    if (customer) { currentCustomer = customer; renderCustomerPortal(); }
    else alert('Customer not found');
    if (currentCustomer && pendingPortalPage) {
        setTimeout(() => {
            const page = pendingPortalPage;
            pendingPortalPage = null;
            const navItem = Array.from(document.querySelectorAll('.portal-nav-item')).find(
                item => item.innerText.toLowerCase().includes(page.replace('-', ' '))
            );
            if (navItem) navItem.click();
            else showPortalPage(page);
        }, 100);
    }
}
function manualLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const customer = customers.find(c => c.email === email && c.password === password);
    if (customer) { currentCustomer = customer; renderCustomerPortal(); }
    else alert('Invalid credentials');
    if (currentCustomer && pendingPortalPage) {
        setTimeout(() => {
            const page = pendingPortalPage;
            pendingPortalPage = null;
            const navItem = Array.from(document.querySelectorAll('.portal-nav-item')).find(
                item => item.innerText.toLowerCase().includes(page.replace('-', ' '))
            );
            if (navItem) navItem.click();
            else showPortalPage(page);
        }, 100);
    }
}
function customerLogout() { currentCustomer = null; renderCustomerPortal(); }
function renderCustomerPortal() {
    const loginSection = document.getElementById('customer-login-section');
    const welcomeSection = document.getElementById('customer-welcome-section');
    const userDisplay = document.getElementById('portal-user-display');
    if (currentCustomer) {
        loginSection.style.display = 'none';
        welcomeSection.style.display = 'flex';
        document.getElementById('welcome-message').innerText = `Welcome, ${currentCustomer.name}`;
        userDisplay.innerText = `👤 ${currentCustomer.name}`;
        const dashboardStats = document.getElementById('dashboard-stats');
        if (dashboardStats) dashboardStats.innerHTML = `<div class="stat-card">Shipments: ${currentCustomer.shipments.length}</div><div class="stat-card">Quotes: ${quotations.filter(q=>q.email===currentCustomer.email).length}</div>`;
        const shipmentsList = document.getElementById('dashboard-shipments-list');
        if (shipmentsList) {
            shipmentsList.innerHTML = '';
            currentCustomer.shipments.forEach(sid => {
                const s = shipments[sid];
                if (s) shipmentsList.innerHTML += `<tr><td>${s.id}</td><td>${s.status}</td><td>${s.estimatedDelivery}</td></tr>`;
            });
        }
        const packingSelect = document.getElementById('packing-shipment-select');
        if (packingSelect) {
            packingSelect.innerHTML = '';
            currentCustomer.shipments.forEach(sid => packingSelect.innerHTML += `<option value="${sid}">${sid}</option>`);
        }
        document.getElementById('settings-firstname').value = currentCustomer.name.split(' ')[0] || '';
        document.getElementById('settings-lastname').value = currentCustomer.name.split(' ')[1] || '';
        document.getElementById('settings-email').value = currentCustomer.email;
        document.getElementById('settings-phone').value = currentCustomer.phone || '';
    } else {
        loginSection.style.display = 'block';
        welcomeSection.style.display = 'none';
        userDisplay.innerText = '👤 Welcome, Guest';
    }
}
function showPortalPage(page) {
    document.querySelectorAll('.portal-page').forEach(p => p.classList.remove('active-portal-page'));
    const portalPage = document.getElementById(`portal-${page}`);
    if (portalPage) portalPage.classList.add('active-portal-page');
    document.querySelectorAll('.portal-nav-item').forEach(item => item.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    if (page === 'shipments') {
        const tbody = document.getElementById('shipments-list-portal');
        if (tbody && currentCustomer) {
            tbody.innerHTML = '';
            currentCustomer.shipments.forEach(sid => {
                const s = shipments[sid];
                if (s) tbody.innerHTML += `<tr><td>${s.id}</td><td>${s.service}</td><td>${s.status}</td><td>${s.estimatedDelivery}</td></tr>`;
            });
        }
    }
    if (page === 'quotations') {
        const tbody = document.getElementById('quotations-list');
        if (tbody && currentCustomer) {
            tbody.innerHTML = '';
            quotations.filter(q => q.email === currentCustomer.email).forEach(q => tbody.innerHTML += `<tr><td>${q.id}</td><td>${q.service}</td><td>$${q.amount}</td><td>${q.status}</td></tr>`);
        }
    }
    if (page === 'invoices') {
        const tbody = document.getElementById('invoices-list');
        if (tbody && currentCustomer) {
            tbody.innerHTML = '';
            invoices.filter(i => i.email === currentCustomer.email).forEach(i => tbody.innerHTML += `<tr><td>${i.id}</td><td>$${i.amount}</td><td>${i.status}</td></tr>`);
        }
    }
}
function viewPackingList() {
    const tracking = document.getElementById('packing-shipment-select').value;
    const list = packingLists[tracking];
    const display = document.getElementById('packing-list-display');
    if (!list) { display.innerHTML = '<p>No packing list found.</p>'; return; }
    display.innerHTML = `<h4>Packing List for ${tracking}</h4><ul>${list.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul><p>Total Weight: ${list.totalWeight} kg | Volume: ${list.totalVolume} m³</p>`;
}
function portalTrackPackage() {
    const id = document.getElementById('portal-tracking-input').value.trim();
    const shipment = shipments[id];
    const resultDiv = document.getElementById('portal-tracking-result');
    if (!shipment) { resultDiv.innerHTML = '<div style="color:red;">Not found</div>'; return; }
    resultDiv.innerHTML = `<div><strong>${shipment.id}</strong> - ${shipment.status}<br>Current: ${shipment.currentLocation}<br>Est: ${shipment.estimatedDelivery}</div>`;
}
function submitOrder() { alert('Order submitted. A quotation will be sent shortly.'); }
function requestPickup() { alert('Pickup request submitted. We will contact you.'); }
function saveSettings() {
    if (!currentCustomer) return;
    const firstName = document.getElementById('settings-firstname').value;
    const lastName = document.getElementById('settings-lastname').value;
    currentCustomer.name = `${firstName} ${lastName}`.trim();
    currentCustomer.email = document.getElementById('settings-email').value;
    currentCustomer.phone = document.getElementById('settings-phone').value;
    currentCustomer.address = document.getElementById('settings-address').value;
    const idx = customers.findIndex(c => c.email === currentCustomer.email);
    if (idx !== -1) customers[idx] = currentCustomer;
    saveAllData();
    alert('Settings saved');
    renderCustomerPortal();
}

// ==================== ADMIN ====================
function showAdminLogin() { document.getElementById('login-overlay').style.display = 'flex'; }
function closeAdminLogin() { document.getElementById('login-overlay').style.display = 'none'; document.getElementById('admin-password').value = ''; document.getElementById('login-error').innerText = ''; }
function checkAdminLogin() {
    const pass = document.getElementById('admin-password').value;
    if (pass === 'admin123') {
        adminLoggedIn = true;
        closeAdminLogin();
        showPage('admin');
    } else { document.getElementById('login-error').innerText = 'Incorrect password'; }
}
function logout() { adminLoggedIn = false; showPage('home'); }
function showAdminPanel(panelId) {
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active-panel'));
    document.getElementById(`panel-${panelId}`).classList.add('active-panel');
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    if (panelId === 'dashboard') renderAdminDashboard();
    if (panelId === 'services') renderAdminServices();
    if (panelId === 'videos') renderAdminVideos();
    if (panelId === 'gallery') renderAdminGallery();
    if (panelId === 'shipments') renderAdminShipments();
    if (panelId === 'customers') renderAdminCustomers();
    if (panelId === 'quotations') renderAdminQuotations();
}
function renderAdminDashboard() {
    const statsDiv = document.getElementById('admin-stats');
    if (statsDiv) statsDiv.innerHTML = `<div>Shipments: ${Object.keys(shipments).length}</div><div>Customers: ${customers.length}</div><div>Services: ${services.length}</div>`;
}
function renderAdminServices() {
    const container = document.getElementById('services-list');
    if (!container) return;
    container.innerHTML = '';
    services.forEach((s, idx) => {
        container.innerHTML += `<div style="border-bottom:1px solid #ccc; padding:10px;"><strong>${s.icon} ${s.title}</strong><p>${s.description}</p><button onclick="deleteService(${idx})">Delete</button></div>`;
    });
}
function deleteService(idx) { services.splice(idx,1); saveAllData(); renderAdminServices(); }
function showAddServiceForm() { document.getElementById('add-service-form').style.display = 'block'; }
function addService() {
    const title = document.getElementById('service-title').value;
    const desc = document.getElementById('service-description').value;
    const icon = document.getElementById('service-icon').value || '📦';
    if (title && desc) services.push({ icon, title, description: desc });
    saveAllData(); renderAdminServices(); document.getElementById('add-service-form').style.display = 'none';
    document.getElementById('service-title').value = ''; document.getElementById('service-description').value = ''; document.getElementById('service-icon').value = '';
}
function renderAdminVideos() {
    const container = document.getElementById('videos-list');
    if (!container) return;
    container.innerHTML = '';
    videos.forEach((v, idx) => {
        container.innerHTML += `<div><strong>${v.title}</strong> (${v.category})<button onclick="deleteVideo(${idx})">Delete</button></div>`;
    });
}
function deleteVideo(idx) { videos.splice(idx,1); saveAllData(); renderAdminVideos(); }
function showAddVideoForm() { document.getElementById('add-video-form').style.display = 'block'; }
function addVideo() {
    const category = document.getElementById('video-category').value;
    const title = document.getElementById('video-title').value;
    const url = document.getElementById('video-url').value;
    const thumb = document.getElementById('video-thumbnail').value || 'https://via.placeholder.com/300x200';
    if (title && url) videos.push({ id: 'v'+Date.now(), category, title, url, thumbnail: thumb });
    saveAllData(); renderAdminVideos(); document.getElementById('add-video-form').style.display = 'none';
    document.getElementById('video-title').value = ''; document.getElementById('video-url').value = '';
}
function renderAdminGallery() {
    const container = document.getElementById('gallery-list');
    if (!container) return;
    container.innerHTML = '';
    gallery.forEach((g, idx) => {
        container.innerHTML += `<div><img src="${g.image}" width="50"> ${g.caption} (${g.category})<button onclick="deleteGallery(${idx})">Delete</button></div>`;
    });
}
function deleteGallery(idx) { gallery.splice(idx,1); saveAllData(); renderAdminGallery(); }
function showAddGalleryForm() { document.getElementById('add-gallery-form').style.display = 'block'; }
function addGalleryImage() {
    const category = document.getElementById('gallery-category').value;
    const image = document.getElementById('gallery-image').value;
    const caption = document.getElementById('gallery-caption').value;
    if (image) gallery.push({ id: 'g'+Date.now(), category, image, caption });
    saveAllData(); renderAdminGallery(); document.getElementById('add-gallery-form').style.display = 'none';
    document.getElementById('gallery-image').value = ''; document.getElementById('gallery-caption').value = '';
}
function renderAdminShipments() {
    const container = document.getElementById('shipments-list');
    if (!container) return;
    container.innerHTML = '';
    Object.values(shipments).forEach(s => {
        container.innerHTML += `<tr><td>${s.id}</td><td>${s.customer}</td><td>${s.status}</td><td>${s.estimatedDelivery}</td></tr>`;
    });
}
function showNewShipmentForm() { document.getElementById('new-shipment-form').style.display = 'block'; }
function saveNewShipment() {
    const id = document.getElementById('new-tracking').value;
    const customerName = document.getElementById('customer-name').value;
    const origin = document.getElementById('shipment-origin').value;
    const dest = document.getElementById('shipment-destination').value;
    const weight = parseFloat(document.getElementById('shipment-weight').value);
    const service = document.getElementById('shipment-service').value;
    if (!id || !customerName) return;
    const newShip = {
        id, customer: customerName, email: '', phone: '', status: 'Processing', statusClass: 'status-processing',
        origin, destination: dest, currentLocation: origin, estimatedDelivery: 'Pending', weight, volume: 0,
        service, paymentStatus: 'Pending', amountPaid: 0, packagingPhotos: [], timeline: []
    };
    shipments[id] = newShip;
    saveAllData();
    renderAdminShipments();
    cancelNewShipment();
}
function cancelNewShipment() { document.getElementById('new-shipment-form').style.display = 'none'; }
function renderAdminCustomers() {
    const container = document.getElementById('customers-list');
    if (!container) return;
    container.innerHTML = '';
    customers.forEach(c => {
        container.innerHTML += `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.phone}</td><td>${c.shipments.length}</td></tr>`;
    });
}
function showNewCustomerForm() { document.getElementById('new-customer-form').style.display = 'block'; }
function saveNewCustomer() {
    const name = document.getElementById('customer-name-input').value;
    const email = document.getElementById('customer-email-input').value;
    const phone = document.getElementById('customer-phone-input').value;
    const password = document.getElementById('customer-password-input').value || 'pass123';
    if (!name || !email) return;
    customers.push({ email, name, phone, password, shipments: [] });
    saveAllData();
    renderAdminCustomers();
    cancelNewCustomer();
}
function cancelNewCustomer() { document.getElementById('new-customer-form').style.display = 'none'; }
function renderAdminQuotations() {
    const container = document.getElementById('quotations-admin-list');
    if (!container) return;
    container.innerHTML = '';
    quotations.forEach(q => {
        container.innerHTML += `<tr><td>${q.id}</td><td>${q.email}</td><td>${q.service}</td><td>$${q.amount}</td><td>${q.status}</td></tr>`;
    });
}
function showNewQuotationForm() { document.getElementById('new-quotation-form').style.display = 'block'; }
function saveNewQuotation() {
    const id = document.getElementById('quote-id-input').value;
    const email = document.getElementById('quote-email-input').value;
    const service = document.getElementById('quote-service-input').value;
    const amount = parseFloat(document.getElementById('quote-amount-input').value);
    if (!id || !email || !service || isNaN(amount)) return;
    quotations.push({ id, email, service, amount, status: 'pending' });
    saveAllData();
    renderAdminQuotations();
    cancelNewQuotation();
}
function cancelNewQuotation() { document.getElementById('new-quotation-form').style.display = 'none'; }

// ==================== BRANDING & CONTACT ====================
function saveBranding() {
    const companyName = document.getElementById('company-name-input').value;
    const tagline = document.getElementById('tagline-input').value;
    document.getElementById('company-name').innerText = companyName;
    document.getElementById('company-tagline').innerText = tagline;
    alert('Branding saved');
}
function saveContact() { alert('Contact info saved'); }
function copyReferralLink() {
    const link = document.getElementById('referralLink');
    link.select(); document.execCommand('copy'); alert('Link copied!');
}
function updateReferralStats() {
    const countSpan = document.getElementById('referral-count');
    if (countSpan) countSpan.innerText = '3';
}

// ==================== PORTAL CARDS & HAMBURGER ====================
function openPortalAndPage(pageId) {
    showPage('customer-portal');
    if (currentCustomer) {
        const navItem = Array.from(document.querySelectorAll('.portal-nav-item')).find(
            item => item.innerText.toLowerCase().includes(pageId.replace('-', ' '))
        );
        if (navItem) navItem.click();
        else showPortalPage(pageId);
        pendingPortalPage = null;
    } else {
        pendingPortalPage = pageId;
        const loginSection = document.getElementById('customer-login-section');
        if (loginSection) {
            let hint = loginSection.querySelector('.login-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'login-hint';
                hint.style.fontSize = '0.75rem';
                hint.style.marginTop = '10px';
                hint.style.color = '#1a4b8c';
                hint.style.textAlign = 'center';
                loginSection.appendChild(hint);
            }
            hint.innerText = '🔐 Please log in to continue.';
        }
    }
}
document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', () => {
        const page = card.getAttribute('data-page');
        openPortalAndPage(page);
    });
});
document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const pageId = chip.getAttribute('data-page');
        if (pageId) showPage(pageId);
    });
});
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sideDrawer = document.getElementById('sideDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
function openDrawer() { sideDrawer.classList.add('open'); drawerOverlay.classList.add('open'); }
function closeDrawer() { sideDrawer.classList.remove('open'); drawerOverlay.classList.remove('open'); }
if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

// ==================== INIT ====================
function init() {
    renderServicesPage();
    renderVideosPage();
    renderGalleryPage();
    updateReferralStats();
}
init();
// ========== CUSTOMER LOGIN & SIGNUP (append to end of script.js) ==========

// Toggle between login and signup forms
document.addEventListener('DOMContentLoaded', function() {
  const showSignupLink = document.getElementById('showSignupLink');
  const showLoginLink = document.getElementById('showLoginLink');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (showSignupLink) {
    showSignupLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }
});

// Login function (email or phone + password)
function customerLogin() {
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!identifier || !password) {
    alert('Please enter both email/phone and password.');
    return;
  }
  // Find customer by email or phone
  const customer = customers.find(c => 
    (c.email && c.email.toLowerCase() === identifier.toLowerCase()) ||
    (c.phone && c.phone === identifier)
  );
  if (!customer || customer.password !== password) {
    alert('Invalid credentials. Please try again.');
    return;
  }
  currentCustomer = customer;
  renderCustomerPortal();
  // If there was a pending portal page after login, open it
  if (pendingPortalPage) {
    setTimeout(() => {
      const page = pendingPortalPage;
      pendingPortalPage = null;
      const navItem = Array.from(document.querySelectorAll('.portal-nav-item')).find(
        item => item.innerText.toLowerCase().includes(page.replace('-', ' '))
      );
      if (navItem) navItem.click();
      else showPortalPage(page);
    }, 100);
  } else {
    // default to dashboard
    showPortalPage('dashboard');
  }
}

// Signup function
function customerSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const confirm = document.getElementById('signupConfirm').value.trim();
  const address = document.getElementById('signupAddress').value.trim();

  if (!name || !email || !phone || !password || !confirm) {
    alert('Please fill in all required fields.');
    return;
  }
  if (password !== confirm) {
    alert('Passwords do not match.');
    return;
  }
  // Check if email or phone already exists
  if (customers.some(c => c.email === email || c.phone === phone)) {
    alert('A customer with this email or phone already exists. Please login instead.');
    return;
  }
  // Create new customer
  const newCustomer = {
    email: email,
    name: name,
    phone: phone,
    password: password,
    address: address,
    shipments: []
  };
  customers.push(newCustomer);
  saveAllData();
  currentCustomer = newCustomer;
  renderCustomerPortal();
  // After signup, go to dashboard
  showPortalPage('dashboard');
  // Clear pending if any
  pendingPortalPage = null;
}
// ========== UPDATED RENDER CUSTOMER PORTAL (shows portal content only when logged in) ==========
function renderCustomerPortal() {
  const loginSection = document.getElementById('customer-login-section');
  const welcomeSection = document.getElementById('customer-welcome-section');
  const portalContent = document.getElementById('portalContent');
  const userDisplay = document.getElementById('portal-user-display');

  if (currentCustomer) {
    // Logged in: hide login forms, show welcome message and portal content
    loginSection.style.display = 'none';
    welcomeSection.style.display = 'flex';
    portalContent.style.display = 'block';
    document.getElementById('welcome-message').innerText = `Welcome, ${currentCustomer.name}`;
    userDisplay.innerText = `👤 ${currentCustomer.name}`;

    // Load dashboard stats
    const dashboardStats = document.getElementById('dashboard-stats');
    if (dashboardStats) {
      dashboardStats.innerHTML = `<div class="stat-card">Shipments: ${currentCustomer.shipments.length}</div><div class="stat-card">Quotes: ${quotations.filter(q => q.email === currentCustomer.email).length}</div>`;
    }

    // Load recent shipments for dashboard
    const shipmentsList = document.getElementById('dashboard-shipments-list');
    if (shipmentsList) {
      shipmentsList.innerHTML = '';
      currentCustomer.shipments.forEach(sid => {
        const s = shipments[sid];
        if (s) shipmentsList.innerHTML += `<tr><td>${s.id}</td><td>${s.status}</td><td>${s.estimatedDelivery}</td></tr>`;
      });
    }

    // Populate packing list select
    const packingSelect = document.getElementById('packing-shipment-select');
    if (packingSelect) {
      packingSelect.innerHTML = '';
      currentCustomer.shipments.forEach(sid => packingSelect.innerHTML += `<option value="${sid}">${sid}</option>`);
    }

    // Fill settings form
    document.getElementById('settings-firstname').value = currentCustomer.name.split(' ')[0] || '';
    document.getElementById('settings-lastname').value = currentCustomer.name.split(' ')[1] || '';
    document.getElementById('settings-email').value = currentCustomer.email;
    document.getElementById('settings-phone').value = currentCustomer.phone || '';
    if (currentCustomer.address) document.getElementById('settings-address').value = currentCustomer.address;

  } else {
    // Not logged in: show login forms, hide welcome message and portal content
    loginSection.style.display = 'block';
    welcomeSection.style.display = 'none';
    portalContent.style.display = 'none';
    userDisplay.innerText = '👤 Welcome, Guest';
  }
}

// ========== CUSTOMER LOGIN (email/phone + password) ==========
function customerLogin() {
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!identifier || !password) {
    alert('Please enter both email/phone and password.');
    return;
  }
  const customer = customers.find(c =>
    (c.email && c.email.toLowerCase() === identifier.toLowerCase()) ||
    (c.phone && c.phone === identifier)
  );
  if (!customer || customer.password !== password) {
    alert('Invalid credentials. Please try again.');
    return;
  }
  currentCustomer = customer;
  renderCustomerPortal();

  // If there was a pending portal page after login, open it
  if (pendingPortalPage) {
    setTimeout(() => {
      const page = pendingPortalPage;
      pendingPortalPage = null;
      const navItem = Array.from(document.querySelectorAll('.portal-nav-item')).find(
        item => item.innerText.toLowerCase().includes(page.replace('-', ' '))
      );
      if (navItem) navItem.click();
      else showPortalPage(page);
    }, 100);
  } else {
    showPortalPage('dashboard');
  }
}

// ========== CUSTOMER SIGNUP ==========
function customerSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const confirm = document.getElementById('signupConfirm').value.trim();
  const address = document.getElementById('signupAddress').value.trim();

  if (!name || !email || !phone || !password || !confirm) {
    alert('Please fill in all required fields.');
    return;
  }
  if (password !== confirm) {
    alert('Passwords do not match.');
    return;
  }
  if (customers.some(c => c.email === email || c.phone === phone)) {
    alert('A customer with this email or phone already exists. Please login instead.');
    return;
  }
  const newCustomer = {
    email, name, phone, password, address,
    shipments: []
  };
  customers.push(newCustomer);
  saveAllData();
  currentCustomer = newCustomer;
  renderCustomerPortal();
  showPortalPage('dashboard');
  pendingPortalPage = null;
}

// ========== FORM TOGGLE (login/signup) ==========
document.addEventListener('DOMContentLoaded', function() {
  const showSignupLink = document.getElementById('showSignupLink');
  const showLoginLink = document.getElementById('showLoginLink');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (showSignupLink) {
    showSignupLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }
});
// ========== PORTAL MODAL FUNCTIONS ==========
function openOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.add('active');
  // Optionally pre-fill with current customer data
}
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.remove('active');
}
function submitOrderModal() {
  // Gather values from modal inputs
  const service = document.getElementById('order-service-modal').value;
  const packageType = document.getElementById('order-package-type-modal').value;
  const origin = document.getElementById('order-origin-modal').value;
  const destination = document.getElementById('order-destination-modal').value;
  const weight = document.getElementById('order-weight-modal').value;
  const volume = document.getElementById('order-volume-modal').value;
  const description = document.getElementById('order-description-modal').value;
  // Use the same submitOrder logic (or update)
  alert(`Order submitted: ${service} from ${origin} to ${destination}\nWeight: ${weight}kg, Volume: ${volume}m³\nWe'll contact you with a quotation.`);
  closeOrderModal();
  // Clear fields
}

function openPickupModal() { document.getElementById('pickupModal').classList.add('active'); }
function closePickupModal() { document.getElementById('pickupModal').classList.remove('active'); }
function submitPickupModal() {
  const pickupDate = document.getElementById('pickup-date-modal').value;
  const pickupTime = document.getElementById('pickup-time-modal').value;
  const address = document.getElementById('pickup-address-modal').value;
  const recipient = document.getElementById('recipient-name-modal').value;
  const phone = document.getElementById('recipient-phone-modal').value;
  const recAddress = document.getElementById('recipient-address-modal').value;
  const packages = document.getElementById('package-count-modal').value;
  const weight = document.getElementById('total-weight-modal').value;
  alert(`Pickup requested for ${pickupDate} at ${pickupTime}\nAddress: ${address}\nRecipient: ${recipient} (${phone})\nPackages: ${packages}, Weight: ${weight}kg`);
  closePickupModal();
}

function openSettingsModal() {
  // Pre-fill with current customer data
  if (currentCustomer) {
    document.getElementById('settings-firstname-modal').value = currentCustomer.name.split(' ')[0] || '';
    document.getElementById('settings-lastname-modal').value = currentCustomer.name.split(' ')[1] || '';
    document.getElementById('settings-email-modal').value = currentCustomer.email;
    document.getElementById('settings-phone-modal').value = currentCustomer.phone || '';
    document.getElementById('settings-address-modal').value = currentCustomer.address || '';
  }
  document.getElementById('settingsModal').classList.add('active');
}
function closeSettingsModal() { document.getElementById('settingsModal').classList.remove('active'); }
function saveSettingsModal() {
  const firstName = document.getElementById('settings-firstname-modal').value;
  const lastName = document.getElementById('settings-lastname-modal').value;
  const email = document.getElementById('settings-email-modal').value;
  const phone = document.getElementById('settings-phone-modal').value;
  const address = document.getElementById('settings-address-modal').value;
  if (currentCustomer) {
    currentCustomer.name = `${firstName} ${lastName}`.trim();
    currentCustomer.email = email;
    currentCustomer.phone = phone;
    currentCustomer.address = address;
    const idx = customers.findIndex(c => c.email === currentCustomer.email);
    if (idx !== -1) customers[idx] = currentCustomer;
    saveAllData();
    alert('Settings saved');
    renderCustomerPortal();
  }
  closeSettingsModal();
}
function openAddServiceModal() { document.getElementById('adminServiceModal').classList.add('active'); }
function closeAdminServiceModal() { document.getElementById('adminServiceModal').classList.remove('active'); }
function saveAdminService() {
  const title = document.getElementById('admin-service-title').value;
  const desc = document.getElementById('admin-service-description').value;
  const icon = document.getElementById('admin-service-icon').value || '📦';
  if (title && desc) {
    services.push({ icon, title, description: desc });
    saveAllData();
    renderAdminServices();
    closeAdminServiceModal();
    // Clear fields
    document.getElementById('admin-service-title').value = '';
    document.getElementById('admin-service-description').value = '';
    document.getElementById('admin-service-icon').value = '';
  } else {
    alert('Please fill title and description');
  }
}
