import { MATH_CONFIG } from '../utils/Constants.js';
import StorageManager from '../utils/StorageManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // 背景
        this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000428);
        
        // 标题
        const title = this.add.text(centerX, centerY - 200, '口算雷电', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        
        // 标题发光动画
        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 副标题
        this.add.text(centerX, centerY - 120, '边玩边学，提升口算技能', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 难度选择
        this.selectedGrade = 1;
        this.createDifficultyButtons();
        
        // 开始按钮
        this.startButton = this.add.rectangle(centerX, centerY + 120, 200, 60, 0x00ff00);
        this.startText = this.add.text(centerX, centerY + 120, '开始游戏', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.startButton.setInteractive({ useHandCursor: true });
        this.startButton.on('pointerover', () => {
            this.startButton.setFillStyle(0x00cc00);
            this.tweens.add({
                targets: this.startButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setFillStyle(0x00ff00);
            this.tweens.add({
                targets: this.startButton,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        this.startButton.on('pointerdown', () => {
            this.startGame();
        });
        
        // 添加排行榜显示
        this.createLeaderboard();
        
        // 操作说明
        this.add.text(centerX, centerY + 200, [
            '游戏操作：',
            '方向键移动 | 自动射击 | P键暂停',
            '拾取道具触发数学题获得奖励'
        ], {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);
        
        // 版本信息
        this.add.text(centerX, gameHeight - 50, '献给西憨 v1.0', {
            fontSize: '14px',
            color: '#666666',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 设置键盘控制
        this.setupKeyboardControls();
    }
    
    setupKeyboardControls() {
        // 方向键控制
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 数字键1-3直接选择难度
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        
        // 回车键开始游戏
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // 键盘事件监听
        this.cursors.up.on('down', () => {
            this.changeDifficulty(-1);
        });
        
        this.cursors.down.on('down', () => {
            this.changeDifficulty(1);
        });
        
        this.key1.on('down', () => {
            this.selectedGrade = 1;
            this.updateDifficultyButtons();
        });
        
        this.key2.on('down', () => {
            this.selectedGrade = 2;
            this.updateDifficultyButtons();
        });
        
        this.key3.on('down', () => {
            this.selectedGrade = 3;
            this.updateDifficultyButtons();
        });
        
        this.enterKey.on('down', () => {
            this.startGame();
        });
        
        this.spaceKey.on('down', () => {
            this.startGame();
        });
    }
    
    changeDifficulty(direction) {
        this.selectedGrade += direction;
        
        // 循环选择
        if (this.selectedGrade > 3) {
            this.selectedGrade = 1;
        } else if (this.selectedGrade < 1) {
            this.selectedGrade = 3;
        }
        
        this.updateDifficultyButtons();
    }
    
    createDifficultyButtons() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;
        
        const difficulties = [
            { 
                grade: 1, 
                title: 'G1 - 基础口算', 
                desc: '十几减几、凑十法、两位数加减',
                y: centerY - 70 
            },
            { 
                grade: 2, 
                title: 'G2 - 进阶运算', 
                desc: '100以内加减、混合运算、巧算',
                y: centerY - 10 
            },
            { 
                grade: 3, 
                title: 'G3 - 乘法技巧', 
                desc: '乘11、乘99、头同尾和10等',
                y: centerY + 50 
            }
        ];
        
        this.diffButtons = [];
        
        difficulties.forEach(diff => {
            // 主按钮
            const button = this.add.rectangle(centerX, diff.y, 320, 50, 0x333333);
            button.setStrokeStyle(2, 0x555555);
            
            // 标题文本
            const titleText = this.add.text(centerX, diff.y - 10, diff.title, {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // 描述文本
            const descText = this.add.text(centerX, diff.y + 12, diff.desc, {
                fontSize: '14px',
                color: '#cccccc',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            
            button.setInteractive({ useHandCursor: true });
            button.on('pointerover', () => {
                if (diff.grade !== this.selectedGrade) {
                    button.setFillStyle(0x444444);
                    button.setStrokeStyle(2, 0x666666);
                }
            });
            button.on('pointerout', () => {
                if (diff.grade !== this.selectedGrade) {
                    button.setFillStyle(0x333333);
                    button.setStrokeStyle(2, 0x555555);
                }
            });
            button.on('pointerdown', () => {
                this.selectedGrade = diff.grade;
                this.updateDifficultyButtons();
            });
            
            this.diffButtons.push({ 
                button, 
                titleText, 
                descText, 
                grade: diff.grade 
            });
        });
        
        this.updateDifficultyButtons();
    }
    
    updateDifficultyButtons() {
        this.diffButtons.forEach(item => {
            if (item.grade === this.selectedGrade) {
                item.button.setFillStyle(0xff6600);
                item.button.setStrokeStyle(3, 0xffaa00);
                item.titleText.setColor('#ffffff');
                item.descText.setColor('#ffeecc');
                
                // 选中动画
                this.tweens.add({
                    targets: item.button,
                    scaleX: 1.02,
                    scaleY: 1.02,
                    duration: 200,
                    ease: 'Back.easeOut'
                });
            } else {
                item.button.setFillStyle(0x333333);
                item.button.setStrokeStyle(2, 0x555555);
                item.titleText.setColor('#aaaaaa');
                item.descText.setColor('#888888');
                item.button.setScale(1);
            }
        });
    }
    
    startGame() {
        // 淡出效果
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { gradeLevel: this.selectedGrade });
        });
    }
    
    createLeaderboard() {
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        const leaderboardX = gameWidth - 100;
        const leaderboardY = 100;
        
        // 排行榜标题
        this.add.text(leaderboardX, leaderboardY, '🏆 最高分', {
            fontSize: '20px',
            color: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 获取并显示前3名
        const highScores = StorageManager.getHighScores();
        const topScores = highScores.slice(0, 3);
        
        if (topScores.length > 0) {
            topScores.forEach((score, index) => {
                const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32';
                const rankText = `${index + 1}. ${score}`;
                
                this.add.text(leaderboardX, leaderboardY + 40 + (index * 25), rankText, {
                    fontSize: '16px',
                    color: rankColor,
                    fontFamily: 'Arial',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            });
        } else {
            this.add.text(leaderboardX, leaderboardY + 40, '暂无记录', {
                fontSize: '14px',
                color: '#888888',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
    }
} 