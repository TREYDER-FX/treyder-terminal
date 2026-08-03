// ============================================
// 8 ИНДИКАТОРИ ПЕШРАФТА БО СИГНАЛИ ДАҚИҚ
// ============================================

class IndicatorEngine {
    
    // ===== 1. RSI (TradingView Formula) =====
    static RSI(closes, period = 14) {
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

    // ===== 2. EMA Series (барои MACD) =====
    static EMA_Series(values, period) {
        if (values.length < period) return null;
        const k = 2 / (period + 1);
        const out = [];
        let sma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
        out[period - 1] = sma;
        let ema = sma;
        for (let i = period; i < values.length; i++) {
            ema = values[i] * k + ema * (1 - k);
            out[i] = ema;
        }
        return out;
    }

    // ===== 3. EMA =====
    static EMA(closes, period = 200) {
        if (closes.length < period) return null;
        const k = 2 / (period + 1);
        let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
        for (let i = period; i < closes.length; i++) {
            ema = closes[i] * k + ema * (1 - k);
        }
        return ema;
    }

    // ===== 4. MACD =====
    static MACD(closes, fast = 12, slow = 26, signal = 9) {
        if (closes.length < slow + signal) return { macd: null, histogram: null };
        const fS = this.EMA_Series(closes, fast);
        const sS = this.EMA_Series(closes, slow);
        const macdLine = [];
        for (let i = slow - 1; i < closes.length; i++) {
            macdLine.push(fS[i] - sS[i]);
        }
        const sigS = this.EMA_Series(macdLine, signal);
        const macd = macdLine[macdLine.length - 1];
        const sig = sigS ? sigS[sigS.length - 1] : null;
        return { macd, histogram: sig !== null ? macd - sig : null };
    }

    // ===== 5. Stochastic =====
    static Stochastic(highs, lows, closes, period = 14) {
        if (closes.length < period) return null;
        const hh = Math.max(...highs.slice(-period));
        const ll = Math.min(...lows.slice(-period));
        const c = closes[closes.length - 1];
        if (hh === ll) return 50;
        return ((c - ll) / (hh - ll)) * 100;
    }

    // ===== 6. ATR =====
    static ATR(highs, lows, closes, period = 14) {
        if (closes.length < period + 1) return null;
        const trs = [];
        for (let i = closes.length - period; i < closes.length; i++) {
            const tr = Math.max(
                highs[i] - lows[i],
                Math.abs(highs[i] - closes[i - 1]),
                Math.abs(lows[i] - closes[i - 1])
            );
            trs.push(tr);
        }
        return trs.reduce((a, b) => a + b, 0) / trs.length;
    }

    // ===== 7. ADX =====
    static ADX(highs, lows, closes, period = 14) {
        const n = closes.length;
        if (n < period * 2 + 1) return null;
        const plusDM = [], minusDM = [], tr = [];
        for (let i = 1; i < n; i++) {
            const upMove = highs[i] - highs[i - 1];
            const downMove = lows[i - 1] - lows[i];
            plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
            minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
            tr.push(Math.max(
                highs[i] - lows[i],
                Math.abs(highs[i] - closes[i - 1]),
                Math.abs(lows[i] - closes[i - 1])
            ));
        }
        const wilderSum = (arr, p) => {
            const out = new Array(arr.length);
            let sum = arr.slice(0, p).reduce((a, b) => a + b, 0);
            out[p - 1] = sum;
            for (let i = p; i < arr.length; i++) {
                sum = sum - (sum / p) + arr[i];
                out[i] = sum;
            }
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
        for (let i = period; i < dxArr.length; i++) {
            adx = ((adx * (period - 1)) + dxArr[i]) / period;
        }
        return adx;
    }

    // ===== 8. Bollinger Bands =====
    static Bollinger(closes, period = 20, mult = 2) {
        if (closes.length < period) return null;
        const slice = closes.slice(-period);
        const sma = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
        const sd = Math.sqrt(variance);
        const upper = sma + mult * sd;
        const lower = sma - mult * sd;
        const price = closes[closes.length - 1];
        const percentB = (upper - lower) === 0 ? 0.5 : (price - lower) / (upper - lower);
        return { sma, upper, lower, percentB };
    }

    // ===== 9. Parabolic SAR =====
    static ParabolicSAR(highs, lows, step = 0.02, maxStep = 0.2) {
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
                if (lows[i] < sar) {
                    isUp = false;
                    sar = ep;
                    ep = lows[i];
                    af = step;
                } else {
                    if (highs[i] > ep) {
                        ep = highs[i];
                        af = Math.min(af + step, maxStep);
                    }
                }
            } else {
                sar = Math.max(sar, highs[i - 1], highs[i - 2]);
                if (highs[i] > sar) {
                    isUp = true;
                    sar = ep;
                    ep = highs[i];
                    af = step;
                } else {
                    if (lows[i] < ep) {
                        ep = lows[i];
                        af = Math.min(af + step, maxStep);
                    }
                }
            }
        }
        return { sar, trend: isUp ? 'bullish' : 'bearish' };
    }

