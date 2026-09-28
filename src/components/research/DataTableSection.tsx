import React, { useState, useMemo } from 'react';
import { Table, Search, ArrowUpDown, Download, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { NormalizedDataPoint, IndicatorDefinition } from '../../types/data';
import { formatDataValue } from '../../services/statistics';

interface DataTableSectionProps {
  dataPoints: NormalizedDataPoint[];
  indicator: IndicatorDefinition;
  countryName: string;
}

export const DataTableSection: React.FC<DataTableSectionProps> = ({
  dataPoints,
  indicator,
  countryName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'year' | 'value'>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Filter and sort
  const processedData = useMemo(() => {
    let list = [...dataPoints];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        d =>
          d.year.toString().includes(q) ||
          (d.value !== null && d.value.toString().includes(q)) ||
          d.country.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (valB === null || valB === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [dataPoints, searchQuery, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const currentPageData = processedData.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: 'year' | 'value') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDownloadCSV = () => {
    const headers = 'Year,Country,CountryCode,Indicator,IndicatorCode,Value,Unit,Source\n';
    const rows = processedData
      .map(d => `${d.year},"${d.country}","${d.countryCode}","${d.indicator}","${d.indicatorCode}",${d.value ?? ''},"${d.unit}","${d.source}"`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicator.id}_table_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Tabular Dataset & Historical Observations
            </h2>
            <p className="text-xs text-slate-400">
              Complete chronological record for {countryName}.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by year or value..."
              className="py-1.5 pl-8 pr-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Table CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('year')}>
                <div className="flex items-center gap-1">
                  <span>Year</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Indicator</th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('value')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Reported Value</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">Source Organization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {currentPageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 italic font-sans">
                  No observations found matching the filter.
                </td>
              </tr>
            ) : (
              currentPageData.map((row, idx) => (
                <tr key={`${row.countryCode}-${row.year}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-200">
                    {row.year}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">
                    {row.country} <span className="text-[10px] text-slate-500">({row.countryCode})</span>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-300 truncate max-w-xs">
                    {indicator.name}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">
                    {row.value !== null ? (
                      <span className="font-bold text-cyan-400">
                        {formatDataValue(row.value, indicator.formatType, indicator.unit)}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic">Not Reported</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px]">
                    {indicator.unit}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px] truncate max-w-[200px]">
                    {row.source}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
        <div>
          Showing {processedData.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, processedData.length)} of {processedData.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 rounded-md transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 font-mono">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 rounded-md transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
