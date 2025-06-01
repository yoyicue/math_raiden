import StorageManager from '../utils/StorageManager.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.gameData = data || {};
        this.selectedButton = 0; // 0: 重新开始, 1: 返回主菜单
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
        this.restartButton = this.add.rectangle(centerX - 100, buttonYPosition, 150, 50, 0xff6600);
        this.restartText = this.add.text(centerX - 100, buttonYPosition, '重新开始', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.restartButton.setInteractive({ useHandCursor: true });
        this.restartButton.on('pointerover', () => {
            this.selectedButton = 0;
            this.updateButtonSelection();
        });
        this.restartButton.on('pointerout', () => this.restartButton.setFillStyle(0xff6600));
        this.restartButton.on('pointerdown', () => {
            this.restartGame();
        });
        
        // 返回主菜单按钮
        this.menuButton = this.add.rectangle(centerX + 100, buttonYPosition, 150, 50, 0x333333);
        this.menuText = this.add.text(centerX + 100, buttonYPosition, '返回主菜单', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.menuButton.setInteractive({ useHandCursor: true });
        this.menuButton.on('pointerover', () => {
            this.selectedButton = 1;
            this.updateButtonSelection();
        });
        this.menuButton.on('pointerout', () => this.menuButton.setFillStyle(0x333333));
        this.menuButton.on('pointerdown', () => {
            this.returnToMenu();
        });
        
        // 键盘操作说明
        this.add.text(centerX, buttonYPosition + 80, [
            '键盘操作：',
            '←→键选择 | 回车键确认 | R键重新开始 | M键返回菜单'
        ], {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);
        
        // 设置键盘控制
        this.setupKeyboardControls();
        
        // 初始化按钮选择状态
        this.updateButtonSelection();
        
        // 淡入效果
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
    
    setupKeyboardControls() {
        // 方向键控制
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 功能键
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // 键盘事件监听
        this.cursors.left.on('down', () => {
            this.selectedButton = 0;
            this.updateButtonSelection();
        });
        
        this.cursors.right.on('down', () => {
            this.selectedButton = 1;
            this.updateButtonSelection();
        });
        
        this.enterKey.on('down', () => {
            this.confirmSelection();
        });
        
        this.spaceKey.on('down', () => {
            this.confirmSelection();
        });
        
        this.rKey.on('down', () => {
            this.restartGame();
        });
        
        this.mKey.on('down', () => {
            this.returnToMenu();
        });
        
        this.escKey.on('down', () => {
            this.returnToMenu();
        });
    }
    
    updateButtonSelection() {
        // 重置所有按钮样式
        this.restartButton.setFillStyle(0xff6600);
        this.restartButton.setStrokeStyle(0);
        this.restartButton.setScale(1);
        
        this.menuButton.setFillStyle(0x333333);
        this.menuButton.setStrokeStyle(0);
        this.menuButton.setScale(1);
        
        // 高亮选中的按钮
        if (this.selectedButton === 0) {
            this.restartButton.setFillStyle(0xff8800);
            this.restartButton.setStrokeStyle(3, 0xffaa00);
            this.tweens.add({
                targets: this.restartButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        } else {
            this.menuButton.setFillStyle(0x555555);
            this.menuButton.setStrokeStyle(3, 0x777777);
            this.tweens.add({
                targets: this.menuButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        }
    }
    
    confirmSelection() {
        if (this.selectedButton === 0) {
            this.restartGame();
        } else {
            this.returnToMenu();
        }
    }
    
    restartGame() {
        this.scene.start('GameScene', { gradeLevel: this.gameData.gradeLevel || 1 });
    }
    
    returnToMenu() {
        this.scene.start('MenuScene');
    }
} 