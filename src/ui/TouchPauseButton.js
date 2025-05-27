export default class TouchPauseButton {
    constructor(scene) {
        this.scene = scene;
        this.button = null;
        this.icon = null;
        this.isPaused = false;
        this.isVisible = false;
        
        this.createPauseButton();
    }
    
    createPauseButton() {
        // 暂停按钮位置（右上角）
        const x = this.scene.game.config.width - 50;
        const y = 50;
        
        // 创建按钮背景
        this.button = this.scene.add.circle(x, y, 25, 0x333333, 0.8);
        this.button.setStrokeStyle(2, 0xffffff, 0.8);
        this.button.setScrollFactor(0);
        this.button.setDepth(1500);
        this.button.setInteractive({ useHandCursor: true });
        
        // 创建暂停图标
        this.icon = this.scene.add.text(x, y, '⏸️', {
            fontSize: '20px'
        });
        this.icon.setOrigin(0.5);
        this.icon.setScrollFactor(0);
        this.icon.setDepth(1501);
        
        // 添加交互效果
        this.setupInteractions();
        
        // 默认隐藏
        this.setVisible(false);
    }
    
    setupInteractions() {
        // 悬停效果
        this.button.on('pointerover', () => {
            this.button.setFillStyle(0x555555, 0.9);
            this.scene.tweens.add({
                targets: [this.button, this.icon],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        this.button.on('pointerout', () => {
            this.button.setFillStyle(0x333333, 0.8);
            this.scene.tweens.add({
                targets: [this.button, this.icon],
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power2'
            });
        });
        
        // 点击效果
        this.button.on('pointerdown', () => {
            // 按下动画
            this.scene.tweens.add({
                targets: [this.button, this.icon],
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 50,
                yoyo: true,
                ease: 'Power2'
            });
            
            // 触发暂停
            this.togglePause();
            
            // 震动反馈（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        // 更新图标
        this.updateIcon();
        
        // 调用场景的暂停方法
        if (this.scene.togglePause) {
            this.scene.togglePause();
        }
        
        // 视觉反馈
        this.showFeedback();
    }
    
    updateIcon() {
        if (this.isPaused) {
            this.icon.setText('▶️'); // 播放图标
            this.button.setStrokeStyle(2, 0x00ff00, 1); // 绿色边框
        } else {
            this.icon.setText('⏸️'); // 暂停图标
            this.button.setStrokeStyle(2, 0xffffff, 0.8); // 白色边框
        }
    }
    
    showFeedback() {
        // 创建反馈文字
        const feedbackText = this.scene.add.text(
            this.button.x,
            this.button.y - 50,
            this.isPaused ? '游戏暂停' : '游戏继续',
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: this.isPaused ? '#ffff00' : '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        feedbackText.setOrigin(0.5);
        feedbackText.setDepth(1600);
        feedbackText.setScrollFactor(0);
        
        // 反馈动画
        feedbackText.setAlpha(0);
        this.scene.tweens.add({
            targets: feedbackText,
            alpha: 1,
            y: feedbackText.y - 20,
            duration: 300,
            ease: 'Power2'
        });
        
        // 自动消失
        this.scene.time.delayedCall(1500, () => {
            this.scene.tweens.add({
                targets: feedbackText,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => feedbackText.destroy()
            });
        });
    }
    
    // 设置暂停状态（外部调用）
    setPaused(paused) {
        if (this.isPaused !== paused) {
            this.isPaused = paused;
            this.updateIcon();
        }
    }
    
    // 显示/隐藏按钮
    setVisible(visible) {
        this.isVisible = visible;
        this.button.setVisible(visible);
        this.icon.setVisible(visible);
        
        if (visible) {
            // 显示动画
            this.button.setAlpha(0);
            this.icon.setAlpha(0);
            
            this.scene.tweens.add({
                targets: [this.button, this.icon],
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
        }
    }
    
    // 脉冲提示动画（提醒用户注意暂停按钮）
    showPulse() {
        if (!this.isVisible) return;
        
        this.scene.tweens.add({
            targets: [this.button, this.icon],
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 500,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });
        
        // 临时改变颜色
        this.button.setStrokeStyle(2, 0xffff00, 1);
        this.scene.time.delayedCall(1500, () => {
            this.button.setStrokeStyle(2, 0xffffff, 0.8);
        });
    }
    
    destroy() {
        if (this.button) {
            this.button.destroy();
            this.button = null;
        }
        
        if (this.icon) {
            this.icon.destroy();
            this.icon = null;
        }
        
        this.isVisible = false;
        this.isPaused = false;
    }
} 