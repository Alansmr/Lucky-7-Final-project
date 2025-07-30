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

// 修改添加股票逻辑（弹出买入弹窗，插入数据）
async function addToPortfolio(name, code, price) {
  // 记录当前股票信息，供买入弹窗使用
  window.currentBuyInfo = { name, code, price };
  showBuyModal();
}

// 买入弹窗逻辑
function showBuyModal() {
  document.getElementById('buyModal').style.display = 'flex';
  document.getElementById('buyAmountInput').value = '';
  document.getElementById('modalError').textContent = '';
}


document.getElementById('modalCloseBtn').onclick = closeBuyModal;

// 买入按钮点击事件
document.getElementById('modalBuyBtn').onclick = async function() {
  const val = document.getElementById('buyAmountInput').value.trim();
  const errorDiv = document.getElementById('modalError');
  if (!/^\d+$/.test(val) || val === '' || Number(val) === 0) {
    errorDiv.textContent = 'Invalid value! Please try again.';
    errorDiv.style.color = '#F53F3F';
    return;
  }
  errorDiv.textContent = '';
  const { name, code, price } = window.currentBuyInfo || {};
  const share = Number(document.getElementById('buyAmountInput').value.trim());
  console.log('准备发送:', { name, code, price, share });

  try {
    const res = await fetch('/api/holderinfo/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyname: name,
        code,
        price: Number(price),
        share: Number(share),
        buyorsale: true
      })
    });
    const result = await res.json();
    console.log('后端返回:', result);
    if (!result.success) {
      showPopup(result.message || 'Failed to add to portfolio!');
      return;
    }
    showPopup('Added to portfolio!');
    closeBuyModal();
  } catch (err) {
    showPopup('Network error, please try again.');
  }
};


// 卖出弹窗逻辑
function showSellModal(portfolioItem) {
  document.getElementById('sellModal').style.display = 'flex';
  document.getElementById('sellAmountInput').value = '';
  document.getElementById('modalErrorSell').textContent = '';
  // 记录当前操作的 portfolioItem
  document.getElementById('modalSellBtn').onclick = function() {
    const val = document.getElementById('sellAmountInput').value.trim();
    const errorDiv = document.getElementById('modalErrorSell');
    const sharesNumSpan = portfolioItem.querySelector('.shares-num');
    let currentShares = parseInt(sharesNumSpan.textContent, 10) || 0;
    if (!/^\d+$/.test(val) || val === '' || Number(val) === 0 || Number(val) > currentShares) {
      errorDiv.textContent = 'Invalid value!Please try again.';
      errorDiv.style.color = '#F53F3F';
      return;
    }
    // 卖出成功
    currentShares -= Number(val);
    sharesNumSpan.textContent = currentShares;
    portfolioItem.setAttribute('data-shares', currentShares);
    errorDiv.style.color = '#00B42A';
    errorDiv.textContent = 'Sell successfully!';
    updatePortfolioTotal();
    setTimeout(closeSellModal, 1200);
  };
  document.getElementById('modalCloseBtnSell').onclick = closeSellModal;
}

function closeSellModal() {
  document.getElementById('sellModal').style.display = 'none';
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
      <div class="ticker">${stock.ticker}</div>
      <div class="${priceClass} current-price">${stock.currentPrice}</div>
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

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', fetchAndRenderStocks);

function showBuyModal() {
  document.getElementById('buyModal').style.display = 'flex';
  document.getElementById('buyAmountInput').value = '';
  document.getElementById('modalError').textContent = '';
}

function closeBuyModal() {
  document.getElementById('buyModal').style.display = 'none';
}

let currentBuyStock = null;

// 监听 add 按钮（假设表格行有 .add-btn 按钮）
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('add-btn')) {
    const row = e.target.closest('.table-row');
    const name = row.children[0].textContent; // 第一列公司名
    const code = row.children[1].textContent; // 第二列代码
    const price = row.children[2].textContent; // 第三列价格
    currentBuyStock = { name, code, price };
    document.getElementById('buyModal').style.display = 'flex';
    document.getElementById('buyAmountInput').value = '';
    document.getElementById('modalError').textContent = '';
  }
});

// 监听 Buy 按钮
document.getElementById('modalBuyBtn').onclick = async function() {
  const share = document.getElementById('buyAmountInput').value.trim();
  if (!share || isNaN(share) || Number(share) <= 0) {
    document.getElementById('modalError').textContent = 'Please enter valid value.';
    return;
  }
  const payload = {
    companyname: currentBuyStock.name,
    code: currentBuyStock.code,
    price: currentBuyStock.price,
    share,
    buyorsale: true
  };
  try {
    const res = await fetch('/api/holderinfo/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('buyModal').style.display = 'none';
      addPortfolioItem(payload); // 更新左侧列表
    } else {
      document.getElementById('modalError').textContent = result.message || 'Failed to buy stock.';
    }
  } catch (err) {
    document.getElementById('modalError').textContent = 'Network error.';
  }
};


// 添加到左侧投资组合
function addPortfolioItem({ companyname, code, price, share }) {
  const list = document.getElementById('portfolioList');
  const item = document.createElement('div');
  item.className = 'portfolio-item';
  item.setAttribute('data-price', price);
  item.setAttribute('data-code', code);
  item.setAttribute('data-shares', share);
  item.innerHTML = `
    <div>
      <strong>${companyname}</strong> (${code})
    </div>
    <div class="portfolio-price">
      Purchase Price: ${price}
    </div>
    <div class="portfolio-row">
      <span class="portfolio-shares">Shares: <span class="shares-num">${share}</span></span>
      <button class="sell-btn">Sell</button>
    </div>
  `;
  // 绑定卖出弹窗事件
  item.querySelector('.sell-btn').onclick = function() {
    showSellModal(item);
  };
  <div>
    <strong>${companyname}</strong> (${code})
  </div>
  <div class="portfolio-price">
    Purchase Price: ${price}
  </div>
  <div class="portfolio-row">
    <span class="portfolio-shares">Shares: <span class="shares-num">${share}</span></span>
    <button class="sell-btn">Sell</button>
  </div>
`;
  list.appendChild(item);
  updatePortfolioTotal();
}

// 更新总额
// function updatePortfolioTotal() {
//   const list = document.getElementById('portfolioList');
//   let total = 0;
//   list.querySelectorAll('.portfolio-item').forEach(item => {
//     const text = item.querySelector('.portfolio-shares').textContent;
//     const [share, price] = text.split('@').map(s => s.trim());
//     total += Number(share) * Number(price);
//   });
//   document.getElementById('portfolioTotal').textContent = 'Total: ' + total.toFixed(2);
// }
function updatePortfolioTotal() {
  const portfolioList = document.getElementById('portfolioList');
  let total = 0;
  portfolioList.querySelectorAll('.portfolio-item').forEach(item => {
    const price = parseFloat(item.getAttribute('data-price'));
    if (!isNaN(price)) total += price;
  });
  document.getElementById('portfolioTotal').textContent = 'Total: ' + total.toFixed(2);
}

let userCash = 10000; // 初始现金

function updateCashDisplay() {
  document.getElementById('portfolioCash').textContent = `Cash: $${userCash.toFixed(2)}`;
}

// 页面加载时初始化 cash 显示
document.addEventListener('DOMContentLoaded', function() {
  updateCashDisplay();
  // ...existing code...
});