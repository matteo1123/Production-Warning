// Onboarding page - consent button handlers
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('enableBtn').addEventListener('click', function () {
        chrome.storage.sync.set({ dataSharingConsent: true }, function () {
            alert('Thank you! Your anonymous data will help us improve PW Focus. Enjoy!');
            window.close();
        });
    });

    document.getElementById('disableBtn').addEventListener('click', function () {
        chrome.storage.sync.set({ dataSharingConsent: false }, function () {
            alert('No problem! All features still work normally. You can opt in anytime in Settings.');
            window.close();
        });
    });
});
