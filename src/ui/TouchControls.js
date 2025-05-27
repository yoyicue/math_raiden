import TouchPauseButton from './TouchPauseButton.js';

// 摇杆配置常量
const JOYSTICK_CONFIG = {
    RADIUS: 60,
    KNOB_RADIUS: 25,
    MARGIN: 30,
    DEPTH_BASE: 1000,
    DEPTH_KNOB: 1001,
    DEAD_ZONE: 0.15, // 死区半径比例 (15%)
    SENSITIVITY_CURVE: 1.5, // 灵敏度曲线指数
    COLORS: {
        BASE: 0x333333,
        BASE_STROKE: 0x666666,
        KNOB: 0x00ff00,
        KNOB_STROKE: 0x00cc00,
        KNOB_ACTIVE: 0x00cc00
    },
    ANIMATION: {
        GLOW_DURATION: 1000,
        RETURN_DURATION: 200,
        APPEAR_DURATION: 150 // 动态摇杆出现动画
    }
};

// 触屏控制模式
const CONTROL_MODES = {
    JOYSTICK: 'joystick',    // 固定摇杆模式
    DYNAMIC_JOYSTICK: 'dynamic_joystick', // 动态摇杆模式
    TOUCH: 'touch'           // 单指触屏模式
};

export default class TouchControls {
    constructor(scene, controlMode = CONTROL_MODES.DYNAMIC_JOYSTICK) {
        this.scene = scene;
        this.isActive = false;
        this.isPaused = false; // 添加暂停状态
        this.isMobile = this.detectMobile();
        this.controlMode = controlMode; // 控制模式
        
        // 摇杆相关
        this.joystickBase = null;
        this.joystickKnob = null;
        this.isDragging = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.isDynamicJoystick = false; // 是否为动态创建的摇杆
        
        // 触屏区域（仅触屏模式使用）
        this.touchArea = null;
        this.isTouch = false;
        this.touchStartPos = { x: 0, y: 0 }; // 触摸开始位置
        this.playerStartPos = { x: 0, y: 0 }; // 触摸开始时玩家位置
        
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
        this.appearTween = null; // 动态摇杆出现动画
        
        // 触觉反馈支持检测
        this.hapticSupported = 'vibrate' in navigator;
        
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
        } else if (this.controlMode === CONTROL_MODES.DYNAMIC_JOYSTICK) {
            this.createDynamicJoystickArea();
        } else if (this.controlMode === CONTROL_MODES.TOUCH) {
            this.createTouchArea();
        }
        
