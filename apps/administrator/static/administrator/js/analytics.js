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

  // ── Shared Theme ─────────────────────────────────────────
  const fontFamily = "'DM Sans', sans-serif";
  const mutedColor = '#9ca3af';
  const gridColor  = 'rgba(0,0,0,0.04)';

  const tooltipStyle = {
    theme: 'dark',
    style: { fontSize: '12px', fontFamily },
  };

  // ── 1. Line Chart — Monthly Membership Trend ─────────────
  const memberOptions = {
    series: [{
      name: 'New Members',
      data: monthlyData,
    }],
    chart: {
      type: 'line',
      height: 220,
      fontFamily,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#f59e0b'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: ['#fef3c7'],
        opacityFrom: 0.5,
        opacityTo: 0.05,
      },
    },
    markers: {
      size: 5,
      colors: ['#f59e0b'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 7 },
    },
    xaxis: {
      categories: monthlyLabels,
      labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
      axisBorder: { show: false },
      axisTicks:  { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor, fontSize: '11px', fontFamily },
        formatter: val => Math.round(val),
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      ...tooltipStyle,
      y: { formatter: val => val + ' members' },
    },
    legend: {
      show: true,
      position: 'bottom',
      labels: { colors: '#f59e0b' },
      markers: { fillColors: ['#f59e0b'] },
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
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    colors: ['#1d6a5b'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '50%',
        dataLabels: { position: 'top' },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.2,
        gradientToColors: ['#10b981'],
        opacityFrom: 0.9,
        opacityTo: 0.7,
      },
    },
    xaxis: {
      categories: revenueLabels,
      labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
      axisBorder: { show: false },
      axisTicks:  { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: mutedColor, fontSize: '11px', fontFamily },
        formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
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

  // ── 3. Donut Chart — Membership Types ────────────────────
  const typeOptions = {
    series: typeValues,
    chart: {
      type: 'donut',
      height: 260,
      fontFamily,
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    labels: typeLabels,
    colors: ['#1d6a5b', '#3b82f6', '#f59e0b', '#8b5cf6'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontFamily,
              color: '#1a1a2e',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: "'DM Serif Display', serif",
              color: '#1a1a2e',
              formatter: val => val,
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              fontFamily,
              color: mutedColor,
              formatter: w =>
                w.globals.seriesTotals.reduce((a, b) => a + b, 0),
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontFamily,
      labels: { colors: '#6b7280' },
      markers: { width: 10, height: 10, radius: 3 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    dataLabels: {
      enabled: true,
      formatter: val => val.toFixed(1) + '%',
      style: { fontSize: '11px', fontFamily, fontWeight: '600' },
      dropShadow: { enabled: false },
    },
    stroke: { width: 0 },
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

  // ── 4. Donut Chart — Gender Breakdown ────────────────────
  const genderEl = document.getElementById('genderChart');
  if (genderEl) {
    const genderLabels = JSON.parse(genderEl.dataset.labels || '["Male","Female","Other"]');
    const genderValues = JSON.parse(genderEl.dataset.values || '[0,0,0]');

    const genderOptions = {
      series: genderValues,
      chart: {
        type: 'donut',
        height: 260,
        fontFamily,
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
      },
      labels: genderLabels,
      colors: ['#378ADD', '#D4537E', '#888780'],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '13px',
                fontFamily,
                color: mutedColor,
              },
              value: {
                show: true,
                fontSize: '22px',
                fontFamily: "'DM Serif Display', serif",
                color: '#1a1a2e',
                formatter: val => val,
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '12px',
                fontFamily,
                color: mutedColor,
                formatter: w =>
                  w.globals.seriesTotals.reduce((a, b) => a + b, 0),
              },
            },
          },
        },
      },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily,
        labels: { colors: '#6b7280' },
        markers: { width: 10, height: 10, radius: 3 },
        itemMargin: { horizontal: 10, vertical: 4 },
      },
      dataLabels: {
        enabled: true,
        formatter: val => val.toFixed(1) + '%',
        style: { fontSize: '11px', fontFamily, fontWeight: '600' },
        dropShadow: { enabled: false },
      },
      stroke: { width: 0 },
      tooltip: {
        ...tooltipStyle,
        y: { formatter: val => val + ' members' },
      },
    };

    new ApexCharts(genderEl, genderOptions).render();
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

      const barangayOptions = {
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
          animations: { enabled: true, easing: 'easeinout', speed: 700 },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '68%',
            borderRadius: 4,
            borderRadiusApplication: 'end',
            borderRadiusWhenStacked: 'last',
          },
        },
        colors: ['#378ADD', '#D4537E', '#888780'],
        xaxis: {
          categories: bLabels,
          labels: {
            style: { colors: mutedColor, fontSize: '11px', fontFamily },
            formatter: val => Math.round(val),
          },
          title: {
            text: 'Number of Members',
            style: { color: mutedColor, fontSize: '11px', fontFamily },
          },
        },
        yaxis: {
          labels: {
            style: { colors: '#374151', fontSize: '12px', fontFamily },
            maxWidth: 180,
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '12px',
          fontFamily,
          labels: { colors: '#6b7280' },
          markers: { width: 10, height: 10, radius: 3 },
        },
        dataLabels: {
          enabled: true,
          formatter: (val) => (val > 0 ? val : ''),
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
          borderColor: gridColor,
          strokeDashArray: 4,
          xaxis: { lines: { show: true  } },
          yaxis: { lines: { show: false } },
        },
      };

      new ApexCharts(barangayEl, barangayOptions).render();
    }
  }

  // ── 6. Area Chart — CBU Accumulation Trend ───────────────
  const cbuEl = document.getElementById('cbuChart');
  if (cbuEl) {
    const cbuLabels = JSON.parse(cbuEl.dataset.labels || '[]');
    const cbuValues = JSON.parse(cbuEl.dataset.values || '[]');

    // Show empty state if no labels OR every value is 0
    const hasData = cbuLabels.length > 0 && cbuValues.some(v => v > 0);

    if (!hasData) {
      cbuEl.innerHTML =
        '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No CBU data yet.</p>';
    } else {
      // Running cumulative total — shows fund growth over time
      const cbuCumulative = cbuValues.reduce((acc, val, i) => {
        acc.push(+((acc[i - 1] || 0) + val).toFixed(2));
        return acc;
      }, []);

      const cbuOptions = {
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
        stroke: { curve: 'smooth', width: [2, 3] },
        colors: ['#a78bfa', '#6366f1'],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.3,
            gradientToColors: ['#ede9fe', '#c7d2fe'],
            opacityFrom: 0.45,
            opacityTo: 0.03,
          },
        },
        markers: {
          size: 4,
          strokeColors: '#fff',
          strokeWidth: 2,
          hover: { size: 6 },
        },
        xaxis: {
          categories: cbuLabels,
          labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
          axisBorder: { show: false },
          axisTicks:  { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: mutedColor, fontSize: '11px', fontFamily },
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: {
          borderColor: gridColor,
          strokeDashArray: 4,
          xaxis: { lines: { show: false } },
        },
        tooltip: {
          shared: true,
          intersect: false,
          ...tooltipStyle,
          y: { formatter: val => '₱' + val.toLocaleString() },
        },
        legend: {
          position: 'bottom',
          fontSize: '12px',
          fontFamily,
          labels: { colors: '#6b7280' },
          markers: { width: 10, height: 10, radius: 3 },
          itemMargin: { horizontal: 10, vertical: 4 },
        },
        dataLabels: { enabled: false },
      };

      new ApexCharts(cbuEl, cbuOptions).render();
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
          type: 'bar', height: 220, fontFamily,
          toolbar: { show: false },
          animations: { enabled: true, easing: 'easeinout', speed: 600 },
        },
        colors: ['#f43f5e'],
        plotOptions: {
          bar: { borderRadius: 6, columnWidth: '50%' },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light', type: 'vertical', shadeIntensity: 0.2,
            gradientToColors: ['#fda4af'], opacityFrom: 0.9, opacityTo: 0.7,
          },
        },
        xaxis: {
          categories: subLabels,
          labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
          axisBorder: { show: false }, axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: mutedColor, fontSize: '11px', fontFamily },
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: { borderColor: gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } } },
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
          type: 'bar', height: 220, fontFamily,
          toolbar: { show: false },
          animations: { enabled: true, easing: 'easeinout', speed: 600 },
        },
        colors: ['#0ea5e9'],
        plotOptions: {
          bar: { borderRadius: 6, columnWidth: '50%' },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light', type: 'vertical', shadeIntensity: 0.2,
            gradientToColors: ['#7dd3fc'], opacityFrom: 0.9, opacityTo: 0.7,
          },
        },
        xaxis: {
          categories: ipLabels,
          labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
          axisBorder: { show: false }, axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: mutedColor, fontSize: '11px', fontFamily },
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: { borderColor: gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } } },
        tooltip: { ...tooltipStyle, y: { formatter: val => '₱' + val.toLocaleString() } },
        dataLabels: { enabled: false },
      }).render();
    }
  }

  // ── 9. Area Chart — Savings Trend ────────────────────────
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
          type: 'area', height: 240, fontFamily,
          toolbar: { show: false }, zoom: { enabled: false },
          animations: { enabled: true, easing: 'easeinout', speed: 600 },
        },
        stroke: { curve: 'smooth', width: [2, 3] },
        colors: ['#5eead4', '#14b8a6'],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light', type: 'vertical', shadeIntensity: 0.3,
            gradientToColors: ['#ccfbf1', '#99f6e4'],
            opacityFrom: 0.45, opacityTo: 0.03,
          },
        },
        markers: { size: 4, strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
        xaxis: {
          categories: savLabels,
          labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
          axisBorder: { show: false }, axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: mutedColor, fontSize: '11px', fontFamily },
            formatter: val => '₱' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val),
          },
        },
        grid: { borderColor: gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } } },
        tooltip: {
          shared: true, intersect: false, ...tooltipStyle,
          y: { formatter: val => '₱' + val.toLocaleString() },
        },
        legend: {
          position: 'bottom', fontSize: '12px', fontFamily,
          labels: { colors: '#6b7280' },
          markers: { width: 10, height: 10, radius: 3 },
          itemMargin: { horizontal: 10, vertical: 4 },
        },
        dataLabels: { enabled: false },
      }).render();
    }
  }

  // ── Active vs Inactive Line Chart ─────────────────────────
