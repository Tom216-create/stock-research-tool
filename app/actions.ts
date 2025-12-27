"use server";

import yahooFinance from "yahoo-finance2";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StockData {
    quote: any;
    // time can be string (YYYY-MM-DD) or number (unix timestamp)
    history: { time: string | number; open: number; high: number; low: number; close: number; volume: number }[];
    news: any[];
    recommendation?: any;
}

export async function getStockData(
    ticker: string,
    range: string = "1y",
    interval: string = "1d"
): Promise<StockData | null> {
    if (!ticker) return null;

    let yf: any;
    try {
        yf = new yahooFinance();
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        yf = yahooFinance; // fallback
    }

    const fetchQuoteAndChart = async (symbol: string) => {
        const uppercaseTicker = symbol.toUpperCase();
        const quote = await yf.quote(uppercaseTicker);

        // Calculate period1 based on range
        const endDate = new Date();
        const startDate = new Date(endDate);

        switch (range) {
            case "1d":
                startDate.setDate(endDate.getDate() - 1); // fallback if strict 1d needed, but usually 1d is intraday
                // For intraday, we might need 'period1' to be start of day? 
                // Actually for "1d", yahoo expects specific query. 
                // But for chart(), period1 is required.
                // Let's set it to 24h ago for safety.
                startDate.setDate(endDate.getDate() - 1);
                break;
            case "5d":
                startDate.setDate(endDate.getDate() - 5);
                break;
            case "1mo":
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case "1y":
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            case "5y":
                startDate.setFullYear(endDate.getFullYear() - 5);
                break;
            case "max":
                startDate.setFullYear(endDate.getFullYear() - 10);
                break;
            default:
                startDate.setFullYear(endDate.getFullYear() - 1);
        }

        const queryOptions = {
            period1: Math.floor(startDate.getTime() / 1000), // chart accepts timestamp
            period2: Math.floor(endDate.getTime() / 1000),
            interval: interval,
        };

        const chartResult = await yf.chart(uppercaseTicker, queryOptions);

        return { quote, chartResult, symbol: uppercaseTicker };
    };

    try {
        let data;
        let usedSymbol = ticker.toUpperCase();

        try {
            // Attempt 1: Direct Fetch
            data = await fetchQuoteAndChart(ticker);
        } catch (directError) {
            console.log(`Direct fetch failed for ${ticker}, attempting search fallback...`);
            // Attempt 2: Search Fallback
            try {
                const searchResult = await yf.search(ticker, { newsCount: 0, quotesCount: 1 });
                const bestMatch = searchResult.quotes?.[0];

                if (bestMatch && bestMatch.symbol) {
                    console.log(`Fallback found: ${bestMatch.symbol}`);
                    data = await fetchQuoteAndChart(bestMatch.symbol);
                    usedSymbol = bestMatch.symbol;
                } else {
                    throw directError; // Re-throw original if no search match
                }
            } catch (searchError) {
                console.error("Fallback failed:", searchError);
                return null;
            }
        }

        const { quote, chartResult } = data;

        const history = (chartResult.quotes || []).map((item: any) => ({
            time: (interval.includes("m") || interval.includes("h"))
                // For intraday/minute data, lightweight-charts wants a timestamp (seconds)
                // or specific string format. Using unix timestamp (seconds) is safest for intraday.
                ? Math.floor(new Date(item.date).getTime() / 1000)
                : item.date instanceof Date
                    ? item.date.toISOString().split("T")[0]
                    : item.date,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
        }));

        // Fetch recommendation data if available (using quoteSummary modules)
        let recommendation = null;
        try {
            const summary = await yf.quoteSummary(usedSymbol, { modules: ["financialData", "defaultKeyStatistics"] });
            const finData = summary.financialData;
            if (finData) {
                recommendation = {
                    recommendationMean: finData.recommendationMean,
                    recommendationKey: finData.recommendationKey,
                    targetMeanPrice: finData.targetMeanPrice,
                    numberOfAnalystOpinions: finData.numberOfAnalystOpinions
                };
            }
        } catch (e) {
            console.warn("Recommendation fetch failed:", e);
        }

        const result: StockData = {
            quote: quote,
            history: history,
            news: [],
            recommendation: recommendation,
        };

        // Re-add news fetch
        try {
            const newsResult = await yf.search(usedSymbol, { newsCount: 5, quotesCount: 0 });
            if (newsResult.news) {
                result.news = newsResult.news.map((item: any) => ({
                    uuid: item.uuid,
                    title: item.title,
                    publisher: item.publisher,
                    link: item.link,
                    providerPublishTime: item.providerPublishTime,
                    thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
                }));
            }
        } catch (newsErr) {
            console.warn("News fetch failed:", newsErr);
        }

        return result;

    } catch (error) {
        console.error("Error in getStockData:", error);
        return null;
    }
}

