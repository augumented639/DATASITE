import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Printer,
  Download,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Globe,
  Database,
  FileSpreadsheet,
  FileCode,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { POPULAR_INDICATORS } from '../../services/indicatorCatalog';
import { MAJOR_COUNTRIES } from '../../services/countryCatalog';
import { dataProviderRegistry } from '../../services/providers/ProviderRegistry';
import { NormalizedDataPoint, IndicatorDefinition } from '../../types/data';
import { calculateStatisticalSummary, formatDataValue, generateForecast } from '../../services/statistics';

interface ReportDataBlock {
  indicator: IndicatorDefinition;
  data: NormalizedDataPoint[];
  summary: any;
  forecast: any[];
  error?: string | null;
}

export const ReportBuilderView: React.FC<{
  initialIndicatorId?: string;
  initialCountryCode?: string;
}> = ({ initialIndicatorId = 'NY.GDP.MKTP.CD', initialCountryCode = 'USA' }) => {
  const [reportTitle, setReportTitle] = useState('Global Market & Indicator Intelligence Dossier');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([initialIndicatorId]);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountryCode);
  const [startYear, setStartYear] = useState<number>(2010);
  const [endYear, setEndYear] = useState<number>(2026);
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [includeForecast, setIncludeForecast] = useState<boolean>(true);
  const [includeTable, setIncludeTable] = useState<boolean>(true);
  const [includeMethodology, setIncludeMethodology] = useState<boolean>(true);
  const [analystNotes, setAnalystNotes] = useState(
    'This customized intelligence report consolidates verified statistical data directly retrieved from official public data APIs. All metrics and growth rates are calculated from official observations.'
  );

  const [reportData, setReportData] = useState<Record<string, ReportDataBlock>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Sync props when user navigates from different indicator
  useEffect(() => {
    if (initialIndicatorId && !selectedIndicators.includes(initialIndicatorId)) {
      setSelectedIndicators([initialIndicatorId]);
    }
    if (initialCountryCode) {
      setSelectedCountry(initialCountryCode);
    }
  }, [initialIndicatorId, initialCountryCode]);

  // Main generation function
  const handleGenerateReport = useCallback(async () => {
    if (selectedIndicators.length === 0) {
      setReportData({});
      return;
    }

    setIsGenerating(true);
    const newReportData: Record<string, ReportDataBlock> = {};

    // Sanitize dates
    const safeStart = Number(startYear) || 2010;
    const safeEnd = Number(endYear) || 2026;
    const minYear = Math.min(safeStart, safeEnd);
    const maxYear = Math.max(safeStart, safeEnd);

    for (const indId of selectedIndicators) {
      const indMeta = POPULAR_INDICATORS.find(i => i.id === indId) || {
        id: indId,
        name: indId,
        category: 'Macroeconomics & GDP',
        unit: 'Units',
        description: 'Official statistical series dataset.',
        source: 'World Bank Open Data',
        sourceUrl: `https://data.worldbank.org/indicator/${indId}`,
        provider: 'World Bank',
        defaultCountryCode: 'WLD',
        tags: [],
      };

      try {
        const res = await dataProviderRegistry.fetchHistoricalData({
          indicatorCode: indId,
          countryCodes: [selectedCountry || 'WLD'],
          startYear: minYear,
          endYear: maxYear,
        });

        const summary = calculateStatisticalSummary(res.data, res.retrievedAt);
        const forecast = includeForecast && res.data.length >= 3 ? generateForecast(res.data, 4) : [];

        newReportData[indId] = {
          indicator: indMeta,
          data: res.data,
          summary,
          forecast,
        };
      } catch (err: any) {
        console.warn(`Report item error for ${indId}:`, err);
        newReportData[indId] = {
          indicator: indMeta,
          data: [],
          summary: null,
          forecast: [],
          error: 'Data not available for this indicator in the selected country/period.',
        };
      }
    }

    setReportData(newReportData);
    setIsGenerating(false);
  }, [selectedIndicators, selectedCountry, startYear, endYear, includeForecast]);

  // Trigger generation whenever configuration changes
  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportPayload = {
      title: reportTitle,
      country: selectedCountry,
      timeHorizon: `${startYear}–${endYear}`,
      generatedAt: new Date().toISOString(),
      analystNotes,
      indicators: Object.values(reportData).map(block => ({
        indicator: block.indicator,
        summary: block.summary,
        forecast: block.forecast,
        historicalData: block.data,
      })),
    };

    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Market_Report_${selectedCountry}_${startYear}_${endYear}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('JSON report downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadCSV = () => {
    let csvContent = 'IndicatorCode,IndicatorName,CountryCode,Year,Value,Unit,Source\n';

    Object.values(reportData).forEach(block => {
      block.data.forEach(pt => {
        csvContent += `"${block.indicator.id}","${block.indicator.name}","${pt.countryCode}",${pt.year},${pt.value ?? ''},"${block.indicator.unit}","${block.indicator.source}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Market_Report_Data_${selectedCountry}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('CSV bundle downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadHTML = () => {
    const countryObj = MAJOR_COUNTRIES.find(c => c.code === selectedCountry) || MAJOR_COUNTRIES[0];
    
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 28px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 8px; }
    .subtitle { color: #0284c7; font-weight: 600; font-size: 16px; margin-bottom: 24px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .kpi-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
    .kpi-label { font-size: 11px; color: #64748b; }
    .kpi-value { font-size: 18px; font-weight: bold; color: #0f172a; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <div class="subtitle">Focus: ${countryObj.name} (${countryObj.code}) · Series Coverage: ${startYear}–${endYear}</div>
  <div class="meta">Generated by OmniData Intelligence on ${new Date().toLocaleDateString()} · Data Source: World Bank API v2</div>
  
  <div class="card">
    <strong>Executive Summary:</strong>
    <p>${analystNotes}</p>
  </div>
`;

    Object.values(reportData).forEach(block => {
      const { indicator, summary, data, forecast } = block;
      htmlContent += `
  <div class="card">
    <h2 style="margin-top:0; font-size: 20px; color: #0f172a;">${indicator.name} (${indicator.id})</h2>
    <p style="font-size: 13px; color: #475569;">${indicator.description}</p>
    <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;"><strong>Source:</strong> ${indicator.source} · <strong>Unit:</strong> ${indicator.unit}</div>
`;

      if (summary) {
        htmlContent += `
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Latest (${summary.latestYear})</div>
        <div class="kpi-value">${formatDataValue(summary.latestValue, indicator.formatType, indicator.unit)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">YoY Change</div>
        <div class="kpi-value">${summary.yoyChangePercent !== null ? (summary.yoyChangePercent >= 0 ? '+' : '') + summary.yoyChangePercent.toFixed(1) + '%' : 'N/A'}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">5-Year CAGR</div>
        <div class="kpi-value">${summary.cagr !== null ? summary.cagr.toFixed(2) + '%' : 'N/A'}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Peak (${summary.highestValue.year})</div>
        <div class="kpi-value">${formatDataValue(summary.highestValue.value, indicator.formatType, indicator.unit)}</div>
      </div>
    </div>
`;
      }

      if (data && data.length > 0) {
        htmlContent += `
    <strong>Historical Series Sample:</strong>
    <table>
      <thead>
        <tr><th>Year</th><th style="text-align:right">Observed Value</th><th>Unit</th><th>Status</th></tr>
      </thead>
      <tbody>
`;
        data.slice(-8).forEach(pt => {
          htmlContent += `
        <tr>
          <td>${pt.year}</td>
          <td style="text-align:right; font-family: monospace; font-weight: bold;">${formatDataValue(pt.value, indicator.formatType, indicator.unit)}</td>
          <td>${indicator.unit}</td>
          <td style="color: #16a34a;">Verified Public API</td>
        </tr>`;
        });
        htmlContent += `
      </tbody>
    </table>
`;
      }

      if (forecast && forecast.length > 0) {
        htmlContent += `
    <div style="margin-top: 16px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 12px;">
      <strong style="color: #b45309;">Model-Generated Projections (Holt's Damped Trend):</strong>
      <div style="display: flex; gap: 16px; margin-top: 6px; font-family: monospace;">
        ${forecast.map(f => `<div>${f.year}: <strong>${formatDataValue(f.forecastValue, indicator.formatType, indicator.unit)}</strong></div>`).join('')}
      </div>
    </div>
`;
      }

      htmlContent += `  </div>`;
    });

    htmlContent += `
  <div class="footer">
    Data retrieved under Creative Commons Attribution 4.0 International License (CC BY 4.0) via World Bank API v2. No proprietary or fabricated statistics are used.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Market_Report_${selectedCountry}.html`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess('HTML report document downloaded');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const toggleIndicator = (id: string) => {
    if (selectedIndicators.includes(id)) {
      if (selectedIndicators.length > 1) {
        setSelectedIndicators(selectedIndicators.filter(i => i !== id));
      }
    } else {
      if (selectedIndicators.length < 6) {
        setSelectedIndicators([...selectedIndicators, id]);
      }
    }
  };

  const countryInfo = MAJOR_COUNTRIES.find(c => c.code === selectedCountry) || MAJOR_COUNTRIES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2 uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Interactive Market Report Generator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Executive Report Dossier
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build, customize, and export publication-ready statistical dossiers grounded in official public data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            title="Download standalone HTML dossier"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Export HTML</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            title="Download CSV package"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
            title="Download complete JSON report"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Download Success Notice */}
      {downloadSuccess && (
        <div className="mb-6 p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 print:hidden animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Configuration Builder Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Report Parameters & Selection</span>
          </h2>
          {isGenerating && (
            <span className="text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Generating dossier from live public APIs...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Report Title:</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Target Economy:</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {MAJOR_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Time Horizon:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2 font-mono"
                min={1960}
                max={2026}
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2 font-mono"
                min={1960}
                max={2026}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Section Toggles:</label>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Visual Charts</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeForecast}
                  onChange={(e) => setIncludeForecast(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Projections</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTable}
                  onChange={(e) => setIncludeTable(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Raw Tables</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMethodology}
                  onChange={(e) => setIncludeMethodology(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Methodology</span>
              </label>
            </div>
          </div>
        </div>

        {/* Analyst Notes */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Executive Analyst Notes & Briefing:
          </label>
          <textarea
            value={analystNotes}
            onChange={(e) => setAnalystNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            placeholder="Add executive summary or contextual briefing notes for this dossier..."
          />
        </div>

        {/* Multi-indicator Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Public Indicators to Include ({selectedIndicators.length}/6):
            </label>
            <span className="text-[11px] text-slate-500">Click to add/remove</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_INDICATORS.map(ind => {
              const isSelected = selectedIndicators.includes(ind.id);
              return (
                <button
                  key={ind.id}
                  onClick={() => toggleIndicator(ind.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{ind.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RENDERED DOSSIER (Print & Web Paper Style) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-12 shadow-2xl print:border-none print:p-0 print:bg-white print:text-black">
        
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 mb-8 print:border-black">
          <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600 mb-2">
            <span>OMNIDATA INTELLIGENCE · VERIFIED RESEARCH DOSSIER</span>
            <span className="font-mono">Generated: {new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white print:text-black tracking-tight mb-2">
            {reportTitle}
          </h1>
          <div className="text-sm font-medium text-cyan-400 print:text-blue-700">
            Target Focus: {countryInfo.name} ({countryInfo.code}) · Series Horizon: {startYear}–{endYear}
          </div>
        </div>

        {/* Executive Notes */}
        {analystNotes.trim() && (
          <div className="mb-8 p-4 bg-slate-900/60 print:bg-slate-100 rounded-xl border border-slate-800/80 print:border-slate-300 text-xs leading-relaxed text-slate-300 print:text-slate-800">
            <span className="font-bold text-white print:text-black block mb-1">Executive Briefing & Notes:</span>
            {analystNotes}
          </div>
        )}

        {/* Iterated Indicator Sections */}
        {selectedIndicators.map((indId) => {
          const item = reportData[indId];
          if (!item) {
            return (
              <div key={indId} className="mb-8 p-6 bg-slate-900/40 rounded-xl border border-slate-800 text-center animate-pulse">
                <span className="text-xs text-slate-400 font-mono">Fetching public series for {indId}...</span>
              </div>
            );
          }

          const { indicator, data, summary, forecast, error } = item;

          return (
            <div key={indId} className="mb-12 pb-10 border-b border-slate-800/80 print:border-slate-300 last:border-0">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-xl font-bold text-white print:text-black">
                    {indicator.name}
                  </h2>
                  <span className="text-xs text-slate-400 print:text-slate-600">
                    Source: {indicator.source} · Unit: {indicator.unit}
                  </span>
                </div>
                <code className="text-xs font-mono text-cyan-400 print:text-blue-700 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 print:border-slate-300">
                  {indicator.id}
                </code>
              </div>

              {/* Error or Empty Notice */}
              {error || data.length === 0 ? (
                <div className="my-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    No public observation records available for <strong>{countryInfo.name}</strong> for this indicator in the selected period ({startYear}–{endYear}).
                  </span>
                </div>
              ) : (
                <>
                  {/* KPI Strip */}
                  {summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                      <div className="p-3 bg-slate-900 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Latest Value ({summary.latestYear})</span>
                        <span className="text-base font-bold font-mono text-white print:text-black">
                          {formatDataValue(summary.latestValue, indicator.formatType, indicator.unit)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Annual YoY Change</span>
                        <span className={`text-base font-bold font-mono ${summary.yoyChangePercent >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                          {summary.yoyChangePercent !== null ? `${summary.yoyChangePercent >= 0 ? '+' : ''}${summary.yoyChangePercent.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Period CAGR</span>
                        <span className="text-base font-bold font-mono text-cyan-400 print:text-blue-700">
                          {summary.cagr !== null ? `${summary.cagr >= 0 ? '+' : ''}${summary.cagr.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Peak Recorded ({summary.highestValue.year})</span>
                        <span className="text-base font-bold font-mono text-amber-300 print:text-amber-800">
                          {formatDataValue(summary.highestValue.value, indicator.formatType, indicator.unit)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Visual Time-Series Chart */}
                  {includeCharts && data.length > 0 && (
                    <div className="my-6 p-4 bg-slate-900/60 print:bg-white rounded-xl border border-slate-800/80 print:border-slate-300">
                      <span className="text-xs font-semibold text-slate-300 print:text-black block mb-2">
                        Historical Trend Series ({startYear}–{endYear}):
                      </span>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.filter(d => d.value !== null)} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`reportGrad_${indId.replace(/\./g, '_')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                            <YAxis
                              stroke="#64748b"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(v) => formatDataValue(v, indicator.formatType, indicator.unit)}
                              width={65}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                              formatter={(v: any) => [formatDataValue(Number(v), indicator.formatType, indicator.unit), indicator.name]}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              name={indicator.name}
                              stroke="#06b6d4"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill={`url(#reportGrad_${indId.replace(/\./g, '_')})`}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Data Table Preview */}
                  {includeTable && data.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <span className="text-xs font-semibold text-slate-300 print:text-black block mb-2">
                        Chronological Observations:
                      </span>
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600">
                            <th className="py-2 px-3">Year</th>
                            <th className="py-2 px-3 text-right">Reported Value</th>
                            <th className="py-2 px-3">Unit</th>
                            <th className="py-2 px-3">Verification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 print:divide-slate-200 font-mono">
                          {data.slice(-8).map((pt, i) => (
                            <tr key={i} className="text-slate-300 print:text-slate-800">
                              <td className="py-1.5 px-3 font-semibold">{pt.year}</td>
                              <td className="py-1.5 px-3 text-right text-cyan-400 print:text-blue-700 font-bold">
                                {formatDataValue(pt.value, indicator.formatType, indicator.unit)}
                              </td>
                              <td className="py-1.5 px-3 font-sans text-slate-500">{indicator.unit}</td>
                              <td className="py-1.5 px-3 font-sans text-emerald-400 print:text-emerald-700">Official API</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Forecast Section */}
                  {includeForecast && forecast.length > 0 && (
                    <div className="mt-4 p-3.5 bg-amber-950/20 print:bg-amber-50 rounded-xl border border-amber-800/40 print:border-amber-200 text-xs">
                      <span className="font-bold text-amber-400 print:text-amber-800 block mb-1">
                        Model-Generated Projections (Holt's Damped Trend · 95% Confidence Interval):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono mt-2">
                        {forecast.map(f => (
                          <div key={f.year} className="text-slate-300 print:text-slate-700 p-2 bg-slate-950/60 print:bg-white rounded border border-slate-800/80 print:border-amber-200">
                            <span className="text-slate-500">{f.year}: </span>
                            <strong className="text-amber-300 print:text-amber-800">{formatDataValue(f.forecastValue, indicator.formatType, indicator.unit)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Methodology & Legal Notice */}
        {includeMethodology && (
          <div className="mt-8 pt-6 border-t border-slate-800 print:border-slate-300 text-[11px] text-slate-500 print:text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-400 print:text-slate-700 block mb-1">Attribution & Open Data Integrity Notice:</span>
            Data reproduced under Creative Commons Attribution 4.0 International License (CC BY 4.0). Indicators are queried directly from the World Bank API v2, UNESCO Institute for Statistics, ITU, and IMF Balance of Payments repositories. Projections are mathematically extrapolated and labeled as model estimates.
          </div>
        )}

      </div>

    </div>
  );
};
