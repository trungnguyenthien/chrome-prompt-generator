// Manager page JavaScript
class TemplateManager {
    constructor() {
        this.templates = [];
        this.filteredTemplates = [];
        this.categories = [];
        this.currentEditingId = null;
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadTemplates();
        this.populateCategoryFilters();
        this.bindEvents();
        this.checkUrlParams();
        this.renderTemplates();
    }

    bindEvents() {
        // Create template button
        document.getElementById('createTemplate').addEventListener('click', () => {
            this.showTemplateModal();
        });

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterTemplates(e.target.value, document.getElementById('categoryFilter').value);
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterTemplates(document.getElementById('searchInput').value, e.target.value);
        });

        // Navigation button
        document.getElementById('openCategoriesBtn').addEventListener('click', () => {
            this.openCategories();
        });

        // Export button
        document.getElementById('openExportBtn').addEventListener('click', () => {
            this.showExportPanel();
        });

        // Import button
        document.getElementById('openImportBtn').addEventListener('click', () => {
            this.showImportPanel();
        });

        // Modal events
        const closeModalBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const templateForm = document.getElementById('templateForm');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideTemplateModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideTemplateModal();
            });
        }

        if (templateForm) {
            templateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTemplate();
            });
        }

        // Delete modal events
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Close modal on backdrop click
        document.getElementById('templateModal').addEventListener('click', (e) => {
            if (e.target.id === 'templateModal') {
                this.hideTemplateModal();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.hideDeleteModal();
            }
        });
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('createFrom') === 'page') {
            const title = urlParams.get('title') || '';
            const url = urlParams.get('url') || '';
            const content = urlParams.get('content') || '';
            
            this.showTemplateModal();
            
            // Pre-fill form with page data
            document.getElementById('templateTitle').value = `Prompt cho: ${title}`;
            document.getElementById('templateDescription').value = `Tạo từ trang: ${url}`;
            document.getElementById('templateContent').value = `Dựa trên nội dung trang web sau, hãy:\n\n{{task}}\n\nNội dung trang:\n${content.substring(0, 500)}...`;
        }
    }

    async loadTemplates() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getTemplates' });
            this.templates = response.templates || [];
            this.filteredTemplates = [...this.templates].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        } catch (error) {
            console.error('Error loading templates:', error);
            this.templates = [];
            this.filteredTemplates = [];
        }
    }

    async loadCategories() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getCategories' });
            this.categories = response.categories || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const templateCategory = document.getElementById('templateCategory');
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }

        if (templateCategory) {
            templateCategory.innerHTML = '';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                templateCategory.appendChild(option);
            });
        }
    }

    filterTemplates(searchTerm = '', category = '') {
        let filtered = [...this.templates];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(template => 
                template.title.toLowerCase().includes(term) ||
                template.description.toLowerCase().includes(term) ||
                template.content.toLowerCase().includes(term)
            );
        }

        if (category) {
            filtered = filtered.filter(template => template.category === category);
        }

        filtered.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

        this.filteredTemplates = filtered;
        this.renderTemplates();
    }

    renderTemplates() {
        const grid = document.getElementById('templateGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredTemplates.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.filteredTemplates.map(template => this.renderTemplateCard(template)).join('');

        // Add event listeners to template cards
        this.addTemplateCardEvents();
    }

    renderTemplateCard(template) {
        const createdDate = new Date(template.createdAt).toLocaleDateString('vi-VN');
        const lastUsedDate = template.lastUsed ? new Date(template.lastUsed).toLocaleDateString('vi-VN') : 'Chưa sử dụng';

        return `
            <div class="template-card ${template.favorite ? 'favorite' : ''}" data-id="${template.id}">
                <div class="template-header">
                    <h3 class="template-title">${this.escapeHtml(template.title)}</h3>
                    <span class="template-category category-${template.category}">
                        ${this.getCategoryName(template.category)}
                    </span>
                </div>
                
                <div class="template-content">${this.escapeHtml(template.content)}</div>
                
                <div class="template-actions">
                    <button class="btn btn-delete btn-small delete-btn" data-id="${template.id}">
                        Xóa
                    </button>
                    <div class="actions-right">
                        <button class="btn btn-secondary btn-small use-btn" data-id="${template.id}">
                            🎯 Sử dụng
                        </button>
                        <button class="btn btn-secondary btn-small edit-btn" data-id="${template.id}">
                            ✏️ Sửa
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addTemplateCardEvents() {
        // Use template buttons
        document.querySelectorAll('.use-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.useTemplate(btn.dataset.id);
            });
        });

        // Edit template buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTemplate(btn.dataset.id);
            });
        });

        // Delete template buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTemplate(btn.dataset.id);
            });
        });
    }

    showTemplateModal(template = null) {
        const modal = document.getElementById('templateModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('templateForm');

        if (template) {
            title.textContent = 'Chỉnh sửa Template';
            this.currentEditingId = template.id;
            this.populateForm(template);
        } else {
            title.textContent = 'Tạo Template Mới';
            this.currentEditingId = null;
            if (form) form.reset();
        }

        if (modal) modal.style.display = 'block';
        setTimeout(() => {
            const titleField = document.getElementById('templateTitle');
            if (titleField) titleField.focus();
        }, 100);
    }

    hideTemplateModal() {
        const modal = document.getElementById('templateModal');
        if (modal) modal.style.display = 'none';
        this.currentEditingId = null;
    }

    populateForm(template) {
        const titleField = document.getElementById('templateTitle');
        const descField = document.getElementById('templateDescription');
        const categoryField = document.getElementById('templateCategory');
        const contentField = document.getElementById('templateContent');
        const favoriteField = document.getElementById('templateFavorite');

        if (titleField) titleField.value = template.title || '';
        if (descField) descField.value = template.description || '';
        if (categoryField) categoryField.value = template.category || 'general';
        if (contentField) contentField.value = template.content || '';
        if (favoriteField) favoriteField.checked = template.favorite || false;
    }

    async saveTemplate() {
        const form = document.getElementById('templateForm');
        
        // Get values directly from form elements
        const titleElement = document.getElementById('templateTitle');
        const descriptionElement = document.getElementById('templateDescription');
        const categoryElement = document.getElementById('templateCategory');
        const contentElement = document.getElementById('templateContent');
        const favoriteElement = document.getElementById('templateFavorite');

        const template = {
            title: (titleElement?.value || '').trim(),
            description: (descriptionElement?.value || '').trim(),
            category: categoryElement?.value || 'general',
            content: (contentElement?.value || '').trim(),
            favorite: favoriteElement?.checked || false
        };

        // Debug log to check values
        console.log('Template data:', template);

        // Validate required fields
        if (!template.title) {
            this.showNotification('Vui lòng nhập tiêu đề template!', 'error');
            titleElement?.focus();
            return;
        }

        if (!template.content) {
            this.showNotification('Vui lòng nhập nội dung prompt!', 'error');
            contentElement?.focus();
            return;
        }

        if (this.currentEditingId) {
            template.id = this.currentEditingId;
        }

        try {
            await chrome.runtime.sendMessage({ action: 'saveTemplate', template });
            
            // Reload templates to get fresh data from storage
            await this.loadTemplates();
            
            // Re-apply current filter if any
            const searchTerm = document.getElementById('searchInput').value;
            const category = document.getElementById('categoryFilter').value;
            this.filterTemplates(searchTerm, category);
            
            // Update UI
            this.renderTemplates();
            this.hideTemplateModal();
            
            this.showNotification(this.currentEditingId ? 'Template đã được cập nhật!' : 'Template đã được tạo!');
        } catch (error) {
            console.error('Error saving template:', error);
            this.showNotification('Có lỗi xảy ra khi lưu template!', 'error');
        }
    }

    editTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            this.showTemplateModal(template);
        }
    }

    useTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            this.showTemplateUseModal(template);
        }
    }



    deleteTemplate(templateId) {
        this.templateToDelete = templateId;
        document.getElementById('deleteModal').style.display = 'block';
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').style.display = 'none';
        this.templateToDelete = null;
    }

    async confirmDelete() {
        if (this.templateToDelete) {
            try {
                await chrome.runtime.sendMessage({ action: 'deleteTemplate', templateId: this.templateToDelete });
                
                // Reload templates to get fresh data from storage
                await this.loadTemplates();
                
                // Re-apply current filter if any
                const searchTerm = document.getElementById('searchInput').value;
                const category = document.getElementById('categoryFilter').value;
                this.filterTemplates(searchTerm, category);
                
                // Update UI
                this.renderTemplates();
                this.hideDeleteModal();
                this.showNotification('Template đã được xóa!');
            } catch (error) {
                console.error('Error deleting template:', error);
                this.showNotification('Có lỗi xảy ra khi xóa template!', 'error');
            }
        }
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#4caf50'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Chung';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTemplateUseModal(template) {
        const variables = this.extractVariables(template.content);
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'template-use-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="template-use-modal">
                <div class="modal-header">
                    <h2>🎯 ${this.escapeHtml(template.title)}</h2>
                    <button class="close-btn template-use-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="template-description">${this.escapeHtml(template.description || 'Nhập giá trị cho các biến')}</p>
                    
                    ${variables.length > 0 ? `
                        <div class="variables-preview-container">
                            <div class="variables-section">
                                <h3>📝 Variables</h3>
                                <form class="variables-form">
                                    ${variables.map(variable => `
                                        <div class="form-group">
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
                                </form>
                            </div>
                            
                            <div class="preview-section">
                                <h3>👀 Preview</h3>
                                <div class="preview-content" id="template-preview">${this.escapeHtml(template.content)}</div>
                            </div>
                        </div>
                    ` : `
                        <div class="preview-section full-width">
                            <h3>👀 Nội dung prompt</h3>
                            <div class="preview-content">${this.escapeHtml(template.content)}</div>
                        </div>
                    `}
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary cancel-use">Hủy</button>
                        <button type="button" class="btn btn-primary use-prompt">✨ Sử dụng</button>
                    </div>
                </div>
            </div>
        `;

        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .template-use-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .template-use-modal {
                background: white;
                border-radius: 16px;
                max-width: 900px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .template-use-modal .modal-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 24px;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .template-use-modal .modal-header h2 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }
            
            .template-use-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.8);
                font-size: 24px;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .template-use-close:hover {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            .template-use-modal .modal-body {
                padding: 24px;
            }
            
            .template-description {
                color: #666;
                margin-bottom: 20px;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .variables-preview-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 20px;
            }
            
            @media (max-width: 768px) {
                .variables-preview-container {
                    grid-template-columns: 1fr;
                }
            }
            
            .variables-section h3,
            .preview-section h3 {
                margin: 0 0 16px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .variables-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .variables-form .form-group {
                margin-bottom: 0;
            }
            
            .variables-form label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #333;
                font-size: 14px;
            }
            
            .variable-input {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
                background: #f8f9ff;
                transition: all 0.2s ease;
            }
            
            .variable-input:focus {
                outline: none;
                border-color: #667eea;
                background: white;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .preview-section {
                position: sticky;
                top: 0;
                height: fit-content;
            }
            
            .full-width {
                grid-column: 1 / -1;
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
            
            .modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                padding-top: 16px;
                border-top: 1px solid #e1e5e9;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modalOverlay);

        // Get elements
        const closeBtn = modalOverlay.querySelector('.template-use-close');
        const cancelBtn = modalOverlay.querySelector('.cancel-use');
        const useBtn = modalOverlay.querySelector('.use-prompt');
        const previewContent = modalOverlay.querySelector('#template-preview');
        const variableInputs = modalOverlay.querySelectorAll('.variable-input');

        // Update preview function
        const updatePreview = () => {
            let content = template.content;
            variableInputs.forEach(input => {
                const variable = input.dataset.variable;
                const value = input.value || `{{${variable}}}`;
                content = content.replace(new RegExp(`\\{\\{${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'), value);
            });
            if (previewContent) {
                previewContent.textContent = content;
            }
        };

        // Bind events
        variableInputs.forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        const closeModal = () => {
            modalOverlay.remove();
            style.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        useBtn.addEventListener('click', async () => {
            const content = previewContent ? previewContent.textContent : template.content;
            try {
                await navigator.clipboard.writeText(content);
                this.showNotification('✅ Prompt đã được sao chép vào clipboard!');
                
                // Update usage statistics
                template.usageCount = (template.usageCount || 0) + 1;
                template.lastUsed = Date.now();
                await this.updateTemplate(template);
                
                closeModal();
            } catch (error) {
                console.error('Error using template:', error);
                this.showNotification('❌ Không thể sử dụng template', 'error');
            }
        });

        // Focus first input if any
        if (variableInputs.length > 0) {
            setTimeout(() => variableInputs[0].focus(), 100);
        }
    }

    async updateTemplate(template) {
        try {
            await chrome.runtime.sendMessage({ action: 'saveTemplate', template });
            // Update local templates array
            const index = this.templates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                this.templates[index] = template;
                this.filteredTemplates = [...this.templates].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
            }
        } catch (error) {
            console.error('Error updating template:', error);
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

    async openCategories() {
        try {
            await chrome.runtime.sendMessage({ action: 'openCategories' });
        } catch (error) {
            console.error('Error opening categories page:', error);
            window.location.href = 'categories.html';
        }
    }

    // ===== EXPORT =====

    showExportPanel() {
        const panel = document.getElementById('exportPanel');
        panel.style.display = 'flex';
        this.renderExportList();
    }

    hideExportPanel() {
        document.getElementById('exportPanel').style.display = 'none';
        document.getElementById('exportSelectAll').checked = false;
    }

    renderExportList() {
        const list = document.getElementById('exportTemplateList');
        if (this.templates.length === 0) {
            list.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Chưa có template nào để export.</p>';
            return;
        }
        list.innerHTML = this.templates.map(t => this.renderSelectableItem(t, 'export')).join('');

        list.querySelectorAll('.selectable-template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return;
                const cb = item.querySelector('input[type="checkbox"]');
                cb.checked = !cb.checked;
                item.classList.toggle('selected', cb.checked);
                this.syncExportSelectAll();
                this.updateExportCount();
            });
            const cb = item.querySelector('input[type="checkbox"]');
            cb.addEventListener('change', () => {
                item.classList.toggle('selected', cb.checked);
                this.syncExportSelectAll();
                this.updateExportCount();
            });
        });

        document.getElementById('exportSelectAll').addEventListener('change', (e) => {
            list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = e.target.checked;
                cb.closest('.selectable-template-item').classList.toggle('selected', e.target.checked);
            });
            this.updateExportCount();
        });

        document.getElementById('closeExportPanel').onclick = () => this.hideExportPanel();
        document.getElementById('exportPanel').addEventListener('click', (e) => {
            if (e.target.id === 'exportPanel') this.hideExportPanel();
        });
        document.getElementById('doExportBtn').onclick = () => this.doExport();

        this.updateExportCount();
    }

    renderSelectableItem(template, prefix) {
        const categoryName = this.getCategoryName(template.category);
        const date = template.createdAt ? new Date(template.createdAt).toLocaleDateString('vi-VN') : '';
        return `
            <div class="selectable-template-item" data-id="${template.id}">
                <input type="checkbox" id="${prefix}-cb-${template.id}">
                <div class="selectable-item-info">
                    <div class="selectable-item-title">${this.escapeHtml(template.title)}</div>
                    <div class="selectable-item-meta">
                        <span class="template-category category-${template.category}">${this.escapeHtml(categoryName)}</span>
                        ${date ? `<span style="font-size:12px;color:#999">${date}</span>` : ''}
                        ${template.favorite ? '<span>⭐</span>' : ''}
                    </div>
                    <div class="selectable-item-desc">${this.escapeHtml(template.description || template.content)}</div>
                </div>
            </div>
        `;
    }

    syncExportSelectAll() {
        const checkboxes = document.querySelectorAll('#exportTemplateList input[type="checkbox"]');
        const allChecked = [...checkboxes].every(cb => cb.checked);
        document.getElementById('exportSelectAll').checked = allChecked;
    }

    updateExportCount() {
        const checked = document.querySelectorAll('#exportTemplateList input[type="checkbox"]:checked').length;
        document.getElementById('exportCountLabel').textContent = `${checked} template được chọn`;
        document.getElementById('doExportBtn').disabled = checked === 0;
    }

    doExport() {
        const selectedIds = new Set(
            [...document.querySelectorAll('#exportTemplateList input[type="checkbox"]:checked')]
                .map(cb => cb.closest('.selectable-template-item').dataset.id)
        );
        const selected = this.templates.filter(t => selectedIds.has(t.id));
        const payload = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            templates: selected
        };
        const json = JSON.stringify(payload, null, 2);
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `chrome-prompts-${date}.json`;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.hideExportPanel();
        this.showNotification(`✅ Đã export ${selected.length} template thành ${filename}`);
    }

    // ===== IMPORT =====

    showImportPanel() {
        document.getElementById('importStep1').style.display = 'block';
        document.getElementById('importStep2').style.display = 'none';
        document.getElementById('importPanel').style.display = 'flex';
        this.bindImportPanelEvents();
    }

    hideImportPanel() {
        document.getElementById('importPanel').style.display = 'none';
        document.getElementById('importFileInput').value = '';
    }

    bindImportPanelEvents() {
        const panel = document.getElementById('importPanel');
        const fileInput = document.getElementById('importFileInput');
        const dropZone = document.getElementById('importDropZone');

        document.getElementById('closeImportPanel').onclick = () => this.hideImportPanel();
        document.getElementById('closeImportPanel2').onclick = () => this.hideImportPanel();
        document.getElementById('backToImportStep1').onclick = () => {
            document.getElementById('importStep2').style.display = 'none';
            document.getElementById('importStep1').style.display = 'block';
            fileInput.value = '';
        };

        panel.onclick = (e) => {
            if (e.target.id === 'importPanel') this.hideImportPanel();
        };

        fileInput.onchange = (e) => {
            if (e.target.files[0]) this.handleImportFile(e.target.files[0]);
        };

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                this.handleImportFile(file);
            } else {
                this.showNotification('Vui lòng chọn file .json hợp lệ!', 'error');
            }
        });
    }

    handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                let templates = [];
                if (Array.isArray(data)) {
                    templates = data;
                } else if (data.templates && Array.isArray(data.templates)) {
                    templates = data.templates;
                } else {
                    throw new Error('Định dạng JSON không hợp lệ');
                }
                if (templates.length === 0) {
                    this.showNotification('File không có template nào!', 'error');
                    return;
                }
                this.showImportListStep(templates);
            } catch (err) {
                this.showNotification('Không thể đọc file: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    showImportListStep(templates) {
        this.importCandidates = templates;
        document.getElementById('importStep1').style.display = 'none';
        document.getElementById('importStep2').style.display = 'block';

        const list = document.getElementById('importTemplateList');
        list.innerHTML = templates.map((t, i) => this.renderSelectableItem(
            { ...t, id: t.id || `import-${i}` }, 'import'
        )).join('');

        // Default: all selected
        list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
            cb.closest('.selectable-template-item').classList.add('selected');
        });
        document.getElementById('importSelectAll').checked = true;

        list.querySelectorAll('.selectable-template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return;
                const cb = item.querySelector('input[type="checkbox"]');
                cb.checked = !cb.checked;
                item.classList.toggle('selected', cb.checked);
                this.syncImportSelectAll();
                this.updateImportCount();
            });
            const cb = item.querySelector('input[type="checkbox"]');
            cb.addEventListener('change', () => {
                item.classList.toggle('selected', cb.checked);
                this.syncImportSelectAll();
                this.updateImportCount();
            });
        });

        document.getElementById('importSelectAll').onchange = (e) => {
            list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = e.target.checked;
                cb.closest('.selectable-template-item').classList.toggle('selected', e.target.checked);
            });
            this.updateImportCount();
        };

        document.getElementById('doImportBtn').onclick = () => this.doImport();
        this.updateImportCount();
    }

    syncImportSelectAll() {
        const checkboxes = document.querySelectorAll('#importTemplateList input[type="checkbox"]');
        const allChecked = checkboxes.length > 0 && [...checkboxes].every(cb => cb.checked);
        document.getElementById('importSelectAll').checked = allChecked;
    }

    updateImportCount() {
        const checked = document.querySelectorAll('#importTemplateList input[type="checkbox"]:checked').length;
        document.getElementById('importCountLabel').textContent = `${checked} template được chọn`;
        document.getElementById('doImportBtn').disabled = checked === 0;
    }

    async doImport() {
        const items = [...document.querySelectorAll('#importTemplateList input[type="checkbox"]:checked')];
        const selectedIndices = items.map(cb => {
            const item = cb.closest('.selectable-template-item');
            return [...document.querySelectorAll('#importTemplateList .selectable-template-item')].indexOf(item);
        });
        const toImport = selectedIndices.map(i => this.importCandidates[i]);

        // Resolve ID conflicts: if an existing template shares the same ID, assign a new one
        const existingIds = new Set(this.templates.map(t => t.id));
        const sanitized = toImport.map(t => {
            const template = { ...t };
            if (!template.id || existingIds.has(template.id)) {
                template.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            }
            if (!template.createdAt) template.createdAt = Date.now();
            if (template.usageCount === undefined) template.usageCount = 0;
            if (template.lastUsed === undefined) template.lastUsed = 0;
            return template;
        });

        try {
            const result = await chrome.storage.local.get(['promptTemplates']);
            const existing = result.promptTemplates || [];
            await chrome.storage.local.set({ promptTemplates: [...existing, ...sanitized] });

            await this.loadTemplates();
            this.renderTemplates();
            this.hideImportPanel();
            this.showNotification(`✅ Đã import ${sanitized.length} template thành công!`);
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Có lỗi xảy ra khi import!', 'error');
        }
    }
}

// Initialize manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TemplateManager();
});
