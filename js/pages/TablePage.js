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
	}

	initEventHandlers() {
		// Pagination handlers
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
		this.loadData();
	}

	handleFilter() {
		// To be implemented in child classes
	}

	resetFilters() {
		this.filters = {};
		this.currentPage = 1;
		this.loadData();
	}

	renderPagination(totalItems) {
		const totalPages = Math.ceil(totalItems / this.itemsPerPage);

		return `
            <div class="pagination">
                <button class="page-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
			const page = i + 1;
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
                
                <span class="pagination-info">
                    ${((this.currentPage - 1) * this.itemsPerPage) + 1}-${Math.min(this.currentPage * this.itemsPerPage, totalItems)} of ${totalItems}
                </span>
            </div>
        `;
	}

	renderTable(headers, data) {
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
				'<i class="fas fa-arrows-alt-v"></i>'
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
		return '<tr></tr>';
	}
}