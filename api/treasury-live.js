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

    // Rumus Matematika Asli Kovdez (Berdasarkan Source Code index.html Kovdez)
    // 10JT -> Pokok Rp 9.669.000
    // 30JT -> Pokok Rp 29.004.000
    // 40JT -> Pokok Rp 38.672.000
    // 50JT -> Pokok Rp 48.340.000
    // 60JT -> Pokok Rp 58.005.000
    function calcKovdezValue(pokok) {
        var gramBuy = Math.floor((pokok / buyPrice) * 10000) / 10000;
        var gramSell = Math.floor((pokok / sellPrice) * 10000) / 10000;
        var diffRupiah = Math.round((gramBuy - gramSell) * sellPrice);
        
        var sign = diffRupiah > 0 ? '+' : '';
        var formattedRupiah = sign + diffRupiah.toLocaleString('id-ID');
        var formattedGram = parseFloat(gramBuy.toFixed(4)).toString().replace('.', ',') + 'gr';
        var icon = diffRupiah >= 0 ? '🟢' : '🔴';

        return `${formattedRupiah} ${icon} ${formattedGram}`;
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
            jt10: calcKovdezValue(9669000),
            jt30: calcKovdezValue(29004000),
            jt40: calcKovdezValue(38672000),
            jt50: calcKovdezValue(48340000),
            jt60: calcKovdezValue(58005000),
            usd_price_buy: 137.8385,
            usdidr: 17914
        });
    }

    const usdHistory = [
        { price: "17.914,1000", time: "10:35:58", status: "up" },
        { price: "17.912,3513", time: "10:33:35", status: "down" },
        { price: "17.914,1000", time: "10:32:41", status: "up" },
        { price: "17.912,3513", time: "10:31:55", status: "down" },
        { price: "17.914,1000", time: "10:30:48", status: "up" },
        { price: "17.912,3513", time: "10:29:45", status: "down" }
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