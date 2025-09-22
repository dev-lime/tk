class UsersPage extends TablePage {
    constructor() {
        super();
        this.pageName = 'users';
    }

    async load() {
        return `
            <div class="content-header">
                <h1 class="content-title">Users Management</h1>
                <div class="header-actions">
                    <button class="action-btn" onclick="usersPage.openCreateModal()">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                </div>
            </div>

            <div class="filters-section">
                <div class="filter-group">
                    <input type="text" id="searchUsers" placeholder="Search users..." class="filter-input">
                    <select id="roleFilter" class="filter-select">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="client">Client</option>
                        <option value="driver">Driver</option>
                        <option value="dispatcher">Dispatcher</option>
                    </select>
                    <button class="filter-btn">Apply Filters</button>
                    <button class="reset-filters">Reset</button>
                </div>
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

            const response = await fetch(`api/get_users.php?${params}`);
            const data = await response.json();

            if (data.status === 'success') {
                this.renderUsersTable(data.users);
                this.renderPagination(data.totalCount);
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

    handleFilter() {
        const search = document.getElementById('searchUsers').value;
        const role = document.getElementById('roleFilter').value;

        this.filters = {};
        if (search) this.filters.search = search;
        if (role) this.filters.role = role;
        
        this.currentPage = 1;
        this.loadData();
    }

    openCreateModal() {
        // Implementation for create user modal
        console.log('Open create user modal');
    }

    editUser(userId) {
        // Implementation for edit user
        console.log('Edit user:', userId);
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch('api/delete_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.loadData();
                this.showSuccess('User deleted successfully');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError('Failed to delete user: ' + error.message);
        }
    }
}

const usersPage = new UsersPage();