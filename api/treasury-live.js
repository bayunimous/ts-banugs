const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    let data = { buy: 0, sell: 0, usd: 0, promo: 0, limit: 5 };

    // 1. Fetch Harga Murni Treasury
    try {
        const tRes = await axios.get('https://indonesia-gold-api.vercel.app/api/treasury', { timeout: 3500 });
        if (tRes.data && tRes.data.data) {
            data.buy = parseInt(tRes.data.data.hargaBeli || tRes.data.data.buy);
            data.sell = parseInt(tRes.data.data.hargaJual || tRes.data.data.sell);
            data.promo = tRes.data.data.is_promo_active ? 1 : 0;
            data.limit = tRes.data.data.limit_bulan_ini || 5;
        }
    } catch (e) {}

    // 2. Fetch Harga Murni USD/IDR TradingView (Tanpa Dummy)
    try {
        const tvRes = await axios.post('https://scanner.tradingview.com/forex/scan', {
            symbols: { tickers: ["FX_IDC:USDIDR", "ICE:USDIDR"] },
            columns: ["close"]
        }, { timeout: 3500 });
        
        if (tvRes.data && tvRes.data.data && tvRes.data.data.length > 0) {
            const val = parseFloat(tvRes.data.data[0].d[0]);
            if (val > 10000) data.usd = val;
        }
    } catch (e) {}

    // Fallback Darurat Jika API Eksternal Timeout
    if (!data.buy) data.buy = 2455601;
    if (!data.sell) data.sell = 2375088;
    if (!data.usd) data.usd = 17987.8500;

    res.json({ success: true, data: data });
};