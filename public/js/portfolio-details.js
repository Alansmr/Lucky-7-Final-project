// 导航栏切换逻辑
function setActive(element) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  element.classList.add('active');
}

async function fetchAndRenderPorfolios() {
  try {
    const response = await fetch('/api/protfolio'); // 修正拼写错误
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch portfolios:', error);
    return []; // 错误时返回空数组避免崩溃
  }
}

// 从后端获取股票数据并渲染表格
async function fetchAndRenderStocks() {
  try {
    const response = await fetch('/api/stocks');
    const stocks = await response.json();
    return stocks;
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
  // 等待异步获取数据完成
  const portfolios = await fetchAndRenderPorfolios();
  const stocks = await fetchAndRenderStocks();
  console.log('Fetched portfolios:', portfolios);
  console.log('Fetched stocks:', stocks);

  // 使用实际数据渲染
  renderPortfolioList(portfolios);
  // 渲染涨跌幅前五
  renderIncreaseTop5(portfolios,stocks);
  renderDecreaseTop5(portfolios,stocks);
  // 确保此函数也能处理数据
  initCharts(); 
});

// 修改渲染函数接收参数
function renderPortfolioList(portfolios) {
  const portfolioList = document.getElementById('portfolioList');
  portfolioList.innerHTML = '';
  
  // 添加空数据保护
  if (!portfolios || portfolios.length === 0) {
    portfolioList.innerHTML = '<div class="empty">No portfolios found</div>';
    return;
  }
  
  portfolios.forEach(portfolio => {
    const portprice = portfolio.share * portfolio.currentPrice;
    const portfolioItem = document.createElement('div');
    portfolioItem.className = `portfolio-item ${portfolio.active ? 'active' : ''}`;
    portfolioItem.innerHTML = `
      <div class="nametag">
        <strong>${portfolio.companyName}</strong> (${portfolio.code})
      </div>
      <div class="price">Value: $${portprice.toFixed(2)}</div>
      <div class="shares">Shares: ${portfolio.share}</div>
    `;
    portfolioList.appendChild(portfolioItem);
  });
}


document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // 移除所有导航项的active类
      navItems.forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // 为当前点击的导航项添加active类
      this.classList.add('active');
      
      // 根据点击的导航项切换页面内容或执行其他操作
      if (this.textContent === 'My Financial Portfolio') {
        // 切换到投资组合页面
        window.location.href = 'portfolio-details.html';
      } else if (this.textContent === 'Stock Investment') {
        // 切换到股票投资页面
        window.location.href = 'stock.html';
      }
    });
  });
});

// 将"-13.65%"转化为可用于比较的-13.65
function parsePercent(percentStr) {
  // "-13.65%" => -13.65
  return parseFloat(percentStr.replace('%', ''));
}

function renderIncreaseTop5(portfolios, stocks) {
  const container = document.getElementById('increaseTop5');
  container.innerHTML = '';
  console.log(portfolios);
  console.log(stocks);
  if (!portfolios || portfolios.length === 0 || !stocks || stocks.length === 0) {
    container.innerHTML = '<div class="empty">No data</div>';
    return;
  }

  // 组合 portfolios 和 stocks 数据
  const merged = portfolios.map(portfolio => {
    const stock = stocks.find(s => s.ticker === portfolio.code);
    return stock
      ? {
          companyName: stock.companyName,
          currentPrice: stock.currentPrice,
          increasePercent: stock.increasePercent
        }
      : null;
  }).filter(item => item && item.increasePercent !== undefined);

  // 按涨幅降序排序，取前五
  const top5 = merged
    .slice()
    .sort((a, b) => parsePercent(b.increasePercent) - parsePercent(a.increasePercent))
    .slice(0, 5);

  // 构建表格
  let html = `<table class="top-table">
    <tr>
      <th>Company</th>
      <th>Price</th>
      <th>Increase</th>
    </tr>`;
  top5.forEach(stock => {
    const percentNum = parsePercent(stock.increasePercent);
    html += `<tr>
      <td>${stock.companyName}</td>
      <td>${stock.currentPrice}</td>
      <td style="color:${percentNum >= 0 ? 'red' : 'green'}">${stock.increasePercent}</td>
    </tr>`;
  });
  html += `</table>`;
  container.innerHTML = html;
}

