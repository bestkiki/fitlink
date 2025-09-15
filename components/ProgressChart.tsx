import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BodyMeasurement } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartProps {
    measurements: BodyMeasurement[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ measurements }) => {
    // Sort measurements by date ascending
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
    
    if (measurements.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-400">기록된 데이터가 없습니다.</div>
    }

    return (
        <div className="relative h-64 md:h-80">
            <Line options={options} data={data} />
        </div>
    );
};

export default ProgressChart;
