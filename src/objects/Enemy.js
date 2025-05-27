import { ENEMY_CONFIG } from '../utils/Constants.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'BASIC') {
        super(scene, x, y, 'enemy');
        
        this.scene = scene;
        this.enemyType = type;
        this.config = ENEMY_CONFIG.TYPES[type];
        
        // 基础属性
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.speed = this.config.speed;
        this.shootTimer = 0;
        this.shootInterval = this.config.shootInterval;
        this.scoreValue = this.config.score;
        
        // 移动相关
        this.movePattern = 'straight';
        this.moveTimer = 0;
        this.originalX = x;
        
        // 物理设置
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(false);
        this.setSize(35, 35);
        
        // 根据类型设置外观和属性
        this.setupByType(type);
        
        // 设置初始速度
        this.setVelocityY(this.speed * 60); // 转换为像素/秒
        
        // 出界检测
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }
    
    setupByType(type) {
        switch(type) {
            case 'FAST':
                this.setTint(0xff6600);
                this.movePattern = 'zigzag';
                break;
            case 'TANK':
                this.setTint(0x666666);
                this.setScale(1.2);
                this.movePattern = 'straight';
                break;
            case 'SHOOTER':
                this.setTint(0x9900ff);
                this.movePattern = 'straight';
                this.shootInterval = 30; // 更频繁射击
                break;
            default: // BASIC
                this.setTint(0xff0000);
                break;
        }
    }
    
    update() {
        if (!this.active) return;
        
        // 更新移动模式
        this.updateMovement();
        
        // 更新射击
        this.updateShooting();
        
        // 检查是否离开屏幕
        if (this.y > this.scene.game.config.height + 50) {
            this.destroy();
        }
    }
    
    updateMovement() {
        this.moveTimer++;
        
        switch(this.movePattern) {
            case 'zigzag':
                // 快速敌机的Z字形移动
                const zigzagOffset = Math.sin(this.moveTimer * 0.1) * 2;
                this.x += zigzagOffset;
                break;
                
            case 'sine':
                // 正弦波移动
                const sineOffset = Math.sin(this.moveTimer * 0.05) * 1.5;
                this.x = this.originalX + sineOffset * 50;
                break;
                
            case 'straight':
            default:
                // 直线下降，无额外移动
                break;
        }
        
        // 确保不超出屏幕边界
        if (this.x < 20) this.x = 20;
        if (this.x > this.scene.game.config.width - 20) this.x = this.scene.game.config.width - 20;
    }
    
    updateShooting() {
        this.shootTimer++;
        
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
    }
    
    shoot() {
        if (!this.scene || !this.active) return;
        
        // 获取玩家位置进行瞄准射击
        const player = this.scene.player;
        if (!player || !player.active) return;
        
        // 计算向玩家射击的角度
        const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            player.x, player.y
        );
        
        // 创建敌机子弹
        if (this.scene.bulletManager) {
            this.scene.bulletManager.fireEnemyBullet(
                this.x, 
                this.y + this.height / 2,
                angle
            );
        }
        
        // 射击特效
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createMuzzleFlash(this.x, this.y + this.height / 2);
        }
    }
    
    takeDamage(damage = 1) {
        if (!this.active) return false;
        
        this.hp -= damage;
        
        // 受伤闪烁效果
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                this.setupByType(this.enemyType); // 恢复原色调
            }
        });
        
        // 受伤特效
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createHitEffect(this.x, this.y);
        }
        
        if (this.hp <= 0) {
            this.destroyEnemy();
            return true; // 返回true表示敌机被摧毁
        }
        
        return false;
    }
    
    destroyEnemy() {
        if (!this.active) return;
        
        // 创建爆炸效果
        if (this.scene.effectSystem) {
            this.scene.effectSystem.createExplosion(this.x, this.y);
        }
        
        // 掉落道具
        if (this.scene.dropRandomPowerup) {
            this.scene.dropRandomPowerup(this.x, this.y);
        }
        
        // 分数由调用方处理，这里不重复添加
        // if (this.scene.addScore) {
        //     this.scene.addScore(this.scoreValue);
        // }
        
        // 增加击败敌机计数
        if (this.scene.gameState) {
            this.scene.gameState.enemiesDefeated++;
        }
        
        // 播放爆炸音效
        if (this.scene.sound.get('explosion')) {
            this.scene.sound.play('explosion', { volume: 0.3 });
        }
        
        // 销毁敌机
        this.destroy();
    }
    
    // 静态方法：创建随机类型的敌机
    static createRandom(scene, x, y) {
        const types = Object.keys(ENEMY_CONFIG.TYPES);
        const weights = Object.values(ENEMY_CONFIG.SPAWN_WEIGHTS);
        
        let random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return new Enemy(scene, x, y, types[i]);
            }
        }
        
        return new Enemy(scene, x, y, 'BASIC');
    }
    
    // 获取敌机信息
    getInfo() {
        return {
            type: this.enemyType,
            hp: this.hp,
            maxHp: this.maxHp,
            score: this.scoreValue
        };
    }
} 