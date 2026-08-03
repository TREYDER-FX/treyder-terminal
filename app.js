// ============================================
// МАНТИҚИ АСОСӢ
// ============================================

let currentSymbol = 'BTCUSDT';
let currentTvSymbol = 'BINANCE:BTCUSDT';
let currentPlatform = 'binance';
let currentTimeframe = '1';
let updateCount = 0;
let isAnalyzing = false;
let isSoundOn = true;
let countdownInterval = null;

function changeTimeframe(tf, btn) {
    document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTimeframe = tf;
    document.getElementById('chartTimeframe').textContent = btn.textContent;
    updateChart();
    if (!isAnalyzing) runAnalysis();
}

function updateChart() {
    const map = { '1':'1', '3':'3', '5':'5', '15':'15', '30':'30', '60':'60' };
    document.getElementById('chartFrame').src = 
        `https://s.tradingview.com/widgetembed/?symbol=${currentTvSymbol}&interval=${map[currentTimeframe]||'1'}&theme=dark&locale=ru`;
}

function selectPair(name, tv, symbol, platform) {
    document.getElementById('pairDisplay').innerHTML = name + ' ▾';
    currentTvSymbol = tv;
    currentSymbol = symbol;
    currentPlatform = platform;
    updateChart();
    closeModal();
    setTimeout(runAnalysis, 300);
}

async function runAnalysis() {
    if (isAnalyzing) return;
    isAnalyzing = true;

    const btn = document.getElementById('analyzeBtn');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin">⏳</span> <span>ТАҲЛИЛ...</span>';

    const t0 = performance.now();

    try {
        const tfMap = { '1':'1', '3':'3', '5':'5', '15':'15', '30':'30', '60':'60' };
        const candles = await apiManager.getCandles(currentSymbol, tfMap[currentTimeframe] || '1', currentPlatform);

        if (!candles || candles.length < 30) throw new Error('Маълумот кофӣ нест');

        const result = IndicatorEngine.getAll(candles);
        const latency = Math.round(performance.now() - t0);

        updateUI(result, latency);

    } catch (e) {
        console.error('Хатогӣ:', e);
        document.getElementById('signalCard').className = 'signal-card';
        document.getElementById('signalMain').innerHTML = '⚠️ ХАТОГӢ';
        document.getElementById('signalSub').innerHTML = `<span class="error-box">${e.message}</span>`;
        document.getElementById('botStatus').textContent = '❌ Хатогӣ';
        document.getElementById('botStatus').style.color = 'var(--danger)';
    }

    btn.innerHTML = origText;
    btn.disabled = false;
    isAnalyzing = false;
}

