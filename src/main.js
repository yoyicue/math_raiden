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
    
    // 确保容器存在且有尺寸
    if (!container) {
        console.error('Game container not found!');
        return { width: 600, height: 800 }; // 返回默认尺寸
    }
    
    const containerWidth = container.clientWidth || container.offsetWidth || window.innerWidth;
    const containerHeight = container.clientHeight || container.offsetHeight || window.innerHeight;
    
    console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
    
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
        // 桌面端：使用固定尺寸或按比例缩放
        const targetWidth = 600;
        const targetHeight = 800;
        
        // 如果容器尺寸异常小，使用默认尺寸
        if (containerWidth < 100 || containerHeight < 100) {
            console.warn('Container size too small, using default dimensions');
            return { width: targetWidth, height: targetHeight };
        }
        
        // 保持比例，选择较小的缩放因子
        const scaleX = containerWidth / targetWidth;
        const scaleY = containerHeight / targetHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 不超过原始尺寸
        
        // 确保最小尺寸
        const minScale = 0.3; // 最小缩放到30%
        const finalScale = Math.max(scale, minScale);
        
        const width = Math.round(targetWidth * finalScale);
        const height = Math.round(targetHeight * finalScale);
        
        console.log('桌面端尺寸计算:', {
            container: { width: containerWidth, height: containerHeight },
            target: { width: targetWidth, height: targetHeight },
            scale: { x: scaleX, y: scaleY, calculated: scale, final: finalScale },
            final: { width, height }
        });
        
        return { width, height };
    }
}

// 确保DOM加载完成后再初始化游戏
function initializeGame() {
    const gameDimensions = getGameDimensions();
    
    console.log('Initializing game with dimensions:', gameDimensions);
    
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
    return new Phaser.Game(config);
}

// 等待DOM加载完成
let game;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = initializeGame();
    });
} else {
    game = initializeGame();
}

// 窗口大小变化监听器
function handleResize() {
    if (!game) return; // 游戏还未初始化
    
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