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

	handleFilter() {
		const search = document.getElementById('searchClients').value;

		this.filters = {};
		if (search) this.filters.search = search;

		this.currentPage = 1;
		this.loadData();
	}
}

window.clientsPage = new ClientsPage();
