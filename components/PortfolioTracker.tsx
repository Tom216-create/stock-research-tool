"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { getBatchQuotes } from "../app/actions";

interface Holding {
    symbol: string;
    shares: number;
    avgCost: number;
}

interface Quote {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}

export default function PortfolioTracker() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [quotes, setQuotes] = useState<Record<string, Quote>>({});
    const [loading, setLoading] = useState(false);

    // Form state
    const [newSymbol, setNewSymbol] = useState("");
    const [newShares, setNewShares] = useState("");
    const [newCost, setNewCost] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem("my_holdings");
        if (saved) {
            try {
                setHoldings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse holdings", e);
            }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem("my_holdings", JSON.stringify(holdings));
    }, [holdings]);

    // Fetch prices
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchPrices = async () => {
        if (holdings.length === 0) return;

        setLoading(true);
        try {
            const symbols = holdings.map(h => h.symbol);
            const data = await getBatchQuotes(symbols);

            const quoteMap: Record<string, Quote> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.forEach((q: any) => {
                quoteMap[q.symbol] = q;
            });
            setQuotes(quoteMap);
        } catch (error) {
            console.error("Failed to update prices", error);
        } finally {
            setLoading(false);
        }
    };

    // Update prices when holdings change (or initial load)
    useEffect(() => {
        if (holdings.length > 0) {
            fetchPrices();
        }
    }, [holdings.length]); // Only refetch if number of holdings changes, simplistic but avoids loops

    const addHolding = () => {
        if (!newSymbol || !newShares || !newCost) return;

        const symbol = newSymbol.toUpperCase();
        const shares = parseFloat(newShares);
        const avgCost = parseFloat(newCost);

        if (isNaN(shares) || isNaN(avgCost)) return;

        // Check if exists, update or add
        const existingIndex = holdings.findIndex(h => h.symbol === symbol);
        const newHoldings = [...holdings];

        if (existingIndex >= 0) {
            // Update logic (weighted average could go here, but simple replace for now or add shares?)
            // Let's keep it simple: Replace for now, or maybe they want to add a separate lot.
            // Requirement says "Enter and track", implies simple list. 
            // Let's just append or replace. Replacing is safer for MVP to avoid duplicate keys.
            newHoldings[existingIndex] = { symbol, shares, avgCost };
        } else {
            newHoldings.push({ symbol, shares, avgCost });
        }

        setHoldings(newHoldings);
        setNewSymbol("");
        setNewShares("");
        setNewCost("");
        setIsAdding(false);

        // Trigger fetch for new symbol
        // (Effect will handle it)
    };

    const removeHolding = (symbol: string) => {
        setHoldings(holdings.filter(h => h.symbol !== symbol));
    };

    // Calculations
    const totalValue = holdings.reduce((sum, h) => {
        const price = quotes[h.symbol]?.regularMarketPrice || h.avgCost; // fallback to cost if no price
        return sum + (price * h.shares);
    }, 0);

    const totalCost = holdings.reduce((sum, h) => sum + (h.avgCost * h.shares), 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return (
        <div className="w-full border border-glass-border bg-glass-bg rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <DollarSign className="text-neon-green" />
                        My Holdings
                    </h2>
                    <p className="text-slate-400 text-sm">Track your personal portfolio performance</p>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-medium flex items-center justify-end gap-1 ${totalGain >= 0 ? "text-neon-green" : "text-neon-red"
                        }`}>
                        {totalGain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {totalGain >= 0 ? "+" : ""}{totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ({totalGainPercent.toFixed(2)}%)
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neon-blue/10 text-neon-blue rounded-lg hover:bg-neon-blue/20 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Add Stock
                </button>

                <button
                    onClick={fetchPrices}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Refresh Prices"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-xl flex flex-wrap gap-3 items-end animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs text-slate-400 block mb-1">Ticker</label>
                        <input
                            type="text"
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-neon-blue outline-none"
                            placeholder="AAPL"
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <label className="text-xs text-slate-400 block mb-1">Shares</label>
                        <input
                            type="number"
                            value={newShares}
                            onChange={(e) => setNewShares(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-neon-blue outline-none"
                            placeholder="10"
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <label className="text-xs text-slate-400 block mb-1">Avg Cost ($)</label>
                        <input
                            type="number"
                            value={newCost}
                            onChange={(e) => setNewCost(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-neon-blue outline-none"
                            placeholder="150.00"
                        />
                    </div>
                    <button
                        onClick={addHolding}
                        className="px-4 py-1.5 bg-neon-green text-black font-semibold rounded text-sm hover:bg-neon-green/90 transition-colors"
                    >
                        Save
                    </button>
                </div>
            )}

            {/* Holdings Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-slate-500 border-b border-white/5">
                            <th className="py-2 pl-2">Ticker</th>
                            <th className="py-2 text-right">Shares</th>
                            <th className="py-2 text-right">Avg Cost</th>
                            <th className="py-2 text-right">Price</th>
                            <th className="py-2 text-right">Value</th>
                            <th className="py-2 text-right">Return</th>
                            <th className="py-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {holdings.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-600 italic">
                                    No holdings added yet.
                                </td>
                            </tr>
                        ) : (
                            holdings.map((h) => {
                                const quote = quotes[h.symbol];
                                const price = quote?.regularMarketPrice || 0;
                                const value = price * h.shares;
                                const gain = value - (h.avgCost * h.shares);
                                const gainPercent = (gain / (h.avgCost * h.shares)) * 100;

                                return (
                                    <tr key={h.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="py-3 pl-2 font-semibold text-white">{h.symbol}</td>
                                        <td className="py-3 text-right text-slate-300">{h.shares}</td>
                                        <td className="py-3 text-right text-slate-400">${h.avgCost.toFixed(2)}</td>
                                        <td className="py-3 text-right text-white">
                                            {price ? `$${price.toFixed(2)}` : <span className="text-slate-600">...</span>}
                                        </td>
                                        <td className="py-3 text-right font-medium text-white">
                                            {price ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                                        </td>
                                        <td className={`py-3 text-right font-medium ${gain >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                                            {price ? (
                                                <>
                                                    {gain > 0 ? "+" : ""}{gainPercent.toFixed(2)}%
                                                </>
                                            ) : "-"}
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => removeHolding(h.symbol)}
                                                className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
