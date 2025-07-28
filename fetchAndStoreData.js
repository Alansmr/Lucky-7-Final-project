const axios = require('axios');
const mysql = require('mysql2');

// 1. 配置数据库连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  port:3306,
  database: 'Portfolio',
});


// 2. 获取JSON数据（以示例API为例，实际URL请替换）
const apiUrl = 'https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData?ticker=C';

axios.get(apiUrl)
  .then((response) => {
    const { ticker, price_data } = response.data;

    const volumes = price_data.volume;
    const lows = price_data.low;
    const closes = price_data.close;
    const timestamps = price_data.timestamp;

    const count = Math.min(volumes.length, lows.length, closes.length, timestamps.length);

    for (let i = 0; i < count; i++) {
      const sql = `
        INSERT INTO stackInfo (ticker, volume, low, close, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
        ticker,
        volumes[i],
        lows[i],
        closes[i],
        new Date(timestamps[i]) // 转换为 JS Date 类型
      ];

      connection.query(sql, values, (err) => {
        if (err) {
          console.error(`插入第 ${i + 1} 条失败:`, err.message);
        } else {
          console.log(`成功插入第 ${i + 1} 条记录`);
        }
      });
    }
  })
  .catch((error) => {
    console.error('获取数据失败:', error.message);
  })
  .finally(() => {
    setTimeout(() => connection.end()); // 等待插入完成再关闭
    console.log('获取结束');
  });