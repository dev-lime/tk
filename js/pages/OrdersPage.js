class OrdersPage extends BasePage {
	constructor() {
		super();
		this.pageName = 'orders';
	}

	async load() {
		const response = await fetch('pages/orders.html');
		return await response.text();
	}

	async init() {
		super.init();

		// Загружаем данные заказов
		await this.loadOrdersData();

		console.log('Orders page initialized');
	}

	async loadOrdersData() {
		try {
			const response = await fetch('api/orders.php');
			const data = await response.json();

			if (data.status === 'success') {
				this.renderOrdersTable(data.orders);
			}
		} catch (error) {
			console.error('Error loading orders:', error);
		}
	}

	renderOrdersTable(orders) {
		const tbody = document.querySelector('.orders-table tbody');
		if (!tbody) return;

		tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.client_name}</td>
                <td>${order.origin}</td>
                <td>${order.destination}</td>
                <td>${order.weight_kg}</td>
                <td><span class="status status-${order.status}">${order.status_text}</span></td>
                <td><button class="action-btn">View</button></td>
            </tr>
        `).join('');
	}

	async destroy() {
		super.destroy();
	}
}