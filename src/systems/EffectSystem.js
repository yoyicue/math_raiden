export default class EffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.explosions = [];
        this.particles = [];
        this.missileTrailManager = null;
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        // 创建单一的导弹尾焰粒子管理器
        if (this.scene.textures.exists('particle')) {
            this.missileTrailManager = this.scene.add.particles(0, 0, 'particle', {
                speed: { min: 50, max: 100 },
                scale: { start: 0.3, end: 0 },
                alpha: { start: 0.8, end: 0 },
                tint: [0xff6600, 0xff0000, 0xffff00],
                lifespan: 200,
                frequency: -1, // 手动发射
                emitting: false
            });
        }
    }
    
    createExplosion(x, y, size = 'normal') {
        const explosion = {
            x: x,
            y: y,
            radius: 5,
            maxRadius: size === 'large' ? 60 : size === 'small' ? 25 : 40,
            alpha: 1,
            color: 0xff6600
        };
        
        this.explosions.push(explosion);
        
        // 1. 创建闪光效果
        const flash = this.scene.add.circle(x, y, explosion.maxRadius * 0.8, 0xffffff, 0.9);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
        
        // 2. 创建主爆炸圆圈
        const circle = this.scene.add.circle(x, y, 5, explosion.color, 0.8);
        this.scene.tweens.add({
            targets: circle,
            radius: explosion.maxRadius,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
                const index = this.explosions.indexOf(explosion);
                if (index > -1) {
                    this.explosions.splice(index, 1);
                }
            }
        });
        
        // 3. 创建冲击波环
        const shockwave = this.scene.add.circle(x, y, 10, 0xffffff, 0);
        shockwave.setStrokeStyle(3, 0xffffff, 0.6);
        this.scene.tweens.add({
            targets: shockwave,
            radius: explosion.maxRadius * 1.2,
            alpha: 0,
            duration: 500,
            ease: 'Power3',
            onComplete: () => shockwave.destroy()
        });
        
        // 4. 创建火花粒子
        const particleCount = size === 'large' ? 20 : size === 'small' ? 8 : 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            const spark = this.scene.add.circle(x, y, 2 + Math.random() * 2, 
                Phaser.Display.Color.GetColor(255, 200 + Math.random() * 55, 0), 
                0.8 + Math.random() * 0.2
            );
            
            const distance = explosion.maxRadius + Math.random() * 30;
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 300 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => spark.destroy()
            });
        }
        
        // 5. 屏幕震动
        if (size === 'large') {
            this.scene.cameras.main.shake(400, 0.025);
        } else if (size === 'medium') {
            this.scene.cameras.main.shake(200, 0.015);
        } else {
            this.scene.cameras.main.shake(100, 0.01);
        }
        
        return explosion;
    }
    
    createHitEffect(x, y) {
        // 创建击中火花效果
        const hit = this.scene.add.circle(x, y, 3, 0xff0000, 0.8);
        
        this.scene.tweens.add({
            targets: hit,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => hit.destroy()
        });
        
        // 创建几个小火花
        for (let i = 0; i < 5; i++) {
            const spark = this.scene.add.circle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                2,
                0xffff00,
                0.6
            );
            
            this.scene.tweens.add({
                targets: spark,
                x: spark.x + (Math.random() - 0.5) * 40,
                y: spark.y + (Math.random() - 0.5) * 40,
                alpha: 0,
                duration: 200 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => spark.destroy()
            });
        }
    }
    
    createMuzzleFlash(x, y) {
        // 创建枪口火花效果
        const flash = this.scene.add.circle(x, y, 6, 0xffff00, 0.8);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 100,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
    }
    
    createShieldHitEffect(x, y) {
        // 护盾受击效果
        const shieldHit = this.scene.add.circle(x, y, 35, 0x00ffff, 0);
        shieldHit.setStrokeStyle(3, 0x00ffff, 0.8);
        
        this.scene.tweens.add({
            targets: shieldHit,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => shieldHit.destroy()
        });
    }
    
    createInvulnerabilityEffect(player) {
        // 无敌状态光环
        const glow = this.scene.add.circle(player.x, player.y, 40, 0xffff00, 0);
        glow.setStrokeStyle(3, 0xffff00, 0.6);
        
        // 跟随玩家
        const followTween = this.scene.tweens.add({
            targets: glow,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.3,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 更新位置的定时器
        const updateTimer = this.scene.time.addEvent({
            delay: 16, // 60fps
            callback: () => {
                if (player.active && glow.active) {
                    glow.setPosition(player.x, player.y);
                } else {
                    updateTimer.destroy();
                    if (glow.active) glow.destroy();
                }
            },
            loop: true
        });
        
        return glow;
    }
    
    createUpgradeEffect(x, y) {
        // 武器升级特效
        const upgrade = this.scene.add.circle(x, y, 10, 0x00ff00, 0.8);
        
        this.scene.tweens.add({
            targets: upgrade,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => upgrade.destroy()
        });
        
        // 升级文字
        const text = this.scene.add.text(x, y - 30, '武器升级!', {
            fontSize: '16px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
    
    createShieldRestoreEffect(x, y) {
        // 护盾恢复特效
        const shield = this.scene.add.circle(x, y, 20, 0x00ffff, 0.6);
        
        this.scene.tweens.add({
            targets: shield,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => shield.destroy()
        });
    }
    
    createLifeRestoreEffect(x, y) {
        // 生命恢复特效
        const life = this.scene.add.circle(x, y, 15, 0xff00ff, 0.8);
        
        this.scene.tweens.add({
            targets: life,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => life.destroy()
        });
        
        // 生命恢复文字
        const text = this.scene.add.text(x, y - 25, '+1 生命', {
            fontSize: '14px',
            color: '#ff00ff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
    
    createMissileRestoreEffect(x, y) {
        // 导弹补给特效
        const missile = this.scene.add.circle(x, y, 12, 0x00ff00, 0.7);
        
        this.scene.tweens.add({
            targets: missile,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => missile.destroy()
        });
    }
    
    createCollectEffect(x, y) {
        // 道具拾取特效
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 20;
            const sparkX = x + Math.cos(angle) * distance;
            const sparkY = y + Math.sin(angle) * distance;
            
            const spark = this.scene.add.circle(sparkX, sparkY, 3, 0xffd700, 0.8);
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance * 2,
                y: y + Math.sin(angle) * distance * 2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => spark.destroy()
            });
        }
    }
    
    createMissileTrail(missile) {
        // 使用轻量级的尾焰效果
        if (!this.missileTrailManager) {
            // 如果没有粒子管理器，使用简单的图形效果
            return this.createSimpleMissileTrail(missile);
        }
        
        // 创建尾焰效果对象
        const trail = {
            active: true,
            missile: missile,
            lastPositions: [],
            maxPositions: 10
        };
        
        // 更新定时器
        const updateTimer = this.scene.time.addEvent({
            delay: 16, // 60fps
            callback: () => {
                if (missile.active && trail.active) {
                    // 在导弹位置发射粒子
                    const angle = missile.rotation + Math.PI; // 相反方向
                    const offsetX = Math.cos(angle) * 10;
                    const offsetY = Math.sin(angle) * 10;
                    
                    this.missileTrailManager.emitParticleAt(
                        missile.x + offsetX, 
                        missile.y + offsetY
                    );
                } else {
                    updateTimer.destroy();
                    trail.active = false;
                }
            },
            loop: true
        });
        
        return {
            active: true,
            setPosition: (x, y) => {
                // 兼容性方法，实际不需要设置位置
            },
            stop: () => {
                trail.active = false;
                updateTimer.destroy();
            },
            destroy: () => {
                trail.active = false;
                updateTimer.destroy();
            }
        };
    }
    
    createSimpleMissileTrail(missile) {
        // 使用简单的图形绘制尾焰
        const graphics = this.scene.add.graphics();
        const trail = {
            active: true,
            positions: [],
            maxLength: 8
        };
        
        const updateTimer = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (missile.active && trail.active) {
                    // 添加新位置
                    trail.positions.push({ x: missile.x, y: missile.y });
                    
                    // 限制长度
                    if (trail.positions.length > trail.maxLength) {
                        trail.positions.shift();
                    }
                    
                    // 绘制尾焰
                    graphics.clear();
                    if (trail.positions.length > 1) {
                        for (let i = 1; i < trail.positions.length; i++) {
                            const alpha = i / trail.positions.length;
                            const width = (i / trail.positions.length) * 4;
                            
                            graphics.lineStyle(width, 0xff6600, alpha * 0.6);
                            graphics.beginPath();
                            graphics.moveTo(trail.positions[i - 1].x, trail.positions[i - 1].y);
                            graphics.lineTo(trail.positions[i].x, trail.positions[i].y);
                            graphics.strokePath();
                        }
                    }
                } else {
                    updateTimer.destroy();
                    graphics.destroy();
                }
            },
            loop: true
        });
        
        return {
            active: true,
            setPosition: () => {},
            stop: () => {
                trail.active = false;
                updateTimer.destroy();
                graphics.destroy();
            },
            destroy: () => {
                trail.active = false;
                updateTimer.destroy();
                graphics.destroy();
            }
        };
    }
    
    update() {
        // 更新所有特效
        // 这里可以添加持续性特效的更新逻辑
    }
    
    destroy() {
        // 清理所有特效
        this.explosions = [];
        this.particles = [];
    }
} 