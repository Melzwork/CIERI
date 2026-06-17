/* CIERI theme JS — ported from the static prototype.
   NOTE: the cart drawer here is prototype-only. To make Add to Cart work,
   rewire these handlers to Shopify's AJAX Cart API (/cart/add.js, /cart.js).
   Checkout itself is handled natively by Shopify. */

// Scroll lock - prevents background scroll when overlays are open
  // Uses overflow:hidden on html which doesn't break visual layout
  let scrollLockCount = 0;
  let savedScrollY = 0;

  function lockScroll() {
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      // Compensate for scrollbar disappearing on desktop to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }
    }
    scrollLockCount++;
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  const header = document.querySelector('header');
  const announcement = document.querySelector('.announcement');

  function updateHeader() {
    const scrollY = window.scrollY;

    // Pages with no dark hero: header is always solid (skip scroll-progress fade)
    if (document.body.classList.contains('page-light')) {
      if (scrollY > 80) {
        announcement.classList.add('hidden');
        header.classList.add('announcement-hidden');
      } else {
        announcement.classList.remove('hidden');
        header.classList.remove('announcement-hidden');
      }
      return;
    }

    const heroHeight = window.innerHeight * 0.7;
    const progress = Math.min(Math.max(scrollY / heroHeight, 0), 1);
    header.style.setProperty('--scroll-progress', progress);

    if (scrollY > 80) {
      announcement.classList.add('hidden');
      header.classList.add('announcement-hidden');
    } else {
      announcement.classList.remove('hidden');
      header.classList.remove('announcement-hidden');
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateHeader();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => observer.observe(el));

  // Hotspot toggle
  document.querySelectorAll('.hotspot').forEach(hotspot => {
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = hotspot.dataset.target;
      const card = document.getElementById(targetId);
      document.querySelectorAll('.hotspot-card').forEach(c => {
        if (c !== card) c.classList.remove('active');
      });
      card.classList.toggle('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hotspot') && !e.target.closest('.hotspot-card')) {
      document.querySelectorAll('.hotspot-card').forEach(c => c.classList.remove('active'));
    }
  });

  // Nav dropdown — hover (desktop) + click (universal fallback)
  const overlay = document.querySelector('[data-overlay]');
  const triggers = document.querySelectorAll('[data-dropdown-trigger]');
  const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function closeAllDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('[data-dropdown-trigger]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    if (overlay) overlay.classList.remove('active');
  }

  function activateDefaultSub(dropdown) {
    // Shop dropdown opens with Categories pre-selected so options are immediately visible
    if (dropdown.dataset.dropdown === 'shop') {
      document.querySelectorAll('.nested-sub').forEach(s => {
        s.classList.toggle('active', s.dataset.nestedSub === 'categories');
      });
      document.querySelectorAll('.nested-root-item').forEach(b => {
        b.classList.toggle('active', b.dataset.nestedGo === 'categories');
      });
    }
  }

  function openDropdown(trigger, dropdown) {
    closeAllDropdowns();
    dropdown.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    if (overlay) overlay.classList.add('active');
    activateDefaultSub(dropdown);
  }

  triggers.forEach(trigger => {
    const key = trigger.dataset.dropdownTrigger;
    const dropdown = document.querySelector('[data-dropdown="' + key + '"]');
    if (!dropdown) return;

    // CLICK — always works (essential for touch + accessibility)
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        closeAllDropdowns();
      } else {
        openDropdown(trigger, dropdown);
      }
    });

    // HOVER — only on devices with real hover capability (skip on touch)
    if (hasHover) {
      let openTimer = null;
      let closeTimer = null;
      const OPEN_DELAY = 120;   // anti-jitter when crossing the nav
      const CLOSE_DELAY = 250;  // grace period to cross to the dropdown panel

      const scheduleOpen = () => {
        clearTimeout(closeTimer);
        if (dropdown.classList.contains('open')) return;
        openTimer = setTimeout(() => openDropdown(trigger, dropdown), OPEN_DELAY);
      };
      const scheduleClose = () => {
        clearTimeout(openTimer);
        closeTimer = setTimeout(() => {
          if (dropdown.classList.contains('open')) {
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            if (overlay) overlay.classList.remove('active');
          }
        }, CLOSE_DELAY);
      };

      trigger.addEventListener('mouseenter', scheduleOpen);
      trigger.addEventListener('mouseleave', scheduleClose);
      dropdown.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      dropdown.addEventListener('mouseleave', scheduleClose);
    }
  });

  if (overlay) overlay.addEventListener('click', closeAllDropdowns);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-dropdown]') && !e.target.closest('[data-dropdown-trigger]')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });

  // NESTED DROPDOWN (Shop menu) — root nav persistent, sub-column expands
  function showNestedSub(key) {
    document.querySelectorAll('.nested-sub').forEach(s => {
      s.classList.toggle('active', s.dataset.nestedSub === key);
    });
    document.querySelectorAll('.nested-root-item').forEach(b => {
      b.classList.toggle('active', b.dataset.nestedGo === key);
    });
  }

  // Reset when dropdown closes
  const shopDropdown = document.querySelector('[data-dropdown="shop"]');
  if (shopDropdown) {
    const obs = new MutationObserver(() => {
      if (!shopDropdown.classList.contains('open')) {
        setTimeout(() => {
          document.querySelectorAll('.nested-sub').forEach(s => s.classList.remove('active'));
          document.querySelectorAll('.nested-root-item').forEach(b => b.classList.remove('active'));
        }, 350);
      }
    });
    obs.observe(shopDropdown, { attributes: true, attributeFilter: ['class'] });
  }

  document.querySelectorAll('[data-nested-go]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showNestedSub(btn.dataset.nestedGo);
    });
    // Also trigger on hover for desktop UX
    btn.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        showNestedSub(btn.dataset.nestedGo);
      }
    });
  });

  // SEARCH DRAWER
  const searchDrawer = document.querySelector('[data-search-drawer]');
  const searchOverlay = document.querySelector('[data-search-overlay]');
  const searchOpenTriggers = document.querySelectorAll('[data-search-open]');
  const searchCloseBtn = document.querySelector('[data-search-close]');
  const searchInput = document.querySelector('[data-search-input]');
  const searchDefaultView = document.querySelector('[data-search-default]');
  const searchResultsView = document.querySelector('[data-search-results]');
  const searchResultsGrid = document.querySelector('[data-search-results-grid]');
  const searchResultsLabel = document.querySelector('[data-search-results-label]');
  const searchNoResults = document.querySelector('[data-search-no-results]');
  const searchNoResultsTerm = document.querySelector('[data-search-noresults-term]');
  const searchSuggestions = document.querySelectorAll('.search-suggestion');

  // Mock product catalog for demo search
  const mockProducts = [
    { name: 'The Wrap Top', price: '$95', img: 'pi-1', tags: ['wrap', 'top', 'silk', 'oat'] },
    { name: 'The Bias Skirt', price: '$120', img: 'pi-3', tags: ['bias', 'skirt', 'silk', 'espresso'] },
    { name: 'The Slip Camisole', price: '$85', img: 'pi-2', tags: ['slip', 'camisole', 'silk', 'oat', 'alice blue'] },
    { name: 'The Linen Trouser', price: '$155', img: 'pi-4', tags: ['linen', 'trouser', 'oat', 'espresso'] },
    { name: 'The Knot Top', price: '$110', img: 'pi-5', tags: ['knot', 'top', 'cotton', 'oat', 'lemon'] },
    { name: 'The Boat Neck', price: '$95', img: 'pi-7', tags: ['boat neck', 'top', 'cotton', 'oat'] },
    { name: 'The Halter Blouse', price: '$105', img: 'pi-3', tags: ['halter', 'blouse', 'silk', 'oat', 'blush'] },
    { name: 'The Wrap Dress', price: '$185', img: 'pi-1', tags: ['wrap', 'dress', 'silk', 'cherry'] },
    { name: 'The Linen Shirt', price: '$135', img: 'pi-4', tags: ['linen', 'shirt', 'oat', 'pebble'] },
    { name: 'The Cashmere Cardigan', price: '$295', img: 'pi-6', tags: ['cashmere', 'cardigan', 'oat'] },
  ];

  function openSearchDrawer() {
    if (!searchDrawer) return;
    searchDrawer.classList.add('open');
    searchDrawer.setAttribute('aria-hidden', 'false');
    if (searchOverlay) searchOverlay.classList.add('active');
    lockScroll();
    setTimeout(() => searchInput && searchInput.focus(), 200);
  }

  function closeSearchDrawer() {
    if (!searchDrawer) return;
    searchDrawer.classList.remove('open');
    searchDrawer.setAttribute('aria-hidden', 'true');
    if (searchOverlay) searchOverlay.classList.remove('active');
    unlockScroll();
    if (searchInput) searchInput.value = '';
    showSearchDefault();
  }

  function showSearchDefault() {
    if (searchDefaultView) searchDefaultView.hidden = false;
    if (searchResultsView) searchResultsView.hidden = true;
  }

  function showSearchResults(term) {
    if (searchDefaultView) searchDefaultView.hidden = true;
    if (searchResultsView) searchResultsView.hidden = false;

    const q = term.toLowerCase();
    const matches = mockProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))
    );

    if (searchResultsLabel) {
      searchResultsLabel.textContent = matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' for "' + term + '"';
    }

    if (matches.length === 0) {
      if (searchResultsGrid) searchResultsGrid.innerHTML = '';
      if (searchNoResults) searchNoResults.hidden = false;
      if (searchNoResultsTerm) searchNoResultsTerm.textContent = term;
    } else {
      if (searchNoResults) searchNoResults.hidden = true;
      if (searchResultsGrid) {
        searchResultsGrid.innerHTML = matches.map(p => `
          <a href="/collections/all" class="search-product">
            <div class="search-product-image ${p.img}"></div>
            <div class="search-product-info">
              <span class="search-product-name">${p.name}</span>
              <span class="search-product-price">${p.price}</span>
            </div>
          </a>
        `).join('');
      }
    }
  }

  if (searchOpenTriggers.length) {
    searchOpenTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        // Close mobile drawer first if it's open (this trigger could be inside it)
        if (typeof closeMobileDrawer === 'function') closeMobileDrawer();
        openSearchDrawer();
      });
    });
  }

  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearchDrawer);
  if (searchOverlay) searchOverlay.addEventListener('click', closeSearchDrawer);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.length === 0) {
        showSearchDefault();
      } else {
        showSearchResults(val);
      }
    });
  }

  // Click suggestion = fill input + show results
  searchSuggestions.forEach(s => {
    s.addEventListener('click', () => {
      const term = s.dataset.searchTerm;
      if (searchInput) searchInput.value = term;
      showSearchResults(term);
    });
  });

  // Close search on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearchDrawer();
  });

  // Currency picker
  const currencyTrigger = document.querySelector('.currency-trigger');
  const currencyLabel = document.querySelector('[data-current-currency]');
  const currencySearch = document.querySelector('[data-currency-search]');
  const countryList = document.querySelector('[data-country-list]');
  const countryEmpty = document.querySelector('[data-country-empty]');
  const countryButtons = countryList ? countryList.querySelectorAll('button') : [];

  // Mark default as active
  countryButtons.forEach(btn => {
    if (btn.dataset.country === 'United States') btn.classList.add('active');
  });

  // Filter list as user types
  if (currencySearch) {
    currencySearch.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      let visible = 0;
      countryButtons.forEach(btn => {
        const name = btn.dataset.country.toLowerCase();
        const code = (btn.dataset.currency || '').toLowerCase();
        const matches = !q || name.includes(q) || code.includes(q);
        btn.parentElement.style.display = matches ? '' : 'none';
        if (matches) visible++;
      });
      if (countryEmpty) countryEmpty.hidden = visible > 0;
    });
  }

  // Click a country in header to select
  countryButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveCurrency(btn.dataset.country, btn.dataset.currency);
      closeAllDropdowns();
      // Reset search filter
      if (currencySearch) {
        currencySearch.value = '';
        countryButtons.forEach(b => b.parentElement.style.display = '');
        if (countryEmpty) countryEmpty.hidden = true;
      }
    });
  });

  // Auto-focus search when currency dropdown opens
  if (currencyTrigger) {
    currencyTrigger.addEventListener('click', () => {
      setTimeout(() => {
        const dropdown = document.querySelector('[data-dropdown="currency"]');
        if (dropdown && dropdown.classList.contains('open') && currencySearch) {
          currencySearch.focus();
        }
      }, 100);
    });
  }

  // Footer currency picker - same behavior, opens upward
  const footerTrigger = document.querySelector('[data-footer-currency-trigger]');
  const footerDropdown = document.querySelector('[data-footer-dropdown]');
  const footerCurrencyLabel = document.querySelector('[data-footer-current-currency]');
  const footerCountryLabel = document.querySelector('[data-footer-current-country]');
  const footerCurrencySearch = document.querySelector('[data-footer-currency-search]');
  const footerCountryList = document.querySelector('[data-footer-country-list]');
  const footerCountryButtons = footerCountryList ? footerCountryList.querySelectorAll('button') : [];
  const footerModalOverlay = document.querySelector('[data-footer-modal-overlay]');
  const footerModalClose = document.querySelector('[data-footer-modal-close]');

  function closeFooterDropdown() {
    if (footerDropdown) {
      footerDropdown.classList.remove('open');
      if (footerTrigger) footerTrigger.setAttribute('aria-expanded', 'false');
      if (footerModalOverlay) footerModalOverlay.classList.remove('active');
      unlockScroll();
    }
  }

  function openFooterDropdown() {
    if (footerDropdown) {
      closeAllDropdowns();
      closeSearchDrawer();
      footerDropdown.classList.add('open');
      if (footerTrigger) footerTrigger.setAttribute('aria-expanded', 'true');
      if (footerModalOverlay) footerModalOverlay.classList.add('active');
      lockScroll();
      setTimeout(() => footerCurrencySearch && footerCurrencySearch.focus(), 100);
    }
  }

  if (footerTrigger) {
    footerTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (footerDropdown.classList.contains('open')) {
        closeFooterDropdown();
      } else {
        openFooterDropdown();
      }
    });
  }

  // Close on modal close button
  if (footerModalClose) {
    footerModalClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeFooterDropdown();
    });
  }

  // Close on overlay click
  if (footerModalOverlay) {
    footerModalOverlay.addEventListener('click', closeFooterDropdown);
  }

  // Footer search filter
  if (footerCurrencySearch) {
    footerCurrencySearch.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      let visible = 0;
      footerCountryButtons.forEach(btn => {
        const name = btn.dataset.country.toLowerCase();
        const code = (btn.dataset.currency || '').toLowerCase();
        const matches = !q || name.includes(q) || code.includes(q);
        btn.parentElement.style.display = matches ? '' : 'none';
        if (matches) visible++;
      });
    });
  }

  // Helper: sync both header and footer when a country is selected anywhere
  function setActiveCurrency(country, currency) {
    if (currencyLabel) currencyLabel.textContent = currency;
    if (footerCurrencyLabel) footerCurrencyLabel.textContent = currency;
    if (footerCountryLabel) footerCountryLabel.textContent = '· ' + country;
    // Mark active in both lists
    countryButtons.forEach(b => b.classList.toggle('active', b.dataset.country === country));
    footerCountryButtons.forEach(b => b.classList.toggle('active', b.dataset.country === country));
  }

  // Footer country buttons
  footerCountryButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setActiveCurrency(btn.dataset.country, btn.dataset.currency);
      closeFooterDropdown();
      if (footerCurrencySearch) {
        footerCurrencySearch.value = '';
        footerCountryButtons.forEach(b => b.parentElement.style.display = '');
      }
    });
  });

  // Close footer dropdown on outside click
  document.addEventListener('click', (e) => {
    if (footerDropdown && footerDropdown.classList.contains('open') &&
        !e.target.closest('[data-footer-dropdown]') &&
        !e.target.closest('[data-footer-currency-trigger]')) {
      closeFooterDropdown();
    }
  });

  // Close footer dropdown on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFooterDropdown();
  });

  // Featured scroller arrow buttons (with loop)
  const featuredScroller = document.querySelector('.featured-scroller');
  const featuredPrev = document.querySelector('.featured-scroll-prev');
  const featuredNext = document.querySelector('.featured-scroll-next');

  if (featuredScroller && featuredPrev && featuredNext) {
    const scrollByAmount = () => {
      const firstCard = featuredScroller.querySelector('.product-card');
      if (!firstCard) return 400;
      const cardWidth = firstCard.offsetWidth;
      const gap = parseFloat(getComputedStyle(featuredScroller).gap) || 24;
      return (cardWidth + gap) * 2; // scroll 2 cards at a time
    };

    const isAtEnd = () => {
      return featuredScroller.scrollLeft >= featuredScroller.scrollWidth - featuredScroller.clientWidth - 5;
    };
    const isAtStart = () => {
      return featuredScroller.scrollLeft <= 5;
    };

    featuredPrev.addEventListener('click', () => {
      if (isAtStart()) {
        // Loop: jump to the far right (end)
        featuredScroller.scrollTo({
          left: featuredScroller.scrollWidth - featuredScroller.clientWidth,
          behavior: 'smooth'
        });
      } else {
        featuredScroller.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' });
      }
    });

    featuredNext.addEventListener('click', () => {
      if (isAtEnd()) {
        // Loop: jump back to the start
        featuredScroller.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        featuredScroller.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
      }
    });
  }

  // Mobile drawer
  const mobileDrawer = document.querySelector('[data-mobile-drawer]');
  const mobileDrawerOverlay = document.querySelector('[data-mobile-drawer-overlay]');
  const mobileOpen = document.querySelector('[data-mobile-menu-open]');
  const mobileClose = document.querySelector('[data-mobile-menu-close]');
  const mobileSubmenuToggles = document.querySelectorAll('[data-mobile-submenu]');
  const mobileCurrencyTrigger = document.querySelector('[data-mobile-currency-trigger]');

  function openMobileDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.add('open');
      mobileDrawer.setAttribute('aria-hidden', 'false');
      if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('active');
      lockScroll();
    }
  }

  function closeMobileDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('open');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('active');
      unlockScroll();
    }
  }

  if (mobileOpen) mobileOpen.addEventListener('click', openMobileDrawer);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileDrawer);
  if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener('click', closeMobileDrawer);

  // Submenu accordion
  mobileSubmenuToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const key = toggle.dataset.mobileSubmenu;
      const panel = document.querySelector('[data-mobile-submenu-panel="' + key + '"]');
      toggle.classList.toggle('open');
      if (panel) panel.classList.toggle('open');
    });
  });

  // Mobile currency trigger opens the footer modal (reuse same modal)
  if (mobileCurrencyTrigger) {
    mobileCurrencyTrigger.addEventListener('click', () => {
      closeMobileDrawer();
      setTimeout(() => openFooterDropdown(), 200);
    });
  }

  // Close drawer on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileDrawer();
  });

  // CART DRAWER
  const cartDrawer = document.querySelector('[data-cart-drawer]');
  const cartOverlay = document.querySelector('[data-cart-overlay]');
  const cartCloseButtons = document.querySelectorAll('[data-cart-close]');
  const cartTriggers = document.querySelectorAll('a[href="#"]'); // We'll filter below
  const cartBody = document.querySelector('[data-cart-body]');
  const cartEmptyState = document.querySelector('[data-cart-empty]');
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartDrawerCountEl = document.querySelector('[data-cart-drawer-count]');
  const cartHeaderCountEl = document.querySelector('.cart-count');
  const cartSubtotalEl = document.querySelector('[data-cart-subtotal]');

  function openCartDrawer() {
    if (cartDrawer) {
      cartDrawer.classList.add('open');
      cartDrawer.setAttribute('aria-hidden', 'false');
      if (cartOverlay) cartOverlay.classList.add('active');
      lockScroll();
    }
  }

  function closeCartDrawer() {
    if (cartDrawer) {
      cartDrawer.classList.remove('open');
      cartDrawer.setAttribute('aria-hidden', 'true');
      if (cartOverlay) cartOverlay.classList.remove('active');
      unlockScroll();
    }
  }

  // Find cart links by their content "Cart"
  document.querySelectorAll('a').forEach(link => {
    const text = (link.textContent || '').trim();
    if (text.startsWith('Cart') || text === 'Cart (0)') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileDrawer();
        openCartDrawer();
      });
    }
  });

  cartCloseButtons.forEach(btn => btn.addEventListener('click', closeCartDrawer));
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCartDrawer();
  });

  // Cart item interactions - mock state for the mockup
  function recalcCart() {
    const items = document.querySelectorAll('.cart-item');
    let subtotal = 0;
    let count = 0;
    items.forEach(item => {
      const priceText = item.querySelector('.cart-item-price').textContent;
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      const qty = parseInt(item.querySelector('.qty-value').textContent, 10) || 0;
      subtotal += price * qty;
      count += qty;
    });

    if (cartSubtotalEl) cartSubtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (cartDrawerCountEl) cartDrawerCountEl.textContent = '(' + count + ')';
    if (cartHeaderCountEl) cartHeaderCountEl.textContent = count;

    // Toggle empty state
    const cartYmal = document.querySelector('[data-cart-ymal]');
    if (count === 0) {
      if (cartItemsContainer) cartItemsContainer.style.display = 'none';
      if (cartEmptyState) cartEmptyState.hidden = false;
      if (cartYmal) cartYmal.hidden = true;
    } else {
      if (cartItemsContainer) cartItemsContainer.style.display = '';
      if (cartEmptyState) cartEmptyState.hidden = true;
      if (cartYmal) cartYmal.hidden = false;
    }
  }

  // Wire quantity + and -
  document.querySelectorAll('.cart-item').forEach(item => {
    const qtyEl = item.querySelector('.qty-value');
    const buttons = item.querySelectorAll('.qty-btn');
    if (buttons.length === 2) {
      buttons[0].addEventListener('click', () => {
        const v = parseInt(qtyEl.textContent, 10);
        if (v > 1) { qtyEl.textContent = v - 1; recalcCart(); }
      });
      buttons[1].addEventListener('click', () => {
        const v = parseInt(qtyEl.textContent, 10);
        qtyEl.textContent = v + 1;
        recalcCart();
      });
    }

    // Wire remove
    const removeBtn = item.querySelector('.cart-item-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        setTimeout(() => { item.remove(); recalcCart(); }, 300);
      });
    }
  });

  // Initial calculation
  recalcCart();
