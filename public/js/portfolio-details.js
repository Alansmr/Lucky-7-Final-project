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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
  // 等待异步获取数据完成
  const portfolios = await fetchAndRenderPorfolios();
  console.log('Fetched portfolios:', portfolios);
  
  // 使用实际数据渲染
  renderPortfolioList(portfolios);
  // 渲染涨跌幅前五
  renderIncreaseTop5(portfolios);
  renderDecreaseTop5(portfolios);
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

// 实现渲染涨幅前五
function renderIncreaseTop5(portfolios) {
  const container = document.getElementById('increaseTop5');
  container.innerHTML = '';
  if (!portfolios || portfolios.length === 0) {
    container.innerHTML = '<div class="empty">No data</div>';
    return;
  }
  // 按涨幅降序排序，取前五
  const top5 = portfolios
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
// 实现渲染跌幅前五
function renderDecreaseTop5(portfolios) {
  const container = document.getElementById('decreaseTop5');
  container.innerHTML = '';
  if (!portfolios || portfolios.length === 0) {
    container.innerHTML = '<div class="empty">No data</div>';
    return;
  }
  // 按涨幅升序排序，取前五
  const bottom5 = portfolios
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