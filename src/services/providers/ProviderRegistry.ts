import { IDataProvider, FetchDataOptions } from './DataProvider';
import { WorldBankProvider } from './WorldBankProvider';
import { NormalizedDataPoint, IndicatorDefinition } from '../../types/data';
import { POPULAR_INDICATORS } from '../indicatorCatalog';
import { MAJOR_COUNTRIES } from '../countryCatalog';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour client cache

export class DataProviderRegistry {
  private providers: Map<string, IDataProvider> = new Map();
  private primaryProvider: IDataProvider;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    const wb = new WorldBankProvider();
    this.providers.set('World Bank', wb);
    this.primaryProvider = wb;
  }

  registerProvider(name: string, provider: IDataProvider) {
    this.providers.set(name, provider);
  }

  getProvider(name?: string): IDataProvider {
    if (name && this.providers.has(name)) {
      return this.providers.get(name)!;
    }
    return this.primaryProvider;
  }

  /**
   * Parses natural language query to detect mentioned countries and topics
   * e.g. "India GDP", "Renewable energy in Germany", "China Population", "Electric vehicles"
   */
  parseSearchIntent(query: string): { countryCode: string | null; countryName: string | null; topic: string } {
    const qLower = query.toLowerCase().trim();
    let detectedCountry: { code: string; name: string } | null = null;

    for (const c of MAJOR_COUNTRIES) {
      const cNameLower = c.name.toLowerCase();
      const cCodeLower = c.code.toLowerCase();

      // Check word boundary or substring match for country name/code
      if (
        qLower.includes(` ${cNameLower} `) ||
        qLower.startsWith(`${cNameLower} `) ||
        qLower.endsWith(` ${cNameLower}`) ||
        qLower === cNameLower ||
        qLower.includes(`in ${cNameLower}`) ||
        qLower.includes(`for ${cNameLower}`) ||
        qLower.includes(cCodeLower)
      ) {
        detectedCountry = { code: c.code, name: c.name };
        break;
      }
    }

    let cleanTopic = qLower;
    if (detectedCountry) {
      cleanTopic = cleanTopic
        .replace(new RegExp(`\\b${detectedCountry.name.toLowerCase()}\\b`, 'gi'), '')
        .replace(new RegExp(`\\b${detectedCountry.code.toLowerCase()}\\b`, 'gi'), '')
        .replace(/\b(in|for|of|and|the)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return {
      countryCode: detectedCountry ? detectedCountry.code : null,
      countryName: detectedCountry ? detectedCountry.name : null,
      topic: cleanTopic || query.trim(),
    };
  }

  async searchIndicators(query: string): Promise<IndicatorDefinition[]> {
    const { topic } = this.parseSearchIntent(query);
    const searchTerm = topic || query;

    return this.primaryProvider.searchIndicators(searchTerm);
  }

  async getIndicatorMetadata(indicatorCode: string): Promise<IndicatorDefinition | null> {
    return this.primaryProvider.getIndicatorMetadata(indicatorCode);
  }

  async fetchHistoricalData(options: FetchDataOptions, bypassCache = false): Promise<{
    data: NormalizedDataPoint[];
    sourceUrl: string;
    retrievedAt: string;
    fromCache: boolean;
  }> {
    const cacheKey = `data_${options.indicatorCode}_${options.countryCodes.sort().join('_')}_${options.startYear || 1990}_${options.endYear || 2026}`;

    if (!bypassCache) {
      // Check memory cache
      const mem = this.memoryCache.get(cacheKey);
      if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
        return {
          data: mem.data,
          sourceUrl: `https://data.worldbank.org/indicator/${options.indicatorCode}`,
          retrievedAt: new Date(mem.timestamp).toISOString(),
          fromCache: true,
        };
      }

      // Check localStorage cache
      try {
        const raw = localStorage.getItem(`omnistat_${cacheKey}`);
        if (raw) {
          const parsed: CacheEntry<NormalizedDataPoint[]> = JSON.parse(raw);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            this.memoryCache.set(cacheKey, parsed);
            return {
              data: parsed.data,
              sourceUrl: `https://data.worldbank.org/indicator/${options.indicatorCode}`,
              retrievedAt: new Date(parsed.timestamp).toISOString(),
              fromCache: true,
            };
          }
        }
      } catch {
        // ignore localStorage errors
      }
    }

    // Fetch from provider
    const data = await this.primaryProvider.getHistoricalData(options);
    const timestamp = Date.now();

    const entry: CacheEntry<NormalizedDataPoint[]> = {
      data,
      timestamp,
    };

    this.memoryCache.set(cacheKey, entry);
    try {
      localStorage.setItem(`omnistat_${cacheKey}`, JSON.stringify(entry));
    } catch {
      // ignore quota errors
    }

    return {
      data,
      sourceUrl: `https://data.worldbank.org/indicator/${options.indicatorCode}`,
      retrievedAt: new Date(timestamp).toISOString(),
      fromCache: false,
    };
  }
}

export const dataProviderRegistry = new DataProviderRegistry();
