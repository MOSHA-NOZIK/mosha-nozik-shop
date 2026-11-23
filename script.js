'use strict';

const API_URL = '/api';
const CART_KEY = 'mosha_cart';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Ошибка чтения корзины:', e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Ошибка сохранения корзины:', e);
    }
}

function addToCart(item) {
    const cart = getCart();
    if (cart.some(g => g.id === item.id)) return false;
    
    // Защита от NaN и undefined
    const safeItem = {
        id: String(item.id),
        title: String(item.title),
        price: Number(item.price) || 0,
        image: String(item.image || 'logo.png')
    };
    
    cart.push(safeItem);
    saveCart(cart);
    updateCartBadge();
    return true;
}

function removeFromCart(id) {
    const cart = getCart().filter(g => g.id !== id);
    saveCart(cart);
    updateCartBadge();
}

function updateCartBadge() {
    const count = getCart().length;
    document.querySelectorAll('.nav__link[href="cart.html"]').forEach(link => {
        link.textContent = count > 0 ? `КОРЗИНА (${count})` : 'КОРЗИНА';
    });
}

// Загрузка каталога для shop.html
async function fetchGames() {
    const catalog = document.querySelector('.catalog');
    if (!catalog) return;

    try {
        catalog.innerHTML = '<p style="text-align:center; width:100%;">Загрузка каталога...</p>';
        
        const response = await fetch(`${API_URL}/games`);
        if (!response.ok) throw new Error('Ошибка сервера');
        
        const games = await response.json();
        catalog.innerHTML = ''; // Очищаем перед рендером
        
        games.forEach(game => {
            const article = document.createElement('article');
            article.className = 'game-card';
            article.dataset.id = game.id;
            // Приводим жанр к нижнему регистру для фильтра (например, "rpg")
            article.dataset.genre = game.genre.toLowerCase().split(' ')[0]; 
            article.dataset.date = "2024"; // Заглушка, так как в БД нет даты выпуска
            article.dataset.price = game.price;
            
            article.innerHTML = `
                <img src="${game.image_url}" alt="${game.title}" class="game-card__img">
                <div class="game-card__content">
                    <h2 class="game-card__title">${game.title}</h2>
                    <p class="game-card__desc">${game.genre}</p>
                    <button class="game-card__price" type="button" data-id="${game.id}" data-price="${game.price}">${game.price} РУБ</button>
                </div>
                <a href="game.html?id=${game.id}" class="game-card__link" aria-label="Перейти к игре ${game.title}"></a>
            `;
            catalog.appendChild(article);
        });

        // Переинициализируем фильтры и кнопки добавления после рендера
        initCatalogFilter();
        initAddToCart();

    } catch (error) {
        console.error('Ошибка:', error);
        catalog.innerHTML = `<p style="color:red; width:100%;">Не удалось загрузить каталог. Сервер выключен? (${error.message})</p>`;
    }
}

// Загрузка одной игры для game.html
async function fetchGamePage() {
    const gameDetails = document.querySelector('.game-details');
    if (!gameDetails) return; // Если мы не на странице игры

    // Получаем ID игры из URL (например, game.html?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id') || 1; // Если ID нет, по умолчанию грузим 1-ю игру

    try {
        const response = await fetch(`${API_URL}/games/${gameId}`);
        if (!response.ok) throw new Error('Игра не найдена');
        
        const game = await response.json();
        
        // Обновляем DOM
        document.title = `Игра ${game.title}`;
        gameDetails.querySelector('.game-details__title').textContent = `ИГРА “${game.title.toUpperCase()}”`;
        gameDetails.querySelector('.game-gallery__main img').src = game.image_url;
        
        // Обновляем кнопку цены
        const priceBtn = gameDetails.querySelector('.game-details__price');
        priceBtn.textContent = `${game.price} РУБ`;
        priceBtn.dataset.id = game.id;
        priceBtn.dataset.title = game.title;
        priceBtn.dataset.price = game.price;
        priceBtn.dataset.image = game.image_url;

        // Описание
        if (game.description) {
            gameDetails.querySelector('.game-details__desc p').textContent = game.description;
        }

        // Инициализируем кнопку "В корзину" для этой страницы
        initAddToCart();

    } catch (error) {
        console.error('Ошибка загрузки игры:', error);
        gameDetails.innerHTML = `<p style="color:red;">Игра не найдена или сервер недоступен.</p>`;
    }
}

