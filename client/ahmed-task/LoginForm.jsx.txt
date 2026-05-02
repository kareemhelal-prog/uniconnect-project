// login-form.js — Form validation & submit handler for UniConnect Login

// ─── Form Validation ──────────────────────────────────────────────────────────
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.trim().length >= 6;
}

function showError(inputEl, message) {
  // Remove any existing error
  clearError(inputEl);

  const error = document.createElement('p');
  error.className = 'login-error';
  error.style.cssText = 'color:#f87171;font-size:0.8rem;margin-top:6px;padding-left:1.5rem;';
  error.textContent = message;
  inputEl.parentElement.appendChild(error);
  inputEl.style.borderColor = 'rgba(248,113,113,0.5)';
}

function clearError(inputEl) {
  const parent = inputEl.parentElement;
  const existing = parent.querySelector('.login-error');
  if (existing) existing.remove();
  inputEl.style.borderColor = '';
}

// ─── Login Button Submit Handler ──────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberMe');

    let isValid = true;

    // Validate email
    if (!emailInput.value.trim()) {
      showError(emailInput, 'Please enter your university email.');
      isValid = false;
    } else if (!validateEmail(emailInput.value.trim())) {
      showError(emailInput, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(emailInput);
    }

    // Validate password
    if (!passwordInput.value.trim()) {
      showError(passwordInput, 'Please enter your password.');
      isValid = false;
    } else if (!validatePassword(passwordInput.value)) {
      showError(passwordInput, 'Password must be at least 6 characters.');
      isValid = false;
    } else {
      clearError(passwordInput);
    }

    if (!isValid) return;

    // Handle Remember Me
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('rememberedEmail', emailInput.value.trim());
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
    }

    // ── Submit (replace with your real API call) ──
    console.log('Logging in with:', emailInput.value.trim());
    alert('Login successful! Welcome to UniConnect.');

    // Example: redirect after login
    // window.location.href = '/dashboard.html';
  });
}
