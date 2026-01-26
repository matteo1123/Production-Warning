// Warning Rules Management

const EMBLEMS = {
    production: { emoji: '⚠️', label: 'Production Warning', cursor: 'not-allowed' },
    star: { emoji: '⭐', label: 'Star', cursor: 'pointer' },
    heart: { emoji: '❤️', label: 'Heart', cursor: 'pointer' },
    fire: { emoji: '🔥', label: 'Fire', cursor: 'crosshair' },
    warning: { emoji: '⚡', label: 'Lightning', cursor: 'help' },
    skull: { emoji: '💀', label: 'Skull', cursor: 'not-allowed' },
    stop: { emoji: '🛑', label: 'Stop', cursor: 'not-allowed' },
    eyes: { emoji: '👀', label: 'Eyes', cursor: 'pointer' }
};

let rules = [];
let editingId = null;

// DOM Elements
const rulesList = document.getElementById('rulesList');
const urlPattern = document.getElementById('urlPattern');
const elementSelector = document.getElementById('elementSelector');
const customSelector = document.getElementById('customSelector');
const emblemPicker = document.getElementById('emblemPicker');
const ruleLabel = document.getElementById('ruleLabel');
const saveRuleBtn = document.getElementById('saveRuleBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');

// Load rules on startup
chrome.storage.sync.get(['warningRules'], (result) => {
    rules = result.warningRules || [];
    renderRules();
});

// Element selector change handler
elementSelector.addEventListener('change', () => {
    customSelector.style.display = elementSelector.value === 'custom' ? 'block' : 'none';
});

// Emblem picker
emblemPicker.addEventListener('click', (e) => {
    const option = e.target.closest('.emblem-option');
    if (option) {
        document.querySelectorAll('.emblem-option').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
    }
});

// Save rule
saveRuleBtn.addEventListener('click', () => {
    const pattern = urlPattern.value.trim();
    if (!pattern) {
        alert('Please enter a URL pattern');
        return;
    }

    const selector = elementSelector.value === 'custom'
        ? customSelector.value.trim() || '*'
        : elementSelector.value;

    const selectedEmblem = document.querySelector('.emblem-option.selected');
    const emblem = selectedEmblem ? selectedEmblem.dataset.emblem : 'production';
    const label = ruleLabel.value.trim();

    if (editingId) {
        // Update existing rule
        const index = rules.findIndex(r => r.id === editingId);
        if (index >= 0) {
            rules[index] = {
                ...rules[index],
                urlPattern: pattern,
                elementSelector: selector,
                emblem: emblem,
                label: label
            };
        }
        editingId = null;
    } else {
        // Add new rule
        rules.push({
            id: crypto.randomUUID(),
            urlPattern: pattern,
            elementSelector: selector,
            emblem: emblem,
            label: label
        });
    }

    saveRules();
    resetForm();
    renderRules();
});

// Cancel editing
cancelBtn.addEventListener('click', () => {
    editingId = null;
    resetForm();
});

function resetForm() {
    urlPattern.value = '';
    elementSelector.value = '*';
    customSelector.value = '';
    customSelector.style.display = 'none';
    ruleLabel.value = '';
    document.querySelectorAll('.emblem-option').forEach(el => el.classList.remove('selected'));
    document.querySelector('.emblem-option[data-emblem="production"]').classList.add('selected');
    formTitle.textContent = 'Add New Rule';
    saveRuleBtn.textContent = 'Add Rule';
    cancelBtn.style.display = 'none';
}

function editRule(id) {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    editingId = id;
    urlPattern.value = rule.urlPattern;

    // Set element selector
    const selectorValue = ['*', 'a', 'button', 'li', 'input,button,a'].includes(rule.elementSelector)
        ? rule.elementSelector
        : 'custom';
    elementSelector.value = selectorValue;
    if (selectorValue === 'custom') {
        customSelector.value = rule.elementSelector;
        customSelector.style.display = 'block';
    }

    // Set emblem
    document.querySelectorAll('.emblem-option').forEach(el => el.classList.remove('selected'));
    const emblemEl = document.querySelector(`.emblem-option[data-emblem="${rule.emblem}"]`);
    if (emblemEl) emblemEl.classList.add('selected');

    ruleLabel.value = rule.label || '';

    formTitle.textContent = 'Edit Rule';
    saveRuleBtn.textContent = 'Update Rule';
    cancelBtn.style.display = 'block';

    // Highlight the rule being edited
    document.querySelectorAll('.rule-item').forEach(el => el.classList.remove('editing'));
    document.querySelector(`[data-rule-id="${id}"]`)?.classList.add('editing');
}

function deleteRule(id) {
    if (confirm('Delete this warning rule?')) {
        rules = rules.filter(r => r.id !== id);
        saveRules();
        renderRules();
        if (editingId === id) {
            editingId = null;
            resetForm();
        }
    }
}

function saveRules() {
    chrome.storage.sync.set({ warningRules: rules });
}

function renderRules() {
    if (rules.length === 0) {
        rulesList.innerHTML = '<div class="empty-state">No warning rules configured</div>';
        return;
    }

    rulesList.innerHTML = rules.map(rule => {
        const emblemInfo = EMBLEMS[rule.emblem] || EMBLEMS.production;
        return `
            <div class="rule-item" data-rule-id="${rule.id}">
                <div class="rule-header">
                    <span class="rule-pattern">${escapeHtml(rule.urlPattern)}</span>
                    <div class="rule-controls">
                        <button class="edit-btn" data-id="${rule.id}">Edit</button>
                        <button class="delete-btn" data-id="${rule.id}" style="background:#cc0000;">Delete</button>
                    </div>
                </div>
                <div class="rule-details">
                    <span>${emblemInfo.emoji} ${rule.label || emblemInfo.label}</span>
                    <span>Selector: ${escapeHtml(rule.elementSelector)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Event delegation for dynamically added buttons
rulesList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (editBtn) {
        editRule(editBtn.dataset.id);
    } else if (deleteBtn) {
        deleteRule(deleteBtn.dataset.id);
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
