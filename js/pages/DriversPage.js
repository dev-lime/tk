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
					<select id="statusFilter" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="on_delivery">On Delivery</option>
                        <option value="assigned">Assigned</option>
                    </select>
                    <input type="text" id="searchDrivers" placeholder="Search drivers..." class="filter-input">
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

	openCreateModal() {
		const content = this.renderCreateForm();
		const footer = this.renderCreateFooter();

		this.showModal('Create New Driver', content, footer);
	}

	renderCreateForm() {
		return `
            <div class="edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Username *</label>
                        <input type="text" class="form-input" id="createDriverUsername" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-input" id="createDriverEmail" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name *</label>
                        <input type="text" class="form-input" id="createDriverFirstName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name *</label>
                        <input type="text" class="form-input" id="createDriverLastName" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" id="createDriverPhone">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-input" id="createDriverPassword" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password *</label>
                        <input type="password" class="form-input" id="createDriverPasswordConfirm" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Driver License Number *</label>
                    <input type="text" class="form-input" id="createDriverLicenseNumber" required>
                </div>

                <div id="createDriverFormMessages"></div>
            </div>
        `;
	}

	renderCreateFooter() {
		return `
            <button class="btn-secondary" onclick="driversPage.closeModal()">Cancel</button>
            <button class="btn-primary" onclick="driversPage.createDriver()">Create Driver</button>
        `;
	}

	async createDriver() {
		try {
			this.showLoading();

			const formData = {
				username: document.getElementById('createDriverUsername').value,
				email: document.getElementById('createDriverEmail').value,
				first_name: document.getElementById('createDriverFirstName').value,
				last_name: document.getElementById('createDriverLastName').value,
				phone: document.getElementById('createDriverPhone').value || null,
				password: document.getElementById('createDriverPassword').value,
				license_number: document.getElementById('createDriverLicenseNumber').value,
				roles: ['driver'] // Предустановленная роль
			};

			// Валидация
			const errors = this.validateDriverForm(formData);
			if (errors.length > 0) {
				throw new Error(errors.join('\n'));
			}

			const response = await this.apiCall('api/create_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.status === 'success') {
				this.showSuccess('Driver created successfully');
				this.closeModal();
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to create driver: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	validateDriverForm(formData) {
		const errors = [];

		if (!formData.username.trim()) {
			errors.push('Username is required');
		}

		if (!formData.email.trim()) {
			errors.push('Email is required');
		} else if (!this.isValidEmail(formData.email)) {
			errors.push('Please enter a valid email address');
		}

		if (!formData.first_name.trim()) {
			errors.push('First name is required');
		}

		if (!formData.last_name.trim()) {
			errors.push('Last name is required');
		}

		if (!formData.password) {
			errors.push('Password is required');
		} else if (formData.password.length < 6) {
			errors.push('Password must be at least 6 characters long');
		} else if (formData.password !== document.getElementById('createDriverPasswordConfirm').value) {
			errors.push('Passwords do not match');
		}

		if (!formData.license_number.trim()) {
			errors.push('License number is required');
		}

		return errors;
	}

	isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
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
