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
    