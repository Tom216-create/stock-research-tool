"use client";

import clsx from "clsx";

interface QuoteData {
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketPreviousClose: number;
    regularMarketOpen: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    shortName: string;
    symbol: string;
}

interface StockSummaryProps {
    quote: QuoteData;
}

function formatNumber(num: number) {
    // Use compact notation for volume (e.g. 1.2M)
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(num);
}

function formatPrice(num: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(num);
}

export default function StockSummary({ quote }: StockSummaryProps) {
    const isPositive = quote.regularMarketChange >= 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {formatPrice(quote.regularMarketPrice)}
                </h2>
                <div className={clsx("flex items-center gap-2 text-lg font-medium", isPositive ? "text-neon-green" : "text-neon-red")}>
                    <span>{isPositive ? "+" : ""}{quote.regularMarketChange.toFixed(2)}</span>
                    <span>({isPositive ? "+" : ""}{quote.regularMarketChangePercent.toFixed(2)}%)</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">{quote.shortName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                    <span className="text-slate-500">Previous Close</span>
                    <span className="text-slate-200">{formatPrice(quote.regularMarketPreviousClose)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-500">Open</span>
                    <span className="text-slate-200">{formatPrice(quote.regularMarketOpen)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-500">Day High</span>
                    <span className="text-slate-200">{formatPrice(quote.regularMarketDayHigh)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-slate-500">Day Low</span>
                    <span className="text-slate-200">{formatPrice(quote.regularMarketDayLow)}</span>
                </div>
                <div className="flex flex-col col-span-2">
                    <span className="text-slate-500">Volume</span>
                    <span className="text-slate-200">{formatNumber(quote.regularMarketVolume)}</span>
                </div>
            </div>
        </div>
    );
}
