import { createClient } from '@supabase/supabase-js';
import { cacheService } from './cacheService.js';

const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getStockData() {
  return cacheService.getStockData();
}

function getCompanyNameByTicker(ticker) {
  const tickerMap = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc. (Google)',
    'AMZN': 'Amazon.com Inc.',
    'NVDA': 'NVIDIA Corporation',
    'META': 'Meta Platforms Inc. (Facebook)',
    'TSLA': 'Tesla Inc.',
    'ADBE': 'Adobe Inc.',
    'CRM': 'Salesforce Inc.',
    'AMD': 'Advanced Micro Devices',

    // 生物医药板块（Biotech/Pharma）
    'MRNA': 'Moderna Inc.',
    'PFE': 'Pfizer Inc.',
    'JNJ': 'Johnson & Johnson',
    'REGN': 'Regeneron Pharmaceuticals',
    'VRTX': 'Vertex Pharmaceuticals',
    'GILD': 'Gilead Sciences',
    'BIIB': 'Biogen Inc.',
    'AMGN': 'Amgen Inc.',
    'ILMN': 'Illumina Inc.',
    'SRPT': 'Sarepta Therapeutics',

    // 金融板块（Financial Services）
    'JPM': 'JPMorgan Chase & Co.',
    'BAC': 'Bank of America',
    'GS': 'Goldman Sachs Group',
    'MS': 'Morgan Stanley',
    'V': 'Visa Inc.',
    'MA': 'Mastercard Inc.',
    'PYPL': 'PayPal Holdings',
    'HOOD': 'Robinhood Markets',
    'BLK': 'BlackRock Inc.',
    'AXP': 'American Express',
    'C': 'Citigroup Inc.',
  };
  return tickerMap[ticker] || ticker; 
}

function getTickerByCompanyName(name) {
  const companyNameMap = {
    // 科技板块（Technology）
    'Apple Inc.': 'AAPL',
    'Microsoft Corporation': 'MSFT',
    'Alphabet Inc. (Google)': 'GOOGL',
    'Amazon.com Inc.': 'AMZN',
    'NVIDIA Corporation': 'NVDA',
    'Meta Platforms Inc. (Facebook)': 'META',
    'Tesla Inc.': 'TSLA',
    'Adobe Inc.': 'ADBE',
    'Salesforce Inc.': 'CRM',
    'Advanced Micro Devices': 'AMD',

    // 生物医药板块（Biotech/Pharma）
    'Moderna Inc.': 'MRNA',
    'Pfizer Inc.': 'PFE',
    'Johnson & Johnson': 'JNJ',
    'Regeneron Pharmaceuticals': 'REGN',
    'Vertex Pharmaceuticals': 'VRTX',
    'Gilead Sciences': 'GILD',
    'Biogen Inc.': 'BIIB',
    'Amgen Inc.': 'AMGN',
    'Illumina Inc.': 'ILMN',
    'Sarepta Therapeutics': 'SRPT',

    // 金融板块（Financial Services）
    'JPMorgan Chase & Co.': 'JPM',
    'Bank of America': 'BAC',
    'Goldman Sachs Group': 'GS',
    'Morgan Stanley': 'MS',
    'Visa Inc.': 'V',
    'Mastercard Inc.': 'MA',
    'PayPal Holdings': 'PYPL',
    'Robinhood Markets': 'HOOD',
    'BlackRock Inc.': 'BLK',
    'American Express': 'AXP',
    'Citigroup Inc.' : 'C',
  };
  return companyNameMap[name]; 
}

export async function getStockDataByName(name){
  try {
    const ticker = getTickerByCompanyName(name);

    if (!ticker) {
      throw new Error(`未找到股票代码对应的公司名称: ${name}`);
    }
    const { data, error } = 
    await supabase
      .from('stackinfo')
      .select('*')
      .order('timestamp', { ascending: false })
      .eq('ticker', ticker)
      .limit(1);

    return {
      companyName: name,
      ticker: data[0].ticker,
      currentPrice: data[0].close.toFixed(2),
      openPrice: data[0].open.toFixed(2),
      closePrice: data[0].close.toFixed(2),
      lowPrice: data[0].low.toFixed(2),
      highPrice: data[0].high.toFixed(2),
      //increasePercent: ((data[0].close - data[0].open) / data[0].open * 100).toFixed(2) + '%',
      //increaseAmount: (data[0].close - data[0].open).toFixed(2),
      lastUpdated: new Date(data[0].timestamp).toLocaleString()
    }
  } catch (error) {
    console.error('Error fetching stock data by name:', error);
    throw error;
  }
}