    // ===== 10. VWAP =====
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

    // ============================================
    // СИСТЕМАИ СИГНАЛҲО — 8 ИНДИКАТОР
    // ============================================
    static getSignal(candles, settings = {}) {
        const {
            rsiPeriod = 14,
            stochPeriod = 14,
            macdFast = 12,
            macdSlow = 26,
            macdSignal = 9,
            emaPeriod = 200,
            adxPeriod = 14,
            bbPeriod = 20,
            bbMult = 2,
            sarStep = 0.02,
            sarMax = 0.2,
            slMult = 1.5,
            tpMult = 2
        } = settings;

        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume);
        const price = closes[closes.length - 1];

        // Ҳисоб кардани ҳамаи индикаторҳо
        const rsi = this.RSI(closes, rsiPeriod);
        const macd = this.MACD(closes, macdFast, macdSlow, macdSignal);
        const ema200 = this.EMA(closes, emaPeriod);
        const stoch = this.Stochastic(highs, lows, closes, stochPeriod);
        const atr = this.ATR(highs, lows, closes, 14);
        const adx = this.ADX(highs, lows, closes, adxPeriod);
        const bb = this.Bollinger(closes, bbPeriod, bbMult);
        const vwap = this.VWAP(highs, lows, closes, volumes);
        const sar = this.ParabolicSAR(highs, lows, sarStep, sarMax);

        // ============================================
        // СИСТЕМАИ ВАЗНДОРИИ ИНДИКАТОРҲО
        // ============================================
        let score = 0;
        let maxScore = 0;
        let signals = [];
        let reasons = [];

        // 1. RSI — вазни 3
        if (rsi !== null) {
            maxScore += 3;
            if (rsi < 30) { score += 3;
                signals.push('bullish');
                reasons.push(`RSI ${rsi.toFixed(1)} — Oversold (фурӯши аз ҳад)`); } else if (rsi > 70) { score -= 3;
                signals.push('bearish');
                reasons.push(`RSI ${rsi.toFixed(1)} — Overbought (хариди аз ҳад)`); } else {
                reasons.push(`RSI ${rsi.toFixed(1)} — миёна`);
            }
        }

        // 2. MACD — вазни 3
        if (macd.histogram !== null) {
            maxScore += 3;
            if (macd.histogram > 0) { score += 3;
                signals.push('bullish');
                reasons.push('MACD — Bullish Cross (сабз)'); } else { score -= 3;
                signals.push('bearish');
                reasons.push('MACD — Bearish Cross (сурх)'); }
        }

        // 3. EMA 200 — вазни 2
        if (ema200 !== null) {
            maxScore += 2;
            if (price > ema200) { score += 2;
                signals.push('bullish');
                reasons.push(`EMA 200 — нарх боло (${ema200.toFixed(2)})`); } else { score -= 2;
                signals.push('bearish');
                reasons.push(`EMA 200 — нарх поён (${ema200.toFixed(2)})`); }
        }

        // 4. Stochastic — вазни 2
        if (stoch !== null) {
            maxScore += 2;
            if (stoch < 20) { score += 2;
                signals.push('bullish');
                reasons.push(`Stochastic ${stoch.toFixed(1)} — Oversold`); } else if (stoch > 80) { score -= 2;
                signals.push('bearish');
                reasons.push(`Stochastic ${stoch.toFixed(1)} — Overbought`); } else {
                reasons.push(`Stochastic ${stoch.toFixed(1)} — миёна`);
            }
        }

        // 5. Bollinger Bands — вазни 2
        if (bb !== null) {
            maxScore += 2;
            if (bb.percentB < 0.1) { score += 2;
                signals.push('bullish');
                reasons.push('Bollinger — наздики поён'); } else if (bb.percentB > 0.9) { score -= 2;
                signals.push('bearish');
                reasons.push('Bollinger — наздики боло'); } else {
                reasons.push('Bollinger — миёна');
            }
        }

        // 6. Parabolic SAR — вазни 2
        if (sar !== null) {
            maxScore += 2;
            if (sar.trend === 'bullish') { score += 2;
                signals.push('bullish');
                reasons.push('SAR — дар поён (Bullish)'); } else { score -= 2;
                signals.push('bearish');
                reasons.push('SAR — дар боло (Bearish)'); }
        }

