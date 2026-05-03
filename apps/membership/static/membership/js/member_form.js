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

 // ── 2. LIVE CBU PREVIEW FROM INITIAL PAID-UP ─────────────────────────── //
const paidUpInput   = $("id_initial_paid_up");
const conInput      = $("id_con");
const cbuPreview    = $("cbu-preview");
const cbuPreviewVal = $("cbu-preview-value");

function formatPHP(amount) {
  return "₱" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateCBUPreview() {
  if (!paidUpInput || !conInput) return;
  const paidUp    = parseFloat(paidUpInput.value) || 0;
  const currentCBU = parseFloat(conInput.value) || 0;
  const projected = currentCBU + paidUp;
  if (paidUp > 0 || currentCBU > 0) {
    cbuPreviewVal.textContent = formatPHP(projected);
    cbuPreview.style.display  = "flex";
  } else {
    cbuPreview.style.display  = "none";
  }
}

paidUpInput?.addEventListener("input",  updateCBUPreview);
paidUpInput?.addEventListener("change", updateCBUPreview);
conInput?.addEventListener("input",  updateCBUPreview);   
conInput?.addEventListener("change", updateCBUPreview);

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

  /* ─────────────────────────────────────────────
     4. TRANSACTION MODAL
  ───────────────────────────────────────────── */
  const overlay     = $("txnModalOverlay");
  const openBtn     = $("openTxnModal");
  const closeBtn    = $("closeTxnModal");
  const cancelBtn   = $("txnCancelBtn");
  const typeGrid    = $("txnTypeGrid");
  const typeSelect  = $("txn-type-select");
  const txnForm     = $("txnForm");
  const submitBtn   = $("txnSubmitBtn");
  const spinner     = $("txnSpinner");
  const submitIcon  = $("txnSubmitIcon");
  const submitLabel = $("txnSubmitLabel");

  if (overlay) {
    // Open
    openBtn?.addEventListener("click", () => {
      overlay.classList.add("active");
      if (window.lucide) lucide.createIcons(); // re-render icons inside modal
    });

    // Close helpers
    const closeModal = () => overlay.classList.remove("active");
    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    // Type card selection
    const cards = typeGrid?.querySelectorAll(".txn-type-card") ?? [];
    if (cards.length) cards[0].classList.add("selected");

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        if (typeSelect) typeSelect.value = card.dataset.value;
      });
    });

    // Loading state on submit
    txnForm?.addEventListener("submit", () => {
      if (submitBtn)   submitBtn.disabled = true;
      if (spinner)     spinner.style.display = "block";
      if (submitIcon)  submitIcon.style.display = "none";
      if (submitLabel) submitLabel.textContent = "Saving…";
    });
  }

  /* ─────────────────────────────────────────────
     5. DEACTIVATION / REACTIVATION MODAL
  ───────────────────────────────────────────── */

  // Deactivation Modal Elements
  const deactivateBtn = $("deactivateBtn");
  const deactivationModal = $("deactivationModal");
  const closeDeactivationModal = $("closeDeactivationModal");
  const cancelDeactivation = $("cancelDeactivation");
  const confirmDeactivation = $("confirmDeactivation");
  const reasonSelect = $("deactivationReasonSelect");
  const otherReasonGroup = $("otherReasonGroup");
  const otherReasonInput = $("otherReasonInput");
  const resolutionText = $("resolutionText");

  // Reactivation Modal Elements
  const reactivateBtn = $("reactivateBtn");
  const reactivationModal = $("reactivationModal");
  const closeReactivationModal = $("closeReactivationModal");
  const cancelReactivation = $("cancelReactivation");
  const confirmReactivation = $("confirmReactivation");
  const reactivationNotes = $("reactivationNotes");

  // Hidden fields
  const isActiveField = $("is_active_field");
  const deactivationReasonField = $("deactivation_reason_field");
  const deactivationResolutionField = $("deactivation_resolution_field");
  const memberForm = $("memberForm");

  // Show "Other" input when "Other" is selected
  if (reasonSelect) {
    reasonSelect.addEventListener("change", function() {
      if (this.value === "other") {
        if (otherReasonGroup) otherReasonGroup.style.display = "block";
      } else {
        if (otherReasonGroup) otherReasonGroup.style.display = "none";
        if (otherReasonInput) otherReasonInput.value = "";
      }
    });
  }

  // Open Deactivation Modal
  if (deactivateBtn) {
    deactivateBtn.addEventListener("click", function() {
      if (deactivationModal) {
        deactivationModal.classList.add("active");
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Close Deactivation Modal
  function closeDeactivationModalFunc() {
    if (deactivationModal) deactivationModal.classList.remove("active");
    if (reasonSelect) reasonSelect.value = "";
    if (otherReasonGroup) otherReasonGroup.style.display = "none";
    if (otherReasonInput) otherReasonInput.value = "";
    if (resolutionText) resolutionText.value = "";
  }

  if (closeDeactivationModal) closeDeactivationModal.addEventListener("click", closeDeactivationModalFunc);
  if (cancelDeactivation) cancelDeactivation.addEventListener("click", closeDeactivationModalFunc);

  // Close on backdrop click
  if (deactivationModal) {
    deactivationModal.addEventListener("click", function(e) {
      if (e.target === deactivationModal) closeDeactivationModalFunc();
    });
  }

  // Confirm Deactivation
  if (confirmDeactivation) {
    confirmDeactivation.addEventListener("click", function() {
      let reason = reasonSelect ? reasonSelect.value : "";
      if (!reason) {
        alert("Please select a reason for deactivation");
        return;
      }

      if (reason === "other") {
        reason = otherReasonInput ? otherReasonInput.value.trim() : "";
        if (!reason) {
          alert("Please specify the reason for deactivation");
          return;
        }
      }

      const resolution = resolutionText ? resolutionText.value.trim() : "";

      // Set hidden fields
      if (isActiveField) isActiveField.value = "false";
      if (deactivationReasonField) deactivationReasonField.value = reason;
      if (deactivationResolutionField) deactivationResolutionField.value = resolution;

      // Submit the form
      if (memberForm) memberForm.submit();
    });
  }

  // Open Reactivation Modal
  if (reactivateBtn) {
    reactivateBtn.addEventListener("click", function() {
      if (reactivationModal) {
        reactivationModal.classList.add("active");
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Close Reactivation Modal
  function closeReactivationModalFunc() {
    if (reactivationModal) reactivationModal.classList.remove("active");
    if (reactivationNotes) reactivationNotes.value = "";
  }

  if (closeReactivationModal) closeReactivationModal.addEventListener("click", closeReactivationModalFunc);
  if (cancelReactivation) cancelReactivation.addEventListener("click", closeReactivationModalFunc);

  // Close on backdrop click
  if (reactivationModal) {
    reactivationModal.addEventListener("click", function(e) {
      if (e.target === reactivationModal) closeReactivationModalFunc();
    });
  }

  // Confirm Reactivation
  if (confirmReactivation) {
    confirmReactivation.addEventListener("click", function() {
      const notes = reactivationNotes ? reactivationNotes.value.trim() : "";

      // Set hidden fields
      if (isActiveField) isActiveField.value = "true";

      // You can add notes to a hidden field if needed
      // if (reactivationNotesField) reactivationNotesField.value = notes;

      // Submit the form
      if (memberForm) memberForm.submit();
    });
  }

  // Close modals on Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      if (deactivationModal && deactivationModal.classList.contains("active")) {
        closeDeactivationModalFunc();
      }
      if (reactivationModal && reactivationModal.classList.contains("active")) {
        closeReactivationModalFunc();
      }
    }
  });

})();