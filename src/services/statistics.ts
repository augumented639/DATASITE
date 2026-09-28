import { NormalizedDataPoint, StatisticalSummary, ForecastPoint, FactualInsight, IndicatorDefinition } from '../types/data';

/**
 * Formats large currency or count numbers cleanly with abbreviations (B, M, K, T) or percentages
 */
export function formatDataValue(val: number | null | undefined, formatType?: string, unit?: string): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }

  // If percentage
  if (formatType === 'percent' || (unit && unit.includes('%'))) {
    return `${val.toFixed(2)}%`;
  }

  // If currency
  const isCurrency = formatType === 'currency' || (unit && (unit.includes('US$') || unit.includes('Dollar')));
  const prefix = isCurrency ? '$' : '';

  const absVal = Math.abs(val);
  if (absVal >= 1e12) {
    return `${prefix}${(val / 1e12).toFixed(2)}T`;
  }
  if (absVal >= 1e9) {
    return `${prefix}${(val / 1e9).toFixed(2)}B`;
  }
  if (absVal >= 1e6) {
    return `${prefix}${(val / 1e6).toFixed(2)}M`;
  }
  if (absVal >= 1e3 && !isCurrency && absVal > 9999) {
    return `${prefix}${(val / 1e3).toFixed(1)}k`;
  }

  return `${prefix}${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/**
 * Computes exact statistical metrics from real chronological data points
 */
export function calculateStatisticalSummary(
  dataPoints: NormalizedDataPoint[],
  retrievedAt: string = new Date().toISOString()
): StatisticalSummary | null {
  // Filter valid non-null values
  const validPoints = dataPoints
    .filter(d => d.value !== null && !isNaN(d.value))
    .sort((a, b) => a.year - b.year);

  if (validPoints.length === 0) {
    return null;
  }

  const latestPoint = validPoints[validPoints.length - 1];
  const previousPoint = validPoints.length > 1 ? validPoints[validPoints.length - 2] : latestPoint;

  // YoY Change
  let yoyChangePercent: number | null = null;
  if (validPoints.length > 1 && previousPoint.value !== 0 && previousPoint.value !== null && latestPoint.value !== null) {
    yoyChangePercent = ((latestPoint.value - previousPoint.value) / Math.abs(previousPoint.value)) * 100;
  }

  // 5-Year Change & CAGR
  let fiveYearChangePercent: number | null = null;
  let cagr: number | null = null;

  const fiveYearsAgoTarget = latestPoint.year - 5;
  // Find point closest to 5 years ago
  const fiveYearPoint = validPoints.find(d => d.year === fiveYearsAgoTarget) || 
    (validPoints.length >= 5 ? validPoints[validPoints.length - 5] : validPoints[0]);

  if (fiveYearPoint && fiveYearPoint.year < latestPoint.year && fiveYearPoint.value !== null && fiveYearPoint.value > 0 && latestPoint.value !== null && latestPoint.value > 0) {
    const yearsDiff = latestPoint.year - fiveYearPoint.year;
    fiveYearChangePercent = ((latestPoint.value - fiveYearPoint.value) / Math.abs(fiveYearPoint.value)) * 100;
    
    if (yearsDiff > 0) {
      cagr = (Math.pow(latestPoint.value / fiveYearPoint.value, 1 / yearsDiff) - 1) * 100;
    }
  }

  // Peak and Trough
  let highestValue = { year: latestPoint.year, value: latestPoint.value! };
  let lowestValue = { year: latestPoint.year, value: latestPoint.value! };

  let sum = 0;
  const valuesArray: number[] = [];

  for (const pt of validPoints) {
    const val = pt.value!;
    sum += val;
    valuesArray.push(val);

    if (val > highestValue.value) {
      highestValue = { year: pt.year, value: val };
    }
    if (val < lowestValue.value) {
      lowestValue = { year: pt.year, value: val };
    }
  }

  const mean = sum / validPoints.length;
  
  // Median
  const sortedValues = [...valuesArray].sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;

  // Standard Deviation
  const variance = validPoints.reduce((acc, pt) => acc + Math.pow(pt.value! - mean, 2), 0) / validPoints.length;
  const standardDeviation = Math.sqrt(variance);

  // Missing Years analysis
  const startYear = validPoints[0].year;
  const endYear = latestPoint.year;
  const expectedTotalYears = endYear - startYear + 1;
  const missingYearsCount = Math.max(0, expectedTotalYears - validPoints.length);

  return {
    latestYear: latestPoint.year,
    latestValue: latestPoint.value!,
    previousYear: previousPoint.year,
    previousValue: previousPoint.value!,
    yoyChangePercent,
    fiveYearChangePercent,
    cagr,
    highestValue,
    lowestValue,
    dataCoverage: {
      startYear,
      endYear,
      totalObservations: expectedTotalYears,
      validObservations: validPoints.length,
      missingYearsCount,
    },
    mean,
    median,
    standardDeviation,
    retrievedAt,
  };
}

/**
 * Generates transparent model projections using Holt's Linear Exponential Smoothing
 * with damping factor and 95% prediction interval
 */
export function generateForecast(
  dataPoints: NormalizedDataPoint[],
  horizonYears: number = 4,
  method: 'holt_exponential_smoothing' | 'linear_regression' = 'holt_exponential_smoothing'
): ForecastPoint[] {
  const validPoints = dataPoints
    .filter(d => d.value !== null && !isNaN(d.value))
    .sort((a, b) => a.year - b.year);

  if (validPoints.length < 3) {
    return [];
  }

  const n = validPoints.length;
  const lastPoint = validPoints[n - 1];
  const lastYear = lastPoint.year;

  if (method === 'linear_regression') {
    // Ordinary Least Squares (OLS)
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const x = i; // relative time index
      const y = validPoints[i].value!;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard error of estimate
    let sumSquaredResiduals = 0;
    for (let i = 0; i < n; i++) {
      const yPred = intercept + slope * i;
      sumSquaredResiduals += Math.pow(validPoints[i].value! - yPred, 2);
    }
    const standardError = Math.sqrt(sumSquaredResiduals / Math.max(1, n - 2));

    const results: ForecastPoint[] = [];
    for (let h = 1; h <= horizonYears; h++) {
      const targetYear = lastYear + h;
      const xFuture = (n - 1) + h;
      const forecastVal = Math.max(0, intercept + slope * xFuture);
      
      // Prediction interval widens with distance: SE * sqrt(1 + 1/n + (x - x_bar)^2 / sum(xi - x_bar)^2)
      const uncertaintyMultiplier = 1.96 * standardError * Math.sqrt(1 + (h * 0.15));
      
      results.push({
        year: targetYear,
        forecastValue: Number(forecastVal.toFixed(2)),
        lowerConfidence: Number(Math.max(0, forecastVal - uncertaintyMultiplier).toFixed(2)),
        upperConfidence: Number((forecastVal + uncertaintyMultiplier).toFixed(2)),
        method: 'OLS Linear Regression (95% Interval)',
      });
    }

    return results;
  }

  // Default: Holt's Linear Exponential Smoothing
  const alpha = 0.35; // level smoothing factor
  const beta = 0.15;  // trend smoothing factor
  const phi = 0.90;   // trend damping factor to prevent runaway extrapolation

  let level = validPoints[0].value!;
  let trend = (validPoints[Math.min(3, n - 1)].value! - validPoints[0].value!) / Math.min(3, n - 1);

  const errors: number[] = [];

  for (let i = 1; i < n; i++) {
    const val = validPoints[i].value!;
    const prevLevel = level;
    const prevTrend = trend;

    // One-step ahead forecast error
    const forecastOneStep = prevLevel + prevTrend;
    errors.push(val - forecastOneStep);

    level = alpha * val + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
  }

  // Mean Absolute Error for uncertainty band
  const mae = errors.length > 0
    ? errors.reduce((acc, err) => acc + Math.abs(err), 0) / errors.length
    : level * 0.05;

  const results: ForecastPoint[] = [];
  for (let h = 1; h <= horizonYears; h++) {
    const targetYear = lastYear + h;
    // Damped trend addition: level + sum_{i=1}^h (phi^i * trend)
    let cumulativeTrend = 0;
    for (let i = 1; i <= h; i++) {
      cumulativeTrend += Math.pow(phi, i) * trend;
    }
    const forecastVal = Math.max(0, level + cumulativeTrend);
    const spread = 1.96 * mae * Math.sqrt(h);

    results.push({
      year: targetYear,
      forecastValue: Number(forecastVal.toFixed(2)),
      lowerConfidence: Number(Math.max(0, forecastVal - spread).toFixed(2)),
      upperConfidence: Number((forecastVal + spread).toFixed(2)),
      method: "Holt's Damped Trend Smoothing (95% Interval)",
    });
  }

  return results;
}

/**
 * Generates strictly verifiable, factual textual insights directly from the numbers
 */
export function generateFactualInsights(
  summary: StatisticalSummary,
  indicator: IndicatorDefinition,
  countryName: string
): FactualInsight[] {
  const insights: FactualInsight[] = [];
  const fmt = (v: number) => formatDataValue(v, indicator.formatType, indicator.unit);

  // 1. Current State & Recent Dynamic
  if (summary.yoyChangePercent !== null) {
    const direction = summary.yoyChangePercent >= 0 ? 'increased' : 'decreased';
    const sign = summary.yoyChangePercent >= 0 ? '+' : '';
    insights.push({
      id: 'insight-yoy',
      title: 'Annual Trajectory',
      statement: `In ${summary.latestYear}, ${countryName}'s ${indicator.name.toLowerCase()} stood at ${fmt(summary.latestValue)}, which ${direction} by ${Math.abs(summary.yoyChangePercent).toFixed(1)}% compared to ${summary.previousYear} (${fmt(summary.previousValue)}).`,
      type: 'growth',
      highlight: `${sign}${summary.yoyChangePercent.toFixed(1)}% YoY`,
    });
  }

  // 2. Long-term CAGR / 5-Year Growth
  if (summary.cagr !== null) {
    const direction = summary.cagr >= 0 ? 'expansion' : 'contraction';
    insights.push({
      id: 'insight-cagr',
      title: 'Compound Annual Growth',
      statement: `Over the observed period up to ${summary.latestYear}, the indicator registered a Compound Annual Growth Rate (CAGR) of ${summary.cagr.toFixed(2)}%, reflecting sustained ${direction}.`,
      type: 'cagr',
      highlight: `${summary.cagr.toFixed(2)}% CAGR`,
    });
  }

  // 3. Peak Historical Level
  insights.push({
    id: 'insight-peak',
    title: 'Peak Historical Observation',
    statement: `The all-time highest level recorded within the dataset occurred in ${summary.highestValue.year} at ${fmt(summary.highestValue.value)}.`,
    type: 'peak',
    highlight: `${fmt(summary.highestValue.value)} (${summary.highestValue.year})`,
  });

  // 4. Data Coverage & Density
  insights.push({
    id: 'insight-coverage',
    title: 'Dataset Completeness',
    statement: `Public series covers ${summary.dataCoverage.validObservations} valid yearly observations from ${summary.dataCoverage.startYear} to ${summary.dataCoverage.endYear} (${summary.dataCoverage.missingYearsCount === 0 ? 'continuous with no missing reporting periods' : `${summary.dataCoverage.missingYearsCount} unreported period(s)`}).`,
    type: 'coverage',
    highlight: `${summary.dataCoverage.startYear}–${summary.dataCoverage.endYear}`,
  });

  return insights;
}
