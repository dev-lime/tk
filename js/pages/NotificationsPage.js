class NotificationsPage extends BasePage {
	constructor() {
		super();
		this.pageName = 'notifications';
	}

	async load() {
		const response = await fetch('pages/notifications.html');
		return await response.text();
	}

	async init() {
		super.init();

		console.log('Notifications page initialized');
	}

	async destroy() {
		super.destroy();
	}
}