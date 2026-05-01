// ── Chart Data (injected from Django via data attributes) ──
const canvas = document.getElementById('memberChart');
const monthlyLabels = JSON.parse(canvas.dataset.labels);
const monthlyData   = JSON.parse(canvas.dataset.values);

const canvas2 = document.getElementById('typeChart');
const revenueLabels = JSON.parse(canvas2.dataset.labels);
const revenueData   = JSON.parse(canvas2.dataset.values);

// ── Shared Chart Defaults ──────────────────────────────────
const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a2e',
      titleColor: '#fff',
      bodyColor: '#d1d5db',
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' },
      beginAtZero: true
    }
  }
};

// ── Member Trend Chart ─────────────────────────────────────
const memberCtx = document.getElementById('memberChart').getContext('2d');
const memberChart = new Chart(memberCtx, {
  type: 'line',
  data: {
    labels: monthlyLabels,
    datasets: [{
      label: 'bookings',
      data: monthlyData,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.08)',
      pointBackgroundColor: '#f59e0b',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: true,
    }]
  },
  options: {
    ...chartDefaults,
    plugins: {
      ...chartDefaults.plugins,
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#f59e0b',
          font: { size: 12 },
          usePointStyle: true,
          pointStyleWidth: 16,
        }
      }
    }
  }
});

// ── Revenue Trend Chart ────────────────────────────────────
const typeCtx = document.getElementById('typeChart').getContext('2d');
const typeChart = new Chart(typeCtx, {
  type: 'line',
  data: {
    labels: revenueLabels,
    datasets: [{
      label: 'revenue',
      data: revenueData,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      pointBackgroundColor: 'transparent',
      pointBorderColor: '#10b981',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: true,
    }]
  },
  options: {
    ...chartDefaults,
    scales: {
      ...chartDefaults.scales,
      y: {
        ...chartDefaults.scales.y,
        ticks: {
          font: { size: 11 }, color: '#9ca3af',
          callback: val => '₱' + (val >= 1000 ? (val/1000).toFixed(0)+'k' : val)
        }
      }
    }
  }
});

// ── Period Toggle ──────────────────────────────────────────
document.querySelectorAll('#memberToggle .chart-toggle').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#memberToggle .chart-toggle')
      .forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── Lucide Icons ───────────────────────────────────────────
lucide.createIcons();