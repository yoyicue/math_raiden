export default class TouchKeyboard {
    constructor(scene, x, y, callback) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.callback = callback;
        this.currentValue = '';
        this.maxDigits = 4;
        
        // UI元素
        this.container = null;
        this.display = null;
        this.buttons = [];
        
        this.createKeyboard();
    }
    
    createKeyboard() {
        // 创建容器
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setDepth(2000);
        
        // 创建背景
        const background = this.scene.add.rectangle(0, 0, 280, 320, 0x000000, 0.8);
        background.setStrokeStyle(2, 0x00ff00, 1);
        this.container.add(background);
        
        // 创建显示屏
        this.display = this.scene.add.rectangle(0, -120, 240, 40, 0x333333, 1);
        this.display.setStrokeStyle(2, 0x666666, 1);
        this.container.add(this.display);
        
        // 创建显示文本
        this.displayText = this.scene.add.text(0, -120, '0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        this.displayText.setOrigin(0.5);
        this.container.add(this.displayText);
        
        // 创建数字按钮 (3x3 网格 + 0)
        this.createNumberButtons();
        
        // 创建功能按钮
        this.createFunctionButtons();
        
        // 添加标题
        const title = this.scene.add.text(0, -150, '请输入答案', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        title.setOrigin(0.5);
        this.container.add(title);
    }
    
    createNumberButtons() {
        const buttonSize = 60;
        const spacing = 70;
        const startX = -spacing;
        const startY = -60;
        
        // 数字 1-9
        for (let i = 1; i <= 9; i++) {
            const row = Math.floor((i - 1) / 3);
            const col = (i - 1) % 3;
            
            const x = startX + col * spacing;
            const y = startY + row * spacing;
            
            this.createButton(x, y, buttonSize, i.toString(), () => {
                this.addDigit(i.toString());
            });
        }
        
        // 数字 0
        this.createButton(0, startY + 3 * spacing, buttonSize, '0', () => {
            this.addDigit('0');
        });
    }
    
    createFunctionButtons() {
        const buttonSize = 60;
        const spacing = 70;
        
        // 清除按钮
        this.createButton(-spacing, -60 + 3 * spacing, buttonSize, 'C', () => {
            this.clear();
        }, 0xff4444);
        
        // 删除按钮
        this.createButton(spacing, -60 + 3 * spacing, buttonSize, '←', () => {
            this.backspace();
        }, 0xff8800);
        
        // 确认按钮
        this.createButton(0, -60 + 4 * spacing, buttonSize * 1.5, '确认', () => {
            this.submit();
        }, 0x00ff00);
    }
    
    createButton(x, y, size, text, callback, color = 0x666666) {
        // 按钮背景
        const button = this.scene.add.rectangle(x, y, size, size, color, 0.8);
        button.setStrokeStyle(2, 0xffffff, 0.6);
        button.setInteractive({ useHandCursor: true });
        
        // 按钮文本
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: text.length > 1 ? '16px' : '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        // 添加到容器
        this.container.add(button);
        this.container.add(buttonText);
        
        // 添加交互效果
        button.on('pointerover', () => {
            button.setFillStyle(color, 1);
            this.scene.tweens.add({
                targets: [button, buttonText],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(color, 0.8);
            this.scene.tweens.add({
                targets: [button, buttonText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        button.on('pointerdown', () => {
            // 点击反馈
            this.scene.tweens.add({
                targets: [button, buttonText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true
            });
            
            // 执行回调
            if (callback) {
                callback();
            }
        });
        
        this.buttons.push({ button, text: buttonText });
    }
    
    addDigit(digit) {
        if (this.currentValue.length >= this.maxDigits) return;
        
        if (this.currentValue === '0') {
            this.currentValue = digit;
        } else {
            this.currentValue += digit;
        }
        
        this.updateDisplay();
        this.playSound('beep');
    }
    
    backspace() {
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        
        this.updateDisplay();
        this.playSound('beep');
    }
    
    clear() {
        this.currentValue = '0';
        this.updateDisplay();
        this.playSound('beep');
    }
    
    submit() {
        const value = parseInt(this.currentValue);
        if (isNaN(value)) return;
        
        this.playSound('confirm');
        
        if (this.callback) {
            this.callback(value);
        }
    }
    
    updateDisplay() {
        this.displayText.setText(this.currentValue);
        
        // 添加闪烁效果
        this.scene.tweens.add({
            targets: this.displayText,
            alpha: 0.5,
            duration: 100,
            yoyo: true
        });
    }
    
    playSound(type) {
        // 音效播放（如果有音效资源）
        try {
            if (this.scene.sound.get(type)) {
                this.scene.sound.play(type, { volume: 0.3 });
            }
        } catch (e) {
            // 忽略音效错误
        }
    }
    
    // 设置初始值
    setValue(value) {
        this.currentValue = value.toString();
        this.updateDisplay();
    }
    
    // 获取当前值
    getValue() {
        return parseInt(this.currentValue) || 0;
    }
    
    // 设置可见性
    setVisible(visible) {
        this.container.setVisible(visible);
    }
    
    // 设置激活状态
    setActive(active) {
        this.buttons.forEach(({ button }) => {
            button.setInteractive(active);
        });
    }
    
    // 显示动画
    show() {
        this.container.setVisible(true);
        this.container.setScale(0.5);
        this.container.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    // 隐藏动画
    hide(callback) {
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.container.setVisible(false);
                if (callback) callback();
            }
        });
    }
    
    // 销毁键盘
    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.buttons = [];
    }
} 