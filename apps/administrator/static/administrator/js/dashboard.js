// apps/administrator/static/administrator/js/dashboard.js

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
      // blue = male, pink = female, gray = other
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
  // Horizontal bars are the best fit here: barangay names are long text
  // labels that would be unreadable on a vertical axis, and stacking
  // Male / Female / Other shows both the total and the gender split in
  // a single glance without needing a second chart.
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
      // "Other" = total minus male minus female
      const bOther = bTotal.map((t, i) => Math.max(0, t - (bMale[i] || 0) - (bFemale[i] || 0)));

      // 38 px per row keeps bars comfortably sized without empty space
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
        // blue=male, pink=female, gray=other — same palette as gender donut
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
            // Prevent very long names from overflowing the chart
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
          // Only show the label when the segment is wide enough to read
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