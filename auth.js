const AUTH_API_URL = '/api';

// Функция для обновления шапки (показывает имя пользователя, если вошел)
function updateAuthHeader() {
    const authLinkContainer = document.getElementById('navAuthLink');
    if (!authLinkContainer) return;

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
        // Если вошел, показываем ссылку на заказы и кнопку выхода
        authLinkContainer.innerHTML = `
            <a href="orders.html" class="nav__link" style="margin-right: 15px;">МОИ ЗАКАЗЫ</a>
            <a href="#" class="nav__link" id="logoutBtn" style="color: #8b0000;">ВЫЙТИ (${username})</a>
        `;

        // Логика выхода
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    } else {
        // Если не вошел
        authLinkContainer.innerHTML = `<a href="login.html" class="nav__link">ВОЙТИ</a>`;
    }
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateAuthHeader();

    const token = localStorage.getItem('token');
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');

    // Если пользователь уже авторизован и пытается зайти на страницу входа/регистрации — перекидываем в каталог
    if (token && isAuthPage) {
        window.location.href = 'shop.html';
        return;
    }

    // Обработка формы ВХОДА
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('loginError');
            if (errorEl) errorEl.textContent = '';

            const formData = new URLSearchParams();
            formData.append('username', document.getElementById('username').value);
            formData.append('password', document.getElementById('password').value);

            try {
                const response = await fetch(`${AUTH_API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Ошибка входа');
                }

                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', document.getElementById('username').value);
                window.location.href = 'shop.html';

            } catch (err) {
                if (errorEl) errorEl.textContent = err.message;
            }
        });
    }

    // Обработка формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('registerError');
            if (errorEl) errorEl.textContent = '';

            const payload = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch(`${AUTH_API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Ошибка регистрации');
                }

                alert('Регистрация успешна! Теперь войдите.');
                window.location.href = 'login.html';

            } catch (err) {
                if (errorEl) errorEl.textContent = err.message;
            }
        });
    }
});