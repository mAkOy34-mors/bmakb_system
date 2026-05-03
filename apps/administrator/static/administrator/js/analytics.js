// apps/administrator/static/administrator/js/analytics.js

document.addEventListener('DOMContentLoaded', function () {

  // ── Lucide Icons ─────────────────────────────────────────
  lucide.createIcons();

  // ── Read Data from Canvas Data Attributes ────────────────
  const memberCanvas  = document.getElementById('memberChart');
  const revenueCanvas = document.getElementById('revenueChart');
  const typeCanvas    = document.getElementById('typeChart');

  const monthlyLabels = JSON.parse(memberCanvas.dataset.labels   || '[]');
  const monthlyData   = JSON.parse(memberCanvas.dataset.values   || '[]');
  const revenueLabels = JSON.parse(revenueCanvas.dataset.labels  || '[]');
  const revenueData   = JSON.parse(revenueCanvas.dataset.values  || '[]');
  const typeLabels    = JSON.parse(typeCanvas.dataset.labels     || '["Regular","Associate"]');
  const typeValues    = JSON.parse(typeCanvas.dataset.values     || '[0,0]');

  // ── Academic / Textbook Theme ─────────────────────────────
  const fontFamily  = "'Georgia', 'Times New Roman', serif";
  const gridColor   = 'rgba(0,0,0,0.12)';
  const axisColor   = 'rgba(0,0,0,0.5)';
  const tickColor   = '#333';
  const labelStyle  = { colors: tickColor, fontSize: '11px', fontFamily };

  // Shared axis config — dashed grid lines, serif tick labels
  const sharedXaxis = {
    labels: { style: labelStyle },
    axisBorder: { show: true, color: axisColor },
    axisTicks:  { show: true,  color: axisColor },
  };
  const sharedYaxis = {
    labels: { style: labelStyle },
  };
  const sharedGrid = {
    borderColor: gridColor,
    strokeDashArray: 5,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true  } },
  };
  const tooltipStyle = {
    theme: 'light',
    style: { fontSize: '12px', fontFamily },
  };

  // Palette — flat, distinct academic colors
  const COLORS = {
    amber:   '#e5950a',
    green:   '#1d6a5b',
    blue:    '#2563eb',
    purple:  '#7c3aed',
    red:     '#dc2626',
    teal:    '#0d9488',
    pink:    '#db2777',
    indigo:  '#4f46e5',
    sky:     '#0284c7',
  };

  // ── 1. Area Chart — Monthly Membership Trend ─────────────
  const memberOptions = {
    series: [{ name: 'New Members', data: monthlyData }],
    chart: {
      type: 'area',
      height: 220,
      fontFamily,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: [COLORS.pink],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.2,
        gradientToColors: [COLORS.pink],
        opacityFrom: 0.3,
        opacityTo: 0.02,
      },
    },
    markers: {
      size: 5,
      colors: ['#fff'],
      strokeColors: COLORS.pink,
      strokeWidth: 2,
      shape: 'circle',
      hover: { size: 7 },
    },
    xaxis: {
      categories: monthlyLabels,
      ...sharedXaxis,
      title: {
        text: 'Month',
        style: { color: tickColor, fontSize: '11px', fontFamily },
      },
    },
    yaxis: {
      ...sharedYaxis,
      title: {
        text: 'Frequency',
        style: { color: tickColor, fontSize: '11px', fontFamily },
      },
      labels: {
        style: labelStyle,
        formatter: val => Math.round(val),
      },
    },
    grid: sharedGrid,
    tooltip: {
      ...tooltipStyle,
      y: { formatter: val => val + ' members' },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily,
      fontSize: '12px',
      labels: { colors: tickColor },
    },
    dataLabels: { enabled: false },
  };

  const memberChart = new ApexCharts(
    document.getElementById('memberChart'),
    memberOptions
  );
  memberChart.render();

  // ── 2. Bar Chart — Revenue Trend ─────────────────────────
  const revenueOptions = {
    series: [{ name: 'Revenue', data: revenueData }],
    chart: {
      type: 'bar',
      height: 220,
      fontFamily,
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: [COLORS.blue],
    plotOptions: {
      bar: {
        borderRadius: 0,
        columnWidth: '60%',
      },
    },
    fill: { type: 'solid', opacity: 1 },
    xaxis: {
      categories: revenueLabels,
      ...sharedXaxis,
      title: {
        text: 'Month',
        style: { color: tickColor, fontSize: '11px', fontFamily },
      },
    },
    yaxis: {
      ...sharedYaxis,
      title: {
        text: 'Revenue (₱)',
        style: { color: tickColor, fontSize: '11px', fontFamily },
      },
      labels: {
        style: labelStyle,
        formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
      },
    },
    grid: sharedGrid,
    tooltip: {
      ...tooltipStyle,
      y: { formatter: val => '₱' + val.toLocaleString() },
    },
    dataLabels: { enabled: false },
  };

  const revenueChart = new ApexCharts(
    document.getElementById('revenueChart'),
    revenueOptions
  );
  revenueChart.render();

  // ── 3. Pie Chart — Membership Types ──────────────────────
  // Changed from donut to pie to match the reference image
  const typeOptions = {
    series: typeValues,
    chart: {
      type: 'pie',
      height: 260,
      fontFamily,
      animations: { enabled: false },
    },
    labels: typeLabels,
    colors: [COLORS.green, COLORS.blue, COLORS.amber, COLORS.purple],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontFamily,
      labels: { colors: tickColor },
      markers: { width: 12, height: 12, radius: 2 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    dataLabels: {
      enabled: true,
      formatter: val => val.toFixed(1) + '%',
      style: { fontSize: '11px', fontFamily, fontWeight: '600', colors: ['#fff'] },
      dropShadow: { enabled: false },
    },
    stroke: { width: 2, colors: ['#fff'] },
    tooltip: {
      ...tooltipStyle,
      y: { formatter: val => val + ' members' },
    },
  };

  const typeChart = new ApexCharts(
    document.getElementById('typeChart'),
    typeOptions
  );
  typeChart.render();

  // ── 4. Pie Chart — Gender Breakdown ──────────────────────
  const genderEl = document.getElementById('genderChart');
  if (genderEl) {
    const genderLabels = JSON.parse(genderEl.dataset.labels || '["Male","Female","Other"]');
    const genderValues = JSON.parse(genderEl.dataset.values || '[0,0,0]');

    new ApexCharts(genderEl, {
      series: genderValues,
      chart: {
        type: 'pie',
        height: 260,
        fontFamily,
        animations: { enabled: false },
      },
      labels: genderLabels,
      colors: ['#2563eb', '#db2777', '#888780'],
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily,
        labels: { colors: tickColor },
        markers: { width: 12, height: 12, radius: 2 },
        itemMargin: { horizontal: 10, vertical: 4 },
      },
      dataLabels: {
        enabled: true,
        formatter: val => val.toFixed(1) + '%',
        style: { fontSize: '11px', fontFamily, fontWeight: '600', colors: ['#fff'] },
        dropShadow: { enabled: false },
      },
      stroke: { width: 2, colors: ['#fff'] },
      tooltip: {
        ...tooltipStyle,
        y: { formatter: val => val + ' members' },
      },
    }).render();
  }

  // ── 5. Horizontal Stacked Bar — Members by Barangay ──────
  const barangayEl = document.getElementById('barangayChart');
  if (barangayEl) {
    const bLabels  = JSON.parse(barangayEl.dataset.labels  || '[]');
    const bTotal   = JSON.parse(barangayEl.dataset.values  || '[]');
    const bMale    = JSON.parse(barangayEl.dataset.male    || '[]');
    const bFemale  = JSON.parse(barangayEl.dataset.female  || '[]');

    if (!bLabels.length) {
      barangayEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No barangay data yet.</p>';
    } else {
      const bOther = bTotal.map((t, i) => Math.max(0, t - (bMale[i] || 0) - (bFemale[i] || 0)));
      const chartHeight = Math.max(300, bLabels.length * 38 + 80);

      new ApexCharts(barangayEl, {
        series: [
          { name: 'Male',   data: bMale   },
          { name: 'Female', data: bFemale },
          { name: 'Other',  data: bOther  },
        ],
        chart: {
          type: 'bar',
          height: chartHeight,
          fontFamily,
          stacked: true,
          toolbar: { show: false },
          animations: { enabled: false },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '68%',
            borderRadius: 0,
          },
        },
        colors: ['#2563eb', '#db2777', '#888780'],
        fill: { type: 'solid', opacity: 1 },
        xaxis: {
          categories: bLabels,
          labels: {
            style: labelStyle,
            formatter: val => Math.round(val),
          },
          title: {
            text: 'Number of Members',
            style: { color: tickColor, fontSize: '11px', fontFamily },
          },
          axisBorder: { show: true, color: axisColor },
          axisTicks:  { show: true, color: axisColor },
        },
        yaxis: {
          labels: {
            style: { colors: tickColor, fontSize: '12px', fontFamily },
            maxWidth: 180,
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '12px',
          fontFamily,
          labels: { colors: tickColor },
          markers: { width: 12, height: 12, radius: 2 },
        },
        dataLabels: {
          enabled: true,
          formatter: val => (val > 0 ? val : ''),
          style: { fontSize: '11px', fontFamily, fontWeight: '600', colors: ['#fff'] },
          dropShadow: { enabled: false },
        },
        tooltip: {
          shared: true,
          intersect: false,
          ...tooltipStyle,
          y: { formatter: val => val + ' members' },
        },
        grid: {
          ...sharedGrid,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
        },
      }).render();
    }
  }

  // ── 6. Area Chart — CBU Accumulation Trend ───────────────
  const cbuEl = document.getElementById('cbuChart');
  if (cbuEl) {
    const cbuLabels = JSON.parse(cbuEl.dataset.labels || '[]');
    const cbuValues = JSON.parse(cbuEl.dataset.values || '[]');
    const hasData = cbuLabels.length > 0 && cbuValues.some(v => v > 0);

    if (!hasData) {
      cbuEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No CBU data yet.</p>';
    } else {
      const cbuCumulative = cbuValues.reduce((acc, val, i) => {
        acc.push(+((acc[i - 1] || 0) + val).toFixed(2));
        return acc;
      }, []);

      new ApexCharts(cbuEl, {
        series: [
          { name: 'Monthly CBU',    data: cbuValues     },
          { name: 'Cumulative CBU', data: cbuCumulative },
        ],
        chart: {
          type: 'area',
          height: 240,
          fontFamily,
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: true, easing: 'easeinout', speed: 600 },
        },
        stroke: { curve: 'smooth', width: [2, 3], dashArray: [0, 6] },
        colors: [COLORS.purple, COLORS.indigo],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.2,
            opacityFrom: 0.25,
            opacityTo: 0.02,
          },
        },
        markers: {
          size: 4,
          colors: ['#fff'],
          strokeColors: [COLORS.purple, COLORS.indigo],
          strokeWidth: 2,
          hover: { size: 6 },
        },
        xaxis: {
          categories: cbuLabels,
          ...sharedXaxis,
          title: { text: 'Month', style: { color: tickColor, fontSize: '11px', fontFamily } },
        },
        yaxis: {
          ...sharedYaxis,
          title: { text: 'CBU (₱)', style: { color: tickColor, fontSize: '11px', fontFamily } },
          labels: {
            style: labelStyle,
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: sharedGrid,
        tooltip: {
          shared: true,
          intersect: false,
          ...tooltipStyle,
          y: { formatter: val => '₱' + val.toLocaleString() },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '12px',
          fontFamily,
          labels: { colors: tickColor },
          markers: { width: 12, height: 12, radius: 2 },
        },
        dataLabels: { enabled: false },
      }).render();
    }
  }

  // ── 7. Bar Chart — Subscription Trend ────────────────────
  const subscriptionEl = document.getElementById('subscriptionChart');
  if (subscriptionEl) {
    const subLabels = JSON.parse(subscriptionEl.dataset.labels || '[]');
    const subValues = JSON.parse(subscriptionEl.dataset.values || '[]');

    if (!subLabels.length || !subValues.some(v => v > 0)) {
      subscriptionEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No subscription data yet.</p>';
    } else {
      new ApexCharts(subscriptionEl, {
        series: [{ name: 'Subscription', data: subValues }],
        chart: {
          type: 'bar',
          height: 220,
          fontFamily,
          toolbar: { show: false },
          animations: { enabled: false },
        },
        colors: [COLORS.red],
        plotOptions: { bar: { borderRadius: 0, columnWidth: '60%' } },
        fill: { type: 'solid', opacity: 1 },
        xaxis: {
          categories: subLabels,
          ...sharedXaxis,
          title: { text: 'Month', style: { color: tickColor, fontSize: '11px', fontFamily } },
        },
        yaxis: {
          ...sharedYaxis,
          title: { text: 'Amount (₱)', style: { color: tickColor, fontSize: '11px', fontFamily } },
          labels: {
            style: labelStyle,
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: sharedGrid,
        tooltip: { ...tooltipStyle, y: { formatter: val => '₱' + val.toLocaleString() } },
        dataLabels: { enabled: false },
      }).render();
    }
  }

  // ── 8. Bar Chart — Initial Paid-Up Trend ─────────────────
  const initialPaidUpEl = document.getElementById('initialPaidUpChart');
  if (initialPaidUpEl) {
    const ipLabels = JSON.parse(initialPaidUpEl.dataset.labels || '[]');
    const ipValues = JSON.parse(initialPaidUpEl.dataset.values || '[]');

    if (!ipLabels.length || !ipValues.some(v => v > 0)) {
      initialPaidUpEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No initial paid-up data yet.</p>';
    } else {
      new ApexCharts(initialPaidUpEl, {
        series: [{ name: 'Initial Paid-Up', data: ipValues }],
        chart: {
          type: 'bar',
          height: 220,
          fontFamily,
          toolbar: { show: false },
          animations: { enabled: false },
        },
        colors: [COLORS.sky],
        plotOptions: { bar: { borderRadius: 0, columnWidth: '60%' } },
        fill: { type: 'solid', opacity: 1 },
        xaxis: {
          categories: ipLabels,
          ...sharedXaxis,
          title: { text: 'Month', style: { color: tickColor, fontSize: '11px', fontFamily } },
        },
        yaxis: {
          ...sharedYaxis,
          title: { text: 'Amount (₱)', style: { color: tickColor, fontSize: '11px', fontFamily } },
          labels: {
            style: labelStyle,
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: sharedGrid,
        tooltip: { ...tooltipStyle, y: { formatter: val => '₱' + val.toLocaleString() } },
        dataLabels: { enabled: false },
      }).render();
    }
  }

  // ── 9. Line Chart — Savings Trend ────────────────────────
  const savingsEl = document.getElementById('savingsChart');
  if (savingsEl) {
    const savLabels = JSON.parse(savingsEl.dataset.labels || '[]');
    const savValues = JSON.parse(savingsEl.dataset.values || '[]');
    const savHasData = savLabels.length > 0 && savValues.some(v => v > 0);

    if (!savHasData) {
      savingsEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No savings data yet.</p>';
    } else {
      const savCumulative = savValues.reduce((acc, val, i) => {
        acc.push(+((acc[i - 1] || 0) + val).toFixed(2));
        return acc;
      }, []);

      new ApexCharts(savingsEl, {
        series: [
          { name: 'Monthly Savings',    data: savValues     },
          { name: 'Cumulative Savings', data: savCumulative },
        ],
        chart: {
          type: 'area',
          height: 240,
          fontFamily,
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: true, easing: 'easeinout', speed: 600 },
        },
        stroke: { curve: 'smooth', width: [2, 3], dashArray: [0, 6] },
        colors: [COLORS.teal, COLORS.green],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.2,
            opacityFrom: 0.25,
            opacityTo: 0.02,
          },
        },
        markers: { size: 4, colors: ['#fff'], strokeColors: [COLORS.teal, COLORS.green], strokeWidth: 2, hover: { size: 6 } },
        xaxis: {
          categories: savLabels,
          ...sharedXaxis,
          title: { text: 'Month', style: { color: tickColor, fontSize: '11px', fontFamily } },
        },
        yaxis: {
          ...sharedYaxis,
          title: { text: 'Savings (₱)', style: { color: tickColor, fontSize: '11px', fontFamily } },
          labels: {
            style: labelStyle,
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: sharedGrid,
        tooltip: {
          shared: true,
          intersect: false,
          ...tooltipStyle,
          y: { formatter: val => '₱' + val.toLocaleString() },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '12px',
          fontFamily,
          labels: { colors: tickColor },
          markers: { width: 12, height: 12, radius: 2 },
        },
        dataLabels: { enabled: false },
      }).render();
    }
  }

  // ── 10. Line Chart — Active vs Inactive Members ───────────
  const statusEl = document.getElementById('statusChart');
  if (statusEl) {
    const statusLabels   = JSON.parse(statusEl.dataset.labels   || '[]');
    const statusActive   = JSON.parse(statusEl.dataset.active   || '[]');
    const statusInactive = JSON.parse(statusEl.dataset.inactive || '[]');

    if (!statusLabels.length) {
      statusEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No status data yet.</p>';
    } else {
      new ApexCharts(statusEl, {
        series: [
          { name: 'Active',   data: statusActive   },
          { name: 'Inactive', data: statusInactive },
        ],
        chart: {
          type: 'area',
          height: 260,
          fontFamily,
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { enabled: true, easing: 'easeinout', speed: 600 },
        },
        stroke: { curve: 'smooth', width: [3, 3], dashArray: [0, 6] },
        colors: [COLORS.green, COLORS.red],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.2,
            opacityFrom: 0.25,
            opacityTo: 0.02,
          },
        },
        markers: {
          size: 5,
          colors: ['#fff'],
          strokeColors: [COLORS.green, COLORS.red],
          strokeWidth: 2,
          hover: { size: 7 },
        },
        xaxis: {
          categories: statusLabels,
          ...sharedXaxis,
          title: { text: 'Month', style: { color: tickColor, fontSize: '11px', fontFamily } },
        },
        yaxis: {
          ...sharedYaxis,
          min: 0,
          title: { text: 'Members', style: { color: tickColor, fontSize: '11px', fontFamily } },
          labels: {
            style: labelStyle,
            formatter: val => Math.round(val),
          },
        },
        grid: sharedGrid,
        tooltip: {
          shared: true,
          intersect: false,
          ...tooltipStyle,
          y: { formatter: val => val + ' members' },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '12px',
          fontFamily,
          labels: { colors: tickColor },
          markers: { width: 12, height: 12, radius: 2 },
        },
        dataLabels: {
          enabled: true,
          formatter: val => val > 0 ? val : '',
          style: { fontSize: '11px', fontFamily, fontWeight: '600' },
          background: {
            enabled: true,
            borderRadius: 2,
            borderWidth: 0,
            opacity: 0.85,
          },
          dropShadow: { enabled: false },
        },
      }).render();
    }
  }

  // ── Period Toggle (re-renders member chart) ───────────────
  document.querySelectorAll('#memberToggle .chart-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#memberToggle .chart-toggle')
        .forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const period = this.dataset.period;
      const dailyLabels  = JSON.parse(memberCanvas.dataset.dailyLabels  || '[]');
      const dailyValues  = JSON.parse(memberCanvas.dataset.dailyValues  || '[]');
      const weeklyLabels = JSON.parse(memberCanvas.dataset.weeklyLabels || '[]');
      const weeklyValues = JSON.parse(memberCanvas.dataset.weeklyValues || '[]');

      if (period === 'daily') {
        memberChart.updateOptions({ xaxis: { categories: dailyLabels } });
        memberChart.updateSeries([{ data: dailyValues }]);
      } else if (period === 'weekly') {
        memberChart.updateOptions({ xaxis: { categories: weeklyLabels } });
        memberChart.updateSeries([{ data: weeklyValues }]);
      } else {
        memberChart.updateOptions({ xaxis: { categories: monthlyLabels } });
        memberChart.updateSeries([{ data: monthlyData }]);
      }
    });
  });

});