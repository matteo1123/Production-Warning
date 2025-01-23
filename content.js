// Only inject the focus bar if we're in the main window, not an iframe
if (window === window.top) {
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
        padding: 4px 0;
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
    
    toggleButton.addEventListener('mouseover', function() {
        toggleButton.style.backgroundColor = '#cc0000';
        toggleButton.style.borderColor = '#cc0000';
        toggleButton.style.color = '#ffffff';
    });
    
    toggleButton.addEventListener('mouseout', function() {
        toggleButton.style.backgroundColor = 'transparent';
        toggleButton.style.borderColor = '#ffd700';
        toggleButton.style.color = '#ffd700';
    });
    
    toggleButton.addEventListener('click', function() {
        chrome.storage.sync.get(['focusMode'], function(result) {
            const focusMode = result.focusMode || {};
            focusMode.enabled = false;
            chrome.storage.sync.set({ focusMode }, function() {
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

    let targetUrl1 = "";
    let targetUrl2 = "";

    // Function to check if URL matches either target
    function isTargetUrl(url) {
        return (targetUrl1 && url.includes(targetUrl1)) || (targetUrl2 && url.includes(targetUrl2));
    }

    // Function to add hover listeners to an element
    function addHoverListeners(element) {
        element.addEventListener('mouseover', function(e) {
                hoverBox.textContent = "Production!";
                hoverBox.style.display = 'block';
                hoverBox.style.left = e.pageX + 10 + 'px';
                hoverBox.style.top = e.pageY + 10 + 'px';
        });

        element.addEventListener('mouseout', function() {
            hoverBox.style.display = 'none';
        });
    }

    // Function to process elements (for production warning)
    function processElements(rootElement) {
        if (isTargetUrl(window.location.href)) {
            // Process regular elements, excluding form inputs
            rootElement.querySelectorAll("a, button, div.switch, label, iframe").forEach(element => {
                // Don't add hover warning to elements inside the focus bar
                if (!focusBar.contains(element)) {
                    addHoverListeners(element);
                }
            });

            // Process iframes
            rootElement.querySelectorAll("iframe").forEach(iframe => {
                try {
                    if (iframe.contentDocument) {
                        processElements(iframe.contentDocument);
                        observer.observe(iframe.contentDocument.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                } catch {} // No need to log cross-origin errors
            });
        }
    }

    // Simplify the mutation observer code
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    processElements(node);
                }
            });
        });
    });

    // Remove verbose logging here
    chrome.storage.sync.get(['targetUrl1', 'targetUrl2'], function(result) {
        targetUrl1 = result.targetUrl1 || "";
        targetUrl2 = result.targetUrl2 || "";
        processElements(document);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    // Function to update focus bar
    function updateFocusBar(focusData) {
        if (!focusData || !focusData.enabled) {
            focusBar.style.display = 'none';
            document.body.style.paddingTop = '0';
            return;
        }

        focusText.textContent = focusData.mainFocus;
        linksContainer.innerHTML = '';
        
        if (focusData.links) {
            focusData.links.forEach(({key, value}) => {
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
                link.addEventListener('mouseover', function() {
                    this.style.backgroundColor = '#cc0000';
                    this.style.borderColor = '#cc0000';
                    this.style.color = '#ffffff';
                });
                link.addEventListener('mouseout', function() {
                    this.style.backgroundColor = '#2a2a2a';
                    this.style.borderColor = '#ffd700';
                    this.style.color = '#ffd700';
                });
                linksContainer.appendChild(link);
            });
        }
        
        focusBar.style.display = 'block';
        document.body.style.paddingTop = '2px';
    }

    // Listen for focus mode updates
    chrome.storage.sync.get(['focusMode'], function(result) {
        if (result.focusMode) {
            updateFocusBar(result.focusMode);
        }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.focusMode) {
            updateFocusBar(changes.focusMode.newValue);
        }
    });

    // Update hover behavior
    let leaveTimeout;
    
    focusBar.addEventListener('mouseenter', function() {
        if (leaveTimeout) {
            clearTimeout(leaveTimeout);
        }
        focusBar.style.padding = '8px 0';
        focusLabel.style.opacity = '1';
        focusLabel.style.height = 'auto';
        mainFocus.style.fontSize = '18px';
        linksContainer.style.opacity = '1';
        linksContainer.style.height = 'auto';
        linksContainer.style.marginTop = '8px';
        logoContainer.style.opacity = '1';
        logoContainer.style.height = 'auto';
        document.body.style.paddingTop = focusBar.offsetHeight + 'px';
    });

    focusBar.addEventListener('mouseleave', function(e) {
        // Check if we're moving to a child element
        const relatedTarget = e.relatedTarget;
        if (focusBar.contains(relatedTarget)) {
            return;
        }

        // Add delay before hiding
        leaveTimeout = setTimeout(() => {
            // Check if mouse has returned to the focus bar
            if (focusBar.matches(':hover') || linksContainer.matches(':hover')) {
                return;
            }
            
            focusBar.style.padding = '4px 0';
            focusLabel.style.opacity = '0';
            focusLabel.style.height = '0';
            mainFocus.style.fontSize = '14px';
            linksContainer.style.opacity = '0';
            linksContainer.style.height = '0';
            linksContainer.style.marginTop = '0';
            logoContainer.style.opacity = '0';
            logoContainer.style.height = '0';
            document.body.style.paddingTop = focusBar.offsetHeight + 'px';
        }, 200); // 200ms delay
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

    mainFocus.addEventListener('mouseover', function() {
        mainFocus.style.color = '#cc0000';
    });

    mainFocus.addEventListener('mouseout', function() {
        mainFocus.style.color = '#ffd700';
    });

    mainFocus.addEventListener('click', function() {
        chrome.storage.sync.get(['focusMode'], function(result) {
            if (result.focusMode && result.focusMode.links) {
                result.focusMode.links.forEach(({value}) => {
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


