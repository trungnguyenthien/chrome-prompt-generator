// Popup script for Chrome Extension
class PopupController {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadRecentTemplates();
        this.bindEvents();
    }

    bindEvents() {
        // Open manager page
        document.getElementById('openManager').addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
            window.close();
        });

        // Create prompt from current page
        document.getElementById('createFromPage').addEventListener('click', async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                // Inject content script to get page data
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: this.getPageData
                });

                const pageData = results[0].result;
                
                // Open manager with page data
                const url = new URL(chrome.runtime.getURL('manager.html'));
                url.searchParams.set('createFrom', 'page');
                url.searchParams.set('title', pageData.title);
                url.searchParams.set('url', pageData.url);
                url.searchParams.set('content', pageData.content);
                
                chrome.tabs.create({ url: url.toString() });
                window.close();
            } catch (error) {
                console.error('Error creating prompt from page:', error);
            }
        });

        // Open prompt modal on current page
        document.getElementById('openPromptModal').addEventListener('click', async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                // Send message to content script to show modal
                await chrome.tabs.sendMessage(tab.id, { action: 'showPromptModal' });
                window.close();
            } catch (error) {
                console.error('Error opening prompt modal:', error);
            }
        });
    }

    // Function to be injected into page
    getPageData() {
        return {
            title: document.title,
            url: window.location.href,
            content: document.body.innerText.substring(0, 500) // First 500 chars
        };
    }

    async loadRecentTemplates() {
        try {
            const result = await chrome.storage.local.get(['promptTemplates']);
            const templates = result.promptTemplates || [];
            
            // Sort by lastUsed and take first 3
            const recentTemplates = templates
                .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
                .slice(0, 3);

            this.renderRecentTemplates(recentTemplates);
        } catch (error) {
            console.error('Error loading recent templates:', error);
        }
    }

    renderRecentTemplates(templates) {
        const container = document.getElementById('recentList');
        
        if (templates.length === 0) {
            container.innerHTML = '<div class="empty-state">Chưa có template nào. Hãy tạo template đầu tiên!</div>';
            return;
        }

        container.innerHTML = templates.map(template => `
            <div class="template-item" data-id="${template.id}">
                <h3>${this.escapeHtml(template.title)}</h3>
                <p>${this.escapeHtml(template.description || 'Không có mô tả')}</p>
            </div>
        `).join('');

        // Add click events to template items
        container.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', async () => {
                const templateId = item.dataset.id;
                await this.useTemplate(templateId);
            });
        });
    }

    async useTemplate(templateId) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send template to content script
            await chrome.tabs.sendMessage(tab.id, { 
                action: 'useTemplate', 
                templateId: templateId 
            });
            
            window.close();
        } catch (error) {
            console.error('Error using template:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
