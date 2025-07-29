import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getStockData() {
  try {
    // 1. 获取每个股票的最新记录
    const { data: allLatestData, error: latestError } = await supabase
      .from('stackinfo')
      .select('ticker, close, timestamp')
      .order('timestamp', { ascending: false });

    if (latestError) throw latestError;

    // 2. 按股票代码分组，找出每个股票的最新记录
    const latestRecords = {};
    allLatestData.forEach(item => {
      if (!latestRecords[item.ticker] || 
          new Date(item.timestamp) > new Date(latestRecords[item.ticker].timestamp)) {
        latestRecords[item.ticker] = item;
      }
    });

    // 3. 获取所有股票代码
    const tickers = Object.keys(latestRecords);

    // 4. 批量获取每个股票“最新记录当天01:30:00的开盘价”（核心修改：用日期字符串查询）
    const openingPrices = {};
    for (const ticker of tickers) {
      
      const latestDate = new Date(latestRecords[ticker].timestamp);
      
      // 构造当天01:30:00的时间（转换为 PostgreSQL 兼容的日期字符串）
      const openTimeStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 1, 30, 0);

      //改成格式为'2024-07-30 01:30:00'
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} 01:30:00`;
      };

      const startStr = formatDate(openTimeStart);
  
      //console.log(`Fetching opening price for ${ticker} at ${startStr}`);

      // 查询该股票在当天01:30:00的开盘价
      const { data: openData, error: openError } = await supabase
        .from('stackinfo')
        .select('open')
        .eq('ticker', ticker)
        .eq('timestamp', startStr) 
        .order('timestamp', { ascending: true })
        .limit(1);

      if (openError) {
        console.warn(`获取${ticker}开盘价失败:`, openError);
        openingPrices[ticker] = null;
        continue;
      }

      openingPrices[ticker] = openData.length > 0 
        ? openData[0].open 
        : latestRecords[ticker].close;
    }

    // 5. 计算涨跌幅（逻辑不变）
    const result = Object.values(latestRecords).map(stock => {
      const openPrice = openingPrices[stock.ticker];
      const closePrice = stock.close;

      if (openPrice === null || isNaN(openPrice)) {
        return {
          companyName: getCompanyNameByTicker(stock.ticker),
          ticker: stock.ticker,
          currentPrice: closePrice.toFixed(2),
          openPrice: 'N/A',
          increasePercent: 'N/A',
          increaseAmount: 'N/A',
          lastUpdated: new Date(stock.timestamp).toLocaleString()
        };
        
      }

      const increaseAmount = (closePrice - openPrice).toFixed(2);
      const increasePercent = ((increaseAmount / openPrice) * 100).toFixed(2);

      return {
        companyName: getCompanyNameByTicker(stock.ticker),
        ticker: stock.ticker,
        currentPrice: closePrice.toFixed(2),
        openPrice: openPrice.toFixed(2),
        increasePercent: `${increasePercent}%`,
        increaseAmount: increaseAmount > 0 ? `+${increaseAmount}` : increaseAmount,
        lastUpdated: new Date(stock.timestamp).toLocaleString()
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

function getCompanyNameByTicker(ticker) {
  const tickerMap = {
    'AAPL': 'Apple Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'C': 'Citigroup Inc.',
  };
  return tickerMap[ticker] || ticker; // 如果没有映射，返回ticker本身
}