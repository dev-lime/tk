class DriversPage extends TablePage {
	constructor() {
		super();
		this.pageName = 'drivers';
	}

	async load() {
		return `
            <div class="content-header">
                <h1 class="content-title">Drivers Management</h1>
            </div>

            <div class="filters-section">
                <div class="filter-group">
                    <input type="text" id="searchDrivers" placeholder="Search drivers..." class="filter-input">
                    <select id="statusFilter" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="on_delivery">On Delivery</option>
                        <option value="assigned">Assigned</option>
                    </select>
                    <button class="filter-btn">Apply Filters</button>
                    <button class="reset-filters">Reset</button>
                </div>
            </div>

            <div id="driversTableContainer"></div>
            <div id="paginationContainer"></div>
        `;
	}

	async loadData() {
		try {
			const params = new URLSearchParams({
				page: this.currentPage,
				limit: this.itemsPerPage,
				...(this.sortField && { sort: this.sortField, order: this.sortDirection }),
				...this.filters,
				role: 'driver'
			});

			const data = await this.apiCall(`api/get_users.php?${params}`);

			if (data.status === 'success') {
				// Загружаем статусы водителей из заказов
				const driversWithStatus = await this.enrichDriversWithStatus(data.users);
				this.renderDriversTable(driversWithStatus);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load drivers: ' + error.message);
		}
	}

	async enrichDriversWithStatus(drivers) {
		try {
			const statusData = await this.apiCall('api/get_drivers_status.php');

			if (statusData.status === 'success') {
				return drivers.map(driver => ({
					...driver,
					driver_status: statusData.driver_statuses[driver.user_id] || 'available',
					license_number: driver.specialized_info?.driver?.license_number || 'Not set'
				}));
			}
		} catch (error) {
			console.error('Error loading driver statuses:', error);
		}

		return drivers.map(driver => ({
			...driver,
			driver_status: 'available',
			license_number: driver.specialized_info?.driver?.license_number || 'Not set'
		}));
	}

	renderDriversTable(drivers) {
		const headers = [
			{ field: 'user_id', label: 'ID' },
			{ field: 'first_name', label: 'First Name' },
			{ field: 'last_name', label: 'Last Name' },
			{ field: 'phone', label: 'Phone' },
			{ field: 'email', label: 'Email' },
			{ field: 'license_number', label: 'License Number' },
			{ field: 'driver_status', label: 'Status' },
			{ field: 'created_at', label: 'Registered' }
		];

		const tableHTML = this.renderTable(headers, drivers);
		document.getElementById('driversTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(driver) {
		const phone = driver.phone || '-';
		const email = driver.email || '-';
		const statusClass = this.getDriverStatusClass(driver.driver_status);
		const statusText = this.getDriverStatusText(driver.driver_status);

		return `
            <tr>
                <td>${driver.user_id}</td>
                <td>${driver.first_name || '-'}</td>
                <td>${driver.last_name || '-'}</td>
                <td>${phone}</td>
                <td>${email}</td>
                <td>${driver.license_number}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(driver.created_at).toLocaleDateString()}</td>
            </tr>
        `;
	}

	getDriverStatusClass(status) {
		const statusClasses = {
			'available': 'success',
			'assigned': 'warning',
			'on_delivery': 'primary'
		};
		return statusClasses[status] || 'default';
	}

	getDriverStatusText(status) {
		const statusTexts = {
			'available': 'Available',
			'assigned': 'Assigned',
			'on_delivery': 'On Delivery'
		};
		return statusTexts[status] || 'Unknown';
	}

	handleFilter() {
		const search = document.getElementById('searchDrivers').value;
		const status = document.getElementById('statusFilter').value;

		this.filters = {};
		if (search) this.filters.search = search;
		if (status) this.filters.status = status;

		this.currentPage = 1;
		this.loadData();
	}
}

window.driversPage = new DriversPage();
