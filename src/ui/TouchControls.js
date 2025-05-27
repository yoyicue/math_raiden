import TouchPauseButton from './TouchPauseButton.js';

// 摇杆配置常量
const JOYSTICK_CONFIG = {
    RADIUS: 60,
    KNOB_RADIUS: 25,
    MARGIN: 30,
    DEPTH_BASE: 1000,
    DEPTH_KNOB: 1001,
    COLORS: {
        BASE: 0x333333,
        BASE_STROKE: 0x666666,
        KNOB: 0x00ff00,
        KNOB_STROKE: 0x00cc00,
        KNOB_ACTIVE: 0x00cc00
    },
    ANIMATION: {
        GLOW_DURATION: 1000,
        RETURN_DURATION: 200
    }
};

// 触屏控制模式
const CONTROL_MODES = {
    JOYSTICK: 'joystick',    // 虚拟摇杆模式
    TOUCH: 'touch'           // 单指触屏模式
};

export default class TouchControls {
    constructor(scene, controlMode = CONTROL_MODES.JOYSTICK) {
        this.scene = scene;
        this.isActive = false;
        this.isMobile = this.detectMobile();
        this.controlMode = controlMode; // 控制模式
        
        // 摇杆相关（仅摇杆模式使用）
        this.joystickBase = null;
        this.joystickKnob = null;
        this.isDragging = false;
        this.joystickCenter = { x: 0, y: 0 };
        
        // 触屏区域（仅触屏模式使用）
        this.touchArea = null;
        this.isTouch = false;
        
        // 触摸输入状态
        this.touchInput = {
            x: 0,
            y: 0,
            isActive: false
        };
        
        // 事件监听器引用（用于清理）
        this.eventListeners = {
            pointerdown: null,
            pointermove: null,
            pointerup: null
        };
        
        // 动画引用（用于清理）
        this.glowTween = null;
        this.returnTween = null;
        
        // 触屏暂停按钮
        this.pauseButton = null;
        
        if (this.isMobile) {
            this.createTouchControls();
            this.createPauseButton();
        }
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }
    
    createTouchControls() {
        if (!this.scene || !this.scene.add) {
            console.warn('TouchControls: Invalid scene provided');
            return;
        }
        
        if (this.controlMode === CONTROL_MODES.JOYSTICK) {
            this.createVirtualJoystick();
        } else if (this.controlMode === CONTROL_MODES.TOUCH) {
            this.createTouchArea();
        }
        
        this.setupTouchEvents();
        this.isActive = true;
    }
    
