# Phaser.js 实现方案

## 1. 技术栈选择

- **Phaser 3.70+**: 最新稳定版本
- **ES6 模块化**: 使用现代JavaScript语法
- **Webpack/Vite**: 构建工具（推荐Vite，更快的开发体验）
- **TypeScript**（可选）: 类型安全

## 2. 核心功能迁移方案

### 2.1 游戏状态管理
**原实现**: 使用全局对象和状态枚举
```javascript
// 原代码
const GAME_STATES = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};
```

**Phaser实现**: 使用场景系统
```javascript
// Phaser场景管理
this.scene.start('MenuScene');
this.scene.switch('GameScene');
this.scene.launch('GameOverScene');
```

### 2.2 玩家控制
**原实现**: 监听键盘事件，手动更新位置
```javascript
// 原代码
if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= player.speed;
}
```

**Phaser实现**: 使用内置输入系统
```javascript
// Phaser输入系统
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        this.cursors = scene.input.keyboard.createCursorKeys();
    }
    
    update() {
        if (this.cursors.left.isDown) {
            this.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(200);
        } else {
            this.setVelocityX(0);
        }
    }
}
```

### 2.3 碰撞检测
**原实现**: 手动AABB碰撞检测
```javascript
// 原代码
if (bullet.x < enemy.x + enemy.width &&
    bullet.x + bullet.width > enemy.x &&
    bullet.y < enemy.y + enemy.height &&
    bullet.y + bullet.height > enemy.y) {
    // 碰撞处理
}
```

**Phaser实现**: 使用物理引擎
```javascript
// Phaser碰撞系统
this.physics.add.collider(
    this.playerBullets,
    this.enemies,
    this.bulletHitEnemy,
    null,
    this
);
```

### 2.4 数学题系统
**原实现**: DOM模态框
**Phaser实现**: 使用Phaser的DOM元素或自定义UI

```javascript
class MathModal extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // 背景
        this.bg = scene.add.rectangle(0, 0, 400, 300, 0x000000, 0.9);
        this.add(this.bg);
        
        // 题目文本
        this.questionText = scene.add.text(0, -50, '', {
            fontSize: '28px',
            color: '#ffffff'
        });
        this.add(this.questionText);
        
        // 输入框（使用DOM元素）
        this.inputElement = scene.add.dom(0, 0).createFromHTML(
            '<input type="number" style="font-size: 20px; width: 100px;">'
        );
        this.add(this.inputElement);
    }
}
```

### 2.5 特效系统
**原实现**: Canvas绘制
**Phaser实现**: 粒子系统和动画

```javascript
// 爆炸效果
createExplosion(x, y) {
    // 使用粒子发射器
    const particles = this.add.particles(x, y, 'spark', {
        speed: { min: 100, max: 300 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 300
    });
    
    // 或使用精灵动画
    const explosion = this.add.sprite(x, y, 'explosion');
    explosion.play('explode');
    explosion.on('animationcomplete', () => explosion.destroy());
}
```

### 2.6 道具系统
**原实现**: 自定义绘制和浮动效果
**Phaser实现**: 使用补间动画

```javascript
class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, 'powerup', type);
        
        // 浮动动画
        scene.tweens.add({
            targets: this,
            y: y + 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 发光效果
        this.setGlow(0xffff00, 4);
    }
}
```

### 2.7 UI系统
**原实现**: DOM元素
**Phaser实现**: 游戏内UI

```javascript
class HUD extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        
        // 分数显示
        this.scoreText = scene.add.text(10, 10, 'Score: 0', {
            fontSize: '20px',
            color: '#ffffff'
        });
        
        // 生命值显示（使用图标）
        this.livesGroup = scene.add.group();
        this.updateLives(3);
        
        scene.add.existing(this);
    }
    
    updateLives(lives) {
        this.livesGroup.clear(true, true);
        for (let i = 0; i < lives; i++) {
            const heart = this.scene.add.image(100 + i * 30, 20, 'heart');
            this.livesGroup.add(heart);
        }
    }
}
```

## 3. 资源管理

### 3.1 精灵图集
创建纹理图集以优化性能：
```json
{
    "frames": {
        "player": { "frame": { "x": 0, "y": 0, "w": 40, "h": 40 } },
        "enemy": { "frame": { "x": 40, "y": 0, "w": 40, "h": 40 } },
        "bullet": { "frame": { "x": 80, "y": 0, "w": 4, "h": 10 } }
    }
}
```

### 3.2 动态资源生成
对于简单图形，可以在运行时生成：
```javascript
// 在PreloadScene中
create() {
    // 创建简单的三角形玩家
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x00ff00);
    graphics.fillTriangle(20, 0, 0, 40, 40, 40);
    graphics.generateTexture('player', 40, 40);
    
    // 创建圆形子弹
    graphics.clear();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('bullet', 8, 8);
}
```

## 4. 性能优化策略

### 4.1 对象池
```javascript
class BulletPool extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);
        
        this.createMultiple({
            classType: Bullet,
            frameQuantity: 30,
            active: false,
            visible: false,
            key: 'bullet'
        });
    }
    
    fireBullet(x, y) {
        const bullet = this.getFirstDead(false);
        if (bullet) {
            bullet.fire(x, y);
        }
    }
}
```

### 4.2 视锥剔除
```javascript
// 自动剔除屏幕外的对象
this.enemies.children.entries.forEach(enemy => {
    if (enemy.y > this.game.config.height + 50) {
        enemy.destroy();
    }
});
```

## 5. 移动端适配

### 5.1 响应式设计
```javascript
// GameConfig.js
export default {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 600,
        height: 800
    }
};
```

### 5.2 触摸控制
```javascript
// 添加虚拟摇杆
this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
    x: 100,
    y: 700,
    radius: 50,
    base: this.add.circle(0, 0, 50, 0x888888),
    thumb: this.add.circle(0, 0, 25, 0xcccccc)
});
```

## 6. 项目启动步骤

1. **初始化项目**
```bash
npm create vite@latest math-raiden-phaser -- --template vanilla
cd math-raiden-phaser
npm install phaser
```

2. **项目结构**
```bash
mkdir -p src/{scenes,objects,systems,ui,utils,config}
mkdir -p assets/{images,audio,fonts}
```

3. **配置Vite**
```javascript
// vite.config.js
export default {
    base: './',
    build: {
        assetsInlineLimit: 0
    }
}
```

## 7. 迁移时间表

1. **第一阶段**（2天）
   - 搭建项目框架
   - 实现基础场景切换
   - 创建玩家和基础移动

2. **第二阶段**（3天）
   - 实现敌机系统
   - 添加碰撞检测
   - 实现武器系统

3. **第三阶段**（2天）
   - 实现道具系统
   - 添加数学题功能
   - UI系统完善

4. **第四阶段**（2天）
   - 添加特效和动画
   - 性能优化
   - 移动端适配

5. **第五阶段**（1天）
   - 测试和调试
   - 打包部署 