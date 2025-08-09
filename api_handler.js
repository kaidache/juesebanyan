// api_handler.js (已修复)

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

function _buildUrl(baseUrl, defaultUrl, endpoint) {
    const finalBase = baseUrl || defaultUrl;
    return finalBase.replace(/\/$/, '') + endpoint;
}

const openAIAdapter = {
    async chat(options) {
        const { 
            apiKey, baseUrl, model, messages, 
            onChunk, onComplete, abortSignal,
            stream, temperature, topP, topK 
        } = options;
        
        const url = _buildUrl(baseUrl, 'https://api.openai.com/v1', '/chat/completions');
        
        const body = {
            model: model,
            messages: messages,
            stream: stream
        };
        
        if (temperature != null) body.temperature = temperature;
        if (topP != null) body.top_p = topP;
        if (topK != null) body.top_k = topK;

        let retries = 3;
        
        while(retries > 0) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(body),
                    signal: abortSignal
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `HTTP Error: ${response.status} ${response.statusText}`;
                    throw new ApiError(errorMessage, response.status);
                }
                
                if (stream) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let fullResponse = "";
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            if (buffer.length > 0) console.warn("Stream ended with non-empty buffer:", buffer);
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.trim().startsWith("data: ")) {
                                const dataStr = line.trim().substring(6);
                                if (dataStr === "[DONE]") break;
                                
                                try {
                                    const data = JSON.parse(dataStr);
                                    const content = data.choices?.[0]?.delta?.content || "";
                                    if (content) {
                                        fullResponse += content;
                                        if (onChunk) onChunk(content);
                                    }
                                } catch (e) {
                                    console.error("Error parsing OpenAI stream data:", e, "Data string:", dataStr);
                                }
                            }
                        }
                    }
                    if (onComplete) onComplete(fullResponse);
                    return fullResponse;
                } else {
                    const data = await response.json();
                    const fullResponse = data.choices?.[0]?.message?.content || "";
                    if (onComplete) onComplete(fullResponse);
                    return fullResponse;
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error;
                }

                const isRetryable = !(error instanceof ApiError) || (error.status >= 500 && error.status < 600);

                retries--;
                if (retries === 0 || !isRetryable) {
                    throw error;
                }
                
                console.warn(`API call failed, ${isRetryable ? 'retrying' : 'not retrying'}. Retries left: ${retries}`, error.message);
                await new Promise(r => setTimeout(r, (3 - retries) * 1000));
            }
        }
    },

    async getModels(apiKey, baseUrl) {
        const url = _buildUrl(baseUrl, 'https://api.openai.com/v1', '/models');
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            // --- 【修改】---
            // 添加 cache: 'no-cache' 选项，强制浏览器每次都向服务器验证，
            // 避免因缓存导致更换 Key 后模型列表不更新的问题。
            cache: 'no-cache'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(errorData.error?.message || `HTTP Error: ${response.status}`, response.status);
        }
        const data = await response.json();
        return data.data || [];
    }
};

// --- 【新增】---
// 新增一个自定义服务商的适配器，它不包含 topK 参数
const customOpenAIAdapter = {
    // getModels 的行为与 OpenAI 完全相同
    getModels: openAIAdapter.getModels,

    async chat(options) {
        const { 
            apiKey, baseUrl, model, messages, 
            onChunk, onComplete, abortSignal,
            stream, temperature, topP 
            // 注意：这里故意没有解构 topK
        } = options;
        
        const url = _buildUrl(baseUrl, 'https://api.openai.com/v1', '/chat/completions');
        
        const body = {
            model: model,
            messages: messages,
            stream: stream
        };
        
        if (temperature != null) body.temperature = temperature;
        if (topP != null) body.top_p = topP;
        // 注意：这里没有添加 top_k 的逻辑
        
        // 后面的 fetch 逻辑与 openAIAdapter 完全相同
        let retries = 3;
        
        while(retries > 0) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(body),
                    signal: abortSignal
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `HTTP Error: ${response.status} ${response.statusText}`;
                    throw new ApiError(errorMessage, response.status);
                }
                
                if (stream) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let fullResponse = "";
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            if (buffer.length > 0) console.warn("Stream ended with non-empty buffer:", buffer);
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.trim().startsWith("data: ")) {
                                const dataStr = line.trim().substring(6);
                                if (dataStr === "[DONE]") break;
                                
                                try {
                                    const data = JSON.parse(dataStr);
                                    const content = data.choices?.[0]?.delta?.content || "";
                                    if (content) {
                                        fullResponse += content;
                                        if (onChunk) onChunk(content);
                                    }
                                } catch (e) {
                                    console.error("Error parsing OpenAI stream data:", e, "Data string:", dataStr);
                                }
                            }
                        }
                    }
                    if (onComplete) onComplete(fullResponse);
                    return fullResponse;
                } else {
                    const data = await response.json();
                    const fullResponse = data.choices?.[0]?.message?.content || "";
                    if (onComplete) onComplete(fullResponse);
                    return fullResponse;
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error;
                }

                const isRetryable = !(error instanceof ApiError) || (error.status >= 500 && error.status < 600);

                retries--;
                if (retries === 0 || !isRetryable) {
                    throw error;
                }
                
                console.warn(`API call failed, ${isRetryable ? 'retrying' : 'not retrying'}. Retries left: ${retries}`, error.message);
                await new Promise(r => setTimeout(r, (3 - retries) * 1000));
            }
        }
    }
};

