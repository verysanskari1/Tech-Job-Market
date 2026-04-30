'use client';

import { useEffect, useRef } from 'react';
import type { AiModelMeta, TweetRow } from '@/lib/ai-trends-queries';

interface Props {
  model: AiModelMeta | null;
  weekLabel: string;
  tweets: TweetRow[];
  loading: boolean;
  onClose: () => void;
}

function SentimentBadge({ score }: { score: number }) {
  if (score >= 0.3) return (
    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
      +{score.toFixed(2)}
    </span>
  );
  if (score <= -0.3) return (
    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
      {score.toFixed(2)}
    </span>
  );
  return (
    <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-white/10 text-white/50">
      {score.toFixed(2)}
    </span>
  );
}

export default function TweetModal({ model, weekLabel, tweets, loading, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!model) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-[#1a1a24] border border-surface-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: model.color }}
            />
            <div>
              <p className="text-white font-sans font-semibold text-sm">{model.display_name}</p>
              <p className="text-white/40 text-xs font-sans">Top tweets · {weekLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center h-40 text-white/30 text-sm font-sans">
              Loading tweets…
            </div>
          )}

          {!loading && tweets.length === 0 && (
            <div className="flex items-center justify-center h-40 text-white/30 text-sm font-sans">
              No tweets found for this week.
            </div>
          )}

          {!loading && tweets.map(tweet => (
            <div
              key={tweet.id}
              className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/60 text-xs font-sans font-medium">
                  @{tweet.author_handle}
                </span>
                <div className="flex items-center gap-2">
                  <SentimentBadge score={tweet.sentiment_score} />
                  <span className="text-white/30 text-[10px] font-sans">
                    {tweet.likes.toLocaleString()} likes
                  </span>
                </div>
              </div>

              <p className="text-white/85 text-sm font-sans leading-relaxed">
                {tweet.content}
              </p>

              <a
                href={tweet.tweet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-sans text-white/30 hover:text-white/60 transition-colors"
              >
                View on X →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
