# 数学雷电 Phaser.js 游戏设计文档

## 1. 项目结构

```
math-raiden-phaser/
├── index.html              # 游戏入口
├── assets/                 # 游戏资源
│   ├── images/            # 图片资源
│   │   ├── player.png
│   │   ├── enemy.png
│   │   ├── bullets.png
│   │   ├── powerups.png
│   │   └── effects.png
│   ├── audio/             # 音效资源
│   │   ├── shoot.mp3
│   │   ├── explosion.mp3
│   │   └── powerup.mp3
│   └── fonts/             # 字体资源
├── src/                   # 源代码
│   ├── main.js           # 游戏入口
│   ├── config/           # 配置文件
│   │   └── GameConfig.js
│   ├── scenes/           # 场景
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   └── GameOverScene.js
│   ├── objects/          # 游戏对象
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   ├── Bullet.js
│   │   ├── Missile.js
│   │   └── PowerUp.js
│   ├── systems/          # 游戏系统
│   │   ├── MathSystem.js
│   │   ├── WeaponSystem.js
│   │   └── EffectSystem.js
│   ├── ui/               # UI组件
│   │   ├── HUD.js
│   │   ├── MathModal.js
│   │   └── PauseMenu.js
│   └── utils/            # 工具类
│       └── Constants.js
└── package.json          # 项目配置

```

## 2. 场景设计

### 2.1 BootScene（启动场景）
- 初始化游戏配置
- 设置响应式缩放

### 2.2 PreloadScene（预加载场景）
- 加载所有游戏资源
- 显示加载进度条

### 2.3 MenuScene（主菜单场景）
- 游戏标题动画
- 难度选择
- 开始按钮
- 操作说明

### 2.4 GameScene（游戏场景）
- 游戏主逻辑
- 物理系统
- 碰撞检测
- 暂停功能

### 2.5 GameOverScene（游戏结束场景）
- 显示最终得分
- 游戏统计
- 成就系统
- 重新开始/返回菜单

## 3. 游戏对象设计

### 3.1 Player（玩家类）
```javascript
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // 基础属性
        this.scene = scene;
        this.lives = 3;
        this.shield = 0;
        this.weaponLevel = 1;
        this.missiles = 0;
        this.invulnerable = 0;
        this.speed = 300;
        
        // 输入控制
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // 自动射击定时器
        this.shootTimer = scene.time.addEvent({
            delay: 200,
            callback: this.shoot,
            callbackScope: this,
            loop: true
        });
        
        // 导弹发射定时器
        this.missileTimer = scene.time.addEvent({
            delay: 1000,
            callback: this.fireMissile,
            callbackScope: this,
            loop: true,
            paused: true
        });
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setSize(30, 30);
    }
    
    update() {
        // 移动控制
        this.handleMovement();
        
        // 更新无敌状态
        this.updateInvulnerability();
        
        // 更新导弹发射
        this.updateMissileSystem();
    }
    
    handleMovement() {
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.cursors.left.isDown) velocityX = -this.speed;
        if (this.cursors.right.isDown) velocityX = this.speed;
        if (this.cursors.up.isDown) velocityY = -this.speed;
        if (this.cursors.down.isDown) velocityY = this.speed;
        
        this.setVelocity(velocityX, velocityY);
    }
    
    updateInvulnerability() {
        if (this.invulnerable > 0) {
            this.invulnerable--;
            // 闪烁效果
            this.setAlpha(Math.floor(this.invulnerable / 5) % 2 ? 0.5 : 1);
        } else {
            this.setAlpha(1);
        }
    }
    
    updateMissileSystem() {
        if (this.missiles > 0 && this.missileTimer.paused) {
            this.missileTimer.paused = false;
        } else if (this.missiles <= 0 && !this.missileTimer.paused) {
            this.missileTimer.paused = true;
        }
    }
    
    shoot() {
        if (!this.scene || !this.active) return;
        
        // 根据武器等级发射不同模式的子弹
        switch(this.weaponLevel) {
            case 1:
                this.scene.createPlayerBullet(this.x, this.y - 20);
                break;
            case 2:
                this.scene.createPlayerBullet(this.x - 10, this.y - 20);
                this.scene.createPlayerBullet(this.x + 10, this.y - 20);
                break;
            case 3:
            default:
                this.scene.createPlayerBullet(this.x, this.y - 20);
                this.scene.createPlayerBullet(this.x - 15, this.y - 20, -0.2);
                this.scene.createPlayerBullet(this.x + 15, this.y - 20, 0.2);
                break;
        }
    }
    
    fireMissile() {
        if (this.missiles > 0) {
            this.scene.createMissile(this.x, this.y - 20);
            this.missiles--;
        }
    }
    
    takeDamage() {
        if (this.invulnerable > 0) return;
        
        if (this.shield > 0) {
            this.shield--;
            this.invulnerable = 60; // 1秒无敌
        } else {
            this.lives--;
            this.invulnerable = 120; // 2秒无敌
            
            if (this.lives <= 0) {
                this.scene.gameOver();
            }
        }
        
        // 受伤特效
        this.scene.cameras.main.shake(100, 0.01);
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < 3) {
            this.weaponLevel++;
            return true;
        }
        return false;
    }
    
    addShield(amount = 15) {
        this.shield = Math.min(this.shield + amount, 25);
    }
    
    addLife() {
        this.lives = Math.min(this.lives + 1, 5);
    }
    
    addMissiles(amount = 50) {
        this.missiles = Math.min(this.missiles + amount, 100);
    }
}
```

