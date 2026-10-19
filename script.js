(() => {
    const toggle = document.getElementById('headerMenuToggle');
    const menu = document.getElementById('headerControls');

    if (!toggle || !menu) return;

    function setMenuOpen(open) {
        menu.classList.toggle('is-open', open);

        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute(
            'aria-label',
            open ? 'Cerrar menú de opciones' : 'Abrir menú de opciones'
        );

        toggle.innerHTML = open
            ? '<i data-lucide="x" class="w-5 h-5"></i>'
            : '<i data-lucide="menu" class="w-5 h-5"></i>';

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Abrir o cerrar al pulsar el botón del menú
    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        setMenuOpen(!menu.classList.contains('is-open'));
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (event) => {
        if (
            !menu.contains(event.target) &&
            !toggle.contains(event.target)
        ) {
            setMenuOpen(false);
        }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // 1. Si el modo de colocación de guardia está activo, lo cancelamos primero
            if (typeof isGuardPlacementMode !== 'undefined' && isGuardPlacementMode) {
                if (typeof cancelGuardPlacement === 'function') {
                    toggleGuardPlacementMode();
                } else if (typeof toggleGuardPlacementMode === 'function') {
                    toggleGuardPlacementMode(); // O la función que desactive el modo
                }
                return; // Evitamos que cierre el menú en la misma pulsación si prefieres ir paso a paso
            }

            // 2. Si no hay guardia activa, cerramos el menú si está abierto
            if (menu.classList.contains('is-open')) {
                setMenuOpen(false);
                toggle.focus();
            }

            // Quitar foco
            if (document.activeElement) document.activeElement.blur();
        }
    });

    // Cerrar si se vuelve a escritorio
    window.addEventListener('resize', () => {
        if (window.innerWidth > 767) {
            setMenuOpen(false);
        }
    });
})();

function closeMobileMenu() {
    const menu = document.getElementById('headerControls');
    const toggle = document.getElementById('headerMenuToggle');
    if (menu) {
        menu.classList.remove('is-open', 'open');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menú de opciones');
            toggle.innerHTML = '<i data-lucide="menu" class="w-5 h-5"></i>';
            if (window.lucide) window.lucide.createIcons();
        }
    }
}

// Control del menú desplegable de la cabecera en pantallas estrechas
const headerMenuToggle = document.getElementById('headerMenuToggle');
const headerControls = document.getElementById('headerControls');

if (headerMenuToggle && headerControls) {
    headerMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic se propague
        const isOpen = headerControls.classList.toggle('open');
        headerMenuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Evitar que los clics dentro del menú lo cierren antes de tiempo
    headerControls.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Cerrar el menú al hacer clic fuera
    document.addEventListener('click', () => {
        if (headerControls.classList.contains('open')) {
            headerControls.classList.remove('open');
            headerMenuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// CONFIGURACIÓN DE FIREBASE (Reemplaza con tus llaves reales de Firebase Console)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAvcqxV9UTRyJLQHD6r7rUqikB53WskTdQ",
    authDomain: "payshift-0.firebaseapp.com",
    projectId: "payshift-0",
    storageBucket: "payshift-0.firebasestorage.app",
    messagingSenderId: "905065765221",
    appId: "1:905065765221:web:b47a3a4ce145b9e855698c",
    measurementId: "G-W9PZRNGXQF"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const CURRENT_APP_VERSION = "v1.4.4";
const versionElem = document.getElementById('version');
if (versionElem) {
    versionElem.innerText = CURRENT_APP_VERSION;
}
const MAX_CUSTOM_SHIFTS = 12;
const ADMIN_RESTORE_PASSWORD = "450855";
let pendingRestoreIndex = null;

let currentDate = new Date();
let selectedDayKey = currentDate.toLocaleDateString('sv-SE');
let currentView = 'month';
let currentUserEmail = null;
let isGuardPlacementMode = false;
let isDarkMode = true;
let isPayrollVisible = true;
let isRegisteringMode = false;

let selectionAnchor = null;
let selectedKeys = [];

let tempAvatarData = null;
let deletedAvatar = false;

let backupCounter = 0;
let appData = {};
let backupsHistory = [];

let pendingAvatarBase64 = null;
let pendingShiftBackgrounds = {};
let pendingShiftSplits = {};

function togglePasswordVisibility(inputId, btn) {
    const pwdInput = document.getElementById(inputId);
    const icon = btn.querySelector('[data-lucide]');

    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        // Cambia el icono a Ojo Tachado (ocultar)
        icon.setAttribute('data-lucide', 'eye-off'); // Ojo tachado
    } else {
        pwdInput.type = 'password';
        // Cambia el icono a Ojo Normal (mostrar)
        icon.setAttribute('data-lucide', 'eye'); // Ojo normal
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

/* NUEVO: Validación de requisitos de contraseña */
function checkPasswordRequirements(pwd) {
    if (!pwd) {
        resetPasswordRequirementsUI();
        return;
    }
    const hasLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    updateReqItem('req-length', hasLen);
    updateReqItem('req-upper', hasUpper);
    updateReqItem('req-lower', hasLower);
    updateReqItem('req-number', hasNum);
    updateReqItem('req-special', hasSpecial);
}

function resetPasswordRequirementsUI() {
    // Array con las IDs de tus elementos de requisito
    const requirementIds = ['req-length', 'req-upper', 'req-lower', 'req-number', 'req-special'];

    requirementIds.forEach(id => {
        updateReqItem(id, false);
    });
}

function updateReqItem(elementId, isValid) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const span = el.querySelector('span');
    if (isValid) {
        el.className = "flex items-center gap-1.5 text-emerald-400 font-semibold";
        span.innerText = "✓";
        span.className = "w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[clamp(0.6rem,0.7vw,0.8rem)] bg-emerald-500/20 text-emerald-400 rounded-full";
    } else {
        el.className = "flex items-center gap-1.5 text-slate-500";
        span.innerText = "✕";
        span.className = "w-3.5 h-3.5 inline-flex items-center justify-center font-bold text-[clamp(0.55rem,0.65vw,0.75rem)]";
    }
}

/* MODIFICACIÓN 3: Al importar datos vía JSON se actualizan los datos y se muestra alerta sin expulsar al usuario */
function exportAppData() {
    try {
        const exportObj = {
            version: CURRENT_APP_VERSION,
            timestamp: new Date().toISOString(),
            appData: appData,
            backupsHistory: backupsHistory,
            shiftFullNames: typeof shiftFullNames !== 'undefined' ? shiftFullNames : {},
            shiftHours: typeof shiftHours !== 'undefined' ? shiftHours : {},
            shiftSplit: typeof shiftSplit !== 'undefined' ? shiftSplit : {}
        };

        // 1. Convertir a Blob
        const jsonString = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });

        // 2. Crear URL temporal
        const url = URL.createObjectURL(blob);

        // 3. Generar enlace y disparar descarga
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = url;
        downloadAnchor.download = `backup_gestion_turnos_${new Date().toISOString().slice(0, 10)}.json`;

        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();

        // 4. Limpieza
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Error detallado:", e);
        openCustomAlertModal("Error de Exportación", "No se pudo exportar la información.");
    }
}

async function importAppData(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const imported = JSON.parse(e.target.result);

            if (imported.appData) {
                appData = imported.appData;

                if (imported.backupsHistory) {
                    backupsHistory = imported.backupsHistory;
                }

                if (imported.shiftFullNames) {
                    shiftFullNames = imported.shiftFullNames;
                    if (typeof saveShiftFullNames === 'function') {
                        await saveShiftFullNames();
                    }
                }

                if (imported.shiftHours && typeof shiftHours !== 'undefined') {
                    shiftHours = imported.shiftHours;
                    if (typeof saveShiftHours === 'function') {
                        await saveShiftHours();
                    }
                }

                if (imported.shiftSplit && typeof shiftSplit !== 'undefined') {
                    shiftSplit = imported.shiftSplit;
                    if (typeof saveShiftSplit === 'function') {
                        await saveShiftSplit();
                    }
                }

                // Guardar en Firebase y actualizar la interfaz
                await saveDataToFirebase();
                renderCalendar();
                updateSidebar();

                if (currentView === 'year') {
                    renderYearlyView();
                }

                openCustomAlertModal("Datos Actualizados", "Los datos se han actualizado correctamente desde el archivo JSON.");
            } else {
                openCustomAlertModal("Formato Inválido", "El archivo JSON no tiene la estructura esperada.");
            }
        } catch (err) {
            console.error("Error al importar JSON:", err);
            openCustomAlertModal("Error", "Ocurrió un error al procesar el archivo seleccionado.");
        } finally {
            inputElement.value = '';
        }
    };

    reader.readAsText(file);
    closeSettingsModal();
}

let shiftFullNames = {
    M: "Mañana",
    T: "Tarde",
    N: "Noche",
    G: "Guardia",
    MG: "Mañana Guardia",
    NG: "Noche Guardia",
    DH: "Disfrute Horas",
    LR: "Licencia Retribuida",
    F: "Festivo",
    AC: "Ajuste Calendario",
    V: "Vacaciones"
};

async function saveShiftFullNames() {
    await saveDataToFirebase(false);
}

/// *** COLORES POR DEFECTO
const defaultColors = {
    M: { bg: '#009797', text: '#ffffff', border: '#009797', startTime: '06:00', endTime: '14:00' },
    T: { bg: '#fb923c', text: '#ffffff', border: '#f97316', startTime: '14:00', endTime: '22:00' },
    N: { bg: '#4338ca', text: '#ffffff', border: '#3730a3', startTime: '22:00', endTime: '06:00' },
    G: { bg: '#ff8040', text: '#ffffff', border: '#ff8040' },
    MG: { bg: '#008f97', text: '#ffffff', border: '#ff8040', startTime: '06:00', endTime: '14:00' },
    NG: { bg: '#4338ca', text: '#ffffff', border: '#ff8040', startTime: '14:00', endTime: '22:00' },
    DH: { bg: '#008000', text: '#ffffff', border: '#008000' },
    LR: { bg: '#6c6c00', text: '#ffffff', border: '#666600' },
    F: { bg: '#0080ff', text: '#ffffff', border: '#0080ff' },
    AC: { bg: '#8000ff', text: '#ffffff', border: '#8000ff' },
    V: { bg: '#8000ff', text: '#ffffff', border: '#8000ff' }
};

// Orden fijo de los turnos en los selectores y en el panel de configuración.
const SHIFT_ORDER = ['M', 'T', 'N', 'G', 'MG', 'NG', 'V', 'AC', 'F', 'DH', 'LR'];

function getOrderedShiftCodes(availableColors) {
    const codes = Object.keys(availableColors || {});
    return [
        ...SHIFT_ORDER.filter(code => codes.includes(code)),
        ...codes.filter(code => !SHIFT_ORDER.includes(code))
    ];
}

const HORA_EXTRA_MG = 9.069115;
const HORA_EXTRA_NG = 13.603673;
const GUARDIA_DISPO = { laborable: 19.67, finde: 39.32, festivo: 78.64, especial: 131.07 };
const GUARDIA_INTERVENCION = { 1: 52.35, 2: 104.71, 3: 157.06, 4: 209.41, 5: 261.77, 6: 314.12 };

isPayrollVisible = window.innerWidth >= 1024;

let inactivityTimer;

// Función para reiniciar el contador de inactividad
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    // Tiempo límite: 15 minutos (15 * 60 * 1000 ms)
    const timeoutMinutes = 15 * 60 * 1000;

    inactivityTimer = setTimeout(() => {
        // Solo cerrar sesión si hay un usuario activo
        if (currentUserEmail) {
            const Ayuda = document.getElementById('helpModal');
            const Ajustes = document.getElementById('settingsModal');
            const Admin = document.getElementById('adminAuthModal');
            const Turnos = document.getElementById('customShiftModal');

            if (!document.documentElement.classList.contains('dark')) toggleDarkMode(); // Si está en modo claro
            if (!Ayuda.classList.contains('hidden')) Ayuda.classList.add('hidden'); // Cerrar panel ayuda
            if (!Ajustes.classList.contains('hidden')) Ajustes.classList.add('hidden'); // Cerrar panel ajustes
            if (!Admin.classList.contains('hidden')) Admin.classList.add('hidden'); // Cerrar panel admin
            if (!Turnos.classList.contains('hidden')) Turnos.classList.add('hidden'); // Cerrar panel turnos
            handleLogout(); // Cerrar sesión
            openCustomAlertModal("Sesión Expirada", "Has sido desconectado por inactividad.");
        }
    }, timeoutMinutes);
}

// Iniciar los escuchadores de interacción del usuario
function setupInactivityListener() {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
        window.addEventListener(event, resetInactivityTimer, true);
    });
    resetInactivityTimer();
}

// Llama a setupInactivityListener() dentro de showAppLayout() o cuando inicie sesión.
function showLoading() {
    const loader = document.getElementById('appLoadingOverlay');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoading() {
    const loader = document.getElementById('appLoadingOverlay');
    if (loader) {
        loader.classList.add('opacity-0', 'pointer-events-none');
       // setTimeout(() => loader.remove(), 300); // No se elimina para mostrarlo después
    }
}

let clickCount = 0;
let clickTimer = null;

function Secret() {
    const triggerElem = document.getElementById('secretEggTrigger'); 
    if (!triggerElem) return;

    triggerElem.addEventListener('click', () => {
        clickCount++;
        
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1000); // Ventana de 1 segundo para hacer los toques

        if (clickCount === 3) { // 3 toques rápidos
            clickCount = 0;
            
            const currentSetting = localStorage.getItem('app_persistent_session') === 'true';
            const newSetting = !currentSetting;
            localStorage.setItem('app_persistent_session', newSetting);

            const newPersistence = newSetting 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;

            firebase.auth().setPersistence(newPersistence).then(() => {
                const message = newSetting 
                    ? "Tu sesión permanecerá abierta en este dispositivo."
                    : "La sesión se cerrará al salir.";
                
                if (typeof openCustomAlertModal === 'function') {
                    openCustomAlertModal("Persistencia", message);
                } else {
                    alert(message);
                }
            });
        }
    });
}

