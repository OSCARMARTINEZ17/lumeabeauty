/* =============================================================
   LUMEA BEAUTY — catálogo de productos
   Edita aquí nombres, descripciones, precios o agrega productos.
   Cada producto necesita: id (único, sin espacios), name, desc, price
   ============================================================= */
const PRODUCTS = {
  capilares: [
    {
      id: "masc-sos",
      name: "Mascarilla Origen Botánico Bomba S.O.S",
      desc: "Mascarilla capilar botánica de reparación intensiva.",
      price: 28,
    },
    {
      id: "masc-romero",
      name: "Mascarilla Anyeluz Romero",
      desc: "Fortalece la fibra capilar y estimula el crecimiento.",
      price: 25,
    },
    {
      id: "masc-miel-brillo",
      name: "Mascarilla Click Hair Miel Brillo Intenso",
      desc: "Hidratación profunda y brillo intenso.",
      price: 29,
    },
    {
      id: "masc-cebolla",
      name: "Mascarilla Anyeluz de Cebolla",
      desc: "Fortalece la fibra capilar y ayuda a prevenir la caída.",
      price: 29,
    },
    {
      id: "miel-cabello",
      name: "Miel para el Cabello Click Hair",
      desc: "Nutrición y suavidad para todo tipo de cabello.",
      price: 29,
    },
  ],
  perfumes: [
    {
      id: "perf-clickhair",
      name: "Perfume Capilar Click Hair",
      desc: "Fragancia fina y duradera para el cabello.",
      price: 23,
    },
    {
      id: "bronceador",
      name: "Bronceador Origen Botánico",
      desc: "Bronceado natural con ingredientes botánicos.",
      price: 28,
    },
  ],
  ropa: [
    {
      id: "body-larga-aereo",
      name: "Body Seamless Manga Larga Aéreo",
      desc: "Tela aéreo sin costuras, ajuste perfecto.",
      price: 36,
    },
    {
      id: "body-corta-sesgo-1",
      name: "Body Seamless Manga Corta Sesgo",
      desc: "Acabado en sesgo, tela seamless.",
      price: 34,
    },
    {
      id: "body-corta-sesgo-2",
      name: "Body Seamless Manga Corta Sesgo",
      desc: "Acabado en sesgo, tela seamless — variante.",
      price: 33,
    },
    {
      id: "body-corta-aereo-1",
      name: "Body Seamless Manga Corta Aéreo",
      desc: "Tela aéreo transpirable.",
      price: 35,
    },
    {
      id: "body-corta-aereo-2",
      name: "Body Seamless Manga Corta Aéreo",
      desc: "Tela aéreo transpirable — variante.",
      price: 34,
    },
    {
      id: "body-larga-sesgo",
      name: "Body Seamless Manga Larga Sesgo",
      desc: "Acabado en sesgo, manga larga.",
      price: 36,
    },
  ],
};

const CATEGORY_LABELS = {
  capilares: "Capilares",
  perfumes: "Perfumes",
  ropa: "Ropa",
};

function renderCategory(category) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const items = PRODUCTS[category] || [];
  grid.innerHTML = items
    .map(
      (p) => `
    <article class="product-card">
      <div class="product-media"><span class="initial">${p.name.charAt(0)}</span></div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="product-foot">
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="add-btn" data-id="${p.id}" onclick="addToCart('${p.id}')">Agregar</button>
        </div>
      </div>
    </article>
  `,
    )
    .join("");
}
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.category)
    renderCategory(document.body.dataset.category);
});