// ── OTP digit-box UX ──────────────────────────────────────────────────────
  const boxes   = Array.from(document.querySelectorAll('.otp-digit'));
  const hidden  = document.getElementById('otpHidden');

  boxes.forEach((box, i) => {
    box.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/, '');
      e.target.value = val;
      if (val && i < boxes.length - 1) boxes[i + 1].focus();
      syncHidden();
    });

    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = '';
        syncHidden();
      }
    });

    // Allow paste of full 6-digit code into first box
    box.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
                      .getData('text').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach((ch, j) => {
        if (boxes[j]) boxes[j].value = ch;
      });
      const last = Math.min(pasted.length, boxes.length - 1);
      boxes[last].focus();
      syncHidden();
    });
  });

  function syncHidden() {
    hidden.value = boxes.map(b => b.value).join('');
  }

  // Auto-focus first box
  boxes[0].focus();

  // ── Countdown timer ───────────────────────────────────────────────────────
  let seconds    = 60;
  const display  = document.getElementById('countdown');
  const timerEl  = document.getElementById('otpTimer');
  const resendLk = document.getElementById('resendLink');

  const timer = setInterval(() => {
    seconds--;
    display.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      timerEl.style.display   = 'none';
      resendLk.classList.remove('disabled');
      resendLk.removeAttribute('aria-disabled');
    }
  }, 1000);