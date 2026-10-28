/* ========================================================
   SECURITY: XSS Sanitization Helper
   ======================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Defaults in LocalStorage
  if (!localStorage.getItem('rgb_cart')) {
    localStorage.setItem('rgb_cart', JSON.stringify([]));
  }
  if (!localStorage.getItem('rgb_users')) {
    const defaultUser = {
      name: "Britney Rikhotso",
      email: "britney@example.com",
      password: "Password123",
      address: "123 Luxury Lane, Johannesburg",
      city: "Johannesburg",
      postalCode: "2196"
    };
    localStorage.setItem('rgb_users', JSON.stringify([defaultUser]));
    localStorage.setItem('rgb_current_user', JSON.stringify(defaultUser));
  }
  if (!localStorage.getItem('rgb_orders')) {
    localStorage.setItem('rgb_orders', JSON.stringify([
      {
        orderNum: "#RGB-89412",
        email: "britney@example.com",
        items: "Classic Leather Tote & Necklace",
        date: "26 Oct 2026",
        amount: "R9,300",
        status: "Processing"
      }
    ]));
  }
  if (!localStorage.getItem('rgb_payment_methods')) {
    localStorage.setItem('rgb_payment_methods', JSON.stringify([
      { email: "britney@example.com", type: "Visa", last4: "1234", isDefault: true }
    ]));
  }

  updateCartBadge();
  initAddToCartButtons();
  initCartPage();
  initCheckoutPage();
  initOrderConfirmationPage();
  initAccountPage();
  initLightbox();
  initScrollToTop();
});

/* ========================================================
   2. CART UTILITIES & BADGE UPDATES
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
   3. SCROLL TO TOP & ANIMATIONS
   ======================================================== */
function initScrollToTop() {
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  if (!scrollToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ========================================================
   4. ADD TO CART FUNCTIONALITY
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

        if (titleEl) title = escapeHtml(titleEl.textContent.trim());
        if (priceEl) priceText = escapeHtml(priceEl.textContent.trim());
        if (imgEl) imgSrc = imgEl.src;

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
   5. CART PAGE RENDERING & MANAGEMENT
   ======================================================== */
function initCartPage() {
  const cartTableBody = document.querySelector('table tbody');
  if (!cartTableBody || window.location.pathname.includes('account.html')) return;
  renderCartItems();
}

function renderCartItems() {
  const cartTableBody = document.querySelector('table tbody');
  if (!cartTableBody) return;

  const summarySubtotal = document.querySelector('.col-lg-4 .d-flex.justify-content-between:nth-child(2) span:nth-child(2)');
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
            <img src="${escapeHtml(item.image)}" width="60" class="rounded me-3 object-fit-cover" alt="${escapeHtml(item.title)}" style="height:60px; object-fit:cover;">
            <div><h6 class="mb-0 fw-bold">${escapeHtml(item.title)}</h6></div>
          </div>
        </td>
        <td class="fw-semibold">${escapeHtml(item.priceFormatted)}</td>
        <td><input type="number" class="form-control mx-auto quantity-input" data-index="${index}" value="${item.quantity}" min="1" style="width: 70px;"></td>
        <td class="fw-bold text-warning">R${itemTotal.toLocaleString()}</td>
        <td><button class="btn btn-sm btn-outline-danger remove-item-btn" data-index="${index}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `;
  });

  cartTableBody.innerHTML = html;

  if (summarySubtotal) summarySubtotal.textContent = `R${subtotal.toLocaleString()}`;
  if (summaryTotal) summaryTotal.textContent = `R${subtotal.toLocaleString()}`;

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
   6. CHECKOUT PAGE RECORDING
   ======================================================== */
function initCheckoutPage() {
  const checkoutSummaryContainer = document.querySelector('main.container form .col-lg-5 .bg-white');
  if (!checkoutSummaryContainer) return;

  const currentUser = JSON.parse(localStorage.getItem('rgb_current_user'));
  if (currentUser) {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    const postalCodeInput = document.getElementById('postalCode');
    const cardNameInput = document.getElementById('cardName');

    if (fullNameInput && !fullNameInput.value) fullNameInput.value = currentUser.name || '';
    if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
    if (addressInput && !addressInput.value) addressInput.value = currentUser.address || '';
    if (cityInput && !cityInput.value) cityInput.value = currentUser.city || 'Johannesburg';
    if (postalCodeInput && !postalCodeInput.value) postalCodeInput.value = currentUser.postalCode || '2196';
    if (cardNameInput && !cardNameInput.value) cardNameInput.value = currentUser.name || '';
  }

  let cart = getCart();
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let itemsHtml = cart.map(item => `
    <div class="d-flex justify-content-between mb-2">
      <span>${escapeHtml(item.title)} (x${item.quantity})</span>
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

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!checkoutForm.checkValidity()) {
        checkoutForm.classList.add('was-validated');
        return;
      }

      const emailVal = escapeHtml(document.getElementById('email').value.trim());
      const nameVal = escapeHtml(document.getElementById('fullName').value.trim());
      const addressVal = escapeHtml(document.getElementById('address').value.trim());
      const cityVal = escapeHtml(document.getElementById('city').value.trim());
      const postalVal = escapeHtml(document.getElementById('postalCode').value.trim());
      const cardNumberVal = document.getElementById('cardNumber').value.trim();
      const last4Digits = escapeHtml(cardNumberVal.slice(-4) || "8910");

      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const orderNum = `#RGB-${randomNum}`;
      const itemsSummary = cart.map(i => `${escapeHtml(i.title)} (x${i.quantity})`).join(', ') || "Boutique Selection";
      const totalAmount = `R${subtotal.toLocaleString()}`;
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

      // Save Order
      let orders = JSON.parse(localStorage.getItem('rgb_orders')) || [];
      orders.unshift({ orderNum, email: emailVal, items: itemsSummary, date: dateStr, amount: totalAmount, status: "Processing" });
      localStorage.setItem('rgb_orders', JSON.stringify(orders));

      // Save Payment Method
      let paymentMethods = JSON.parse(localStorage.getItem('rgb_payment_methods')) || [];
      paymentMethods.push({
        email: emailVal,
        type: document.getElementById('payEFT')?.checked ? "Instant EFT" : "Visa",
        last4: last4Digits,
        isDefault: paymentMethods.length === 0
      });
      localStorage.setItem('rgb_payment_methods', JSON.stringify(paymentMethods));

      // Save or Update User Profile
      let users = JSON.parse(localStorage.getItem('rgb_users')) || [];
      let existingUser = users.find(u => u.email.toLowerCase() === emailVal.toLowerCase());
      if (!existingUser) {
        const newUser = { name: nameVal, email: emailVal, password: "Password123", address: addressVal, city: cityVal, postalCode: postalVal };
        users.push(newUser);
        localStorage.setItem('rgb_users', JSON.stringify(users));
        localStorage.setItem('rgb_current_user', JSON.stringify(newUser));
      }

      window.location.href = 'order-confirmation.html';
    });
  }
}

