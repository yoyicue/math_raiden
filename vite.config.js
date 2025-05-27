export default {
    base: './',
    server: {
        host: '0.0.0.0',  // 允许局域网访问
        port: 3000,
        strictPort: true  // 端口被占用时不自动尝试下一个端口
    },
    build: {
        assetsInlineLimit: 0
    }
} 