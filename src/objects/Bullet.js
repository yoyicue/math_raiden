import { WEAPON_CONFIG } from '../utils/Constants.js';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'bullet', isPlayer = true) {
        super(scene, x, y, texture);
        
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.damage = 1;
        this.angle = 0;
        this.speed = isPlayer ? WEAPON_CONFIG.BULLET_SPEED : WEAPON_CONFIG.ENEMY_BULLET_SPEED;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置碰撞体积
        if (isPlayer) {
            this.setSize(4, 10);
            this.setTint(0xffff00); // 玩家子弹黄色
        } else {
            this.setSize(6, 6);
            this.setTint(0xff00ff); // 敌机子弹紫色
        }
        
        // 初始状态为非活跃
        this.setActive(false);
        this.setVisible(false);
        
        // 出界自动回收
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }
    
    fire(x, y, angle = 0) {
        // 激活子弹
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(x, y);
        this.angle = angle;
        
        // 设置速度
        if (this.isPlayer) {
            // 玩家子弹根据角度飞行，支持发散射击
            if (angle === 0) {
                // 直线向上
                this.setVelocity(0, -this.speed);
            } else {
                // 带角度的发散射击
                const velocityX = Math.sin(angle) * this.speed;
                const velocityY = -Math.cos(angle) * this.speed; // 主要向上，带有横向分量
                this.setVelocity(velocityX, velocityY);
            }
        } else {
            // 敌机子弹根据角度飞行（向玩家方向）
            const velocityX = Math.cos(angle) * this.speed;
            const velocityY = Math.sin(angle) * this.speed;
            this.setVelocity(velocityX, velocityY);
        }
        
        // 设置旋转
        this.setRotation(angle);
        
        // 播放射击音效（如果存在）
        if (this.isPlayer && this.scene.sound.get('shoot')) {
            this.scene.sound.play('shoot', { volume: 0.2 });
        }
    }
    
    hit() {
        // 子弹击中目标时的处理
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);
        
        // 击中特效（如果特效系统存在）
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createHitEffect(this.x, this.y);
        }
    }
    
    update() {
        if (!this.active) return;
        
        // 检查是否离开屏幕
        const bounds = this.scene.physics.world.bounds;
        if (this.x < bounds.x - 20 || 
            this.x > bounds.x + bounds.width + 20 || 
            this.y < bounds.y - 20 || 
            this.y > bounds.y + bounds.height + 20) {
            this.hit(); // 回收子弹
        }
    }
    
    // 重置子弹状态（用于对象池）
    reset(x, y, angle = 0) {
        this.fire(x, y, angle);
    }
    
    // 获取子弹信息
    getInfo() {
        return {
            isPlayer: this.isPlayer,
            damage: this.damage,
            speed: this.speed,
            angle: this.angle
        };
    }
}

// 子弹管理器类，用于对象池管理
export class BulletManager {
    constructor(scene) {
        this.scene = scene;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.maxPlayerBullets = 50;
        this.maxEnemyBullets = 100;
        
        this.initializePools();
    }
    
    initializePools() {
        // 初始化玩家子弹池
        for (let i = 0; i < this.maxPlayerBullets; i++) {
            const bullet = new Bullet(this.scene, 0, 0, 'bullet', true);
            this.playerBullets.push(bullet);
        }
        
        // 初始化敌机子弹池
        for (let i = 0; i < this.maxEnemyBullets; i++) {
            const bullet = new Bullet(this.scene, 0, 0, 'enemyBullet', false);
            this.enemyBullets.push(bullet);
        }
    }
    
    getPlayerBullet() {
        // 从池中获取可用的玩家子弹
        for (let bullet of this.playerBullets) {
            if (!bullet.active) {
                return bullet;
            }
        }
        
        // 如果池中没有可用子弹，创建新的（但不超过最大数量）
        if (this.playerBullets.length < this.maxPlayerBullets) {
            const bullet = new Bullet(this.scene, 0, 0, 'bullet', true);
            this.playerBullets.push(bullet);
            return bullet;
        }
        
        return null;
    }
    
    getEnemyBullet() {
        // 从池中获取可用的敌机子弹
        for (let bullet of this.enemyBullets) {
            if (!bullet.active) {
                return bullet;
            }
        }
        
        // 如果池中没有可用子弹，创建新的（但不超过最大数量）
        if (this.enemyBullets.length < this.maxEnemyBullets) {
            const bullet = new Bullet(this.scene, 0, 0, 'enemyBullet', false);
            this.enemyBullets.push(bullet);
            return bullet;
        }
        
        return null;
    }
    
    firePlayerBullet(x, y, angle = 0) {
        const bullet = this.getPlayerBullet();
        if (bullet) {
            bullet.fire(x, y, angle);
            return bullet;
        }
        return null;
    }
    
    // 根据武器等级发射子弹
    firePlayerBulletsByLevel(x, y, weaponLevel = 1) {
        const bullets = [];
        
        switch(weaponLevel) {
            case 1:
                // 1级武器：单发直射
                const bullet1 = this.firePlayerBullet(x, y, 0);
                if (bullet1) bullets.push(bullet1);
                break;
                
            case 2:
                // 2级武器：双发发散射击，增加覆盖面积
                const bullet2a = this.firePlayerBullet(x - 10, y, -0.2);  // 左侧发散
                const bullet2b = this.firePlayerBullet(x + 10, y, 0.2);   // 右侧发散
                if (bullet2a) bullets.push(bullet2a);
                if (bullet2b) bullets.push(bullet2b);
                break;
                
            case 3:
            default:
                // 3级武器：三发发散射击，更大角度覆盖更广范围
                const bullet3a = this.firePlayerBullet(x, y, 0);         // 中间直射
                const bullet3b = this.firePlayerBullet(x - 5, y, -0.4);  // 左侧大角度发散
                const bullet3c = this.firePlayerBullet(x + 5, y, 0.4);   // 右侧大角度发散
                if (bullet3a) bullets.push(bullet3a);
                if (bullet3b) bullets.push(bullet3b);
                if (bullet3c) bullets.push(bullet3c);
                break;
        }
        
        return bullets;
    }
    
    fireEnemyBullet(x, y, angle = 0) {
        const bullet = this.getEnemyBullet();
        if (bullet) {
            bullet.fire(x, y, angle);
            return bullet;
        }
        return null;
    }
    
    getActivePlayerBullets() {
        return this.playerBullets.filter(bullet => bullet.active);
    }
    
    getActiveEnemyBullets() {
        return this.enemyBullets.filter(bullet => bullet.active);
    }
    
    clearAllBullets() {
        // 清除所有活跃的子弹
        this.playerBullets.forEach(bullet => {
            if (bullet.active) bullet.hit();
        });
        
        this.enemyBullets.forEach(bullet => {
            if (bullet.active) bullet.hit();
        });
    }
    
    update() {
        // 更新所有活跃的子弹
        this.playerBullets.forEach(bullet => {
            if (bullet.active) bullet.update();
        });
        
        this.enemyBullets.forEach(bullet => {
            if (bullet.active) bullet.update();
        });
    }
    
    destroy() {
        // 销毁所有子弹
        this.playerBullets.forEach(bullet => bullet.destroy());
        this.enemyBullets.forEach(bullet => bullet.destroy());
        this.playerBullets = [];
        this.enemyBullets = [];
    }
} 