// Wait for DOM content to load before initializing
document.addEventListener('DOMContentLoaded', function () {
    // Cache DOM element references
    const enableFocus = document.getElementById('enableFocus');
    const focusList = document.getElementById('focusList');
    const addFocusBtn = document.getElementById('addFocus');
    const saveBtn = document.getElementById('save');

    // Constants for maximum allowed items
    const MAX_FOCUSES = 10;  // Maximum number of focus topics
    const MAX_LINKS = 8;     // Maximum number of links per focus topic

    /**
     * Updates the state of the "Add Focus" button based on current focus count
     * Disables button and updates tooltip if maximum limit is reached
     */
    function updateAddFocusButton() {
        const focusCount = focusList.querySelectorAll('.focus-item').length;
        addFocusBtn.disabled = focusCount >= MAX_FOCUSES;
        addFocusBtn.title = focusCount >= MAX_FOCUSES ?
            `Maximum ${MAX_FOCUSES} focus topics allowed` :
            'Add a new focus topic';
    }

    /**
     * Creates the link pairs interface for a focus item
     * @param {HTMLElement} container - Container element for the links
     * @param {Array} links - Array of existing links to populate
     */
    function createLinkPairs(container, links = []) {
        container.innerHTML = '';
        // Create link pairs for existing links
        links.forEach(link => addLinkPair(container, link));

        // Create "Add Link" button
        const addLinkBtn = document.createElement('button');
        addLinkBtn.textContent = 'Add Link';
        addLinkBtn.type = 'button';
        addLinkBtn.style.marginTop = '8px';
        addLinkBtn.className = 'add-link-btn';

        // Update button state based on current link count
        const linkCount = container.querySelectorAll('.link-pair').length;
        addLinkBtn.disabled = linkCount >= MAX_LINKS;
        addLinkBtn.title = linkCount >= MAX_LINKS ?
            `Maximum ${MAX_LINKS} links allowed` :
            'Add a new link';

        // Add click handler for adding new links
        addLinkBtn.onclick = () => {
            if (container.querySelectorAll('.link-pair').length < MAX_LINKS) {
                addLinkPair(container);
                // Update button state after adding link
                const newLinkCount = container.querySelectorAll('.link-pair').length;
                addLinkBtn.disabled = newLinkCount >= MAX_LINKS;
                addLinkBtn.title = newLinkCount >= MAX_LINKS ?
                    `Maximum ${MAX_LINKS} links allowed` :
                    'Add a new link';
            }
        };
        container.appendChild(addLinkBtn);
    }

    /**
     * Creates a new link pair input group
     * @param {HTMLElement} container - Container to add the link pair to
     * @param {Object} existing - Existing link data {key: string, value: string, context: string}
     */
    function addLinkPair(container, existing = { key: '', value: '', context: '' }) {
        if (container.querySelectorAll('.link-pair').length >= MAX_LINKS) return;

        // Create container for link pair
        const pair = document.createElement('div');
        pair.className = 'link-pair';
        pair.draggable = true;
        pair.style.cssText = 'position: relative; padding: 8px; margin-bottom: 8px; background: #252525; border-radius: 6px; border: 1px solid #333;';

        // Add drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Drag to reorder';
        dragHandle.style.cssText = 'position: absolute; left: 4px; top: 50%; transform: translateY(-50%); cursor: grab; color: #666; font-size: 14px; user-select: none;';

        // Create input for link text
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Link Text';
        keyInput.value = existing.key;
        keyInput.className = 'link-key';

        // Create input for URL
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'URL';
        valueInput.value = existing.value;
        valueInput.className = 'link-value';

        // Create move buttons
        const moveContainer = document.createElement('div');
        moveContainer.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

        const moveUpBtn = document.createElement('button');
        moveUpBtn.textContent = '▲';
        moveUpBtn.type = 'button';
        moveUpBtn.title = 'Move up';
        moveUpBtn.style.cssText = 'padding: 2px 6px; font-size: 10px; background: #333; border: 1px solid #444; color: #888; cursor: pointer; border-radius: 3px;';
        moveUpBtn.onclick = () => {
            const prev = pair.previousElementSibling;
            if (prev && prev.classList.contains('link-pair')) {
                container.insertBefore(pair, prev);
            }
        };

        const moveDownBtn = document.createElement('button');
        moveDownBtn.textContent = '▼';
        moveDownBtn.type = 'button';
        moveDownBtn.title = 'Move down';
        moveDownBtn.style.cssText = 'padding: 2px 6px; font-size: 10px; background: #333; border: 1px solid #444; color: #888; cursor: pointer; border-radius: 3px;';
        moveDownBtn.onclick = () => {
            const next = pair.nextElementSibling;
            if (next && next.classList.contains('link-pair')) {
                container.insertBefore(next, pair);
            }
        };

        moveContainer.appendChild(moveUpBtn);
        moveContainer.appendChild(moveDownBtn);

        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.className = 'remove-link-btn';
        removeBtn.onclick = () => {
            pair.remove();
            // Update add link button state after removing a link
            const addLinkBtn = container.querySelector('.add-link-btn');
            const linkCount = container.querySelectorAll('.link-pair').length;
            addLinkBtn.disabled = linkCount >= MAX_LINKS;
            addLinkBtn.title = linkCount >= MAX_LINKS ?
                `Maximum ${MAX_LINKS} links allowed` :
                'Add a new link';
        };

        // Assemble the link pair - main row
        const pairContainer = document.createElement('div');
        pairContainer.style.cssText = 'display: flex; gap: 8px; width: 100%; padding-left: 20px;';
        pairContainer.appendChild(keyInput);
        pairContainer.appendChild(valueInput);
        pairContainer.appendChild(moveContainer);
        pairContainer.appendChild(removeBtn);

        // Context label row - NEW
        const contextRow = document.createElement('div');
        contextRow.style.cssText = 'margin-top: 6px; padding-left: 20px;';

        const contextInput = document.createElement('input');
        contextInput.type = 'text';
        contextInput.className = 'link-context';
        contextInput.placeholder = 'Context for AI (e.g., "Main documentation", "Example code", "Problem description")';
        contextInput.value = existing.context || '';
        contextInput.style.cssText = 'width: 100%; padding: 6px 8px; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; color: #aaa; font-size: 11px;';

        contextRow.appendChild(contextInput);

        pair.appendChild(dragHandle);

        // Warning controls for this link
        const warningContainer = document.createElement('div');
        warningContainer.className = 'link-warning-controls';
        warningContainer.style.cssText = 'margin-top: 4px; padding: 8px; background: #252525; border-radius: 4px; display: none;';

        // Toggle for link warning
        const warningToggle = document.createElement('div');
        warningToggle.style.cssText = 'font-size: 11px; color: #888; cursor: pointer; display: flex; align-items: center; gap: 4px; margin-top: 2px;';
        warningToggle.className = 'warning-toggle';
        warningToggle.innerHTML = '<span class="warning-icon">⚠️</span> Configure Warning';
        warningToggle.onclick = () => {
            const isHidden = warningContainer.style.display === 'none';
            warningContainer.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) {
                warningContainer.style.flexDirection = 'column';
                warningContainer.style.gap = '8px';
            }
            warningToggle.style.color = isHidden ? '#ffd700' : '#888';
        };

        // Enable checkbox
        const dataContainer = document.createElement('div');
        dataContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

        const enabledLabel = document.createElement('label');
        enabledLabel.style.cssText = 'display: flex; align-items: center; gap: 4px; color: #fff; font-size: 12px;';
        const enabledInput = document.createElement('input');
        enabledInput.type = 'checkbox';
        enabledInput.className = 'link-warning-enabled';
        enabledInput.checked = existing.warning?.enabled || false;
        enabledLabel.appendChild(enabledInput);
        enabledLabel.appendChild(document.createTextNode('Enable'));

        dataContainer.appendChild(enabledLabel);
        warningContainer.appendChild(dataContainer);

        // Initialize state based on existing data
        if (existing.warning?.enabled) {
            warningToggle.style.color = '#ffd700';
        }

        // Emblem selector for link
        const emblemSelect = document.createElement('select');
        emblemSelect.className = 'link-warning-emblem';
        emblemSelect.style.cssText = 'background: #333; color: white; border: 1px solid #444; padding: 4px; border-radius: 4px; font-size: 16px;';
        const EMBLEMS = [
            { id: 'production', emoji: '⚠️' },
            { id: 'star', emoji: '⭐' },
            { id: 'heart', emoji: '❤️' },
            { id: 'fire', emoji: '🔥' },
            { id: 'warning', emoji: '⚡' },
            { id: 'skull', emoji: '💀' },
            { id: 'stop', emoji: '🛑' },
            { id: 'eyes', emoji: '👀' }
        ];
        EMBLEMS.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.id;
            opt.textContent = e.emoji;
            opt.selected = existing.warning?.emblem === e.id;
            emblemSelect.appendChild(opt);
        });

        // Selector input for link
        const selectorInput = document.createElement('input');
        selectorInput.type = 'text';
        selectorInput.className = 'link-warning-selector';
        selectorInput.placeholder = 'Element selector (.btn, #id)';
        selectorInput.value = existing.warning?.elementRegex || '';
        selectorInput.style.cssText = 'flex: 1; background: #333; color: white; border: 1px solid #444; padding: 4px 8px; border-radius: 4px; font-size: 12px;';

        dataContainer.appendChild(emblemSelect);
        dataContainer.appendChild(selectorInput);

        warningContainer.appendChild(emblemSelect);
        warningContainer.appendChild(selectorInput);

        pair.appendChild(pairContainer);
        pair.appendChild(contextRow);
        pair.appendChild(warningToggle);
        pair.appendChild(warningContainer);

        container.insertBefore(pair, container.lastChild);
    }

    // Emblem options for warnings
    const EMBLEMS = [
        { id: 'production', emoji: '⚠️', label: 'Production' },
        { id: 'star', emoji: '⭐', label: 'Star' },
        { id: 'heart', emoji: '❤️', label: 'Heart' },
        { id: 'fire', emoji: '🔥', label: 'Fire' },
        { id: 'warning', emoji: '⚡', label: 'Lightning' },
        { id: 'skull', emoji: '💀', label: 'Skull' },
        { id: 'stop', emoji: '🛑', label: 'Stop' },
        { id: 'eyes', emoji: '👀', label: 'Eyes' }
    ];

    /**
     * Creates a new focus item with name, links, warning, context notes, and controls
     * @param {Object} focus - Focus item data
     * @returns {HTMLElement} The created focus item element
     */
    function createFocusItem(focus = {
        name: '',
        links: [],
        active: false,
        warning: { enabled: false, emblem: 'production', elementRegex: '.*', urlRegex: '.*' },
        contextNotes: []
    }) {
        // Create main container
        const focusItem = document.createElement('div');
        focusItem.className = `focus-item${focus.active ? ' active' : ''}`;

        // Create name input
        const focusName = document.createElement('input');
        focusName.type = 'text';
        focusName.value = focus.name;
        focusName.placeholder = 'Enter focus name';
        focusName.className = 'focus-name';

        // Create description input
        const focusDesc = document.createElement('textarea');
        focusDesc.value = focus.description || '';
        focusDesc.placeholder = 'Enter focus description (optional)';
        focusDesc.className = 'focus-description';
        focusDesc.style.cssText = 'width: 100%; margin-bottom: 12px; padding: 8px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff; min-height: 60px; resize: vertical; display: block;';

        // Create links container
        const linksContainer = document.createElement('div');
        linksContainer.className = 'links-container';
        createLinkPairs(linksContainer, focus.links);

        // Create Warning Section (collapsible)
        const warningSection = document.createElement('div');
        warningSection.className = 'warning-section';
        warningSection.innerHTML = `
            <div class="section-header" style="cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
                <span class="collapse-icon">▶</span>
                <span>⚠️ Cursor Warning (shared)</span>
            </div>
            <div class="section-content" style="display: none; padding: 12px; background: #252525; border-radius: 0 0 4px 4px; margin-top: -4px;">
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <input type="checkbox" class="warning-enabled" ${focus.warning?.enabled ? 'checked' : ''}>
                    Enable cursor warning for this focus
                </label>
                <div class="warning-config" style="${focus.warning?.enabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #888;">Emblem:</label>
                        <div class="emblem-picker" style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${EMBLEMS.map(e => `
                                <span class="emblem-opt${focus.warning?.emblem === e.id ? ' selected' : ''}" 
                                      data-emblem="${e.id}" 
                                      title="${e.label}"
                                      style="cursor: pointer; padding: 4px 8px; border: 1px solid ${focus.warning?.emblem === e.id ? '#ffd700' : '#444'}; border-radius: 4px;">
                                    ${e.emoji}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #888;">URL Pattern (glob: * matches any, ? matches one char):</label>
                        <input type="text" class="warning-url-regex" value="${focus.warning?.urlRegex || '*'}" placeholder="*salesforce*" style="width: 100%; padding: 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #888;">Element Regex (which tags):</label>
                        <input type="text" class="warning-element-regex" value="${focus.warning?.elementRegex || '.*'}" placeholder="button|a|input" style="width: 100%; padding: 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff;">
                    </div>
                    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #333;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #ff6b6b;">
                            <input type="checkbox" class="warning-exclude-context" ${focus.warning?.excludeFromContext ? 'checked' : ''}>
                            🚫 Exclude matching URLs from AI context
                        </label>
                        <small style="color: #888; display: block; margin-top: 4px; margin-left: 24px;">
                            When checked, pages matching the URL pattern above won't be sent to AI chat.
                        </small>
                    </div>
                </div>
            </div>
        `;

        // Toggle warning section
        const warningHeader = warningSection.querySelector('.section-header');
        const warningContent = warningSection.querySelector('.section-content');
        const warningIcon = warningSection.querySelector('.collapse-icon');
        warningHeader.onclick = () => {
            const isHidden = warningContent.style.display === 'none';
            warningContent.style.display = isHidden ? 'block' : 'none';
            warningIcon.textContent = isHidden ? '▼' : '▶';
        };

        // Enable/disable warning config
        const warningEnabled = warningSection.querySelector('.warning-enabled');
        const warningConfig = warningSection.querySelector('.warning-config');
        warningEnabled.onchange = () => {
            warningConfig.style.opacity = warningEnabled.checked ? '1' : '0.5';
            warningConfig.style.pointerEvents = warningEnabled.checked ? 'auto' : 'none';
        };

        // Emblem picker clicks
        warningSection.querySelectorAll('.emblem-opt').forEach(opt => {
            opt.onclick = () => {
                warningSection.querySelectorAll('.emblem-opt').forEach(o => {
                    o.classList.remove('selected');
                    o.style.borderColor = '#444';
                });
                opt.classList.add('selected');
                opt.style.borderColor = '#ffd700';
            };
        });

        // Create Context Notes Section (collapsible)
        const notesSection = document.createElement('div');
        notesSection.className = 'notes-section';
        notesSection.innerHTML = `
            <div class="section-header" style="cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
                <span class="collapse-icon">▶</span>
                <span>📝 Context Notes (shared)</span>
            </div>
            <div class="section-content" style="display: none; padding: 12px; background: #252525; border-radius: 0 0 4px 4px; margin-top: -4px;">
                <div class="notes-list"></div>
                <button class="add-note-btn" style="margin-top: 8px; padding: 6px 12px; background: #2a2a2a; border: 1px solid #444; color: #ffd700; border-radius: 4px; cursor: pointer;">+ Add Note</button>
            </div>
        `;

        // Toggle notes section
        const notesHeader = notesSection.querySelector('.section-header');
        const notesContent = notesSection.querySelector('.section-content');
        const notesIcon = notesSection.querySelector('.collapse-icon');
        notesHeader.onclick = () => {
            const isHidden = notesContent.style.display === 'none';
            notesContent.style.display = isHidden ? 'block' : 'none';
            notesIcon.textContent = isHidden ? '▼' : '▶';
        };

        // Notes list
        const notesList = notesSection.querySelector('.notes-list');
        const addNoteBtn = notesSection.querySelector('.add-note-btn');

        // Add existing notes
        (focus.contextNotes || []).forEach(note => addNoteItem(notesList, note));

        addNoteBtn.onclick = () => addNoteItem(notesList);

        // Create controls container
        const controls = document.createElement('div');
        controls.className = 'focus-controls';

        // Create Set Active button
        const setActiveBtn = document.createElement('button');
        setActiveBtn.textContent = focus.active ? 'Active' : 'Set Active';
        setActiveBtn.style.backgroundColor = focus.active ? '#cc0000' : '#2a2a2a';
        setActiveBtn.className = 'set-active-btn';
        setActiveBtn.onclick = () => {
            // Deactivate all other focus items
            document.querySelectorAll('.focus-item').forEach(item => {
                item.classList.remove('active');
                const activeBtn = item.querySelector('.set-active-btn');
                if (activeBtn) {
                    activeBtn.textContent = 'Set Active';
                    activeBtn.style.backgroundColor = '#2a2a2a';
                }
            });
            // Activate this focus item
            focusItem.classList.add('active');
            setActiveBtn.textContent = 'Active';
            setActiveBtn.style.backgroundColor = '#cc0000';
        };

        // Create Share button
        const shareBtn = document.createElement('button');
        shareBtn.textContent = 'Share';
        shareBtn.type = 'button';
        shareBtn.className = 'share-btn';
        shareBtn.style.backgroundColor = '#1a1a1a';
        shareBtn.onclick = async () => {
            // Check data sharing consent first
            const { dataSharingConsent } = await chrome.storage.sync.get(['dataSharingConsent']);
            if (dataSharingConsent !== true) {
                alert('Data sharing is disabled. Enable "AI Chat & Focus Sharing" in the Privacy & Data section below to share focuses.');
                return;
            }

            // Build full focus object for sharing
            const focusData = collectFocusData(focusItem);

            if (!focusData.name) {
                alert('Please enter a focus name before sharing');
                return;
            }

            if (focusData.links.length === 0) {
                alert('Please add at least one link before sharing');
                return;
            }

            shareBtn.textContent = 'Sharing...';
            shareBtn.disabled = true;

            try {
                // Call the share API with full focus data
                const response = await fetch('https://pwfocus.net/api/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(focusData)
                });

                if (response.ok) {
                    const { id } = await response.json();
                    const shareUrl = `https://pwfocus.net/focus/${id}`;

                    // Copy to clipboard
                    await navigator.clipboard.writeText(shareUrl);

                    shareBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        shareBtn.textContent = 'Share';
                        shareBtn.disabled = false;
                    }, 2000);
                } else {
                    throw new Error('Failed to share');
                }
            } catch (error) {
                console.error('Share error:', error);
                shareBtn.textContent = 'Share';
                shareBtn.disabled = false;
                alert('Failed to share focus. Please try again.');
            }
        };

        // Create Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
            focusItem.remove();
            updateAddFocusButton();
        };

        // Assemble all components
        controls.appendChild(setActiveBtn);
        controls.appendChild(shareBtn);
        controls.appendChild(deleteBtn);
        focusItem.appendChild(focusName);
        focusItem.appendChild(focusDesc);
        focusItem.appendChild(linksContainer);
        focusItem.appendChild(warningSection);
        focusItem.appendChild(notesSection);
        focusItem.appendChild(controls);

        updateAddFocusButton();
        return focusItem;
    }

    /**
     * Adds a context note item to the notes list
     */
    function addNoteItem(notesList, note = { urlPattern: '', note: '' }) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;';
        noteItem.innerHTML = `
            <input type="text" class="note-url" value="${note.urlPattern || ''}" placeholder="URL pattern (*dashboard*)" style="flex: 1; padding: 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <textarea class="note-text" placeholder="Note text..." style="flex: 2; padding: 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff; min-height: 40px; resize: vertical;">${note.note || ''}</textarea>
            <button class="remove-note" style="padding: 6px 10px; background: #cc0000; border: none; color: #fff; border-radius: 4px; cursor: pointer;">X</button>
        `;
        noteItem.querySelector('.remove-note').onclick = () => noteItem.remove();
        notesList.appendChild(noteItem);
    }

    /**
     * Collects all data from a focus item element
     */
    function collectFocusData(focusItem) {
        // Collect links - order is preserved from DOM (top to bottom)
        const links = [];
        focusItem.querySelectorAll('.link-pair').forEach(pair => {
            // Use class selectors for reliability
            const key = pair.querySelector('.link-key')?.value || pair.querySelector('input[placeholder="Link Text"]')?.value;
            const value = pair.querySelector('.link-value')?.value || pair.querySelector('input[placeholder="URL"]')?.value;
            const context = pair.querySelector('.link-context')?.value || '';

            if (key && value) {
                let linkData = { key, value, context };

                if (pair.querySelector('.link-warning-enabled')) {
                    const isEnabled = pair.querySelector('.link-warning-enabled').checked;
                    if (isEnabled) {
                        const emblem = pair.querySelector('.link-warning-emblem').value;
                        const selector = pair.querySelector('.link-warning-selector').value;
                        linkData.warning = {
                            enabled: true,
                            emblem: emblem,
                            elementRegex: selector
                        };
                    }
                } else {
                    // Fallback for transition or errors
                    const warningControls = pair.querySelector('.link-warning-controls');
                    const isWarningActive = warningControls && warningControls.style.display !== 'none';
                    if (isWarningActive) {
                        const emblem = pair.querySelector('.link-warning-emblem').value;
                        const selector = pair.querySelector('.link-warning-selector').value;
                        if (selector) {
                            linkData.warning = { enabled: true, emblem, elementRegex: selector };
                        }
                    }
                }

                links.push(linkData);
            }
        });

        // Collect warning settings
        const warningEnabled = focusItem.querySelector('.warning-enabled')?.checked || false;
        const selectedEmblem = focusItem.querySelector('.emblem-opt.selected');
        const excludeFromContext = focusItem.querySelector('.warning-exclude-context')?.checked || false;
        const warning = {
            enabled: warningEnabled,
            emblem: selectedEmblem?.dataset.emblem || 'production',
            urlRegex: focusItem.querySelector('.warning-url-regex')?.value || '*',
            elementRegex: focusItem.querySelector('.warning-element-regex')?.value || '.*',
            excludeFromContext: excludeFromContext
        };

        // Collect context notes
        const contextNotes = [];
        focusItem.querySelectorAll('.note-item').forEach(noteItem => {
            const urlPattern = noteItem.querySelector('.note-url')?.value;
            const noteText = noteItem.querySelector('.note-text')?.value;
            if (urlPattern || noteText) {
                contextNotes.push({ urlPattern, note: noteText });
            }
        });

        return {
            name: focusItem.querySelector('.focus-name').value,
            description: focusItem.querySelector('.focus-description').value,
            links,
            active: focusItem.classList.contains('active'),
            warning,
            contextNotes
        };
    }

    // Load existing focus mode settings from storage
    chrome.storage.sync.get(['focusMode'], function (result) {
        if (result.focusMode) {
            enableFocus.checked = result.focusMode.enabled;

            // Convert legacy format to new format if necessary
            const focuses = result.focusMode.focuses || [{
                name: result.focusMode.mainFocus || '',
                links: result.focusMode.links || [],
                active: true
            }];

            // Create focus items for each saved focus
            focuses.forEach(focus => {
                focusList.appendChild(createFocusItem(focus));
            });
        }
        updateAddFocusButton();
    });

    // Load data sharing consent preference
    const dataSharingCheckbox = document.getElementById('dataSharingEnabled');
    if (dataSharingCheckbox) {
        chrome.storage.sync.get(['dataSharingConsent'], function (result) {
            dataSharingCheckbox.checked = result.dataSharingConsent === true;
        });

        // Save data sharing preference when changed
        dataSharingCheckbox.addEventListener('change', function () {
            chrome.storage.sync.set({ dataSharingConsent: dataSharingCheckbox.checked });
        });
    }

    // Add handler for adding new focus items
    addFocusBtn.addEventListener('click', () => {
        if (focusList.querySelectorAll('.focus-item').length < MAX_FOCUSES) {
            focusList.appendChild(createFocusItem());
            updateAddFocusButton();
        }
    });

    // Add handler for saving all focus mode settings
    saveBtn.addEventListener('click', function () {
        // Collect all focus items data using the unified collector
        const focuses = [];
        document.querySelectorAll('.focus-item').forEach(item => {
            focuses.push(collectFocusData(item));
        });

        // Create focus mode object with all settings
        const activeFocus = focuses.find(f => f.active);
        const focusMode = {
            enabled: enableFocus.checked,
            focuses: focuses,
            mainFocus: activeFocus?.name || '',
            links: activeFocus?.links || [],
            warning: activeFocus?.warning || null,
            contextNotes: activeFocus?.contextNotes || []
        };

        // Save to Chrome storage
        chrome.storage.sync.set({ focusMode }, function () {
            alert('Focus mode settings saved!');
        });
    });
}); 