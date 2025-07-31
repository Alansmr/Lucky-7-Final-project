import express from 'express';
import { getPortfolioData } from '../services/protfolioService.js';
import { getPortfolioComposition } from '../services/protfolioService.js';

const router = express.Router();

router.get('/api/protfolio', async (req, res) => {
  try {
    const protfolio = await getPortfolioData();
    res.json(protfolio);
  } catch (error) {
    res.status(500).json({ error: '获取Protfolio数据失败' });
  }
});

router.get('/api/protfolio/composition', async (req, res) => {
  try {
    const composition = await getPortfolioComposition();
    res.json(composition);
  } catch (error) {
    res.status(500).json({ error: '获取投资组合组成部分失败' });
  }
});

export default router;  