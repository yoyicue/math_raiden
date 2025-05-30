import { PLAYER_CONFIG, WEAPON_CONFIG } from '../utils/Constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // 根据是否有贴图选择合适的纹理
        const textureKey = Player.getTextureKey(scene);
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        
        // 基础属性
        this.lives = PLAYER_CONFIG.MAX_LIVES;
        this.shield = 20;               // 给玩家一些初始护盾
        this.weaponLevel = 1;
        this.missiles = 10;             // 给玩家一些初始导弹
        this.invulnerable = 0;
        this.speed = PLAYER_CONFIG.SPEED;
        
        // 输入控制
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasdKeys = scene.input.keyboard.addKeys('W,S,A,D');
        
        // 触摸控制支持
        this.touchControls = null;
        
        // 输入平滑处理
        this.targetVelocity = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        this.inputSmoothing = PLAYER_CONFIG.MOVEMENT.INPUT_SMOOTHING;
        this.acceleration = PLAYER_CONFIG.MOVEMENT.ACCELERATION;
        this.maxSpeed = PLAYER_CONFIG.SPEED;
        
        // 射击定时器
        this.lastShot = 0;
        this.lastMissile = 0;
        this.shootInterval = WEAPON_CONFIG.SHOOT_INTERVALS.PLAYER;
        this.missileInterval = WEAPON_CONFIG.SHOOT_INTERVALS.MISSILE;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setSize(40, 40);
        this.setDrag(PLAYER_CONFIG.MOVEMENT.DRAG);
        this.setMaxVelocity(this.maxSpeed, this.maxSpeed);
        
        // 设置自定义移动边界（考虑移动端UI）
        this.setupMovementBounds();
        
        // 设置玩家外观（仅在使用程序生成纹理时）
        if (!this.texture.key.includes('-sprite')) {
            this.setTint(0x00ff00);
        }
        
        // 护盾效果对象
        this.shieldEffect = null;
        this.invulnerabilityEffect = null;
        
        // 创建护盾效果
        this.createShieldEffect();
    }
    
    // 静态方法：获取玩家纹理键
    static getTextureKey(scene) {
        // 优先使用贴图，如果不存在则使用程序生成的纹理
        if (scene.textures.exists('player-sprite')) {
            return 'player-sprite';
        } else {
            return 'player';
        }
    }
    
    setupMovementBounds() {
        // 获取游戏尺寸
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 检测是否为移动设备
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
        
        // 计算安全边界
        const sideMargin = 10; // 左右边距保持较小
        const topMargin = 10; // 顶部边距
        
        // 底部边距 - 统一使用最小边距，不避让摇杆
        const bottomMargin = 15; // 只保留基本的边距，防止完全贴边
        
        // 设置自定义边界
        this.movementBounds = {
            left: sideMargin,
            right: gameWidth - sideMargin,
            top: topMargin,
            bottom: gameHeight - bottomMargin
        };
        
        console.log('Player movement bounds:', this.movementBounds, 'isMobile:', isMobile);
    }
    
    update() {
        if (!this.active) return;
        
        // 处理移动
        this.handleMovement();
        
        // 更新无敌状态
        this.updateInvulnerability();
        
        // 自动射击
        this.handleShooting();
        
        // 自动发射导弹
        this.handleMissiles();
        
        // 更新护盾效果
        this.updateShieldEffect();
    }
    
    handleMovement() {
        let inputX = 0;
        let inputY = 0;
        let isKeyboardInput = false;
        
        // 触摸控制优先
        if (this.touchControls && this.touchControls.isActive) {
            const touchInput = this.touchControls.getInput();
            if (touchInput.isActive) {
                inputX = touchInput.x;
                inputY = touchInput.y;
                isKeyboardInput = false;
            }
        } else {
            // 键盘控制作为备选
            if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
                inputX = -1;
            }
            if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
                inputX = 1;
            }
            if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
                inputY = -1;
            }
            if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
                inputY = 1;
            }
            
            // 对角线移动归一化（仅键盘控制需要）
            if (inputX !== 0 && inputY !== 0) {
                const magnitude = Math.sqrt(inputX * inputX + inputY * inputY);
                inputX /= magnitude;
                inputY /= magnitude;
            }
            
            isKeyboardInput = (inputX !== 0 || inputY !== 0);
        }
        
        // 根据输入类型使用不同的处理方式
        if (isKeyboardInput) {
            // 键盘输入：直接响应，无平滑处理
            this.handleKeyboardMovement(inputX, inputY);
        } else {
            // 触摸输入：使用平滑处理
            this.handleTouchMovement(inputX, inputY);
        }
        
        // 应用自定义边界限制
        this.applyMovementBounds();
    }
    
    handleKeyboardMovement(inputX, inputY) {
        // 键盘输入直接设置速度，提供即时响应
        const targetVelocityX = inputX * this.maxSpeed;
        const targetVelocityY = inputY * this.maxSpeed;
        
        // 直接设置速度，无平滑处理
        this.setVelocity(targetVelocityX, targetVelocityY);
        
        // 更新内部速度状态以保持一致性
        this.currentVelocity.x = targetVelocityX;
        this.currentVelocity.y = targetVelocityY;
        this.targetVelocity.x = targetVelocityX;
        this.targetVelocity.y = targetVelocityY;
        
        // 清除加速度，因为我们直接设置速度
        this.setAcceleration(0, 0);
    }
    
    handleTouchMovement(inputX, inputY) {
        // 计算目标速度
        this.targetVelocity.x = inputX * this.maxSpeed;
        this.targetVelocity.y = inputY * this.maxSpeed;
        
        // 输入平滑处理 - 使用插值让当前速度逐渐接近目标速度
        this.currentVelocity.x = Phaser.Math.Linear(
            this.currentVelocity.x,
            this.targetVelocity.x,
            this.inputSmoothing
        );
        this.currentVelocity.y = Phaser.Math.Linear(
            this.currentVelocity.y,
            this.targetVelocity.y,
            this.inputSmoothing
        );
        
        // 应用加速度而不是直接设置速度
        if (Math.abs(this.currentVelocity.x) > 0.1 || Math.abs(this.currentVelocity.y) > 0.1) {
            // 计算加速度方向
            const accelX = Math.sign(this.currentVelocity.x) * this.acceleration;
            const accelY = Math.sign(this.currentVelocity.y) * this.acceleration;
            
            // 应用加速度
            this.setAcceleration(accelX, accelY);
            
            // 当接近目标速度时，直接设置速度以避免超调
            const velocityDiffX = Math.abs(this.body.velocity.x - this.currentVelocity.x);
            const velocityDiffY = Math.abs(this.body.velocity.y - this.currentVelocity.y);
            
            if (velocityDiffX < PLAYER_CONFIG.MOVEMENT.VELOCITY_THRESHOLD) {
                this.setVelocityX(this.currentVelocity.x);
            }
            if (velocityDiffY < PLAYER_CONFIG.MOVEMENT.VELOCITY_THRESHOLD) {
                this.setVelocityY(this.currentVelocity.y);
            }
        } else {
            // 没有输入时，停止加速并让阻力自然减速
            this.setAcceleration(0, 0);
            
            // 当速度很小时直接停止，避免滑行太久
            if (Math.abs(this.body.velocity.x) < PLAYER_CONFIG.MOVEMENT.STOP_THRESHOLD && 
                Math.abs(this.body.velocity.y) < PLAYER_CONFIG.MOVEMENT.STOP_THRESHOLD) {
                this.setVelocity(0, 0);
                this.currentVelocity.x = 0;
                this.currentVelocity.y = 0;
            }
        }
    }
    
    applyMovementBounds() {
        if (!this.movementBounds) return;
        
        // 限制玩家位置在安全边界内
        const currentX = this.x;
        const currentY = this.y;
        
        let newX = Phaser.Math.Clamp(currentX, this.movementBounds.left, this.movementBounds.right);
        let newY = Phaser.Math.Clamp(currentY, this.movementBounds.top, this.movementBounds.bottom);
        
        // 如果位置被限制，更新玩家位置并停止相应方向的速度
        if (newX !== currentX || newY !== currentY) {
            this.setPosition(newX, newY);
            
            // 如果撞到边界，停止相应方向的速度
            if (newX !== currentX) {
                this.setVelocityX(0);
            }
            if (newY !== currentY) {
                this.setVelocityY(0);
            }
        }
    }
    
    handleShooting() {
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastShot > this.shootInterval) {
            this.shoot();
            this.lastShot = currentTime;
        }
    }
    
    handleMissiles() {
        if (this.missiles <= 0) return;
        
        // 检查屏幕上是否有敌机
        if (!this.hasEnemiesOnScreen()) return;
        
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastMissile > this.missileInterval) {
            this.fireMissile();
            this.lastMissile = currentTime;
        }
    }
    
    // 检查屏幕上是否有敌机
    hasEnemiesOnScreen() {
        if (!this.scene.enemies || !this.scene.enemies.children) return false;
        
        // 检查是否有活跃且在攻击范围内的敌机
        const attackRange = WEAPON_CONFIG.MISSILE_TARGET_RANGE; // 使用导弹的目标搜索范围
        
        const enemiesInRange = this.scene.enemies.children.entries.filter(enemy => {
            if (!enemy || !enemy.active || !enemy.visible) return false;
            
            // 计算与玩家的距离
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y, enemy.x, enemy.y
            );
            
            return distance <= attackRange;
        });
        
        return enemiesInRange.length > 0;
    }
    
    shoot() {
        if (!this.scene || !this.active) return;
        
        // 使用BulletManager的新方法根据武器等级发射子弹
        if (this.scene.bulletManager && this.scene.bulletManager.firePlayerBulletsByLevel) {
            this.scene.bulletManager.firePlayerBulletsByLevel(this.x, this.y - 20, this.weaponLevel);
        } else {
            // 兼容性回退：使用原有的射击逻辑
            switch(this.weaponLevel) {
                case 1:
                    // 单发子弹
                    this.scene.bulletManager.firePlayerBullet(this.x, this.y - 20);
                    break;
                    
                case 2:
                    // 双发子弹，增加发散角度
                    this.scene.bulletManager.firePlayerBullet(this.x - 10, this.y - 20, -0.2);
                    this.scene.bulletManager.firePlayerBullet(this.x + 10, this.y - 20, 0.2);
                    break;
                    
                case 3:
                default:
                    // 三发散射子弹，更大发散角度
                    this.scene.bulletManager.firePlayerBullet(this.x, this.y - 20, 0);
                    this.scene.bulletManager.firePlayerBullet(this.x - 5, this.y - 20, -0.4);
                    this.scene.bulletManager.firePlayerBullet(this.x + 5, this.y - 20, 0.4);
                    break;
            }
        }
        
        // 枪口火花效果
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createMuzzleFlash(this.x, this.y - 20);
        }
    }
    
    fireMissile() {
        if (this.missiles <= 0) return;
        
        // 创建追踪导弹
        this.scene.createMissile(this.x, this.y - 20);
        this.missiles--;
        
        // 导弹发射音效（如果存在）
        if (this.scene.sound.get('missile')) {
            this.scene.sound.play('missile', { volume: 0.3 });
        }
    }
    
    takeDamage() {
        if (this.invulnerable > 0) return; // 无敌状态中不受伤
        
        if (this.shield > 0) {
            // 护盾吸收伤害
            this.shield--;
            this.invulnerable = PLAYER_CONFIG.INVULNERABLE_TIME.SHIELD_HIT;
            
            // 护盾受击特效
            if (this.scene.effectSystem) {
                this.scene.effectSystem.createShieldHitEffect(this.x, this.y);
            }
        } else {
            // 生命值减少
            this.lives--;
            this.invulnerable = PLAYER_CONFIG.INVULNERABLE_TIME.LIFE_HIT;
            
            // 受伤特效
            if (this.scene.effectSystem) {
                this.scene.effectSystem.createHitEffect(this.x, this.y);
            }
            this.scene.cameras.main.shake(200, 0.02);
            
            if (this.lives <= 0) {
                this.destroyPlayer();
                return;
            }
        }
        
        // 播放受伤音效（如果存在）
        if (this.scene.sound.get('hit')) {
            this.scene.sound.play('hit', { volume: 0.4 });
        }
    }
    
    updateInvulnerability() {
        if (this.invulnerable > 0) {
            this.invulnerable--;
            
            // 无敌状态闪烁效果
            this.setAlpha(Math.floor(this.invulnerable / 5) % 2 ? 0.5 : 1);
            
            // 显示无敌光环
            if (!this.invulnerabilityEffect && this.scene.effectSystem) {
                this.invulnerabilityEffect = this.scene.effectSystem.createInvulnerabilityEffect(this);
            }
        } else {
            this.setAlpha(1);
            
            // 移除无敌光环
            if (this.invulnerabilityEffect) {
                this.invulnerabilityEffect.destroy();
                this.invulnerabilityEffect = null;
            }
        }
    }
    
    createShieldEffect() {
        // 创建护盾视觉效果（初始不可见）
        this.shieldEffect = this.scene.add.circle(this.x, this.y, 35, 0x00ffff, 0);
        this.shieldEffect.setStrokeStyle(2, 0x00ffff, 0.8);
        this.shieldEffect.setVisible(false);
    }
    
    updateShieldEffect() {
        if (!this.shieldEffect) return;
        
        // 更新护盾位置
        this.shieldEffect.setPosition(this.x, this.y);
        
        // 根据护盾值显示/隐藏护盾效果
        if (this.shield > 0) {
            this.shieldEffect.setVisible(true);
            
            // 护盾强度影响透明度
            const alpha = Math.min(this.shield / PLAYER_CONFIG.MAX_SHIELD, 1) * 0.8;
            this.shieldEffect.setStrokeStyle(2, 0x00ffff, alpha);
            
            // 护盾脉冲动画
            if (!this.shieldEffect.getData('pulsing')) {
                this.shieldEffect.setData('pulsing', true);
                this.scene.tweens.add({
                    targets: this.shieldEffect,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        } else {
            this.shieldEffect.setVisible(false);
            this.shieldEffect.setData('pulsing', false);
            this.scene.tweens.killTweensOf(this.shieldEffect);
            this.shieldEffect.setScale(1);
        }
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < PLAYER_CONFIG.MAX_WEAPON_LEVEL) {
            this.weaponLevel++;
            
            // 武器升级特效
            if (this.scene.effectSystem) {
                this.scene.effectSystem.createUpgradeEffect(this.x, this.y);
            }
            if (this.scene.sound.get('powerup')) {
                this.scene.sound.play('powerup', { volume: 0.5 });
            }
            
            return true;
        }
        return false;
    }
    
    addShield(amount = 15) {
        this.shield = Math.min(this.shield + amount, PLAYER_CONFIG.MAX_SHIELD);
        
        // 护盾恢复特效
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createShieldRestoreEffect(this.x, this.y);
        }
    }
    
    addLife() {
        if (this.lives < PLAYER_CONFIG.MAX_LIVES) {
            this.lives++;
            
            // 生命恢复特效
            if (this.scene.effectSystem) {
                this.scene.effectSystem.createLifeRestoreEffect(this.x, this.y);
            }
            return true;
        }
        return false;
    }
    
    addMissiles(amount = 50) {
        this.missiles = Math.min(this.missiles + amount, PLAYER_CONFIG.MAX_MISSILES);
        
        // 导弹补给特效
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createMissileRestoreEffect(this.x, this.y);
        }
    }
    
    setInvulnerable(time) {
        this.invulnerable = Math.max(this.invulnerable, time);
    }
    
    destroyPlayer() {
        if (!this.active) return;
        
        // 玩家死亡爆炸效果
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createExplosion(this.x, this.y, 'large');
        }
        
        // 清理效果
        if (this.shieldEffect) {
            this.shieldEffect.destroy();
            this.shieldEffect = null;
        }
        
        if (this.invulnerabilityEffect) {
            this.invulnerabilityEffect.destroy();
            this.invulnerabilityEffect = null;
        }
        
        // 触发游戏结束
        this.scene.gameOver();
        
        // 隐藏玩家
        this.setVisible(false);
        this.setActive(false);
    }
    
    reset(x, y) {
        // 重置玩家状态
        this.setPosition(x, y);
        this.setVisible(true);
        this.setActive(true);
        this.setAlpha(1);
        this.setVelocity(0, 0);
        
        this.lives = PLAYER_CONFIG.MAX_LIVES;
        this.shield = 0;
        this.weaponLevel = 1;
        this.missiles = 0;
        this.invulnerable = 0;
        
        // 重新设置移动边界（以防游戏尺寸变化）
        this.setupMovementBounds();
        
        // 重新创建护盾效果
        if (this.shieldEffect) {
            this.shieldEffect.destroy();
        }
        this.createShieldEffect();
        
        // 清理无敌效果
        if (this.invulnerabilityEffect) {
            this.invulnerabilityEffect.destroy();
            this.invulnerabilityEffect = null;
        }
    }
    
    // 设置触摸控制器
    setTouchControls(touchControls) {
        this.touchControls = touchControls;
    }
    
    // 获取玩家状态信息
    getStatus() {
        return {
            lives: this.lives,
            shield: this.shield,
            weaponLevel: this.weaponLevel,
            missiles: this.missiles,
            invulnerable: this.invulnerable,
            position: { x: this.x, y: this.y }
        };
    }
} 