export default class EffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.explosions = [];
        this.particles = [];
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        // 这里暂时用简单的图形代替粒子效果
        // 后续可以扩展为真正的粒子系统
    }
    
    createExplosion(x, y, size = 'normal') {
        const explosion = {
            x: x,
            y: y,
            radius: 5,
            maxRadius: size === 'large' ? 50 : size === 'small' ? 20 : 30,
            alpha: 1,
            color: 0xff6600
        };
        
        this.explosions.push(explosion);
        
        // 创建爆炸圆圈效果
        const circle = this.scene.add.circle(x, y, 5, explosion.color, 0.8);
        
        this.scene.tweens.add({
            targets: circle,
            radius: explosion.maxRadius,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
                // 从数组中移除
                const index = this.explosions.indexOf(explosion);
                if (index > -1) {
                    this.explosions.splice(index, 1);
                }
            }
        });
        
        // 屏幕震动
        if (size === 'large') {
            this.scene.cameras.main.shake(300, 0.02);
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
        // 导弹尾焰效果
        const trail = this.scene.add.group();
        
        // 创建尾焰粒子发射器
        const emitter = this.scene.add.particles(missile.x, missile.y, 'particle', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0xff6600, 0xff0000, 0xffff00],
            lifespan: 200,
            frequency: 20,
            angle: { min: missile.rotation * 180 / Math.PI + 150, max: missile.rotation * 180 / Math.PI + 210 }
        });
        
        // 跟随导弹
        const updateTimer = this.scene.time.addEvent({
            delay: 16, // 60fps
            callback: () => {
                if (missile.active && emitter.active) {
                    emitter.setPosition(missile.x, missile.y);
                    // 更新发射角度
                    emitter.setConfig({
                        angle: { 
                            min: missile.rotation * 180 / Math.PI + 150, 
                            max: missile.rotation * 180 / Math.PI + 210 
                        }
                    });
                } else {
                    updateTimer.destroy();
                    if (emitter.active) {
                        emitter.stop();
                        this.scene.time.delayedCall(500, () => emitter.destroy());
                    }
                }
            },
            loop: true
        });
        
        return {
            emitter: emitter,
            timer: updateTimer,
            destroy: () => {
                updateTimer.destroy();
                if (emitter.active) {
                    emitter.stop();
                    this.scene.time.delayedCall(500, () => emitter.destroy());
                }
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