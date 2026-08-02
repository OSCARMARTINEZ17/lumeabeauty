/* =============================================================
   LUMEA BEAUTY — catálogo de productos (desde Google Sheets)
   ============================================================= */

// 👉 Pega aquí el link de "Publicar en la web" en formato CSV
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyY-cfIwnpbLeW6HPkx46N6HbI3dp627oD0zxFfIxFfJyHvOsz3_65mQ2H2uYSCEc-3V75yJcrO562/pub?output=csv";

let PRODUCTS = { capilares: [], perfumes: [], ropa: [] };

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

async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csvText = await res.text();
    const rows = parseCSV(csvText);
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const data = rows.slice(1);

    const grouped = { capilares: [], perfumes: [], ropa: [] };
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
        sizes: obj.sizes
          ? obj.sizes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      };
      if (!grouped[obj.category]) grouped[obj.category] = [];
      grouped[obj.category].push(product);
    });
    PRODUCTS = grouped;
  } catch (e) {
    console.error("No se pudo cargar el catálogo desde Google Sheets:", e);
  }
}

/* promesa global que otros scripts (cart.js) pueden esperar */
window.PRODUCTS_READY = loadProducts();

function renderCategory(category) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const items = PRODUCTS[category] || [];

  if (items.length === 0) {
    grid.innerHTML =
      '<p class="empty-msg">Pronto agregaremos productos aquí. Vuelve pronto ✨</p>';
    return;
  }

  grid.innerHTML = items
    .map(
      (p) => `
    <article class="product-card">
      <div class="product-media">
        ${
          p.img
            ? `<img src="${p.img}" alt="${p.name}" loading="lazy">`
            : `<span class="initial">${p.name.charAt(0)}</span>`
        }
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        ${
          p.sizes
            ? `
          <select class="size-select" id="size-${p.id}">
            ${p.sizes.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
        `
            : ""
        }
        <div class="product-foot">
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="add-btn" data-id="${p.id}" onclick="addToCart('${p.id}', ${p.sizes ? `document.getElementById('size-${p.id}').value` : "null"})">Agregar</button>
        </div>
      </div>
    </article>
  `,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.PRODUCTS_READY) await window.PRODUCTS_READY;
  injectCartUI();
});