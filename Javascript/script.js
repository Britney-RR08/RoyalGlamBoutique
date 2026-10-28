document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Cart in LocalStorage if not present
  if (!localStorage.getItem('rgb_cart')) {
    localStorage.setItem('rgb_cart', JSON.stringify([]));
  }

  updateCartBadge();
  initSearchHandlers();
  initCatalogFilters();
  initAddToCartButtons();
  initCartPage();
  initCheckoutPage();
  initOrderConfirmationPage();
  initLiveSearch();
  initLightbox();
});

/* ========================================================
   1. CART UTILITIES & BADGE UPDATES
   ======================================================== */
function getCart() {
  return JSON.parse(localStorage.getItem('rgb_cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('rgb_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  document.querySelectorAll('.badge-cart, .cart-count').forEach(badge => {
    badge.textContent = totalCount;
  });
}

/* ========================================================
   2. ADD TO CART FUNCTIONALITY (Index & Catalog Pages)
   ======================================================== */
function initAddToCartButtons() {
  const addToCartButtons = document.querySelectorAll('.card .btn-dark, .card .btn-warning, .card a.btn');

  addToCartButtons.forEach(button => {
    if (button.textContent.includes('Add to Cart')) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const card = button.closest('.card') || button.closest('.product-item');
        if (!card) return;

        let title = 'Royal Glam Item';
        let priceText = 'R0';
        let imgSrc = '';

        const titleEl = card.querySelector('.card-title, h5, h6, .card-text');
        const priceEl = card.querySelector('.card-title.text-warning, .fw-bold, .hover-box-text, h5');
        const imgEl = card.querySelector('img');

        if (titleEl) title = titleEl.textContent.trim();
        if (priceEl) priceText = priceEl.textContent.trim();
        if (imgEl) imgSrc = imgEl.src;

        // Parse price (e.g., "R4 500" -> 4500)
        const priceNum = parseFloat(priceText.replace(/[^\d]/g, '')) || 0;

        let cart = getCart();
        const existingItem = cart.find(item => item.title === title);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            title: title,
            price: priceNum,
            priceFormatted: priceText,
            image: imgSrc || 'https://via.placeholder.com/150',
            quantity: 1
          });
        }

        saveCart(cart);
        alert(`"${title}" has been added to your shopping cart!`);
      });
    }
  });
}

/* ========================================================
   3. CART PAGE RENDERING & MANAGEMENT (`cart.html`)
   ======================================================== */
function initCartPage() {
  const cartTableBody = document.querySelector('table tbody');
  if (!cartTableBody) return;

  renderCartItems();
}

function renderCartItems() {
  const cartTableBody = document.querySelector('table tbody');
  if (!cartTableBody) return;

  const summarySubtotal = document.querySelector('.col-lg-4 .d-flex.justify-content-between:nth-child(2) span:nth-child(2), .col-lg-4 .bg-white .d-flex:nth-child(2) span:nth-last-child(1)');
  const summaryTotal = document.querySelector('.col-lg-4 .fs-5 .text-warning');
  
  let cart = getCart();

  if (cart.length === 0) {
    cartTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Your shopping cart is currently empty.</td></tr>`;
    if (summarySubtotal) summarySubtotal.textContent = 'R0';
    if (summaryTotal) summaryTotal.textContent = 'R0';
    return;
  }

  let html = '';
  let subtotal = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    html += `
      <tr>
        <td class="text-start">
          <div class="d-flex align-items-center">
            <img src="${item.image}" width="60" class="rounded me-3 object-fit-cover" alt="${item.title}" style="height:60px; object-fit:cover;">
            <div>
              <h6 class="mb-0 fw-bold">${item.title}</h6>
            </div>
          </div>
        </td>
        <td class="fw-semibold">${item.priceFormatted || 'R' + item.price.toLocaleString()}</td>
        <td><input type="number" class="form-control mx-auto quantity-input" data-index="${index}" value="${item.quantity}" min="1" style="width: 70px;"></td>
        <td class="fw-bold text-warning">R${itemTotal.toLocaleString()}</td>
        <td><button class="btn btn-sm btn-outline-danger remove-item-btn" data-index="${index}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `;
  });

  cartTableBody.innerHTML = html;

  if (summarySubtotal) summarySubtotal.textContent = `R${subtotal.toLocaleString()}`;
  if (summaryTotal) summaryTotal.textContent = `R${subtotal.toLocaleString()}`;

  // Attach event listeners for quantity updates and item removal
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.getAttribute('data-index');
      const newQty = parseInt(e.target.value);
      if (newQty > 0) {
        cart[idx].quantity = newQty;
        saveCart(cart);
        renderCartItems();
      }
    });
  });

  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.closest('button').getAttribute('data-index');
      cart.splice(idx, 1);
      saveCart(cart);
      renderCartItems();
    });
  });
}