### 3.2 Enemy（敌机类）
```javascript
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'basic') {
        super(scene, x, y, 'enemy');
        
        this.scene = scene;
        this.enemyType = type;
        this.hp = 1;
        this.speed = 2 + Math.random() * 2;
        this.shootTimer = 0;
        this.shootInterval = 60 + Math.random() * 60; // 1-2秒射击间隔
        
        // 根据类型设置属性
        this.setupByType(type);
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setVelocityY(this.speed * 60); // 转换为像素/秒
        this.setSize(35, 35);
        
        // 出界自动销毁
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }
    
    setupByType(type) {
        switch(type) {
            case 'fast':
                this.speed = 4 + Math.random() * 2;
                this.hp = 1;
                this.setTint(0xff6600);
                break;
            case 'tank':
                this.speed = 1 + Math.random();
                this.hp = 3;
                this.setTint(0x666666);
                this.setScale(1.2);
                break;
            case 'shooter':
                this.speed = 2;
                this.hp = 2;
                this.shootInterval = 30; // 更频繁射击
                this.setTint(0x9900ff);
                break;
            default: // basic
                break;
        }
    }
    
    update() {
        // 射击逻辑
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
        
        // 特殊移动模式（可扩展）
        this.updateMovement();
    }
    
    updateMovement() {
        // 基础类型直线下降，可在子类中重写
        if (this.enemyType === 'fast') {
            // 快速敌机可能有轻微摆动
            this.x += Math.sin(this.y * 0.01) * 0.5;
        }
    }
    
    shoot() {
        if (!this.scene || !this.active) return;
        
        // 向玩家方向射击
        const player = this.scene.player;
        if (player && player.active) {
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                player.x, player.y
            );
            
            this.scene.createEnemyBullet(
                this.x, 
                this.y + this.height / 2,
                angle
            );
        }
    }
    
    takeDamage(damage = 1) {
        this.hp -= damage;
        
        // 受伤闪烁
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                this.clearTint();
                this.setupByType(this.enemyType); // 恢复原色调
            }
        });
        
        if (this.hp <= 0) {
            this.destroy();
            return true; // 返回true表示敌机被摧毁
        }
        return false;
    }
    
    destroy() {
        // 创建爆炸效果
        this.scene.createExplosion(this.x, this.y);
        
        // 掉落道具
        this.scene.dropRandomPowerup(this.x, this.y);
        
        // 增加分数
        this.scene.addScore(10);
        
        super.destroy();
    }
}
```

### 3.3 Bullet（子弹类）
```javascript
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, isPlayer = true) {
        super(scene, x, y, texture);
        
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.speed = isPlayer ? 600 : 300;
        this.damage = 1;
        this.angle = 0;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(4, 8);
        
        // 出界自动销毁
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }
    
    fire(x, y, angle = 0) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.angle = angle;
        
        // 设置速度
        const velocityX = Math.sin(angle) * this.speed;
        const velocityY = -this.speed * Math.cos(angle);
        this.setVelocity(velocityX, velocityY);
        
        // 设置旋转
        this.setRotation(angle);
    }
    
    hit() {
        // 子弹击中目标时的处理
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);
    }
}
```

### 3.4 Missile（导弹类）
```javascript
class Missile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'missile');
        
        this.scene = scene;
        this.speed = 400;
        this.damage = 3;
        this.target = null;
        this.trail = [];
        this.maxTrailLength = 10;
        this.turnSpeed = 0.1;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(6, 14);
        
        // 粒子尾迹
        this.trailEmitter = scene.add.particles(0, 0, 'particle', {
            follow: this,
            scale: { start: 0.3, end: 0 },
            speed: { min: 20, max: 50 },
            lifespan: 300,
            blendMode: 'ADD',
            tint: 0xff6600
        });
    }
    
    fire(x, y) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        
        // 寻找最近的敌人作为目标
        this.findTarget();
        
        // 初始向上飞行
        this.setVelocity(0, -this.speed);
    }
    
    findTarget() {
        const enemies = this.scene.enemies.children.entries;
        if (enemies.length === 0) return;
        
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                enemy.x, enemy.y
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        this.target = nearestEnemy;
    }
    
    update() {
        if (!this.active) return;
        
        // 如果目标不存在或已被摧毁，重新寻找目标
        if (!this.target || !this.target.active) {
            this.findTarget();
        }
        
        // 追踪目标
        if (this.target && this.target.active) {
            this.trackTarget();
        }
        
        // 检查是否离开屏幕
        if (this.y < -50) {
            this.destroy();
        }
    }
    
    trackTarget() {
        const targetAngle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );
        
        const currentAngle = this.rotation;
        let angleDiff = targetAngle - currentAngle;
        
        // 标准化角度差
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 平滑转向
        const newAngle = currentAngle + angleDiff * this.turnSpeed;
        this.setRotation(newAngle);
        
        // 设置速度
        const velocityX = Math.cos(newAngle) * this.speed;
        const velocityY = Math.sin(newAngle) * this.speed;
        this.setVelocity(velocityX, velocityY);
    }
    
    hit() {
        // 导弹击中目标
        this.scene.createExplosion(this.x, this.y, 'large');
        this.destroy();
    }
    
    destroy() {
        if (this.trailEmitter) {
            this.trailEmitter.destroy();
        }
        super.destroy();
    }
}
```

### 3.5 PowerUp（道具类）
```javascript
class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, 'powerup');
        
        this.scene = scene;
        this.powerType = type;
        this.speed = 90; // 下降速度
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.05;
        this.glowRadius = 20;
        
        // 根据类型设置外观
        this.setupByType(type);
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setVelocityY(this.speed);
        this.setSize(25, 25);
        
        // 浮动动画
        this.floatTween = scene.tweens.add({
            targets: this,
            y: y + 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 发光效果
        this.glowTween = scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 出界自动销毁
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }
    
    setupByType(type) {
        const POWERUP_CONFIG = {
            WEAPON: { color: 0xffff00, icon: '⚡', name: '武器升级' },
            SHIELD: { color: 0x00ffff, icon: '🛡️', name: '护盾' },
            LIFE: { color: 0xff00ff, icon: '❤️', name: '生命值' },
            BOMB: { color: 0xff4444, icon: '💥', name: '清屏炸弹' },
            MISSILE: { color: 0x00ff00, icon: '🚀', name: '追踪导弹' },
            SCORE: { color: 0xffd700, icon: '⭐', name: '分数奖励' }
        };
        
        const config = POWERUP_CONFIG[type];
        if (config) {
            this.setTint(config.color);
            this.powerName = config.name;
            this.powerIcon = config.icon;
        }
    }
    
    collect() {
        // 道具被拾取时触发数学题
        this.scene.showMathQuestion(this.powerType);
        
        // 拾取特效
        this.scene.createCollectEffect(this.x, this.y);
        
        this.destroy();
    }
    
    destroy() {
        if (this.floatTween) this.floatTween.destroy();
        if (this.glowTween) this.glowTween.destroy();
        super.destroy();
    }
}
```

