import { WEAPON_CONFIG } from '../utils/Constants.js';

export default class Missile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'missile');
        
        this.scene = scene;
        this.damage = 3; // 导弹伤害更高
        this.speed = WEAPON_CONFIG.MISSILE_SPEED;
        this.turnSpeed = WEAPON_CONFIG.MISSILE_TURN_SPEED;
        this.target = null;
        this.lifeTime = 5000; // 5秒生命周期
        this.startTime = scene.time.now;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setSize(8, 16);
        this.setTint(0x00ff00); // 绿色导弹
        
        // 初始向上飞行
        this.setVelocityY(-this.speed);
        
        // 寻找最近的敌机作为目标
        this.findTarget();
        
        // 尾焰特效
        this.createTrailEffect();
    }
    
    findTarget() {
        if (!this.scene.enemies) return;
        
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y, enemy.x, enemy.y
                );
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });
        
        this.target = closestEnemy;
    }
    
    createTrailEffect() {
        // 创建尾焰粒子效果
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
            this.findTarget();
        }
        
        // 追踪目标
        if (this.target && this.target.active) {
            this.trackTarget();
        }
        
        // 检查是否离开屏幕
        if (this.y < -50 || this.x < -50 || this.x > this.scene.game.config.width + 50) {
            this.destroy();
        }
    }
    
    trackTarget() {
        if (!this.target) return;
        
        // 计算到目标的角度
        const targetAngle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );
        
        // 当前角度
        const currentAngle = this.rotation;
        
        // 计算角度差
        let angleDiff = targetAngle - currentAngle;
        
        // 标准化角度差到 -π 到 π 范围
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // 逐渐转向目标
        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed);
        this.rotation += turnAmount;
        
        // 根据当前角度设置速度
        const velocityX = Math.cos(this.rotation) * this.speed;
        const velocityY = Math.sin(this.rotation) * this.speed;
        this.setVelocity(velocityX, velocityY);
    }
    
    hit() {
        // 导弹击中目标
        this.explode();
    }
    
    explode() {
        if (!this.active) return;
        
        // 创建爆炸效果
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createExplosion(this.x, this.y, 'medium');
        }
        
        // 对附近敌机造成范围伤害
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy.active) {
                    const distance = Phaser.Math.Distance.Between(
                        this.x, this.y, enemy.x, enemy.y
                    );
                    
                    if (distance < 60) { // 爆炸范围
                        enemy.takeDamage(this.damage);
                    }
                }
            });
        }
        
        // 播放爆炸音效
        if (this.scene.sound.get('explosion')) {
            this.scene.sound.play('explosion', { volume: 0.4 });
        }
        
        // 清理尾焰效果
        if (this.trailEffect) {
            this.trailEffect.destroy();
        }
        
        this.destroy();
    }
    
    destroy() {
        // 清理尾焰效果
        if (this.trailEffect) {
            this.trailEffect.destroy();
        }
        
        super.destroy();
    }
    
    // 获取导弹信息
    getInfo() {
        return {
            damage: this.damage,
            speed: this.speed,
            hasTarget: !!this.target,
            lifeTime: this.lifeTime
        };
    }
} 