"use client";

import { ArrowUpRight } from "lucide-react";

interface Suggestion {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    recommendationKey: string;
}

interface StockSuggestionsProps {
    suggestions: Suggestion[];
    onSelect: (ticker: string) => void;
}

export default function StockSuggestions({ suggestions, onSelect }: StockSuggestionsProps) {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="w-full">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-neon-green" />
                <span>Analyst Top Picks</span>
                <span className="text-xs text-slate-500 font-normal ml-auto">Based on Strong Buy ratings</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {suggestions.map((stock) => (
                    <button
                        key={stock.symbol}
                        onClick={() => onSelect(stock.symbol)}
                        className="flex flex-col items-start p-4 rounded-xl border border-glass-border bg-glass-bg hover:bg-white/5 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-4 h-4 text-neon-green" />
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-lg tracking-wide">{stock.symbol}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${stock.recommendationKey === 'strong_buy'
                                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                                : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                                }`}>
                                {stock.recommendationKey.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="text-sm text-slate-400 truncate w-full mb-3" title={stock.shortName}>
                            {stock.shortName}
                        </div>

                        <div className="mt-auto flex items-baseline gap-2">
                            <span className="text-xl font-bold text-white">
                                {stock.regularMarketPrice?.toFixed(2)}
                            </span>
                            <span className={`text-xs font-medium ${(stock.regularMarketChangePercent || 0) >= 0 ? "text-neon-green" : "text-neon-red"
                                }`}>
                                {(stock.regularMarketChangePercent || 0) > 0 ? "+" : ""}
                                {(stock.regularMarketChangePercent * 100)?.toFixed(2)}%
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
