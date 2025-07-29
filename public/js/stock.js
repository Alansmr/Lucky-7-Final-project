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
    

let allStocks = []; // 保存所有股票数据

// 从后端获取股票数据并渲染表格
async function fetchAndRenderStocks() {
  try {
    const response = await fetch('/api/stocks');
    const stocks = await response.json();
    allStocks = stocks; // 保存原始数据
    renderStocks(stocks);
  } catch (error) {
    console.error('Failed to fetch stocks:', error);
  }
}

// 渲染股票表格
function renderStocks(stocks) {
  const stockContainer = document.querySelector('.stock-container');
  const tableHeader = stockContainer.querySelector('.table-header');
  stockContainer.innerHTML = '';
  if (tableHeader) stockContainer.appendChild(tableHeader);

  stocks.forEach(stock => {
    const row = document.createElement('div');
    row.className = 'table-row';
    
    // 确定价格变化样式
    const priceClass = stock.increaseAmount > 0 ? 'red' : 
                      stock.increaseAmount < 0 ? 'green' : 'gray';
    
    row.innerHTML = `
      <div>
        <a href="/company/${encodeURIComponent(stock.companyName)}" class="company-link" target="_blank">
          ${stock.companyName}
        </a>
      </div>
      <div>${stock.ticker}</div>
      <div class="${priceClass}">${stock.currentPrice}</div>
      <div class="${priceClass}">${stock.increasePercent}</div>
      <div class="${priceClass}">${stock.increaseAmount}</div>
      <div>
        <button class="add-btn" onclick="addToPortfolio('${stock.companyName}', '${stock.ticker}', '${stock.currentPrice}')">Add</button>
      </div>
    `;
    
    stockContainer.appendChild(row);
  });
}

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('stockSearchInput');
const searchIconSvg = document.getElementById('searchIconSvg');

searchBtn.addEventListener('click', function () {
  // 变蓝色
  searchIconSvg.querySelector('circle').setAttribute('stroke', '#165DFF');
  searchIconSvg.querySelector('line').setAttribute('stroke', '#165DFF');
  searchBtn.classList.add('active'); // 边框和底色变蓝

  // 筛选
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = allStocks.filter(stock =>
    stock.companyName.toLowerCase().includes(keyword) ||
    stock.ticker.toLowerCase().includes(keyword)
  );
  renderStocks(filtered);

  // 0.6秒后恢复
  setTimeout(() => {
    searchIconSvg.querySelector('circle').setAttribute('stroke', '#888');
    searchIconSvg.querySelector('line').setAttribute('stroke', '#888');
    searchBtn.classList.remove('active');
  }, 600);
});

// 保持原有输入实时筛选功能
// searchInput.addEventListener('input', function () {
//   const keyword = this.value.trim().toLowerCase();
//   const filtered = allStocks.filter(stock =>
//     stock.companyName.toLowerCase().includes(keyword) ||
//     stock.ticker.toLowerCase().includes(keyword)
//   );
//   renderStocks(filtered);
// });

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', fetchAndRenderStocks);