    createVirtualJoystick() {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 摇杆位置（左下角）
        const joystickX = JOYSTICK_CONFIG.RADIUS + JOYSTICK_CONFIG.MARGIN;
        const joystickY = gameHeight - JOYSTICK_CONFIG.RADIUS - JOYSTICK_CONFIG.MARGIN;
        
        this.joystickCenter = { x: joystickX, y: joystickY };
        
        // 创建摇杆底座
        this.joystickBase = this.scene.add.circle(
            joystickX, 
            joystickY, 
            JOYSTICK_CONFIG.RADIUS, 
            JOYSTICK_CONFIG.COLORS.BASE, 
            0.6
        );
        this.joystickBase.setStrokeStyle(3, JOYSTICK_CONFIG.COLORS.BASE_STROKE, 0.8);
        this.joystickBase.setScrollFactor(0);
        this.joystickBase.setDepth(JOYSTICK_CONFIG.DEPTH_BASE);
        this.joystickBase.setInteractive();
        
        // 创建摇杆按钮
        this.joystickKnob = this.scene.add.circle(
            joystickX, 
            joystickY, 
            JOYSTICK_CONFIG.KNOB_RADIUS, 
            JOYSTICK_CONFIG.COLORS.KNOB, 
            0.8
        );
        this.joystickKnob.setStrokeStyle(2, JOYSTICK_CONFIG.COLORS.KNOB_STROKE, 1);
        this.joystickKnob.setScrollFactor(0);
        this.joystickKnob.setDepth(JOYSTICK_CONFIG.DEPTH_KNOB);
        this.joystickKnob.setInteractive();
        
        // 添加发光效果
        this.glowTween = this.scene.tweens.add({
            targets: this.joystickKnob,
            alpha: 0.6,
            duration: JOYSTICK_CONFIG.ANIMATION.GLOW_DURATION,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    createTouchArea() {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 创建全屏触摸区域（不可见）
        this.touchArea = this.scene.add.rectangle(
            0, 0, 
            gameWidth, 
            gameHeight, 
            0x000000, 
            0
        );
        this.touchArea.setOrigin(0, 0);
        this.touchArea.setInteractive();
        this.touchArea.setScrollFactor(0);
        this.touchArea.setDepth(999);
    }
    
    setupTouchEvents() {
        if (this.controlMode === CONTROL_MODES.JOYSTICK) {
            this.setupJoystickEvents();
        } else if (this.controlMode === CONTROL_MODES.TOUCH) {
            this.setupTouchAreaEvents();
        }
    }
    
    setupJoystickEvents() {
        // 创建摇杆事件处理函数
        this.eventListeners.pointerdown = (pointer) => {
            if (this.isPointInJoystick(pointer.x, pointer.y)) {
                this.startJoystickDrag(pointer);
            }
        };
        
        this.eventListeners.pointermove = (pointer) => {
            if (this.isDragging) {
                this.updateJoystick(pointer);
            }
        };
        
        this.eventListeners.pointerup = () => {
            if (this.isDragging) {
                this.endJoystickDrag();
            }
        };
        
        // 注册事件监听器
        this.scene.input.on('pointerdown', this.eventListeners.pointerdown);
        this.scene.input.on('pointermove', this.eventListeners.pointermove);
        this.scene.input.on('pointerup', this.eventListeners.pointerup);
    }
    
    setupTouchAreaEvents() {
        // 创建触屏事件处理函数
        this.eventListeners.pointerdown = (pointer) => {
            this.startTouch(pointer);
        };
        
        this.eventListeners.pointermove = (pointer) => {
            if (this.isTouch) {
                this.updateTouch(pointer);
            }
        };
        
        this.eventListeners.pointerup = () => {
            if (this.isTouch) {
                this.endTouch();
            }
        };
        
        // 注册事件监听器
        this.scene.input.on('pointerdown', this.eventListeners.pointerdown);
        this.scene.input.on('pointermove', this.eventListeners.pointermove);
        this.scene.input.on('pointerup', this.eventListeners.pointerup);
    }
    
    // 摇杆模式方法
    isPointInJoystick(x, y) {
        const distance = Phaser.Math.Distance.Between(
            x, y, 
            this.joystickCenter.x, 
            this.joystickCenter.y
        );
        return distance <= JOYSTICK_CONFIG.RADIUS;
    }
    
    startJoystickDrag(pointer) {
        this.isDragging = true;
        this.joystickKnob.setTint(JOYSTICK_CONFIG.COLORS.KNOB_ACTIVE);
        this.updateJoystick(pointer);
    }
    
    updateJoystick(pointer) {
        const deltaX = pointer.x - this.joystickCenter.x;
        const deltaY = pointer.y - this.joystickCenter.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        let knobX, knobY;
        
        if (distance <= JOYSTICK_CONFIG.RADIUS) {
            // 在摇杆范围内，直接使用指针位置
            knobX = pointer.x;
            knobY = pointer.y;
        } else {
            // 超出范围，限制在边界上
            const ratio = JOYSTICK_CONFIG.RADIUS / distance;
            knobX = this.joystickCenter.x + deltaX * ratio;
            knobY = this.joystickCenter.y + deltaY * ratio;
        }
        
        this.joystickKnob.setPosition(knobX, knobY);
        this.calculateJoystickVector(knobX, knobY);
    }
    
    endJoystickDrag() {
        this.isDragging = false;
        this.joystickKnob.setTint(0xffffff);
        
        // 清理之前的回中动画
        if (this.returnTween) {
            this.returnTween.destroy();
        }
        
        // 摇杆回中动画
        this.returnTween = this.scene.tweens.add({
            targets: this.joystickKnob,
            x: this.joystickCenter.x,
            y: this.joystickCenter.y,
            duration: JOYSTICK_CONFIG.ANIMATION.RETURN_DURATION,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.returnTween = null;
            }
        });
        
        // 重置输入状态
        this.resetTouchInput();
    }
    
    calculateJoystickVector(knobX, knobY) {
        const deltaX = knobX - this.joystickCenter.x;
        const deltaY = knobY - this.joystickCenter.y;
        
        // 归一化到 -1 到 1 的范围
        this.touchInput.x = deltaX / JOYSTICK_CONFIG.RADIUS;
        this.touchInput.y = deltaY / JOYSTICK_CONFIG.RADIUS;
        this.touchInput.isActive = true;
    }
    
    // 触屏模式方法
    startTouch(pointer) {
        this.isTouch = true;
        this.updateTouch(pointer);
    }
    
    updateTouch(pointer) {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 将触摸位置转换为移动向量（以屏幕中心为原点）
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // 计算相对于中心的偏移，并归一化
        this.touchInput.x = (pointer.x - centerX) / (gameWidth / 2);
        this.touchInput.y = (pointer.y - centerY) / (gameHeight / 2);
        
        // 限制范围到 -1 到 1
        this.touchInput.x = Phaser.Math.Clamp(this.touchInput.x, -1, 1);
        this.touchInput.y = Phaser.Math.Clamp(this.touchInput.y, -1, 1);
        this.touchInput.isActive = true;
    }
    
    endTouch() {
        this.isTouch = false;
        this.resetTouchInput();
    }
    
    resetTouchInput() {
        this.touchInput.x = 0;
        this.touchInput.y = 0;
        this.touchInput.isActive = false;
    }
    
    // 公共接口方法
    
    // 获取当前输入状态
    getInput() {
        return {
            x: this.touchInput.x,
            y: this.touchInput.y,
            isActive: this.touchInput.isActive
        };
    }
    
    // 切换控制模式（为设置界面预留）
    setControlMode(mode) {
        if (mode === this.controlMode) return;
        
        // 清理当前模式的UI
        this.cleanupCurrentMode();
        
        // 设置新模式
        this.controlMode = mode;
        
        // 重新创建控制界面
        if (this.isMobile) {
            this.createTouchControls();
        }
    }
    
    // 获取当前控制模式
    getControlMode() {
        return this.controlMode;
    }
    
    // 获取可用的控制模式
    static getAvailableModes() {
        return CONTROL_MODES;
    }
    
    cleanupCurrentMode() {
        // 清理事件监听器
        if (this.scene && this.scene.input) {
            if (this.eventListeners.pointerdown) {
                this.scene.input.off('pointerdown', this.eventListeners.pointerdown);
            }
            if (this.eventListeners.pointermove) {
                this.scene.input.off('pointermove', this.eventListeners.pointermove);
            }
            if (this.eventListeners.pointerup) {
                this.scene.input.off('pointerup', this.eventListeners.pointerup);
            }
        }
        
        // 清理摇杆相关
        if (this.glowTween) {
            this.glowTween.destroy();
            this.glowTween = null;
        }
        
        if (this.returnTween) {
            this.returnTween.destroy();
            this.returnTween = null;
        }
        
        if (this.joystickBase) {
            this.joystickBase.destroy();
            this.joystickBase = null;
        }
        
        if (this.joystickKnob) {
            this.joystickKnob.destroy();
            this.joystickKnob = null;
        }
        
        // 清理触屏区域
        if (this.touchArea) {
            this.touchArea.destroy();
            this.touchArea = null;
        }
        
        // 重置状态
        this.resetTouchInput();
        this.isDragging = false;
        this.isTouch = false;
    }
    
    // 设置可见性
    setVisible(visible) {
        if (this.controlMode === CONTROL_MODES.JOYSTICK) {
            if (this.joystickBase) this.joystickBase.setVisible(visible);
            if (this.joystickKnob) this.joystickKnob.setVisible(visible);
        }
        // 触屏模式的触摸区域本身就是不可见的，无需处理
    }
    
    // 创建暂停按钮
    createPauseButton() {
        try {
            this.pauseButton = new TouchPauseButton(this.scene);
            this.pauseButton.setVisible(true);
        } catch (error) {
            console.warn('TouchControls: Failed to create pause button:', error);
        }
    }
    
    // 设置暂停状态
    setPaused(paused) {
        if (this.pauseButton) {
            this.pauseButton.setPaused(paused);
        }
    }

    // 销毁控制器
    destroy() {
        this.cleanupCurrentMode();
        
        // 清理暂停按钮
        if (this.pauseButton) {
            this.pauseButton.destroy();
            this.pauseButton = null;
        }
        
        this.isActive = false;
        
        // 清理事件监听器引用
        this.eventListeners = {
            pointerdown: null,
            pointermove: null,
            pointerup: null
        };
    }
}