// apps/administrator/static/administrator/js/analytics-export.js
// Generates a proper formatted HTML report (Print/PDF) and structured Excel export.
// Data is read from window.BMAKB_DATA (populated by analytics.js).

(function () {
  'use strict';

  // ── Dropdown toggle ──────────────────────────────────────
  const caretBtn = document.getElementById('exportCaretBtn');
  const dropdown = document.getElementById('exportDropdown');

  if (caretBtn && dropdown) {
    caretBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });
  }

  // ── Toast helper ─────────────────────────────────────────
  function showToast(msg) {
    const toast    = document.getElementById('exportToast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // ── Main export dispatcher ────────────────────────────────
  window.exportReport = function (type) {
    if (dropdown) dropdown.classList.remove('open');
    if      (type === 'print')   triggerPrint();
    else if (type === 'pdf')     triggerPDF();
    else if (type === 'viewpdf') triggerViewPDF();
  };

  // ── Cumulative sum helper ─────────────────────────────────
  function cumsum(arr) {
    return (arr || []).reduce((acc, val, i) => {
      acc.push(+((acc[i - 1] || 0) + val).toFixed(2));
      return acc;
    }, []);
  }

  // ── Currency formatter ────────────────────────────────────
  function peso(val) {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Number formatter ─────────────────────────────────────
  function num(val) {
    return Number(val || 0).toLocaleString('en-PH');
  }

  // ── Build the full HTML report document ──────────────────
  function buildReportHTML() {
    const D    = window.BMAKB_DATA || {};
    const now  = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // Compute summary totals
    const totalRevenue      = (D.revenueData      || []).reduce((a, b) => a + (+b || 0), 0);
    const totalCBU          = (D.cbuData           || []).reduce((a, b) => a + (+b || 0), 0);
    const totalSubscription = (D.subscriptionData  || []).reduce((a, b) => a + (+b || 0), 0);
    const totalInitialPaidUp= (D.initialPaidUpData || []).reduce((a, b) => a + (+b || 0), 0);
    const totalSavings      = (D.savingsData       || []).reduce((a, b) => a + (+b || 0), 0);
    const totalMembers      = (D.genderValues      || []).reduce((a, b) => a + (+b || 0), 0);

    // ── Section builders ─────────────────────────────────────

    // Generic two-column summary table (label → value)
    function summaryTable(rows) {
      if (!rows.length) return '<p class="no-data">No data available.</p>';
      return `
        <table class="summary-table">
          <tbody>
            ${rows.map(([label, value, cls]) =>
              `<tr><td class="label-col">${label}</td><td class="value-col ${cls || ''}">${value}</td></tr>`
            ).join('')}
          </tbody>
        </table>`;
    }

    // Generic data table with thead + tbody
    function dataTable(headers, rows, opts = {}) {
      if (!rows || !rows.length) return '<p class="no-data">No data available.</p>';
      return `
        <table class="data-table ${opts.cls || ''}">
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                ${row.map((cell, ci) => `<td class="${ci > 0 ? 'num-col' : ''}">${cell}</td>`).join('')}
              </tr>`
            ).join('')}
          </tbody>
        </table>`;
    }

    // Inline bar using CSS width
    function miniBar(value, max, color) {
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      return `<span class="mini-bar-wrap">
        <span class="mini-bar" style="width:${pct.toFixed(1)}%;background:${color};"></span>
        <span class="mini-bar-val">${num(value)}</span>
      </span>`;
    }

    // ── 1. MEMBERSHIP TREND ──────────────────────────────────
    const memberRows = (D.monthlyLabels || []).map((lbl, i) => [
      lbl,
      num(D.monthlyData[i] || 0),
    ]);

    // ── 2. MEMBERSHIP TYPE ───────────────────────────────────
    const typeTotal = (D.typeValues || []).reduce((a, b) => a + (+b || 0), 0);
    const typeRows  = (D.typeLabels || []).map((lbl, i) => {
      const v   = D.typeValues[i] || 0;
      const pct = typeTotal > 0 ? ((v / typeTotal) * 100).toFixed(1) : '0.0';
      return [lbl, num(v), pct + '%'];
    });

    // ── 3. GENDER BREAKDOWN ──────────────────────────────────
    const genderTotal = (D.genderValues || []).reduce((a, b) => a + (+b || 0), 0);
    const genderRows  = (D.genderLabels || []).map((lbl, i) => {
      const v   = D.genderValues[i] || 0;
      const pct = genderTotal > 0 ? ((v / genderTotal) * 100).toFixed(1) : '0.0';
      return [lbl, num(v), pct + '%'];
    });

    // ── 4. BARANGAY ──────────────────────────────────────────
    const bMax = Math.max(...(D.barangayData || [0]));
    const barangayRows = (D.barangayLabels || []).map((lbl, i) => {
      const total  = D.barangayData[i]   || 0;
      const male   = D.barangayMale[i]   || 0;
      const female = D.barangayFemale[i] || 0;
      const other  = Math.max(0, total - male - female);
      return [lbl, miniBar(total, bMax, '#1e293b'), num(male), num(female), num(other)];
    });

    // ── 5. REVENUE ───────────────────────────────────────────
    const revenueRows = (D.revenueLabels || []).map((lbl, i) => [
      lbl,
      peso(D.revenueData[i] || 0),
    ]);

    // ── 6. CBU ───────────────────────────────────────────────
    const cbuCum  = cumsum(D.cbuData || []);
    const cbuRows = (D.cbuLabels || []).map((lbl, i) => [
      lbl,
      peso(D.cbuData[i]    || 0),
      peso(cbuCum[i]       || 0),
    ]);

    // ── 7. SUBSCRIPTION ──────────────────────────────────────
    const subRows = (D.subscriptionLabels || []).map((lbl, i) => [
      lbl,
      peso(D.subscriptionData[i] || 0),
    ]);

    // ── 8. INITIAL PAID-UP ───────────────────────────────────
    const ipRows = (D.initialPaidUpLabels || []).map((lbl, i) => [
      lbl,
      peso(D.initialPaidUpData[i] || 0),
    ]);

    // ── 9. SAVINGS ───────────────────────────────────────────
    const savCum  = cumsum(D.savingsData || []);
    const savRows = (D.savingsLabels || []).map((lbl, i) => [
      lbl,
      peso(D.savingsData[i] || 0),
      peso(savCum[i]        || 0),
    ]);

    // ── 10. ACTIVE vs INACTIVE ───────────────────────────────
    const statusRows = (D.statusLabels || []).map((lbl, i) => [
      lbl,
      num(D.statusActive[i]   || 0),
      num(D.statusInactive[i] || 0),
    ]);

    // ── Assemble HTML ────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BMAKB Analytics Report — ${now}</title>
  <style>
    /* ── Reset & Base ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      padding: 0;
    }

    /* ── Report Wrapper ───────────────────────────────── */
    .report-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 36px 48px;
    }

    /* ── Header ───────────────────────────────────────── */
    .report-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 3px solid #1e293b;
      margin-bottom: 28px;
    }
    .report-header .org-block .org-name {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: #1e293b;
    }
    .report-header .org-block .org-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      font-family: sans-serif;
    }
    .report-header .meta-block {
      text-align: right;
      font-size: 11px;
      color: #475569;
      font-family: sans-serif;
      line-height: 1.7;
    }
    .report-header .meta-block strong {
      color: #1e293b;
    }

    /* ── Summary Cards Row ────────────────────────────── */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 32px;
    }
    .s-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .s-card .s-label {
      font-size: 10px;
      font-family: sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .s-card .s-value {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
    .s-card .s-value.money { font-size: 14px; color: #1d6a5b; }
    .s-card .s-sub {
      font-size: 10px;
      font-family: sans-serif;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* ── Section ──────────────────────────────────────── */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #1e293b;
      padding: 6px 0 7px;
      border-bottom: 2px solid #1e293b;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    /* ── Data Table ───────────────────────────────────── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .data-table th {
      background: #1e293b;
      color: #f8fafc;
      font-family: sans-serif;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 7px 10px;
      text-align: left;
    }
    .data-table th.num-col,
    .data-table td.num-col { text-align: right; }
    .data-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .data-table tr.even td { background: #fff; }
    .data-table tr.odd  td { background: #f8fafc; }
    .data-table tr:last-child td { border-bottom: 2px solid #e2e8f0; }
    .data-table tfoot td {
      font-weight: 700;
      background: #f1f5f9 !important;
      border-top: 2px solid #cbd5e1;
      padding: 7px 10px;
    }

    /* ── Summary Table ────────────────────────────────── */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .summary-table td { padding: 5px 10px; border-bottom: 1px solid #f1f5f9; }
    .summary-table .label-col { color: #64748b; font-family: sans-serif; font-size: 11px; width: 55%; }
    .summary-table .value-col { font-weight: 600; color: #1e293b; text-align: right; }
    .summary-table .value-col.green { color: #1d6a5b; }
    .summary-table .value-col.red   { color: #dc2626; }

    /* ── Mini Bar ─────────────────────────────────────── */
    .mini-bar-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mini-bar {
      display: inline-block;
      height: 10px;
      border-radius: 2px;
      min-width: 2px;
      transition: width 0s;
    }
    .mini-bar-val {
      font-family: sans-serif;
      font-size: 11px;
      color: #475569;
      white-space: nowrap;
    }

    /* ── Two-column layout ────────────────────────────── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .two-col .section { margin-bottom: 0; }

    /* ── No data ──────────────────────────────────────── */
    .no-data {
      color: #94a3b8;
      font-family: sans-serif;
      font-size: 11px;
      padding: 14px 0;
      text-align: center;
    }

    /* ── Footer ───────────────────────────────────────── */
    .report-footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      font-family: sans-serif;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }

    /* ── Print ────────────────────────────────────────── */
    @media print {
      body { padding: 0; }
      .report-page { padding: 0; max-width: 100%; }
      .section { page-break-inside: avoid; break-inside: avoid; }
      .two-col  { page-break-inside: avoid; break-inside: avoid; }
      @page { margin: 16mm 14mm; size: A4; }
    }
  </style>
</head>
<body>
<div class="report-page">

  <!-- ── Report Header ─────────────────────────────────── -->
  <div class="report-header">
    <div class="org-block">
      <div class="org-name">BMAKB</div>
      <div class="org-sub">Analytics Report — Membership &amp; Financial Dashboard</div>
    </div>
    <div class="meta-block">
      Generated: <strong>${now}</strong><br>
      Total Members: <strong>${num(totalMembers)}</strong><br>
      Report Sections: <strong>10</strong>
    </div>
  </div>

  <!-- ── Summary Cards ─────────────────────────────────── -->
  <div class="summary-cards">
    <div class="s-card">
      <div class="s-label">Total Members</div>
      <div class="s-value">${num(totalMembers)}</div>
      <div class="s-sub">${(D.genderLabels||[]).map((l,i)=>`${l}: ${num(D.genderValues[i]||0)}`).join(' · ')}</div>
    </div>
    <div class="s-card">
      <div class="s-label">Total Revenue</div>
      <div class="s-value money">${peso(totalRevenue)}</div>
      <div class="s-sub">${(D.revenueLabels||[]).length} periods</div>
    </div>
    <div class="s-card">
      <div class="s-label">Total CBU</div>
      <div class="s-value money">${peso(totalCBU)}</div>
      <div class="s-sub">Capital Build-Up</div>
    </div>
    <div class="s-card">
      <div class="s-label">Total Savings</div>
      <div class="s-value money">${peso(totalSavings)}</div>
      <div class="s-sub">Cumulative savings</div>
    </div>
  </div>

  <!-- ── Section 1: Monthly Membership Trend ───────────── -->
  <div class="section">
    <div class="section-title">
      <span class="dot" style="background:#db2777;"></span>
      Monthly Membership Trend
    </div>
    ${dataTable(
      ['Month', 'New Members'],
      memberRows,
    )}
  </div>

  <!-- ── Section 2 & 3: Type + Gender (two-col) ────────── -->
  <div class="two-col">
    <div class="section">
      <div class="section-title">
        <span class="dot" style="background:#7c3aed;"></span>
        Membership Breakdown
      </div>
      ${dataTable(
        ['Type', 'Count', '% Share'],
        typeRows,
      )}
    </div>
    <div class="section">
      <div class="section-title">
        <span class="dot" style="background:#f43f5e;"></span>
        Gender Breakdown
      </div>
      ${dataTable(
        ['Gender', 'Count', '% Share'],
        genderRows,
      )}
    </div>
  </div>

  <!-- ── Section 4: Members by Barangay ────────────────── -->
  <div class="section">
    <div class="section-title">
      <span class="dot" style="background:#10b981;"></span>
      Members by Barangay
    </div>
    ${barangayRows.length
      ? `<table class="data-table">
          <thead>
            <tr>
              <th>Barangay</th>
              <th>Total (bar)</th>
              <th class="num-col">Male</th>
              <th class="num-col">Female</th>
              <th class="num-col">Other</th>
            </tr>
          </thead>
          <tbody>
            ${barangayRows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td class="num-col">${row[2]}</td>
                <td class="num-col">${row[3]}</td>
                <td class="num-col">${row[4]}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>`
      : '<p class="no-data">No barangay data available.</p>'
    }
  </div>

  <!-- ── Section 5: Revenue Trend ──────────────────────── -->
  <div class="section">
    <div class="section-title">
      <span class="dot" style="background:#2563eb;"></span>
      Revenue Trend
    </div>
    ${revenueRows.length
      ? `<table class="data-table">
          <thead><tr><th>Month</th><th class="num-col">Revenue</th></tr></thead>
          <tbody>
            ${revenueRows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                <td>${row[0]}</td><td class="num-col">${row[1]}</td>
              </tr>`
            ).join('')}
          </tbody>
          <tfoot>
            <tr><td>Total</td><td class="num-col">${peso(totalRevenue)}</td></tr>
          </tfoot>
        </table>`
      : '<p class="no-data">No revenue data available.</p>'
    }
  </div>

  <!-- ── Section 6: CBU Accumulation ───────────────────── -->
  <div class="section">
    <div class="section-title">
      <span class="dot" style="background:#6366f1;"></span>
      CBU Accumulation Trend
    </div>
    ${cbuRows.length
      ? `<table class="data-table">
          <thead><tr><th>Month</th><th class="num-col">Monthly CBU</th><th class="num-col">Cumulative CBU</th></tr></thead>
          <tbody>
            ${cbuRows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                <td>${row[0]}</td><td class="num-col">${row[1]}</td><td class="num-col">${row[2]}</td>
              </tr>`
            ).join('')}
          </tbody>
          <tfoot>
            <tr><td>Total</td><td class="num-col">${peso(totalCBU)}</td><td class="num-col">—</td></tr>
          </tfoot>
        </table>`
      : '<p class="no-data">No CBU data available.</p>'
    }
  </div>

  <!-- ── Section 7 & 8: Subscription + Initial Paid-Up ─── -->
  <div class="two-col">
    <div class="section">
      <div class="section-title">
        <span class="dot" style="background:#f43f5e;"></span>
        Subscription Trend
      </div>
      ${subRows.length
        ? `<table class="data-table">
            <thead><tr><th>Month</th><th class="num-col">Amount</th></tr></thead>
            <tbody>
              ${subRows.map((row, ri) =>
                `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                  <td>${row[0]}</td><td class="num-col">${row[1]}</td>
                </tr>`
              ).join('')}
            </tbody>
            <tfoot>
              <tr><td>Total</td><td class="num-col">${peso(totalSubscription)}</td></tr>
            </tfoot>
          </table>`
        : '<p class="no-data">No subscription data yet.</p>'
      }
    </div>
    <div class="section">
      <div class="section-title">
        <span class="dot" style="background:#0ea5e9;"></span>
        Initial Paid-Up Trend
      </div>
      ${ipRows.length
        ? `<table class="data-table">
            <thead><tr><th>Month</th><th class="num-col">Amount</th></tr></thead>
            <tbody>
              ${ipRows.map((row, ri) =>
                `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                  <td>${row[0]}</td><td class="num-col">${row[1]}</td>
                </tr>`
              ).join('')}
            </tbody>
            <tfoot>
              <tr><td>Total</td><td class="num-col">${peso(totalInitialPaidUp)}</td></tr>
            </tfoot>
          </table>`
        : '<p class="no-data">No initial paid-up data yet.</p>'
      }
    </div>
  </div>

  <!-- ── Section 9: Savings Trend ──────────────────────── -->
  <div class="section">
    <div class="section-title">
      <span class="dot" style="background:#14b8a6;"></span>
      Savings Trend
    </div>
    ${savRows.length
      ? `<table class="data-table">
          <thead><tr><th>Month</th><th class="num-col">Monthly Savings</th><th class="num-col">Cumulative Savings</th></tr></thead>
          <tbody>
            ${savRows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                <td>${row[0]}</td><td class="num-col">${row[1]}</td><td class="num-col">${row[2]}</td>
              </tr>`
            ).join('')}
          </tbody>
          <tfoot>
            <tr><td>Total</td><td class="num-col">${peso(totalSavings)}</td><td class="num-col">—</td></tr>
          </tfoot>
        </table>`
      : '<p class="no-data">No savings data available.</p>'
    }
  </div>

  <!-- ── Section 10: Active vs Inactive Members ────────── -->
  <div class="section">
    <div class="section-title">
      <span class="dot" style="background:#10b981;"></span>
      Active vs Inactive Members
    </div>
    ${statusRows.length
      ? `<table class="data-table">
          <thead><tr><th>Month</th><th class="num-col">Active</th><th class="num-col">Inactive</th></tr></thead>
          <tbody>
            ${statusRows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                <td>${row[0]}</td>
                <td class="num-col" style="color:#1d6a5b;font-weight:600;">${row[1]}</td>
                <td class="num-col" style="color:#dc2626;">${row[2]}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>`
      : '<p class="no-data">No status data available.</p>'
    }
  </div>

  <!-- ── Footer ─────────────────────────────────────────── -->
  <div class="report-footer">
    <span>BMAKB Analytics Report</span>
    <span>Generated: ${now}</span>
  </div>

</div>
</body>
</html>`;
  }

  // ── Shared: inject report into hidden iframe and print ───
  function printViaIframe(onAfter) {
    const html = buildReportHTML();

    // Remove any previous iframe
    const old = document.getElementById('_bmakb_print_frame');
    if (old) old.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '_bmakb_print_frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        if (typeof onAfter === 'function') onAfter();
      }, 600);
    };
  }

  // ── Print (no new tab) ───────────────────────────────────
  function triggerPrint() {
    printViaIframe();
  }

  // ── Save as PDF (print dialog → Save as PDF) ─────────────
  function triggerPDF() {
    showToast('Opening print dialog — select "Save as PDF"…');
    printViaIframe(() => {
      setTimeout(() => showToast('Use "Save as PDF" in the print dialog.'), 800);
    });
  }

  // ── View PDF (open in new tab for reading) ────────────────
  function triggerViewPDF() {
    const html = buildReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

})();