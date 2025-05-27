export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 显示启动信息
        this.add.text(300, 400, '数学雷电', {
            fontSize: '32px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(300, 450, '正在初始化...', {
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