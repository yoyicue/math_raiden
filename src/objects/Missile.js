import { WEAPON_CONFIG } from '../utils/Constants.js';

export default class Missile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'missile');
        
        this.scene = scene;
        this.damage = 2;                    // 降低导弹伤害
        this.speed = WEAPON_CONFIG.MISSILE_SPEED;
        this.turnSpeed = WEAPON_CONFIG.MISSILE_TURN_SPEED;
        this.explosionRadius = 50;          // 稍微降低爆炸范围
        this.lifeTime = WEAPON_CONFIG.MISSILE_LIFETIME;
        this.targetSearchInterval = WEAPON_CONFIG.MISSILE_TARGET_SEARCH_INTERVAL;
        this.targetRange = WEAPON_CONFIG.MISSILE_TARGET_RANGE;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(8, 16);
        
        // 初始化但不激活
        this.setActive(false);
        this.setVisible(false);
    }
    
    // 发射导弹（对象池复用）
    fire(x, y) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        
        // 重置属性
        this.target = null;
        this.startTime = this.scene.time.now;
        this.lastTargetSearchTime = 0;      // 添加目标查找时间记录
        this.physicsRotation = -Math.PI / 2; // 初始向上
        
        // 设置颜色和初始速度
        this.setTint(0x00ff00);
        this.scene.physics.velocityFromRotation(this.physicsRotation, this.speed, this.body.velocity);
        
        // 寻找目标
        this.findTarget();
        
        // 创建尾焰效果
        this.createTrailEffect();
        
        return this;
    }
    
    findTarget() {
        if (!this.scene.enemies || !this.scene.enemies.children) return;
        
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        // 直接遍历敌机组，更可靠
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y, enemy.x, enemy.y
                );
                
                // 使用配置的目标搜索范围
                if (distance < this.targetRange && distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });
        
        // 只在目标状态改变时输出日志
        const hadTarget = !!this.target;
        this.target = closestEnemy;
        const hasTarget = !!this.target;
        
        if (hadTarget !== hasTarget) {
            if (hasTarget) {
                console.log(`导弹锁定目标，距离: ${closestDistance.toFixed(1)}`);
            } else {
                console.log('导弹失去目标');
            }
        }
        
        // 更新查找时间
        this.lastTargetSearchTime = this.scene.time.now;
    }
    
    createTrailEffect() {
        // 使用轻量级的尾焰效果
        if (this.scene.effectSystem) {
            this.trailEffect = this.scene.effectSystem.createMissileTrail(this);
        }
    }
    
    update() {
        if (!this.active) return;
        
        // 检查生命周期
        if (this.scene.time.now - this.startTime > this.lifeTime) {
            this.explode();
            return;
        }
        
        // 检查目标是否还存在
        if (this.target && !this.target.active) {
            this.target = null; // 直接清除无效目标
        }
        
        // 定期查找目标（而不是每帧都查找）
        const timeSinceLastSearch = this.scene.time.now - this.lastTargetSearchTime;
        if (!this.target && timeSinceLastSearch > this.targetSearchInterval) {
            this.findTarget();
        }
        
        // 追踪目标
        if (this.target && this.target.active) {
            this.trackTarget();
        } else {
            // 没有目标时继续直线飞行（向上）
            this.setVelocity(0, -this.speed);
            this.physicsRotation = -Math.PI / 2; // 向上
            this.updateVisualRotation();
        }
        
        // 更新尾焰位置
        if (this.trailEffect && this.trailEffect.active) {
            this.trailEffect.setPosition(this.x, this.y);
        }
        
        // 检查是否离开屏幕
        if (this.y < -50 || this.y > this.scene.game.config.height + 50 ||
            this.x < -50 || this.x > this.scene.game.config.width + 50) {
            this.deactivate();
        }
    }
    
    trackTarget() {
        if (!this.target || !this.target.active) {
            this.target = null; // 直接清除无效目标
            return;
        }
        
        // 使用类似demo.html的直接追踪算法
        const dx = this.target.x + this.target.width / 2 - this.x;
        const dy = this.target.y + this.target.height / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 直接计算单位向量并应用速度
            const unitX = dx / distance;
            const unitY = dy / distance;
            
            // 直接设置速度向量，实现快速转向
            this.setVelocity(unitX * this.speed, unitY * this.speed);
            
            // 计算视觉旋转角度
            this.physicsRotation = Math.atan2(dy, dx);
            this.updateVisualRotation();
            
            // 调试信息（每2秒输出一次，避免刷屏）
            if (this.scene.time.now % 2000 < 16) {
                console.log(`导弹追踪: 距离=${distance.toFixed(1)}, 目标位置=(${this.target.x.toFixed(1)}, ${this.target.y.toFixed(1)})`);
            }
        }
    }
    
    updateVisualRotation() {
        // 导弹精灵向上，所以需要加90度
        this.setRotation(this.physicsRotation + Math.PI / 2);
    }
    
    hit() {
        this.explode();
    }
    
    explode() {
        if (!this.active) return;
        
        // 创建爆炸效果
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createExplosion(this.x, this.y, 'medium');
        }
        
        // 使用物理系统进行范围伤害检测
        const bodiesInRange = this.scene.physics.overlapCirc(
            this.x, this.y, this.explosionRadius, true, false
        );
        
        bodiesInRange.forEach(body => {
            if (body.gameObject && body.gameObject.texture && body.gameObject.texture.key === 'enemy') {
                const enemy = body.gameObject;
                if (enemy && enemy.active && typeof enemy.takeDamage === 'function') {
                    const distance = Phaser.Math.Distance.Between(
                        this.x, this.y, enemy.x, enemy.y
                    );
                    
                    // 根据距离计算伤害衰减
                    const damageMultiplier = 1 - (distance / this.explosionRadius) * 0.5;
                    const actualDamage = Math.ceil(this.damage * damageMultiplier);
                    
                    if (enemy.takeDamage(actualDamage)) {
                        // 敌机被摧毁，给予分数
                        if (this.scene.addScore) {
                            this.scene.addScore(enemy.scoreValue || 10);
                        }
                    }
                }
            }
        });
        
        // 播放爆炸音效
        if (this.scene.sound.get('explosion')) {
            this.scene.sound.play('explosion', { volume: 0.4 });
        }
        
        this.deactivate();
    }
    
    deactivate() {
        // 清理尾焰效果
        if (this.trailEffect) {
            if (this.trailEffect.stop) {
                this.trailEffect.stop();
            }
            this.trailEffect = null;
        }
        
        // 重置状态供对象池复用
        this.setActive(false);
        this.setVisible(false);
        
        // 安全地重置速度
        if (this.body) {
            this.setVelocity(0, 0);
        }
        
        this.target = null;
    }
    
    destroy() {
        this.deactivate();
        super.destroy();
    }
    
    getInfo() {
        return {
            damage: this.damage,
            speed: this.speed,
            hasTarget: !!this.target,
            lifeTime: this.lifeTime,
            explosionRadius: this.explosionRadius
        };
    }
} 