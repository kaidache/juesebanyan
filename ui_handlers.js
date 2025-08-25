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
        E.advancePlotBtn = document.getElementById('advancePlotBtn');
        E.advancePlotMajorBtn = document.getElementById('advancePlotMajorBtn');
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
        
        // 设备模式切换相关元素
        E.deviceModeToggleBtn = document.getElementById('deviceModeToggleBtn');
        E.deviceIcon = E.deviceModeToggleBtn?.querySelector('.device-icon');
        E.deviceText = E.deviceModeToggleBtn?.querySelector('.device-text');
        

        

    };
    
    const createGuardedAction = (callback) => {
        return (...args) => {
            const S = GameApp.state;
            const ui = GameApp.ui;
            if (S.isAiResponding || S.isSummarizing) {
                ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }
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

        ui.addMessageToGameOutputDOM = (messageData) => {
            const messageContent = messageData.content || messageData.text || '';
            const { type, id, floor, modelName, isSummaryNotification = false, role } = messageData;
            
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

        ui.scrollToBottom = () => {
            setTimeout(() => {
                if (E.gameOutputDiv) {
                    E.gameOutputDiv.scrollTop = E.gameOutputDiv.scrollHeight;
                }
            }, 0);
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
        
        ui.updateSummaryContentDisplay = text => { if (E.summaryContentDisplay) E.summaryContentDisplay.value = text; };
        
        ui.clearPlayerInput = () => { E.playerInput.value = ''; ui.autoResizeTextarea(E.playerInput); };
        
        ui.setSendButtonState = (enabled) => { E.sendButton.disabled = !enabled; E.sendButton.textContent = enabled ? '发送' : '思考中...'; };
        
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

        // 设备模式切换相关函数
        ui.toggleDeviceMode = () => {
            const body = document.body;
            const isMobileMode = body.classList.contains('mobile-mode');
            
            if (isMobileMode) {
                // 切换到默认端
                body.classList.remove('mobile-mode');
                E.deviceIcon.textContent = '💻';
                E.deviceText.textContent = '默认端';
                localStorage.setItem('deviceMode', 'desktop');
            } else {
                // 切换到手机端
                body.classList.add('mobile-mode');
                E.deviceIcon.textContent = '📱';
                E.deviceText.textContent = '手机端';
                localStorage.setItem('deviceMode', 'mobile');
            }
        };

        ui.initializeDeviceMode = () => {
            const savedMode = localStorage.getItem('deviceMode') || 'desktop';
            const body = document.body;
            
            if (savedMode === 'mobile') {
                body.classList.add('mobile-mode');
                E.deviceIcon.textContent = '📱';
                E.deviceText.textContent = '手机端';
            } else {
                body.classList.remove('mobile-mode');
                E.deviceIcon.textContent = '💻';
                E.deviceText.textContent = '默认端';
            }
        };
    };

    const bindEventListeners = () => {
        const E = GameApp.elements;
        const S = GameApp.state;
        const L = GameApp.logic;
        const ui = GameApp.ui;

        E.sendButton.onclick = () => { const text = E.playerInput.value.trim(); if(text) L.sendPlayerMessage(text); };
        E.playerInput.onkeydown = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); E.sendButton.click(); }};
        E.playerInput.oninput = () => ui.autoResizeTextarea(E.playerInput);

        const createGuardedQuickAction = (message) => {
            return createGuardedAction(() => L.sendPlayerMessage(message));
        };

        E.advancePlotBtn.onclick = createGuardedQuickAction('（推进剧情）');
        E.advancePlotMajorBtn.onclick = createGuardedQuickAction('（大幅度推进剧情）');

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
        };
        // 新增：打开提示词独立设置面板
        E.promptSettingsToggleBtn.onclick = () => {
            E.promptSettingsModal.style.display = 'block';
            E.systemPromptTextareaModal.value = S.currentSystemPrompt;
            E.prefixTextareaModal.value = S.currentPrefix;
            E.postfixTextareaModal.value = S.currentPostfix;
        };
        E.closeSettingsModalBtn.onclick = () => E.settingsModal.style.display = 'none';
        E.closePromptSettingsModalBtn.onclick = () => E.promptSettingsModal.style.display = 'none';
        E.editAvatarsBtn.onclick = () => { ui.updateAvatarPreviewsInModal(); E.avatarEditModal.style.display = 'block'; };
        E.closeAvatarEditModalBtn.onclick = () => E.avatarEditModal.style.display = 'none';
        window.onclick = (event) => { 
            if(event.target === E.settingsModal) E.settingsModal.style.display = 'none'; 
            if(event.target === E.promptSettingsModal) E.promptSettingsModal.style.display = 'none'; 
            if(event.target === E.avatarEditModal) E.avatarEditModal.style.display = 'none';
            if(event.target === E.comboManageModal) E.comboManageModal.style.display = 'none'; 
        };

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
            localStorage.setItem('apiKey', E.apiKeyInput.value);
            localStorage.setItem('apiBaseUrl', E.apiBaseUrlInput.value.trim());
            localStorage.setItem('apiModel', E.apiModelInput.value.trim());
            localStorage.setItem('memoryCount', E.memoryCountInput.value);
            localStorage.setItem('streamMode', E.streamToggle.checked);
            localStorage.setItem('temperature', E.temperatureSlider.value);
            localStorage.setItem('topP', E.topPSlider.value);
            localStorage.setItem('topK', E.topKSlider.value);
            ui.showSystemMessage({ text: '主要API设置已保存！', type: 'system-message success'});
            E.apiSettingsStatus.textContent = ''; 
        };
        E.getApiModelsBtn.onclick = () => ui.fetchModels(false);

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
            
            ui.showSystemMessage({ text: '总结设置与内容已保存！', type: 'system-message success' });
            E.summarySettingsStatus.textContent = '';
        };
        
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
        
        // 设备模式切换事件监听器
        if (E.deviceModeToggleBtn) {
            E.deviceModeToggleBtn.onclick = ui.toggleDeviceMode;
        }
        
        // 组合管理模态框的外部点击关闭已在上面的window.onclick中处理
    };

    const initializeApp = () => {
        getElements();
        defineUiFunctions();
        bindEventListeners();
        GameApp.logic.initialize();

        const E = GameApp.elements;
        const S = GameApp.state;
        const ui = GameApp.ui;

        E.apiKeyInput.value = localStorage.getItem('apiKey') || '';
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
        
        // 初始化组合选择器
        ui.updateComboSelector();
        
        // 初始化设备模式
        ui.initializeDeviceMode();
        
        // 刷新UI以确保数据同步
        ui.refreshUI();

        ui.toggleProviderSettings();
        ui.scrollToBottom();
        E.playerInput.focus();
    };

    initializeApp();
});
