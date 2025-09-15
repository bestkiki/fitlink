import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
} from 'chart.js';
import { BodyMeasurement } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartProps {
    measurements: BodyMeasurement[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ measurements }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<ChartJS | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const labels = sortedMeasurements.map(m => m.date);
        const weightData = sortedMeasurements.map(m => m.weight);

        const data = {
            labels,
            datasets: [
                {
                    label: '체중 (kg)',
                    data: weightData,
                    borderColor: '#F97316', // Orange
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    tension: 0.1,
                    fill: true,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                    labels: {
                        color: '#F8FAFC',
                    }
                },
                title: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: '#334155',
                    titleColor: '#F8FAFC',
                    bodyColor: '#F8FAFC',
                    callbacks: {
                        label: function(context: any) {
                            return `${context.dataset.label}: ${context.parsed.y} kg`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#9CA3AF',
                    },
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)',
                    }
                },
                y: {
                    ticks: {
                        color: '#9CA3AF',
                    },
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)',
                    },
                    title: {
                        display: true,
                        text: 'kg',
                        color: '#9CA3AF',
                    }
                }
            }
        };

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        chartRef.current = new ChartJS(ctx, {
            type: 'line',
            data,
            options,
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };

    }, [measurements]);
    
    if (measurements.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-400">기록된 데이터가 없습니다.</div>
    }

    return (
        <div className="relative h-64 md:h-80">
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};

export default ProgressChart;