const ORDERS_API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const ordersList = document.getElementById('ordersList');
    const emptyMessage = document.getElementById('ordersEmpty');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${ORDERS_API_URL}/my-orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
            return;
        }

        const orders = await response.json();

        if (!orders || orders.length === 0) {
            if (emptyMessage) emptyMessage.hidden = false;
            return;
        }

        orders.forEach(order => {
            const article = document.createElement('article');
            article.className = 'game-card';
            
            let orderDate = 'Неизвестно';
            if (order.created_at) {
                try {
                    orderDate = new Date(order.created_at.replace(' ', 'T')).toLocaleString('ru-RU');
                } catch(e) {}
            }

            article.innerHTML = `
                <img src="${order.image_url || 'logo.png'}" alt="${order.title}" class="game-card__img">
                <div class="game-card__content">
                    <h2 class="game-card__title">${order.title}</h2>
                    <p class="game-card__desc" style="color: #555;">Куплено: ${orderDate}</p>
                    <span class="game-card__price" style="cursor: default; align-self: flex-end; margin-top: auto;">${order.price} РУБ</span>
                </div>
            `;
            ordersList.appendChild(article);
        });

    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        if (ordersList) {
            ordersList.innerHTML = `<p style="color:red; text-align:center;">Ошибка связи с сервером. Проверьте, запущен ли backend.</p>`;
        }
    }
});