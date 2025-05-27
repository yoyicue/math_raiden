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
        this.add.text(centerX, centerY - 100, `最终得分: ${this.gameData.score || 0}`, {
            fontSize: '36px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 游戏统计
        const stats = [
            `击败敌机: ${this.gameData.enemiesDefeated || 0} 架`,
            `存活时间: ${this.gameData.survivalTime || 0} 秒`,
            `最高武器等级: ${this.gameData.maxWeaponLevel || 1}`,
            `数学题难度: G${this.gameData.gradeLevel || 1}`
        ];
        
        this.add.text(centerX, centerY, stats, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        // 重新开始按钮
        const restartButton = this.add.rectangle(centerX - 100, centerY + 150, 150, 50, 0xff6600);
        const restartText = this.add.text(centerX - 100, centerY + 150, '重新开始', {
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
        const menuButton = this.add.rectangle(centerX + 100, centerY + 150, 150, 50, 0x333333);
        const menuText = this.add.text(centerX + 100, centerY + 150, '返回主菜单', {
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