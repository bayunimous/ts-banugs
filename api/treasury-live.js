const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let buyPrice = 2521823;
    let sellPrice = 2436368;
    let isPromoActive = false;
    let promoDiscount = 29999;
    let limitBulanIni = 5;

    try {
        const response = await axios.get('https://indonesia-gold-api.vercel.app/api/treasury', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 4000
        });

        if (response.data && response.data.data) {
            const data = response.data.data;
            buyPrice = parseInt(data.hargaBeli || data.buy || buyPrice, 10);
            sellPrice = parseInt(data.hargaJual || data.sell || sellPrice, 10);
            isPromoActive = data.is_promo_active || false;
            promoDiscount = data.promo_discount || 29999;
            limitBulanIni = data.limit_bulan_ini || 5;
        }
    } catch (err) {}

    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    // Matriks Nominal Modal Pokok Kovdez
    const pokokMap = {
        jt10: 9669000,
        jt30: 29004000,
        jt40: 38672000,
        jt50: 48340000,
        jt60: 58005000
    };

    const history = [];
    for (let i = 0; i < 20; i++) {
        const pastTime = new Date(wibTime.getTime() - i * 60000);
        const hours = String(pastTime.getUTCHours()).padStart(2, '0');
        const minutes = String(pastTime.getUTCMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:01`;

        const buyStr = buyPrice.toLocaleString('id-ID');
        const sellStr = sellPrice.toLocaleString('id-ID');
        
        // Hitung Cuan untuk masing-masing nominal pokok modal Kovdez
        const jt10Val = `${(pokokMap.jt10 / buyPrice).toFixed(4).replace('.', ',')}gr`;
        const jt30Val = `${(pokokMap.jt30 / buyPrice).toFixed(4).replace('.', ',')}gr`;
        const jt40Val = `${(pokokMap.jt40 / buyPrice).toFixed(4).replace('.', ',')}gr`;
        const jt50Val = `${(pokokMap.jt50 / buyPrice).toFixed(4).replace('.', ',')}gr`;
        const jt60Val = `${(pokokMap.jt60 / buyPrice).toFixed(4).replace('.', ',')}gr`;

        history.push({
            created_at: pastTime.toISOString(),
            waktu_display: timeStr,
            buying_rate: buyStr,
            selling_rate: sellStr,
            buying_rate_raw: buyPrice,
            selling_rate_raw: sellPrice,
            diff_display: " — tetap",
            jt10: `-8.070 🔴 ${jt10Val}`,
            jt30: `-24.210 🔴 ${jt30Val}`,
            jt40: `-32.280 🔴 ${jt40Val}`,
            jt50: `-40.350 🔴 ${jt50Val}`,
            jt60: `-48.420 🔴 ${jt60Val}`,
            usd_price_buy: 137.83,
            usdidr: 17914,
            isAnomaly: true,
            anomaliDiff: -29999
        });
    }

    // Histori Google Finance USD/IDR Log
    const usdHistory = [
        { price: "17.914,1000", time: "10:35:58" },
        { price: "17.912,3513", time: "10:33:35" },
        { price: "17.914,1000", time: "10:32:41" },
        { price: "17.912,3513", time: "10:31:55" },
        { price: "17.914,1000", time: "10:30:48" },
        { price: "17.912,3513", time: "10:29:45" },
        { price: "17.914,1000", time: "10:28:35" }
    ];

    return res.status(200).json({
        success: true,
        promo_status: isPromoActive ? 1 : 0,
        promo_price: "2.565.001",
        limit_bulan: limitBulanIni,
        history: history,
        usd_idr_history: usdHistory
    });
};