/* ===== Customer Care: sidebar tabs + accordion (restored) ===== */
document.querySelectorAll('.sidebar-link').forEach(function (link) {
  link.addEventListener('click', function () {
    var target = link.dataset.tab;
    if (!target) return;
    document.querySelectorAll('.sidebar-link').forEach(function (l) { l.classList.remove('active'); });
    link.classList.add('active');
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
    var panel = document.querySelector('[data-panel="' + target + '"]');
    if (panel) panel.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
if (window.location.hash) {
  var h = window.location.hash.substring(1);
  var tl = document.querySelector('.sidebar-link[data-tab="' + h + '"]');
  if (tl) tl.click();
}
document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
  trigger.addEventListener('click', function () {
    var item = trigger.closest('.accordion-item');
    if (item) item.classList.toggle('open');
  });
});

/* ===== Product page: variant selection + recommendations carousel ===== */
(function () {
  var form = document.querySelector('[data-product-form]');
  if (form) {
    var dataEl = form.querySelector('[data-variant-json]');
    var variants = dataEl ? (JSON.parse(dataEl.textContent).variants || []) : [];
    var idInput = form.querySelector('[data-variant-id]');
    var addBtn = form.querySelector('[data-add-to-bag]');
    var priceEl = document.querySelector('.product-price');

    function selected() {
      var sel = {};
      form.querySelectorAll('.color-swatch.active, .size-btn.active').forEach(function (b) {
        sel[b.dataset.optionPosition] = b.dataset.color || b.dataset.size;
      });
      return sel;
    }
    function match(sel) {
      return variants.find(function (v) {
        return Object.keys(sel).every(function (p) { return v['option' + p] === sel[p]; });
      });
    }
    var heroMap = {};
    var heroEl = document.querySelector('[data-hero]');
    var heroJson = document.querySelector('[data-hero-map]');
    if (heroJson) { try { heroMap = JSON.parse(heroJson.textContent) || {}; } catch (e) { heroMap = {}; } }
    function setHero(color, instant) {
      if (!heroEl) return;
      var url = heroMap[(color || '').toLowerCase()];
      if (!url) return;
      heroEl.style.backgroundImage = 'url(' + url + ')';
      var g = document.querySelector('[data-gallery]');
      if (g) g.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    }
    function update() {
      var v = match(selected()) || variants[0];
      if (!v) return null;
      if (idInput) idInput.value = v.id;
      if (priceEl) priceEl.textContent = v.price;
      if (addBtn) {
        addBtn.disabled = !v.available;
        addBtn.textContent = v.available ? 'Add to bag' : 'Sold out';
      }
      return v;
    }
    form.querySelectorAll('.color-swatch').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        form.querySelectorAll('.color-swatch').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var cur = document.querySelector('[data-current-color]');
        if (cur) cur.textContent = '\u00b7 ' + b.dataset.color;
        update();
        setHero(b.dataset.color);
      });
    });
    form.querySelectorAll('.size-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        form.querySelectorAll('.size-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        update();
      });
    });
    if (form.querySelector('.color-swatch') && !form.querySelector('.color-swatch.active')) {
      var firstSw = form.querySelector('.color-swatch:not([disabled])') || form.querySelector('.color-swatch');
      firstSw.classList.add('active');
      var cur0 = document.querySelector('[data-current-color]');
      if (cur0) cur0.textContent = '\u00b7 ' + firstSw.dataset.color;
    }
    update();
    var activeSw = form.querySelector('.color-swatch.active');
    setHero(activeSw ? activeSw.dataset.color : '', true);
  }

  // Recommendations carousel
  var track = document.querySelector('[data-ymal-track]');
  var prev = document.querySelector('[data-ymal-prev]');
  var next = document.querySelector('[data-ymal-next]');
  if (track && prev && next) {
    function cardW() { var c = track.querySelector('.ymal-card'); return c ? c.getBoundingClientRect().width + 16 : 300; }
    function arrows() {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -cardW() * 2, behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: cardW() * 2, behavior: 'smooth' }); });
    track.addEventListener('scroll', arrows);
    arrows();
  }
})();

