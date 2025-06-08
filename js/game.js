/**
 * game.js
 * 游戏主逻辑，负责协调游戏板和UI之间的交互
 */

/**
 * 游戏管理类，负责协调游戏板和UI之间的交互
 */
class Game {
    /**
     * 构造函数，初始化游戏
     */
    constructor() {
        // 初始化游戏状态
        this.board = new GameBoard();
        this.ui = new GameUI(
            this.handleMove.bind(this),
            this.restartGame.bind(this),
            this.exportGameState.bind(this),
            this.importGameState.bind(this)
        );
        
        // 从本地存储加载最高分和最佳步数
        this.bestScore = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.BEST_SCORE)) || 0;
        this.bestMoves = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.BEST_MOVES)) || 0;
        
        // 初始化游戏
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    /**
     * 初始化游戏
     */
    /**
     * 初始化游戏
     */
    init() {
        // 隐藏游戏结束统计信息
        this.ui.hideGameEndStats();
        
        // 重置游戏板
        this.board.reset();
        
        // 更新UI，初始化时不添加动画效果
        this.ui.updateBoardDOM(this.board.getBoard(), false);
        this.ui.updateScoreDisplay(
            this.board.getScore(),
            this.bestScore,
            this.board.getMovesMade(),
            this.bestMoves
        );
        
        // 隐藏所有弹窗
        this.ui.hideAllModals();
        
        // 隐藏截图统计
        this.ui.hideScreenshotStats();
    }
    
    /**
     * 处理移动事件
     * @param {string} direction - 移动方向 ('up', 'down', 'left', 'right')
     */
    handleMove(direction) {
        // 如果有任何弹窗打开，忽略移动操作
        if (Utils.isAnyModalActive()) {
            return;
        }
        
        // 如果游戏结束或者有截图统计显示，忽略移动操作
        const screenshotStatsDisplay = document.getElementById('screenshot-stats-display');
        const gameEndStats = document.querySelector('.game-end-stats');
        if ((screenshotStatsDisplay && screenshotStatsDisplay.classList.contains('visible')) || 
            gameEndStats) {
            Utils.showToast('游戏已经结束，请点击重新开始再来一局吧！', 'info_dark', 2000);
            return;
        }
        
        // 如果当前正在动画中，并且收到了新的移动指令，才快速完成当前动画
        if (this.ui.isAnimating && this.ui.hasNewMoveRequest) {
            // 快速完成当前所有动画
            this.ui.finishCurrentAnimations();
            
            // 短暂延迟后执行新的移动
            setTimeout(() => {
                this.ui.setAnimating(false);
                this.ui.hasNewMoveRequest = false;
                this.handleMove(direction);
            }, 50);
            return;
        } else if (this.ui.isAnimating) {
            // 如果正在动画中但没有新的移动请求，标记有新的移动请求
            this.ui.hasNewMoveRequest = true;
            return;
        }
        
        // 重置新移动请求标记
        this.ui.hasNewMoveRequest = false;
        
        // 设置动画状态
        this.ui.setAnimating(true);
        
        // 执行移动
        const moved = this.board.move(direction);
        
        // 如果移动有效，更新UI
        if (moved) {
            // 更新游戏板DOM，为新生成的数字块添加动画效果
            this.ui.updateBoardDOM(this.board.getBoard(), true);
            
            // 更新分数显示
            this.ui.updateScoreDisplay(
                this.board.getScore(),
                this.bestScore,
                this.board.getMovesMade(),
                this.bestMoves
            );
            
            // 等待所有动画完成后再检查游戏状态
            setTimeout(() => {
                // 重置动画状态
                this.ui.setAnimating(false);
                
                // 检查游戏状态
                this.checkGameStatus();
                
                // 保存游戏状态到本地存储
                this.saveGameState();
            }, 250); // 等待动画完成的时间
        } else {
            // 如果移动无效，立即重置动画状态
            this.ui.setAnimating(false);
        }
    }
    
    /**
     * 检查游戏状态（胜利或失败）
     */
    /**
     * 检查游戏状态（胜利或失败）
     */
    checkGameStatus() {
        // 如果当前正在动画中，延迟检查游戏状态
        if (this.ui.isAnimating || this.ui.animationInterrupted) {
            return;
        }
        
        // 检查是否有动画元素正在进行动画
        const animatingElements = document.querySelectorAll('.cell-moving, .cell-merging-active, .cell-merging-passive, .cell-merging-result, .cell-new');
        if (animatingElements.length > 0) {
            // 如果有动画正在进行，等待所有动画完成后再检查
            setTimeout(() => this.checkGameStatus(), 250);
            return;
        }
        
        // 检查是否达到2048
        const achieved2048 = this.board.hasWon();
        
        // 检查游戏是否结束
        if (this.board.isGameOver()) {
            // 更新最高分和最佳步数
            if (this.board.getScore() > this.bestScore) {
                this.bestScore = this.board.getScore();
                this.bestMoves = this.board.getMovesMade();
                localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_SCORE, this.bestScore);
                localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_MOVES, this.bestMoves);
            }
            
            // 显示游戏结束弹窗
            this.ui.showGameOverModal(
                this.board.getScore(),
                this.board.getMovesMade(),
                achieved2048,
                this.bestScore
            );
            
            // 显示游戏结束统计信息
            this.ui.showGameEndStats(
                this.board.getMovesMade(),
                this.board.getScore()
            );
        }
    }
    
    /**
     * 重启游戏
     */
    /**
     * 重新开始游戏
     */
    restartGame() {
        // 隐藏游戏结束统计信息
        this.ui.hideGameEndStats();
        
        // 重置游戏板
        this.board.reset();
        
        // 更新UI，重新开始游戏时不添加动画效果
        this.ui.updateBoardDOM(this.board.getBoard(), false);
        this.ui.updateScoreDisplay(
            this.board.getScore(),
            this.bestScore,
            this.board.getMovesMade(),
            this.bestMoves
        );
        
        // 隐藏所有弹窗
        this.ui.hideAllModals();
    }
    
    /**
     * 导出游戏状态
     * @returns {string} 游戏状态的JSON字符串
     */
    exportGameState() {
        const gameState = {
            board: this.board.getBoard(),
            score: this.board.getScore(),
            movesMade: this.board.getMovesMade(),
            bestScore: this.bestScore,
            bestMoves: this.bestMoves,
            timestamp: new Date().toISOString()
        };
        
        return Utils.exportGameState(gameState);
    }
    
    /**
     * 导入游戏状态
     * @param {string} saveData - 游戏状态的JSON字符串
     */
    importGameState(saveData) {
        try {
            const gameState = Utils.importGameState(saveData);
            
            // 恢复游戏板状态
            this.board.restoreState(gameState.board, gameState.score, gameState.movesMade);
            
            // 恢复最高分和最佳步数
            if (gameState.bestScore !== undefined) {
                this.bestScore = gameState.bestScore;
                localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_SCORE, this.bestScore);
            }
            
            if (gameState.bestMoves !== undefined) {
                this.bestMoves = gameState.bestMoves;
                localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_MOVES, this.bestMoves);
            }
            
            // 更新UI
            this.ui.updateBoardDOM(this.board.getBoard(), false);
            this.ui.updateScoreDisplay(
                this.board.getScore(),
                this.bestScore,
                this.board.getMovesMade(),
                this.bestMoves
            );
            
            // 隐藏所有弹窗
            this.ui.hideAllModals();
        } catch (error) {
            console.error("导入游戏状态失败:", error);
            // 重新抛出错误，以便UI层可以捕获并显示特定的错误信息
            throw error;
        }
    }
    
    /**
     * 导入游戏状态
     * @param {string} stateStr - 游戏状态字符串
     * @returns {boolean} - 导入是否成功
     */
    importGameState(stateStr) {
        try {
            // 隐藏游戏结束统计信息
            this.ui.hideGameEndStats();
            
            // 尝试导入游戏状态
            const gameState = Utils.importGameState(stateStr);
            
            // 恢复游戏板状态
            this.board.restoreState(gameState.board, gameState.score, gameState.movesMade);
            
            // 恢复最高分和最佳步数
            if (gameState.bestScore !== undefined) {
                this.bestScore = gameState.bestScore;
                localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_SCORE, this.bestScore);
            }
            
            if (gameState.bestMoves !== undefined) {
                this.bestMoves = gameState.bestMoves;
                localStorage.setItem(CONFIG.STORAGE_KEYS.BEST_MOVES, this.bestMoves);
            }
            
            // 更新UI，导入游戏状态时不添加动画效果
            this.ui.updateBoardDOM(this.board.getBoard(), false);
            this.ui.updateScoreDisplay(
                this.board.getScore(),
                this.bestScore,
                this.board.getMovesMade(),
                this.bestMoves
            );
            
            // 保存游戏状态到本地存储
            this.saveGameState();
            
            // 检查导入的游戏是否已经结束，如果已结束则立即显示结算页面
            if (this.board.isGameOver()) {
                // 显示游戏结束弹窗
                this.ui.showGameOverModal(
                    this.board.getScore(),
                    this.board.getMovesMade(),
                    this.board.hasWon(),
                    this.bestScore
                );
                
                // 显示游戏结束统计信息
                this.ui.showGameEndStats(
                    this.board.getMovesMade(),
                    this.board.getScore()
                );
            }
            
            return true;
        } catch (error) {
            console.error('导入游戏状态失败:', error);
            throw error; // 重新抛出错误，以便UI层可以捕获并显示特定的错误信息
        }
    }
    
    /**
     * 保存游戏状态到本地存储
     */
    saveGameState() {
        // 保存当前游戏状态到本地存储
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_BOARD, JSON.stringify(this.board.getBoard()));
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_SCORE, this.board.getScore());
        localStorage.setItem(CONFIG.STORAGE_KEYS.MOVES_MADE, this.board.getMovesMade());
    }
}