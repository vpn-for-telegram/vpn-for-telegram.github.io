(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const header = $('[data-header]');
  const setHeaderState = () => {
    if (!header) return;
    const y = window.scrollY || 0;
    header.style.boxShadow = y > 10 ? '0 8px 32px rgba(0,0,0,.35)' : 'none';
  };
  window.addEventListener('scroll', setHeaderState, { passive: true });
  setHeaderState();

  const setHeaderHeightVar = () => {
    if (!header) return;
    const h = header.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty('--header-h', `${Math.ceil(h)}px`);
  };
  window.addEventListener('resize', setHeaderHeightVar);
  setHeaderHeightVar();

  const progress = $('.scroll-progress span');
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (scrolled / max) * 100 : 0;
    if (progress) progress.style.width = `${p}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const scrollToTarget = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $$('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-scroll-to');
      if (t) scrollToTarget(t);
    });
  });

  const themeBtn = $('[data-theme-toggle]');
  const THEME_KEY = 'vpn-telegram-theme';
  const applyTheme = (t) => {
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  };
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);
  themeBtn?.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  const burger = $('[data-burger]');
  const drawer = $('[data-drawer]');
  const drawerPanel = drawer?.querySelector('.drawer__panel');
  let isOpen = false;
  let scrollY = 0;

  const lockScroll = () => {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  };
  const unlockScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollY);
    document.documentElement.style.scrollBehavior = '';
  };
  const closeOnScrollIntent = (e) => {
    if (e.target.closest('.drawer__links')) return;
    closeDrawer();
  };
  const openDrawer = () => {
    if (!drawer || isOpen) return;
    isOpen = true;
    drawer.classList.add('is-open');
    lockScroll();
    window.addEventListener('wheel', closeOnScrollIntent, { passive: true });
    window.addEventListener('touchmove', closeOnScrollIntent, { passive: true });
  };
  const closeDrawer = () => {
    if (!drawer || !isOpen) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    unlockScroll();
    window.removeEventListener('wheel', closeOnScrollIntent);
    window.removeEventListener('touchmove', closeOnScrollIntent);
  };
  burger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) closeDrawer();
    else openDrawer();
  });
  $$('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer();
    });
  });
  $$('[data-drawer-link]').forEach((el) => el.addEventListener('click', () => closeDrawer()));
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    const clickedInsidePanel = drawerPanel?.contains(e.target);
    const clickedBurger = burger?.contains(e.target);
    if (!clickedInsidePanel && !clickedBurger) closeDrawer();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  const sideLinks = Array.from(document.querySelectorAll('[data-side-link]'));
  const sectionEls = sideLinks
    .map((a) => document.querySelector(a.getAttribute('data-target')))
    .filter(Boolean);
  const setActiveSide = (activeId) => {
    sideLinks.forEach((a) => {
      const t = a.getAttribute('data-target');
      a.classList.toggle('is-active', t === activeId);
    });
  };
  sideLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetSel = a.getAttribute('data-target');
      const el = targetSel ? document.querySelector(targetSel) : null;
      if (!el) return;
      e.preventDefault();
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
      const y = el.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
  if ('IntersectionObserver' in window && sectionEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSide(`#${visible.target.id}`);
      },
      { root: null, threshold: [0.3, 0.5, 0.65], rootMargin: '-18% 0px -52% 0px' }
    );
    sectionEls.forEach((s) => io.observe(s));
  }

  const grid = document.getElementById('vpnGrid');
  const countEl = document.getElementById('vpnCount');
  const $search = document.getElementById('vpnSearch');
  const $platform = document.getElementById('vpnPlatform');
  const $free = document.getElementById('vpnFree');
  const $sort = document.getElementById('vpnSort');

  if (grid) {
    const cards = Array.from(grid.querySelectorAll('[data-vpn]'));
    const getNum = (el, key, def = 0) => {
      const n = parseFloat(el.getAttribute(key));
      return Number.isFinite(n) ? n : def;
    };
    const getStr = (el, key, def = '') => el.getAttribute(key) || def;
    const matchesPlatform = (card, platform) => {
      if (platform === 'all') return true;
      const list = getStr(card, 'data-platforms', '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return list.includes(platform);
    };
    const matchesFree = (card, free) => {
      if (free === 'all') return true;
      const has = getStr(card, 'data-free', 'no') === 'yes';
      return free === 'yes' ? has : !has;
    };
    const matchesSearch = (card, q) => {
      if (!q) return true;
      const hay = (getStr(card, 'data-search', '') + ' ' + card.textContent).toLowerCase();
      return hay.includes(q.toLowerCase());
    };
    const isPinned = (card) => getStr(card, 'data-id') === 'bazavpn';
    const sortCards = (arr, mode) =>
      [...arr].sort((a, b) => {
        const pinDisabled = mode === 'reviews_worst_to_best' || mode === 'rating_asc';
        if (!pinDisabled) {
          if (isPinned(a) && !isPinned(b)) return -1;
          if (!isPinned(a) && isPinned(b)) return 1;
        }
        const ar = getNum(a, 'data-rating');
        const br = getNum(b, 'data-rating');
        const as = getNum(a, 'data-speed');
        const bs = getNum(b, 'data-speed');
        const ap = getNum(a, 'data-price', 999999);
        const bp = getNum(b, 'data-price', 999999);
        const aRev = getNum(a, 'data-reviews');
        const bRev = getNum(b, 'data-reviews');
        switch (mode) {
          case 'rating_desc':
            return br - ar;
          case 'rating_asc':
            return ar - br;
          case 'speed_desc':
            return bs - as;
          case 'price_asc':
            return ap - bp;
          case 'reviews_worst_to_best':
            return aRev - bRev;
          case 'best':
          default:
            return br * 10 + bs - ap * 0.05 - (ar * 10 + as - ap * 0.05);
        }
      });
    const renumber = () => {
      const visible = Array.from(grid.querySelectorAll('[data-vpn]')).filter((el) => !el.hidden);
      visible.forEach((card, i) => {
        const titleEl = card.querySelector('[data-title]');
        if (!titleEl) return;
        const raw = titleEl.textContent.replace(/^\d+\.\s*/, '');
        titleEl.textContent = `${i + 1}. ${raw}`;
      });
    };
    const render = () => {
      const q = ($search?.value || '').trim();
      const platform = $platform?.value || 'all';
      const free = $free?.value || 'all';
      const sortMode = $sort?.value || 'best';
      cards.forEach((card) => {
        card.hidden = !(matchesSearch(card, q) && matchesPlatform(card, platform) && matchesFree(card, free));
      });
      const visible = cards.filter((c) => !c.hidden);
      const sorted = sortCards(visible, sortMode);
      sorted.forEach((card) => grid.appendChild(card));
      cards.filter((c) => c.hidden).forEach((card) => grid.appendChild(card));
      cards.forEach((card) => {
        const pin = card.querySelector('.vpn-card__pin');
        if (!pin) return;
        const pinDisabled = sortMode === 'reviews_worst_to_best' || sortMode === 'rating_asc';
        pin.style.display = isPinned(card) && !pinDisabled ? '' : 'none';
      });
      renumber();
      if (countEl) countEl.textContent = `Показано: ${visible.length}`;
    };
    [$search, $platform, $free, $sort].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    render();
  }

  const table = document.getElementById('compareTable');
  if (table) {
    const headers = Array.from(table.querySelectorAll('th[data-sort]'));
    const tbody = table.querySelector('tbody');
    let currentSort = null;
    let currentDirection = 1;
    const indexMap = { name: 0, rating: 1, servers: 2, free: 4, price: 5, speed: 6 };
    const clearHeaderState = () => headers.forEach((h) => h.classList.remove('is-sorted-asc', 'is-sorted-desc'));
    const getRows = () => Array.from(tbody.querySelectorAll('tr'));
    const clearBest = () =>
      getRows().forEach((r) => Array.from(r.cells).forEach((td) => td.classList.remove('is-best')));
    const markBestValues = () => {
      clearBest();
      const allRows = getRows();
      if (!allRows.length) return;
      headers.forEach((h) => {
        const bestMode = h.getAttribute('data-best');
        if (!bestMode) return;
        const key = h.dataset.sort;
        const idx = indexMap[key];
        if (idx == null) return;
        const values = allRows
          .map((r) => {
            const v = parseFloat(r.cells[idx]?.dataset?.value);
            return Number.isFinite(v) ? v : null;
          })
          .filter((v) => v !== null);
        if (!values.length) return;
        let best;
        if (bestMode === 'min') best = Math.min(...values);
        else if (bestMode === 'yes') best = 1;
        else best = Math.max(...values);
        allRows.forEach((r) => {
          const cell = r.cells[idx];
          if (!cell) return;
          const v = parseFloat(cell.dataset.value);
          if (Number.isFinite(v) && v === best) cell.classList.add('is-best');
        });
      });
    };
    const sortBy = (sortKey) => {
      if (currentSort === sortKey) currentDirection *= -1;
      else {
        currentSort = sortKey;
        currentDirection = 1;
      }
      clearHeaderState();
      const activeHeader = headers.find((h) => h.dataset.sort === currentSort);
      if (activeHeader) activeHeader.classList.add(currentDirection === 1 ? 'is-sorted-asc' : 'is-sorted-desc');
      const rows = getRows();
      rows.sort((a, b) => {
        if (sortKey === 'name') {
          return a.cells[0].innerText.trim().toLowerCase().localeCompare(b.cells[0].innerText.trim().toLowerCase()) * currentDirection;
        }
        const idx = indexMap[sortKey];
        const aNum = parseFloat(a.cells[idx].dataset.value);
        const bNum = parseFloat(b.cells[idx].dataset.value);
        const av = Number.isFinite(aNum) ? aNum : 0;
        const bv = Number.isFinite(bNum) ? bNum : 0;
        return (av - bv) * currentDirection;
      });
      rows.forEach((r) => tbody.appendChild(r));
      markBestValues();
    };
    markBestValues();
    headers.forEach((h) => h.addEventListener('click', () => sortBy(h.dataset.sort)));
  }

  (() => {
    const search = document.querySelector('[data-faq-search]');
    const list = document.querySelector('[data-faq-list]');
    if (!list) return;
    const items = Array.from(list.querySelectorAll('.faq__item'));
    const applyFilter = (q) => {
      const query = (q || '').trim().toLowerCase();
      items.forEach((it) => {
        it.classList.toggle('is-hidden', query && !it.innerText.toLowerCase().includes(query));
      });
    };
    search?.addEventListener('input', (e) => applyFilter(e.target.value));
    items.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        items.forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });
  })();

  (() => {
    const btn = document.querySelector('[data-scroll-top]');
    if (!btn) return;
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();
})();
