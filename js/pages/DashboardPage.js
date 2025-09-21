class DashboardPage extends BasePage {
	constructor() {
		super();
		this.pageName = 'dashboard';
		this.chart = null;
	}

	async load() {
		const response = await fetch('pages/dashboard.html');
		return await response.text();
	}

	async init() {
		super.init();

		await this.initOrdersChart();
		await this.checkDatabaseStatus();

		console.log('Dashboard page initialized');
	}

	async initOrdersChart() {
		const ctx = document.getElementById('ordersChart');
		if (!ctx) return;

		const data = {
			labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			datasets: [
				{
					label: 'Completed Orders',
					data: [8, 12, 10, 22, 18, 6, 2],
					borderColor: '#34a853',
					backgroundColor: 'rgba(52, 168, 83, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#34a853',
					pointBorderColor: '#000',
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7
				},
				{
					label: 'Pending Orders',
					data: [12, 19, 15, 6, 9, 8, 5],
					borderColor: '#fbbc05',
					backgroundColor: 'rgba(251, 188, 5, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#fbbc05',
					pointBorderColor: '#000',
					pointBorderWidth: 2,
					pointRadius: 5,
					pointHoverRadius: 7
				},
				{
					label: 'Cancelled Orders',
					data: [2, 3, 1, 5, 2, 1, 0],
					borderColor: '#ea4335',
					backgroundColor: 'rgba(234, 67, 53, 0.1)',
					borderWidth: 3,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#ea4335',
					pointBorderColor: '#000',
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
						position: 'none',
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

		new Chart(ctx, config);
	}

	async checkDatabaseStatus() {
		const indicator = document.getElementById('dbStatusIndicator');
		const statusDot = indicator.querySelector('.status-dot');
		const statusText = indicator.querySelector('span');
		const tooltipContent = document.getElementById('dbTooltipContent');

		statusDot.className = 'status-dot';
		statusText.textContent = 'Checking...';
		tooltipContent.innerHTML = '';

		try {
			const response = await fetch('api/db_status.php');
			const data = await response.json();

			if (data.status === 'success') {
				statusDot.className = 'status-dot connected';
				statusText.textContent = 'Connected';
				tooltipContent.innerHTML = `
                <div>Database: ${data.database.name}</div>
                <div>Host: ${data.database.host}:${data.database.port}</div>
                <div>User: ${data.database.user}</div>
                <div class="success">✓ ${data.message}</div>
                <div>Last check: ${data.timestamp}</div>
            `;
			} else {
				statusDot.className = 'status-dot error';
				statusText.textContent = 'Error';
				tooltipContent.innerHTML = `
                <div class="error">✗ ${data.message}</div>
                <div>Last check: ${data.timestamp}</div>
            `;
			}
		} catch (error) {
			statusDot.className = 'status-dot error';
			statusText.textContent = 'Connection Failed';
			tooltipContent.innerHTML = `
            <div class="error">✗ Network error: ${error.message}</div>
            <div>Please check your connection</div>
            <div>Last check: ${new Date().toLocaleString()}</div>
        `;
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