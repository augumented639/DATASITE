import React from 'react';
import { ShieldCheck, Database, Cpu, HelpCircle, ArrowRight, RefreshCw, BarChart2, BookOpen, AlertTriangle } from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-10 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2 uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Scientific & Analytical Integrity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Methodology, Data Provenance & Standards
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
          OmniData Intelligence is built on a strict policy of zero data fabrication. Every metric, chart, and observation presented in this platform is directly retrieved from verified public statistical APIs or computed through deterministic statistical algorithms.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        
        {/* 1. Public Data Sources & API Protocols */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              01. Connected Public Data Sources & API Ingestion
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            Our data ingestion pipeline interfaces directly with open data REST endpoints, primarily the <strong>World Bank API v2</strong>, which consolidates official statistical series from specialized global institutions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">World Development Indicators (WDI)</span>
              <p className="text-slate-400">Macroeconomic GDP, trade flows, industrial production, inflation (CPI), and national accounts.</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">International Telecommunication Union (ITU)</span>
              <p className="text-slate-400">Internet penetration, mobile subscriptions, and digital communications infrastructure data.</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">UNESCO Institute for Statistics</span>
              <p className="text-slate-400">Gross domestic R&D expenditure (% GDP), patent filings, scientific publications, and tertiary enrollment.</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">United Nations Population Division</span>
              <p className="text-slate-400">World Population Prospects, urban density rates, and demographic longevity statistics.</p>
            </div>
          </div>
        </section>

        {/* 2. Statistical Computations */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              02. Mathematical & Statistical Formulas
            </h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div>
              <span className="font-bold text-white block mb-1">Year-over-Year (YoY) Change:</span>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800">
                YoY% = ((Value_t - Value_t-1) / |Value_t-1|) * 100
              </div>
            </div>

            <div>
              <span className="font-bold text-white block mb-1">Compound Annual Growth Rate (CAGR):</span>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800">
                CAGR = ( (Value_end / Value_start) ^ (1 / (Year_end - Year_start)) - 1 ) * 100
              </div>
            </div>

            <div>
              <span className="font-bold text-white block mb-1">Indexed Growth Velocity (Base 100):</span>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800">
                Index_t = (Value_t / Value_baseYear) * 100
              </div>
            </div>
          </div>
        </section>

        {/* 3. Forecasting Methodology */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              03. Transparent Modeling & Projection Rules
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            When users request projections, our engine executes transparent, classical statistical algorithms rather than opaque generative black-boxes:
          </p>

          <div className="space-y-3 text-xs text-slate-400">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">Holt's Damped Linear Exponential Smoothing</span>
              <p className="leading-relaxed">
                Applies level update parameter (α = 0.35) and trend parameter (β = 0.15) with an autoregressive trend damping factor (φ = 0.90) to prevent unrealistic explosive trajectories over longer multi-year horizons.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-bold text-white block mb-1">95% Prediction Confidence Intervals</span>
              <p className="leading-relaxed">
                Uncertainty bands widen as the projection distance expands: ± 1.96 · Mean Absolute Error · √(h), where h is the forecast step ahead.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Mandatory Disclosure: </strong>
              All projections are explicitly marked as "Model-Generated Estimates" to ensure clear delineation between official reported statistics and computational extrapolations.
            </span>
          </div>
        </section>

        {/* 4. Missing Data & Quality Control */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              04. Missing Data Handling & Caching Protocols
            </h2>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
            <li><strong>No Synthetic Imputation: </strong> Missing observation years are preserved as non-reported gaps. We never fill missing years with interpolated or invented estimates.</li>
            <li><strong>Currency Integrity: </strong> Current US Dollar series are kept strictly separate from constant local currencies and percentage indices.</li>
            <li><strong>Cache Lifecycle: </strong> Responses from public APIs are cached with an adaptive 1-hour Time-To-Live (TTL). Users can bypass the cache at any time using the live "Refresh Data" control.</li>
            <li><strong>Open License Compliance: </strong> All datasets are attributed to their originating bodies in accordance with Creative Commons Attribution 4.0 (CC BY 4.0) standards.</li>
          </ul>
        </section>

      </div>
    </div>
  );
};
