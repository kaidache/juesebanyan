// game_logic.js (已修复)

const GameApp = {
    state: {
        // 多组合管理
        currentComboId: 'combo-1',
        promptCombos: {
            'combo-1': {
                name: '组合 1',
                conversationHistory: [],
                systemPrompt: "",
                prefix: "",
                postfix: "",
                messageIdCounter: 0,
                currentFloorCounter: 1,
                currentStatusBarSourceMessageId: null,
                accumulatedSummaryContent: "",
                summarizedUntilTurnCount: 0,
                playerAvatar: '',
                aiAvatar: ''
            }
        },
        
        // 当前活动数据（从当前组合加载）
        conversationHistory: [],
        currentSystemPrompt: "",
        currentPrefix: "",
        currentPostfix: "",
        messageIdCounter: 0,
        currentFloorCounter: 1,
        currentStatusBarSourceMessageId: null,

        isAiResponding: false,
        isSummarizing: false,
        currentAbortController: null,
        summaryAbortController: null,

        currentPlayerAvatar: '',
        currentAiAvatar: '',

        summarySettings: {
            apiKey: '',
            baseUrl: '',
            model: '', 
        },
        currentSummaryPromptText: "",
        accumulatedSummaryContent: "",
        summarizedUntilTurnCount: 0,
        // 自动滚动控制：当用户向上滚动查看历史时置为 false，避免强制拉回底部
        autoScrollEnabled: true,
        
        // 新增：API Key 档案管理状态
        currentApiKeyProfileId: 'key-1',
        apiKeyProfiles: {
            'key-1': { name: '默认Key', apiKey: '' }
        },
    },

    config: {
        defaultPlayerAvatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23607D8B" style="stroke:%23CFD8DC; stroke-width:3px;"/><text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">U</text></svg>',
        defaultAiAvatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%234A90E2" style="stroke:%23B0C4DE; stroke-width:3px;"/><text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">AI</text></svg>',
        defaultSummaryPrompt: "请你扮演一个剧情缩写助手。以下是一段剧情，请你对其进行简洁、客观的剧情缩写，以便于后续的AI能够快速理解之前的背景。用具体的，直白而准确的词汇来描述剧情的经过。请直接输出缩写内容，不要有任何开场白或额外说明。",
    },

    logic: {
        // 组合管理方法
        saveCurrentComboData() {
            const state = GameApp.state;
            const currentCombo = state.promptCombos[state.currentComboId];
            if (currentCombo) {
                currentCombo.conversationHistory = [...state.conversationHistory];
                currentCombo.systemPrompt = state.currentSystemPrompt;
                currentCombo.prefix = state.currentPrefix;
                currentCombo.postfix = state.currentPostfix;
                currentCombo.messageIdCounter = state.messageIdCounter;
                currentCombo.currentFloorCounter = state.currentFloorCounter;
                currentCombo.currentStatusBarSourceMessageId = state.currentStatusBarSourceMessageId;
                currentCombo.accumulatedSummaryContent = state.accumulatedSummaryContent;
                currentCombo.summarizedUntilTurnCount = state.summarizedUntilTurnCount;
                currentCombo.playerAvatar = state.currentPlayerAvatar;
                currentCombo.aiAvatar = state.currentAiAvatar;
            }
        },

        loadComboData(comboId) {
            const state = GameApp.state;
            const combo = state.promptCombos[comboId];
            if (combo) {
                state.conversationHistory = [...combo.conversationHistory];
                state.currentSystemPrompt = combo.systemPrompt;
                state.currentPrefix = combo.prefix;
                state.currentPostfix = combo.postfix;
                state.messageIdCounter = combo.messageIdCounter;
                state.currentFloorCounter = combo.currentFloorCounter;
                state.currentStatusBarSourceMessageId = combo.currentStatusBarSourceMessageId;
                state.accumulatedSummaryContent = combo.accumulatedSummaryContent;
                state.summarizedUntilTurnCount = combo.summarizedUntilTurnCount;
                state.currentPlayerAvatar = combo.playerAvatar || GameApp.config.defaultPlayerAvatar;
                state.currentAiAvatar = combo.aiAvatar || GameApp.config.defaultAiAvatar;
                state.currentComboId = comboId;
                // 根据 summarizedUntilTurnCount 重新同步 summarized 标记
                GameApp.logic.updateSummarizedFlags();
                if (GameApp.ui.updateSummaryBadgesFromHistory) GameApp.ui.updateSummaryBadgesFromHistory();
            }
        },

        switchToCombo(comboId) {
            this.saveCurrentComboData();
            this.saveAllCombosToStorage();
            this.loadComboData(comboId);
        },

        createNewCombo(name) {
            const state = GameApp.state;
            // 生成唯一ID，避免与现有组合冲突
            let newId;
            let counter = 1;
            do {
                newId = 'combo-' + counter;
                counter++;
            } while (state.promptCombos[newId]);
            state.promptCombos[newId] = {
                name: name || `组合 ${Object.keys(state.promptCombos).length + 1}`,
                conversationHistory: [],
                systemPrompt: "",
                prefix: "",
                postfix: "",
                messageIdCounter: 0,
                currentFloorCounter: 1,
                currentStatusBarSourceMessageId: null,
                accumulatedSummaryContent: "",
                summarizedUntilTurnCount: 0,
                playerAvatar: GameApp.config.defaultPlayerAvatar,
                aiAvatar: GameApp.config.defaultAiAvatar
            };
            this.saveAllCombosToStorage();
            return newId;
        },

        renameCombo(comboId, newName) {
            const state = GameApp.state;
            if (state.promptCombos[comboId]) {
                state.promptCombos[comboId].name = newName;
                this.saveAllCombosToStorage();
            }
        },

        deleteCombo(comboId) {
            const state = GameApp.state;
            if (Object.keys(state.promptCombos).length <= 1) {
                return false; // 不能删除最后一个组合
            }
            if (state.promptCombos[comboId]) {
                delete state.promptCombos[comboId];
                if (state.currentComboId === comboId) {
                    // 切换到第一个可用组合
                    const firstComboId = Object.keys(state.promptCombos)[0];
                    this.loadComboData(firstComboId);
                    // 更新UI显示，包括状态栏
                    if (GameApp.ui && GameApp.ui.refreshGameOutput) {
                        GameApp.ui.refreshGameOutput();
                    }
                }
                this.saveAllCombosToStorage();
                return true;
            }
            return false;
        },

        saveAllCombosToStorage() {
            const state = GameApp.state;
            localStorage.setItem('promptCombos', JSON.stringify(state.promptCombos));
            localStorage.setItem('currentComboId', state.currentComboId);
        },

        saveAllApiKeyProfilesToStorage() {
            const state = GameApp.state;
            localStorage.setItem('apiKeyProfiles', JSON.stringify(state.apiKeyProfiles));
            localStorage.setItem('currentApiKeyProfileId', state.currentApiKeyProfileId);
        },
        loadAllApiKeyProfilesFromStorage() {
            const state = GameApp.state;
            try {
                const savedProfiles = localStorage.getItem('apiKeyProfiles');
                const savedCurrentId = localStorage.getItem('currentApiKeyProfileId');
                if (savedProfiles) {
                    state.apiKeyProfiles = JSON.parse(savedProfiles);
                }
                if (savedCurrentId && state.apiKeyProfiles[savedCurrentId]) {
                    state.currentApiKeyProfileId = savedCurrentId;
                }
                // 兼容旧版本：把旧的单一 apiKey 迁移到默认档案
                const legacyKey = localStorage.getItem('apiKey') || '';
                const currentProfile = state.apiKeyProfiles[state.currentApiKeyProfileId];
                if (legacyKey && currentProfile && !currentProfile.apiKey) {
                    currentProfile.apiKey = legacyKey;
                    this.saveAllApiKeyProfilesToStorage();
                }
                // 确保至少有一个档案
                if (!state.apiKeyProfiles || Object.keys(state.apiKeyProfiles).length === 0) {
                    state.apiKeyProfiles = { 'key-1': { name: '默认Key', apiKey: legacyKey } };
                    state.currentApiKeyProfileId = 'key-1';
                    this.saveAllApiKeyProfilesToStorage();
                }
            } catch (e) {
                console.error('加载 API Key 档案失败:', e);
            }
        },
        switchToApiKeyProfile(id) {
            const state = GameApp.state;
            if (!state.apiKeyProfiles[id]) return;
            state.currentApiKeyProfileId = id;
            // 向后兼容：同步当前档案到全局localStorage
            const k = state.apiKeyProfiles[id].apiKey || '';
            localStorage.setItem('apiKey', k);
            this.saveAllApiKeyProfilesToStorage();
        },
        createNewApiKeyProfile(name) {
            const state = GameApp.state;
            // 生成唯一ID
            let newId;
            let counter = 1;
            do {
                newId = 'key-' + counter;
                counter++;
            } while (state.apiKeyProfiles[newId]);
            state.apiKeyProfiles[newId] = { name: name || `Key档案 ${Object.keys(state.apiKeyProfiles).length + 1}`, apiKey: '' };
            this.saveAllApiKeyProfilesToStorage();
            return newId;
        },
        renameApiKeyProfile(id, newName) {
            const state = GameApp.state;
            if (state.apiKeyProfiles[id]) {
                state.apiKeyProfiles[id].name = newName;
                this.saveAllApiKeyProfilesToStorage();
            }
        },
        deleteApiKeyProfile(id) {
            const state = GameApp.state;
            const keys = Object.keys(state.apiKeyProfiles || {});
            if (keys.length <= 1) return false;
            if (!state.apiKeyProfiles[id]) return false;
            delete state.apiKeyProfiles[id];
            if (state.currentApiKeyProfileId === id) {
                const firstId = Object.keys(state.apiKeyProfiles)[0];
                state.currentApiKeyProfileId = firstId;
                localStorage.setItem('apiKey', state.apiKeyProfiles[firstId].apiKey || '');
            }
            this.saveAllApiKeyProfilesToStorage();
            return true;
        },
        setCurrentProfileApiKey(value) {
            const state = GameApp.state;
            const id = state.currentApiKeyProfileId;
            if (!state.apiKeyProfiles[id]) return;
            state.apiKeyProfiles[id].apiKey = value || '';
            // 向后兼容：同步到全局localStorage
            localStorage.setItem('apiKey', state.apiKeyProfiles[id].apiKey);
            this.saveAllApiKeyProfilesToStorage();
        },
        getCurrentApiKey() {
            const state = GameApp.state;
            const id = state.currentApiKeyProfileId;
            return (state.apiKeyProfiles && state.apiKeyProfiles[id] && state.apiKeyProfiles[id].apiKey) || localStorage.getItem('apiKey') || '';
        },

        loadAllCombosFromStorage() {
            const state = GameApp.state;
            try {
                const savedCombos = localStorage.getItem('promptCombos');
                const savedCurrentId = localStorage.getItem('currentComboId');
                
                if (savedCombos) {
                    state.promptCombos = JSON.parse(savedCombos);
                }
                if (savedCurrentId && state.promptCombos[savedCurrentId]) {
                    state.currentComboId = savedCurrentId;
                }
                
                // 确保至少有一个组合
                if (Object.keys(state.promptCombos).length === 0) {
                    state.promptCombos['combo-1'] = {
                        name: '组合 1',
                        conversationHistory: [],
                        systemPrompt: "",
                        prefix: "",
                        postfix: "",
                        messageIdCounter: 0,
                        currentFloorCounter: 1,
                        currentStatusBarSourceMessageId: null,
                        accumulatedSummaryContent: "",
                        summarizedUntilTurnCount: 0,
                        playerAvatar: GameApp.config.defaultPlayerAvatar,
                        aiAvatar: GameApp.config.defaultAiAvatar
                    };
                    state.currentComboId = 'combo-1';
                }
            } catch (e) {
                console.error('加载组合数据失败:', e);
            }
        },

        saveHistoryToLocalStorage() {
            // 保存当前组合数据
            this.saveCurrentComboData();
            this.saveAllCombosToStorage();
        },

        initialize() {
            const state = GameApp.state;
            const config = GameApp.config;

            // 加载全局设置（不属于特定组合的设置）
            state.summarySettings.apiKey = localStorage.getItem('summaryApiKey') || '';
            state.summarySettings.baseUrl = localStorage.getItem('summaryApiBaseUrl') || '';
            state.summarySettings.model = localStorage.getItem('summaryApiModel') || '';
            state.currentSummaryPromptText = localStorage.getItem('summaryPromptText') || config.defaultSummaryPrompt;

            // 新增：加载 API Key 档案
            this.loadAllApiKeyProfilesFromStorage();

            // 加载所有组合数据
            this.loadAllCombosFromStorage();
            
            // 加载当前组合的数据到活动状态
            this.loadComboData(state.currentComboId);
            
            // 兼容旧版本数据迁移
            this.migrateOldData();
        },

        migrateOldData() {
            const state = GameApp.state;
            const config = GameApp.config;
            
            // 检查是否有旧版本的数据需要迁移
            const oldHistory = localStorage.getItem('savedConversationHistory');
            const oldSystemPrompt = localStorage.getItem('systemPrompt');
            const oldPrefix = localStorage.getItem('prefix');
            const oldPostfix = localStorage.getItem('postfix');
            const oldPlayerAvatar = localStorage.getItem('playerAvatarUrl');
            const oldAiAvatar = localStorage.getItem('aiAvatarUrl');
            const oldSummaryContent = localStorage.getItem('accumulatedSummaryContent');
            const oldSummarizedCount = localStorage.getItem('summarizedUntilTurnCount');
            
            if (oldHistory || oldSystemPrompt || oldPrefix || oldPostfix) {
                // 迁移到第一个组合
                const firstCombo = state.promptCombos[state.currentComboId];
                if (firstCombo) {
                    if (oldHistory) {
                        try {
                            firstCombo.conversationHistory = JSON.parse(oldHistory);
                            if (firstCombo.conversationHistory.length > 0) {
                                const maxId = Math.max(...firstCombo.conversationHistory.map(m => m.id || 0));
                                firstCombo.messageIdCounter = maxId + 1;
                            }
                        } catch (e) {
                            console.error('迁移对话历史失败:', e);
                        }
                    }
                    if (oldSystemPrompt) firstCombo.systemPrompt = oldSystemPrompt;
                    if (oldPrefix) firstCombo.prefix = oldPrefix;
                    if (oldPostfix) firstCombo.postfix = oldPostfix;
                    if (oldPlayerAvatar) firstCombo.playerAvatar = oldPlayerAvatar;
                    if (oldAiAvatar) firstCombo.aiAvatar = oldAiAvatar;
                    if (oldSummaryContent) firstCombo.accumulatedSummaryContent = oldSummaryContent;
                    if (oldSummarizedCount) firstCombo.summarizedUntilTurnCount = parseInt(oldSummarizedCount, 10);
                    
                    // 重新加载当前组合数据
                    this.loadComboData(state.currentComboId);
                    
                    // 保存迁移后的数据
                    this.saveAllCombosToStorage();
                    
                    // 清理旧数据
                    localStorage.removeItem('savedConversationHistory');
                    localStorage.removeItem('systemPrompt');
                    localStorage.removeItem('prefix');
                    localStorage.removeItem('postfix');
                    localStorage.removeItem('playerAvatarUrl');
                    localStorage.removeItem('aiAvatarUrl');
                    localStorage.removeItem('accumulatedSummaryContent');
                    localStorage.removeItem('summarizedUntilTurnCount');
                }
            }
        },

        clearAllHistory() {
            const state = GameApp.state;
            state.conversationHistory = [];
            state.accumulatedSummaryContent = "";
            state.summarizedUntilTurnCount = 0;
            state.messageIdCounter = 0;
            state.currentFloorCounter = 1;
            state.currentStatusBarSourceMessageId = null;

            localStorage.removeItem('savedConversationHistory');
            localStorage.removeItem('accumulatedSummaryContent');
            localStorage.removeItem('summarizedUntilTurnCount');
        },

        clearHistory() {
            const state = GameApp.state;
            // 清空当前组合的数据
            state.conversationHistory = [];
            state.messageIdCounter = 1;
            state.accumulatedSummaryContent = "";
            state.summarizedUntilTurnCount = 0;
            state.currentFloorCounter = 1;
            state.currentStatusBarSourceMessageId = null;
            
            // 同时清空当前组合在promptCombos中的数据
            const currentCombo = state.promptCombos[state.currentComboId];
            if (currentCombo) {
                currentCombo.conversationHistory = [];
                currentCombo.messageIdCounter = 1;
                currentCombo.accumulatedSummaryContent = "";
                currentCombo.summarizedUntilTurnCount = 0;
                currentCombo.currentFloorCounter = 1;
                currentCombo.currentStatusBarSourceMessageId = null;
            }
            
            // 保存到本地存储
            this.saveHistoryToLocalStorage();
        },

        generateMessageId: () => GameApp.state.messageIdCounter++,
        
        extractStatusBarContent: (text) => text.match(/```([\s\S]*?)```/)?.[1].trim() || null,
        
        removeStatusBarFromMainContent: (text) => text.replace(/```[\s\S]*?```\s*/, '').trim(),

        checkAndCleanHistory() {
            if (GameApp.state.conversationHistory.length > 1000) {
                GameApp.state.conversationHistory = GameApp.state.conversationHistory.slice(-500);
                const oldSummarizedCount = GameApp.state.summarizedUntilTurnCount;
                GameApp.state.summarizedUntilTurnCount = Math.max(0, oldSummarizedCount - 500);
                this.saveHistoryToLocalStorage();
                GameApp.ui.showSystemMessage({ text: "为了保持性能，已自动清理较早的对话记录。", type: "system-message warning" });
                // 更新 summarized 标记以匹配新的 summarizedUntilTurnCount
                GameApp.logic.updateSummarizedFlags();
                if (GameApp.ui.updateSummaryBadgesFromHistory) GameApp.ui.updateSummaryBadgesFromHistory();
            }
        },
        
        resetSummaryState() {
            GameApp.state.accumulatedSummaryContent = "";
            GameApp.state.summarizedUntilTurnCount = 0;
            // 清除每条消息的 summarized 标记
            GameApp.state.conversationHistory.forEach(m => { if (m.role === 'user' || m.role === 'assistant') m.summarized = false; });
            localStorage.setItem('accumulatedSummaryContent', "");
            localStorage.setItem('summarizedUntilTurnCount', "0");
            GameApp.ui.updateSummaryContentDisplay(GameApp.state.accumulatedSummaryContent);
            if (GameApp.ui.updateSummaryBadgesFromHistory) GameApp.ui.updateSummaryBadgesFromHistory();
        },

        async sendPlayerMessage(playerText) {
            if (GameApp.state.isAiResponding || GameApp.state.isSummarizing) {
                GameApp.ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }

            const apiKey = this.getCurrentApiKey();
            const systemPrompt = GameApp.state.currentSystemPrompt;
            if (!apiKey || !systemPrompt) {
                GameApp.ui.showSystemMessage({ text: "错误：请先在设置中配置API Key和核心提示词。", type: "system-message error", temporary: false });
                return;
            }

            const playerId = this.generateMessageId();
            const playerMessage = {
                id: playerId,
                role: 'user',
                content: playerText,
                floor: GameApp.state.currentFloorCounter,
                summarized: false
            };
            GameApp.state.conversationHistory.push(playerMessage);
            this.saveHistoryToLocalStorage();
            
            this.checkAndCleanHistory();
            
            GameApp.ui.addMessageToGameOutputDOM(playerMessage);
            GameApp.ui.clearPlayerInput();

            await this.callApiAndProcessResponse();
        },

        async callApiAndProcessResponse() {
            GameApp.state.isAiResponding = true;
            GameApp.ui.setSendButtonState(false);
            GameApp.state.currentAbortController = new AbortController();
            
            let tempAiBubble = null;
            let aiMessageId = null;
            let accumulatedAiText = "";

            try {
                const memoryCount = parseInt(localStorage.getItem('memoryCount') || '20', 10);
                const provider = localStorage.getItem('apiProvider') || 'openai';
                const stream = localStorage.getItem('streamMode') !== 'false';
                const temperature = parseFloat(localStorage.getItem('temperature')) || null;
                const topP = parseFloat(localStorage.getItem('topP')) || null;
                const topK = parseInt(localStorage.getItem('topK'), 10) || null;

                // 在流式输出场景中，禁止自动滚动到底部，保持用户当前阅读位置
                if (stream) {
                    GameApp.state.autoScrollEnabled = false;
                }

                // 仅保留未被总结的对话，避免重复让AI读取“已总结”内容
                const relevantHistory = GameApp.state.conversationHistory.filter(m => (m.role === 'user' || m.role === 'assistant') && !m.summarized);
                const startIndex = Math.max(0, relevantHistory.length - memoryCount);
                const recentHistory = relevantHistory.slice(startIndex);

                let indexOfLastValidStatusBar = -1;
                for (let i = recentHistory.length - 1; i >= 0; i--) {
                    const msg = recentHistory[i];
                    if (msg.role === 'assistant' && msg.content && msg.content.includes('```')) {
                        indexOfLastValidStatusBar = i;
                        break; 
                    }
                }

                const cleanedHistoryForApi = recentHistory.map((msg, index) => {
                    if (msg.role === 'assistant' && index !== indexOfLastValidStatusBar) {
                        return {
                            role: msg.role,
                            content: this.removeStatusBarFromMainContent(msg.content)
                        };
                    }
                    return {
                        role: msg.role,
                        content: msg.content
                    };
                });
                
                const finalHistoryForApi = JSON.parse(JSON.stringify(cleanedHistoryForApi));
                const prefix = GameApp.state.currentPrefix;
                const postfix = GameApp.state.currentPostfix;

                if (prefix || postfix) {
                    for (let i = finalHistoryForApi.length - 1; i >= 0; i--) {
                        if (finalHistoryForApi[i].role === 'user') {
                            let originalContent = finalHistoryForApi[i].content;
                            finalHistoryForApi[i].content = `${prefix}${originalContent}${postfix}`;
                            break; 
                        }
                    }
                }

                let messagesForApi;
                let systemPromptForApi; 
                
                let combinedSystemContent = GameApp.state.currentSystemPrompt;

                if (GameApp.state.accumulatedSummaryContent) {
                    const summaryBlock = `\n\n---\n[重要背景总结]\n${GameApp.state.accumulatedSummaryContent}`;
                    combinedSystemContent += summaryBlock;
                }

                if (provider === 'google') {
                    systemPromptForApi = combinedSystemContent;
                    messagesForApi = finalHistoryForApi;
                } else {
                    messagesForApi = [
                        { role: 'system', content: combinedSystemContent },
                        ...finalHistoryForApi
                    ];
                    systemPromptForApi = null;
                }

                aiMessageId = this.generateMessageId();
                const modelName = localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
                
                tempAiBubble = GameApp.ui.addMessageToGameOutputDOM({
                    id: aiMessageId,
                    role: 'assistant',
                    text: `<span class="thinking-animation">AI正在思考...</span>`,
                    type: 'ai-message is-thinking',
                    modelName: modelName,
                    floor: GameApp.state.currentFloorCounter,
                });

                const adapter = apiHandler.getAdapter(provider);
                let finalResponseText = null;

                await adapter.chat({
                    apiKey: this.getCurrentApiKey() || '',
                    baseUrl: localStorage.getItem('apiBaseUrl') || '',
                    model: modelName,
                    messages: messagesForApi,
                    systemPrompt: systemPromptForApi,
                    abortSignal: GameApp.state.currentAbortController.signal,
                    stream: stream,
                    temperature: temperature,
                    topP: topP,
                    topK: topK,
                    onChunk: (chunk) => {
                        accumulatedAiText += chunk;
                        GameApp.ui.updateStreamingMessage(tempAiBubble, accumulatedAiText);
                    },
                    onComplete: (finalText) => {
                        finalResponseText = finalText;
                    },
                });
                
                const finalText = stream ? accumulatedAiText : finalResponseText;
                const statusBarContent = this.extractStatusBarContent(finalText);
                const mainContent = this.removeStatusBarFromMainContent(finalText);
                
                // 检测媒体内容
                const mediaContent = this.detectMediaContent(mainContent);
                
                const aiMessage = {
                    id: aiMessageId,
                    role: 'assistant',
                    content: finalText,
                    statusBarContent: statusBarContent,
                    model: modelName,
                    floor: parseInt(tempAiBubble.dataset.floorId, 10),
                    mediaContent: mediaContent,
                    summarized: false
                };
                GameApp.state.conversationHistory.push(aiMessage);
                this.saveHistoryToLocalStorage();
                GameApp.ui.finalizeStreamingMessage(tempAiBubble, mainContent, aiMessage);
                if (statusBarContent) {
                    GameApp.ui.updateStatusBar(statusBarContent, aiMessageId);
                }
                
                // Do not await this, let it run in the background
                this.triggerSummaryCheck();

            } catch (error) {
                console.error("AI交互错误:", error);
                const errorMessage = error.name === 'AbortError' ? "AI请求已中断。" : `发生错误: ${error.message}`;
                if (tempAiBubble && aiMessageId !== null) {
                    GameApp.ui.replaceThinkingWithError(tempAiBubble, errorMessage, aiMessageId);
                } else {
                    GameApp.ui.showSystemMessage({ text: errorMessage, type: 'system-message error' });
                }
            } finally {
                GameApp.state.isAiResponding = false;
                GameApp.ui.setSendButtonState(true);
                GameApp.state.currentAbortController = null;
                // 结束流式输出后，恢复默认的自动滚动行为
                GameApp.state.autoScrollEnabled = true;
            }
        },

        async triggerSummaryCheck() {
            const memoryCount = parseInt(localStorage.getItem('memoryCount') || '20', 10);
            const allHistory = GameApp.state.conversationHistory.filter(m => m.role === 'user' || m.role === 'assistant');
            const historyLength = allHistory.length;
            const startTurn = GameApp.state.summarizedUntilTurnCount;

            if (!GameApp.state.isSummarizing && historyLength > memoryCount) {
                
                const endTurn = historyLength - memoryCount;

                if (endTurn > startTurn) {
                    
                    const summaryMessage = `对话记录较长，正在后台自动总结第 ${startTurn + 1} 至 ${endTurn} 层的内容...`;
                    GameApp.ui.showSystemMessage({ text: summaryMessage, type: "system-message summary-notification" });
                    
                    const historyToSummarize = allHistory.slice(startTurn, endTurn);
                    
                    if (historyToSummarize.length > 0) {
                        await this.performSummary(historyToSummarize, startTurn, endTurn);
                    }
                }
            }
        },

        async performSummary(historyToSummarize, startTurn, endTurn) {
            GameApp.state.isSummarizing = true;
            GameApp.state.summaryAbortController = new AbortController();
            if (GameApp.ui && GameApp.ui.updateCancelVisibility) GameApp.ui.updateCancelVisibility();
        
            try {
                const mainApiKey = localStorage.getItem('apiKey') || '';
                const mainBaseUrl = localStorage.getItem('apiBaseUrl') || '';
                const mainModel = localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        
                const summaryApiKey = GameApp.state.summarySettings.apiKey || mainApiKey;
                const summaryBaseUrl = GameApp.state.summarySettings.baseUrl || mainBaseUrl;
                const summaryModel = GameApp.state.summarySettings.model || mainModel;
        
                if (!summaryApiKey || !summaryModel) {
                    GameApp.ui.showSystemMessage({ text: `总结失败：第 ${startTurn + 1} 至 ${endTurn} 层未配置API Key或模型。`, type: "system-message summary-notification error" });
                    // This return is now safe because the finally block will execute.
                    return; 
                }
        
                const summaryProvider = summaryModel.toLowerCase().includes('gemini') ? 'google' : 'openai';
                const adapter = apiHandler.getAdapter(summaryProvider);
        
                const dialogueText = historyToSummarize.map(m => `${m.role === 'user' ? '玩家' : 'AI'}: ${this.removeStatusBarFromMainContent(m.content)}`).join('\n\n');
                
                const systemPromptForSummary = GameApp.state.currentSummaryPromptText;
                const contentToSummarize = `[需要总结的对话内容如下:]\n${dialogueText}`;
                
                let messagesForSummary;
                let finalSystemPromptForSummary = null;
        
                if (summaryProvider === 'google') {
                    messagesForSummary = [{ role: 'user', content: contentToSummarize }];
                    finalSystemPromptForSummary = systemPromptForSummary;
                } else {
                    messagesForSummary = [
                        { role: 'system', content: systemPromptForSummary },
                        { role: 'user', content: contentToSummarize }
                    ];
                }
        
                const summaryText = await adapter.chat({
                    apiKey: summaryApiKey,
                    baseUrl: summaryBaseUrl,
                    model: summaryModel,
                    messages: messagesForSummary,
                    systemPrompt: finalSystemPromptForSummary,
                    abortSignal: GameApp.state.summaryAbortController.signal,
                    stream: false,
                });
        
                GameApp.state.summarizedUntilTurnCount = endTurn;
                localStorage.setItem('summarizedUntilTurnCount', GameApp.state.summarizedUntilTurnCount.toString());
                // 更新 summarized 标记并刷新徽章显示
                GameApp.logic.updateSummarizedFlags();
                if (GameApp.ui.updateSummaryBadgesFromHistory) GameApp.ui.updateSummaryBadgesFromHistory();
        
                if (summaryText && summaryText.trim() !== "") {
                   GameApp.state.accumulatedSummaryContent += (GameApp.state.accumulatedSummaryContent ? "\n\n" : "") + summaryText;
                   localStorage.setItem('accumulatedSummaryContent', GameApp.state.accumulatedSummaryContent);
                   GameApp.ui.updateSummaryContentDisplay(GameApp.state.accumulatedSummaryContent);
                   GameApp.ui.showSystemMessage({ text: `第 ${startTurn + 1} 至 ${endTurn} 层的内容已成功总结并更新。`, type: "system-message summary-notification" });
                } else {
                   console.log(`后台总结完成，但模型返回内容为空。已将总结进度更新至第 ${endTurn} 层。`);
                   GameApp.ui.showSystemMessage({ text: `第 ${startTurn + 1} 至 ${endTurn} 层内容已处理，但无实质内容更新。`, type: "system-message summary-notification" });
                }
        
           } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error("总结错误:", error);
                    GameApp.ui.showSystemMessage({ text: `后台自动总结第 ${startTurn + 1} 至 ${endTurn} 层失败(模型: ${localStorage.getItem('summaryApiModel')}): ${error.message}`, type: "system-message summary-notification error" });
                }
           } finally {
                GameApp.state.summaryAbortController = null;
                GameApp.state.isSummarizing = false; // This is now guaranteed to run
                if (GameApp.ui && GameApp.ui.updateCancelVisibility) GameApp.ui.updateCancelVisibility();
           }
       },
        
        saveAiMessageEdit(messageId, newText) {
            const msgIndex = GameApp.state.conversationHistory.findIndex(msg => msg.id === messageId && msg.role === 'assistant');
            if (msgIndex === -1) return;
            
            const historyEntry = GameApp.state.conversationHistory[msgIndex];
            historyEntry.content = newText;
            historyEntry.statusBarContent = this.extractStatusBarContent(newText);
            
            GameApp.ui.updateMessageContent(messageId, newText);
            GameApp.ui.updateStatusBarFromHistory();
            GameApp.ui.toggleEditState(messageId, 'assistant', false);
            const displayFloor = historyEntry.floor || messageId;
            GameApp.ui.showSystemMessage({ text: `AI回复 #${displayFloor} 已被手动修改。`, type: "system-message success" });
            this.saveHistoryToLocalStorage();
        },

        savePlayerMessageEdit(messageId, newText) {
            const msgIndex = GameApp.state.conversationHistory.findIndex(msg => msg.id === messageId && msg.role === 'user');
            if (msgIndex === -1) return;

            const historyEntry = GameApp.state.conversationHistory[msgIndex];
            historyEntry.content = newText;

            GameApp.ui.updateMessageContent(messageId, newText);
            GameApp.ui.toggleEditState(messageId, 'user', false);
            const displayFloor = historyEntry.floor || messageId;
            GameApp.ui.showSystemMessage({ text: `玩家消息 #${displayFloor} 已被修改。`, type: "system-message success" });
            this.saveHistoryToLocalStorage();
        },

        async sendPlayerMessageEdit(messageId, newText) {
            if (GameApp.state.isAiResponding || GameApp.state.isSummarizing) {
                GameApp.ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }

            const playerMessageIndex = GameApp.state.conversationHistory.findIndex(msg => msg.id === messageId && msg.role === 'user');
            if (playerMessageIndex === -1) return;

            const historyEntry = GameApp.state.conversationHistory[playerMessageIndex];
            historyEntry.content = newText;

            GameApp.ui.updateMessageContent(messageId, newText);
            GameApp.ui.toggleEditState(messageId, 'user', false);
            const displayFloor = historyEntry.floor || messageId;
            GameApp.ui.showSystemMessage({ text: `玩家消息 #${displayFloor} 已修改，将基于此生成新的后续剧情...`, type: "system-message" });

            const messagesToRemove = GameApp.state.conversationHistory.slice(playerMessageIndex + 1);
            if (messagesToRemove.length > 0) {
                messagesToRemove.forEach(msg => GameApp.ui.removeMessageDOM(msg.id));
                GameApp.state.conversationHistory = GameApp.state.conversationHistory.slice(0, playerMessageIndex + 1);
                GameApp.ui.showSystemMessage({ text: `后续 ${messagesToRemove.length} 条消息已被清除。`, type: "system-message warning" });
            }
            
            this.saveHistoryToLocalStorage();
            
            GameApp.ui.updateStatusBarFromHistory();
            GameApp.ui.recalculateFloorsAndCounter();
            await this.callApiAndProcessResponse();
        },

        deleteMessage(messageId, role) {
            if (role === 'error-display') {
                GameApp.ui.removeMessageDOM(messageId);
                GameApp.ui.recalculateFloorsAndCounter();
                return;
            }

            const messageIndex = GameApp.state.conversationHistory.findIndex(msg => msg.id === messageId);
            if (messageIndex === -1 || GameApp.state.conversationHistory[messageIndex].role !== role) return;

            const messageToDelete = GameApp.state.conversationHistory[messageIndex];
            const displayFloor = messageToDelete.floor || messageId;
            
            GameApp.state.conversationHistory.splice(messageIndex, 1);
            GameApp.ui.removeMessageDOM(messageId);
            GameApp.ui.updateStatusBarFromHistory();
            GameApp.ui.recalculateFloorsAndCounter();
            this.saveHistoryToLocalStorage();
            GameApp.ui.showSystemMessage({ text: `消息 #${displayFloor} 已删除。`, type: "system-message" });
        },

        async refreshAiMessage(messageId) {
            if (GameApp.state.isAiResponding || GameApp.state.isSummarizing) {
                GameApp.ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }

            const aiMessageIndex = GameApp.state.conversationHistory.findIndex(msg => msg.id === messageId);
            if (aiMessageIndex > 0) {
                const userMessageIndex = GameApp.state.conversationHistory.slice(0, aiMessageIndex).reverse().findIndex(m => m.role === 'user');
                if (userMessageIndex !== -1) {
                    const originalUserMessageIndex = aiMessageIndex - 1 - userMessageIndex;
                    const userMessageId = GameApp.state.conversationHistory[originalUserMessageIndex].id;
                    await this.refreshAiForUserMessage(userMessageId);
                } else {
                    GameApp.ui.showSystemMessage({ text: "错误：无法找到用于刷新的前置玩家消息。", type: "system-message error" });
                }
            }
        },

        async refreshFailedAiMessage(messageId) {
            if (GameApp.state.isAiResponding || GameApp.state.isSummarizing) {
                GameApp.ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }
            GameApp.ui.removeMessageDOM(messageId);
            GameApp.ui.showSystemMessage({ text: `正在尝试重新获取AI回复...`, type: "system-message" });
            await this.callApiAndProcessResponse();
        },

        async refreshAiForUserMessage(userMessageId) {
            if (GameApp.state.isAiResponding || GameApp.state.isSummarizing) {
                GameApp.ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }

            const userMessageIndex = GameApp.state.conversationHistory.findIndex(msg => msg.id === userMessageId);
            if (userMessageIndex === -1) return;
            
            const userMessage = GameApp.state.conversationHistory[userMessageIndex];
            const displayFloor = userMessage ? userMessage.floor : userMessageId;
            GameApp.ui.showSystemMessage({ text: `正在从玩家消息 #${displayFloor} 处继续...`, type: "system-message" });

            const messagesToRemove = GameApp.state.conversationHistory.slice(userMessageIndex + 1);
            if (messagesToRemove.length > 0) {
                messagesToRemove.forEach(msg => GameApp.ui.removeMessageDOM(msg.id));
                GameApp.state.conversationHistory = GameApp.state.conversationHistory.slice(0, userMessageIndex + 1);
                GameApp.ui.showSystemMessage({ text: `后续 ${messagesToRemove.length} 条消息已被清除。`, type: "system-message warning" });
            }
            
            this.saveHistoryToLocalStorage();

            GameApp.ui.updateStatusBarFromHistory();
            GameApp.ui.recalculateFloorsAndCounter();
            
            await this.callApiAndProcessResponse();
        },

        copyMessageContent(messageId) {
            const historyEntry = GameApp.state.conversationHistory.find(msg => msg.id === messageId);
            if (historyEntry) {
                const displayFloor = historyEntry.floor || messageId;
                navigator.clipboard.writeText(this.removeStatusBarFromMainContent(historyEntry.content))
                    .then(() => GameApp.ui.showSystemMessage({ text: `消息 #${displayFloor} 内容已复制。`, type: 'system-message success' }))
                    .catch(err => {
                        console.error('复制失败:', err);
                        GameApp.ui.showSystemMessage({ text: `复制失败，请检查浏览器权限。`, type: 'system-message error' });
                    });
            }
        },

        detectMediaContent(content) {
            if (!content) return null;
            
            const mediaContent = {
                images: [],
                videos: []
            };
            
            // URL验证函数
            const isValidUrl = (url) => {
                try {
                    const urlObj = new URL(url);
                    // 只允许HTTP和HTTPS协议
                    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                        return false;
                    }
                    // 检查是否为私有IP或本地地址
                    const hostname = urlObj.hostname;
                    if (hostname === 'localhost' || hostname === '127.0.0.1' || 
                        hostname.startsWith('192.168.') || hostname.startsWith('10.') ||
                        hostname.startsWith('172.') || hostname === '::1') {
                        return false;
                    }
                    return true;
                } catch (e) {
                    return false;
                }
            };
            
            // 安全URL处理函数
            const sanitizeUrl = (url) => {
                // 移除潜在的恶意字符
                return url.replace(/[<>\"']/g, '');
            };
            
            // 检测图片URL
            const imagePatterns = [
                /\[img\]\s*(https?:\/\/[^\s\[\]]+?)\s*\[\/img\]/gi,
                /!\[image\]\s*\(\s*(https?:\/\/[^\s\)]+?)\s*\)/gi,
                /https?:\/\/[^\s\"'<>]+?\.(jpg|jpeg|png|gif|webp|svg)/gi
            ];
            
            imagePatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    let url = match[1] || match[0];
                    url = sanitizeUrl(url);
                    
                    if (url && !mediaContent.images.includes(url) && isValidUrl(url)) {
                        mediaContent.images.push(url);
                    }
                }
            });
            
            // 检测视频URL
            const videoPatterns = [
                /\[video\]\s*(https?:\/\/[^\s\[\]]+?)\s*\[\/video\]/gi,
                /https?:\/\/[^\s\"'<>]+?\.(mp4|webm|ogg|mov|avi)/gi
            ];
            
            videoPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    let url = match[1] || match[0];
                    url = sanitizeUrl(url);
                    
                    if (url && !mediaContent.videos.includes(url) && isValidUrl(url)) {
                        mediaContent.videos.push(url);
                    }
                }
            });
            
            // 如果没有检测到媒体内容，返回null
            if (mediaContent.images.length === 0 && mediaContent.videos.length === 0) {
                return null;
            }
            
            return mediaContent;
        },

        updateSummarizedFlags() {
            const relevant = GameApp.state.conversationHistory.filter(m => m.role === 'user' || m.role === 'assistant');
            relevant.forEach((m, idx) => {
                m.summarized = idx < GameApp.state.summarizedUntilTurnCount;
            });
        }
    }
};
