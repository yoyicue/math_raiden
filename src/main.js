import Phaser from 'phaser';
import { GAME_CONFIG } from './utils/Constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import MathQuestionScene from './scenes/MathQuestionScene.js';

const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
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
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('游戏错误:', event.error);
});

export default game; 