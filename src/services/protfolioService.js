import { createClient } from '@supabase/supabase-js';
import { cacheService } from './cacheService.js';

const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getPortfolioData() {
  try {
    // 1. 从数据库获取用户所有交易记录
    const { data: transactions, error: transactionError } = await supabase
      .from('holderinfo')
      .select('code, share, buyorsale, price');

    if (transactionError) throw transactionError;

    // 2. 从缓存获取所有股票的当前价格
    const stockData = await cacheService.getStockData();
    const currentPricesMap = {};
    
    // 构建股票代码到当前价格的映射
    stockData.forEach(stock => {
      currentPricesMap[stock.ticker] = parseFloat(stock.currentPrice);
    });

    // 3. 分别统计每个股票的总买入和总卖出数量
    const portfolio = {};
    
    transactions.forEach(transaction => {
      const { code, share, buyorsale, price } = transaction;
      
      // 跳过没有当前价格的股票
      if (!currentPricesMap[code]) return;
      
      // 初始化或获取该股票的投资组合数据
      if (!portfolio[code]) {
        portfolio[code] = {
          code,
          totalBuyShares: 0,    // 总买入数量
          totalSellShares: 0,   // 总卖出数量
          buyAmount: 0,         // 总买入金额
          sellAmount: 0,        // 总卖出金额
          currentPrice: currentPricesMap[code]
        };
      }
      
      const stockPortfolio = portfolio[code];
      
      if (buyorsale) { // 买入操作
        stockPortfolio.totalBuyShares += share;
        stockPortfolio.buyAmount += share * price;
      } else { // 卖出操作
        stockPortfolio.totalSellShares += share;
        stockPortfolio.sellAmount += share * price;
      }
    });

    // 4. 计算每个股票的最终持有量、平均买入价格和涨幅
    const result = Object.values(portfolio)
      .map(item => {
        const totalShares = item.totalBuyShares - item.totalSellShares;
        const avgBuyPrice = item.totalBuyShares > 0 ? (item.buyAmount / item.totalBuyShares) : 0;
        const totalValue = totalShares * item.currentPrice;
        const increaseAmount = item.currentPrice - avgBuyPrice;
        const increasePercent = avgBuyPrice > 0 
          ? ((increaseAmount / avgBuyPrice) * 100).toFixed(2) 
          : 0;
          
        return {
          code: item.code,
          companyName: getCompanyNameByCode(item.code),
          share: totalShares,
          avgBuyPrice: avgBuyPrice.toFixed(2),
          currentPrice: item.currentPrice.toFixed(2),
          totalValue: totalValue.toFixed(2),
          increaseAmount: increaseAmount.toFixed(2),
          increasePercent: `${increasePercent}%`
        };
      })
      .filter(item => item.share > 0); // 过滤掉持有量为0的股票

    return result;
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    throw error;
  }
}


function getCompanyNameByCode(code) {
  const codeMap = {
    'AAPL': 'Apple Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'C': 'Citigroup Inc.',
  };
  return codeMap[code] || code;
}