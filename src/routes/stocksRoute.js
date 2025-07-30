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
  
  console.log('实际拼接路径：', htmlPath);

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
      .select('open, high, close, volume, timestamp')
      .eq('ticker', stock.ticker)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      return res.status(500).send(`<h1>Supabase 查询出错: ${error.message}</h1>`);
    }
    if (!data || data.length === 0) {
      return res.status(404).send(`<h1>No detailed data found for "${companyName}".</h1>`);
    }

    const detail = data[0];

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${companyName} Details</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          a { color: #0077cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
          table { border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px 16px; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>${companyName} 股票详情</h1>
        <table>
          <tr><th>Open</th><td>${detail.open ?? '-'}</td></tr>
          <tr><th>High</th><td>${detail.high ?? '-'}</td></tr>
          <tr><th>Close</th><td>${detail.close ?? '-'}</td></tr>
          <tr><th>Volume</th><td>${detail.volume ?? '-'}</td></tr>
          <tr><th>Timestamp</th><td>${detail.timestamp ?? '-'}</td></tr>
        </table>
        <a href="/stocks" target="_self">返回股票列表</a>
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

export default router;
