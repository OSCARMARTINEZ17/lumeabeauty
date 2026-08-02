/* =============================================================
   LUMEA BEAUTY — carrito compartido (localStorage) + WhatsApp
   Número de WhatsApp del negocio (formato internacional, sin +)
   ============================================================= */
const WHATSAPP_NUMBER = "16465381517";
const CART_KEY = "lumea_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}
function findProduct(id) {
  for (const cat in PRODUCTS) {
    const p = PRODUCTS[cat].find((p) => p.id === id);
    if (p) return p;
  }
  return null;
}
function addToCart(id) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (line) line.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
  flashAdded(id);
  openCart();
}
function changeQty(id, delta) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) return removeFromCart(id);
  saveCart(cart);
}
function removeFromCart(id) {
  saveCart(getCart().filter((l) => l.id !== id));
}
function cartTotal(cart) {
  return cart.reduce((sum, l) => {
    const p = findProduct(l.id);
    return sum + (p ? p.price * l.qty : 0);
  }, 0);
}
function cartCount(cart) {
  return cart.reduce((n, l) => n + l.qty, 0);
}
function flashAdded(id) {
  const btn = document.querySelector(`.add-btn[data-id="${id}"]`);
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = "Agregado ✓";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("added");
  }, 1200);
}

/* ---------- drawer render ---------- */
function renderCart() {
  const cart = getCart();
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEls = document.querySelectorAll(".cart-count");
  const sendBtn = document.getElementById("cartSendBtn");

  countEls.forEach((el) => {
    const n = cartCount(cart);
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="glyph">Lumea</span>
        <p>Tu carrito está vacío.<br>Agrega tus productos favoritos.</p>
      </div>`;
    if (sendBtn) sendBtn.disabled = true;
  } else {
    itemsEl.innerHTML = cart
      .map((l) => {
        const p = findProduct(l.id);
        if (!p) return "";
        return `
        <div class="cart-line">
          <div class="line-media"><span>${p.name.charAt(0)}</span></div>
          <div class="line-info">
            <h5>${p.name}</h5>
            <div class="line-qty">
              <button class="qty-btn" aria-label="Restar" onclick="changeQty('${p.id}',-1)">−</button>
              <span>${l.qty}</span>
              <button class="qty-btn" aria-label="Sumar" onclick="changeQty('${p.id}',1)">+</button>
            </div>
            <button class="line-remove" onclick="removeFromCart('${p.id}')">Quitar</button>
          </div>
          <div class="line-price">$${(p.price * l.qty).toFixed(2)}</div>
        </div>`;
      })
      .join("");
    if (sendBtn) sendBtn.disabled = false;
  }

  if (totalEl) totalEl.textContent = `$${cartTotal(cart).toFixed(2)}`;
}

/* ---------- drawer open/close ---------- */
function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
}
function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
}

/* ---------- send to WhatsApp ---------- */
function sendCartToWhatsApp() {
  const cart = getCart();
  if (cart.length === 0) return;

  let msg = "Hola Lumea Beauty ✨ quiero hacer este pedido:\n\n";
  cart.forEach((l) => {
    const p = findProduct(l.id);
    if (!p) return;
    msg += `• ${p.name} x${l.qty} — $${(p.price * l.qty).toFixed(2)}\n`;
  });
  msg += `\nTotal: $${cartTotal(cart).toFixed(2)}\n\n`;
  msg +=
    "Mi dirección de envío en EE. UU. es: \n\n¿Cómo puedo pagar (efectivo, Zelle o PayPal)?";

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}

/* ---------- inject drawer + floating buttons on load ---------- */
function injectCartUI() {
  const overlay = document.createElement("div");
  overlay.id = "cartOverlay";
  overlay.className = "cart-overlay";
  overlay.onclick = closeCart;

  const menuBtn = document.getElementById("menuToggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuBtn && mainNav) {
    menuBtn.addEventListener("click", () => mainNav.classList.toggle("open"));
    mainNav
      .querySelectorAll("a")
      .forEach((a) =>
        a.addEventListener("click", () => mainNav.classList.remove("open")),
      );
  }

  const drawer = document.createElement("div");
  drawer.id = "cartDrawer";
  drawer.className = "cart-drawer";
  drawer.innerHTML = `
    <div class="cart-head">
      <h3>Tu carrito</h3>
      <button class="cart-close" aria-label="Cerrar carrito" onclick="closeCart()">&times;</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-foot">
      <div class="cart-total-row"><span>Total</span><span id="cartTotal">$0.00</span></div>
      <button class="btn btn-wa btn-block" id="cartSendBtn" onclick="sendCartToWhatsApp()">Enviar pedido por WhatsApp</button>
      <p class="cart-note">Confirmamos disponibilidad y forma de pago (efectivo, Zelle o PayPal) por WhatsApp.</p>
    </div>`;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const fab = document.createElement("a");
  fab.className = "fab-wa";
  fab.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  fab.target = "_blank";
  fab.setAttribute("aria-label", "Escríbenos por WhatsApp");
  fab.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.35 5.08L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Z" stroke="white" stroke-width="1.4"/><path d="M8.5 8.7c.2-.6.6-.6 1-.6h.5c.2 0 .5 0 .7.5.2.6.7 1.9.8 2 .1.2.1.4 0 .6-.1.2-.2.3-.4.5-.2.2-.4.4-.2.7.2.4 1 1.5 2.1 2.4 1.4 1.2 2 1.3 2.3 1.2.3-.1.5-.3.7-.6.2-.3.5-.3.8-.2.3.1 1.8.9 2.1 1 .3.1.5.2.6.3.1.2.1 1-.3 1.4-.4.5-1.5 1-2.5.9-1-.1-3.1-.9-4.9-2.6-2.1-2-3.1-4-3.3-4.6-.2-.6-.9-1.9 0-3.9Z" fill="white"/></svg>`;

  document.body
    .querySelectorAll(".icon-btn[data-cart-toggle]")
    .forEach((btn) => {
      btn.onclick = openCart;
    });

  renderCart();
}
document.addEventListener("DOMContentLoaded", injectCartUI);