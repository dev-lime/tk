class TransportCompanyApp {
	constructor() {
		this.currentPage = null;
		this.currentPageInstance = null;
		this.currentUser = null;
		this.pages = {
			'dashboard': DashboardPage,
			'login': LoginPage,
			'orders': OrdersPage,
			'vehicles': VehiclesPage,
			'users': UsersPage,
			'clients': ClientsPage,
			'drivers': DriversPage,
			'profile': ProfilePage,
			'notifications': NotificationsPage
		};

		// Определяем доступные страницы для каждой роли
		this.rolePermissions = {
			'admin': [
				'dashboard',
				'notifications',
				'profile',
				'clients',
				'drivers',
				'vehicles',
				'orders',
				'users'
			],
			'driver': [
				'dashboard',
				'notifications',
				'profile',
				'clients',
				'vehicles',
				'orders'
			],
			'client': [
				'dashboard',
				'notifications',
				'profile',
				'orders'
			],
			'dispatcher': [
				'dashboard',
				'notifications',
				'profile',
				'clients',
				'drivers',
				'vehicles',
				'orders'
			]
		};

		this.init();
	}

	async init() {
		const authResult = await this.checkAuth();
		const isAuthenticated = authResult.authenticated;
		this.currentUser = authResult.user;

		const initialPage = isAuthenticated ? 'dashboard' : 'login';

		if (isAuthenticated) {
			// Обновляем меню на основе ролей пользователя
			this.updateMenuVisibility();
		}

		this.setActivePage(initialPage);
		this.setupEventListeners();
		this.startGlowAnimation();
		this.updateUserInfoInSidebar();
	}

	async setActivePage(pageName) {
		// Проверяем доступ пользователя к странице
		if (this.currentUser && !this.canAccessPage(pageName)) {
			console.warn(`User doesn't have access to page: ${pageName}`);
			pageName = 'dashboard'; // Перенаправляем на dashboard если нет доступа
		}

		if (this.currentPageInstance) {
			await this.currentPageInstance.destroy();
		}

		const PageClass = this.pages[pageName] || BasePage;
		this.currentPageInstance = new PageClass();
		this.currentPage = pageName;

		const content = await this.currentPageInstance.load();
		const contentContainer = document.getElementById('content-container');
		if (contentContainer) {
			contentContainer.innerHTML = content;
			await this.currentPageInstance.init();
			this.updateMenuActiveState(pageName);
		}
	}

	canAccessPage(pageName) {
		if (!this.currentUser || !this.currentUser.roles) {
			return pageName === 'login' || pageName === 'dashboard';
		}

		// Проверяем все роли пользователя
		for (const role of this.currentUser.roles) {
			if (this.rolePermissions[role] && this.rolePermissions[role].includes(pageName)) {
				return true;
			}
		}

		return false;
	}

	updateMenuVisibility() {
		if (!this.currentUser || !this.currentUser.roles) {
			return;
		}

		// Собираем все доступные страницы для пользователя
		const availablePages = this.getAvailablePagesForUser();

		// Скрываем/показываем элементы меню
		document.querySelectorAll('.menu-item').forEach(item => {
			const pageName = item.getAttribute('data-page');
			if (pageName && pageName !== 'dashboard' && pageName !== 'notifications' && pageName !== 'profile') {
				if (availablePages.includes(pageName)) {
					item.style.display = 'flex';
				} else {
					item.style.display = 'none';
				}
			}
		});

		// Скрываем группы меню, если все их элементы скрыты
		document.querySelectorAll('.menu-group').forEach(group => {
			const visibleItems = group.querySelectorAll('.menu-item[style*="display: flex"], .menu-item:not([style*="display:"])');
			if (visibleItems.length === 0) {
				group.style.display = 'none';
			} else {
				group.style.display = 'block';
			}
		});
	}

	getAvailablePagesForUser() {
		if (!this.currentUser || !this.currentUser.roles) {
			return ['dashboard', 'notifications', 'profile', 'login'];
		}

		const availablePages = new Set(['dashboard', 'notifications', 'profile']);

		// Собираем все страницы, доступные для ролей пользователя
		this.currentUser.roles.forEach(role => {
			if (this.rolePermissions[role]) {
				this.rolePermissions[role].forEach(page => {
					availablePages.add(page);
				});
			}
		});

		return Array.from(availablePages);
	}

	updateMenuActiveState(pageName) {
		document.querySelectorAll('.menu-item').forEach(item => {
			item.classList.remove('active');
			if (item.getAttribute('data-page') === pageName) {
				item.classList.add('active');
			}
		});
	}

	updateUserInfoInSidebar() {
		if (!this.currentUser) return;

		const profileDesc = document.querySelector('.menu-item[data-page="profile"] .menu-desc');
		if (profileDesc) {
			const roles = this.currentUser.roles ? this.currentUser.roles.join(', ') : 'user';
			profileDesc.textContent = `${this.currentUser.first_name} ${this.currentUser.last_name} (${roles})`;
		}
	}

	async checkAuth() {
		try {
			const response = await fetch('api/check_auth.php');
			const data = await response.json();
			return {
				authenticated: data.status === 'success' && data.authenticated,
				user: data.user || null
			};
		} catch (error) {
			console.error('Auth check failed:', error);
			return { authenticated: false, user: null };
		}
	}

	async logout() {
		try {
			await fetch('api/logout.php', { method: 'POST' });
			await this.setActivePage('login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	setupEventListeners() {
		// Navigation
		document.querySelectorAll('.menu-item').forEach(item => {
			item.addEventListener('click', (e) => {
				const pageName = item.getAttribute('data-page');
				if (pageName && this.pages[pageName]) {
					this.setActivePage(pageName);
				}
			});
		});

		// Switcher
		document.querySelectorAll('.switch input').forEach(switchInput => {
			switchInput.addEventListener('change', function () {
				const descElement = this.closest('.menu-item').querySelector('.menu-desc');
				if (descElement) {
					descElement.textContent = this.checked ? 'On' : 'Off';
				}
			});
		});
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

// Global functions
function checkDatabaseStatus() {
	if (window.app?.currentPageInstance?.checkDatabaseStatus) {
		window.app.currentPageInstance.checkDatabaseStatus();
	}
}

function logout() {
	if (window.app) {
		window.app.logout();
	}
}

const app = new TransportCompanyApp();
window.app = app;
