const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
    production: !isLocal,
    apiUrl: isLocal ? 'http://localhost:8000/api' : 'https://backveridata.hackeruna.com/api',
    appName: 'Veridata',
    version: '2.3.0',
};
