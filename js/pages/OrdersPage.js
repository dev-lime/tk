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
			const data = await this.apiCall(`api/get_order.php?order_id=${orderId}`);

			if (data.status === 'success') {
				const order = data.order;
				const content = this.renderOrderDetails(order);
				const footer = this.renderOrderFooter(order);

				this.showModal(`Order #${order.order_id}`, content, footer);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load order details: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	renderOrderDetails(order) {
		const statusClass = this.getStatusClass(order.status);
		const vehicleStatusClass = this.getVehicleStatusClass(order.vehicle_status);

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
                        <div>${order.client_name}</div>
                        ${order.company_name ? `<div>Company: ${order.company_name}</div>` : ''}
                        ${order.client_email ? `<div>Email: ${order.client_email}</div>` : ''}
                        ${order.client_phone ? `<div>Phone: ${order.client_phone}</div>` : ''}
                    </div>
                </div>
                
                ${order.dispatcher_name ? `
                <div class="view-field">
                    <div class="view-label" style="color: #6f42c1; font-weight: 600;">Dispatcher</div>
                    <div class="view-value">${order.dispatcher_name}</div>
                </div>
                ` : ''}
                
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
                    <div style="border-radius: 6px; margin-top: 8px;">
                        <div>Driver: ${order.driver_name}</div>
                        ${order.driver_license ? `<div>License: ${order.driver_license}</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${order.vehicle_model ? `
                <div class="view-field">
                    <div class="view-label" style="color: #fd7e14; font-weight: 600;">Assigned Vehicle</div>
                    <div style="border-radius: 6px; margin-top: 8px;">
                        <div>Model: ${order.vehicle_model}</div>
                        <div>License Plate: ${order.vehicle_plate}</div>
                        <div>Capacity: ${order.vehicle_capacity ? order.vehicle_capacity + ' kg' : '-'}</div>
                        ${order.vehicle_status ? `
                        <div>Status:
                            <span class="status-badge ${vehicleStatusClass}">${order.vehicle_status}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                ${order.description ? `
                <div class="view-field">
                    <div class="view-label">Cargo Description</div>
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
                
                ${order.history && order.history.length > 0 ? `
                <div class="view-field">
                    <div class="view-label">Order History</div>
                    <div style="padding: 12px; border-radius: 6px; margin-top: 8px; max-height: 200px; overflow-y: auto;">
                        ${order.history.map(entry => `
                            <div style="padding: 4px 0; border-bottom: 1px solid #e9ecef;">
                                <div>${entry.action} - ${new Date(entry.created_at).toLocaleString()}</div>
                                ${entry.description ? `<div style="font-size: 12px; color: #666;">${entry.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
	}

	getVehicleStatusClass(status) {
		const statusClasses = {
			'available': 'success',
			'in_use': 'warning',
			'maintenance': 'error',
			'out_of_service': 'error'
		};
		return statusClasses[status] || 'default';
	}

	renderOrderFooter(order) {
		return `
            <button class="btn-secondary" onclick="ordersPage.closeModal()">Close</button>
            <button class="btn-primary" onclick="ordersPage.editOrder(${order.order_id})">Edit Order</button>
        `;
	}

	async editOrder(orderId) {
		try {
			this.showLoading();

			// Загружаем данные заказа для редактирования
			const data = await this.apiCall(`api/get_order.php?order_id=${orderId}`);

			if (data.status === 'success') {
				const order = data.order;
				const content = this.renderEditForm(order);
				const footer = this.renderEditFooter(order);

				this.showModal(`Edit Order #${order.order_id}`, content, footer);

				// Загружаем дополнительные данные для выпадающих списков
				await this.loadEditFormData(orderId);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load order for editing: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	renderEditForm(order) {
		const statusOptions = [
			{ value: 'pending', label: 'Pending' },
			{ value: 'assigned', label: 'Assigned' },
			{ value: 'in_transit', label: 'In Transit' },
			{ value: 'delivered', label: 'Delivered' },
			{ value: 'cancelled', label: 'Cancelled' }
		];

		return `
        <div class="edit-form">
            <div class="form-row">
                <div class="form-group">
                    <label class="label">Origin *</label>
                    <input type="text" id="editOrigin" value="${order.origin || ''}" required>
                </div>
                <div class="form-group">
                    <label class="label">Destination *</label>
                    <input type="text" id="editDestination" value="${order.destination || ''}" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="label">Price ($)</label>
                    <input type="number" id="editPrice" step="0.01" value="${order.price || ''}">
                </div>
                <div class="form-group">
                    <label class="label">Weight (kg)</label>
                    <input type="number" id="editWeight" value="${order.weight || ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="label">Status</label>
                    <select class="form-select" id="editStatus">
                        ${statusOptions.map(option => `
                            <option value="${option.value}" ${order.status === option.value ? 'selected' : ''}>
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="label">Delivery Date</label>
                    <input type="date" id="editDeliveryDate" 
                           value="${order.delivery_date ? order.delivery_date.split('T')[0] : ''}">
                </div>
            </div>

            <div class="form-group">
                <label class="label">
                    Driver
                    <span class="availability-info" id="driverAvailabilityInfo"></span>
                </label>
                <select class="form-select" id="editDriverId">
                    <option value="">No driver assigned</option>
                    <!-- Drivers will be loaded dynamically -->
                </select>
            </div>

            <div class="form-group">
                <label class="label">Vehicle</label>
                <select class="form-select" id="editVehicleId">
                    <option value="">No vehicle assigned</option>
                    <!-- Vehicles will be loaded dynamically -->
                </select>
            </div>

            <div class="form-group">
                <label class="label">Cargo Description</label>
                <textarea class="form-textarea" id="editDescription" rows="3">${order.description || ''}</textarea>
            </div>

            <div id="editFormMessages"></div>
        </div>
    `;
	}

	renderEditFooter(order) {
		return `
            <button class="btn-secondary" onclick="ordersPage.closeModal()">Cancel</button>
            <button class="btn-primary" onclick="ordersPage.updateOrder(${order.order_id})">Save Changes</button>
        `;
	}

	async loadEditFormData(orderId) {
		try {
			// Загружаем список всех водителей с информацией о занятости
			const driversData = await this.apiCall('api/get_drivers.php');
			if (driversData.status === 'success') {
				const driversSelect = document.getElementById('editDriverId');
				driversSelect.innerHTML = '<option value="">No driver assigned</option>' +
					driversData.drivers.map(driver => `
                        <option value="${driver.user_id}" 
                                ${driver.availability === 'busy' ? 'style="color: #dc3545; font-style: italic;"' : ''}
                                data-availability="${driver.availability}">
                            ${driver.first_name} ${driver.last_name} 
                            (${driver.license_number})
                            ${driver.availability === 'busy' ? ' - BUSY' : ' - Available'}
                        </option>
                    `).join('');

				// Устанавливаем текущего водителя если есть
				const currentOrder = await this.apiCall(`api/get_order.php?order_id=${orderId}`);
				if (currentOrder.status === 'success' && currentOrder.order.driver_id) {
					driversSelect.value = currentOrder.order.driver_id;
				}
			}

			// Загружаем список всех транспортных средств (без информации о занятости)
			const vehiclesData = await this.apiCall('api/get_vehicles.php');
			if (vehiclesData.status === 'success') {
				const vehiclesSelect = document.getElementById('editVehicleId');
				vehiclesSelect.innerHTML = '<option value="">No vehicle assigned</option>' +
					vehiclesData.vehicles.map(vehicle => `
                        <option value="${vehicle.vehicle_id}">
                            ${vehicle.model} (${vehicle.plate_number}) - ${vehicle.capacity_kg}kg
                        </option>
                    `).join('');

				// Устанавливаем текущее транспортное средство если есть
				const currentOrder = await this.apiCall(`api/get_order.php?order_id=${orderId}`);
				if (currentOrder.status === 'success' && currentOrder.order.vehicle_id) {
					vehiclesSelect.value = currentOrder.order.vehicle_id;
				}
			}

			// Добавляем обработчики для показа предупреждений только для водителей
			this.setupDriverAvailabilityWarnings();

		} catch (error) {
			console.error('Error loading form data:', error);
		}
	}

	setupDriverAvailabilityWarnings() {
		const driversSelect = document.getElementById('editDriverId');
		const driverInfo = document.getElementById('driverAvailabilityInfo');
		const messagesContainer = document.getElementById('editFormMessages');

		const updateDriverAvailabilityInfo = () => {
			const selectedOption = driversSelect.options[driversSelect.selectedIndex];
			const availability = selectedOption.getAttribute('data-availability');

			if (availability === 'busy') {
				driverInfo.innerHTML = '<span class="availability-busy">● Busy</span>';
			} else if (availability === 'available') {
				driverInfo.innerHTML = '<span class="availability-available">● Available</span>';
			} else {
				driverInfo.innerHTML = '';
			}
		};

		driversSelect.addEventListener('change', () => {
			updateDriverAvailabilityInfo();

			const selectedOption = driversSelect.options[driversSelect.selectedIndex];
			const availability = selectedOption.getAttribute('data-availability');

			if (availability === 'busy') {
				this.showFormWarning('Selected driver is currently busy with another order. This may cause scheduling conflicts.');
			} else {
				this.clearFormWarning();
			}
		});

		// Инициализируем информацию при загрузке
		updateDriverAvailabilityInfo();
	}

	showFormWarning(message) {
		const messagesContainer = document.getElementById('editFormMessages');
		messagesContainer.innerHTML = `
            <div class="form-message warning" style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
	}

	clearFormWarning() {
		const messagesContainer = document.getElementById('editFormMessages');
		messagesContainer.innerHTML = '';
	}

	async updateOrder(orderId) {
		try {
			this.showLoading();

			// Собираем данные формы
			const formData = {
				order_id: orderId,
				origin: document.getElementById('editOrigin').value,
				destination: document.getElementById('editDestination').value,
				cargo_description: document.getElementById('editDescription').value,
				weight_kg: document.getElementById('editWeight').value || null,
				price: document.getElementById('editPrice').value || null,
				status: document.getElementById('editStatus').value,
				delivery_date: document.getElementById('editDeliveryDate').value || null,
				driver_id: document.getElementById('editDriverId').value || null,
				vehicle_id: document.getElementById('editVehicleId').value || null
			};

			// Валидация
			if (!formData.origin.trim() || !formData.destination.trim()) {
				throw new Error('Origin and destination are required');
			}

			const response = await this.apiCall('api/update_order.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.status === 'success') {
				this.showSuccess('Order updated successfully');
				this.closeModal();
				this.loadData(); // Обновляем таблицу
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to update order: ' + error.message);
		} finally {
			this.hideLoading();
		}
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
