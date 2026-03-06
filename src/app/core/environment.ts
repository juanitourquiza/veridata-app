const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
    production: !isLocal,
    apiUrl: isLocal ? 'http://localhost:8000/api' : 'https://phplaravel-1212383-6257708.cloudwaysapps.com/api',
    appName: 'Veridata',
    version: '1.0.0',
};
