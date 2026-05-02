// static/membership/js/member_form.js

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);

  /* ─────────────────────────────────────────────
     FIELD REFERENCES
  ───────────────────────────────────────────── */
  const dobInput   = $("id_date_of_birth");
  const ageDisplay = $("age-display");

  /* ─────────────────────────────────────────────
     1. LIVE AGE COMPUTATION
  ───────────────────────────────────────────── */
  function computeAge(dobValue) {
    if (!dobValue) return null;
    const dob = new Date(dobValue);
    if (isNaN(dob)) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const notYetHadBirthday =
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() &&
       today.getDate() < dob.getDate());
    if (notYetHadBirthday) age--;
    return age >= 0 ? age : null;
  }

  function updateAge() {
    const age = computeAge(dobInput?.value);
    if (ageDisplay) {
      ageDisplay.value       = age !== null ? age : "";
      ageDisplay.placeholder = age !== null ? "" : "—";
    }
  }

  dobInput?.addEventListener("change", updateAge);
  dobInput?.addEventListener("input",  updateAge);
  updateAge();

  /* ─────────────────────────────────────────────
     2. LIVE CBU PREVIEW FROM INITIAL PAID-UP
     Logic mirrors the model's save():
       • New record  → CBU = initial_paid_up
       • Edit record → CBU = existing CBU + (new paid-up − old paid-up)
                       (only when delta > 0)
  ───────────────────────────────────────────── */
  const paidUpInput   = $("id_initial_paid_up");
  const conInput      = $("id_con");
  const cbuPreview    = $("cbu-preview");
  const cbuPreviewVal = $("cbu-preview-value");

  // Lock in the CBU value as it was when the page loaded — never overwrite it.
  const savedCBU = parseFloat(conInput?.value) || 0;

  function formatPHP(amount) {
    return "₱" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function updateCBUPreview() {
    if (!paidUpInput || !conInput) return;

    const paidUp    = parseFloat(paidUpInput.value) || 0;
    // Always: projected CBU = current saved CBU + whatever is typed in paid-up
    const projected = savedCBU + paidUp;

    if (paidUp > 0) {
      cbuPreviewVal.textContent = formatPHP(projected);
      cbuPreview.style.display  = "flex";
    } else {
      cbuPreview.style.display  = "none";
    }
  }

  paidUpInput?.addEventListener("input",  updateCBUPreview);
  paidUpInput?.addEventListener("change", updateCBUPreview);

  /* ─────────────────────────────────────────────
     3. BARANGAY ADDRESS AUTOCOMPLETE
  ───────────────────────────────────────────── */
  const BARANGAYS = [
    "Ali-is, Bayawan City, Negros Oriental",
    "Banaybanay, Bayawan City, Negros Oriental",
    "Banga, Bayawan City, Negros Oriental",
    "Villasol (Bato), Bayawan City, Negros Oriental",
    "Boyco (Poblacion), Bayawan City, Negros Oriental",
    "Bugay, Bayawan City, Negros Oriental",
    "Cansumalig, Bayawan City, Negros Oriental",
    "Dawis, Bayawan City, Negros Oriental",
    "Kalamtukan, Bayawan City, Negros Oriental",
    "Kalumboyan, Bayawan City, Negros Oriental",
    "Malabugas, Bayawan City, Negros Oriental",
    "Mandu-ao, Bayawan City, Negros Oriental",
    "Villareal, Bayawan City, Negros Oriental",
    "Maninihon, Bayawan City, Negros Oriental",
    "Minaba, Bayawan City, Negros Oriental",
    "Nangka, Bayawan City, Negros Oriental",
    "Narra, Bayawan City, Negros Oriental",
    "Pagatban, Bayawan City, Negros Oriental",
    "Poblacion, Bayawan City, Negros Oriental",
    "San Isidro, Bayawan City, Negros Oriental",
    "Suba (Poblacion), Bayawan City, Negros Oriental",
    "Tinago (Poblacion), Bayawan City, Negros Oriental",
    "Ubos (Poblacion), Bayawan City, Negros Oriental"
  ];

  const addressField  = $("id_address");
  const suggestionBox = $("barangay-suggestions");
  let activeIndex = -1;
  let lastMatches = [];
  let debounceTimer;

  function getSuggestions(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return BARANGAYS.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
  }

  function renderSuggestions(matches) {
    lastMatches = matches;
    suggestionBox.innerHTML = "";
    if (!matches.length) { suggestionBox.style.display = "none"; return; }

    matches.forEach((match, i) => {
      const parts    = match.split(",");
      const barangay = parts[0].trim();
      const rest     = parts.slice(1).join(",").trim();

      const item = document.createElement("div");
      item.dataset.idx = i;
      item.innerHTML =
        `<span style="font-weight:600;color:var(--text,#111827);">${barangay}</span>` +
        `<span style="color:var(--muted,#9ca3af);font-size:12px;">, ${rest}</span>`;
      item.style.cssText =
        "padding:9px 14px;cursor:pointer;border-bottom:1px solid #f3f4f6;" +
        "transition:background 0.12s;font-size:13px;line-height:1.5;";

      item.addEventListener("mouseenter", () => { activeIndex = i; highlightItem(); });
      item.addEventListener("mousedown",  (e) => { e.preventDefault(); selectSuggestion(match); });
      suggestionBox.appendChild(item);
    });

    suggestionBox.style.display = "block";
    activeIndex = -1;
  }

  function highlightItem() {
    Array.from(suggestionBox.children).forEach((el, i) => {
      el.style.background = i === activeIndex ? "#f0fdfa" : "";
    });
  }

  function selectSuggestion(val) {
    addressField.value          = val;
    suggestionBox.style.display = "none";
    activeIndex                 = -1;
    addressField.focus();
  }

  addressField?.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderSuggestions(getSuggestions(this.value)), 180);
  });

  addressField?.addEventListener("keydown", function (e) {
    const items = Array.from(suggestionBox.children);
    if (!items.length || suggestionBox.style.display === "none") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      highlightItem();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlightItem();
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (lastMatches[activeIndex]) selectSuggestion(lastMatches[activeIndex]);
    } else if (e.key === "Escape") {
      suggestionBox.style.display = "none";
    }
  });

  addressField?.addEventListener("blur", () => {
    setTimeout(() => { suggestionBox.style.display = "none"; }, 150);
  });

  document.addEventListener("click", (e) => {
    if (!addressField?.contains(e.target) && !suggestionBox?.contains(e.target)) {
      suggestionBox.style.display = "none";
    }
  });

})();