/* ===== Product gallery: vertical carousel dots ===== */
(function () {
  var gal = document.querySelector('[data-gallery]');
  var dotsWrap = document.querySelector('[data-gallery-dots]');
  if (!gal || !dotsWrap) return;
  var imgs = gal.querySelectorAll('.gallery-img');
  if (imgs.length < 2) return;
  dotsWrap.innerHTML = '';
  imgs.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    b.setAttribute('aria-label', 'Image ' + (i + 1));
    dotsWrap.appendChild(b);
  });
  var dots = dotsWrap.querySelectorAll('.gallery-dot');
  var raf;
  gal.addEventListener('scroll', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      var pos = gal.scrollTop, best = -1, bd = 1e9;
      imgs.forEach(function (im, i) {
        if (im.style.display === 'none') return;
        var d = Math.abs(im.offsetTop - pos);
        if (d < bd) { bd = d; best = i; }
      });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === best); });
    });
  });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () {
      if (imgs[i]) gal.scrollTo({ top: imgs[i].offsetTop, behavior: 'smooth' });
    });
  });
})();


/* ===== COLLECTION TOOLBAR ===== */
(function(){
  var sortWrap = document.querySelector('[data-sort-wrap]');
  if (sortWrap) {
    var trigger = sortWrap.querySelector('[data-sort-trigger]');
    trigger.addEventListener('click', function(e){
      e.stopPropagation();
      sortWrap.classList.toggle('open');
      trigger.setAttribute('aria-expanded', sortWrap.classList.contains('open'));
    });
    document.addEventListener('click', function(){ sortWrap.classList.remove('open'); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') sortWrap.classList.remove('open'); });
  }
  var fOpen = document.querySelector('[data-filter-open]');
  var fDrawer = document.querySelector('[data-filter-drawer]');
  var fOverlay = document.querySelector('[data-filter-overlay]');
  var fClose = document.querySelector('[data-filter-close]');
  function openF(){ if(fDrawer){ fDrawer.classList.add('open'); fOverlay.classList.add('active'); } }
  function closeF(){ if(fDrawer){ fDrawer.classList.remove('open'); fOverlay.classList.remove('active'); } }
  if (fOpen) fOpen.addEventListener('click', openF);
  if (fClose) fClose.addEventListener('click', closeF);
  if (fOverlay) fOverlay.addEventListener('click', closeF);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeF(); });
  // active filter count badge
  var badge = document.querySelector('[data-filter-count]');
  if (badge && fDrawer) {
    var n = fDrawer.querySelectorAll('input[type=checkbox]:checked').length;
    if (n > 0) { badge.textContent = n; badge.classList.remove('hidden'); }
  }
})();


