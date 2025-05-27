import { MATH_CONFIG, POWERUP_CONFIG } from '../utils/Constants.js';

export default class MathSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentQuestion = null;
        this.currentPowerType = null;
        this.gradeLevel = 1;
        this.questionCount = 0;
        this.correctAnswers = 0;
    }
    
    setGradeLevel(level) {
        this.gradeLevel = Math.max(1, Math.min(3, level));
    }
    
    generateQuestion(grade = this.gradeLevel) {
        const gradeConfig = MATH_CONFIG.GRADES[grade];
        if (!gradeConfig) {
            console.warn(`Invalid grade level: ${grade}, using grade 1`);
            return this.generateQuestion(1);
        }
        
        switch(grade) {
            case 1: // G1: 10以内加减法
                return this.generateBasicMath(10);
            case 2: // G2: 20以内加减法
                return this.generateBasicMath(20);
            case 3: // G3: 乘法运算
                return this.generateMultiplication();
            default:
                return this.generateBasicMath(10);
        }
    }
    
    generateBasicMath(maxNumber) {
        const a = Math.floor(Math.random() * maxNumber) + 1;
        const b = Math.floor(Math.random() * maxNumber) + 1;
        
        if (Math.random() < 0.5) {
            // 加法
            return {
                question: `${a} + ${b} = ?`,
                answer: a + b,
                type: 'addition',
                operands: [a, b]
            };
        } else {
            // 减法（确保结果为正数）
            const max = Math.max(a, b);
            const min = Math.min(a, b);
            return {
                question: `${max} - ${min} = ?`,
                answer: max - min,
                type: 'subtraction',
                operands: [max, min]
            };
        }
    }
    
    generateMultiplication() {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        
        return {
            question: `${a} × ${b} = ?`,
            answer: a * b,
            type: 'multiplication',
            operands: [a, b]
        };
    }
    
    showQuestion(powerType) {
        console.log('MathSystem.showQuestion called with powerType:', powerType);
        
        // 检查是否已有活跃的数学题
        if (this.isQuestionActive()) {
            console.warn('MathSystem: 已有活跃的数学题，忽略新的题目请求');
            return;
        }
        
        // 生成新题目
        this.currentQuestion = this.generateQuestion(this.gradeLevel);
        this.currentPowerType = powerType;
        this.questionCount++;
        
        console.log('Generated question:', this.currentQuestion);
        
        // 暂停游戏物理
        this.scene.physics.pause();
        
        // 启动数学题场景
        this.scene.scene.launch('MathQuestionScene', {
            question: this.currentQuestion,
            powerType: powerType,
            gradeLevel: this.gradeLevel,
            callback: this.handleAnswer.bind(this)
        });
        
        // 暂停游戏场景
        this.scene.scene.pause();
    }
    
    handleAnswer(userAnswer, isCorrect) {
        console.log('MathSystem.handleAnswer called:', userAnswer, isCorrect, 'powerType:', this.currentPowerType);
        
        // 立即恢复游戏（与demo.html保持一致）
        this.scene.physics.resume();
        this.scene.scene.resume();
        
        // 统计答题情况
        if (isCorrect) {
            this.correctAnswers++;
        }
        
        // 保存当前状态用于异步处理
        const currentPowerType = this.currentPowerType;
        const currentIsCorrect = isCorrect;
        
        // 清理当前题目（立即清理，避免重复触发）
        this.currentQuestion = null;
        this.currentPowerType = null;
        
        // 异步应用奖励和显示消息（100ms后，让游戏先恢复）
        this.scene.time.delayedCall(100, () => {
            // 应用奖励
            if (currentIsCorrect) {
                this.applyCorrectReward(currentPowerType);
            } else {
                this.applyIncorrectReward(currentPowerType);
            }
            
            // 显示结果消息
            this.showAnswerResult(currentIsCorrect, currentPowerType);
        });
    }
    
    applyCorrectReward(powerType) {
        const player = this.scene.player;
        let rewardMessage = '';
        let scoreBonus = MATH_CONFIG.REWARDS.CORRECT.score;
        
        switch(powerType) {
            case 'WEAPON':
                if (player.weaponLevel < 3) {
                    player.weaponLevel++;
                    this.scene.gameState.maxWeaponLevel = Math.max(
                        this.scene.gameState.maxWeaponLevel, 
                        player.weaponLevel
                    );
                    rewardMessage = '武器升级！飞机修复完成！';
                } else {
                    rewardMessage = '武器已满级！获得200分修复奖励！';
                    scoreBonus += 200;
                }
                break;
                
            case 'SHIELD':
                const shieldAmount = 15;
                player.shield = Math.min(player.shield + shieldAmount, 25);
                rewardMessage = `护盾强化！获得护盾+${shieldAmount}！`;
                break;
                
            case 'LIFE':
                if (player.lives < 5) {
                    player.lives++;
                    rewardMessage = '生命值恢复！+1生命！';
                } else {
                    player.shield = Math.min(player.shield + 10, 25);
                    rewardMessage = '生命已满！获得护盾+10！';
                }
                break;
                
            case 'BOMB':
                this.scene.clearAllEnemies();
                rewardMessage = '紧急清屏！所有敌机被消灭！';
                break;
                
            case 'MISSILE':
                const missileAmount = 50;
                player.missiles = Math.min(player.missiles + missileAmount, 100);
                rewardMessage = `导弹补给！获得追踪导弹+${missileAmount}！`;
                break;
                
            case 'SCORE':
                const scoreReward = 500;
                scoreBonus += scoreReward;
                rewardMessage = `分数奖励！获得${scoreReward}分！`;
                break;
                
            default:
                rewardMessage = '获得神秘奖励！';
                break;
        }
        
        // 应用分数奖励
        this.scene.addScore(scoreBonus);
        
        // 给予无敌时间
        player.invulnerable = MATH_CONFIG.REWARDS.CORRECT.invulnerableTime;
        
        // 显示奖励消息
        if (powerType) {
            this.scene.hud.showPowerupMessage(powerType, true);
        }
        
        // 特效
        this.scene.effectSystem.createCollectEffect(player.x, player.y);
        
        return rewardMessage;
    }
    
    applyIncorrectReward(powerType) {
        const player = this.scene.player;
        let rewardMessage = '';
        
        // 给予基础保护
        player.invulnerable = MATH_CONFIG.REWARDS.INCORRECT.invulnerableTime;
        
        // 根据道具类型给予安慰奖励
        switch(powerType) {
            case 'WEAPON':
                this.scene.addScore(50);
                rewardMessage = '修复未完成，获得50分安慰奖励';
                break;
                
            case 'SHIELD':
                const shieldAmount = 5;
                player.shield = Math.min(player.shield + shieldAmount, 25);
                rewardMessage = `修复未完成，获得护盾+${shieldAmount}`;
                break;
                
            case 'LIFE':
                const shieldAmount2 = 3;
                player.shield = Math.min(player.shield + shieldAmount2, 25);
                rewardMessage = `修复未完成，获得护盾+${shieldAmount2}`;
                break;
                
            case 'BOMB':
                // 清除部分敌机
                this.scene.clearSomeEnemies(0.3); // 清除30%的敌机
                rewardMessage = '部分清屏！清除了一些敌机';
                break;
                
            case 'MISSILE':
                const missileAmount = 20;
                player.missiles = Math.min(player.missiles + missileAmount, 100);
                rewardMessage = `获得少量导弹+${missileAmount}`;
                break;
                
            case 'SCORE':
                this.scene.addScore(100);
                rewardMessage = '获得100分安慰奖励';
                break;
                
            default:
                rewardMessage = '获得1秒保护时间';
                break;
        }
        
        // 显示奖励消息
        if (powerType) {
            this.scene.hud.showPowerupMessage(powerType, false);
        }
        
        return rewardMessage;
    }
    
    showAnswerResult(isCorrect, powerType) {
        // 不需要额外显示结果，showPowerupMessage已经包含了足够的信息
        // 道具奖励消息中的 ✓ 或 ○ 标记已经表明了答题结果
    }
    
    // 获取答题统计
    getStatistics() {
        return {
            totalQuestions: this.questionCount,
            correctAnswers: this.correctAnswers,
            accuracy: this.questionCount > 0 ? (this.correctAnswers / this.questionCount) : 0,
            gradeLevel: this.gradeLevel
        };
    }
    
    // 重置统计
    reset() {
        this.questionCount = 0;
        this.correctAnswers = 0;
        this.currentQuestion = null;
        this.currentPowerType = null;
    }
    
    // 检查是否有数学题正在进行
    isQuestionActive() {
        return this.currentQuestion !== null;
    }
    
    // 获取当前难度名称
    getCurrentGradeName() {
        const gradeConfig = MATH_CONFIG.GRADES[this.gradeLevel];
        return gradeConfig ? gradeConfig.name : 'Unknown';
    }
} 