const googleGeminiAdapter = {
    _transformMessagesToContents(messages, systemPrompt) {
        const contents = [];
        const filteredMessages = messages.filter((msg, i) => i === 0 || msg.role !== messages[i - 1].role);

        let systemPromptInjected = false;
        for (const msg of filteredMessages) {
            const role = msg.role === 'assistant' ? 'model' : 'user';
            let text = msg.content;
            
            if (role === 'user' && !systemPromptInjected && systemPrompt) {
                text = `${systemPrompt}\n\n---\n\n${text}`;
                systemPromptInjected = true;
            }

            contents.push({ role, parts: [{ text }] });
        }
        
        if (filteredMessages.length === 0 && systemPrompt) {
            contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
        }

        return contents;
    },
    
    async chat(options) {
        const { 
            apiKey, model, messages, systemPrompt, 
            onChunk, onComplete, abortSignal,
            stream, temperature, topP
        } = options;

        const endpointAction = stream ? 'streamGenerateContent' : 'generateContent';
        const endpoint = `/v1beta/models/${model}:${endpointAction}?key=${apiKey}${stream ? '&alt=sse' : ''}`;
        const url = _buildUrl(null, 'https://generativelanguage.googleapis.com', endpoint);
        
        const contents = this._transformMessagesToContents(messages, systemPrompt);

        const generationConfig = {};
        if (temperature != null) generationConfig.temperature = temperature;
        if (topP != null) generationConfig.topP = topP;

        const body = { contents, generationConfig };
        
        let retries = 3;

        while(retries > 0) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: abortSignal
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `HTTP Error: ${response.status} ${response.statusText}`;
                    throw new ApiError(errorMessage, response.status);
                }
                
                if (stream) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let fullResponse = "";
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.trim().startsWith("data: ")) {
                                const dataStr = line.trim().substring(6);
                                try {
                                    const data = JSON.parse(dataStr);
                                    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                                    if (content) {
                                        fullResponse += content;
                                        if (onChunk) onChunk(content);
                                    }
                                    const finishReason = data.candidates?.[0]?.finishReason;
                                    const stopReasons = ["STOP", "MAX_TOKENS"];
                                    
                                    if (finishReason && !stopReasons.includes(finishReason)) {
                                        throw new ApiError(`内容生成被提前终止，原因: ${finishReason}`, 400);
                                    }
                                } catch (e) {
                                    if (e instanceof ApiError) throw e;
                                    console.error("Error parsing Google AI stream data:", e, "Data string:", dataStr);
                                }
                            }
                        }
                    }
                    if (onComplete) onComplete(fullResponse);
                    return fullResponse;
                } else {
                    const data = await response.json();
                    const fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (onComplete) onComplete(fullResponse);
                    return fullResponse;
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    throw error;
                }
                
                const isRetryable = !(error instanceof ApiError) || (error.status >= 500 && error.status < 600);

                retries--;
                if (retries === 0 || !isRetryable) {
                    throw error;
                }
                
                console.warn(`API call failed, ${isRetryable ? 'retrying' : 'not retrying'}. Retries left: ${retries}`, error.message);
                await new Promise(r => setTimeout(r, (3 - retries) * 1000));
            }
        }
    },

    async getModels(apiKey) {
        try {
            let allModels = [];
            let nextPageToken = '';
            const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    
            do {
                const url = `${baseUrl}?key=${apiKey}&pageSize=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
                
                const response = await fetch(url, {
                    // --- 【修改】---
                    // 同样添加 cache: 'no-cache' 选项，确保每次都重新获取。
                    cache: 'no-cache'
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `HTTP Error: ${response.status}`;
                    throw new Error(`Failed to fetch models page: ${errorMessage}`);
                }
    
                const data = await response.json();
    
                if (data.models && data.models.length > 0) {
                    allModels.push(...data.models);
                }
    
                nextPageToken = data.nextPageToken;
    
            } while (nextPageToken);
    
            return allModels
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => ({ id: m.name.replace('models/', '') }));
    
        } catch (error) {
            console.warn('Error fetching Google models, falling back to static list:', error.message);
            return Promise.resolve([
                { id: 'gemini-1.5-pro-latest' },
                { id: 'gemini-1.5-flash-latest' },
                { id: 'gemini-1.0-pro' },
                { id: 'gemini-pro-vision' },
            ]);
        }
    }
};

const apiHandler = {
    // --- 【修改】---
    // 更新 getAdapter 以包含新的自定义选项
    getAdapter(provider) {
        if (provider === 'google') {
            return googleGeminiAdapter;
        }
        if (provider === 'custom_openai') {
            return customOpenAIAdapter;
        }
        // 默认返回标准的 OpenAI 适配器
        return openAIAdapter;
    }
};
