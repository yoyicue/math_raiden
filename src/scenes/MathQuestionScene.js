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
        this.autoSubmitTimer = null;
        this.isMobile = this.detectMobile();
        this.touchKeyboard = null;
        this.currentAnswer = ''; // 统一的答案状态
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }

    create() {
        // 获取实际游戏尺寸
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // 半透明背景
        this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.8);
        
        if (this.isMobile) {
            // Mobile: 创建统一的大框架
            this.createMobileLayout(centerX, centerY);
        } else {
            // PC: 保持原有的模态框设计
            this.createDesktopLayout(centerX, centerY);
        }
    }
    
    createMobileLayout(centerX, centerY) {
        // 创建一个大的统一容器，包含所有内容
        const containerHeight = 500; // 增加高度以容纳键盘
        const containerY = centerY; // 居中显示
        
        // 统一的大背景框
        const unifiedBg = this.add.rectangle(centerX, containerY, Math.min(340, this.game.config.width - 20), containerHeight, 0x000000, 0.9);
        unifiedBg.setStrokeStyle(3, 0x4488ff);
        
        // 上半部分：问题区域
        const topY = containerY - containerHeight/2;
        
        // 道具类型显示
        const powerupName = this.getPowerupName(this.powerType);
        this.add.text(centerX, topY + 30, powerupName, {
            fontSize: '18px',
            color: '#4488ff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 题目显示
        this.questionText = this.add.text(centerX, topY + 70, this.question?.question || '2 + 3 = ?', {
            fontSize: '26px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 答案显示区域
        this.createMobileAnswerDisplay(centerX, topY + 120);
        
        // 添加分割线（可选）
        const divider = this.add.rectangle(centerX, topY + 160, 280, 2, 0x4488ff, 0.5);
        
        // 下半部分：键盘区域
        const keyboardY = topY + 320; // 键盘放在下半部分
        this.createEmbeddedTouchInput(centerX, keyboardY);
        
        // 添加倒计时（放在右上角）
        this.createTimer(centerX + 140, topY + 30);
    }
    
    createDesktopLayout(centerX, centerY) {
        // PC端保持原有设计
        const modalHeight = 320;
        const modalY = centerY;
        
        // 模态框背景
        const modalBg = this.add.rectangle(centerX, modalY, Math.min(400, this.game.config.width - 40), modalHeight, 0x000000, 0.9);
        modalBg.setStrokeStyle(3, 0x4488ff);
        
        // 道具类型显示
        const powerupName = this.getPowerupName(this.powerType);
        this.add.text(centerX, modalY - modalHeight/2 + 40, powerupName, {
            fontSize: '22px',
            color: '#4488ff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // 题目显示
        this.questionText = this.add.text(centerX, modalY - 20, this.question?.question || '2 + 3 = ?', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // 统一的答案显示区域
        this.createAnswerDisplay(centerX, modalY + 40);
        
        // 桌面输入
        this.createDesktopInput(centerX, modalY + 100);
        
        // 添加倒计时
        this.createTimer(centerX + 120, modalY - modalHeight/2 + 40);
    }
    
    // Mobile专用的答案显示（无边框）
    createMobileAnswerDisplay(x, y) {
        // 只创建文本，不要边框
        this.answerText = this.add.text(x, y, '?', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }
    
    // 内嵌的触摸键盘（无外框）
    createEmbeddedTouchInput(x, y) {
        // 创建触摸键盘，但不显示外框
        this.touchKeyboard = new TouchKeyboard(this, x, y, (value, immediateSubmit = false) => {
            this.updateAnswer(value);
            
            if (immediateSubmit) {
                this.submitAnswer();
            }
        }, true); // 传入true表示嵌入模式，不显示外框
        
        this.touchKeyboard.show();
    }
    
    // 统一的答案显示区域（PC用）
    createAnswerDisplay(x, y) {
        this.answerDisplay = this.add.rectangle(x, y, 120, 50, 0x333333, 1);
        this.answerDisplay.setStrokeStyle(3, 0x4488ff, 1);
        
        this.answerText = this.add.text(x, y, '?', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }
    
    // 统一的答案更新方法
    updateAnswer(value) {
        this.currentAnswer = value.toString();
        
        if (this.answerText) {
            this.answerText.setText(this.currentAnswer || '?');
        }
        
        // 重置自动提交计时器
        this.resetAutoSubmitTimer();
    }
    
    // 统一的自动提交逻辑
    resetAutoSubmitTimer() {
        if (this.autoSubmitTimer) {
            this.autoSubmitTimer.destroy();
            this.autoSubmitTimer = null;
        }
        
        const expectedLength = this.question?.answer?.toString().length || 1;
        const currentValue = parseInt(this.currentAnswer);
        
        // 检查输入是否有效且长度足够
        if (!isNaN(currentValue) && this.currentAnswer.length >= expectedLength) {
            // 设置延时自动提交
            this.autoSubmitTimer = this.time.delayedCall(this.isMobile ? 500 : 300, () => {
                if (!this.answered) {
                    this.submitAnswer();
                }
            });
        }
    }
    

    
    createDesktopInput(x, y) {
        // 创建隐藏的DOM输入框（仅用于键盘输入）
        this.inputElement = this.add.dom(x, y).createFromHTML(`
            <input type="number" id="mathInput" style="
                position: absolute;
                left: -9999px;
                opacity: 0;
                pointer-events: none;
            ">
        `);
        
        // 提交按钮
        const submitButton = this.add.rectangle(x, y + 60, 120, 40, 0xff6600);
        submitButton.setStrokeStyle(2, 0xff8800);
        const submitText = this.add.text(x, y + 60, '确定', {
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
        
        // 键盘事件监听
        this.input.keyboard.on('keydown', (event) => {
            this.handleKeyboardInput(event);
        });
        
        this.input.keyboard.on('keydown-ENTER', () => this.submitAnswer());
        this.input.keyboard.on('keydown-BACKSPACE', () => this.handleBackspace());
        
        // 聚焦隐藏输入框以接收键盘事件
        this.time.delayedCall(100, () => {
            const input = document.getElementById('mathInput');
            if (input) {
                input.focus();
            }
        });
    }
    
    // 处理键盘输入
    handleKeyboardInput(event) {
        if (event.keyCode >= 48 && event.keyCode <= 57) { // 数字键 0-9
            const digit = event.key;
            if (this.currentAnswer.length < 4) { // 限制最大位数
                if (this.currentAnswer === '0') {
                    this.updateAnswer(digit);
                } else {
                    this.updateAnswer(this.currentAnswer + digit);
                }
            }
        }
    }
    
    // 处理退格
    handleBackspace() {
        if (this.currentAnswer.length > 1) {
            this.updateAnswer(this.currentAnswer.slice(0, -1));
        } else {
            this.updateAnswer('0');
        }
    }
    
    createTimer(x, y) {
        // 20秒倒计时
        this.timeLeft = 20;
        
        this.timerText = this.add.text(x, y, `${this.timeLeft}s`, {
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
        
        // 清除自动提交计时器
        if (this.autoSubmitTimer) {
            this.autoSubmitTimer.destroy();
            this.autoSubmitTimer = null;
        }
        
        // 统一获取答案
        const userAnswer = parseInt(this.currentAnswer) || 0;
        
        // 判断答案是否正确
        const isCorrect = userAnswer === (this.question?.answer || 0);
        
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
        // 立即执行回调，不等待动画完成
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