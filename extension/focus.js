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
     * @param {Object} existing - Existing link data {key: string, value: string}
     */
    function addLinkPair(container, existing = { key: '', value: '' }) {
        if (container.querySelectorAll('.link-pair').length >= MAX_LINKS) return;

        // Create container for link pair
        const pair = document.createElement('div');
        pair.className = 'link-pair';

        // Create input for link text
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Link Text';
        keyInput.value = existing.key;

        // Create input for URL
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'URL';
        valueInput.value = existing.value;

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

        // Assemble the link pair
        pair.appendChild(keyInput);
        pair.appendChild(valueInput);
        pair.appendChild(removeBtn);
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
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #888;">URL Regex (when to show):</label>
                        <input type="text" class="warning-url-regex" value="${focus.warning?.urlRegex || '.*'}" placeholder=".*" style="width: 100%; padding: 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-size: 11px; color: #888;">Element Regex (which tags):</label>
                        <input type="text" class="warning-element-regex" value="${focus.warning?.elementRegex || '.*'}" placeholder="button|a|input" style="width: 100%; padding: 6px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #fff;">
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
        shareBtn.className = 'share-btn';
        shareBtn.style.backgroundColor = '#1a1a1a';
        shareBtn.onclick = async () => {
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
                const response = await fetch('FOCUS_SHARE_URL/api/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(focusData)
                });

                if (response.ok) {
                    const { id } = await response.json();
                    const shareUrl = `FOCUS_SHARE_URL/focus/${id}`;

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
        // Collect links
        const links = [];
        focusItem.querySelectorAll('.link-pair').forEach(pair => {
            const inputs = pair.getElementsByTagName('input');
            if (inputs[0].value && inputs[1].value) {
                links.push({
                    key: inputs[0].value,
                    value: inputs[1].value
                });
            }
        });

        // Collect warning settings
        const warningEnabled = focusItem.querySelector('.warning-enabled')?.checked || false;
        const selectedEmblem = focusItem.querySelector('.emblem-opt.selected');
        const warning = {
            enabled: warningEnabled,
            emblem: selectedEmblem?.dataset.emblem || 'production',
            urlRegex: focusItem.querySelector('.warning-url-regex')?.value || '.*',
            elementRegex: focusItem.querySelector('.warning-element-regex')?.value || '.*'
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