import {useEffect, useRef} from "react";
import Chart from 'chart.js/auto';

export interface ChartProps {
    chartData:{
        labels: string[],
        datasets: any[]
    }
}

export default function BarChart( {chartData}:ChartProps ) {
    const chartCanvasRef = useRef<HTMLCanvasElement>(null);
    const chart = useRef<Chart<'bar'>>();
    const chartContext = useRef<CanvasRenderingContext2D>();

    useEffect(() => {
        async function initChart() {
            if (chart.current) {
                return false;
            }
            chart.current = new Chart(chartContext.current!, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top' as const,
                            display: false,
                        },
                        title: {
                            display: false,
                            text: 'Chart.js Line Chart',
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1.0,
                        }
                    },
                }
            });
            return true;
        }
        if (chartCanvasRef.current) {
            chartContext.current = chartCanvasRef.current.getContext('2d') as CanvasRenderingContext2D;
            initChart().catch(err => {
                console.log(err);
            });
        }
    }, [chartCanvasRef, chartData])

    useEffect(() => {
        if(chartData){
            chart.current!.data = chartData;
            chart.current?.update();
        }
        },  [chartData])

    return (
        <canvas ref={chartCanvasRef} style={{width: '620px', height: '328px'}} id={'chart_canvas'}></canvas>
    )
}