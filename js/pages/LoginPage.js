class LoginPage extends BasePage {
	constructor() {
		super();
		this.pageName = 'login';
		this.currentTab = 'login';
	}

	async load() {
		const response = await fetch('pages/login.html');
		return await response.text();
	}

	async init() {
		super.init();
		this.initEventHandlers();
		console.log('Login page initialized');
	}

	initEventHandlers() {
		// Tab switching
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const tab = e.target.getAttribute('data-tab');
				this.switchTab(tab);
			});
		});

		// Password visibility toggle
		document.querySelectorAll('.toggle-password').forEach(icon => {
			icon.addEventListener('click', (e) => {
				const input = e.target.closest('.input-with-icon').querySelector('input');
				this.togglePasswordVisibility(input, e.target);
			});
		});

		// Login form
		const loginForm = document.getElementById('loginForm');
		if (loginForm) {
			loginForm.addEventListener('submit', (e) => {
				e.preventDefault();
				this.handleLogin();
			});
		}

		// Register form
		const registerForm = document.getElementById('registerForm');
		if (registerForm) {
			registerForm.addEventListener('submit', (e) => {
				e.preventDefault();
				this.handleRegister();
			});
		}
	}

	switchTab(tabName) {
		this.currentTab = tabName;

		// Update tab buttons
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
		});

		// Update tab content
		document.querySelectorAll('.tab-pane').forEach(pane => {
			pane.classList.toggle('active', pane.id === `${tabName}-tab`);
		});

		// Clear errors
		this.clearErrors();
	}

	togglePasswordVisibility(input, icon) {
		if (input.type === 'password') {
			input.type = 'text';
			icon.classList.remove('fa-eye');
			icon.classList.add('fa-eye-slash');
		} else {
			input.type = 'password';
			icon.classList.remove('fa-eye-slash');
			icon.classList.add('fa-eye');
		}
	}

	clearErrors() {
		document.querySelectorAll('.error-message').forEach(el => {
			el.style.display = 'none';
			el.textContent = '';
		});

		document.querySelectorAll('input').forEach(input => {
			input.classList.remove('error');
		});
	}

	async handleLogin() {
		const username = document.getElementById('login-username');
		const password = document.getElementById('login-password');
		const loginBtn = document.querySelector('#loginForm .login-btn');
		const btnText = loginBtn.querySelector('.btn-text');
		const btnLoading = loginBtn.querySelector('.btn-loading');

		// Validation
		if (!this.validateLoginForm()) {
			return;
		}

		// Show loading
		btnText.style.display = 'none';
		btnLoading.style.display = 'inline';
		loginBtn.disabled = true;

		try {
			const response = await fetch('api/login.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: username.value.trim(),
					password: password.value
				})
			});

			const data = await response.json();

			if (data.status === 'success') {
				window.location.reload();
			} else {
				throw new Error(data.message);
			}

		} catch (error) {
			this.showError(error.message, 'login');
		} finally {
			btnText.style.display = 'inline';
			btnLoading.style.display = 'none';
			loginBtn.disabled = false;
		}
	}

	async handleRegister() {
		const registerBtn = document.querySelector('#registerForm .login-btn');
		const btnText = registerBtn.querySelector('.btn-text');
		const btnLoading = registerBtn.querySelector('.btn-loading');

		// Validation
		if (!this.validateRegisterForm()) {
			return;
		}

		// Show loading
		btnText.style.display = 'none';
		btnLoading.style.display = 'inline';
		registerBtn.disabled = true;

		try {
			const formData = {
				username: document.getElementById('reg-username').value.trim(),
				password: document.getElementById('reg-password').value,
				first_name: document.getElementById('reg-firstname').value.trim(),
				last_name: document.getElementById('reg-lastname').value.trim(),
				middle_name: document.getElementById('reg-middlename').value.trim() || null,
				email: document.getElementById('reg-email').value.trim() || null,
				phone: document.getElementById('reg-phone').value.trim() || null,
				company_name: document.getElementById('reg-company').value.trim() || null
			};

			const response = await fetch('api/register.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const data = await response.json();

			if (data.status === 'success') {
				this.showSuccess('Registration successful! You can now login.');
				this.switchTab('login');

				// Clear register form
				document.getElementById('registerForm').reset();

			} else {
				throw new Error(data.message);
			}

		} catch (error) {
			this.showError(error.message, 'register');
		} finally {
			btnText.style.display = 'inline';
			btnLoading.style.display = 'none';
			registerBtn.disabled = false;
		}
	}

	validateLoginForm() {
		let isValid = true;
		const username = document.getElementById('login-username');
		const password = document.getElementById('login-password');

		if (!username.value.trim()) {
			this.showFieldError('loginUsernameError', 'Please enter username', username);
			isValid = false;
		}

		if (!password.value) {
			this.showFieldError('loginPasswordError', 'Please enter password', password);
			isValid = false;
		}

		return isValid;
	}

	validateRegisterForm() {
		let isValid = true;

		// Required fields
		const requiredFields = [
			{ id: 'reg-lastname', error: 'regLastnameError', message: 'Please enter last name' },
			{ id: 'reg-firstname', error: 'regFirstnameError', message: 'Please enter first name' },
			{ id: 'reg-username', error: 'regUsernameError', message: 'Please enter username' },
			{ id: 'reg-password', error: 'regPasswordError', message: 'Please enter password' },
			{ id: 'reg-confirm-password', error: 'regConfirmPasswordError', message: 'Please confirm password' }
		];

		requiredFields.forEach(field => {
			const input = document.getElementById(field.id);
			if (!input.value.trim()) {
				this.showFieldError(field.error, field.message, input);
				isValid = false;
			}
		});

		// Password validation
		const password = document.getElementById('reg-password');
		const confirmPassword = document.getElementById('reg-confirm-password');

		if (password.value && password.value.length < 6) {
			this.showFieldError('regPasswordError', 'Password must be at least 6 characters', password);
			isValid = false;
		}

		if (password.value !== confirmPassword.value) {
			this.showFieldError('regConfirmPasswordError', 'Passwords do not match', confirmPassword);
			isValid = false;
		}

		return isValid;
	}

	showFieldError(errorElementId, message, inputElement) {
		const errorElement = document.getElementById(errorElementId);
		errorElement.textContent = message;
		errorElement.style.display = 'block';
		inputElement.classList.add('error');
	}

	showError(message, context = 'global') {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.style.display = 'block';
		errorDiv.style.textAlign = 'center';
		errorDiv.style.marginTop = '15px';
		errorDiv.style.marginBottom = '15px';
		errorDiv.textContent = message;

		// Remove old error
		const oldError = document.querySelector(`.${context}-error`);
		if (oldError) oldError.remove();

		errorDiv.className = `error-message ${context}-error`;

		const form = context === 'login' ?
			document.getElementById('loginForm') :
			document.getElementById('registerForm');

		form.appendChild(errorDiv);
	}

	showSuccess(message) {
		const successDiv = document.createElement('div');
		successDiv.className = 'success-message';
		successDiv.style.display = 'block';
		successDiv.style.textAlign = 'center';
		successDiv.style.marginTop = '15px';
		successDiv.style.marginBottom = '15px';
		successDiv.style.color = '#34a853';
		successDiv.textContent = message;

		const oldSuccess = document.querySelector('.success-message');
		if (oldSuccess) oldSuccess.remove();

		document.querySelector('.login-container').insertBefore(
			successDiv,
			document.querySelector('.tab-content')
		);

		// Auto-hide after 5 seconds
		setTimeout(() => {
			if (successDiv.parentNode) {
				successDiv.parentNode.removeChild(successDiv);
			}
		}, 5000);
	}

	async destroy() {
		// Cleanup event handlers
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.replaceWith(btn.cloneNode(true));
		});

		super.destroy();
	}
}

function switchToRegister() {
	if (window.app?.currentPageInstance?.switchTab) {
		window.app.currentPageInstance.switchTab('register');
	}
}

function switchToLogin() {
	if (window.app?.currentPageInstance?.switchTab) {
		window.app.currentPageInstance.switchTab('login');
	}
}
