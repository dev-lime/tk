class LoginPage extends BasePage {
	constructor() {
		super();
		this.pageName = 'login';
	}

	async load() {
		const response = await fetch('pages/login.html');
		return await response.text();
	}

	async init() {
		super.init();

		// Инициализируем обработчики событий
		this.initEventHandlers();

		console.log('Login page initialized');
	}

	initEventHandlers() {
		const loginForm = document.getElementById('loginForm');
		const togglePassword = document.querySelector('.toggle-password');
		const passwordInput = document.getElementById('password');

		if (togglePassword && passwordInput) {
			togglePassword.addEventListener('click', () => {
				if (passwordInput.type === 'password') {
					passwordInput.type = 'text';
					togglePassword.classList.remove('fa-eye');
					togglePassword.classList.add('fa-eye-slash');
				} else {
					passwordInput.type = 'password';
					togglePassword.classList.remove('fa-eye-slash');
					togglePassword.classList.add('fa-eye');
				}
			});
		}

		if (loginForm) {
			loginForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				await this.handleLogin();
			});
		}
	}

	async handleLogin() {
		const username = document.getElementById('username');
		const password = document.getElementById('password');
		const loginBtn = document.querySelector('.login-btn');
		const btnText = document.querySelector('.btn-text');
		const btnLoading = document.querySelector('.btn-loading');

		// Показываем состояние загрузки
		btnText.style.display = 'none';
		btnLoading.style.display = 'inline';
		loginBtn.disabled = true;

		try {
			const response = await fetch('api/login.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
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
			this.showError(error.message);
		} finally {
			btnText.style.display = 'inline';
			btnLoading.style.display = 'none';
			loginBtn.disabled = false;
		}
	}

	showError(message) {
		// Удаляем существующую ошибку
		const existingError = document.querySelector('.login-error');
		if (existingError) existingError.remove();

		// Создаем новое сообщение об ошибке
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message login-error';
		errorDiv.style.display = 'block';
		errorDiv.style.textAlign = 'center';
		errorDiv.style.marginTop = '15px';
		errorDiv.textContent = message;

		document.getElementById('loginForm').appendChild(errorDiv);
	}

	async destroy() {
		// Очищаем обработчики событий
		const loginForm = document.getElementById('loginForm');
		if (loginForm) {
			loginForm.replaceWith(loginForm.cloneNode(true));
		}

		super.destroy();
	}
}