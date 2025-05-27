import { MATH_CONFIG } from '../utils/Constants.js';

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
        const title = this.add.text(centerX, centerY - 200, '数学雷电', {
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
        this.add.text(centerX, centerY - 120, '边玩边学，提升数学技能', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 难度选择
        this.selectedGrade = 1;
        this.createDifficultyButtons();
        
        // 开始按钮
        const startButton = this.add.rectangle(centerX, centerY + 100, 200, 60, 0x00ff00);
        const startText = this.add.text(centerX, centerY + 100, '开始游戏', {
            fontSize: '28px',
            color: '#000000',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x00cc00);
            this.tweens.add({
                targets: startButton,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x00ff00);
            this.tweens.add({
                targets: startButton,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        startButton.on('pointerdown', () => {
            this.startGame();
        });
        
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
    }
    
    createDifficultyButtons() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;
        
        const difficulties = [
            { grade: 1, text: 'G1 - 10以内加减', y: centerY - 50 },
            { grade: 2, text: 'G2 - 20以内加减', y: centerY - 10 },
            { grade: 3, text: 'G3 - 乘法运算', y: centerY + 30 }
        ];
        
        this.diffButtons = [];
        
        difficulties.forEach(diff => {
            const button = this.add.rectangle(centerX, diff.y, 250, 35, 0x333333);
            const text = this.add.text(centerX, diff.y, diff.text, {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            
            button.setInteractive({ useHandCursor: true });
            button.on('pointerover', () => {
                if (diff.grade !== this.selectedGrade) {
                    button.setFillStyle(0x555555);
                }
            });
            button.on('pointerout', () => {
                if (diff.grade !== this.selectedGrade) {
                    button.setFillStyle(0x333333);
                }
            });
            button.on('pointerdown', () => {
                this.selectedGrade = diff.grade;
                this.updateDifficultyButtons();
            });
            
            this.diffButtons.push({ button, text, grade: diff.grade });
        });
        
        this.updateDifficultyButtons();
    }
    
    updateDifficultyButtons() {
        this.diffButtons.forEach(item => {
            if (item.grade === this.selectedGrade) {
                item.button.setFillStyle(0xff6600);
                item.text.setColor('#ffffff');
            } else {
                item.button.setFillStyle(0x333333);
                item.text.setColor('#888888');
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
} 