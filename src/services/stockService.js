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
        .order('timestamp', { ascending: false })

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

    // 4. 批量获取每个股票最新记录前一天的收盘价
    const previousCloses = {};
    for (const ticker of tickers) {
      const latestTimestamp = latestRecords[ticker].timestamp;
      
      // 获取该股票在最新记录前一天收盘的数据
      const { data: prevData, error: prevError } = await supabase
        .from('stackinfo')
        .select('close, timestamp')
        .eq('ticker', ticker)
        .lt('timestamp', latestTimestamp-86400000) 
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (!prevError && prevData.length > 0) {
        previousCloses[ticker] = prevData[0].close;
      } else {
        // 如果没有前一天数据，使用最新价格（涨跌幅为0）
        previousCloses[ticker] = latestRecords[ticker].close;
      }
    }

    // 5. 组合数据并计算涨跌幅
    const result = Object.values(latestRecords).map(stock => {
      const prevClose = previousCloses[stock.ticker];
      const currentClose = stock.close;
      
      const increaseAmount = currentClose - prevClose;
      const increasePercent = ((increaseAmount) / prevClose * 100).toFixed(2);

      return {
        companyName: getCompanyNameByTicker(stock.ticker),
        ticker: stock.ticker,
        currentPrice: currentClose.toFixed(2),
        increasePercent,
        increaseAmount: increaseAmount.toFixed(2),
        lastUpdated: stock.timestamp
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

// 辅助函数：根据ticker获取公司名（需要你根据实际情况实现）
function getCompanyNameByTicker(ticker) {
  const tickerMap = {
    'AAPL': 'Apple Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'C': 'Citigroup Inc.',
  };
  return tickerMap[ticker] || ticker; // 如果没有映射，返回ticker本身
}