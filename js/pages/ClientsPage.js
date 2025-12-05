class ClientsPage extends TablePage {
	constructor() {
		super();
		this.pageName = 'clients';
	}

	async load() {
		return `
            <div class="content-header">
                <h1 class="content-title">Clients Management</h1>
            </div>

            <div class="filters-section">
                <div class="filter-group">
                    <input type="text" id="searchClients" placeholder="Search clients..." class="filter-input">
                    <button class="filter-btn">Apply Filters</button>
                    <button class="reset-filters">Reset</button>
                </div>
            </div>

            <div id="clientsTableContainer"></div>
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
				role: 'client'
			});

			const data = await this.apiCall(`api/get_users.php?${params}`);

			if (data.status === 'success') {
				// Обогащаем данные клиентов информацией о компании
				const clientsWithCompany = this.enrichClientsWithCompany(data.users);
				this.renderClientsTable(clientsWithCompany);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load clients: ' + error.message);
		}
	}

	enrichClientsWithCompany(clients) {
		return clients.map(client => ({
			...client,
			company_name: client.specialized_info?.client?.company_name || '-'
		}));
	}

	renderClientsTable(clients) {
		const headers = [
			{ field: 'user_id', label: 'ID' },
			{ field: 'first_name', label: 'First Name' },
			{ field: 'last_name', label: 'Last Name' },
			{ field: 'company_name', label: 'Company' },
			{ field: 'phone', label: 'Phone' },
			{ field: 'email', label: 'Email' },
			{ field: 'created_at', label: 'Registered' }
		];

		const tableHTML = this.renderTable(headers, clients);
		document.getElementById('clientsTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(client) {
		const phone = client.phone || '-';
		const email = client.email || '-';

		return `
            <tr>
                <td>${client.user_id}</td>
                <td>${client.first_name || '-'}</td>
                <td>${client.last_name || '-'}</td>
                <td>${client.company_name}</td>
                <td>${phone}</td>
                <td>${email}</td>
                <td>${new Date(client.created_at).toLocaleDateString()}</td>
            </tr>
        `;
	}

	openCreateModal() {
		const content = this.renderCreateForm();
		const footer = this.renderCreateFooter();

		this.showModal('Create New Client', content, footer);
	}

	renderCreateForm() {
		return `
            <div class="edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Username *</label>
                        <input type="text" class="form-input" id="createClientUsername" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-input" id="createClientEmail" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">First Name *</label>
                        <input type="text" class="form-input" id="createClientFirstName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name *</label>
                        <input type="text" class="form-input" id="createClientLastName" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" id="createClientPhone">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-input" id="createClientPassword" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password *</label>
                        <input type="password" class="form-input" id="createClientPasswordConfirm" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input type="text" class="form-input" id="createClientCompanyName">
                </div>

                <div id="createClientFormMessages"></div>
            </div>
        `;
	}

	renderCreateFooter() {
		return `
            <button class="btn-secondary" onclick="clientsPage.closeModal()">Cancel</button>
            <button class="btn-primary" onclick="clientsPage.createClient()">Create Client</button>
        `;
	}

	async createClient() {
		try {
			this.showLoading();

			const formData = {
				username: document.getElementById('createClientUsername').value,
				email: document.getElementById('createClientEmail').value,
				first_name: document.getElementById('createClientFirstName').value,
				last_name: document.getElementById('createClientLastName').value,
				phone: document.getElementById('createClientPhone').value || null,
				password: document.getElementById('createClientPassword').value,
				company_name: document.getElementById('createClientCompanyName').value || null,
				roles: ['client'] // Предустановленная роль
			};

			// Валидация
			const errors = this.validateClientForm(formData);
			if (errors.length > 0) {
				throw new Error(errors.join('\n'));
			}

			const response = await this.apiCall('api/create_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.status === 'success') {
				this.showSuccess('Client created successfully');
				this.closeModal();
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to create client: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	validateClientForm(formData) {
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
		} else if (formData.password !== document.getElementById('createClientPasswordConfirm').value) {
			errors.push('Passwords do not match');
		}

		return errors;
	}

	isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	handleFilter() {
		const search = document.getElementById('searchClients').value;

		this.filters = {};
		if (search) this.filters.search = search;

		this.currentPage = 1;
		this.loadData();
	}
}

window.clientsPage = new ClientsPage();
