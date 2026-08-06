/* =============================================================
   LUMEA BEAUTY — catálogo de productos (desde Google Sheets)
   ============================================================= */

// 👉 Pega aquí el link de "Publicar en la web" en formato CSV
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyY-cfIwnpbLeW6HPkx46N6HbI3dp627oD0zxFfIxFfJyHvOsz3_65mQ2H2uYSCEc-3V75yJcrO562/pub?output=csv";

let PRODUCTS = { capilares: [], perfumes: [], mascarillas: [], ropa: [] };
let currentFilter = "all";
let currentSearch = "";

const SUBCATEGORY_LABELS = {
  shampoo: "Shampoo",
  acondicionador: "Acondicionador",
  "termoprotector-tonico-capilar": "Termoprotector / Tónico",
  mascarilla: "Mascarillas",
  perfumes: "Perfumes",
};

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* parser simple de CSV que respeta comas dentro de comillas */
function parseCSV(text) {
  const rows = [];
  let row = [],
    field = "",
    inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i],
      next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (field !== "" || row.length) {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        }
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length && r.some((v) => v.trim() !== ""));
}

/* ---------- estado de carga (loading / error) ---------- */
function showLoading() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = `
    <div class="state-msg">
      <span class="state-spinner"></span>
      <p>Cargando productos...</p>
    </div>`;
}

function showError() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = `
    <div class="state-msg">
      <p>No pudimos cargar el catálogo. Revisa tu conexión e intenta de nuevo.</p>
      <button class="btn btn-outline" onclick="location.reload()">Reintentar</button>
    </div>`;
}

async function loadProducts() {
  showLoading();
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error("Respuesta no válida del servidor");
    const csvText = await res.text();
    const rows = parseCSV(csvText);
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const data = rows.slice(1);

    const grouped = { capilares: [], perfumes: [], mascarillas: [], ropa: [] };
    data.forEach((cols) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = (cols[i] || "").trim()));
      if (!obj.id || !obj.category) return;
      if (obj.active && obj.active.toLowerCase() === "no") return;

      const product = {
        id: obj.id,
        name: obj.name,
        desc: obj.desc,
        price: parseFloat(obj.price) || 0,
        img: obj.img || null,
        subcategory: obj.subcategory || null,
        inStock: !(obj.stock && obj.stock.toLowerCase() === "no"),
        sizes: obj.sizes
          ? obj.sizes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      };
      const categories = obj.category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      categories.forEach((cat) => {
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(product);
      });
    });
    PRODUCTS = grouped;
  } catch (e) {
    console.error("No se pudo cargar el catálogo desde Google Sheets:", e);
    PRODUCTS = null; // marca que hubo error
  }
}

/* promesa global que otros scripts (cart.js) pueden esperar */
window.PRODUCTS_READY = loadProducts();

function renderCategory(category) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  if (PRODUCTS === null) {
    showError();
    return;
  }

  let items = PRODUCTS[category] || [];
  if (currentFilter !== "all")
    items = items.filter((p) => p.subcategory === currentFilter);
  if (currentSearch.trim() !== "") {
    const term = currentSearch.trim().toLowerCase();
    items = items.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.desc || "").toLowerCase().includes(term),
    );
  }

  if (items.length === 0) {
    grid.innerHTML =
      currentSearch.trim() !== ""
        ? '<p class="empty-msg">No encontramos productos que coincidan con tu búsqueda.</p>'
        : '<p class="empty-msg">Pronto agregaremos productos aquí. Vuelve pronto ✨</p>';
    return;
  }

  grid.innerHTML = items
    .map((p) => {
      const safeName = escapeHtml(p.name);
      const safeDesc = escapeHtml(p.desc);
      const safeImg = escapeHtml(p.img);
      const safeId = escapeHtml(p.id);

      return `
    <article class="product-card${p.inStock ? "" : " out-of-stock"}">
      <div class="product-media">
        ${
          p.img
            ? `<img src="${safeImg}" alt="${safeName}" loading="lazy">`
            : `<span class="initial">${safeName.charAt(0)}</span>`
        }
        ${!p.inStock ? `<span class="stock-badge">Agotado</span>` : ""}
      </div>
      <div class="product-body">
        <h3>${safeName}</h3>
        <p class="desc">${safeDesc}</p>
        ${
          p.sizes
            ? `
          <select class="size-select" id="size-${safeId}" ${!p.inStock ? "disabled" : ""}>
            ${p.sizes.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("")}
          </select>
        `
            : ""
        }
        <div class="product-foot">
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="add-btn" data-id="${safeId}" ${!p.inStock ? "disabled" : ""} onclick="addToCart('${safeId}', ${p.sizes ? `document.getElementById('size-${safeId}').value` : "null"})">
            ${p.inStock ? "Agregar" : "Agotado"}
          </button>
        </div>
      </div>
    </article>
  `;
    })
    .join("");
}

function renderSubcategoryFilters(category) {
  const wrap = document.getElementById("subcatFilters");
  if (!wrap || PRODUCTS === null) return;
  const items = PRODUCTS[category] || [];
  const present = [...new Set(items.map((p) => p.subcategory).filter(Boolean))];
  if (present.length === 0) {
    wrap.style.display = "none";
    return;
  }

  wrap.innerHTML = `
    <button class="filter-btn active" data-filter="all">Todos</button>
    ${present.map((s) => `<button class="filter-btn" data-filter="${s}">${SUBCATEGORY_LABELS[s] || s}</button>`).join("")}
  `;

  wrap.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderCategory(category);
    });
  });
}

function setupSearch(category) {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    currentSearch = input.value;
    renderCategory(category);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.PRODUCTS_READY;
  const category = document.body.dataset.category;
  if (category) {
    renderSubcategoryFilters(category);
    setupSearch(category);
    renderCategory(category);
  }
});
