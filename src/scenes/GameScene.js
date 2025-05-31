import Player from '../objects/Player.js';
import Enemy from '../objects/Enemy.js';
import { BulletManager } from '../objects/Bullet.js';
import MissileManager from '../managers/MissileManager.js';
import EffectSystem from '../systems/EffectSystem.js';
import MathSystem from '../systems/MathSystem.js';
import HUD from '../ui/HUD.js';
import TouchControls from '../ui/TouchControls.js';
import { GAME_CONFIG, POWERUP_CONFIG } from '../utils/Constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.gradeLevel = 1; // 默认难度等级
    }

    init(data) {
        // 接收从其他场景传递的数据
        this.gradeLevel = data.gradeLevel || 1;
        
        // 初始化游戏状态
        this.gameState = {
            score: 0,
            lives: 3,
            shield: 0,
            weaponLevel: 1,
            missiles: 0,
            paused: false,
            gameOver: false,
            enemiesDefeated: 0,
            gradeLevel: this.gradeLevel
        };
        
        // 记录游戏开始时间
        this.gameStartTime = 0;
        
        console.log('游戏场景初始化，难度等级:', this.gradeLevel);
    }

    create() {
        this.gameStartTime = this.time.now;
        
        // 创建星空背景
        this.createStarField();
        
        // 初始化各个系统
        this.initializeSystems();
        
        // 创建游戏对象
        this.createGameObjects();
        
        // 设置碰撞检测
        this.setupCollisions();
        
        // 设置输入控制
        this.setupInput();
        
        // 敌机生成定时器
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2500, // 增加到2.5秒生成一个敌机，降低敌机密度
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // 淡入效果
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // 监听场景暂停和恢复事件
        this.events.on('pause', () => {
            console.log('GameScene paused');
            if (this.touchControls) {
                this.touchControls.pause();
            }
        });
        
        this.events.on('resume', () => {
            console.log('GameScene resumed');
            if (this.touchControls) {
                this.touchControls.resume();
            }
        });
        
        console.log('游戏场景创建完成');
    }
    
    initializeSystems() {
        // 初始化子弹管理器
        this.bulletManager = new BulletManager(this);
        
        // 初始化导弹管理器
        this.missileManager = new MissileManager(this);
        
        // 初始化特效系统
        this.effectSystem = new EffectSystem(this);
        
        // 初始化数学题系统
        this.mathSystem = new MathSystem(this);
        this.mathSystem.setGradeLevel(this.gradeLevel);
        
        // 初始化HUD系统
        this.hud = new HUD(this);
        
        // 初始化触摸控制系统
        this.touchControls = new TouchControls(this);
        
        // 创建敌机组
        this.enemies = this.add.group();
        
        // 创建道具组
        this.powerups = this.add.group();
        
        // 获取导弹组引用
        this.missiles = this.missileManager.getMissiles();
    }
    
    createGameObjects() {
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // 动态计算玩家初始位置，确保不会太靠近边缘
        const bottomMargin = Math.max(80, gameHeight * 0.15); // 动态底部边距
        const playerY = gameHeight - bottomMargin;
        
        // 创建玩家
        this.player = new Player(this, gameWidth / 2, playerY);
        
        // 设置玩家的触摸控制
        this.player.setTouchControls(this.touchControls);
        
        // 注释掉控制模式切换按钮的创建，因为动态摇杆体验已经很好
        // if (this.touchControls && this.touchControls.isMobile) {
        //     this.createControlModeButton();
        // }
        
        // 同步游戏状态
        this.syncGameState();
        
        // 更新HUD显示
        this.updateHUD();
    }
    
    createControlModeButton() {
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // 动态计算按钮位置（左上角，使用动态边距）
        const margin = Math.max(10, Math.min(20, gameWidth * 0.03)); // 动态边距
        const buttonX = margin + 30; // 按钮中心位置
        const buttonY = margin + 15; // 按钮中心位置
        
        // 创建切换按钮（左上角，避免与右上角HUD重叠）
        this.controlModeButton = this.add.rectangle(buttonX, buttonY, 60, 30, 0x333333, 0.8);
        this.controlModeButton.setStrokeStyle(2, 0x00ff00, 1);
        this.controlModeButton.setScrollFactor(0);
        this.controlModeButton.setDepth(2000);
        this.controlModeButton.setInteractive({ useHandCursor: true });
        
        // 按钮文本
        this.controlModeText = this.add.text(buttonX, buttonY, '摇杆', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        this.controlModeText.setOrigin(0.5);
        this.controlModeText.setScrollFactor(0);
        this.controlModeText.setDepth(2001);
        
        // 按钮交互效果
        this.controlModeButton.on('pointerover', () => {
            this.controlModeButton.setFillStyle(0x555555, 0.9);
            this.controlModeButton.setScale(1.1);
            this.controlModeText.setScale(1.1);
        });
        
        this.controlModeButton.on('pointerout', () => {
            this.controlModeButton.setFillStyle(0x333333, 0.8);
            this.controlModeButton.setScale(1);
            this.controlModeText.setScale(1);
        });
        
        this.controlModeButton.on('pointerdown', () => {
            this.toggleTouchControlMode();
        });
    }
    
    updateControlModeButtonText() {
        if (!this.controlModeText || !this.touchControls) return;
        
        const modes = TouchControls.getAvailableModes();
        const currentMode = this.touchControls.getControlMode();
        
        const modeTexts = {
            [modes.JOYSTICK]: '摇杆',
            [modes.TOUCH]: '触屏'
        };
        
        this.controlModeText.setText(modeTexts[currentMode]);
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
        
        // 导弹 vs 敌机
        this.physics.add.overlap(
            this.missiles,
            this.enemies,
            this.missileHitEnemy,
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
        
        // 移除T键切换触屏控制模式的功能，因为已经默认使用动态摇杆
        // this.touchModeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        // this.touchModeKey.on('down', () => {
        //     this.toggleTouchControlMode();
        // });
        
        // 数字键切换难度
        for (let i = 1; i <= 3; i++) {
            const key = this.input.keyboard.addKey(`DIGIT${i}`);
            key.on('down', () => {
                this.gradeLevel = i;
                this.mathSystem.setGradeLevel(i);
                this.gameState.gradeLevel = i;
                this.showMessage(`切换到难度等级: G${i}`, '#ffaa00');
                console.log(`切换到难度等级: G${i}`);
            });
        }
    }
    
    toggleTouchControlMode() {
        if (!this.touchControls || !this.touchControls.isMobile) {
            this.showMessage('触屏控制仅在移动设备上可用', '#ff4444');
            return;
        }
        
        const modes = TouchControls.getAvailableModes();
        const currentMode = this.touchControls.getControlMode();
        
        // 切换模式
        const newMode = currentMode === modes.JOYSTICK ? modes.TOUCH : modes.JOYSTICK;
        this.touchControls.setControlMode(newMode);
        
        // 更新按钮文本
        this.updateControlModeButtonText();
        
        // 显示切换信息
        const modeNames = {
            [modes.JOYSTICK]: '虚拟摇杆模式',
            [modes.TOUCH]: '单指触屏模式'
        };
        
        this.showMessage(`切换到: ${modeNames[newMode]}`, '#00ff00');
        console.log(`触屏控制模式切换到: ${modeNames[newMode]}`);
    }
    
    spawnEnemy() {
        if (this.gameState.paused || this.gameState.gameOver) return;
        
        const gameWidth = this.game.config.width;
        const x = Math.random() * (gameWidth - 64); // 修正为64px敌机尺寸
        const enemy = Enemy.createRandom(this, x, -64); // 修正生成位置
        this.enemies.add(enemy);
    }
    
    playerBulletHitEnemy(bullet, enemy) {
        if (!bullet || !enemy || !bullet.active || !enemy.active) return;
        
        // 确保敌机对象有takeDamage方法
        if (typeof enemy.takeDamage !== 'function') {
            console.warn('Enemy object does not have takeDamage method:', enemy);
            return;
        }
        
        console.log('playerBulletHitEnemy called');
        
        // 子弹击中敌机
        bullet.hit();
        
        if (enemy.takeDamage(bullet.damage)) {
            // 敌机被摧毁，分数奖励，击败计数由Enemy.destroyEnemy()处理
            console.log('Enemy destroyed, adding score:', enemy.scoreValue);
            this.addScore(enemy.scoreValue || 10);
            // 移除重复计数：this.gameState.enemiesDefeated++; 
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
        if (!player || !enemy || !player.active || !enemy.active) return;
        
        // 确保敌机对象有takeDamage方法
        if (typeof enemy.takeDamage !== 'function') {
            console.warn('Enemy object does not have takeDamage method:', enemy);
            return;
        }
        
        // 玩家撞击敌机
        player.takeDamage();
        enemy.takeDamage(999); // 直接摧毁敌机
        
        // 同步游戏状态
        this.syncGameState();
    }
    
    playerCollectPowerup(player, powerup) {
        if (!player.active || !powerup.active) return;
        
        console.log('Player collected powerup:', powerup.powerType);
        
        // 玩家拾取道具 - 使用容器的坐标
        this.effectSystem.createCollectEffect(powerup.x, powerup.y);
        
        // 触发数学题系统
        this.mathSystem.showQuestion(powerup.powerType);
        
        powerup.destroy();
    }
    
    missileHitEnemy(objA, objB) {
        if (!objA || !objB || !objA.active || !objB.active) return;
        
        // 调试信息：检查对象类型
        console.log('missileHitEnemy called:', {
            objA: objA.constructor.name,
            objB: objB.constructor.name,
            objATexture: objA.texture?.key,
            objBTexture: objB.texture?.key
        });
        
        // 确定哪个是导弹，哪个是敌机
        let missile, enemy;
        if (objA.constructor.name === 'Missile') {
            missile = objA;
            enemy = objB;
        } else if (objB.constructor.name === 'Missile') {
            missile = objB;
            enemy = objA;
        } else {
            console.warn('Neither object is a Missile:', objA, objB);
            return;
        }
        
        // 确保敌机对象有takeDamage方法
        if (typeof enemy.takeDamage !== 'function') {
            console.warn('Enemy object does not have takeDamage method:', enemy);
            return;
        }
        
        // 标记这个敌机已被直接击中，避免爆炸时重复伤害
        enemy.hitByMissile = true;
        
        // 导弹直接击中敌机，立即造成伤害
        if (enemy.takeDamage(missile.damage)) {
            // 敌机被摧毁，给予分数奖励（击败计数由Enemy.destroyEnemy()处理）
            this.addScore((enemy.scoreValue || 10) + 5); // 导弹击中额外加5分
            
            // 敌机已经在destroyEnemy()中产生了爆炸效果，导弹使用静默爆炸保留范围伤害
            missile.explodeWithoutVisualEffect();
        } else {
            // 敌机未被摧毁，给予少量额外分数，导弹正常爆炸
            this.addScore(5);
            missile.hit();
        }
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
        console.log('Creating powerup:', type, 'at', x, y);
        
        const config = POWERUP_CONFIG.TYPES[type];
        
        // 获取道具贴图纹理键
        const spriteKey = `powerup-${type.toLowerCase()}-sprite`;
        const textureKey = `powerup-${type.toLowerCase()}`;
        
        // 优先使用贴图，如果不存在则使用程序生成的纹理
        let powerupTexture;
        if (this.textures.exists(spriteKey)) {
            powerupTexture = spriteKey;
            console.log(`使用${config.name}贴图:`, spriteKey);
        } else if (this.textures.exists(textureKey)) {
            powerupTexture = textureKey;
            console.log(`使用程序生成的${config.name}纹理:`, textureKey);
        } else {
            // 最终回退：创建临时纹理
            const graphics = this.add.graphics();
            graphics.fillStyle(config.color);
            graphics.fillRect(0, 0, 30, 30);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.strokeRect(0, 0, 30, 30);
            graphics.generateTexture(`temp-powerup-${type}`, 30, 30);
            graphics.destroy();
            powerupTexture = `temp-powerup-${type}`;
            console.log(`创建临时${config.name}纹理`);
        }

        // 创建道具容器用于组合效果
        const powerupContainer = this.add.container(x, y);
        
        // 创建发光背景层
        const glowBackground = this.add.graphics();
        this.createGlowEffect(glowBackground, config.color, POWERUP_CONFIG.GLOW_RADIUS);
        powerupContainer.add(glowBackground);
        
        // 创建道具精灵
        const powerup = this.add.image(0, 0, powerupTexture);
        powerup.setDisplaySize(30, 30); // 确保显示尺寸为30x30
        powerupContainer.add(powerup);
        
        // 添加物理属性到容器
        this.physics.add.existing(powerupContainer);
        powerupContainer.body.setVelocityY(POWERUP_CONFIG.SPEED);
        powerupContainer.body.setSize(30, 30); // 设置碰撞体积
        
        // 设置道具属性
        powerupContainer.powerType = type;
        powerupContainer.powerupSprite = powerup; // 保存精灵引用
        powerupContainer.glowBackground = glowBackground; // 保存发光背景引用
        
        // 浮动动画
        this.tweens.add({
            targets: powerupContainer,
            y: y + 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 应用不同类型道具的特殊发光效果
        this.applyGlowEffects(powerupContainer, type, config);
        
        // 添加到道具组
        this.powerups.add(powerupContainer);
        
        // 出界自动销毁
        this.time.delayedCall(10000, () => {
            if (powerupContainer.active) {
                powerupContainer.destroy();
            }
        });
    }

    // 创建发光效果背景
    createGlowEffect(graphics, color, radius) {
        graphics.clear();
        
        // 创建径向渐变发光效果
        const centerX = 0;
        const centerY = 0;
        
        // 使用配置的发光层数和参数
        const config = POWERUP_CONFIG.GLOW_CONFIG;
        const layers = config.LAYER_RADIUS_MULTIPLIERS.map((radiusMultiplier, index) => ({
            radius: radius * radiusMultiplier,
            alpha: config.LAYER_ALPHA_MULTIPLIERS[index] || 0.1
        }));
        
        layers.forEach(layer => {
            graphics.fillStyle(color, layer.alpha);
            graphics.fillCircle(centerX, centerY, layer.radius);
        });
    }

    // 应用不同类型道具的特殊发光效果
    applyGlowEffects(powerupContainer, type, config) {
        const powerup = powerupContainer.powerupSprite;
        const glowBackground = powerupContainer.glowBackground;
        const glowConfig = config.glow;
        
        switch(type) {
            case 'WEAPON':
                // 武器升级：快速脉冲发光
                this.tweens.add({
                    targets: [powerup, glowBackground],
                    alpha: 1 - glowConfig.intensity,
                    duration: glowConfig.pulseSpeed,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Power2'
                });
                break;
                
            case 'SHIELD':
                // 护盾：稳定发光
                this.tweens.add({
                    targets: glowBackground,
                    alpha: 1 - glowConfig.intensity,
                    duration: glowConfig.pulseSpeed,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                break;
                
            case 'LIFE':
                // 生命值：心跳式脉冲
                this.tweens.add({
                    targets: [powerup, glowBackground],
                    scaleX: glowConfig.scaleAmount,
                    scaleY: glowConfig.scaleAmount,
                    alpha: glowConfig.intensity,
                    duration: glowConfig.pulseSpeed,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Back.easeInOut'
                });
                break;
                
            case 'BOMB':
                // 炸弹：危险闪烁
                this.tweens.add({
                    targets: [powerup, glowBackground],
                    alpha: 1 - glowConfig.intensity,
                    duration: glowConfig.pulseSpeed,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Power1'
                });
                break;
                
            case 'MISSILE':
                // 导弹：能量充电效果
                this.tweens.add({
                    targets: glowBackground,
                    alpha: glowConfig.intensity,
                    scaleX: glowConfig.scaleAmount,
                    scaleY: glowConfig.scaleAmount,
                    duration: glowConfig.pulseSpeed,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                break;
                
            case 'SCORE':
                // 分数奖励：彩虹发光效果
                let hue = 0;
                this.time.addEvent({
                    delay: glowConfig.colorChangeSpeed,
                    callback: () => {
                        if (powerupContainer.active) {
                            hue = (hue + 15) % 360;
                            const color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 1);
                            const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
                            glowBackground.clear();
                            this.createGlowEffect(glowBackground, hexColor, POWERUP_CONFIG.GLOW_RADIUS);
                        }
                    },
                    loop: true
                });
                break;
                
            default:
                // 默认发光效果
                this.tweens.add({
                    targets: [powerup, glowBackground],
                    alpha: 1 - (glowConfig?.intensity || 0.7),
                    duration: glowConfig?.pulseSpeed || 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
        }
    }
    
    clearAllEnemies() {
        this.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active) {
                this.effectSystem.createExplosion(enemy.x, enemy.y);
                this.addScore(enemy.scoreValue || 10);
                // 增加击败敌机计数
                this.gameState.enemiesDefeated++;
                enemy.destroy();
            }
        });
        
        // 清除敌机子弹
        this.bulletManager.enemyBullets.forEach(bullet => {
            if (bullet && bullet.active) bullet.hit();
        });
    }
    
    clearSomeEnemies(percentage = 0.3) {
        // 清除部分敌机（用于答错题的安慰奖励）
        const enemies = this.enemies.children.entries.filter(enemy => enemy && enemy.active);
        const clearCount = Math.floor(enemies.length * percentage);
        
        for (let i = 0; i < clearCount; i++) {
            const enemy = enemies[i];
            if (enemy && enemy.active) {
                // 创建爆炸效果
                this.effectSystem.createExplosion(enemy.x, enemy.y);
                
                // 增加分数
                this.addScore(enemy.scoreValue || 10);
                
                // 增加击败敌机计数
                this.gameState.enemiesDefeated++;
                
                // 销毁敌机
                enemy.destroy();
            }
        }
    }
    
    addScore(points) {
        this.gameState.score += points;
    }
    
    createMissile(x, y) {
        // 使用导弹管理器创建导弹
        return this.missileManager.fireMissile(x, y);
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
        
        // 添加难度等级到游戏状态
        this.gameState.gradeLevel = this.gradeLevel;
    }
    
    updateHUD() {
        // 更新HUD显示
        if (this.hud) {
            this.hud.updateGameState(this.gameState);
        }
    }
    
    showMessage(text, color = '#ffffff') {
        // 使用HUD系统显示消息
        if (this.hud) {
            this.hud.showMessage(text, color);
        }
    }
    
    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        
        if (this.gameState.paused) {
            this.physics.pause();
            this.enemySpawnTimer.paused = true;
            if (this.hud) {
                this.hud.showPauseIndicator();
            }
            // 暂停触摸控制
            if (this.touchControls) {
                this.touchControls.pause();
            }
        } else {
            this.physics.resume();
            this.enemySpawnTimer.paused = false;
            if (this.hud) {
                this.hud.hidePauseIndicator();
                this.hud.showMessage('游戏继续', '#00ff00');
            }
            // 恢复触摸控制
            if (this.touchControls) {
                this.touchControls.resume();
            }
        }
        
        // 同步触屏暂停按钮状态
        if (this.touchControls && this.touchControls.setPaused) {
            this.touchControls.setPaused(this.gameState.paused);
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
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // 根据屏幕大小调整星星数量
        const starCount = Math.floor((gameWidth * gameHeight) / 5000); // 每5000像素一颗星
        
        // 创建星空背景
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * gameWidth;
            const y = Math.random() * gameHeight;
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
        
        // 更新导弹管理器
        this.missileManager.update();
        
        // 更新子弹管理器
        this.bulletManager.update();
        
        // 更新特效系统
        this.effectSystem.update();
        
        // 同步游戏状态
        this.syncGameState();
        
        // 更新HUD
        this.updateHUD();
    }
} 