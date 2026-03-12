document.addEventListener('DOMContentLoaded', () => {
    const enableCollectionEl = document.getElementById('enableCollection');
    const endpointUrlEl = document.getElementById('endpointUrl');
    const secretTokenEl = document.getElementById('secretToken');
    const whitelistEl = document.getElementById('whitelist');
    const saveBtn = document.getElementById('saveBtn');
    const statusEl = document.getElementById('status');

    // Load existing settings
    chrome.storage.sync.get(['textCollection'], (result) => {
        const config = result.textCollection || {
            enabled: false,
            endpointUrl: 'https://uxryvxgcjinblynpjrzc.supabase.co/functions/v1/ingest-screen-text',
            secretToken: '',
            whitelist: []
        };

        enableCollectionEl.checked = config.enabled;
        endpointUrlEl.value = config.endpointUrl || '';
        secretTokenEl.value = config.secretToken || '';
        whitelistEl.value = Array.isArray(config.whitelist) ? config.whitelist.join('\n') : '';
    });

    // Save settings
    saveBtn.addEventListener('click', () => {
        // Parse whitelist domains, removing empty lines and trimming whitespace
        const whitelist = whitelistEl.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const config = {
            enabled: enableCollectionEl.checked,
            endpointUrl: endpointUrlEl.value.trim(),
            secretToken: secretTokenEl.value.trim(),
            whitelist: whitelist
        };

        chrome.storage.sync.set({ textCollection: config }, () => {
            statusEl.textContent = 'Settings saved successfully!';
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
        });
    });
});
