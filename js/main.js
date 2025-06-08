/**
 * main.js
 * 游戏主入口文件，负责初始化游戏并处理页面加载
 */

/**
 * 文档加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 创建游戏实例
        window.game = new Game();
        
        // 输出调试信息
        console.log('游戏初始化完成');
        
        // 创建favicon链接元素，避免404错误
        if (!document.querySelector('link[rel="icon"]')) {
            const faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            faviconLink.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎮</text></svg>';
            document.head.appendChild(faviconLink);
        }
        
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

        // 键盘控制
        document.addEventListener('keydown', function(event) {
            // 防止键盘事件导致页面滚动
            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (arrowKeys.includes(event.key)) {
                event.preventDefault();
            }
            
            // 如果有任何弹窗打开，忽略键盘方向操作
            if (Utils.isAnyModalActive()) {
                return;
            }
            
            // 映射键盘事件到方向
            let direction = null;
            switch (event.key) {
                case 'ArrowUp':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                    direction = 'right';
                    break;
                case 'w':
                case 'W':
                    direction = 'up';
                    break;
                case 's':
                case 'S':
                    direction = 'down';
                    break;
                case 'a':
                case 'A':
                    direction = 'left';
                    break;
                case 'd':
                case 'D':
                    direction = 'right';
                    break;
            }
            
            // 如果识别到有效方向，传递给游戏实例处理
            if (direction && window.game) {
                window.game.handleMove(direction);
            }
        });
        
        // 屏幕触摸控制
        const touchStartX = {};
        const touchStartY = {};
        
        document.addEventListener('touchstart', function(event) {
            // 如果有任何弹窗打开，忽略触摸操作
            if (Utils.isAnyModalActive()) {
                return;
            }
            
            // 不再阻止默认行为，允许页面正常滚动和按钮点击
            
            // 记录触摸起始点
            const touch = event.touches[0];
            touchStartX[touch.identifier] = touch.clientX;
            touchStartY[touch.identifier] = touch.clientY;
        }, { passive: true }); // 使用passive: true以提高性能
        
        document.addEventListener('touchend', function(event) {
            // 如果有任何弹窗打开，忽略触摸操作
            if (Utils.isAnyModalActive()) {
                return;
            }
            
            // 只有在识别为游戏滑动时才阻止默认行为
            
            const touch = event.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const startX = touchStartX[touch.identifier];
            const startY = touchStartY[touch.identifier];
            
            if (startX === undefined || startY === undefined) return;
            
            // 计算滑动距离
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 50; // 最小滑动距离
            
            // 确定滑动方向
            let direction = null;
            let isGameSwipe = false;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平滑动
                if (Math.abs(deltaX) >= minSwipeDistance) {
                    direction = deltaX > 0 ? 'right' : 'left';
                    isGameSwipe = true;
                }
            } else {
                // 垂直滑动
                if (Math.abs(deltaY) >= minSwipeDistance) {
                    direction = deltaY > 0 ? 'down' : 'up';
                    isGameSwipe = true;
                }
            }
            
            // 如果识别到有效方向，传递给游戏实例处理
            if (direction && window.game) {
                console.log('触摸滑动方向:', direction);
                
                // 只有在游戏棋盘区域的滑动才阻止默认行为
                const gameBoard = document.getElementById('game-board');
                const rect = gameBoard.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom && isGameSwipe) {
                    event.preventDefault();
                }
                
                window.game.handleMove(direction);
            }
            
            // 清除触摸数据
            delete touchStartX[touch.identifier];
            delete touchStartY[touch.identifier];
        }, { passive: false });
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
});