// ============================================
// API ENGINE — 6 API БО FALLBACK
// ============================================

class APIManager {
    constructor() {
        this.sources = [
            { name: 'Binance', fetch: this.fetchBinance.bind(this) },
            { name: 'TwelveData', fetch: this.fetchTwelveData.bind(this) },
            { name: 'Finnhub', fetch: this.fetchFinnhub.bind(this) },
            { name: 'FCSAPI', fetch: this.fetchFCSAPI.bind(this) }
        ];
        this.cache = new Map();
        this.currentSource = null;
    }

    async fetchBinance(symbol, tf) {
        const interval = CONFIG.TIMEFRAMES[tf] || '1m';
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=210`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();
        return data.map(c => ({ open:+c[1], high:+c[2], low:+c[3], close:+c[4], volume:+c[5] }));
    }

    async fetchTwelveData(symbol, tf) {
        const interval = CONFIG.TIMEFRAMES.forex[tf] || '1min';
        const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=210&apikey=${CONFIG.TWELVE_DATA_KEY}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();
        if (data.status === 'error') throw new Error(data.message);
        return data.values.map(v => ({ open:+v.open, high:+v.high, low:+v.low, close:+v.close }));
    }

    async fetchFinnhub(symbol, tf) {
        const now = Math.floor(Date.now() / 1000);
        const from = now - 3600 * 24 * 7;
        const url = `https://finnhub.io/api/v1/forex/candle?symbol=${symbol}&resolution=${tf}&from=${from}&to=${now}&token=${CONFIG.FINNHUB_KEY}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();
        if (!data.c) throw new Error('Finnhub маълумот нест');
        return data.c.map((close, i) => ({ open:data.o[i], high:data.h[i], low:data.l[i], close, volume:data.v ? data.v[i] : 0 }));
    }

    async fetchFCSAPI(symbol, tf) {
        const interval = CONFIG.TIMEFRAMES.forex[tf] || '1min';
        const url = `https://fcsapi.com/api-v3/forex/history?symbol=${symbol}&period=${interval}&limit=100&access_key=${CONFIG.FCS_API_KEY}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();
        if (data.status !== 'success') throw new Error(data.message);
        return data.response.map(c => ({ open:+c.o, high:+c.h, low:+c.l, close:+c.c, volume:+c.v || 0 }));
    }

    async fetchWithTimeout(url, retries = CONFIG.RETRY) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (e) {
            clearTimeout(timeout);
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 1000));
                return this.fetchWithTimeout(url, retries - 1);
            }
            throw e;
        }
    }

    async getCandles(symbol, tf, platform = 'binance') {
        const cacheKey = `${symbol}:${tf}:${platform}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < CONFIG.CACHE) {
            this.currentSource = 'Cache';
            return cached.data;
        }

        const sourceMap = {
            'binance': this.fetchBinance.bind(this),
            'forex': this.fetchTwelveData.bind(this),
            'otc': this.fetchTwelveData.bind(this)
        };

        if (sourceMap[platform]) {
            try {
                const data = await sourceMap[platform](symbol, tf);
                this.cache.set(cacheKey, { data, time: Date.now() });
                this.currentSource = platform.charAt(0).toUpperCase() + platform.slice(1);
                return data;
            } catch (e) {
                console.warn(`${platform} ноком шуд:`, e.message);
            }
        }

        for (const source of this.sources) {
            try {
                const data = await source.fetch(symbol, tf);
                this.cache.set(cacheKey, { data, time: Date.now() });
                this.currentSource = source.name;
                return data;
            } catch (e) {
                console.warn(`${source.name} ноком шуд:`, e.message);
            }
        }
        throw new Error('Ҳамаи APIҳо ноком шуданд');
    }

    getCurrentSource() { return this.currentSource || '--'; }
}

const apiManager = new APIManager();
