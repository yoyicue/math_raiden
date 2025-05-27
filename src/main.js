import Phaser from 'phaser';
import { GAME_CONFIG } from './utils/Constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import MathQuestionScene from './scenes/MathQuestionScene.js';

// 获取实际屏幕尺寸
function getGameDimensions() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // 移动端使用全屏，桌面端使用固定比例
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 移动端：使用可视区域尺寸，考虑浏览器UI
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 检测是否有安全区域支持
        const safeAreaInsetTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
        const safeAreaInsetBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
        
        // 为移动端浏览器UI预留空间
        const reservedTop = Math.max(safeAreaInsetTop, 20); // 状态栏预留，最少20px
        const reservedBottom = Math.max(safeAreaInsetBottom, 30); // 底部预留，最少30px
        
        // 计算可用尺寸
        const availableWidth = viewportWidth;
        const availableHeight = viewportHeight - reservedTop - reservedBottom;
        
        // 确保最小尺寸
        const minWidth = 320;
        const minHeight = 480;
        
        const width = Math.max(Math.min(availableWidth, containerWidth), minWidth);
        const height = Math.max(Math.min(availableHeight, containerHeight), minHeight);
        
        console.log('移动端尺寸计算:', {
            viewport: { width: viewportWidth, height: viewportHeight },
            container: { width: containerWidth, height: containerHeight },
            safeArea: { top: reservedTop, bottom: reservedBottom },
            available: { width: availableWidth, height: availableHeight },
            final: { width, height }
        });
        
        return { width, height };
    } else {
        // 桌面端：保持16:9比例，最大不超过容器尺寸
        const aspectRatio = 9 / 16; // 竖屏游戏
        let width = Math.min(600, containerWidth);
        let height = width / aspectRatio;
        
        if (height > containerHeight) {
            height = containerHeight;
            width = height * aspectRatio;
        }
        
        return { width, height };
    }
}

const gameDimensions = getGameDimensions();

const config = {
    type: Phaser.AUTO,
    width: gameDimensions.width,
    height: gameDimensions.height,
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameDimensions.width,
        height: gameDimensions.height
    },
    dom: {
        createContainer: true
    },
    scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene, MathQuestionScene]
};

// 移除加载文本
const loadingElement = document.querySelector('.loading');
if (loadingElement) {
    loadingElement.remove();
}

// 创建游戏实例
const game = new Phaser.Game(config);

// 窗口大小变化监听器
function handleResize() {
    const newDimensions = getGameDimensions();
    
    // 更新游戏尺寸
    game.scale.resize(newDimensions.width, newDimensions.height);
    
    console.log('游戏尺寸已更新:', newDimensions);
}

// 监听窗口大小变化（防抖处理）
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 100);
});

// 监听设备方向变化
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 500); // 延迟处理，等待方向变化完成
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('游戏错误:', event.error);
});

export default game; 