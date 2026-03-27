// Hash esperado para SHA-256 de la contraseña ("Admin2026")
const TARGET_HASH = '059a50ce956b7ec61527c7ecc0c55b5a009dc54ab4acddce8852b46baa2aba30';

/**
 * Calcula el hash SHA-256 de un texto usando crypto.subtle
 * @param {string} text 
 * @returns {Promise<string>} Hash hexadecimal
 */
async function generateSHA256Hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Valida la contraseña ingresada
 */
async function validateCredentials(password) {
    try {
        const hash = await generateSHA256Hash(password);
        return hash === TARGET_HASH;
    } catch (e) {
        console.error("Error criptográfico", e);
        return false;
    }
}



/**
 * Manejo de Sesión
 */
function setSessionActive() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    sessionStorage.setItem('sessionActive', 'true');
    sessionStorage.setItem('sessionTime', timeString);
}

function isSessionActive() {
    return sessionStorage.getItem('sessionActive') === 'true';
}

function getSessionTime() {
    return sessionStorage.getItem('sessionTime') || '--:--';
}

function clearSession() {
    sessionStorage.removeItem('sessionActive');
    sessionStorage.removeItem('sessionTime');
}

// Exportamos las funciones necesarias para app.js
window.AuthService = {
    validateCredentials,
    setSessionActive,
    isSessionActive,
    getSessionTime,
    clearSession
};
