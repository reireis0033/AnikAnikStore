
(function () {
  "use strict";

  // Your image database
  const BASE_URL =
    "https://reireis0033.github.io/DatabasengANIKANIK/";

  // Your store data
  const JSON_URL = "./data.json";

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

  let items = [];
  let selectedCats = new Set();
  let sortOrder = "asc";

  // --------------------------------------------------
  // PRICE
  // --------------------------------------------------

  function getPrice(item) {
    const value = parseFloat(
      String(item.price || "").replace(/[^\d.-]/g, "")
    );

    return Number.isFinite(value) ? value : Infinity;
  }

  // --------------------------------------------------
  // FILTERS
  // --------------------------------------------------

  function buildFilters() {
    filterList.innerHTML = "";

    // All
    const allRow = document.createElement("label");
    allRow.className = "filter-row filter-row-all";

    const allCheckbox = document.createElement("input");
    allCheckbox.type = "checkbox";
    allCheckbox.checked = true;

    const allText = document.createElement("span");
    allText.textContent = "All";

    allRow.appendChild(allCheckbox);
    allRow.appendChild(allText);
    filterList.appendChild(allRow);

    allCheckbox.addEventListener("change", function () {
      if (this.checked) {
        selectedCats.clear();
        syncFilters();
        render();
      } else {
        this.checked = true;
      }
    });

    // Get categories DIRECTLY from JSON
    const categories = [
      ...new Set(
        items
          .map(item => item.cat)
          .filter(Boolean)
      )
    ];

    categories.forEach(category => {
      const row = document.createElement("label");
      row.className = "filter-row";
      row.dataset.cat = category;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";

      const text = document.createElement("span");
      text.textContent = category;

      row.appendChild(checkbox);
      row.appendChild(text);
      filterList.appendChild(row);

      checkbox.addEventListener("change", function () {
        if (this.checked) {
          selectedCats.add(category);
        } else {
          selectedCats.delete(category);
        }

        syncFilters();
        render();
      });
    });
  }

  function syncFilters() {
    const allCheckbox =
      filterList.querySelector('[data-role="all"] input') ||
      filterList.querySelector(".filter-row-all input");

    if (allCheckbox) {
      allCheckbox.checked = selectedCats.size === 0;
    }

    filterList.querySelectorAll("[data-cat]").forEach(row => {
      const category = row.dataset.cat;
      const checkbox = row.querySelector("input");

      checkbox.checked = selectedCats.has(category);
    });
  }

  // --------------------------------------------------
  // FILTER MATCHING
  // --------------------------------------------------

  function matches(item) {
    return (
      selectedCats.size === 0 ||
      selectedCats.has(item.cat)
    );
  }

  // --------------------------------------------------
  // RENDER PRODUCTS
  // --------------------------------------------------

  function render() {
    let list = items.filter(matches);

    // Sort by price
    list.sort((a, b) => {
      const priceA = getPrice(a);
      const priceB = getPrice(b);

      if (priceA !== priceB) {
        return sortOrder === "asc"
          ? priceA - priceB
          : priceB - priceA;
      }

      return a.id - b.id;
    });

    grid.innerHTML = "";

    if (list.length === 0) {
      grid.style.display = "none";
      emptyState.style.display = "block";

      emptyText.textContent =
        "No images in this category yet.";

      return;
    }

    grid.style.display = "";
    emptyState.style.display = "none";

    list.forEach(item => {
      const card = document.createElement("div");

      card.className = "card card-loaded";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute(
        "aria-label",
        "View " + item.title
      );

      // IMAGE
      const img = document.createElement("img");

      img.src =
        BASE_URL +
        encodeURIComponent(item.file);

      img.alt = item.title;

      img.onerror = function () {
        console.error(
          "Could not load image:",
          img.src
        );

        card.classList.add("card-broken");
      };

      card.appendChild(img);

      // OVERLAY
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

      bottom.appendChild(title);
      bottom.appendChild(tag);

      overlay.appendChild(bottom);
      card.appendChild(overlay);

      // OPEN LIGHTBOX
      card.addEventListener("click", function () {
        openLightbox(item);
      });

      card.addEventListener("keydown", function (event) {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openLightbox(item);
        }
      });

      grid.appendChild(card);
    });
  }

  // --------------------------------------------------
  // LIGHTBOX
  // --------------------------------------------------

  function openLightbox(item) {
    lightboxImg.src =
      BASE_URL +
      encodeURIComponent(item.file);

    lightboxImg.alt = item.title;

    lightboxTitle.textContent =
      item.title || "Untitled";

    if (item.price !== "") {
      lightboxPrice.textContent =
        "₱" + item.price;
    } else {
      lightboxPrice.textContent =
        "Price not set";
    }

    lightboxDescription.textContent =
      item.description ||
      "No description yet.";

    lightboxOverlay.classList.add("open");

    lightboxClose.focus();
  }

  function closeLightbox() {
    lightboxOverlay.classList.remove("open");
    lightboxImg.removeAttribute("src");
  }

  lightboxClose.addEventListener(
    "click",
    closeLightbox
  );

  lightboxOverlay.addEventListener(
    "click",
    function (event) {
      if (event.target === lightboxOverlay) {
        closeLightbox();
      }
    }
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Escape" &&
        lightboxOverlay.classList.contains("open")
      ) {
        closeLightbox();
      }
    }
  );

  // --------------------------------------------------
  // SORT
  // --------------------------------------------------

  sortList
    .querySelectorAll(
      'input[name="sortOrder"]'
    )
    .forEach(radio => {
      radio.addEventListener(
        "change",
        function () {
          if (this.checked) {
            sortOrder = this.value;
            render();
          }
        }
      );
    });

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  resetBtn.addEventListener(
    "click",
    function () {
      selectedCats.clear();

      sortOrder = "asc";

      const ascending =
        sortList.querySelector(
          'input[value="asc"]'
        );

      if (ascending) {
        ascending.checked = true;
      }

      syncFilters();
      render();
    }
  );

  // --------------------------------------------------
  // HAMBURGER MENU
  // --------------------------------------------------

  const hamburger =
    document.getElementById(
      "hamburgerChrome"
    );

  const flyout =
    document.getElementById(
      "chromeFlyout"
    );

  const flyoutClose =
    document.getElementById(
      "chromeFlyoutClose"
    );

  const refresh =
    document.getElementById(
      "refreshBtn"
    );

  function toggleFlyout() {
    const open =
      flyout.classList.toggle("open");

    hamburger.setAttribute(
      "aria-expanded",
      String(open)
    );
  }

  function closeFlyout() {
    flyout.classList.remove("open");

    hamburger.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  hamburger.addEventListener(
    "click",
    function (event) {
      event.stopPropagation();
      toggleFlyout();
    }
  );

  flyoutClose.addEventListener(
    "click",
    closeFlyout
  );

  document.addEventListener(
    "click",
    function (event) {
      if (
        flyout.classList.contains("open") &&
        !flyout.contains(event.target) &&
        event.target !== hamburger
      ) {
        closeFlyout();
      }
    }
  );

  refresh.addEventListener(
    "click",
    function () {
      window.location.reload();
    }
  );

  // --------------------------------------------------
  // CONTACTS
  // --------------------------------------------------

  const contactsButton =
    document.getElementById(
      "flyoutContactsBtn"
    );

  const contactsOverlay =
    document.getElementById(
      "contactsOverlay"
    );

  const contactsClose =
    document.getElementById(
      "contactsClose"
    );

  function openContacts() {
    closeFlyout();

    contactsOverlay.classList.add("open");

    contactsClose.focus();
  }

  function closeContacts() {
    contactsOverlay.classList.remove(
      "open"
    );
  }

  contactsButton.addEventListener(
    "click",
    openContacts
  );

  contactsClose.addEventListener(
    "click",
    closeContacts
  );

  contactsOverlay.addEventListener(
    "click",
    function (event) {
      if (
        event.target === contactsOverlay
      ) {
        closeContacts();
      }
    }
  );

  // --------------------------------------------------
  // LOAD JSON
  // --------------------------------------------------

  async function loadData() {
    try {
      const response =
        await fetch(JSON_URL, {
          cache: "no-store"
        });

      if (!response.ok) {
        throw new Error(
          "data.json returned HTTP " +
          response.status
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "data.json must contain an array"
        );
      }

      items = data
        .map((item, index) => ({
          id: index + 1,

          file: String(
            item.file || ""
          ).trim(),

          title: String(
            item.title ||
            "Untitled"
          ).trim(),

          cat: String(
            item.cat ||
            "Uncategorized"
          ).trim(),

          price:
            item.price === null ||
            item.price === undefined
              ? ""
              : String(item.price).trim(),

          description: String(
            item.description || ""
          ).trim(),

          tags: Array.isArray(
            item.tags
          )
            ? item.tags
            : []
        }))
        .filter(item => item.file);

      // Build categories from JSON
      buildFilters();

      // Display everything
      render();

      console.log(
        "Loaded products:",
        items
      );

    } catch (error) {
      console.error(
        "Failed to load data.json:",
        error
      );

      grid.style.display = "none";
      emptyState.style.display = "block";

      emptyText.textContent =
        "Couldn't load data.json. Please check that data.json is in the same folder as index.html.";
    }
  }

  // START
  loadData();

})();

