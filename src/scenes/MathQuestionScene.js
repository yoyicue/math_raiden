import { POWERUP_CONFIG, UI_CONFIG } from '../utils/Constants.js';
import TouchKeyboard from '../ui/TouchKeyboard.js';

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
        this.autoSubmitTimer = null; // 自动提交计时器
        this.autoSubmitCountdown = null; // 自动提交倒计时显示
        this.isMobile = this.detectMobile(); // 检测移动设备
        this.touchKeyboard = null; // 触摸键盘
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
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
        
        // 根据设备类型创建不同的输入方式
        if (this.isMobile) {
            // 移动设备：使用触摸键盘
            this.createTouchInput();
        } else {
            // 桌面设备：使用传统输入框
            this.createDesktopInput();
        }
        
        // 添加倒计时
        this.createTimer();
    }
    
    createTouchInput() {
        // 创建答案显示区域
        this.answerDisplay = this.add.rectangle(300, 400, 120, 50, 0x333333, 1);
        this.answerDisplay.setStrokeStyle(3, 0xff6600, 1);
        
        this.answerText = this.add.text(300, 400, '?', {
            fontSize: '24px',
            color: '#00ff00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 创建触摸键盘
        this.touchKeyboard = new TouchKeyboard(this, 300, 550, (value) => {
            this.handleTouchInput(value);
        });
        
        // 显示键盘
        this.touchKeyboard.show();
    }
    
    createDesktopInput() {
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
        
        // 自动聚焦输入框并添加输入监听
        this.time.delayedCall(100, () => {
            const input = document.getElementById('mathInput');
            if (input) {
                input.focus();
                
                // 添加输入监听，实现自动提交
                input.addEventListener('input', (e) => {
                    this.handleInputChange(e);
                });
            }
        });
    }
    
    handleTouchInput(value) {
        // 更新显示
        this.answerText.setText(value.toString());
        
        // 自动提交答案
        this.userAnswer = value;
        this.submitAnswer();
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
    
    handleInputChange(event) {
        // 清除之前的自动提交计时器
        if (this.autoSubmitTimer) {
            this.autoSubmitTimer.destroy();
            this.autoSubmitTimer = null;
        }
        
        const userAnswer = parseInt(event.target.value);
        const expectedLength = this.question?.answer?.toString().length || 1;
        
        // 检查输入是否有效且长度足够
        if (!isNaN(userAnswer) && event.target.value.length >= expectedLength) {
            // 设置300毫秒后自动提交（与demo.html保持一致）
            this.autoSubmitTimer = this.time.delayedCall(300, () => {
                // 再次检查输入值是否未变化
                const currentInput = document.getElementById('mathInput');
                if (currentInput && currentInput.value === event.target.value && !this.answered) {
                    this.submitAnswer();
                }
            });
        }
    }
    

    
    submitAnswer() {
        if (this.answered) return; // 防止重复提交
        this.answered = true;
        
        // 停止计时器
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        
        // 清除自动提交计时器
        if (this.autoSubmitTimer) {
            this.autoSubmitTimer.destroy();
            this.autoSubmitTimer = null;
        }
        
        let userAnswer;
        
        if (this.isMobile && this.userAnswer !== undefined) {
            // 触摸输入
            userAnswer = this.userAnswer;
        } else {
            // 桌面输入
            const input = document.getElementById('mathInput');
            userAnswer = input ? parseInt(input.value) : NaN;
        }
        
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
        // 立即执行回调，不等待动画完成（与demo.html保持一致）
        callback();
    }
    
    destroy() {
        // 清理DOM元素
        const input = document.getElementById('mathInput');
        if (input) {
            input.remove();
        }
        
        // 清理触摸键盘
        if (this.touchKeyboard) {
            this.touchKeyboard.destroy();
            this.touchKeyboard = null;
        }
        
        // 清理计时器
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        
        // 清理自动提交计时器
        if (this.autoSubmitTimer) {
            this.autoSubmitTimer.destroy();
            this.autoSubmitTimer = null;
        }
        
        super.destroy();
    }
} 