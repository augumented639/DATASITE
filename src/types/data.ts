export type DataCategory =
  | 'Technology & AI'
  | 'Macroeconomics & GDP'
  | 'Demographics & Population'
  | 'Digital Economy & Internet'
  | 'Energy & Environment'
  | 'Trade & Industry'
  | 'Healthcare & Society'
  | 'Education & Labor';

export interface NormalizedDataPoint {
  country: string;
  countryCode: string; // ISO-3 or Regional Code
  indicator: string;
  indicatorCode: string;
  year: number;
  value: number | null;
  unit: string;
  source: string;
  sourceUrl: string;
  lastUpdated?: string;
  isEstimate?: boolean;
  region?: string;
}

export interface IndicatorDefinition {
  id: string; // World Bank code or provider code (e.g. NY.GDP.MKTP.CD)
  name: string;
  category: DataCategory;
  unit: string;
  unitPrefix?: string;
  unitSuffix?: string;
  description: string;
  source: string;
  sourceUrl: string;
  provider: 'World Bank' | 'OECD' | 'UN Data' | 'FRED' | 'Eurostat' | 'OpenData';
  defaultCountryCode: string;
  featured?: boolean;
  tags: string[];
  methodologyNote?: string;
  formatType?: 'currency' | 'percent' | 'count' | 'ratio' | 'decimal';
}

export interface CountryInfo {
  code: string; // ISO 3
  name: string;
  region: string;
  incomeLevel?: string;
  capital?: string;
}

export interface StatisticalSummary {
  latestYear: number;
  latestValue: number;
  previousYear: number;
  previousValue: number;
  yoyChangePercent: number | null;
  fiveYearChangePercent: number | null;
  cagr: number | null;
  highestValue: { year: number; value: number };
  lowestValue: { year: number; value: number };
  dataCoverage: {
    startYear: number;
    endYear: number;
    totalObservations: number;
    validObservations: number;
    missingYearsCount: number;
  };
  mean: number;
  median: number;
  standardDeviation: number;
  retrievedAt: string;
}

export interface ForecastPoint {
  year: number;
  forecastValue: number;
  lowerConfidence: number;
  upperConfidence: number;
  method: string;
}

export interface FactualInsight {
  id: string;
  title: string;
  statement: string;
  type: 'growth' | 'peak' | 'trough' | 'cagr' | 'coverage' | 'velocity';
  highlight: string;
}

export interface ReportConfig {
  id?: string;
  title: string;
  subtitle?: string;
  indicatorIds: string[];
  countryCodes: string[];
  startYear: number;
  endYear: number;
  includeForecast: boolean;
  forecastYears: number;
  includeRegional: boolean;
  includeTable: boolean;
  includeInsights: boolean;
  customNotes?: string;
  createdAt: string;
}

export interface ApiFetchStatus {
  loading: boolean;
  error: string | null;
  sourceUrl?: string;
  retrievedAt?: string;
  isCached?: boolean;
}
