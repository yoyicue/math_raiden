#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🎮 数学雷电 Phaser版 - 项目状态检查\n');

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
    // 实际存在的核心文件
    'src/objects/Player.js',
    'src/objects/Enemy.js',
    'src/objects/Bullet.js',
    'src/objects/Missile.js',
    'src/systems/MathSystem.js',
    'src/systems/EffectSystem.js',
    'src/ui/HUD.js',
    'README.md',
    'architecture-design.md'
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
    'src/config',
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

// 检查项目完成度
console.log('\n🎯 项目完成度分析:');
const coreFiles = [
    'src/scenes/GameScene.js',
    'src/scenes/MathQuestionScene.js',
    'src/objects/Player.js',
    'src/objects/Enemy.js',
    'src/systems/MathSystem.js',
    'src/ui/HUD.js'
];

let completedCore = 0;
coreFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        if (lines > 50) { // 假设超过50行表示有实质内容
            completedCore++;
        }
    }
});

const completionRate = Math.round((completedCore / coreFiles.length) * 100);
console.log(`  🚀 核心功能完成度: ${completionRate}% (${completedCore}/${coreFiles.length})`);

// 总结
console.log('\n🎯 项目状态总结:');
if (allFilesExist && allDirsExist) {
    console.log('  ✅ 项目结构完整');
    if (completionRate >= 80) {
        console.log('  🎉 项目基本完成，可以进行测试和优化');
    } else if (completionRate >= 50) {
        console.log('  🚧 项目开发中，核心功能已实现');
    } else {
        console.log('  🚀 项目刚起步，继续开发核心功能');
    }
    
    console.log('\n💡 下一步建议:');
    if (completionRate >= 80) {
        console.log('  1. 运行 npm run dev 测试游戏');
        console.log('  2. 优化游戏体验和性能');
        console.log('  3. 添加更多关卡和功能');
        console.log('  4. 准备部署到生产环境');
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
console.log('  git commit -m "message" - 提交更改'); 