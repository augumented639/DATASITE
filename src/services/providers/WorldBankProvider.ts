import { IDataProvider, FetchDataOptions } from './DataProvider';
import { NormalizedDataPoint, IndicatorDefinition } from '../../types/data';
import { POPULAR_INDICATORS, findIndicatorById } from '../indicatorCatalog';
import { MAJOR_COUNTRIES } from '../countryCatalog';

interface WBDataResponseItem {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit?: string;
  obs_status?: string;
  decimal?: number;
}

export class WorldBankProvider implements IDataProvider {
  readonly name = 'World Bank Open Data API (v2)';
  readonly baseUrl = 'https://api.worldbank.org/v2';
  readonly attribution = 'World Bank Group Open Data Indicators (CC BY 4.0)';

  async searchIndicators(query: string): Promise<IndicatorDefinition[]> {
    const q = (query || '').trim().toLowerCase();
    
    // First, search curated catalog for instant high-relevance match
    const catalogMatches = POPULAR_INDICATORS.filter(ind => {
      return (
        ind.name.toLowerCase().includes(q) ||
        ind.id.toLowerCase().includes(q) ||
        ind.description.toLowerCase().includes(q) ||
        ind.tags.some(t => t.toLowerCase().includes(q))
      );
    });

    if (catalogMatches.length > 0 || !q) {
      return catalogMatches;
    }

    // Secondary: Query World Bank live indicator search
    try {
      const url = `${this.baseUrl}/indicator?format=json&per_page=20&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) return catalogMatches;
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        const liveIndicators: IndicatorDefinition[] = data[1].map((item: any) => ({
          id: item.id,
          name: item.name,
          category: 'Macroeconomics & GDP',
          unit: item.unit || 'Standard Unit',
          description: item.sourceNote || 'Official World Bank Indicator dataset.',
          source: item.sourceOrganization || 'World Bank Data',
          sourceUrl: `https://data.worldbank.org/indicator/${item.id}`,
          provider: 'World Bank',
          defaultCountryCode: 'WLD',
          tags: [q, 'world bank', 'indicator'],
          methodologyNote: item.sourceOrganization || undefined
        }));

        // Deduplicate
        const ids = new Set(catalogMatches.map(m => m.id));
        const merged = [...catalogMatches];
        for (const item of liveIndicators) {
          if (!ids.has(item.id)) {
            merged.push(item);
            ids.add(item.id);
          }
        }
        return merged;
      }
    } catch (err) {
      console.warn('World Bank live indicator query warning:', err);
    }

    return catalogMatches;
  }

  async getIndicatorMetadata(indicatorCode: string): Promise<IndicatorDefinition | null> {
    const fromCatalog = findIndicatorById(indicatorCode);
    if (fromCatalog) return fromCatalog;

    try {
      const cleanCode = (indicatorCode || '').trim();
      const url = `${this.baseUrl}/indicator/${encodeURIComponent(cleanCode)}?format=json`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 1 && data[1][0]) {
        const item = data[1][0];
        return {
          id: item.id,
          name: item.name,
          category: 'Macroeconomics & GDP',
          unit: item.unit || 'Standard Unit',
          description: item.sourceNote || 'Official World Bank Indicator dataset.',
          source: item.sourceOrganization || 'World Bank',
          sourceUrl: `https://data.worldbank.org/indicator/${item.id}`,
          provider: 'World Bank',
          defaultCountryCode: 'WLD',
          tags: ['world bank'],
          methodologyNote: item.sourceOrganization || undefined
        };
      }
    } catch (e) {
      console.warn('Failed to fetch metadata for', indicatorCode, e);
    }
    return null;
  }

  async getHistoricalData(options: FetchDataOptions): Promise<NormalizedDataPoint[]> {
    const { indicatorCode, countryCodes = [] } = options;
    const cleanIndicatorCode = (indicatorCode || '').trim();
    
    if (!cleanIndicatorCode) {
      return [];
    }

    // Sanitize countries
    const validCountryCodes = countryCodes
      .map(c => (c || '').trim().toUpperCase())
      .filter(c => Boolean(c) && c.length >= 2);

    const countriesParam = validCountryCodes.length > 0 ? validCountryCodes.join(';') : 'WLD';

    // Sanitize start and end years
    const rawStart = Number(options.startYear);
    const rawEnd = Number(options.endYear);
    const minYear = !isNaN(rawStart) && rawStart >= 1960 ? Math.min(rawStart, !isNaN(rawEnd) ? rawEnd : 2026) : 1960;
    const maxYear = !isNaN(rawEnd) && rawEnd <= 2030 ? Math.max(rawStart || 1960, rawEnd) : 2026;

    let items: WBDataResponseItem[] = [];

    // Helper to fetch from World Bank endpoint
    const fetchFromWb = async (includeDateParam: boolean): Promise<WBDataResponseItem[]> => {
      let url = `${this.baseUrl}/country/${encodeURIComponent(countriesParam)}/indicator/${encodeURIComponent(cleanIndicatorCode)}?format=json&per_page=1000`;
      if (includeDateParam && minYear <= maxYear) {
        url += `&date=${minYear}:${maxYear}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        return [];
      }

      const json = await res.json();

      // Check if error message returned in World Bank envelope
      if (Array.isArray(json) && json[0]?.message) {
        return [];
      }

      if (Array.isArray(json) && json.length >= 2 && Array.isArray(json[1])) {
        return json[1];
      }

      return [];
    };

    try {
      // First attempt: fetch with date range
      items = await fetchFromWb(true);

      // Fallback attempt: if date parameter caused an error or returned empty, fetch all years and filter in JS
      if (items.length === 0) {
        items = await fetchFromWb(false);
      }
    } catch (err) {
      console.warn(`World Bank fetch notice for ${cleanIndicatorCode}:`, err);
      // Secondary fallback without date
      try {
        items = await fetchFromWb(false);
      } catch {
        items = [];
      }
    }

    if (!items || items.length === 0) {
      return [];
    }

    const indicatorMeta = findIndicatorById(cleanIndicatorCode);
    const unit = indicatorMeta?.unit || 'Units';
    const source = indicatorMeta?.source || 'World Bank Open Data';
    const sourceUrl = indicatorMeta?.sourceUrl || `https://data.worldbank.org/indicator/${cleanIndicatorCode}`;

    // Map into NormalizedDataPoint array and filter by date range
    const normalized: NormalizedDataPoint[] = [];

    for (const item of items) {
      if (!item) continue;
      const yr = parseInt(item.date, 10);
      if (isNaN(yr) || yr < minYear || yr > maxYear) {
        continue;
      }

      const countryCode = item.countryiso3code || item.country?.id || 'UNKNOWN';
      const countryName = item.country?.value || countryCode;
      const val = item.value !== null && item.value !== undefined ? Number(item.value) : null;
      const matchedCountry = MAJOR_COUNTRIES.find(c => c.code === countryCode);

      normalized.push({
        country: matchedCountry?.name || countryName,
        countryCode: countryCode,
        indicator: item.indicator?.value || indicatorMeta?.name || cleanIndicatorCode,
        indicatorCode: cleanIndicatorCode,
        year: yr,
        value: val,
        unit: unit,
        source: source,
        sourceUrl: sourceUrl,
        lastUpdated: new Date().toISOString(),
        region: matchedCountry?.region || undefined,
        isEstimate: false,
      });
    }

    // Sort chronologically ascending
    return normalized.sort((a, b) => a.year - b.year);
  }
}
