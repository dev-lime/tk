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
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
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
			{ field: 'created_at', label: 'Created' },
			{ field: 'actions', label: 'Actions' }
		];

		const tableHTML = this.renderTable(headers, vehicles);
		document.getElementById('vehiclesTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(vehicle) {
		const statusClass = this.getVehicleStatusClass(vehicle.status);

		return `
            <tr>
                <td>${vehicle.vehicle_id}</td>
                <td>${vehicle.plate_number}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.capacity_kg}</td>
                <td><span class="status-badge ${statusClass}">${vehicle.status}</span></td>
                <td>${new Date(vehicle.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                    <button class="btn-action" onclick="vehiclesPage.editVehicle(${vehicle.vehicle_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action danger" onclick="vehiclesPage.deleteVehicle(${vehicle.vehicle_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
	}

	getVehicleStatusClass(status) {
		const statusClasses = {
			'available': 'success',
			'in_use': 'warning',
			'maintenance': 'error'
		};
		return statusClasses[status] || 'default';
	}

	async editVehicle(vehicleId) {
		try {
			this.showLoading();
			const data = await this.apiCall(`api/get_vehicle.php?vehicle_id=${vehicleId}`);

			if (data.status === 'success') {
				const vehicle = data.vehicle;
				const content = this.renderVehicleEditForm(vehicle);
				const footer = this.renderVehicleEditFooter(vehicle);

				this.showModal(`Edit Vehicle: ${vehicle.model}`, content, footer);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load vehicle for editing: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	renderVehicleEditForm(vehicle) {
		const statusOptions = [
			{ value: 'available', label: 'Available' },
			{ value: 'in_service', label: 'In Service' },
			{ value: 'maintenance', label: 'Maintenance' },
			{ value: 'unavailable', label: 'Unavailable' }
		];

		return `
            <div class="edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Plate Number *</label>
                        <input type="text" id="editPlateNumber" value="${vehicle.plate_number || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Model *</label>
                        <input type="text" id="editModel" value="${vehicle.model || ''}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Capacity (kg) *</label>
                        <input type="number" id="editCapacity" value="${vehicle.capacity_kg || ''}" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select class="form-select" id="editStatus">
                            ${statusOptions.map(option => `
                                <option value="${option.value}" ${vehicle.status === option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div id="editFormMessages"></div>
            </div>
        `;
	}

	renderVehicleEditFooter(vehicle) {
		return `
            <button class="btn-secondary" onclick="vehiclesPage.closeModal()">Cancel</button>
            <button class="btn-primary" onclick="vehiclesPage.updateVehicle(${vehicle.vehicle_id})">Save Changes</button>
        `;
	}

	getVehicleStatusClass(status) {
		const statusClasses = {
			'available': 'success',
			'in_service': 'warning',
			'maintenance': 'error',
			'unavailable': 'error'
		};
		return statusClasses[status] || 'default';
	}

	async updateVehicle(vehicleId) {
		try {
			this.showLoading();

			const formData = {
				vehicle_id: vehicleId,
				plate_number: document.getElementById('editPlateNumber').value,
				model: document.getElementById('editModel').value,
				capacity_kg: document.getElementById('editCapacity').value,
				status: document.getElementById('editStatus').value
			};

			if (!formData.plate_number.trim() || !formData.model.trim() || !formData.capacity_kg) {
				throw new Error('Plate number, model and capacity are required');
			}

			const response = await this.apiCall('api/update_vehicle.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.status === 'success') {
				this.showSuccess('Vehicle updated successfully');
				this.closeModal();
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to update vehicle: ' + error.message);
		} finally {
			this.hideLoading();
		}
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

	async deleteVehicle(vehicleId) {
		if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;

		try {
			const response = await this.apiCall('api/delete_vehicle.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vehicle_id: vehicleId })
			});

			if (response.status === 'success') {
				this.showSuccess('Vehicle deleted successfully');
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to delete vehicle: ' + error.message);
		}
	}
}

window.vehiclesPage = new VehiclesPage();