        this.setupTouchEvents();
        this.isActive = true;
    }
    
    createVirtualJoystick() {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 动态计算摇杆位置，确保不会超出屏幕
        const margin = Math.max(JOYSTICK_CONFIG.MARGIN, gameWidth * 0.05); // 动态边距
        const radius = Math.min(JOYSTICK_CONFIG.RADIUS, gameWidth * 0.12); // 动态半径
        
        // 摇杆位置（左下角）
        const joystickX = radius + margin;
        const joystickY = gameHeight - radius - margin;
        
        this.joystickCenter = { x: joystickX, y: joystickY };
        this.joystickRadius = radius; // 保存动态半径供后续使用
        
        // 创建摇杆底座
        this.joystickBase = this.scene.add.circle(
            joystickX, 
            joystickY, 
            radius, 
            JOYSTICK_CONFIG.COLORS.BASE, 
            0.6
        );
        this.joystickBase.setStrokeStyle(3, JOYSTICK_CONFIG.COLORS.BASE_STROKE, 0.8);
        this.joystickBase.setScrollFactor(0);
        this.joystickBase.setDepth(JOYSTICK_CONFIG.DEPTH_BASE);
        this.joystickBase.setInteractive();
        
        // 创建摇杆按钮
        const knobRadius = Math.min(JOYSTICK_CONFIG.KNOB_RADIUS, radius * 0.4); // 动态按钮半径
        this.joystickKnob = this.scene.add.circle(
            joystickX, 
            joystickY, 
            knobRadius, 
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
    
    createDynamicJoystickArea() {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 创建左半屏的触摸区域用于动态摇杆
        this.touchArea = this.scene.add.rectangle(
            0, 0, 
            gameWidth / 2, // 只占左半屏
            gameHeight, 
            0x000000, 
            0
        );
        this.touchArea.setOrigin(0, 0);
        this.touchArea.setInteractive();
        this.touchArea.setScrollFactor(0);
        this.touchArea.setDepth(999);
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
        } else if (this.controlMode === CONTROL_MODES.DYNAMIC_JOYSTICK) {
            this.setupDynamicJoystickEvents();
        } else if (this.controlMode === CONTROL_MODES.TOUCH) {
            this.setupTouchAreaEvents();
        }
    }
    
    setupJoystickEvents() {
        // 创建摇杆事件处理函数
        this.eventListeners.pointerdown = (pointer) => {
            // 检查是否暂停或场景不活跃
            if (this.isPaused || !this.scene.scene.isActive()) {
                return;
            }
            
            if (this.isPointInJoystick(pointer.x, pointer.y)) {
                this.startJoystickDrag(pointer);
            }
        };
        
        this.eventListeners.pointermove = (pointer) => {
            // 检查是否暂停或场景不活跃
            if (this.isPaused || !this.scene.scene.isActive()) {
                return;
            }
            
            if (this.isDragging) {
                this.updateJoystick(pointer);
            }
        };
        
        this.eventListeners.pointerup = () => {
            // pointerup 事件即使在暂停时也要处理，以清理状态
            if (this.isDragging) {
                this.endJoystickDrag();
            }
        };
        
        // 注册事件监听器
        this.scene.input.on('pointerdown', this.eventListeners.pointerdown);
        this.scene.input.on('pointermove', this.eventListeners.pointermove);
        this.scene.input.on('pointerup', this.eventListeners.pointerup);
    }
    
    setupDynamicJoystickEvents() {
        // 动态摇杆事件处理
        this.eventListeners.pointerdown = (pointer) => {
            // 检查是否暂停或场景不活跃
            if (this.isPaused || !this.scene.scene.isActive()) {
                return;
            }
            
            // 检查是否在左半屏
            if (pointer.x <= this.scene.game.config.width / 2) {
                this.createDynamicJoystick(pointer.x, pointer.y);
                this.startJoystickDrag(pointer);
                
                // 触觉反馈
                this.triggerHapticFeedback(10);
            }
        };
        
        this.eventListeners.pointermove = (pointer) => {
            // 检查是否暂停或场景不活跃
            if (this.isPaused || !this.scene.scene.isActive()) {
                return;
            }
            
            if (this.isDragging && this.isDynamicJoystick) {
                this.updateJoystick(pointer);
            }
        };
        
        this.eventListeners.pointerup = () => {
            // pointerup 事件即使在暂停时也要处理，以清理状态
            if (this.isDragging && this.isDynamicJoystick) {
                this.endDynamicJoystickDrag();
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
            // 检查是否暂停或场景不活跃
            if (this.isPaused || !this.scene.scene.isActive()) {
                return;
            }
            
            this.startTouch(pointer);
        };
        
        this.eventListeners.pointermove = (pointer) => {
            // 检查是否暂停或场景不活跃
            if (this.isPaused || !this.scene.scene.isActive()) {
                return;
            }
            
            if (this.isTouch) {
                this.updateTouch(pointer);
            }
        };
        
        this.eventListeners.pointerup = () => {
            // pointerup 事件即使在暂停时也要处理，以清理状态
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
        return distance <= (this.joystickRadius || JOYSTICK_CONFIG.RADIUS);
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
        const radius = this.joystickRadius || JOYSTICK_CONFIG.RADIUS;
        
        let knobX, knobY;
        
        if (distance <= radius) {
            // 在摇杆范围内，直接使用指针位置
            knobX = pointer.x;
            knobY = pointer.y;
        } else {
            // 超出范围，限制在边界上
            const ratio = radius / distance;
            knobX = this.joystickCenter.x + deltaX * ratio;
            knobY = this.joystickCenter.y + deltaY * ratio;
        }
        
        this.joystickKnob.setPosition(knobX, knobY);
        this.calculateJoystickVector(knobX, knobY);
    }
    
    endJoystickDrag() {
        this.isDragging = false;
        this.joystickKnob.setTint(0xffffff);
        
        // 如果是动态摇杆，使用特殊的结束处理
        if (this.isDynamicJoystick) {
            this.endDynamicJoystickDrag();
            return;
        }
        
        // 固定摇杆的回中动画
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
        const radius = this.joystickRadius || JOYSTICK_CONFIG.RADIUS;
        
        // 计算距离比例
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const normalizedDistance = Math.min(distance / radius, 1);
        
        // 应用死区
        if (normalizedDistance < JOYSTICK_CONFIG.DEAD_ZONE) {
            this.touchInput.x = 0;
            this.touchInput.y = 0;
            this.touchInput.isActive = false;
            return;
        }
        
        // 重新映射死区外的值到 0-1 范围
        const remappedDistance = (normalizedDistance - JOYSTICK_CONFIG.DEAD_ZONE) / 
                                (1 - JOYSTICK_CONFIG.DEAD_ZONE);
        
        // 应用灵敏度曲线
        const curvedDistance = Math.pow(remappedDistance, JOYSTICK_CONFIG.SENSITIVITY_CURVE);
        
        // 计算最终的输入向量
        if (distance > 0) {
            this.touchInput.x = (deltaX / distance) * curvedDistance;
            this.touchInput.y = (deltaY / distance) * curvedDistance;
        } else {
            this.touchInput.x = 0;
            this.touchInput.y = 0;
        }
        
        this.touchInput.isActive = true;
    }
    
    // 触屏模式方法
    startTouch(pointer) {
        this.isTouch = true;
        this.touchStartPos = { x: pointer.x, y: pointer.y };
        
        // 记录玩家当前位置（如果可以访问）
        if (this.scene.player) {
            this.playerStartPos = { x: this.scene.player.x, y: this.scene.player.y };
        }
        
        // 触觉反馈
        this.triggerHapticFeedback(5);
        
        this.updateTouch(pointer);
    }
    
    updateTouch(pointer) {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // 相对移动模式：计算手指移动的偏移量
        const deltaX = pointer.x - this.touchStartPos.x;
        const deltaY = pointer.y - this.touchStartPos.y;
        
        // 设置灵敏度系数（可调整）
        const sensitivity = 2.0;
        
        // 将偏移量转换为移动向量，并应用灵敏度
        this.touchInput.x = (deltaX / (gameWidth * 0.3)) * sensitivity;
        this.touchInput.y = (deltaY / (gameHeight * 0.3)) * sensitivity;
        
        // 限制范围到 -1 到 1
        this.touchInput.x = Phaser.Math.Clamp(this.touchInput.x, -1, 1);
        this.touchInput.y = Phaser.Math.Clamp(this.touchInput.y, -1, 1);
        
        // 应用非线性曲线，让小幅度移动更精确
        const curve = 1.3;
        this.touchInput.x = Math.sign(this.touchInput.x) * Math.pow(Math.abs(this.touchInput.x), curve);
        this.touchInput.y = Math.sign(this.touchInput.y) * Math.pow(Math.abs(this.touchInput.y), curve);
        
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
        if (this.isPaused || !this.scene.scene.isActive()) {
            return {
                x: 0,
                y: 0,
                isActive: false
            };
        }
        
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
        
        // 清理所有动画
        if (this.glowTween) {
            this.glowTween.destroy();
            this.glowTween = null;
        }
        
        if (this.returnTween) {
            this.returnTween.destroy();
            this.returnTween = null;
        }
        
        if (this.appearTween) {
            this.appearTween.destroy();
            this.appearTween = null;
        }
        
        // 清理摇杆相关
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
        this.isDynamicJoystick = false;
    }
    
    // 设置可见性
    setVisible(visible) {
        if (this.controlMode === CONTROL_MODES.JOYSTICK || 
            (this.controlMode === CONTROL_MODES.DYNAMIC_JOYSTICK && this.joystickBase)) {
            if (this.joystickBase) this.joystickBase.setVisible(visible);
            if (this.joystickKnob) this.joystickKnob.setVisible(visible);
        }
        // 触屏模式的触摸区域本身就是不可见的，无需处理
        
        // 暂停按钮
        if (this.pauseButton) {
            this.pauseButton.setVisible(visible);
        }
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

    // 触觉反馈
    triggerHapticFeedback(duration = 10) {
        if (this.hapticSupported) {
            try {
                navigator.vibrate(duration);
            } catch (e) {
                // 静默失败
            }
        }
    }

    createDynamicJoystick(x, y) {
        // 动态创建摇杆
        const radius = Math.min(JOYSTICK_CONFIG.RADIUS, this.scene.game.config.width * 0.12);
        
        this.joystickCenter = { x, y };
        this.joystickRadius = radius;
        this.isDynamicJoystick = true;
        
        // 创建摇杆底座
        this.joystickBase = this.scene.add.circle(
            x, y, radius, 
            JOYSTICK_CONFIG.COLORS.BASE, 0.3
        );
        this.joystickBase.setStrokeStyle(3, JOYSTICK_CONFIG.COLORS.BASE_STROKE, 0.5);
        this.joystickBase.setScrollFactor(0);
        this.joystickBase.setDepth(JOYSTICK_CONFIG.DEPTH_BASE);
        this.joystickBase.setScale(0);
        
        // 创建摇杆按钮
        const knobRadius = Math.min(JOYSTICK_CONFIG.KNOB_RADIUS, radius * 0.4);
        this.joystickKnob = this.scene.add.circle(
            x, y, knobRadius, 
            JOYSTICK_CONFIG.COLORS.KNOB, 0.8
        );
        this.joystickKnob.setStrokeStyle(2, JOYSTICK_CONFIG.COLORS.KNOB_STROKE, 1);
        this.joystickKnob.setScrollFactor(0);
        this.joystickKnob.setDepth(JOYSTICK_CONFIG.DEPTH_KNOB);
        this.joystickKnob.setScale(0);
        
        // 出现动画
        this.appearTween = this.scene.tweens.add({
            targets: [this.joystickBase, this.joystickKnob],
            scale: 1,
            alpha: { from: 0, to: 1 },
            duration: JOYSTICK_CONFIG.ANIMATION.APPEAR_DURATION,
            ease: 'Back.easeOut'
        });
    }
    
    endDynamicJoystickDrag() {
        this.isDragging = false;
        
        // 清理动态摇杆
        if (this.isDynamicJoystick) {
            // 消失动画
            this.scene.tweens.add({
                targets: [this.joystickBase, this.joystickKnob],
                scale: 0,
                alpha: 0,
                duration: JOYSTICK_CONFIG.ANIMATION.RETURN_DURATION,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.joystickBase) this.joystickBase.destroy();
                    if (this.joystickKnob) this.joystickKnob.destroy();
                    this.joystickBase = null;
                    this.joystickKnob = null;
                    this.isDynamicJoystick = false;
                }
            });
        }
        
        // 重置输入状态
        this.resetTouchInput();
    }

    // 暂停控制器
    pause() {
        this.isPaused = true;
        
        // 如果有正在进行的动态摇杆操作，立即结束
        if (this.isDragging && this.isDynamicJoystick) {
            this.endDynamicJoystickDrag();
        }
        
        // 重置所有输入状态
        this.resetTouchInput();
        this.isDragging = false;
        this.isTouch = false;
        
        console.log('TouchControls paused');
    }
    
    // 恢复控制器
    resume() {
        this.isPaused = false;
        console.log('TouchControls resumed');
    }
}