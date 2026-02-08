// Only inject the focus bar if we're in the main window, not an iframe
if (window === window.top) {
    // Focus Share Import Detection
    // Check if we're on a focus share website
    const FOCUS_SHARE_DOMAIN = 'pwfocus.net';

    if (window.location.href.includes(FOCUS_SHARE_DOMAIN) ||
        window.location.href.includes('localhost:3000')) {

        // Inject a DOM element the website can detect
        const extensionMarker = document.createElement('div');
        extensionMarker.id = 'pw-focus-extension-installed';
        extensionMarker.style.display = 'none';
        extensionMarker.dataset.version = chrome.runtime.getManifest().version;
        document.documentElement.appendChild(extensionMarker);

        // Listen for import messages from the website via postMessage
        window.addEventListener('message', (event) => {
            // Only accept messages from pwfocus.net or localhost
            if (!event.origin.includes(FOCUS_SHARE_DOMAIN) && !event.origin.includes('localhost')) {
                return;
            }

            if (event.data && event.data.type === 'PWFOCUS_IMPORT_FOCUS') {
                const focusData = event.data.focus;
                const options = event.data.options || {};

                if (focusData && focusData.name && focusData.links) {
                    importFocus(focusData, options);
                }
            }
        });

        // Function to import a focus and optionally open all links
        function importFocus(focusData, options = {}) {
            chrome.storage.sync.get(['focusMode'], function (result) {
                const focusMode = result.focusMode || { enabled: true, focuses: [] };

                if (!focusMode.focuses) {
                    focusMode.focuses = [];
                }

                // Check if we've reached max focuses (10)
                if (focusMode.focuses.length >= 10) {
                    alert('Maximum of 10 focus topics reached. Please delete one first.');
                    window.postMessage({ type: 'PWFOCUS_IMPORT_RESULT', success: false, error: 'max_focuses' }, '*');
                    return;
                }

                // Build full focus object including shareUrl, warnings, notes
                // Normalize warning data - shared focuses may use 'cursorWarning' instead of 'warning'
                const warning = focusData.warning || focusData.cursorWarning || { enabled: false, emblem: 'production', elementRegex: '.*', urlRegex: '*' };

                // Normalize context notes - ensure they are in the correct format for the settings page
                let contextNotes = focusData.contextNotes || [];
                // If contextNotes is not an array, convert it to an array
                if (!Array.isArray(contextNotes)) {
                    contextNotes = [];
                }

                const newFocus = {
                    name: focusData.name,
                    description: focusData.description || '',
                    links: focusData.links.map(link => ({
                        key: link.key,
                        value: link.value,
                        context: link.context || '',
                        warning: link.warning
                    })),
                    warning: warning,
                    contextNotes: contextNotes,
                    shareUrl: options.shareUrl || null,
                    active: true // Set as active
                };

                // Check if focus with same name already exists
                const existingIndex = focusMode.focuses.findIndex(f => f.name === focusData.name);
                if (existingIndex >= 0) {
                    if (!confirm(`A focus named "${focusData.name}" already exists. Replace it?`)) {
                        window.postMessage({ type: 'PWFOCUS_IMPORT_RESULT', success: false, error: 'cancelled' }, '*');
                        return;
                    }
                    // Deactivate all other focuses
                    focusMode.focuses.forEach(f => f.active = false);
                    focusMode.focuses[existingIndex] = newFocus;
                } else {
                    // Deactivate all other focuses
                    focusMode.focuses.forEach(f => f.active = false);
                    focusMode.focuses.push(newFocus);
                }

                // Enable focus mode
                focusMode.enabled = true;
                focusMode.mainFocus = newFocus.name;
                focusMode.links = newFocus.links;
                focusMode.warning = newFocus.warning;
                focusMode.contextNotes = newFocus.contextNotes;

                chrome.storage.sync.set({ focusMode }, () => {
                    window.postMessage({ type: 'PWFOCUS_IMPORT_RESULT', success: true }, '*');

                    // Open all links if requested
                    if (options.openAllLinks && newFocus.links.length > 0) {
                        const urls = newFocus.links.map(link => link.value).filter(u => u);
                        // Send message to background script to open a new window with these URLs
                        try {
                            chrome.runtime.sendMessage({
                                type: 'OPEN_FOCUS_WINDOW',
                                urls: urls
                            });
                        } catch (error) {
                            console.error('Failed to open focus window:', error);
                            alert('Extension has been updated. Please refresh the page to continue.');
                        }
                    }
                });
            });
        }

        // Legacy: Listen for old-style focus-share-import events
        window.addEventListener('focus-share-import', (event) => {
            const focusData = event.detail;
            if (focusData && focusData.name && focusData.links) {
                importFocus(focusData, { openAllLinks: false });
            }
        });
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
        right: 0;
        width: 100%;
        background-color: #1a1a1a;
        height: auto;
        min-height: 28px;
        padding: 6px 0;
        border-bottom: 2px solid #ffd700;
        z-index: 2147483647; /* Max z-index */
        display: none;
        text-align: center;
        transition: all 0.3s ease;
        pointer-events: none;
        box-sizing: border-box;
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
                document.documentElement.style.marginTop = '0';
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
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
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
        padding-left: 170px;
        padding-right: 140px;
        width: 100%;
        box-sizing: border-box;
    `;
    focusBar.appendChild(linksContainer);

    // Right side button container
    const rightButtonContainer = document.createElement('div');
    rightButtonContainer.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Add chat button (Ask Focus)
    const chatBtn = document.createElement('div');
    chatBtn.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: #2a2a2a;
        border: 2px solid #ffd700;
        border-radius: 50%;
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        line-height: 1;
        pointer-events: auto;
    `;
    chatBtn.innerHTML = '💬';
    chatBtn.title = 'Ask Focus - Chat with your open tabs';

    chatBtn.addEventListener('mouseover', function () {
        this.style.backgroundColor = '#ffd700';
        this.style.color = '#1a1a1a';
    });
    chatBtn.addEventListener('mouseout', function () {
        this.style.backgroundColor = '#2a2a2a';
        this.style.color = '#ffd700';
    });

    // Add context notes button
    const contextNotesBtn = document.createElement('div');
    contextNotesBtn.style.cssText = `
        width: 24px;
        height: 24px;
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
        position: relative;
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

    // Share button
    const shareBtn = document.createElement('div');
    shareBtn.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: #2a2a2a;
        border: 2px solid #ffd700;
        border-radius: 50%;
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
        line-height: 1;
        pointer-events: auto;
    `;
    shareBtn.innerHTML = '🔗';
    shareBtn.title = 'Share this focus';

    shareBtn.addEventListener('mouseover', function () {
        this.style.backgroundColor = '#ffd700';
        this.style.color = '#1a1a1a';
    });
    shareBtn.addEventListener('mouseout', function () {
        this.style.backgroundColor = '#2a2a2a';
        this.style.color = '#ffd700';
    });

    // Share button click handler
    shareBtn.addEventListener('click', async function () {
        const originalIcon = shareBtn.innerHTML;
        shareBtn.innerHTML = '⏳';
        shareBtn.style.pointerEvents = 'none';

        try {
            const { focusMode } = await chrome.storage.sync.get(['focusMode']);
            const activeFocus = focusMode?.focuses?.find(f => f.active);

            if (!activeFocus) {
                alert('No active focus to share');
                return;
            }

            // Check if we have edit rights
            // const isUpdate = activeFocus.shareContext && activeFocus.shareContext.id && activeFocus.shareContext.updateToken;
            const isUpdate = false; // Forced new share

            // Prepare focus data for sharing
            const payload = {
                name: activeFocus.name,
                description: activeFocus.description || '',
                links: activeFocus.links || [],
                warning: activeFocus.warning || { enabled: false, emblem: 'production', elementRegex: '.*', urlRegex: '*' },
                contextNotes: activeFocus.contextNotes || [],
                sharedBy: 'extension'
            };

            // Add ID and Token if updating
            if (isUpdate) {
                payload.id = activeFocus.shareContext.id;
                payload.updateToken = activeFocus.shareContext.updateToken;
            }

            console.log('Extensions sharing:', payload);

            // Call the share API via background script
            const response = await chrome.runtime.sendMessage({
                type: 'SHARE_FOCUS',
                payload: payload
            });

            if (response && response.error) {
                throw new Error(response.error);
            }

            console.log('Share response:', response);
            let shareId = null;
            let updateToken = null;

            if (typeof response === 'string') {
                shareId = response;
            } else if (typeof response === 'object') {
                shareId = response.id || response.shareId;
                updateToken = response.updateToken;
            }
            if (shareId) {
                // Save context back to focus (ID and Token) if we got a token back
                // This happens on CREATE (always) and UPDATE (if API returns it, which it does)
                if (updateToken) {
                    const focusIndex = focusMode.focuses.findIndex(f => f.active);
                    if (focusIndex !== -1) {
                        focusMode.focuses[focusIndex].shareContext = {
                            id: shareId,
                            updateToken: updateToken,
                            lastShared: Date.now()
                        };
                        // Save Update Token to storage
                        await chrome.storage.sync.set({ focusMode });
                    }
                }

                const shareUrl = `https://pwfocus.net/focus/${shareId}`;
                await navigator.clipboard.writeText(shareUrl);
                shareBtn.innerHTML = '✅';
                setTimeout(() => { shareBtn.innerHTML = originalIcon; }, 2000);
                alert(`Focus shared! URL copied: ${shareUrl}`);
            } else {
                throw new Error(`Invalid response key: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            console.error('Share error:', error);
            if (error.message.includes('Extension context invalidated') || error.message.includes('context')) {
                alert('Extension updated. Please refresh the page to use sharing.');
            } else {
                alert('Failed to share focus: ' + (error.message || 'Unknown error'));
            }
            shareBtn.innerHTML = '❌';
            setTimeout(() => { shareBtn.innerHTML = originalIcon; }, 2000);
        } finally {
            shareBtn.style.pointerEvents = 'auto';
        }
    });

    // Settings button (go to focus page)
    const settingsBtn = document.createElement('div');
    settingsBtn.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: #2a2a2a;
        border: 2px solid #ffd700;
        border-radius: 50%;
        color: #ffd700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
        line-height: 1;
        pointer-events: auto;
    `;
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.title = 'Open Focus Settings';

    settingsBtn.addEventListener('mouseover', function () {
        this.style.backgroundColor = '#ffd700';
        this.style.color = '#1a1a1a';
    });
    settingsBtn.addEventListener('mouseout', function () {
        this.style.backgroundColor = '#2a2a2a';
        this.style.color = '#ffd700';
    });

    settingsBtn.addEventListener('click', function () {
        try {
            chrome.runtime.sendMessage({ type: 'OPEN_FOCUS_PAGE' });
        } catch (error) {
            console.error('Failed to open focus settings:', error);
            alert('Extension has been updated. Please refresh the page to continue.');
        }
    });

    // Add buttons to container
    rightButtonContainer.appendChild(shareBtn);
    rightButtonContainer.appendChild(chatBtn);
    rightButtonContainer.appendChild(contextNotesBtn);
    rightButtonContainer.appendChild(settingsBtn);
    focusBar.appendChild(rightButtonContainer);

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

    // Create floating chat popup (Ask Focus)
    const chatPopup = document.createElement('div');
    chatPopup.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 380px;
        height: 500px;
        background-color: #1a1a1a;
        border: 2px solid #ffd700;
        border-radius: 12px;
        z-index: 10003;
        display: none;
        flex-direction: column;
        color: #ffd700;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        pointer-events: auto;
        overflow: hidden;
        resize: both;
        min-width: 300px;
        min-height: 300px;
    `;

    // Chat header (draggable)
    const chatHeader = document.createElement('div');
    chatHeader.style.cssText = `
        padding: 12px 16px;
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border-bottom: 1px solid #ffd700;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: move;
        user-select: none;
    `;

    const chatTitle = document.createElement('div');
    chatTitle.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        font-size: 14px;
    `;
    chatTitle.innerHTML = '💬 Ask Focus';

    const chatCloseBtn = document.createElement('button');
    chatCloseBtn.style.cssText = `
        background: none;
        border: none;
        color: #ffd700;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
        transition: color 0.2s;
    `;
    chatCloseBtn.innerHTML = '×';
    chatCloseBtn.addEventListener('mouseover', () => chatCloseBtn.style.color = '#cc0000');
    chatCloseBtn.addEventListener('mouseout', () => chatCloseBtn.style.color = '#ffd700');
    chatCloseBtn.addEventListener('click', () => chatPopup.style.display = 'none');

    chatHeader.appendChild(chatTitle);
    chatHeader.appendChild(chatCloseBtn);
    chatPopup.appendChild(chatHeader);

    // Chat messages container
    const chatMessages = document.createElement('div');
    chatMessages.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    `;

    // Welcome message
    const welcomeMsg = document.createElement('div');
    welcomeMsg.style.cssText = `
        background-color: #2a2a2a;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
        border-left: 3px solid #ffd700;
    `;
    welcomeMsg.innerHTML = `<strong>Welcome to Ask Focus!</strong><br><br>Ask questions about the content across all your open tabs in this focus. I'll analyze the pages and provide answers based on what you're working on.`;
    chatMessages.appendChild(welcomeMsg);
    chatPopup.appendChild(chatMessages);

    // Chat input area
    const chatInputArea = document.createElement('div');
    chatInputArea.style.cssText = `
        padding: 12px;
        border-top: 1px solid #3a3a3a;
        background-color: #2a2a2a;
    `;

    const chatInputContainer = document.createElement('div');
    chatInputContainer.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: flex-end;
    `;

    const chatInput = document.createElement('textarea');
    chatInput.style.cssText = `
        flex: 1;
        background-color: #1a1a1a;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        color: #ffffff;
        padding: 10px 12px;
        font-size: 14px;
        line-height: 1.4;
        resize: none;
        max-height: 100px;
        min-height: 40px;
        transition: border-color 0.2s;
    `;
    chatInput.placeholder = 'Ask a question about your focus...';
    chatInput.rows = 1;
    chatInput.addEventListener('focus', () => chatInput.style.borderColor = '#ffd700');
    chatInput.addEventListener('blur', () => chatInput.style.borderColor = '#3a3a3a');

    // Auto-resize textarea
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    const chatSendBtn = document.createElement('button');
    chatSendBtn.style.cssText = `
        background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
        border: none;
        border-radius: 8px;
        color: #1a1a1a;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
    `;
    chatSendBtn.innerHTML = 'Send';
    chatSendBtn.addEventListener('mouseover', () => {
        chatSendBtn.style.transform = 'scale(1.02)';
        chatSendBtn.style.boxShadow = '0 2px 8px rgba(255, 215, 0, 0.3)';
    });
    chatSendBtn.addEventListener('mouseout', () => {
        chatSendBtn.style.transform = 'scale(1)';
        chatSendBtn.style.boxShadow = 'none';
    });

    // Copy Context button
    const copyContextBtn = document.createElement('button');
    copyContextBtn.style.cssText = `
        background: #2a2a2a;
        border: 1px solid #ffd700;
        border-radius: 8px;
        color: #ffd700;
        padding: 10px 12px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
    `;
    copyContextBtn.innerHTML = '📋 Copy';
    copyContextBtn.title = 'Copy extracted context to clipboard (use with other AI tools)';
    copyContextBtn.addEventListener('mouseover', () => {
        copyContextBtn.style.backgroundColor = '#3a3a3a';
        copyContextBtn.style.borderColor = '#ffdd44';
    });
    copyContextBtn.addEventListener('mouseout', () => {
        copyContextBtn.style.backgroundColor = '#2a2a2a';
        copyContextBtn.style.borderColor = '#ffd700';
    });

    chatInputContainer.appendChild(chatInput);
    chatInputContainer.appendChild(copyContextBtn);
    chatInputContainer.appendChild(chatSendBtn);
    chatInputArea.appendChild(chatInputContainer);
    chatPopup.appendChild(chatInputArea);

    // Make chat popup draggable
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    chatHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffsetX = e.clientX - chatPopup.offsetLeft;
        dragOffsetY = e.clientY - chatPopup.offsetTop;
        chatPopup.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const newX = e.clientX - dragOffsetX;
        const newY = e.clientY - dragOffsetY;

        // Keep within viewport bounds
        const maxX = window.innerWidth - chatPopup.offsetWidth;
        const maxY = window.innerHeight - chatPopup.offsetHeight;

        chatPopup.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        chatPopup.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        chatPopup.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        chatPopup.style.transition = '';
    });

    document.body.appendChild(chatPopup);

    // Chat button click handler
    chatBtn.addEventListener('click', () => {
        const isVisible = chatPopup.style.display === 'flex';
        chatPopup.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            chatInput.focus();
        }
    });

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
        if (chatPopup.style.display === 'flex' &&
            !chatPopup.contains(e.target) &&
            !chatBtn.contains(e.target)) {
            // Don't close - allow user to interact with page while chat is open
        }
    });

    // Handle Enter key to send message
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    chatSendBtn.addEventListener('click', sendChatMessage);

    // Copy context button handler
    copyContextBtn.addEventListener('click', async () => {
        const originalText = copyContextBtn.innerHTML;
        copyContextBtn.innerHTML = '⏳ Extracting...';
        copyContextBtn.disabled = true;
        copyContextBtn.style.opacity = '0.7';

        try {
            // Check if extension context is still valid
            if (!chrome.runtime?.id) {
                throw new Error('Extension context invalidated');
            }
            const response = await chrome.runtime.sendMessage({
                type: 'COPY_FOCUS_CONTEXT'
            });

            if (response && response.error) {
                addChatMessage(`Error: ${response.error}`, false);
                copyContextBtn.innerHTML = originalText;
            } else if (response && response.content) {
                // Copy to clipboard
                await navigator.clipboard.writeText(response.content);

                copyContextBtn.innerHTML = '✅ Copied!';
                addChatMessage(`📋 Context from ${response.sourceCount} source(s) copied to clipboard! You can now paste it into any AI chat.`, false);

                setTimeout(() => {
                    copyContextBtn.innerHTML = originalText;
                }, 2000);
            } else {
                addChatMessage('Failed to extract context. Please try again.', false);
                copyContextBtn.innerHTML = originalText;
            }
        } catch (error) {
            if (error.message?.includes('Extension context invalidated') || !chrome.runtime?.id) {
                addChatMessage('Error: Extension has been updated. Please refresh the page to continue.', false);
            } else {
                addChatMessage(`Error: ${error.message || 'Failed to copy context'}`, false);
            }
            copyContextBtn.innerHTML = originalText;
        } finally {
            copyContextBtn.disabled = false;
            copyContextBtn.style.opacity = '1';
        }
    });

    // Function to add message to chat
    function addChatMessage(content, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.5;
            max-width: 85%;
            word-wrap: break-word;
            ${isUser
                ? 'background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%); color: #1a1a1a; align-self: flex-end; border-bottom-right-radius: 4px;'
                : 'background-color: #2a2a2a; color: #ffffff; align-self: flex-start; border-left: 3px solid #ffd700; border-bottom-left-radius: 4px;'
            }
        `;
        msgDiv.textContent = content;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    // Function to add loading indicator
    function addLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-loading';
        loadingDiv.style.cssText = `
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.5;
            background-color: #2a2a2a;
            color: #888;
            align-self: flex-start;
            border-left: 3px solid #ffd700;
        `;
        loadingDiv.innerHTML = '<span class="typing-dots">Analyzing your focus tabs<span>.</span><span>.</span><span>.</span></span>';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    }

    // Function to send chat message
    async function sendChatMessage() {
        const question = chatInput.value.trim();
        if (!question) return;

        // Add user message
        addChatMessage(question, true);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Disable input while processing
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        chatSendBtn.style.opacity = '0.6';

        const loadingMsg = addLoadingMessage();

        try {
            // Check if extension context is still valid
            if (!chrome.runtime?.id) {
                throw new Error('Extension context invalidated');
            }
            // Request content extraction from background script
            const response = await chrome.runtime.sendMessage({
                type: 'EXTRACT_FOCUS_CONTENT',
                question: question
            });

            loadingMsg.remove();

            if (response && response.error) {
                addChatMessage(`Error: ${response.error}`, false);
            } else if (response && response.answer) {
                addChatMessage(response.answer, false);
            } else {
                addChatMessage('Sorry, I couldn\'t process your request. Please try again.', false);
            }
        } catch (error) {
            loadingMsg.remove();
            if (error.message?.includes('Extension context invalidated') || !chrome.runtime?.id) {
                addChatMessage('Error: Extension has been updated. Please refresh the page to continue.', false);
            } else {
                addChatMessage(`Error: ${error.message || 'Failed to process request'}`, false);
            }
        } finally {
            // Re-enable input
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatSendBtn.style.opacity = '1';
            chatInput.focus();
        }
    }

    // Add typing animation styles
    const chatStyles = document.createElement('style');
    chatStyles.textContent = `
        .typing-dots span {
            animation: blink 1.4s infinite;
            animation-fill-mode: both;
        }
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        @keyframes blink {
            0% { opacity: 0.2; }
            20% { opacity: 1; }
            100% { opacity: 0.2; }
        }
    `;
    document.head.appendChild(chatStyles);

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
    let mutationTimeout;
    const warningObserver = new MutationObserver((mutations) => {
        let shouldProcess = false;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                shouldProcess = true;
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processWarningElements(node);
                        processFocusWarningElements(node);
                    }
                });
            }
        });

        if (shouldProcess) {
            // Debounce the fixed element offset to avoid performance hits
            if (mutationTimeout) clearTimeout(mutationTimeout);
            mutationTimeout = setTimeout(() => {
                const barHeight = focusBar.offsetHeight;
                if (focusBar.style.display !== 'none' && barHeight > 0) {
                    offsetFixedElements(barHeight);
                }
            }, 100);
        }
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
            document.documentElement.style.marginTop = '0';
            restoreFixedElements();
            return;
        }

        focusText.textContent = focusData.mainFocus;
        linksContainer.innerHTML = '';

        if (focusData.links) {
            focusData.links.forEach(({ key, value }) => {
                const link = document.createElement('a');
                // Ensure URL is absolute
                let url = value;
                if (!url.match(/^https?:\/\//i)) {
                    url = 'https://' + url;
                }
                link.href = url;
                // Truncate label to 15 chars max
                const maxLen = 15;
                const displayLabel = key.length > maxLen ? key.substring(0, maxLen) + '…' : key;
                link.textContent = displayLabel;
                link.title = key; // Full label on hover
                link.style.cssText = `
                    color: #ffd700;
                    text-decoration: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    background-color: #2a2a2a;
                    border: 1px solid #ffd700;
                    transition: all 0.3s ease;
                    margin: 0 3px;
                    font-size: 13px;
                    white-space: nowrap;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
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
        // Set margin based on actual bar height after it's rendered
        requestAnimationFrame(() => {
            const barHeight = focusBar.offsetHeight;
            document.documentElement.style.marginTop = barHeight + 'px';

            // Also offset fixed-position elements that are at the top
            offsetFixedElements(barHeight);
        });
    }

    // Track elements we've modified so we can restore them
    const modifiedFixedElements = new Map();

    // Function to offset fixed-position elements at top: 0
    function offsetFixedElements(barHeight) {
        if (!barHeight && focusBar.style.display !== 'none') {
            barHeight = focusBar.offsetHeight;
        } else if (!barHeight) {
            return;
        }

        // Find all elements with position: fixed
        // We select * to be safe, though this can be expensive on huge pages. 
        // Optimized to check computed style only if likely candidate.
        const allElements = document.querySelectorAll('header, nav, div, [class*="header"], [class*="nav"], [class*="bar"], [class*="menu"]');

        allElements.forEach(el => {
            // Skip our own elements
            if (el === focusBar || el === hoverBox || focusBar.contains(el) || el.id === 'focus-extension-import-overlay') {
                return;
            }

            // Optimization: skip hidden elements
            if (el.offsetParent === null) return;

            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
                const topValue = parseInt(style.top, 10);
                const rect = el.getBoundingClientRect();

                // If element is visually within the area the bar would cover
                // We checks style.top specifically or if it's 'auto' but visually at top
                let isAtTop = false;

                // Threshold: if element is in the top header area
                const threshold = barHeight || 50;

                if (style.top !== 'auto' && !isNaN(topValue) && topValue >= 0 && topValue < threshold) {
                    isAtTop = true;
                } else if (style.top === 'auto' && rect.top < threshold) {
                    isAtTop = true;
                }

                if (isAtTop) {
                    // Store original value if we haven't already
                    if (!modifiedFixedElements.has(el)) {
                        modifiedFixedElements.set(el, {
                            originalTop: el.style.top,
                            originalTransition: el.style.transition
                        });
                        // Add transition for smooth movement
                        el.style.transition = (el.style.transition ? el.style.transition + ', ' : '') + 'top 0.3s ease';
                    }

                    // Calculate new top
                    // If it was 'auto', we need to set it to an explicit pixel value relative to the viewport
                    // But wait, if it was 'auto' and 'fixed', it's positioned based on flow or 0. 
                    // Safest is to add the bar height to whatever the current visual top is, OR if it's 0, set to barHeight.

                    // Simple approach: if we determined it's at Top 0, set top to barHeight.
                    // If it had an explicit top (e.g. 0px), we change it to barHeight.

                    // However, we must be careful not to apply it double if we run this multiple times.
                    // The 'modifiedFixedElements' check prevents re-storing original, but we need to ensure we don't add barHeight to already modified value.
                    // actually, we should calculate target top based on original.

                    const originalData = modifiedFixedElements.get(el);
                    let baseTop = 0;
                    if (originalData.originalTop && originalData.originalTop !== 'auto') {
                        baseTop = parseInt(originalData.originalTop, 10) || 0;
                    }

                    el.style.top = (baseTop + barHeight) + 'px';
                }
            }
        });
    }

    // Function to restore fixed elements when focus bar is hidden
    function restoreFixedElements() {
        modifiedFixedElements.forEach((data, el) => {
            if (el && el.style) {
                el.style.top = data.originalTop;
                if (data.originalTransition !== undefined) {
                    el.style.transition = data.originalTransition;
                } else {
                    el.style.removeProperty('transition');
                }
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

    // Improved hover behavior with stable expansion
    // (Variables declared above)

    // Remove the blocking hover zone and use mousemove on document instead
    document.addEventListener('mousemove', (e) => {
        // Expand if mouse is at the very top of screen
        if (e.clientY <= 10 && !isExpanded) {
            expandBar();
        }
    });

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
        rightButtonContainer.style.opacity = '1';
        rightButtonContainer.style.pointerEvents = 'auto';

        // Update html margin
        requestAnimationFrame(() => {
            const barHeight = focusBar.offsetHeight;
            document.documentElement.style.marginTop = barHeight + 'px';
            offsetFixedElements(barHeight);
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
        rightButtonContainer.style.opacity = '0';
        rightButtonContainer.style.pointerEvents = 'none';

        requestAnimationFrame(() => {
            const barHeight = focusBar.offsetHeight;
            document.documentElement.style.marginTop = barHeight + 'px';
            offsetFixedElements(barHeight);
        });
    }

    function scheduleCollapse() {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout);
        }
        leaveTimeout = setTimeout(() => {
            // Double-check mouse isn't over the bar or hover zone
            if (!focusBar.matches(':hover')) {
                collapseBar();
            }
        }, 300);
    }

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
    chatBtn.style.pointerEvents = 'auto';
    chatPopup.style.pointerEvents = 'auto';

    // Listen for focus mode changes from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'FOCUS_MODE_CHANGED') {
            // Refresh focus bar by reloading from storage
            chrome.storage.sync.get(['focusMode'], function (result) {
                const focusMode = result.focusMode;
                if (focusMode && focusMode.enabled) {
                    const activeFocus = focusMode.focuses?.find(f => f.active);
                    if (activeFocus) {
                        // Show the focus bar
                        focusBar.style.display = 'flex';

                        // Update the focus name
                        focusText.textContent = activeFocus.name || 'Focus';

                        // Update links
                        // Clear existing links except action buttons
                        Array.from(linksContainer.children).forEach(child => {
                            if (!child.classList.contains('focus-action-btn')) {
                                child.remove();
                            }
                        });

                        // Add new links
                        if (activeFocus.links) {
                            const maxLabelLen = 20;
                            activeFocus.links.forEach(link => {
                                const linkEl = document.createElement('a');
                                linkEl.href = link.value;
                                linkEl.target = '_blank';
                                const fullLabel = link.key || link.value;
                                const truncated = fullLabel.length > maxLabelLen
                                    ? fullLabel.slice(0, maxLabelLen - 1) + '…'
                                    : fullLabel;
                                linkEl.textContent = truncated;
                                if (fullLabel.length > maxLabelLen) {
                                    linkEl.title = fullLabel;
                                }
                                linkEl.style.cssText = `
                                    color: #ffd700;
                                    text-decoration: none;
                                    margin: 0 4px;
                                    padding: 3px 6px;
                                    border-radius: 3px;
                                    background: #333;
                                    font-size: 11px;
                                    transition: opacity 0.2s;
                                    pointer-events: auto;
                                `;
                                linksContainer.insertBefore(linkEl, linksContainer.querySelector('.focus-action-btn'));
                            });
                        }

                        sendResponse({ success: true });
                    }
                }
            });
            return true; // Keep channel open for async
        }
    });
}

