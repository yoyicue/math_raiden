import { UI_CONFIG } from '../utils/Constants.js';

export default class HUD {
    constructor(scene) {
        this.scene = scene;
        this.elements = {};
        this.messageQueue = [];
        this.currentMessage = null;
        
        this.createHUD();
    }
    
    createHUD() {
        // 左上角游戏信息面板
        this.createGameInfoPanel();
        
        // 右上角道具信息面板
        this.createPowerupInfoPanel();
        
        // 暂停提示
        this.createPauseIndicator();
        
        // 消息显示区域
        this.createMessageArea();
    }
    
    createGameInfoPanel() {
        // 使用相对边距，确保在小屏幕上不会超出
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        const margin = Math.max(10, Math.min(20, gameWidth * 0.03)); // 动态边距，最小10px，最大20px
        
        const x = margin;
        const y = margin;
        
        // 背景面板
        this.elements.gameInfoBg = this.scene.add.rectangle(x + 80, y + 60, 160, 120, 0x000000, 0.7);
        this.elements.gameInfoBg.setStrokeStyle(2, 0x333333);
        
        // 生命值
        this.elements.livesLabel = this.scene.add.text(x, y, '生命值:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        });
        
        this.elements.livesValue = this.scene.add.text(x + 70, y, '3', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.PRIMARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        });
        
        // 分数
        this.elements.scoreLabel = this.scene.add.text(x, y + 25, '分数:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        });
        
        this.elements.scoreValue = this.scene.add.text(x + 70, y + 25, '0', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.PRIMARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        });
        
        // 护盾
        this.elements.shieldLabel = this.scene.add.text(x, y + 50, '护盾:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        });
        
        this.elements.shieldValue = this.scene.add.text(x + 70, y + 50, '0', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.INFO,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        });
        
        // 导弹
        this.elements.missilesLabel = this.scene.add.text(x, y + 75, '导弹:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        });
        
        this.elements.missilesValue = this.scene.add.text(x + 70, y + 75, '0', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.PRIMARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        });
        
        // 操作提示
        this.elements.pauseHint = this.scene.add.text(x, y + 105, '按 P 暂停', {
            fontSize: UI_CONFIG.FONTS.SIZE.SMALL,
            color: UI_CONFIG.COLORS.DISABLED,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        });
    }
    
