class BasePage {
	constructor() {
		this.pageName = 'base';
	}

	async init() {
		console.log(`Initializing ${this.pageName} page`);
	}

	async load() {
		return '';
	}

	async destroy() {
		console.log(`Destroying ${this.pageName} page`);
	}
}