### 3.6 Explosion（爆炸效果类）
```javascript
class Explosion extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size = 'normal') {
        super(scene, x, y);
        
        this.scene = scene;
        this.explosionSize = size;
        
        // 创建爆炸动画
        this.createExplosionEffect();
        
        scene.add.existing(this);
        
        // 自动销毁
        scene.time.delayedCall(500, () => this.destroy());
    }
    
    createExplosionEffect() {
        const config = {
            normal: { scale: 1, particles: 20, speed: 150 },
            large: { scale: 1.5, particles: 30, speed: 200 },
            small: { scale: 0.7, particles: 15, speed: 100 }
        };
        
        const explosionConfig = config[this.explosionSize] || config.normal;
        
        // 粒子爆炸效果
        const particles = this.scene.add.particles(0, 0, 'particle', {
            speed: { min: explosionConfig.speed * 0.5, max: explosionConfig.speed },
            scale: { start: explosionConfig.scale, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            quantity: explosionConfig.particles,
            tint: [0xff6600, 0xff0000, 0xffff00]
        });
        
        this.add(particles);
        
        // 冲击波效果
        const shockwave = this.scene.add.circle(0, 0, 5, 0xffffff, 0.8);
        this.add(shockwave);
        
        this.scene.tweens.add({
            targets: shockwave,
            radius: 50 * explosionConfig.scale,
            alpha: 0,
            duration: 300,
            ease: 'Power2'
        });
    }
}
```

## 4. 系统设计

### 4.1 数学题系统（MathSystem）
```javascript
class MathSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentQuestion = null;
        this.gradeLevel = 1;
        this.questionTypes = {
            1: 'addition_subtraction_10',
            2: 'addition_subtraction_20', 
            3: 'multiplication'
        };
    }
    
    generateQuestion(grade) {
        this.gradeLevel = grade;
        
        switch(grade) {
            case 1: // G1: 10以内加减法
                return this.generateBasicMath(10);
            case 2: // G2: 20以内加减法
                return this.generateBasicMath(20);
            case 3: // G3: 乘法运算
                return this.generateMultiplication();
            default:
                return this.generateBasicMath(10);
        }
    }
    
    generateBasicMath(maxNumber) {
        const a = Math.floor(Math.random() * maxNumber) + 1;
        const b = Math.floor(Math.random() * maxNumber) + 1;
        
        if (Math.random() < 0.5) {
            // 加法
            return {
                question: `${a} + ${b} = ?`,
                answer: a + b,
                type: 'addition'
            };
        } else {
            // 减法（确保结果为正数）
            const max = Math.max(a, b);
            const min = Math.min(a, b);
            return {
                question: `${max} - ${min} = ?`,
                answer: max - min,
                type: 'subtraction'
            };
        }
    }
    
    generateMultiplication() {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        
        return {
            question: `${a} × ${b} = ?`,
            answer: a * b,
            type: 'multiplication'
        };
    }
    
    showQuestion(powerType) {
        this.currentQuestion = this.generateQuestion(this.gradeLevel);
        this.currentPowerType = powerType;
        
        // 暂停游戏
        this.scene.physics.pause();
        this.scene.scene.pause();
        
        // 显示数学题UI
        this.scene.scene.launch('MathQuestionScene', {
            question: this.currentQuestion,
            powerType: powerType,
            callback: this.handleAnswer.bind(this)
        });
    }
    
    handleAnswer(userAnswer, isCorrect) {
        // 恢复游戏
        this.scene.physics.resume();
        this.scene.scene.resume();
        
        if (isCorrect) {
            this.applyCorrectReward();
        } else {
            this.applyIncorrectReward();
        }
        
        this.currentQuestion = null;
        this.currentPowerType = null;
    }
    
    applyCorrectReward() {
        const player = this.scene.player;
        let rewardMessage = '';
        
        switch(this.currentPowerType) {
            case 'WEAPON':
                if (player.upgradeWeapon()) {
                    rewardMessage = '武器升级！飞机修复完成！';
                } else {
                    rewardMessage = '武器已满级！获得200分修复奖励！';
                    this.scene.addScore(200);
                }
                break;
                
            case 'SHIELD':
                player.addShield(15);
                rewardMessage = '护盾强化！获得护盾+15！';
                break;
                
            case 'LIFE':
                player.addLife();
                rewardMessage = '生命值恢复！+1生命！';
                break;
                
            case 'BOMB':
                this.scene.clearAllEnemies();
                rewardMessage = '紧急清屏！所有敌机被消灭！';
                break;
                
            case 'MISSILE':
                player.addMissiles(50);
                rewardMessage = '导弹补给！获得追踪导弹+50！';
                break;
                
            case 'SCORE':
                this.scene.addScore(500);
                rewardMessage = '分数奖励！获得500分！';
                break;
        }
        
        // 额外奖励
        this.scene.addScore(100);
        player.invulnerable = 180; // 3秒无敌时间
        
        this.scene.showRewardMessage(rewardMessage, true);
    }
    
    applyIncorrectReward() {
        const player = this.scene.player;
        player.invulnerable = 60; // 1秒保护时间
        
        this.scene.showRewardMessage('修复未完成，但获得1秒保护时间', false);
    }
}
```

