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

	showModal(title, content, footer = '') {
		// Закрываем существующее модальное окно
		this.closeModal();

		const modalHTML = `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        `;

		document.body.insertAdjacentHTML('beforeend', modalHTML);

		// Закрытие по клику на оверлей
		document.getElementById('modal-overlay').addEventListener('click', (e) => {
			if (e.target.id === 'modal-overlay') {
				this.closeModal();
			}
		});

		// Закрытие по ESC
		this.modalEscHandler = (e) => {
			if (e.key === 'Escape') {
				this.closeModal();
			}
		};
		document.addEventListener('keydown', this.modalEscHandler);
	}

	closeModal() {
		const existingModal = document.getElementById('modal-overlay');
		if (existingModal) {
			existingModal.remove();
		}
		if (this.modalEscHandler) {
			document.removeEventListener('keydown', this.modalEscHandler);
		}
	}

	showError(message, context = 'global') {
		console.error(`Error on ${this.pageName}:`, message);

		let errorContainer = document.getElementById('error-container');
		if (!errorContainer) {
			errorContainer = document.createElement('div');
			errorContainer.id = 'error-container';
			errorContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
			document.body.appendChild(errorContainer);
		}

		const errorDiv = document.createElement('div');
		errorDiv.className = `error-message ${context}-error`;
		errorDiv.style.cssText = `
            background: rgba(234, 67, 53, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #ea4335;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
        `;
		errorDiv.textContent = message;

		const closeBtn = document.createElement('button');
		closeBtn.innerHTML = '×';
		closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            float: right;
            margin-left: 10px;
        `;
		closeBtn.onclick = () => errorDiv.remove();

		errorDiv.appendChild(closeBtn);

		errorContainer.appendChild(errorDiv);

		setTimeout(() => {
			if (errorDiv.parentNode) {
				errorDiv.parentNode.removeChild(errorDiv);
			}
		}, 5000);
	}

	showSuccess(message) {
		console.log(`Success on ${this.pageName}:`, message);

		let successContainer = document.getElementById('success-container');
		if (!successContainer) {
			successContainer = document.createElement('div');
			successContainer.id = 'success-container';
			successContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
			document.body.appendChild(successContainer);
		}

		const successDiv = document.createElement('div');
		successDiv.className = 'success-message';
		successDiv.style.cssText = `
            background: rgba(52, 168, 83, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #34a853;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
        `;
		successDiv.textContent = message;

		const closeBtn = document.createElement('button');
		closeBtn.innerHTML = '×';
		closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            float: right;
            margin-left: 10px;
        `;
		closeBtn.onclick = () => successDiv.remove();

		successDiv.appendChild(closeBtn);

		successContainer.appendChild(successDiv);

		setTimeout(() => {
			if (successDiv.parentNode) {
				successDiv.parentNode.removeChild(successDiv);
			}
		}, 5000);
	}

	showLoading() {
		let loadingDiv = document.getElementById('loading-indicator');
		if (!loadingDiv) {
			loadingDiv = document.createElement('div');
			loadingDiv.id = 'loading-indicator';
			loadingDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 1000;
                backdrop-filter: blur(10px);
            `;
			loadingDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="spinner"></div>
                    <span>Loading...</span>
                </div>
            `;
			document.body.appendChild(loadingDiv);
		}
		return loadingDiv;
	}

	hideLoading() {
		const loadingDiv = document.getElementById('loading-indicator');
		if (loadingDiv) {
			loadingDiv.remove();
		}
	}
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);