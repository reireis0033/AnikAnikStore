(function () {
  const categories = ["Genshin Impact", "Honkai Star Rail","Honkai Impact","Wuthering Waves","Zenless Zone Zero","Anime","Game","Chix","Betlog","NSFW"];
  const BASE_URL = "https://reireis0033.github.io/DatabasengANIKANIK/";
  const XLSX_URL = "data.xlsx"; // preferred — edit this with any spreadsheet app
  const JSON_URL = "data.json"; // used automatically if data.xlsx can't be read

  const grid = document.getElementById('grid');
  const filterList = document.getElementById('filterList');
  const emptyState = document.getElementById('emptyState');
  const resetBtn = document.getElementById('resetBtn');
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxTag = document.getElementById('lightboxTag');
  const lightboxClose = document.getElementById('lightboxClose');

  let selectedCats = new Set(); // empty set == "All"
  let sortOrder = 'asc'; // 'asc' (low to high) or 'desc' (high to low), by item id
  let items = [];
  let loadToken = 0; // bumped every render so stale sequential loads stop themselves

  // ---------------------------------------------------------------
  // Left-side filter checklist
  // ---------------------------------------------------------------
  function buildAllCheckbox() {
    const row = document.createElement('label');
    row.className = 'filter-row filter-row-all';
    row.innerHTML = `<input type="checkbox" checked><span>All</span>`;
    const box = row.querySelector('input');
    box.addEventListener('change', () => {
      if (box.checked) {
        selectedCats.clear();
        syncCheckboxes();
        render();
      } else {
        // "All" can't be manually turned off with nothing else selected
        box.checked = true;
      }
    });
    row.dataset.role = 'all';
    return row;
  }

  function buildCatCheckbox(cat) {
    const row = document.createElement('label');
    row.className = 'filter-row';
    row.innerHTML = `<input type="checkbox"><span>${cat}</span>`;
    const box = row.querySelector('input');
    box.addEventListener('change', () => {
      if (box.checked) {
        selectedCats.add(cat);
      } else {
        selectedCats.delete(cat);
      }
      syncCheckboxes();
      render();
    });
    row.dataset.cat = cat;
    return row;
  }

  function syncCheckboxes() {
    const allBox = filterList.querySelector('[data-role="all"] input');
    allBox.checked = selectedCats.size === 0;
    categories.forEach(cat => {
      const row = filterList.querySelector(`[data-cat="${CSS.escape(cat)}"]`);
      if (row) row.querySelector('input').checked = selectedCats.has(cat);
    });
  }

  filterList.appendChild(buildAllCheckbox());
  categories.forEach(cat => filterList.appendChild(buildCatCheckbox(cat)));

  // ---------------------------------------------------------------
  // Sort control: Low to High / High to Low (by item order)
  // ---------------------------------------------------------------
  const sortList = document.getElementById('sortList');
  sortList.querySelectorAll('input[name="sortOrder"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        sortOrder = radio.value;
        render();
      }
    });
  });

  function matches(item) {
    return selectedCats.size === 0 || selectedCats.has(item.cat);
  }

  // ---------------------------------------------------------------
  // Grid rendering + sequential (one-by-one) image loading
  // ---------------------------------------------------------------
  function render() {
    const list = items.filter(matches);
    list.sort((a, b) => sortOrder === 'desc' ? b.id - a.id : a.id - b.id);
    const myToken = ++loadToken; // invalidates any loader still working from a previous render

    grid.innerHTML = "";

    if (list.length === 0) {
      emptyState.style.display = "block";
      grid.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    grid.style.display = "";

    const queue = [];

    list.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'card card-pending';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View ' + item.title);

      const img = document.createElement('img');
      img.alt = item.title;
      card.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';
      const bottom = document.createElement('div');
      bottom.className = 'card-bottom';
      bottom.innerHTML = `<p class="card-title">${item.title}</p><span class="card-tag">${item.cat}</span>`;
      overlay.appendChild(bottom);
      card.appendChild(overlay);

      card.addEventListener('click', () => openLightbox(item));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(item);
        }
      });

      grid.appendChild(card);
      queue.push({ item, img, card });
    });

    loadNext(queue, 0, myToken);
  }

  function loadNext(queue, i, myToken) {
    if (myToken !== loadToken) return; // a newer filter selection took over
    if (i >= queue.length) return;

    const { item, img, card } = queue[i];

    const advance = () => loadNext(queue, i + 1, myToken);

    img.addEventListener('load', () => {
      if (myToken !== loadToken) return;
      card.classList.remove('card-pending');
      card.classList.add('card-loaded');
      advance();
    }, { once: true });

    img.addEventListener('error', () => {
      if (myToken !== loadToken) return;
      console.warn('Image failed to load:', item.src);
      card.classList.remove('card-pending');
      card.classList.add('card-broken', 'card-loaded');
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
           <rect width="100%" height="100%" fill="#E7E4DB"/>
           <text x="50%" y="50%" font-family="sans-serif" font-size="14"
                 fill="#5C5A54" text-anchor="middle" dy=".3em">Image unavailable</text>
         </svg>`
      );
      advance();
    }, { once: true });

    img.src = item.src;
  }

  // ---------------------------------------------------------------
  // Lightbox
  // ---------------------------------------------------------------
  function openLightbox(item) {
    lightboxImg.src = item.src;
    lightboxImg.alt = item.title;
    lightboxTitle.textContent = item.title;
    lightboxTag.textContent = item.cat;
    lightboxOverlay.classList.add('open');
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightboxOverlay.classList.remove('open');
    lightboxImg.src = "";
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', (e) => {
    if (e.target === lightboxOverlay) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxOverlay.classList.contains('open')) closeLightbox();
  });

  resetBtn.addEventListener('click', () => {
    selectedCats.clear();
    syncCheckboxes();
    render();
  });

  // ---------------------------------------------------------------
  // Chrome bar: hamburger -> flyout menu, refresh button
  // ---------------------------------------------------------------
  const hamChrome = document.getElementById('hamburgerChrome');
  const chromeFlyout = document.getElementById('chromeFlyout');
  const chromeFlyoutClose = document.getElementById('chromeFlyoutClose');
  const refreshBtn = document.getElementById('refreshBtn');

  function toggleFlyout() {
    const isOpen = chromeFlyout.classList.toggle('open');
    hamChrome.setAttribute('aria-expanded', isOpen);
  }
  function closeFlyout() {
    chromeFlyout.classList.remove('open');
    hamChrome.setAttribute('aria-expanded', 'false');
  }
  hamChrome.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFlyout();
  });
  chromeFlyoutClose.addEventListener('click', closeFlyout);
  document.addEventListener('click', (e) => {
    if (chromeFlyout.classList.contains('open') && !chromeFlyout.contains(e.target) && e.target !== hamChrome) {
      closeFlyout();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chromeFlyout.classList.contains('open')) closeFlyout();
  });

  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spin');
    window.location.reload();
  });

  // ---------------------------------------------------------------
  // Contacts popup, opened from the "Contacts" item in the burger menu
  // ---------------------------------------------------------------
  const flyoutContactsBtn = document.getElementById('flyoutContactsBtn');
  const contactsOverlay = document.getElementById('contactsOverlay');
  const contactsClose = document.getElementById('contactsClose');

  function openContacts() {
    closeFlyout();
    contactsOverlay.classList.add('open');
    contactsClose.focus();
  }
  function closeContacts() {
    contactsOverlay.classList.remove('open');
  }
  flyoutContactsBtn.addEventListener('click', openContacts);
  contactsClose.addEventListener('click', closeContacts);
  contactsOverlay.addEventListener('click', (e) => {
    if (e.target === contactsOverlay) closeContacts();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactsOverlay.classList.contains('open')) closeContacts();
  });

  // ---------------------------------------------------------------
  // Load image data: try data.xlsx first (via SheetJS), fall back to data.json
  // ---------------------------------------------------------------
  function normalize(rawItems) {
    items = rawItems.map((item, index) => ({
      id: index + 1,
      title: item.title || "Untitled",
      cat: item.cat || "Illustration",
      tags: item.tags || [],
      date: item.date || null,
      src: BASE_URL + item.file,
    }));
    render();
  }

  function loadFromXlsx() {
    return fetch(XLSX_URL)
      .then(res => {
        if (!res.ok) throw new Error(`No ${XLSX_URL} (${res.status})`);
        return res.arrayBuffer();
      })
      .then(buf => {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS did not load');
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        return rows.map(row => ({
          file: String(row.file || row.File || "").trim(),
          title: String(row.title || row.Title || "").trim(),
          cat: String(row.cat || row.Category || row.category || "").trim(),
          tags: String(row.tags || row.Tags || "")
            .split(",")
            .map(t => t.trim())
            .filter(Boolean),
        })).filter(r => r.file);
      });
  }

  function loadFromJson() {
    return fetch(JSON_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Could not load ${JSON_URL} (${res.status})`);
        return res.json();
      });
  }

  loadFromXlsx()
    .then(normalize)
    .catch(xlsxErr => {
      console.warn('Falling back to data.json —', xlsxErr.message);
      loadFromJson()
        .then(normalize)
        .catch(err => {
          console.error('Failed to load portfolio data:', err);
          emptyState.style.display = "block";
          grid.style.display = "none";
          document.getElementById('emptyText').textContent =
            "Couldn't load the image data right now. Try refreshing the page.";
        });
    });
})();
