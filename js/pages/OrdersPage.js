class OrdersPage extends TablePage {
	constructor() {
		super();
		this.pageName = 'orders';
	}

	async load() {
		return `
            <div class="content-header">
                <h1 class="content-title">Orders Management</h1>
            </div>

			<div class="filter-group">
				<select id="statusFilter" class="filter-select">
					<option value="">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="assigned">Assigned</option>
					<option value="in_transit">In Transit</option>
					<option value="delivered">Delivered</option>
					<option value="cancelled">Cancelled</option>
				</select>
				<input type="text" id="searchOrders" placeholder="Search orders..." class="filter-input">
				<input type="date" id="dateFromFilter" class="filter-input" placeholder="From Date">
				<input type="date" id="dateToFilter" class="filter-input" placeholder="To Date">
				<button class="reset-filters">Reset</button>
				<button class="filter-btn">Apply Filters</button>
			</div>

            <div id="ordersTableContainer"></div>
            <div id="paginationContainer"></div>
			
			<!-- ДОЛЖНО БЫТЬ ВНУТРИ PAGINATIONCONTAINER !!! --!>
			<button class="page-btn" onclick="ordersPage.openCreateModal()">
				<i class="fas fa-plus"></i> Create Order
			</button>
        `;
	}

	async loadData() {
		try {
			const params = new URLSearchParams({
				page: this.currentPage,
				limit: this.itemsPerPage,
				...(this.sortField && { sort: this.sortField, order: this.sortDirection }),
				...this.filters
			});

			const data = await this.apiCall(`api/get_orders.php?${params}`);

			if (data.status === 'success') {
				this.renderOrdersTable(data.orders);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load orders: ' + error.message);
		}
	}

	renderOrdersTable(orders) {
		const headers = [
			{ field: 'order_id', label: 'Order ID' },
			{ field: 'client_name', label: 'Client' },
			{ field: 'origin', label: 'Origin' },
			{ field: 'destination', label: 'Destination' },
			{ field: 'status', label: 'Status' },
			{ field: 'price', label: 'Price' },
			{ field: 'created_at', label: 'Created' },
			{ field: 'actions', label: 'Actions' }
		];

		const tableHTML = this.renderTable(headers, orders);
		document.getElementById('ordersTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(order) {
		const statusClass = this.getStatusClass(order.status);

		return `
            <tr>
                <td>#${order.order_id}</td>
                <td>${order.client_name}</td>
                <td>${order.origin}</td>
                <td>${order.destination}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>$${order.price}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="ordersPage.viewOrder(${order.order_id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="ordersPage.editOrder(${order.order_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="ordersPage.cancelOrder(${order.order_id})" title="Cancel">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
	}

	getStatusClass(status) {
		const statusClasses = {
			'pending': 'warning',
			'assigned': 'info',
			'in_transit': 'primary',
			'delivered': 'success',
			'cancelled': 'error'
		};
		return statusClasses[status] || 'default';
	}

	handleFilter() {
		const search = document.getElementById('searchOrders').value;
		const status = document.getElementById('statusFilter').value;
		const dateFrom = document.getElementById('dateFromFilter').value;
		const dateTo = document.getElementById('dateToFilter').value;

		this.filters = {};
		if (search) this.filters.search = search;
		if (status) this.filters.status = status;
		if (dateFrom) this.filters.date_from = dateFrom;
		if (dateTo) this.filters.date_to = dateTo;

		this.currentPage = 1;
		this.loadData();
	}

	openCreateModal() {
		this.showSuccess('Create order functionality will be implemented soon!');
	}

	viewOrder(orderId) {
		this.showSuccess(`View order ${orderId} functionality will be implemented soon!`);
	}

	editOrder(orderId) {
		this.showSuccess(`Edit order ${orderId} functionality will be implemented soon!`);
	}

	async cancelOrder(orderId) {
		if (!confirm('Are you sure you want to cancel this order?')) return;

		try {
			const data = await this.apiCall('api/cancel_order.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ order_id: orderId })
			});

			if (data.status === 'success') {
				this.showSuccess('Order cancelled successfully');
				this.loadData();
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to cancel order: ' + error.message);
		}
	}
}

// Создаем глобальный экземпляр
window.ordersPage = new OrdersPage();