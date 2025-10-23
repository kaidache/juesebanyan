// ui_handlers.js (已修复 Bug)

GameApp.ui = {};
GameApp.elements = {};

function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {

    const getElements = () => {
        const E = GameApp.elements;
        E.gameOutputDiv = document.getElementById('gameOutput');
        E.playerInput = document.getElementById('playerInput');
        E.sendButton = document.getElementById('sendButton');
        E.cancelButton = document.getElementById('cancelButton');
        // 删除：输入区域的推进剧情按钮（已迁移到消息内）
        // E.advancePlotBtn = document.getElementById('advancePlotBtn');
        // E.advancePlotMajorBtn = document.getElementById('advancePlotMajorBtn');
        E.statusBarPre = document.getElementById('statusBar');
        E.editAvatarsBtn = document.getElementById('editAvatarsBtn');
        E.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        E.mainSettingsToggleBtn = document.getElementById('mainSettingsToggleBtn');
        E.promptSettingsToggleBtn = document.getElementById('promptSettingsToggleBtn');
        E.settingsModal = document.getElementById('settingsModal');
        E.closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
        E.promptSettingsModal = document.getElementById('promptSettingsModal');
        E.closePromptSettingsModalBtn = document.getElementById('closePromptSettingsModalBtn');
        E.tabButtons = document.querySelectorAll('.tab-button');
        E.tabContents = document.querySelectorAll('.settings-tab-content');
        E.apiProviderSelect = document.getElementById('apiProvider');
        E.apiKeyInput = document.getElementById('apiKey');
        E.apiBaseUrlInput = document.getElementById('apiBaseUrl');
        E.apiModelInput = document.getElementById('apiModel');
        E.memoryCountInput = document.getElementById('memoryCount');
        E.saveApiSettingsBtn = document.getElementById('saveApiSettingsBtn');
        E.apiSettingsStatus = document.getElementById('apiSettingsStatus');
        E.apiModelListDisplay = document.getElementById('apiModelListDisplay');
        E.getApiModelsBtn = document.getElementById('getApiModelsBtn');
        E.streamToggle = document.getElementById('streamToggle');
        E.temperatureSlider = document.getElementById('temperatureSlider');
        E.temperatureValue = document.getElementById('temperatureValue');
        E.topPSlider = document.getElementById('topPSlider');
        E.topPValue = document.getElementById('topPValue');
        E.topKSlider = document.getElementById('topKSlider');
        E.topKValue = document.getElementById('topKValue');
        E.systemPromptTextareaModal = document.getElementById('systemPromptTextareaModal');
        E.prefixTextareaModal = document.getElementById('prefixTextareaModal');
        E.postfixTextareaModal = document.getElementById('postfixTextareaModal');
        E.savePromptFromModalBtn = document.getElementById('savePromptFromModalBtn');
        E.summaryApiKeyInput = document.getElementById('summaryApiKey');
        E.summaryApiBaseUrlInput = document.getElementById('summaryApiBaseUrl');
        E.summaryApiModelInput = document.getElementById('summaryApiModel');
        E.summaryPromptTextarea = document.getElementById('summaryPromptTextarea');
        E.summaryContentDisplay = document.getElementById('summaryContentDisplay');
        E.saveSummarySettingsBtn = document.getElementById('saveSummarySettingsBtn');
        E.summarySettingsStatus = document.getElementById('summarySettingsStatus');
        E.getSummaryModelsBtn = document.getElementById('getSummaryModelsBtn');
        E.summaryModelListDisplay = document.getElementById('summaryModelListDisplay');
        E.avatarEditModal = document.getElementById('avatarEditModal');
        E.closeAvatarEditModalBtn = document.getElementById('closeAvatarEditModalBtn');
        E.playerAvatarUrlInput = document.getElementById('playerAvatarUrlInput');
        E.playerAvatarFileInput = document.getElementById('playerAvatarFileInput');
        E.playerAvatarPreview = document.getElementById('playerAvatarPreview');
        E.aiAvatarUrlInput = document.getElementById('aiAvatarUrlInput');
        E.aiAvatarFileInput = document.getElementById('aiAvatarFileInput');
        E.aiAvatarPreview = document.getElementById('aiAvatarPreview');
        E.saveAvatarsBtn = document.getElementById('saveAvatarsBtn');
        E.resetAvatarsBtn = document.getElementById('resetAvatarsBtn');
        E.avatarEditStatus = document.getElementById('avatarEditStatus');
        
        // 组合管理相关元素
        E.promptComboSelect = document.getElementById('promptComboSelect');
        E.manageComboBtn = document.getElementById('manageComboBtn');
        E.comboManageModal = document.getElementById('comboManageModal');
        E.closeComboManageModalBtn = document.getElementById('closeComboManageModalBtn');
        E.comboListDiv = document.getElementById('comboList');
        E.newComboBtn = document.getElementById('addComboBtn');
        E.renameComboBtn = document.getElementById('renameComboBtn');
        E.deleteComboBtn = document.getElementById('deleteComboBtn');
        
        // API Key 档案管理相关元素
        E.apiKeyProfileSelect = document.getElementById('apiKeyProfileSelect');
        E.manageApiKeyProfilesBtn = document.getElementById('manageApiKeyProfilesBtn');
        E.apiKeyProfileManageModal = document.getElementById('apiKeyProfileManageModal');
        E.closeApiKeyProfileManageModalBtn = document.getElementById('closeApiKeyProfileManageModalBtn');
        E.apiKeyProfileListDiv = document.getElementById('apiKeyProfileList');
        E.addApiKeyProfileBtn = document.getElementById('addApiKeyProfileBtn');
        E.renameApiKeyProfileBtn = document.getElementById('renameApiKeyProfileBtn');
        E.deleteApiKeyProfileBtn = document.getElementById('deleteApiKeyProfileBtn');
        
        // 导入/导出相关元素
        E.openImportExportBtn = document.getElementById('openImportExportBtn');
        E.importExportModal = document.getElementById('importExportModal');
        E.closeImportExportModalBtn = document.getElementById('closeImportExportModalBtn');
        E.importFormatSelect = document.getElementById('importFormatSelect');
        E.importFileInput = document.getElementById('importFileInput');
        E.startImportBtn = document.getElementById('startImportBtn');
        E.importProgressBar = document.getElementById('importProgressBar');
        E.importProgressText = document.getElementById('importProgressText');
        E.importLogArea = document.getElementById('importLogArea');
        E.exportFormatSelect = document.getElementById('exportFormatSelect');
        E.exportScopeSelect = document.getElementById('exportScopeSelect');
        E.startExportBtn = document.getElementById('startExportBtn');
        E.exportProgressBar = document.getElementById('exportProgressBar');
        E.exportProgressText = document.getElementById('exportProgressText');
        E.exportLogArea = document.getElementById('exportLogArea');
        

        

    };
    
    const createGuardedAction = (callback) => {
        return (...args) => {
            const S = GameApp.state;
            const ui = GameApp.ui;
            if (S.isAiResponding || S.isSummarizing) {
                ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }
            // 触发动作（如发送消息）前，恢复自动滚动
            S.autoScrollEnabled = true;
            callback(...args);
        };
    };

    const defineUiFunctions = () => {
        const ui = GameApp.ui;
        const E = GameApp.elements;
        const S = GameApp.state;
        const L = GameApp.logic;

        const formatMessageText = (text) => {
            if (typeof text !== 'string') return '';
            let escapedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            escapedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return escapedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        };

        const createActionButton = (label, title, onClick) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            button.title = title;
            button.onclick = onClick;
            return button;
        };

        const getRoleClass = (role) => {
            if (role === 'user') return 'player-message';
            if (role === 'assistant') return 'ai-message';
            if (role === 'error-display') return 'ai-message ai-error-message';
            return 'system-message';
        };

        // 统一的滚动到底部函数（带自动滚动开关和回退）
        ui.scrollToBottom = (behavior = 'smooth') => {
            if (!S.autoScrollEnabled) return;
            setTimeout(() => {
                if (E.gameOutputDiv) {
                    const top = E.gameOutputDiv.scrollHeight;
                    if (typeof E.gameOutputDiv.scrollTo === 'function') {
                        E.gameOutputDiv.scrollTo({ top, behavior });
                    } else {
                        E.gameOutputDiv.scrollTop = top;
                    }
                }
            }, 0);
        };

        ui.addMessageToGameOutputDOM = (messageData) => {
            const messageContent = messageData.content || messageData.text || '';
            const { type, id, floor, modelName, isSummaryNotification = false, role, mediaContent } = messageData;
            
            const messageType = type || getRoleClass(role);

            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble');
            messageType.split(' ').forEach(cls => { if(cls) bubble.classList.add(cls); });

            if (id != null) bubble.dataset.messageId = id;
            if (floor != null && !isSummaryNotification) bubble.dataset.floorId = floor;

            if (messageType.includes('system-message')) {
                bubble.innerHTML = formatMessageText(messageContent);
                if (messageType.includes('success')) bubble.classList.add('success');
                if (messageType.includes('error')) bubble.classList.add('error');
                if (messageType.includes('warning')) bubble.classList.add('warning');
                if (isSummaryNotification) {
                    if (messageType.includes('warning')) bubble.classList.add('summary-reset');
                     else bubble.classList.add('summary-notification');
                }
            } else {
                const isPlayer = messageType.includes('player');
                const avatarSrc = isPlayer ? S.currentPlayerAvatar : S.currentAiAvatar;
                const characterName = isPlayer ? '玩家' : 'AI';
                const avatarAlt = isPlayer ? 'Player' : 'AI';

                const headerDiv = document.createElement('div');
                headerDiv.className = 'message-header';

                const avatarImg = document.createElement('img');
                avatarImg.src = avatarSrc;
                avatarImg.alt = avatarAlt;
                avatarImg.className = 'avatar-image';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'character-name';
                nameSpan.textContent = characterName;

                const floorSpan = document.createElement('span');
                floorSpan.className = 'floor-number';
                if (floor != null) {
                    floorSpan.textContent = `#${floor}`;
                }

                headerDiv.appendChild(avatarImg);
                headerDiv.appendChild(nameSpan);
                headerDiv.appendChild(floorSpan);

                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'message-content-wrapper';
                
                const messageTextSpan = document.createElement('span');
                messageTextSpan.className = 'message-text';
                
                const isFinalAiMessage = messageType.includes('ai-message') && !messageType.includes('is-thinking') && !messageType.includes('ai-error-message');
                messageTextSpan.innerHTML = isFinalAiMessage ? formatMessageText(L.removeStatusBarFromMainContent(messageContent)) : messageContent;
                contentWrapper.appendChild(messageTextSpan);

                // 添加媒体内容显示
                if (mediaContent && (mediaContent.images.length > 0 || mediaContent.videos.length > 0)) {
                    const mediaContainer = document.createElement('div');
                    mediaContainer.className = 'message-media-container';
                    
                    // 添加图片
                    if (mediaContent.images && mediaContent.images.length > 0) {
                        mediaContent.images.forEach(imageUrl => {
                            const imgElement = document.createElement('img');
                            imgElement.src = imageUrl;
                            imgElement.className = 'message-image';
                            imgElement.alt = 'AI生成的图片';
                            imgElement.loading = 'lazy';
                            mediaContainer.appendChild(imgElement);
                        });
                    }
                    
                    // 添加视频
                    if (mediaContent.videos && mediaContent.videos.length > 0) {
                        mediaContent.videos.forEach(videoUrl => {
                            const videoElement = document.createElement('video');
                            videoElement.src = videoUrl;
                            videoElement.className = 'message-video';
                            videoElement.controls = true;
                            videoElement.preload = 'metadata';
                            mediaContainer.appendChild(videoElement);
                        });
                    }
                    
                    contentWrapper.appendChild(mediaContainer);
                }

                if (modelName && isFinalAiMessage) {
                    const modelSpan = document.createElement('span');
                    modelSpan.className = 'model-name';
                    modelSpan.textContent = `(模型: ${modelName})`;
                    contentWrapper.appendChild(modelSpan);
                }

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                
                if (isPlayer) {
                    actionsDiv.appendChild(createActionButton("编辑", "编辑这条消息", createGuardedAction(() => ui.toggleEditState(id, 'user', true))));
                    actionsDiv.appendChild(createActionButton("刷新AI", "让AI基于此消息重新生成回复", createGuardedAction(() => L.refreshAiForUserMessage(id))));
                    actionsDiv.appendChild(createActionButton("复制", "复制消息内容", () => L.copyMessageContent(id)));
                    actionsDiv.appendChild(createActionButton("删除", "删除此条消息", createGuardedAction(() => L.deleteMessage(id, 'user'))));
                    contentWrapper.appendChild(actionsDiv);
                } else if (isFinalAiMessage) {
                    actionsDiv.appendChild(createActionButton("编辑", "编辑此条AI回复", createGuardedAction(() => ui.toggleEditState(id, 'assistant', true))));
                    actionsDiv.appendChild(createActionButton("刷新", "让AI重新生成此条回复", createGuardedAction(() => L.refreshAiMessage(id))));
                    actionsDiv.appendChild(createActionButton("复制", "复制消息内容", () => L.copyMessageContent(id)));
                    actionsDiv.appendChild(createActionButton("删除", "删除此条消息", createGuardedAction(() => L.deleteMessage(id, 'assistant'))));
                    // 新增：将“推进剧情”和“⼤幅度推进剧情”移动到AI消息下方的功能按钮
                    actionsDiv.appendChild(createActionButton("（推进剧情）", "向AI发送一个通用指令，让故事继续发展。", createGuardedAction(() => L.sendPlayerMessage('（推进剧情）'))));
                    actionsDiv.appendChild(createActionButton("（大幅度推进剧情）", "向AI发送一个指令，让故事发生较大或意想不到的转折。", createGuardedAction(() => L.sendPlayerMessage('（大幅度推进剧情）'))));
                    contentWrapper.appendChild(actionsDiv);
                }

                bubble.appendChild(headerDiv);
                bubble.appendChild(contentWrapper);
            }

            E.gameOutputDiv.appendChild(bubble);
            ui.scrollToBottom();
            ui.recalculateFloorsAndCounter();
            return bubble;
        };
        
        ui.showSystemMessage = (options) => {
            const { text, type, temporary = true } = options;
            const messageData = {
                ...options,
                content: text,
                type: type || 'system-message',
            };
            
            const bubble = ui.addMessageToGameOutputDOM(messageData);

            if (temporary && bubble) {
                bubble.classList.add('system-message-temporary');
                setTimeout(() => {
                    if (bubble) {
                        bubble.style.opacity = '0';
                        bubble.addEventListener('transitionend', () => bubble.remove());
                    }
                }, 3000);
            }
        };

        ui.showInputDialog = (message, defaultValue = '') => {
            return new Promise((resolve) => {
                // 创建模态对话框
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                `;

                const dialog = document.createElement('div');
                dialog.className = 'input-dialog';
                dialog.style.cssText = `
                    background: var(--card-bg, #ffffff);
                    border-radius: 8px;
                    padding: 24px;
                    min-width: 300px;
                    max-width: 500px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    border: 1px solid var(--border-color, #e0e0e0);
                `;

                const messageEl = document.createElement('p');
                messageEl.textContent = message;
                messageEl.style.cssText = `
                    margin: 0 0 16px 0;
                    color: var(--text-color, #333333);
                    font-size: 14px;
                    line-height: 1.4;
                `;

                const input = document.createElement('input');
                input.type = 'text';
                input.value = defaultValue;
                input.style.cssText = `
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--border-color, #ddd);
                    border-radius: 4px;
                    font-size: 14px;
                    margin-bottom: 16px;
                    box-sizing: border-box;
                    background: var(--input-bg, #ffffff);
                    color: var(--text-color, #333333);
                `;

                const buttonContainer = document.createElement('div');
                buttonContainer.style.cssText = `
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                `;

                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = '取消';
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.style.cssText = `
                    padding: 8px 16px;
                    border: 1px solid var(--border-color, #ddd);
                    background: var(--card-bg, #ffffff);
                    color: var(--text-color, #333333);
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                `;

                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = '确定';
                confirmBtn.className = 'btn btn-primary';
                confirmBtn.style.cssText = `
                    padding: 8px 16px;
                    border: none;
                    background: var(--primary-color, #007bff);
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                `;

                // 事件处理
                const handleConfirm = () => {
                    const value = input.value.trim();
                    document.body.removeChild(modal);
                    resolve(value || null);
                };

                const handleCancel = () => {
                    document.body.removeChild(modal);
                    resolve(null);
                };

                confirmBtn.onclick = handleConfirm;
                cancelBtn.onclick = handleCancel;
                
                // 回车确认，ESC取消
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirm();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                    }
                };

                // 点击背景关闭
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        handleCancel();
                    }
                };

                // 组装对话框
                buttonContainer.appendChild(cancelBtn);
                buttonContainer.appendChild(confirmBtn);
                dialog.appendChild(messageEl);
                dialog.appendChild(input);
                dialog.appendChild(buttonContainer);
                modal.appendChild(dialog);
                document.body.appendChild(modal);

                // 自动聚焦并选中默认值
                setTimeout(() => {
                    input.focus();
                    if (defaultValue) {
                        input.select();
                    }
                }, 100);
             });
         };

        // 组合管理相关UI函数
        ui.updateComboSelector = () => {
            const S = GameApp.state;
            E.promptComboSelect.innerHTML = '';
            
            Object.keys(S.promptCombos).forEach(comboId => {
                const combo = S.promptCombos[comboId];
                const option = document.createElement('option');
                option.value = comboId;
                option.textContent = combo.name;
                if (comboId === S.currentComboId) {
                    option.selected = true;
                }
                E.promptComboSelect.appendChild(option);
            });
        };
        
        ui.updateComboList = () => {
            const S = GameApp.state;
            E.comboListDiv.innerHTML = '';
            
            Object.keys(S.promptCombos).forEach(comboId => {
                const combo = S.promptCombos[comboId];
                const comboItem = document.createElement('div');
                comboItem.className = 'combo-item';
                if (comboId === S.currentComboId) {
                    comboItem.classList.add('current');
                }
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = combo.name;
                nameSpan.className = 'combo-name';
                
                const infoSpan = document.createElement('span');
                infoSpan.textContent = `(${combo.conversationHistory.length} 条消息)`;
                infoSpan.className = 'combo-info';
                
                comboItem.appendChild(nameSpan);
                comboItem.appendChild(infoSpan);
                
                comboItem.onclick = () => {
                    if (comboId !== S.currentComboId) {
                        L.switchToCombo(comboId);
                        ui.updateComboList();
                        ui.updateComboSelector();
                        ui.refreshUI();
                    }
                };
                
                E.comboListDiv.appendChild(comboItem);
            });
        };
        
        ui.refreshUI = () => {
            const S = GameApp.state;
            const E = GameApp.elements;
            
            // 更新提示词设置界面
            E.systemPromptTextareaModal.value = S.currentSystemPrompt;
            E.prefixTextareaModal.value = S.currentPrefix;
            E.postfixTextareaModal.value = S.currentPostfix;
            
            // 更新头像预览
            E.playerAvatarUrlInput.value = S.currentPlayerAvatar;
            E.aiAvatarUrlInput.value = S.currentAiAvatar;
            E.playerAvatarPreview.src = S.currentPlayerAvatar;
            E.aiAvatarPreview.src = S.currentAiAvatar;
            
            // 更新游戏输出和状态栏
            
            // 更新总结内容
            E.summaryContentDisplay.value = S.accumulatedSummaryContent;
            
            E.gameOutputDiv.innerHTML = '';
            if (S.conversationHistory.length > 0) {
                S.conversationHistory.forEach(msg => ui.addMessageToGameOutputDOM(msg));
                ui.recalculateFloorsAndCounter();
            } else {
                ui.showSystemMessage({text: '当前组合暂无对话记录。', type: 'system-message', temporary: false});
            }
            // 无论是否有对话历史，都需要更新状态栏
            ui.updateStatusBarFromHistory();
            
            ui.scrollToBottom();
        };

        ui.recalculateFloorsAndCounter = () => {
            let currentVisibleFloor = 1;
            const messagesToCount = S.conversationHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant');
            messagesToCount.forEach(msg => {
                msg.floor = currentVisibleFloor;
                const bubble = E.gameOutputDiv.querySelector(`.message-bubble[data-message-id="${msg.id}"]:not(.ai-error-message)`);
                if (bubble) {
                    const floorSpan = bubble.querySelector('.floor-number');
                    if (floorSpan) floorSpan.textContent = `#${currentVisibleFloor}`;
                    bubble.dataset.floorId = currentVisibleFloor;
                }
                currentVisibleFloor++;
            });
            S.currentFloorCounter = currentVisibleFloor;
            const errorBubbles = E.gameOutputDiv.querySelectorAll('.ai-error-message');
            errorBubbles.forEach(errBubble => {
                 const floorSpan = errBubble.querySelector('.floor-number');
                 if(floorSpan) floorSpan.textContent = `#${S.currentFloorCounter}`;
                 errBubble.dataset.floorId = S.currentFloorCounter;
            });
        };

        ui.updateStatusBar = (text, sourceId) => {
            // 【双重保险修正】在更新前检查元素是否存在，防止因DOM不可见或不存在时JS报错中断
            if (!E.statusBarPre) return;
            E.statusBarPre.textContent = text;
            S.currentStatusBarSourceMessageId = sourceId;
        };

        ui.updateStatusBarFromHistory = () => {
            for (let i = S.conversationHistory.length - 1; i >= 0; i--) {
                const msg = S.conversationHistory[i];
                if (msg.role === 'assistant' && msg.statusBarContent) {
                    ui.updateStatusBar(msg.statusBarContent, msg.id);
                    return;
                }
            }
            ui.updateStatusBar("游戏尚未开始或无状态信息。", null);
        };
        
        ui.updateSummaryContentDisplay = text => { 
            if (E.summaryContentDisplay) {
                E.summaryContentDisplay.value = text;
                // 标记这是系统自动更新，不是用户手动修改
                E.summaryContentDisplay.dataset.systemUpdate = 'true';
            }
        };
        
        ui.clearPlayerInput = () => { E.playerInput.value = ''; ui.autoResizeTextarea(E.playerInput); };
        
        ui.setSendButtonState = (enabled) => { 
          E.sendButton.disabled = !enabled; 
          E.sendButton.textContent = enabled ? '发送' : '思考中...'; 
          if (ui.updateCancelVisibility) ui.updateCancelVisibility();
        };
        // 在 UI 中新增：根据当前状态显示/隐藏“中断”按钮
        ui.updateCancelVisibility = () => {
          const S = GameApp.state;
          if (!E.cancelButton) return;
          const shouldShow = !!(S.isAiResponding || S.isSummarizing);
          E.cancelButton.style.display = shouldShow ? '' : 'none';
          E.cancelButton.disabled = !shouldShow ? false : false;
        };
        
        ui.autoResizeTextarea = debounce((textarea) => {
            if (!textarea) return;
            textarea.style.height = 'auto';
            const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 150);
            textarea.style.height = `${newHeight}px`;
        }, 50);

        ui.updateStreamingMessage = (bubble, text) => {
            const textSpan = bubble.querySelector('.message-text');
            if (!textSpan) return;
        
            const messageId = parseInt(bubble.dataset.messageId, 10);
            const tag = '```';
        
            let mainContent = text;
            
            const matches = [...text.matchAll(/```([\s\S]*?)```/g)];
        
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const statusBarContent = lastMatch[1].trim();
                const fullBlock = lastMatch[0];
                
                mainContent = text.replace(fullBlock, '').trim();
                
                ui.updateStatusBar(statusBarContent, messageId);
            } else {
                const lastTagIndex = text.lastIndexOf(tag);
                if (lastTagIndex > -1) {
                    const secondToLastTagIndex = text.lastIndexOf(tag, lastTagIndex - 1);
                    if (secondToLastTagIndex === -1) {
                         mainContent = text.substring(0, lastTagIndex).trim();
                    }
                }
            }
        
            textSpan.innerHTML = formatMessageText(mainContent);
            ui.scrollToBottom();
        };

        ui.finalizeStreamingMessage = (bubble, mainContent, messageData) => {
            bubble.classList.remove('is-thinking');
            const contentWrapper = bubble.querySelector('.message-content-wrapper');
            contentWrapper.querySelector('.message-text').innerHTML = formatMessageText(mainContent);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.appendChild(createActionButton("编辑", "编辑此条AI回复", createGuardedAction(() => ui.toggleEditState(messageData.id, 'assistant', true))));
            actionsDiv.appendChild(createActionButton("刷新", "让AI重新生成此条回复", createGuardedAction(() => L.refreshAiMessage(messageData.id))));
            actionsDiv.appendChild(createActionButton("复制", "复制消息内容", () => L.copyMessageContent(messageData.id)));
            actionsDiv.appendChild(createActionButton("删除", "删除此条消息", createGuardedAction(() => L.deleteMessage(messageData.id, 'assistant'))));
            // 新增：将“推进剧情”和“⼤幅度推进剧情”移动到AI消息下方的功能按钮
            actionsDiv.appendChild(createActionButton("（推进剧情）", "向AI发送一个通用指令，让故事继续发展。", createGuardedAction(() => L.sendPlayerMessage('（推进剧情）'))));
            actionsDiv.appendChild(createActionButton("（大幅度推进剧情）", "向AI发送一个指令，让故事发生较大或意想不到的转折。", createGuardedAction(() => L.sendPlayerMessage('（大幅度推进剧情）'))));

            contentWrapper.appendChild(actionsDiv);

            if(messageData.model){
                const modelSpan = document.createElement('span');
                modelSpan.className = 'model-name';
                modelSpan.textContent = `(模型: ${messageData.model})`;
                contentWrapper.appendChild(modelSpan);
            }
            contentWrapper.appendChild(actionsDiv);
        };
        
        ui.replaceThinkingWithError = (thinkingBubble, errorMessage, newId) => {
            thinkingBubble.dataset.messageId = newId;
            thinkingBubble.classList.remove('is-thinking');
            thinkingBubble.classList.add('ai-error-message');
            
            const headerDiv = thinkingBubble.querySelector('.message-header');
            if(headerDiv) headerDiv.style.display = 'none';

            const contentWrapper = thinkingBubble.querySelector('.message-content-wrapper');
            contentWrapper.innerHTML = `<span class="message-text error-text-display">${errorMessage}</span>`;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.appendChild(createActionButton("重试", "尝试重新获取AI回复", createGuardedAction(() => L.refreshFailedAiMessage(newId))));
            actionsDiv.appendChild(createActionButton("删除", "删除此条错误信息", () => L.deleteMessage(newId, 'error-display'))); 
            contentWrapper.appendChild(actionsDiv);
            ui.recalculateFloorsAndCounter();
        };

        ui.updateMessageContent = (messageId, newText) => {
             const bubble = E.gameOutputDiv.querySelector(`[data-message-id="${messageId}"]`);
             if(bubble) {
                const textSpan = bubble.querySelector('.message-text');
                const content = L.removeStatusBarFromMainContent(newText);
                if(textSpan) textSpan.innerHTML = formatMessageText(content);
             }
        };

        ui.removeMessageDOM = (messageId) => {
            const bubble = E.gameOutputDiv.querySelector(`[data-message-id="${messageId}"]`);
            if (bubble) bubble.remove();
        };
        
        ui.toggleEditState = (messageId, role, isEditing) => {
            const bubble = E.gameOutputDiv.querySelector(`.${getRoleClass(role)}[data-message-id="${messageId}"]`);
            if (!bubble) return;
            
            const wrapper = bubble.querySelector('.message-content-wrapper');
            const textSpan = wrapper.querySelector('.message-text');
            const actionsDiv = wrapper.querySelector('.message-actions');
            const existingTextarea = wrapper.querySelector('.edit-textarea');
            const headerDiv = bubble.querySelector('.message-header');

            if (isEditing && !existingTextarea) {
                bubble.classList.add('editing-message');
                if(actionsDiv) actionsDiv.style.display = 'none';
                if(headerDiv) headerDiv.style.display = 'none';
                textSpan.style.display = 'none';

                const currentText = S.conversationHistory.find(m => m.id === messageId)?.content || '';
                const textarea = document.createElement('textarea');
                textarea.className = 'edit-textarea';
                textarea.value = currentText;
                
                const controls = document.createElement('div');
                controls.className = 'edit-controls';
                const saveBtn = createActionButton("保存", "保存修改", () => role === 'assistant' ? L.saveAiMessageEdit(messageId, textarea.value) : L.savePlayerMessageEdit(messageId, textarea.value));
                saveBtn.classList.add('save-edit-btn', 'btn', 'btn-small');
                const cancelBtn = createActionButton("取消", "取消编辑", () => ui.toggleEditState(messageId, role, false));
                cancelBtn.classList.add('cancel-edit-btn', 'btn', 'btn-small');
                controls.appendChild(saveBtn);
                controls.appendChild(cancelBtn);

                wrapper.appendChild(textarea);
                wrapper.appendChild(controls);
                textarea.focus();
                ui.autoResizeTextarea(textarea);
                textarea.oninput = () => ui.autoResizeTextarea(textarea);

            } else if (!isEditing && existingTextarea) {
                 bubble.classList.remove('editing-message');
                 if(actionsDiv) actionsDiv.style.display = 'flex';
                 if(headerDiv) headerDiv.style.display = 'flex';
                 textSpan.style.display = 'block';
                 wrapper.querySelector('.edit-textarea').remove();
                 wrapper.querySelector('.edit-controls').remove();
            }
        };

        ui.updateAllDisplayedAvatars = () => {
            E.gameOutputDiv.querySelectorAll('.message-bubble').forEach(bubble => {
                const avatarImg = bubble.querySelector('.avatar-image');
                if(!avatarImg) return;
                if(bubble.classList.contains('player-message')) avatarImg.src = S.currentPlayerAvatar;
                else if(bubble.classList.contains('ai-message')) avatarImg.src = S.currentAiAvatar;
            });
        };
        
        ui.fetchModels = async (isSummary) => {
            const provider = E.apiProviderSelect.value;
            const adapter = apiHandler.getAdapter(provider);
            const mainApiKey = E.apiKeyInput.value.trim();
            const mainBaseUrl = E.apiBaseUrlInput.value.trim();
            const apiKey = isSummary ? (E.summaryApiKeyInput.value.trim() || mainApiKey) : mainApiKey;
            const baseUrl = isSummary ? (E.summaryApiBaseUrlInput.value.trim() || mainBaseUrl) : mainBaseUrl;
            const displayEl = isSummary ? E.summaryModelListDisplay : E.apiModelListDisplay;
            const inputEl = isSummary ? E.summaryApiModelInput : E.apiModelInput;
            
            if (!apiKey) {
                displayEl.innerHTML = '<span style="color: var(--error-color);">错误：API Key 不能为空。</span>';
                return;
            }

            displayEl.innerHTML = '正在获取模型列表...';
            try {
                const models = await adapter.getModels(apiKey, baseUrl);
                displayEl.innerHTML = '';
                if (models && models.length > 0) {
                    models.map(m => m.id).sort().forEach(id => {
                        const item = document.createElement('div');
                        item.textContent = id;
                        item.className = 'clickable-model-item';
                        item.onclick = () => {
                            inputEl.value = id;
                            const currentList = Array.from(displayEl.children);
                            currentList.forEach(child => child.classList.remove('selected-model'));
                            item.classList.add('selected-model');
                        };
                        displayEl.appendChild(item);
                    });
                } else {
                    displayEl.textContent = '未能获取到模型列表，或列表为空。';
                }
            } catch (error) {
                console.error(`获取模型列表错误:`, error);
                displayEl.innerHTML = `<span style="color: var(--error-color);">获取模型列表时出错: ${error.message}</span>`;
            }
        };

        ui.toggleProviderSettings = () => {
            const provider = E.apiProviderSelect.value;
            const openaiSettings = document.querySelectorAll('[data-provider-setting="openai"]');
            openaiSettings.forEach(el => el.style.display = provider === 'google' ? 'none' : 'block');
            
            const providerDisablesTopK = (provider === 'google' || provider === 'custom_openai');
            
            E.topKSlider.disabled = providerDisablesTopK;
            E.topKSlider.parentElement.style.opacity = providerDisablesTopK ? 0.5 : 1;

            let title = '';
            if (provider === 'google') {
                title = 'Google Gemini API 不支持 Top K 参数';
            } else if (provider === 'custom_openai') {
                title = '自定义服务商模式已禁用 Top K 参数';
            }
            E.topKSlider.parentElement.title = title;


            if (provider === 'google') {
                if (E.apiModelInput.value.toLowerCase().includes('gpt')) E.apiModelInput.value = 'gemini-1.5-flash-latest';
                if (E.summaryApiModelInput.value.toLowerCase().includes('gpt')) E.summaryApiModelInput.value = 'gemini-1.0-pro';
            } else {
                if (E.apiModelInput.value.toLowerCase().includes('gemini')) E.apiModelInput.value = 'gpt-3.5-turbo';
                if (E.summaryApiModelInput.value.toLowerCase().includes('gemini')) E.summaryApiModelInput.value = 'gpt-3.5-turbo';
            }
            E.apiModelListDisplay.textContent = '点击下方按钮获取...';
            E.summaryModelListDisplay.textContent = '点击下方按钮获取...';
        };

        ui.updateAvatarPreviewsInModal = () => {
            E.playerAvatarPreview.src = S.currentPlayerAvatar;
            E.aiAvatarPreview.src = S.currentAiAvatar;
            E.playerAvatarUrlInput.value = S.currentPlayerAvatar.startsWith('data:image') ? '' : S.currentPlayerAvatar;
            E.aiAvatarUrlInput.value = S.currentAiAvatar.startsWith('data:image') ? '' : S.currentAiAvatar;
        };

        // ===== 导入/导出：UI工具与解析/导出实现 =====
        ui.openImportExportModal = () => { if (E.importExportModal) E.importExportModal.style.display = 'block'; };
        ui.closeImportExportModal = () => { if (E.importExportModal) E.importExportModal.style.display = 'none'; };

        ui.setImportProgress = (percent, text = '') => {
            if (E.importProgressBar) E.importProgressBar.value = Math.max(0, Math.min(100, percent || 0));
            if (E.importProgressText) E.importProgressText.textContent = text || `${Math.round(percent || 0)}%`;
        };
        ui.logImport = (msg) => {
            if (!E.importLogArea) return;
            E.importLogArea.textContent = (E.importLogArea.textContent ? (E.importLogArea.textContent + "\n") : '') + String(msg || '');
            E.importLogArea.scrollTop = E.importLogArea.scrollHeight;
        };

        ui.setExportProgress = (percent, text = '') => {
            if (E.exportProgressBar) E.exportProgressBar.value = Math.max(0, Math.min(100, percent || 0));
            if (E.exportProgressText) E.exportProgressText.textContent = text || `${Math.round(percent || 0)}%`;
        };
        ui.logExport = (msg) => {
            if (!E.exportLogArea) return;
            E.exportLogArea.textContent = (E.exportLogArea.textContent ? (E.exportLogArea.textContent + "\n") : '') + String(msg || '');
            E.exportLogArea.scrollTop = E.exportLogArea.scrollHeight;
        };

        ui.detectFormatFromFilename = (name) => {
            const lower = (name || '').toLowerCase();
            if (lower.endsWith('.json')) return 'json';
            if (lower.endsWith('.csv')) return 'csv';
            if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'excel';
            return 'unknown';
        };

        ui.readFile = (file, wantBinary = false) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = (e) => reject(e);
            reader.onload = () => resolve(reader.result);
            if (wantBinary) reader.readAsArrayBuffer(file); else reader.readAsText(file, 'utf-8');
        });

        ui.parseCSVToMessages = (csvText) => {
            // 简易CSV解析（支持双引号包裹字段）
            const rows = [];
            let cur = '';
            let inQuotes = false;
            const pushCell = (cells, cell) => { cells.push(cell); };
            const pushRow = (cells) => { rows.push(cells); };
            let cells = [];
            for (let i = 0; i < csvText.length; i++) {
                const ch = csvText[i];
                if (inQuotes) {
                    if (ch === '"') {
                        const next = csvText[i + 1];
                        if (next === '"') { cur += '"'; i++; }
                        else inQuotes = false;
                    } else {
                        cur += ch;
                    }
                } else {
                    if (ch === '"') inQuotes = true;
                    else if (ch === ',') { pushCell(cells, cur); cur = ''; }
                    else if (ch === '\n' || ch === '\r') {
                        if (ch === '\r' && csvText[i + 1] === '\n') { i++; }
                        pushCell(cells, cur); cur = ''; pushRow(cells); cells = [];
                    } else cur += ch;
                }
            }
            if (cur.length > 0 || cells.length > 0) { pushCell(cells, cur); pushRow(cells); }
            if (rows.length === 0) return [];
            const header = rows[0].map(h => h.trim().toLowerCase());
            const idx = {
                id: header.indexOf('id'),
                floor: header.indexOf('floor'),
                role: header.indexOf('role'),
                content: header.indexOf('content'),
                status: header.indexOf('statusbarcontent'),
                model: header.indexOf('modelname')
            };
            const messages = [];
            for (let r = 1; r < rows.length; r++) {
                const row = rows[r]; if (!row || row.length === 0) continue;
                const role = idx.role >= 0 ? row[idx.role] : (r % 2 === 1 ? 'user' : 'assistant');
                const content = idx.content >= 0 ? row[idx.content] : row[0];
                const idStr = idx.id >= 0 ? row[idx.id] : '';
                const floorStr = idx.floor >= 0 ? row[idx.floor] : '';
                const statusBarContent = idx.status >= 0 ? row[idx.status] : '';
                const modelName = idx.model >= 0 ? row[idx.model] : '';
                const id = idStr ? parseInt(idStr, 10) : undefined;
                const floor = floorStr ? parseInt(floorStr, 10) : undefined;
                if (!content) continue;
                messages.push({ id, floor, role: role === 'assistant' ? 'assistant' : 'user', content, statusBarContent, modelName });
            }
            // 重新分配ID与楼层（如缺失）
            let counter = 1;
            messages.forEach(m => { if (m.id == null) m.id = counter++; });
            let floorCounter = 1;
            messages.forEach(m => { if (m.role === 'user' || m.role === 'assistant') { m.floor = floorCounter++; } });
            return messages;
        };

        ui.parseExcelToMessages = async (arrayBuffer) => {
            if (!window.XLSX) throw new Error('未加载Excel解析库');
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            // 期望列名：id,floor,role,content,statusBarContent,modelName（不区分大小写）
            const normKey = k => String(k || '').trim().toLowerCase();
            const messages = json.map((row, idx) => {
                const keys = Object.keys(row).reduce((acc, k) => { acc[normKey(k)] = row[k]; return acc; }, {});
                const role = keys['role'] || (idx % 2 === 0 ? 'user' : 'assistant');
                const content = keys['content'] || '';
                const idStr = keys['id'] || '';
                const floorStr = keys['floor'] || '';
                const statusBarContent = keys['statusbarcontent'] || '';
                const modelName = keys['modelname'] || '';
                const id = idStr ? parseInt(idStr, 10) : undefined;
                const floor = floorStr ? parseInt(floorStr, 10) : undefined;
                return { id, floor, role: role === 'assistant' ? 'assistant' : 'user', content, statusBarContent, modelName };
            }).filter(m => m.content);
            let counter = 1; messages.forEach(m => { if (m.id == null) m.id = counter++; });
            let floorCounter = 1; messages.forEach(m => { if (m.role === 'user' || m.role === 'assistant') { m.floor = floorCounter++; } });
            return messages;
        };

        ui.parseJSONImport = (text) => {
            let data; try { data = JSON.parse(text); } catch (e) { throw new Error('JSON 格式不正确'); }
            if (Array.isArray(data)) {
                // 仅对话历史
                return { kind: 'history', messages: data };
            }
            if (data && (data.promptCombos || data.apiKeyProfiles)) {
                return { kind: 'full', payload: data };
            }
            throw new Error('不支持的 JSON 结构');
        };

        ui.clearAllConfigStorage = () => {
            const keys = [
                'promptCombos','currentComboId',
                'apiKeyProfiles','currentApiKeyProfileId',
                'summaryApiKey','summaryApiBaseUrl','summaryApiModel','summaryPromptText',
                'apiProvider','apiBaseUrl','apiModel','memoryCount','streamMode','temperature','topP','topK',
                'accumulatedSummaryContent','summarizedUntilTurnCount',
                // 旧版键名
                'savedConversationHistory','systemPrompt','prefix','postfix','playerAvatarUrl','aiAvatarUrl','apiKey'
            ];
            keys.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });
        };

        ui.applyImportedData = async (importData) => {
            if (!importData) return;
            if (importData.kind === 'full') {
                // 先彻底清理旧配置
                ui.clearAllConfigStorage();
                const p = importData.payload || {};
                // 校验与应用组合
                if (p.promptCombos && typeof p.promptCombos === 'object') {
                    S.promptCombos = p.promptCombos;
                    const ids = Object.keys(S.promptCombos);
                    S.currentComboId = (p.currentComboId && S.promptCombos[p.currentComboId]) ? p.currentComboId : (ids[0] || 'combo-1');
                    L.saveAllCombosToStorage();
                }
                // 应用 API Key 档案
                if (p.apiKeyProfiles && typeof p.apiKeyProfiles === 'object') {
                    S.apiKeyProfiles = p.apiKeyProfiles;
                    const keyIds = Object.keys(S.apiKeyProfiles || {});
                    S.currentApiKeyProfileId = (p.currentApiKeyProfileId && S.apiKeyProfiles[p.currentApiKeyProfileId]) ? p.currentApiKeyProfileId : (keyIds[0] || 'key-1');
                    L.saveAllApiKeyProfilesToStorage();
                }
                // 应用总结设置
                if (p.summarySettings && typeof p.summarySettings === 'object') {
                    S.summarySettings.apiKey = p.summarySettings.apiKey || '';
                    S.summarySettings.baseUrl = p.summarySettings.baseUrl || '';
                    S.summarySettings.model = p.summarySettings.model || '';
                    localStorage.setItem('summaryApiKey', S.summarySettings.apiKey);
                    localStorage.setItem('summaryApiBaseUrl', S.summarySettings.baseUrl);
                    localStorage.setItem('summaryApiModel', S.summarySettings.model);
                }
                if (typeof p.currentSummaryPromptText === 'string') {
                    S.currentSummaryPromptText = p.currentSummaryPromptText;
                    localStorage.setItem('summaryPromptText', S.currentSummaryPromptText);
                }

                // 新增：应用主 API 设置（若导入文件包含则覆盖），否则保留默认/当前值
                const applyIfPresent = (key, val) => {
                    if (val !== undefined && val !== null) {
                        localStorage.setItem(key, String(val));
                    }
                };
                applyIfPresent('apiProvider', p.apiProvider);
                applyIfPresent('apiBaseUrl', p.apiBaseUrl);
                applyIfPresent('apiModel', p.apiModel);
                applyIfPresent('memoryCount', p.memoryCount);
                applyIfPresent('streamMode', p.streamMode);
                applyIfPresent('temperature', p.temperature);
                applyIfPresent('topP', p.topP);
                applyIfPresent('topK', p.topK);

                // 重新加载当前组合并刷新UI
                L.loadComboData(S.currentComboId);
                if (GameApp.ui.updateComboSelector) GameApp.ui.updateComboSelector();
                if (GameApp.ui.updateComboList) GameApp.ui.updateComboList();
                if (GameApp.ui.updateApiKeyProfileSelector) GameApp.ui.updateApiKeyProfileSelector();
                if (GameApp.ui.updateApiKeyProfileList) GameApp.ui.updateApiKeyProfileList();

                // 刷新主 API 设置输入控件显示与 Provider 相关UI
                if (E.apiProviderSelect) E.apiProviderSelect.value = localStorage.getItem('apiProvider') || 'openai';
                if (E.apiBaseUrlInput) E.apiBaseUrlInput.value = localStorage.getItem('apiBaseUrl') || '';
                if (E.apiModelInput) E.apiModelInput.value = localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
                if (E.memoryCountInput) E.memoryCountInput.value = localStorage.getItem('memoryCount') || '20';
                if (E.streamToggle) E.streamToggle.checked = localStorage.getItem('streamMode') !== 'false';
                if (E.temperatureSlider) {
                    E.temperatureSlider.value = localStorage.getItem('temperature') || 0.7;
                    if (E.temperatureValue) E.temperatureValue.textContent = E.temperatureSlider.value;
                }
                if (E.topPSlider) {
                    E.topPSlider.value = localStorage.getItem('topP') || 1;
                    if (E.topPValue) E.topPValue.textContent = E.topPSlider.value;
                }
                if (E.topKSlider) {
                    E.topKSlider.value = localStorage.getItem('topK') || 40;
                    if (E.topKValue) E.topKValue.textContent = E.topKSlider.value;
                }
                if (ui.toggleProviderSettings) ui.toggleProviderSettings();

                GameApp.ui.refreshUI();
                GameApp.ui.showSystemMessage({ text: '完整配置导入完成（包含主API设置）！', type: 'system-message success' });

                // 导入完成后，短暂延时后自动刷新页面，确保所有UI与状态一致
                setTimeout(() => {
                    try {
                        window.location.reload();
                    } catch (e) {
                        console.warn('自动刷新失败：', e);
                    }
                }, 300);
            } else if (importData.kind === 'history') {
                // 导入到当前组合的对话历史
                const msgs = importData.messages.map(m => ({
                    id: m.id,
                    floor: m.floor,
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: String(m.content || ''),
                    statusBarContent: m.statusBarContent || '',
                    modelName: m.modelName || ''
                })).filter(m => m.content);
                let counter = 1; msgs.forEach(m => { if (m.id == null) m.id = counter++; });
                let floorCounter = 1; msgs.forEach(m => { if (m.role === 'user' || m.role === 'assistant') { m.floor = floorCounter++; } });
                const currentCombo = S.promptCombos[S.currentComboId];
                if (currentCombo) {
                    currentCombo.conversationHistory = msgs;
                    currentCombo.messageIdCounter = Math.max(0, ...msgs.map(x => x.id || 0)) + 1;
                    currentCombo.currentFloorCounter = floorCounter;
                    // 同步到活动状态
                    L.saveAllCombosToStorage();
                    L.loadComboData(S.currentComboId);
                    GameApp.ui.refreshUI();
                    GameApp.ui.showSystemMessage({ text: `对话历史导入完成（共 ${msgs.length} 条）。`, type: 'system-message success' });
                }
            }
        };

        ui.buildJSONExportData = () => {
            const data = {
                version: '1',
                exportedAt: new Date().toISOString(),
                promptCombos: S.promptCombos,
                currentComboId: S.currentComboId,
                apiKeyProfiles: S.apiKeyProfiles,
                currentApiKeyProfileId: S.currentApiKeyProfileId,
                summarySettings: S.summarySettings,
                currentSummaryPromptText: S.currentSummaryPromptText,
                // 新增：导出主 API 设置（便于完整配置备份/迁移）
                apiProvider: localStorage.getItem('apiProvider') || 'openai',
                apiBaseUrl: localStorage.getItem('apiBaseUrl') || '',
                apiModel: localStorage.getItem('apiModel') || 'gpt-3.5-turbo',
                memoryCount: Number(localStorage.getItem('memoryCount') || '20'),
                streamMode: localStorage.getItem('streamMode') !== 'false',
                temperature: Number(localStorage.getItem('temperature') || '0.7'),
                topP: Number(localStorage.getItem('topP') || '1'),
                topK: Number(localStorage.getItem('topK') || '40'),
            };
            return data;
        };

        ui.triggerDownload = (blob, filename) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            try {
                if (typeof a.download === 'undefined') {
                    // 某些移动端(如 iOS Safari)不支持 download 属性，打开新窗口交由系统处理
                    window.open(url, '_blank');
                    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 1500);
                } else {
                    a.click();
                    setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (_) {} }, 0);
                }
            } catch (_) {
                // 兜底：直接跳转
                location.href = url;
                setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 1500);
            }
        };

        ui.exportJSON = async () => {
            ui.setExportProgress(10, '准备数据...');
            const data = ui.buildJSONExportData();
            ui.setExportProgress(60, '序列化...');
            const text = JSON.stringify(data);
            const blob = new Blob([text], { type: 'application/json' });
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            ui.setExportProgress(90, '生成文件...');
            ui.triggerDownload(blob, `GameApp-export-${ts}.json`);
            ui.setExportProgress(100, '完成');
            ui.logExport('JSON 导出完成。');
        };

        ui.exportCSV = async (scope = 'current') => {
            const combos = scope === 'all' ? Object.keys(S.promptCombos) : [S.currentComboId];
            if (combos.length > 1) {
                // 提示：CSV 仅导出当前组合，批量请使用 Excel
                ui.logExport('提示：CSV仅导出当前组合。若需多组合请用Excel。');
            }
            const comboId = combos[0];
            const combo = S.promptCombos[comboId];
            const rows = [['id','floor','role','content','statusBarContent','modelName']];
            combo.conversationHistory.forEach(m => {
                rows.push([
                    m.id ?? '',
                    m.floor ?? '',
                    m.role ?? '',
                    (m.content || '').replace(/"/g, '""'),
                    (m.statusBarContent || '').replace(/"/g, '""'),
                    m.modelName || ''
                ].map(x => `"${String(x)}"`));
            });
            const csv = rows.map(r => r.join(',')).join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            ui.triggerDownload(blob, `conversation-${combo.name || comboId}-${ts}.csv`);
            ui.setExportProgress(100, '完成');
            ui.logExport('CSV 导出完成。');
        };

        ui.exportExcel = async (scope = 'current') => {
            if (!window.XLSX) { ui.logExport('错误：未加载Excel解析库'); return; }
            const wb = XLSX.utils.book_new();
            const combos = scope === 'all' ? Object.keys(S.promptCombos) : [S.currentComboId];
            combos.forEach((comboId, idx) => {
                const combo = S.promptCombos[comboId];
                const json = combo.conversationHistory.map(m => ({
                    id: m.id ?? '',
                    floor: m.floor ?? '',
                    role: m.role ?? '',
                    content: m.content || '',
                    statusBarContent: m.statusBarContent || '',
                    modelName: m.modelName || ''
                }));
                const ws = XLSX.utils.json_to_sheet(json);
                XLSX.utils.book_append_sheet(wb, ws, (combo.name || comboId).slice(0, 31));
                ui.setExportProgress(Math.round(((idx + 1) / combos.length) * 100));
            });
            const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
            const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            ui.triggerDownload(blob, `conversation-${scope}-${ts}.xlsx`);
            ui.setExportProgress(100, '完成');
            ui.logExport('Excel 导出完成。');
        };
    };

    const bindEventListeners = () => {
        const E = GameApp.elements;
        const S = GameApp.state;
        const L = GameApp.logic;
        const ui = GameApp.ui;

        E.sendButton.onclick = () => { const text = E.playerInput.value.trim(); if(text) { S.autoScrollEnabled = true; L.sendPlayerMessage(text); } };
        E.playerInput.onkeydown = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); E.sendButton.click(); }};
        E.playerInput.oninput = () => ui.autoResizeTextarea(E.playerInput);
        // 绑定中断按钮：可中断当前 AI 回复或总结
        if (E.cancelButton) {
          E.cancelButton.onclick = () => {
            const S = GameApp.state;
            try {
              if (S.isAiResponding && S.currentAbortController) {
                S.currentAbortController.abort();
              }
              if (S.isSummarizing && S.summaryAbortController) {
                S.summaryAbortController.abort();
                GameApp.ui.showSystemMessage({ text: '总结已中断。', type: 'system-message summary-notification warning' });
              }
            } catch (err) {
              console.warn('中断操作异常:', err);
            } finally {
              // 立即恢复输入态，并主动复位状态以便立刻可再次发送
              S.isAiResponding = false;
              S.currentAbortController = null;
              S.isSummarizing = false;
              S.summaryAbortController = null;
              ui.setSendButtonState(true);
              ui.updateCancelVisibility();
            }
          };
        }
        // 初始化时同步一次中断按钮显示
        if (ui.updateCancelVisibility) ui.updateCancelVisibility();
        E.clearHistoryBtn.onclick = createGuardedAction(() => {
            if (confirm('你确定要清空当前组合的对话记录和总结吗？这个操作无法撤销。')) {
                L.clearHistory();
                E.gameOutputDiv.innerHTML = '';
                ui.updateStatusBar("游戏尚未开始或无状态信息。", null);
                ui.updateSummaryContentDisplay('');
                ui.showSystemMessage({ text: "当前组合的对话记录已清空。", type: "system-message success", temporary: false });
                ui.updateComboList(); // 更新组合列表显示
            }
        });
        
        E.mainSettingsToggleBtn.onclick = () => { 
            E.settingsModal.style.display = 'block'; 
            E.systemPromptTextareaModal.value = S.currentSystemPrompt; 
            E.prefixTextareaModal.value = S.currentPrefix;
            E.postfixTextareaModal.value = S.currentPostfix;
            E.summaryPromptTextarea.value = S.currentSummaryPromptText; 
            E.summaryContentDisplay.value = S.accumulatedSummaryContent;
            // 打开设置时重置用户修改标记，因为加载的是已保存的值
            E.summaryContentDisplay.dataset.userModified = 'false';
        };
        // 新增：打开提示词独立设置面板
        E.promptSettingsToggleBtn.onclick = () => {
            E.promptSettingsModal.style.display = 'block';
            E.systemPromptTextareaModal.value = S.currentSystemPrompt;
            E.prefixTextareaModal.value = S.currentPrefix;
            E.postfixTextareaModal.value = S.currentPostfix;
        };
        E.closeSettingsModalBtn.onclick = () => {
            // 检查当前激活的标签页
            const activeTab = document.querySelector('.settings-tab-content.active');
            const tabId = activeTab ? activeTab.id : null;
            
            // 如果是总结设置标签页，检查所有总结相关设置
            if (tabId === 'tab-summary') {
                // 检查总结内容是否是用户手动修改的
                const hasUserModifiedSummary = E.summaryContentDisplay.dataset.userModified === 'true';
                
                // 检查总结API设置是否有未保存的更改
                const hasUnsavedSummaryChanges = 
                    E.summaryApiKeyInput.value !== localStorage.getItem('summaryApiKey') ||
                    E.summaryApiBaseUrlInput.value !== localStorage.getItem('summaryApiBaseUrl') ||
                    E.summaryApiModelInput.value !== localStorage.getItem('summaryApiModel') ||
                    E.summaryPromptTextarea.value !== localStorage.getItem('summaryPromptText');
                
                if (hasUserModifiedSummary || hasUnsavedSummaryChanges) {
                    if (confirm('总结设置有未保存的更改，确定要关闭吗？\n\n点击"取消"返回保存，点击"确定"放弃更改并关闭。')) {
                        // 重置为保存的值
                        if (hasUserModifiedSummary) {
                            E.summaryContentDisplay.value = S.accumulatedSummaryContent;
                            E.summaryContentDisplay.dataset.userModified = 'false';
                        }
                        if (hasUnsavedSummaryChanges) {
                            E.summaryApiKeyInput.value = localStorage.getItem('summaryApiKey') || '';
                            E.summaryApiBaseUrlInput.value = localStorage.getItem('summaryApiBaseUrl') || '';
                            E.summaryApiModelInput.value = localStorage.getItem('summaryApiModel') || '';
                            E.summaryPromptTextarea.value = localStorage.getItem('summaryPromptText') || '';
                        }
                        E.settingsModal.style.display = 'none';
                    }
                } else {
                    E.settingsModal.style.display = 'none';
                }
                return;
            }
            
            // 检查API设置是否有未保存的更改（其他标签页）
            const hasUnsavedChanges = 
                E.apiKeyInput.value !== L.getCurrentApiKey() ||
                E.apiBaseUrlInput.value !== localStorage.getItem('apiBaseUrl') ||
                E.apiModelInput.value !== localStorage.getItem('apiModel') ||
                E.memoryCountInput.value !== localStorage.getItem('memoryCount') ||
                E.streamToggle.checked !== (localStorage.getItem('streamMode') === 'true') ||
                E.temperatureSlider.value !== localStorage.getItem('temperature') ||
                E.topPSlider.value !== localStorage.getItem('topP') ||
                E.topKSlider.value !== localStorage.getItem('topK');
            
            if (hasUnsavedChanges) {
                if (confirm('API设置有未保存的更改，确定要关闭吗？\n\n点击"取消"返回保存，点击"确定"放弃更改并关闭。')) {
                    // 重置为原始值
                    E.apiKeyInput.value = L.getCurrentApiKey();
                    E.apiBaseUrlInput.value = localStorage.getItem('apiBaseUrl') || '';
                    E.apiModelInput.value = localStorage.getItem('apiModel') || '';
                    E.memoryCountInput.value = localStorage.getItem('memoryCount') || '10';
                    E.streamToggle.checked = localStorage.getItem('streamMode') === 'true';
                    E.temperatureSlider.value = localStorage.getItem('temperature') || '0.7';
                    E.topPSlider.value = localStorage.getItem('topP') || '0.9';
                    E.topKSlider.value = localStorage.getItem('topK') || '0';
                    
                    // 更新显示值
                    E.temperatureValue.textContent = E.temperatureSlider.value;
                    E.topPValue.textContent = E.topPSlider.value;
                    E.topKValue.textContent = E.topKSlider.value;
                    
                    E.settingsModal.style.display = 'none';
                }
            } else {
                E.settingsModal.style.display = 'none';
            }
        };
        E.closePromptSettingsModalBtn.onclick = () => {
            // 检查是否有未保存的更改
            const hasUnsavedChanges = 
                E.systemPromptTextareaModal.value !== S.currentSystemPrompt ||
                E.prefixTextareaModal.value !== S.currentPrefix ||
                E.postfixTextareaModal.value !== S.currentPostfix;
            
            if (hasUnsavedChanges) {
                if (confirm('提示词设置有未保存的更改，确定要关闭吗？\n\n点击"取消"返回保存，点击"确定"放弃更改并关闭。')) {
                    E.promptSettingsModal.style.display = 'none';
                }
            } else {
                E.promptSettingsModal.style.display = 'none';
            }
        };
        E.editAvatarsBtn.onclick = () => { ui.updateAvatarPreviewsInModal(); E.avatarEditModal.style.display = 'block'; };
        E.closeAvatarEditModalBtn.onclick = () => E.avatarEditModal.style.display = 'none';
        // 移除模态窗口外部点击关闭功能，防止误操作
        // 用户必须点击明确的关闭按钮才能关闭窗口
        // window.onclick = (event) => { 
        //     if(event.target === E.settingsModal) E.settingsModal.style.display = 'none'; 
        //     if(event.target === E.promptSettingsModal) E.promptSettingsModal.style.display = 'none'; 
        //     if(event.target === E.avatarEditModal) E.avatarEditModal.style.display = 'none';
        //     if(event.target === E.comboManageModal) E.comboManageModal.style.display = 'none'; 
        //     if(event.target === E.apiKeyProfileManageModal) E.apiKeyProfileManageModal.style.display = 'none';
        // };

        E.tabButtons.forEach(button => {
            button.onclick = () => {
                E.tabButtons.forEach(btn => btn.classList.remove('active'));
                E.tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
            };
        });
        
        E.apiProviderSelect.onchange = ui.toggleProviderSettings;
        E.saveApiSettingsBtn.onclick = () => {
            localStorage.setItem('apiProvider', E.apiProviderSelect.value);
            // 改为保存到当前API Key档案，并向后兼容同步localStorage
            GameApp.logic.setCurrentProfileApiKey(E.apiKeyInput.value);
            localStorage.setItem('apiBaseUrl', E.apiBaseUrlInput.value.trim());
            localStorage.setItem('apiModel', E.apiModelInput.value.trim());
            localStorage.setItem('memoryCount', E.memoryCountInput.value);
            localStorage.setItem('streamMode', E.streamToggle.checked);
            localStorage.setItem('temperature', E.temperatureSlider.value);
            localStorage.setItem('topP', E.topPSlider.value);
            localStorage.setItem('topK', E.topKSlider.value);
            ui.updateApiKeyProfileList && ui.updateApiKeyProfileList();
            ui.updateApiKeyProfileSelector && ui.updateApiKeyProfileSelector();
            ui.showSystemMessage({ text: '主要API设置已保存！', type: 'system-message success'});
            E.apiSettingsStatus.textContent = ''; 
        };
        E.getApiModelsBtn.onclick = () => ui.fetchModels(false);

        // ===== 导入/导出：事件绑定 =====
        if (E.openImportExportBtn) {
            E.openImportExportBtn.onclick = () => {
                ui.setImportProgress(0, ''); ui.setExportProgress(0, '');
                if (E.importLogArea) E.importLogArea.textContent = '';
                if (E.exportLogArea) E.exportLogArea.textContent = '';
                ui.openImportExportModal();
            };
        }
        if (E.closeImportExportModalBtn) {
            E.closeImportExportModalBtn.onclick = () => ui.closeImportExportModal();
        }

        if (E.startImportBtn) {
            E.startImportBtn.onclick = async () => {
                try {
                    ui.setImportProgress(5, '准备中...');
                    if (!E.importFileInput || !E.importFileInput.files || !E.importFileInput.files[0]) {
                        ui.logImport('请先选择要导入的文件。');
                        ui.setImportProgress(0, '等待文件');
                        return;
                    }
                    const file = E.importFileInput.files[0];
                    let format = (E.importFormatSelect && E.importFormatSelect.value) || 'auto';
                    if (format === 'auto') format = ui.detectFormatFromFilename(file.name);
                    ui.logImport(`检测到格式：${format}`);

                    if (format === 'json') {
                        const text = await ui.readFile(file, false);
                        ui.setImportProgress(40, '解析 JSON...');
                        const parsed = ui.parseJSONImport(text);
                        ui.setImportProgress(70, '应用数据...');
                        await ui.applyImportedData(parsed);
                        ui.setImportProgress(100, '完成');
                        ui.logImport('JSON 导入成功。');
                    } else if (format === 'csv') {
                        const text = await ui.readFile(file, false);
                        ui.setImportProgress(30, '解析 CSV...');
                        const messages = ui.parseCSVToMessages(text);
                        ui.setImportProgress(70, `应用消息（${messages.length}）...`);
                        await ui.applyImportedData({ kind: 'history', messages });
                        ui.setImportProgress(100, '完成');
                        ui.logImport('CSV 导入成功。');
                    } else if (format === 'excel') {
                        const buf = await ui.readFile(file, true);
                        ui.setImportProgress(30, '解析 Excel...');
                        const messages = await ui.parseExcelToMessages(buf);
                        ui.setImportProgress(70, `应用消息（${messages.length}）...`);
                        await ui.applyImportedData({ kind: 'history', messages });
                        ui.setImportProgress(100, '完成');
                        ui.logImport('Excel 导入成功。');
                    } else {
                        ui.logImport('无法识别的文件格式，请选择 JSON/CSV/Excel。');
                        ui.setImportProgress(0, '失败');
                    }
                } catch (err) {
                    console.error('导入失败', err);
                    ui.logImport(`导入失败：${err && err.message ? err.message : String(err)}`);
                    ui.setImportProgress(0, '错误');
                }
            };
        }

        if (E.startExportBtn) {
            E.startExportBtn.onclick = async () => {
                try {
                    ui.setExportProgress(5, '准备中...');
                    const scope = (E.exportScopeSelect && E.exportScopeSelect.value) || 'current';
                    const format = (E.exportFormatSelect && E.exportFormatSelect.value) || 'json';
                    ui.logExport(`导出范围：${scope}，格式：${format}`);
                    if (format === 'json') await ui.exportJSON();
                    else if (format === 'csv') await ui.exportCSV(scope);
                    else if (format === 'excel') await ui.exportExcel(scope);
                    else { ui.logExport('不支持的导出格式'); ui.setExportProgress(0, '失败'); return; }
                    ui.setExportProgress(100, '完成');
                } catch (err) {
                    console.error('导出失败', err);
                    ui.logExport(`导出失败：${err && err.message ? err.message : String(err)}`);
                    ui.setExportProgress(0, '错误');
                }
            };
        }

        E.temperatureSlider.oninput = () => E.temperatureValue.textContent = E.temperatureSlider.value;
        E.topPSlider.oninput = () => E.topPValue.textContent = E.topPSlider.value;
        E.topKSlider.oninput = () => E.topKValue.textContent = E.topKSlider.value;

        E.savePromptFromModalBtn.onclick = () => { 
            S.currentSystemPrompt = E.systemPromptTextareaModal.value;
            S.currentPrefix = E.prefixTextareaModal.value;
            S.currentPostfix = E.postfixTextareaModal.value;
            // 保存到当前组合
            L.saveCurrentComboData();
            L.saveAllCombosToStorage();
            // 保持向后兼容的全局存储
            localStorage.setItem('systemPrompt', S.currentSystemPrompt);
            localStorage.setItem('prefix', S.currentPrefix);
            localStorage.setItem('postfix', S.currentPostfix);
            ui.showSystemMessage({ text: "核心提示词、前置和后置内容已更新并保存到当前组合。", type: "system-message success" });
        };
        
        E.getSummaryModelsBtn.onclick = () => ui.fetchModels(true);

        E.saveSummarySettingsBtn.onclick = () => {
            S.summarySettings.apiKey = E.summaryApiKeyInput.value;
            S.summarySettings.baseUrl = E.summaryApiBaseUrlInput.value.trim();
            S.summarySettings.model = E.summaryApiModelInput.value.trim();
            S.currentSummaryPromptText = E.summaryPromptTextarea.value;
            localStorage.setItem('summaryApiKey', S.summarySettings.apiKey);
            localStorage.setItem('summaryApiBaseUrl', S.summarySettings.baseUrl);
            localStorage.setItem('summaryApiModel', S.summarySettings.model);
            localStorage.setItem('summaryPromptText', S.currentSummaryPromptText);
            
            S.accumulatedSummaryContent = E.summaryContentDisplay.value;
            localStorage.setItem('accumulatedSummaryContent', S.accumulatedSummaryContent);
            
            // 保存后清除用户修改标记
            E.summaryContentDisplay.dataset.userModified = 'false';
            
            ui.showSystemMessage({ text: '总结设置与内容已保存！', type: 'system-message success' });
            E.summarySettingsStatus.textContent = '';
        };
        
        // 监听总结内容的手动修改
        E.summaryContentDisplay.addEventListener('input', () => {
            // 如果这是系统更新触发的，不清除标记
            if (E.summaryContentDisplay.dataset.systemUpdate === 'true') {
                E.summaryContentDisplay.dataset.systemUpdate = 'false';
                return;
            }
            // 标记为用户手动修改
            E.summaryContentDisplay.dataset.userModified = 'true';
        });
        
        // 组合管理相关事件绑定
        if (E.promptComboSelect) {
            E.promptComboSelect.onchange = () => {
                if (S.isAiResponding || S.isSummarizing) {
                    ui.showSystemMessage({ text: 'AI正在响应中，无法切换组合', type: 'system-message error' });
                    E.promptComboSelect.value = S.currentComboId; // 恢复原选择
                    return;
                }
                const selectedComboId = E.promptComboSelect.value;
                if (selectedComboId !== S.currentComboId) {
                    L.switchToCombo(selectedComboId);
                    ui.refreshUI();
                    ui.showSystemMessage({ text: `已切换到组合: ${S.promptCombos[selectedComboId].name}`, type: 'system-message success' });
                }
            };
        }
        
        if (E.manageComboBtn) {
            E.manageComboBtn.onclick = () => {
                if (E.comboManageModal) {
                    E.comboManageModal.style.display = 'block';
                    if (ui && ui.updateComboList) {
                        ui.updateComboList();
                    }
                }
            };
        }
        
        if (E.closeComboManageModalBtn) {
            E.closeComboManageModalBtn.onclick = () => {
                if (E.comboManageModal) {
                    E.comboManageModal.style.display = 'none';
                }
            };
        }
        
        if (E.newComboBtn) {
            E.newComboBtn.onclick = async () => {
                const comboCount = Object.keys(S.promptCombos).length;
                if (comboCount >= 10) {
                    ui.showSystemMessage({ text: '最多只能创建10个组合！', type: 'system-message error' });
                    return;
                }
                
                const name = await ui.showInputDialog('请输入新组合的名称:', `组合 ${comboCount + 1}`);
                if (name && name.trim()) {
                    const newComboId = L.createNewCombo(name.trim());
                    L.switchToCombo(newComboId);
                    ui.updateComboSelector();
                    ui.updateComboList();
                    ui.refreshUI();
                    ui.showSystemMessage({ text: `新组合 "${name.trim()}" 已创建并切换！`, type: 'system-message success' });
                }
            };
        }
        
        if (E.renameComboBtn) {
            E.renameComboBtn.onclick = async () => {
                const currentCombo = S.promptCombos[S.currentComboId];
                const newName = await ui.showInputDialog('请输入新的组合名称:', currentCombo.name);
                if (newName && newName.trim() && newName.trim() !== currentCombo.name) {
                    L.renameCombo(S.currentComboId, newName.trim());
                    ui.updateComboSelector();
                    ui.updateComboList();
                    ui.showSystemMessage({ text: `组合已重命名为 "${newName.trim()}"`, type: 'system-message success' });
                }
            };
        }
        
        if (E.deleteComboBtn) {
            E.deleteComboBtn.onclick = () => {
                if (Object.keys(S.promptCombos).length <= 1) {
                    ui.showSystemMessage({ text: '至少需要保留一个组合！', type: 'system-message error' });
                    return;
                }
                
                const currentCombo = S.promptCombos[S.currentComboId];
                if (confirm(`确定要删除组合 "${currentCombo.name}" 吗？这将永久删除该组合的所有数据！`)) {
                    const newComboId = L.deleteCombo(S.currentComboId);
                    L.switchToCombo(newComboId);
                    ui.updateComboSelector();
                    ui.updateComboList();
                    ui.refreshUI();
                    ui.showSystemMessage({ text: `组合 "${currentCombo.name}" 已删除！`, type: 'system-message success' });
                }
            };
        }
        
        // 组合管理模态框的外部点击关闭已在上面的window.onclick中处理

        // 新增：API Key 档案管理事件绑定
        if (E.manageApiKeyProfilesBtn) {
            E.manageApiKeyProfilesBtn.onclick = () => {
                if (E.apiKeyProfileManageModal) {
                    E.apiKeyProfileManageModal.style.display = 'block';
                    if (ui.updateApiKeyProfileList) ui.updateApiKeyProfileList();
                }
            };
        }
        if (E.closeApiKeyProfileManageModalBtn) {
            E.closeApiKeyProfileManageModalBtn.onclick = () => {
                if (E.apiKeyProfileManageModal) E.apiKeyProfileManageModal.style.display = 'none';
            };
        }
        if (E.apiKeyProfileSelect) {
            E.apiKeyProfileSelect.onchange = () => {
                const targetId = E.apiKeyProfileSelect.value;
                if (targetId && targetId !== S.currentApiKeyProfileId) {
                    L.switchToApiKeyProfile(targetId);
                    if (ui.updateApiKeyProfileSelector) ui.updateApiKeyProfileSelector();
                    if (ui.updateApiKeyProfileList) ui.updateApiKeyProfileList();
                    if (E.apiKeyInput) E.apiKeyInput.value = L.getCurrentApiKey();
                    ui.showSystemMessage({ text: '已切换到新的 API Key 档案。', type: 'system-message success' });
                }
            };
        }
        if (E.addApiKeyProfileBtn) {
            E.addApiKeyProfileBtn.onclick = async () => {
                const count = Object.keys(S.apiKeyProfiles || {}).length;
                const name = await ui.showInputDialog('请输入新 Key 档案名称：', `Key档案 ${count + 1}`);
                if (name && name.trim()) {
                    const newId = L.createNewApiKeyProfile(name.trim());
                    L.switchToApiKeyProfile(newId);
                    if (ui.updateApiKeyProfileSelector) ui.updateApiKeyProfileSelector();
                    if (ui.updateApiKeyProfileList) ui.updateApiKeyProfileList();
                    if (E.apiKeyInput) E.apiKeyInput.value = L.getCurrentApiKey();
                    ui.showSystemMessage({ text: `新 Key 档案 "${name.trim()}" 已创建并切换。`, type: 'system-message success' });
                }
            };
        }
        if (E.renameApiKeyProfileBtn) {
            E.renameApiKeyProfileBtn.onclick = async () => {
                const current = S.apiKeyProfiles[S.currentApiKeyProfileId];
                const newName = await ui.showInputDialog('请输入新的 Key 档案名称：', current?.name || '未命名');
                if (newName && newName.trim() && newName.trim() !== current?.name) {
                    L.renameApiKeyProfile(S.currentApiKeyProfileId, newName.trim());
                    if (ui.updateApiKeyProfileSelector) ui.updateApiKeyProfileSelector();
                    if (ui.updateApiKeyProfileList) ui.updateApiKeyProfileList();
                    ui.showSystemMessage({ text: `Key 档案已重命名为 "${newName.trim()}"`, type: 'system-message success' });
                }
            };
        }
        if (E.deleteApiKeyProfileBtn) {
            E.deleteApiKeyProfileBtn.onclick = () => {
                const total = Object.keys(S.apiKeyProfiles || {}).length;
                if (total <= 1) {
                    ui.showSystemMessage({ text: '至少需要保留一个 Key 档案！', type: 'system-message error' });
                    return;
                }
                const current = S.apiKeyProfiles[S.currentApiKeyProfileId];
                if (confirm(`确定要删除当前 Key 档案 "${current?.name || ''}" 吗？此操作不可撤销！`)) {
                    L.deleteApiKeyProfile(S.currentApiKeyProfileId);
                    if (ui.updateApiKeyProfileSelector) ui.updateApiKeyProfileSelector();
                    if (ui.updateApiKeyProfileList) ui.updateApiKeyProfileList();
                    if (E.apiKeyInput) E.apiKeyInput.value = L.getCurrentApiKey();
                    ui.showSystemMessage({ text: '当前 Key 档案已删除。', type: 'system-message success' });
                }
            };
        }
        if (E.apiKeyInput) {
            // 移除实时保存，改为只在点击保存按钮时保存
            E.apiKeyInput.oninput = null;
        }
    };

    const initializeApp = () => {
        getElements();
        defineUiFunctions();
        bindEventListeners();
        GameApp.logic.initialize();

        const E = GameApp.elements;
        const S = GameApp.state;
        const ui = GameApp.ui;

        E.apiKeyInput.value = GameApp.logic.getCurrentApiKey();
        // 新增：初始化刷新 API Key 档案下拉与列表
        if (ui.updateApiKeyProfileSelector) ui.updateApiKeyProfileSelector();
        if (ui.updateApiKeyProfileList) ui.updateApiKeyProfileList();
        
        // 修复：初始化刷新提示词组合下拉选项
        if (ui.updateComboSelector) ui.updateComboSelector();

        E.apiBaseUrlInput.value = localStorage.getItem('apiBaseUrl') || '';
        E.apiModelInput.value = localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        E.memoryCountInput.value = localStorage.getItem('memoryCount') || '20';
        E.apiProviderSelect.value = localStorage.getItem('apiProvider') || 'openai';
        E.streamToggle.checked = localStorage.getItem('streamMode') !== 'false';
        E.temperatureSlider.value = localStorage.getItem('temperature') || 0.7;
        E.topPSlider.value = localStorage.getItem('topP') || 1;
        E.topKSlider.value = localStorage.getItem('topK') || 40;
        E.temperatureValue.textContent = E.temperatureSlider.value;
        E.topPValue.textContent = E.topPSlider.value;
        E.topKValue.textContent = E.topKSlider.value;
        
        E.prefixTextareaModal.value = S.currentPrefix;
        E.postfixTextareaModal.value = S.currentPostfix;
        
        E.summaryApiKeyInput.value = S.summarySettings.apiKey;
        E.summaryApiBaseUrlInput.value = S.summarySettings.baseUrl;
        E.summaryApiModelInput.value = S.summarySettings.model;
        E.summaryPromptTextarea.value = S.currentSummaryPromptText;
        E.summaryContentDisplay.value = S.accumulatedSummaryContent;
        
        // 初始化标记：设置系统更新标记，清除用户修改标记
        E.summaryContentDisplay.dataset.systemUpdate = 'true';
        E.summaryContentDisplay.dataset.userModified = 'false';
        
        E.gameOutputDiv.innerHTML = '';
        if (S.conversationHistory.length > 0) {
            S.conversationHistory.forEach(msg => ui.addMessageToGameOutputDOM(msg));
            ui.recalculateFloorsAndCounter();
        } else {
            ui.showSystemMessage({text: '当前组合暂无对话记录。', type: 'system-message', temporary: false});
        }
        // 无论是否有对话历史，都需要更新状态栏
        ui.updateStatusBarFromHistory();
        
        ui.scrollToBottom();
    };

    initializeApp();
});

