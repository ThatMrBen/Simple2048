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
        this.lastMoveInfo = null; // 存储上一次移动的信息
        
        // 添加初始的两个随机方块
        this.addRandomTile();
        this.addRandomTile();
    }
    
    /**
     * 添加一个随机方块到棋盘上的空位置
     * @returns {Object|null} - 新添加的方块信息，如果没有空位则返回null
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
            const value = Math.random() < 0.9 ? 2 : 4;
            this.board[randomCell.r][randomCell.c] = value;
            
            // 返回新方块信息，供UI动画使用
            return {
                type: 'new',
                position: { r: randomCell.r, c: randomCell.c },
                value: value
            };
        }
        
        return null;
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
     * 向指定方向移动棋盘
     * @param {string} direction - 移动方向：'up', 'down', 'left', 'right'
     * @returns {boolean} - 是否发生了移动
     */
    move(direction) {
        // 复制当前棋盘状态以便比较
        const oldBoard = this.board.map(row => [...row]);
        
        // 准备记录移动信息
        this.lastMoveInfo = {
            direction,
            movements: [],
            merges: [],
            newTile: null
        };
        
        let moved = false;
        
        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }
        
        // 验证所有移动和合并数据是否有效
        this.validateMoveInfo();
        
        // 如果发生了移动，添加一个新的数字块
        if (moved) {
            const newTile = this.addRandomTile();
            if (newTile) {
                this.lastMoveInfo.newTile = newTile;
            }
            
            // 记录移动步数
            this.movesMade++;
        } else {
            this.lastMoveInfo = null;
        }
        
        return moved;
    }
    
    /**
     * 验证移动信息数据是否有效
     * 删除任何包含undefined或NaN值的移动或合并记录
     */
    validateMoveInfo() {
        if (!this.lastMoveInfo) return;
        
        // 验证移动数据
        if (Array.isArray(this.lastMoveInfo.movements)) {
            this.lastMoveInfo.movements = this.lastMoveInfo.movements.filter(movement => {
                return movement 
                    && typeof movement === 'object'
                    && movement.from && movement.to
                    && typeof movement.from === 'object' && typeof movement.to === 'object'
                    && movement.from.r !== undefined && movement.from.c !== undefined
                    && movement.to.r !== undefined && movement.to.c !== undefined
                    && movement.value !== undefined && !isNaN(movement.value);
            });
        }
        
        // 验证合并数据
        if (Array.isArray(this.lastMoveInfo.merges)) {
            this.lastMoveInfo.merges = this.lastMoveInfo.merges.filter(merge => {
                return merge 
                    && typeof merge === 'object'
                    && merge.active && merge.passive && merge.finalPosition
                    && typeof merge.active === 'object' && typeof merge.passive === 'object'
                    && typeof merge.finalPosition === 'object'
                    && merge.active.from && merge.active.to
                    && merge.passive.from && merge.passive.to
                    && merge.value !== undefined && !isNaN(merge.value);
            });
        }
        
        // 验证新方块数据
        if (this.lastMoveInfo.newTile) {
            const newTile = this.lastMoveInfo.newTile;
            if (!newTile.position || !newTile.value || isNaN(newTile.value)) {
                this.lastMoveInfo.newTile = null;
            }
        }
    }
    
    /**
     * 向上移动棋盘
     * @returns {boolean} - 是否发生了移动
     */
    moveUp() {
        let moved = false;
        const size = this.board.length;
        
        // 遍历每一列
        for (let c = 0; c < size; c++) {
            // 压缩并收集非零元素
            const tiles = [];
            for (let r = 0; r < size; r++) {
                if (this.board[r][c] !== 0) {
                    tiles.push({
                        value: this.board[r][c],
                        originalRow: r,
                        originalCol: c
                    });
                }
            }
            
            // 如果此列没有非零元素，跳过
            if (tiles.length === 0) continue;
            
            // 合并相同值的相邻方块
            const mergedTiles = [];
            let destRow = 0;
            
            let i = 0;
            while (i < tiles.length) {
                const current = tiles[i];
                
                // 检查是否可以与下一个方块合并
                if (i + 1 < tiles.length && current.value === tiles[i + 1].value) {
                    const next = tiles[i + 1];
                    const mergedValue = current.value * 2;
                    
                    // 记录合并信息
                    this.lastMoveInfo.merges.push({
                        active: {
                            from: { r: next.originalRow, c },
                            to: { r: destRow, c }
                        },
                        passive: {
                            from: { r: current.originalRow, c },
                            to: { r: destRow, c }
                        },
                        value: mergedValue,
                        finalPosition: { r: destRow, c }
                    });
                    
                    // 添加合并后的方块
                    mergedTiles.push({
                        value: mergedValue,
                        row: destRow
                    });
                    
                    // 增加得分
                    this.score += mergedValue;
                    
                    // 跳过下一个方块，因为已经合并了
                    i += 2;
                } else {
                    // 如果不能合并，则只是移动
                    if (current.originalRow !== destRow) {
                        this.lastMoveInfo.movements.push({
                            from: { r: current.originalRow, c },
                            to: { r: destRow, c },
                            value: current.value
                        });
                    }
                    
                    // 添加到新位置
                    mergedTiles.push({
                        value: current.value,
                        row: destRow
                    });
                    
                    i++;
                }
                
                // 移动到下一个位置
                destRow++;
            }
            
            // 更新棋盘
            for (let r = 0; r < size; r++) {
                const newValue = r < mergedTiles.length ? mergedTiles[r].value : 0;
                if (this.board[r][c] !== newValue) {
                    moved = true;
                    this.board[r][c] = newValue;
                }
            }
        }
        
        return moved;
    }
    
    /**
     * 向下移动棋盘
     * @returns {boolean} - 是否发生了移动
     */
    moveDown() {
        let moved = false;
        const size = this.board.length;
        
        // 遍历每一列
        for (let c = 0; c < size; c++) {
            // 压缩并收集非零元素（从底部开始）
            const tiles = [];
            for (let r = size - 1; r >= 0; r--) {
                if (this.board[r][c] !== 0) {
                    tiles.push({
                        value: this.board[r][c],
                        originalRow: r,
                        originalCol: c
                    });
                }
            }
            
            // 如果此列没有非零元素，跳过
            if (tiles.length === 0) continue;
            
            // 合并相同值的相邻方块
            const mergedTiles = [];
            let destRow = size - 1;
            
            let i = 0;
            while (i < tiles.length) {
                const current = tiles[i];
                
                // 检查是否可以与下一个方块合并
                if (i + 1 < tiles.length && current.value === tiles[i + 1].value) {
                    const next = tiles[i + 1];
                    const mergedValue = current.value * 2;
                    
                    // 记录合并信息
                    this.lastMoveInfo.merges.push({
                        active: {
                            from: { r: next.originalRow, c },
                            to: { r: destRow, c }
                        },
                        passive: {
                            from: { r: current.originalRow, c },
                            to: { r: destRow, c }
                        },
                        value: mergedValue,
                        finalPosition: { r: destRow, c }
                    });
                    
                    // 添加合并后的方块
                    mergedTiles.push({
                        value: mergedValue,
                        row: destRow
                    });
                    
                    // 增加得分
                    this.score += mergedValue;
                    
                    // 跳过下一个方块，因为已经合并了
                    i += 2;
                } else {
                    // 如果不能合并，则只是移动
                    if (current.originalRow !== destRow) {
                        this.lastMoveInfo.movements.push({
                            from: { r: current.originalRow, c },
                            to: { r: destRow, c },
                            value: current.value
                        });
                    }
                    
                    // 添加到新位置
                    mergedTiles.push({
                        value: current.value,
                        row: destRow
                    });
                    
                    i++;
                }
                
                // 移动到下一个位置（向上移动）
                destRow--;
            }
            
            // 更新棋盘
            for (let r = 0; r < size; r++) {
                let newValue = 0;
                for (const tile of mergedTiles) {
                    if (tile.row === r) {
                        newValue = tile.value;
                        break;
                    }
                }
                
                if (this.board[r][c] !== newValue) {
                    moved = true;
                    this.board[r][c] = newValue;
                }
            }
        }
        
        return moved;
    }
    
    /**
     * 向左移动棋盘
     * @returns {boolean} - 是否发生了移动
     */
    moveLeft() {
        let moved = false;
        const size = this.board.length;
        
        // 遍历每一行
        for (let r = 0; r < size; r++) {
            // 压缩并收集非零元素
            const tiles = [];
            for (let c = 0; c < size; c++) {
                if (this.board[r][c] !== 0) {
                    tiles.push({
                        value: this.board[r][c],
                        originalRow: r,
                        originalCol: c
                    });
                }
            }
            
            // 如果此行没有非零元素，跳过
            if (tiles.length === 0) continue;
            
            // 合并相同值的相邻方块
            const mergedTiles = [];
            let destCol = 0;
            
            let i = 0;
            while (i < tiles.length) {
                const current = tiles[i];
                
                // 检查是否可以与下一个方块合并
                if (i + 1 < tiles.length && current.value === tiles[i + 1].value) {
                    const next = tiles[i + 1];
                    const mergedValue = current.value * 2;
                    
                    // 记录合并信息
                    this.lastMoveInfo.merges.push({
                        active: {
                            from: { r, c: next.originalCol },
                            to: { r, c: destCol }
                        },
                        passive: {
                            from: { r, c: current.originalCol },
                            to: { r, c: destCol }
                        },
                        value: mergedValue,
                        finalPosition: { r, c: destCol }
                    });
                    
                    // 添加合并后的方块
                    mergedTiles.push({
                        value: mergedValue,
                        col: destCol
                    });
                    
                    // 增加得分
                    this.score += mergedValue;
                    
                    // 跳过下一个方块，因为已经合并了
                    i += 2;
                } else {
                    // 如果不能合并，则只是移动
                    if (current.originalCol !== destCol) {
                        this.lastMoveInfo.movements.push({
                            from: { r, c: current.originalCol },
                            to: { r, c: destCol },
                            value: current.value
                        });
                    }
                    
                    // 添加到新位置
                    mergedTiles.push({
                        value: current.value,
                        col: destCol
                    });
                    
                    i++;
                }
                
                // 移动到下一个位置
                destCol++;
            }
            
            // 更新棋盘
            for (let c = 0; c < size; c++) {
                let newValue = 0;
                for (const tile of mergedTiles) {
                    if (tile.col === c) {
                        newValue = tile.value;
                        break;
                    }
                }
                
                if (this.board[r][c] !== newValue) {
                    moved = true;
                    this.board[r][c] = newValue;
                }
            }
        }
        
        return moved;
    }
    
    /**
     * 向右移动棋盘
     * @returns {boolean} - 是否发生了移动
     */
    moveRight() {
        let moved = false;
        const size = this.board.length;
        
        // 遍历每一行
        for (let r = 0; r < size; r++) {
            // 压缩并收集非零元素（从右边开始）
            const tiles = [];
            for (let c = size - 1; c >= 0; c--) {
                if (this.board[r][c] !== 0) {
                    tiles.push({
                        value: this.board[r][c],
                        originalRow: r,
                        originalCol: c
                    });
                }
            }
            
            // 如果此行没有非零元素，跳过
            if (tiles.length === 0) continue;
            
            // 合并相同值的相邻方块
            const mergedTiles = [];
            let destCol = size - 1;
            
            let i = 0;
            while (i < tiles.length) {
                const current = tiles[i];
                
                // 检查是否可以与下一个方块合并
                if (i + 1 < tiles.length && current.value === tiles[i + 1].value) {
                    const next = tiles[i + 1];
                    const mergedValue = current.value * 2;
                    
                    // 记录合并信息
                    this.lastMoveInfo.merges.push({
                        active: {
                            from: { r, c: next.originalCol },
                            to: { r, c: destCol }
                        },
                        passive: {
                            from: { r, c: current.originalCol },
                            to: { r, c: destCol }
                        },
                        value: mergedValue,
                        finalPosition: { r, c: destCol }
                    });
                    
                    // 添加合并后的方块
                    mergedTiles.push({
                        value: mergedValue,
                        col: destCol
                    });
                    
                    // 增加得分
                    this.score += mergedValue;
                    
                    // 跳过下一个方块，因为已经合并了
                    i += 2;
                } else {
                    // 如果不能合并，则只是移动
                    if (current.originalCol !== destCol) {
                        this.lastMoveInfo.movements.push({
                            from: { r, c: current.originalCol },
                            to: { r, c: destCol },
                            value: current.value
                        });
                    }
                    
                    // 添加到新位置
                    mergedTiles.push({
                        value: current.value,
                        col: destCol
                    });
                    
                    i++;
                }
                
                // 移动到下一个位置（向左移动）
                destCol--;
            }
            
            // 更新棋盘
            for (let c = 0; c < size; c++) {
                let newValue = 0;
                for (const tile of mergedTiles) {
                    if (tile.col === c) {
                        newValue = tile.value;
                        break;
                    }
                }
                
                if (this.board[r][c] !== newValue) {
                    moved = true;
                    this.board[r][c] = newValue;
                }
            }
        }
        
        return moved;
    }
    
    /**
     * 获取上一次移动的信息
     * @returns {Object|null} - 上一次移动的信息
     */
    getLastMoveInfo() {
        return this.lastMoveInfo;
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
        this.lastMoveInfo = null; // 重置移动信息
        
        // 检查是否已经达到获胜条件
        this.hasWon();
    }
}