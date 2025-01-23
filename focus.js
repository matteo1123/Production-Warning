// Wait for DOM content to load before initializing
document.addEventListener('DOMContentLoaded', function() {
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

    /**
     * Creates a new focus item with name, links, and controls
     * @param {Object} focus - Focus item data {name: string, links: Array, active: boolean}
     * @returns {HTMLElement} The created focus item element
     */
    function createFocusItem(focus = { name: '', links: [], active: false }) {
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
        controls.appendChild(deleteBtn);
        focusItem.appendChild(focusName);
        focusItem.appendChild(linksContainer);
        focusItem.appendChild(controls);

        updateAddFocusButton();
        return focusItem;
    }

    // Load existing focus mode settings from storage
    chrome.storage.sync.get(['focusMode'], function(result) {
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
    saveBtn.addEventListener('click', function() {
        // Collect all focus items data
        const focuses = [];
        document.querySelectorAll('.focus-item').forEach(item => {
            const links = [];
            // Collect all valid links (both text and URL must be present)
            item.querySelectorAll('.link-pair').forEach(pair => {
                const inputs = pair.getElementsByTagName('input');
                if (inputs[0].value && inputs[1].value) {
                    links.push({
                        key: inputs[0].value,
                        value: inputs[1].value
                    });
                }
            });

            // Add focus item to array
            focuses.push({
                name: item.querySelector('.focus-name').value,
                links: links,
                active: item.classList.contains('active')
            });
        });

        // Create focus mode object with all settings
        const focusMode = {
            enabled: enableFocus.checked,
            focuses: focuses,
            mainFocus: focuses.find(f => f.active)?.name || '',
            links: focuses.find(f => f.active)?.links || []
        };

        // Save to Chrome storage
        chrome.storage.sync.set({ focusMode }, function() {
            alert('Focus mode settings saved!');
        });
    });
}); 