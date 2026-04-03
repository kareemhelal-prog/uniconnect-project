// login.js — Page-level logic for UniConnect Login

// ─── Toggle Password Visibility ───────────────────────────────────────────────
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePasswordBtn.textContent = isHidden ? '🙈' : '👁️';
  });
}

// ─── Remember Me Logic ────────────────────────────────────────────────────────
const rememberCheckbox = document.getElementById('rememberMe');
const emailInput = document.getElementById('email');

// On page load, restore saved email if remember me was checked
window.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('rememberedEmail');
  const isRemembered = localStorage.getItem('rememberMe') === 'true';

  if (savedEmail && isRemembered && emailInput) {
    emailInput.value = savedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
});

// Save or clear email based on remember me checkbox
function handleRememberMe() {
  if (rememberCheckbox && emailInput) {
    if (rememberCheckbox.checked) {
      localStorage.setItem('rememberedEmail', emailInput.value);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
    }
  }
}
