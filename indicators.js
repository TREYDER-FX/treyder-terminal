// ============================================
// 8 ИНДИКАТОРИ ТЕХНИКӢ
// ============================================

class IndicatorEngine {
    static RSI(closes, period = CONFIG.RSI_PERIOD) {
        if (closes.length < period + 1) return null;
        let gains = 0, losses = 0;
        for (let i = closes.length - period; i < closes.length; i++) {
            const d = closes[i] - closes[i - 1];
            if (d >= 0) gains += d;
            else losses -= d;
        }
        const avgG = gains / period, avgL = losses / period;
        if (avgL === 0) return 100;
        return 100 - (100 / (1 + avgG / avgL));
    }

    static EMA_Series(values, period) {
        if (values.length < period) return null;
        const k = 2 / (period + 1);
        const out = [];
        let sma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
        out[period - 1] = sma;
        let ema = sma;
        for (let i = period; i < values.length; i++) { ema = values[i] * k + ema * (1 - k); out[i] = ema; }
        return out;
    }

    static EMA(closes, period = CONFIG.EMA_PERIOD) {
        if (closes.length < period) return null;
        const k = 2 / (period + 1);
        let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
        for (let i = period; i < closes.length; i++) { ema = closes[i] * k + ema * (1 - k); }
        return ema;
    }

    static MACD(closes, fast = CONFIG.MACD_FAST, slow = CONFIG.MACD_SLOW, signal = CONFIG.MACD_SIGNAL) {
        if (closes.length < slow + signal) return { macd: null, histogram: null };
        const fS = this.EMA_Series(closes, fast);
        const sS = this.EMA_Series(closes, slow);
        const macdLine = [];
        for (let i = slow - 1; i < closes.length; i++) macdLine.push(fS[i] - sS[i]);
        const sigS = this.EMA_Series(macdLine, signal);
        const macd = macdLine[macdLine.length - 1];
        const sig = sigS ? sigS[sigS.length - 1] : null;
        return { macd, histogram: sig !== null ? macd - sig : null };
    }

    static Stochastic(highs, lows, closes, period = CONFIG.STOCH_PERIOD) {
        if (closes.length < period) return null;
        const hh = Math.max(...highs.slice(-period));
        const ll = Math.min(...lows.slice(-period));
        const c = closes[closes.length - 1];
        if (hh === ll) return 50;
        return ((c - ll) / (hh - ll)) * 100;
    }

    static ATR(highs, lows, closes, period = 14) {
        if (closes.length < period + 1) return null;
        const trs = [];
        for (let i = closes.length - period; i < closes.length; i++) {
            const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
            trs.push(tr);
        }
        return trs.reduce((a, b) => a + b, 0) / trs.length;
    }

    static ADX(highs, lows, closes, period = CONFIG.ADX_PERIOD) {
        const n = closes.length;
        if (n < period * 2 + 1) return null;
        const plusDM = [], minusDM = [], tr = [];
        for (let i = 1; i < n; i++) {
            const upMove = highs[i] - highs[i - 1];
            const downMove = lows[i - 1] - lows[i];
            plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
            minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
            tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
        }
        const wilderSum = (arr, p) => {
            const out = new Array(arr.length);
            let sum = arr.slice(0, p).reduce((a, b) => a + b, 0);
            out[p - 1] = sum;
            for (let i = p; i < arr.length; i++) { sum = sum - (sum / p) + arr[i]; out[i] = sum; }
            return out;
        };
        const trS = wilderSum(tr, period);
        const pdmS = wilderSum(plusDM, period);
        const mdmS = wilderSum(minusDM, period);
        const dxArr = [];
        for (let i = period - 1; i < tr.length; i++) {
            if (!trS[i]) { dxArr.push(0); continue; }
            const pDI = 100 * pdmS[i] / trS[i];
            const mDI = 100 * mdmS[i] / trS[i];
            dxArr.push((pDI + mDI) === 0 ? 0 : 100 * Math.abs(pDI - mDI) / (pDI + mDI));
        }
        if (dxArr.length < period) return null;
        let adx = dxArr.slice(0, period).reduce((a, b) => a + b, 0) / period;
        for (let i = period; i < dxArr.length; i++) { adx = ((adx * (period - 1)) + dxArr[i]) / period; }
        return adx;
    }

