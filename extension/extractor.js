// Text extractor script - injected into tabs to extract visible content
// This script extracts meaningful text content from the page for AI analysis

(function () {
    // Skip if already extracted in this run
    if (window.__focusTextExtracted) {
        return window.__focusExtractedData;
    }
    window.__focusTextExtracted = true;

    /**
     * Extract text content from the page, filtering out noise
     */
    function extractPageContent() {
        // Elements to skip (typically navigation, ads, etc.)
        const skipSelectors = [
            'nav', 'header', 'footer', 'aside',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '.nav', '.navbar', '.navigation', '.header', '.footer', '.sidebar',
            '.ad', '.ads', '.advertisement', '.social-share',
            'script', 'style', 'noscript', 'iframe', 'svg',
            '[aria-hidden="true"]', '.hidden', '[hidden]'
        ];

        // Get all text nodes from the body
        const body = document.body;
        if (!body) {
            return { url: window.location.href, title: document.title, content: '', charCount: 0 };
        }

        // Clone the body to manipulate without affecting the page
        const clone = body.cloneNode(true);

        // Remove elements we want to skip
        skipSelectors.forEach(selector => {
            try {
                clone.querySelectorAll(selector).forEach(el => el.remove());
            } catch (e) {
                // Invalid selector, skip
            }
        });

        // Get the text content
        let text = clone.innerText || clone.textContent || '';

        // Clean up the text
        text = text
            .replace(/\s+/g, ' ')           // Collapse whitespace
            .replace(/\n\s*\n/g, '\n\n')    // Normalize line breaks
            .trim();

        // Truncate if too long (aim for ~4000 chars per page for reasonable API usage)
        const maxLength = 4000;
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + '... [truncated]';
        }

        const result = {
            url: window.location.href,
            title: document.title || 'Untitled',
            content: text,
            charCount: text.length
        };

        window.__focusExtractedData = result;
        return result;
    }

    return extractPageContent();
})();