### 4.2 武器系统（WeaponSystem）
```javascript
class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.bulletPools = {
            player: null,
            enemy: null
        };
        this.missilePool = null;
        
        this.initializePools();
    }
    
    initializePools() {
        // 玩家子弹对象池
        this.bulletPools.player = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 50,
            runChildUpdate: true
        });
        
        // 敌机子弹对象池
        this.bulletPools.enemy = this.scene.physics.add.group({
            classType: Bullet,
            maxSize: 100,
            runChildUpdate: true
        });
        
        // 导弹对象池
        this.missilePool = this.scene.physics.add.group({
            classType: Missile,
            maxSize: 20,
            runChildUpdate: true
        });
    }
    
    createPlayerBullet(x, y, angle = 0) {
        const bullet = this.bulletPools.player.getFirstDead(false);
        
        if (bullet) {
            bullet.fire(x, y, angle);
        } else {
            // 如果池中没有可用子弹，创建新的
            const newBullet = new Bullet(this.scene, x, y, 'bullet', true);
            this.bulletPools.player.add(newBullet);
            newBullet.fire(x, y, angle);
        }
    }
    
    createEnemyBullet(x, y, angle = 0) {
        const bullet = this.bulletPools.enemy.getFirstDead(false);
        
        if (bullet) {
            bullet.fire(x, y, angle);
        } else {
            const newBullet = new Bullet(this.scene, x, y, 'enemyBullet', false);
            this.bulletPools.enemy.add(newBullet);
            newBullet.fire(x, y, angle);
        }
    }
    
    createMissile(x, y) {
        const missile = this.missilePool.getFirstDead(false);
        
        if (missile) {
            missile.fire(x, y);
        } else {
            const newMissile = new Missile(this.scene, x, y);
            this.missilePool.add(newMissile);
            newMissile.fire(x, y);
        }
    }
    
    getPlayerBullets() {
        return this.bulletPools.player;
    }
    
    getEnemyBullets() {
        return this.bulletPools.enemy;
    }
    
    getMissiles() {
        return this.missilePool;
    }
    
    clearAllBullets() {
        this.bulletPools.player.children.entries.forEach(bullet => {
            if (bullet.active) bullet.hit();
        });
        
        this.bulletPools.enemy.children.entries.forEach(bullet => {
            if (bullet.active) bullet.hit();
        });
    }
}
```

### 4.3 特效系统（EffectSystem）
```javascript
class EffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.explosionPool = [];
        this.particleEmitters = {};
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        // 爆炸粒子发射器
        this.particleEmitters.explosion = this.scene.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            emitting: false
        });
        
        // 道具拾取特效
        this.particleEmitters.collect = this.scene.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            tint: 0x00ff00,
            lifespan: 500,
            emitting: false
        });
        
        // 星空背景粒子
        this.particleEmitters.stars = this.scene.add.particles(0, -10, 'particle', {
            x: { min: 0, max: this.scene.game.config.width },
            speedY: { min: 20, max: 100 },
            scale: { min: 0.1, max: 0.3 },
            alpha: { min: 0.3, max: 0.8 },
            lifespan: 8000,
            frequency: 100,
            tint: 0xffffff
        });
    }
    
    createExplosion(x, y, size = 'normal') {
        // 使用对象池或直接创建
        const explosion = new Explosion(this.scene, x, y, size);
        
        // 粒子爆炸
        this.particleEmitters.explosion.setPosition(x, y);
        this.particleEmitters.explosion.explode(20);
        
        // 屏幕震动
        this.scene.cameras.main.shake(200, 0.01);
        
        return explosion;
    }
    
    createCollectEffect(x, y) {
        this.particleEmitters.collect.setPosition(x, y);
        this.particleEmitters.collect.explode(15);
        
        // 收集音效
        this.scene.sound.play('collect', { volume: 0.3 });
    }
    
    createShieldEffect(player) {
        // 护盾光环效果
        const shield = this.scene.add.circle(player.x, player.y, 35, 0x00ffff, 0);
        shield.setStrokeStyle(2, 0x00ffff, 0.8);
        
        // 跟随玩家
        this.scene.tweens.add({
            targets: shield,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            repeat: -1
        });
        
        return shield;
    }
    
    createInvulnerabilityEffect(player) {
        // 无敌状态光环
        const glow = this.scene.add.circle(player.x, player.y, 40, 0xffff00, 0);
        glow.setStrokeStyle(3, 0xffff00, 0.6);
        
        this.scene.tweens.add({
            targets: glow,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0,
            duration: 300,
            repeat: -1
        });
        
        return glow;
    }
    
    createMuzzleFlash(x, y) {
        // 枪口火花效果
        const flash = this.scene.add.circle(x, y, 8, 0xffff00, 0.8);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }
    
    createHitEffect(x, y) {
        // 击中特效
        const hit = this.scene.add.circle(x, y, 5, 0xff0000, 0.8);
        
        this.scene.tweens.add({
            targets: hit,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 150,
            onComplete: () => hit.destroy()
        });
    }
    
    createPowerUpGlow(powerup) {
        // 道具发光效果
        const glow = this.scene.add.circle(0, 0, 25, powerup.powerType === 'WEAPON' ? 0xffff00 : 0x00ffff, 0);
        glow.setStrokeStyle(2, 0xffffff, 0.6);
        
        powerup.add(glow);
        
        this.scene.tweens.add({
            targets: glow,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        return glow;
    }
}
```

