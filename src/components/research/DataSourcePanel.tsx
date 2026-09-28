import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Copy, Check, BookOpen, Clock, FileCode } from 'lucide-react';
import { IndicatorDefinition, StatisticalSummary, CountryInfo } from '../../types/data';

interface DataSourcePanelProps {
  indicator: IndicatorDefinition;
  country: CountryInfo;
  summary: StatisticalSummary | null;
  sourceUrl?: string;
  retrievedAt?: string;
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({
  indicator,
  country,
  summary,
  sourceUrl = indicator.sourceUrl,
  retrievedAt,
}) => {
  const [citationFormat, setCitationFormat] = useState<'APA' | 'Chicago' | 'Harvard' | 'BibTeX'>('APA');
  const [copied, setCopied] = useState(false);

  const retrievalDate = retrievedAt ? new Date(retrievedAt) : new Date();
  const yearStr = retrievalDate.getFullYear().toString();
  const formattedDate = retrievalDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getCitation = () => {
    switch (citationFormat) {
      case 'APA':
        return `World Bank. (${yearStr}). ${indicator.name} for ${country.name} [Data file]. World Development Indicators. Retrieved ${formattedDate}, from ${sourceUrl}`;
      case 'Chicago':
        return `World Bank. "${indicator.name} for ${country.name}." World Development Indicators. Accessed ${formattedDate}. ${sourceUrl}.`;
      case 'Harvard':
        return `World Bank, ${yearStr}. ${indicator.name} for ${country.name}. World Development Indicators [online]. Available at: <${sourceUrl}> [Accessed ${formattedDate}].`;
      case 'BibTeX':
        return `@misc{worldbank_${indicator.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${country.code.toLowerCase()},
  author = {World Bank Group},
  title = {${indicator.name} for ${country.name}},
  year = {${yearStr}},
  howpublished = {\\url{${sourceUrl}}},
  note = {Accessed: ${formattedDate}}
}`;
    }
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(getCitation());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Data Source & Attribution Transparency
            </h2>
            <p className="text-xs text-slate-400">
              Verifiable public provenance in compliance with open data standards.
            </p>
          </div>
        </div>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-lg text-xs font-semibold transition-colors"
        >
          <span>View Original Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Metadata Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] text-slate-500 block mb-1">Source Organization</span>
          <span className="text-xs font-semibold text-white block">
            {indicator.source}
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] text-slate-500 block mb-1">Standard Indicator Code</span>
          <code className="text-xs font-mono font-bold text-cyan-400 block">
            {indicator.id}
          </code>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] text-slate-500 block mb-1">API Query Endpoint</span>
          <span className="text-xs font-mono text-slate-300 block truncate" title={`https://api.worldbank.org/v2/country/${country.code}/indicator/${indicator.id}`}>
            v2/country/{country.code}/indicator/{indicator.id}
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] text-slate-500 block mb-1">Last API Retrieval</span>
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {retrievedAt ? new Date(retrievedAt).toUTCString() : new Date().toUTCString()}
          </span>
        </div>
      </div>

      {/* Academic Citation Generator */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate Research Citation:</span>
          </div>

          <div className="flex items-center gap-1">
            {(['APA', 'Chicago', 'Harvard', 'BibTeX'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setCitationFormat(fmt)}
                className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                  citationFormat === fmt
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {fmt}
              </button>
            ))}

            <button
              onClick={handleCopyCitation}
              className="ml-2 flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-800/60 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 select-all whitespace-pre-wrap">
          {getCitation()}
        </div>
      </div>
    </div>
  );
};
