// 游戏基础配置
export const GAME_CONFIG = {
    WIDTH: 600,
    HEIGHT: 800,
    FPS: 60
};

// 玩家配置
export const PLAYER_CONFIG = {
    SPEED: 300,
    MAX_LIVES: 3,
    MAX_SHIELD: 100,
    MAX_WEAPON_LEVEL: 3,
    MAX_MISSILES: 999,
    INVULNERABLE_TIME: {
        SHIELD_HIT: 60,  // 1秒 (60帧)
        LIFE_HIT: 120    // 2秒
    },
    // 移动控制优化参数
    MOVEMENT: {
        INPUT_SMOOTHING: 0.15,      // 输入平滑系数 (0-1, 越小越平滑)
        ACCELERATION: 2000,         // 加速度
        DRAG: 500,                  // 阻力
        VELOCITY_THRESHOLD: 50,     // 速度阈值，用于判断是否接近目标速度
        STOP_THRESHOLD: 10          // 停止阈值，速度低于此值时直接停止
    }
};

// 敌机配置
export const ENEMY_CONFIG = {
    TYPES: {
        BASIC: {
            hp: 1,
            speed: 2,
            shootInterval: 60,
            score: 10,
            color: 0xff0000
        },
        FAST: {
            hp: 1,
            speed: 4,
            shootInterval: 45,
            score: 15,
            color: 0xff6600
        },
        TANK: {
            hp: 3,
            speed: 1,
            shootInterval: 90,
            score: 25,
            color: 0x666666
        },
        SHOOTER: {
            hp: 2,
            speed: 2,
            shootInterval: 30,
            score: 20,
            color: 0x9900ff
        }
    },
    SPAWN_WEIGHTS: {
        BASIC: 0.5,
        FAST: 0.3,
        TANK: 0.1,
        SHOOTER: 0.1
    }
};

// 道具配置
export const POWERUP_CONFIG = {
    TYPES: {
        WEAPON: { 
            color: 0xffff00, 
            name: '武器升级', 
            icon: '⚡',
            dropRate: 0.2
        },
        SHIELD: { 
            color: 0x00ffff, 
            name: '护盾', 
            icon: '🛡️',
            dropRate: 0.2
        },
        LIFE: { 
            color: 0xff00ff, 
            name: '生命值', 
            icon: '❤️',
            dropRate: 0.15
        },
        BOMB: { 
            color: 0xff4444, 
            name: '清屏炸弹', 
            icon: '💥',
            dropRate: 0.1
        },
        MISSILE: { 
            color: 0x00ff00, 
            name: '追踪导弹', 
            icon: '🚀',
            dropRate: 0.2
        },
        SCORE: { 
            color: 0xffd700, 
            name: '分数奖励', 
            icon: '⭐',
            dropRate: 0.15
        }
    },
    DROP_CHANCE: 0.3,  // 30%概率掉落道具
    SPEED: 90,
    GLOW_RADIUS: 20
};

// 武器配置
export const WEAPON_CONFIG = {
    BULLET_SPEED: 600,
    ENEMY_BULLET_SPEED: 300,
    MISSILE_SPEED: 400,
    MISSILE_TURN_SPEED: 0.1,
    SHOOT_INTERVALS: {
        PLAYER: 200,    // 毫秒
        MISSILE: 1000   // 毫秒
    }
};

// 数学题配置
export const MATH_CONFIG = {
    GRADES: {
        1: {
            name: 'G1 - 10以内加减法',
            maxNumber: 10,
            operations: ['addition', 'subtraction']
        },
        2: {
            name: 'G2 - 20以内加减法',
            maxNumber: 20,
            operations: ['addition', 'subtraction']
        },
        3: {
            name: 'G3 - 乘法运算',
            maxNumber: 10,
            operations: ['multiplication']
        }
    },
    REWARDS: {
        CORRECT: {
            score: 100,
            invulnerableTime: 180
        },
        INCORRECT: {
            invulnerableTime: 60
        }
    }
};

// UI配置
export const UI_CONFIG = {
    COLORS: {
        PRIMARY: '#00ff00',
        SECONDARY: '#ff6600',
        WARNING: '#ff0000',
        INFO: '#00ffff',
        TEXT: '#ffffff',
        DISABLED: '#666666'
    },
    FONTS: {
        PRIMARY: 'Arial',
        SIZE: {
            SMALL: '14px',
            NORMAL: '18px',
            LARGE: '24px',
            TITLE: '48px'
        }
    },
    ANIMATION: {
        FADE_DURATION: 300,
        SCALE_DURATION: 500,
        BOUNCE_DURATION: 200
    }
}; 