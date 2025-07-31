//store user cash data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrtrmddtacmaeuzupodz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHJtZGR0YWNtYWV1enVwb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODM0MDcsImV4cCI6MjA2OTI1OTQwN30.EYs4NwSyhhqUXzx_5AfsGVUcICgwRS3MSY6CkHaqoqU';
const supabase = createClient(supabaseUrl, supabaseKey);

class UserCacheService {
    constructor() {
        this.userCash;
        this.cacheTTL = 24 * 60 * 60 * 1000; 
        this.cacheTimestamp = Date.now(); 
    }
    
    async getUserCash() {
        if (this.userCash && this.cacheTimestamp && (Date.now() - this.cacheTimestamp < this.cacheTTL)) {
            return this.userCash;
        }
        
        const { data, error } = await supabase
        .from('user')
        .select('cash')
        .single();
    
        if (error) {
            console.error('获取用户现金失败:', error);
            return this.userCash;
        }
    
        this.userCash = data.cash || this.userCash;
        this.cacheTimestamp = Date.now();
        return this.userCash;
    }
    
    async updateUserCash(newCash) {
        const { error } = await supabase
        .from('user')
        .upsert({ cash: newCash });
    
        if (error) {
            console.error('更新用户现金失败:', error);
            return false;
        }
    
        this.userCash = newCash;
        this.cacheTimestamp = Date.now();
        return true;
    }
}

export const userCacheService = new UserCacheService();