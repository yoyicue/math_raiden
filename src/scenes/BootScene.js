export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // 显示启动信息
        this.add.text(centerX, centerY - 50, '口算雷电', {
            fontSize: '32px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(centerX, centerY, '正在初始化...', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    create() {
        // 初始化游戏设置
        console.log('游戏启动中...');
        
        // 延迟一下让用户看到启动画面
        this.time.delayedCall(500, () => {
            this.scene.start('PreloadScene');
        });
    }
} 