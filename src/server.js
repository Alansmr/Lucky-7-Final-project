import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import stocksRoute from './routes/stocksRoute.js';
import { cacheService } from './services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));

// 使用股票路由
app.use('/', stocksRoute);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// 将根路径重定向到主页面
app.get('/', (req, res) => {
  res.redirect('/homepage.html');
});

async function startServer() {
  try {
    await cacheService.initialize();
 
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server fail to start:', error);
    process.exit(1); 
  }
}

startServer();