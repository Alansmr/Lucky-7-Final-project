import axios from 'axios'; 
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU';
const supabase = createClient(supabaseUrl, supabaseKey);


// 2. 获取JSON数据（以示例API为例，实际URL请替换）
const apiUrl = 'https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData?ticker=AAPL';

axios.get(apiUrl)
  .then(async (response) => {
    const { ticker, price_data } = response.data;

    const volumes = price_data.volume;
    const lows = price_data.low;
    const closes = price_data.close;
    const timestamps = price_data.timestamp;
    const open = price_data.open;
    const high = price_data.high;


    const count = Math.min(volumes.length, lows.length, closes.length, timestamps.length, open.length, high.length);

    for (let i = 0; i < count; i++) {
      const record = {
        ticker,
        volume: volumes[i],
        low: lows[i],
        close: closes[i],
        timestamp: new Date(timestamps[i]).toISOString(), // Supabase 推荐 ISO 字符串
        open: open[i],
        high: high[i]
      };

      // 使用 Supabase 的 insert 方法
      await supabase
        .from('stackinfo')
        .insert([record])
        .then(({ error }) => {
          if (error) {
            console.error(`插入第 ${i + 1} 条失败:`, error); // 打印整个 error
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
    console.log('获取结束');
  });