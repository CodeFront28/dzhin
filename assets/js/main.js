// main.js

// Базовый URL бэкенда
const API_BASE = "/api";

// Загрузка информации о товаре и остатках
async function loadProductAndStock() {
  try {
    const [prodResp, stockResp] = await Promise.all([
      fetch(`${API_BASE}/product`),
      fetch(`${API_BASE}/stock`),
    ]);
    const prodData = await prodResp.json();
    const stockData = await stockResp.json();

    if (prodData.success) {
      const product = prodData.product;
      const titleEl = document.querySelector(".product-title");
      if (titleEl) titleEl.textContent = product.title;
      const priceEl = document.querySelector(".price__new");
      if (priceEl) priceEl.textContent = `${product.price} ₽`;
    }

    if (stockData.success) {
      const stock = stockData.stock;
      document.querySelectorAll(".size").forEach((btn) => {
        const size = btn.textContent.trim();
        if (stock[size] === 0) {
          btn.disabled = true;
          btn.classList.add("disabled-size");
          btn.style.pointerEvents = "none";
          // ↓ убираем active, если он уже был, и сбрасываем в localStorage
          btn.classList.remove("active");
          if (localStorage.getItem("selectedSize") === size) {
            localStorage.removeItem("selectedSize");
          }
        }
      });
    }
  } catch (err) {
    console.error("Ошибка при загрузке товара/остатков:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductAndStock(); // ждём, пока все размеры дизейблятся
  initGallery();
  initFavorite();
  initSizeButtons();
  initSizeTabs();
  initCalc();
  initHeaderOrderButton();
  initScrollToFeatures();
  initCartPage();
  initOrderForm();
  initMobileCarousel();
  initLightbox();
});

// 1) Галерея изображений
function initGallery() {
  const mainImg = document.getElementById("mainImage");
  const thumbs = document.querySelectorAll(".picrure__product");
  if (!mainImg || thumbs.length === 0) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      mainImg.src = thumb.src;
      thumbs.forEach((t) => t.classList.remove("active-thumb"));
      thumb.classList.add("active-thumb");
    });
  });
  thumbs[0].classList.add("active-thumb");
}

// 2) Избранное
function initFavorite() {
  const favBtn = document.querySelector(".favorite");
  if (!favBtn) return;
  let isFav = localStorage.getItem("favorite") === "true";
  if (isFav) favBtn.classList.add("favorited");
  favBtn.addEventListener("click", () => {
    isFav = !isFav;
    localStorage.setItem("favorite", isFav);
    favBtn.classList.toggle("favorited");
  });
}

// 3) Кнопки выбора размера
function initSizeButtons() {
  const sizeButtons = document.querySelectorAll(".size");
  if (sizeButtons.length === 0) return;

  const stored = localStorage.getItem("selectedSize");
  if (stored) {
    sizeButtons.forEach((btn) => {
      if (btn.textContent.trim() === stored && !btn.disabled) {
        btn.classList.add("active");
      }
    });
  }

  sizeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return; // запрет клика по disabled
      sizeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      localStorage.setItem("selectedSize", btn.textContent.trim());
    });
  });
}

// 4) Табы "Калькулятор" / "Таблица размеров"
function initSizeTabs() {
  const [btnCalcTab, btnTableTab] = document.querySelectorAll(
    ".buttons__radio button"
  );
  const blockCalc = document.querySelector(".content.calc");
  const blockResult = document.querySelector(".content.calc__result");
  const blockTable = document.querySelector(".content.table");
  if (!btnCalcTab || !btnTableTab || !blockCalc || !blockResult || !blockTable)
    return;

  function showCalc() {
    btnCalcTab.classList.add("active");
    btnCalcTab.classList.remove("second__btn");
    btnTableTab.classList.remove("active");
    btnTableTab.classList.add("second__btn");
    blockCalc.style.display = "flex";
    blockResult.style.display = "none";
    blockTable.style.display = "none";
  }
  function showTable() {
    btnTableTab.classList.add("active");
    btnTableTab.classList.remove("second__btn");
    btnCalcTab.classList.remove("active");
    btnCalcTab.classList.add("second__btn");
    blockCalc.style.display = "none";
    blockResult.style.display = "none";
    blockTable.style.display = "flex";
  }

  btnCalcTab.addEventListener("click", showCalc);
  btnTableTab.addEventListener("click", showTable);

  const tableLink = document.querySelector(".table__link");
  if (tableLink) {
    tableLink.addEventListener("click", (e) => {
      e.preventDefault();
      showTable();
      blockTable.scrollIntoView({ behavior: "smooth" });
    });
  }

  showCalc();
}

