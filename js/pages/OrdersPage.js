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

	async viewOrder(orderId) {
		try {
			this.showLoading();

			// Попробуйте сначала простую версию для тестирования
			const data = await this.apiCall(`api/get_order_simple.php?order_id=${orderId}`);

			// Если простая версия работает, переключитесь на основную:
			// const data = await this.apiCall(`api/get_order.php?order_id=${orderId}`);

			if (data.status === 'success') {
				const order = data.order;
				const content = this.renderOrderDetails(order);
				const footer = this.renderOrderFooter(order);

				this.showModal(`Order #${order.order_id}`, content, footer);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			console.error('Error loading order:', error);
			this.showError('Failed to load order details: ' + error.message);

			// Показать демо-данные при ошибке
			this.showDemoOrder(orderId);
		} finally {
			this.hideLoading();
		}
	}

	showDemoOrder(orderId) {
		// Демо-данные для тестирования
		const demoOrder = {
			order_id: orderId,
			origin: 'Demo Origin',
			destination: 'Demo Destination',
			status: 'pending',
			price: '1000.00',
			weight: '250',
			description: 'Demo order description',
			created_at: new Date().toISOString(),
			client_name: 'Demo Client',
			company_name: 'Demo Company'
		};

		const content = this.renderOrderDetails(demoOrder);
		const footer = `
            <button class="btn-secondary" onclick="ordersPage.closeModal()">Close</button>
            <div style="color: #856404; background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 10px;">
                <small><i class="fas fa-info-circle"></i> Showing demo data due to API error</small>
            </div>
        `;

		this.showModal(`Order #${orderId} (Demo)`, content, footer);
	}

	renderOrderDetails(order) {
		const statusClass = this.getStatusClass(order.status);

		return `
            <div class="view-card">
                <div class="form-row">
                    <div class="view-field">
                        <div class="view-label">Order ID</div>
                        <div class="view-value">#${order.order_id}</div>
                    </div>
                    <div class="view-field">
                        <div class="view-label">Status</div>
                        <div class="view-value">
                            <span class="status-badge ${statusClass}">${order.status}</span>
                        </div>
                    </div>
                </div>
                
                <div class="view-field">
                    <div class="view-label">Client</div>
                    <div class="view-value">
                        <div><strong>${order.client_name}</strong></div>
                        ${order.company_name ? `<div>${order.company_name}</div>` : ''}
                        ${order.client_email ? `<div>${order.client_email}</div>` : ''}
                        ${order.client_phone ? `<div>${order.client_phone}</div>` : ''}
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="view-field">
                        <div class="view-label">Origin</div>
                        <div class="view-value">${order.origin}</div>
                    </div>
                    <div class="view-field">
                        <div class="view-label">Destination</div>
                        <div class="view-value">${order.destination}</div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="view-field">
                        <div class="view-label">Price</div>
                        <div class="view-value">$${parseFloat(order.price || 0).toFixed(2)}</div>
                    </div>
                    <div class="view-field">
                        <div class="view-label">Weight</div>
                        <div class="view-value">${order.weight ? order.weight + ' kg' : '-'}</div>
                    </div>
                </div>
                
                ${order.driver_name ? `
                <div class="view-field">
                    <div class="view-label" style="color: #28a745; font-weight: 600;">Assigned Driver</div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 8px;">
                        <div><strong>Driver:</strong> ${order.driver_name}</div>
                        ${order.vehicle_make ? `<div><strong>Vehicle:</strong> ${order.vehicle_make} ${order.vehicle_model} (${order.vehicle_plate})</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${order.description ? `
                <div class="view-field">
                    <div class="view-label">Description</div>
                    <div class="view-value">${order.description}</div>
                </div>
                ` : ''}
                
                <div class="form-row">
                    <div class="view-field">
                        <div class="view-label">Created</div>
                        <div class="view-value">${new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    ${order.updated_at ? `
                    <div class="view-field">
                        <div class="view-label">Last Updated</div>
                        <div class="view-value">${new Date(order.updated_at).toLocaleString()}</div>
                    </div>
                    ` : ''}
                </div>
                
                ${order.delivery_date ? `
                <div class="view-field">
                    <div class="view-label">Delivery Date</div>
                    <div class="view-value">${new Date(order.delivery_date).toLocaleDateString()}</div>
                </div>
                ` : ''}
            </div>
        `;
	}

	renderOrderFooter(order) {
		return `
            <button class="btn-secondary" onclick="ordersPage.closeModal()">Close</button>
            <button class="btn-primary" onclick="ordersPage.editOrder(${order.order_id})">Edit Order</button>
        `;
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
