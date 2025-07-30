import express from 'express';
import { getPortfolioData } from '../services/protfolioService.js';

const router = express.Router();

router.get('/api/protfolio', async (req, res) => {
  try {
    const protfolio = await getPortfolioData();
    res.json(protfolio);
  } catch (error) {
    res.status(500).json({ error: '获取Protfolio数据失败' });
  }
});

export default router;