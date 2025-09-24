class DashboardPage extends BasePage {
	constructor() {
		super();
		this.pageName = 'dashboard';
		this.chart = null;
		this.currentPeriod = 'week';
	}

	async load() {
		// Simple HTML template without external file
		return `
            <div class="content-header">
                <h1 class="content-title">Dashboard</h1>
                <p class="content-subtitle">Welcome back! Here's what's happening today.</p>
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-title">Total Orders</div>
                    <div class="card-value" id="totalOrdersValue">0</div>
                    <div class="card-trend" id="totalOrdersTrend">Loading...</div>
                </div>
                <div class="dashboard-card">
                    <div class="card-title">Active Vehicles</div>
                    <div class="card-value" id="activeVehiclesValue">0</div>
                    <div class="card-trend" id="activeVehiclesTrend">Loading...</div>
                </div>
                <div class="dashboard-card">
                    <div class="card-title">Pending Orders</div>
                    <div class="card-value" id="pendingOrdersValue">0</div>
                    <div class="card-trend" id="pendingOrdersTrend">Loading...</div>
                </div>
                <div class="dashboard-card">
                    <div class="card-title">Revenue</div>
                    <div class="card-value" id="revenueValue">$0</div>
                    <div class="card-trend" id="revenueTrend">Loading...</div>
                </div>
                <div class="dashboard-card">
                    <div class="card-title">Database Status</div>
                    <div class="db-status-content">
                        <div class="db-status-indicator" id="dbStatusIndicator">
                            <div class="status-dot"></div>
                            <span>Checking...</span>
                        </div>
                        <div class="db-info-tooltip">
                            <i class="fas fa-info-circle"></i>
                            <div class="tooltip-content" id="dbTooltipContent"></div>
                        </div>
                        <button class="refresh-btn" id="refreshDbStatus">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-header">
                    <h3>Orders Statistics</h3>
                    <div class="chart-filter">
                        <select class="filter-select" id="chartPeriod">
                            <option value="week" selected>This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                        </select>
                    </div>
                </div>
                <canvas id="ordersChart"></canvas>
            </div>

            <style>
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .dashboard-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 20px;
                }

                .card-title {
                    font-size: 16px;
                    color: #aaa;
                    margin-bottom: 10px;
                }

                .card-value {
                    font-size: 28px;
                    font-weight: 600;
                }

                .card-trend {
                    font-size: 12px;
                    margin-top: 5px;
                }

                .card-trend.positive {
                    color: #34a853;
                }

                .card-trend.negative {
                    color: #ea4335;
                }

                .chart-container {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: 24px;
                    margin-top: 20px;
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                #ordersChart {
                    width: 100% !important;
                    height: 300px !important;
                }

                .db-status-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 10px;
                }

                .db-status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #666;
                    animation: pulse 2s infinite;
                }

                .status-dot.connected {
                    background: #34a853;
                    animation: none;
                }

                .status-dot.error {
                    background: #ea4335;
                    animation: none;
                }

                .db-status-indicator span {
                    font-size: 14px;
                    color: #fff;
                    font-weight: 500;
                }

                .db-info-tooltip {
                    position: relative;
                    cursor: pointer;
                }

                .db-info-tooltip i {
                    color: #666;
                    font-size: 16px;
                    transition: color 0.3s ease;
                }

                .db-info-tooltip:hover i {
                    color: #4285f4;
                }

                .tooltip-content {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(30, 30, 30, 1);
                    border: none;
                    border-radius: 12px;
                    padding: 12px;
                    min-width: 200px;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 1000;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .tooltip-content::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border: none;
                }

                .db-info-tooltip:hover .tooltip-content {
                    opacity: 1;
                    visibility: visible;
                    bottom: calc(100% + 10px);
                }

                .tooltip-content div {
                    font-size: 12px;
                    color: #aaa;
                    margin-bottom: 4px;
                    line-height: 1.4;
                }

                .tooltip-content div:last-child {
                    margin-bottom: 0;
                }

                .tooltip-content .success {
                    color: #34a853;
                }

                .tooltip-content .error {
                    color: #ea4335;
                }

                .refresh-btn {
                    background: rgba(66, 133, 244, 0.2);
                    color: #4285f4;
                    border: none;
                    border-radius: 12px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .refresh-btn:hover {
                    background: rgba(66, 133, 244, 0.3);
                }

                .refresh-btn i {
                    font-size: 12px;
                }

                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }

                    .db-status-content {
                        flex-wrap: wrap;
                    }

                    .db-info-tooltip {
                        order: 3;
                        margin-left: auto;
                    }
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            </style>
        `;
	}

	async init() {
		super.init();

		// Update user greeting
		this.updateUserGreeting();

		// Load data
		await this.loadDashboardStats();
		await this.initOrdersChart();
		await this.checkDatabaseStatus();

		// Add event listeners
		this.initEventListeners();

		console.log('Dashboard page initialized');
	}

	updateUserGreeting() {
		const user = window.app?.currentUser;
		const greeting = document.querySelector('.content-subtitle');
		if (greeting && user) {
			greeting.textContent = `Welcome back, ${user.first_name}! Here's what's happening today.`;
		}
	}

	async loadDashboardStats() {
		try {
			const response = await fetch('api/dashboard_stats.php');

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === 'success') {
				this.updateDashboardCards(data.data);
			} else {
				throw new Error(data.message || 'Unknown error');
			}
		} catch (error) {
			console.error('Error loading dashboard stats:', error);
			this.showError('Failed to load dashboard statistics');
			// Показываем нулевые значения при ошибке
			this.showEmptyState();
		}
	}

	updateDashboardCards(stats) {
		if (!stats) {
			console.error('No stats data provided');
			this.showEmptyState();
			return;
		}

		// Update Total Orders
		this.updateCardElement('totalOrdersValue', stats.total_orders);
		this.updateTrendElement('totalOrdersTrend', stats.trends.orders, 'orders');

		// Update Active Vehicles
		this.updateCardElement('activeVehiclesValue', stats.active_vehicles);
		this.updateTrendElement('activeVehiclesTrend', stats.trends.vehicles, 'vehicles');

		// Update Pending Orders
		this.updateCardElement('pendingOrdersValue', stats.pending_orders);
		this.updateTrendElement('pendingOrdersTrend', stats.trends.pending, 'pending');

		// Update Revenue
		this.updateCardElement('revenueValue', this.formatCurrency(stats.total_revenue));
		this.updateTrendElement('revenueTrend', stats.trends.revenue, 'revenue');
	}

	showEmptyState() {
		// Устанавливаем нулевые значения при ошибке
		this.updateCardElement('totalOrdersValue', 0);
		this.updateCardElement('activeVehiclesValue', 0);
		this.updateCardElement('pendingOrdersValue', 0);
		this.updateCardElement('revenueValue', this.formatCurrency(0));

		// Показываем сообщения об ошибке в трендах
		this.updateTrendElement('totalOrdersTrend', 0, 'error');
		this.updateTrendElement('activeVehiclesTrend', 0, 'error');
		this.updateTrendElement('pendingOrdersTrend', 0, 'error');
		this.updateTrendElement('revenueTrend', 0, 'error');
	}

	updateCardElement(elementId, value) {
		const element = document.getElementById(elementId);
		if (element) {
			element.textContent = value;
		}
	}

	updateTrendElement(elementId, trend, type) {
		const element = document.getElementById(elementId);
		if (!element) return;

		if (type === 'error') {
			element.textContent = 'Data unavailable';
			element.className = 'card-trend';
			return;
		}

		const isPositive = trend > 0;
		const trendText = this.getTrendText(trend, type);

		element.textContent = trendText;
		element.className = `card-trend ${isPositive ? 'positive' : 'negative'}`;
	}

	getTrendText(trend, type) {
		if (type === 'vehicles' || type === 'pending') {
			const absTrend = Math.abs(trend);
			const direction = trend >= 0 ? '+' : '-';
			return `${direction}${absTrend} from yesterday`;
		} else {
			const absTrend = Math.abs(trend);
			const direction = trend >= 0 ? '+' : '-';
			return `${direction}${absTrend}% from last ${type === 'orders' ? 'week' : 'month'}`;
		}
	}

	formatCurrency(amount) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	async initOrdersChart() {
		await this.loadChartData();
	}

	async loadChartData() {
		try {
			const response = await fetch(`api/orders_chart_data.php?period=${this.currentPeriod}`);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === 'success') {
				this.renderChart(data.chart_data);
			} else {
				throw new Error(data.message || 'Unknown error');
			}
		} catch (error) {
			console.error('Error loading chart data:', error);
			this.showError('Failed to load chart data');
			this.renderEmptyChart();
		}
	}

	renderChart(chartData) {
		const ctx = document.getElementById('ordersChart');
		if (!ctx) {
			console.error('Chart canvas not found');
			return;
		}

		// Destroy existing chart
		if (this.chart) {
			this.chart.destroy();
		}

		const data = {
			labels: chartData.labels,
			datasets: [
				{
					label: 'Completed Orders',
					data: chartData.datasets.completed,
					borderColor: '#34a853',
					backgroundColor: 'rgba(52, 168, 83, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#34a853',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7
				},
				{
					label: 'Pending Orders',
					data: chartData.datasets.pending,
					borderColor: '#fbbc05',
					backgroundColor: 'rgba(251, 188, 5, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#fbbc05',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7
				},
				{
					label: 'Cancelled Orders',
					data: chartData.datasets.cancelled,
					borderColor: '#ea4335',
					backgroundColor: 'rgba(234, 67, 53, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#ea4335',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7
				}
			]
		};

		const config = {
			type: 'line',
			data: data,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: {
							color: '#fff',
							font: {
								size: 12
							},
							usePointStyle: true,
							padding: 20
						}
					},
					tooltip: {
						backgroundColor: 'rgba(30, 30, 30, 0.9)',
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: 'rgba(255, 255, 255, 0.1)',
						borderWidth: 1,
						padding: 12,
						cornerRadius: 8,
						displayColors: true,
						callbacks: {
							label: function (context) {
								return `${context.dataset.label}: ${context.parsed.y} orders`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							color: 'rgba(255, 255, 255, 0.1)',
							borderColor: 'rgba(255, 255, 255, 0.1)'
						},
						ticks: {
							color: '#aaa',
							font: {
								size: 11
							}
						}
					},
					y: {
						grid: {
							color: 'rgba(255, 255, 255, 0.1)',
							borderColor: 'rgba(255, 255, 255, 0.1)'
						},
						ticks: {
							color: '#aaa',
							font: {
								size: 11
							},
							precision: 0
						},
						beginAtZero: true
					}
				},
				interaction: {
					mode: 'index',
					intersect: false
				},
				animations: {
					tension: {
						duration: 1000,
						easing: 'linear'
					}
				}
			}
		};

		this.chart = new Chart(ctx, config);
	}

	renderEmptyChart() {
		const ctx = document.getElementById('ordersChart');
		if (!ctx) return;

		if (this.chart) {
			this.chart.destroy();
		}

		// Create empty chart with zero data
		const emptyData = {
			labels: ['No data'],
			datasets: [{
				label: 'No data available',
				data: [0],
				backgroundColor: 'rgba(255, 255, 255, 0.1)',
				borderColor: 'rgba(255, 255, 255, 0.3)',
				borderWidth: 1
			}]
		};

		this.chart = new Chart(ctx, {
			type: 'bar',
			data: emptyData,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: false
					}
				},
				scales: {
					x: { display: false },
					y: { display: false }
				}
			}
		});
	}

	initEventListeners() {
		// Chart period filter
		const periodSelect = document.getElementById('chartPeriod');
		if (periodSelect) {
			periodSelect.addEventListener('change', (e) => {
				this.currentPeriod = e.target.value;
				this.loadChartData();
			});
		}

		// Database status refresh
		const refreshBtn = document.getElementById('refreshDbStatus');
		if (refreshBtn) {
			refreshBtn.addEventListener('click', () => {
				this.checkDatabaseStatus();
			});
		}
	}

	async checkDatabaseStatus() {
		const indicator = document.getElementById('dbStatusIndicator');
		if (!indicator) return;

		const statusDot = indicator.querySelector('.status-dot');
		const statusText = indicator.querySelector('span');
		const tooltipContent = document.getElementById('dbTooltipContent');

		if (statusDot) statusDot.className = 'status-dot';
		if (statusText) statusText.textContent = 'Checking...';
		if (tooltipContent) tooltipContent.innerHTML = '';

		try {
			const response = await fetch('api/db_status.php');

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === 'success') {
				if (statusDot) statusDot.className = 'status-dot connected';
				if (statusText) statusText.textContent = 'Connected';
				if (tooltipContent) {
					tooltipContent.innerHTML = `
                        <div>Database: ${data.database.name}</div>
                        <div>Host: ${data.database.host}:${data.database.port}</div>
                        <div>User: ${data.database.user}</div>
                        <div class="success">✓ ${data.message}</div>
                        <div>Last check: ${data.timestamp}</div>
                    `;
				}
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			if (statusDot) statusDot.className = 'status-dot error';
			if (statusText) statusText.textContent = 'Connection Failed';
			if (tooltipContent) {
				tooltipContent.innerHTML = `
                    <div class="error">✗ ${error.message}</div>
                    <div>Please check your connection</div>
                    <div>Last check: ${new Date().toLocaleString()}</div>
                `;
			}
		}
	}

	async destroy() {
		if (this.chart) {
			this.chart.destroy();
			this.chart = null;
		}
		super.destroy();
	}
}

// Create global instance
window.dashboardPage = new DashboardPage();