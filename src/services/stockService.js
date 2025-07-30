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
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'C': 'Citigroup Inc.',
  };
  return tickerMap[ticker] || ticker; 
}

function getTickerByCompanyName(name) {
  const companyNameMap = {
    'Apple Inc.' : 'AAPL', 
    'Amazon.com Inc.' : 'AMZN',
    'Tesla Inc.' : 'TSLA',
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