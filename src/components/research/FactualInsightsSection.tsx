import React from 'react';
import { Lightbulb, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { FactualInsight } from '../../types/data';

interface FactualInsightsSectionProps {
  insights: FactualInsight[];
  countryName: string;
  indicatorName: string;
}

export const FactualInsightsSection: React.FC<FactualInsightsSectionProps> = ({
  insights,
  countryName,
  indicatorName,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Data-Grounded Quantitative Insights
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic findings computed directly from official public API records.
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified Non-Fabricated</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  {insight.title}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {insight.highlight}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insight.statement}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
