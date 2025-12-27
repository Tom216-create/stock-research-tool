"use client";

interface AnalystRatingProps {
    recommendationMean?: number;
    recommendationKey?: string;
    targetMeanPrice?: number;
    numberOfAnalystOpinions?: number;
}

export default function AnalystRating({
    recommendationMean,
    recommendationKey,
    targetMeanPrice,
    numberOfAnalystOpinions
}: AnalystRatingProps) {
    if (!recommendationMean) return null;

    // recommendationMean is typically 1 (Strong Buy) to 5 (Strong Sell)
    // We want to map this to a percentage position on a bar (0% to 100%)
    // 1 -> 0% (Left, Green)
    // 5 -> 100% (Right, Red)
    // Formula: (Value - Min) / (Max - Min) * 100
    // (Mean - 1) / (5 - 1) * 100 
    const percentage = Math.min(Math.max(((recommendationMean - 1) / 4) * 100, 0), 100);

    const getLabel = (key: string) => {
        return key.replace(/_/g, " ").toUpperCase();
    };

    return (
        <div className="bg-glass-bg border border-glass-border rounded-xl p-6 backdrop-blur-md">
            <h3 className="text-xl font-bold text-white mb-4">Analyst Rating</h3>

            <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-neon-blue">
                    {recommendationMean.toFixed(1)}
                </span>
                <span className={`text-lg font-bold px-3 py-1 rounded-full ${recommendationMean <= 2 ? "bg-neon-green/20 text-neon-green" :
                        recommendationMean <= 3 ? "bg-blue-500/20 text-blue-400" :
                            "bg-neon-red/20 text-neon-red"
                    }`}>
                    {recommendationKey ? getLabel(recommendationKey) : "N/A"}
                </span>
            </div>

            <div className="relative h-4 bg-slate-800 rounded-full w-full mb-2 overflow-hidden">
                {/* Gradient Background: Green -> Blue -> Red */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-green via-blue-500 to-neon-red opacity-80" />

                {/* Marker */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-500 ease-out"
                    style={{ left: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
                <span>Strong Buy</span>
                <span>Hold</span>
                <span>Strong Sell</span>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                <div className="text-center">
                    <div className="text-xs text-slate-500">Target Price</div>
                    <div className="text-lg font-bold text-white">
                        {targetMeanPrice ? `$${targetMeanPrice.toFixed(2)}` : "--"}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-500">Analysts</div>
                    <div className="text-lg font-bold text-white">
                        {numberOfAnalystOpinions || "--"}
                    </div>
                </div>
            </div>
        </div>
    );
}