function init() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appLayout').classList.remove('hidden');

    if (!isPayrollVisible) {
        const payroll = document.getElementById('payrollPanel');
        const icon = document.getElementById('iconTogglePayroll');
        const icon2 = document.getElementById('iconTogglePayroll2');
        const btn = document.getElementById('btnTogglePayroll');

        if (payroll) payroll.classList.add('payroll-hidden');
        if (icon) icon.setAttribute('data-lucide', 'panel-right-open');
        if (icon2) icon2.setAttribute('data-lucide', 'panel-bottom-close');
        if (btn) btn.title = "Mostrar Nómina";
    }

    const yearElem = document.getElementById('copyrightYearText');
    if (yearElem) {
        yearElem.innerText = `© PayShift ${new Date().getFullYear()}`;
    }

	const isPersistent = localStorage.getItem('app_persistent_session') === 'true';
    const chosenPersistence = isPersistent 
        ? firebase.auth.Auth.Persistence.LOCAL 
        : firebase.auth.Auth.Persistence.SESSION;
	
    // Configurar persistencia SESSION para recordar la sesión
    firebase.auth().setPersistence(chosenPersistence)
        .then(() => {
            firebase.auth().onAuthStateChanged(async (authUser) => {
                if (isRegisteringProcess) return;

                if (authUser) {

                    // Si el usuario requiere verificación por correo y NO está verificado:
                    if (authUser.email && !authUser.emailVerified) {
                        document.getElementById('authScreen').classList.remove('hidden');
                        document.getElementById('appLayout').classList.add('hidden');
                        document.getElementById('setupPayrollModal')?.classList.add('hidden');

                        // Cerrar la sesión activa para evitar bucles
                        await firebase.auth().signOut();
                        hideLoading();
                        openCustomAlertModal("Correo no verificado", "Por favor, verifique su correo electrónico antes de continuar.");
                        return;
                    }

                    const uid = authUser.uid;
                    currentUserEmail = uid;

                    // 1. Cargar datos desde Firestore en segundo plano
                    const loadSuccess = await loadDataFromFirebase(false);

                    // 2. Si NO existen datos, los creamos un objeto base para no bloquear la UI
                    if (!appData[uid]) {
                        appData[uid] = createNewUserObj(
                            authUser.displayName || "Usuario",
                            authUser.email || ""
                        );
                    }

                    // 3. Mostrar la aplciación de fondo
                    showAppLayout();

                    // 4. Decidir qué vista mostrar una vez obtenidos los datos completos
                    if (!appData[uid]?.isPayrollConfigured) {
                        openSetupPayrollModal();
                    } else {
                        document.getElementById('setupPayrollModal')?.classList.add('hidden');
                    }

            calculatePayroll();
            renderCalendar();

                } else {
                    // Solo si Firebase confirma que NO hay sesión, mostramos el Login
                    document.getElementById('appLayout').classList.add('hidden');
                    document.getElementById('setupPayrollModal')?.classList.add('hidden');
                    document.getElementById('authScreen').classList.remove('hidden');
                }

                // Ocultar la pantalla de carga UNA VEZ completada la autenticación
                lucide.createIcons();
                hideLoading();
            });
        })
        .catch((error) => {
            console.error("Error al configurar persistencia:", error);
            document.getElementById('authScreen').classList.remove('hidden');
            hideLoading();
        });
	Secret();
    lucide.createIcons();
}

function toggleAuthMode() {
    isRegisteringMode = !isRegisteringMode;
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const primaryBtn = document.getElementById('authPrimaryBtn');
    const toggleBtn = document.getElementById('authToggleBtn');
    const passwordRequirementsPanel = document.getElementById('passwordRequirementsPanel');
    const passwordInput = document.getElementById('authPassword');
    const nameInput = document.getElementById('authEmail');

    if (passwordInput) {
        passwordInput.value = "";
        passwordInput.type = "password"; // Reestablece el input a modo oculto
    }

    // 1. PRIMERO limpiamos los valores de los inputs
    if (passwordInput) passwordInput.value = "";
    if (nameInput) nameInput.value = "";

    // 2. DESPUÉS reseteamos la UI de requisitos (ya con la contraseña vacía)
    resetPasswordRequirementsUI();

    if (isRegisteringMode) {
        title.innerText = "Registro de Usuario";
        subtitle.innerText = "Crea una nueva cuenta para comenzar";
        primaryBtn.innerText = "Registrar Cuenta";
        toggleBtn.innerText = "¿Ya tienes cuenta? Inicia sesión aquí";
        passwordRequirementsPanel.classList.remove('hidden');
    } else {
        title.innerText = "Control de Turnos";
        subtitle.innerText = "Introduce tus datos para acceder";
        primaryBtn.innerText = "Acceder a la Aplicación";
        toggleBtn.innerText = "¿Usuario nuevo? Regístrate aquí";
        passwordRequirementsPanel.classList.add('hidden');
    }
}

async function sendVerificationEmail(user) {
    try {
        await user.sendEmailVerification();
        openCustomAlertModal(
            "Verificación enviada",
            `Hemos enviado un enlace de confirmación a **${user.email}**. Por favor, revisa tu bandeja de entrada o spam.`
        );
    } catch (error) {
        console.error("Error al enviar el correo de verificación:", error);
        openCustomAlertModal("Error", "No se pudo enviar el correo de verificación. Inténtalo más tarde.");
    }
}

let isRegisteringProcess = false;

async function handleAuthAction(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault(); // Previene la recarga del navegador

    const emailField = document.getElementById('authEmail');
    const passwordField = document.getElementById('authPassword');

    const emailInput = emailField ? emailField.value.trim() : '';
    const passwordInput = passwordField ? passwordField.value : '';

    if (!emailInput || !passwordInput) {
        openLoginAlertModal("Por favor, introduce tu usuario y contraseña.");
        return;
    }

    // Validar formato de e-mail básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
        openCustomAlertModal("Correo no válido", "Por favor, introduce una dirección de correo electrónico válida.");
        return;
    }

    try {
        if (isRegisteringMode) {
            isRegisteringProcess = true;

            const email = emailInput.toLowerCase();

            // 1. Registrar en Firebase Auth
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, passwordInput);
            const authUser = userCredential.user;

            // 2. Enviar correo de verificación
            await authUser.sendEmailVerification();

            // 3. Crear documento en Firestore bajo la colección /user/{userId}
            const userRef = db.collection('user').doc(authUser.uid);
            await userRef.set({
                uid: authUser.uid,
                email: emailInput,
                createdAt: new Date().toISOString()
            });

            // 4. Cerrar sesión inmediatamente para obligar a verificar antes de ingresar
            await firebase.auth().signOut();

            // Resetear formulario e interfaz
            isRegisteringProcess = false;
            toggleAuthMode();
            resetPasswordRequirementsUI();

            openCustomAlertModal(
                "Registro completado",
                "Hemos enviado un correo de verificación a " + email + ". Por favor, confirme su cuenta antes de iniciar sesión."
            );

        } else {
            // Modo Login
            const loginEmail = emailInput.toLowerCase();

            // 1. Iniciar sesión en Firebase Auth
            const userCredential = await firebase.auth().signInWithEmailAndPassword(loginEmail, passwordInput);
            const authUser = userCredential.user;

            // 2. Validar si el correo está verificado
            if (!authUser.emailVerified) {
                await firebase.auth().signOut();
                openCustomAlertModal(
                    "Correo no verificado",
                    "Debes verificar tu correo electrónico antes de ingresar. Revisa tu bandeja de entrada o spam."
                );
                // reenviado
                await authUser.sendEmailVerification();
                return;
            }

            // 3. Establecer identificador de usuario activo
            currentUserEmail = authUser.uid;

            // 4. Cargar datos desde Firebase
            const loadSuccess = await loadDataFromFirebase();

            // 5. Inicializar el objeto si no existe (con datos válidos)
            if (!loadSuccess || !appData[currentUserEmail]) {
                const username = authUser.displayName || loginEmail.split('@')[0];
                appData[currentUserEmail] = createNewUserObj(username, authUser.email);
            }

            // 6. Guardar estado y continuar a la aplicación
            await saveDataToFirebase(false);
            createAutoBackup(`Inicio de sesión (${CURRENT_APP_VERSION})`);

            // 7. Mostrar Layout principal siempre
            document.getElementById('authScreen').classList.add('hidden');
            showAppLayout();

            // 8. Si la nómina no está configurada, abrir el modal por encima
            if (!appData[currentUserEmail].isPayrollConfigured) {
                openSetupPayrollModal();
            }
        }
    } catch (err) {
        isRegisteringProcess = false;
        console.error("Error capturado en autenticación:", err);

        const code = err?.code;
        const rawMessage = err?.message || err?.toString();

        let errorMsg = "Ocurrió un error al autenticar.";

        if (
            code === 'auth/wrong-password' ||
            code === 'auth/user-not-found' ||
            code === 'auth/invalid-credential' ||
            code === 'auth/invalid-login-credentials'
        ) {
            errorMsg = "Usuario/correo o contraseña incorrectos.";
        } else if (code === 'auth/email-already-in-use') {
            errorMsg = "Este correo ya se encuentra registrado.";
        } else if (code === 'auth/password-does-not-meet-requirements') {
            errorMsg = "La contraseña no cumple los requisitos de seguridad.";
        } else if (code === 'auth/invalid-email') {
            errorMsg = "El formato del correo electrónico no es válido.";
        } else if (!code && rawMessage) {
            errorMsg = `Error en la aplicación: ${rawMessage}`;
        }

        openCustomAlertModal("Error de Acceso", errorMsg);

        // Limpieza de campos al capturar error usando las variables existentes
        if (passwordInput) passwordInput.value = "";
        if (emailInput) emailInput.value = "";
    }
}


async function handleGoogleLogin() {
    const loader = document.getElementById('appLoadingOverlay');
    if (loader) {
        // Mostramos el loader inmediatamente al hacer clic
        loader.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    // Ocultar la pantalla de login de inmediato por seguridad visual
    const authScreen = document.getElementById('authScreen');
    if (authScreen) {
        authScreen.classList.add('hidden');
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const authUser = result.user;

        currentUserEmail = authUser.uid;

        // Cargar los datos existentes del usuario desde Firebase
        const loadSuccess = await loadDataFromFirebase();

        // Verificar si el usuario ya existe en Firestore
        const userRef = db.collection('user').doc(authUser.uid);
        const docSnap = await userRef.get();

        // Si no existe en la base de datos (primer inicio de sesión), crearlo
        if (!loadSuccess || !appData[currentUserEmail]) {
            appData[currentUserEmail] = createNewUserObj(
                authUser.displayName || "Usuario Google",
                authUser.email || ""
            );
            await saveDataToFirebase(false);
        }

        createAutoBackup(`Inicio con Google (${CURRENT_APP_VERSION})`);

        document.getElementById('authScreen')?.classList.add('hidden');
        showAppLayout();

        // Validar si ya configuró su nómina anteriormente
        if (!appData[currentUserEmail].isPayrollConfigured) {
            openSetupPayrollModal();
        } else {
            document.getElementById('setupPayrollModal')?.classList.add('hidden');
        }

        // Renderizado explícito de vistas
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof updateSidebar === 'function') updateSidebar();
        if (window.lucide) lucide.createIcons();
    }
    catch (err) {
        console.error("Error en Google Sign-In:", err);
        let errorMsg = "No se pudo completar el inicio de sesión con Google.";
        if (err.code === 'auth/popup-closed-by-user') {
            errorMsg = "Has cerrado la ventana de inicio de sesión.";
        }
        if (authScreen) authScreen.classList.remove('hidden');
        openCustomAlertModal("Error de Acceso", errorMsg);
    } finally {
        hideLoading();
    }
}

async function handlePasswordReset() {
    const emailInput = document.getElementById('authEmail');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        openCustomAlertModal(
            "Correo Requerido",
            "Por favor, introduce tu correo electrónico en el campo para enviarle el enlace de recuperación."
        );
        return;
    }

    try {
        // Método de Firebase para enviar el correo de restablecimiento
        await firebase.auth().sendPasswordResetEmail(email);

        openCustomAlertModal(
            "Correo Enviado",
            `Se ha enviado un enlace para restablecer tu contraseña a ${email}. Revisa tu bandeja de entrada o spam.`
        );
    } catch (error) {
        console.error("Error al solicitar restablecimiento de contraseña:", error);

        let errorMsg = "Ocurrió un error al intentar enviar el correo de recuperación.";
        if (error.code === 'auth/user-not-found') {
            errorMsg = "No existe ninguna cuenta registrada con este correo electrónico.";
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = "El formato del correo electrónico no es válido.";
        }

        openCustomAlertModal("Error", errorMsg);
    }
}

window.addEventListener('keydown', (event) => {
    // La alerta de confirmación se cierra tanto con Enter como con Escape.
    const customAlert = document.getElementById('customAlertModal');
    if (customAlert && !customAlert.classList.contains('hidden') &&
        (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Esc')) {
        event.preventDefault();
        closeCustomAlertModal();
        return;
    }

    const ayuda = document.getElementById('helpModal');
    if (ayuda && !ayuda.classList.contains('hidden') && event.key === 'Enter') {
        event.preventDefault();
        ayuda.classList.add('hidden');
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }

    if (event.key === 'Escape' || event.key === 'Esc') {
        // 1. Prioridad: Desmarcar selección múltiple del calendario
        if (typeof selectedKeys !== 'undefined' && selectedKeys && selectedKeys.length > 0) {
            clearRangeSelection();
            return;
        }

        // 2. Prioridad Máxima de Modales: Modal de Autenticación de Administrador
        const adminModal = document.getElementById('adminAuthModal');
        if (adminModal && !adminModal.classList.contains('hidden')) {
            event.preventDefault();
            if (typeof closeAdminAuthModal === 'function') {
                closeAdminAuthModal();
            } else {
                adminModal.classList.add('hidden');
            }
            return;
        }

        // 3. Modales Genéricos / Ajustes
        const visibleModals = Array.from(document.querySelectorAll('[id$="Modal"]'))
            .filter(modal => !modal.classList.contains('hidden'));

        if (visibleModals.length > 0) {
            // Se toma el último del array de modales visibles restantes
            const topModal = visibleModals[visibleModals.length - 1];
            topModal.classList.add('hidden');
        }

        // 4. Quitar foco menú hamburguesa
        const headerControls = document.getElementById('headerControls');
        const headerMenuToggle = document.getElementById('headerMenuToggle');

        // Si el menú móvil de la cabecera está abierto, lo cerramos y le quitamos el foco
        if (headerControls && headerControls.classList.contains('open')) {
            event.preventDefault();
            headerControls.classList.remove('open');
            if (headerMenuToggle) {
                headerMenuToggle.setAttribute('aria-expanded', 'false');
                headerMenuToggle.blur(); // <-- Esto quita la selección/foco visual del botón
            }
            return;
        }
    }
});

function openSetupPayrollModal() {
    document.getElementById('initBaseSalary').value = '';
    document.getElementById('initCarencia').value = '';
    document.getElementById('initFuncion').value = '';
    document.getElementById('initProrrataExtra').value = '';
    document.getElementById('initNightRate').value = '';
    document.getElementById('initIrpf').value = '';
    document.getElementById('setupPayrollWarning').classList.add('hidden');
    document.getElementById('setupPayrollModal').classList.remove('hidden');
    lucide.createIcons();
}

function parseSalaryValue(val, showWarningRef) {
    val = val.trim().replace(',', '.');
    if (val === '') return 0;
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
        showWarningRef.hasInvalid = true;
        return 0;
    }
    return parsed;
}

