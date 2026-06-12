    // data-trial links scroll to pack selector
    document.querySelectorAll('[data-trial]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('trial').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // ── CART ──────────────────────────────────────────────────────────
    const CART_KEY = 'newt_cart_v4'; // v4: supply-based lineup (14-day / 1-month / 2-month)
    const PRODUCTS = {
      '14pack': { name: '14-Day Supply',  servings: '14 servings', price: 39,  shopifyVariantId: '53492076019991' },
      '30pack': { name: '1-Month Supply', servings: '30 servings', price: 65,  shopifyVariantId: '53492080804119' },
      '60pack': { name: '2-Month Supply', servings: '60 servings', price: 109, shopifyVariantId: null }  // TODO: create 60-stick product in Shopify, add variant ID + matching price
    };

    function getCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
      catch(e) { return []; }
    }
    function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

    function addToCart(packId) {
      const cart = getCart();
      const existing = cart.find(i => i.packId === packId);
      if (existing) { existing.qty++; }
      else { cart.push({ packId, qty: 1 }); }
      saveCart(cart);
      renderCart();
      openCartDrawer();
    }
    function removeFromCart(packId) {
      saveCart(getCart().filter(i => i.packId !== packId));
      renderCart();
    }
    function updateQty(packId, delta) {
      const cart = getCart();
      const item = cart.find(i => i.packId === packId);
      if (!item) return;
      item.qty = Math.max(0, item.qty + delta);
      if (item.qty === 0) { removeFromCart(packId); return; }
      saveCart(cart);
      renderCart();
    }
    function getTotal() {
      return getCart().reduce((s, i) => {
        const p = PRODUCTS[i.packId];
        return s + ((p && p.price) || 0) * i.qty;
      }, 0);
    }
    function getItemCount() { return getCart().reduce((s, i) => s + i.qty, 0); }

    function getCheckoutUrl() {
      const cart = getCart();
      const checkoutItems = cart.filter(i => PRODUCTS[i.packId]?.shopifyVariantId);
      if (!checkoutItems.length) return 'https://newt-9643.myshopify.com';
      const items = checkoutItems.map(i => `${PRODUCTS[i.packId].shopifyVariantId}:${i.qty}`).join(',');
      return `https://newt-9643.myshopify.com/cart/${items}`;
    }

    function renderCart() {
      const cart = getCart();
      const count = getItemCount();
      const cartItems = document.getElementById('cartItems');
      const cartEmptyState = document.getElementById('cartEmptyState');
      const cartFooter = document.getElementById('cartFooter');
      const cartTotal = document.getElementById('cartTotal');
      const cartHeaderCount = document.getElementById('cartHeaderCount');
      const navCartCount = document.getElementById('navCartCount');
      const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

      cartHeaderCount.textContent = count;
      navCartCount.textContent = count;
      navCartCount.classList.toggle('visible', count > 0);

      if (cart.length === 0) {
        cartItems.innerHTML = '';
        cartEmptyState.style.display = 'flex';
        cartFooter.style.display = 'none';
        return;
      }

      cartEmptyState.style.display = 'none';
      cartFooter.style.display = 'block';
      cartTotal.textContent = '$' + getTotal();
      cartCheckoutBtn.href = getCheckoutUrl();

      cartItems.innerHTML = cart.map(item => {
        const p = PRODUCTS[item.packId];
        if (!p) return '';
        const itemPrice = p.price * item.qty;
        return `
          <div class="cart-item">
            <div class="cart-item-icon">🦎</div>
            <div class="cart-item-info">
              <p class="cart-item-name">${p.name}</p>
              <p class="cart-item-sub">${p.servings} · one-time purchase</p>
              <div class="cart-qty-row">
                <button class="cart-qty-btn" onclick="updateQty('${item.packId}',-1)" aria-label="Remove one">−</button>
                <span class="cart-qty-num">${item.qty}</span>
                <button class="cart-qty-btn" onclick="updateQty('${item.packId}',1)" aria-label="Add one">+</button>
              </div>
            </div>
            <span class="cart-item-price">$${itemPrice}</span>
          </div>`;
      }).join('');
    }

    function openCartDrawer() {
      document.getElementById('cartDrawer').classList.add('open');
      document.getElementById('cartOverlay').classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeCartDrawer() {
      document.getElementById('cartDrawer').classList.remove('open');
      document.getElementById('cartOverlay').classList.remove('open');
      document.body.style.overflow = '';
    }

    // Add to cart
    document.querySelectorAll('[data-pack-id]').forEach(btn => {
      btn.addEventListener('click', function() {
        const packId = this.dataset.packId;
        if (!packId) return;
        this.classList.remove('cart-added');
        void this.offsetWidth;
        this.classList.add('cart-added');
        addToCart(packId);
      });
    });

    // Cart open/close events
    document.getElementById('navCartBtn').addEventListener('click', openCartDrawer);
    document.getElementById('cartClose').addEventListener('click', closeCartDrawer);
    document.getElementById('cartOverlay').addEventListener('click', closeCartDrawer);
    document.getElementById('cartContinueBtn').addEventListener('click', closeCartDrawer);

    // Init cart on load
    renderCart();

    // Community modal
    const communityModal = document.getElementById('communityModal');
    function openCommunity() {
      document.getElementById('communityForm').style.display = 'block';
      document.getElementById('communityConfirm').style.display = 'none';
      document.getElementById('communityEmail').value = '';
      communityModal.classList.add('open');
    }
    function closeCommunity() { communityModal.classList.remove('open'); }
    document.getElementById('openCommunity').addEventListener('click', openCommunity);
    document.getElementById('communityClose').addEventListener('click', closeCommunity);
    communityModal.addEventListener('click', e => { if (e.target === communityModal) closeCommunity(); });
    document.getElementById('communitySubmit').addEventListener('click', () => {
      const email = document.getElementById('communityEmail').value.trim();
      if (!email || !email.includes('@')) {
        document.getElementById('communityEmail').focus();
        return;
      }
      // Submit to Shopify customer capture (tags the email as a newsletter signup)
      const body = new URLSearchParams({
        form_type: 'customer',
        utf8: '✓',
        'contact[email]': email,
        'contact[tags]': 'newsletter,website'
      });
      fetch('https://newt-9643.myshopify.com/contact', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      }).catch(() => {});
      // Show confirmation state
      document.getElementById('communityForm').style.display = 'none';
      document.getElementById('communityConfirm').style.display = 'block';
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeCommunity(); closeCartDrawer(); }
    });


    // Hamburger menu
    const navHamburger = document.getElementById('navHamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');

    function openMobileMenu() {
      mobileMenu.classList.add('open');
      navHamburger.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
      mobileMenu.classList.remove('open');
      navHamburger.classList.remove('open');
      document.body.style.overflow = '';
    }

    navHamburger.addEventListener('click', () => {
      mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });
    mobileMenuClose.addEventListener('click', closeMobileMenu);
    mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
    mobileMenu.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobileMenu();
    });

    // Scroll reveal via IntersectionObserver
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal:not(.hero-reveal)').forEach(el => revealObs.observe(el));

    // Hero elements animate on page load (staggered)
    document.querySelectorAll('.hero-reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 80 + i * 130);
    });