### 4.4 敌机生成系统（EnemySpawner）
```javascript
class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.spawnTimer = 0;
        this.spawnInterval = 120; // 2秒
        this.difficultyLevel = 1;
        this.waveSystem = {
            currentWave: 1,
            enemiesInWave: 0,
            maxEnemiesPerWave: 10
        };
        
        this.enemyTypes = ['basic', 'fast', 'tank', 'shooter'];
        this.spawnWeights = {
            basic: 0.5,
            fast: 0.3,
            tank: 0.1,
            shooter: 0.1
        };
    }
    
    update() {
        this.spawnTimer++;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
            
            // 动态调整难度
            this.adjustDifficulty();
        }
    }
    
    spawnEnemy() {
        const x = Math.random() * (this.scene.game.config.width - 40);
        const y = -40;
        
        const enemyType = this.selectEnemyType();
        const enemy = new Enemy(this.scene, x, y, enemyType);
        
        this.scene.enemies.add(enemy);
        this.waveSystem.enemiesInWave++;
        
        // 检查是否需要开始新波次
        if (this.waveSystem.enemiesInWave >= this.waveSystem.maxEnemiesPerWave) {
            this.startNewWave();
        }
    }
    
    selectEnemyType() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const [type, weight] of Object.entries(this.spawnWeights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return type;
            }
        }
        
        return 'basic';
    }
    
    adjustDifficulty() {
        // 根据游戏时间和分数调整难度
        const gameTime = this.scene.time.now - this.scene.gameStartTime;
        const minutes = Math.floor(gameTime / 60000);
        
        // 每分钟增加难度
        this.difficultyLevel = Math.min(1 + minutes * 0.2, 3);
        
        // 调整生成间隔
        this.spawnInterval = Math.max(60, 120 - minutes * 10);
        
        // 调整敌机类型权重
        if (minutes >= 1) {
            this.spawnWeights.fast = 0.4;
            this.spawnWeights.tank = 0.15;
            this.spawnWeights.shooter = 0.15;
        }
        
        if (minutes >= 3) {
            this.spawnWeights.basic = 0.3;
            this.spawnWeights.tank = 0.25;
            this.spawnWeights.shooter = 0.25;
        }
    }
    
    startNewWave() {
        this.waveSystem.currentWave++;
        this.waveSystem.enemiesInWave = 0;
        this.waveSystem.maxEnemiesPerWave += 2; // 每波增加2个敌机
        
        // 波次开始提示
        this.scene.showWaveMessage(`第 ${this.waveSystem.currentWave} 波`);
    }
    
    clearAllEnemies() {
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                enemy.destroy();
            }
        });
    }
}
```

## 5. 物理和碰撞

### 5.1 碰撞组
- 玩家 vs 敌机子弹
- 玩家子弹 vs 敌机
- 玩家 vs 道具
- 导弹 vs 敌机

### 5.2 物理设置
- 使用Arcade物理引擎
- 设置世界边界
- 重力设置为0（太空环境）

## 6. UI设计

### 6.1 HUD（抬头显示）
```javascript
class HUD extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        
        this.scene = scene;
        this.createHUDElements();
        
        scene.add.existing(this);
    }
    
    createHUDElements() {
        // 左上角信息
        this.livesText = this.scene.add.text(10, 10, '生命: 3', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.scoreText = this.scene.add.text(10, 35, '分数: 0', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.shieldText = this.scene.add.text(10, 60, '护盾: 0', {
            fontSize: '18px',
            color: '#00ffff',
            fontFamily: 'Arial'
        });
        
        this.missilesText = this.scene.add.text(10, 85, '导弹: 0', {
            fontSize: '18px',
            color: '#00ff00',
            fontFamily: 'Arial'
        });
        
        // 右上角信息
        this.weaponText = this.scene.add.text(450, 10, '武器: Lv1', {
            fontSize: '18px',
            color: '#ffff00',
            fontFamily: 'Arial'
        });
        
        this.gradeText = this.scene.add.text(450, 35, '难度: G1', {
            fontSize: '18px',
            color: '#ff6600',
            fontFamily: 'Arial'
        });
        
        // 暂停提示
        this.pauseHint = this.scene.add.text(10, 750, '按 P 暂停', {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'Arial'
        });
        
        // 生命值图标
        this.livesIcons = [];
        this.updateLivesDisplay(3);
        
        // 添加所有元素到容器
        this.add([
            this.livesText, this.scoreText, this.shieldText, this.missilesText,
            this.weaponText, this.gradeText, this.pauseHint
        ]);
    }
    
    updateLivesDisplay(lives) {
        // 清除旧的生命值图标
        this.livesIcons.forEach(icon => icon.destroy());
        this.livesIcons = [];
        
        // 创建新的生命值图标
        for (let i = 0; i < lives; i++) {
            const heart = this.scene.add.text(150 + i * 25, 10, '❤️', {
                fontSize: '16px'
            });
            this.livesIcons.push(heart);
            this.add(heart);
        }
    }
    
    updateHUD(gameState) {
        this.livesText.setText(`生命: ${gameState.lives}`);
        this.scoreText.setText(`分数: ${gameState.score}`);
        this.shieldText.setText(`护盾: ${gameState.shield}`);
        this.missilesText.setText(`导弹: ${gameState.missiles}`);
        this.weaponText.setText(`武器: Lv${gameState.weaponLevel}`);
        this.gradeText.setText(`难度: G${gameState.gradeLevel}`);
        
        this.updateLivesDisplay(gameState.lives);
        
        // 护盾文本颜色变化
        if (gameState.shield > 0) {
            this.shieldText.setColor('#00ffff');
        } else {
            this.shieldText.setColor('#666666');
        }
        
        // 导弹文本颜色变化
        if (gameState.missiles > 0) {
            this.missilesText.setColor('#00ff00');
        } else {
            this.missilesText.setColor('#666666');
        }
    }
}
```

