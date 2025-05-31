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

        // 加载战机贴图资源
        this.loadGameAssets();
        
        // 动态创建游戏资源（作为备用）
        this.createGameAssets();
    }

    loadGameAssets() {
        // 加载玩家战机贴图
        this.load.image('player-sprite', 'assets/images/player.png');
        
        // 加载不同类型的敌机贴图
        this.load.image('enemy-basic-sprite', 'assets/images/enemy-basic.png');
        this.load.image('enemy-fast-sprite', 'assets/images/enemy-fast.png');
        this.load.image('enemy-tank-sprite', 'assets/images/enemy-tank.png');
        this.load.image('enemy-shooter-sprite', 'assets/images/enemy-shooter.png');
        
        // 加载子弹贴图
        this.load.image('bullet-sprite', 'assets/images/bullet.png');
        this.load.image('enemy-bullet-sprite', 'assets/images/enemy-bullet.png');
        
        // 加载导弹贴图
        this.load.image('missile-sprite', 'assets/images/missile.png');
        
        // 加载分类型道具贴图
        this.load.image('powerup-weapon-sprite', 'assets/images/powerup-weapon.png');
        this.load.image('powerup-shield-sprite', 'assets/images/powerup-shield.png');
        this.load.image('powerup-life-sprite', 'assets/images/powerup-life.png');
        this.load.image('powerup-bomb-sprite', 'assets/images/powerup-bomb.png');
        this.load.image('powerup-missile-sprite', 'assets/images/powerup-missile.png');
        this.load.image('powerup-score-sprite', 'assets/images/powerup-score.png');
        
        // 加载特效贴图
        this.load.image('explosion-sprite', 'assets/images/explosion.png');
        this.load.image('particle-sprite', 'assets/images/particle.png');
        
        // 错误处理：如果贴图加载失败，使用程序生成的纹理
        this.load.on('loaderror', (file) => {
            console.warn(`贴图加载失败: ${file.key}, 将使用程序生成的纹理`);
        });
    }

    create() {
        console.log('资源加载完成');
        this.scene.start('MenuScene');
    }

    createGameAssets() {
        // 创建游戏纹理
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        
        // 检查并设置玩家飞机纹理
        if (this.textures.exists('player-sprite')) {
            // 如果玩家贴图存在，直接使用
            console.log('使用玩家战机贴图');
        } else {
            // 玩家飞机（绿色三角形）- 程序生成备用，统一64x64px
            graphics.fillStyle(0x00ff00);
            graphics.fillTriangle(32, 8, 16, 56, 48, 56); // 在64x64画布中居中的三角形
            graphics.generateTexture('player', 64, 64);
            console.log('使用程序生成的玩家战机纹理');
        }
        
        // 检查并设置敌机纹理
        const enemyTypes = ['basic', 'fast', 'tank', 'shooter'];
        const enemyColors = [0xff0000, 0xff6600, 0x666666, 0x9900ff];
        
        enemyTypes.forEach((type, index) => {
            const spriteKey = `enemy-${type}-sprite`;
            const textureKey = `enemy-${type}`;
            
            if (this.textures.exists(spriteKey)) {
                console.log(`使用${type}敌机贴图`);
                // 贴图存在，无需生成程序纹理
            } else {
                // 敌机（彩色方块）- 程序生成备用，统一64x64px
                graphics.clear();
                graphics.fillStyle(enemyColors[index]);
                graphics.fillRect(8, 8, 48, 48); // 在64x64画布中居中的方块
                graphics.generateTexture(textureKey, 64, 64);
                console.log(`使用程序生成的${type}敌机纹理`);
            }
        });
        
        // 通用敌机纹理（兼容性）
        if (!this.textures.exists('enemy-basic-sprite')) {
            graphics.clear();
            graphics.fillStyle(0xff0000);
            graphics.fillRect(8, 8, 48, 48); // 在64x64画布中居中的方块
            graphics.generateTexture('enemy', 64, 64);
        }
        
        // 检查并设置子弹纹理
        if (!this.textures.exists('bullet-sprite')) {
            // 子弹（黄色矩形）
            graphics.clear();
            graphics.fillStyle(0xffff00);
            graphics.fillRect(0, 0, 4, 10);
            graphics.generateTexture('bullet', 4, 10);
            console.log('使用程序生成的玩家子弹纹理');
        }
        
        if (!this.textures.exists('enemy-bullet-sprite')) {
            // 敌机子弹（紫色圆形）
            graphics.clear();
            graphics.fillStyle(0xff00ff);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('enemyBullet', 8, 8);
            console.log('使用程序生成的敌机子弹纹理');
        }
        
        // 检查并设置道具纹理
        const powerupTypes = [
            { type: 'weapon', color: 0xffff00, name: '武器升级' },
            { type: 'shield', color: 0x00ffff, name: '护盾' },
            { type: 'life', color: 0xff00ff, name: '生命值' },
            { type: 'bomb', color: 0xff4444, name: '清屏炸弹' },
            { type: 'missile', color: 0x00ff00, name: '追踪导弹' },
            { type: 'score', color: 0xffd700, name: '分数奖励' }
        ];
        
        powerupTypes.forEach(({ type, color, name }) => {
            const spriteKey = `powerup-${type}-sprite`;
            const textureKey = `powerup-${type}`;
            
            if (this.textures.exists(spriteKey)) {
                console.log(`使用${name}道具贴图`);
                // 贴图存在，无需生成程序纹理
            } else {
                // 道具（对应颜色的方块）- 程序生成备用
                graphics.clear();
                graphics.fillStyle(color);
                graphics.fillRect(0, 0, 30, 30);
                // 添加白色边框
                graphics.lineStyle(2, 0xffffff, 1);
                graphics.strokeRect(0, 0, 30, 30);
                graphics.generateTexture(textureKey, 30, 30);
                console.log(`使用程序生成的${name}道具纹理`);
            }
        });
        
        // 检查并设置导弹纹理
        if (!this.textures.exists('missile-sprite')) {
            // 导弹（绿色菱形）
            graphics.clear();
            graphics.fillStyle(0x00ff00);
            graphics.fillTriangle(4, 0, 0, 8, 8, 8);
            graphics.fillRect(2, 8, 4, 8);
            graphics.generateTexture('missile', 8, 16);
            console.log('使用程序生成的导弹纹理');
        }
        
        // 检查并设置粒子纹理
        if (!this.textures.exists('particle-sprite')) {
            // 爆炸粒子
            graphics.clear();
            graphics.fillStyle(0xff6600);
            graphics.fillCircle(2, 2, 2);
            graphics.generateTexture('particle', 4, 4);
            console.log('使用程序生成的粒子纹理');
        }
        
        // 星星粒子
        graphics.clear();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(1, 1, 1);
        graphics.generateTexture('star', 2, 2);
        
        graphics.destroy();
        
        console.log('游戏资源创建完成');
    }
} 