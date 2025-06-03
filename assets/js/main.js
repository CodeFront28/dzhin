// ===================================================================
// main.js
// ===================================================================
// Этот файл полностью «привязан» к тем классам/структуре,
// которую вы уже описали в своем index.html и styles.css.
// Ни HTML, ни CSS менять не нужно (кроме пары мелких рекомендаций ниже).
//
// Скрипт выполнит:
//   1) Загрузку данных о товаре с вашего API: GET /api/product
//   2) Отрисовку цены и названия товара на существующие селекторы
//   3) Привязку галереи: при клике на миниатюру заменит главное изображение
//   4) Логику выбора размера
//   5) Логику счетчика количества (плюс/минус)
//   6) Сбор данных из полей «Имя», «Телефон», «Адрес», «Способ доставки»
//   7) Отправку POST /api/order и вывод алерта об успехе/ошибке
//
// --------------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // 1) Запрос к бэкенду, чтобы получить JSON товара
  //    Ожидаем, что ваш сервер (Express) слушает GET /api/product
  fetch("/api/product")
    .then((resp) => {
      if (!resp.ok) throw new Error("Не удалось получить данные о товаре");
      return resp.json();
    })
    .then((product) => {
      initProduct(product);
    })
    .catch((err) => {
      console.error(err);
      alert("Ошибка при загрузке данных о товаре");
    });

  // 2) Инициализация товара: заполняем название, цену, галерею,
  //    кнопки размеров, счетчик, привязываем событие на «Оформить заказ»
  function initProduct(product) {
    // === 2.1. Название и цена ===
    // Найдите в своей разметке те элементы, куда хотите вывести:
    //   • Название товара (например, <h1 class="title">…</h1>)
    //   • Новая цена (в вашем случае, у вас в HTML уже есть блок с классом .price__new)
    // Предположим, что:
    //   – Название лежит в элементе с классом .title (первое в блоке main__info)
    //   – Цена сейчас написана вручную (например, «2 990 ₽»). Мы её заменим на динамическую.
    //
    // Если у вас в HTML несколько элементов с классом .title,
    // то смотрите на тот, что у вас является заголовком товара.
    // Например, у вас есть:
    //   <h1 class="title">Джинсы женские прямые синие</h1>
    // Мы можем просто переписать его текст на тот, что пришёл из API:
    //
    const titleEl = document.querySelector("h1.title");
    if (titleEl) titleEl.textContent = product.title;

    // Ищем элемент, где отображается новая цена. В вашем CSS это .price__new.
    // Он может выглядеть так:
    //   <span class="price__new">2 990 ₽</span>
    // Мы просто меняем его содержимое на динамическое:
    const priceEl = document.querySelector(".price__new");
    if (priceEl) priceEl.textContent = product.price + " ₽";

    // === 2.2. Галерея ===
    // У вас есть в HTML раздел:
    //   <div class="picture__main">
    //     <button class="favorite">…</button>
    //     <img src="assets/img/pic1.png" alt="…" />
    //   </div>
    // Вместо статического <img> мы будем менять его атрибут src на тот, что пришёл из product.images[0].
    // Предположим, что главное изображение — это именно тот <img> внутри .picture__main.
    //
    const mainImgEl = document.querySelector(".picture__main img");
    if (mainImgEl && Array.isArray(product.images) && product.images.length) {
      mainImgEl.src = product.images[0];
      mainImgEl.alt = product.title;
    }

    // У вас также есть блок миниатюр:
    //   <div class="all__pictures">
    //     <img src="assets/img/pic1.png" … class="picrure__product" />
    //     …
    //   </div>
    //
    // Мы заменим существующие <img class="picrure__product"> на те, что пришли в product.images[].
    // Для этого сначала очищаем все внутри .all__pictures, а потом создаём новые <img>.
    //
    const thumbsContainer = document.querySelector(".all__pictures");
    if (thumbsContainer) {
      // Удаляем все старые миниатюры (если они были захардкожены в HTML)
      thumbsContainer.innerHTML = "";
      // Создаём новые
      product.images.forEach((imgUrl, idx) => {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = product.title + " миниатюра " + (idx + 1);
        img.className = "picrure__product"; // ваш класс для стилизации миниатюр
        img.addEventListener("click", () => {
          if (mainImgEl) {
            mainImgEl.src = imgUrl;
            mainImgEl.alt = product.title + " " + (idx + 1);
          }
        });
        thumbsContainer.appendChild(img);
      });
    }

    // === 2.3. Кнопки «Размеры» ===
    // Предположим, что в вашей разметке есть контейнер,
    // куда вы уже положили 5 <button class="size">XS</button> и т.д.
    // В вашем index.html я вижу строку:
    //   <button class="size">XS</button>
    //   <button class="size">S</button>
    //   …
    //
    // Мы будем использовать класс .size, чтобы повесить слушатель и отслеживать,
    // какой размер выбран, а также визуально подсветить активный размер.
    //
    const sizeButtons = Array.from(document.querySelectorAll(".size"));
    let selectedSize = null;

    // По умолчанию можно активировать какой-то конкретный, например средний: product.sizes[2]
    if (product.sizes && product.sizes.length >= 3) {
      selectedSize = product.sizes[2];
      // Найдём кнопку, чей текст совпадает с этим размером:
      sizeButtons.forEach((btn) => {
        if (btn.textContent.trim() === selectedSize) {
          btn.classList.add("size--active"); // мы добавим CSS-класс size--active, чтобы подсветить
        }
      });
    }

    // Если в HTML у вас уже прописан класс для активного размера (например, size_active),
    // то меняйте ниже "size--active" на ваш существующий.
    // В моём примере я добавлю в CSS правило:
    //   .size--active { background: rgba(173,73,245,0.16); color: #713dd8; }
    //
    // Навешиваем событие на все кнопки:
    sizeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // 1) Снимаем активный класс со всех
        sizeButtons.forEach((b) => b.classList.remove("size--active"));
        // 2) Добавляем активный класс только на тот, что кликнули
        btn.classList.add("size--active");
        // 3) Запоминаем выбранный размер
        selectedSize = btn.textContent.trim();
      });
    });

    // === 2.4. Счётчик «+ / –» для количества ===
    // В вашей разметке я вижу кнопки:
    //   <button class="minus">−</button>
    //   <span class="quantity">1</span>
    //   <button class="plus">+</button>
    //
    // Если именно так и у вас — ниже мы отыщем элементы по классу .minus, .plus, .quantity
    // и будем увеличивать / уменьшать, не опускаясь ниже 1.
    //
    let quantity = 1;
    const minusBtn = document.querySelector(".volume__minus");
    const plusBtn = document.querySelector(".volume__plus");
    const quantityEl = document.querySelector(".volume__number");

    if (minusBtn && plusBtn && quantityEl) {
      minusBtn.addEventListener("click", () => {
        if (quantity > 1) {
          quantity--;
          quantityEl.textContent = quantity;
        }
      });
      plusBtn.addEventListener("click", () => {
        quantity++;
        quantityEl.textContent = quantity;
      });
    }

    // === 2.5. Поля формы: «Имя», «Телефон», «Адрес» ===
    // В вашем HTML это, судя по всему:
    //   <input type="text" class="input-name" placeholder="Как Вас зовут?" />
    //   <input type="text" class="input-phone" placeholder="+7 900 000-00-00" />
    //   <input type="text" class="input-address" placeholder="Город, улица, дом" />
    //
    // Скорее всего, у вас в HTML эти поля уже имеют классы (input-name, input-phone, input-address).
    // Проверить: найдите в своём index.html эти строки. Тогда мы можем получить их так:
    //
    const inputName = document.querySelector(".input-name");
    const inputPhone = document.querySelector(".input-phone");
    const inputAddress = document.querySelector(".input-address");

    // === 2.6. Выбор способа доставки ===
    // У вас в HTML есть радиокнопки наподобие:
    //   <label><input type="radio" name="delivery" value="Яндекс"> Яндекс</label>
    //   <label><input type="radio" name="delivery" value="СДЭК" checked> СДЭК</label>
    //
    // JS найдёт выбранный вариант через querySelector('input[name="delivery"]:checked')
    //
    // Никаких дополнительных ID/классов здесь не нужно.

    // === 2.7. Кнопка «Оформить заказ» ===
    // Найдём кнопку через класс .main__btn (или, если у вас есть другой класс — подставьте свой).
    // В вашем index.html я увидел:
    //   <button class="main__btn">Оформить заказ</button>
    //
    // Нам нужно повесить на неё событие click:
    const orderBtn = document.querySelector(".main__button");
    if (orderBtn) {
      orderBtn.addEventListener("click", () => {
        // 1) Проверяем, выбран ли размер
        if (!selectedSize) {
          alert("Пожалуйста, выберите размер");
          return;
        }
        // 2) Проверяем, что поля формы не пустые
        const nameValue = inputName?.value.trim();
        const phoneValue = inputPhone?.value.trim();
        const addressValue = inputAddress?.value.trim();
        if (!nameValue || !phoneValue || !addressValue) {
          alert("Заполните все поля для оформления заказа");
          return;
        }
        // 3) Читаем, какой метод доставки выбрано
        const deliveryValue =
          document.querySelector('input[name="delivery"]:checked')?.value || "";

        // 4) Собираем payload
        const payload = {
          size: selectedSize,
          quantity,
          name: nameValue,
          phone: phoneValue,
          address: addressValue,
          delivery: deliveryValue,
        };

        // 5) Шлём POST /api/order
        fetch("/api/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then((resp) =>
            resp.json().then((body) => ({ status: resp.status, body }))
          )
          .then(({ status, body }) => {
            if (status !== 201) {
              // если сервер вернул ошибку — выводим текст ошибки
              const msg = body.error || "Не удалось создать заказ";
              alert(msg);
              return;
            }
            // Успешно: можно вывести alert и/или сбросить форму
            alert("Ваш заказ успешно создан! Наш менеджер свяжется с вами.");
            // Optionally, можно очистить поля формы:
            inputName.value = "";
            inputPhone.value = "";
            inputAddress.value = "";
            // Сбросить выбор размера и количества, если нужно:
            sizeButtons.forEach((b) => b.classList.remove("size--active"));
            selectedSize = null;
            quantity = 1;
            if (quantityEl) quantityEl.textContent = quantity;
          })
          .catch((err) => {
            console.error(err);
            alert("Ошибка при отправке запроса. Попробуйте позже.");
          });
      });
    }
  } // end initProduct
}); // end DOMContentLoaded
