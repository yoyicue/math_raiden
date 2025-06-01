import { MATH_CONFIG, POWERUP_CONFIG, PLAYER_CONFIG } from '../utils/Constants.js';

export default class MathSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentQuestion = null;
        this.currentPowerType = null;
        this.gradeLevel = 1;
        this.questionCount = 0;
        this.correctAnswers = 0;

        // 辅助方法：获取随机整数
        this.getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        this.shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };
    }
    
    setGradeLevel(level) {
        this.gradeLevel = Math.max(1, Math.min(3, level));
    }
    
    generateQuestion(grade = this.gradeLevel) {
        let questionData = null;
        const questionGenerators = {
            1: this.getG1Generators(),
            2: this.getG2Generators(),
            3: this.getG3Generators(),
        };

        const generatorsForGrade = questionGenerators[grade] || questionGenerators[1];
        const randomGenerator = generatorsForGrade[this.getRandomInt(0, generatorsForGrade.length - 1)];
        
        try {
            questionData = randomGenerator();
        } catch (error) {
            console.error(`生成G${grade}题目时出错:`, error);
            // 回退到简单题目
            const a = this.getRandomInt(1, 5);
            const b = this.getRandomInt(1, 5);
            questionData = { question: `${a} + ${b} = ?`, answer: a + b, type: 'fallback_addition', operands: [a, b] };
        }
        
        // 确保questionData不为null
        if (!questionData) {
             console.warn(`G${grade}生成器返回null，使用回退题目`);
             const a = this.getRandomInt(1, 5);
             const b = this.getRandomInt(1, 5);
             questionData = { question: `${a} + ${b} = ?`, answer: a + b, type: 'fallback_addition', operands: [a,b] };
        }

        return questionData;
    }
    
    // --- G1 题目生成器 ---
    getG1Generators() {
        return [
            () => this.generateG1_SimpleAddSub(10, 20), // 涵盖10以内加减、十几减几、凑十法 (如 8+5, 15-6)
            () => this.generateG1_ChainedAddition20(),   // 如 7+5+3
            () => this.generateG1_2DigitPlus1DigitNoCarry(), // 如 24+5
            () => this.generateG1_2DigitMinus1DigitNoBorrow(), // 如 36-4
            () => this.generateG1_TensAdditionSubtraction(), // 如 10+20, 30-10
            () => this.generateG1_2DigitPlusMinusTens()  // 如 45-20, 23+30
        ];
    }

    generateG1_SimpleAddSub(maxOperandSimple, maxOperandComplex) {
        const type = Math.random();
        let a, b, question, answer;

        if (type < 0.33) { // 简单加法 (如 3+4)
            a = this.getRandomInt(1, maxOperandSimple - 1);
            b = this.getRandomInt(1, maxOperandSimple - a);
            question = `${a} + ${b} = ?`;
            answer = a + b;
        } else if (type < 0.66) { // 简单减法 (如 7-3) 或十几减几 (如 15-6)
            a = this.getRandomInt(2, maxOperandComplex);
            b = this.getRandomInt(1, a - 1); // 确保b < a且结果至少为1
            question = `${a} - ${b} = ?`;
            answer = a - b;
        } else { // 可能涉及"凑十法"或结果为十几的加法 (如 8+5)
            a = this.getRandomInt(1, maxOperandSimple);
            b = this.getRandomInt(1, maxOperandSimple);
            // 确保和在合理的G1范围内，如不超过20
            while (a + b > maxOperandComplex) {
                 a = this.getRandomInt(1, maxOperandSimple);
                 b = this.getRandomInt(1, maxOperandSimple);
            }
            question = `${a} + ${b} = ?`;
            answer = a + b;
        }
        return { question, answer, type: 'G1_SimpleAddSub', operands: [a, b] };
    }

    generateG1_ChainedAddition20() {
        const num1 = this.getRandomInt(1, 9);
        const num2 = this.getRandomInt(1, 9);
        const num3 = this.getRandomInt(1, Math.max(1, 20 - num1 - num2)); // 确保和约为20
        const question = `${num1} + ${num2} + ${num3} = ?`;
        const answer = num1 + num2 + num3;
        return { question, answer, type: 'G1_ChainedAddition', operands: [num1, num2, num3] };
    }

    generateG1_2DigitPlus1DigitNoCarry() {
        const d2 = this.getRandomInt(10, 98); // 两位数
        const d1 = this.getRandomInt(1, 9);   // 一位数
        // 确保不进位：d2的个位数 + d1 < 10
        if ((d2 % 10) + d1 >= 10) {
            // 如果进位则重新生成
            return this.generateG1_2DigitPlus1DigitNoCarry();
        }
        const question = `${d2} + ${d1} = ?`;
        const answer = d2 + d1;
        return { question, answer, type: 'G1_2D1D_NoCarry_Add', operands: [d2, d1] };
    }

    generateG1_2DigitMinus1DigitNoBorrow() {
        const d2 = this.getRandomInt(10, 99);
        const d1 = this.getRandomInt(1, 9);
        // 确保不退位：d2的个位数 >= d1
        if ((d2 % 10) < d1) {
            return this.generateG1_2DigitMinus1DigitNoBorrow();
        }
        const question = `${d2} - ${d1} = ?`;
        const answer = d2 - d1;
        return { question, answer, type: 'G1_2D1D_NoBorrow_Sub', operands: [d2, d1] };
    }

    generateG1_TensAdditionSubtraction() {
        const t1 = this.getRandomInt(1, 9) * 10;
        const t2 = this.getRandomInt(1, 9) * 10;
        if (Math.random() < 0.5 || t1 <= t2) { // 加法或确保t1 > t2用于减法
            const question = `${t1} + ${t2} = ?`;
            const answer = t1 + t2;
            return { question, answer, type: 'G1_Tens_Add', operands: [t1, t2] };
        } else {
            const question = `${t1} - ${t2} = ?`;
            const answer = t1 - t2;
            return { question, answer, type: 'G1_Tens_Sub', operands: [t1, t2] };
        }
    }

    generateG1_2DigitPlusMinusTens() {
        const d2 = this.getRandomInt(11, 99); // 避免纯整十数
        const t1 = this.getRandomInt(1, Math.floor((99-d2)/10) > 0 ? Math.floor((99-d2)/10) : 1 ) * 10; // 确保和 < 100
        const t2 = this.getRandomInt(1, Math.floor(d2/10)-1 > 0 ? Math.floor(d2/10)-1 : 1) * 10; // 确保d2 > t2

        if (Math.random() < 0.5) {
            const question = `${d2} + ${t1} = ?`;
            const answer = d2 + t1;
            return { question, answer, type: 'G1_2DTens_Add', operands: [d2, t1] };
        } else {
            const question = `${d2} - ${t2} = ?`;
            const answer = d2 - t2;
            return { question, answer, type: 'G1_2DTens_Sub', operands: [d2, t2] };
        }
    }

    // --- G2 题目生成器 ---
    getG2Generators() {
        return [
            () => this.generateG2_2DigitAddSub(), // 涵盖100以内(不)进位加法/(不)退位减法
            () => this.generateG2_2DigitPlus1DigitCarry(),
            () => this.generateG2_2DigitMinus1DigitBorrow(),
            () => this.generateG2_ChainedSubtraction100(),
            () => this.generateG2_MixedOrderNoParentheses(),
            () => this.generateG2_MixedAddSubComplex(),
            () => this.generateG2_ChainedAdditionComplex(),
            () => this.generateG2_MixedOrderWithParentheses()
        ];
    }
    
    generateG2_2DigitAddSub() { // 涵盖各种两位数+/-两位数，结果在100以内
        const opType = this.getRandomInt(1, 4);
        let n1 = this.getRandomInt(10, 99);
        let n2 = this.getRandomInt(10, 99);
        let question, answer;

        switch (opType) {
            case 1: // 进位加法 48+26
                n1 = this.getRandomInt(10, 89); // 确保n1+n2可以<100且有进位
                n2 = this.getRandomInt(10, 99 - n1);
                while ((n1 % 10) + (n2 % 10) < 10 || n1 + n2 >= 100) { // 确保进位且和 < 100
                    n1 = this.getRandomInt(10, 89);
                    n2 = this.getRandomInt(10, 99 - n1);
                }
                question = `${n1} + ${n2} = ?`;
                answer = n1 + n2;
                break;
            case 2: // 不进位加法 16+42
                n1 = this.getRandomInt(10, 89);
                n2 = this.getRandomInt(10, 99 - n1);
                 while ((n1 % 10) + (n2 % 10) >= 10 || n1 + n2 >= 100) { // 确保不进位且和 < 100
                    n1 = this.getRandomInt(10, 89);
                    n2 = this.getRandomInt(10, 99 - n1);
                }
                question = `${n1} + ${n2} = ?`;
                answer = n1 + n2;
                break;
            case 3: // 退位减法 43-28
                n1 = this.getRandomInt(20, 99);
                n2 = this.getRandomInt(10, n1 -1);
                while ((n1 % 10) >= (n2 % 10) || n1 - n2 <= 0) { // 确保退位且n1 > n2
                     n1 = this.getRandomInt(20, 99);
                     n2 = this.getRandomInt(10, n1 -1);
                }
                question = `${n1} - ${n2} = ?`;
                answer = n1 - n2;
                break;
            case 4: // 不退位减法 78-36
                n1 = this.getRandomInt(20, 99);
                n2 = this.getRandomInt(10, n1 - 1);
                while ((n1 % 10) < (n2 % 10) || n1 - n2 <= 0) { // 确保不退位且n1 > n2
                     n1 = this.getRandomInt(20, 99);
                     n2 = this.getRandomInt(10, n1-1);
                }
                question = `${n1} - ${n2} = ?`;
                answer = n1 - n2;
                break;
        }
        return { question, answer, type: 'G2_2D_AddSub', operands: [n1, n2] };
    }

    generateG2_2DigitPlus1DigitCarry() { // 如 46+7
        let d2 = this.getRandomInt(10, 89); // 最大89确保和 < 100
        let d1 = this.getRandomInt(1, 9);
        while ((d2 % 10) + d1 < 10 || d2 + d1 >= 100) { // 确保进位且和 < 100
            d2 = this.getRandomInt(10, 89);
            d1 = this.getRandomInt(1, 9);
        }
        const question = `${d2} + ${d1} = ?`;
        const answer = d2 + d1;
        return { question, answer, type: 'G2_2D1D_Carry_Add', operands: [d2, d1] };
    }

    generateG2_2DigitMinus1DigitBorrow() { // 如 41-8
        let d2 = this.getRandomInt(11, 99); // 最小11
        let d1 = this.getRandomInt(1, 9);
        while ((d2 % 10) >= d1 || d2 - d1 <=0 ) { // 确保退位
            d2 = this.getRandomInt(11, 99);
            d1 = this.getRandomInt(1, 9);
        }
        const question = `${d2} - ${d1} = ?`;
        const answer = d2 - d1;
        return { question, answer, type: 'G2_2D1D_Borrow_Sub', operands: [d2, d1] };
    }
    
    generateG2_ChainedSubtraction100() { // 如 76-27-43
        let n1 = this.getRandomInt(50, 99);
        let n2 = this.getRandomInt(10, n1 - 20); // 确保n1-n2相当大
        let n3 = this.getRandomInt(10, n1 - n2 - 1); // 确保正结果
         while(n1-n2-n3 <=0){
            n1 = this.getRandomInt(50, 99);
            n2 = this.getRandomInt(10, n1 - 20);
            n3 = this.getRandomInt(10, n1 - n2 - 1);
        }
        const question = `${n1} - ${n2} - ${n3} = ?`;
        const answer = n1 - n2 - n3;
        return { question, answer, type: 'G2_ChainedSub100', operands: [n1, n2, n3] };
    }

    generateG2_MixedOrderNoParentheses() { // 如 34+5×8
        const n1 = this.getRandomInt(1, 9); // 用于乘法
        const n2 = this.getRandomInt(1, 9); // 用于乘法
        const n3 = this.getRandomInt(1, 50);
        const product = n1 * n2;
        let question, answer;
        if (Math.random() < 0.5) { // 先加后乘，或先乘后加
            question = `${n3} + ${n1} × ${n2} = ?`;
            answer = n3 + product;
        } else { // 先减后乘，或先乘后减
            if (n3 > product) {
                question = `${n3} - ${n1} × ${n2} = ?`;
                answer = n3 - product;
            } else {
                 question = `${n1} × ${n2} - ${n3} = ?`;
                 answer = product - n3;
                 if(answer < 0) { // 避免负结果
                    return this.generateG2_MixedOrderNoParentheses();
                 }
            }
        }
        return { question, answer, type: 'G2_Mixed_NoParen', operands: [n3, n1, n2] };
    }

    generateG2_MixedAddSubComplex() { // 如 46+49-26
        const n1 = this.getRandomInt(20, 80);
        const n2 = this.getRandomInt(10, 50);
        const n3 = this.getRandomInt(10, n1 + n2 - 10 > 10 ? n1 + n2 - 10 : 20);
        
        let question = `${n1} + ${n2} - ${n3} = ?`;
        let answer = n1 + n2 - n3;
        
        if (answer <=0 || n1+n2 >= 100) return this.generateG2_MixedAddSubComplex(); // 重新生成有效结果

        return { question, answer, type: 'G2_MixedAddSubC', operands: [n1,n2,n3] };
    }
    
    generateG2_ChainedAdditionComplex() { // 如 17+15+23 (和 < 100)
        const n1 = this.getRandomInt(10, 30);
        const n2 = this.getRandomInt(10, 30);
        const n3 = this.getRandomInt(10, 99 - n1 - n2 > 10 ? 99 - n1 - n2 : 30);
        if(n1+n2+n3 >=100) return this.generateG2_ChainedAdditionComplex();
        const question = `${n1} + ${n2} + ${n3} = ?`;
        const answer = n1 + n2 + n3;
        return { question, answer, type: 'G2_ChainedAddC', operands: [n1,n2,n3] };
    }

    generateG2_MixedOrderWithParentheses() { // 如 6×(2+4)
        const n1 = this.getRandomInt(1, 9);
        const n2 = this.getRandomInt(1, 9);
        const n3 = this.getRandomInt(1, 9);
        let question, answer;

        if (Math.random() < 0.5) { // (a+b)×c
            question = `(${n1} + ${n2}) × ${n3} = ?`;
            answer = (n1 + n2) * n3;
        } else { // a×(b+c)
            question = `${n1} × (${n2} + ${n3}) = ?`;
            answer = n1 * (n2 + n3);
        }
         if(answer >=100) return this.generateG2_MixedOrderWithParentheses();
        return { question, answer, type: 'G2_Mixed_Paren', operands: [n1, n2, n3] };
    }

    // --- G3 题目生成器 ---
    getG3Generators() { // 排除分数题
        return [
            () => this.generateG3_2DigitTimes11(),
            () => this.generateG3_LargeNumTimes1Digit(),
            () => this.generateG3_TeensTimesTeens(),
            () => this.generateG3_XX1TimesYY1(),
            () => this.generateG3_2DigitTimes99(),
            () => this.generateG3_2DigitTimes101(),
            () => this.generateG3_HeadSameTailSum10(),
            () => this.generateG3_TailSameHeadSum10(),
            () => this.generateG3_3DigitTimes11()
        ];
    }

    generateG3_2DigitTimes11() {
        const n = this.getRandomInt(10, 99);
        return { question: `${n} × 11 = ?`, answer: n * 11, type: 'G3_2Dx11', operands: [n, 11] };
    }

    generateG3_LargeNumTimes1Digit() {
        const magnitude = [10, 100, 1000][this.getRandomInt(0, 2)];
        const n1 = this.getRandomInt(1, 9) * magnitude;
        const n2 = this.getRandomInt(2, 9);
        return { question: `${n1} × ${n2} = ?`, answer: n1 * n2, type: 'G3_Lx1D', operands: [n1, n2] };
    }

    generateG3_TeensTimesTeens() {
        const n1 = this.getRandomInt(11, 19);
        const n2 = this.getRandomInt(11, 19);
        return { question: `${n1} × ${n2} = ?`, answer: n1 * n2, type: 'G3_TeensXTeens', operands: [n1, n2] };
    }

    generateG3_XX1TimesYY1() { // 如 21×31
        const n1_tens = this.getRandomInt(1, 9);
        const n2_tens = this.getRandomInt(1, 9);
        const n1 = n1_tens * 10 + 1;
        const n2 = n2_tens * 10 + 1;
        return { question: `${n1} × ${n2} = ?`, answer: n1 * n2, type: 'G3_X1xY1', operands: [n1, n2] };
    }

    generateG3_2DigitTimes99() {
        const n = this.getRandomInt(10, 99);
        return { question: `${n} × 99 = ?`, answer: n * 99, type: 'G3_2Dx99', operands: [n, 99] };
    }

    generateG3_2DigitTimes101() {
        const n = this.getRandomInt(10, 99);
        return { question: `${n} × 101 = ?`, answer: n * 101, type: 'G3_2Dx101', operands: [n, 101] };
    }

    generateG3_HeadSameTailSum10() { // 如 42×48
        const head = this.getRandomInt(1, 9);
        const tail1 = this.getRandomInt(1, 8); // tail1不能是0或9，确保tail2不同且和为10
        const tail2 = 10 - tail1;
        const n1 = head * 10 + tail1;
        const n2 = head * 10 + tail2;
        return { question: `${n1} × ${n2} = ?`, answer: n1 * n2, type: 'G3_HSTSum10', operands: [n1, n2] };
    }

    generateG3_TailSameHeadSum10() { // 如 74×34
        const tail = this.getRandomInt(0, 9); // 尾数可以是0 (如 20×80)
        const head1 = this.getRandomInt(1, 8); // head1不能是0或9，确保head2不同且和为10
        const head2 = 10 - head1;
        const n1 = head1 * 10 + tail;
        const n2 = head2 * 10 + tail;
        return { question: `${n1} × ${n2} = ?`, answer: n1 * n2, type: 'G3_TSHSum10', operands: [n1, n2] };
    }
    
    generateG3_3DigitTimes11() {
        const n = this.getRandomInt(100, 999);
        return { question: `${n} × 11 = ?`, answer: n * 11, type: 'G3_3Dx11', operands: [n, 11] };
    }

    // --- 系统方法 ---
    showQuestion(powerType) {
        console.log('MathSystem.showQuestion called with powerType:', powerType);
        if (this.isQuestionActive()) {
            console.warn('MathSystem: 已有活跃的数学题，忽略新的题目请求');
            return;
        }

        this.currentQuestion = this.generateQuestion(this.gradeLevel);
        this.currentPowerType = powerType;
        this.questionCount++;
        console.log('Generated question:', this.currentQuestion);

        this.scene.physics.pause();
        this.scene.scene.launch('MathQuestionScene', {
            question: this.currentQuestion,
            powerType: powerType,
            gradeLevel: this.gradeLevel,
            callback: this.handleAnswer.bind(this)
        });
        this.scene.scene.pause();
    }
    
    handleAnswer(userAnswer, isCorrect) {
        console.log('MathSystem.handleAnswer called:', userAnswer, isCorrect, 'powerType:', this.currentPowerType);
        
        this.scene.physics.resume();
        this.scene.scene.resume();
        
        if (isCorrect) {
            this.correctAnswers++;
        }
        
        const powerTypeForReward = this.currentPowerType;
        
        // 在应用奖励前清除当前题目状态，防止重复进入问题
        this.currentQuestion = null;
        this.currentPowerType = null;

        this.scene.time.delayedCall(100, () => {
            if (isCorrect) {
                this.applyCorrectReward(powerTypeForReward);
            } else {
                this.applyIncorrectReward(powerTypeForReward);
            }
            // HUD消息由apply...Reward方法或GameScene处理
        });
    }
    
    applyCorrectReward(powerType) {
        const player = this.scene.player;
        if (!player) return;

        let rewardMessage = '';
        let scoreBonus = MATH_CONFIG.REWARDS.CORRECT.score;

        switch(powerType) {
            case 'WEAPON':
                if (player.weaponLevel < PLAYER_CONFIG.MAX_WEAPON_LEVEL) {
                    player.upgradeWeapon(); // 此方法通过效果系统处理自己的消息
                    rewardMessage = '武器升级！'; // 通用部分
                } else {
                    rewardMessage = '武器已满级！额外+200分！';
                    scoreBonus += 200;
                }
                break;
            case 'SHIELD':
                player.addShield(15);
                rewardMessage = '护盾恢复+15！';
                break;
            case 'LIFE':
                if (player.addLife()) {
                     rewardMessage = '生命恢复+1！';
                } else {
                    player.addShield(10); // 如果生命已满，给一些护盾
                    rewardMessage = '生命已满！护盾+10！';
                }
                break;
            case 'BOMB':
                this.scene.clearAllEnemies();
                rewardMessage = '清屏炸弹！';
                break;
            case 'MISSILE':
                player.addMissiles(50);
                rewardMessage = '导弹补给+50！';
                break;
            case 'SCORE':
                const extraScore = 500;
                scoreBonus += extraScore;
                rewardMessage = `分数奖励+${extraScore}！`;
                break;
            default:
                rewardMessage = '获得神秘奖励！'; // 未知powerType的回退
                break;
        }
        
        this.scene.addScore(scoreBonus);
        player.setInvulnerable(MATH_CONFIG.REWARDS.CORRECT.invulnerableTime);
        
        if (this.scene.hud && powerType) { // 确保hud和powerType存在
             this.scene.hud.showPowerupMessage(powerType, true); // true表示正确
        } else if (this.scene.showMessage){
             this.scene.showMessage(rewardMessage, POWERUP_CONFIG.TYPES[powerType]?.color || '#00ff00');
        }
        
        if (this.scene.effectSystem && player.active) {
             this.scene.effectSystem.createCollectEffect(player.x, player.y);
        }
    }
    
    applyIncorrectReward(powerType) {
        const player = this.scene.player;
        if (!player) return;

        player.setInvulnerable(MATH_CONFIG.REWARDS.INCORRECT.invulnerableTime);
        
        // 对于错误答案，简单的消息通常更好
        // MathQuestionScene可能显示"再试一次！"或"错误"
        // GameScene HUD可以显示通用的"保护时间！"
        if (this.scene.hud && powerType) {
            this.scene.hud.showPowerupMessage(powerType, false); // false表示错误
        } else if (this.scene.showMessage) {
             this.scene.showMessage('获得短暂保护！', '#ffaa00');
        }
    }
    
    getStatistics() {
        return {
            totalQuestions: this.questionCount,
            correctAnswers: this.correctAnswers,
            accuracy: this.questionCount > 0 ? (this.correctAnswers / this.questionCount) : 0,
            gradeLevel: this.gradeLevel
        };
    }
    
    reset() {
        this.questionCount = 0;
        this.correctAnswers = 0;
        this.currentQuestion = null;
        this.currentPowerType = null;
    }
    
    isQuestionActive() {
        return this.currentQuestion !== null;
    }
    
    getCurrentGradeName() {
        const gradeConfig = MATH_CONFIG.GRADES[this.gradeLevel];
        return gradeConfig ? gradeConfig.name : 'Unknown';
    }
} 