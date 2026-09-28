import { NormalizedDataPoint, IndicatorDefinition } from '../../types/data';

export interface IndicatorSearchResult {
  indicators: IndicatorDefinition[];
  total: number;
}

export interface FetchDataOptions {
  indicatorCode: string;
  countryCodes: string[]; // e.g. ['WLD', 'USA', 'IND']
  startYear?: number;
  endYear?: number;
}

export interface IDataProvider {
  readonly name: string;
  readonly baseUrl: string;
  readonly attribution: string;

  searchIndicators(query: string): Promise<IndicatorDefinition[]>;
  getIndicatorMetadata(indicatorCode: string): Promise<IndicatorDefinition | null>;
  getHistoricalData(options: FetchDataOptions): Promise<NormalizedDataPoint[]>;
}
