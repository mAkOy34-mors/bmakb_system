function togglePassword(id, btn) {
    const input = document.getElementById(id);
    const icon  = btn.querySelector('i');
    input.type  = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('bi-eye');
    icon.classList.toggle('bi-eye-slash');
  }

  // ── Password strength meter ───────────────────────────────────────────────
  const pw1        = document.getElementById('pw1');
  const pw2        = document.getElementById('pw2');
  const bar        = document.getElementById('strengthBar');
  const barLabel   = document.getElementById('strengthLabel');
  const matchLabel = document.getElementById('matchLabel');

  function getStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  pw1.addEventListener('input', () => {
    const s = getStrength(pw1.value);
    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a', '#15803d'];
    bar.style.width     = `${(s / 5) * 100}%`;
    bar.style.background = colors[s] || '#e5e7eb';
    barLabel.textContent = pw1.value ? levels[s] : '';
    barLabel.style.color = colors[s];
    checkMatch();
  });

  pw2.addEventListener('input', checkMatch);

  function checkMatch() {
    if (!pw2.value) { matchLabel.textContent = ''; return; }
    if (pw1.value === pw2.value) {
      matchLabel.textContent = '✓ Passwords match';
      matchLabel.style.color = '#16a34a';
    } else {
      matchLabel.textContent = '✗ Passwords do not match';
      matchLabel.style.color = '#ef4444';
    }
  }