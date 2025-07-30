
// 模拟的投资组合数据
const portfolios = [
    { companyname: 'AAPL', code: 'Apple Inc.', price: 620, shares: 8},
    { companyname: 'MSFT', code: 'Microsoft Corporation', price: 214, shares: 1},
    { companyname: 'GOOGL', code : 'Alphabet Inc. (Google)', price: 345, shares: 5},
    { companyname: 'MRNA', code: 'Moderna Inc.', price: 67, shares: 2},
    { companyname: 'PFE', code: 'Pfizer Inc.', price: 650, shares: 2}
];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    renderPortfolioList();
    initCharts();
});

// 渲染投资组合列表
function renderPortfolioList() {
    const portfolioList = document.getElementById('portfolioList');
    portfolioList.innerHTML = '';
    
    portfolios.forEach(portfolio => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = `portfolio-item ${portfolio.active ? 'active' : ''}`;
        portprice = portfolio.shares*portfolio.price
        portfolioItem.innerHTML = `
            <div class="nametag">
            <strong>${portfolio.companyname}</strong> (${portfolio.code})
            </div>
            <div class="price">
            Price: ${portprice}
            </div>
            <div class="shares">Shares: ${portfolio.shares}</div>
        `;
        portfolioList.appendChild(portfolioItem);
    });
}

//
async function fetchAndRenderProtolio() {
  try {
    const response = await fetch('api/protfolio');
    const protfolio = await response.json();
  } catch (error) {
    console.error('Failed to fetch protfolio:', error);
  }
}

