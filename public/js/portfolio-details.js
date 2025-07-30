
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

// 选择投资组合
function selectPortfolio(id) {
    portfolios.forEach(p => p.active = p.id === id);
    renderPortfolioList();
    
    // 在实际应用中，这里会加载所选投资组合的详细数据
    document.querySelector('.details-header h2').textContent = 
        portfolios.find(p => p.id === id).name + " Portfolio";
}

// 初始化图表
function initCharts() {
    // 资产分配图
    const allocationCtx = document.getElementById('allocationChart').getContext('2d');
    new Chart(allocationCtx, {
        type: 'doughnut',
        data: {
            labels: ['Stocks', 'Bonds', 'ETFs', 'Real Estate', 'Commodities'],
            datasets: [{
                data: [45, 20, 15, 12, 8],
                backgroundColor: [
                    '#4da6ff',
                    '#2ecc71',
                    '#9b59b6',
                    '#e74c3c',
                    '#f39c12'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a4c8f0',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });

    // 投资组合表现图
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Your Portfolio',
                    data: [95, 98, 102, 105, 108, 112, 116],
                    borderColor: '#4da6ff',
                    backgroundColor: 'rgba(77, 166, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Benchmark',
                    data: [100, 101, 102, 103, 105, 107, 109],
                    borderColor: '#a4c8f0',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#a4c8f0'
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(164, 200, 240, 0.1)'
                    },
                    ticks: {
                        color: '#a4c8f0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(164, 200, 240, 0.1)'
                    },
                    ticks: {
                        color: '#a4c8f0'
                    }
                }
            }
        }
    });

    // 地理分布图
    const geographicCtx = document.getElementById('geographicChart').getContext('2d');
    new Chart(geographicCtx, {
        type: 'bar',
        data: {
            labels: ['North America', 'Europe', 'Asia', 'Emerging', 'Other'],
            datasets: [{
                label: 'Exposure (%)',
                data: [58, 22, 12, 6, 2],
                backgroundColor: '#4da6ff',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(164, 200, 240, 0.1)'
                    },
                    ticks: {
                        color: '#a4c8f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#a4c8f0'
                    }
                }
            }
        }
    });

    // 行业分布图
    const sectorCtx = document.getElementById('sectorChart').getContext('2d');
    new Chart(sectorCtx, {
        type: 'polarArea',
        data: {
            labels: ['Technology', 'Financials', 'Healthcare', 'Consumer', 'Industrials'],
            datasets: [{
                data: [35, 18, 15, 12, 20],
                backgroundColor: [
                    'rgba(77, 166, 255, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(243, 156, 18, 0.7)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a4c8f0',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// 改变颜色并跳转（示例功能）
function changeColorAndJump(element) {
    const colors = ['#4da6ff', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    element.style.color = randomColor;
    
    // 平滑滚动到顶部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
