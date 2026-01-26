// Only inject the focus bar if we're in the main window, not an iframe
if (window === window.top) {
    // Focus Share Import Detection
    // Check if we're on a focus share website
    const FOCUS_SHARE_DOMAIN = 'pwfocus.net';

    if (window.location.href.includes(FOCUS_SHARE_DOMAIN) ||
        window.location.href.includes('localhost:3000')) {
        // Mark extension as installed for the web page to detect
        window.__focusExtensionInstalled = true;

        // Listen for import events from the focus share page
        window.addEventListener('focus-share-import', (event) => {
            const focusData = event.detail;
            if (focusData && focusData.name && focusData.links) {
                // Add the focus to storage
                chrome.storage.sync.get(['focusMode'], function (result) {
                    const focusMode = result.focusMode || { enabled: false, focuses: [] };

                    if (!focusMode.focuses) {
                        focusMode.focuses = [];
                    }

                    // Check if we've reached max focuses (10)
                    if (focusMode.focuses.length >= 10) {
                        alert('Maximum of 10 focus topics reached. Please delete one first.');
                        return;
                    }

                    // Check if focus with same name already exists
                    const existingIndex = focusMode.focuses.findIndex(f => f.name === focusData.name);
                    if (existingIndex >= 0) {
                        if (!confirm(`A focus named "${focusData.name}" already exists. Replace it?`)) {
                            return;
                        }
                        focusMode.focuses[existingIndex] = {
                            name: focusData.name,
                            links: focusData.links,
                            active: false
                        };
                    } else {
                        focusMode.focuses.push({
                            name: focusData.name,
                            links: focusData.links,
                            active: false
                        });
                    }

                    chrome.storage.sync.set({ focusMode }, () => {
                        alert(`Focus "${focusData.name}" has been imported successfully!`);
                    });
                });
            }
        });

        // Also try to read focus data from the page directly
        const focusDataScript = document.getElementById('focus-share-data');
        if (focusDataScript) {
            try {
                const focusData = JSON.parse(focusDataScript.textContent);
                // Inject an import button overlay
                const importOverlay = document.createElement('div');
                importOverlay.id = 'focus-extension-import-overlay';
                importOverlay.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ffd700, #ffb800);
                    color: #1a1a1a;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 99999;
                    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
                    transition: all 0.3s ease;
                `;
                importOverlay.textContent = '📥 Import to Focus Extension';
                importOverlay.onclick = () => {
                    window.dispatchEvent(new CustomEvent('focus-share-import', {
                        detail: focusData
                    }));
                    importOverlay.textContent = '✓ Imported!';
                    importOverlay.style.background = '#22c55e';
                    importOverlay.style.color = '#fff';
                    setTimeout(() => importOverlay.remove(), 2000);
                };
                document.body.appendChild(importOverlay);
            } catch (e) {
                console.error('Failed to parse focus data:', e);
            }
        }
    }

    // Create hover box element
    const hoverBox = document.createElement('div');
    hoverBox.style.cssText = `
    position: fixed;
        background-color: #cc0000;
        color: #ffffff;
        padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    display: none;
        border: 1px solid #ffd700;
        font-weight: bold;
        pointer-events: none;
`;
    document.body.appendChild(hoverBox);

    // Create focus bar
    const focusBar = document.createElement('div');
    focusBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #1a1a1a;
        height: auto;
        min-height: 28px;
        padding: 6px 0;
        border-bottom: 2px solid #ffd700;
        z-index: 10001;
        display: none;
        text-align: center;
        transition: all 0.3s ease;
        pointer-events: none;
    `;

    // Add logo container
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        transition: opacity 0.3s ease;
        height: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const logo = document.createElement('img');
    logo.src = chrome.runtime.getURL('icons/icon48.png');
    logo.style.width = '48px';
    logo.style.height = '48px';

    const toggleButton = document.createElement('button');
    toggleButton.style.cssText = `
        background: none;
        border: 1px solid #ffd700;
        color: #ffd700;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
        pointer-events: auto;
    `;
    toggleButton.textContent = 'Dismiss';
    toggleButton.title = 'Turn off focus mode';

    toggleButton.addEventListener('mouseover', function () {
        toggleButton.style.backgroundColor = '#cc0000';
        toggleButton.style.borderColor = '#cc0000';
        toggleButton.style.color = '#ffffff';
    });

    toggleButton.addEventListener('mouseout', function () {
        toggleButton.style.backgroundColor = 'transparent';
        toggleButton.style.borderColor = '#ffd700';
        toggleButton.style.color = '#ffd700';
    });

    toggleButton.addEventListener('click', function () {
        chrome.storage.sync.get(['focusMode'], function (result) {
            const focusMode = result.focusMode || {};
            focusMode.enabled = false;
            chrome.storage.sync.set({ focusMode }, function () {
                focusBar.style.display = 'none';
                document.body.style.paddingTop = '0';
            });
        });
    });

    logoContainer.appendChild(logo);
    logoContainer.appendChild(toggleButton);
    focusBar.appendChild(logoContainer);

    // Add focus label
    const focusLabel = document.createElement('div');
    focusLabel.style.cssText = `
        font-size: 12px;
        color: #cc0000;
        text-transform: uppercase;
        letter-spacing: 1px;
        line-height: 1;
        opacity: 0;
        height: 0;
        overflow: hidden;
        transition: opacity 0.3s ease;
    `;
    focusLabel.textContent = "Current Focus";

    // Create main focus container
    const mainFocus = document.createElement('div');
    mainFocus.style.cssText = `
        font-size: 14px;
        color: #ffd700;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        line-height: 1;
        padding: 0;
        cursor: pointer;
        transition: color 0.3s ease;
        pointer-events: auto;
    `;

    // Add emphasis arrows
    const leftArrow = document.createElement('span');
    leftArrow.textContent = '>';
    leftArrow.style.color = '#cc0000';
    leftArrow.style.fontWeight = 'bold';

    const rightArrow = document.createElement('span');
    rightArrow.textContent = '<';
    rightArrow.style.color = '#cc0000';
    rightArrow.style.fontWeight = 'bold';

    const focusText = document.createElement('span');
    mainFocus.appendChild(leftArrow);
    mainFocus.appendChild(focusText);
    mainFocus.appendChild(rightArrow);
    focusBar.appendChild(mainFocus);

    // Create links container
    const linksContainer = document.createElement('div');
    linksContainer.style.cssText = `
        display: flex;
        justify-content: space-around;
        font-size: 14px;
        padding: 0;
        line-height: 1;
        opacity: 0;
        height: 0;
        overflow: hidden;
        transition: all 0.3s ease;
        pointer-events: auto;
    `;
    focusBar.appendChild(linksContainer);

    // Add context notes button
    const contextNotesBtn = document.createElement('div');
    contextNotesBtn.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        background-color: #2a2a2a;
        border: 2px solid #ffd700;
        border-radius: 50%;
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
        line-height: 1;
        padding-bottom: 1px;
        pointer-events: auto;
    `;
    contextNotesBtn.innerHTML = '&#43;'; // Using HTML entity for plus sign
    contextNotesBtn.title = 'Add Context Notes';

    // Add notification dot
    const notificationDot = document.createElement('div');
    notificationDot.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        width: 8px;
        height: 8px;
        background-color: #cc0000;
        border-radius: 50%;
        display: none;
    `;
    contextNotesBtn.appendChild(notificationDot);
    focusBar.appendChild(contextNotesBtn);

    // Create notes popup
    const notesPopup = document.createElement('div');
    notesPopup.style.cssText = `
        position: fixed;
        top: 40px;
        right: 10px;
        width: 400px;
        background-color: #1a1a1a;
        border: 2px solid #ffd700;
        border-radius: 4px;
        padding: 15px;
        z-index: 10002;
        display: none;
        color: #ffd700;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        pointer-events: auto;
    `;

    const notesInput = document.createElement('textarea');
    notesInput.style.cssText = `
        width: 100%;
        height: 120px;
        margin-bottom: 15px;
        background-color: #2a2a2a;
        border: 1px solid #ffd700;
        color: #ffd700;
        padding: 12px;
        resize: vertical;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.4;
    `;
    notesInput.placeholder = 'Enter your context note...';

    const notesList = document.createElement('div');
    notesList.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
    `;

    const addNoteBtn = document.createElement('button');
    addNoteBtn.textContent = 'Add Note';
    addNoteBtn.style.cssText = `
        padding: 8px 16px;
        background-color: #2a2a2a;
        color: #ffd700;
        border: 1px solid #ffd700;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    notesPopup.appendChild(notesInput);
    notesPopup.appendChild(addNoteBtn);
    notesPopup.appendChild(notesList);
    document.body.appendChild(notesPopup);

    document.body.appendChild(focusBar);

    // Warning rules from storage
    let warningRules = [];

    // Emblem configurations with cursor SVGs
    const EMBLEMS = {
        production: { emoji: '⚠️', label: 'Production!', color: '#cc0000' },
        star: { emoji: '⭐', label: 'Star', color: '#ffd700' },
        heart: { emoji: '❤️', label: 'Love', color: '#ff6b6b' },
        fire: { emoji: '🔥', label: 'Hot', color: '#ff6600' },
        warning: { emoji: '⚡', label: 'Warning', color: '#ffcc00' },
        skull: { emoji: '💀', label: 'Danger', color: '#ff0000' },
        stop: { emoji: '🛑', label: 'Stop', color: '#cc0000' },
        eyes: { emoji: '👀', label: 'Watch', color: '#00ccff' }
    };

    // Generate cursor SVG for emblem
    function generateCursorSvg(emblem) {
        const info = EMBLEMS[emblem] || EMBLEMS.production;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <text x="0" y="24" font-size="24">${info.emoji}</text>
        </svg>`;
        return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 16 16, pointer`;
    }

    // Convert glob pattern to regex
    function globToRegex(pattern) {
        let regex = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars except * and ?
            .replace(/\*/g, '.*')                  // * matches anything
            .replace(/\?/g, '.');                  // ? matches single char
        return new RegExp('^' + regex + '$', 'i');
    }

    // Check if URL matches any warning rule
    function getMatchingRule(url) {
        for (const rule of warningRules) {
            try {
                const regex = globToRegex(rule.urlPattern);
                if (regex.test(url)) {
                    return rule;
                }
            } catch (e) {
                // If pattern is invalid, try simple includes match
                if (url.includes(rule.urlPattern)) {
                    return rule;
                }
            }
        }
        return null;
    }

    // Function to add cursor change listeners to an element
    function addWarningListeners(element, rule) {
        const emblemInfo = EMBLEMS[rule.emblem] || EMBLEMS.production;
        const cursorValue = generateCursorSvg(rule.emblem);
        const originalCursor = element.style.cursor;

        element.addEventListener('mouseenter', function () {
            this.style.cursor = cursorValue;
            // Also add a subtle border glow - Disabled per user request
            // this._originalOutline = this.style.outline;
            // this.style.outline = `2px solid ${emblemInfo.color}`;
            // this.style.outlineOffset = '2px';
        });

        element.addEventListener('mouseleave', function () {
            this.style.cursor = originalCursor || '';
            // this.style.outline = this._originalOutline || '';
            // this.style.outlineOffset = '';
        });
    }

    // Function to process elements based on matching rules
    function processWarningElements(rootElement) {
        const matchingRule = getMatchingRule(window.location.href);
        if (!matchingRule) return;

        const selector = matchingRule.elementSelector || '*';

        try {
            rootElement.querySelectorAll(selector).forEach(element => {
                // Don't add warning to elements inside the focus bar
                if (focusBar.contains(element)) return;
                // Don't process the same element twice
                if (element._warningProcessed) return;
                element._warningProcessed = true;

                addWarningListeners(element, matchingRule);
            });
        } catch (e) {
            // If selector is invalid, fall back to common interactive elements
            rootElement.querySelectorAll('a, button, input, select, label').forEach(element => {
                if (focusBar.contains(element)) return;
                if (element._warningProcessed) return;
                element._warningProcessed = true;

                addWarningListeners(element, matchingRule);
            });
        }

        // Process iframes
        rootElement.querySelectorAll("iframe").forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    processWarningElements(iframe.contentDocument);
                    warningObserver.observe(iframe.contentDocument.body, {
                        childList: true,
                        subtree: true
                    });
                }
            } catch { } // Ignore cross-origin errors
        });
    }

    // Mutation observer for dynamically added elements
    const warningObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    processWarningElements(node);
                    processFocusWarningElements(node);
                }
            });
        });
    });

    // Active focus warning config
    let activeFocusWarning = null;

    // Check if element matches focus warning criteria
    function matchesElementRegex(element, regex) {
        try {
            const pattern = new RegExp(regex, 'i');
            return pattern.test(element.tagName.toLowerCase());
        } catch {
            return true; // Default to match all if regex is invalid
        }
    }

    // Check if URL matches focus warning urlRegex
    function urlMatchesFocusWarning(url, warning) {
        if (!warning || !warning.enabled) return false;
        try {
            const pattern = new RegExp(warning.urlRegex, 'i');
            return pattern.test(url);
        } catch {
            return true; // Default to match if regex is invalid
        }
    }

    // Process elements for focus-specific warnings
    function processFocusWarningElements(rootElement) {
        if (!activeFocusWarning || !activeFocusWarning.enabled) return;
        if (!urlMatchesFocusWarning(window.location.href, activeFocusWarning)) return;

        const elementRegex = activeFocusWarning.elementRegex || '.*';

        rootElement.querySelectorAll('*').forEach(element => {
            // Skip focus bar elements
            if (focusBar.contains(element)) return;
            // Skip already processed elements
            if (element._focusWarningProcessed) return;

            // Check if element matches the regex
            if (matchesElementRegex(element, elementRegex)) {
                element._focusWarningProcessed = true;
                addWarningListeners(element, {
                    emblem: activeFocusWarning.emblem || 'production',
                    elementSelector: '*'
                });
            }
        });
    }

    // Load warning rules and process page
    chrome.storage.sync.get(['warningRules', 'focusMode'], function (result) {
        warningRules = result.warningRules || [];

        // Process global warning rules
        if (warningRules.length > 0) {
            processWarningElements(document);
        }

        // Process focus-specific warning
        if (result.focusMode && result.focusMode.enabled && result.focusMode.warning) {
            activeFocusWarning = result.focusMode.warning;
            processFocusWarningElements(document);
        }

        // Start observing for dynamic content
        warningObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    // Listen for rule updates
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
            if (changes.warningRules) {
                warningRules = changes.warningRules.newValue || [];
            }
            if (changes.focusMode) {
                const focusMode = changes.focusMode.newValue;
                if (focusMode && focusMode.enabled && focusMode.warning) {
                    activeFocusWarning = focusMode.warning;
                } else {
                    activeFocusWarning = null;
                }
            }
        }
    });

    // Function to update focus bar
    function updateFocusBar(focusData) {
        if (!focusData || !focusData.enabled) {
            focusBar.style.display = 'none';
            document.body.style.paddingTop = '0';
            restoreFixedElements();
            return;
        }

        focusText.textContent = focusData.mainFocus;
        linksContainer.innerHTML = '';

        if (focusData.links) {
            focusData.links.forEach(({ key, value }) => {
                const link = document.createElement('a');
                link.href = value;
                link.textContent = key;
                link.style.cssText = `
                    color: #ffd700;
                    text-decoration: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    background-color: #2a2a2a;
                    border: 1px solid #ffd700;
                    transition: all 0.3s ease;
                    margin: 0 4px;
                `;
                link.addEventListener('mouseover', function () {
                    this.style.backgroundColor = '#cc0000';
                    this.style.borderColor = '#cc0000';
                    this.style.color = '#ffffff';
                });
                link.addEventListener('mouseout', function () {
                    this.style.backgroundColor = '#2a2a2a';
                    this.style.borderColor = '#ffd700';
                    this.style.color = '#ffd700';
                });
                linksContainer.appendChild(link);
            });
        }

        focusBar.style.display = 'block';
        // Set padding based on actual bar height after it's rendered
        requestAnimationFrame(() => {
            const barHeight = focusBar.offsetHeight;
            document.body.style.paddingTop = barHeight + 'px';

            // Also offset fixed-position elements that are at the top
            offsetFixedElements(barHeight);
        });
    }

    // Track elements we've modified so we can restore them
    const modifiedFixedElements = new Map();

    // Function to offset fixed-position elements at top: 0
    function offsetFixedElements(barHeight) {
        // Find all elements with position: fixed and top: 0
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            // Skip our own elements
            if (el === focusBar || el === hoverZone || focusBar.contains(el)) {
                return;
            }

            const style = window.getComputedStyle(el);
            if (style.position === 'fixed') {
                const topValue = parseInt(style.top, 10);

                // If element is fixed at the top (within 5px of 0)
                if (!isNaN(topValue) && topValue >= 0 && topValue <= 5) {
                    // Store original value if we haven't already
                    if (!modifiedFixedElements.has(el)) {
                        modifiedFixedElements.set(el, {
                            originalTop: el.style.top || style.top
                        });
                    }

                    // Offset by the bar height
                    el.style.top = (topValue + barHeight) + 'px';
                }
            }
        });
    }

    // Function to restore fixed elements when focus bar is hidden
    function restoreFixedElements() {
        modifiedFixedElements.forEach((data, el) => {
            if (el && el.style) {
                el.style.top = data.originalTop;
            }
        });
        modifiedFixedElements.clear();
    }

    // Listen for focus mode updates
    chrome.storage.sync.get(['focusMode'], function (result) {
        if (result.focusMode) {
            updateFocusBar(result.focusMode);
        }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.focusMode) {
            updateFocusBar(changes.focusMode.newValue);
        }
    });

    // Improved hover behavior with stable expansion
    let leaveTimeout;
    let isExpanded = false;

    // Create an invisible hover zone that captures mouse events
    const hoverZone = document.createElement('div');
    hoverZone.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 20px;
        z-index: 10000;
        pointer-events: auto;
        background: transparent;
    `;
    document.body.appendChild(hoverZone);

    function expandBar() {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout);
            leaveTimeout = null;
        }
        if (isExpanded) return;

        isExpanded = true;
        focusBar.style.padding = '8px 0';
        focusBar.style.pointerEvents = 'auto';
        focusLabel.style.opacity = '1';
        focusLabel.style.height = 'auto';
        mainFocus.style.fontSize = '18px';
        linksContainer.style.opacity = '1';
        linksContainer.style.height = 'auto';
        linksContainer.style.marginTop = '8px';
        logoContainer.style.opacity = '1';
        logoContainer.style.height = 'auto';

        // Update hover zone to cover expanded bar height
        requestAnimationFrame(() => {
            hoverZone.style.height = Math.max(focusBar.offsetHeight + 10, 60) + 'px';
            document.body.style.paddingTop = focusBar.offsetHeight + 'px';
        });
    }

    function collapseBar() {
        isExpanded = false;
        focusBar.style.padding = '6px 0';
        focusBar.style.pointerEvents = 'none';
        focusLabel.style.opacity = '0';
        focusLabel.style.height = '0';
        mainFocus.style.fontSize = '14px';
        linksContainer.style.opacity = '0';
        linksContainer.style.height = '0';
        linksContainer.style.marginTop = '0';
        logoContainer.style.opacity = '0';
        logoContainer.style.height = '0';

        // Reset hover zone to small trigger area
        hoverZone.style.height = '20px';

        requestAnimationFrame(() => {
            document.body.style.paddingTop = focusBar.offsetHeight + 'px';
        });
    }

    function scheduleCollapse() {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout);
        }
        leaveTimeout = setTimeout(() => {
            // Double-check mouse isn't over the bar or hover zone
            if (!focusBar.matches(':hover') && !hoverZone.matches(':hover')) {
                collapseBar();
            }
        }, 300);
    }

    // Hover zone triggers expansion
    hoverZone.addEventListener('mouseenter', expandBar);
    hoverZone.addEventListener('mouseleave', function (e) {
        // If moving into the focus bar, don't collapse
        if (focusBar.contains(e.relatedTarget)) {
            return;
        }
        scheduleCollapse();
    });

    // Focus bar also handles hover
    focusBar.addEventListener('mouseenter', function () {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout);
            leaveTimeout = null;
        }
        // Ensure expanded state
        if (!isExpanded) {
            expandBar();
        }
    });

    focusBar.addEventListener('mouseleave', function (e) {
        // If moving into the hover zone, don't collapse
        if (e.relatedTarget === hoverZone) {
            return;
        }
        scheduleCollapse();
    });

    // Function to update notes display
    function updateNotesList(notes) {
        notesList.innerHTML = '';

        // Add CSS for drag and drop
        notesList.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
            position: relative;
        `;

        notes.forEach((note, index) => {
            const noteDiv = document.createElement('div');
            noteDiv.style.cssText = `
                padding: 12px;
                margin: 8px 0;
                background-color: #2a2a2a;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                font-size: 14px;
                line-height: 1.4;
                cursor: move;
                user-select: none;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                position: relative;
            `;
            noteDiv.draggable = true;

            const dragHandle = document.createElement('div');
            dragHandle.style.cssText = `
                width: 12px;
                height: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 2px;
                margin-right: 8px;
                opacity: 0.5;
                cursor: move;
            `;

            // Add drag dots
            for (let i = 0; i < 6; i++) {
                const dot = document.createElement('div');
                dot.style.cssText = `
                    width: 2px;
                    height: 2px;
                    background-color: #ffd700;
                    border-radius: 50%;
                `;
                dragHandle.appendChild(dot);
            }

            const noteText = document.createElement('div');
            noteText.textContent = note;
            noteText.style.flex = '1';
            noteText.style.marginRight = '12px';
            noteText.style.whiteSpace = 'pre-wrap';

            const controls = document.createElement('div');
            controls.style.marginLeft = '8px';

            const editBtn = document.createElement('button');
            editBtn.textContent = '✎';
            editBtn.style.cssText = `
                margin-right: 6px;
                padding: 4px 8px;
                background: none;
                border: none;
                color: #ffd700;
                cursor: pointer;
                font-size: 16px;
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.style.cssText = `
                padding: 4px 8px;
                background: none;
                border: none;
                color: #cc0000;
                cursor: pointer;
                font-size: 16px;
            `;

            controls.appendChild(editBtn);
            controls.appendChild(deleteBtn);
            noteDiv.appendChild(dragHandle);
            noteDiv.appendChild(noteText);
            noteDiv.appendChild(controls);
            notesList.appendChild(noteDiv);

            // Drag and drop handlers
            noteDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index.toString());
                noteDiv.style.opacity = '0.5';
                noteDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });

            noteDiv.addEventListener('dragend', () => {
                noteDiv.style.opacity = '1';
                noteDiv.style.boxShadow = 'none';
                noteDiv.style.transform = 'none';
            });

            noteDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                const draggingIndex = parseInt(e.dataTransfer.getData('text/plain'));
                if (draggingIndex !== index) {
                    const rect = noteDiv.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    if (e.clientY < midpoint) {
                        noteDiv.style.transform = 'translateY(10px)';
                    } else {
                        noteDiv.style.transform = 'translateY(-10px)';
                    }
                }
            });

            noteDiv.addEventListener('dragleave', () => {
                noteDiv.style.transform = 'none';
            });

            noteDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;

                if (fromIndex !== toIndex) {
                    chrome.storage.sync.get(['contextNotes'], result => {
                        const notes = result.contextNotes || {};
                        const urlNotes = notes[window.location.href] || [];
                        const [movedNote] = urlNotes.splice(fromIndex, 1);
                        urlNotes.splice(toIndex, 0, movedNote);
                        notes[window.location.href] = urlNotes;
                        chrome.storage.sync.set({ contextNotes: notes }, () => {
                            updateNotesList(urlNotes);
                        });
                    });
                }
                noteDiv.style.transform = 'none';
            });

            editBtn.onclick = () => {
                notesInput.value = note;
                chrome.storage.sync.get(['contextNotes'], result => {
                    const notes = result.contextNotes || {};
                    const urlNotes = notes[window.location.href] || [];
                    urlNotes.splice(index, 1);
                    notes[window.location.href] = urlNotes;
                    chrome.storage.sync.set({ contextNotes: notes });
                });
            };

            deleteBtn.onclick = () => {
                chrome.storage.sync.get(['contextNotes'], result => {
                    const notes = result.contextNotes || {};
                    const urlNotes = notes[window.location.href] || [];
                    urlNotes.splice(index, 1);
                    notes[window.location.href] = urlNotes;
                    chrome.storage.sync.set({ contextNotes: notes }, () => {
                        updateNotesList(urlNotes);
                        if (urlNotes.length === 0) {
                            notificationDot.style.display = 'none';
                            contextNotesBtn.style.animation = 'none';
                        }
                    });
                });
            };
        });
    }

    // Load and display existing notes
    function loadContextNotes() {
        chrome.storage.sync.get(['contextNotes'], result => {
            const notes = result.contextNotes || {};
            const urlNotes = notes[window.location.href] || [];
            if (urlNotes.length > 0) {
                notificationDot.style.display = 'block';
                // Add a pulse animation to the context notes button
                contextNotesBtn.style.animation = 'pulse 2s';
                contextNotesBtn.style.animationIterationCount = '3';
            }
        });
    }

    // Event listeners for notes functionality
    contextNotesBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['contextNotes'], result => {
            const notes = result.contextNotes || {};
            const urlNotes = notes[window.location.href] || [];
            updateNotesList(urlNotes);
            notesPopup.style.display = notesPopup.style.display === 'none' ? 'block' : 'none';
            if (notesPopup.style.display === 'block') {
                notificationDot.style.display = 'none';
                contextNotesBtn.style.animation = 'none';
            }
        });
    });

    addNoteBtn.addEventListener('click', () => {
        const noteText = notesInput.value.trim();
        if (noteText) {
            chrome.storage.sync.get(['contextNotes'], result => {
                const notes = result.contextNotes || {};
                const urlNotes = notes[window.location.href] || [];
                urlNotes.push(noteText);
                notes[window.location.href] = urlNotes;
                chrome.storage.sync.set({ contextNotes: notes }, () => {
                    notesInput.value = '';
                    updateNotesList(urlNotes);
                    contextNotesBtn.style.transform = 'translateY(0)';
                });
            });
        }
    });

    document.addEventListener('click', (e) => {
        if (!notesPopup.contains(e.target) && e.target !== contextNotesBtn) {
            notesPopup.style.display = 'none';
        }
    });

    // Load notes when page loads
    loadContextNotes();

    // Add CSS animation for the pulse effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateY(-50%) scale(1); }
            50% { transform: translateY(-50%) scale(1.1); }
            100% { transform: translateY(-50%) scale(1); }
        }
    `;
    document.head.appendChild(style);

    mainFocus.addEventListener('mouseover', function () {
        mainFocus.style.color = '#cc0000';
    });

    mainFocus.addEventListener('mouseout', function () {
        mainFocus.style.color = '#ffd700';
    });

    mainFocus.addEventListener('click', function () {
        chrome.storage.sync.get(['focusMode'], function (result) {
            if (!result.focusMode || !result.focusMode.enabled) return;

            const activeFocus = result.focusMode.focuses.find(f => f.active);
            if (!activeFocus) return;

            // check per-link warnings first (specific overrides)
            let linkWarning = null;
            if (activeFocus.links) {
                for (const link of activeFocus.links) {
                    if (link.warning && link.warning.enabled) {
                        // Check if current URL matches this link
                        try {
                            // Simple match: if current URL starts with link URL or contains it
                            // For better matching, if link has no path chars, treat as domain wildcard
                            // If link has path, match exact prefix
                            const currentUrl = window.location.href;
                            const linkUrl = link.value; // URL from user

                            // Clean checks
                            if (currentUrl.includes(linkUrl)) {
                                linkWarning = {
                                    emblem: link.warning.emblem || 'production',
                                    elementRegex: link.warning.elementRegex || '.*'
                                };
                                break;
                            }
                        } catch (e) { console.error('Link match error', e); }
                    }
                }
            }

            // Apply warning if found (either per-link or global)
            if (linkWarning) {
                applyWarning(linkWarning.emblem, linkWarning.elementRegex, "Link Warning");
            } else if (activeFocus.warning && activeFocus.warning.enabled) {
                const urlRegex = new RegExp(activeFocus.warning.urlRegex);
                if (urlRegex.test(window.location.href)) {
                    applyWarning(
                        activeFocus.warning.emblem,
                        activeFocus.warning.elementRegex,
                        activeFocus.warning.urlRegex
                    );
                }
            }

            // Check for context notes (logic can go here if needed to show notes on click)
            if (activeFocus.contextNotes) {
                // Future: maybe show a notes popup?
            }

            // Open links
            if (activeFocus.links) {
                activeFocus.links.forEach(({ value }) => {
                    // Ensure URL is properly formatted
                    let url = value;
                    if (!url.match(/^https?:\/\//i)) {
                        url = 'https://' + url;
                    }
                    window.open(url, '_blank');
                });
            }
        });
    });

    // Make interactive elements within the focus bar clickable
    mainFocus.style.pointerEvents = 'auto';
    contextNotesBtn.style.pointerEvents = 'auto';
    linksContainer.style.pointerEvents = 'auto';
    notesPopup.style.pointerEvents = 'auto';
}

