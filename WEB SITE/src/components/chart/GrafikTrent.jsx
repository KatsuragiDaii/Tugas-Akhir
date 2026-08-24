import { createMemo, createSignal, onMount } from "solid-js";
import { SolidApexCharts } from "solid-apexcharts";

export default function RealtimeChart(props) {

    const [options, setOptions] = createSignal({
        chart: {
            id: "realtime",
            height: 350,
            type: "line",
            animations: {
                enabled: false,
                easing: "linear",
                dynamicAnimation: {
                    speed: 1000,
                },
            },
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        stroke: {
            curve: "smooth",
        },
        xaxis: {
            type: "datetime",
            range: 10000, // Rentang waktu 10 detik
        },
        yaxis: {
            max: 100,
        },
        markers: {
            size: 0,
        },
    });

    const [series, setSeries] = createSignal(props.series);

    createMemo(() => {
        setSeries(props.series)
    });

    return (
        <div class="w-full shadow-md rounded-lg p-4 mt-4">
            <div class="flex flex-col justify-center items-center">
                <h2>{props.title ? props.title : "Realtime Chart"}</h2>
            </div>
            <SolidApexCharts type="line" options={options()} series={series()} />
        </div>
    );
}