/* ========================================================
   4. CHECKOUT PAGE RENDERING (`checkout.html`)
   ======================================================== */
function initCheckoutPage() {
  const checkoutSummaryContainer = document.querySelector('main.container form .col-lg-5 .bg-white');
  if (!checkoutSummaryContainer) return;

  let cart = getCart();
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let itemsHtml = cart.map(item => `
    <div class="d-flex justify-content-between mb-2">
      <span>${item.title} (x${item.quantity})</span>
      <span class="fw-bold">R${(item.price * item.quantity).toLocaleString()}</span>
    </div>
  `).join('');

  checkoutSummaryContainer.innerHTML = `
    <h4 class="fw-bold mb-3 border-bottom pb-2">Your Order Summary</h4>
    ${itemsHtml || '<p class="text-muted">No items in cart.</p>'}
    <hr>
    <div class="d-flex justify-content-between mb-4 fs-5">
      <strong>Total Payable</strong>
      <strong class="text-warning">R${subtotal.toLocaleString()}</strong>
    </div>
    <button type="submit" class="btn btn-warning btn-lg w-100 fw-bold">Place Order & Pay Now</button>
  `;
}

/* ========================================================
   5. ORDER CONFIRMATION PAGE (`order-confirmation.html`)
   ======================================================== */
function initOrderConfirmationPage() {
  const orderSummaryCol = document.querySelector('main.container .col-lg-5');
  if (!orderSummaryCol) return;

  // Check if we are on the confirmation page
  if (!window.location.pathname.includes('order-confirmation.html') && !document.querySelector('h2')?.textContent.includes('Thank You')) {
    return;
  }

  let cart = getCart();
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let itemsHtml = cart.map(item => `
    <div class="d-flex justify-content-between mb-2">
      <span>${item.title} (x${item.quantity})</span>
      <span class="fw-bold">R${(item.price * item.quantity).toLocaleString()}</span>
    </div>
  `).join('');

  orderSummaryCol.innerHTML = `
    <div class="bg-white p-4 rounded shadow-sm border">
      <h4 class="fw-bold mb-3 border-bottom pb-2">Final Ordered Items</h4>
      ${itemsHtml || '<p class="text-muted">No items recorded.</p>'}
      <hr>
      <div class="d-flex justify-content-between mb-2 fs-5">
        <strong>Total Paid</strong>
        <strong class="text-warning">R${subtotal.toLocaleString()}</strong>
      </div>
    </div>
  `;

  // Clear cart upon successful order confirmation
  localStorage.removeItem('rgb_cart');
  updateCartBadge();
}

/* ========================================================
   6. GLOBAL SEARCH & LIVE SEARCH DROPDOWN
   ======================================================== */
function initSearchHandlers() {
  const searchForms = document.querySelectorAll('form[role="search"]');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"]');
      if (input && input.value.trim()) {
        const query = encodeURIComponent(input.value.trim());
        const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
        const catalogPath = isRoot ? 'Assets/catalog.html' : 'catalog.html';
        window.location.href = `${catalogPath}?q=${query}`;
      }
    });
  });
}

