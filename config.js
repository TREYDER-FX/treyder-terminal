// ============================================
// ТАНЗИМОТИ АСОСӢ
// ============================================
const CONFIG = {
    // API Калидҳо
    BINANCE_API_KEY: 'EkEXMtHmjuOZn8xdMwb9XxjPMRAdOrvl5jRRsiykKsRUjFrVoFdOY4RUrqloQ7Bs',
    BINANCE_API_SECRET: 'IJqPbUPk7HJLwakHsKmmeSEMWPRWwecoGDFMPQiFDl0pzyOpsjm9YITo3uquZ',
    USE_DEMO: true,
    
    TWELVE_DATA_KEY: 'b8d239ba6c40418e9dcb6ee95fa3c5ec',
    FINNHUB_KEY: 'd90ge1r01qt60a9asm6',
    FCS_API_KEY: 'zNCHrCSxsvNIWUT5KJBprma',
    
    // Танзимоти API
    TIMEOUT: 5000,
    RETRY: 3,
    CACHE: 2000,
    
    // Танзимоти индикаторҳо
    RSI_PERIOD: 14,
    STOCH_PERIOD: 14,
    MACD_FAST: 12,
    MACD_SLOW: 26,
    MACD_SIGNAL: 9,
    EMA_PERIOD: 200,
    ADX_PERIOD: 14,
    BB_PERIOD: 20,
    BB_MULT: 2,
    SAR_STEP: 0.02,
    SAR_MAX: 0.2,
    
    // SL/TP
    SL_MULT: 1.5,
    TP_MULT: 2,
    
    // Таймфреймҳо
    TIMEFRAMES: {
        '1': '1m', '3': '3m', '5': '5m', '15': '15m', '30': '30m', '60': '1h',
        'forex': {'1':'1min','3':'3min','5':'5min','15':'15min','30':'30min','60':'1h'},
        'bybit': {'1':'1','3':'3','5':'5','15':'15','30':'30','60':'60'},
        'okx': {'1':'1m','3':'3m','5':'5m','15':'15m','30':'30m','60':'1H'}
    },
    DEFAULT_TF: '1'
};
