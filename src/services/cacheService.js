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

  formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async fetchStockDataFromDB() {
    try {
      // 1. 获取每个股票的最新记录
      const { data: allLatestData, error: latestError } = await supabase
        .from('stackinfo')
        .select('ticker, type, close, timestamp')
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

      const previousDayPrices = {}; 
      const tickers = Object.keys(latestRecords);

      for (const ticker of tickers) {
        const latestRecord = latestRecords[ticker];
        const latestDate = new Date(latestRecord.timestamp); 

        const previousDay = new Date(latestDate);
        previousDay.setDate(latestDate.getDate() - 1);  

        const prevDayStart = new Date(previousDay);
        prevDayStart.setHours(0, 0, 0, 0);
      
        const prevDayEnd = new Date(previousDay);
        prevDayEnd.setHours(23, 59, 59, 999);

        const startStr = this.formatDateTime(prevDayStart);
        const endStr = this.formatDateTime(prevDayEnd);

        const { data: prevData, error: prevError } = await supabase
          .from('stackinfo')
          .select('close')  
          .eq('ticker', ticker)
          .gte('timestamp', startStr)  
          .lte('timestamp', endStr)   
          .order('timestamp', { ascending: false }) 
          .limit(1);  

        if (prevError) {
          console.warn(`获取${ticker}上一天价格失败:`, prevError);
          previousDayPrices[ticker] = null;
          continue;
        }

        previousDayPrices[ticker] = prevData.length > 0 
          ? prevData[0].close 
          : latestRecord.close;
      }

      // 4. 计算涨跌幅（当前收盘价 - 上一天价格）
      const result = Object.values(latestRecords).map(stock => {
        const prevDayPrice = previousDayPrices[stock.ticker];
        const currentClose = stock.close;

        if (prevDayPrice === null || isNaN(prevDayPrice)) {
          return {
            companyName: this.getCompanyNameByTicker(stock.ticker),
            ticker: stock.ticker,
            type: stock.type,
            currentPrice: currentClose.toFixed(2),
            previousDayPrice: 'N/A',  
            increasePercent: 'N/A',
            increaseAmount: 'N/A',
            lastUpdated: new Date(stock.timestamp).toLocaleString()
          };
        }

        const increaseAmount = (currentClose - prevDayPrice).toFixed(2);
        const increasePercent = ((increaseAmount / prevDayPrice) * 100).toFixed(2);

        return {
          companyName: this.getCompanyNameByTicker(stock.ticker),
          ticker: stock.ticker,
          type : stock.type,
          currentPrice: currentClose.toFixed(2),
          previousDayPrice: prevDayPrice.toFixed(2),
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
    // 科技板块（Technology）
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
}

export const cacheService = new CacheService();