    static Bollinger(closes, period = CONFIG.BB_PERIOD, mult = CONFIG.BB_MULT) {
        if (closes.length < period) return null;
        const slice = closes.slice(-period);
        const sma = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
        const sd = Math.sqrt(variance);
        const upper = sma + mult * sd, lower = sma - mult * sd;
        const price = closes[closes.length - 1];
        const percentB = (upper - lower) === 0 ? 0.5 : (price - lower) / (upper - lower);
        return { sma, upper, lower, percentB };
    }

    static ParabolicSAR(highs, lows, step = CONFIG.SAR_STEP, maxStep = CONFIG.SAR_MAX) {
        const n = highs.length;
        if (n < 5) return null;
        let isUp = highs[1] >= highs[0];
        let sar = isUp ? Math.min(...lows.slice(0, 2)) : Math.max(...highs.slice(0, 2));
        let ep = isUp ? highs[1] : lows[1];
        let af = step;
        for (let i = 2; i < n; i++) {
            sar = sar + af * (ep - sar);
            if (isUp) {
                sar = Math.min(sar, lows[i - 1], lows[i - 2]);
                if (lows[i] < sar) { isUp = false; sar = ep; ep = lows[i]; af = step; }
                else { if (highs[i] > ep) { ep = highs[i]; af = Math.min(af + step, maxStep); } }
            } else {
                sar = Math.max(sar, highs[i - 1], highs[i - 2]);
                if (highs[i] > sar) { isUp = true; sar = ep; ep = highs[i]; af = step; }
                else { if (lows[i] < ep) { ep = lows[i]; af = Math.min(af + step, maxStep); } }
            }
        }
        return { sar, trend: isUp ? 'bullish' : 'bearish' };
    }

    static VWAP(highs, lows, closes, volumes) {
        if (!volumes || volumes.some(v => !v && v !== 0)) return null;
        let cumPV = 0, cumV = 0;
        for (let i = 0; i < closes.length; i++) {
            const typical = (highs[i] + lows[i] + closes[i]) / 3;
            cumPV += typical * volumes[i];
            cumV += volumes[i];
        }
        if (cumV === 0) return null;
        return cumPV / cumV;
    }

    static getAll(candles) {
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume);
        const price = closes[closes.length - 1];

        const rsi = this.RSI(closes);
        const macd = this.MACD(closes);
        const ema200 = this.EMA(closes);
        const stoch = this.Stochastic(highs, lows, closes);
        const atr = this.ATR(highs, lows, closes);
        const adx = this.ADX(highs, lows, closes);
        const bb = this.Bollinger(closes);
        const vwap = this.VWAP(highs, lows, closes, volumes);
        const sar = this.ParabolicSAR(highs, lows);

        const signals = [];
        if (rsi !== null) signals.push(rsi < 30 ? 'bullish' : rsi > 70 ? 'bearish' : 'neutral');
        if (macd.histogram !== null) signals.push(macd.histogram > 0 ? 'bullish' : 'bearish');
        if (ema200 !== null) signals.push(price > ema200 ? 'bullish' : 'bearish');
        if (stoch !== null) signals.push(stoch < 20 ? 'bullish' : stoch > 80 ? 'bearish' : 'neutral');
        if (bb !== null) signals.push(bb.percentB < 0.1 ? 'bullish' : bb.percentB > 0.9 ? 'bearish' : 'neutral');
        if (sar !== null) signals.push(sar.trend);

        const bull = signals.filter(s => s === 'bullish').length;
        const bear = signals.filter(s => s === 'bearish').length;
        const bias = bull > bear ? 'bullish' : bear > bull ? 'bearish' : 'neutral';

        const sl = atr !== null && bias !== 'neutral' ? 
            (bias === 'bullish' ? price - atr * CONFIG.SL_MULT : price + atr * CONFIG.SL_MULT) : null;
        const tp = atr !== null && bias !== 'neutral' ?
            (bias === 'bullish' ? price + atr * CONFIG.TP_MULT : price - atr * CONFIG.TP_MULT) : null;

        return {
            price, rsi, macd, ema200, stoch, atr, adx, bb, vwap, sar,
            bias, signals, bull, bear,
            sl, tp,
            agreement: `${bull+bear}/${signals.length}`
        };
    }
}
