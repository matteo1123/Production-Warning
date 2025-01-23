// Wait for the DOM to be fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements we'll need to interact with
    const targetUrl1Input = document.getElementById('targetUrl1');
    const targetUrl2Input = document.getElementById('targetUrl2');
    const saveButton = document.getElementById('save');

    // Load previously saved URLs from Chrome's sync storage
    // This ensures persistence across browser sessions
    chrome.storage.sync.get(['targetUrl1', 'targetUrl2'], function(result) {
        // Populate input fields with saved values, or empty string if none exist
        targetUrl1Input.value = result.targetUrl1 || '';
        targetUrl2Input.value = result.targetUrl2 || '';
    });

    // Add click handler for the save button
    saveButton.addEventListener('click', function() {
        // Save both URLs to Chrome's sync storage
        chrome.storage.sync.set({
            targetUrl1: targetUrl1Input.value,
            targetUrl2: targetUrl2Input.value
        }, function() {
            // Show confirmation message once save is complete
            alert('Settings saved!');
        });
    });
}); 