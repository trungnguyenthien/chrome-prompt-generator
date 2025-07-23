// Content script for Chrome Extension
class ContentScript {
    constructor() {
        this.modalContainer = null;
        this.currentTemplate = null;
        this.init();
    }

    init() {
        // Listen for messages from popup and background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });

        // Add CSS for modal if not already added
        this.injectStyles();
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'showPromptModal':
                    await this.showPromptModal();
                    sendResponse({ success: true });
                    break;

                case 'useTemplate':
                    await this.useTemplate(message.templateId);
                    sendResponse({ success: true });
                    break;

                case 'insertText':
                    this.insertTextToActiveElement(message.text);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ error: error.message });
        }
    }

    async showPromptModal() {
        // Get templates from storage
        const response = await chrome.runtime.sendMessage({ action: 'getTemplates' });
        const templates = response.templates || [];

        // Create and show modal
        this.createModal(templates);
        this.showModal();
    }

    async useTemplate(templateId) {
        // Get template from storage
        const response = await chrome.runtime.sendMessage({ action: 'getTemplates' });
        const templates = response.templates || [];
        const template = templates.find(t => t.id === templateId);

        if (template) {
            this.currentTemplate = template;
            this.processTemplate(template);
            
            // Update usage statistics
            chrome.runtime.sendMessage({ 
                action: 'updateUsage', 
                templateId: templateId 
            });
        }
    }

    processTemplate(template) {
        const variables = this.extractVariables(template.content);
        
        if (variables.length > 0) {
            this.showVariableModal(template, variables);
        } else {
            // No variables, show preview modal with copy option
            this.showPreviewModal(template, template.content);
        }
    }

    extractVariables(content) {
        const regex = /\{\{([^}]+)\}\}/g;
        const variables = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            const variable = match[1].trim();
            if (!variables.includes(variable)) {
                variables.push(variable);
            }
        }

        return variables;
    }

    showVariableModal(template, variables) {
        const modal = this.createVariableModal(template, variables);
        document.body.appendChild(modal);
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    createVariableModal(template, variables) {
        const modal = document.createElement('div');
        modal.className = 'prompt-generator-variable-modal';
        modal.innerHTML = `
            <div class="prompt-generator-modal-backdrop">
                <div class="prompt-generator-modal-content variable-modal-content">
                    <div class="prompt-generator-modal-header">
                        <h3>🎯 ${this.escapeHtml(template.title)}</h3>
                        <button class="prompt-generator-close-btn">&times;</button>
                    </div>
                    <div class="prompt-generator-modal-body">
                        <p class="prompt-generator-description">${this.escapeHtml(template.description || 'Nhập giá trị cho các biến')}</p>
                        
                        <div class="variable-form-container">
                            <form class="prompt-generator-variable-form">
                                ${variables.map((variable, index) => `
                                    <div class="prompt-generator-form-group">
                                        <label>${this.escapeHtml(variable)}</label>
                                        <textarea 
                                            name="${this.escapeHtml(variable)}" 
                                            placeholder="Nhập giá trị cho ${this.escapeHtml(variable)}"
                                            rows="3"
                                            class="variable-input"
                                            data-variable="${this.escapeHtml(variable)}"
                                        ></textarea>
                                    </div>
                                `).join('')}
                                
                                <div class="preview-section">
                                    <h4>📋 Preview:</h4>
                                    <div class="preview-content" id="preview-content">${this.escapeHtml(template.content)}</div>
                                </div>
                                
                                <div class="prompt-generator-form-actions">
                                    <button type="button" class="prompt-generator-btn prompt-generator-btn-secondary cancel-btn">Hủy</button>
                                    <button type="submit" class="prompt-generator-btn prompt-generator-btn-primary">✨ Sử dụng</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.prompt-generator-close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const form = modal.querySelector('.prompt-generator-variable-form');
        const backdrop = modal.querySelector('.prompt-generator-modal-backdrop');
        const variableInputs = modal.querySelectorAll('.variable-input');
        const previewContent = modal.querySelector('#preview-content');

        // Update preview when inputs change
        const updatePreview = () => {
            let content = template.content;
            const formData = new FormData(form);
            
            variables.forEach(variable => {
                const value = formData.get(variable) || `{{${variable}}}`;
                content = content.replace(new RegExp(`\\{\\{${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'), value);
            });
            
            previewContent.textContent = content;
        };

        // Bind input events for real-time preview
        variableInputs.forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        closeBtn.addEventListener('click', () => modal.remove());
        cancelBtn.addEventListener('click', () => modal.remove());
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) modal.remove();
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = previewContent.textContent;
            this.insertTextToActiveElement(content);
            modal.remove();
        });

        return modal;
    }

    showPreviewModal(template, content) {
        const modal = document.createElement('div');
        modal.className = 'prompt-generator-preview-modal';
        modal.innerHTML = `
            <div class="prompt-generator-modal-backdrop">
                <div class="prompt-generator-modal-content preview-modal-content">
                    <div class="prompt-generator-modal-header">
                        <h3>🎯 ${this.escapeHtml(template.title)}</h3>
                        <button class="prompt-generator-close-btn">&times;</button>
                    </div>
                    <div class="prompt-generator-modal-body">
                        <p class="prompt-generator-description">${this.escapeHtml(template.description || 'Preview prompt template')}</p>
                        
                        <div class="preview-section">
                            <h4>📋 Nội dung prompt:</h4>
                            <div class="preview-content">${this.escapeHtml(content)}</div>
                        </div>
                        
                        <div class="prompt-generator-form-actions">
                            <button type="button" class="prompt-generator-btn prompt-generator-btn-secondary cancel-btn">Hủy</button>
                            <button type="button" class="prompt-generator-btn prompt-generator-btn-primary use-btn">✨ Sử dụng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.prompt-generator-close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const useBtn = modal.querySelector('.use-btn');
        const backdrop = modal.querySelector('.prompt-generator-modal-backdrop');

        closeBtn.addEventListener('click', () => modal.remove());
        cancelBtn.addEventListener('click', () => modal.remove());
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) modal.remove();
        });

        // Use button
        useBtn.addEventListener('click', () => {
            this.insertTextToActiveElement(content);
            modal.remove();
        });

        document.body.appendChild(modal);
        
        // Focus first button
        setTimeout(() => {
            useBtn.focus();
        }, 100);
    }

    createModal(templates) {
        if (this.modalContainer) {
            this.modalContainer.remove();
        }

        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'prompt-generator-modal';
        this.modalContainer.innerHTML = `
            <div class="prompt-generator-modal-backdrop">
                <div class="prompt-generator-modal-content">
                    <div class="prompt-generator-modal-header">
                        <h3>🤖 Chọn Prompt Template</h3>
                        <button class="prompt-generator-close-btn">&times;</button>
                    </div>
                    <div class="prompt-generator-modal-body">
                        <div class="prompt-generator-search">
                            <input type="text" placeholder="🔍 Tìm kiếm template..." class="search-input">
                        </div>
                        <div class="prompt-generator-template-list">
                            ${templates.map(template => `
                                <div class="prompt-generator-template-item" data-id="${template.id}">
                                    <div class="template-header">
                                        <h4>${this.escapeHtml(template.title)} ${template.favorite ? '⭐' : ''}</h4>
                                        <span class="template-category category-${template.category}">${this.getCategoryName(template.category)}</span>
                                    </div>
                                    <p class="template-description">${this.escapeHtml(template.description || 'Không có mô tả')}</p>
                                    <div class="template-meta">
                                        <span>Đã dùng: ${template.usageCount || 0} lần</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${templates.length === 0 ? `
                            <div class="prompt-generator-empty">
                                <p>Chưa có template nào. Hãy tạo template đầu tiên trong trang quản lý!</p>
                                <button class="prompt-generator-btn prompt-generator-btn-primary open-manager-btn">
                                    Mở trình quản lý
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.addModalEventListeners();
        document.body.appendChild(this.modalContainer);
    }

    addModalEventListeners() {
        const modal = this.modalContainer;
        
        // Close button
        const closeBtn = modal.querySelector('.prompt-generator-close-btn');
        closeBtn.addEventListener('click', () => this.hideModal());

        // Backdrop click
        const backdrop = modal.querySelector('.prompt-generator-modal-backdrop');
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.hideModal();
        });

        // Search functionality
        const searchInput = modal.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.filterTemplates(e.target.value);
        });

        // Template selection
        const templateItems = modal.querySelectorAll('.prompt-generator-template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', () => {
                const templateId = item.dataset.id;
                this.useTemplate(templateId);
                this.hideModal();
            });
        });

        // Open manager button
        const openManagerBtn = modal.querySelector('.open-manager-btn');
        if (openManagerBtn) {
            openManagerBtn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ action: 'openManager' });
                this.hideModal();
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalContainer && this.modalContainer.style.display !== 'none') {
                this.hideModal();
            }
        });
    }

    filterTemplates(searchTerm) {
        const templateItems = this.modalContainer.querySelectorAll('.prompt-generator-template-item');
        const term = searchTerm.toLowerCase();

        templateItems.forEach(item => {
            const title = item.querySelector('h4').textContent.toLowerCase();
            const description = item.querySelector('.template-description').textContent.toLowerCase();
            
            if (title.includes(term) || description.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showModal() {
        if (this.modalContainer) {
            this.modalContainer.style.display = 'block';
        }
    }

    hideModal() {
        if (this.modalContainer) {
            this.modalContainer.style.display = 'none';
        }
    }

    insertTextToActiveElement(text) {
        const activeElement = document.activeElement;
        
        if (activeElement && (
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'INPUT' ||
            activeElement.contentEditable === 'true'
        )) {
            if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                const start = activeElement.selectionStart;
                const end = activeElement.selectionEnd;
                const value = activeElement.value;
                
                activeElement.value = value.substring(0, start) + text + value.substring(end);
                activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
                activeElement.focus();
            } else if (activeElement.contentEditable === 'true') {
                document.execCommand('insertText', false, text);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Prompt đã được sao chép vào clipboard!');
            });
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `prompt-generator-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getCategoryName(category) {
        const names = {
            general: 'Chung',
            writing: 'Viết lách',
            coding: 'Lập trình',
            analysis: 'Phân tích',
            creative: 'Sáng tạo',
            business: 'Kinh doanh'
        };
        return names[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    injectStyles() {
        if (document.getElementById('prompt-generator-styles')) return;

        const style = document.createElement('style');
        style.id = 'prompt-generator-styles';
        style.textContent = `
            .prompt-generator-modal,
            .prompt-generator-variable-modal,
            .prompt-generator-preview-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 999999;
                display: none;
            }

            .prompt-generator-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .prompt-generator-modal-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: prompt-generator-slide-in 0.3s ease;
            }

            .variable-modal-content,
            .preview-modal-content {
                max-width: 800px;
                max-height: 90vh;
            }

            @keyframes prompt-generator-slide-in {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .prompt-generator-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #e1e5e9;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .prompt-generator-modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: white;
            }

            .prompt-generator-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: rgba(255, 255, 255, 0.8);
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .prompt-generator-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }

            .prompt-generator-modal-body {
                padding: 24px;
            }

            .variable-form-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }

            @media (max-width: 768px) {
                .variable-form-container {
                    grid-template-columns: 1fr;
                }
            }

            .prompt-generator-variable-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .preview-section {
                position: sticky;
                top: 0;
                background: white;
                border-radius: 8px;
                padding: 16px;
                border: 2px solid #e1e5e9;
                height: fit-content;
            }

            .preview-section h4 {
                margin: 0 0 12px 0;
                color: #333;
                font-size: 16px;
                font-weight: 600;
            }

            .preview-content {
                background: #f8f9fa;
                padding: 16px;
                border-radius: 8px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 13px;
                line-height: 1.5;
                color: #333;
                white-space: pre-wrap;
                word-wrap: break-word;
                min-height: 120px;
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #e1e5e9;
            }

            .prompt-generator-search {
                margin-bottom: 20px;
            }

            .prompt-generator-search input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
            }

            .prompt-generator-search input:focus {
                outline: none;
                border-color: #667eea;
            }

            .prompt-generator-template-list {
                max-height: 400px;
                overflow-y: auto;
            }

            .prompt-generator-template-item {
                padding: 16px;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .prompt-generator-template-item:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }

            .template-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }

            .template-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .template-category {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
            }

            .category-general { background: #e3f2fd; color: #1976d2; }
            .category-writing { background: #f3e5f5; color: #7b1fa2; }
            .category-coding { background: #e8f5e8; color: #2e7d32; }
            .category-analysis { background: #fff3e0; color: #f57c00; }
            .category-creative { background: #fce4ec; color: #c2185b; }
            .category-business { background: #f1f8e9; color: #558b2f; }

            .template-description {
                color: #666;
                font-size: 14px;
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .template-meta {
                font-size: 12px;
                color: #999;
            }

            .prompt-generator-empty {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }

            .prompt-generator-btn {
                padding: 10px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .prompt-generator-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .prompt-generator-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .prompt-generator-btn-secondary {
                background: #f8f9fa;
                color: #666;
                border: 1px solid #e1e5e9;
            }

            .prompt-generator-btn-secondary:hover {
                background: #e9ecef;
                color: #495057;
            }

            .prompt-generator-description {
                color: #666;
                font-size: 14px;
                margin-bottom: 20px;
                line-height: 1.4;
            }

            .prompt-generator-form-group {
                margin-bottom: 16px;
            }

            .prompt-generator-form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #333;
            }

            .prompt-generator-form-group textarea {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
                transition: border-color 0.2s ease;
            }

            .prompt-generator-form-group textarea:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .variable-input {
                background: #f8f9ff;
                border-color: #d1d9ff !important;
            }

            .variable-input:focus {
                background: white;
                border-color: #667eea !important;
            }

            .prompt-generator-form-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #e1e5e9;
            }

            .prompt-generator-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 1000000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                font-family: inherit;
            }

            .prompt-generator-notification.show {
                transform: translateX(0);
            }

            .prompt-generator-notification.error {
                background: #dc3545;
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize content script
new ContentScript();