// 5) Калькулятор размера
function initCalc() {
  const inputTop = document.getElementById("top");
  const inputBottom = document.getElementById("bottom");
  const btnCalc = document.getElementById("btnCalc");
  const blockCalc = document.querySelector(".content.calc");
  const blockResult = document.querySelector(".content.calc__result");
  const sizeDisplay = blockResult?.querySelector(".size");
  const ruDisplay = blockResult?.querySelector("span:nth-child(3)");
  const btnCalcOrder = document.getElementById("btnCalcOrder");
  if (!inputTop || !inputBottom || !btnCalc || !blockCalc || !blockResult)
    return;

  btnCalc.disabled = true;
  let waist, hips;

  function checkInputs() {
    waist = Number(inputTop.value);
    hips = Number(inputBottom.value);
    btnCalc.disabled = isNaN(waist) || waist < 0 || isNaN(hips) || hips < 0;
  }
  inputTop.addEventListener("input", checkInputs);
  inputBottom.addEventListener("input", checkInputs);

  btnCalc.addEventListener("click", () => {
    waist = Number(inputTop.value);
    hips = Number(inputBottom.value);
    const result = getSizeByMeasurements(waist, hips);
    if (!result) {
      sizeDisplay.textContent = "—";
      ruDisplay.textContent = "распродано";
    } else {
      sizeDisplay.textContent = result.letter;
      ruDisplay.textContent = result.ru + " RU";
      localStorage.setItem("selectedSize", result.letter);
    }
    blockCalc.style.display = "none";
    blockResult.style.display = "flex";
  });

  const btnBack = blockResult.querySelector(".second__btn");
  if (btnBack)
    btnBack.addEventListener("click", () => {
      blockResult.style.display = "none";
      blockCalc.style.display = "flex";
    });

  if (btnCalcOrder) {
    btnCalcOrder.addEventListener("click", () => {
      const chosen = localStorage.getItem("selectedSize");
      if (!chosen) {
        alert("Сначала подберите размер");
        return;
      }
      addToCart({
        id: 1,
        size: chosen,
        quantity: 1,
        price: 2990,
        imageSrc: document.querySelector(".picrure__product")?.src || "",
        title: "Джинсы женские прямые синие",
      });
      window.location.href = "/cart";
    });
  }
}

function getSizeByMeasurements(waist, hips) {
  const ranges = {
    XS: { wMin: 73, wMax: 77, hMin: 98, hMax: 102, ru: "38-40" },
    S: { wMin: 78, wMax: 81, hMin: 103, hMax: 107, ru: "40-42" },
    M: { wMin: 82, wMax: 86, hMin: 108, hMax: 113, ru: "42-44" },
    L: { wMin: 87, wMax: 92, hMin: 114, hMax: 118, ru: "44-46" },
  };
  if (waist > 92 || hips > 118) return null;

  let byW = null,
    byH = null;
  Object.keys(ranges).forEach((key) => {
    const r = ranges[key];
    if (!byW && waist >= r.wMin && waist <= r.wMax) byW = key;
    if (!byH && hips >= r.hMin && hips <= r.hMax) byH = key;
  });
  if (byW && byW === byH) return { letter: byW, ru: ranges[byW].ru };

  const order = ["XS", "S", "M", "L"];
  const iW = byW ? order.indexOf(byW) : -1;
  const iH = byH ? order.indexOf(byH) : -1;
  if (iH > iW) return { letter: byH, ru: ranges[byH].ru };
  if (byW && byH && Math.abs(hips - waist) <= 2)
    return { letter: byH, ru: ranges[byH].ru };
  const pick = byH || byW;
  return pick ? { letter: pick, ru: ranges[pick].ru } : null;
}

