import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU';
const supabase = createClient(supabaseUrl, supabaseKey);

class CacheService {
  constructor() {
    this.stockDataCache = null;  
    this.cacheTimestamp = null;      
    this.cacheTTL = 24 * 60 * 60 * 1000;  
  }

  // 格式化日期为 'YYYY-MM-DD 01:30:00'
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 01:30:00`;
  }

  // 从数据库获取股票数据（原 getStockData 逻辑）
  async fetchStockDataFromDB() {
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

      // 4. 批量获取每个股票当天01:30:00的开盘价
      const openingPrices = {};
      for (const ticker of tickers) {
        const latestDate = new Date(latestRecords[ticker].timestamp);
        const openTimeStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 1, 30, 0);
        const startStr = this.formatDate(openTimeStart);

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

      // 5. 计算涨跌幅
      const result = Object.values(latestRecords).map(stock => {
        const openPrice = openingPrices[stock.ticker];
        const closePrice = stock.close;

        if (openPrice === null || isNaN(openPrice)) {
          return {
            companyName: this.getCompanyNameByTicker(stock.ticker),
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
          companyName: this.getCompanyNameByTicker(stock.ticker),
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
      console.error('从数据库获取股票数据失败:', error);
      throw error;
    }
  }

  // 从缓存获取股票数据（优先使用缓存，失效时重新获取）
  async getStockData() {
    // 检查缓存是否存在且未过期
    const now = Date.now();
    const isCacheValid = this.stockDataCache && 
                         this.cacheTimestamp && 
                         (now - this.cacheTimestamp) < this.cacheTTL;

    if (isCacheValid) {
      return this.stockDataCache;
    }

    console.log('构建缓存');
    const freshData = await this.fetchStockDataFromDB();
    
    this.stockDataCache = freshData;
    this.cacheTimestamp = now;
    
    return freshData;
  }

  // 初始化缓存（服务器启动时调用）
  async initialize() {
    try {
      const stockData = await this.fetchStockDataFromDB();
      
      if (stockData && stockData.length > 0) {
        this.stockDataCache = stockData;
        this.cacheTimestamp = Date.now();
        console.log(`缓存初始化成功：加载了 ${stockData.length} 条股票数据`);
      } else {
        console.warn('缓存初始化失败：未获取到有效股票数据');
      }
    } catch (error) {
      console.error('缓存初始化失败:', error);
    }
  }

  getCompanyNameByTicker(ticker) {
    const tickerMap = {
      'AAPL': 'Apple Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'C': 'Citigroup Inc.',
    };
    return tickerMap[ticker] || ticker;
  }
}

export const cacheService = new CacheService();