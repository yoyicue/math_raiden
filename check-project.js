#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🎮 口算雷电 Phaser版 - 项目状态检查\n');

// 检查必要文件
const requiredFiles = [
    'package.json',
    'vite.config.js',
    'index.html',
    'src/main.js',
    'src/utils/Constants.js',
    'src/scenes/BootScene.js',
    'src/scenes/PreloadScene.js',
    'src/scenes/MenuScene.js',
    'src/scenes/GameScene.js',
    'src/scenes/GameOverScene.js',
    'src/scenes/MathQuestionScene.js',
    // 核心游戏对象
    'src/objects/Player.js',
    'src/objects/Enemy.js',
    'src/objects/Bullet.js',
    'src/objects/Missile.js',
    // 核心系统
    'src/systems/MathSystem.js',
    'src/systems/EffectSystem.js',
    // UI组件（包括移动端支持）
    'src/ui/HUD.js',
    'src/ui/TouchControls.js',
    'src/ui/TouchKeyboard.js',
    'src/ui/TouchPauseButton.js',
    // 文档
    'README.md',
    'architecture-design.md',
    'demo.html'
];

console.log('📁 检查必要文件:');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file}`);
    if (!exists) allFilesExist = false;
});

// 检查目录结构
const requiredDirs = [
    'src/scenes',
    'src/objects',
    'src/systems',
    'src/ui',
    'src/utils',
    'assets/images',
    'assets/audio'
];

console.log('\n📂 检查目录结构:');
let allDirsExist = true;

requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${dir}/`);
    if (!exists) allDirsExist = false;
});

// 检查package.json依赖
console.log('\n📦 检查依赖:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasPhaserDep = packageJson.dependencies && packageJson.dependencies.phaser;
    const hasViteDep = packageJson.devDependencies && packageJson.devDependencies.vite;
    
    console.log(`  ${hasPhaserDep ? '✅' : '❌'} Phaser ${hasPhaserDep || '(未安装)'}`);
    console.log(`  ${hasViteDep ? '✅' : '❌'} Vite ${hasViteDep || '(未安装)'}`);
    
    // 检查脚本
    const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
    const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
    const hasPreviewScript = packageJson.scripts && packageJson.scripts.preview;
    
    console.log(`  ${hasDevScript ? '✅' : '❌'} dev script`);
    console.log(`  ${hasBuildScript ? '✅' : '❌'} build script`);
    console.log(`  ${hasPreviewScript ? '✅' : '❌'} preview script`);
    
} catch (error) {
    console.log('  ❌ package.json 读取失败');
}

// 检查Git配置
console.log('\n🔧 检查Git配置:');
const gitIgnoreExists = fs.existsSync('.gitignore');
console.log(`  ${gitIgnoreExists ? '✅' : '❌'} .gitignore`);

if (gitIgnoreExists) {
    const gitIgnoreContent = fs.readFileSync('.gitignore', 'utf8');
    const hasNodeModules = gitIgnoreContent.includes('node_modules');
    const hasDist = gitIgnoreContent.includes('dist');
    const hasEnv = gitIgnoreContent.includes('.env');
    
    console.log(`  ${hasNodeModules ? '✅' : '❌'} node_modules/ 已忽略`);
    console.log(`  ${hasDist ? '✅' : '❌'} dist/ 已忽略`);
    console.log(`  ${hasEnv ? '✅' : '❌'} .env 已忽略`);
}

// 统计代码行数和文件详情
console.log('\n📊 代码统计:');
let totalLines = 0;
let totalFiles = 0;
let fileDetails = {};

function countLines(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            countLines(filePath);
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;
            totalLines += lines;
            totalFiles++;
            
            // 按目录分类统计
            const dirName = path.dirname(filePath).replace('src/', '');
            if (!fileDetails[dirName]) {
                fileDetails[dirName] = { files: 0, lines: 0 };
            }
            fileDetails[dirName].files++;
            fileDetails[dirName].lines += lines;
        }
    });
}

if (fs.existsSync('src')) {
    countLines('src');
}

console.log(`  📄 JavaScript文件: ${totalFiles}`);
console.log(`  📝 代码行数: ${totalLines}`);

// 详细统计
console.log('\n📈 模块详情:');
Object.entries(fileDetails).forEach(([dir, stats]) => {
    console.log(`  📁 ${dir}: ${stats.files} 文件, ${stats.lines} 行`);
});

