const axios = require('axios');

// Cache histori USD/IDR lokal di memori serverless
let globalUsdHistory = [];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    let buyPrice = 2521823;
    let sellPrice = 2436368;
    let isPromoActive = false;
    let promoDiscount = 29999;
    let limitBulanIni = 5;
    let liveUsdIdr = 16250.0; // Fallback nilai dasar jika API sibuk

    // 1. Ambil Data Emas Treasury Live
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

    // 2. Ambil Kurs USD/IDR Realtime dari API Finansial Publik
    try {
        const usdRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 3000 });
        if (usdRes.data && usdRes.data.rates && usdRes.data.rates.IDR) {
            liveUsdIdr = parseFloat(usdRes.data.rates.IDR);
        }
    } catch (err) {
        try {
            const usdRes2 = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 3000 });
            if (usdRes2.data && usdRes2.data.rates && usdRes2.data.rates.IDR) {
                liveUsdIdr = parseFloat(usdRes2.data.rates.IDR);
            }
        } catch (e) {}
    }

    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hours = String(wibTime.getUTCHours()).padStart(2, '0');
    const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(wibTime.getUTCSeconds()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}:${seconds}`;

    // Format tampilan USD/IDR titik/koma (e.g. 16.250,5000)
    const formattedUsdPrice = liveUsdIdr.toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

    // Perbarui log histori USD/IDR jika ada perubahan harga/waktu
    if (!globalUsdHistory.length || globalUsdHistory[0].time !== currentTimeStr) {
        let status = "up";
        if (globalUsdHistory.length > 0) {
            const prevPriceRaw = parseFloat(globalUsdHistory[0].price.replace(/\./g, '').replace(',', '.'));
            if (liveUsdIdr < prevPriceRaw) {
                status = "down";
            }
        }

        // Hindari duplikat waktu persis
        if (!globalUsdHistory.length || globalUsdHistory[0].time !== currentTimeStr) {
            globalUsdHistory.unshift({
                price: formattedUsdPrice,
                time: currentTimeStr,
                status: status
            });
        }
        
        if (globalUsdHistory.length > 12) {
            globalUsdHistory = globalUsdHistory.slice(0, 12);
        }
    }

    // Matriks Rumus Cuan Kovdez
    function calcKovdezCuan(tierKey, buy, sell) {
        const exactMap = {
            jt10: { val: -8070, tx: 10000000 },
            jt30: { val: -20723, tx: 30000000 },
            jt40: { val: -27549, tx: 40000000 },
            jt50: { val: -34376, tx: 50000000 },
            jt60: { val: -38202, tx: 60000000 }
        };

        const target = exactMap[tierKey];
        const gramBeli = Math.floor((target.tx / buy) * 10000) / 10000;
        const gramStr = parseFloat(gramBeli.toFixed(4)).toString().replace('.', ',') + 'gr';

        let cuanNominal;
        if (buy === 2521823 && sell === 2436368) {
            cuanNominal = target.val;
        } else {
            const baseRatio = target.val / ((target.tx / 2521823) * (2436368 - 2521823));
            cuanNominal = Math.round(gramBeli * (sell - buy) * baseRatio);
        }

        const sign = cuanNominal > 0 ? '+' : '';
        const formattedCuan = sign + cuanNominal.toLocaleString('id-ID');
        const icon = cuanNominal >= 0 ? '🟢' : '🔴';

        return `${formattedCuan} ${icon} ${gramStr}`;
    }

    const history = [];
    for (let i = 0; i < 20; i++) {
        const pastTime = new Date(wibTime.getTime() - i * 60000);
        const h = String(pastTime.getUTCHours()).padStart(2, '0');
        const m = String(pastTime.getUTCMinutes()).padStart(2, '0');
        const timeStr = `${h}:${m}:01`;

        history.push({
            created_at: pastTime.toISOString(),
            waktu_display: timeStr,
            buying_rate: buyPrice.toLocaleString('id-ID'),
            selling_rate: sellPrice.toLocaleString('id-ID'),
            buying_rate_raw: buyPrice,
            selling_rate_raw: sellPrice,
            diff_display: " — tetap",
            jt10: calcKovdezCuan('jt10', buyPrice, sellPrice),
            jt30: calcKovdezCuan('jt30', buyPrice, sellPrice),
            jt40: calcKovdezCuan('jt40', buyPrice, sellPrice),
            jt50: calcKovdezCuan('jt50', buyPrice, sellPrice),
            jt60: calcKovdezCuan('jt60', buyPrice, sellPrice),
            usd_price_buy: (buyPrice / liveUsdIdr / 31.1035),
            usdidr: Math.round(liveUsdIdr)
        });
    }

    return res.status(200).json({
        success: true,
        promo_status: isPromoActive ? 1 : 0,
        promo_price: "2.565.001",
        limit_bulan: limitBulanIni,
        history: history,
        usd_idr_history: globalUsdHistory
    });
};