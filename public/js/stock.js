// 修改添加股票逻辑（弹出买入弹窗，插入数据）
async function addToPortfolio(name, code, price, type) {
  // 记录当前股票信息，供买入弹窗使用
  window.currentBuyInfo = { name, code, price,type };
  showBuyModal();
}

// 买入弹窗逻辑
function showBuyModal() {
  document.getElementById('buyModal').style.display = 'flex';
  document.getElementById('buyAmountInput').value = '';
  document.getElementById('modalError').textContent = '';
}


document.getElementById('modalCloseBtn').onclick = closeBuyModal;

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
    setTimeout(closeSellModal, 600);
  };
  document.getElementById('modalCloseBtnSell').onclick = closeSellModal;
}

function closeSellModal() {
  document.getElementById('sellModal').style.display = 'none';
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
  // 清空表格（保留表头）
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
      <div class="type">${stock.type || ''}</div>
      <div>
        <button class="add-btn" onclick="addToPortfolio('${stock.companyName}', '${stock.ticker}', '${stock.currentPrice}')">Buy</button>
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

    const type = row.children[5].textContent; // 第六列类型

    currentBuyStock = { name, code, price, type };
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
    type: currentBuyStock.type,
    share,
    buyorsale: true,
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
      userCash -= currentBuyStock.price * share;
      fetch('/api/userCache', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cash: userCash })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('User cash updated successfully');
        } else {
          console.error('Failed to update user cash:', data);
        }
      })     
      updateCashDisplay();
    } else {
      document.getElementById('modalError').textContent = result.message || 'Failed to buy stock.';
    }
  } catch (err) {
    document.getElementById('modalError').textContent = 'Network error.';
  }
};

// 添加到左侧投资组合
function addPortfolioItem({ companyname, code, price, share}) {
  const list = document.getElementById('portfolioList');
  const item = document.createElement('div');
  item.className = 'portfolio-item';
  item.setAttribute('data-price', price);
  item.setAttribute('data-code', code);
  item.setAttribute('data-shares', share);
  item.innerHTML = `
    <div class="nametag">
      <strong>${companyname}</strong> (${code})
    </div>
    <div class="price">
      Purchase Price: ${price}
    </div>
    <div class="row">
      <span class="shares">Shares: <span class="shares-num">${share}</span></span>
      <button class="sell-btn">Sell</button>
    </div>
  `;
  // 绑定卖出弹窗事件
  item.querySelector('.sell-btn').onclick = function() {
    showSellModal(item);
  };
  list.insertBefore(item, list.firstChild); // 反转左侧列表
}

let userCash = fetch('/api/userCache')
  .then(res => res.json())
  .then(data => {
    userCash = data.cash;
    updateCashDisplay();
  })
  .catch(err => {
    console.error('Failed to fetch user cash:', err);
    userCash = 0; 
    updateCashDisplay();
  });

function updateCashDisplay() {
  //fetch user cash from the backend
  fetch('/api/userCache')
  .then(res => res.json())
  .then(data => {
    userCash = data.cash;
  })
  .catch(err => {
    console.error('Failed to fetch user cash:', err);
    userCash = 0; 
  });
  // 更新页面显示
  const cashDisplay = document.getElementById('portfolioCash');
  if (!cashDisplay) {
    console.error('Cash display element not found');
    return;
  }
  cashDisplay.textContent = `Cash: $${userCash}`;
}

// 页面加载时，读取 holderinfo 表并渲染左侧投资组合
async function fetchPortfolioList() {
  try {
    const res = await fetch('/api/holderinfo/list');
     // 添加响应状态检查
    if (!res.ok) {
      throw new Error(`读取holderinfo出错: ${res.status}`);
    }
    const result = await res.json();
    console.log('左边List执行:', result);
    console.log('结果数组长度', result.length);
    if (Array.isArray(result)) {
      console.log('开始渲染');
      const list = document.getElementById('portfolioList');
      list.innerHTML = ''; // 清空
      result.forEach((row, index) => {
        try {
        // 清洗 companyname 字段中的多余空白符和换行符
        const cleanedCompanyName = (row.companyname || '').trim().replace(/\s+/g, ' ');
        console.log(`渲染第${index + 1}条:`, row);
        addPortfolioItem({
          companyname: cleanedCompanyName,
          code: row.code,
          price: row.price,
          share: row.share
        });
        } catch (err) {
          console.error(`渲染第${index + 1}条数据时出错:`, err, row);
        }
    });
    }
  } catch (err) {
    console.error('Failed to fetch portfolio:', err);
  }
}

// 页面加载时调用
document.addEventListener('DOMContentLoaded', function() {
  updateCashDisplay();

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
  
  fetchAndRenderStocks();
  fetchPortfolioList(); // 新增：渲染左侧投资组合
});