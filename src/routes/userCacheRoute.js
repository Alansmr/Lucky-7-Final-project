import express from 'express';
import { userCacheService } from '../services/userCacheService.js';

const router = express.Router();

router.get('/api/userCache', async (req, res) => {
    try {
        const userCash = await userCacheService.getUserCash(); 
        res.json({ cash: userCash });
    } catch (error) {
        res.status(500).json({ error: '获取用户缓存数据失败' });
    }
});

router.put('/api/userCache', async (req, res) => {
    const { cash } = req.body;
    if (typeof cash !== 'number') {
        return res.status(400).json({ error: '现金值必须是数字' });
    }
    try {
        const success = await userCacheService.updateUserCash(cash);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '更新用户缓存数据失败' });
        }
    } catch (error) {
        res.status(500).json({ error: '更新用户缓存数据失败' });
    }
});

export default router;