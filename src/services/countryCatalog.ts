import { CountryInfo } from '../types/data';

export const MAJOR_COUNTRIES: CountryInfo[] = [
  // Global & Regional Aggregates
  { code: 'WLD', name: 'World (Total)', region: 'Global' },
  { code: 'NAC', name: 'North America', region: 'North America' },
  { code: 'EUU', name: 'European Union', region: 'Europe' },
  { code: 'EAS', name: 'East Asia & Pacific', region: 'East Asia & Pacific' },
  { code: 'SAS', name: 'South Asia', region: 'South Asia' },
  { code: 'MEA', name: 'Middle East & North Africa', region: 'Middle East & North Africa' },
  { code: 'LCN', name: 'Latin America & Caribbean', region: 'Latin America & Caribbean' },
  { code: 'SSF', name: 'Sub-Saharan Africa', region: 'Sub-Saharan Africa' },
  { code: 'HIC', name: 'High Income Countries', region: 'Income Group' },
  { code: 'MIC', name: 'Middle Income Countries', region: 'Income Group' },
  { code: 'LIC', name: 'Low Income Countries', region: 'Income Group' },

  // Countries (G20, Major Economies, Emerging Markets)
  { code: 'USA', name: 'United States', region: 'North America', capital: 'Washington, D.C.', incomeLevel: 'High Income' },
  { code: 'CHN', name: 'China', region: 'East Asia & Pacific', capital: 'Beijing', incomeLevel: 'Upper Middle Income' },
  { code: 'IND', name: 'India', region: 'South Asia', capital: 'New Delhi', incomeLevel: 'Lower Middle Income' },
  { code: 'DEU', name: 'Germany', region: 'Europe', capital: 'Berlin', incomeLevel: 'High Income' },
  { code: 'JPN', name: 'Japan', region: 'East Asia & Pacific', capital: 'Tokyo', incomeLevel: 'High Income' },
  { code: 'GBR', name: 'United Kingdom', region: 'Europe', capital: 'London', incomeLevel: 'High Income' },
  { code: 'FRA', name: 'France', region: 'Europe', capital: 'Paris', incomeLevel: 'High Income' },
  { code: 'ITA', name: 'Italy', region: 'Europe', capital: 'Rome', incomeLevel: 'High Income' },
  { code: 'BRA', name: 'Brazil', region: 'Latin America & Caribbean', capital: 'Brasília', incomeLevel: 'Upper Middle Income' },
  { code: 'CAN', name: 'Canada', region: 'North America', capital: 'Ottawa', incomeLevel: 'High Income' },
  { code: 'KOR', name: 'South Korea', region: 'East Asia & Pacific', capital: 'Seoul', incomeLevel: 'High Income' },
  { code: 'AUS', name: 'Australia', region: 'East Asia & Pacific', capital: 'Canberra', incomeLevel: 'High Income' },
  { code: 'MEX', name: 'Mexico', region: 'Latin America & Caribbean', capital: 'Mexico City', incomeLevel: 'Upper Middle Income' },
  { code: 'IDN', name: 'Indonesia', region: 'East Asia & Pacific', capital: 'Jakarta', incomeLevel: 'Upper Middle Income' },
  { code: 'SAU', name: 'Saudi Arabia', region: 'Middle East & North Africa', capital: 'Riyadh', incomeLevel: 'High Income' },
  { code: 'TUR', name: 'Turkey', region: 'Europe', capital: 'Ankara', incomeLevel: 'Upper Middle Income' },
  { code: 'ESP', name: 'Spain', region: 'Europe', capital: 'Madrid', incomeLevel: 'High Income' },
  { code: 'NLD', name: 'Netherlands', region: 'Europe', capital: 'Amsterdam', incomeLevel: 'High Income' },
  { code: 'CHE', name: 'Switzerland', region: 'Europe', capital: 'Bern', incomeLevel: 'High Income' },
  { code: 'SGP', name: 'Singapore', region: 'East Asia & Pacific', capital: 'Singapore', incomeLevel: 'High Income' },
  { code: 'SWE', name: 'Sweden', region: 'Europe', capital: 'Stockholm', incomeLevel: 'High Income' },
  { code: 'POL', name: 'Poland', region: 'Europe', capital: 'Warsaw', incomeLevel: 'High Income' },
  { code: 'ZAF', name: 'South Africa', region: 'Sub-Saharan Africa', capital: 'Pretoria', incomeLevel: 'Upper Middle Income' },
  { code: 'EGY', name: 'Egypt', region: 'Middle East & North Africa', capital: 'Cairo', incomeLevel: 'Lower Middle Income' },
  { code: 'ARE', name: 'United Arab Emirates', region: 'Middle East & North Africa', capital: 'Abu Dhabi', incomeLevel: 'High Income' },
  { code: 'NGA', name: 'Nigeria', region: 'Sub-Saharan Africa', capital: 'Abuja', incomeLevel: 'Lower Middle Income' },
  { code: 'ARG', name: 'Argentina', region: 'Latin America & Caribbean', capital: 'Buenos Aires', incomeLevel: 'Upper Middle Income' },
  { code: 'VNM', name: 'Vietnam', region: 'East Asia & Pacific', capital: 'Hanoi', incomeLevel: 'Lower Middle Income' },
  { code: 'THA', name: 'Thailand', region: 'East Asia & Pacific', capital: 'Bangkok', incomeLevel: 'Upper Middle Income' },
  { code: 'NOR', name: 'Norway', region: 'Europe', capital: 'Oslo', incomeLevel: 'High Income' },
  { code: 'IRL', name: 'Ireland', region: 'Europe', capital: 'Dublin', incomeLevel: 'High Income' },
  { code: 'ISR', name: 'Israel', region: 'Middle East & North Africa', capital: 'Jerusalem', incomeLevel: 'High Income' },
  { code: 'MYS', name: 'Malaysia', region: 'East Asia & Pacific', capital: 'Kuala Lumpur', incomeLevel: 'Upper Middle Income' },
  { code: 'PHL', name: 'Philippines', region: 'East Asia & Pacific', capital: 'Manila', incomeLevel: 'Lower Middle Income' },
  { code: 'CHL', name: 'Chile', region: 'Latin America & Caribbean', capital: 'Santiago', incomeLevel: 'High Income' },
  { code: 'COL', name: 'Colombia', region: 'Latin America & Caribbean', capital: 'Bogotá', incomeLevel: 'Upper Middle Income' },
  { code: 'NZL', name: 'New Zealand', region: 'East Asia & Pacific', capital: 'Wellington', incomeLevel: 'High Income' },
  { code: 'DNK', name: 'Denmark', region: 'Europe', capital: 'Copenhagen', incomeLevel: 'High Income' },
  { code: 'FIN', name: 'Finland', region: 'Europe', capital: 'Helsinki', incomeLevel: 'High Income' },
  { code: 'AUT', name: 'Austria', region: 'Europe', capital: 'Vienna', incomeLevel: 'High Income' },
  { code: 'BEL', name: 'Belgium', region: 'Europe', capital: 'Brussels', incomeLevel: 'High Income' },
  { code: 'PAK', name: 'Pakistan', region: 'South Asia', capital: 'Islamabad', incomeLevel: 'Lower Middle Income' },
  { code: 'BGD', name: 'Bangladesh', region: 'South Asia', capital: 'Dhaka', incomeLevel: 'Lower Middle Income' },
  { code: 'KEN', name: 'Kenya', region: 'Sub-Saharan Africa', capital: 'Nairobi', incomeLevel: 'Lower Middle Income' },
  { code: 'GHA', name: 'Ghana', region: 'Sub-Saharan Africa', capital: 'Accra', incomeLevel: 'Lower Middle Income' },
  { code: 'QAT', name: 'Qatar', region: 'Middle East & North Africa', capital: 'Doha', incomeLevel: 'High Income' },
];

export const REGIONS_LIST = [
  { code: 'NAC', name: 'North America' },
  { code: 'EUU', name: 'European Union' },
  { code: 'EAS', name: 'East Asia & Pacific' },
  { code: 'SAS', name: 'South Asia' },
  { code: 'MEA', name: 'Middle East & North Africa' },
  { code: 'LCN', name: 'Latin America & Caribbean' },
  { code: 'SSF', name: 'Sub-Saharan Africa' },
];

export function getCountryByCode(code: string): CountryInfo | undefined {
  const normalized = code.toUpperCase();
  return MAJOR_COUNTRIES.find(c => c.code === normalized);
}

export function searchCountries(query: string): CountryInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return MAJOR_COUNTRIES.slice(0, 15);
  return MAJOR_COUNTRIES.filter(
    c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
  );
}