export async function searchCompanies(query: string) {
    if (!query) return [];

    let yf: any;
    try {
        yf = new yahooFinance();
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        yf = yahooFinance;
    }

    try {
        const results = await yf.search(query, { newsCount: 0, quotesCount: 10 });
        return (results.quotes || [])
            .filter((q: any) => q.isYahooFinance !== true)
            .map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exch: q.exchange,
                type: q.quoteType
            }));
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

export async function getSuggestedStocks(): Promise<any[]> {
    try {
        let yf: any;
        try {
            yf = new yahooFinance();
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            yf = yahooFinance; // fallback
        }

        // Curated list of 50+ popular stocks to check across sectors to ensure we find 20+ strong buys
        const tickers = [
            'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD', 'AVGO', 'TSLA', 'AAPL', 'CRM', // Tech Giants
            'PLTR', 'PANW', 'CRWD', 'UBER', 'ABNB', 'NOW', 'INTU', 'QCOM', 'TXN', 'MU',   // Tech Growth
            'LLY', 'UNH', 'JNJ', 'MRK', 'ABBV', 'PFE', 'ISRG', 'VRTX',                   // Healthcare
            'JPM', 'BAC', 'V', 'MA', 'GS', 'MS', 'BLK',                                  // Finance
            'WMT', 'COST', 'HD', 'LOW', 'MCD', 'SBUX', 'CMG', 'NKE',                     // Consumer
            'CAT', 'DE', 'GE', 'UNP', 'HON',                                             // Industrial
            'XOM', 'CVX', 'COP'                                                          // Energy
        ];
        const suggestions = [];

        // Fetch quotes in parallel
        // Note: checking 50+ might be slow, but essential for a "screener" feel
        const quotes = await Promise.all(tickers.map(async (t) => {
            try {
                // We use quoteSummary to get the recommendation key reliably
                const summary = await yf.quoteSummary(t, { modules: ["financialData", "price"] });
                return { ticker: t, data: summary };
            } catch {
                return null;
            }
        }));

        for (const item of quotes) {
            if (!item || !item.data || !item.data.financialData) continue;

            const { financialData, price } = item.data;
            const recKey = financialData.recommendationKey; // 'strong_buy', 'buy', 'hold', etc.

            if (recKey === 'strong_buy' || recKey === 'buy') {
                suggestions.push({
                    symbol: item.ticker,
                    shortName: price?.shortName || item.ticker,
                    regularMarketPrice: price?.regularMarketPrice,
                    regularMarketChangePercent: price?.regularMarketChangePercent,
                    recommendationKey: recKey,
                });
            }
        }

        // Return top 20
        return suggestions.slice(0, 20);

    } catch (error) {
        console.error("Suggestions error:", error);
        return [];
    }
}

export async function getBatchQuotes(tickers: string[]) {
    if (!tickers || tickers.length === 0) return [];

    let yf: any;
    try {
        yf = new yahooFinance();
    } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        yf = yahooFinance;
    }

    try {
        const results = await yf.quote(tickers);
        return results.map((q: any) => ({
            symbol: q.symbol,
            regularMarketPrice: q.regularMarketPrice,
            regularMarketChangePercent: q.regularMarketChangePercent,
            regularMarketCreate: q.regularMarketChange
        }));
    } catch (error) {
        console.error("Batch quote failed:", error);
        return [];
    }
}

export async function getTopGainer(): Promise<string> {
    try {
        let yf: any;
        try {
            yf = new yahooFinance();
        } catch {
            yf = yahooFinance;
        }

        // Same list as suggestions
        const tickers = [
            'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD', 'AVGO', 'TSLA', 'AAPL', 'CRM',
            'PLTR', 'PANW', 'CRWD', 'UBER', 'ABNB', 'NOW', 'INTU', 'QCOM', 'TXN', 'MU',
            'LLY', 'UNH', 'JNJ', 'MRK', 'ABBV', 'PFE', 'ISRG', 'VRTX',
            'JPM', 'BAC', 'V', 'MA', 'GS', 'MS', 'BLK',
            'WMT', 'COST', 'HD', 'LOW', 'MCD', 'SBUX', 'CMG', 'NKE',
            'CAT', 'DE', 'GE', 'UNP', 'HON',
            'XOM', 'CVX', 'COP'
        ];

        const quotes = await yf.quote(tickers);

        // Find max gainer
        let maxGainer = null;
        let maxChange = -Infinity;

        for (const q of quotes) {
            const change = q.regularMarketChangePercent || 0;
            if (change > maxChange) {
                maxChange = change;
                maxGainer = q.symbol;
            }
        }

        return maxGainer || "SPY"; // Fallback to SPY

    } catch (e) {
        console.error("Top gainer fetch failed:", e);
        return "SPY";
    }
}
