// 导航栏切换逻辑
function setActive(element) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  element.classList.add('active');
}

// 改变标题颜色并跳转新页面
function changeColorAndJump(element) {
  element.classList.toggle('blue');
  setTimeout(() => {
    window.open('portfolio-details.html', '_blank');
  }, 300);
}

// 添加股票到投资组合
function addToPortfolio(name, code, price) {
  const portfolioList = document.getElementById('portfolioList');
  const newItem = document.createElement('div');
  newItem.className = 'portfolio-item';
  newItem.setAttribute('data-price', price);
  newItem.innerHTML = `
    <div>
      <strong>${name}</strong> (${code})
    </div>
    <div>
      Purchase Price: ${price}
      <button class="delete-btn">Delete</button>
    </div>
  `;
  // 绑定删除事件
  newItem.querySelector('.delete-btn').onclick = function() {
    portfolioList.removeChild(newItem);
    updatePortfolioTotal();
  };
  portfolioList.insertBefore(newItem, portfolioList.firstChild);

  // 添加成功动画
  newItem.style.backgroundColor = '#f0f9ff';
  setTimeout(() => {
    newItem.style.backgroundColor = '';
  }, 1000);

  updatePortfolioTotal();
}

function updatePortfolioTotal() {
  const portfolioList = document.getElementById('portfolioList');
  let total = 0;
  portfolioList.querySelectorAll('.portfolio-item').forEach(item => {
    const price = parseFloat(item.getAttribute('data-price'));
    if (!isNaN(price)) total += price;
  });
  document.getElementById('portfolioTotal').textContent = 'Total: ' + total.toFixed(2);
}
    

// 从后端获取股票数据并渲染表格
async function fetchAndRenderStocks() {
  try {
    const response = await fetch('/api/stocks');
    const stocks = await response.json();
    
    const stockContainer = document.querySelector('.stock-container');
    const tableHeader = stockContainer.querySelector('.table-header');
    stockContainer.innerHTML = '';
    stockContainer.appendChild(tableHeader);
    
    stocks.forEach(stock => {
      const row = document.createElement('div');
      row.className = 'table-row';
      
      // 确定价格变化样式
      const priceClass = stock.increaseAmount > 0 ? 'red' : 
                        stock.increaseAmount < 0 ? 'green' : 'gray';
      
      row.innerHTML = `
        <div>${stock.companyName}</div>
        <div>${stock.ticker}</div>
        <div class="${priceClass}">${stock.currentPrice}</div>
        <div class="${priceClass}">${stock.increasePercent}</div>
        <div class="${priceClass}">${stock.increaseAmount}</div>
        <div><button class="add-btn" onclick="addToPortfolio('${stock.companyName}', '${stock.ticker}', '${stock.currentPrice}')">Add</button></div>
      `;
      
      stockContainer.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
    // 可以在这里添加错误处理UI
  }
}

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', fetchAndRenderStocks);