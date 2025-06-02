/**
 * main.js
 * 游戏主入口文件，负责初始化游戏并处理页面加载
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new Game();
    
    // 添加页面可见性变化事件监听器
    // 当用户切换回页面时，隐藏截图统计显示
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const screenshotStatsDisplay = document.getElementById('screenshot-stats-display');
            if (screenshotStatsDisplay && screenshotStatsDisplay.classList.contains('visible')) {
                screenshotStatsDisplay.classList.remove('visible');
            }
        }
    });
    
    // 添加点击事件监听器，点击页面任何地方隐藏截图统计显示
    document.addEventListener('click', (event) => {
        const screenshotStatsDisplay = document.getElementById('screenshot-stats-display');
        if (screenshotStatsDisplay && screenshotStatsDisplay.classList.contains('visible')) {
            // 检查点击是否在截图统计显示区域外
            if (!screenshotStatsDisplay.contains(event.target)) {
                screenshotStatsDisplay.classList.remove('visible');
            }
        }
    });
});