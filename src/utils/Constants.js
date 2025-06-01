// 游戏基础配置
export const GAME_CONFIG = {
    WIDTH: 600,
    HEIGHT: 800,
    FPS: 60
};

// 玩家配置
export const PLAYER_CONFIG = {
    SPEED: 300,
    MAX_LIVES: 5,
    MAX_SHIELD: 25,
    MAX_WEAPON_LEVEL: 3,
    MAX_MISSILES: 100,
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
            hp: 2,  // 增加到2血，便于测试血条
            speed: 2,
            shootInterval: 90,     // 降低射击频率
            score: 10,
            color: 0xff0000
        },
        FAST: {
            hp: 2,  // 增加到2血，便于测试血条
            speed: 4,
            shootInterval: 75,     // 降低射击频率
            score: 15,
            color: 0xff6600
        },
        TANK: {
            hp: 4,  // 增加到4血，更明显的血条效果
            speed: 1,
            shootInterval: 120,    // 降低射击频率
            score: 25,
            color: 0x666666
        },
        SHOOTER: {
            hp: 3,  // 增加到3血，更明显的血条效果
            speed: 2,
            shootInterval: 50,     // 降低射击频率
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
            dropRate: 0.25,      // 提高武器升级掉落率
            glow: {
                intensity: 0.8,
                pulseSpeed: 300,
                effects: ['pulse']
            }
        },
        SHIELD: { 
            color: 0x00ffff, 
            name: '护盾', 
            icon: '🛡️',
            dropRate: 0.25,      // 提高护盾掉落率
            glow: {
                intensity: 0.7,
                pulseSpeed: 800,
                effects: ['pulse']
            }
        },
        LIFE: { 
            color: 0xff00ff, 
            name: '生命值', 
            icon: '❤️',
            dropRate: 0.2,       // 提高生命值掉落率
            glow: {
                intensity: 0.8,
                pulseSpeed: 600,
                scaleAmount: 1.2,
                effects: ['heartbeat']
            }
        },
        BOMB: { 
            color: 0xff4444, 
            name: '清屏炸弹', 
            icon: '💥',
            dropRate: 0.15,      // 提高清屏炸弹掉落率
            glow: {
                intensity: 0.9,
                pulseSpeed: 200,
                effects: ['danger_flash']
            }
        },
        MISSILE: { 
            color: 0x00ff00, 
            name: '追踪导弹', 
            icon: '🚀',
            dropRate: 0.1,       // 降低导弹掉落率，避免过于强力
            glow: {
                intensity: 0.9,
                pulseSpeed: 1000,
                scaleAmount: 1.5,
                effects: ['energy_charge']
            }
        },
        SCORE: { 
            color: 0xffd700, 
            name: '分数奖励', 
            icon: '⭐',
            dropRate: 0.05,      // 降低分数奖励掉落率
            glow: {
                intensity: 0.9,
                colorChangeSpeed: 50,
                effects: ['rainbow']
            }
        }
    },
    DROP_CHANCE: 0.4,  // 提高到40%概率掉落道具
    SPEED: 90,
    GLOW_RADIUS: 20,
    GLOW_LAYERS: 5,    // 发光层数
    GLOW_CONFIG: {
        LAYER_ALPHA_MULTIPLIERS: [0.8, 0.6, 0.4, 0.2, 0.1],
        LAYER_RADIUS_MULTIPLIERS: [0.3, 0.5, 0.7, 0.9, 1.0]
    }
};

// 武器配置
export const WEAPON_CONFIG = {
    BULLET_SPEED: 600,
    ENEMY_BULLET_SPEED: 250,        // 降低敌机子弹速度
    MISSILE_SPEED: 350,             // 稍微降低导弹速度
    MISSILE_TURN_SPEED: 0.15,       // 提高导弹转向速度，让追踪效果更明显
    MISSILE_LIFETIME: 5000,         // 导弹生命周期5秒
    MISSILE_TARGET_SEARCH_INTERVAL: 500,  // 目标查找间隔500ms
    MISSILE_TARGET_RANGE: 450,      // 导弹目标搜索范围
    SHOOT_INTERVALS: {
        PLAYER: 180,    // 稍微提高玩家射击频率
        MISSILE: 800    // 降低导弹发射间隔
    }
};

// 口算题配置
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
            score: 150,             // 提高答对题目的分数奖励
            invulnerableTime: 240   // 延长无敌时间
        },
        INCORRECT: {
            invulnerableTime: 90    // 答错也给更多无敌时间
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