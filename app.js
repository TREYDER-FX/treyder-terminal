// ============================================
// СИГНАЛИ ҚАВӢ БАРОИ ҲАРИДУ ФУРӮШ
// ============================================

function checkStrongSignal(result) {
    // Сигнали қавии БОЛО
    if (result.bias === 'bullish' && result.confidence >= 80) {
        return {
            type: 'STRONG_BUY',
            emoji: '🚀',
            message: 'СИГНАЛИ ҚАВӢ 🟢 — Харид кунед!',
            color: '#00ff88',
            action: 'BUY'
        };
    }
    
    // Сигнали қавии ПОЁН
    if (result.bias === 'bearish' && result.confidence >= 80) {
        return {
            type: 'STRONG_SELL',
            emoji: '🔻',
            message: 'СИГНАЛИ ҚАВӢ 🔴 — Фурӯш кунед!',
            color: '#ff3b30',
            action: 'SELL'
        };
    }
    
    // Сигнали мӯътадили БОЛО
    if (result.bias === 'bullish' && result.confidence >= 60) {
        return {
            type: 'BUY',
            emoji: '📈',
            message: 'Тамоюли БОЛО — эҳтиёт бошед',
            color: '#88ff88',
            action: 'HOLD'
        };
    }
    
    // Сигнали мӯътадили ПОЁН
    if (result.bias === 'bearish' && result.confidence >= 60) {
        return {
            type: 'SELL',
            emoji: '📉',
            message: 'Тамоюли ПОЁН — эҳтиёт бошед',
            color: '#ff8888',
            action: 'HOLD'
        };
    }
    
    // Сигнали шавқу ҳавас
    if (result.bias === 'bullish' && result.confidence >= 40) {
        return {
            type: 'WEAK_BUY',
            emoji: '🟡',
            message: 'Шавқу ҳавас ба БОЛО — интизори тасдиқ',
            color: '#ffd700',
            action: 'HOLD'
        };
    }
    
    if (result.bias === 'bearish' && result.confidence >= 40) {
        return {
            type: 'WEAK_SELL',
            emoji: '🟡',
            message: 'Шавқу ҳавас ба ПОЁН — интизори тасдиқ',
            color: '#ffd700',
            action: 'HOLD'
        };
    }
    
    // Ҳеҷ сигнал
    return {
        type: 'NEUTRAL',
        emoji: '⚪',
        message: 'Бозор тасмим нагирифтааст — савдо накунед',
        color: '#888888',
        action: 'HOLD'
    };
}