function updateUI(result, latency) {
    updateCount++;
    document.getElementById('updateCount').textContent = updateCount;
    document.getElementById('signalTime').textContent = new Date().toLocaleTimeString();
    document.getElementById('latencyStatus').textContent = latency + 'ms';
    document.getElementById('botStatus').textContent = '✅ Таҳлил анҷом ёфт';
    document.getElementById('botStatus').style.color = 'var(--primary)';

    const source = apiManager.getCurrentSource();
    document.getElementById('sourceDisplay').textContent = source;
    document.getElementById('tfDisplay').textContent = document.getElementById('chartTimeframe').textContent;

    const digits = ['binance','bybit','okx'].includes(currentPlatform) ? 2 : 5;
    const priceStr = ['forex','otc'].includes(currentPlatform) ? 
        result.price.toFixed(digits) : '$' + result.price.toFixed(digits);
    document.getElementById('currentPriceDisplay').textContent = priceStr;
    document.getElementById('priceStatus').textContent = priceStr;
    document.getElementById('atrValue').textContent = result.atr !== null ? result.atr.toFixed(digits) : '--';

    const card = document.getElementById('signalCard');
    const main = document.getElementById('signalMain');
    const sub = document.getElementById('signalSub');
    const badge = document.getElementById('signalBadge');
    const trendPanel = document.getElementById('trendPanel');
    const trendAction = document.getElementById('trendAction');
    const trendBadge = document.getElementById('trendBadge');

    const labels = {
        bullish: { card:'bullish', main:'📈 ТАМОЮЛИ БОЛО', badge:'BULLISH', trend:'Аксари 8 индикатор ба БОЛО', color:'green', bClass:'badge-bullish' },
        bearish: { card:'bearish', main:'📉 ТАМОЮЛИ ПОЁН', badge:'BEARISH', trend:'Аксари 8 индикатор ба ПОЁН', color:'red', bClass:'badge-bearish' },
        neutral: { card:'', main:'➖ БОЗОРИ ХОМӮШ', badge:'NEUTRAL', trend:'Индикаторҳо мухолиф', color:'gold', bClass:'badge-neutral' }
    };
    const L = labels[result.bias];
    card.className = 'signal-card ' + L.card;
    main.innerHTML = L.main;
    sub.textContent = `Таймфрейм ${document.getElementById('chartTimeframe').textContent}, тавофуқ: ${result.agreement}`;
    badge.className = 'signal-badge ' + result.bias;
    badge.textContent = L.badge;
    document.getElementById('agreement').textContent = result.agreement;

    trendPanel.className = 'trend-panel ' + L.card;
    trendAction.className = 'action ' + L.color;
    trendAction.textContent = L.trend;
    trendBadge.className = 'trend-badge ' + L.bClass;
    trendBadge.textContent = L.badge;

    function setIndicator(valId, boxId, text, cls) {
        const v = document.getElementById(valId);
        v.textContent = text;
        v.className = 'indicator-value ' + cls;
        document.getElementById(boxId).className = 'indicator-item ' + cls;
    }

    const rsiText = result.rsi !== null ? result.rsi.toFixed(1) + (result.rsi<30?' Oversold':result.rsi>70?' Overbought':'') : '--';
    const rsiCls = result.rsi === null ? 'neutral' : (result.rsi<30?'bullish':result.rsi>70?'bearish':'neutral');
    setIndicator('rsiValue','indRsi', rsiText, rsiCls);

    const macdText = result.macd.histogram !== null ? (result.macd.histogram>0?'Bullish 📈':'Bearish 📉') : '--';
    const macdCls = result.macd.histogram === null ? 'neutral' : (result.macd.histogram>0?'bullish':'bearish');
    setIndicator('macdValue','indMacd', macdText, macdCls);

    const emaText = result.ema200 !== null ? (['forex','otc'].includes(currentPlatform)?result.ema200.toFixed(digits):'$'+result.ema200.toFixed(digits)) : '--';
    const emaCls = result.ema200 === null ? 'neutral' : (result.price>result.ema200?'bullish':'bearish');
    setIndicator('emaValue','indEma', emaText, emaCls);

    const stochText = result.stoch !== null ? result.stoch.toFixed(1) : '--';
    const stochCls = result.stoch === null ? 'neutral' : (result.stoch<20?'bullish':result.stoch>80?'bearish':'neutral');
    setIndicator('stochValue','indStoch', stochText, stochCls);

    const adxText = result.adx !== null ? result.adx.toFixed(1) + (result.adx<20?' Weak':result.adx<40?' Moderate':' Strong') : '--';
    setIndicator('adxValue','indAdx', adxText, 'neutral');

    const bbText = result.bb !== null ? `%B ${(result.bb.percentB*100).toFixed(0)}%` : '--';
    const bbCls = result.bb === null ? 'neutral' : (result.bb.percentB<0.1?'bullish':result.bb.percentB>0.9?'bearish':'neutral');
    setIndicator('bbValue','indBb', bbText, bbCls);

    const vwapText = result.vwap !== null ? (['forex','otc'].includes(currentPlatform)?result.vwap.toFixed(digits):'$'+result.vwap.toFixed(digits)) : '--';
    const vwapCls = result.vwap === null ? 'neutral' : (result.price>result.vwap?'bullish':'bearish');
    setIndicator('vwapValue','indVwap', vwapText, vwapCls);

    const sarText = result.sar !== null ? result.sar.sar.toFixed(digits) + ' • ' + (result.sar.trend==='bullish'?'Below':'Above') : '--';
    const sarCls = result.sar === null ? 'neutral' : result.sar.trend;
    setIndicator('sarValue','indSar', sarText, sarCls);

    if (result.sl !== null && result.tp !== null) {
        document.getElementById('slValue').textContent = ['forex','otc'].includes(currentPlatform) ? 
            result.sl.toFixed(digits) : '$' + result.sl.toFixed(digits);
        document.getElementById('tpValue').textContent = ['forex','otc'].includes(currentPlatform) ? 
            result.tp.toFixed(digits) : '$' + result.tp.toFixed(digits);
    } else {
        document.getElementById('slValue').textContent = '—';
        document.getElementById('tpValue').textContent = '—';
    }

    if (result.bias !== 'neutral') playTone(result.bias);

    analyzeMultiTF();
    startCountdown();
}

