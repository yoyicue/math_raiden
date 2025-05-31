import StorageManager from '../utils/StorageManager.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.gameData = data || {};
    }

    create() {
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // 背景
        this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.9);
        
        // 游戏结束标题
        const title = this.add.text(centerX, centerY - 200, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff4444',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 发光动画
        this.tweens.add({
            targets: title,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // 最终得分
        const currentScore = this.gameData.score || 0;
        this.add.text(centerX, centerY - 130, `最终得分: ${currentScore}`, {
            fontSize: '36px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 检查是否创造新纪录
        const isNewRecord = StorageManager.addScore(currentScore);
        if (isNewRecord && currentScore > 0) {
            const newRecordText = this.add.text(centerX, centerY - 160, '🎉 新纪录！🎉', {
                fontSize: '24px',
                color: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // 新纪录闪烁动画
            this.tweens.add({
                targets: newRecordText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: 3
            });
        }
        
        // 游戏统计
        const stats = [
            `击败敌机: ${this.gameData.enemiesDefeated || 0} 架`,
            `存活时间: ${this.gameData.survivalTime || 0} 秒`,
            `最高武器等级: ${this.gameData.maxWeaponLevel || 1}`,
            `数学题难度: G${this.gameData.gradeLevel || 1}`
        ];
        
        this.add.text(centerX, centerY - 40, stats, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        // 排行榜标题
        this.add.text(centerX, centerY + 40, '🏆 排行榜 🏆', {
            fontSize: '28px',
            color: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 显示排行榜
        const highScores = StorageManager.getHighScores();
        let leaderboardYPosition = centerY + 80;
        
        if (highScores.length > 0) {
            highScores.forEach((score, index) => {
                const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
                const rankText = `${index + 1}. ${score} 分`;
                
                this.add.text(centerX, leaderboardYPosition + (index * 25), rankText, {
                    fontSize: '20px',
                    color: rankColor,
                    fontFamily: 'Arial',
                    fontStyle: index < 3 ? 'bold' : 'normal'
                }).setOrigin(0.5);
            });
        } else {
            this.add.text(centerX, leaderboardYPosition, '暂无记录', {
                fontSize: '20px',
                color: '#aaaaaa',
                fontFamily: 'Arial',
            }).setOrigin(0.5);
        }
        
        // 计算按钮位置
        const buttonYPosition = leaderboardYPosition + (highScores.length > 0 ? highScores.length * 25 : 25) + 40;
        
        // 重新开始按钮
        const restartButton = this.add.rectangle(centerX - 100, buttonYPosition, 150, 50, 0xff6600);
        const restartText = this.add.text(centerX - 100, buttonYPosition, '重新开始', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        restartButton.setInteractive({ useHandCursor: true });
        restartButton.on('pointerover', () => restartButton.setFillStyle(0xff8800));
        restartButton.on('pointerout', () => restartButton.setFillStyle(0xff6600));
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene', { gradeLevel: this.gameData.gradeLevel || 1 });
        });
        
        // 返回主菜单按钮
        const menuButton = this.add.rectangle(centerX + 100, buttonYPosition, 150, 50, 0x333333);
        const menuText = this.add.text(centerX + 100, buttonYPosition, '返回主菜单', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.on('pointerover', () => menuButton.setFillStyle(0x555555));
        menuButton.on('pointerout', () => menuButton.setFillStyle(0x333333));
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // 淡入效果
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
} 