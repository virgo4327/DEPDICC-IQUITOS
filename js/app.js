document.addEventListener('DOMContentLoaded', () => {
    // =============== INACTIVIDAD / TIMEOUT ===============
    const TIMEOUT_MS       = 20 * 60 * 1000; // 20 minutos
    const WARNING_MS       = 19 * 60 * 1000; // aviso al minuto 19
    let inactivityTimer    = null;
    let warningTimer       = null;
    let warningToastShown  = false;

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
        warningToastShown = false;

        if (!AuthService.isSessionActive()) return;

        // Aviso a los 19 minutos
        warningTimer = setTimeout(() => {
            if (!warningToastShown) {
                warningToastShown = true;
                showToast('⚠️ La sesión se cerrará en 1 minuto por inactividad', 'info', 10000);
            }
        }, WARNING_MS);

        // Cierre automático a los 20 minutos
        inactivityTimer = setTimeout(() => {
            AuthService.clearSession();
            showLogin();
            showToast('⏱ Sesión cerrada por inactividad (20 min)', 'info', 5000);
        }, TIMEOUT_MS);
    }

    function startInactivityTracking() {
        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(evt => document.addEventListener(evt, resetInactivityTimer, { passive: true }));
        resetInactivityTimer();
    }

    function stopInactivityTracking() {
        clearTimeout(inactivityTimer);
        clearTimeout(warningTimer);
    }
    // Referencias DOM - UI Login
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const errorMsg = loginError.querySelector('.error-msg');
    const loginBtn = document.getElementById('login-btn');
    
    // Referencias DOM - Dashboard
    const sessionTimeSpan = document.getElementById('session-time');
    const logoutBtn = document.getElementById('logout-btn');
    const cards = document.querySelectorAll('.card');
    
    // Referencias DOM - Modal & Toasts
    const logoutModal = document.getElementById('logout-modal');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const toastContainer = document.getElementById('toast-container');

    // Inicialización
    checkCurrentState();

    // =============== PASSWORD TOGGLE ===============
    const togglePasswordBtn = document.getElementById('toggle-password');
    const eyeOpen   = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeOpen.style.display   = isPassword ? 'none'  : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
        passwordInput.focus();
    });

    // =============== LOGIN LOGIC ===============
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;

        loginBtn.disabled = true;
        loginBtn.textContent = 'Verificando...';

        const isValid = await AuthService.validateCredentials(password);

        if (isValid) {
            AuthService.setSessionActive();
            showDashboard(true);
            startInactivityTracking();
        } else {
            showLoginError("Contraseña incorrecta.");
        }
        
        loginBtn.disabled = false;
        loginBtn.textContent = 'Ingresar al Sistema';
    });

    function showLoginError(message) {
        errorMsg.textContent = message;
        loginError.classList.remove('hidden');
        
        // Trigger shake animation
        loginError.classList.remove('shake');
        void loginError.offsetWidth; // trigger reflow
        loginError.classList.add('shake');
        
        passwordInput.value = '';
        passwordInput.focus();
    }

    function checkCurrentState() {
        if (AuthService.isSessionActive()) {
            showDashboard(false);
            startInactivityTracking();
        }
    }

    // =============== NAVIGATION ===============

    function showDashboard(showWelcomeToast = false) {
        loginSection.classList.remove('active');
        dashboardSection.classList.add('active');
        dashboardSection.classList.remove('hidden');
        
        sessionTimeSpan.textContent = `Sesión activa desde ${AuthService.getSessionTime()}`;
        
        if (showWelcomeToast) {
            showToast('✓ Bienvenido al sistema DEPDICC IQUITOS', 'success', 3000);
        }
    }

    function showLogin() {
        dashboardSection.classList.remove('active');
        dashboardSection.classList.add('hidden');
        loginSection.classList.add('active');
        
        // Limpiar form
        loginForm.reset();
        loginError.classList.add('hidden');
    }

    // =============== DASHBOARD ACTIONS ===============

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Previene abrir el archivo si se clicó el botón ya que ambos hacen lo mismo y queremos evitar doble acción
            if(e.target.tagName !== 'BUTTON') {
               openUrl(card);
            }
        });
        
        const btn = card.querySelector('.btn-open');
        if(btn) {
             btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openUrl(card);
            });
        }
    });
    
    function openUrl(card) {
        const url = card.getAttribute('data-url');
        if (url) {
            // Cache Busting: Añadir timestamp para forzar descarga de versión nueva
            const separator = url.includes('?') ? '&' : '?';
            const cacheBustedUrl = `${url}${separator}cb=${Date.now()}`;

            showToast('📂 Abriendo archivo, por favor espere...', 'info', 2000);
            setTimeout(() => {
                window.open(cacheBustedUrl, '_blank');
            }, 800);
        }
    }

    // =============== LOGOUT MODAL ===============

    logoutBtn.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });

    modalCancel.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });

    modalConfirm.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
        stopInactivityTracking();
        AuthService.clearSession();
        showLogin();
    });

    // Close modal if clicked outside
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.add('hidden');
        }
    });

    // =============== TOAST SYSTEM ===============

    function showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Cambiamos la duracion de la animacion segun el parametro
        toast.style.animation = `slideInRight 0.3s forwards, fadeOut 0.3s forwards ${duration/1000 - 0.3}s`;
        
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toast.remove();
            }
        }, duration);
    }
});
