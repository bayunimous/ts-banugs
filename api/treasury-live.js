const axios = require('axios');

module.exports = async (req, res) => {
    // 🔴 MATIKAN SEMUA CACHE VERCEL SECARA PAKSA 🔴
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    let data = { buy: 0, sell: 0, usd: 0, promo: 0, limit: 5 };
    const ts = Date.now();

    // 1. TEMBAK LANGSUNG KE TREASURY.ID (BYPASS API PIHAK KETIGA)
    try {
        // Tembak public API/HTML Treasury langsung
        const tRes = await axios.get(`https://treasury.id/?bypass_cache=${ts}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 4000
        });
        
        // Scraping angka murni langsung dari source Treasury
        const buyMatch = tRes.data.match(/"buy":(\d+)/);
        const sellMatch = tRes.data.match(/"sell":(\d+)/);
        
        if (buyMatch && buyMatch[1]) data.buy = parseInt(buyMatch[1]);
        if (sellMatch && sellMatch[1]) data.sell = parseInt(sellMatch[1]);
    } catch (e) {}

    // Fallback Darurat Treasury
    if (data.buy === 0) {
        try {
            const backupRes = await axios.get(`https://indonesia-gold-api.vercel.app/api/treasury?t=${ts}`);
            data.buy = parseInt(backupRes.data.data.hargaBeli || backupRes.data.data.buy);
            data.sell = parseInt(backupRes.data.data.hargaJual || backupRes.data.data.sell);
        } catch(e) {}
    }

    // 2. TEMBAK LANGSUNG KE GOOGLE FINANCE USD/IDR
    try {
        const gfRes = await axios.get(`https://www.google.com/finance/quote/USD-IDR?hl=id&t=${ts}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            },
            timeout: 4000
        });
        
        // Menangkap data-last-price murni dari Google Finance
        const priceMatch = gfRes.data.match(/data-last-price="([\d\.]+)"/);
        if (priceMatch && priceMatch[1]) {
            data.usd = parseFloat(priceMatch[1]);
        }
    } catch (e) {}

    // Fallback Forex Realtime jika Google memblokir IP Vercel Anda
    if (data.usd === 0) {
        try {
            const yRes = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1m&_=${ts}`);
            data.usd = parseFloat(yRes.data.chart.result[0].meta.regularMarketPrice);
        } catch (e) {}
    }

    // Jika semua server global mati total (Sangat jarang terjadi)
    if (!data.buy) data.buy = 2455601;
    if (!data.sell) data.sell = 2375088;
    if (!data.usd) data.usd = 17970.0000;

    return res.status(200).json({ success: true, data: data });
};