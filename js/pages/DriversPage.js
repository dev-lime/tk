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
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
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
				role: 'driver' // Фильтр только по водителям
			});

			const data = await this.apiCall(`api/get_users.php?${params}`);

			if (data.status === 'success') {
				this.renderDriversTable(data.users);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load drivers: ' + error.message);
		}
	}

	renderDriversTable(drivers) {
		const headers = [
			{ field: 'user_id', label: 'ID' },
			{ field: 'username', label: 'Username' },
			{ field: 'first_name', label: 'First Name' },
			{ field: 'last_name', label: 'Last Name' },
			{ field: 'email', label: 'Email' },
			{ field: 'phone', label: 'Phone' },
			{ field: 'license_number', label: 'License Number' },
			{ field: 'status', label: 'Status' },
			{ field: 'created_at', label: 'Created' },
			{ field: 'actions', label: 'Actions' }
		];

		const tableHTML = this.renderTable(headers, drivers);
		document.getElementById('driversTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(driver) {
		const licenseNumber = driver.specialized_info?.driver?.license_number || 'Not set';
		const phone = driver.phone || '-';
		const email = driver.email || '-';
		const status = this.getDriverStatus(driver);
		const statusClass = status === 'active' ? 'success' : 'default';

		return `
            <tr>
                <td>${driver.user_id}</td>
                <td>${driver.username}</td>
                <td>${driver.first_name || '-'}</td>
                <td>${driver.last_name || '-'}</td>
                <td>${email}</td>
                <td>${phone}</td>
                <td>${licenseNumber}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${new Date(driver.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="driversPage.editDriver(${driver.user_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="driversPage.deleteDriver(${driver.user_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
	}

	getDriverStatus(driver) {
		// Необходимо подтянуть данные из таблицы транспорта
		return 'active'; // Временная реализация
	}

	handleFilter() {
		const searchInput = this.getElement('searchDrivers');
		const statusSelect = this.getElement('statusFilter');

		if (!searchInput || !statusSelect) {
			this.showError('Filter elements not found');
			return;
		}

		const search = searchInput.value;
		const status = statusSelect.value;

		this.filters = {};
		if (search) this.filters.search = search;
		if (status) this.filters.status = status;

		this.currentPage = 1;
		this.loadData();
	}

	editDriver(userId) {
		this.showSuccess(`Edit driver ${userId} - to be implemented`);
	}

	async deleteDriver(userId) {
		if (!confirm('Are you sure you want to delete this driver? This will remove all associated data.')) return;

		try {
			const data = await this.apiCall('api/delete_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: userId })
			});

			if (data.status === 'success') {
				this.showSuccess('Driver deleted successfully');
				this.loadData();
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to delete driver: ' + error.message);
		}
	}

	// Метод для создания нового водителя
	openCreateModal() {
		this.showSuccess('Create driver functionality will be implemented soon!');
		// Можно открыть модальное окно для создания водителя
	}
}

window.driversPage = new DriversPage();
