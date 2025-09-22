import React from 'react';
import { BodyMeasurement } from '../App';

interface ProgressChartProps {
    measurements: BodyMeasurement[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ measurements }) => {
    // FIX: Filter and sort data for weight and body fat separately
    const weightData = measurements.filter(m => m.weight != null && m.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const bodyFatData = measurements.filter(m => m.bodyFat != null && m.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (weightData.length < 2 && bodyFatData.length < 2) {
        return (
            <div className="flex items-center justify-center h-64 bg-dark rounded-md text-center p-4">
                <p className="text-gray-400">성장 기록을 차트로 보려면 체중 또는 체지방 데이터가 2개 이상 필요합니다.</p>
            </div>
        );
    }

    const PADDING = 50;
    const VIEWBOX_WIDTH = 500;
    const VIEWBOX_HEIGHT = 300;
    const chartWidth = VIEWBOX_WIDTH - PADDING * 1.5;
    const chartHeight = VIEWBOX_HEIGHT - PADDING;

    const allValues = [
        ...weightData.map(d => d.weight!),
        ...bodyFatData.map(d => d.bodyFat!),
    ];

    const minValRaw = Math.min(...allValues);
    const maxValRaw = Math.max(...allValues);
    const range = maxValRaw - minValRaw;

    // Adjust min/max for better visual representation
    const minVal = range > 0 ? Math.max(0, Math.floor(minValRaw - range * 0.1)) : Math.max(0, minValRaw - 5);
    const maxVal = range > 0 ? Math.ceil(maxValRaw + range * 0.1) : maxValRaw + 5;
    
    // Combine all measurements with valid dates to get date range
    const allDates = measurements
        .filter(m => m.date)
        .map(m => new Date(m.date).getTime());

    const minDateMs = Math.min(...allDates);
    const maxDateMs = Math.max(...allDates);

    const getX = (dateMs: number) => {
        if (maxDateMs === minDateMs) return PADDING;
        return PADDING + ((dateMs - minDateMs) / (maxDateMs - minDateMs)) * chartWidth;
    };

    const getY = (value: number) => {
        const valueRange = maxVal - minVal;
        if (valueRange <= 0) return chartHeight / 2;
        return chartHeight - ((value - minVal) / valueRange) * (chartHeight - PADDING);
    };

    const generatePath = (data: { date: string, value: number }[]) => {
        if (data.length < 2) return "";
        let path = `M ${getX(new Date(data[0].date).getTime())} ${getY(data[0].value)}`;
        for (let i = 1; i < data.length; i++) {
            path += ` L ${getX(new Date(data[i].date).getTime())} ${getY(data[i].value)}`;
        }
        return path;
    };
    
    const weightPathData = weightData.map(d => ({ date: d.date, value: d.weight! }));
    const bodyFatPathData = bodyFatData.map(d => ({ date: d.date, value: d.bodyFat! }));
    
    const weightPath = generatePath(weightPathData);
    const bodyFatPath = generatePath(bodyFatPathData);

    const yAxisLabels = [];
    const numLabels = 5;
    const yRange = maxVal - minVal;
    if (yRange > 0) {
        for (let i = 0; i <= numLabels; i++) {
            const value = minVal + (i * yRange) / numLabels;
            yAxisLabels.push(Number(value.toFixed(1)));
        }
    }

    // FIX: Replaced unreliable date string parsing to resolve TypeScript error and improve reliability. Using timestamps and `setHours` to normalize dates avoids issues with locale-specific string formats passed to `new Date()`.
    // FIX: Replaced `Array.from` with spread syntax `[...]` to correctly infer the array type and resolve the TypeScript error with `unknown` type.
    // FIX: Explicitly cast `ts` to `number` to resolve a type inference issue where it was being inferred as `unknown`.
    const uniqueDates = [...new Set(allDates.map(ts => new Date(ts).setHours(0, 0, 0, 0)))]
        .map(ts => new Date(ts as number))
        .sort((a,b) => a.getTime() - b.getTime());

    let xAxisLabels = uniqueDates;
    if(uniqueDates.length > 6) {
        const step = Math.ceil(uniqueDates.length / 6);
        xAxisLabels = uniqueDates.filter((_, i) => i % step === 0);
    }

    return (
        <div>
            <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} width="100%" height="auto" aria-labelledby="chart-title" role="img" className="text-xs">
                {/* Y-axis grid lines and labels */}
                {yAxisLabels.map((label, i) => (
                    <g key={`y-${i}`} className="text-gray-500">
                        <line
                            x1={PADDING}
                            x2={VIEWBOX_WIDTH - PADDING / 2}
                            y1={getY(label)}
                            y2={getY(label)}
                            className="stroke-current opacity-20"
                            strokeDasharray="2,4"
                        />
                        <text className="fill-current" x={PADDING - 8} y={getY(label) + 4} textAnchor="end">
                            {label}
                        </text>
                    </g>
                ))}

                {/* X-axis labels */}
                {xAxisLabels.map((date, i) => (
                    <g key={`x-${i}`} className="text-gray-500">
                         <text
                            className="fill-current"
                            x={getX(date.getTime())}
                            y={VIEWBOX_HEIGHT - PADDING + 20}
                            textAnchor="middle"
                         >
                             {date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                         </text>
                    </g>
                ))}
                
                <line x1={PADDING} y1={VIEWBOX_HEIGHT - PADDING} x2={VIEWBOX_WIDTH - PADDING/2} y2={VIEWBOX_HEIGHT - PADDING} className="stroke-current text-gray-700" />
                <line x1={PADDING} y1={PADDING/2} x2={PADDING} y2={VIEWBOX_HEIGHT - PADDING} className="stroke-current text-gray-700" />


                {/* Weight path */}
                {weightPath && (
                    <path
                        d={weightPath}
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Body fat path */}
                {bodyFatPath && (
                    <path
                        d={bodyFatPath}
                        fill="none"
                        className="stroke-secondary"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
            </svg>
            <div className="flex justify-center space-x-4 mt-2 text-sm text-gray-400">
                {weightPath && (
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-primary mr-2"></span>
                        <span>체중 (kg)</span>
                    </div>
                )}
                {bodyFatPath && (
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>
                        <span>체지방률 (%)</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressChart;