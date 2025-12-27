"use client";

import { useState, useEffect, useCallback } from "react";
import { getStockData, StockData, getSuggestedStocks, getTopGainer } from "./actions";
import TickerSearch from "@/components/TickerSearch";
import StockSummary from "@/components/StockSummary";
import StockChart from "@/components/StockChart";
import NewsFeed from "@/components/NewsFeed";
import AnalystRating from "@/components/AnalystRating";
import StockSuggestions from "@/components/StockSuggestions";
import PortfolioTracker from "@/components/PortfolioTracker";
import { Loader2 } from "lucide-react";

interface Suggestion {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  shortName: string;
  recommendationKey: string;
}

export default function Home() {
  const [ticker, setTicker] = useState(""); // Start empty
  const [data, setData] = useState<StockData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState("1y");

  const fetchData = useCallback(async (symbol: string, rangeVal: string = "1y", intervalVal: string = "1d") => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStockData(symbol, rangeVal, intervalVal);
      if (!result) {
        setError(`Could not find data for ticker: ${symbol} `);
        setData(null);
      } else {
        setData(result);
        setTicker(symbol.toUpperCase());
        setRange(rangeVal);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      try {
        const topGainer = await getTopGainer();
        fetchData(topGainer, "1y", "1d");
      } catch {
        fetchData("SPY", "1y", "1d");
      }
    };
    init();

    // Load suggestions
    getSuggestedStocks().then(res => {
      setSuggestions(res);
    });
  }, [fetchData]);

  const handleSearch = (newTicker: string) => {
    fetchData(newTicker, "1y", "1d"); // Reset range on new search
  };

  const handleRangeChange = (newRange: string, newInterval: string) => {
    fetchData(ticker, newRange, newInterval);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-neon-green selection:text-black">
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Market Overview
            </h1>
            <p className="text-slate-400">
              Real-time insights for <span className="text-neon-blue font-mono font-bold text-xl">
                {ticker}{data?.quote?.shortName ? ` : ${data.quote.shortName}` : ""}
              </span>
            </p>
          </div>

          <TickerSearch onSearch={handleSearch} isLoading={loading} />
        </div>

        {/* Content Section */}
        {error ? (
          <div className="p-8 border border-red-500/20 bg-red-500/10 rounded-2xl text-red-400 text-center">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Chart */}
            <div className="lg:col-span-2 space-y-6">
              <div className="w-full h-[500px] border border-glass-border bg-glass-bg rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden group flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h2 className="text-sm font-semibold text-slate-400">Price Chart</h2>
                  <div className="flex bg-slate-800/50 rounded-lg p-1 space-x-1">
                    {[
                      { label: "1D", value: "1d", interval: "2m" },
                      { label: "1W", value: "5d", interval: "15m" },
                      { label: "1M", value: "1mo", interval: "1d" },
                      { label: "1Y", value: "1y", interval: "1d" },
                      { label: "5Y", value: "5y", interval: "1wk" },
                    ].map((r) => (
                      <button
                        key={r.label}
                        onClick={() => handleRangeChange(r.value, r.interval)}
                        className={`px - 3 py - 1 text - xs rounded - md font - medium transition - all ${range === r.value
                          ? "bg-neon-blue text-white shadow-lg shadow-neon-blue/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                          } `}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
                  </div>
                ) : data ? (
                  <StockChart
                    data={data.history}
                    ticker={ticker}
                  />
                ) : null}
              </div>

              {/* Suggested Stocks */}
              <StockSuggestions suggestions={suggestions} onSelect={handleSearch} />

              {/* Portfolio Tracker */}
              <PortfolioTracker />
            </div>

            {/* Right Column: Stats & News */}
            <div className="lg:col-span-1 space-y-6">
              {/* Fixed Height Key Stats */}
              <div className="border border-glass-border bg-glass-bg rounded-2xl p-6 shadow-xl backdrop-blur-md min-h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                  </div>
                ) : data?.quote ? (
                  <div className="h-full">
                    <StockSummary quote={data.quote} />
                  </div>
                ) : null}
              </div>

              {/* Analyst Rating */}
              {loading ? (
                <div className="h-[200px] border border-glass-border bg-glass-bg rounded-2xl animate-pulse" />
              ) : data?.recommendation ? (
                <AnalystRating
                  recommendationMean={data.recommendation.recommendationMean}
                  recommendationKey={data.recommendation.recommendationKey}
                  targetMeanPrice={data.recommendation.targetMeanPrice}
                  numberOfAnalystOpinions={data.recommendation.numberOfAnalystOpinions}
                />
              ) : null}

              {/* Scrollable News Feed */}
              <div className="border border-glass-border bg-glass-bg rounded-2xl p-6 shadow-xl backdrop-blur-md max-h-[600px] flex flex-col">
                <h2 className="text-xl font-semibold mb-4 text-white sticky top-0 bg-glass-bg z-10 pb-2 border-b border-glass-border">
                  Latest News
                </h2>
                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex gap-4">
                          <div className="w-16 h-16 bg-slate-800 rounded-md" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-800 rounded w-3/4" />
                            <div className="h-3 bg-slate-800 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : data ? (
                    <NewsFeed news={data.news} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[128px]" />
      </div>
    </div>
  );
}