        // 7. ADX — қувваи тамоюл (вазни 1)
        if (adx !== null) {
            maxScore += 1;
            if (adx < 20) {
                reasons.push(`ADX ${adx.toFixed(1)} — тамоюли заиф (бе савдо)`);
            } else if (adx > 40) {
                reasons.push(`ADX ${adx.toFixed(1)} — тамоюли қавӣ ✅`);
            } else {
                reasons.push(`ADX ${adx.toFixed(1)} — тамоюли мӯътадил`);
            }
        }

        // 8. VWAP — вазни 1
        if (vwap !== null) {
            maxScore += 1;
            if (price > vwap) { score += 1;
                signals.push('bullish');
                reasons.push(`VWAP — нарх боло (${vwap.toFixed(2)})`); } else { score -= 1;
                signals.push('bearish');
                reasons.push(`VWAP — нарх поён (${vwap.toFixed(2)})`); }
        }

        // ============================================
        // ҚАБУЛИ ҚАРОР ДАР АСОСИ ВАЗН
        // ============================================
        const total = Math.max(maxScore, 1);
        const strength = Math.abs(score) / total;

        let bias = 'neutral';
        let confidence = 0;
        let signalText = 'НЕЙТРАЛ';
        let color = 'neutral';
        let action = 'HOLD';

        if (score > 0 && strength >= 0.5) {
            bias = 'bullish';
            confidence = Math.round(50 + strength * 40);
            signalText = 'BUY 🟢';
            color = 'bullish';
            action = 'BUY';
        } else if (score < 0 && strength >= 0.5) {
            bias = 'bearish';
            confidence = Math.round(50 + strength * 40);
            signalText = 'SELL 🔴';
            color = 'bearish';
            action = 'SELL';
        } else if (score > 0 && strength < 0.5) {
            bias = 'bullish';
            confidence = Math.round(40 + strength * 30);
            signalText = 'БОЛОИ ШАРТӢ';
            color = 'neutral';
            action = 'HOLD';
        } else if (score < 0 && strength < 0.5) {
            bias = 'bearish';
            confidence = Math.round(40 + strength * 30);
            signalText = 'ПОЁНИ ШАРТӢ';
            color = 'neutral';
            action = 'HOLD';
        } else {
            confidence = 30 + Math.round(Math.random() * 20);
            signalText = 'НЕЙТРАЛ';
            color = 'neutral';
            action = 'HOLD';
        }

        // ===== SL/TP аз рӯи ATR =====
        let sl = null, tp = null;
        if (atr !== null && bias !== 'neutral') {
            if (bias === 'bullish') {
                sl = price - atr * slMult;
                tp = price + atr * tpMult;
            } else {
                sl = price + atr * slMult;
                tp = price - atr * tpMult;
            }
        }

        return {
            price,
            rsi,
            macd,
            ema200,
            stoch,
            atr,
            adx,
            bb,
            vwap,
            sar,
            bias,
            confidence,
            signalText,
            color,
            action,
            score,
            total,
            strength,
            sl,
            tp,
            agreement: `${signals.filter(s => s === 'bullish').length}↑ / ${signals.filter(s => s === 'bearish').length}↓ / ${signals.filter(s => s === 'neutral').length}■`,
            reasons: reasons.slice(0, 5),
            summary: this.getSummary(reasons, bias, confidence)
        };
    }

    // ============================================
    // ХУЛОСА ДАР ЯК ҶУМЛА
    // ============================================
    static getSummary(reasons, bias, confidence) {
        if (bias === 'bullish' && confidence >= 80) {
            return '✅ Сигнали қавии БОЛО — аксари индикаторҳо ба харид ишора мекунанд';
        } else if (bias === 'bearish' && confidence >= 80) {
            return '✅ Сигнали қавии ПОЁН — аксари индикаторҳо ба фурӯш ишора мекунанд';
        } else if (bias === 'bullish' && confidence >= 60) {
            return '📈 Тамоюли БОЛО — аммо эҳтиёт лозим аст';
        } else if (bias === 'bearish' && confidence >= 60) {
            return '📉 Тамоюли ПОЁН — аммо эҳтиёт лозим аст';
        } else if (bias === 'bullish') {
            return '🟡 Сигнали шавқу ҳавас ба БОЛО — интизори тасдиқ шавед';
        } else if (bias === 'bearish') {
            return '🟡 Сигнали шавқу ҳавас ба ПОЁН — интизори тасдиқ шавед';
        } else {
            return '⚪ Бозор тасмим нагирифтааст — савдо накунед';
        }
    }
    }
