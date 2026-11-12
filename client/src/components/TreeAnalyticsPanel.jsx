import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Link2,
  Globe,
  Smartphone,
  Monitor,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

/**
 * A number with what it was before it, so a person can see if it went up.
 * @param {number} now
 * @param {number} before
 * @returns {object}
 */
function changeOf(now, before) {
  const current = Number(now) || 0;
  const previous = Number(before) || 0;
  const diff = current - previous;
  const percent = previous > 0 ? Math.round((diff / previous) * 100) : null;
  return {
    diff,
    percent,
    up: diff > 0,
    down: diff < 0,
    flat: diff === 0,
    hasBefore: previous > 0,
  };
}

function TrendPill({ change, label = 'vs yesterday' }) {
  if (!change.hasBefore) {
    return <span className="text-[10px] font-semibold text-gray-400">no data {label}</span>;
  }
  const Icon = change.up ? TrendingUp : change.down ? TrendingDown : Minus;
  const tone = change.up
    ? 'text-emerald-600 bg-emerald-50'
    : change.down
      ? 'text-rose-600 bg-rose-50'
      : 'text-gray-500 bg-gray-100';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${tone} px-1.5 py-0.5 rounded-full`}>
      <Icon className="w-2.5 h-2.5" />
      {change.percent === null ? `${change.diff > 0 ? '+' : ''}${change.diff}` : `${change.percent > 0 ? '+' : ''}${change.percent}%`}
    </span>
  );
}

function StatTile({ icon: Icon, label, value, sub, tone = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-3 sm:p-4 min-w-0">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[11px] font-bold truncate">{label}</span>
      </div>
      <div className={`text-xl sm:text-2xl font-black mt-1.5 truncate ${tone}`}>{value}</div>
      {sub ? <div className="text-[10px] font-semibold text-gray-400 mt-0.5 truncate">{sub}</div> : null}
    </div>
  );
}

/**
 * The numbers of one tree: the views, the clicks, the visitors, a day by
 * day line, the cards that are clicked and where the visitors came from.
 */
export function TreeAnalyticsPanel({ tree, initialDays = 30, variant = 'full' }) {
  const [days, setDays] = useState(initialDays);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const treeId = tree?.id;

  useEffect(() => {
    if (!treeId) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/trees/${treeId}/analytics?days=${days}`, {
      credentials: 'same-origin',
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'The numbers could not be read.');
        }
        return res.json();
      })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'The numbers could not be read.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [treeId, days]);

  const totals = data?.totals;
  const daily = data?.daily || [];

  const maxBar = useMemo(() => {
    let max = 1;
    for (const day of daily) {
      const total = (day.views || 0) + (day.clicks || 0);
      if (total > max) max = total;
    }
    return max;
  }, [daily]);

  const maxCardClicks = useMemo(
    () => Math.max(1, ...(data?.topCards || []).map((card) => card.clicks)),
    [data]
  );
  const maxReferrer = useMemo(
    () => Math.max(1, ...(data?.topReferrers || []).map((row) => row.count)),
    [data]
  );

  if (!treeId) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500">
        Pick a card to see its numbers.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Counting...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-red-200 bg-red-50/50 p-5 flex items-start gap-2 text-xs text-red-700">
        <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
        <span>{error}</span>
      </div>
    );
  }

  const views = totals?.views || 0;
  const clicks = totals?.clicks || 0;
  const visitors = totals?.visitors || 0;
  const rate = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;

  if (variant === 'compact') {
    // The small card on a phone: the numbers of the last week.
    return (
      <div className="w-full bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-extrabold text-sm text-[#111111]">Your visitors</div>
          <span className="text-[11px] font-bold text-gray-500">Last {days} days</span>
        </div>

        {views === 0 && clicks === 0 ? (
          <div className="text-xs text-gray-500">
            No activity during this time. Share your link to get the first visitor.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-lg font-black text-[#111111]">{views}</div>
              <div className="text-[10px] font-bold text-gray-500">Views</div>
            </div>
            <div>
              <div className="text-lg font-black text-[#111111]">{clicks}</div>
              <div className="text-[10px] font-bold text-gray-500">Clicks</div>
            </div>
            <div>
              <div className="text-lg font-black text-[#111111]">{visitors}</div>
              <div className="text-[10px] font-bold text-gray-500">Visitors</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* The numbers of today */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={Eye}
          label="Views"
          value={views.toLocaleString()}
          sub={
            <span className="flex items-center gap-1">
              {totals?.viewsToday || 0} today
              <TrendPill change={changeOf(totals?.viewsToday, totals?.viewsYesterday)} />
            </span>
          }
        />
        <StatTile
          icon={MousePointerClick}
          label="Clicks"
          value={clicks.toLocaleString()}
          sub={
            <span className="flex items-center gap-1">
              {totals?.clicksToday || 0} today
              <TrendPill change={changeOf(totals?.clicksToday, totals?.clicksYesterday)} />
            </span>
          }
        />
        <StatTile
          icon={Users}
          label="Visitors"
          value={visitors.toLocaleString()}
          sub={`${rate}% of the views clicked`}
        />
        <StatTile
          icon={BarChart3}
          label="All time"
          value={(totals?.allTimeViews || 0).toLocaleString()}
          sub={`${(totals?.allTimeClicks || 0).toLocaleString()} clicks since the start`}
          tone="text-purple-700"
        />
      </div>

      {/* The line of the days */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-extrabold text-[#111111]">Views and clicks by day</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              @{tree?.slug || 'your card'} · the last {days} days
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#F6F6F7] p-1 rounded-2xl text-[11px] font-bold">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => setDays(range.days)}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  days === range.days
                    ? 'bg-white shadow-xs text-black font-extrabold border border-gray-200/60'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#7033FF]" />
            Views
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-black" />
            Clicks
          </span>
        </div>

        <div className="flex items-end gap-[3px] sm:gap-1 h-32 sm:h-40 mt-3">
          {daily.map((day) => {
            const views = day.views || 0;
            const clicks = day.clicks || 0;
            const total = views + clicks;
            // The two bars sit on top of each other, so a day never grows
            // taller than the tallest day.
            const columnHeight = total > 0 ? (total / maxBar) * 100 : 0;
            const viewShare = total > 0 ? (views / total) * 100 : 0;
            const clickShare = total > 0 ? (clicks / total) * 100 : 0;
            return (
              <div
                key={day.date}
                className="flex-1 min-w-[3px] h-full flex flex-col justify-end"
                title={`${day.date}: ${views} views, ${clicks} clicks`}
              >
                {total > 0 ? (
                  <div className="w-full flex flex-col rounded-[3px] overflow-hidden" style={{ height: `${columnHeight}%` }}>
                    <div className="w-full bg-[#7033FF]" style={{ height: `${viewShare}%` }} />
                    <div className="w-full bg-black" style={{ height: `${clickShare}%` }} />
                  </div>
                ) : (
                  <div className="w-full h-[2px] rounded-full bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 mt-2">
          <span>{daily[0]?.date || ''}</span>
          <span>{daily[daily.length - 1]?.date || ''}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* The cards that are clicked */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-[#111111]">The cards that are clicked</h3>
          {(data?.topCards || []).length === 0 ? (
            <p className="text-xs text-gray-500 mt-3">No card has been clicked yet.</p>
          ) : (
            <ul className="space-y-2.5 mt-3">
              {data.topCards.map((card) => (
                <li key={card.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-gray-800 truncate flex items-center gap-1.5 min-w-0">
                      <Link2 className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{card.title}</span>
                    </span>
                    <span className="text-[11px] font-black text-gray-500 shrink-0">
                      {card.clicks}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7033FF]"
                      style={{ width: `${Math.round((card.clicks / maxCardClicks) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Where the visitors came from */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-[#111111]">Where the visitors came from</h3>
          {(data?.topReferrers || []).length === 0 ? (
            <p className="text-xs text-gray-500 mt-3">Nothing to show yet.</p>
          ) : (
            <ul className="space-y-2.5 mt-3">
              {data.topReferrers.map((row) => (
                <li key={row.source}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-gray-800 truncate flex items-center gap-1.5 min-w-0">
                      <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{row.source}</span>
                    </span>
                    <span className="text-[11px] font-black text-gray-500 shrink-0">{row.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{ width: `${Math.round((row.count / maxReferrer) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Phones and computers */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold text-[#111111]">What they used</h4>
            {(() => {
              const mobile = data?.devices?.mobile || 0;
              const desktop = data?.devices?.desktop || 0;
              const total = mobile + desktop;
              if (!total) {
                return <p className="text-xs text-gray-500 mt-2">No activity yet.</p>;
              }
              const mobilePercent = Math.round((mobile / total) * 100);
              return (
                <>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-gray-400" />
                      Phones {mobilePercent}%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-gray-400" />
                      Computers {100 - mobilePercent}%
                    </span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 mt-2">
                    <div className="bg-[#7033FF]" style={{ width: `${mobilePercent}%` }} />
                    <div className="bg-black" style={{ width: `${100 - mobilePercent}%` }} />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