### 6.2 数学题模态框（MathQuestionScene）
```javascript
class MathQuestionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MathQuestionScene' });
    }
    
    init(data) {
        this.question = data.question;
        this.powerType = data.powerType;
        this.callback = data.callback;
    }
    
    create() {
        // 半透明背景
        this.add.rectangle(300, 400, 600, 800, 0x000000, 0.8);
        
        // 模态框背景
        const modalBg = this.add.rectangle(300, 400, 400, 300, 0x000000, 0.9);
        modalBg.setStrokeStyle(3, 0xff6600);
        
        // 标题
        this.add.text(300, 320, '道具激活！', {
            fontSize: '24px',
            color: '#ff6600',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 提示文本
        this.add.text(300, 350, '解答数学题获得道具奖励', {
            fontSize: '16px',
            color: '#ff6600',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 题目显示
        this.questionText = this.add.text(300, 400, this.question.question, {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 创建输入框（使用DOM元素）
        this.inputElement = this.add.dom(300, 450).createFromHTML(`
            <input type="number" id="mathInput" style="
                font-size: 20px; 
                width: 100px; 
                text-align: center;
                background: #222;
                color: #fff;
                border: 2px solid #ff6600;
                border-radius: 5px;
                padding: 10px;
            ">
        `);
        
        // 提交按钮
        const submitButton = this.add.rectangle(300, 500, 120, 40, 0xff6600);
        const submitText = this.add.text(300, 500, '确定', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        submitButton.setInteractive({ useHandCursor: true });
        submitButton.on('pointerover', () => submitButton.setFillStyle(0xff8800));
        submitButton.on('pointerout', () => submitButton.setFillStyle(0xff6600));
        submitButton.on('pointerdown', () => this.submitAnswer());
        
        // 提示文本
        this.add.text(300, 540, '答对获得强化奖励，答错获得基础奖励', {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 键盘事件
        this.input.keyboard.on('keydown-ENTER', () => this.submitAnswer());
        
        // 自动聚焦输入框
        this.time.delayedCall(100, () => {
            const input = document.getElementById('mathInput');
            if (input) input.focus();
        });
    }
    
    submitAnswer() {
        const input = document.getElementById('mathInput');
        const userAnswer = parseInt(input.value);
        
        if (isNaN(userAnswer)) return;
        
        const isCorrect = userAnswer === this.question.answer;
        
        // 关闭场景
        this.scene.stop();
        
        // 调用回调函数
        if (this.callback) {
            this.callback(userAnswer, isCorrect);
        }
    }
}
```

### 6.3 暂停菜单（PauseOverlay）
```javascript
class PauseOverlay extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 300, 400);
        
        this.scene = scene;
        this.createPauseMenu();
        
        scene.add.existing(this);
        this.setVisible(false);
    }
    
    createPauseMenu() {
        // 半透明背景
        const bg = this.scene.add.rectangle(0, 0, 600, 800, 0x000000, 0.8);
        this.add(bg);
        
        // 暂停标题
        const title = this.scene.add.text(0, -100, '游戏暂停', {
            fontSize: '48px',
            color: '#00ff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 添加发光效果
        this.scene.tweens.add({
            targets: title,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        this.add(title);
        
        // 继续游戏提示
        const continueText = this.scene.add.text(0, -20, '按 P 键继续游戏', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add(continueText);
        
        // 操作提示
        const controlsText = this.scene.add.text(0, 50, [
            '游戏操作：',
            '方向键 - 移动飞机',
            '自动射击 - 无需操作',
            '拾取道具 - 触发数学题',
            '1-3键 - 切换数学难度'
        ], {
            fontSize: '16px',
            color: '#cccccc',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        this.add(controlsText);
        
        // 返回主菜单按钮
        const menuButton = this.scene.add.rectangle(0, 150, 200, 50, 0x333333);
        const menuText = this.scene.add.text(0, 150, '返回主菜单', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0x555555);
        });
        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0x333333);
        });
        menuButton.on('pointerdown', () => {
            this.scene.scene.start('MenuScene');
        });
        
        this.add([menuButton, menuText]);
    }
    
    show() {
        this.setVisible(true);
        
        // 淡入动画
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }
    
    hide() {
        // 淡出动画
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.setVisible(false);
                this.setAlpha(1);
            }
        });
    }
}
```

### 6.4 奖励消息显示（RewardMessage）
```javascript
class RewardMessage extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 300, 300);
        
        this.scene = scene;
        scene.add.existing(this);
        this.setVisible(false);
    }
    
    showMessage(message, isSuccess = true) {
        // 清除之前的内容
        this.removeAll(true);
        
        // 背景
        const bg = this.scene.add.rectangle(0, 0, 400, 100, 0x000000, 0.8);
        bg.setStrokeStyle(2, isSuccess ? 0x00ff00 : 0xff6600);
        this.add(bg);
        
        // 消息文本
        const text = this.scene.add.text(0, 0, message, {
            fontSize: '20px',
            color: isSuccess ? '#00ff00' : '#ff6600',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: 350 }
        }).setOrigin(0.5);
        
        this.add(text);
        
        // 显示动画
        this.setVisible(true);
        this.setAlpha(0);
        this.setScale(0.5);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // 自动隐藏
        this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.setVisible(false);
                }
            });
        });
    }
}
```

### 6.5 波次提示（WaveMessage）
```javascript
class WaveMessage extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 300, 400);
        
        this.scene = scene;
        scene.add.existing(this);
        this.setVisible(false);
    }
    
    showWave(waveNumber) {
        // 清除之前的内容
        this.removeAll(true);
        
        // 波次文本
        const waveText = this.scene.add.text(0, 0, `第 ${waveNumber} 波`, {
            fontSize: '48px',
            color: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.add(waveText);
        
        // 显示动画
        this.setVisible(true);
        this.setAlpha(0);
        this.setScale(2);
        
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // 停留1秒后淡出
                this.scene.time.delayedCall(1000, () => {
                    this.scene.tweens.add({
                        targets: this,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            this.setVisible(false);
                        }
                    });
                });
            }
        });
    }
}
```

## 7. 动画和补间

### 7.1 精灵动画
- 玩家飞机动画
- 敌机动画
- 爆炸序列帧

### 7.2 补间动画
- 道具浮动效果
- UI元素淡入淡出
- 标题发光效果

## 8. 音效设计

- 背景音乐
- 射击音效
- 爆炸音效
- 道具拾取音效
- UI交互音效

## 9. 数据管理

