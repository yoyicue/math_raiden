import Missile from '../objects/Missile.js';

export default class MissileManager {
    constructor(scene) {
        this.scene = scene;
        this.missiles = scene.physics.add.group({
            classType: Missile,
            maxSize: 20,
            runChildUpdate: true
        });
        
        // 预创建一些导弹实例
        for (let i = 0; i < 10; i++) {
            const missile = new Missile(scene, 0, 0);
            this.missiles.add(missile);
        }
    }
    
    fireMissile(x, y) {
        // 获取一个不活跃的导弹
        const missile = this.missiles.getFirstDead(false);
        
        if (missile) {
            missile.fire(x, y);
            return missile;
        }
        
        // 如果没有可用的导弹，创建一个新的
        if (this.missiles.children.size < this.missiles.maxSize) {
            const newMissile = new Missile(this.scene, x, y);
            this.missiles.add(newMissile);
            newMissile.fire(x, y);
            return newMissile;
        }
        
        return null;
    }
    
    update() {
        // 更新所有活跃的导弹
        this.missiles.children.entries.forEach(missile => {
            if (missile.active) {
                missile.update();
            }
        });
    }
    
    getMissiles() {
        return this.missiles;
    }
    
    reset() {
        this.missiles.children.entries.forEach(missile => {
            if (missile.active) {
                missile.deactivate();
            }
        });
    }
} 