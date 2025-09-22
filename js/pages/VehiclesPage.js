class VehiclesPage extends TablePage {
	constructor() {
		super();
		this.pageName = 'vehicles';
	}

	async load() {
		return `
            <div class="content-header">
                <h1 class="content-title">Vehicles Management</h1>
                <div class="header-actions">
                    <button class="action-btn" onclick="vehiclesPage.openCreateModal()">
                        <i class="fas fa-plus"></i> Add Vehicle
                    </button>
                </div>
            </div>

            <div class="filters-section">
                <div class="filter-group">
                    <input type="text" id="searchVehicles" placeholder="Search vehicles..." class="filter-input">
                    <select id="statusFilter" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="in_service">In Service</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="unavailable">Unavailable</option>
                    </select>
                    <button class="filter-btn">Apply Filters</button>
                    <button class="reset-filters">Reset</button>
                </div>
            </div>

            <div id="vehiclesTableContainer"></div>
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

			const response = await fetch(`api/get_vehicles.php?${params}`);
			const data = await response.json();

			if (data.status === 'success') {
				this.renderVehiclesTable(data.vehicles);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load vehicles: ' + error.message);
		}
	}

	renderVehiclesTable(vehicles) {
		const headers = [
			{ field: 'vehicle_id', label: 'ID' },
			{ field: 'plate_number', label: 'Plate Number' },
			{ field: 'model', label: 'Model' },
			{ field: 'capacity_kg', label: 'Capacity (kg)' },
			{ field: 'status', label: 'Status' },
			{ field: 'actions', label: 'Actions' }
		];

		const tableHTML = this.renderTable(headers, vehicles);
		document.getElementById('vehiclesTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(vehicle) {
		const statusClass = this.getStatusClass(vehicle.status);

		return `
            <tr>
                <td>${vehicle.vehicle_id}</td>
                <td>${vehicle.plate_number}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.capacity_kg}</td>
                <td><span class="status-badge ${statusClass}">${vehicle.status}</span></td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="vehiclesPage.editVehicle(${vehicle.vehicle_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="vehiclesPage.deleteVehicle(${vehicle.vehicle_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
	}

	getStatusClass(status) {
		const statusClasses = {
			'available': 'success',
			'in_service': 'warning',
			'maintenance': 'info',
			'unavailable': 'error'
		};
		return statusClasses[status] || 'default';
	}

	handleFilter() {
		const search = document.getElementById('searchVehicles').value;
		const status = document.getElementById('statusFilter').value;

		this.filters = {};
		if (search) this.filters.search = search;
		if (status) this.filters.status = status;

		this.currentPage = 1;
		this.loadData();
	}
}

const vehiclesPage = new VehiclesPage();