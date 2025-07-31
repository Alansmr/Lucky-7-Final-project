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
      .select('code, type, share, buyorsale, price');

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
      const { code, type, share, buyorsale, price } = transaction;
      
      // 跳过没有当前价格的股票
      if (!currentPricesMap[code]) return;
      
      // 初始化或获取该股票的投资组合数据
      if (!portfolio[code]) {
        portfolio[code] = {
          code,
          type : type,
          totalBuyShares: 0,
          totalSellShares: 0, 
          buyAmount: 0,   
          sellAmount: 0,
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
          type: item.type,
          companyName: getCompanyNameByCode(item.code),
          share: totalShares,
          avgBuyPrice: avgBuyPrice.toFixed(2),
          currentPrice: item.currentPrice.toFixed(2),
          totalValue: totalValue.toFixed(2),
          increaseAmount: increaseAmount.toFixed(2),
          increasePercent: `${increasePercent}%`
        };
      })
      .filter(item => item.share > 0); 

    return result;
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    throw error;
  }
}


function getCompanyNameByCode(code) {
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
  return tickerMap[code] || code;
}

export async function getAssetDetails(){
  //return protfolio networth and total assets (total assets = networth + cash)   
  try {
    const portfolioData = await getPortfolioData();
    const netWorth = portfolioData.reduce((sum, item) => sum + parseFloat(item.totalValue), 0);
    const cash = cacheService.userCash;
    const totalAssets = netWorth + cash;

    return {
      netWorth: netWorth.toFixed(2),
      totalAssets: totalAssets.toFixed(2),
      cash: cash.toFixed(2)
    };
  } catch (error) {
    console.error('Error fetching asset details:', error);
    throw error;
  }
}

export async function getPortfolioComposition(){
  //return the percentage composition of each type, total shares of each type and amount of each type in the portfolio
  //type can be 'Technology', 'BioTechnology', 'Finance'
  try {
    const portfolioData = await getPortfolioData();
    const composition = {
      Technology: { totalShares: 0, totalAmount: 0, percentage: 0 },
      BioTechnology: { totalShares: 0, totalAmount: 0, percentage: 0 },
      Finance: { totalShares: 0, totalAmount: 0, percentage: 0 }
    };

    portfolioData.forEach(item => {
      if (item.type === 'Technology') {
        composition.Technology.totalShares += item.share;
        composition.Technology.totalAmount += parseFloat(item.totalValue);
      } else if (item.type === 'Biotechnology') {
        composition.BioTechnology.totalShares += item.share;
        composition.BioTechnology.totalAmount += parseFloat(item.totalValue);
      } else if (item.type === 'Finance') {
        composition.Finance.totalShares += item.share;
        composition.Finance.totalAmount += parseFloat(item.totalValue);
      }
    });

    //calculate percentages
    const totalShares = Object.values(composition).reduce((sum, item) => sum + item.totalShares, 0);
    const totalAmount = Object.values(composition).reduce((sum, item) => sum + item.totalAmount, 0);
    if (totalShares > 0) {
      composition.Technology.percentage = ((composition.Technology.totalShares / totalShares) * 100).toFixed(2);
      composition.BioTechnology.percentage = ((composition.BioTechnology.totalShares / totalShares) * 100).toFixed(2);
      composition.Finance.percentage = ((composition.Finance.totalShares / totalShares) * 100).toFixed(2);
    }

    return composition;
  } catch (error) {
    console.error('Error fetching portfolio composition:', error);
    throw error;
  }
}