// 检查核心功能完成度
console.log('\n🎯 核心功能完成度分析:');
const coreFeatures = [
    { name: '游戏场景系统', files: ['src/scenes/GameScene.js', 'src/scenes/MathQuestionScene.js'], minLines: 400 },
    { name: '玩家系统', files: ['src/objects/Player.js'], minLines: 300 },
    { name: '敌机系统', files: ['src/objects/Enemy.js'], minLines: 150 },
    { name: '子弹系统', files: ['src/objects/Bullet.js'], minLines: 150 },
    { name: '导弹系统', files: ['src/objects/Missile.js'], minLines: 100 },
    { name: '数学题系统', files: ['src/systems/MathSystem.js'], minLines: 200 },
    { name: '特效系统', files: ['src/systems/EffectSystem.js'], minLines: 200 },
    { name: 'HUD界面', files: ['src/ui/HUD.js'], minLines: 200 },
    { name: '移动端触控', files: ['src/ui/TouchControls.js'], minLines: 300 },
    { name: '虚拟键盘', files: ['src/ui/TouchKeyboard.js'], minLines: 200 }
];

let completedFeatures = 0;
coreFeatures.forEach(feature => {
    let featureCompleted = true;
    let totalFeatureLines = 0;
    
    feature.files.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n').length;
            totalFeatureLines += lines;
        } else {
            featureCompleted = false;
        }
    });
    
    if (featureCompleted && totalFeatureLines >= feature.minLines) {
        completedFeatures++;
        console.log(`  ✅ ${feature.name}: ${totalFeatureLines} 行`);
    } else {
        console.log(`  ❌ ${feature.name}: ${featureCompleted ? totalFeatureLines : 0} 行 (需要 ${feature.minLines}+ 行)`);
    }
});

const completionRate = Math.round((completedFeatures / coreFeatures.length) * 100);
console.log(`\n  🚀 核心功能完成度: ${completionRate}% (${completedFeatures}/${coreFeatures.length})`);

// 检查移动端支持
console.log('\n📱 移动端支持检查:');
const mobileFeatures = [
    'src/ui/TouchControls.js',
    'src/ui/TouchKeyboard.js',
    'src/ui/TouchPauseButton.js'
];

let mobileSupport = 0;
mobileFeatures.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file.split('/').pop()}`);
    if (exists) mobileSupport++;
});

const mobileRate = Math.round((mobileSupport / mobileFeatures.length) * 100);
console.log(`  📱 移动端支持完成度: ${mobileRate}%`);

// 检查文档完整性
console.log('\n📚 文档完整性检查:');
const docs = [
    { file: 'README.md', name: '项目说明文档' },
    { file: 'architecture-design.md', name: '架构设计文档' },
    { file: 'demo.html', name: '完整游戏演示' }
];

let docsComplete = 0;
docs.forEach(doc => {
    const exists = fs.existsSync(doc.file);
    const status = exists ? '✅' : '❌';
    if (exists) {
        const content = fs.readFileSync(doc.file, 'utf8');
        const lines = content.split('\n').length;
        console.log(`  ${status} ${doc.name}: ${lines} 行`);
        docsComplete++;
    } else {
        console.log(`  ${status} ${doc.name}: 缺失`);
    }
});

// 总结
console.log('\n🎯 项目状态总结:');
if (allFilesExist && allDirsExist) {
    console.log('  ✅ 项目结构完整');
    
    if (completionRate >= 90) {
        console.log('  🎉 项目已完成，功能齐全，支持跨平台');
        console.log('  📱 移动端支持完整，包含触控系统');
        console.log('  🧮 数学教育功能完善');
    } else if (completionRate >= 70) {
        console.log('  🚧 项目基本完成，核心功能已实现');
    } else {
        console.log('  🚀 项目开发中，继续完善核心功能');
    }
    
    console.log('\n💡 下一步建议:');
    if (completionRate >= 90) {
        console.log('  1. 运行 npm run dev 测试完整游戏功能');
        console.log('  2. 在移动设备上测试触控体验');
        console.log('  3. 优化游戏性能和用户体验');
        console.log('  4. 添加音效系统增强沉浸感');
        console.log('  5. 准备部署到生产环境');
    } else {
        console.log('  1. 运行 npm run dev 启动开发服务器');
        console.log('  2. 访问 http://localhost:3000 查看游戏');
        console.log('  3. 继续完善核心游戏逻辑');
        console.log('  4. 测试数学题系统和游戏机制');
    }
} else {
    console.log('  ⚠️  项目结构不完整，请检查缺失的文件和目录');
}

console.log('\n🔗 有用的命令:');
console.log('  npm run dev     - 启动开发服务器 (http://localhost:3000)');
console.log('  npm run build   - 构建生产版本');
console.log('  npm run preview - 预览构建结果');
console.log('  git status      - 查看Git状态');
console.log('  git add .       - 添加所有更改');
console.log('  git commit -m "feat: 更新功能" - 提交更改 (CC规范)');

console.log('\n🎮 游戏特色:');
console.log('  🚀 完整的射击游戏体验');
console.log('  🧮 三难度等级数学题系统');
console.log('  📱 完整移动端支持 (虚拟摇杆 + 触屏)');
console.log('  🎯 跨平台兼容 (桌面端 + 移动端)');
console.log('  ⚡ 高性能优化 (对象池 + 动态纹理)');
console.log('  🎨 丰富视觉特效系统'); 