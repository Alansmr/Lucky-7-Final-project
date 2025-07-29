// routes/stocksRoute.js
import express from 'express';
import { getStockData } from '../services/stockService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// 获取当前文件的绝对路径（src/routes/stocksRoute.js）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // 得到 src/routes 目录

const htmlPath = path.join(__dirname, '..', '..', 'public', 'stock.html');

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

export default router;