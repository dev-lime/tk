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
		await this.loadUserProfile();
		console.log('Profile page initialized');
	}

	async loadUserProfile() {
		try {
			const response = await fetch('api/get_profile.php');
			const data = await response.json();

			if (data.status === 'success') {
				this.displayProfileData(data.user);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			console.error('Error loading profile:', error);
			this.showError('Failed to load profile data');
		}
	}

	displayProfileData(user) {
		// Basic info
		document.getElementById('profileUsername').textContent = `@${user.username}`;

		// Roles
		const rolesElement = document.getElementById('profileRoles');
		if (user.roles && user.roles.length > 0) {
			rolesElement.innerHTML = user.roles.map(role =>
				`${role} `
			).join('');
		}

		// Personal information
		document.getElementById('profileFirstName').textContent = user.first_name || '-';
		document.getElementById('profileLastName').textContent = user.last_name || '-';
		document.getElementById('profileMiddleName').textContent = user.middle_name || '-';
		document.getElementById('profileUserId').textContent = user.id || '-';

		// Contact information
		document.getElementById('profileEmail').textContent = user.email || '-';
		document.getElementById('profilePhone').textContent = user.phone || '-';

		// Registration date
		const regDate = user.registration_date ?
			new Date(user.registration_date).toLocaleDateString('ru-RU') : '-';
		document.getElementById('profileRegDate').textContent = regDate;

		// Specialized information
		this.displaySpecializedInfo(user.specialized_info);
	}

	displaySpecializedInfo(specializedInfo) {
		const specializedSection = document.getElementById('specializedInfo');
		if (!specializedInfo || Object.keys(specializedInfo).length === 0) {
			specializedSection.style.display = 'none';
			return;
		}

		let specializedHTML = '';

		if (specializedInfo.client) {
			specializedHTML += `
                <div class="detail-item">
                    <label class="detail-label">Company</label>
                    <p class="detail-value">${specializedInfo.client.company_name || '-'}</p>
                </div>
            `;
		}

		if (specializedInfo.driver) {
			specializedHTML += `
                <div class="detail-item">
                    <label class="detail-label">Driver License</label>
                    <p class="detail-value">${specializedInfo.driver.license_number}</p>
                </div>
            `;
		}

		if (specializedHTML) {
			specializedSection.innerHTML = specializedHTML;
			specializedSection.style.display = 'block';
		} else {
			specializedSection.style.display = 'none';
		}
	}

	showError(message) {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.style.cssText = `
            background: rgba(234, 67, 53, 0.1);
            border: 1px solid rgba(234, 67, 53, 0.3);
            color: #ea4335;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        `;
		errorDiv.textContent = message;

		const container = document.querySelector('.profile-container');
		container.insertBefore(errorDiv, container.firstChild);
	}

	async destroy() {
		super.destroy();
	}
}