/* ========================================================
   7. ORDER CONFIRMATION PAGE
   ======================================================== */
function initOrderConfirmationPage() {
  const orderSummaryCol = document.querySelector('main.container .col-lg-5');
  if (!orderSummaryCol || !window.location.pathname.includes('order-confirmation.html')) return;

  let cart = getCart();
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let itemsHtml = cart.map(item => `
    <div class="d-flex justify-content-between mb-2">
      <span>${escapeHtml(item.title)} (x${item.quantity})</span>
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

  localStorage.removeItem('rgb_cart');
  updateCartBadge();
}

/* ========================================================
   8. ACCOUNT DASHBOARD (Login, Registration, Profiles, Credential Updates)
   ======================================================== */
function initAccountPage() {
  const accountMain = document.getElementById('profileDisplayName');
  if (!accountMain) return;

  const currentUser = JSON.parse(localStorage.getItem('rgb_current_user'));
  const users = JSON.parse(localStorage.getItem('rgb_users')) || [];
  const orders = JSON.parse(localStorage.getItem('rgb_orders')) || [];
  const paymentMethods = JSON.parse(localStorage.getItem('rgb_payment_methods')) || [];

  if (currentUser) {
    const initials = currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : "BR";
    document.getElementById('profileAvatarBadge').textContent = initials;
    document.getElementById('profileDisplayName').textContent = currentUser.name;
    document.getElementById('profileDetailsName').textContent = currentUser.name;
    document.getElementById('profileDetailsEmail').textContent = currentUser.email;

    // Render Saved Profiles & Addresses
    const profilesContainer = document.getElementById('savedProfilesList');
    if (profilesContainer) {
      profilesContainer.innerHTML = users.map(u => `
        <div class="col-md-6">
          <div class="border rounded p-3 bg-light ${u.email === currentUser.email ? 'border-warning border-2' : ''}">
            <span class="badge ${u.email === currentUser.email ? 'bg-warning text-dark' : 'bg-secondary'} mb-2">
              ${u.email === currentUser.email ? 'Active Account' : 'Saved Profile'}
            </span>
            <p class="mb-1 fw-bold">${escapeHtml(u.name)}</p>
            <p class="mb-0 text-secondary small">${escapeHtml(u.email)}</p>
            <p class="mb-0 text-secondary small">${escapeHtml(u.address || '123 Luxury Lane')}, ${escapeHtml(u.city || 'Johannesburg')}</p>
            ${u.email !== currentUser.email ? `<button class="btn btn-sm btn-outline-dark mt-2 switch-user-btn" data-email="${escapeHtml(u.email)}">Switch to Profile</button>` : ''}
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.switch-user-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetEmail = e.target.getAttribute('data-email');
          const foundUser = users.find(u => u.email === targetEmail);
          if (foundUser) {
            localStorage.setItem('rgb_current_user', JSON.stringify(foundUser));
            alert(`Switched account to ${foundUser.name}!`);
            location.reload();
          }
        });
      });
    }

    // Render Order History for Active Profile
    const orderTableBody = document.getElementById('dynamicOrderHistoryTable');
    if (orderTableBody) {
      const userOrders = orders.filter(o => o.email.toLowerCase() === currentUser.email.toLowerCase());
      if (userOrders.length === 0) {
        orderTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No orders found for this account.</td></tr>`;
      } else {
        orderTableBody.innerHTML = userOrders.map(o => `
          <tr>
            <td class="fw-bold">${escapeHtml(o.orderNum)}</td>
            <td>${escapeHtml(o.items)}</td>
            <td>${escapeHtml(o.date)}</td>
            <td>${escapeHtml(o.amount)}</td>
            <td><span class="badge bg-info text-dark">${escapeHtml(o.status)}</span></td>
            <td class="text-end"><a href="#" class="btn btn-sm btn-outline-dark">View Details</a></td>
          </tr>
        `).join('');
      }
    }

    // Render Payment Methods for Active Profile
    const paymentContainer = document.getElementById('savedPaymentMethodsList');
    if (paymentContainer) {
      const userPayments = paymentMethods.filter(p => p.email.toLowerCase() === currentUser.email.toLowerCase());
      if (userPayments.length === 0) {
        paymentContainer.innerHTML = `<div class="p-3 text-muted text-center">No payment methods saved yet. Complete a checkout to record one.</div>`;
      } else {
        paymentContainer.innerHTML = userPayments.map(p => `
          <div class="list-group-item d-flex justify-content-between align-items-center py-3">
            <div>
              <i class="bi bi-credit-card-2-front fs-4 text-primary me-3"></i>
              ${escapeHtml(p.type)} ending in <span class="font-monospace fw-bold">${escapeHtml(p.last4)}</span>
            </div>
            ${p.isDefault ? '<span class="badge bg-light text-dark border">Default</span>' : ''}
          </div>
        `).join('');
      }
    }
  }

  // Sign Out Handler
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      localStorage.removeItem('rgb_current_user');
      alert('Signed out successfully!');
      location.reload();
    });
  }

  // Registration Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = escapeHtml(document.getElementById('registerName').value.trim());
      const email = escapeHtml(document.getElementById('registerEmail').value.trim());
      const password = document.getElementById('registerPassword').value;

      let users = JSON.parse(localStorage.getItem('rgb_users')) || [];
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        alert('An account with this email already exists!');
        return;
      }

      const newUser = { name, email, password, address: "123 Luxury Lane", city: "Johannesburg", postalCode: "2196" };
      users.push(newUser);
      localStorage.setItem('rgb_users', JSON.stringify(users));
      localStorage.setItem('rgb_current_user', JSON.stringify(newUser));

      alert('Account created and logged in successfully!');
      location.reload();
    });
  }

  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = escapeHtml(document.getElementById('loginEmail').value.trim());
      const password = document.getElementById('loginPassword').value;

      let users = JSON.parse(localStorage.getItem('rgb_users')) || [];
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (foundUser) {
        localStorage.setItem('rgb_current_user', JSON.stringify(foundUser));
        alert(`Welcome back, ${foundUser.name}!`);
        location.reload();
      } else {
        alert('Invalid email or password.');
      }
    });
  }

  // Update Password
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUser) { alert('Please log in first.'); return; }
      const currentPass = document.getElementById('currentPassword').value;
      const newPass = document.getElementById('newPassword').value;

      if (currentUser.password && currentUser.password !== currentPass) {
        alert('Current password is incorrect.');
        return;
      }

      currentUser.password = newPass;
      localStorage.setItem('rgb_current_user', JSON.stringify(currentUser));

      let users = JSON.parse(localStorage.getItem('rgb_users')) || [];
      users = users.map(u => u.email === currentUser.email ? currentUser : u);
      localStorage.setItem('rgb_users', JSON.stringify(users));

      alert('Password updated successfully!');
      changePasswordForm.reset();
    });
  }

  // Update Email
  const changeEmailForm = document.getElementById('changeEmailForm');
  if (changeEmailForm) {
    changeEmailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUser) { alert('Please log in first.'); return; }
      const newEmail = escapeHtml(document.getElementById('newEmail').value.trim());

      let users = JSON.parse(localStorage.getItem('rgb_users')) || [];
      if (users.some(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
        alert('This email is already taken by another account.');
        return;
      }

      currentUser.email = newEmail;
      localStorage.setItem('rgb_current_user', JSON.stringify(currentUser));

      users = users.map(u => u.name === currentUser.name ? currentUser : u);
      localStorage.setItem('rgb_users', JSON.stringify(users));

      alert('Email updated successfully!');
      location.reload();
    });
  }
}

/* ========================================================
   9. HERO LIGHTBOX
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

function plusHeroSlides(n) { showHeroSlides(heroSlideIndex += n); }
function currentHeroSlide(n) { showHeroSlides(heroSlideIndex = n); }

function showHeroSlides(n) {
  var slides = document.getElementsByClassName("heroSlides");
  var dots = document.getElementsByClassName("demo-thumb");
  var captionText = document.getElementById("heroCaption");

  if (!slides.length) return;

  if (n > slides.length) { heroSlideIndex = 1; }
  if (n < 1) { heroSlideIndex = slides.length; }

  for (var i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
  for (var j = 0; j < dots.length; j++) { dots[j].className = dots[j].className.replace(" active", ""); }

  slides[heroSlideIndex - 1].style.display = "block";
  if (dots[heroSlideIndex - 1]) { dots[heroSlideIndex - 1].className += " active"; }
  
  const activeImg = slides[heroSlideIndex - 1].querySelector("img");
  if (captionText && activeImg) { captionText.innerHTML = escapeHtml(activeImg.alt); }
}

function initLightbox() {
  const modal = document.getElementById("heroLightboxModal");
  if (modal) {
    modal.addEventListener("click", function(event) {
      if (event.target === this) { closeLightbox(); }
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") { closeLightbox(); }
    });
  }
}

/* ========================================================
   10. SOCIAL MEDIA IFRAME MODAL HANDLER
   ======================================================== */

// Determine base path for iframe files depending on whether caller page is in Assets/ or root
function getSocialIframePath(filename) {
  const isSubfolder = window.location.pathname.includes('/Assets/') || window.location.pathname.includes('\\Assets\\');
  return isSubfolder ? filename : `Assets/${filename}`;
}

function openSocialModal(platform) {
  const modal = document.getElementById("socialIframeModal");
  const iframe = document.getElementById("socialIframe");
  const title = document.getElementById("socialModalTitle");

  const socialConfig = {
    instagram: {
      title: '<i class="bi bi-instagram me-2 text-danger"></i> Royal Glam Instagram Feed',
      url: getSocialIframePath('instagram-preview.html')
    },
    facebook: {
      title: '<i class="bi bi-facebook me-2 text-primary"></i> Royal Glam Facebook Page',
      url: getSocialIframePath('facebook-preview.html')
    },
    tiktok: {
      title: '<i class="bi bi-tiktok me-2 text-light"></i> Royal Glam TikTok Channel',
      url: getSocialIframePath('tiktok-preview.html')
    }
  };

  if (modal && iframe && socialConfig[platform]) {
    title.innerHTML = socialConfig[platform].title;
    iframe.src = socialConfig[platform].url;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }
}

function closeSocialModal() {
  const modal = document.getElementById("socialIframeModal");
  const iframe = document.getElementById("socialIframe");

  if (modal && iframe) {
    modal.style.display = "none";
    iframe.src = ""; // Clear src to stop background audio/video playback
    document.body.style.overflow = "auto";
  }
}

// Close social modal when clicking outside the content container
window.addEventListener("click", function(event) {
  const modal = document.getElementById("socialIframeModal");
  if (event.target === modal) {
    closeSocialModal();
  }
});