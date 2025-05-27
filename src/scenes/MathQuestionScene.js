export default class MathQuestionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MathQuestionScene' });
    }

    init(data) {
        this.question = data.question;
        this.powerType = data.powerType;
        this.callback = data.callback;
    }

    create() {
        // 半透明背景
        this.add.rectangle(300, 400, 600, 800, 0x000000, 0.8);
        
        // 模态框背景
        const modalBg = this.add.rectangle(300, 400, 400, 300, 0x000000, 0.9);
        modalBg.setStrokeStyle(3, 0xff6600);
        
        // 标题
        this.add.text(300, 320, '道具激活！', {
            fontSize: '24px',
            color: '#ff6600',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 提示文本
        this.add.text(300, 350, '解答数学题获得道具奖励', {
            fontSize: '16px',
            color: '#ff6600',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 题目显示
        this.questionText = this.add.text(300, 400, this.question?.question || '2 + 3 = ?', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 创建输入框（使用DOM元素）
        this.inputElement = this.add.dom(300, 450).createFromHTML(`
            <input type="number" id="mathInput" style="
                font-size: 20px; 
                width: 100px; 
                text-align: center;
                background: #222;
                color: #fff;
                border: 2px solid #ff6600;
                border-radius: 5px;
                padding: 10px;
            ">
        `);
        
        // 提交按钮
        const submitButton = this.add.rectangle(300, 500, 120, 40, 0xff6600);
        const submitText = this.add.text(300, 500, '确定', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        submitButton.setInteractive({ useHandCursor: true });
        submitButton.on('pointerover', () => submitButton.setFillStyle(0xff8800));
        submitButton.on('pointerout', () => submitButton.setFillStyle(0xff6600));
        submitButton.on('pointerdown', () => this.submitAnswer());
        
        // 提示文本
        this.add.text(300, 540, '答对获得强化奖励，答错获得基础奖励', {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 键盘事件
        this.input.keyboard.on('keydown-ENTER', () => this.submitAnswer());
        
        // 自动聚焦输入框
        this.time.delayedCall(100, () => {
            const input = document.getElementById('mathInput');
            if (input) input.focus();
        });
    }
    
    submitAnswer() {
        const input = document.getElementById('mathInput');
        const userAnswer = parseInt(input.value);
        
        if (isNaN(userAnswer)) return;
        
        const isCorrect = userAnswer === (this.question?.answer || 5);
        
        // 关闭场景
        this.scene.stop();
        
        // 调用回调函数
        if (this.callback) {
            this.callback(userAnswer, isCorrect);
        }
    }
} 