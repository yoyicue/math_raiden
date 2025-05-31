const HIGH_SCORES_KEY = 'mathRaiden_highScores'; // localStorage 使用的键
const MAX_HIGH_SCORES = 5; // 排行榜显示的最大数量

export default class StorageManager {
    /**
     * 获取最高分列表
     * @returns {number[]} 按降序排列的最高分数组
     */
    static getHighScores() {
        const scoresString = localStorage.getItem(HIGH_SCORES_KEY);
        if (scoresString) {
            try {
                const scores = JSON.parse(scoresString);
                return Array.isArray(scores) ? scores : [];
            } catch (e) {
                console.error('Error parsing high scores from localStorage:', e);
                return [];
            }
        }
        return [];
    }

    /**
     * 保存最高分列表
     * @param {number[]} scores - 要保存的最高分数组
     */
    static saveHighScores(scores) {
        try {
            localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
        } catch (e) {
            console.error('Error saving high scores to localStorage:', e);
        }
    }

    /**
     * 添加新分数到最高分列表
     * @param {number} newScore - 新获得的分数
     * @returns {boolean} 如果分数成功添加到排行榜（即足够高），则返回 true
     */
    static addScore(newScore) {
        if (typeof newScore !== 'number' || isNaN(newScore)) {
            console.warn('Invalid score provided to addScore:', newScore);
            return false;
        }

        const highScores = this.getHighScores();
        let scoreAdded = false;

        // 检查新分数是否能进入排行榜
        if (highScores.length < MAX_HIGH_SCORES || newScore > highScores[highScores.length - 1]) {
            highScores.push(newScore);
            // 按降序排序
            highScores.sort((a, b) => b - a);
            
            // 保持排行榜的最大数量
            if (highScores.length > MAX_HIGH_SCORES) {
                highScores.splice(MAX_HIGH_SCORES);
            }
            
            this.saveHighScores(highScores);
            scoreAdded = true;
        }
        return scoreAdded;
    }

    /**
     * 检查分数是否能进入排行榜
     * @param {number} score - 要检查的分数
     * @returns {boolean} 如果分数能进入排行榜则返回 true
     */
    static isHighScore(score) {
        if (typeof score !== 'number' || isNaN(score)) {
            return false;
        }

        const highScores = this.getHighScores();
        return highScores.length < MAX_HIGH_SCORES || score > highScores[highScores.length - 1];
    }

    /**
     * 清除所有最高分记录（用于测试或重置）
     */
    static clearHighScores() {
        try {
            localStorage.removeItem(HIGH_SCORES_KEY);
        } catch (e) {
            console.error('Error clearing high scores from localStorage:', e);
        }
    }
} 