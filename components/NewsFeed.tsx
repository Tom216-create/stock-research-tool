"use client";

import { formatDistanceToNow } from "date-fns";

interface NewsItem {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: number; // Unix timestamp
    thumbnail?: string;
}

interface NewsFeedProps {
    news: NewsItem[];
}

export default function NewsFeed({ news }: NewsFeedProps) {
    if (!news || news.length === 0) {
        return <div className="text-slate-500 text-sm">No recent news available.</div>;
    }

    return (
        <div className="space-y-4">
            {news.map((item) => (
                <a
                    key={item.uuid}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                >
                    <div className="flex gap-4 items-start p-2 rounded-lg hover:bg-white/5 transition-colors">
                        {item.thumbnail && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={item.thumbnail}
                                alt=""
                                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-slate-200 group-hover:text-neon-blue transition-colors line-clamp-2">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                <span className="font-semibold text-slate-400">{item.publisher}</span>
                                <span>•</span>
                                <span>
                                    {item.providerPublishTime
                                        ? formatDistanceToNow(new Date(item.providerPublishTime * 1000), { addSuffix: true })
                                        : "Recently"}
                                </span>
                            </div>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
