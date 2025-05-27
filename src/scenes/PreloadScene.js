export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // 计算进度条尺寸和位置
        const progressBarWidth = Math.min(300, gameWidth - 60); // 最大300px，但要留边距
        const progressBarHeight = 50;
        const progressBarX = centerX - progressBarWidth / 2;
        const progressBarY = centerY + 20;
        
        // 创建加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

        const loadingText = this.make.text({
            x: centerX,
            y: centerY - 20,
            text: '加载中...',
            style: {
                font: '20px Arial',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: centerX,
            y: progressBarY + progressBarHeight / 2,
            text: '0%',
            style: {
                font: '18px Arial',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(progressBarX + 10, progressBarY + 10, (progressBarWidth - 20) * value, progressBarHeight - 20);
            
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // 动态创建游戏资源
        this.createGameAssets();
    }

    create() {
        console.log('资源加载完成');
        this.scene.start('MenuScene');
    }

    createGameAssets() {
        // 创建游戏纹理
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        
        // 玩家飞机（绿色三角形）
        graphics.fillStyle(0x00ff00);
        graphics.fillTriangle(20, 0, 0, 40, 40, 40);
        graphics.generateTexture('player', 40, 40);
        
        // 敌机（红色方块）
        graphics.clear();
        graphics.fillStyle(0xff0000);
        graphics.fillRect(0, 0, 40, 40);
        graphics.generateTexture('enemy', 40, 40);
        
        // 子弹（黄色矩形）
        graphics.clear();
        graphics.fillStyle(0xffff00);
        graphics.fillRect(0, 0, 4, 10);
        graphics.generateTexture('bullet', 4, 10);
        
        // 敌机子弹（紫色圆形）
        graphics.clear();
        graphics.fillStyle(0xff00ff);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('enemyBullet', 8, 8);
        
        // 道具（彩色方块）
        graphics.clear();
        graphics.fillStyle(0xffd700);
        graphics.fillRect(0, 0, 30, 30);
        graphics.generateTexture('powerup', 30, 30);
        
        // 导弹（绿色菱形）
        graphics.clear();
        graphics.fillStyle(0x00ff00);
        graphics.fillTriangle(4, 0, 0, 8, 8, 8);
        graphics.fillRect(2, 8, 4, 8);
        graphics.generateTexture('missile', 8, 16);
        
        // 爆炸粒子
        graphics.clear();
        graphics.fillStyle(0xff6600);
        graphics.fillCircle(2, 2, 2);
        graphics.generateTexture('particle', 4, 4);
        
        // 星星粒子
        graphics.clear();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(1, 1, 1);
        graphics.generateTexture('star', 2, 2);
        
        graphics.destroy();
        
        console.log('游戏资源创建完成');
    }
} 