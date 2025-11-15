class VehiclesPage extends TablePage {
	constructor() {
		super();
		this.pageName = 'vehicles';
	}

	async load() {
		return `
            <div class="content-header">
                <h1 class="content-title">Vehicles Management</h1>
            </div>

			<div class="filter-group">
				<select id="statusFilter" class="filter-select">
					<option value="">All Statuses</option>
					<option value="available">Available</option>
					<option value="in_service">In Service</option>
					<option value="maintenance">Maintenance</option>
					<option value="unavailable">Unavailable</option>
				</select>
				<input type="text" id="searchVehicles" placeholder="Search vehicles..." class="filter-input">
				<button class="reset-filters">Reset</button>
				<button class="filter-btn">Apply Filters</button>
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

			const data = await this.apiCall(`api/get_vehicles.php?${params}`);

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
                <td>${vehicle.capacity_kg} kg</td>
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

	openCreateModal() {
		this.showSuccess('Create vehicle functionality will be implemented soon!');
	}

	editVehicle(vehicleId) {
		this.showSuccess(`Edit vehicle ${vehicleId} functionality will be implemented soon!`);
	}

	async deleteVehicle(vehicleId) {
		if (!confirm('Are you sure you want to delete this vehicle?')) return;

		try {
			const data = await this.apiCall('api/delete_vehicle.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vehicle_id: vehicleId })
			});

			if (data.status === 'success') {
				this.showSuccess('Vehicle deleted successfully');
				this.loadData();
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to delete vehicle: ' + error.message);
		}
	}
}

window.vehiclesPage = new VehiclesPage();