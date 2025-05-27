export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gradeLevel = data.gradeLevel || 1;
        console.log('游戏开始，难度等级:', this.gradeLevel);
    }

    create() {
        // 背景
        this.add.rectangle(300, 400, 600, 800, 0x001122);
        
        // 星空背景
        this.createStarField();
        
        // 临时显示信息
        this.add.text(300, 200, '游戏场景', {
            fontSize: '48px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(300, 300, `难度等级: G${this.gradeLevel}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(300, 400, '按 ESC 返回主菜单', {
            fontSize: '18px',
            color: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // ESC键返回主菜单
        this.escKey.on('down', () => {
            this.scene.start('MenuScene');
        });
        
        // 淡入效果
        this.cameras.main.fadeIn(300, 0, 0, 0);
    }
    
    createStarField() {
        // 创建星空背景
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 600;
            const y = Math.random() * 800;
            const star = this.add.circle(x, y, Math.random() * 2, 0xffffff, Math.random() * 0.8 + 0.2);
            
            // 星星闪烁动画
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    update() {
        // 临时更新逻辑
    }
} 