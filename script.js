// Page navigation functionality
document.addEventListener('DOMContentLoaded', function () {
    // Set initial active page
    showPage('dashboard');

    // Add click event listeners to menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function () {
            const pageId = this.getAttribute('data-page');
            showPage(pageId);

            // Update active menu item
            document.querySelectorAll('.menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Toggle switches
    document.querySelectorAll('.switch input').forEach(switchInput => {
        switchInput.addEventListener('change', function () {
            const descElement = this.closest('.menu-item').querySelector('.menu-desc');
            if (descElement) {
                descElement.textContent = this.checked ? 'On' : 'Off';
            }
        });
    });
});

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    const selectedPage = document.getElementById(`${pageId}-page`);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
}

// Add subtle background animation to glow effects
document.addEventListener('DOMContentLoaded', function () {
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
});