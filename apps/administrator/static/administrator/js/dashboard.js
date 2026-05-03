/* ──────────────────────────────────────────────────────────────
   dashboard.js  —  Member Modal Logic
   NOTE: Django URL template tags do NOT work in .js files.
   URLs are passed in via window.DASHBOARD_URLS (set in dashboard.html).
   ────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── 1. Parse member data ─────────────────────────────────── */
  const membersRaw = JSON.parse(
    document.getElementById('members-data').textContent || '[]'
  );

  /* ── 2. Month name helper ─────────────────────────────────── */
  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  function currentMonthLabel() {
    const d = new Date();
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ── 3. Filter helpers ────────────────────────────────────── */
  const FILTERS = {
    total:     () => true,
    active:    m => m.is_active,
    inactive:  m => !m.is_active,
    regular:   m => m.type_of_membership === 'regular',
    associate: m => m.type_of_membership === 'associate',
  };

  /* ── 4. DOM refs ──────────────────────────────────────────── */
  const backdrop     = document.getElementById('members-modal');
  const modalIcon    = document.getElementById('modal-icon');
  const modalTitle   = document.getElementById('modal-title');
  const modalSub     = document.getElementById('modal-subtitle');
  const modalSummary = document.getElementById('modal-summary');
  const summaryText  = document.getElementById('modal-summary-text');
  const searchInput  = document.getElementById('modal-search-input');
  const tableBody    = document.getElementById('modal-table-body');
  const emptyState   = document.getElementById('modal-empty');
  const countText    = document.getElementById('modal-count-text');
  const viewAllLink  = document.getElementById('modal-view-all-link');

  let currentRows = [];

  /* ── 5. HTML escape helper ────────────────────────────────── */
  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  /* ── 6. Build a table row ─────────────────────────────────── */
  function buildRow(member) {
    const typeLabel = member.type_of_membership === 'regular' ? 'Regular' : 'Associate';
    const typeClass = member.type_of_membership === 'regular'
      ? 'modal-badge-regular' : 'modal-badge-associate';
    const statLabel = member.is_active ? 'Active' : 'Inactive';
    const statClass = member.is_active ? 'modal-badge-active' : 'modal-badge-inactive';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="acct-badge">${escHtml(member.account_number)}</span></td>
      <td><strong>${escHtml(member.name)}</strong></td>
      <td><span class="modal-badge ${typeClass}">${typeLabel}</span></td>
      <td>${escHtml(member.date_joined)}</td>
      <td><span class="modal-badge ${statClass}">${statLabel}</span></td>
      <td>
        <a href="${escHtml(member.detail_url)}" class="modal-view-btn">
          View <i data-lucide="arrow-right" style="width:12px;height:12px;"></i>
        </a>
      </td>`;
    return tr;
  }

  /* ── 7. Render rows ───────────────────────────────────────── */
  function renderRows(rows) {
    tableBody.innerHTML = '';

    if (!rows.length) {
      emptyState.style.display = 'block';
      countText.textContent = 'No results';
    } else {
      emptyState.style.display = 'none';
      rows.forEach(m => tableBody.appendChild(buildRow(m)));
      countText.textContent = `Showing ${rows.length} member${rows.length !== 1 ? 's' : ''}`;
    }

    // Re-process lucide icons injected into new rows
    if (window.lucide) lucide.createIcons();
  }

  /* ── 8. Live search ───────────────────────────────────────── */
  function applySearch() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { renderRows(currentRows); return; }
    renderRows(currentRows.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.account_number.toLowerCase().includes(q)
    ));
  }

  searchInput.addEventListener('input', applySearch);

  /* ── 9. Open modal ────────────────────────────────────────── */
  function openModal(filter, color, icon, label) {
    currentRows = membersRaw.filter(FILTERS[filter]);

    // Header icon + title
    modalIcon.className = `members-modal-icon ${color}`;
    modalIcon.innerHTML = `<i data-lucide="${icon}" style="width:20px;height:20px;"></i>`;
    modalTitle.textContent = label;
    modalSub.textContent   = `${currentRows.length} member${currentRows.length !== 1 ? 's' : ''} found`;

    // Summary banner
    modalSummary.className = `members-modal-summary ${color}`;
    summaryText.textContent =
      `As of ${currentMonthLabel()}, you have ${currentRows.length} ${label.toLowerCase()}.`;

    // Use window.DASHBOARD_URLS set in dashboard.html — template tags don't work in .js files
    const base = (window.DASHBOARD_URLS && window.DASHBOARD_URLS.memberList) || '/members/';
    const filterParam = filter !== 'total' ? `?filter=${filter}` : '';
    viewAllLink.href = base + filterParam;

    // Reset search & populate table
    searchInput.value = '';
    renderRows(currentRows);

    // Show modal
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Re-init lucide for modal header icons
    if (window.lucide) lucide.createIcons();
  }

  /* ── 10. Close modal ──────────────────────────────────────── */
  function closeModal() {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    searchInput.value = '';
  }

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-close-btn-2').addEventListener('click', closeModal);

  // Close on backdrop click
  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) closeModal();
  });

  /* ── 11. Wire clickable stat cards ───────────────────────── */
  document.querySelectorAll('.stat-card.clickable').forEach(function (card) {
    card.addEventListener('click', function () {
      openModal(
        card.dataset.filter,
        card.dataset.color,
        card.dataset.icon,
        card.dataset.label
      );
    });
  });

})();