async function analyzeMultiTF() {
    const tfSet = ['1','5','15','60'];
    const cells = document.querySelectorAll('.mtf-cell');
    document.getElementById('mtfStatus').textContent = '...';
    const results = [];
    for (let i=0; i<tfSet.length; i++) {
        try {
            const tfMap = {'1':'1','5':'5','15':'15','60':'60'};
            const candles = await apiManager.getCandles(currentSymbol, tfMap[tfSet[i]], currentPlatform);
            if (!candles || candles.length < 30) { results.push(null); continue; }
            const closes = candles.map(c=>c.close);
            const highs = candles.map(c=>c.high);
            const lows = candles.map(c=>c.low);
            const price = closes[closes.length-1];
            const rsi = IndicatorEngine.RSI(closes);
            const macd = IndicatorEngine.MACD(closes);
            const ema200 = IndicatorEngine.EMA(closes);
            const sig = [];
            if (rsi !== null) sig.push(rsi<30?'bullish':rsi>70?'bearish':'neutral');
            if (macd.histogram !== null) sig.push(macd.histogram>0?'bullish':'bearish');
            if (ema200 !== null) sig.push(price>ema200?'bullish':'bearish');
            const b = sig.filter(s=>s==='bullish').length;
            const r = sig.filter(s=>s==='bearish').length;
            results.push(b>r?'bullish':r>b?'bearish':'neutral');
        } catch(e) { results.push(null); }
    }
    let bull=0, bear=0, neu=0;
    results.forEach((r,i)=>{
        const cell = cells[i];
        const arrow = cell.querySelector('.mtf-arrow');
        if (r===null) { arrow.textContent='?'; arrow.className='mtf-arrow neutral'; cell.className='mtf-cell'; return; }
        if (r==='bullish') { arrow.textContent='▲'; bull++; } else if (r==='bearish') { arrow.textContent='▼'; bear++; } else { arrow.textContent='■'; neu++; }
        arrow.className = 'mtf-arrow ' + r;
        cell.className = 'mtf-cell ' + r;
    });
    const total = bull+bear+neu || 1;
    const bar = document.getElementById('mtfConsensusBar');
    bar.innerHTML = `<span style="width:${bull/total*100}%;background:var(--primary)"></span><span style="width:${bear/total*100}%;background:var(--danger)"></span><span style="width:${neu/total*100}%;background:var(--warning)"></span>`;
    let summary = bull>=3 ? '✅ Тамоюли БОЛО дар аксари таймфреймҳо' : bear>=3 ? '✅ Тамоюли ПОЁН дар аксари таймфреймҳо' : '⚠️ Таймфреймҳо мухолифанд';
    document.getElementById('mtfSummary').textContent = summary;
    document.getElementById('mtfStatus').textContent = `${bull}↑ / ${bear}↓ / ${neu}■`;
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    const tfSec = {'1':60,'3':180,'5':300,'15':900,'30':1800,'60':3600}[currentTimeframe] || 60;
    let idx = Math.floor(Date.now()/1000/tfSec);
    countdownInterval = setInterval(() => {
        const nowSec = Math.floor(Date.now()/1000);
        const newIdx = Math.floor(nowSec/tfSec);
        const remaining = (newIdx+1)*tfSec - nowSec;
        const mm = Math.floor(remaining/60), ss = remaining%60;
        document.getElementById('candleCountdown').textContent = (mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss;
        if (newIdx !== idx) { idx = newIdx; if (!isAnalyzing) runAnalysis(); }
    }, 1000);
}

function playTone(bias) {
    if (!isSoundOn) return;
    try {
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = bias==='bullish' ? 880 : 440;
        osc.type = bias==='bullish' ? 'sine' : 'sawtooth';
        gain.gain.value = 0.2;
        osc.start(); setTimeout(()=>osc.stop(), 200);
    } catch(e) {}
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    const b = document.getElementById('soundBtn');
    b.textContent = isSoundOn ? '🔊' : '🔇';
    b.className = 'sound-btn ' + (isSoundOn?'active':'');
}

function openModal() { document.getElementById('modal').style.display='block'; document.body.style.overflow='hidden'; }
function closeModal() { document.getElementById('modal').style.display='none'; document.body.style.overflow='auto'; }
document.getElementById('modal').addEventListener('click', function(e){ if(e.target===this) closeModal(); });

setInterval(()=>{ document.getElementById('clock').textContent = new Date().toLocaleTimeString(); },1000);

updateChart();
setTimeout(runAnalysis, 500);

console.log('🚀 FOREXBOT PRO MAX v10.0');
console.log('📊 8 Индикатор • 6 API • Fallback • Cache • Retry');
console.log('👨‍💻 Созанда: Fariz Karimov');