function renderDecreaseTop5(portfolios, stocks) {
  const container = document.getElementById('decreaseTop5');
  container.innerHTML = '';
  if (!portfolios || portfolios.length === 0 || !stocks || stocks.length === 0) {
    container.innerHTML = '<div class="empty">No data</div>';
    return;
  }

  // 组合 portfolios 和 stocks 数据
  const merged = portfolios.map(portfolio => {
    const stock = stocks.find(s => s.ticker === portfolio.code);
    return stock
      ? {
          companyName: stock.companyName,
          currentPrice: stock.currentPrice,
          increasePercent: stock.increasePercent
        }
      : null;
  }).filter(item => item && item.increasePercent !== undefined);

  // 按涨幅升序排序，取前五
  const bottom5 = merged
    .slice()
    .sort((a, b) => parsePercent(a.increasePercent) - parsePercent(b.increasePercent))
    .slice(0, 5);

  // 构建表格
  let html = `<table class="top-table">
    <tr>
      <th>Company</th>
      <th>Price</th>
      <th>Decrease</th>
    </tr>`;
  bottom5.forEach(stock => {
    const percentNum = parsePercent(stock.increasePercent);
    html += `<tr>
      <td>${stock.companyName}</td>
      <td>${stock.currentPrice}</td>
      <td style="color:${percentNum >= 0 ? 'red' : 'green'}">${stock.increasePercent}</td>
    </tr>`;
  });
  html += `</table>`;
  container.innerHTML = html;
}


async function initIndustryCompositionChart() {
  try {
    const response = await fetch('/api/protfolio/composition');
    const composition = await response.json();
    console.log('Composition Data:', composition); // 调试输出
    
    const ctx = document.getElementById('industryCompositionChart').getContext('2d');
    
    // 从新数据结构中提取数据
    const labels = Object.keys(composition);
    const percentages = labels.map(label => parseFloat(composition[label].percentage));
    const amounts = labels.map(label => composition[label].totalAmount);
    const shares = labels.map(label => composition[label].totalShares);
    
    // 计算总价值（用于中心显示）
    const totalValue = amounts.reduce((sum, val) => sum + val, 0).toFixed(2);
    
    // 创建图表实例
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map(label => `${label} (${composition[label].percentage}%)`),
        datasets: [{
          data: percentages,
          backgroundColor: [
            'rgba(54, 162, 235, 0.85)',
            'rgba(75, 192, 192, 0.85)',
            'rgba(255, 159, 64, 0.85)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',  
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 14
              },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label.split(' (')[0];
                const index = context.dataIndex;
                return [
                  `${label}: ${composition[label].percentage}%`,
                  `Value: $${amounts[index].toLocaleString()}`,                   
                  `Shares: ${shares[index]}`                 
                ];               
              }             
            },             
            padding: 12,             
            backgroundColor: 'rgba(0, 0, 0, 0.8)',             
            titleFont: { size: 16 },             
            bodyFont: { size: 14 }           
          }         
        }       
      }     
    });          // 添加中心总价值显示     
    const centerValue = document.createElement('div');     
    centerValue.className = 'chart-center-value';     
    centerValue.innerHTML = `       
    <div class="total-label">Total Portfolio Value</div>       
    <div class="total-amount">$${totalValue}</div>
    `;
    const chartContainer = document.getElementById('industryCompositionChart').parentNode;
    chartContainer.appendChild(centerValue);
    
  } catch (error) {
    console.error('Failed to initialize composition chart:', error);
  }
}

// DOM加载后调用
document.addEventListener('DOMContentLoaded', initIndustryCompositionChart);