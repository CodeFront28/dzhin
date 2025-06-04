// Базовый URL бэкенда
const API_BASE = "/api";

// Функция, которая при старте загружает из /api/product и /api/stock
async function loadProductAndStock() {
  try {
    const [prodResp, stockResp] = await Promise.all([
      fetch(`${API_BASE}/product`),
      fetch(`${API_BASE}/stock`),
    ]);
    const prodData = await prodResp.json();
    const stockData = await stockResp.json();

    // Подставляем название и цену товара, если в разметке есть соответствующие элементы
    if (prodData.success) {
      const product = prodData.product;
      const titleEl = document.querySelector(".product-title");
      if (titleEl) titleEl.textContent = product.title;
      const priceEl = document.querySelector(".price__new");
      if (priceEl) priceEl.textContent = `${product.price} ₽`;
    }

    // Дизейблим кнопки размеров с нулевым остатком
    if (stockData.success) {
      const stock = stockData.stock;
      document.querySelectorAll(".size").forEach((btn) => {
        const size = btn.textContent.trim();
        if (stock[size] === 0) {
          btn.disabled = true;
          btn.classList.add("disabled-size");
        }
      });
    }
  } catch (err) {
    console.error("Ошибка при загрузке товара/остатков:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductAndStock();
  initGallery();
  initFavorite();
  initSizeButtons();
  initSizeTabs();
  initCalc();
  initHeaderOrderButton();
  initScrollToFeatures();
  initCartPage();
  initOrderForm();
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
      if (btn.textContent.trim() === stored) {
        btn.classList.add("active");
      }
    });
  }

  sizeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sizeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      localStorage.setItem("selectedSize", btn.textContent.trim());
    });
  });
}

// 4) Табы «Калькулятор / Таблица»
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
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      blockResult.style.display = "none";
      blockCalc.style.display = "flex";
    });
  }

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

// Подбор размера по замерам
function getSizeByMeasurements(waist, hips) {
  const ranges = {
    XS: { wMin: 73, wMax: 77, hMin: 98, hMax: 102, ru: "38-40" },
    S: { wMin: 78, wMax: 81, hMin: 103, hMax: 107, ru: "40-42" },
    M: { wMin: 82, wMax: 86, hMin: 108, hMax: 113, ru: "42-44" },
    L: { wMin: 87, wMax: 92, hMin: 114, hMax: 118, ru: "44-46" },
  };
  if (waist > 92 || hips > 118) return null;

  let byWaist = null,
    byHips = null;
  Object.keys(ranges).forEach((key) => {
    const r = ranges[key];
    if (!byWaist && waist >= r.wMin && waist <= r.wMax) byWaist = key;
    if (!byHips && hips >= r.hMin && hips <= r.hMax) byHips = key;
  });
  if (byWaist && byWaist === byHips)
    return { letter: byWaist, ru: ranges[byWaist].ru };

  const order = ["XS", "S", "M", "L"];
  const iW = byWaist ? order.indexOf(byWaist) : -1;
  const iH = byHips ? order.indexOf(byHips) : -1;

  if (iH > iW) return { letter: byHips, ru: ranges[byHips].ru };
  if (byWaist && byHips && Math.abs(hips - waist) <= 2)
    return { letter: byHips, ru: ranges[byHips].ru };
  const pick = byHips || byWaist;
  return pick ? { letter: pick, ru: ranges[pick].ru } : null;
}

// Добавление товара в корзину (localStorage)
function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((i) => i.id === item.id && i.size === item.size);
  if (idx > -1) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  localStorage.setItem("cart", JSON.stringify(cart));
}

// 6) Кнопка «Оформить заказ» в шапке
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

// 7) Плавный скролл до «Почему мы?»
function initScrollToFeatures() {
  const link = document.querySelector('a[href="#features"]');
  const target = document.getElementById("features");
  if (!link || !target) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
}

