import { PLAYER_CONFIG, WEAPON_CONFIG } from '../utils/Constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        this.scene = scene;
        
        // 基础属性
        this.lives = PLAYER_CONFIG.MAX_LIVES;
        this.shield = 0;
        this.weaponLevel = 1;
        this.missiles = 0;
        this.invulnerable = 0;
        this.speed = PLAYER_CONFIG.SPEED;
        
        // 输入控制
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasdKeys = scene.input.keyboard.addKeys('W,S,A,D');
        
        // 触摸控制支持
        this.touchControls = null;
        
        // 射击定时器
        this.lastShot = 0;
        this.lastMissile = 0;
        this.shootInterval = WEAPON_CONFIG.SHOOT_INTERVALS.PLAYER;
        this.missileInterval = WEAPON_CONFIG.SHOOT_INTERVALS.MISSILE;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setSize(30, 30);
        this.setDrag(300); // 添加阻力，使移动更平滑
        
        // 设置玩家外观
        this.setTint(0x00ff00);
        
        // 护盾效果对象
        this.shieldEffect = null;
        this.invulnerabilityEffect = null;
        
        // 创建护盾效果
        this.createShieldEffect();
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
        let velocityX = 0;
        let velocityY = 0;
        
        // 触摸控制优先
        if (this.touchControls && this.touchControls.isActive) {
            const touchInput = this.touchControls.getInput();
            if (touchInput.isActive) {
                velocityX = touchInput.x * this.speed;
                velocityY = touchInput.y * this.speed;
            }
        } else {
            // 键盘控制作为备选
            if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
                velocityX = -this.speed;
            }
            if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
                velocityX = this.speed;
            }
            if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
                velocityY = -this.speed;
            }
            if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
                velocityY = this.speed;
            }
            
            // 对角线移动速度修正（仅键盘控制需要）
            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707; // 1/√2
                velocityY *= 0.707;
            }
        }
        
        this.setVelocity(velocityX, velocityY);
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
        
        const currentTime = this.scene.time.now;
        
        if (currentTime - this.lastMissile > this.missileInterval) {
            this.fireMissile();
            this.lastMissile = currentTime;
        }
    }
    
    shoot() {
        if (!this.scene || !this.active) return;
        
        // 根据武器等级发射不同模式的子弹
        switch(this.weaponLevel) {
            case 1:
                // 单发子弹
                this.scene.bulletManager.firePlayerBullet(this.x, this.y - 20);
                break;
                
            case 2:
                // 双发子弹
                this.scene.bulletManager.firePlayerBullet(this.x - 10, this.y - 20);
                this.scene.bulletManager.firePlayerBullet(this.x + 10, this.y - 20);
                break;
                
            case 3:
            default:
                // 三发散射子弹
                this.scene.bulletManager.firePlayerBullet(this.x, this.y - 20);
                this.scene.bulletManager.firePlayerBullet(this.x - 15, this.y - 20, -0.2);
                this.scene.bulletManager.firePlayerBullet(this.x + 15, this.y - 20, 0.2);
                break;
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