// API Key 档案管理相关UI函数
GameApp.ui.updateApiKeyProfileSelector = () => {
    const S = GameApp.state;
    const E = GameApp.elements;
    if (!E.apiKeyProfileSelect) return;
    E.apiKeyProfileSelect.innerHTML = '';
    Object.keys(S.apiKeyProfiles || {}).forEach(id => {
        const profile = S.apiKeyProfiles[id];
        const option = document.createElement('option');
        option.value = id;
        option.textContent = profile.name;
        if (id === S.currentApiKeyProfileId) option.selected = true;
        E.apiKeyProfileSelect.appendChild(option);
    });
};

GameApp.ui.updateApiKeyProfileList = () => {
    const S = GameApp.state;
    const E = GameApp.elements;
    if (!E.apiKeyProfileListDiv) return;
    E.apiKeyProfileListDiv.innerHTML = '';
    Object.keys(S.apiKeyProfiles || {}).forEach(id => {
        const profile = S.apiKeyProfiles[id];
        const item = document.createElement('div');
        item.className = 'combo-item';
        if (id === S.currentApiKeyProfileId) item.classList.add('current');
    
        const nameSpan = document.createElement('span');
        nameSpan.textContent = profile.name;
        nameSpan.className = 'combo-name';
    
        const infoSpan = document.createElement('span');
        const masked = (profile.apiKey || '').replace(/.(?=.{4})/g, '*');
        infoSpan.textContent = masked ? `(****${(profile.apiKey || '').slice(-4)})` : '(未填写)';
        infoSpan.className = 'combo-info';
    
        item.appendChild(nameSpan);
        item.appendChild(infoSpan);
    
        item.onclick = () => {
            if (id !== S.currentApiKeyProfileId) {
                GameApp.logic.switchToApiKeyProfile(id);
                GameApp.ui.updateApiKeyProfileList();
                GameApp.ui.updateApiKeyProfileSelector();
                // 同步输入框显示
                if (E.apiKeyInput) E.apiKeyInput.value = GameApp.logic.getCurrentApiKey();
            }
        };
    
        E.apiKeyProfileListDiv.appendChild(item);
    });
};
