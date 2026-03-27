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
            showToast('📂 Abriendo archivo, por favor espere...', 'info', 2000);
            setTimeout(() => {
                window.open(url, '_blank');
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

    // =============== EXPERIMENTAL SUPABASE INTEGRATION ===============
    const SUPABASE_URL = 'https://clgsccolqatrkbowqozg.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_j__CxuQ8OaiZff77o3uunQ_xwbMSwr5';
    let supabaseClient = null;
    let realtimeSubscription = null;

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase script no está cargado.");
    }

    const cardSupabase = document.getElementById('card-supabase');
    const dataEntrySection = document.getElementById('data-entry-section');
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    const tableBody = document.getElementById('table-body');
    const btnAddRow = document.getElementById('btn-add-row');
    const searchInput = document.getElementById('search-input');
    const syncDot = document.getElementById('sync-dot');
    const syncText = document.getElementById('sync-text');

    // Prevent default card behavior on the Supabase card
    if (cardSupabase) {
        // Stop clicks from reaching the document/card standard behavior
        cardSupabase.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showDataEntryView();
        });
        
        const btnOpenSupabase = document.getElementById('btn-open-supabase');
        if (btnOpenSupabase) {
            btnOpenSupabase.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showDataEntryView();
            });
        }
    }

    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', hideDataEntryView);
    }

    function showDataEntryView() {
        dashboardSection.classList.add('hidden');
        dashboardSection.classList.remove('active');
        dataEntrySection.classList.remove('hidden');
        dataEntrySection.classList.add('active');
        
        if (supabaseClient) {
            loadInformes();
            setupRealtimeSubscription();
        } else {
            showToast('Error: Cliente de Supabase no cargado', 'error');
        }
    }

    function hideDataEntryView() {
        dataEntrySection.classList.add('hidden');
        dataEntrySection.classList.remove('active');
        dashboardSection.classList.remove('hidden');
        dashboardSection.classList.add('active');
        
        if (realtimeSubscription) {
            supabaseClient.removeChannel(realtimeSubscription);
            realtimeSubscription = null;
        }
    }

    function setSyncStatus(isOnline) {
        if(!syncDot) return;
        const statusContainer = syncDot.parentElement;
        if (isOnline) {
            statusContainer.classList.remove('offline');
            syncText.textContent = 'En línea / Sincronizado';
        } else {
            statusContainer.classList.add('offline');
            syncText.textContent = 'Desconectado / Sincronizando...';
        }
    }

    async function loadInformes() {
        if (!supabaseClient) return;
        setSyncStatus(false);
        try {
            const { data, error } = await supabaseClient
                .from('informes')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            renderTable(data);
            setSyncStatus(true);
        } catch (err) {
            console.error('Error cargando informes:', err);
            showToast('Error al conectar con la base de datos', 'error');
            setSyncStatus(false);
        }
    }

    function renderTable(informes) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (!informes || informes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No hay registros. Haz clic en "+ Nuevo Registro".</td></tr>';
            return;
        }

        const filterVal = searchInput ? searchInput.value.toLowerCase() : '';
        
        informes.forEach(informe => {
            if (filterVal) {
                const searchStr = `${informe.numero} ${informe.detalle} ${informe.estado}`.toLowerCase();
                if (!searchStr.includes(filterVal)) return;
            }

            const tr = document.createElement('tr');
            tr.dataset.id = informe.id;
            
            tr.innerHTML = `
                <td><input type="text" class="cell-input" data-field="numero" value="${informe.numero || ''}" placeholder="Ej: 001-2026"></td>
                <td><input type="date" class="cell-input" data-field="fecha" value="${informe.fecha || ''}"></td>
                <td><input type="text" class="cell-input" data-field="detalle" value="${informe.detalle || ''}" placeholder="Detalle del informe"></td>
                <td><input type="text" class="cell-input" data-field="estado" value="${informe.estado || ''}" placeholder="Pendiente / Atendido"></td>
                <td>
                    <button class="btn-delete" data-id="${informe.id}">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Add event listeners for inline editing
        tableBody.querySelectorAll('.cell-input').forEach(input => {
            input.addEventListener('change', (e) => updateInforme(e.target));
        });

        tableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteInforme(e.target.dataset.id));
        });
    }

    async function updateInforme(inputElement) {
        if (!supabaseClient) return;
        const tr = inputElement.closest('tr');
        const id = tr.dataset.id;
        const field = inputElement.dataset.field;
        let value = inputElement.value;
        
        // Handle null dates correctly
        if (field === 'fecha' && value === '') value = null;

        inputElement.classList.add('saving-indicator');
        setSyncStatus(false);

        try {
            const { error } = await supabaseClient
                .from('informes')
                .update({ [field]: value })
                .eq('id', id);

            if (error) throw error;
            setSyncStatus(true);
        } catch (err) {
            console.error('Error actualizando:', err);
            showToast('Error al guardar. Verifica los datos.', 'error');
        } finally {
            inputElement.classList.remove('saving-indicator');
        }
    }

    if (btnAddRow) {
        btnAddRow.addEventListener('click', async () => {
            if (!supabaseClient) return;
            setSyncStatus(false);
            try {
                // Default date to today
                const today = new Date().toISOString().split('T')[0];
                const { error } = await supabaseClient
                    .from('informes')
                    .insert([{ numero: 'NUEVO_INFORME', fecha: today, detalle: '', estado: 'Pendiente' }]);
                    
                if (error) throw error;
                // It will auto-refresh via realtime
                if (!realtimeSubscription) loadInformes();
            } catch (err) {
                console.error('Error agregando:', err);
                showToast('Asegúrate de haber creado la tabla SQL primero', 'error');
                setSyncStatus(false);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // Local filtering
            loadInformes();
        });
    }

    async function deleteInforme(id) {
        if (!confirm('¿Seguro que deseas eliminar definitivamente este registro de la base de datos?')) return;
        if (!supabaseClient) return;
        setSyncStatus(false);
        try {
            const { error } = await supabaseClient
                .from('informes')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error eliminando:', err);
            showToast('Error al eliminar', 'error');
            setSyncStatus(false);
        }
    }

    function setupRealtimeSubscription() {
        if (!supabaseClient) return;
        if (realtimeSubscription) return; // already listening

        realtimeSubscription = supabaseClient
            .channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'informes' },
                (payload) => {
                    console.log('Cambio detectado por WebSockets:', payload);
                    // Refresh data
                    loadInformes();
                }
            )
            .subscribe((status) => {
                if(status === 'SUBSCRIBED') {
                    console.log('Suscrito a Supabase Real-Time');
                }
            });
    }
});