function confirmSetupPayroll() {
    const warningRef = { hasInvalid: false };

    const baseSalary = parseSalaryValue(document.getElementById('initBaseSalary').value, warningRef);
    const carencia = parseSalaryValue(document.getElementById('initCarencia').value, warningRef);
    const funcion = parseSalaryValue(document.getElementById('initFuncion').value, warningRef);
    const prorrataExtra = parseSalaryValue(document.getElementById('initProrrataExtra').value, warningRef);
    const nightRate = parseSalaryValue(document.getElementById('initNightRate').value, warningRef);
    const irpf = parseSalaryValue(document.getElementById('initIrpf').value, warningRef);

    if (warningRef.hasInvalid) {
        document.getElementById('setupPayrollWarning').classList.remove('hidden');
        lucide.createIcons();
        setTimeout(() => {
            completeSetupPayroll(baseSalary, carencia, funcion, prorrataExtra, nightRate, irpf);
        }, 2000);
    } else {
        completeSetupPayroll(baseSalary, carencia, funcion, prorrataExtra, nightRate, irpf);
    }
}

function closeSetupPayroll() {
    document.getElementById('setupPayrollModal').classList.add('hidden');
}

async function completeSetupPayroll(baseSalary, carencia, funcion, prorrataExtra, nightRate, irpf) {
    const u = getUser();
    u.config = {
        baseSalary: baseSalary,
        carencia: carencia,
        funcion: funcion,
        prorrataExtra: prorrataExtra,
        nightRate: nightRate,
        irpf: irpf
    };
    u.isPayrollConfigured = true;
    await saveDataToFirebase();
    document.getElementById('setupPayrollModal').classList.add('hidden');
    showAppLayout();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const LoginAlert = document.getElementById('loginAlertModal');
        // Comprobamos si la alerta está visible en pantalla para cerrarla
        if (LoginAlert && !LoginAlert.classList.contains('hidden')) {
            closeLoginAlertModal(); // Reemplaza con tu función real para ocultar la alerta
        }
    }
});

function openLoginAlertModal(msg) {
    if (msg) document.getElementById('loginAlertText').innerText = msg;
    document.getElementById('loginAlertModal').classList.remove('hidden');
    document.getElementById('loginAlertModal').focus();
}
function closeLoginAlertModal() { document.getElementById('loginAlertModal').classList.add('hidden'); }

function openCustomAlertModal(title, message) {
    document.getElementById('customAlertTitle').innerText = title || "Atención";
    document.getElementById('customAlertMessage').innerText = message || "";
    document.getElementById('customAlertModal').classList.remove('hidden');
    lucide.createIcons();
}
function closeCustomAlertModal() {
    document.getElementById('customAlertModal').classList.add('hidden');
}

function openConfirmDeleteShiftModal(code) {
    document.getElementById('confirmDeleteShiftMessage').innerText = `¿Estás seguro de que deseas eliminar el turno ${code}?`;
    const btn = document.getElementById('btnConfirmDeleteShift');
    btn.onclick = function () {
        executeDeleteShift(code);
        closeConfirmDeleteShiftModal();
        createAutoBackup(`Borrar turno ${code} (${CURRENT_APP_VERSION})`);
    };
    document.getElementById('confirmDeleteShiftModal').classList.remove('hidden');
    lucide.createIcons();

}
function closeConfirmDeleteShiftModal() {
    document.getElementById('confirmDeleteShiftModal').classList.add('hidden');
}

async function handleLogout() {
    clearTimeout(inactivityTimer); // Limpiar el timer
    try {
        if (!document.documentElement.classList.contains('dark')) toggleDarkMode();
        await firebase.auth().signOut();
        currentUserEmail = null;

        // 1. Limpiar los campos de texto en el DOM
        const PassInput = document.getElementById('authPassword');
        const EmailImput = document.getElementById('authEmail');

        if (PassInput) PassInput.value = '';
        if (EmailImput) EmailImput.value = '';

        // Ocultar layout principal y mostrar pantalla de acceso
        document.getElementById('appLayout').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        openCustomAlertModal("Error", "No se pudo cerrar la sesión correctamente.");
    }
}

function createNewUserObj(name, email) {
    return {
        name: name,
        email: email || '',
        avatar: null,
        shifts: {},
        notes: {},
        customImages: {},
        colors: JSON.parse(JSON.stringify(defaultColors)),
        config: { baseSalary: 0, carencia: 0, funcion: 0, prorrataExtra: 0, nightRate: 0, irpf: 0, marchBonus: 0, complements: [] },
        isPayrollConfigured: false,
        hasSeenHelp: false
    };
}

function getUser() {
    if (!appData[currentUserEmail]) {
        appData[currentUserEmail] = createNewUserObj('Usuario', currentUserEmail.includes('@') ? currentUserEmail : '');
    }
    
    const u = appData[currentUserEmail];

    if (!u.colors) {
        u.colors = JSON.parse(JSON.stringify(defaultColors));
    } else {
        if (!u.colors.F) u.colors.F = defaultColors.F;
        if (!u.colors.AC) u.colors.AC = defaultColors.AC;
        if (!u.colors.V) u.colors.V = defaultColors.V;
    }
    if (!u.customImages) {
        u.customImages = {};
    }
    
    // Configuración salarial
    if (!u.config) {
        u.config = { baseSalary: 0, carencia: 0, funcion: 0, prorrataExtra: 0, nightRate: 0, irpf: 0, marchBonus: 0, complements: [] };
    } else {
        if (u.config.marchBonus === undefined) {
            u.config.marchBonus = 0;
        }
        if (!u.config.complements) {
            u.config.complements = [];
        }
    }

    return u;
}

// Función para guardar los datos del usuario actual en Firebase Firestore
async function saveDataToFirebase(showAlert = true, updatedUser = null) {
    const authUser = firebase.auth().currentUser;
    const activeId = authUser ? authUser.uid : currentUserEmail;
    if (!activeId) return;

    try {
        const userRef = db.collection('user').doc(activeId);

        if (updatedUser) {
            appData[currentUserEmail] = updatedUser;
        }
        const userData = appData[activeId] || {};

        await userRef.update({
            appData: userData,
            backupsHistory: backupsHistory || [],
            shiftFullNames: shiftFullNames || {},
            shiftHours: typeof shiftHours !== 'undefined' ? shiftHours : {},
            shiftSplit: typeof shiftSplit !== 'undefined' ? shiftSplit : {},
            updatedAt: new Date().toISOString()
        });

        if (showAlert) {
            console.trace("¿Quién llamó a saveDataToFirebase con showAlert = true?");
            openCustomAlertModal("Datos guardados", "Los datos se han actualizado correctamente.");
        }
    } catch (error) {
        if (showAlert) {
            openCustomAlertModal("Error", "No se pudieron guardar los datos en la nube.");
        }
    }
}

// Función para cargar los datos del usuario desde Firebase Firestore
async function loadDataFromFirebase() {
    const authUser = firebase.auth().currentUser;
    const activeId = authUser ? authUser.uid : currentUserEmail;
    if (!activeId) return false;

    try {
        const userDocRef = db.collection('user').doc(activeId);
        const docSnap = await userDocRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            if (!data.appData) {
                return false;
            }

            appData[activeId] = data.appData;
	    currentUserEmail = activeId;

	    getUser();

            if (data.backupsHistory) {
                backupsHistory = data.backupsHistory;
            }
            if (data.shiftFullNames) {
                shiftFullNames = data.shiftFullNames;
            }
            if (data.shiftHours && typeof shiftHours !== 'undefined') {
                shiftHours = data.shiftHours;
            }
            if (data.shiftSplit && typeof shiftSplit !== 'undefined') {
                shiftSplit = data.shiftSplit;
            }

            return true;
        }

        return false;

    } catch (error) {
        console.error("Error al cargar desde Firebase:", error);
        return false;
    }
}

async function createAutoBackup(reason) {
    try {
        // Obtener el siguiente número de backup
        let nextVersion = 0;

        if (backupsHistory.length > 0) {
            const versions = backupsHistory
                .map(b => parseInt(String(b.version).replace('v', ''), 10))
                .filter(v => !isNaN(v));

            if (versions.length > 0) {
                nextVersion = Math.max(...versions) + 1;
            }
        }

        const backup = {
            version: `v${nextVersion}`,
            timestamp: new Date().toLocaleString(),
            reason: reason,
            data: JSON.stringify(appData)
        };

        backupsHistory.unshift(backup);

        // Mantener solamente los últimos 5
        if (backupsHistory.length > 5) {
            backupsHistory = backupsHistory.slice(0, 5);
        }

        await saveDataToFirebase(false);

    } catch (e) {
        console.warn("No se pudo crear backup secundario por espacio.", e);
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);

    const base = document.getElementById('themeIconBase');
    const hover = document.getElementById('themeIconHover');

    if (isDarkMode) {
        base.setAttribute('data-lucide', 'moon');
        base.setAttribute('class', 'w-4 h-4 2xl:w-5 2xl:h-5 text-slate-300 absolute transition-all duration-300 transform scale-100 rotate-0 opacity-100 group-hover:scale-0 group-hover:rotate-90 group-hover:opacity-0');

        hover.setAttribute('data-lucide', 'sun');
        hover.setAttribute('class', 'w-4 h-4 2xl:w-5 2xl:h-5 text-amber-400 absolute transition-all duration-300 transform scale-0 -rotate-90 opacity-0 group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-100');
    } else {
        base.setAttribute('data-lucide', 'sun');
        base.setAttribute('class', 'w-4 h-4 2xl:w-5 2xl:h-5 text-amber-400 absolute transition-all duration-300 transform scale-100 rotate-0 opacity-100 group-hover:scale-0 group-hover:rotate-90 group-hover:opacity-0');

        hover.setAttribute('data-lucide', 'moon');
        hover.setAttribute('class', 'w-4 h-4 2xl:w-5 2xl:h-5 text-slate-300 absolute transition-all duration-300 transform scale-0 -rotate-90 opacity-0 group-hover:scale-100 group-hover:rotate-0 group-hover:opacity-100');
    }

    if (window.lucide) lucide.createIcons();

    switchView(currentView);
    if (currentView === 'year') renderYearlyView();
}

function togglePayrollPanel() {
    isPayrollVisible = !isPayrollVisible;
    const payroll = document.getElementById('payrollPanel');
    const icon = document.getElementById('iconTogglePayroll');
    const icon2 = document.getElementById('iconTogglePayroll2');
    const btn = document.getElementById('btnTogglePayroll');

    if (isPayrollVisible) {
        payroll.classList.remove('payroll-hidden');
        payroll.classList.remove('hidden');
        icon.setAttribute('data-lucide', 'panel-right-close');
        icon2.setAttribute('data-lucide', 'panel-bottom-open');
        btn.title = "Ocultar Nómina";
    } else {
        payroll.classList.add('payroll-hidden');
        payroll.classList.add('hidden');
        icon.setAttribute('data-lucide', 'panel-right-open');
        icon2.setAttribute('data-lucide', 'panel-bottom-close');
        btn.title = "Mostrar Nómina";
    }
    lucide.createIcons();
}

function openHelpModal() {
    document.getElementById('helpModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeHelpModal() {
    document.getElementById('helpModal').classList.add('hidden');
}

async function showAppLayout() {
    // 1. Alternar visibilidad de pantallas
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appLayout').classList.remove('hidden');

    // 2. Cargar y mostrar datos del usuario
    const u = getUser();
    document.getElementById('sideUserMail').innerText = u.email || '';

    updateAvatarUI();
    renderCalendar();
    updateSidebar();
    switchView(currentView);

    if (!u.hasSeenHelp) {
        u.hasSeenHelp = true;
        await saveDataToFirebase(false);
        openHelpModal();
    }
    setupInactivityListener();
}

function updateAvatarUI() {
    const u = getUser();
    const container = document.getElementById('userAvatarContainer');
    if (container) {
        if (u.avatar) {
            container.innerHTML = `<img src="${u.avatar}" class="w-full h-full object-cover rounded-full">`;
        } else {
            const letter = (u.name && u.name.length > 0) ? u.name.charAt(0).toUpperCase() : 'U';
            container.innerHTML = `<span id="userAvatar">${letter}</span>`;
        }
    }
    const settingsPreview = document.getElementById('avatarPreview');
    if (settingsPreview) {
        if (u.avatar) {
            settingsPreview.innerHTML = `<img src="${u.avatar}" class="w-full h-full object-cover rounded-full">`;
        } else {
            const letter = (u.email && u.email.length > 0) ? u.email.charAt(0).toUpperCase() : 'U';
            settingsPreview.innerHTML = `<span>${letter}</span>`;
        }
    }
}

function switchView(view) {
    currentView = view;
    const btnMonth = document.getElementById('btnViewMonth');
    const btnYear = document.getElementById('btnViewYear');
    const monthLabel = document.getElementById('currentMonthLabel');

    // Boton activo
    const activeClasses = isDarkMode
        ? "bg-blue-600 text-white border-blue-500 shadow-sm font-bold" // Modo OSCURO
        : "bg-[#6293ff] text-white border-[#679df5] shadow-sm font-bold"; // Modo CLARO

    // Boton no activo
    const inactiveClasses = isDarkMode
        ? "text-slate-400 hover:text-white border-transparent bg-transparent" // Modo OSCURO
        : "text-slate-600 hover:text-slate-900 border-transparent bg-transparent"; // Modo CLARO 

    if (view === 'month') {
        document.getElementById('monthlyView').classList.remove('hidden');
        document.getElementById('yearlyView').classList.add('hidden');
        btnMonth.className = `btn-view-toggle px-3 py-1 text-[clamp(0.7rem,0.8vw,0.95rem)] rounded-lg transition-all ${activeClasses}`;
        btnYear.className = `btn-view-toggle px-3 py-1 text-[clamp(0.7rem,0.8vw,0.95rem)] rounded-lg transition-all ${inactiveClasses}`;
        if (monthLabel) monthLabel.style.display = 'inline-block';
        document.getElementById('currentYearLabel').classList.add('hidden');
    } else {
        document.getElementById('monthlyView').classList.add('hidden');
        document.getElementById('yearlyView').classList.remove('hidden');
        btnMonth.className = `btn-view-toggle px-3 py-1 text-[clamp(0.7rem,0.8vw,0.95rem)] rounded-lg transition-all ${inactiveClasses}`;
        btnYear.className = `btn-view-toggle px-3 py-1 text-[clamp(0.7rem,0.8vw,0.95rem)] rounded-lg transition-all ${activeClasses}`;
        if (monthLabel) monthLabel.style.display = 'none';
        document.getElementById('currentYearLabel').classList.remove('hidden');
        renderYearlyView();
    }
}

function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    clearRangeSelection();
    renderCalendar();
    if (currentView === 'year') {
        renderYearlyView();
    }
}

