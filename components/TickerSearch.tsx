"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchCompanies } from "@/app/actions";

interface SearchResult {
    symbol: string;
    name: string;
    exch: string;
    type: string;
}

interface TickerSearchProps {
    onSearch: (ticker: string) => void;
    isLoading?: boolean;
}

export default function TickerSearch({ onSearch, isLoading }: TickerSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setSearching(true);
                try {
                    // Force cast the result to SearchResult[] to satisfy TS if needed, 
                    // though action returns typed objects compatible with interface.
                    const hits = await searchCompanies(query) as SearchResult[];
                    setResults(hits);
                    setIsOpen(true);
                } catch (error) {
                    console.error(error);
                } finally {
                    setSearching(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setIsOpen(false);
        }
    };

    const handleSelect = (ticker: string) => {
        setQuery(ticker);
        onSearch(ticker);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full max-w-sm" ref={dropdownRef}>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    placeholder="Search Ticker or Company (e.g. Apple)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-glass-bg border border-glass-border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
                    disabled={isLoading}
                />
                {searching || isLoading ? (
                    <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-blue w-5 h-5 animate-spin" />
                ) : (
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                )}
            </form>

            {isOpen && results.length > 0 && (
                <div className="absolute top-14 left-0 w-full bg-[#0f172a]/95 backdrop-blur-xl border border-glass-border rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                    {results.map((res, index) => (
                        <button
                            key={`${res.symbol}-${res.exch}-${index}`}
                            onClick={() => handleSelect(res.symbol)}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-white/5 last:border-0"
                        >
                            <div>
                                <div className="font-bold text-white group-hover:text-neon-blue transition-colors">
                                    {res.symbol}
                                </div>
                                <div className="text-xs text-slate-400 truncate max-w-[200px]">
                                    {res.name}
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                                {res.exch}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
