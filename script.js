class TransportCompanyApp {
	constructor() {
		this.currentPage = 'dashboard';
		this.init();
	}

	init() {
		this.setupEventListeners();
		this.loadPage(this.currentPage);
		this.startGlowAnimation();
	}

	setupEventListeners() {
		// Навигация по меню
		document.querySelectorAll('.menu-item').forEach(item => {
			item.addEventListener('click', (e) => {
				const page = item.getAttribute('data-page');
				this.navigateTo(page);
			});
		});

		// Переключение уведомлений
		document.querySelectorAll('.switch input').forEach(switchInput => {
			switchInput.addEventListener('change', function () {
				const descElement = this.closest('.menu-item').querySelector('.menu-desc');
				if (descElement) {
					descElement.textContent = this.checked ? 'On' : 'Off';
				}
			});
		});

		// Обработка кнопок действий
		document.addEventListener('click', (e) => {
			if (e.target.classList.contains('action-btn')) {
				this.handleAction(e.target);
			}
		});
	}

	navigateTo(page) {
		if (this.currentPage === page) return;

		// Активный пункт меню
		document.querySelectorAll('.menu-item').forEach(item => {
			item.classList.remove('active');
			if (item.getAttribute('data-page') === page) {
				item.classList.add('active');
			}
		});

		this.currentPage = page;
		this.loadPage(page);
	}

	async loadPage(page) {
		const container = document.getElementById('content-container');
		container.innerHTML = '<div class="loading">Загрузка...</div>';

		try {
			const response = await fetch(`pages/${page}.html`);

			if (!response.ok) {
				throw new Error(`Ошибка загрузки: ${response.status}`);
			}

			const content = await response.text();
			container.innerHTML = content;
			this.initPageSpecificScripts(page);

		} catch (error) {
			console.error('Ошибка загрузки страницы:', error);
			container.innerHTML = `
                <div class="error">
                    <h3>Ошибка загрузки страницы</h3>
                    <p>${error.message}</p>
                    <button class="action-btn" onclick="app.loadPage('${page}')">Повторить</button>
                </div>
            `;
		}
	}

	initPageSpecificScripts(page) {
		switch (page) {
			case 'orders':
				this.initOrdersPage();
				break;
			case 'dashboard':
				this.initDashboardPage();
				break;
			// Добавить другие страницы
		}
	}

	initOrdersPage() {
		console.log('Orders page initialized');
	}

	initDashboardPage() {
		console.log('Dashboard page initialized');
		this.initOrdersChart();
	}

	initOrdersChart() {
		const ctx = document.getElementById('ordersChart').getContext('2d');
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

	handleAction(button) {
		const action = button.textContent.toLowerCase();
		console.log(`Action: ${action}`);
		// Добавить обработку различных действий
	}

	startGlowAnimation() {
		const glow1 = document.querySelector('.glow-1');
		const glow2 = document.querySelector('.glow-2');
		const glow3 = document.querySelector('.glow-3');
		const glow4 = document.querySelector('.glow-4');

		// For each circle
		let angles = [0, 45, 90, 135];
		const speeds = [0.3, 0.4, 0.5, 0.2];
		const radii = [150, 90, 100, 200];

		setInterval(() => {
			angles = angles.map((angle, index) => (angle + speeds[index]) % 360);

			glow1.style.transform = `translate(
					${Math.sin(angles[0] * (Math.PI / 180)) * radii[0]}px, 
					${Math.cos(angles[0] * (Math.PI / 180)) * radii[0]}px
				)`;

			glow2.style.transform = `translate(
					${Math.cos(angles[1] * (Math.PI / 180)) * radii[1]}px, 
					${Math.sin(angles[1] * (Math.PI / 180)) * radii[1]}px
				)`;

			glow3.style.transform = `translate(
					${Math.sin(angles[2] * (Math.PI / 180) + 0.5) * radii[2]}px, 
					${Math.cos(angles[2] * (Math.PI / 180) + 0.5) * radii[2]}px
				)`;

			glow4.style.transform = `translate(
					${Math.cos(angles[3] * (Math.PI / 180) + 0.3) * radii[3]}px, 
					${Math.sin(angles[3] * (Math.PI / 180) + 0.3) * radii[3]}px
				)`;

			const pulse1 = 0.5 + 0.2 * Math.sin(angles[0] * 0.1);
			const pulse2 = 0.5 + 0.2 * Math.sin(angles[1] * 0.1 + 0.5);
			const pulse3 = 0.5 + 0.2 * Math.sin(angles[2] * 0.1 + 1);
			const pulse4 = 0.5 + 0.2 * Math.sin(angles[3] * 0.1 + 1.5);

			glow1.style.opacity = 0.5 * pulse1;
			glow2.style.opacity = 0.4 * pulse2;
			glow3.style.opacity = 0.3 * pulse3;
			glow4.style.opacity = 0.4 * pulse4;

		}, 50);
	}
}

const app = new TransportCompanyApp();