// Валидация формы обратной связи
function initFeedbackForm() {
    const form = document.querySelector('.feedback-form');
    if (!form) return;

    const rules = [
        { id: 'name',    validate: v => v.trim().length >= 2, message: 'Введите имя (минимум 2 символа)' },
        { id: 'email',   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), message: 'Введите корректный email' },
        { id: 'message', validate: v => v.trim().length >= 10, message: 'Сообщение должно быть не короче 10 символов' }
    ];

    rules.forEach(rule => {
        const input = document.getElementById(rule.id);
        if (!input) return;
        const error = document.createElement('span');
        error.className = 'form-error';
        error.dataset.for = rule.id;
        input.parentElement.appendChild(error);
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        let isValid = true;

        rules.forEach(rule => {
            const input = document.getElementById(rule.id);
            const error = form.querySelector(`.form-error[data-for="${rule.id}"]`);

            if (!rule.validate(input.value)) {
                error.textContent = rule.message;
                error.classList.add('form-error--visible');
                input.classList.add('form-input--invalid');
                isValid = false;
            } else {
                error.textContent = '';
                error.classList.remove('form-error--visible');
                input.classList.remove('form-input--invalid');
            }
        });

        const success = form.querySelector('.form-success');
        if (isValid) {
            success.textContent = 'Спасибо! Форма заполнена верно.';
            success.classList.add('form-success--visible');
            form.reset();
        } else {
            success.classList.remove('form-success--visible');
        }
    });

    form.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            const error = form.querySelector(`.form-error[data-for="${input.id}"]`);
            if (error) {
                error.textContent = '';
                error.classList.remove('form-error--visible');
                input.classList.remove('form-input--invalid');
            }
        });
    });
}

// Фильтр и сортировка каталога
function initCatalogFilter() {
    const form = document.querySelector('.filter-form');
    if (!form) return;

    const cards = Array.from(document.querySelectorAll('.catalog .game-card'));
    const empty = document.querySelector('.catalog__empty');

    const genreSelect = form.elements['genre'];
    const sortSelect  = form.elements['sort'];
    const priceFromEl = form.elements['priceFrom'];
    const priceToEl   = form.elements['priceTo'];

    function applyFilters() {
        const genre  = genreSelect ? genreSelect.value : 'any';
        const sortBy = sortSelect  ? sortSelect.value  : 'default';
        
        const fromVal = parseFloat(priceFromEl.value);
        const toVal   = parseFloat(priceToEl.value);
        const priceFrom = isNaN(fromVal) ? 0 : fromVal;
        const priceTo   = isNaN(toVal) || toVal === 0 ? Infinity : toVal;

        let visibleCount = 0;
        cards.forEach(card => {
            const cardGenre = card.dataset.genre;
            const cardPrice = Number(card.dataset.price);

            const matchGenre = (genre === 'any' || cardGenre === genre);
            const matchPrice = cardPrice >= priceFrom && cardPrice <= priceTo;

            if (matchGenre && matchPrice) {
                card.style.display = ''; 
                visibleCount++;
            } else {
                card.style.display = 'none'; 
            }
        });

        const sorted = cards.slice().sort((a, b) => {
            if (sortBy === 'price-asc')  return Number(a.dataset.price) - Number(b.dataset.price);
            if (sortBy === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
            if (sortBy === 'date-asc')   return Number(a.dataset.date)  - Number(b.dataset.date);
            if (sortBy === 'date-desc')  return Number(b.dataset.date)  - Number(a.dataset.date);
            return 0;
        });
        sorted.forEach((card, index) => { card.style.order = index; });

        if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Предотвращаем дублирование событий, клонируя форму
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('change', applyFilters);
    newForm.addEventListener('input', applyFilters);
    newForm.addEventListener('reset', () => setTimeout(applyFilters, 0));

    applyFilters();
}

// Кнопки добавления в корзину
function initAddToCart() {
    const priceButtons = document.querySelectorAll('.game-card__price, .game-details__price');
    if (!priceButtons.length) return;

    const cartIds = new Set(getCart().map(g => g.id));

    priceButtons.forEach(btn => {
        // Очищаем старые обработчики, клонируя кнопку
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        const card = newBtn.closest('.game-card');
        const id = newBtn.dataset.id || (card ? card.dataset.id : null);
        if (!id) return;

        // Если товар уже в корзине, просто красим кнопку (текст не трогаем)
        if (cartIds.has(id)) {
            newBtn.classList.add('game-card__price--in-cart');
        }

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Если товар уже в корзине — ведем в корзину
            if (newBtn.classList.contains('game-card__price--in-cart')) {
                window.location.href = 'cart.html';
                return;
            }

            // Собираем данные
            const title = newBtn.dataset.title || (card ? card.querySelector('.game-card__title').textContent.trim() : 'Без названия');
            const price = Number(newBtn.dataset.price || (card ? card.dataset.price : 0));
            const image = newBtn.dataset.image || (card ? card.querySelector('.game-card__img').getAttribute('src') : 'logo.png');

            const added = addToCart({ id, title, price, image });
            
            if (added) {
                // Просто добавляем класс (кнопка станет зеленой), текст не меняем
                newBtn.classList.add('game-card__price--in-cart');
            }
        });
    });
}