### 9.1 游戏状态管理（GameState）
```javascript
class GameState {
    constructor() {
        this.reset();
        this.achievements = new Set();
        this.statistics = {
            totalGamesPlayed: 0,
            totalEnemiesDefeated: 0,
            totalMathQuestions: 0,
            correctAnswers: 0,
            highestScore: 0,
            longestSurvival: 0
        };
        
        this.loadFromStorage();
    }
    
    reset() {
        this.score = 0;
        this.lives = 3;
        this.shield = 0;
        this.weaponLevel = 1;
        this.gradeLevel = 1;
        this.missiles = 0;
        this.enemiesDefeated = 0;
        this.survivalTime = 0;
        this.startTime = Date.now();
        this.maxWeaponLevel = 1;
        this.invulnerable = 0;
        this.paused = false;
        this.gameOver = false;
    }
    
    addScore(points) {
        this.score += points;
        this.checkScoreAchievements();
    }
    
    defeatEnemy() {
        this.enemiesDefeated++;
        this.statistics.totalEnemiesDefeated++;
        this.checkEnemyAchievements();
    }
    
    answerMathQuestion(isCorrect) {
        this.statistics.totalMathQuestions++;
        if (isCorrect) {
            this.statistics.correctAnswers++;
        }
        this.checkMathAchievements();
    }
    
    updateSurvivalTime() {
        this.survivalTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.checkSurvivalAchievements();
    }
    
    checkScoreAchievements() {
        if (this.score >= 5000 && !this.achievements.has('legendary_pilot')) {
            this.achievements.add('legendary_pilot');
            this.triggerAchievement('🏆 传奇飞行员！', '达到5000分');
        } else if (this.score >= 2000 && !this.achievements.has('ace_pilot')) {
            this.achievements.add('ace_pilot');
            this.triggerAchievement('⭐ 王牌飞行员！', '达到2000分');
        } else if (this.score >= 1000 && !this.achievements.has('elite_pilot')) {
            this.achievements.add('elite_pilot');
            this.triggerAchievement('🎖️ 精英飞行员！', '达到1000分');
        }
    }
    
    checkEnemyAchievements() {
        if (this.enemiesDefeated >= 50 && !this.achievements.has('enemy_hunter')) {
            this.achievements.add('enemy_hunter');
            this.triggerAchievement('💥 敌机杀手！', '击败50架敌机');
        }
    }
    
    checkSurvivalAchievements() {
        if (this.survivalTime >= 300 && !this.achievements.has('survivor')) {
            this.achievements.add('survivor');
            this.triggerAchievement('⏰ 长久生存者！', '生存5分钟');
        }
    }
    
    checkMathAchievements() {
        const accuracy = this.statistics.correctAnswers / this.statistics.totalMathQuestions;
        if (this.statistics.totalMathQuestions >= 20 && accuracy >= 0.9 && !this.achievements.has('math_genius')) {
            this.achievements.add('math_genius');
            this.triggerAchievement('🧮 数学天才！', '90%答题正确率');
        }
    }
    
    triggerAchievement(title, description) {
        // 触发成就通知
        if (this.onAchievement) {
            this.onAchievement(title, description);
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.updateStatistics();
        this.saveToStorage();
    }
    
    updateStatistics() {
        this.statistics.totalGamesPlayed++;
        this.statistics.highestScore = Math.max(this.statistics.highestScore, this.score);
        this.statistics.longestSurvival = Math.max(this.statistics.longestSurvival, this.survivalTime);
    }
    
    saveToStorage() {
        const saveData = {
            statistics: this.statistics,
            achievements: Array.from(this.achievements),
            settings: {
                gradeLevel: this.gradeLevel
            }
        };
        
        localStorage.setItem('mathRaidenSave', JSON.stringify(saveData));
    }
    
    loadFromStorage() {
        const saveData = localStorage.getItem('mathRaidenSave');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.statistics = { ...this.statistics, ...data.statistics };
                this.achievements = new Set(data.achievements || []);
                if (data.settings) {
                    this.gradeLevel = data.settings.gradeLevel || 1;
                }
            } catch (e) {
                console.warn('Failed to load save data:', e);
            }
        }
    }
    
    getGameSummary() {
        return {
            score: this.score,
            enemiesDefeated: this.enemiesDefeated,
            survivalTime: this.survivalTime,
            maxWeaponLevel: this.maxWeaponLevel,
            gradeLevel: this.gradeLevel,
            achievements: this.getNewAchievements()
        };
    }
    
    getNewAchievements() {
        // 返回本局游戏获得的新成就
        return Array.from(this.achievements).filter(achievement => {
            // 这里可以添加逻辑来判断哪些是新获得的成就
            return true;
        });
    }
}
```

