/**
 * board.js
 * 游戏棋盘逻辑，处理游戏核心逻辑，如移动、合并等操作
 */

/**
 * 游戏棋盘类，负责管理游戏棋盘状态和操作
 */
class GameBoard {
    /**
     * 构造函数，初始化游戏棋盘
     * @param {number} size - 棋盘大小
     */
    constructor(size = CONFIG.BOARD_SIZE) {
        this.size = size;
        this.reset();
    }
    
    /**
     * 重置游戏棋盘
     */
    reset() {
        // 初始化棋盘为全0
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.score = 0;
        this.movesMade = 0;
        this.gameWon = false;
        this.gameOver = false;
        
        // 添加初始的两个随机方块
        this.addRandomTile();
        this.addRandomTile();
    }
    
    /**
     * 添加一个随机方块到棋盘上的空位置
     */
    addRandomTile() {
        const emptyCells = [];
        
        // 找出所有空位置
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        // 如果有空位置，随机选择一个并添加方块
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // 新方块有90%概率是2，10%概率是4
            this.board[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    /**
     * 检查游戏是否结束（无法再移动）
     * @returns {boolean} - 如果游戏结束返回true
     */
    isGameOver() {
        // 如果棋盘上有空位，游戏未结束
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) return false;
                
                // 检查水平方向是否有可合并的相邻方块
                if (c < this.size - 1 && this.board[r][c] === this.board[r][c + 1]) return false;
                
                // 检查垂直方向是否有可合并的相邻方块
                if (r < this.size - 1 && this.board[r][c] === this.board[r + 1][c]) return false;
            }
        }
        
        // 没有空位且没有可合并的方块，游戏结束
        this.gameOver = true;
        return true;
    }
    
    /**
     * 检查是否达到获胜条件
     * @returns {boolean} - 如果达到获胜条件返回true
     */
    hasWon() {
        if (this.gameWon) return true; // 已经赢过了
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === CONFIG.WIN_TILE) {
                    this.gameWon = true;
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 滑动并合并一行方块（向左）
     * @param {number[]} row - 要处理的行
     * @returns {Object} - 处理后的行和是否发生移动或合并的标志
     */
    slideAndMergeRow(row) {
        // 1. 过滤掉零，压缩方块
        let newRow = row.filter(val => val !== 0);
        let movedOrMerged = false;
        
        // 2. 合并相邻的相同方块
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i+1]) {
                newRow[i] *= 2; // 合并：值翻倍
                this.score += newRow[i]; // 将合并值加到分数
                newRow.splice(i + 1, 1); // 移除被合并的方块
                movedOrMerged = true;
            }
        }
        
        // 3. 用零填充以保持行大小
        while (newRow.length < this.size) newRow.push(0);
        
        // 4. 检查是否有方块实际移动（即使没有合并）
        if (!movedOrMerged) {
            for (let i = 0; i < this.size; ++i) {
                if (row[i] !== newRow[i]) {
                    movedOrMerged = true;
                    break;
                }
            }
        }
        
        return { newRow, movedOrMergedInRow: movedOrMerged };
    }
    
    /**
     * 旋转棋盘90度（顺时针）
     * @param {number[][]} currentBoard - 要旋转的棋盘
     * @returns {number[][]} - 旋转后的棋盘
     */
    rotateBoard(currentBoard) {
        const newBoard = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                newBoard[c][this.size - 1 - r] = currentBoard[r][c];
            }
        }
        return newBoard;
    }
    
    /**
     * 执行移动操作
     * @param {string} direction - 移动方向：'up', 'down', 'left', 'right'
     * @returns {boolean} - 如果移动有效（棋盘发生变化）返回true
     */
    move(direction) {
        if (this.gameOver) return false;
        
        let boardChanged = false;
        let tempBoard = JSON.parse(JSON.stringify(this.board)); // 深拷贝棋盘
        
        // 旋转棋盘，使所有方向的移动都可以作为"向左"移动处理
        if (direction === 'up') {
            tempBoard = this.rotateBoard(this.rotateBoard(this.rotateBoard(tempBoard))); // 旋转3次
        } else if (direction === 'right') {
            tempBoard = this.rotateBoard(this.rotateBoard(tempBoard)); // 旋转2次
        } else if (direction === 'down') {
            tempBoard = this.rotateBoard(tempBoard); // 旋转1次
        }
        // 'left'不需要旋转
        
        // 处理每一行
        for (let r = 0; r < this.size; r++) {
            const { newRow, movedOrMergedInRow } = this.slideAndMergeRow(tempBoard[r]);
            tempBoard[r] = newRow;
            if (movedOrMergedInRow) boardChanged = true;
        }
        
        // 将棋盘旋转回原来的方向
        if (direction === 'up') {
            tempBoard = this.rotateBoard(tempBoard);
        } else if (direction === 'right') {
            tempBoard = this.rotateBoard(this.rotateBoard(tempBoard));
        } else if (direction === 'down') {
            tempBoard = this.rotateBoard(this.rotateBoard(this.rotateBoard(tempBoard)));
        }
        
        // 如果棋盘发生变化，更新状态
        if (boardChanged) {
            this.board = tempBoard;
            this.addRandomTile(); // 添加一个新的随机方块
            this.movesMade++; // 增加移动计数
            
            // 检查是否达到获胜条件
            this.hasWon();
            
            // 检查游戏是否结束
            this.isGameOver();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取当前游戏棋盘
     * @returns {number[][]} - 游戏棋盘数组
     */
    getBoard() {
        return this.board;
    }
    
    /**
     * 获取当前分数
     * @returns {number} - 当前分数
     */
    getScore() {
        return this.score;
    }
    
    /**
     * 获取当前移动步数
     * @returns {number} - 当前移动步数
     */
    getMovesMade() {
        return this.movesMade;
    }
    
    /**
     * 从保存的状态恢复游戏
     * @param {number[][]} board - 游戏棋盘数组
     * @param {number} score - 游戏分数
     * @param {number} movesMade - 移动步数
     */
    restoreState(board, score, movesMade) {
        this.board = board;
        this.score = score;
        this.movesMade = movesMade;
        this.gameOver = false; // 重置游戏结束状态
        
        // 检查是否已经达到获胜条件
        this.hasWon();
    }
}