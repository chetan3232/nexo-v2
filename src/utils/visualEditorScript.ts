export const VISUAL_EDITOR_SCRIPT = `
(function() {
    console.log("NEXO Visual Editor Active");

    // Catch window errors and forward them
    window.addEventListener('error', (e) => {
        window.parent.postMessage({
            type: 'NEXO_RUNTIME_ERROR',
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            error: e.error ? { message: e.error.message, stack: e.error.stack } : null
        }, '*');
    });

    window.addEventListener('unhandledrejection', (e) => {
        window.parent.postMessage({
            type: 'NEXO_RUNTIME_ERROR',
            message: e.reason?.message || String(e.reason),
            error: e.reason ? { message: e.reason.message, stack: e.reason.stack } : null
        }, '*');
    });
    
    let selectedElement = null;
    const highlight = document.createElement('div');
    highlight.style.position = 'absolute';
    highlight.style.border = '2px solid #6366f1';
    highlight.style.pointerEvents = 'none';
    highlight.style.zIndex = '100000';
    highlight.style.transition = 'all 0.1s ease';
    highlight.style.display = 'none';
    highlight.style.background = 'rgba(99, 102, 241, 0.05)';
    document.body.appendChild(highlight);

    document.addEventListener('mouseover', (e) => {
        if (!window.isNexoVisualMode) return;
        const target = e.target;
        if (target === highlight || target === document.body || target === document.documentElement) return;
        
        const rect = target.getBoundingClientRect();
        highlight.style.top = (rect.top + window.scrollY) + 'px';
        highlight.style.left = (rect.left + window.scrollX) + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        highlight.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!window.isNexoVisualMode) return;
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target;
        selectedElement = target;
        
        // Safe serialize computed style key visual properties to prevent DOMExceptions
        const computed = window.getComputedStyle(target);
        const styleKeys = [
            'color', 'backgroundColor', 'borderColor', 'borderRadius', 
            'padding', 'margin', 'fontSize', 'fontWeight', 'fontFamily',
            'width', 'height', 'display', 'flexDirection', 'gap', 
            'justifyContent', 'alignItems', 'opacity', 'boxShadow', 'borderWidth'
        ];
        const stylesObj = {};
        styleKeys.forEach(k => {
            stylesObj[k] = computed[k] || '';
        });
        
        const payload = {
            id: target.id || 'anonymous-' + Math.random().toString(36).substr(2, 9),
            tagName: target.tagName,
            text: target.innerText || '',
            styles: stylesObj,
            rect: target.getBoundingClientRect()
        };
        
        window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            ...payload
        }, '*');
        
        window.parent.postMessage({
            type: 'NEXO_ELEMENT_SELECTED',
            ...payload
        }, '*');
    });

    window.addEventListener('message', (e) => {
        if (e.data.type === 'SET_VISUAL_MODE') {
            window.isNexoVisualMode = e.data.enabled;
            if (!e.data.enabled) highlight.style.display = 'none';
        }
        if ((e.data.type === 'APPLY_STYLE' || e.data.type === 'UPDATE_STYLE') && selectedElement) {
            Object.assign(selectedElement.style, e.data.styles);
            window.parent.postMessage({
                type: 'STYLE_SYNCED',
                id: selectedElement.id,
                styles: e.data.styles
            }, '*');
        }
    });
})();
`;