// Отрисовка корзины и кнопка "КУПИТЬ"
function initCartPage() {
    const list = document.getElementById('cartList');
    if (!list) return;

    const empty = document.getElementById('cartEmpty');
    const total = document.getElementById('cartTotal');
    const summary = document.querySelector('.cart-summary');

    function render() {
        const cart = getCart();
        list.innerHTML = '';
        let sum = 0;

        cart.forEach(item => {
            const price = Number(item.price) || 0;
            sum += price;
            
            const article = document.createElement('article');
            article.className = 'game-card game-card--cart';
            article.dataset.id = item.id;
            const imgSrc = item.image || 'logo.png';

            article.innerHTML = `
                <img src="${imgSrc}" alt="Обложка игры ${item.title}" class="game-card__img">
                <div class="game-card__content">
                    <h2 class="game-card__title">${item.title}</h2>
                    <p class="game-card__desc">КРАТКОЕ ОПИСАНИЕ</p>
                    <button class="game-card__price game-card__price--remove" type="button" data-id="${item.id}">${price} РУБ</button>
                </div>
                <a href="game.html?id=${item.id}" class="game-card__link" aria-label="Перейти к игре ${item.title}"></a>
            `;
            list.appendChild(article);
        });

        if (total) total.textContent = sum;
        if (empty) empty.hidden = cart.length !== 0;
        if (summary) summary.hidden = cart.length === 0;

        // Обработчик удаления
        list.querySelectorAll('.game-card__price--remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFromCart(btn.dataset.id);
                render();
            });
        });

        // Логика кнопки "КУПИТЬ"
        const buyBtn = document.querySelector('.buy-button');
        if (buyBtn && cart.length > 0) {
            const newBuyBtn = buyBtn.cloneNode(true);
            buyBtn.parentNode.replaceChild(newBuyBtn, buyBtn);

            newBuyBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    alert('Чтобы сделать заказ, необходимо войти в аккаунт.');
                    window.location.href = 'login.html';
                    return;
                }

                newBuyBtn.textContent = 'ОФОРМЛЯЕМ...';
                newBuyBtn.disabled = true;

                try {
                    for (const item of cart) {
                        const response = await fetch(`${API_URL}/orders/${item.id}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (response.status === 401) {
                            localStorage.removeItem('token');
                            alert('Сессия истекла. Пожалуйста, войдите снова.');
                            window.location.href = 'login.html';
                            return;
                        }
                    }
                    
                    localStorage.removeItem(CART_KEY);
                    updateCartBadge();
                    alert('Заказ успешно оформлен! Посмотреть его можно в разделе "Мои заказы".');
                    window.location.href = 'orders.html';

                } catch (err) {
                    alert('Ошибка при оформлении заказа. Проверьте связь с сервером.');
                    newBuyBtn.textContent = 'КУПИТЬ';
                    newBuyBtn.disabled = false;
                }
            });
        }
    }
    render();
}

const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

function renderCurrency(state, data, errorText) {
    const box = document.querySelector('.currency-widget');
    if (!box) return;

    box.classList.remove('currency-widget--loading', 'currency-widget--error', 'currency-widget--ready');

    if (state === 'loading') {
        box.classList.add('currency-widget--loading');
        box.innerHTML = '<p class="currency-widget__text">Загрузка курсов валют…</p>';
    } else if (state === 'error') {
        box.classList.add('currency-widget--error');
        box.innerHTML = `<p class="currency-widget__text">Не удалось загрузить курсы. ${errorText ? '('+errorText+') ' : ''}Проверьте интернет.</p>`;
    } else {
        box.classList.add('currency-widget--ready');
        const usd  = data.Valute.USD.Value.toFixed(2);
        const eur  = data.Valute.EUR.Value.toFixed(2);
        const date = new Date(data.Date).toLocaleDateString('ru-RU');
        box.innerHTML = `
            <h3 class="currency-widget__title">Курсы валют ЦБ РФ</h3>
            <p class="currency-widget__date">на ${date}</p>
            <ul class="currency-widget__list">
                <li>1 USD = ${usd} ₽</li>
                <li>1 EUR = ${eur} ₽</li>
            </ul>
            <p class="currency-widget__hint">Цены в каталоге указаны в рублях.</p>
        `;
    }
}

async function loadCurrencyRates() {
    if (!document.querySelector('.currency-widget')) return;
    renderCurrency('loading');
    try {
        const response = await fetch(CBR_URL);
        if (!response.ok) throw new Error('Статус ' + response.status);
        const data = await response.json();
        renderCurrency('ready', data);
    } catch (err) {
        renderCurrency('error', null, err.message || '');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    initFeedbackForm();
    
    // Запускаем загрузку данных с сервера в зависимости от страницы
    fetchGames(); 
    fetchGamePage();

    // Если мы на странице корзины, рендерим её
    if (document.getElementById('cartList')) {
        initCartPage();
    }

    // Запускаем внешний API валют
    loadCurrencyRates();
});