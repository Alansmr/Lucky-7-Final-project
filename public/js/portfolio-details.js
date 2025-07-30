
// 模拟的投资组合数据
const portfolios = [
    { id: 1, name: "Technology Growth", value: 68450, change: 2.4, holdings: 8, active: true },
    { id: 2, name: "Global Dividend", value: 32750, change: -0.8, holdings: 12, active: false },
    { name: "Sustainable Energy", value: 41500, change: 5.2, holdings: 7, active: false },
    { name: "Healthcare Innovators", value: 28500, change: 1.7, holdings: 9, active: false },
    { name: "Real Estate Income", value: 57200, change: 0.9, holdings: 15, active: false }
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
        portfolioItem.innerHTML = `
            <h3>${portfolio.name} <span class="change ${portfolio.change >= 0 ? 'positive' : 'negative'}">${portfolio.change >= 0 ? '+' : ''}${portfolio.change}%</span></h3>
            <div class="value">$${portfolio.value.toLocaleString()}</div>
            <div class="details">
                <span>Holdings: ${portfolio.holdings}</span>
                <span>ID: #${portfolio.id}</span>
            </div>
        `;
        portfolioItem.addEventListener('click', () => selectPortfolio(portfolio.id));
        portfolioList.appendChild(portfolioItem);
    });
}