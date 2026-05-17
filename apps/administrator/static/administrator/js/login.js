function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
  const inner  = document.querySelector('.auth-card-inner');
  const alerts = inner ? inner.querySelectorAll('.alert') : [];
  if (alerts.length > 0) {
    inner.classList.add('has-alerts');
  }
});