function changeCurrentNavigation(direction) {
    if (currentView === 'year') {
        // Si estamos en la vista anual, cambiamos de AÑO
        currentDate.setFullYear(currentDate.getFullYear() + direction);
        renderYearlyView();
    } else {
        // Si estamos en la vista mensual, cambiamos de MES (tu función actual)
        changeMonthAnimated(direction); 
    }
}

function renderCalendar() {
    const u = getUser();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById('currentMonthLabel').innerText = monthNames[month];
    document.getElementById('currentYearLabel').innerText = year;

    document.getElementById('currentMonthLabel').innerText = `${monthNames[month]} ${year}`;
    document.getElementById('payrollMonthLabel').innerText = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    let startingDay = firstDay.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startingDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    const now = new Date();
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(year, month, day);
        const dayOfWeek = dayDate.getDay();
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayInfo = u.shifts[dateKey] || {};
        const shift = dayInfo.shift || '';

        const calculatedType = getDayType(dayDate);
        let dayType = (dayInfo.dayType && dayInfo.dayType !== 'auto') ? dayInfo.dayType : calculatedType;
        const hasNotes = u.notes && u.notes[dateKey] && u.notes[dateKey].trim().length > 0;

        // Clases por defecto para días laborables normales
        let bgClass = 'bg-slate-950/10';
        let textClass = 'text-slate-300 font-bold';
        const isGuardDay = ['G', 'MG', 'NG'].includes(shift);

        /// *** COLORES FESTIVOS
        // Asignación de clases de Tailwind según el tipo de día
        if (dayType === 'fin-semana') {
            bgClass = 'festive-cell';
            textClass = 'text-rose-400 font-bold';
        } else if (dayType === 'festivo') {
            bgClass = 'festivo-oficial';
            textClass = 'text-purple-400 font-bold';
        } else if (dayType === 'festivo-especial') {
            bgClass = 'festivo-especial';
            textClass = 'text-amber-400 font-bold';
        }

        let borderClass = 'border-slate-800';
        if (isGuardDay) {
            borderClass = 'guard-border-subtle';
        }

        const isToday = (dateKey === todayStr);
        const isSelectedDay = (dateKey === selectedDayKey);
        const isSelectedRange = selectedKeys.includes(dateKey);

        const dayCell = document.createElement('div');
        let cellClasses = `calendar-day-cell aspect-square border ${borderClass} rounded-2xl p-1.5 flex flex-col justify-between cursor-pointer transition-all ${bgClass}`;
        if (isSelectedRange) cellClasses += ' day-selected-range';
        if (isSelectedDay && !isSelectedRange) cellClasses += ' day-selected-single';
        
        dayCell.className = cellClasses;

        dayCell.onmousedown = (e) => { if (e.shiftKey) e.preventDefault(); };

        dayCell.onclick = (e) => handleDayClick(dateKey, dayDate, e);

        dayCell.oncontextmenu = (e) => {
            e.preventDefault();
            selectedDayKey = dateKey;
            updateSidebar();
            renderCalendar();
            openModal(dateKey, day);
        };

        let shiftBadgeHtml = '';
        if (shift) {
            const baseConfig = defaultColors[shift] || { bg: '#475569', text: '#ffffff', border: '#64748b' };
            const userConfig = (u.colors && u.colors[shift]) ? u.colors[shift] : {};

            const c = { ...baseConfig, ...userConfig };

            // 1ª Franja Horaria
            let timeText1 = "";
            if (c.startTime && c.endTime) {
                timeText1 = ` (${c.startTime}-${c.endTime})`;
            } else if (c.startTime) {
                timeText1 = ` (${c.startTime})`;
            }

            const badge1 = `<span class="py-0.5 text-[clamp(0.6rem,0.7vw,0.85rem)] font-extrabold px-1 rounded text-center block shadow-sm leading-none" style="background-color:${c.bg}; color:${c.text}; border:1px solid ${c.border}">${shift}<span class="hidden sm:inline">${timeText1}</span></span>`;

            // Si el usuario marcó este turno como partido (2 franjas)
            if (c.isSplit) {
                let timeText2 = "";
                if (c.startTime2 && c.endTime2) {
                    timeText2 = ` (${c.startTime2}-${c.endTime2})`;
                } else if (c.startTime2) {
                    timeText2 = ` (${c.startTime2})`;
                }

                const badge2 = `<span class="py-0.5 text-[clamp(0.6rem,0.7vw,0.85rem)] font-extrabold px-1 rounded text-center block shadow-sm leading-none" style="background-color:${c.bg}; color:${c.text}; border:1px solid ${c.border}">${shift}<span class="hidden sm:inline">${timeText2}</span></span>`;

                shiftBadgeHtml = `<div class="my-auto py-0.5 space-y-1">${badge1}${badge2}</div>`;
            } else {
                shiftBadgeHtml = `<div class="my-auto py-1">${badge1}</div>`;
            }
        }

        dayCell.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1">
                            <span class="${isToday ? 'day-today-subtle' : textClass}">${day}</span>
                            ${hasNotes ? '<span class="w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full bg-amber-400 inline-block" title="Tiene nota"></span>' : ''}
                        </div>
                        ${dayType === 'festivo' ? `<span class="text-[clamp(0.5rem,0.6vw,0.75rem)] text-purple-400 font-semibold"><span class="inline sm:hidden">FES</span><span class="hidden sm:inline">FESTIVO</span></span>` : ''}
                        ${dayType === 'festivo-especial' ? `<span class="text-[clamp(0.5rem,0.6vw,0.75rem)] text-orange-400 font-semibold"><span class="inline sm:hidden">ESP</span><span class="hidden sm:inline">ESPECIAL</span></span>` : ''}
                    </div>
                    ${shiftBadgeHtml}
                `;
        grid.appendChild(dayCell);
    }

    calculatePayroll();
}

function handleDayClick(dateKey, dateObj, event) {
    if (isGuardPlacementMode) {
        applyGuardPackFromDay(dateKey);
        toggleGuardPlacementMode();
        return;
    }

    const clickDate = new Date(dateKey);
    const isOtherMonth = clickDate.getMonth() !== currentDate.getMonth() || clickDate.getFullYear() !== currentDate.getFullYear();

    if (event.shiftKey && selectionAnchor) {
        selectedKeys = getDatesInRange(selectionAnchor, dateKey);
        updateRangeBar();
        renderCalendar();
    } else if (event.ctrlKey || event.metaKey) {
        if (selectedKeys.includes(dateKey)) {
            selectedKeys = selectedKeys.filter(k => k !== dateKey);
        } else {
            selectedKeys.push(dateKey);
        }
        selectionAnchor = dateKey;
        updateRangeBar();
        renderCalendar();
    } else {
        selectionAnchor = dateKey;
        selectedDayKey = dateKey;
        selectedKeys = [];
        updateRangeBar();
        updateSidebar();

        if (isOtherMonth) {
            currentDate = new Date(clickDate.getFullYear(), clickDate.getMonth(), 1);
        }
        renderCalendar();
    }
}

function getDatesInRange(startKey, endKey) {
    const start = new Date(startKey < endKey ? startKey : endKey);
    const end = new Date(startKey < endKey ? endKey : startKey);
    const range = [];
    let curr = new Date(start);
    while (curr <= end) {
        range.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
    }
    return range;
}

function updateRangeBar() {
    const bar = document.getElementById('rangeActionBar');
    if (selectedKeys.length > 0) {
        bar.classList.remove('hidden');
        document.getElementById('rangeCount').innerText = selectedKeys.length;

        // --- NUEVO: Rellenar dinámicamente el select de turnos ---
        const u = getUser();
        const selectElem = document.getElementById('rangeShiftSelect');
        if (selectElem) {
            selectElem.innerHTML = '<option value="">Borrar</option>'; // Opción predeterminada para limpiar

            const availableColors = u.colors ? { ...u.colors } : { ...defaultColors };
            delete availableColors._isCustom; // Limpiar flag temporal si existe

            // Obtener los códigos ordenados según la preferencia del usuario
            const orderedCodes = getOrderedShiftCodes(availableColors);

            orderedCodes.forEach(sCode => {
                const fullName = shiftFullNames[sCode] || `${sCode} - Turno ${sCode}`;
                const opt = document.createElement('option');
                opt.value = sCode;
                opt.innerText = fullName;
                selectElem.appendChild(opt);
            });
        }
        // --------------------------------------------------------

    } else {
        bar.classList.add('hidden');
    }
}

function clearRangeSelection() {
    selectedKeys = [];
    selectionAnchor = null;
    updateRangeBar();
    renderCalendar();
}

async function applyRangeShift() {
    const shift = document.getElementById('rangeShiftSelect').value;
    const u = getUser();
    selectedKeys.forEach(k => {
        if (shift) {
            u.shifts[k] = { ...u.shifts[k], shift };
        } else {
            delete u.shifts[k];
        }
    });
    createAutoBackup(`Asignación múltiple (${selectedKeys.length} días)`);
    await saveDataToFirebase(false);
    clearRangeSelection();
}

function toggleGuardPlacementMode() {
    isGuardPlacementMode = !isGuardPlacementMode;
    const alertBox = document.getElementById('guardModeAlert');
    const btn = document.getElementById('btnGuardPack');
    if (isGuardPlacementMode) {
        alertBox.classList.remove('hidden');
        btn.classList.add('ring-2', 'ring-indigo-400');
    } else {
        alertBox.classList.add('hidden');
        btn.classList.remove('ring-2', 'ring-indigo-400');
    }
}

async function applyGuardPackFromDay(startKey) {
    const u = getUser();
    const pattern = ['M', 'M', 'M', 'M', 'M', 'MG', 'NG', 'N', 'N', 'N', 'N', 'N'];
    const parts = startKey.split('-');
    let curr = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    for (let i = 0; i < pattern.length; i++) {
        const year = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, '0');
        const day = String(curr.getDate()).padStart(2, '0');
        const k = `${year}-${month}-${day}`;

        u.shifts[k] = { ...u.shifts[k], shift: pattern[i] };
        curr.setDate(curr.getDate() + 1);
    }
    createAutoBackup('Aplicado Pack Guardia (12 Días)');
    await saveDataToFirebase(false);
    renderCalendar();
    if (currentView === 'year') {
        renderYearlyView();
    }
}

function updateSidebar() {
    const u = getUser();
    document.getElementById('sideUserMail').title = `${u.email}`;
    const parts = selectedDayKey.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    document.getElementById('sideDayNum').innerText = String(d.getDate()).padStart(2, '0');
    document.getElementById('sideDayOfWeek').innerText = dayNames[d.getDay()];
    document.getElementById('sideMonthName').innerText = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    const shiftInfo = u.shifts[selectedDayKey] || {};
    const shift = shiftInfo.shift || '';

    const badge = document.getElementById('sideShiftBadge');
    const fullName = shiftFullNames[shift] || shift;
    badge.innerText = shift ? `${fullName}` : 'Sin Turno';

    document.getElementById('dayNotesText').value = (u.notes && u.notes[selectedDayKey]) || '';

    const bgBox = document.getElementById('shiftBgBox');
    const overlay = document.getElementById('guardOverlay');

    bgBox.className = "flex-1 my-2 rounded-2xl border border-slate-700/60 p-3.5 relative overflow-hidden flex flex-col justify-between gap-3 shift-bg-container ";

    if (['G', 'MG', 'NG'].includes(shift)) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }

    if (u.customImages && u.customImages[shift]) {
        bgBox.style.backgroundImage = `url('${u.customImages[shift]}')`;
    } else {
        let baseShift = shift.replace('G', '');
        if (u.customImages && u.customImages[baseShift]) {
            bgBox.style.backgroundImage = `url('${u.customImages[baseShift]}')`;
        } else {
            bgBox.style.backgroundImage = 'none';
            if (baseShift === 'M') bgBox.classList.add('sidebar-bg-M');
            else if (baseShift === 'T') bgBox.classList.add('sidebar-bg-T');
            else if (baseShift === 'N') bgBox.classList.add('sidebar-bg-N');
            else bgBox.classList.add('sidebar-bg-default');
        }
    }
}

async function saveDayNotes() {
    const u = getUser();
    if (!u.notes) u.notes = {};
    const text = document.getElementById('dayNotesText').value;
    if (text) {
        u.notes[selectedDayKey] = text;
    } else {
        delete u.notes[selectedDayKey];
    }
    await saveDataToFirebase(false);
    const ind = document.getElementById('notesSavedIndicator');
    ind.classList.remove('hidden');
    setTimeout(() => ind.classList.add('hidden'), 1200);
    renderCalendar();
}

function renderYearlyView() {
    const year = currentDate.getFullYear(); // Año actual
    const selectorYear = document.getElementById('statsYearLabel'); // Etiqueta en selector
    const globalYear = document.getElementById('yearlyYearLabel'); // En calendario global
    const statsYear = document.getElementById('currentYearLabel'); // En estadísticas

    selectorYear.innerText = year;
    globalYear.innerText = year;
    statsYear.innerText = year;

    const grid = document.getElementById('yearlyGrid');
    grid.innerHTML = '';

    const u = getUser();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let m = 0; m < 12; m++) {
        const monthCard = document.createElement('div');
        monthCard.className = "yearly-month-card space-y-2 shadow-sm transition-all";

        const totalDays = new Date(year, m + 1, 0).getDate();
        let startingDay = new Date(year, m, 1).getDay() - 1;
        if (startingDay === -1) startingDay = 6;

        let miniDaysHtml = '';
        for (let i = 0; i < startingDay; i++) {
            miniDaysHtml += `<div></div>`;
        }

        for (let d = 1; d <= totalDays; d++) {
            const k = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const shift = (u.shifts[k] || {}).shift;
            const hasNotes = u.notes && u.notes[k] && u.notes[k].trim().length > 0;

            const isToday = (k === todayStr);
            const isSelectedDay = (k === selectedDayKey);
            const isGuardDay = ['G', 'MG', 'NG'].includes(shift);

            const dateKey = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayInfo = u.shifts[dateKey] || {};
            const dayDate = new Date(year, m, d);
            const calculatedType = getDayType(dayDate);
            let dayType = dayInfo.dayType || calculatedType;

            let dayStyle = isDarkMode
                ? "background-color: rgba(51, 65, 85, 0.4); color: #cbd5e1;"
                : "background-color: #ffffff; color: #0f172a; border: 1px solid #e2e8f0;";

            let dayExtraClass = ''; // Acumular clases CSS

            if (shift) {
                const c = (u.colors && u.colors[shift]) ? u.colors[shift] : defaultColors[shift] || { bg: '#3b82f6', text: '#ffffff' };
                dayStyle = `background-color: ${c.bg}; color: ${c.text}; font-weight: bold;`;
            } else {
                // Si NO hay turno, evaluamos el tipo de día de forma independiente
                if (dayType === 'fin-semana') {
                    dayExtraClass += ' festive-cell';
                } else if (dayType === 'festivo') {
                    dayExtraClass += ' festivo-oficial';
                } else if (dayType === 'festivo-especial') {
                    dayExtraClass += ' festivo-especial';
                } 
            }

            if (isGuardDay) dayExtraClass += ' border border-amber-500/80';
            
            // Clases de hoy y seleccionado (con z-20 para que el anillo sobresalga)
            if (isToday) {
                dayExtraClass += ' ring-2 ring-blue-500 font-extrabold text-blue-400 z-20';
            } else if (isSelectedDay) {
                dayExtraClass += ' ring-2 ring-amber-400 font-extrabold text-amber-400 z-20';
            }

            const isFestiveOrWeekend = (dayType === 'fin-semana' || dayType === 'festivo' || dayType === 'festivo-especial');
            const hasCustomClass = (isFestiveOrWeekend && !shift);
            const appliedStyle = hasCustomClass ? '' : dayStyle;

            miniDaysHtml += `
                        <div class="text-[clamp(0.6rem,0.7vw,0.85rem)] rounded-sm text-center py-0.5 relative cursor-pointer ${dayExtraClass}" 
                             style="${appliedStyle}"
                             onclick="handleYearlyDayClick('${k}', event)"
			     ondblclick="handleYearlyDayDoubleClick('${k}')"
                             oncontextmenu="handleYearlyDayContextMenu('${k}', ${d}, event)">
                            ${d}
                            ${hasNotes ? '<span class="absolute top-0 right-0.5 w-1 h-1 rounded-full bg-amber-400"></span>' : ''}
                        </div>`;
        }

        monthCard.innerHTML = `
                    <div class="text-[clamp(0.75rem,0.85vw,1rem)] font-bold text-slate-300 border-b border-slate-800/80 pb-1">${monthNames[m]}</div>
                    <div class="grid grid-cols-7 gap-1 text-[clamp(0.55rem,0.65vw,0.8rem)] font-bold text-slate-500 text-center">
                        <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span class="text-rose-400">S</span><span class="text-rose-400">D</span>
                    </div>
                    <div class="grid grid-cols-7 gap-1">
                        ${miniDaysHtml}
                    </div>
                `;
        grid.appendChild(monthCard);
    }

    renderYearlyStats();
}

function renderYearlyStats() {
    const u = getUser();
    const year = currentDate.getFullYear();
    const todayStr = new Date().toISOString().split('T')[0];

    let countsSoFar = {};
    let countsProjected = {};
    let totalWorkedSoFar = 0;
    let totalProjected = 0;

    let totalHoursSoFar = 0;
    let totalHoursProjected = 0;

    // Función auxiliar para calcular horas de un turno
    function getShiftHours(shiftCode) {
        const c = (u.colors && u.colors[shiftCode]) ? u.colors[shiftCode] : defaultColors[shiftCode];
        if (!c) return 0;

        let hours = 0;
        // 1ª franja
        if (c.startTime && c.endTime) {
            const [h1, m1] = c.startTime.split(':').map(Number);
            const [h2, m2] = c.endTime.split(':').map(Number);
            let diff = (h2 + m2 / 60) - (h1 + m1 / 60);
            if (diff < 0) diff += 24;
            hours += diff;
        } else {
            hours += 8;
        }

        // 2ª franja si es turno partido
        if (c.isSplit && c.startTime2 && c.endTime2) {
            const [h1, m1] = c.startTime2.split(':').map(Number);
            const [h2, m2] = c.endTime2.split(':').map(Number);
            let diff = (h2 + m2 / 60) - (h1 + m1 / 60);
            if (diff < 0) diff += 24;
            hours += diff;
        }

        return hours;
    }

    // 1. Recopilar turnos y horas
    const guardDatesSoFar = [];
    const guardDatesProjected = [];

    Object.keys(u.shifts || {}).sort().forEach(k => {
        if (k.startsWith(`${year}-`)) {
            const shift = u.shifts[k].shift;
            if (shift) {
                const shiftHours = getShiftHours(shift);

                // Proyección Anual
                countsProjected[shift] = (countsProjected[shift] || 0) + 1;
                totalProjected++;
                totalHoursProjected += shiftHours;
                if (['G', 'MG', 'NG'].includes(shift)) {
                    guardDatesProjected.push(k);
                }

                // Trabajados hasta hoy
                if (k <= todayStr) {
                    countsSoFar[shift] = (countsSoFar[shift] || 0) + 1;
                    totalWorkedSoFar++;
                    totalHoursSoFar += shiftHours;
                    if (['G', 'MG', 'NG'].includes(shift)) {
                        guardDatesSoFar.push(k);
                    }
                }
            }
        }
    });

    // 2. Contar Packs de Guardias (días consecutivos)
    function countGuardPacks(dateList) {
        if (dateList.length === 0) return 0;
        let packs = 1;
        for (let i = 1; i < dateList.length; i++) {
            const prev = new Date(dateList[i - 1]);
            const curr = new Date(dateList[i]);
            const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
                packs++;
            }
        }
        return packs;
    }

    const guardPacksSoFar = countGuardPacks(guardDatesSoFar);
    const guardPacksProjected = countGuardPacks(guardDatesProjected);

    // 3. Generar HTML
    function buildBadges(countsObj, totalCount, totalHours, guardPacks) {
        if (totalCount === 0) {
            return `<span class="text-[clamp(0.65rem,0.75vw,0.85rem)] text-slate-500 italic">Sin turnos asignados</span>`;
        }

        const isDark = document.documentElement.classList.contains('dark');
        const badgeBgBlue = isDark ? 'bg-blue-600/30 border-blue-500/40 text-blue-200' : 'bg-blue-100 border-blue-600 text-blue-800';
        const badgeBgEmerald = isDark ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-100 border-emerald-600 text-emerald-800';
        const badgeBgAmber = isDark ? 'bg-amber-600/30 border-amber-500/40 text-amber-200' : 'bg-amber-100 border-amber-500 text-amber-800';
        const borderColor = isDark ? 'border-slate-800/60' : 'border-slate-300';

        let html = `
            <div class="flex flex-wrap gap-1.5 mb-1.5 w-full">
                <span class="${badgeBgBlue} border text-[clamp(0.65rem,0.75vw,0.85rem)] font-black px-2 py-0.5 rounded-lg">
                    TOTAL: ${totalCount} turnos
                </span>
                <span class="${badgeBgEmerald} border text-[clamp(0.65rem,0.75vw,0.85rem)] font-black px-2 py-0.5 rounded-lg">
                    ${totalHours.toFixed(1)} Horas
                </span>
                <span class="${badgeBgAmber} border text-[clamp(0.65rem,0.75vw,0.85rem)] font-black px-2 py-0.5 rounded-lg">
                    🛡️ ${guardPacks} Pack${guardPacks !== 1 ? 's' : ''} Guardia
                </span>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-2 border-t ${borderColor} w-full">
        `;

        Object.keys(countsObj).sort().forEach(code => {
            const c = (u.colors && u.colors[code]) ? u.colors[code] : defaultColors[code] || { bg: '#475569', text: '#ffffff', border: '#64748b' };
            html += `
                <span class="inline-flex items-center gap-1 text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold px-1.5 py-0.5 rounded shadow-sm" style="background-color:${c.bg}; color:${c.text}; border:1px solid ${c.border}">
                    <span>${code}:</span>
                    <span class="font-extrabold">${countsObj[code]}</span>
                </span>
            `;
        });

        html += `</div>`;
        return html; // <-- Cierre de la función auxiliar buildBadges
    }

    document.getElementById('statsWorkedSoFar').innerHTML = buildBadges(countsSoFar, totalWorkedSoFar, totalHoursSoFar, guardPacksSoFar);
    document.getElementById('statsProjectedYear').innerHTML = buildBadges(countsProjected, totalProjected, totalHoursProjected, guardPacksProjected);
}

function handleYearlyDayClick(dateKey, event) {
    selectedDayKey = dateKey;
    const clickDate = new Date(dateKey);
    currentDate = new Date(clickDate.getFullYear(), clickDate.getMonth(), 1);

    if (isGuardPlacementMode) {
        applyGuardPackFromDay(dateKey);
        toggleGuardPlacementMode();
        return;
    }

    updateSidebar();
    renderCalendar();
    renderYearlyView();
}

function handleYearlyDayDoubleClick(dateKey) {
    // 1. Establecer la fecha seleccionada y actualizar el año/mes base del calendario
    selectedDayKey = dateKey;
    const parts = dateKey.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    currentDate = new Date(year, month, day);

    // 2. Cambiar a la vista mensual utilizando tu función existente
    switchView('month');

    // 3. Actualizar la interfaz del calendario, la barra lateral y limpiar selecciones múltiples si las hubiera
    clearRangeSelection();
    renderCalendar();
    updateSidebar();
}

function handleYearlyDayContextMenu(dateKey, day, event) {
    event.preventDefault();
    selectedDayKey = dateKey;
    const clickDate = new Date(dateKey);
    currentDate = new Date(clickDate.getFullYear(), clickDate.getMonth(), 1);
    updateSidebar();
    renderCalendar();
    renderYearlyView();
    openModal(dateKey, day);
}

function calculatePayroll() {
    const u = getUser();
    const cfg = u.config || { baseSalary: 0, carencia: 0, funcion: 0, prorrataExtra: 0, nightRate: 0, irpf: 0, complements: [] };
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // Mes actual que se muestra en la nómina (0 a 11)
    
    // --- NUEVO: Calcular el año y mes anterior para las variables a mes vencido (Guardias y Nocturnidad) ---
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
        prevMonth = 11; // Diciembre
        prevYear = year - 1; // Año anterior
    }
    const prevMonthTotalDays = new Date(prevYear, prevMonth + 1, 0).getDate();
    // --------------------------------------------------------------------------------------------------

    const totalDays = new Date(year, month + 1, 0).getDate();

    let nightHours = 0, mgHours = 0, ngHours = 0;
    let guardDispoPay = 0, guardInterventionDays = 0;

    // 1. Recorrer el MES ANTERIOR exclusivamente para Guardias y Nocturnidad (A mes vencido)
    for (let day = 1; day <= prevMonthTotalDays; day++) {
        const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const info = u.shifts[dateKey] || {};
        const shift = info.shift;
        const d = new Date(prevYear, prevMonth, day);
	const calculatedType = getDayType(d); 

        // 2. Determinamos el tipo final: si el usuario lo especificó manualmente (y no es 'auto'), usamos ese; 
        // si no, usamos el calculado automáticamente.
        let finalDayType = (info.dayType && info.dayType !== 'auto') ? info.dayType : calculatedType;

        let dispoType = 'laborable';
	let isFestiveOrWeekend = false;

        if (finalDayType === 'festivo') {
            dispoType = 'festivo';
	    isFestiveOrWeekend = true;
        } else if (finalDayType === 'festivo-especial') {
            dispoType = 'especial';
	    isFestiveOrWeekend = true;
        } else if (finalDayType === 'fin-semana') {
            dispoType = 'finde';
	    isFestiveOrWeekend = true;
        } else {
            // Si es null (día laborable normal sin festivo)
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dispoType = 'finde';
                isFestiveOrWeekend = true;
            } else {
                dispoType = 'laborable';
		isFestiveOrWeekend = false;
            }
        }

        if (shift === 'N') if (isFestiveOrWeekend) {ngHours += 8;} else {nightHours += 8;}
        else if (shift === 'NG') { ngHours += 8; guardDispoPay += GUARDIA_DISPO[dispoType]; guardInterventionDays++; }
        else if (shift === 'MG') { mgHours += 8; guardDispoPay += GUARDIA_DISPO[dispoType]; guardInterventionDays++; }
        else if (shift === 'G') { guardDispoPay += GUARDIA_DISPO[dispoType]; guardInterventionDays++; }
    }

    // 2. Recorrer el MES ACTUAL para el resto de conceptos si fuera necesario (aunque en tu lógica actual el bucle principal calculaba todo, 
    // ahora separamos las guardias/noches al mes anterior y el resto sigue en el mes en curso o base fija).
    // Nota: Como las horas extra de MG/NG van ligadas a las guardias de los turnos de guardia, también se benefician del mes vencido al venir de los turnos NG y MG.

    let guardInterventionPay = GUARDIA_INTERVENCION[guardInterventionDays] || (guardInterventionDays * 52.35);
    let totalGuardPay = guardDispoPay + guardInterventionPay;
    let nightPay = nightHours * (cfg.nightRate || 0);
    let extraMgPay = mgHours * HORA_EXTRA_MG;
    let extraNgPay = ngHours * HORA_EXTRA_NG;

    let totalComplements = 0;
    const compContainer = document.getElementById('payrollComplementsContainer');
    const compList = document.getElementById('valComplementsList');
    compList.innerHTML = '';

    if (cfg.complements && cfg.complements.length > 0) {
        let hasValidComp = false;
        cfg.complements.forEach(comp => {
            const amount = parseFloat(comp.amount) || 0;
            if (comp.name && amount !== 0) {
                hasValidComp = true;
                totalComplements += amount;
                const compRow = document.createElement('div');
                compRow.className = "flex justify-between text-slate-300";
                compRow.innerHTML = `<span>${comp.name}:</span><span class="font-mono font-semibold ${amount < 0 ? 'text-rose-400' : 'text-emerald-400'}">${amount.toFixed(2)} €</span>`;
                compList.appendChild(compRow);
            }
        });
        if (hasValidComp) {
            compContainer.classList.remove('hidden');
            document.getElementById('valComplementsTotal').innerText = totalComplements.toFixed(2) + ' €';
        } else {
            compContainer.classList.add('hidden');
        }
    } else {
        compContainer.classList.add('hidden');
    }

    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!u.monthlyPluses) u.monthlyPluses = {};
    const monthlyExtraPlus = parseFloat(u.monthlyPluses[monthKey]) || 0;

    const boxPlusElem = document.getElementById('boxMonthlyExtraPlus');
    const inputPlusElem = document.getElementById('inputMonthlyExtraPlus');
    const labelToggleBtn = document.getElementById('labelToggleMonthlyExtraPlus');

    if (boxPlusElem) {
        if (monthlyExtraPlus > 0) {
            boxPlusElem.classList.remove('hidden');
            if (labelToggleBtn) labelToggleBtn.innerText = "✕ Quitar";
            if (inputPlusElem && document.activeElement !== inputPlusElem) {
                inputPlusElem.value = monthlyExtraPlus;
            }
        } else {
            // Si es 0 o no existe, mantenemos el cajón cerrado por defecto
            boxPlusElem.classList.add('hidden');
            if (labelToggleBtn) labelToggleBtn.innerText = "+ Añadir";
            if (inputPlusElem && document.activeElement !== inputPlusElem) {
                inputPlusElem.value = '';
            }
        }
    }

    const baseTotal = (cfg.baseSalary || 0) + (cfg.carencia || 0) + (cfg.funcion || 0);
    const prorrataExtra = cfg.prorrataExtra || 0;
    // En junio (5) y diciembre (11), la paga extra equivale a base + carencia + función.
    const isExtraPayMonth = month === 5 || month === 11;
    const pagaExtra = isExtraPayMonth ? baseTotal : 0;
    const extraPayRow = document.getElementById('payrollExtraPayRow');
    extraPayRow.classList.toggle('hidden', !isExtraPayMonth);

    const isMarchMonth = month === 2; // Marzo (índice 2)
    const marchBonusAmount = isMarchMonth ? (cfg.marchBonus !== undefined ? cfg.marchBonus : 0) : 0;
    const marchBonusRow = document.getElementById('payrollMarchBonusRow');
    if (marchBonusRow) marchBonusRow.classList.toggle('hidden', !isMarchMonth);
    const valMarchBonusElem = document.getElementById('valMarchBonus');
    if (valMarchBonusElem) valMarchBonusElem.innerText = marchBonusAmount.toFixed(2) + ' €';

    const brutoTotal = baseTotal + nightPay + totalGuardPay + extraMgPay + extraNgPay + prorrataExtra + pagaExtra + marchBonusAmount + totalComplements + monthlyExtraPlus;

    // La cotización mensual ya contempla la prorrata; la paga extra no vuelve a cotizar en junio/diciembre.
    const baseCotizacion = brutoTotal - pagaExtra;
    const cuotaSS = baseCotizacion * 0.0485;
    const desempleo = baseCotizacion * 0.0165;
    const baseIrpf = brutoTotal - prorrataExtra;
    const irpf = baseIrpf * ((cfg.irpf || 0) / 100);

    const totalDeducciones = cuotaSS + desempleo + irpf;
    const netoTotal = brutoTotal - prorrataExtra - totalDeducciones;

    document.getElementById('valBaseSalaryTotal').innerText = baseTotal.toFixed(2) + ' €';
    document.getElementById('valBaseSalaryBreakdown').innerText = `(${(cfg.baseSalary || 0).toFixed(2)}€ + ${(cfg.carencia || 0).toFixed(2)}€ + ${(cfg.funcion || 0).toFixed(2)}€)`;
    document.getElementById('valProrrataExtra').innerText = prorrataExtra.toFixed(2) + ' €';
    document.getElementById('valPagaExtra').innerText = pagaExtra.toFixed(2) + ' €';
    document.getElementById('countNights').innerText = nightHours;
    document.getElementById('valNights').innerText = nightPay.toFixed(2) + ' €';
    document.getElementById('valGuardias').innerText = totalGuardPay.toFixed(2) + ' €';
    document.getElementById('countMgHours').innerText = mgHours;
    document.getElementById('valExtrasMG').innerText = extraMgPay.toFixed(2) + ' €';
    document.getElementById('countNgHours').innerText = ngHours;
    document.getElementById('valExtrasNG').innerText = extraNgPay.toFixed(2) + ' €';
    document.getElementById('valBruto').innerText = brutoTotal.toFixed(2) + ' €';
    document.getElementById('valSS').innerText = '-' + cuotaSS.toFixed(2) + ' €';
    document.getElementById('valDesempleo').innerText = '-' + desempleo.toFixed(2) + ' €';
    document.getElementById('valIrpfPercent').innerText = (cfg.irpf || 0);
    document.getElementById('valIRPF').innerText = '-' + irpf.toFixed(2) + ' €';
    document.getElementById('valNeto').innerText = netoTotal.toFixed(2) + ' €';
}

async function saveMonthlyExtraPlus() {
    const u = getUser();
    if (!u.monthlyPluses) u.monthlyPluses = {};

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    const inputElem = document.getElementById('inputMonthlyExtraPlus');
    const val = parseFloat(inputElem.value) || 0;

    if (val > 0) {
        u.monthlyPluses[monthKey] = val;
    } else {
        delete u.monthlyPluses[monthKey];
    }

    await saveDataToFirebase(false);
    calculatePayroll(); // Recalcula inmediatamente las deducciones y el neto
}

async function toggleMonthlyExtraPlus() {
    const box = document.getElementById('boxMonthlyExtraPlus');
    const inputElem = document.getElementById('inputMonthlyExtraPlus');
    const labelBtn = document.getElementById('labelToggleMonthlyExtraPlus');
    
    if (!box) return;

    const isHidden = box.classList.contains('hidden');

    if (isHidden) {
        // MOSTRAR: Abrimos el desplegable
        box.classList.remove('hidden');
        if (labelBtn) labelBtn.innerText = "✕ Quitar";
        if (inputElem) inputElem.focus();
    } else {
        // OCULTAR: Cerramos el desplegable y reseteamos el plus a 0
        box.classList.add('hidden');
        if (labelBtn) labelBtn.innerText = "+ Añadir";
        if (inputElem) inputElem.value = '';
        
        // Al resetear a 0, guardamos la eliminación del plus para este mes
        await saveMonthlyExtraPlus();
    }
}

function openConfirmClearMonthModal() { document.getElementById('confirmClearMonthModal').classList.remove('hidden'); }
function closeConfirmClearMonthModal() { document.getElementById('confirmClearMonthModal').classList.add('hidden'); }

async function confirmClearCurrentMonth() {
    createAutoBackup('Borrado de mes completo');
    const u = getUser();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
        const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        delete u.shifts[k];
    }

    await saveDataToFirebase();
    closeConfirmClearMonthModal();
    renderCalendar();
    updateSidebar();
}

function renderExistingShiftsColorList() {
    const u = getUser();
    const container = document.getElementById('existingShiftsColorList');
    container.innerHTML = '';

    // Modificado: Si existe u.colors (incluso si solo tiene el flag _isCustom), usamos el del usuario
    const availableColors = u.colors ? { ...u.colors } : { ...defaultColors };
    // Eliminamos el flag temporal antes de contar y renderizar para que no cree un cuadro vacío
    delete availableColors._isCustom;

    Object.keys(availableColors).forEach(key => {
        if (availableColors[key] === null || availableColors[key] === undefined) {
            delete availableColors[key];
        }
    });

    let shiftsCount = Object.keys(availableColors).length;
    document.getElementById('shiftBgCount').innerText = shiftsCount;

    getOrderedShiftCodes(availableColors).forEach(sCode => {
        const colorObj = availableColors[sCode];
        const row = document.createElement('div');
        row.className = "flex flex-col gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60";
        row.id = "turno";
        const fullName = shiftFullNames[sCode] || `${sCode} - Turno ${sCode}`;
        const hasImg = !!(u.customImages && u.customImages[sCode]);
        const startTime = colorObj.startTime || '';
        const endTime = colorObj.endTime || '';
        const isSplit = (typeof pendingShiftSplits !== 'undefined' && pendingShiftSplits[sCode] !== undefined)
            ? pendingShiftSplits[sCode]
            : !!(colorObj.isSplit);
        const startTime2 = colorObj.startTime2 || '';
        const endTime2 = colorObj.endTime2 || '';

        row.innerHTML = `
                    <div class="flex items-center gap-1.5 w-full">
                        <input type="text" maxlength="3" value="${sCode}" onchange="updateShiftCode('${sCode}', this.value)" class="font-bold text-white text-[clamp(0.7rem,0.8vw,0.95rem)] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 uppercase w-16 text-center" title="Editar Título / Código">
                        <input type="text" value="${fullName}" onchange="updateShiftFullName('${sCode}', this.value)" class="flex-1 font-medium text-slate-200 text-[clamp(0.7rem,0.8vw,0.95rem)] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1" placeholder="Nombre completo del turno" title="Editar Nombre del Turno">
                        <button onclick="openConfirmDeleteShiftModal('${sCode}')" class="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition flex-shrink-0" title="Borrar Turno">
                            <i data-lucide="trash-2" class="w-4 h-4 2xl:w-5 2xl:h-5"></i>
                        </button>
                    </div>

                    <!-- 1ª Franja Horaria -->
                    <div class="grid grid-cols-2 gap-2 w-full pt-1">
                        <div class="flex items-center gap-1">
                            <span class="text-[clamp(0.65rem,0.75vw,0.85rem)] text-slate-400">Inicio:</span>
                            <input id="franja1" type="time" value="${startTime}" onchange="updateShiftTime('${sCode}', 'startTime', this.value)" class="w-full bg-slate-900 text-white text-[clamp(0.65rem,0.75vw,0.85rem)] border border-slate-700 rounded-lg px-1 py-0.5 cursor-pointer">
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-[clamp(0.65rem,0.75vw,0.85rem)] text-slate-400">Fin:</span>
                            <input id="franja2" type="time" value="${endTime}" onchange="updateShiftTime('${sCode}', 'endTime', this.value)" class="w-full bg-slate-900 text-white text-[clamp(0.65rem,0.75vw,0.85rem)] border border-slate-700 rounded-lg px-1 py-0.5 cursor-pointer">
                        </div>
                    </div>

                    <!-- Checkbox para convertir cualquier turno en Partido -->
                    <div class="flex items-center gap-2 pt-1">
                        <input type="checkbox" id="splitCheck_${sCode}" ${isSplit ? 'checked' : ''} onchange="toggleShiftSplit('${sCode}', this.checked)" class="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer">
                        <label for="splitCheck_${sCode}" class="text-[clamp(0.65rem,0.75vw,0.85rem)] text-slate-300 font-semibold cursor-pointer">Turno Partido (2ª Franja)</label>
                    </div>

                    <!-- 2ª Franja Horaria (Se muestra solo si la casilla está marcada) -->
                    <div id="splitBox_${sCode}" class="${isSplit ? '' : 'hidden'} grid grid-cols-2 gap-2 w-full p-1.5 rounded-lg border border-slate-700/40 justify-between">
                        <div class="flex items-center gap-1">
                            <span class="w-1/5">Inicio 2:</span>
                            <input type="time" value="${startTime2}" onchange="updateShiftTime('${sCode}', 'startTime2', this.value)" class="w-full bg-slate-900 text-white text-[clamp(0.65rem,0.75vw,0.85rem)] border border-slate-700 rounded-lg px-1 py-0.5 cursor-pointer">
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="w-1/6">Fin 2:</span>
                            <input type="time" value="${endTime2}" onchange="updateShiftTime('${sCode}', 'endTime2', this.value)" class="w-full bg-slate-900 text-white text-[clamp(0.65rem,0.75vw,0.85rem)] border border-slate-700 rounded-lg px-1 py-0.5 cursor-pointer">
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 w-full pt-1.5 border-t border-slate-700/40">
                        <div class="flex items-center gap-3 shrink-0">
                            <div class="flex items-center gap-1">
                                <span class="text-slate-400">Fondo:</span>
                                <input type="color" value="${colorObj.bg}" onchange="updateShiftColor('${sCode}', 'bg', this.value)" class="w-6 h-5 bg-transparent rounded cursor-pointer">
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="text-slate-400">Borde:</span>
                                <input type="color" value="${colorObj.border || colorObj.bg}" onchange="updateShiftColor('${sCode}', 'border', this.value)" class="w-6 h-5 bg-transparent rounded cursor-pointer">
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                            <label class="text-slate-400">Foto:</label>
                            <input id='fileInput_${sCode}' type="file" accept="image/*" onchange="uploadShiftBgImage('${sCode}', this)" class="text-slate-400 cursor-pointer max-w-[70%] truncate min-w-0">
                            <span id="file-label-${sCode}" class="text-xs text-slate-400 truncate max-w-[120px]">
                                ${hasImg ? '🖼️ Fondo activo':''}
                            </span>
                            <button type="button" onclick="clearShiftFileSelection('${sCode}')" id="btn-clear-${sCode}" class="${hasImg || pendingShiftBackgrounds?.[sCode] ? 'flex' : 'hidden'} p-1 text-rose-400 hover:bg-rose-500/20 rounded items-center gap-0.5 font-bold shrink-0" title="Quitar foto">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </div>
                `;
        container.appendChild(row);
    });
    lucide.createIcons();
}

async function updateShiftTime(code, field, value) {
    const u = getUser();
    if (!u.colors[code]) u.colors[code] = { ...(defaultColors[code] || {}) };
    u.colors[code][field] = value;
    await saveDataToFirebase(false);
    renderCalendar();
    updateSidebar();
}

function toggleShiftSplit(code, isChecked) {
    if (typeof pendingShiftSplits === 'undefined') {
        pendingShiftSplits = {};
    }
    
    // Guardamos el estado del checkbox temporalmente en el borrador
    pendingShiftSplits[code] = isChecked;

    // Control visual de la 2ª franja dentro del modal
    const box = document.getElementById(`splitBox_${code}`);
    if (box) box.classList.toggle('hidden', !isChecked);

    // --- NUEVO: Limpiar los campos de la 2ª franja si se desmarca ---
    const u = getUser();
    if (!u.colors[code]) {
        u.colors[code] = { ...(defaultColors[code] || {}) };
    }

    if (!isChecked) {
        // Borramos los atributos de la segunda franja para que no queden guardados
        delete u.colors[code].isSplit;
        delete u.colors[code].startTime2;
        delete u.colors[code].endTime2;

        // Limpiamos también visualmente los inputs de la 2ª franja en el DOM si existen
        const inputStart2 = box ? box.querySelector('input[type="time"]:nth-of-type(1)') : null; // o según tu estructura de inputs
        const inputEnd2 = box ? box.querySelector('input[type="time"]:nth-of-type(2)') : null;
        // O más seguro buscando por las funciones de cambio o estructura:
        const inputsTime = box ? box.querySelectorAll('input[type="time"]') : [];
        inputsTime.forEach(input => {
            input.value = '';
            // Disparamos el evento o actualizamos el objeto asociado si es necesario
            if (input.onchange) input.onchange();
        });
    }

    console.log(`-> Turno [${code}] marcado como partido (${isChecked}) en borrador.`);
}

async function updateShiftCode(oldCode, newCode) {
    newCode = newCode.trim().toUpperCase();
    if (!newCode || oldCode === newCode) return;

    const u = getUser();
    if (u.colors[newCode]) {
        openCustomAlertModal("Código Duplicado", "Ya existe un turno con ese código.");
        renderExistingShiftsColorList();
        return;
    }

    // NUEVA VALIDACIÓN: Limitar estrictamente a 3 caracteres máximo
    if (newCode.length > 3) {
        openCustomAlertModal("Límite excedido", "El código del turno no puede tener más de 3 caracteres.");
        renderExistingShiftsColorList();
        return;
    }

    u.colors[newCode] = u.colors[oldCode];
    delete u.colors[oldCode];

    if (u.customImages && u.customImages[oldCode]) {
        u.customImages[newCode] = u.customImages[oldCode];
        delete u.customImages[oldCode];
    }

    if (shiftFullNames[oldCode]) {
        shiftFullNames[newCode] = shiftFullNames[oldCode];
        delete shiftFullNames[oldCode];
        saveShiftFullNames();
    }

    Object.keys(u.shifts || {}).forEach(k => {
        if (u.shifts[k].shift === oldCode) {
            u.shifts[k].shift = newCode;
        }
    });

    await saveDataToFirebase(false);
    renderExistingShiftsColorList();
    renderCalendar();
    updateSidebar();
}

function updateShiftFullName(code, newName) {
    shiftFullNames[code] = newName.trim();
    saveShiftFullNames();
    updateSidebar();
}

async function updateShiftColor(code, key, val) {
    const u = getUser();
    if (!u.colors[code]) u.colors[code] = { ...defaultColors[code] };
    u.colors[code][key] = val;
    await saveDataToFirebase(false);
    renderCalendar();
    updateSidebar();
}

async function uploadShiftBgImage(code, inputElem) {
    if (inputElem.files && inputElem.files[0]) {
        const file = inputElem.files[0];

        // 2. Mostrar el botoncito de limpiar/cancelar selección
        const btnClear = document.getElementById(`btn-clear-${code}`);
        if (btnClear) {
            btnClear.classList.remove('hidden');
            btnClear.classList.add('flex');
        }

        try {
            // 1. Comprimimos la imagen con el tamaño adecuado (ej: ancho 260, alto 674, calidad 0.7)
            // Manteniendo la proporción aproximada de 2.6:1 para evitar el límite de 1MB de Firestore.
            const compressedBase64 = await compressImage(file, 260, 674, 0.7);
            
            // 2. Guardamos en el borrador temporal (en lugar de tocar el objeto real de usuario o Firebase)
            if (typeof pendingShiftBackgrounds === 'undefined') {
                pendingShiftBackgrounds = {};
            }
            pendingShiftBackgrounds[code] = compressedBase64;
            
        } catch (error) {
            console.error("Error al procesar y comprimir la imagen del turno:", error);
            if (typeof showCustomAlert === 'function') {
                showCustomAlert("Error", "No se pudo procesar la imagen seleccionada.");
            }
        }
    }
}

async function removeShiftBgImage(code) {
    if (typeof pendingShiftBackgrounds === 'undefined') {
        pendingShiftBackgrounds = {};
    }

    // 2. Marcamos el turno con null en el borrador para indicar que se borrará al guardar
    pendingShiftBackgrounds[code] = null;

    // 3. Feedback visual inmediato en la interfaz (sin tocar la base de datos todavía)
    const labelElem = document.getElementById(`file-label-${code}`);
    if (labelElem) {
        labelElem.textContent = "🗑️ Marcado para quitar";
        labelElem.classList.add("text-rose-400");
    }

    // Ocultar boton de quitar
    const btnQuitar = document.getElementById('removeAvatarImage');
    if (btnQuitar) {
        btnQuitar.classList.add('hidden');
    }
    
}

function clearShiftFileSelection(code) {
    // 1. Limpiamos el input de tipo file físico
    const fileInput = document.getElementById(`fileInput_${code}`);
    if (fileInput) fileInput.value = '';

    // 2. Comprobamos si el usuario tenía una imagen real guardada previamente en el sistema
    const u = getUser();
    const hasOriginalImg = u.customImages && u.customImages[code];

    if (typeof pendingShiftBackgrounds === 'undefined') {
        pendingShiftBackgrounds = {};
    }

    if (hasOriginalImg) {
        // Si ya tenía una foto guardada y quiere quitarla por completo, la marcamos con null para el borrador
        pendingShiftBackgrounds[code] = null;
    } else {
        // Si solo había seleccionado un archivo temporal por error, lo borramos del borrador
        delete pendingShiftBackgrounds[code];
    }

    // 3. Actualizamos la interfaz visualmente
    const labelElem = document.getElementById(`file-label-${code}`);
    if (labelElem) {
        labelElem.classList.remove('hidden');
        labelElem.classList.add('hidden');
    }

    // Ocultamos este botón de limpiar si ya no hay nada que quitar
    const btnClear = document.getElementById(`btn-clear-${code}`);
    if (btnClear) btnClear.classList.add('hidden');
}

async function executeDeleteShift(code) {
    const u = getUser();

    if (!u.colors || typeof u.colors !== 'object') {
        u.colors = { ...defaultColors };
    }
    const cleanedColors = {};
    if (u.colors) {
        Object.keys(u.colors).forEach(key => {
            if (key !== code && key !== '_isCustom') {
                cleanedColors[key] = u.colors[key];
            }
        });
    }
    if (Object.keys(cleanedColors).length === 0) {
        cleanedColors._isCustom = true;
    }

    u.colors = cleanedColors;

    const dbUserData = { ...u };
    dbUserData.colors = { ...cleanedColors };

    dbUserData.colors[code] = firebase.firestore.FieldValue.delete();

    if (u.customImages && u.customImages[code]) {
        delete u.customImages[code];
    }
    if (shiftFullNames && typeof shiftFullNames === 'object' && shiftFullNames[code]) {
        delete shiftFullNames[code];
        saveShiftFullNames();
    }
    if (u.shifts && typeof u.shifts === 'object') {
        Object.keys(u.shifts).forEach(k => {
            if (u.shifts[k] && u.shifts[k].shift === code) {
                delete u.shifts[k].shift;
            }
        });
    }

    await saveDataToFirebase(false, u);
    renderExistingShiftsColorList();
    renderCalendar();
    updateSidebar();
}

async function confirmAddShift() {
    const addNewShift = document.getElementById('enableNewShift').checked;
    const u = getUser();

    // Los controles de turnos existentes guardan sus cambios al modificarlos.
    // Sin marcar la casilla, solo confirmamos y guardamos esos cambios.
    if (!addNewShift) {
        await saveDataToFirebase(false);
        renderExistingShiftsColorList();
        renderCalendar();
        updateSidebar();
        saveSettings();
        closeCustomShiftModal();
        createAutoBackup(`Cambios en turnos (${CURRENT_APP_VERSION})`);
        return;
    }

    // Leer los campos del nuevo turno solo si se ha marcado la casilla.
    const codeInput = document.getElementById('newShiftCode');
    const nameInput = document.getElementById('newShiftName');
    const bgInput = document.getElementById('newShiftBg');
    const bdInput = document.getElementById('newShiftBd');
    const imgInput = document.getElementById('newShiftImg');
    const startTime = document.getElementById('newShiftStartTime').value;
    const endTime = document.getElementById('newShiftEndTime').value;
    const isSplit = document.getElementById('newShiftIsSplit').checked;
    const startTime2 = document.getElementById('newShiftStartTime2').value;
    const endTime2 = document.getElementById('newShiftEndTime2').value;

    const code = codeInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();

    if (!code) {
        openCustomAlertModal("Código Requerido", "Por favor ingresa un código para el nuevo turno.");
        return;
    }

    if (code.length > 3) {
        openCustomAlertModal("Límite excedido", "El código del turno no puede tener más de 3 caracteres.");
        return;
    }

    const availableColors = u.colors || defaultColors;
    if (Object.keys(availableColors).length >= MAX_CUSTOM_SHIFTS) {
        openCustomAlertModal("Límite Alcanzado", `Se ha alcanzado el límite máximo de ${MAX_CUSTOM_SHIFTS} turnos.`);
        return;
    }

    if (availableColors[code]) {
        openCustomAlertModal("Turno Existente", "Ya existe un turno con ese código.");
        return;
    }

    if (!u.colors) u.colors = {};
    u.colors[code] = {
        bg: bgInput.value,
        text: '#ffffff',
        border: bdInput.value,
        startTime: startTime,
        endTime: endTime,
        isSplit: isSplit,
        startTime2: startTime2,
        endTime2: endTime2
    };
    if (!u.customImages) u.customImages = {};
    shiftFullNames[code] = name || `${code} - Turno ${code}`;
    saveShiftFullNames();

    if (imgInput.files && imgInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function (e) {
            u.customImages[code] = e.target.result;
            await saveDataToFirebase(false);
            finishAddShift();
            openCustomAlertModal("Datos guardados", "Los cambios existentes y el nuevo turno se han guardado correctamente.");
        };
        reader.readAsDataURL(imgInput.files[0]);
    } else {
        await saveDataToFirebase(false);
        finishAddShift();
        openCustomAlertModal("Datos guardados", "Los cambios existentes y el nuevo turno se han guardado correctamente.");
    }
    createAutoBackup(`Cambios en turnos (${CURRENT_APP_VERSION})`);
    closeCustomShiftModal();
}

function finishAddShift() {
    document.getElementById('newShiftCode').value = '';
    document.getElementById('newShiftName').value = '';
    document.getElementById('newShiftImg').value = '';
    document.getElementById('newShiftStartTime').value = '';
    document.getElementById('newShiftEndTime').value = '';
    document.getElementById('newShiftIsSplit').checked = false;
    document.getElementById('newShiftStartTime2').value = '';
    document.getElementById('newShiftEndTime2').value = '';
    document.getElementById('newShiftSplitTimeBox').classList.add('hidden');
    document.getElementById('enableNewShift').checked = false;
    document.getElementById('newShiftFields').classList.add('hidden');
    renderExistingShiftsColorList();
    renderCalendar();
    updateSidebar();
}

function openCustomShiftModal() {
    renderExistingShiftsColorList();
    document.getElementById('customShiftModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeCustomShiftModal() {
    pendingShiftSplits = {};
    document.getElementById('customShiftModal').classList.add('hidden');
}

function openSettingsModal() {
    const u = getUser();
    const cfg = u.config || {};

    document.getElementById('cfgBaseSalary').value = cfg.baseSalary || 0;
    document.getElementById('cfgCarencia').value = cfg.carencia || 0;
    document.getElementById('cfgFuncion').value = cfg.funcion || 0;
    document.getElementById('cfgProrrataExtra').value = cfg.prorrataExtra || 0;
    document.getElementById('cfgNightRate').value = cfg.nightRate || 0;
    document.getElementById('cfgIrpf').value = cfg.irpf || 0;
    document.getElementById('cfgMarchBonus').value = (cfg.marchBonus !== undefined) ? cfg.marchBonus : 0;

    const preview = document.getElementById('avatarPreview');
    if (u.avatar) {
        preview.innerHTML = `<img src="${u.avatar}" class="w-full h-full object-cover rounded-full">`;
    } else {
        const letter = (u.name && u.name.length > 0) ? u.name.charAt(0).toUpperCase() : 'U';
        preview.innerHTML = `<span class="text-white font-bold text-[clamp(1rem,1.2vw,1.5rem)]">${letter}</span>`;
    }

    tempAvatarData = null;
    deletedAvatar = false;

    renderComplementsInputs();
    renderBackupsList();

    document.getElementById('settingsModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function saveUser(u) {
    localStorage.setItem('tempUser', JSON.stringify(u));
}

async function previewUserAvatar(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        try {
            // Comprimimos la imagen y la guardamos en el borrador temporal
            pendingAvatarBase64 = await compressImage(file, 150, 150, 0.7);
            
            // Actualizamos SOLO la vista previa dentro del modal de ajustes para que el usuario la vea
            const settingsPreview = document.getElementById('avatarPreview');
            if (settingsPreview) {
                settingsPreview.innerHTML = `<img src="${pendingAvatarBase64}" class="w-full h-full object-cover rounded-full">`;
            }
        } catch (error) {
            console.error("Error al procesar la imagen:", error);
            if (typeof showCustomAlert === 'function') {
                showCustomAlert("Error", "No se pudo procesar la imagen.");
            }
        }
    }
}

function removeAvatarImage() {
    tempAvatarData = null;
    deletedAvatar = true;
    const u = getUser();
    const letter = (u.name && u.name.length > 0) ? u.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('avatarPreview').innerHTML = `<span class="text-white font-bold text-[clamp(1rem,1.2vw,1.5rem)]">${letter}</span>`;
    document.getElementById('userAvatarUpload').value = '';
}

function renderComplementsInputs() {
    const u = getUser();
    const list = document.getElementById('complementsList');
    list.innerHTML = '';

    const compList = (u.config && u.config.complements) ? u.config.complements : [];

    compList.forEach((comp, idx) => {
        const row = document.createElement('div');
        row.className = "flex items-center gap-2";
        row.innerHTML = `
                    <input type="text" value="${comp.name || ''}" placeholder="Concepto" onchange="updateComplementField(${idx}, 'name', this.value)" class="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-medium text-[clamp(0.7rem,0.8vw,0.95rem)]">
                    <input type="number" step="any" value="${comp.amount || 0}" placeholder="Monto (€)" onchange="updateComplementField(${idx}, 'amount', this.value)" class="w-24 bg-slate-800 border border-slate-700 rounded-xl p-2 text-white font-medium text-[clamp(0.7rem,0.8vw,0.95rem)]">
                    <button type="button" onclick="removeComplementInput(${idx})" class="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4 2xl:w-5 2xl:h-5"></i></button>
                `;
        list.appendChild(row);
    });
    lucide.createIcons();
    if (u.config.complements.length === 0) {
        document.getElementById('params').classList.remove('space-y-3');
    }
    else {
        document.getElementById('params').classList.add('space-y-3');
    }
}

function addNewComplementInput() {
    const u = getUser();
    if (!u.config.complements) u.config.complements = [];
    u.config.complements.push({ name: '', amount: 0 });
    renderComplementsInputs();
}

function updateComplementField(idx, field, val) {
    const u = getUser();
    if (u.config.complements && u.config.complements[idx]) {
        if (field === 'amount') {
            u.config.complements[idx][field] = parseFloat(val) || 0;
        } else {
            u.config.complements[idx][field] = val;
        }
    }
}

function removeComplementInput(idx) {
    const u = getUser();
    if (u.config.complements && u.config.complements[idx]) {
        u.config.complements.splice(idx, 1);
        renderComplementsInputs();
    }
}

function renderBackupsList() {
    const list = document.getElementById('backupsList');
    list.innerHTML = '';
    if (backupsHistory.length === 0) {
        list.innerHTML = `<div class="text-slate-500 text-center py-2">No hay copias de seguridad recientes</div>`;
        return;
    }

    backupsHistory.forEach((b, idx) => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center border-b border-slate-800/50 pb-1";
        item.innerHTML = `
                        <div>
                            <span class="font-bold text-blue-400">${b.version}</span> - 
                            <span class="text-slate-300">${b.reason}</span>
                            <div class="text-[clamp(0.55rem,0.65vw,0.75rem)] text-slate-500">${b.timestamp}</div>
                        </div>
                    <button type="button" id='AdminOk' onclick="requestAdminAuthRestore(${idx})" class="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition">Restaurar</button>
                `;
        list.appendChild(item);
    });
}

function requestAdminAuthRestore(idx) {
    pendingRestoreIndex = idx;
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminAuthModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeAdminAuthModal() {
    pendingRestoreIndex = null;
    document.getElementById('adminAuthModal').classList.add('hidden');
}

async function confirmAdminRestore() {
    const pwd = document.getElementById('adminPasswordInput').value;
    if (pwd !== ADMIN_RESTORE_PASSWORD) {
        closeAdminAuthModal();
        openCustomAlertModal("Error de Restauración", "Contraseña de administrador incorrecta. No se pudo restaurar la copia de seguridad.");
        return;
    }

    if (pendingRestoreIndex !== null && backupsHistory[pendingRestoreIndex]) {
        try {
            const backupObj = backupsHistory[pendingRestoreIndex];
            appData = JSON.parse(backupObj.data);
            await saveDataToFirebase();
            closeAdminAuthModal();
            closeSettingsModal();
            renderCalendar();
            updateSidebar();
            if (currentView === 'year') renderYearlyView();
            openCustomAlertModal("Restauración Exitosa", "La copia de seguridad se ha restaurado correctamente en el sistema.");
        } catch (e) {
            closeAdminAuthModal();
            openCustomAlertModal("Error de Restauración", "Hubo un fallo al procesar los datos de la copia de seguridad.");
        }
    } else {
        closeAdminAuthModal();
        openCustomAlertModal("Error de Restauración", "La copia de seguridad seleccionada no es válida.");
    }
}

async function saveSettings() {
    const u = getUser();
 
    if (typeof pendingShiftSplits !== 'undefined' && Object.keys(pendingShiftSplits).length > 0) {
        if (!u.colors) u.colors = {};
        
        for (const [code, isSplitValue] of Object.entries(pendingShiftSplits)) {
            if (!u.colors[code]) {
                u.colors[code] = { ...(defaultColors[code] || {}) };
            }
            u.colors[code].isSplit = isSplitValue;
	    if (!isSplitValue) {
                delete u.colors[code].isSplit;
                delete u.colors[code].startTime2;
                delete u.colors[code].endTime2;
            }
        }
        pendingShiftSplits = {}; // Limpiamos el borrador
    }

    if (typeof pendingShiftBackgrounds !== 'undefined' && Object.keys(pendingShiftBackgrounds).length > 0) {
        if (!u.customImages) u.customImages = {};
        
        for (const [code, value] of Object.entries(pendingShiftBackgrounds)) {
            if (value === null) {
                // Si está marcado como null en el borrador, lo borramos definitivamente
                delete u.customImages[code];
            } else {
                u.customImages[code] = value;
            }
        }
        pendingShiftBackgrounds = {}; // Limpiamos el borrador
    }

    u.config.baseSalary = parseFloat(document.getElementById('cfgBaseSalary').value) || 0;
    u.config.carencia = parseFloat(document.getElementById('cfgCarencia').value) || 0;
    u.config.funcion = parseFloat(document.getElementById('cfgFuncion').value) || 0;
    u.config.prorrataExtra = parseFloat(document.getElementById('cfgProrrataExtra').value) || 0;
    u.config.nightRate = parseFloat(document.getElementById('cfgNightRate').value) || 0;
    u.config.irpf = parseFloat(document.getElementById('cfgIrpf').value) || 0;
    u.config.marchBonus = parseFloat(document.getElementById('cfgMarchBonus').value) || 0;

    if (deletedAvatar) {
        u.avatar = null;
    } else if (tempAvatarData) {
        u.avatar = tempAvatarData;
    }

    if (pendingAvatarBase64) {
        u.avatar = pendingAvatarBase64;
        pendingAvatarBase64 = null; // Limpiamos el borrador temporal
    }

    saveUser(u);
    createAutoBackup(`Parámetros salariales (${CURRENT_APP_VERSION})`);
    await saveDataToFirebase();
    updateAvatarUI();
    closeSettingsModal();
    closeCustomShiftModal();
    renderCalendar();
}

function openModal(dateKey, day) {
    const u = getUser();
    const parts = dateKey.split('-');
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    document.getElementById('modalTitle').innerText = `Editar Día ${day} de ${monthNames[parseInt(parts[1]) - 1]}`;

    const shiftSelect = document.getElementById('modalShift');
    shiftSelect.innerHTML = '<option value="">Sin Turno (Vacío)</option>';

    const availableColors = u.colors || defaultColors;

    getOrderedShiftCodes(availableColors).forEach(sCode => {
        const opt = document.createElement('option');
        opt.value = sCode;
        opt.innerText = shiftFullNames[sCode] || `${sCode} - Turno ${sCode}`;
        shiftSelect.appendChild(opt);
    });

    const dayInfo = u.shifts[dateKey] || {};
    shiftSelect.value = dayInfo.shift || '';
    document.getElementById('modalDayType').value = dayInfo.dayType || 'auto';

    document.getElementById('dayModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('dayModal').classList.add('hidden');
}

async function clearSingleDay() {
    const u = getUser();
    if (u.shifts[selectedDayKey]) {
        delete u.shifts[selectedDayKey];
        await saveDataToFirebase(false);
        renderCalendar();
        updateSidebar();
    }
    closeModal();
}

async function saveModal() {
    const u = getUser();
    const shiftVal = document.getElementById('modalShift').value;
    const dayTypeVal = document.getElementById('modalDayType').value;

    if (shiftVal || dayTypeVal !== 'auto') {
        u.shifts[selectedDayKey] = { shift: shiftVal, dayType: dayTypeVal };
    } else {
        delete u.shifts[selectedDayKey];
    }

    await saveDataToFirebase(false);
    closeModal();
    renderCalendar();
    updateSidebar();
}

// Deslizamiento en móvil
const mainContentArea = document.querySelectorAll('#monthlyView, #currentMonthLabel, #yearlyView, #currentYearLabel');

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

mainContentArea.forEach(element => {
    element.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    element.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipeGesture();
    }, { passive: true });
});

function handleSwipeGesture() {
    const swipeThreshold = 50; // Mínimo de distancia horizontal en píxeles
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Verificar que el movimiento fue horizontal y no vertical (scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (deltaX < 0) {
            // Deslizar hacia la izquierda -> Mes siguiente
            changeCurrentNavigation(1);
        } else {
            // Deslizar hacia la derecha -> Mes anterior
            changeCurrentNavigation(-1);
        }
    }
}

// Función para cambiar de mes con animación
function changeMonthAnimated(direction) {
    const calendarView = document.getElementById('monthlyView');
    if (!calendarView) {
        changeMonth(direction);
        return;
    }

    const outClass = direction > 0 ? 'slide-left-out' : 'slide-right-out';
    const inClass = direction > 0 ? 'slide-left-in' : 'slide-right-in';

    // 1. Iniciar animación de salida
    calendarView.classList.add(outClass);

    setTimeout(() => {
        // 2. Cambiar mes y actualizar la interfaz en el punto invisible
        changeMonth(direction);

        // 3. Reemplazar clase de salida por la de entrada
        calendarView.classList.remove(outClass);
        calendarView.classList.add(inClass);

        // 4. Limpiar clases al finalizar la animación
        setTimeout(() => {
            calendarView.classList.remove(inClass);
        }, 100);
    }, 100);
}

// Función para clasificar el tipo de día: 'fin-semana', 'festivo', 'festivo-especial' o null
function getDayType(date) {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    const month = date.getMonth() + 1; // 1 a 12
    const day = date.getDate();

    // Festivos especiales (5 de enero, 3 de diciembre, 24 de diciembre, 31 de diciembre)
    const specialHolidays = [
        { m: 1, d: 5 },   // 5 de enero
        { m: 12, d: 3 },  // 3 de diciembre (San Francisco Javier / Día de Navarra)
        { m: 12, d: 24 }, // 24 de diciembre (Nochebuena)
        { m: 12, d: 31 }  // 31 de diciembre (Nochevieja)
    ];

    // Festivos oficiales (1 y 6 de enero, 2 y 3 de abril, 1 de mayo, 15 de agosto, 12 de octubre, 6, 8 y 25 de diciembre)
    const normalHolidays = [
        { m: 1, d: 1 },   // 1 de enero
        { m: 1, d: 6 },   // 6 de enero
        { m: 4, d: 2 },   // 2 de abril
        { m: 4, d: 3 },   // 3 de abril
        { m: 5, d: 1 },   // 1 de mayo
        { m: 8, d: 15 },  // 15 de agosto
        { m: 10, d: 12 }, // 12 de octubre
        { m: 12, d: 6 },  // 6 de diciembre
        { m: 12, d: 8 },  // 8 de diciembre
        { m: 12, d: 25 }  // 25 de diciembre
    ];

    // Comprobaciones en orden de prioridad
    if (specialHolidays.some(h => h.m === month && h.d === day)) {
        return 'festivo-especial';
    }
    
    if (normalHolidays.some(h => h.m === month && h.d === day)) {
        return 'festivo';
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'fin-semana';
    }

    return null;
}

function goToToday() {
    const now = new Date();
    currentDate = now; // Cambia la fecha base al día de hoy
    selectedDayKey = now.toISOString().split('T')[0]; // Selecciona la fecha de hoy
    
    // 1. Si tienes una función para cambiar de vista (ej: switchView('monthly') o showMonthlyView()), llámala aquí:
    if (typeof switchView === 'function') {
        switchView('month'); // Cambia a la pestaña mensual
    } else {
        // Alternativa por si cambias la vista mediante clases o atributos (ej: ocultar yearly, mostrar monthly)
        const yearlyView = document.getElementById('yearlyViewContainer'); // o el ID de tu vista anual
        const monthlyView = document.getElementById('monthlyViewContainer'); // o tu vista mensual
        if (yearlyView && monthlyView) {
            yearlyView.classList.add('hidden');
            monthlyView.classList.remove('hidden');
        }
    }
    
    // 2. Renderizamos la vista mensual y actualizamos estadísticas
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof renderYearlyView === 'function') renderYearlyView();

    // 4. LLAMADA CLAVE PARA EL SIDEBAR: 
    // Sustituye 'updateSidebar' o 'selectDay' por el nombre exacto de la función que actualiza tu panel lateral con los datos del día seleccionado
    if (typeof updateSidebar === 'function') {
        updateSidebar(selectedDayKey);
    } else if (typeof handleYearlyDayClick === 'function') {
        // O simula la selección del día para que el sidebar cargue sus datos
        // (O la función que uses en tu app para pintar el detalle del día)
    }

    // 3. Recargamos iconos por si acaso
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Función para comprimir y redimensionar cualquier archivo de imagen a Base64 ligero
function compressImage(file, maxWidth = 900, maxHeight = 1600, quality = 0.90) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calcular nuevas proporciones manteniendo el ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a JPEG comprimido en Base64
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
            img.src = event.target.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
