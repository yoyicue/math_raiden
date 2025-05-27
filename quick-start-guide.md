# Phaser版数学雷电快速开始指南

## 1. 快速搭建项目

### 步骤1：创建项目
```bash
# 进入项目目录
cd math_raiden

# 初始化项目
npm init -y

# 安装依赖
npm install phaser
npm install --save-dev vite
```

### 步骤2：创建项目结构
```bash
# 创建目录结构
mkdir -p src/{scenes,objects,systems,ui,utils}
mkdir -p assets/{images,audio}

# 创建入口文件
touch index.html
touch src/main.js
touch vite.config.js
```

### 步骤3：配置文件

**vite.config.js**
```javascript
export default {
    base: './',
    server: {
        port: 3000
    },
    build: {
        assetsInlineLimit: 0
    }
}
```

**package.json** (添加脚本)
```json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    }
}
```

## 2. 基础代码模板

### index.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数学雷电 - Phaser版</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #000;
        }
        #game-container {
            border: 2px solid #333;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### src/main.js
```javascript
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 800,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
```

### src/scenes/BootScene.js
```javascript
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 加载加载界面需要的资源
    }

    create() {
        // 初始化游戏设置
        this.scene.start('PreloadScene');
    }
}
```

### src/scenes/PreloadScene.js
```javascript
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 创建加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(150, 370, 300, 50);

        const loadingText = this.make.text({
            x: 300,
            y: 350,
            text: '加载中...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // 监听加载进度
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(160, 380, 280 * value, 30);
        });

        // 动态创建游戏资源
        this.createGameAssets();
    }

    create() {
        this.scene.start('MenuScene');
    }

    createGameAssets() {
        // 创建玩家飞机纹理
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
        
        graphics.destroy();
    }
}
```

### src/scenes/MenuScene.js
```javascript
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 背景
        this.add.rectangle(300, 400, 600, 800, 0x000428);
        
        // 标题
        const title = this.add.text(300, 200, '数学雷电', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        
        // 标题发光动画
        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 副标题
        this.add.text(300, 280, '边玩边学，提升数学技能', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // 难度选择
        this.selectedGrade = 1;
        this.createDifficultyButtons();
        
        // 开始按钮
        const startButton = this.add.rectangle(300, 500, 200, 60, 0x00ff00);
        const startText = this.add.text(300, 500, '开始游戏', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x00cc00);
        });
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x00ff00);
        });
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene', { gradeLevel: this.selectedGrade });
        });
        
        // 操作说明
        this.add.text(300, 700, '方向键移动 | 自动射击 | P键暂停', {
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);
    }
    
    createDifficultyButtons() {
        const difficulties = [
            { grade: 1, text: 'G1 - 10以内加减', y: 350 },
            { grade: 2, text: 'G2 - 20以内加减', y: 390 },
            { grade: 3, text: 'G3 - 乘法运算', y: 430 }
        ];
        
        this.diffButtons = [];
        
        difficulties.forEach(diff => {
            const button = this.add.rectangle(300, diff.y, 250, 35, 0x333333);
            const text = this.add.text(300, diff.y, diff.text, {
                fontSize: '18px',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            button.setInteractive({ useHandCursor: true });
            button.on('pointerdown', () => {
                this.selectedGrade = diff.grade;
                this.updateDifficultyButtons();
            });
            
            this.diffButtons.push({ button, text, grade: diff.grade });
        });
        
        this.updateDifficultyButtons();
    }
    
    updateDifficultyButtons() {
        this.diffButtons.forEach(item => {
            if (item.grade === this.selectedGrade) {
                item.button.setFillStyle(0xff6600);
                item.text.setColor('#ffffff');
            } else {
                item.button.setFillStyle(0x333333);
                item.text.setColor('#888888');
            }
        });
    }
}
```

### src/objects/Player.js (示例游戏对象)
```javascript
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        
        // 玩家属性
        this.lives = 3;
        this.shield = 0;
        this.weaponLevel = 1;
        this.invulnerable = 0;
        this.missiles = 0;
        
        // 输入控制
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // 自动射击定时器
        this.shootTimer = scene.time.addEvent({
            delay: 200,
            callback: this.shoot,
            callbackScope: this,
            loop: true
        });
    }
    
    update() {
        // 移动控制
        if (this.cursors.left.isDown) {
            this.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(300);
        } else {
            this.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown) {
            this.setVelocityY(-300);
        } else if (this.cursors.down.isDown) {
            this.setVelocityY(300);
        } else {
            this.setVelocityY(0);
        }
        
        // 更新无敌时间
        if (this.invulnerable > 0) {
            this.invulnerable--;
            this.setAlpha(Math.floor(this.invulnerable / 5) % 2 ? 0.5 : 1);
        } else {
            this.setAlpha(1);
        }
    }
    
    shoot() {
        if (!this.scene || !this.active) return;
        
        // 根据武器等级发射不同的子弹
        if (this.weaponLevel === 1) {
            this.scene.createPlayerBullet(this.x, this.y - 20);
        } else if (this.weaponLevel === 2) {
            this.scene.createPlayerBullet(this.x - 10, this.y - 20);
            this.scene.createPlayerBullet(this.x + 10, this.y - 20);
        } else if (this.weaponLevel >= 3) {
            this.scene.createPlayerBullet(this.x, this.y - 20);
            this.scene.createPlayerBullet(this.x - 15, this.y - 20, -0.2);
            this.scene.createPlayerBullet(this.x + 15, this.y - 20, 0.2);
        }
    }
    
    takeDamage() {
        if (this.invulnerable > 0) return;
        
        if (this.shield > 0) {
            this.shield--;
            this.invulnerable = 60;
        } else {
            this.lives--;
            this.invulnerable = 120;
            
            if (this.lives <= 0) {
                this.scene.gameOver();
            }
        }
    }
}
```

## 3. 运行项目

```bash
# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:3000
```

## 4. 下一步开发建议

1. **完成基础场景**
   - 实现GameScene的游戏主循环
   - 添加敌机生成和移动逻辑
   - 实现碰撞检测

2. **添加游戏系统**
   - 实现数学题系统（MathSystem）
   - 添加道具系统（PowerupSystem）
   - 实现武器升级系统

3. **优化和美化**
   - 添加粒子特效
   - 实现音效系统
   - 优化性能（对象池等）

4. **测试和部署**
   - 在不同设备上测试
   - 优化移动端体验
   - 部署到服务器

## 5. 有用的Phaser资源

- [Phaser 3 官方文档](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 示例](https://phaser.io/examples)
- [Phaser 3 教程](https://phaser.io/tutorials)
- [Phaser 3 插件](https://phaserplugins.com/)

## 6. 常见问题解决

### Q: 如何添加音效？
```javascript
// 在PreloadScene中加载
this.load.audio('shoot', 'assets/audio/shoot.mp3');

// 在GameScene中播放
this.sound.play('shoot', { volume: 0.5 });
```

### Q: 如何保存游戏数据？
```javascript
// 保存
localStorage.setItem('highScore', score);

// 读取
const highScore = localStorage.getItem('highScore') || 0;
```

### Q: 如何添加触摸控制？
```javascript
// 添加虚拟按钮
const leftButton = this.add.rectangle(50, 700, 80, 80, 0x444444, 0.5);
leftButton.setInteractive();
leftButton.on('pointerdown', () => this.player.setVelocityX(-300));
leftButton.on('pointerup', () => this.player.setVelocityX(0));
``` 