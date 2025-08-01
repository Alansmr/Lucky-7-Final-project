// routes/stocksRoute.js
import express from 'express';
import { getStockData } from '../services/stockService.js';
import { getStockDataByName } from '../services/stockService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// 获取当前文件的绝对路径（src/routes/stocksRoute.js）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // 得到 src/routes 目录

const htmlPath = path.join(__dirname, '..', '..', 'public', 'stock.html');

const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU'; // 你的 Supabase Key
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/stocks', (req, res) => {
  
  res.sendFile(htmlPath, (err) => {
    if (err) {
      console.error('文件发送失败：', err);
      res.status(404).send('未找到 stock.html 文件');
    }
  });
});

// 股票数据 API 接口（保持不变）
router.get('/api/stocks', async (req, res) => {
  try {
    const stocks = await getStockData();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: '获取股票数据失败' });
  }
});

router.get('/company/:name', async (req, res) => {
  const companyName = req.params.name;
  try {
    const stocks = await getStockData();
    const stock = stocks.find(s => s.companyName === companyName);
    if (!stock) {
      return res.status(404).send(`<h1>Company "${companyName}" not found.</h1>`);
    }

    // 用 ticker 查询 Supabase 最新一条详细数据
    const { data, error } = await supabase
      .from('stackinfo')
      .select('open, high, close, low, volume, timestamp')
      .eq('ticker', stock.ticker)
      .order('timestamp', { ascending: false })

    if (error) {
      return res.status(500).send(`<h1>Supabase 查询出错: ${error.message}</h1>`);
    }
    if (!data || data.length === 0) {
      return res.status(404).send(`<h1>No detailed data found for "${companyName}".</h1>`);
    }

    //   <!DOCTYPE html>
    //   <html lang="en">
    //   <head>
    //     <meta charset="UTF-8">
    //     <title>${companyName} Details</title>
    //     <style>
    //       body { font-family: Arial, sans-serif; padding: 40px; }
    //       a { color: #0077cc; text-decoration: none; }
    //       a:hover { text-decoration: underline; }
    //       table { border-collapse: collapse; margin-top: 20px; }
    //       th, td { border: 1px solid #ccc; padding: 8px 16px; }
    //       th { background: #f0f0f0; }
    //     </style>
    //   </head>
    //   <body>
    //     <h1>${companyName} 股票详情</h1>
    //     <table>
    //       <tr><th>Open</th><td>${detail.open ?? '-'}</td></tr>
    //       <tr><th>High</th><td>${detail.high ?? '-'}</td></tr>
    //       <tr><th>Close</th><td>${detail.close ?? '-'}</td></tr>
    //       <tr><th>Volume</th><td>${detail.volume ?? '-'}</td></tr>
    //       <tr><th>Timestamp</th><td>${detail.timestamp ?? '-'}</td></tr>
    //     </table>
    //     <a href="/stocks" target="_self">返回股票列表</a>
    //   </body>
    //   </html>
    // `);
    // 时间升序
    const lineData = data.slice().reverse();
    const latest = lineData[lineData.length - 1];

//     res.send(`
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//     <meta charset="UTF-8">
//     <title>${companyName} Multi-Indicator Line Chart and Latest Data</title>
//     <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
//     <style>
//       body { font-family: Arial, sans-serif; padding: 40px; background: #f8fbff; }
//       .container { max-width: 900px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px #e0eafc; padding: 24px; }
//       h1 { color: #2980b9; }
//       table { border-collapse: collapse; margin-top: 20px; width: 100%; }
//       th, td { border: 1px solid #e0f0ff; padding: 8px 12px; text-align: center; }
//       th { background: #f0f8ff; }
//       #lineChart { margin-top: 30px; height: 500px !important; }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <h1>${companyName} Multi-Indicator Line Chart</h1>
//       <canvas id="lineChart" height="500"></canvas>
//       <h2>Latest Data</h2>
//       <table>
//         <tr>
//           <th>Time</th>
//           <th>Open</th>
//           <th>High</th>
//           <th>Low</th>
//           <th>Close</th>
//           <th>Volume</th>
//         </tr>
//         <tr>
//           <td>${latest.timestamp}</td>
//           <td>${latest.open}</td>
//           <td>${latest.high}</td>
//           <td>${latest.low}</td>
//           <td>${latest.close}</td>
//           <td>${latest.volume}</td>
//         </tr>
//       </table>
//     </div>
//     <script>
//       const lineData = ${JSON.stringify(lineData)};
//       const labels = lineData.map(d => d.timestamp);
//       const openPrices = lineData.map(d => Number(d.open));
//       const highPrices = lineData.map(d => Number(d.high));
//       const lowPrices = lineData.map(d => Number(d.low));
//       const closePrices = lineData.map(d => Number(d.close));

//       const ctx = document.getElementById('lineChart').getContext('2d');
//       new Chart(ctx, {
//         type: 'line',
//         data: {
//           labels: labels,
//           datasets: [
//             {
//               label: 'Open',
//               data: openPrices,
//               borderColor: '#27ae60',
//               backgroundColor: 'transparent',
//               fill: false,
//               tension: 0.2,
//               pointRadius: 2
//             },
//             {
//               label: 'High',
//               data: highPrices,
//               borderColor: '#e67e22',
//               backgroundColor: 'transparent',
//               fill: false,
//               tension: 0.2,
//               pointRadius: 2
//             },
//             {
//               label: 'Low',
//               data: lowPrices,
//               borderColor: '#2980b9',
//               backgroundColor: 'transparent',
//               fill: false,
//               tension: 0.2,
//               pointRadius: 2
//             },
//             {
//               label: 'Close',
//               data: closePrices,
//               borderColor: '#e74c3c',
//               backgroundColor: 'transparent',
//               fill: false,
//               tension: 0.2,
//               pointRadius: 2
//             }
//           ]
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: { display: true }
//           },
//           scales: {
//             x: { display: true, title: { display: true, text: 'Time' } },
//             y: { display: true, title: { display: true, text: 'Price' } }
//           }
//         }
//       });
//     </script>
//   </body>
//   </html>
// `);

res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${companyName} Analysis Board</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; background: #f8fbff; }
      .container { max-width: 900px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px #e0eafc; padding: 24px; }
      h1 { color: #2980b9; }
      table { border-collapse: collapse; margin-top: 20px; width: 100%; }
      th, td { border: 1px solid #e0f0ff; padding: 8px 12px; text-align: center; }
      th { background: #f0f8ff; }
      #klineChart { margin-top: 30px; width: 100%; height: 500px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${companyName} K-line Chart</h1>
      <div id="klineChart"></div>
      <h2>Latest Data</h2>
      <table>
        <tr>
          <th>Time</th>
          <th>OpenPrice</th>
          <th>HighestPrice</th>
          <th>LowestPrice</th>
          <th>ClosePrice</th>
          <th>Volume</th>
        </tr>
        <tr>
          <td>${latest.timestamp}</td>
          <td>${latest.open}</td>
          <td>${latest.high}</td>
          <td>${latest.low}</td>
          <td>${latest.close}</td>
          <td>${latest.volume}</td>
        </tr>
      </table>
    </div>
    <script>
      // 准备K线数据
      const lineData = ${JSON.stringify(lineData)};
      const dates = lineData.map(d => d.timestamp.split('T')[0]);
      const kData = lineData.map(d => [
        Number(d.open),
        Number(d.close),
        Number(d.low),
        Number(d.high)
      ]);

      const chartDom = document.getElementById('klineChart');
      const myChart = echarts.init(chartDom);

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: function(params) {
            const p = params[0];
            return [
              'Time: ' + p.axisValue,
              'OpenPrice: ' + p.data[0],
              'ClosePrice: ' + p.data[1],
              'LowestPrice: ' + p.data[2],
              'HighestPrice: ' + p.data[3]
            ].join('<br>');
          }
        },
        xAxis: {
          type: 'category',
          data: dates,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#2980b9' } },
          axisLabel: { fontSize: 13 }
        },
        yAxis: {
          scale: true,
          axisLine: { lineStyle: { color: '#e67e22' } },
          axisLabel: { fontSize: 13 }
        },
        grid: { left: '5%', right: '5%', top: 40, bottom: 40 },
        series: [{
          type: 'candlestick',
          data: kData,
          itemStyle: {
            color: '#e74c3c',        // 阳线
            color0: '#27ae60',       // 阴线
            borderColor: '#e74c3c',
            borderColor0: '#27ae60'
          }
        }]
      };

      myChart.setOption(option);
      window.addEventListener('resize', () => myChart.resize());
    </script>
  </body>
  </html>
`);
  } catch (error) {
    res.status(500).send('服务器错误');
  }
});

// 添加投资组合接口（插入 holderinfo 表，code 不重复）
router.post('/api/holderinfo/add', express.json(), async (req, res) => {
  console.log('收到买入请求:', req.body); // 新增日志
  const { companyname, code, price, share, buyorsale } = req.body;
  if (!companyname || !code || !price || !share) {
    return res.json({ success: false, message: '参数缺失' });
  }

  const { error: insertError } = await supabase
    .from('holderinfo')
    .insert([{ companyname, code, price, share, buyorsale }]);

  if (insertError) {
    console.error('插入失败:', insertError); // 新增日志
    return res.json({ success: false, message: '插入失败' });
  }

  res.json({ success: true });
});

// 获取投资组合列表接口
router.get('/api/holderinfo/list', async (req, res) => {
  const { data, error } = await supabase
    .from('holderinfo')
    .select('companyname, code, price, share');
  if (error)
    {
    console.log('获取投资组合列表失败:', error); // 新增日志
    return res.status(500).json({ success: false, message: '获取投资组合列表失败' });
    }
  else
    {
      console.log('获取投资组合列表:', data); // 新增日志
      console.log('successful select in left')
    } 
  res.json(data);
});

export default router;
