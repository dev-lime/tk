class UsersPage extends TablePage {
	constructor() {
		super();
		this.pageName = 'users';
	}

	async load() {
		return `
            <div class="content-header">
                <h1 class="content-title">Users Management</h1>
            </div>

            <div class="filter-group">
                <select id="roleFilter" class="filter-select">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                    <option value="driver">Driver</option>
                    <option value="dispatcher">Dispatcher</option>
                </select>
                <input type="text" id="searchUsers" placeholder="Search users..." class="filter-input">
                <button class="reset-filters">Reset</button>
                <button class="filter-btn">Apply Filters</button>
            </div>

            <div id="usersTableContainer"></div>
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

			const data = await this.apiCall(`api/get_users.php?${params}`);

			if (data.status === 'success') {
				this.renderUsersTable(data.users);
				document.getElementById('paginationContainer').innerHTML = this.renderPagination(data.totalCount);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load users: ' + error.message);
		}
	}

	renderUsersTable(users) {
		const headers = [
			{ field: 'user_id', label: 'ID' },
			{ field: 'username', label: 'Username' },
			{ field: 'first_name', label: 'First Name' },
			{ field: 'last_name', label: 'Last Name' },
			{ field: 'email', label: 'Email' },
			{ field: 'roles', label: 'Roles' },
			{ field: 'created_at', label: 'Created' },
			{ field: 'actions', label: 'Actions' }
		];

		const tableHTML = this.renderTable(headers, users);
		document.getElementById('usersTableContainer').innerHTML = tableHTML;
	}

	renderTableRow(user) {
		const roles = user.roles ? user.roles.map(role =>
			`<span class="role-badge">${role}</span>`
		).join('') : '-';

		return `
            <tr>
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.first_name || '-'}</td>
                <td>${user.last_name || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${roles}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                    <button class="btn-icon" onclick="usersPage.editUser(${user.user_id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="usersPage.deleteUser(${user.user_id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
	}

	async editUser(userId) {
		try {
			this.showLoading();
			const data = await this.apiCall(`api/get_user.php?user_id=${userId}`);

			if (data.status === 'success') {
				const user = data.user;
				const content = this.renderUserEditForm(user);
				const footer = this.renderUserEditFooter(user);

				this.showModal(`Edit User: ${user.username}`, content, footer);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			this.showError('Failed to load user for editing: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	renderUserEditForm(user) {
		const roleOptions = ['admin', 'dispatcher', 'driver', 'client'];

		return `
            <div class="edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Username *</label>
                        <input type="text" id="editUsername" value="${user.username || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="editEmail" value="${user.email || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" id="editFirstName" value="${user.first_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" id="editLastName" value="${user.last_name || ''}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Middle Name</label>
                        <input type="text" id="editMiddleName" value="${user.middle_name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="editPhone" value="${user.phone || ''}" 
                               placeholder="+1234567890 or 1234567">
                        <small style="color: #666; font-size: 12px;">Format: +1234567890 or 1234567 (7-20 digits)</small>
                    </div>
                </div>

                <div class="form-group">
                    <label>Roles</label>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px;">
                        ${roleOptions.map(role => `
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" name="roles" value="${role}" 
                                    ${user.roles.includes(role) ? 'checked' : ''}
                                    onchange="usersPage.toggleRoleFields('${role}')">
                                ${role.charAt(0).toUpperCase() + role.slice(1)}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Client specific fields -->
                <div id="clientFields" style="${user.roles.includes('client') ? '' : 'display: none;'}">
                    <div class="form-group">
                        <label>Company Name</label>
                        <input type="text" id="editCompanyName" value="${user.company_name || ''}">
                    </div>
                </div>

                <!-- Driver specific fields -->
                <div id="driverFields" style="${user.roles.includes('driver') ? '' : 'display: none;'}">
                    <div class="form-group">
                        <label>License Number *</label>
                        <input type="text" id="editLicenseNumber" value="${user.license_number || ''}">
                    </div>
                </div>

                <div class="form-group">
                    <div style="color: #666; font-size: 12px;">
                        <i class="fas fa-info-circle"></i>
                        Created: ${new Date(user.created_at).toLocaleString()}
                    </div>
                </div>

                <div id="editFormMessages"></div>
            </div>
        `;
	}

	async updateUser(userId) {
		try {
			this.showLoading();

			const phone = document.getElementById('editPhone').value;

			// Валидация телефона
			if (phone && !this.isValidPhone(phone)) {
				throw new Error('Phone number format is invalid. Use format: +1234567890 or 1234567 (7-20 digits)');
			}

			const formData = {
				user_id: userId,
				username: document.getElementById('editUsername').value,
				email: document.getElementById('editEmail').value,
				first_name: document.getElementById('editFirstName').value,
				last_name: document.getElementById('editLastName').value,
				middle_name: document.getElementById('editMiddleName').value,
				phone: phone,
				roles: Array.from(document.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value)
			};

			// Add role-specific data
			if (formData.roles.includes('client')) {
				formData.company_name = document.getElementById('editCompanyName').value;
			}
			if (formData.roles.includes('driver')) {
				formData.license_number = document.getElementById('editLicenseNumber').value;
				if (!formData.license_number.trim()) {
					throw new Error('License number is required for drivers');
				}
			}

			if (!formData.username.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
				throw new Error('Username, first name and last name are required');
			}

			const response = await this.apiCall('api/update_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.status === 'success') {
				this.showSuccess('User updated successfully');
				this.closeModal();
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to update user: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	isValidPhone(phone) {
		// Регулярное выражение для проверки телефона: необязательный +, затем 7-20 цифр
		const phoneRegex = /^\+?[0-9]{7,20}$/;
		return phoneRegex.test(phone);
	}

	renderUserEditFooter(user) {
		return `
            <button class="btn-secondary" onclick="usersPage.closeModal()">Cancel</button>
            <button class="btn-primary" onclick="usersPage.updateUser(${user.user_id})">Save Changes</button>
        `;
	}

	toggleRoleFields(role) {
		const checkbox = document.querySelector(`input[name="roles"][value="${role}"]`);
		if (role === 'client') {
			document.getElementById('clientFields').style.display = checkbox.checked ? 'block' : 'none';
		} else if (role === 'driver') {
			document.getElementById('driverFields').style.display = checkbox.checked ? 'block' : 'none';
			const licenseInput = document.getElementById('editLicenseNumber');
			if (checkbox.checked && !licenseInput.value) {
				licenseInput.focus();
			}
		}
	}

	async updateUser(userId) {
		try {
			this.showLoading();

			const formData = {
				user_id: userId,
				username: document.getElementById('editUsername').value,
				email: document.getElementById('editEmail').value,
				first_name: document.getElementById('editFirstName').value,
				last_name: document.getElementById('editLastName').value,
				middle_name: document.getElementById('editMiddleName').value,
				phone: document.getElementById('editPhone').value,
				roles: Array.from(document.querySelectorAll('input[name="roles"]:checked')).map(cb => cb.value)
			};

			// Add role-specific data
			if (formData.roles.includes('client')) {
				formData.company_name = document.getElementById('editCompanyName').value;
			}
			if (formData.roles.includes('driver')) {
				formData.license_number = document.getElementById('editLicenseNumber').value;
				if (!formData.license_number.trim()) {
					throw new Error('License number is required for drivers');
				}
			}

			if (!formData.username.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
				throw new Error('Username, first name and last name are required');
			}

			const response = await this.apiCall('api/update_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.status === 'success') {
				this.showSuccess('User updated successfully');
				this.closeModal();
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to update user: ' + error.message);
		} finally {
			this.hideLoading();
		}
	}

	handleFilter() {
		const search = document.getElementById('searchUsers').value;
		const role = document.getElementById('roleFilter').value;

		this.filters = {};
		if (search) this.filters.search = search;
		if (role) this.filters.role = role;

		this.currentPage = 1;
		this.loadData();
	}

	async deleteUser(userId) {
		if (!confirm('Are you sure you want to delete this user? This will remove all associated data including orders, client/driver information. This action cannot be undone.')) return;

		try {
			const response = await this.apiCall('api/delete_user.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: userId })
			});

			if (response.status === 'success') {
				this.showSuccess('User deleted successfully');
				this.loadData();
			} else {
				throw new Error(response.message);
			}
		} catch (error) {
			this.showError('Failed to delete user: ' + error.message);
		}
	}
}

window.usersPage = new UsersPage();
