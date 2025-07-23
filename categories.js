// Categories Manager - CRUD operations for template categories
class CategoriesManager {
    constructor() {
        this.categories = [];
        this.currentEditId = null;
        this.isExtensionContext = this.checkExtensionContext();
        this.init();
    }

    checkExtensionContext() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    }

    async init() {
        if (this.isExtensionContext) {
            await this.loadCategories();
            await this.refreshTemplateCounts();
            this.setupEventListeners();
            this.renderCategories();
        } else {
            this.showTestModeMessage();
            this.renderDemoCategories();
        }
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterCategories(e.target.value);
        });

        // Navigation button
        document.getElementById('openManagerBtn')?.addEventListener('click', () => {
            this.openManager();
        });

        // Create new category button
        document.getElementById('createCategoryBtn').addEventListener('click', () => {
            this.openCreateModal();
        });

        // Save category button
        document.getElementById('saveCategoryBtn').addEventListener('click', () => {
            this.saveCategory();
        });

        // Delete confirmation button
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteCategory();
        });

        // Modal close handlers
        document.getElementById('categoryModal').addEventListener('hidden.bs.modal', () => {
            this.resetForm();
        });

        // Form submission
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
    }

    async loadCategories() {
        if (!this.isExtensionContext) return;
        
        try {
            const response = await chrome.runtime.sendMessage({ 
                action: 'getCategories' 
            });
            
            if (response && response.success) {
                this.categories = response.categories || [];
                // Ensure default "Chung" category exists
                this.ensureDefaultCategory();
            } else {
                console.error('Failed to load categories:', response?.error);
                this.categories = [];
                this.ensureDefaultCategory();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
            this.ensureDefaultCategory();
        }
    }

    ensureDefaultCategory() {
        const defaultExists = this.categories.find(cat => cat.id === 'general');
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
            this.categories.unshift(defaultCategory);
            this.saveCategoryToStorage(defaultCategory);
        }
    }

    async saveCategoryToStorage(category) {
        if (!this.isExtensionContext) {
            this.showAlert('Chức năng lưu chỉ hoạt động trong Chrome Extension', 'warning');
            return;
        }
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'saveCategory',
                category: category
            });
            
            if (!response || !response.success) {
                throw new Error(response?.error || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            this.showAlert('Lỗi khi lưu danh mục: ' + error.message, 'danger');
        }
    }

    async deleteCategoryFromStorage(categoryId) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'deleteCategory',
                categoryId: categoryId
            });
            
            if (!response || !response.success) {
                throw new Error(response?.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showAlert('Lỗi khi xóa danh mục: ' + error.message, 'danger');
        }
    }

    renderCategories() {
        const container = document.getElementById('categoriesList');
        const emptyState = document.getElementById('emptyState');

        if (this.categories.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        container.innerHTML = this.categories.map(category => 
            this.renderCategoryCard(category)
        ).join('');

        // Add event listeners for action buttons
        this.attachCardEventListeners();
    }

    renderCategoryCard(category) {
        const colorClass = this.getColorClass(category.color);
        const isDefault = category.isDefault || category.id === 'general';
        
        return `
            <div class="category-card ${isDefault ? 'default-category' : ''}" data-category-id="${category.id}">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="flex-grow-1">
                        <div class="category-name">
                            <i class="bi bi-folder-fill me-2 ${colorClass}"></i>
                            ${this.escapeHtml(category.name)}
                            ${isDefault ? '<span class="badge bg-success ms-2">Mặc định</span>' : ''}
                        </div>
                        ${category.description ? `<div class="category-description">${this.escapeHtml(category.description)}</div>` : ''}
                    </div>
                </div>
                
                <div class="category-stats">
                    <span class="stat-badge">
                        <i class="bi bi-file-text me-1"></i>
                        ${category.templateCount || 0} template
                    </span>
                    <span class="stat-badge">
                        <i class="bi bi-calendar me-1"></i>
                        ${this.formatDate(category.createdAt)}
                    </span>
                </div>
                
                <div class="category-actions">
                    <button class="btn-icon btn-edit" onclick="categoriesManager.editCategory('${category.id}')" 
                            title="Chỉnh sửa danh mục">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${!isDefault ? `
                        <button class="btn-icon btn-delete" onclick="categoriesManager.confirmDeleteCategory('${category.id}')" 
                                title="Xóa danh mục">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    attachCardEventListeners() {
        // Event listeners are added via onclick in the HTML for simplicity
        // This method can be used for additional event handling if needed
    }

    getColorClass(color) {
        const colorMap = {
            blue: 'text-primary',
            green: 'text-success',
            purple: 'text-purple',
            red: 'text-danger',
            orange: 'text-warning',
            yellow: 'text-warning',
            pink: 'text-pink',
            gray: 'text-secondary'
        };
        return colorMap[color] || 'text-secondary';
    }

    filterCategories(searchTerm) {
        const filteredCategories = this.categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const container = document.getElementById('categoriesList');
        const emptyState = document.getElementById('emptyState');

        if (filteredCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-search text-muted"></i>
                    <h3>Không tìm thấy danh mục</h3>
                    <p>Không có danh mục nào khớp với từ khóa "${this.escapeHtml(searchTerm)}"</p>
                </div>
            `;
            emptyState.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = filteredCategories.map(category => 
            this.renderCategoryCard(category)
        ).join('');

        this.attachCardEventListeners();
    }

    openCreateModal() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Tạo Danh mục Mới';
        document.getElementById('saveCategoryBtn').innerHTML = '<i class="bi bi-check-circle me-2"></i>Tạo Danh mục';
        
        const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    }

    editCategory(categoryId) {
        if (!this.isExtensionContext) {
            alert('Chức năng chỉnh sửa chỉ hoạt động trong Chrome Extension.\n\nĐể test:\n1. Load extension vào Chrome\n2. Click icon extension');
            return;
        }
        
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        this.currentEditId = categoryId;
        
        // Populate form
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryColor').value = category.color || 'blue';
        
        // Update modal
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa Danh mục';
        document.getElementById('saveCategoryBtn').innerHTML = '<i class="bi bi-check-circle me-2"></i>Cập nhật Danh mục';
        
        const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    }

    async saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDescription').value.trim();
        const color = document.getElementById('categoryColor').value;

        if (!name) {
            this.showAlert('Tên danh mục không được để trống', 'warning');
            return;
        }

        // Check for duplicate names (excluding current edit)
        const existingCategory = this.categories.find(cat => 
            cat.name.toLowerCase() === name.toLowerCase() && 
            cat.id !== this.currentEditId
        );

        if (existingCategory) {
            this.showAlert('Đã tồn tại danh mục với tên này', 'warning');
            return;
        }

        try {
            if (this.currentEditId) {
                // Update existing category
                const categoryIndex = this.categories.findIndex(cat => cat.id === this.currentEditId);
                if (categoryIndex !== -1) {
                    this.categories[categoryIndex] = {
                        ...this.categories[categoryIndex],
                        name,
                        description,
                        color,
                        updatedAt: new Date().toISOString()
                    };
                    
                    await this.saveCategoryToStorage(this.categories[categoryIndex]);
                    this.showAlert('Danh mục đã được cập nhật thành công', 'success');
                }
            } else {
                // Create new category
                const newCategory = {
                    id: this.generateId(),
                    name,
                    description,
                    color,
                    isDefault: false,
                    createdAt: new Date().toISOString(),
                    templateCount: 0
                };
                
                this.categories.push(newCategory);
                await this.saveCategoryToStorage(newCategory);
                this.showAlert('Danh mục mới đã được tạo thành công', 'success');
            }

            // Close modal and refresh view
            const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
            modal.hide();
            
            await this.refreshTemplateCounts();
            this.renderCategories();
            
        } catch (error) {
            console.error('Error saving category:', error);
            this.showAlert('Có lỗi xảy ra khi lưu danh mục', 'danger');
        }
    }

    confirmDeleteCategory(categoryId) {
        if (!this.isExtensionContext) {
            alert('Chức năng xóa chỉ hoạt động trong Chrome Extension.\n\nĐể test:\n1. Load extension vào Chrome\n2. Click icon extension');
            return;
        }
        
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category || category.isDefault || category.id === 'general') {
            this.showAlert('Không thể xóa danh mục mặc định', 'warning');
            return;
        }

        this.currentEditId = categoryId;
        document.getElementById('deleteCategoryName').textContent = category.name;
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async deleteCategory() {
        if (!this.currentEditId) return;

        try {
            const categoryIndex = this.categories.findIndex(cat => cat.id === this.currentEditId);
            if (categoryIndex !== -1) {
                await this.deleteCategoryFromStorage(this.currentEditId);
                this.categories.splice(categoryIndex, 1);
                
                // Close modal and refresh view
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
                modal.hide();
                
                await this.refreshTemplateCounts();
                this.renderCategories();
                this.showAlert('Danh mục đã được xóa thành công', 'success');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showAlert('Có lỗi xảy ra khi xóa danh mục', 'danger');
        }
        
        this.currentEditId = null;
    }

    resetForm() {
        document.getElementById('categoryForm').reset();
        this.currentEditId = null;
    }

    generateId() {
        return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert_' + Date.now();
        
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" id="${alertId}" role="alert">
                <i class="bi bi-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bootstrapAlert = bootstrap.Alert.getInstance(alert);
                if (bootstrapAlert) {
                    bootstrapAlert.close();
                }
            }
        }, 5000);
    }

    getAlertIcon(type) {
        const iconMap = {
            success: 'check-circle-fill',
            danger: 'exclamation-triangle-fill',
            warning: 'exclamation-triangle-fill',
            info: 'info-circle-fill'
        };
        return iconMap[type] || 'info-circle-fill';
    }

    showTestModeMessage() {
        // Show test mode banner
        const testBanner = document.getElementById('testModeBanner');
        if (testBanner) {
            testBanner.style.display = 'block';
        }
        
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Demo Mode:</strong> Giao diện đang hoạt động ở chế độ demo với dữ liệu mẫu.
                    <br><small>Để sử dụng đầy đủ chức năng, load extension vào Chrome.</small>
                </div>
            `;
        }
    }

    renderDemoCategories() {
        const demoCategories = [
            {
                id: 'general',
                name: 'Chung',
                description: 'Danh mục mặc định cho tất cả template',
                color: 'gray',
                isDefault: true,
                templateCount: 3,
                createdAt: new Date().toISOString()
            },
            {
                id: 'business',
                name: 'Kinh doanh',
                description: 'Các template liên quan đến công việc và kinh doanh',
                color: 'blue',
                isDefault: false,
                templateCount: 5,
                createdAt: new Date().toISOString()
            },
            {
                id: 'coding',
                name: 'Lập trình',
                description: 'Template cho việc code review, debug và phát triển phần mềm',
                color: 'green',
                isDefault: false,
                templateCount: 8,
                createdAt: new Date().toISOString()
            },
            {
                id: 'creative',
                name: 'Sáng tạo',
                description: 'Template cho viết lách sáng tạo, brainstorming và ý tưởng',
                color: 'orange',
                isDefault: false,
                templateCount: 2,
                createdAt: new Date().toISOString()
            }
        ];

        this.categories = demoCategories;
        this.renderCategories();
        this.setupDemoEventListeners();
    }

    setupDemoEventListeners() {
        // Demo mode event listeners with alerts
        document.getElementById('createCategoryBtn')?.addEventListener('click', () => {
            alert('Chức năng này chỉ hoạt động trong Chrome Extension.\n\nĐể test đầy đủ:\n1. Mở chrome://extensions/\n2. Bật Developer mode\n3. Load unpacked extension\n4. Click icon extension');
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterCategories(e.target.value);
        });

        // Disable modals in demo mode
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('show.bs.modal', (e) => {
                e.preventDefault();
                alert('Modal chỉ hoạt động trong Chrome Extension context.');
            });
        });
    }

    // Method to refresh template counts (called from external sources)
    async refreshTemplateCounts() {
        if (!this.isExtensionContext) return;
        
        try {
            const response = await chrome.runtime.sendMessage({ 
                action: 'getTemplateCountsByCategory' 
            });
            
            if (response && response.success) {
                const counts = response.counts || {};
                
                this.categories.forEach(category => {
                    category.templateCount = counts[category.id] || 0;
                });
                
                this.renderCategories();
            }
        } catch (error) {
            console.error('Error refreshing template counts:', error);
        }
    }

    async openManager() {
        try {
            await chrome.runtime.sendMessage({ action: 'openManager' });
        } catch (error) {
            console.error('Error opening manager page:', error);
            // Fallback to direct navigation if chrome extension API is not available
            window.location.href = 'manager.html';
        }
    }
}

// Initialize the categories manager when the page loads
let categoriesManager;

document.addEventListener('DOMContentLoaded', () => {
    categoriesManager = new CategoriesManager();
});

// Make categoriesManager globally accessible for onclick handlers
window.categoriesManager = categoriesManager;
