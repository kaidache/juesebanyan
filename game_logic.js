// game_logic.js (已修复)

const GameApp = {
    state: {
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
    },

    config: {
        defaultPlayerAvatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23607D8B" style="stroke:%23CFD8DC; stroke-width:3px;"/><text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">U</text></svg>',
        defaultAiAvatar: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%234A90E2" style="stroke:%23B0C4DE; stroke-width:3px;"/><text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">AI</text></svg>',
        defaultSummaryPrompt: "请你扮演一个剧情缩写助手。以下是一段剧情，请你对其进行简洁、客观的剧情缩写，以便于后续的AI能够快速理解之前的背景。用具体的，直白而准确的词汇来描述剧情的经过。请直接输出缩写内容，不要有任何开场白或额外说明。",
    },

    logic: {
        saveHistoryToLocalStorage() {
            const state = GameApp.state;
            if (state.conversationHistory.length > 0) {
                localStorage.setItem('savedConversationHistory', 
                    JSON.stringify(state.conversationHistory));
            } else {
                localStorage.removeItem('savedConversationHistory');
            }
        },

        initialize() {
            const state = GameApp.state;
            const config = GameApp.config;

            state.currentSystemPrompt = localStorage.getItem('systemPrompt') || "";
            state.currentPrefix = localStorage.getItem('prefix') || "";
            state.currentPostfix = localStorage.getItem('postfix') || "";
            state.currentPlayerAvatar = localStorage.getItem('playerAvatarUrl') || config.defaultPlayerAvatar;
            state.currentAiAvatar = localStorage.getItem('aiAvatarUrl') || config.defaultAiAvatar;

            state.summarySettings.apiKey = localStorage.getItem('summaryApiKey') || '';
            state.summarySettings.baseUrl = localStorage.getItem('summaryApiBaseUrl') || '';
            state.summarySettings.model = localStorage.getItem('summaryApiModel') || '';
            state.currentSummaryPromptText = localStorage.getItem('summaryPromptText') || config.defaultSummaryPrompt;
            state.accumulatedSummaryContent = localStorage.getItem('accumulatedSummaryContent') || "";
            state.summarizedUntilTurnCount = parseInt(localStorage.getItem('summarizedUntilTurnCount') || '0', 10);
            
            try {
                const savedHistory = localStorage.getItem('savedConversationHistory');
                if (savedHistory) {
                    state.conversationHistory = JSON.parse(savedHistory);
                    
                    if (state.conversationHistory.length > 0) {
                        const maxId = Math.max(...state.conversationHistory.map(m => m.id || 0));
                        state.messageIdCounter = maxId + 1;
                    }
                }
            } catch (e) {
                console.error('恢复对话历史失败:', e);
                localStorage.removeItem('savedConversationHistory');
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
            }
        },
        
        resetSummaryState() {
            GameApp.state.accumulatedSummaryContent = "";
            GameApp.state.summarizedUntilTurnCount = 0;
            localStorage.setItem('accumulatedSummaryContent', "");
            localStorage.setItem('summarizedUntilTurnCount', "0");
            GameApp.ui.updateSummaryContentDisplay(GameApp.state.accumulatedSummaryContent);
        },

        async sendPlayerMessage(playerText) {
            if (GameApp.state.isAiResponding || GameApp.state.isSummarizing) {
                GameApp.ui.showSystemMessage({ text: "AI正在处理任务，请稍候...", type: "system-message warning" });
                return;
            }

            const apiKey = localStorage.getItem('apiKey');
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
                floor: GameApp.state.currentFloorCounter
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

                const relevantHistory = GameApp.state.conversationHistory.filter(m => m.role === 'user' || m.role === 'assistant');
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
                    apiKey: localStorage.getItem('apiKey') || '',
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
                const aiMessage = {
                    id: aiMessageId,
                    role: 'assistant',
                    content: finalText,
                    statusBarContent: statusBarContent,
                    model: modelName,
                    floor: parseInt(tempAiBubble.dataset.floorId, 10)
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

        async savePlayerMessageEdit(messageId, newText) {
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
        }
    }
};
