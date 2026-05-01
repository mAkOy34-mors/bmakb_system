// static/membership/js/member_form.js

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */
  const $   = (id) => document.getElementById(id);
  const fmt = (v) =>
    "₱" +
    (isNaN(v)
      ? "0.00"
      : parseFloat(v).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }));

  /* ─────────────────────────────────────────────
     FIELD REFERENCES
  ───────────────────────────────────────────── */
  const dobInput   = $("id_date_of_birth");
  const ageDisplay = $("age-display");
  const subInput   = $("id_subscription");
  const conInput   = $("id_con");
  const cbuDisplay = $("cbu-balance-display");
  const cbuHint    = $("cbu-balance-hint");

  /* ─────────────────────────────────────────────
     1. LIVE AGE COMPUTATION
        Mirrors the logic in model.save()
  ───────────────────────────────────────────── */
  function computeAge(dobValue) {
    if (!dobValue) return null;
    const dob = new Date(dobValue);
    if (isNaN(dob)) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const notYetHadBirthday =
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
    if (notYetHadBirthday) age--;
    return age >= 0 ? age : null;
  }

  function updateAge() {
    const age = computeAge(dobInput?.value);
    if (ageDisplay) {
      ageDisplay.value = age !== null ? age : "";
      ageDisplay.placeholder = age !== null ? "" : "—";
    }
  }

  dobInput?.addEventListener("change", updateAge);
  dobInput?.addEventListener("input",  updateAge);
  updateAge();

  /* ─────────────────────────────────────────────
     2. CBU BALANCE PREVIEW
        Formula: CBU Balance = Subscription − CBU
        • Positive → outstanding balance (still owes)
        • Zero     → fully paid
        • Negative → CBU exceeds subscription (overpaid)
        Mirrors the logic in model.save()
  ───────────────────────────────────────────── */
  function recalcFinancials() {
    const sub = parseFloat(subInput?.value) || 0;
    const cbu = parseFloat(conInput?.value) || 0;

    const balance = sub - cbu;

    if (sub > 0 || cbu > 0) {
      cbuDisplay.value = balance.toFixed(2);

      if (balance > 0) {
        // Still has an outstanding balance
        cbuDisplay.style.color = "#ef4444";
        cbuHint.innerHTML =
          '<i class="bi bi-exclamation-triangle" style="color:#ef4444"></i> ' +
          '<span style="color:#ef4444;font-weight:500;">Outstanding balance of ' +
          fmt(balance) + ' remaining.</span>';
      } else if (balance === 0) {
        // Fully paid
        cbuDisplay.style.color = "var(--teal, #14b8a6)";
        cbuHint.innerHTML =
          '<i class="bi bi-check-circle" style="color:var(--teal,#14b8a6)"></i> ' +
          '<span style="color:var(--teal,#14b8a6);font-weight:500;">Fully paid — CBU covers the subscription.</span>';
      } else {
        // CBU exceeds subscription (overpaid)
        cbuDisplay.style.color = "var(--teal, #14b8a6)";
        cbuHint.innerHTML =
          '<i class="bi bi-check-circle" style="color:var(--teal,#14b8a6)"></i> ' +
          '<span style="color:var(--teal,#14b8a6);font-weight:500;">Overpaid — CBU exceeds subscription by ' +
          fmt(Math.abs(balance)) + '.</span>';
      }
    } else {
      cbuDisplay.value = "0.00";
      cbuDisplay.style.color = "var(--text)";
      cbuHint.innerHTML = "";
    }
  }

  [subInput, conInput].forEach((el) =>
    el?.addEventListener("input", recalcFinancials)
  );

  recalcFinancials();

  /* ─────────────────────────────────────────────
     3. BARANGAY ADDRESS AUTOCOMPLETE
        Primary city: Bayawan City, Negros Oriental
  ───────────────────────────────────────────── */
  const BARANGAYS = [
    // ── Bayawan City, Negros Oriental ──────────────────────────────
    "Basak, Bayawan City, Negros Oriental",
    "Biñohon, Bayawan City, Negros Oriental",
    "Bunga, Bayawan City, Negros Oriental",
    "Cansumaoy, Bayawan City, Negros Oriental",
    "Cawitan, Bayawan City, Negros Oriental",
    "Consolacion, Bayawan City, Negros Oriental",
    "Danao, Bayawan City, Negros Oriental",
    "Dahile, Bayawan City, Negros Oriental",
    "Inawasan, Bayawan City, Negros Oriental",
    "Kagawasan, Bayawan City, Negros Oriental",
    "Kalumboyan, Bayawan City, Negros Oriental",
    "Lawigan, Bayawan City, Negros Oriental",
    "Mabuhay, Bayawan City, Negros Oriental",
    "Manuel Roxas, Bayawan City, Negros Oriental",
    "Maramara, Bayawan City, Negros Oriental",
    "New Katipunan, Bayawan City, Negros Oriental",
    "Nipit, Bayawan City, Negros Oriental",
    "Nograles, Bayawan City, Negros Oriental",
    "Palaslan, Bayawan City, Negros Oriental",
    "Palinpinon, Bayawan City, Negros Oriental",
    "Poblacion I, Bayawan City, Negros Oriental",
    "Poblacion II, Bayawan City, Negros Oriental",
    "Poblacion III, Bayawan City, Negros Oriental",
    "Salong, Bayawan City, Negros Oriental",
    "San Isidro, Bayawan City, Negros Oriental",
    "San Jose, Bayawan City, Negros Oriental",
    "San Miguel, Bayawan City, Negros Oriental",
    "San Roque, Bayawan City, Negros Oriental",
    "Santa Agueda, Bayawan City, Negros Oriental",
    "Santo Niño, Bayawan City, Negros Oriental",
    "Suba, Bayawan City, Negros Oriental",
    "Tabuan, Bayawan City, Negros Oriental",
    "Tayawan, Bayawan City, Negros Oriental",
    "Tinago, Bayawan City, Negros Oriental",
    "Ubos, Bayawan City, Negros Oriental",
    "Villahermosa, Bayawan City, Negros Oriental",

    // ── Dumaguete City, Negros Oriental ────────────────────────────
    "Bagacay, Dumaguete City, Negros Oriental",
    "Bajumpandan, Dumaguete City, Negros Oriental",
    "Balugo, Dumaguete City, Negros Oriental",
    "Banilad, Dumaguete City, Negros Oriental",
    "Bantayan, Dumaguete City, Negros Oriental",
    "Cadawinonan, Dumaguete City, Negros Oriental",
    "Calindagan, Dumaguete City, Negros Oriental",
    "Camanjac, Dumaguete City, Negros Oriental",
    "Candau-ay, Dumaguete City, Negros Oriental",
    "Daro, Dumaguete City, Negros Oriental",
    "Junob, Dumaguete City, Negros Oriental",
    "Looc, Dumaguete City, Negros Oriental",
    "Motong, Dumaguete City, Negros Oriental",
    "Murcia, Dumaguete City, Negros Oriental",
    "Piapi, Dumaguete City, Negros Oriental",
    "Poblacion No. 1, Dumaguete City, Negros Oriental",
    "Poblacion No. 2, Dumaguete City, Negros Oriental",
    "Poblacion No. 3, Dumaguete City, Negros Oriental",
    "Poblacion No. 4, Dumaguete City, Negros Oriental",
    "Poblacion No. 5, Dumaguete City, Negros Oriental",
    "Poblacion No. 6, Dumaguete City, Negros Oriental",
    "Poblacion No. 7, Dumaguete City, Negros Oriental",
    "Poblacion No. 8, Dumaguete City, Negros Oriental",
    "Pulantubig, Dumaguete City, Negros Oriental",
    "Talay, Dumaguete City, Negros Oriental",
    "Tinago, Dumaguete City, Negros Oriental",
    "Tutulan, Dumaguete City, Negros Oriental",

    // ── Bais City, Negros Oriental ──────────────────────────────────
    "Biñohon, Bais City, Negros Oriental",
    "Cabanlutan, Bais City, Negros Oriental",
    "Calasga-an, Bais City, Negros Oriental",
    "Dangcalan, Bais City, Negros Oriental",
    "La Paz, Bais City, Negros Oriental",
    "Mabunao, Bais City, Negros Oriental",
    "Okiot, Bais City, Negros Oriental",
    "Panala-an, Bais City, Negros Oriental",
    "Poblacion, Bais City, Negros Oriental",
    "Tara, Bais City, Negros Oriental",
    "Zaragosa, Bais City, Negros Oriental",

    // ── Pasig City, Metro Manila ────────────────────────────────────
    "Bagong Ilog, Pasig City, Metro Manila",
    "Bagong Katipunan, Pasig City, Metro Manila",
    "Bambang, Pasig City, Metro Manila",
    "Buting, Pasig City, Metro Manila",
    "Caniogan, Pasig City, Metro Manila",
    "Dela Paz, Pasig City, Metro Manila",
    "Kalawaan, Pasig City, Metro Manila",
    "Kapasigan, Pasig City, Metro Manila",
    "Kapitolyo, Pasig City, Metro Manila",
    "Malinao, Pasig City, Metro Manila",
    "Manggahan, Pasig City, Metro Manila",
    "Maybunga, Pasig City, Metro Manila",
    "Oranbo, Pasig City, Metro Manila",
    "Palatiw, Pasig City, Metro Manila",
    "Pinagbuhatan, Pasig City, Metro Manila",
    "Pineda, Pasig City, Metro Manila",
    "Rosario, Pasig City, Metro Manila",
    "Sagad, Pasig City, Metro Manila",
    "San Antonio, Pasig City, Metro Manila",
    "San Joaquin, Pasig City, Metro Manila",
    "San Jose, Pasig City, Metro Manila",
    "San Miguel, Pasig City, Metro Manila",
    "San Nicolas, Pasig City, Metro Manila",
    "Santa Cruz, Pasig City, Metro Manila",
    "Santa Lucia, Pasig City, Metro Manila",
    "Santa Rosa, Pasig City, Metro Manila",
    "Santo Tomas, Pasig City, Metro Manila",
    "Santolan, Pasig City, Metro Manila",
    "Sumilang, Pasig City, Metro Manila",
    "Ugong, Pasig City, Metro Manila",

    // ── Makati City, Metro Manila ───────────────────────────────────
    "Bel-Air, Makati City, Metro Manila",
    "Cembo, Makati City, Metro Manila",
    "Comembo, Makati City, Metro Manila",
    "East Rembo, Makati City, Metro Manila",
    "Guadalupe Nuevo, Makati City, Metro Manila",
    "Guadalupe Viejo, Makati City, Metro Manila",
    "La Paz, Makati City, Metro Manila",
    "Legazpi Village, Makati City, Metro Manila",
    "Palanan, Makati City, Metro Manila",
    "Pembo, Makati City, Metro Manila",
    "Pinagkaisahan, Makati City, Metro Manila",
    "Pio del Pilar, Makati City, Metro Manila",
    "Pitogo, Makati City, Metro Manila",
    "Poblacion, Makati City, Metro Manila",
    "Rizal, Makati City, Metro Manila",
    "Rockwell, Makati City, Metro Manila",
    "Salcedo Village, Makati City, Metro Manila",
    "San Antonio, Makati City, Metro Manila",
    "San Isidro, Makati City, Metro Manila",
    "San Lorenzo, Makati City, Metro Manila",
    "Santa Cruz, Makati City, Metro Manila",
    "Singkamas, Makati City, Metro Manila",
    "South Cembo, Makati City, Metro Manila",
    "Tejeros, Makati City, Metro Manila",
    "Urdaneta, Makati City, Metro Manila",
    "West Rembo, Makati City, Metro Manila",
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