// URL utility functions
export function validateUrl(url) {
    if (!url.match(/^https?:\/\//i)) {
        return 'https://' + url;
    }
    return url;
}

export function isTargetUrl(url, targetUrl1, targetUrl2) {
    return (targetUrl1 && url.includes(targetUrl1)) || 
           (targetUrl2 && url.includes(targetUrl2));
} 