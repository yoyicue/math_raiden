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
    'src/scenes/MathQuestionScene.js'
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
    
    console.log(`  ${hasDevScript ? '✅' : '❌'} dev script`);
    console.log(`  ${hasBuildScript ? '✅' : '❌'} build script`);
    
} catch (error) {
    console.log('  ❌ package.json 读取失败');
}

// 统计代码行数
console.log('\n📊 代码统计:');
let totalLines = 0;
let totalFiles = 0;

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
        }
    });
}

if (fs.existsSync('src')) {
    countLines('src');
}

console.log(`  📄 JavaScript文件: ${totalFiles}`);
console.log(`  📝 代码行数: ${totalLines}`);

// 总结
console.log('\n🎯 项目状态总结:');
if (allFilesExist && allDirsExist) {
    console.log('  ✅ 项目结构完整');
    console.log('  🚀 可以开始开发');
    console.log('\n💡 下一步建议:');
    console.log('  1. 运行 npm run dev 启动开发服务器');
    console.log('  2. 访问 http://localhost:3000 查看游戏');
    console.log('  3. 开始实现游戏核心逻辑');
} else {
    console.log('  ⚠️  项目结构不完整，请检查缺失的文件和目录');
}

console.log('\n🔗 有用的命令:');
console.log('  npm run dev     - 启动开发服务器');
console.log('  npm run build   - 构建生产版本');
console.log('  npm run preview - 预览构建结果'); 