    createPowerupInfoPanel() {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        const margin = Math.max(10, Math.min(20, gameWidth * 0.03)); // 动态边距
        
        const x = gameWidth - margin;
        const y = margin;
        
        // 背景面板
        this.elements.powerupInfoBg = this.scene.add.rectangle(x - 80, y + 40, 160, 80, 0x000000, 0.7);
        this.elements.powerupInfoBg.setStrokeStyle(2, 0x333333);
        
        // 武器等级
        this.elements.weaponLabel = this.scene.add.text(x - 120, y, '武器等级:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        }).setOrigin(0, 0);
        
        this.elements.weaponValue = this.scene.add.text(x - 20, y, '1', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.SECONDARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        
        // 难度等级
        this.elements.gradeLabel = this.scene.add.text(x - 120, y + 25, '难度:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        }).setOrigin(0, 0);
        
        this.elements.gradeValue = this.scene.add.text(x - 20, y + 25, 'G1', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.SECONDARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        
        // 击败敌机数
        this.elements.enemiesLabel = this.scene.add.text(x - 120, y + 50, '击败:', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        }).setOrigin(0, 0);
        
        this.elements.enemiesValue = this.scene.add.text(x - 20, y + 50, '0', {
            fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
            color: UI_CONFIG.COLORS.PRIMARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(1, 0);
    }
    
    createPauseIndicator() {
        // 暂停指示器（默认隐藏）
        this.elements.pauseIndicator = this.scene.add.container(
            this.scene.game.config.width / 2,
            this.scene.game.config.height / 2
        );
        
        const pauseBg = this.scene.add.rectangle(0, 0, 300, 150, 0x000000, 0.8);
        pauseBg.setStrokeStyle(3, 0x00ff00);
        
        const pauseTitle = this.scene.add.text(0, -30, '游戏暂停', {
            fontSize: '48px',
            color: UI_CONFIG.COLORS.PRIMARY,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const pauseHint = this.scene.add.text(0, 20, '按 P 键继续游戏', {
            fontSize: UI_CONFIG.FONTS.SIZE.LARGE,
            color: UI_CONFIG.COLORS.TEXT,
            fontFamily: UI_CONFIG.FONTS.PRIMARY
        }).setOrigin(0.5);
        
        this.elements.pauseIndicator.add([pauseBg, pauseTitle, pauseHint]);
        this.elements.pauseIndicator.setVisible(false);
        this.elements.pauseIndicator.setDepth(100);
        
        // 添加发光动画
        this.scene.tweens.add({
            targets: pauseTitle,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    createMessageArea() {
        // 消息显示区域（屏幕中上部）
        const gameHeight = this.scene.game.config.height;
        const messageY = Math.max(80, gameHeight * 0.15); // 动态位置，最小80px
        
        this.elements.messageArea = this.scene.add.container(
            this.scene.game.config.width / 2,
            messageY
        );
        this.elements.messageArea.setDepth(50);
    }
    
    // 更新游戏状态显示
    updateGameState(gameState) {
        if (!gameState) return;
        
        // 更新数值
        this.elements.livesValue.setText(gameState.lives || 0);
        this.elements.scoreValue.setText(gameState.score || 0);
        this.elements.shieldValue.setText(gameState.shield || 0);
        this.elements.missilesValue.setText(gameState.missiles || 0);
        this.elements.weaponValue.setText(gameState.weaponLevel || 1);
        this.elements.gradeValue.setText(`G${gameState.gradeLevel || 1}`);
        this.elements.enemiesValue.setText(gameState.enemiesDefeated || 0);
        
        // 根据数值改变颜色
        this.updateValueColors(gameState);
    }
    
    updateValueColors(gameState) {
        // 生命值颜色
        if (gameState.lives <= 1) {
            this.elements.livesValue.setColor(UI_CONFIG.COLORS.WARNING);
        } else if (gameState.lives <= 2) {
            this.elements.livesValue.setColor(UI_CONFIG.COLORS.SECONDARY);
        } else {
            this.elements.livesValue.setColor(UI_CONFIG.COLORS.PRIMARY);
        }
        
        // 护盾颜色
        if (gameState.shield > 0) {
            this.elements.shieldValue.setColor(UI_CONFIG.COLORS.INFO);
        } else {
            this.elements.shieldValue.setColor(UI_CONFIG.COLORS.DISABLED);
        }
        
        // 导弹颜色
        if (gameState.missiles > 0) {
            this.elements.missilesValue.setColor(UI_CONFIG.COLORS.PRIMARY);
        } else {
            this.elements.missilesValue.setColor(UI_CONFIG.COLORS.DISABLED);
        }
    }
    
    // 显示消息
    showMessage(text, color = UI_CONFIG.COLORS.TEXT, duration = 2000) {
        // 添加到消息队列
        this.messageQueue.push({ text, color, duration });
        
        // 如果当前没有消息在显示，立即显示
        if (!this.currentMessage) {
            this.displayNextMessage();
        }
    }
    
    displayNextMessage() {
        if (this.messageQueue.length === 0) {
            this.currentMessage = null;
            return;
        }
        
        const message = this.messageQueue.shift();
        
        // 创建消息文本
        const messageText = this.scene.add.text(0, 0, message.text, {
            fontSize: UI_CONFIG.FONTS.SIZE.LARGE,
            color: message.color,
            fontFamily: UI_CONFIG.FONTS.PRIMARY,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.elements.messageArea.add(messageText);
        this.currentMessage = messageText;
        
        // 动画效果
        messageText.setAlpha(0);
        messageText.setScale(0.5);
        
        this.scene.tweens.add({
            targets: messageText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // 延迟后淡出
        this.scene.time.delayedCall(message.duration, () => {
            this.scene.tweens.add({
                targets: messageText,
                alpha: 0,
                y: messageText.y - 30,
                duration: 500,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    messageText.destroy();
                    this.displayNextMessage();
                }
            });
        });
    }
    
    // 显示暂停指示器
    showPauseIndicator() {
        this.elements.pauseIndicator.setVisible(true);
    }
    
    // 隐藏暂停指示器
    hidePauseIndicator() {
        this.elements.pauseIndicator.setVisible(false);
    }
    
    // 显示特殊效果消息
    showPowerupMessage(powerupType, isCorrect = true) {
        console.log('HUD.showPowerupMessage called:', powerupType, isCorrect);
        
        const color = isCorrect ? UI_CONFIG.COLORS.PRIMARY : UI_CONFIG.COLORS.SECONDARY;
        const prefix = isCorrect ? '✓ ' : '○ ';
        
        let message = '';
        switch(powerupType) {
            case 'WEAPON':
                message = prefix + (isCorrect ? '武器升级！' : '武器强化！');
                break;
            case 'SHIELD':
                message = prefix + (isCorrect ? '护盾+15！' : '护盾+5！');
                break;
            case 'LIFE':
                message = prefix + (isCorrect ? '生命+1！' : '护盾+3！');
                break;
            case 'BOMB':
                message = prefix + '清屏炸弹！';
                break;
            case 'MISSILE':
                message = prefix + (isCorrect ? '导弹+50！' : '导弹+20！');
                break;
            case 'SCORE':
                message = prefix + (isCorrect ? '分数+500！' : '分数+100！');
                break;
        }
        
        this.showMessage(message, color, 2500);
    }
    
    // 显示数学题结果
    showMathResult(isCorrect, rewardText) {
        console.log('HUD.showMathResult called:', isCorrect, rewardText);
        
        const color = isCorrect ? UI_CONFIG.COLORS.PRIMARY : UI_CONFIG.COLORS.SECONDARY;
        const resultText = isCorrect ? '答对了！' : '答错了！';
        
        // 先显示结果
        this.showMessage(resultText, color, 1500);
        
        // 然后显示奖励
        if (rewardText) {
            this.scene.time.delayedCall(800, () => {
                this.showMessage(rewardText, color, 2000);
            });
        }
    }
    
    // 显示游戏提示
    showGameHint(text) {
        this.showMessage(text, UI_CONFIG.COLORS.INFO, 3000);
    }
    
    // 销毁HUD
    destroy() {
        // 清理所有元素
        Object.values(this.elements).forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        
        // 清理消息队列
        this.messageQueue = [];
        this.currentMessage = null;
    }
} 