/* ===== PRICE RANGE SLIDER ===== */
(function(){
  document.querySelectorAll('[data-price-slider]').forEach(function(box){
    var minR = box.querySelector('[data-price-min]');
    var maxR = box.querySelector('[data-price-max]');
    var fill = box.querySelector('[data-range-fill]');
    var minL = box.querySelector('[data-price-min-label]');
    var maxL = box.querySelector('[data-price-max-label]');
    var cur  = box.getAttribute('data-currency') || '';
    var max  = parseFloat(box.getAttribute('data-max')) || 100;
    function paint(){
      var a = Math.min(+minR.value, +maxR.value);
      var b = Math.max(+minR.value, +maxR.value);
      if (+minR.value > +maxR.value) { var t = minR.value; minR.value = maxR.value; maxR.value = t; }
      var lo = (Math.min(+minR.value,+maxR.value)/max)*100;
      var hi = (Math.max(+minR.value,+maxR.value)/max)*100;
      fill.style.left = lo + '%';
      fill.style.width = (hi - lo) + '%';
      minL.textContent = cur + Math.min(+minR.value,+maxR.value);
      maxL.textContent = cur + Math.max(+minR.value,+maxR.value);
    }
    minR.addEventListener('input', paint);
    maxR.addEventListener('input', paint);
    paint();
  });
})();