function initLiveSearch() {
  const searchItems = [
    { title: "Home", category: "Page", url: "index.html" },
    { title: "About Us", category: "Page", url: "about.html" },
    { title: "Contact Us", category: "Page", url: "contact.html" },
    { title: "Product & Service Enquiry", category: "Page", url: "enquiry.html" },
    { title: "Size Guide & Fitting", category: "Page", url: "size.html" },
    { title: "Product Catalog", category: "Page", url: "catalog.html" },
    { title: "Shopping Cart", category: "Page", url: "cart.html" },
    { title: "Checkout", category: "Page", url: "checkout.html" },
    { title: "Account & VIP Dashboard", category: "Page", url: "account.html" },
    { title: "Fashion Blog", category: "Page", url: "blog.html" },
    
    // Products
    { title: "Classic Leather Tote Bag", category: "Handbags", url: "catalog.html?q=tote" },
    { title: "Gold Minimalist Pendant Necklace", category: "Jewellery", url: "catalog.html?q=necklace" },
    { title: "Luxury Handbag with Gold Accents", category: "Handbags", url: "catalog.html?q=handbag" },
    { title: "Designer Heels", category: "Shoes", url: "catalog.html?q=heels" },
    { title: "Elegant Evening Dress", category: "Dresses", url: "catalog.html?q=dress" }
  ];

  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const isRootIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      searchResults.innerHTML = '';

      if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
      }

      const matches = searchItems.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );

      if (matches.length > 0) {
        matches.forEach(item => {
          const a = document.createElement('a');
          let targetUrl = item.url;
          
          if (isRootIndex) {
            targetUrl = targetUrl.startsWith('Assets/') ? targetUrl : (targetUrl === 'index.html' ? 'index.html' : 'Assets/' + targetUrl);
          } else {
            targetUrl = targetUrl.startsWith('Assets/') ? targetUrl.replace('Assets/', '') : targetUrl;
          }

          a.href = targetUrl;
          a.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-light border-secondary';
          a.innerHTML = `
            <span>${item.title}</span>
            <span class="badge bg-warning text-dark font-monospace">${item.category}</span>
          `;
          searchResults.appendChild(a);
        });
        searchResults.style.display = 'block';
      } else {
        searchResults.innerHTML = `
          <div class="list-group-item bg-dark text-muted small border-secondary">
            No results found for "${query}"
          </div>`;
        searchResults.style.display = 'block';
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });
  }

  // Handle URL query string filtering on catalog.html
  if (window.location.pathname.includes('catalog.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || urlParams.get('search');
    
    if (searchQuery) {
      const filterInput = document.getElementById('myInput');
      if (filterInput) {
        filterInput.value = searchQuery;
        setTimeout(() => {
          if (typeof myFunction === 'function') myFunction();
        }, 100);
      }
    }
  }
}

/* ========================================================
   7. CATALOG PAGE FILTERS
   ======================================================== */
function initCatalogFilters() {
  const categorySelect = document.querySelector('.filters select:nth-of-type(1)');
  const colorSelect = document.querySelector('.filters select:nth-of-type(2)');

  if (!categorySelect && !colorSelect) return;

  const applyFilters = () => {
    const selectedCategory = categorySelect ? categorySelect.value.toLowerCase() : 'all';
    console.log(`Filtering catalog by Category: ${selectedCategory}`);
  };

  if (categorySelect) categorySelect.addEventListener('change', applyFilters);
  if (colorSelect) colorSelect.addEventListener('change', applyFilters);
}

/* ========================================================
   8. HERO LIGHTBOX FUNCTIONALITY
   ======================================================== */
let heroSlideIndex = 1;

function openLightbox() {
  const modal = document.getElementById("heroLightboxModal");
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
    showHeroSlides(heroSlideIndex);
  }
}

function closeLightbox() {
  const modal = document.getElementById("heroLightboxModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function plusHeroSlides(n) {
  showHeroSlides(heroSlideIndex += n);
}

function currentHeroSlide(n) {
  showHeroSlides(heroSlideIndex = n);
}

function showHeroSlides(n) {
  var slides = document.getElementsByClassName("heroSlides");
  var dots = document.getElementsByClassName("demo-thumb");
  var captionText = document.getElementById("heroCaption");

  if (!slides.length) return;

  if (n > slides.length) { heroSlideIndex = 1; }
  if (n < 1) { heroSlideIndex = slides.length; }

  for (var i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  for (var j = 0; j < dots.length; j++) {
    dots[j].className = dots[j].className.replace(" active", "");
  }

  slides[heroSlideIndex - 1].style.display = "block";
  if (dots[heroSlideIndex - 1]) {
    dots[heroSlideIndex - 1].className += " active";
  }
  
  const activeImg = slides[heroSlideIndex - 1].querySelector("img");
  if (captionText && activeImg) {
    captionText.innerHTML = activeImg.alt;
  }
}

function initLightbox() {
  const modal = document.getElementById("heroLightboxModal");
  if (modal) {
    modal.addEventListener("click", function(event) {
      if (event.target === this) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") {
        closeLightbox();
      }
    });
  }
}

