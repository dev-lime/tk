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
				role: 'client' // Фильтр только по клиентам
			});

			const data = await this.apiCall(`api/get_users.php?${params}`);

			if (data.status === 'success') {
				this.renderClientsTable(data.users);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load clients: ' + error.message);
		}
	}

	renderClientsTable(clients) {
		const headers = [
			{ field: 'user_id', label: 'ID' },
			{ field: 'username', label: 'Username' },
			{ field: 'first_name', label: 'First Name' },
			{ field: 'last_name', label: 'Last Name' },
			{ field: 'email', label: 'Email' },
			{ field: 'phone', label: 'Phone' },
			{ field: 'company_name', label: 'Company' },
			{ field: 'created_at', label: 'Created' },
			{ field: 'actions', label: 'Actions' }
		];

		const tableHTML = this.renderTable(headers, clients);
		document.getElementById('clientsTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(client) {
		const companyName = client.specialized_info?.client?.company_name || '-';
		const phone = client.phone || '-';
		const email = client.email || '-';

		return `
            <tr>
                <td>${client.user_id}</td>
                <td>${client.username}</td>
                <td>${client.first_name || '-'}</td>
                <td>${client.last_name || '-'}</td>
                <td>${email}</td>
                <td>${phone}</td>
                <td>${companyName}</td>
                <td>${new Date(client.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="clientsPage.editClient(${client.user_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="clientsPage.deleteClient(${client.user_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
	}

	handleFilter() {
		const searchInput = this.getElement('searchClients');

		if (!searchInput) {
			this.showError('Filter elements not found');
			return;
		}

		const search = searchInput.value;

		this.filters = {};
		if (search) this.filters.search = search;

		this.currentPage = 1;
		this.loadData();
	}

	editClient(userId) {
		this.showSuccess(`Edit client ${userId} - to be implemented`);
	}

	async deleteClient(userId) {
		if (!confirm('Are you sure you want to delete this client? This will also remove all associated orders.')) return;

		try {
			const data = await this.apiCall('api/delete_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: userId })
			});

			if (data.status === 'success') {
				this.showSuccess('Client deleted successfully');
				this.loadData();
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to delete client: ' + error.message);
		}
	}

	// Метод для создания нового клиента
	openCreateModal() {
		this.showSuccess('Create client functionality will be implemented soon!');
		// Можно открыть модальное окно для создания клиента
	}
}

window.clientsPage = new ClientsPage();
