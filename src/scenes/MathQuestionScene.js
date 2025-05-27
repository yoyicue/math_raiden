import { POWERUP_CONFIG, UI_CONFIG } from '../utils/Constants.js';

export default class MathQuestionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MathQuestionScene' });
    }

    init(data) {
        this.question = data.question;
        this.powerType = data.powerType;
        this.gradeLevel = data.gradeLevel || 1;
        this.callback = data.callback;
        this.answered = false;
    }

    create() {
        // 半透明背景
        this.add.rectangle(300, 400, 600, 800, 0x000000, 0.8);
        
        // 模态框背景
        const modalBg = this.add.rectangle(300, 400, 400, 320, 0x000000, 0.9);
        modalBg.setStrokeStyle(3, 0xff6600);
        
        // 道具类型显示
        const powerupName = this.getPowerupName(this.powerType);
        this.add.text(300, 280, powerupName, {
            fontSize: '22px',
            color: '#ff6600',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 题目显示
        this.questionText = this.add.text(300, 340, this.question?.question || '2 + 3 = ?', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 创建输入框（使用DOM元素）
        this.inputElement = this.add.dom(300, 400).createFromHTML(`
            <input type="number" id="mathInput" placeholder="?" style="
                font-size: 24px; 
                width: 120px; 
                height: 50px;
                text-align: center;
                background: #222;
                color: #fff;
                border: 3px solid #ff6600;
                border-radius: 8px;
                padding: 8px;
                outline: none;
                box-shadow: 0 0 10px rgba(255, 102, 0, 0.3);
            ">
        `);
        
        // 提交按钮
        const submitButton = this.add.rectangle(300, 470, 120, 40, 0xff6600);
        submitButton.setStrokeStyle(2, 0xff8800);
        const submitText = this.add.text(300, 470, '确定', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        submitButton.setInteractive({ useHandCursor: true });
        submitButton.on('pointerover', () => {
            submitButton.setFillStyle(0xff8800);
        });
        submitButton.on('pointerout', () => {
            submitButton.setFillStyle(0xff6600);
        });
        submitButton.on('pointerdown', () => this.submitAnswer());
        
        // 键盘事件
        this.input.keyboard.on('keydown-ENTER', () => this.submitAnswer());
        
        // 自动聚焦输入框
        this.time.delayedCall(100, () => {
            const input = document.getElementById('mathInput');
            if (input) {
                input.focus();
            }
        });
        
        // 添加倒计时
        this.createTimer();
    }
    
    createTimer() {
        // 20秒倒计时
        this.timeLeft = 20;
        this.timerText = this.add.text(420, 280, `${this.timeLeft}s`, {
            fontSize: '16px',
            color: '#ffff00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }
    
    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);
        
        // 时间不足时变红
        if (this.timeLeft <= 5) {
            this.timerText.setColor('#ff0000');
        }
        
        // 时间到自动提交
        if (this.timeLeft <= 0) {
            this.submitAnswer();
        }
    }
    
    getPowerupName(powerType) {
        const powerupConfig = POWERUP_CONFIG.TYPES[powerType];
        return powerupConfig ? powerupConfig.name : '未知道具';
    }
    
    submitAnswer() {
        if (this.answered) return; // 防止重复提交
        this.answered = true;
        
        // 停止计时器
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        
        const input = document.getElementById('mathInput');
        const userAnswer = parseInt(input.value);
        
        // 如果没有输入或输入无效，视为答错
        const isCorrect = !isNaN(userAnswer) && userAnswer === (this.question?.answer || 0);
        
        // 显示结果动画
        this.showResult(isCorrect, () => {
            // 关闭场景
            this.scene.stop();
            
            // 调用回调函数
            if (this.callback) {
                this.callback(userAnswer, isCorrect);
            }
        });
    }
    
    showResult(isCorrect, callback) {
        // 创建结果显示（位置避开输入框）
        const resultBg = this.add.rectangle(300, 520, 250, 70, isCorrect ? 0x00aa00 : 0xaa0000, 0.9);
        resultBg.setStrokeStyle(3, isCorrect ? 0x00ff00 : 0xff0000);
        
        const resultText = this.add.text(300, 520, isCorrect ? '✓ 正确' : '✗ 错误', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 结果动画
        resultBg.setScale(0);
        resultText.setScale(0);
        
        this.tweens.add({
            targets: [resultBg, resultText],
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                // 1秒后执行回调
                this.time.delayedCall(1000, callback);
            }
        });
    }
    
    destroy() {
        // 清理DOM元素
        const input = document.getElementById('mathInput');
        if (input) {
            input.remove();
        }
        
        // 清理计时器
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        
        super.destroy();
    }
} 