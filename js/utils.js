/**
 * utils.js
 * 工具函数文件，包含游戏中使用的通用辅助函数
 */

/**
 * 工具函数集合
 */
const Utils = {
    /**
     * 显示提示通知
     * @param {string} messageHTML - 消息内容（支持HTML）
     * @param {string} type - 通知类型：'success'|'error'|'warning'|'info_dark'
     * @param {number} duration - 显示时长（毫秒）
     */
    showToast: function(messageHTML, type = 'success', duration = 2000) {
        // 创建或获取toast元素
        let toastElement = document.getElementById('toast-notification');
        if (!toastElement) {
            toastElement = document.createElement('div');
            toastElement.id = 'toast-notification';
            document.body.appendChild(toastElement);
        }
        
        // 设置内容和样式
        toastElement.innerHTML = messageHTML;
        toastElement.className = 'toast-notification';
        toastElement.classList.add(type);
        
        // 触发重排以确保过渡效果生效
        toastElement.style.display = 'none';
        toastElement.offsetHeight; // 强制重排
        toastElement.style.display = '';
        
        // 显示toast
        toastElement.classList.add('visible');
        
        // 清除现有的隐藏定时器
        if (toastElement.hideTimeout) {
            clearTimeout(toastElement.hideTimeout);
        }
        
        // 设置隐藏定时器
        toastElement.hideTimeout = setTimeout(() => {
            toastElement.classList.remove('visible');
        }, duration);
    },
    
    /**
     * 启动彩带效果
     */
    launchConfetti: function() {
        const confettiCount = 100;
        const confettiContainer = document.body;
        const colors = ['#f2b179', '#f59563', '#f67c5f', '#f65e3b', '#edcf72', '#edc22e', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c'];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti-particle');
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -Math.random() * 20 - 5 + 'vh'; // 从视口上方开始
            
            const size = Math.random() * 8 + 4;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '0' : '50%'; // 方形或圆形
            confetti.style.opacity = Math.random() * 0.7 + 0.3;
            
            const initialRotation = Math.random() * 360;
            confetti.style.transform = `rotate(${initialRotation}deg)`;

            confettiContainer.appendChild(confetti);

            // 动画：下落和淡出
            confetti.animate([
                { 
                    top: confetti.style.top, 
                    opacity: confetti.style.opacity, 
                    transform: `translateX(0px) rotate(${initialRotation}deg)` 
                },
                { 
                    top: '110vh', 
                    opacity: 0, 
                    transform: `translateX(${Math.random() * 200 - 100}px) rotate(${Math.random() * 720 + initialRotation}deg)` 
                }
            ], {
                duration: Math.random() * 3000 + 4000, // 随机持续时间
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                delay: Math.random() * 1000 // 随机延迟
            }).onfinish = () => confetti.remove(); // 动画结束后移除元素
        }
    },
    
    /**
     * 导出游戏状态为Base64编码的字符串
     * @param {Object} gameState - 游戏状态对象
     * @returns {string} - Base64编码的游戏状态
     */
    exportGameState: function(gameState) {
        const jsonString = JSON.stringify(gameState);
        try {
            // 使用Base64编码便于复制/粘贴
            return btoa(encodeURIComponent(jsonString));
        } catch (e) {
            console.error("Error Base64 encoding save data:", e);
            return jsonString; // 编码失败时返回原始JSON字符串
        }
    },
    
    /**
     * 导入游戏状态
     * @param {string} importedDataString - 导入的数据字符串
     * @returns {Object} - 解析后的游戏状态对象
     * @throws {Error} - 如果导入数据无效则抛出错误
     */
    importGameState: function(importedDataString) {
        if (!importedDataString || !importedDataString.trim()) {
            throw new Error('导入数据不能为空！');
        }
        
        let jsonStringToParse;
        // 尝试从Base64解码；如果失败，假设它是原始JSON
        try {
            jsonStringToParse = decodeURIComponent(atob(importedDataString));
        } catch (e) {
            try {
                // 尝试直接解析为JSON
                jsonStringToParse = importedDataString;
                // 验证是否为有效的JSON
                JSON.parse(jsonStringToParse);
            } catch (jsonError) {
                throw new Error('存档数据格式无效，无法解析！');
            }
        }
        
        let gameState;
        try {
            gameState = JSON.parse(jsonStringToParse);
        } catch (e) {
            throw new Error('存档数据解析失败，请检查格式是否正确！');
        }
        
        // 验证游戏状态结构
        if (!gameState || typeof gameState !== 'object') {
            throw new Error('存档数据不是有效的游戏状态对象！');
        }
        
        // 验证必要字段
        if (!Array.isArray(gameState.board)) {
            throw new Error('存档数据缺少有效的棋盘信息！');
        }
        
        if (typeof gameState.score !== 'number') {
            throw new Error('存档数据缺少有效的分数信息！');
        }
        
        if (typeof gameState.bestScore !== 'number') {
            throw new Error('存档数据缺少有效的最高分信息！');
        }
        
        if (typeof gameState.movesMade !== 'number') {
            throw new Error('存档数据缺少有效的步数信息！');
        }
        
        // 验证棋盘尺寸
        if (gameState.board.length !== CONFIG.BOARD_SIZE) {
            throw new Error(`存档数据棋盘尺寸不匹配！期望 ${CONFIG.BOARD_SIZE}x${CONFIG.BOARD_SIZE}`);
        }
        
        // 验证棋盘内容
        for (let i = 0; i < gameState.board.length; i++) {
            const row = gameState.board[i];
            if (!Array.isArray(row) || row.length !== CONFIG.BOARD_SIZE) {
                throw new Error(`存档数据棋盘第 ${i+1} 行格式无效！`);
            }
            
            for (let j = 0; j < row.length; j++) {
                const cell = row[j];
                if (typeof cell !== 'number' || (cell !== 0 && (cell & (cell - 1)) !== 0)) {
                    throw new Error(`存档数据棋盘第 ${i+1} 行第 ${j+1} 列的值无效！有效值应为0或2的幂次方。`);
                }
            }
        }
        
        return gameState;
    },
    
    /**
     * 检查是否有任何模态框处于活动状态
     * @returns {boolean} - 如果有模态框活动则返回true
     */
    isAnyModalActive: function() {
        return document.querySelector('.modal-overlay.active') !== null;
    },
    
    /**
     * 格式化游戏介绍文本，将Markdown风格的标记转换为HTML
     * @param {string} text - 原始文本
     * @returns {string} - 格式化后的HTML文本
     */
    formatGameIntroText: function(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                   .replace(/`(.*?)`/g, '<code>$1</code>')
                   .replace(/\n/g, '<br>');
    }
};