const axios = require('axios');

module.exports = async (req, res) => {
    // Header CORS agar Frontend bisa memanggil API secara bebas
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
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
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

    // Hitung Waktu WIB (GMT+7)
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    // Buat histori log otomatis per menit untuk 10 menit ke belakang
    const history = [];
    for (let i = 0; i < 10; i++) {
        const pastTime = new Date(wibTime.getTime() - i * 60000);
        const hours = String(pastTime.getUTCHours()).padStart(2, '0');
        const minutes = String(pastTime.getUTCMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:01`;

        const estCuanGr = (10000000 / buyPrice).toFixed(4).replace('.', ',');
        const estJualModalGr = (10000000 / sellPrice).toFixed(4).replace('.', ',');
        const spreadVal = (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2) + '%';

        history.push({
            waktu: timeStr,
            beli: buyPrice.toLocaleString('id-ID'),
            jual: sellPrice.toLocaleString('id-ID'),
            statusText: "— tetap",
            statusColor: "text-purple-400",
            cuanIcon: "🔴",
            estCuanGr: `${estCuanGr}gr`,
            estJualModalGr: `${estJualModalGr}gr`,
            xau: "$4.287,25",
            usd: "Rp17.914",
            anomali: `(-Rp ${promoDiscount.toLocaleString('id-ID')})`,
            spread: spreadVal
        });
    }

    return res.status(200).json({
        success: true,
        promo: {
            status: isPromoActive ? "ON" : "OFF",
            badgeColor: isPromoActive ? "bg-[#E01A1A]" : "bg-[#23B14D]",
            priceDiffText: `(-Rp ${promoDiscount.toLocaleString('id-ID')})`,
            limitBulanIni: limitBulanIni,
            refPrice: "2.565.001"
        },
        history: history
    });
};