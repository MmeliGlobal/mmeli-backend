// ===== CONFIG =====
const API = '/api';
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentCategory = 'All';
let currentSubcategory = '';
let minPrice = '';
let maxPrice = '';
let currentUser = null;

// ===== SUBCATEGORY MAPPING =====
const subcategoryMap = {
  'Phones': ['Apple', 'Samsung', 'Google', 'Huawei', 'OnePlus'],
  'Laptops': ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer'],
  'Accessories': ['Chargers', 'Cases', 'Screen Protectors', 'Power Banks', 'Headphones'],
  'Tablets': ['Apple', 'Samsung', 'Lenovo', 'Microsoft']
};

// ===== CART =====
function updateCartBadges() {
  const total = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.innerText = total;
  // No footer cart badge now
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function loadCart() {
  const saved = localStorage.getItem('cart');
  if (saved) try { cart = JSON.parse(saved); } catch(e) {}
  updateCartBadges();
}
function renderCartModal() {
  const container = document.getElementById('cartItemsContainer');
  const totalContainer = document.getElementById('cartTotalContainer');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    totalContainer.innerText = 'Total: $0.00';
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
  totalContainer.innerText = `Total: $${total.toFixed(2)}`;
  container.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', function() {
      cart.splice(parseInt(this.dataset.index), 1);
      saveCart(); updateCartBadges(); renderCartModal();
    });
  });
}
function addToCart(id, name, price, size, color) {
  const itemName = `${name} (${size}, ${color})`;
  const existing = cart.find(i => i.id == id && i.size === size && i.color === color);
  if (existing) existing.quantity = (existing.quantity || 1) + 1;
  else cart.push({ id, name: itemName, price, size, color, quantity: 1 });
  saveCart(); updateCartBadges(); renderCartModal();
  showToast(`${itemName} added`);
}
function showToast(msg) {
  const t = document.createElement('div');
  t.innerText = msg;
  t.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#0f172a; color:white; padding:8px 20px; border-radius:40px; font-size:0.8rem; z-index:1001;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]); }

// ===== TRACKING =====
function trackOrder() {
  const code = document.getElementById('trackCodeInput').value.trim();
  const resultDiv = document.getElementById('trackResult');
  const timelineDiv = document.getElementById('trackTimeline');
  if (!code) { resultDiv.innerHTML = '<span style="color:#dc2626;">Enter a tracking code</span>'; return; }
  resultDiv.innerHTML = '<span style="color:#1e3a8a;">Searching...</span>';
  // Simulate API call
  setTimeout(() => {
    const statuses = ['Ordered', 'Shipped', 'In Transit', 'Delivered'];
    const completed = Math.floor(Math.random() * statuses.length) + 1;
    const steps = statuses.map((s, i) => `<span class="step ${i < completed ? 'completed' : ''}">${s}</span>`).join('');
    resultDiv.innerHTML = `
      <div style="background:#f0f9ff; padding:12px; border-radius:12px;">
        <strong>Order #${code}</strong><br>
        Status: <span style="color:#16a34a; font-weight:700;">${statuses[completed-1]}</span><br>
        Estimated Delivery: ${new Date(Date.now() + 3*86400000).toLocaleDateString()}
      </div>
    `;
    timelineDiv.innerHTML = steps;
  }, 800);
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error(await res.text());
    allProducts = await res.json();
    renderProducts();
    localStorage.setItem('cachedProducts', JSON.stringify(allProducts));
  } catch(e) {
    console.warn('Using cached or demo products');
    const cached = localStorage.getItem('cachedProducts');
    if (cached) { allProducts = JSON.parse(cached); renderProducts(); }
    else { allProducts = generateDemoProducts(); renderProducts(); }
  }
}