// Добавление в корзину
function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((i) => i.id === item.id && i.size === item.size);
  if (idx > -1) cart[idx].quantity += item.quantity;
  else cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// 6) Кнопка оформления в шапке
function initHeaderOrderButton() {
  const btn = document.getElementById("btnHeaderOrder");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const chosen = localStorage.getItem("selectedSize");
    if (!chosen) {
      alert("Сначала выберите размер");
      return;
    }
    addToCart({
      id: 1,
      size: chosen,
      quantity: 1,
      price: 2990,
      imageSrc: document.querySelector(".picrure__product")?.src || "",
      title: "Джинсы женские прямые синие",
    });
    window.location.href = "/cart";
  });
}

// 7) Плавный скролл до "Почему мы?"
function initScrollToFeatures() {
  const link = document.querySelector('a[href="#features"]');
  const target = document.getElementById("features");
  if (!link || !target) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
}

// 8) Страница корзины
function initCartPage() {
  const cartSection = document.querySelector(".container.order__page .cart");
  if (!cartSection) return;
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cartSection.innerHTML = "";
  if (cart.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Ваша корзина пуста";
    p.className = "title";
    cartSection.appendChild(p);
    const a = document.createElement("a");
    a.textContent = "Вернуться к покупкам";
    a.href = "/";
    a.className = "main__btn";
    cartSection.appendChild(a);
    return;
  }
  cart.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "cart__item";
    const img = document.createElement("img");
    img.src = item.imageSrc;
    img.alt = item.title;
    img.className = "cart__img";
    div.appendChild(img);
    const info = document.createElement("div");
    info.className = "cart__item-info";
    const top = document.createElement("div");
    top.className = "info__top";
    const h4 = document.createElement("h4");
    h4.className = "title";
    h4.textContent = item.title;
    const span = document.createElement("span");
    span.className = "cart__item-size";
    span.textContent = `Размер: ${item.size}`;
    top.append(h4, span);
    const down = document.createElement("div");
    down.className = "info__down";
    const del = document.createElement("button");
    del.className = "cart__delete";
    del.innerHTML = `<svg ...></svg>`;
    down.appendChild(del);
    const vol = document.createElement("div");
    vol.className = "volume";
    const minus = document.createElement("button");
    minus.className = "volume__minus";
    minus.textContent = "–";
    const num = document.createElement("span");
    num.className = "volume__number";
    num.textContent = item.quantity;
    const plus = document.createElement("button");
    plus.className = "volume__plus";
    plus.textContent = "+";
    vol.append(minus, num, plus);
    down.appendChild(vol);
    info.append(top, down);
    div.appendChild(info);
    cartSection.appendChild(div);

    del.addEventListener("click", () => {
      cart = cart.filter((_, j) => j !== i);
      localStorage.setItem("cart", JSON.stringify(cart));
      initCartPage();
    });
    minus.addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity--;
        num.textContent = item.quantity;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateTotal();
      }
    });
    plus.addEventListener("click", () => {
      item.quantity++;
      num.textContent = item.quantity;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateTotal();
    });
  });
  const total = document.createElement("div");
  total.className = "cart__total";
  total.innerHTML = `Итого: <span class="total-value">${calculateSum(
    cart
  )} ₽</span>`;
  cartSection.appendChild(total);
  function calculateSum(arr) {
    return arr.reduce((a, i) => a + i.price * i.quantity, 0);
  }
  function updateTotal() {
    const tv = cartSection.querySelector(".total-value");
    if (tv) tv.textContent = `${calculateSum(cart)} ₽`;
  }
}