### 9.2 常量定义（Constants）
```javascript
// src/utils/Constants.js
export const GAME_CONFIG = {
    WIDTH: 600,
    HEIGHT: 800,
    FPS: 60
};

export const PLAYER_CONFIG = {
    SPEED: 300,
    MAX_LIVES: 5,
    MAX_SHIELD: 25,
    MAX_MISSILES: 100,
    MAX_WEAPON_LEVEL: 3,
    INVULNERABLE_TIME: {
        SHIELD_HIT: 60,  // 1秒
        LIFE_HIT: 120,   // 2秒
        CORRECT_ANSWER: 180  // 3秒
    }
};

export const ENEMY_CONFIG = {
    TYPES: {
        BASIC: {
            hp: 1,
            speed: 2,
            shootInterval: 60,
            score: 10,
            color: 0xff0000
        },
        FAST: {
            hp: 1,
            speed: 4,
            shootInterval: 45,
            score: 15,
            color: 0xff6600
        },
        TANK: {
            hp: 3,
            speed: 1,
            shootInterval: 90,
            score: 25,
            color: 0x666666
        },
        SHOOTER: {
            hp: 2,
            speed: 2,
            shootInterval: 30,
            score: 20,
            color: 0x9900ff
        }
    },
    SPAWN_WEIGHTS: {
        BASIC: 0.5,
        FAST: 0.3,
        TANK: 0.1,
        SHOOTER: 0.1
    }
};

export const POWERUP_CONFIG = {
    TYPES: {
        WEAPON: { 
            color: 0xffff00, 
            name: '武器升级', 
            icon: '⚡',
            dropRate: 0.2
        },
        SHIELD: { 
            color: 0x00ffff, 
            name: '护盾', 
            icon: '🛡️',
            dropRate: 0.2
        },
        LIFE: { 
            color: 0xff00ff, 
            name: '生命值', 
            icon: '❤️',
            dropRate: 0.15
        },
        BOMB: { 
            color: 0xff4444, 
            name: '清屏炸弹', 
            icon: '💥',
            dropRate: 0.1
        },
        MISSILE: { 
            color: 0x00ff00, 
            name: '追踪导弹', 
            icon: '🚀',
            dropRate: 0.2
        },
        SCORE: { 
            color: 0xffd700, 
            name: '分数奖励', 
            icon: '⭐',
            dropRate: 0.15
        }
    },
    DROP_CHANCE: 0.3,  // 30%概率掉落道具
    SPEED: 90,
    GLOW_RADIUS: 20
};

export const WEAPON_CONFIG = {
    BULLET_SPEED: 600,
    ENEMY_BULLET_SPEED: 300,
    MISSILE_SPEED: 400,
    MISSILE_TURN_SPEED: 0.1,
    SHOOT_INTERVALS: {
        PLAYER: 200,    // 毫秒
        MISSILE: 1000   // 毫秒
    }
};

export const MATH_CONFIG = {
    GRADES: {
        1: {
            name: 'G1 - 10以内加减法',
            maxNumber: 10,
            operations: ['addition', 'subtraction']
        },
        2: {
            name: 'G2 - 20以内加减法',
            maxNumber: 20,
            operations: ['addition', 'subtraction']
        },
        3: {
            name: 'G3 - 乘法运算',
            maxNumber: 10,
            operations: ['multiplication']
        }
    },
    REWARDS: {
        CORRECT: {
            score: 100,
            invulnerableTime: 180
        },
        INCORRECT: {
            invulnerableTime: 60
        }
    }
};

export const AUDIO_CONFIG = {
    VOLUME: {
        MASTER: 0.7,
        SFX: 0.5,
        MUSIC: 0.3
    },
    SOUNDS: {
        SHOOT: 'shoot',
        EXPLOSION: 'explosion',
        POWERUP: 'powerup',
        HIT: 'hit',
        MISSILE: 'missile',
        CORRECT: 'correct',
        INCORRECT: 'incorrect'
    }
};

export const ACHIEVEMENT_CONFIG = {
    SCORE_MILESTONES: [1000, 2000, 5000, 10000],
    ENEMY_MILESTONES: [10, 25, 50, 100],
    SURVIVAL_MILESTONES: [60, 180, 300, 600], // 秒
    MATH_ACCURACY_THRESHOLD: 0.9,
    MIN_QUESTIONS_FOR_ACCURACY: 20
};

export const DIFFICULTY_CONFIG = {
    SPAWN_INTERVAL_BASE: 120,  // 基础生成间隔（帧）
    SPAWN_INTERVAL_MIN: 60,    // 最小生成间隔
    DIFFICULTY_INCREASE_RATE: 10,  // 每分钟减少的间隔
    WAVE_SIZE_INCREASE: 2,     // 每波增加的敌机数量
    MAX_DIFFICULTY_MINUTES: 5  // 最大难度时间
};

export const UI_CONFIG = {
    COLORS: {
        PRIMARY: '#00ff00',
        SECONDARY: '#ff6600',
        WARNING: '#ff0000',
        INFO: '#00ffff',
        TEXT: '#ffffff',
        DISABLED: '#666666'
    },
    FONTS: {
        PRIMARY: 'Arial',
        SIZE: {
            SMALL: '14px',
            NORMAL: '18px',
            LARGE: '24px',
            TITLE: '48px'
        }
    },
    ANIMATION: {
        FADE_DURATION: 300,
        SCALE_DURATION: 500,
        BOUNCE_DURATION: 200
    }
};
```

### 9.3 本地存储管理（StorageManager）
```javascript
class StorageManager {
    constructor() {
        this.storageKey = 'mathRaidenData';
        this.defaultData = {
            highScore: 0,
            totalGamesPlayed: 0,
            achievements: [],
            settings: {
                volume: 0.7,
                difficulty: 1,
                controls: 'keyboard'
            },
            statistics: {
                totalPlayTime: 0,
                totalEnemiesDefeated: 0,
                totalMathQuestions: 0,
                correctAnswers: 0
            }
        };
    }
    
    save(data) {
        try {
            const saveData = {
                ...this.defaultData,
                ...data,
                lastSaved: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return { ...this.defaultData, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        return this.defaultData;
    }
    
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }
    
    updateHighScore(score) {
        const data = this.load();
        if (score > data.highScore) {
            data.highScore = score;
            this.save(data);
            return true; // 新纪录
        }
        return false;
    }
    
    addAchievement(achievementId) {
        const data = this.load();
        if (!data.achievements.includes(achievementId)) {
            data.achievements.push(achievementId);
            this.save(data);
            return true; // 新成就
        }
        return false;
    }
    
    updateSettings(newSettings) {
        const data = this.load();
        data.settings = { ...data.settings, ...newSettings };
        this.save(data);
    }
    
    updateStatistics(stats) {
        const data = this.load();
        data.statistics = { ...data.statistics, ...stats };
        this.save(data);
    }
    
    exportData() {
        const data = this.load();
        return JSON.stringify(data, null, 2);
    }
    
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.save(data);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}
```

## 10. 性能优化

- 对象池（子弹、敌机）
- 纹理图集
- 视锥剔除
- 事件优化

## 11. 响应式设计

- 自适应画布大小
- 触摸控制支持
- 移动设备优化

## 12. 扩展功能

- 更多敌机类型
- Boss战
- 连击系统
- 排行榜
- 成就系统 