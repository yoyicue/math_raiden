import Player from '../objects/Player.js';
import Enemy from '../objects/Enemy.js';
import { BulletManager } from '../objects/Bullet.js';
import EffectSystem from '../systems/EffectSystem.js';
import { GAME_CONFIG, POWERUP_CONFIG } from '../utils/Constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gradeLevel = data.gradeLevel || 1;
        console.log('游戏开始，难度等级:', this.gradeLevel);
        
        // 游戏状态
        this.gameState = {
            score: 0,
            lives: 3,
            shield: 0,
            weaponLevel: 1,
            missiles: 0,
            enemiesDefeated: 0,
            paused: false,
            gameOver: false
        };
        
        this.gameStartTime = this.time.now;
    }

    create() {
        // 背景
        this.add.rectangle(300, 400, 600, 800, 0x001122);
        
        // 星空背景
        this.createStarField();
        
        // 初始化系统
        this.initializeSystems();
        
        // 创建游戏对象
        this.createGameObjects();
        
        // 设置碰撞检测
        this.setupCollisions();
        
        // 键盘控制
        this.setupInput();
        
        // 敌机生成定时器
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2000, // 2秒生成一个敌机
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // 淡入效果
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        console.log('游戏场景创建完成');
    }
    
    initializeSystems() {
        // 初始化子弹管理器
        this.bulletManager = new BulletManager(this);
        
        // 初始化特效系统
        this.effectSystem = new EffectSystem(this);
        
        // 创建敌机组
        this.enemies = this.add.group();
        
        // 创建道具组
        this.powerups = this.add.group();
    }
    
    createGameObjects() {
        // 创建玩家
        this.player = new Player(this, GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 100);
        
        // 同步游戏状态
        this.syncGameState();
    }
    
    setupCollisions() {
        // 玩家子弹 vs 敌机
        this.physics.add.overlap(
            this.bulletManager.playerBullets,
            this.enemies,
            this.playerBulletHitEnemy,
            null,
            this
        );
        
        // 敌机子弹 vs 玩家
        this.physics.add.overlap(
            this.bulletManager.enemyBullets,
            this.player,
            this.enemyBulletHitPlayer,
            null,
            this
        );
        
        // 玩家 vs 敌机
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.playerHitEnemy,
            null,
            this
        );
        
        // 玩家 vs 道具
        this.physics.add.overlap(
            this.player,
            this.powerups,
            this.playerCollectPowerup,
            null,
            this
        );
    }
    
    setupInput() {
        // ESC键返回主菜单
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => {
            this.scene.start('MenuScene');
        });
        
        // P键暂停
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.pauseKey.on('down', () => {
            this.togglePause();
        });
        
        // 数字键切换难度
        for (let i = 1; i <= 3; i++) {
            const key = this.input.keyboard.addKey(`DIGIT${i}`);
            key.on('down', () => {
                this.gradeLevel = i;
                console.log(`切换到难度等级: G${i}`);
            });
        }
    }
    
    spawnEnemy() {
        if (this.gameState.paused || this.gameState.gameOver) return;
        
        const x = Math.random() * (GAME_CONFIG.WIDTH - 40);
        const enemy = Enemy.createRandom(this, x, -40);
        this.enemies.add(enemy);
    }
    
    playerBulletHitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;
        
        // 子弹击中敌机
        bullet.hit();
        
        if (enemy.takeDamage(bullet.damage)) {
            // 敌机被摧毁
            this.addScore(enemy.scoreValue);
            this.gameState.enemiesDefeated++;
        }
    }
    
    enemyBulletHitPlayer(bullet, player) {
        if (!bullet.active || !player.active) return;
        
        // 敌机子弹击中玩家
        bullet.hit();
        player.takeDamage();
        
        // 同步游戏状态
        this.syncGameState();
    }
    
    playerHitEnemy(player, enemy) {
        if (!player.active || !enemy.active) return;
        
        // 玩家撞击敌机
        player.takeDamage();
        enemy.takeDamage(999); // 直接摧毁敌机
        
        // 同步游戏状态
        this.syncGameState();
    }
    
    playerCollectPowerup(player, powerup) {
        if (!player.active || !powerup.active) return;
        
        // 玩家拾取道具
        this.effectSystem.createCollectEffect(powerup.x, powerup.y);
        
        // 触发数学题（这里暂时直接给予奖励）
        this.applyPowerupEffect(powerup.powerType);
        
        powerup.destroy();
    }
    
    applyPowerupEffect(powerType) {
        // 暂时直接应用道具效果，后续会通过数学题系统
        switch(powerType) {
            case 'WEAPON':
                if (this.player.upgradeWeapon()) {
                    this.showMessage('武器升级！', '#00ff00');
                } else {
                    this.addScore(200);
                    this.showMessage('武器已满级！获得200分！', '#ffff00');
                }
                break;
                
            case 'SHIELD':
                this.player.addShield(15);
                this.showMessage('护盾+15！', '#00ffff');
                break;
                
            case 'LIFE':
                if (this.player.addLife()) {
                    this.showMessage('生命+1！', '#ff00ff');
                } else {
                    this.addScore(300);
                    this.showMessage('生命已满！获得300分！', '#ffff00');
                }
                break;
                
            case 'BOMB':
                this.clearAllEnemies();
                this.showMessage('清屏炸弹！', '#ff4444');
                break;
                
            case 'MISSILE':
                this.player.addMissiles(50);
                this.showMessage('导弹+50！', '#00ff00');
                break;
                
            case 'SCORE':
                this.addScore(500);
                this.showMessage('分数+500！', '#ffd700');
                break;
        }
        
        // 同步游戏状态
        this.syncGameState();
    }
    
    dropRandomPowerup(x, y) {
        if (Math.random() < POWERUP_CONFIG.DROP_CHANCE) {
            const types = Object.keys(POWERUP_CONFIG.TYPES);
            const randomType = types[Math.floor(Math.random() * types.length)];
            this.createPowerup(x, y, randomType);
        }
    }
    
    createPowerup(x, y, type) {
        const config = POWERUP_CONFIG.TYPES[type];
        const powerup = this.add.rectangle(x, y, 30, 30, config.color);
        
        // 添加物理属性
        this.physics.add.existing(powerup);
        powerup.body.setVelocityY(POWERUP_CONFIG.SPEED);
        
        // 设置道具属性
        powerup.powerType = type;
        powerup.setStrokeStyle(2, 0xffffff);
        
        // 浮动动画
        this.tweens.add({
            targets: powerup,
            y: y + 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 发光效果
        this.tweens.add({
            targets: powerup,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 添加到道具组
        this.powerups.add(powerup);
        
        // 出界自动销毁
        this.time.delayedCall(10000, () => {
            if (powerup.active) {
                powerup.destroy();
            }
        });
    }
    
    clearAllEnemies() {
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                this.effectSystem.createExplosion(enemy.x, enemy.y);
                this.addScore(enemy.scoreValue);
                enemy.destroy();
            }
        });
        
        // 清除敌机子弹
        this.bulletManager.enemyBullets.forEach(bullet => {
            if (bullet.active) bullet.hit();
        });
    }
    
    addScore(points) {
        this.gameState.score += points;
    }
    
    syncGameState() {
        // 同步玩家状态到游戏状态
        if (this.player && this.player.getStatus) {
            const playerStatus = this.player.getStatus();
            this.gameState.lives = playerStatus.lives;
            this.gameState.shield = playerStatus.shield;
            this.gameState.weaponLevel = playerStatus.weaponLevel;
            this.gameState.missiles = playerStatus.missiles;
        }
    }
    
    showMessage(text, color = '#ffffff') {
        const message = this.add.text(GAME_CONFIG.WIDTH / 2, 100, text, {
            fontSize: '20px',
            color: color,
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: message,
            y: 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => message.destroy()
        });
    }
    
    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        
        if (this.gameState.paused) {
            this.physics.pause();
            this.enemySpawnTimer.paused = true;
            this.showMessage('游戏暂停 - 按P继续', '#ffff00');
        } else {
            this.physics.resume();
            this.enemySpawnTimer.paused = false;
            this.showMessage('游戏继续', '#00ff00');
        }
    }
    
    gameOver() {
        this.gameState.gameOver = true;
        this.physics.pause();
        this.enemySpawnTimer.destroy();
        
        // 延迟显示游戏结束画面
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', {
                score: this.gameState.score,
                enemiesDefeated: this.gameState.enemiesDefeated,
                survivalTime: Math.floor((this.time.now - this.gameStartTime) / 1000),
                maxWeaponLevel: this.gameState.weaponLevel,
                gradeLevel: this.gradeLevel
            });
        });
    }
    
    createStarField() {
        // 创建星空背景
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 600;
            const y = Math.random() * 800;
            const star = this.add.circle(x, y, Math.random() * 2, 0xffffff, Math.random() * 0.8 + 0.2);
            
            // 星星闪烁动画
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    update() {
        if (this.gameState.paused || this.gameState.gameOver) return;
        
        // 更新玩家
        if (this.player && this.player.active) {
            this.player.update();
        }
        
        // 更新敌机
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                enemy.update();
            }
        });
        
        // 更新子弹管理器
        this.bulletManager.update();
        
        // 更新特效系统
        this.effectSystem.update();
        
        // 清理离开屏幕的道具
        this.powerups.children.entries.forEach(powerup => {
            if (powerup.y > GAME_CONFIG.HEIGHT + 50) {
                powerup.destroy();
            }
        });
    }
} 