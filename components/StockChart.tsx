"use client";

import { createChart, ColorType, IChartApi, CandlestickSeries } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

interface ChartData {
    time: string | number; // String 'YYYY-MM-DD' or Unix Timestamp
    open: number;
    high: number;
    low: number;
    close: number;
}

interface StockChartProps {
    data: ChartData[];
    ticker: string;
    isUp?: boolean;
}

export default function StockChart({ data, ticker }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const [legend, setLegend] = useState<{
        open: string;
        high: string;
        low: string;
        close: string;
        date: string;
        color: string;
    } | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#94a3b8", // slate-400
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.05)" },
                horzLines: { color: "rgba(255, 255, 255, 0.05)" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                timeVisible: true, // Show time for intraday
                secondsVisible: false,
            },
            crosshair: {
                vertLine: {
                    labelVisible: true, // Show label on X axis
                },
                horzLine: {
                    labelVisible: true, // Show label on Y axis
                }
            }
        });

        // Use addSeries in v5
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e", // neon-green
            downColor: "#ef4444", // neon-red
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        candleSeries.setData(data as any);

        // Set initial legend to last data point
        if (data.length > 0) {
            const last = data[data.length - 1];
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setLegend({
                open: last.open.toFixed(2),
                high: last.high.toFixed(2),
                low: last.low.toFixed(2),
                close: last.close.toFixed(2),
                date: new Date(typeof last.time === 'number' ? last.time * 1000 : last.time).toLocaleDateString(),
                color: last.close >= last.open ? "#22c55e" : "#ef4444"
            });
        }

        chart.subscribeCrosshairMove((param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                // Keep last known or clear? Usually better to keep last or reset to current.
                // Resetting to current (last candle) is nicer UI logic so it's not empty.
                if (data.length > 0) {
                    const last = data[data.length - 1];
                    setLegend({
                        open: last.open.toFixed(2),
                        high: last.high.toFixed(2),
                        low: last.low.toFixed(2),
                        close: last.close.toFixed(2),
                        date: new Date(typeof last.time === 'number' ? last.time * 1000 : last.time).toLocaleDateString(),
                        color: last.close >= last.open ? "#22c55e" : "#ef4444"
                    });
                }
                return;
            }

            const dataPoint = param.seriesData.get(candleSeries) as ChartData | undefined;
            if (dataPoint) {
                const isUp = dataPoint.close >= dataPoint.open;
                setLegend({
                    open: dataPoint.open.toFixed(2),
                    high: dataPoint.high.toFixed(2),
                    low: dataPoint.low.toFixed(2),
                    close: dataPoint.close.toFixed(2),
                    date: new Date(typeof dataPoint.time === 'number' ? dataPoint.time * 1000 : dataPoint.time).toLocaleDateString(),
                    color: isUp ? "#22c55e" : "#ef4444"
                });
            }
        });

        chart.timeScale().fitContent();

        chartRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div className="w-full h-full relative" ref={chartContainerRef}>
            {/* Legend Overlay */}
            {legend && (
                <div className="absolute top-2 left-2 z-10 bg-[#0f172a]/80 backdrop-blur-sm p-3 rounded-lg border border-white/10 pointer-events-none">
                    <div className="text-white font-bold text-lg mb-1">{ticker}</div>
                    <div className="text-slate-400 text-xs mb-2 font-mono">{legend.date}</div>
                    <div className="flex gap-4 font-mono text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase">Open</span>
                            <span className={legend.color}>{legend.open}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase">High</span>
                            <span className={legend.color}>{legend.high}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase">Low</span>
                            <span className={legend.color}>{legend.low}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase">Close</span>
                            <span className={legend.color}>{legend.close}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
