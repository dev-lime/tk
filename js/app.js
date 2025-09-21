class TransportCompanyApp {
	constructor() {
		this.currentPage = null;
		this.currentPageInstance = null;
		this.pages = {
			'dashboard': DashboardPage,
			'login': LoginPage,
			'orders': OrdersPage,
			'vehicles': BasePage,
			'users': BasePage,
			'clients': BasePage,
			'drivers': BasePage,
			'dispatchers': BasePage,
			'profile': BasePage,
			'notifications': BasePage
		};

		this.init();
	}

	async init() {
		const isAuthenticated = await this.checkAuth();

		const initialPage = isAuthenticated ? 'dashboard' : 'login';
		this.setActivePage(initialPage);

		this.setupEventListeners();
		this.startGlowAnimation();
	}

	async setActivePage(pageName) {
		if (this.currentPageInstance) {
			await this.currentPageInstance.destroy();
		}

		const PageClass = this.pages[pageName] || BasePage;
		this.currentPageInstance = new PageClass();
		this.currentPage = pageName;

		const content = await this.currentPageInstance.load();
		document.getElementById('content-container').innerHTML = content;

		await this.currentPageInstance.init();
		this.updateMenuActiveState(pageName);
	}

	updateMenuActiveState(pageName) {
		document.querySelectorAll('.menu-item').forEach(item => {
			item.classList.remove('active');
			if (item.getAttribute('data-page') === pageName) {
				item.classList.add('active');
			}
		});
	}

	async checkAuth() {
		try {
			const response = await fetch('api/check_auth.php');
			const data = await response.json();
			return data.status === 'success' && data.authenticated;
		} catch (error) {
			console.error('Auth check failed:', error);
			return false;
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
