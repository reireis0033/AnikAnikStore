(function () {
  "use strict";

  const categories = [
    "Genshin Impact", "Honkai Star Rail", "Honkai Impact",
    "Wuthering Waves", "Zenless Zone Zero", "Anime",
    "Game", "Chix", "Betlog", "NSFW"
  ];

  const BASE_URL = "https://reireis0033.github.io/DatabasengANIKANIK/";
  const JSON_URL = "data.json";

  const grid = document.getElementById("grid");
  const filterList = document.getElementById("filterList");
  const sortList = document.getElementById("sortList");
  const emptyState = document.getElementById("emptyState");
  const emptyText = document.getElementById("emptyText");
  const resetBtn = document.getElementById("resetBtn");

  const lightboxOverlay = document.getElementById("lightboxOverlay");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxPrice = document.getElementById("lightboxPrice");
  const lightboxDescription = document.getElementById("lightboxDescription");
  const lightboxClose = document.getElementById("lightboxClose");

  let selectedCats = new Set();
  let sortOrder = "asc";
  let items = [];
  let loadToken = 0;

  function buildAllCheckbox() {
    const row = document.createElement("label");
    row.className = "filter-row filter-row-all";
    row.innerHTML = '<input type="checkbox" checked><span>All</span>';

    const box = row.querySelector("input");
    box.addEventListener("change", () => {
      if (box.checked) {
        selectedCats.clear();
        syncCheckboxes();
        render();
      } else {
        box.checked = true;
      }
    });

    row.dataset.role = "all";
    return row;
  }

  function buildCatCheckbox(cat) {
    const row = document.createElement("label");
    row.className = "filter-row";

    const box = document.createElement("input");
    box.type = "checkbox";

    const label = document.createElement("span");
    label.textContent = cat;

    row.append(box, label);
    row.dataset.cat = cat;

    box.addEventListener("change", () => {
      if (box.checked) {
        selectedCats.add(cat);
      } else {
        selectedCats.delete(cat);
      }
      syncCheckboxes();
      render();
    });

    return row;
  }

  function buildFilters() {
    filterList.replaceChildren(buildAllCheckbox());
    categories.forEach(cat => filterList.appendChild(buildCatCheckbox(cat)));
  }

  function syncCheckboxes() {
    const allBox = filterList.querySelector('[data-role="all"] input');
    if (allBox) allBox.checked = selectedCats.size === 0;

    categories.forEach(cat => {
      const row = Array.from(filterList.querySelectorAll("[data-cat]"))
        .find(el => el.dataset.cat === cat);
      if (row) {
        row.querySelector("input").checked = selectedCats.has(cat);
      }
    });
  }

  function getPrice(item) {
    const value = Number.parseFloat(String(item.price ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  }

  function matches(item) {
    return selectedCats.size === 0 || selectedCats.has(item.cat);
  }

  function render() {
    const list = items.filter(matches);

    list.sort((a, b) => {
      const priceDifference = getPrice(a) - getPrice(b);

      if (Number.isFinite(priceDifference) && priceDifference !== 0) {
        return sortOrder === "desc" ? -priceDifference : priceDifference;
      }

      return sortOrder === "desc" ? b.id - a.id : a.id - b.id;
    });

    const myToken = ++loadToken;
    grid.replaceChildren();

    if (list.length === 0) {
      emptyState.style.display = "block";
      grid.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    grid.style.display = "";

    const queue = [];

    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "card card-pending";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "View " + item.title);

      const img = document.createElement("img");
      img.alt = item.title;
      card.appendChild(img);

      const overlay = document.createElement("div");
      overlay.className = "card-overlay";

      const bottom = document.createElement("div");
      bottom.className = "card-bottom";

      const title = document.createElement("p");
      title.className = "card-title";
      title.textContent = item.title;

      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = item.cat;

      bottom.append(title, tag);
      overlay.appendChild(bottom);
      card.appendChild(overlay);

      card.addEventListener("click", () => openLightbox(item));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(item);
        }
      });

      grid.appendChild(card);
      queue.push({ item, img, card });
    });

    loadNext(queue, 0, myToken);
  }

  function loadNext(queue, index, myToken) {
    if (myToken !== loadToken || index >= queue.length) return;

    const { item, img, card } = queue[index];

    const advance = () => loadNext(queue, index + 1, myToken);

    img.addEventListener("load", () => {
      if (myToken !== loadToken) return;
      card.classList.remove("card-pending");
      card.classList.add("card-loaded");
      advance();
    }, { once: true });

    img.addEventListener("error", () => {
      if (myToken !== loadToken) return;

      console.warn("Image failed to load:", item.src);
      card.classList.remove("card-pending");
      card.classList.add("card-broken", "card-loaded");

      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(
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

  function openLightbox(item) {
    lightboxImg.src = item.src;
    lightboxImg.alt = item.title;
    lightboxTitle.textContent = item.title;
    lightboxPrice.textContent = item.price ? `₱${item.price}` : "Price not set";
    lightboxDescription.textContent = item.description || "No description yet.";
    lightboxOverlay.classList.add("open");
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightboxOverlay.classList.remove("open");
    lightboxImg.removeAttribute("src");
  }

  lightboxClose.addEventListener("click", closeLightbox);

  lightboxOverlay.addEventListener("click", event => {
    if (event.target === lightboxOverlay) closeLightbox();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && lightboxOverlay.classList.contains("open")) {
      closeLightbox();
    }
  });

  resetBtn.addEventListener("click", () => {
    selectedCats.clear();
    sortOrder = "asc";

    const asc = sortList.querySelector('input[value="asc"]');
    if (asc) asc.checked = true;

    syncCheckboxes();
    render();
  });

  sortList.querySelectorAll('input[name="sortOrder"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        sortOrder = radio.value;
        render();
      }
    });
  });

  const hamChrome = document.getElementById("hamburgerChrome");
  const chromeFlyout = document.getElementById("chromeFlyout");
  const chromeFlyoutClose = document.getElementById("chromeFlyoutClose");
  const refreshBtn = document.getElementById("refreshBtn");

  function toggleFlyout() {
    const isOpen = chromeFlyout.classList.toggle("open");
    hamChrome.setAttribute("aria-expanded", String(isOpen));
  }

  function closeFlyout() {
    chromeFlyout.classList.remove("open");
    hamChrome.setAttribute("aria-expanded", "false");
  }

  hamChrome.addEventListener("click", event => {
    event.stopPropagation();
    toggleFlyout();
  });

  chromeFlyoutClose.addEventListener("click", closeFlyout);

  document.addEventListener("click", event => {
    if (
      chromeFlyout.classList.contains("open") &&
      !chromeFlyout.contains(event.target) &&
      event.target !== hamChrome
    ) {
      closeFlyout();
    }
  });

  refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.add("spin");
    window.location.reload();
  });

  const flyoutContactsBtn = document.getElementById("flyoutContactsBtn");
  const contactsOverlay = document.getElementById("contactsOverlay");
  const contactsClose = document.getElementById("contactsClose");

  function openContacts() {
    closeFlyout();
    contactsOverlay.classList.add("open");
    contactsClose.focus();
  }

  function closeContacts() {
    contactsOverlay.classList.remove("open");
  }

  flyoutContactsBtn.addEventListener("click", openContacts);
  contactsClose.addEventListener("click", closeContacts);

  contactsOverlay.addEventListener("click", event => {
    if (event.target === contactsOverlay) closeContacts();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && contactsOverlay.classList.contains("open")) {
      closeContacts();
    }
  });

  function normalize(rawItems) {
    if (!Array.isArray(rawItems)) {
      throw new Error("data.json must contain an array");
    }

    items = rawItems
      .map((item, index) => ({
        id: index + 1,
        title: String(item.title || "Untitled"),
        cat: String(item.cat || "Illustration"),
        price: item.price ?? "",
        description: String(item.description || ""),
        tags: Array.isArray(item.tags) ? item.tags : [],
        date: item.date || null,
        file: String(item.file || "").trim()
      }))
      .filter(item => item.file)
      .map(item => ({
        ...item,
        src: BASE_URL + encodeURIComponent(item.file)
      }));

    render();
  }

  async function loadFromJson() {
    const response = await fetch(JSON_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load ${JSON_URL} (${response.status})`);
    }

    return response.json();
  }

  async function init() {
    try {
      const data = await loadFromJson();
      normalize(data);
    } catch (error) {
      console.error("Failed to load portfolio data:", error);
      emptyState.style.display = "block";
      grid.style.display = "none";
      emptyText.textContent =
        "Couldn't load the image data right now. Try refreshing the page.";
    }
  }

  buildFilters();
  init();
})();
