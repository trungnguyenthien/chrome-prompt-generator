// Background service worker for Chrome Extension
class BackgroundService {
    constructor() {
        this.init();
    }

    init() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.setupDefaultData();
            }
            // Create context menu
            this.createContextMenu();
        });

        // Handle extension icon click - open manager page
        chrome.action.onClicked.addListener((tab) => {
            chrome.tabs.create({
                url: chrome.runtime.getURL('manager.html')
            });
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'use-template') {
                // Inject content script to show template selector
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
            }
        });

        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    createContextMenu() {
        chrome.contextMenus.create({
            id: 'use-template',
            title: 'Sử dụng Prompt Template',
            contexts: ['editable', 'selection']
        });
    }

    async setupDefaultData() {
        try {
            // Create some default templates
            const defaultTemplates = [
                {
                    id: this.generateId(),
                    title: "Tóm tắt nội dung",
                    description: "Tóm tắt nội dung văn bản một cách ngắn gọn",
                    category: "general",
                    content: "Hãy tóm tắt nội dung sau đây một cách ngắn gọn và dễ hiểu:\n\n{{content}}",
                    createdAt: Date.now(),
                    lastUsed: 0,
                    usageCount: 0,
                    favorite: false
                },
                {
                    id: this.generateId(),
                    title: "Viết email chuyên nghiệp",
                    description: "Tạo email chuyên nghiệp từ ý tưởng cơ bản",
                    category: "business",
                    content: "Viết một email chuyên nghiệp với nội dung sau:\n\nChủ đề: {{subject}}\nNgười nhận: {{recipient}}\nMục đích: {{purpose}}\n\nYêu cầu: Email cần lịch sự, chuyên nghiệp và rõ ràng.",
                    createdAt: Date.now(),
                    lastUsed: 0,
                    usageCount: 0,
                    favorite: true
                },
                {
                    id: this.generateId(),
                    title: "Phân tích code",
                    description: "Phân tích và giải thích đoạn code",
                    category: "coding",
                    content: "Hãy phân tích đoạn code sau và giải thích:\n\n1. Chức năng của code\n2. Cách thức hoạt động\n3. Những điểm cần cải thiện (nếu có)\n\nCode:\n```\n{{code}}\n```",
                    createdAt: Date.now(),
                    lastUsed: 0,
                    usageCount: 0,
                    favorite: false
                }
            ];

            await chrome.storage.local.set({ promptTemplates: defaultTemplates });
        } catch (error) {
            console.error('Error setting up default data:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getTemplates':
                    const result = await chrome.storage.local.get(['promptTemplates']);
                    sendResponse({ templates: result.promptTemplates || [] });
                    break;

                case 'saveTemplate':
                    await this.saveTemplate(message.template);
                    sendResponse({ success: true });
                    break;

                case 'deleteTemplate':
                    await this.deleteTemplate(message.templateId);
                    sendResponse({ success: true });
                    break;

                case 'updateUsage':
                    await this.updateTemplateUsage(message.templateId);
                    sendResponse({ success: true });
                    break;

                case 'openManager':
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('manager.html')
                    });
                    sendResponse({ success: true });
                    break;

                case 'openCategories':
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('categories.html')
                    });
                    sendResponse({ success: true });
                    break;

                // Categories management
                case 'getCategories':
                    const categories = await this.getCategories();
                    sendResponse({ success: true, categories });
                    break;

                case 'saveCategory':
                    const savedCategory = await this.saveCategory(message.category);
                    sendResponse({ success: true, category: savedCategory });
                    break;

                case 'deleteCategory':
                    await this.deleteCategory(message.categoryId);
                    sendResponse({ success: true });
                    break;

                case 'getTemplateCountsByCategory':
                    const templateCounts = await this.getTemplateCountsByCategory();
                    sendResponse({ success: true, counts: templateCounts });
                    break;

                case 'getTemplateCountsByCategory':
                    const counts = await this.getTemplateCountsByCategory();
                    sendResponse({ counts });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async saveTemplate(template) {
        const result = await chrome.storage.local.get(['promptTemplates']);
        const templates = result.promptTemplates || [];

        if (template.id) {
            // Update existing template
            const index = templates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                // Keep existing metadata and update with new data
                templates[index] = { 
                    ...templates[index], 
                    ...template, 
                    updatedAt: Date.now(),
                    // Preserve original creation data
                    createdAt: templates[index].createdAt,
                    usageCount: templates[index].usageCount,
                    lastUsed: templates[index].lastUsed
                };
            }
        } else {
            // Create new template
            template.id = this.generateId();
            template.createdAt = Date.now();
            template.updatedAt = Date.now();
            template.lastUsed = 0;
            template.usageCount = 0;
            templates.push(template);
        }

        await chrome.storage.local.set({ promptTemplates: templates });
    }

    async deleteTemplate(templateId) {
        const result = await chrome.storage.local.get(['promptTemplates']);
        const templates = result.promptTemplates || [];
        const filteredTemplates = templates.filter(t => t.id !== templateId);
        await chrome.storage.local.set({ promptTemplates: filteredTemplates });
    }

    async updateTemplateUsage(templateId) {
        const result = await chrome.storage.local.get(['promptTemplates']);
        const templates = result.promptTemplates || [];
        
        const template = templates.find(t => t.id === templateId);
        if (template) {
            template.lastUsed = Date.now();
            template.usageCount = (template.usageCount || 0) + 1;
            await chrome.storage.local.set({ promptTemplates: templates });
        }
    }

    // Categories management methods
    async getCategories() {
        const result = await chrome.storage.local.get(['categories']);
        let categories = result.categories || [];
        
        // Ensure default category exists
        const defaultExists = categories.find(cat => cat.id === 'general');
        if (!defaultExists) {
            const defaultCategory = {
                id: 'general',
                name: 'Chung',
                description: 'Danh mục mặc định cho tất cả template',
                color: 'gray',
                isDefault: true,
                createdAt: new Date().toISOString(),
                templateCount: 0
            };
            categories.unshift(defaultCategory);
            await chrome.storage.local.set({ categories });
        }
        
        return categories;
    }

    async saveCategory(category) {
        const result = await chrome.storage.local.get(['categories']);
        const categories = result.categories || [];
        
        const existingIndex = categories.findIndex(cat => cat.id === category.id);
        if (existingIndex !== -1) {
            // Update existing category
            categories[existingIndex] = {
                ...categories[existingIndex],
                ...category,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new category
            categories.push({
                ...category,
                createdAt: new Date().toISOString()
            });
        }
        
        await chrome.storage.local.set({ categories });
        return category;
    }

    async deleteCategory(categoryId) {
        // Cannot delete default category
        if (categoryId === 'general') {
            throw new Error('Cannot delete default category');
        }
        
        const result = await chrome.storage.local.get(['categories', 'promptTemplates']);
        const categories = result.categories || [];
        const templates = result.promptTemplates || [];
        
        // Remove category
        const filteredCategories = categories.filter(cat => cat.id !== categoryId);
        
        // Move templates from deleted category to 'general'
        const updatedTemplates = templates.map(template => {
            if (template.category === categoryId) {
                return { ...template, category: 'general' };
            }
            return template;
        });
        
        await chrome.storage.local.set({ 
            categories: filteredCategories,
            promptTemplates: updatedTemplates
        });
        
        return { success: true };
    }

    async getTemplateCountsByCategory() {
        const result = await chrome.storage.local.get(['promptTemplates']);
        const templates = result.promptTemplates || [];
        
        const counts = {};
        templates.forEach(template => {
            const categoryId = template.category || 'general';
            counts[categoryId] = (counts[categoryId] || 0) + 1;
        });
        
        return counts;
    }

    generateId() {
        return 'tmpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize background service
new BackgroundService();
