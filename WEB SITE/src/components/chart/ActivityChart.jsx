import { createEffect, onCleanup, onMount } from "solid-js";

// Grafik garis realtime bergaya SISGRID untuk satu parameter (halaman PLTS dan PLTMH).
// ApexCharts dimuat dinamis di browser agar aman dari error SSR ("window is not defined").
//
// props.series  [{ x: waktu (ms), y: nilai }], urut waktu
// props.name    nama parameter (untuk tooltip)
// props.unit    satuan (untuk tooltip); dapat berganti saat parameter dipilih ulang
// props.height  tinggi grafik dalam px (default 200)
//
// Berbeda dengan components/chart/GrafikTrent.jsx, satuan tooltip di sini ikut diperbarui
// saat props berubah, sehingga satu grafik bisa dipakai untuk beberapa parameter.
export default function ActivityChart(props) {
  let el;
  let chart;
  let disposed = false;
  let appliedUnit;

  const apply = () => {
    // Baca semua props lebih dulu supaya effect selalu melacaknya, walau chart belum siap
    const series = props.series;
    const name = props.name;
    const unit = props.unit;
    if (!chart) return;
    if (unit !== appliedUnit) {
      appliedUnit = unit;
      chart.updateOptions({ tooltip: { y: { formatter: (v) => `${v} ${unit}` } } }, false, false);
    }
    chart.updateSeries([{ name, data: series }]);
  };

  createEffect(apply);

  onMount(async () => {
    const { default: ApexCharts } = await import("apexcharts");
    if (disposed) return; // halaman sudah ditinggalkan saat apexcharts dimuat

    chart = new ApexCharts(el, {
      chart: {
        type: "line",
        height: props.height || 200,
        fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
        background: "transparent",
        toolbar: { show: false },
        zoom: { enabled: false },
        parentHeightOffset: 0,
        animations: { enabled: true, easing: "linear", dynamicAnimation: { speed: 800 } },
      },
      series: [{ name: props.name, data: props.series }],
      colors: ["#004d5c"],
      stroke: { curve: "smooth", width: 2.5 },
      markers: { size: 3, strokeWidth: 0, hover: { sizeOffset: 2 } },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: "#e5e5e5",
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 12 },
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          format: "HH:mm:ss",
          style: { colors: "#6b7f85", fontSize: "11px" },
        },
        axisBorder: { show: true, color: "#004d5c" },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        tickAmount: 4,
        axisBorder: { show: true, color: "#004d5c" },
        labels: {
          formatter: (v) => (v === undefined || v === null ? "" : Number(v).toFixed(1)),
          style: { colors: "#6b7f85", fontSize: "11px" },
        },
      },
      tooltip: {
        x: { format: "HH:mm:ss" },
        y: { formatter: (v) => `${v} ${props.unit}` },
      },
    });
    appliedUnit = props.unit;
    await chart.render();
    apply(); // data yang datang selama apexcharts dimuat
  });

  onCleanup(() => {
    disposed = true;
    if (chart) chart.destroy();
  });

  return (
    <div class="w-full" role="img" aria-label={`Grafik ${props.name} terhadap waktu`}>
      <div ref={el}></div>
    </div>
  );
}