// 9) Форма заказа
function initOrderForm() {
  const form = document.getElementById("orderForm");
  if (!form) return;
  const nameI = document.getElementById("fullname");
  const phoneI = document.getElementById("phone");
  const emailI = document.getElementById("email");
  const addrI = document.getElementById("address");
  const comI = document.getElementById("comment");
  if (!nameI || !phoneI || !emailI || !addrI) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (nameI.value.trim().length < 2) {
      alert("Укажите ФИО (не менее 2).");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phoneI.value.trim())) {
      alert("Неверный телефон.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailI.value.trim())) {
      alert("Неверный email.");
      return;
    }
    if (addrI.value.trim().length === 0) {
      alert("Укажите адрес.");
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) {
      alert("Корзина пуста.");
      return;
    }
    const orderData = {
      size: cart[0].size,
      quantity: cart[0].quantity,
      customer: {
        fullname: nameI.value.trim(),
        phone: phoneI.value.trim(),
        email: emailI.value.trim(),
        address: addrI.value.trim(),
        comment: comI ? comI.value.trim() : "",
      },
    };
    createPaymentRequest(orderData);
  });
}

async function createPaymentRequest(orderData) {
  try {
    const resp = await fetch(`${API_BASE}/create-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const data = await resp.json();
    if (!resp.ok) {
      alert(data.error || "Ошибка оплаты");
      return;
    }
    window.location.href = data.paymentUrl;
  } catch (err) {
    console.error(err);
    alert("Ошибка соединения.");
  }
}

// 10) Мобильный карусель в all__pictures
function initMobileCarousel() {
  if (window.innerWidth > 650) return;
  const carousel = document.querySelector(".all__pictures");
  if (!carousel) return;
  const items = Array.from(carousel.querySelectorAll(".picrure__product"));
  carousel.style.display = "flex";
  carousel.style.overflowX = "auto";
  carousel.style.scrollSnapType = "x mandatory";
  items.forEach((img) => {
    img.style.scrollSnapAlign = "start";
    img.style.flex = "0 0 auto";
  });
  const dots = document.createElement("div");
  dots.className = "carousel-dots";
  carousel.parentNode.insertBefore(dots, carousel.nextSibling);
  items.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "carousel-dot";
    dot.addEventListener("click", () =>
      items[i].scrollIntoView({ behavior: "smooth" })
    );
    dots.appendChild(dot);
  });
  carousel.addEventListener("scroll", () => {
    const scrollLeft = carousel.scrollLeft;
    let active = 0;
    items.forEach((item, i) => {
      if (scrollLeft >= item.offsetLeft - carousel.clientWidth / 2) active = i;
    });
    dots
      .querySelectorAll(".carousel-dot")
      .forEach((dot, i) => dot.classList.toggle("activee", i === active));
  });
}

// 11) Лайтбокс для картинок
function initLightbox() {
  [
    ".all__pictures .picrure__product",
    ".reviews__pictures .reviews__pic",
  ].forEach((sel) => {
    document.querySelectorAll(sel).forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => openLightbox(img.src));
    });
  });
}

function openLightbox(src) {
  const overlay = document.createElement("div");
  overlay.style =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;" +
    "background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;cursor:zoom-out;z-index:10000;";
  const image = document.createElement("img");
  image.src = src;
  image.style =
    "max-width:90vw;max-height:90vh;transform:scale(1);transition:transform .3s;";
  let scale = 1;
  image.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.min(Math.max(1, scale - e.deltaY * 0.001), 5);
    image.style.transform = `scale(${scale})`;
  });
  overlay.appendChild(image);
  overlay.addEventListener("click", () => document.body.removeChild(overlay));
  document.body.appendChild(overlay);
}