const statusEl = document.getElementById('statusChart');
if (statusEl) {
  const statusLabels   = JSON.parse(statusEl.dataset.labels   || '[]');
  const statusActive   = JSON.parse(statusEl.dataset.active   || '[]');
  const statusInactive = JSON.parse(statusEl.dataset.inactive || '[]');

  const hasStatusData = statusLabels.length > 0;

  if (!hasStatusData) {
    statusEl.innerHTML =
      '<p style="text-align:center;color:#9ca3af;padding:48px 0;">No status data yet.</p>';
  } else {
    new ApexCharts(statusEl, {
      series: [
        { name: 'Active',   data: statusActive   },
        { name: 'Inactive', data: statusInactive },
      ],
      chart: {
        type: 'line',
        height: 260,
        fontFamily,
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
      },
      stroke: { curve: 'smooth', width: [3, 3] },
      colors: ['#10b981', '#ef4444'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: ['#d1fae5', '#fee2e2'],
          opacityFrom: 0.35,
          opacityTo: 0.02,
        },
      },
      markers: {
        size: 5,
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: { size: 7 },
      },
      xaxis: {
        categories: statusLabels,
        labels: { style: { colors: mutedColor, fontSize: '11px', fontFamily } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: mutedColor, fontSize: '11px', fontFamily },
          formatter: val => Math.round(val),
        },
        min: 0,
      },
      grid: {
        borderColor: gridColor,
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },
      tooltip: {
        shared: true,
        intersect: false,
        ...tooltipStyle,
        y: { formatter: val => val + ' members' },
      },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily,
        labels: { colors: '#6b7280' },
        markers: { width: 10, height: 10, radius: 3 },
        itemMargin: { horizontal: 10, vertical: 4 },
      },
      dataLabels: {
        enabled: true,
        formatter: val => val > 0 ? val : '',
        style: { fontSize: '11px', fontFamily, fontWeight: '600' },
        background: {
          enabled: true,
          borderRadius: 4,
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