class TablePage extends BasePage {
	constructor() {
		super();
		this.currentPage = 1;
		this.itemsPerPage = 10;
		this.sortField = null;
		this.sortDirection = 'asc';
		this.filters = {};
	}

	async init() {
		super.init();
		await this.loadData();
		this.initEventHandlers();
	}

	async loadData() {
		// To be implemented in child classes
		throw new Error('loadData method must be implemented in child class');
	}

	initEventHandlers() {
		document.addEventListener('click', (e) => {
			if (e.target.classList.contains('page-btn')) {
				this.handlePagination(parseInt(e.target.dataset.page));
			}

			if (e.target.classList.contains('sort-header')) {
				this.handleSort(e.target.dataset.field);
			}

			if (e.target.classList.contains('filter-btn')) {
				this.handleFilter();
			}

			if (e.target.classList.contains('reset-filters')) {
				this.resetFilters();
			}
		});

		document.addEventListener('keypress', (e) => {
			if (e.target.classList.contains('filter-input') && e.key === 'Enter') {
				this.handleFilter();
			}
		});
	}

	getElement(id) {
		const element = document.getElementById(id);
		if (!element) {
			console.warn(`Element with id '${id}' not found`);
		}
		return element;
	}

	handlePagination(page) {
		this.currentPage = page;
		this.loadData();
	}

	handleSort(field) {
		if (this.sortField === field) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortField = field;
			this.sortDirection = 'asc';
		}
		this.currentPage = 1;
		this.loadData();
	}

	handleFilter() {
		// To be implemented in child classes
		console.log('Filter handling should be implemented in child class');
	}

	resetFilters() {
		this.filters = {};
		this.currentPage = 1;

		const filterInputs = document.querySelectorAll('.filter-input, .filter-select');
		filterInputs.forEach(input => {
			if (input.tagName === 'SELECT') {
				input.selectedIndex = 0;
			} else {
				input.value = '';
			}
		});

		this.loadData();
	}

	renderPagination(totalItems) {
		const totalPages = Math.ceil(totalItems / this.itemsPerPage);
		if (totalPages <= 1) return '';

		return `
            <div class="pagination">
                <span class="pagination-info">
                    Showing ${((this.currentPage - 1) * this.itemsPerPage) + 1}-${Math.min(this.currentPage * this.itemsPerPage, totalItems)} of ${totalItems}
                </span>

                <button class="page-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
			const page = i + 1;
			if (page > totalPages) return '';
			return `
                        <button class="page-btn ${this.currentPage === page ? 'active' : ''}" 
                                data-page="${page}">
                            ${page}
                        </button>
                    `;
		}).join('')}
                
                ${totalPages > 5 ? '<span class="pagination-ellipsis">...</span>' : ''}
                
                <button class="page-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        ${this.currentPage === totalPages ? 'disabled' : ''}
                        data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
	}

	renderTable(headers, data) {
		if (!data || data.length === 0) {
			return `
                <div class="no-data" style="display: flex; justify-content: center; margin: 36px">
                    <i class="fas fa-inbox"></i>
                    <p style="padding: 0px 16px">No data available</p>
                </div>
            `;
		}

		return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `
                                <th class="sort-header" data-field="${header.field}">
                                    ${header.label}
                                    ${this.sortField === header.field ?
				`<i class="fas fa-${this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}"></i>` :
				'<i class="fas fa-arrows-up-down"></i>'
			}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => this.renderTableRow(row)).join('')}
                    </tbody>
                </table>
            </div>
        `;
	}

	renderTableRow(row) {
		// To be implemented in child classes
		return '<tr><td colspan="8">Implement renderTableRow in child class</td></tr>';
	}

	async apiCall(url, options = {}) {
		try {
			this.showLoading();
			const response = await fetch(url, options);

			// Check if response is JSON
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				const text = await response.text();
				throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || `HTTP error! status: ${response.status}`);
			}

			this.hideLoading();
			return data;
		} catch (error) {
			this.hideLoading();

			// More specific error messages
			if (error.message.includes('non-JSON')) {
				this.showError('Server error: Invalid response format');
			} else if (error.name === 'TypeError' && error.message.includes('fetch')) {
				this.showError('Network error: Cannot connect to server');
			} else {
				this.showError(error.message);
			}

			throw error;
		}
	}
}