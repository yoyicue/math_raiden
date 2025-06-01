import { UI_CONFIG } from '../utils/Constants.js';

export default class HealthBar {
    constructor(scene, x, y, maxHp, width = 40, height = 6) {
        this.scene = scene;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.width = width;
        this.height = height;
        
        // 创建血条容器
        this.container = scene.add.container(x, y);
        
        // 背景条（黑色）
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        this.background.setStrokeStyle(1, 0x333333);
        
        // 血量条（红色到绿色渐变）
        this.healthBar = scene.add.rectangle(-width/2, 0, width, height - 2, 0x00ff00);
        this.healthBar.setOrigin(0, 0.5);
        
        // 添加到容器
        this.container.add([this.background, this.healthBar]);
        
        // 设置深度，确保在敌机上方显示
        this.container.setDepth(10);
        
        // 初始状态隐藏
        this.container.setVisible(false);
    }
    
    // 更新血条位置
    updatePosition(x, y) {
        this.container.setPosition(x, y - 35); // 在敌机上方显示
    }
    
    // 更新血量
    updateHealth(currentHp) {
        this.currentHp = Math.max(0, currentHp);
        const healthPercent = this.currentHp / this.maxHp;
        
        // 更新血条宽度
        const newWidth = this.width * healthPercent;
        this.healthBar.setSize(newWidth, this.height - 2);
        
        // 根据血量百分比改变颜色
        let color;
        if (healthPercent > 0.6) {
            color = 0x00ff00; // 绿色
        } else if (healthPercent > 0.3) {
            color = 0xffff00; // 黄色
        } else {
            color = 0xff0000; // 红色
        }
        this.healthBar.setFillStyle(color);
        
        // 只有在血量为0时才隐藏血条，其他情况保持显示状态
        if (healthPercent <= 0) {
            this.container.setVisible(false);
        }
    }
    
    // 显示血条
    show() {
        if (this.currentHp < this.maxHp && this.currentHp > 0) {
            this.container.setVisible(true);
        }
    }
    
    // 隐藏血条
    hide() {
        this.container.setVisible(false);
    }
    
    // 销毁血条
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
    
    // 设置深度
    setDepth(depth) {
        this.container.setDepth(depth);
    }
    
    // 获取是否可见
    get visible() {
        return this.container.visible;
    }
    
    // 设置可见性
    set visible(value) {
        this.container.setVisible(value);
    }
} 