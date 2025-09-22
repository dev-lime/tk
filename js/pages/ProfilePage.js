class ProfilePage extends BasePage {
	constructor() {
		super();
		this.pageName = 'profile';
	}

	async load() {
		const response = await fetch('pages/profile.html');
		return await response.text();
	}

	async init() {
		super.init();

		console.log('Profile page initialized');
	}

	async destroy() {
		if (this.chart) {
			this.chart.destroy();
			this.chart = null;
		}
		super.destroy();
	}
}