// 8) Страница «/cart» (корзина)
function initCartPage() {
  const cartSection = document.querySelector(".container.order__page .cart");
  if (!cartSection) return;

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cartSection.innerHTML = "";

  if (cart.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.textContent = "Ваша корзина пуста";
    emptyMsg.classList.add("title");
    cartSection.appendChild(emptyMsg);

    const backLink = document.createElement("a");
    backLink.textContent = "Вернуться к покупкам";
    backLink.href = "/";
    backLink.classList.add("main__btn");
    cartSection.appendChild(backLink);
    return;
  }

  cart.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "cart__item";

    const img = document.createElement("img");
    img.src = item.imageSrc;
    img.alt = item.title;
    img.className = "cart__img";
    itemDiv.appendChild(img);

    const infoDiv = document.createElement("div");
    infoDiv.className = "cart__item-info";

    const infoTop = document.createElement("div");
    infoTop.className = "info__top";
    const titleEl = document.createElement("h4");
    titleEl.className = "title";
    titleEl.textContent = item.title;
    const sizeEl = document.createElement("span");
    sizeEl.className = "cart__item-size";
    sizeEl.textContent = `Размер: ${item.size}`;
    infoTop.appendChild(titleEl);
    infoTop.appendChild(sizeEl);

    const infoDown = document.createElement("div");
    infoDown.className = "info__down";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "cart__delete";
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <g opacity="0.5">
          <path opacity="0.35" d="M14.1666 18.3333H5.83325C4.45242 18.3333 3.33325 17.2142 3.33325 15.8333V5H16.6666V15.8333C16.6666 17.2142 15.5474 18.3333 14.1666 18.3333Z" fill="#191921"/>
          <path d="M13.3334 3.33329H6.66675V2.49996C6.66675 2.03996 7.04008 1.66663 7.50008 1.66663H12.5001C12.9601 1.66663 13.3334 2.03996 13.3334 2.49996V3.33329Z" fill="#191921"/>
          <path d="M15.8333 2.5C15.3325 2.5 4.6675 2.5 4.16667 2.5C3.24583 2.5 2.5 3.24583 2.5 4.16667C2.5 5.0875 3.24583 5.83333 4.16667 5.83333C4.6675 5.83333 15.3325 5.83333 15.8333 5.83333C16.7542 5.83333 17.5 5.0875 17.5 4.16667C17.5 3.24583 16.7542 2.5 15.8333 2.5Z" fill="#191921"/>
          <path d="M12.3434 15.1792L6.48756 9.32335C6.16756 9.00335 6.16756 8.48335 6.48756 8.16335C6.80756 7.84335 7.32756 7.84335 7.64756 8.16335L13.5034 14.0192C13.8234 14.3392 13.8234 14.8592 13.5034 15.1792C13.3378 15.3448 13.1194 15.4275 12.9011 15.4275C12.6829 15.4275 12.4645 15.3448 12.299 15.1792Z" fill="#191921"/>
        </g>
      </svg>`;
    infoDown.appendChild(deleteBtn);

    const volumeDiv = document.createElement("div");
    volumeDiv.className = "volume";
    const minusBtn = document.createElement("button");
    minusBtn.className = "volume__minus";
    minusBtn.textContent = "–";
    const qtySpan = document.createElement("span");
    qtySpan.className = "volume__number";
    qtySpan.textContent = item.quantity;
    const plusBtn = document.createElement("button");
    plusBtn.className = "volume__plus";
    plusBtn.textContent = "+";
    volumeDiv.appendChild(minusBtn);
    volumeDiv.appendChild(qtySpan);
    volumeDiv.appendChild(plusBtn);
    infoDown.appendChild(volumeDiv);

    infoDiv.appendChild(infoTop);
    infoDiv.appendChild(infoDown);
    itemDiv.appendChild(infoDiv);
    cartSection.appendChild(itemDiv);

    // Удаление товара
    deleteBtn.addEventListener("click", () => {
      cart = cart.filter((_, i) => i !== index);
      localStorage.setItem("cart", JSON.stringify(cart));
      initCartPage();
    });
    // Уменьшение количества
    minusBtn.addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity -= 1;
        qtySpan.textContent = item.quantity;
        localStorage.setItem("cart", JSON.stringify(cart));
        updateTotal();
      }
    });
    // Увеличение количества
    plusBtn.addEventListener("click", () => {
      item.quantity += 1;
      qtySpan.textContent = item.quantity;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateTotal();
    });
  });

  // Итоговая сумма
  const totalDiv = document.createElement("div");
  totalDiv.className = "cart__total";
  totalDiv.innerHTML = `Итого: <span class="total-value">${calculateSum(
    cart
  )} ₽</span>`;
  cartSection.appendChild(totalDiv);

  function calculateSum(arr) {
    return arr.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }
  function updateTotal() {
    const totalValueElem = cartSection.querySelector(".total-value");
    if (totalValueElem) {
      totalValueElem.textContent = calculateSum(cart) + " ₽";
    }
  }
}

// 9) Форма оформления заказа
function initOrderForm() {
  const form = document.getElementById("orderForm");
  if (!form) return;

  const inputName = document.getElementById("fullname");
  const inputPhone = document.getElementById("phone");
  const inputEmail = document.getElementById("email");
  const inputAddress = document.getElementById("address");
  const inputComment = document.getElementById("comment");
  const submitBtn = document.getElementById("btnSubmitOrder");
  if (!inputName || !inputPhone || !inputEmail || !inputAddress || !submitBtn)
    return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Валидация
    if (inputName.value.trim().length < 2) {
      alert("Укажите ФИО (минимум 2 символа).");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(inputPhone.value.trim())) {
      alert("Неверный формат телефона.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail.value.trim())) {
      alert("Неверный формат email.");
      return;
    }
    if (inputAddress.value.trim().length === 0) {
      alert("Укажите адрес доставки.");
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) {
      alert("Корзина пуста. Добавьте товар перед оформлением.");
      return;
    }
    const orderData = {
      size: cart[0].size, // так как у нас в корзине всегда 1 товар одного вида
      quantity: cart[0].quantity,
      customer: {
        fullname: inputName.value.trim(),
        phone: inputPhone.value.trim(),
        email: inputEmail.value.trim(),
        address: inputAddress.value.trim(),
        comment: inputComment ? inputComment.value.trim() : "",
      },
    };
    // POST на /api/create-payment
    createPaymentRequest(orderData);
  });
}

// Отправка запроса на бэк для создания платежа
async function createPaymentRequest(orderData) {
  try {
    const resp = await fetch("http://localhost:4242/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const data = await resp.json();
    if (!resp.ok) {
      alert(data.error || "Ошибка при создании платежа");
      return;
    }
    window.location.href = data.paymentUrl;
  } catch (err) {
    console.error("Ошибка createPaymentRequest:", err);
    alert("Ошибка при создании платежа. Попробуйте позже.");
  }
}
