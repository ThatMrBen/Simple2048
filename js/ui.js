/**
 * ui.js
 * 游戏UI相关功能，负责处理游戏界面的渲染和交互
 */

/**
 * 游戏UI类，负责管理游戏界面元素和交互
 */
class GameUI {
    /**
     * 构造函数，初始化UI元素引用和事件监听
     * @param {function} onMove - 移动事件回调
     * @param {function} onRestart - 重启游戏回调
     * @param {function} onExportState - 导出游戏状态回调
     * @param {function} onImportState - 导入游戏状态回调
     */
    constructor(onMove, onRestart, onExportState, onImportState) {
        this.onMove = onMove;
        this.onRestart = onRestart;
        this.onExportState = onExportState;
        this.onImportState = onImportState;
        
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // 初始化DOM元素引用
        this.initDOMReferences();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 设置游戏介绍文本
        this.setupGameIntroduction();
        
        // 设置头部布局
        this.setupHeaderLayout();
    }
    
    /**
     * 初始化DOM元素引用
     */
    initDOMReferences() {
        // 游戏区域
        this.gameBoardDiv = document.getElementById('game-board');
        this.gameHeaderDiv = document.querySelector('.game-header');
        this.headerTitleActionRow = document.querySelector('.header-title-action-mobile-row');
        this.gameTitleText = document.getElementById('game-title-text');
        this.screenshotStatsDisplay = document.getElementById('screenshot-stats-display');
        
        // 分数显示
        this.scoresContainer = document.querySelector('.header-scores-container');
        this.currentScoreValueDiv = document.getElementById('current-score-value');
        this.bestScoreValueDiv = document.getElementById('best-score-value');
        this.currentMovesValueDiv = document.getElementById('current-moves-value');
        this.bestMovesValueDiv = document.getElementById('best-moves-value');
        
        // 头部按钮
        this.infoButton = document.getElementById('info-button');
        this.saveButton = document.getElementById('save-button');
        this.restartButton = document.getElementById('restart-button');
        
        // 游戏结束弹窗
        this.gameOverModal = document.getElementById('game-over-modal');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.modalStepsScoreText = document.getElementById('modal-steps-score-text');
        this.modalFeedbackText = document.getElementById('modal-feedback-text');
        this.modalRestartButton = document.getElementById('modal-restart-button');
        this.modalScreenshotButton = document.getElementById('modal-screenshot-button');
        
        // 信息弹窗
        this.infoModal = document.getElementById('info-modal');
        this.infoModalContent = document.getElementById('info-modal-content');
        
        // 存档/读档弹窗
        this.saveLoadModal = document.getElementById('save-load-modal');
        this.exportDataTextarea = document.getElementById('export-data-textarea');
        this.copySaveDataButton = document.getElementById('copy-save-data-button');
        this.importDataTextarea = document.getElementById('import-data-textarea');
        this.importSaveDataButton = document.getElementById('import-save-data-button');
        
        // 重启确认弹窗
        this.restartConfirmModal = document.getElementById('restart-confirm-modal');
        this.restartConfirmYesButton = document.getElementById('restart-confirm-yes');
        this.restartConfirmNoButton = document.getElementById('restart-confirm-no');
        
        // 通用弹窗元素
        this.allModalCloseButtons = document.querySelectorAll('.modal-close-btn');
        this.mobileHeaderActionsGroup = null; // 用于在移动端分组保存/重启按钮
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 弹窗关闭按钮
        this.allModalCloseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.modalId;
                if (modalId) this.hideModal(document.getElementById(modalId));
            });
        });
        
        // 头部按钮
        this.infoButton.addEventListener('click', () => this.showModal(this.infoModal));
        this.saveButton.addEventListener('click', () => {
            if (this.onExportState) {
                const exportedData = this.onExportState();
                this.exportDataTextarea.value = exportedData;
                this.importDataTextarea.value = ''; // 清空导入区域
                this.showModal(this.saveLoadModal);
            }
        });
        this.restartButton.addEventListener('click', () => this.attemptRestart());
        
        // 游戏结束弹窗按钮
        this.modalRestartButton.addEventListener('click', () => {
            this.hideModal(this.gameOverModal);
            if (this.onRestart) this.onRestart();
            Utils.showToast('新游戏开始!', 'success');
        });
        
        this.modalScreenshotButton.addEventListener('click', () => {
            this.hideModal(this.gameOverModal);
            
            // 检查游戏是否已经结束，如果已结束则显示黑底弹窗提示
            if (this.gameOverModal.classList.contains('active') || document.querySelector('.game-end-stats')) {
                Utils.showToast('游戏已经结束，请点击重新开始再来一局吧！', 'info_dark', 3000);
                
                // 添加点击事件监听器，点击后显示截图统计
                const toastElement = document.getElementById('toast-notification');
                if (toastElement) {
                    const showStatsAfterToast = () => {
                        // 显示截图统计
                        const scoreValue = this.currentScoreValueDiv.textContent;
                        const movesValue = this.currentMovesValueDiv.textContent;
                        this.screenshotStatsDisplay.innerHTML = `在 <strong>${movesValue}</strong> 步内达到了 <strong>${scoreValue}</strong> 分`;
                        this.screenshotStatsDisplay.classList.add('visible');
                        
                        // 调整截图统计显示的样式，确保与计分板之间没有多余的空行
                        this.screenshotStatsDisplay.style.marginTop = '0';
                        this.screenshotStatsDisplay.style.marginBottom = '10px';
                        
                        // 移除事件监听器
                        toastElement.removeEventListener('click', showStatsAfterToast);
                    };
                    
                    toastElement.addEventListener('click', showStatsAfterToast);
                }
            } else {
                // 如果游戏未结束，直接显示截图统计
                const scoreValue = this.currentScoreValueDiv.textContent;
                const movesValue = this.currentMovesValueDiv.textContent;
                this.screenshotStatsDisplay.innerHTML = `在 <strong>${movesValue}</strong> 步内达到了 <strong>${scoreValue}</strong> 分`;
                this.screenshotStatsDisplay.classList.add('visible');
                
                // 调整截图统计显示的样式，确保与计分板之间没有多余的空行
                this.screenshotStatsDisplay.style.marginTop = '0';
                this.screenshotStatsDisplay.style.marginBottom = '10px';
            }
        });
        
        // 存档/读档弹窗按钮
        this.copySaveDataButton.addEventListener('click', () => {
            if (!navigator.clipboard) { // 旧浏览器兼容
                try {
                    this.exportDataTextarea.select();
                    document.execCommand('copy');
                    Utils.showToast('已复制 (旧版)', 'warning');
                } catch (err) {
                    Utils.showToast('复制失败', 'error');
                }
                return;
            }
            
            // 现代剪贴板API
            navigator.clipboard.writeText(this.exportDataTextarea.value).then(() => {
                Utils.showToast('复制成功!');
            }).catch(err => {
                Utils.showToast('复制失败!', 'error');
                console.error('Failed to copy: ', err);
            });
        });
        
        this.importSaveDataButton.addEventListener('click', () => {
            try {
                const importedDataString = this.importDataTextarea.value.trim();
                if (!importedDataString) {
                    Utils.showToast('导入数据不能为空。', 'error');
                    return;
                }
                if (this.onImportState) {
                    this.onImportState(importedDataString);
                    this.hideModal(this.saveLoadModal);
                    Utils.showToast('存档导入成功！', 'success');
                }
            } catch (error) {
                console.error("导入存档失败:", error);
                let errorMessage = "导入存档失败：";
                if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
                    errorMessage += '数据格式不正确，请检查是否为有效的存档数据。';
                } else if (error.message.includes('存档数据无效或为空')) {
                    errorMessage += '存档数据无效或为空，请检查。';
                } else if (error.message.includes('存档棋盘尺寸不匹配')) {
                    errorMessage += '存档棋盘尺寸不匹配，请检查。';
                } else if (error.message.includes('存档包含无效的数字块值')) {
                    errorMessage += '存档包含无效的数字块值，请检查。';
                } else {
                    errorMessage += error.message;
                }
                Utils.showToast(errorMessage, 'error');
            }
        });
        
        // 重启确认弹窗按钮
        this.restartConfirmYesButton.addEventListener('click', () => {
            this.hideModal(this.restartConfirmModal);
            if (this.onRestart) this.onRestart();
            Utils.showToast('游戏已重置!', 'success');
        });
        
        this.restartConfirmNoButton.addEventListener('click', () => {
            this.hideModal(this.restartConfirmModal);
        });
        
        // 触摸事件
        this.gameBoardDiv.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.gameBoardDiv.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 窗口大小调整事件
        window.addEventListener('resize', this.setupHeaderLayout.bind(this));
    }
    
    /**
     * 设置游戏介绍文本
     */
    setupGameIntroduction() {
        const formattedMainText = Utils.formatGameIntroText(CONFIG.GAME_INTRO.MAIN);
        const secretMessage = CONFIG.GAME_INTRO.SECRET_MESSAGE;
        const projectInfo = CONFIG.GAME_INTRO.PROJECT_INFO;
        
        const finalText = `${formattedMainText}
<br>
<div class="secret-message-container" style="line-height: 1.6;">
  <span style="color: var(--game-bg); -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text;">${secretMessage}</span>
</div>
<br>
${projectInfo}`;
        
        this.infoModalContent.innerHTML = finalText;
    }
    
    /**
     * 设置头部布局
     */
    setupHeaderLayout() {
        // 移除并重新添加按钮以确保正确的DOM结构
        [this.saveButton, this.restartButton].forEach(el => {
            if (el && el.parentNode !== this.mobileHeaderActionsGroup) el.parentNode?.removeChild(el);
        });
        
        if (this.mobileHeaderActionsGroup && this.mobileHeaderActionsGroup.parentNode !== this.headerTitleActionRow) {
            this.mobileHeaderActionsGroup.parentNode?.removeChild(this.mobileHeaderActionsGroup);
        }
        
        // 创建右对齐的头部操作按钮容器
        if (!this.mobileHeaderActionsGroup) {
            this.mobileHeaderActionsGroup = document.createElement('div');
            this.mobileHeaderActionsGroup.style.display = 'flex';
            this.mobileHeaderActionsGroup.style.gap = '10px';
            this.mobileHeaderActionsGroup.style.gridColumn = '3'; // 在网格中的位置
            this.mobileHeaderActionsGroup.style.justifySelf = 'end';
        }
        
        this.mobileHeaderActionsGroup.innerHTML = ''; // 清除之前的内容
        
        // 添加保存和重启按钮到操作组
        this.mobileHeaderActionsGroup.appendChild(this.saveButton);
        this.mobileHeaderActionsGroup.appendChild(this.restartButton);
        this.saveButton.style.display = ''; // 确保按钮可见
        this.restartButton.style.display = '';
        
        // 将操作组添加到头部行
        if (this.mobileHeaderActionsGroup.parentNode !== this.headerTitleActionRow) {
            this.headerTitleActionRow.appendChild(this.mobileHeaderActionsGroup);
        }
        
        // 确保分数容器和截图统计显示在正确的位置
        if (this.scoresContainer.parentNode !== this.gameHeaderDiv) {
            this.gameHeaderDiv.appendChild(this.scoresContainer);
        }
        
        if (this.screenshotStatsDisplay.parentNode !== this.gameHeaderDiv) {
            this.gameHeaderDiv.appendChild(this.screenshotStatsDisplay);
        }
        
        // 相对于其他头部元素正确定位分数和统计显示
        this.gameHeaderDiv.insertBefore(this.scoresContainer, this.headerTitleActionRow.nextSibling);
        this.gameHeaderDiv.insertBefore(this.screenshotStatsDisplay, this.scoresContainer.nextSibling);
        
        // 设置按钮图标和ARIA标签
        this.infoButton.innerHTML = CONFIG.ICONS.INFO;
        this.infoButton.className = 'header-icon-btn';
        this.infoButton.setAttribute('aria-label', '游戏介绍');
        
        this.saveButton.innerHTML = CONFIG.ICONS.SAVE;
        this.saveButton.className = 'header-icon-btn';
        this.saveButton.setAttribute('aria-label', '存档');
        
        this.restartButton.innerHTML = CONFIG.ICONS.RESTART;
        this.restartButton.className = 'header-icon-btn';
        this.restartButton.setAttribute('aria-label', '重新开始');
        
        // 根据可见按钮动态调整游戏标题位置以获得更好的居中效果
        const infoBtnVisible = this.infoButton && this.infoButton.offsetParent !== null && 
                              getComputedStyle(this.infoButton).display !== 'none';
        const numLeftButtons = infoBtnVisible ? 1 : 0;
        
        let numRightButtons = 0;
        if (this.mobileHeaderActionsGroup && this.mobileHeaderActionsGroup.offsetParent !== null) {
            numRightButtons = Array.from(this.mobileHeaderActionsGroup.children)
                                  .filter(btn => btn.offsetParent !== null && 
                                          getComputedStyle(btn).display !== 'none' && 
                                          btn.tagName === 'BUTTON').length;
        }
        
        let representativeButtonWidth = 0;
        const visibleHeaderButtons = [this.infoButton, ...Array.from(this.mobileHeaderActionsGroup?.children || [])]
                                     .filter(b => b && b.offsetParent !== null && 
                                             getComputedStyle(b).display !== 'none' && 
                                             b.offsetWidth > 0);
        
        if (visibleHeaderButtons.length > 0) {
            representativeButtonWidth = visibleHeaderButtons[0].offsetWidth;
        } else { // 如果按钮尚未渲染，则使用备用方案
            const fs = parseFloat(getComputedStyle(this.infoButton).fontSize);
            representativeButtonWidth = fs * 1.6 || 40; // 基于字体大小的估计
        }
        
        let shiftAmount = 0;
        const shiftValue = representativeButtonWidth / 2 + 5; // 移动量
        
        if (numLeftButtons > numRightButtons) shiftAmount = -shiftValue;
        else if (numRightButtons > numLeftButtons) shiftAmount = shiftValue;
        
        this.gameTitleText.style.transform = `translateX(${shiftAmount}px)`;
    }
    
    /**
     * 更新分数显示
     * @param {number} currentScore - 当前分数
     * @param {number} bestScore - 最高分数
     * @param {number} movesMade - 当前步数
     * @param {number} bestMoves - 最高分数对应的步数
     */
    updateScoreDisplay(currentScore, bestScore, movesMade, bestMoves) {
        this.currentScoreValueDiv.textContent = currentScore;
        this.bestScoreValueDiv.textContent = bestScore;
        
        if (this.currentMovesValueDiv) {
            this.currentMovesValueDiv.textContent = movesMade;
        }
        
        // 显示最高分对应的步数；如果没有最高分则显示0
        if (this.bestMovesValueDiv) {
            this.bestMovesValueDiv.textContent = bestScore > 0 ? bestMoves : 0;
        }
    }
    
    /**
     * 更新游戏棋盘DOM
     * @param {number[][]} board - 游戏棋盘数组
     * @param {boolean} addNewTileAnimation - 是否为新生成的数字块添加动画效果
     */
    updateBoardDOM(board, addNewTileAnimation = true) {
        this.gameBoardDiv.innerHTML = ''; // 清除之前的棋盘
        
        // 为棋盘上的每个单元格创建并设置样式
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[r].length; c++) {
                const cellValue = board[r][c];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'cell'; // 所有单元格的基本类
                
                if (cellValue > 0) {
                    cellDiv.textContent = cellValue;
                    cellDiv.classList.add(`cell-${cellValue}`); // 特定数值单元格的样式类
                    
                    // 为新生成的数字块添加动画效果
                    if (addNewTileAnimation) {
                        cellDiv.classList.add('cell-new');
                    }
                }
                
                this.gameBoardDiv.appendChild(cellDiv);
            }
        }
    }
    
    /**
     * 显示游戏结束弹窗
     * @param {number} finalScore - 最终分数
     * @param {number} movesMade - 移动步数
     * @param {boolean} achieved2048 - 是否达到2048
     * @param {number} bestScore - 最高分数
     */
    showGameOverModal(finalScore, movesMade, achieved2048, bestScore) {
        // 显示分数和步数
        this.modalStepsScoreText.innerHTML = `用 <strong>${movesMade}</strong> 步达到了 <strong>${finalScore}</strong> 分。`;
        this.gameOverTitle.textContent = "游戏结束!";
        
        let feedbackHTML = "";
        if (achieved2048) { // 达到2048方块
            feedbackHTML = "你已成功达到2048";
            if (finalScore > CONFIG.WIN_TILE) { // 继续玩到超过2048
                feedbackHTML += `并继续挑战到了 <strong>${finalScore}</strong> 分！<br>`;
            } else {
                feedbackHTML += "！<br>";
            }
        }
        
        // 检查是否创造新的最高分
        if (finalScore > bestScore) {
            feedbackHTML += `恭喜破纪录！新纪录 <strong>${finalScore}</strong> 分！`;
            if (bestScore > 0) { // 如果之前有最高分
                feedbackHTML += ` (进步 <strong>${finalScore - bestScore}</strong> 分！)`;
            }
        } else if (finalScore === bestScore && bestScore > 0) {
            feedbackHTML += "平了最高纪录，很棒！";
        } else if (bestScore > 0) {
            feedbackHTML += `还差 <strong>${bestScore - finalScore}</strong> 分就能刷新纪录啦。`;
        } else if (!achieved2048) { // 没有之前的最高分且没有达到2048
            feedbackHTML += "继续努力，创造你的第一个高分吧！";
        }
        
        // 如果没有特定的反馈，提供默认反馈
        if (feedbackHTML.trim() === "" || (feedbackHTML.endsWith("<br>") && feedbackHTML.replace("<br>","").trim() === "你已成功达到2048！")) {
            if (!achieved2048 && finalScore === 0) feedbackHTML += "从零开始，加油！";
            else if (!achieved2048 && finalScore > 0) feedbackHTML += "再接再厉！";
        }
        
        this.modalFeedbackText.innerHTML = feedbackHTML;
        Utils.launchConfetti(); // 用彩带庆祝游戏结束
        
        this.showModal(this.gameOverModal);
    }
    
    /**
     * 显示指定的弹窗
     * @param {HTMLElement} modalElement - 要显示的弹窗元素
     */
    showModal(modalElement) {
        modalElement.classList.add('active');
    }
    
    /**
     * 隐藏指定的弹窗
     * @param {HTMLElement} modalElement - 要隐藏的弹窗元素
     */
    hideModal(modalElement) {
        modalElement.classList.remove('active');
    }
    
    /**
     * 隐藏所有弹窗
     */
    hideAllModals() {
        [this.gameOverModal, this.infoModal, this.saveLoadModal, this.restartConfirmModal].forEach(modal => {
            this.hideModal(modal);
        });
    }
    
    /**
     * 尝试重启游戏
     * 如果游戏已经开始（movesMade > 0），则显示确认弹窗
     */
    attemptRestart() {
        // 如果另一个弹窗（除了重启确认弹窗本身）已经打开，则不显示确认
        if (Utils.isAnyModalActive() && !this.restartConfirmModal.classList.contains('active')) {
            return;
        }
        
        const movesMade = parseInt(this.currentMovesValueDiv.textContent);
        if (movesMade > 0) { // 如果游戏已经开始，询问确认
            this.showModal(this.restartConfirmModal);
        } else { // 如果没有移动，直接重启
            if (this.onRestart) this.onRestart();
            Utils.showToast('游戏已重置!', 'success');
        }
    }
    
    /**
     * 处理触摸开始事件
     * @param {TouchEvent} event - 触摸事件对象
     */
    handleTouchStart(event) {
        if (Utils.isAnyModalActive()) return; // 如果弹窗打开则忽略触摸
        
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }
    
    /**
     * 处理触摸结束事件
     * @param {TouchEvent} event - 触摸事件对象
     */
    handleTouchEnd(event) {
        if (this.isAnimating || Utils.isAnyModalActive()) return; // 如果正在动画或弹窗打开则忽略
        
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // 如果滑动距离太小则忽略
        if (Math.abs(deltaX) < CONFIG.MIN_SWIPE_DISTANCE && Math.abs(deltaY) < CONFIG.MIN_SWIPE_DISTANCE) return;
        
        event.preventDefault(); // 防止滑动时页面滚动
        
        // 确定滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) { // 水平滑动
            if (this.onMove) this.onMove(deltaX > 0 ? 'right' : 'left');
        } else { // 垂直滑动
            if (this.onMove) this.onMove(deltaY > 0 ? 'down' : 'up');
        }
    }
    
    /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} event - 键盘事件对象
     */
    handleKeyDown(event) {
        if (this.isAnimating || Utils.isAnyModalActive()) return; // 如果正在动画或弹窗打开则忽略
        
        let moved = false;
        switch (event.key) {
            case 'ArrowLeft': case 'a': case 'A':
                if (this.onMove) this.onMove('left');
                moved = true;
                break;
            case 'ArrowRight': case 'd': case 'D':
                if (this.onMove) this.onMove('right');
                moved = true;
                break;
            case 'ArrowUp': case 'w': case 'W':
                if (this.onMove) this.onMove('up');
                moved = true;
                break;
            case 'ArrowDown': case 's': case 'S':
                if (this.onMove) this.onMove('down');
                moved = true;
                break;
        }
        
        if (moved) {
            event.preventDefault(); // 防止箭头键的默认行为（滚动）
        }
    }
    
    /**
     * 设置动画状态
     * @param {boolean} isAnimating - 是否正在动画中
     */
    setAnimating(isAnimating) {
        this.isAnimating = isAnimating;
    }
    
    /**
     * 隐藏截图统计显示
     */
    hideScreenshotStats() {
        this.screenshotStatsDisplay.classList.remove('visible');
    }
    
    /**
     * 显示游戏结束后的步数和分数信息
     * @param {number} movesMade - 移动步数
     * @param {number} finalScore - 最终分数
     */
    showGameEndStats(movesMade, finalScore) {
        // 创建或更新游戏结束统计信息
        if (!this.gameEndStatsDiv) {
            this.gameEndStatsDiv = document.createElement('div');
            this.gameEndStatsDiv.className = 'game-end-stats';
            // 插入到计分板下方，游戏棋盘上方
            this.gameBoardDiv.parentNode.insertBefore(this.gameEndStatsDiv, this.gameBoardDiv);
        }
        
        this.gameEndStatsDiv.innerHTML = `在 <strong>${movesMade}</strong> 步内达到了 <strong>${finalScore}</strong> 分`;
        this.gameEndStatsDiv.style.opacity = '0';
        this.gameEndStatsDiv.style.transform = 'translateY(-20px)';
        this.gameEndStatsDiv.style.marginTop = '0'; // 减少与上方元素的间距
        this.gameEndStatsDiv.style.marginBottom = '10px'; // 设置与下方游戏板的间距
        
        // 使用setTimeout确保CSS过渡效果生效
        setTimeout(() => {
            this.gameEndStatsDiv.style.opacity = '1';
            this.gameEndStatsDiv.style.transform = 'translateY(0)';
            // 同时将游戏棋盘向下平移
            this.gameBoardDiv.style.transform = 'translateY(10px)';
        }, 50);
    }
    
    /**
     * 隐藏游戏结束后的步数和分数信息
     */
    hideGameEndStats() {
        if (this.gameEndStatsDiv) {
            this.gameEndStatsDiv.style.opacity = '0';
            this.gameEndStatsDiv.style.transform = 'translateY(-20px)';
            // 恢复游戏棋盘位置
            this.gameBoardDiv.style.transform = 'translateY(0)';
            
            // 使用setTimeout确保CSS过渡效果完成后再移除元素
            setTimeout(() => {
                if (this.gameEndStatsDiv && this.gameEndStatsDiv.parentNode) {
                    this.gameEndStatsDiv.parentNode.removeChild(this.gameEndStatsDiv);
                    this.gameEndStatsDiv = null;
                }
            }, 300);
        }
    }
}