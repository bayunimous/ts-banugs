const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

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
    
    // Matriks Nominal Pokok Diskon Modal Kovdez Asli
    const pokokMap = {
        jt10: 9669000,
        jt30: 29004000,
        jt40: 38672000,
        jt50: 48340000,
        jt60: 58005000
    };

    // Fungsi Hitung Cuan Kovdez
    function calcCuanKovdez(pokok, buy, sell) {
        var gramCuanRaw = Math.floor((pokok / buy) * 10000) / 10000;
        var nominalCuan = Math.round((gramCuanRaw * sell) - pokok);
        var gramStr = parseFloat(gramCuanRaw.toFixed(4)).toString().replace('.', ',') + 'gr';
        var sign = nominalCuan > 0 ? '+' : '';
        var nomStr = sign + nominalCuan.toLocaleString('id-ID');
        var icon = nominalCuan >= 0 ? '🟢' : '🔴';
        return `${nomStr} ${icon} ${gramStr}`;
    }

    const history = [];
    for (let i = 0; i < 20; i++) {
        const pastTime = new Date(wibTime.getTime() - i * 60000);
        const hours = String(pastTime.getUTCHours()).padStart(2, '0');
        const minutes = String(pastTime.getUTCMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:01`;

        history.push({
            created_at: pastTime.toISOString(),
            waktu_display: timeStr,
            buying_rate: buyPrice.toLocaleString('id-ID'),
            selling_rate: sellPrice.toLocaleString('id-ID'),
            buying_rate_raw: buyPrice,
            selling_rate_raw: sellPrice,
            diff_display: " — tetap",
            jt10: calcCuanKovdez(pokokMap.jt10, buyPrice, sellPrice),
            jt30: calcCuanKovdez(pokokMap.jt30, buyPrice, sellPrice),
            jt40: calcCuanKovdez(pokokMap.jt40, buyPrice, sellPrice),
            jt50: calcCuanKovdez(pokokMap.jt50, buyPrice, sellPrice),
            jt60: calcCuanKovdez(pokokMap.jt60, buyPrice, sellPrice),
            usd_price_buy: 137.8385,
            usdidr: 17914,
            isAnomaly: true,
            anomaliDiff: -29999
        });
    }

    const usdHistory = [
        { price: "17.914,1000", time: "10:35:58" },
        { price: "17.912,3513", time: "10:33:35" },
        { price: "17.914,1000", time: "10:32:41" },
        { price: "17.912,3513", time: "10:31:55" },
        { price: "17.914,1000", time: "10:30:48" }
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