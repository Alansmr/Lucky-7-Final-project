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

// 弹窗函数
function showPopup(msg) {
  let popup = document.getElementById('customPopup');
  let closeBtn = document.getElementById('popupCloseBtn');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'customPopup';
    popup.className = 'custom-popup';
    popup.innerHTML = `<span id="popupMsg"></span><button id="popupCloseBtn">OK</button>`;
    document.body.appendChild(popup);
    closeBtn = document.getElementById('popupCloseBtn');
  }
  document.getElementById('popupMsg').textContent = msg;
  popup.style.display = 'block';
  // 重新绑定关闭事件，确保每次都有效
  closeBtn.onclick = () => {
    popup.style.display = 'none';
  };
}

// 修改添加股票逻辑
async function addToPortfolio(name, code, price) {
  // 先请求后端插入
  try {
    const res = await fetch('/api/holderinfo/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyname: name, code, price: Number(price) })
    });
    const result = await res.json();
    if (!result.success) {
      showPopup(result.message || 'Stock already exists in portfolio!');
      return;
    }
  } catch (err) {
    showPopup('Network error, please try again.');
    return;
  }

  // 原有添加到页面逻辑
  const portfolioList = document.getElementById('portfolioList');
  const newItem = document.createElement('div');
  newItem.className = 'portfolio-item';
  newItem.setAttribute('data-price', price);
  newItem.setAttribute('data-code', code);
  // 默认持股数为0
  newItem.setAttribute('data-shares', 0);
  newItem.innerHTML = `
    <div>
      <strong>${name}</strong> (${code})
    </div>
    <div>
      Purchase Price: ${price}
      <span class="portfolio-shares">Shares: <span class="shares-num">0</span></span>
      <button class="sell-btn">Sell</button>
    </div>
  `;
  // 绑定卖出事件
  newItem.querySelector('.sell-btn').onclick = function() {
    showSellModal(newItem);
  };
  portfolioList.insertBefore(newItem, portfolioList.firstChild);

  // 添加成功动画
  newItem.style.backgroundColor = '#f0f9ff';
  setTimeout(() => {
    newItem.style.backgroundColor = '';
  }, 1000);

  updatePortfolioTotal();
}

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

function showBuyModal() {
  document.getElementById('buyModal').style.display = 'flex';
  document.getElementById('buyAmountInput').value = '';
  document.getElementById('modalError').textContent = '';
}

function closeBuyModal() {
  document.getElementById('buyModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  // 假设 add 按钮有 add-btn 类
  document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-btn')) {
      // 获取股票 code
      const row = e.target.closest('.table-row');
      if (row) {
        // 假设股票代码在第2个 <div>，可根据实际结构调整
        const code = row.children[1].textContent.trim();
        window.currentBuyCode = code;
      }
      showBuyModal();
    }
  });

  document.getElementById('modalCloseBtn').onclick = closeBuyModal;

  document.getElementById('modalBuyBtn').onclick = function() {
    const val = document.getElementById('buyAmountInput').value.trim();
    const errorDiv = document.getElementById('modalError');
    if (!/^\d+$/.test(val) || val === '' || Number(val) === 0) {
      errorDiv.textContent = 'Invalid value!Please try again.';
      errorDiv.style.color = '#F53F3F';
      return;
    }
    // 假设当前正在买入的股票 code 存在 window.currentBuyCode
    const code = window.currentBuyCode;
    // 查找 portfolio-item
    const item = document.querySelector(`.portfolio-item[data-code="${code}"]`);
    if (item) {
      const sharesNum = item.querySelector('.shares-num');
      let currentShares = parseInt(sharesNum.textContent, 10) || 0;
      currentShares += Number(val);
      sharesNum.textContent = currentShares;
      item.setAttribute('data-shares', currentShares);
    }
    errorDiv.style.color = '#00B42A';
    errorDiv.textContent = 'Buy in successfully!';
    setTimeout(() => {
      document.getElementById('buyModal').style.display = 'none';
      errorDiv.textContent = '';
    }, 1200);
  };
});
