// apps/administrator/static/administrator/js/analytics-export.js
// "Save as PDF" now downloads a real PDF from the Django backend.
// "Print Report" and "View PDF" still use the client-side HTML report.

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
    else if (type === 'pdf')     triggerPDF();        // ← real PDF download now
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
    return '₱' + Number(val || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ── Number formatter ─────────────────────────────────────
  function num(val) {
    return Number(val || 0).toLocaleString('en-PH');
  }

  // ─────────────────────────────────────────────────────────
  // ── REAL PDF DOWNLOAD (Django backend via WeasyPrint) ─────
  // ─────────────────────────────────────────────────────────
  function triggerPDF() {
    showToast('Generating PDF…');

    // Point this to your Django URL — update if your url name differs
    const pdfUrl = window.ANALYTICS_PDF_URL || '/admin-panel/analytics/export-pdf/';

    fetch(pdfUrl, {
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Server error ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        // Build a timestamped filename
        const now  = new Date();
        const ts   = now.toISOString().slice(0, 10).replace(/-/g, '');
        const name = `BMAKB_Analytics_${ts}.pdf`;

        // Trigger browser download
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        showToast('PDF downloaded successfully!');
      })
      .catch(function (err) {
        console.error('PDF export failed:', err);
        showToast('PDF failed — falling back to print…');
        // Graceful fallback: open print dialog if server fails
        printViaIframe();
      });
  }

  // ─────────────────────────────────────────────────────────
  // ── Client-side HTML report builder (used by Print + View)
  // ─────────────────────────────────────────────────────────
  function buildReportHTML() {
    const D   = window.BMAKB_DATA || {};
    const now = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const totalRevenue       = (D.revenueData      || []).reduce((a, b) => a + (+b || 0), 0);
    const totalCBU           = (D.cbuData           || []).reduce((a, b) => a + (+b || 0), 0);
    const totalSubscription  = (D.subscriptionData  || []).reduce((a, b) => a + (+b || 0), 0);
    const totalInitialPaidUp = (D.initialPaidUpData || []).reduce((a, b) => a + (+b || 0), 0);
    const totalSavings       = (D.savingsData       || []).reduce((a, b) => a + (+b || 0), 0);
    const totalMembers       = (D.genderValues      || []).reduce((a, b) => a + (+b || 0), 0);

    function dataTable(headers, rows, opts = {}) {
      if (!rows || !rows.length) return '<p class="no-data">No data available.</p>';
      return `
        <table class="data-table ${opts.cls || ''}">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map((row, ri) =>
              `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">
                ${row.map((cell, ci) =>
                  `<td class="${ci > 0 ? 'num-col' : ''}">${cell}</td>`
                ).join('')}
              </tr>`
            ).join('')}
          </tbody>
        </table>`;
    }

    function miniBar(value, max, color) {
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      return `<span class="mini-bar-wrap">
        <span class="mini-bar" style="width:${pct.toFixed(1)}%;background:${color};"></span>
        <span class="mini-bar-val">${num(value)}</span>
      </span>`;
    }

    const memberRows   = (D.monthlyLabels   || []).map((lbl, i) => [lbl, num(D.monthlyData[i]  || 0)]);
    const typeTotal    = (D.typeValues  || []).reduce((a, b) => a + (+b || 0), 0);
    const typeRows     = (D.typeLabels  || []).map((l, i) => [l, num(D.typeValues[i]||0), typeTotal > 0 ? ((D.typeValues[i]||0)/typeTotal*100).toFixed(1)+'%' : '0.0%']);
    const gTotal       = (D.genderValues|| []).reduce((a, b) => a + (+b || 0), 0);
    const genderRows   = (D.genderLabels|| []).map((l, i) => [l, num(D.genderValues[i]||0), gTotal > 0 ? ((D.genderValues[i]||0)/gTotal*100).toFixed(1)+'%' : '0.0%']);
    const bMax         = Math.max(...(D.barangayData || [0]));
    const barangayRows = (D.barangayLabels || []).map((lbl, i) => [
      lbl,
      miniBar(D.barangayData[i]||0, bMax, '#1e293b'),
      num(D.barangayMale[i]||0),
      num(D.barangayFemale[i]||0),
      num(Math.max(0, (D.barangayData[i]||0) - (D.barangayMale[i]||0) - (D.barangayFemale[i]||0))),
    ]);
    const revenueRows  = (D.revenueLabels  || []).map((l, i) => [l, peso(D.revenueData[i]||0)]);
    const cbuCum       = cumsum(D.cbuData  || []);
    const cbuRows      = (D.cbuLabels     || []).map((l, i) => [l, peso(D.cbuData[i]||0), peso(cbuCum[i]||0)]);
    const subRows      = (D.subscriptionLabels   || []).map((l, i) => [l, peso(D.subscriptionData[i]||0)]);
    const ipRows       = (D.initialPaidUpLabels  || []).map((l, i) => [l, peso(D.initialPaidUpData[i]||0)]);
    const savCum       = cumsum(D.savingsData || []);
    const savRows      = (D.savingsLabels  || []).map((l, i) => [l, peso(D.savingsData[i]||0), peso(savCum[i]||0)]);
    const statusRows   = (D.statusLabels   || []).map((l, i) => [l, num(D.statusActive[i]||0), num(D.statusInactive[i]||0)]);

    // (Styles identical to before — kept in full for standalone printing)
    const css = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Georgia','Times New Roman',serif; font-size: 12px; color: #1e293b; background: #fff; }
      .report-page { max-width: 900px; margin: 0 auto; padding: 32px 36px 48px; }
      .report-header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 16px; border-bottom: 3px solid #1e293b; margin-bottom: 28px; }
      .org-name { font-size: 22px; font-weight: 700; letter-spacing: .01em; color: #1e293b; }
      .org-sub  { font-size: 11px; color: #64748b; margin-top: 3px; font-family: sans-serif; }
      .meta-block { text-align: right; font-size: 11px; color: #475569; font-family: sans-serif; line-height: 1.7; }
      .meta-block strong { color: #1e293b; }
      .summary-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 32px; }
      .s-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
      .s-label { font-size: 10px; font-family: sans-serif; text-transform: uppercase; letter-spacing: .07em; color: #64748b; margin-bottom: 4px; }
      .s-value { font-size: 18px; font-weight: 700; color: #1e293b; }
      .s-value.money { font-size: 14px; color: #1d6a5b; }
      .s-sub { font-size: 10px; font-family: sans-serif; color: #94a3b8; margin-top: 2px; }
      .section { margin-bottom: 30px; page-break-inside: avoid; break-inside: avoid; }
      .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #1e293b; padding: 6px 0 7px; border-bottom: 2px solid #1e293b; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
      .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
      .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .data-table th { background: #1e293b; color: #f8fafc; font-family: sans-serif; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 7px 10px; text-align: left; }
      .data-table th.num-col, .data-table td.num-col { text-align: right; }
      .data-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
      .data-table tr.even td { background: #fff; }
      .data-table tr.odd  td { background: #f8fafc; }
      .data-table tr:last-child td { border-bottom: 2px solid #e2e8f0; }
      .data-table tfoot td { font-weight: 700; background: #f1f5f9 !important; border-top: 2px solid #cbd5e1; padding: 7px 10px; }
      .mini-bar-wrap { display: flex; align-items: center; gap: 6px; }
      .mini-bar { display: inline-block; height: 10px; border-radius: 2px; min-width: 2px; }
      .mini-bar-val { font-family: sans-serif; font-size: 11px; color: #475569; white-space: nowrap; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
      .two-col .section { margin-bottom: 0; }
      .no-data { color: #94a3b8; font-family: sans-serif; font-size: 11px; padding: 14px 0; text-align: center; }
      .report-footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; font-family: sans-serif; color: #94a3b8; display: flex; justify-content: space-between; }
      @media print { body { padding:0; } .report-page { padding:0; max-width:100%; } .section,.two-col { page-break-inside:avoid; break-inside:avoid; } @page { margin:16mm 14mm; size:A4; } }
    `;

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>BMAKB Analytics Report</title><style>${css}</style></head>
<body><div class="report-page">
  <div class="report-header">
    <div><div class="org-name">BMAKB</div><div class="org-sub">Analytics Report — Membership &amp; Financial Dashboard</div></div>
    <div class="meta-block">Generated: <strong>${now}</strong><br>Total Members: <strong>${num(totalMembers)}</strong></div>
  </div>
  <div class="summary-cards">
    <div class="s-card"><div class="s-label">Total Members</div><div class="s-value">${num(totalMembers)}</div><div class="s-sub">${(D.genderLabels||[]).map((l,i)=>`${l}: ${num(D.genderValues[i]||0)}`).join(' · ')}</div></div>
    <div class="s-card"><div class="s-label">Total Revenue</div><div class="s-value money">${peso(totalRevenue)}</div><div class="s-sub">${(D.revenueLabels||[]).length} periods</div></div>
    <div class="s-card"><div class="s-label">Total CBU</div><div class="s-value money">${peso(totalCBU)}</div><div class="s-sub">Capital Build-Up</div></div>
    <div class="s-card"><div class="s-label">Total Savings</div><div class="s-value money">${peso(totalSavings)}</div><div class="s-sub">Cumulative savings</div></div>
  </div>
  <div class="section"><div class="section-title"><span class="dot" style="background:#db2777;"></span>Monthly Membership Trend</div>${dataTable(['Month','New Members'],memberRows)}</div>
  <div class="two-col">
    <div class="section"><div class="section-title"><span class="dot" style="background:#7c3aed;"></span>Membership Breakdown</div>${dataTable(['Type','Count','% Share'],typeRows)}</div>
    <div class="section"><div class="section-title"><span class="dot" style="background:#f43f5e;"></span>Gender Breakdown</div>${dataTable(['Gender','Count','% Share'],genderRows)}</div>
  </div>
  <div class="section"><div class="section-title"><span class="dot" style="background:#10b981;"></span>Members by Barangay</div>
    ${barangayRows.length ? `<table class="data-table"><thead><tr><th>Barangay</th><th>Total</th><th class="num-col">Male</th><th class="num-col">Female</th><th class="num-col">Other</th></tr></thead><tbody>${barangayRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td>${r[1]}</td><td class="num-col">${r[2]}</td><td class="num-col">${r[3]}</td><td class="num-col">${r[4]}</td></tr>`).join('')}</tbody></table>` : '<p class="no-data">No barangay data available.</p>'}
  </div>
  <div class="section"><div class="section-title"><span class="dot" style="background:#2563eb;"></span>Revenue Trend</div>
    ${revenueRows.length ? `<table class="data-table"><thead><tr><th>Month</th><th class="num-col">Revenue</th></tr></thead><tbody>${revenueRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td class="num-col">${r[1]}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num-col">${peso(totalRevenue)}</td></tr></tfoot></table>` : '<p class="no-data">No revenue data.</p>'}
  </div>
  <div class="section"><div class="section-title"><span class="dot" style="background:#6366f1;"></span>CBU Accumulation Trend</div>
    ${cbuRows.length ? `<table class="data-table"><thead><tr><th>Month</th><th class="num-col">Monthly CBU</th><th class="num-col">Cumulative CBU</th></tr></thead><tbody>${cbuRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td class="num-col">${r[1]}</td><td class="num-col">${r[2]}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num-col">${peso(totalCBU)}</td><td class="num-col">—</td></tr></tfoot></table>` : '<p class="no-data">No CBU data.</p>'}
  </div>
  <div class="two-col">
    <div class="section"><div class="section-title"><span class="dot" style="background:#f43f5e;"></span>Subscription Trend</div>
      ${subRows.length ? `<table class="data-table"><thead><tr><th>Month</th><th class="num-col">Amount</th></tr></thead><tbody>${subRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td class="num-col">${r[1]}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num-col">${peso(totalSubscription)}</td></tr></tfoot></table>` : '<p class="no-data">No data.</p>'}
    </div>
    <div class="section"><div class="section-title"><span class="dot" style="background:#0ea5e9;"></span>Initial Paid-Up Trend</div>
      ${ipRows.length ? `<table class="data-table"><thead><tr><th>Month</th><th class="num-col">Amount</th></tr></thead><tbody>${ipRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td class="num-col">${r[1]}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num-col">${peso(totalInitialPaidUp)}</td></tr></tfoot></table>` : '<p class="no-data">No data.</p>'}
    </div>
  </div>
  <div class="section"><div class="section-title"><span class="dot" style="background:#14b8a6;"></span>Savings Trend</div>
    ${savRows.length ? `<table class="data-table"><thead><tr><th>Month</th><th class="num-col">Monthly Savings</th><th class="num-col">Cumulative</th></tr></thead><tbody>${savRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td class="num-col">${r[1]}</td><td class="num-col">${r[2]}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num-col">${peso(totalSavings)}</td><td class="num-col">—</td></tr></tfoot></table>` : '<p class="no-data">No data.</p>'}
  </div>
  <div class="section"><div class="section-title"><span class="dot" style="background:#10b981;"></span>Active vs Inactive Members</div>
    ${statusRows.length ? `<table class="data-table"><thead><tr><th>Month</th><th class="num-col">Active</th><th class="num-col">Inactive</th></tr></thead><tbody>${statusRows.map((r,ri)=>`<tr class="${ri%2===0?'even':'odd'}"><td>${r[0]}</td><td class="num-col" style="color:#1d6a5b;font-weight:600;">${r[1]}</td><td class="num-col" style="color:#dc2626;">${r[2]}</td></tr>`).join('')}</tbody></table>` : '<p class="no-data">No status data.</p>'}
  </div>
  <div class="report-footer"><span>BMAKB Analytics Report</span><span>Generated: ${now}</span></div>
</div></body></html>`;
  }

  // ── Print via hidden iframe ───────────────────────────────
  function printViaIframe(onAfter) {
    const html = buildReportHTML();
    const old  = document.getElementById('_bmakb_print_frame');
    if (old) old.remove();
    const iframe = document.createElement('iframe');
    iframe.id = '_bmakb_print_frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    iframe.onload = function () {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        if (typeof onAfter === 'function') onAfter();
      }, 600);
    };
  }

  // ── Print ─────────────────────────────────────────────────
  function triggerPrint() {
    printViaIframe();
  }

  // ── View PDF (open in new tab) ────────────────────────────
  function triggerViewPDF() {
    const html = buildReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

})();