function generateDemoProducts() {
  const names = ['iPhone 15 Pro Max', 'Samsung Galaxy S24', 'MacBook Pro 14"', 'Dell XPS 16', 'iPad Pro', 'Sony Headphones', 'Apple Watch', 'Lenovo ThinkPad'];
  const cats = ['Phones','Phones','Laptops','Laptops','Tablets','Accessories','Accessories','Laptops'];
  const brands = ['Apple','Samsung','Apple','Dell','Apple','Sony','Apple','Lenovo'];
  return names.map((name, i) => ({
    id: i+1,
    name,
    description: 'Premium quality',
    price: 199 + i * 150,
    main_image: `https://picsum.photos/400/400?random=${i+10}`,
    cat: cats[i] || 'Phones',
    subcat: brands[i] || 'General',
    colors: ['Black', 'White', 'Gray', 'Silver'],
    size_options: [
      { size: '64GB', price: 199 + i * 150 },
      { size: '128GB', price: 199 + i * 150 + 100 },
      { size: '256GB', price: 199 + i * 150 + 200 }
    ],
    badge: i%2===0 ? 'Best Seller' : ''
  }));
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  let filtered = [...allProducts];
  if (currentCategory !== 'All') filtered = filtered.filter(p => p.cat === currentCategory);
  if (currentSubcategory) filtered = filtered.filter(p => p.subcat === currentSubcategory);
  if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));

  if (!filtered.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">No products found</div>';
    return;
  }
  container.innerHTML = '';
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const img = p.main_image || `https://picsum.photos/400/400?random=${p.id}`;
    const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : '';
    const sizes = p.size_options && p.size_options.length ? p.size_options : [{ size: 'Standard', price: p.price }];
    const colors = p.colors && p.colors.length ? p.colors : ['Default'];
    let sizeOpts = sizes.map(s => `<option value="${escapeHtml(s.size)}" data-price="${s.price}">${escapeHtml(s.size)}</option>`).join('');
    let colorOpts = colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    const basePrice = sizes[0].price;

    card.innerHTML = `
      <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://picsum.photos/400/400?random=${p.id}'">
      <div class="product-info">
        ${badge}
        <h3>${escapeHtml(p.name)}</h3>
        <div class="desc">${escapeHtml(p.description || '')}</div>
        <div class="price" data-base-price="${basePrice}">$${basePrice.toFixed(2)}</div>
        <div class="size-color-row">
          <select class="size-select">${sizeOpts}</select>
          <select class="color-select">${colorOpts}</select>
        </div>
        <button class="add-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${basePrice}">Add to Cart</button>
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

    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('select')) openProductModal(p.id);
    });

    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const size = sizeSelect.value;
      const color = card.querySelector('.color-select').value;
      const price = parseFloat(this.dataset.price);
      addToCart(p.id, p.name, price, size, color);
    });

    container.appendChild(card);
  });
}

// ===== PRODUCT MODAL =====
function openProductModal(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) { alert('Product not found'); return; }
  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductDesc').innerText = product.description || '';
  const mainImg = document.getElementById('modalProductImage');
  mainImg.src = product.main_image || `https://picsum.photos/600/600?random=${product.id}`;

  const thumbContainer = document.getElementById('modalProductThumbnails');
  thumbContainer.innerHTML = '';
  const thumbs = [product.main_image];
  if (product.images) thumbs.push(...product.images);
  thumbs.filter(Boolean).slice(0,4).forEach(img => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `<img src="${img}" alt="thumbnail">`;
    div.addEventListener('click', () => { mainImg.src = img; });
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
  const newBtn = modalAddBtn.cloneNode(true);
  modalAddBtn.parentNode.replaceChild(newBtn, modalAddBtn);
  newBtn.addEventListener('click', function() {
    const size = sizeSelect.value;
    const color = colorSelect.value;
    const price = parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.price);
    addToCart(product.id, product.name, price, size, color);
    document.getElementById('productModal').classList.remove('active');
  });

  const relatedGrid = document.getElementById('relatedProductsGrid');
  relatedGrid.innerHTML = '';
  const related = allProducts.filter(p => p.cat === product.cat && p.id !== product.id).slice(0,4);
  related.forEach(p => {
    const card = document.createElement('div');
    card.className = 'related-card';
    card.innerHTML = `
      <img src="${p.main_image || 'https://picsum.photos/200/200?random='+p.id}" alt="${p.name}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="price">$${p.price}</div>
    `;
    card.addEventListener('click', () => openProductModal(p.id));
    relatedGrid.appendChild(card);
  });

  modal.classList.add('active');
}
function closeProductModal() { document.getElementById('productModal').classList.remove('active'); }

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
  currentCategory = 'All'; currentSubcategory = ''; minPrice = ''; maxPrice = '';
  populateSubcategories('');
  renderProducts();
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  const allChip = document.querySelector('.chip[data-category="All"]');
  if (allChip) allChip.classList.add('active');
  document.querySelectorAll('.product-card').forEach(c => c.style.display = '');
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
  const email = document.getElementById('regEmail');
  const address = document.getElementById('regAddress');
  const pass = document.getElementById('regPassword');
  if (!name || !phone || !pass || !name.value || !phone.value || !pass.value) {
    alert('Name, phone and password required');
    return;
  }
  currentUser = { name: name.value, email: email ? email.value : '', phone: phone.value, address: address ? address.value : '' };
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadCart();
  renderCartModal();
  loadProducts();

  // Restore user
  const savedUser = localStorage.getItem('mmeliUser');
  if (savedUser) {
    try { currentUser = JSON.parse(savedUser);
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('userName').innerText = currentUser.name;
    } catch(e) {}
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

  // Filter events
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

  // Cart modal
  const cartIconBtn = document.getElementById('cartIconBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCartBtn = document.getElementById('closeCartBtn');
  if (cartIconBtn) {
    cartIconBtn.addEventListener('click', () => {
      renderCartModal();
      if (cartModal) cartModal.classList.add('active');
    });
  }
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
      if (cartModal) cartModal.classList.remove('active');
    });
  }
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) cartModal.classList.remove('active');
    });
  }

  // Tracking modal
  const trackingLink = document.getElementById('footerTracking');
  const trackingModal = document.getElementById('trackingModal');
  const closeTrackingBtn = document.getElementById('closeTrackingBtn');
  const trackBtn = document.getElementById('trackOrderBtn');
  const trackInput = document.getElementById('trackCodeInput');
  if (trackingLink && trackingModal) {
    trackingLink.addEventListener('click', (e) => {
      e.preventDefault();
      trackingModal.classList.add('active');
    });
  }
  if (closeTrackingBtn && trackingModal) {
    closeTrackingBtn.addEventListener('click', () => trackingModal.classList.remove('active'));
    trackingModal.addEventListener('click', (e) => {
      if (e.target === trackingModal) trackingModal.classList.remove('active');
    });
  }
  if (trackBtn) trackBtn.addEventListener('click', trackOrder);
  if (trackInput) trackInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') trackOrder(); });

  // Promo modal
  const promoLink = document.getElementById('footerPromo');
  const promoModal = document.getElementById('promoModal');
  const closePromoBtn = document.getElementById('closePromoBtn');
  if (promoLink && promoModal) {
    promoLink.addEventListener('click', (e) => {
      e.preventDefault();
      promoModal.classList.add('active');
    });
  }
  if (closePromoBtn && promoModal) {
    closePromoBtn.addEventListener('click', () => promoModal.classList.remove('active'));
    promoModal.addEventListener('click', (e) => {
      if (e.target === promoModal) promoModal.classList.remove('active');
    });
  }

  // Account modal
  const accountLink = document.getElementById('footerAccount');
  const accountModal = document.getElementById('accountModal');
  const closeAccountBtn = document.getElementById('closeAccountBtn');
  const loginBtn = document.getElementById('loginSubmitBtn');
  const registerBtn = document.getElementById('registerBtn');
  if (accountLink && accountModal) {
    accountLink.addEventListener('click', (e) => {
      e.preventDefault();
      accountModal.classList.add('active');
    });
  }
  if (closeAccountBtn && accountModal) {
    closeAccountBtn.addEventListener('click', () => accountModal.classList.remove('active'));
    accountModal.addEventListener('click', (e) => {
      if (e.target === accountModal) accountModal.classList.remove('active');
    });
  }
  if (loginBtn) loginBtn.addEventListener('click', login);
  if (registerBtn) registerBtn.addEventListener('click', register);

  // More modal
  const moreLink = document.getElementById('footerMore');
  const moreModal = document.getElementById('moreModal');
  const closeMoreBtn = document.getElementById('closeMoreBtn');
  if (moreLink && moreModal) {
    moreLink.addEventListener('click', (e) => {
      e.preventDefault();
      moreModal.classList.add('active');
    });
  }
  if (closeMoreBtn && moreModal) {
    closeMoreBtn.addEventListener('click', () => moreModal.classList.remove('active'));
    moreModal.addEventListener('click', (e) => {
      if (e.target === moreModal) moreModal.classList.remove('active');
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

  // Footer Home = reset
  const homeLink = document.getElementById('footerHome');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.footer-link').forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
      resetFilters();
      document.querySelector('.chip[data-category="All"]')?.classList.add('active');
      showToast('Refreshed');
    });
  }

  // Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      if (!cart.length) { alert('Cart is empty'); return; }
      const total = cart.reduce((s,i) => s + i.price * i.quantity, 0);
      alert(`Proceed to checkout. Total: $${total.toFixed(2)}`);
    });
  }

  populateSubcategories('');
});
