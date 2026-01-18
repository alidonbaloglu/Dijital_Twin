import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Simülasyon konfigürasyonu
const CONFIG = {
    updateInterval: 2000,        // 2 saniyede bir güncelle
    errorProbability: 0.015,     // %1.5 hata olasılığı
    maintenanceProbability: 0.01, // %1 bakım olasılığı
    recoveryTime: 20000,         // 20 saniye sonra kurtarma
    cycleTimeVariation: 0.2,     // Cycle time varyasyonu (%20)
};

// Üretim hattı sırası
const PRODUCTION_LINE = ['ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06'];

// İstasyonlar arası buffer (bekleme alanı)
const stationBuffers: Map<string, number> = new Map();

// İstasyon durumlarını takip et (hata/bakım zamanları)
const stationEvents: Map<string, { status: string; startTime: number }> = new Map();

// Üretim hedefleri (günlük)
const targetCounts: Record<string, number> = {
    'ST01': 500,
    'ST02': 500,
    'ST03': 500,
    'ST04': 500,
    'ST05': 500,
    'ST06': 500,
};

// Cycle time (saniye cinsinden)
const cycleTimes: Record<string, number> = {
    'ST01': 6,   // Welding - 6 saniye
    'ST02': 5,   // Assembly - 5 saniye
    'ST03': 8,   // Painting - 8 saniye
    'ST04': 4,   // Inspection - 4 saniye
    'ST05': 7,   // Testing - 7 saniye
    'ST06': 3,   // Packaging - 3 saniye
};

// Son üretim zamanları (cycle time takibi için)
const lastProductionTime: Map<string, number> = new Map();

/**
 * Tüm istasyonları sıfırla ve başlat
 */
async function initializeProductionLine(): Promise<void> {
    console.log('🚀 Üretim hattı sıfırlanıyor...');

    for (const stationId of PRODUCTION_LINE) {
        // Buffer'ları sıfırla
        stationBuffers.set(stationId, 0);

        // Üretim zamanlarını sıfırla
        lastProductionTime.set(stationId, Date.now());

        // Veritabanını sıfırla
        await prisma.station.update({
            where: { stationId },
            data: {
                status: stationId === 'ST01' ? 'RUNNING' : 'STOPPED',
                productionCount: 0,
                oee: 0,
                cycleTime: cycleTimes[stationId],
                targetCount: targetCounts[stationId],
            },
        });

        const status = stationId === 'ST01' ? '🟢 RUNNING' : '🔴 BEKLIYOR';
        console.log(`   ${stationId} - ${status} (Hedef: ${targetCounts[stationId]})`);
    }

    // İlk istasyon için başlangıç buffer'ı (hammadde)
    stationBuffers.set('RAW_MATERIAL', 999999); // Sınırsız hammadde

    console.log('');
}

/**
 * Önceki istasyonun buffer'ından ürün al
 */
function getPreviousStationId(stationId: string): string {
    const index = PRODUCTION_LINE.indexOf(stationId);
    if (index === 0) return 'RAW_MATERIAL';
    return PRODUCTION_LINE[index - 1];
}

/**
 * OEE hesapla
 */
function calculateOEE(productionCount: number, targetCount: number, uptime: number, totalTime: number): number {
    if (targetCount === 0 || totalTime === 0) return 0;

    const availability = Math.min(uptime / totalTime, 1);
    const performance = Math.min(productionCount / (targetCount * (totalTime / 3600000)), 1); // saat bazlı
    const quality = 0.98; // %98 kalite varsayımı

    const oee = availability * performance * quality * 100;

    // Gerçekçi OEE değerleri (0-100 arası, genellikle 60-95)
    return Math.min(99, Math.max(0, oee));
}

/**
 * Tek bir istasyonu güncelle
 */
async function updateStation(stationId: string, simulationStartTime: number): Promise<void> {
    const station = await prisma.station.findUnique({
        where: { stationId },
    });

    if (!station) return;

    const now = Date.now();
    const previousStationId = getPreviousStationId(stationId);
    const previousBuffer = stationBuffers.get(previousStationId) || 0;

    // Kurtarma kontrolü
    const event = stationEvents.get(stationId);
    if (event && now - event.startTime > CONFIG.recoveryTime) {
        console.log(`🔧 ${stationId} kurtarıldı: ${event.status} → RUNNING`);
        stationEvents.delete(stationId);

        await prisma.station.update({
            where: { stationId },
            data: { status: 'RUNNING' },
        });
        return;
    }

    // Hata/Bakım durumunda hiçbir şey yapma
    if (station.status === 'ERROR' || station.status === 'MAINTENANCE') {
        return;
    }

    // Önceki istasyondan ürün var mı?
    if (previousBuffer <= 0 && previousStationId !== 'RAW_MATERIAL') {
        // Ürün yok, bekle
        if (station.status === 'RUNNING') {
            await prisma.station.update({
                where: { stationId },
                data: { status: 'STOPPED' },
            });
        }
        return;
    }

    // Cycle time kontrolü
    const lastProduction = lastProductionTime.get(stationId) || now;
    const cycleTime = cycleTimes[stationId] * 1000; // milisaniye
    const variation = 1 + (Math.random() - 0.5) * CONFIG.cycleTimeVariation;
    const actualCycleTime = cycleTime * variation;

    if (now - lastProduction < actualCycleTime) {
        // Henüz cycle tamamlanmadı
        return;
    }

    // İstasyonu çalıştır
    if (station.status !== 'RUNNING') {
        await prisma.station.update({
            where: { stationId },
            data: { status: 'RUNNING' },
        });
        console.log(`▶️  ${stationId} çalışmaya başladı`);
    }

    // Rastgele olay kontrolü
    const random = Math.random();
    if (random < CONFIG.errorProbability) {
        stationEvents.set(stationId, { status: 'ERROR', startTime: now });
        await prisma.station.update({
            where: { stationId },
            data: { status: 'ERROR', oee: 0 },
        });
        console.log(`❌ ${stationId} HATA OLUŞTU!`);
        return;
    } else if (random < CONFIG.errorProbability + CONFIG.maintenanceProbability) {
        stationEvents.set(stationId, { status: 'MAINTENANCE', startTime: now });
        await prisma.station.update({
            where: { stationId },
            data: { status: 'MAINTENANCE', oee: 0 },
        });
        console.log(`🔧 ${stationId} BAKIMA ALINDI`);
        return;
    }

    // Üretim yap
    const newProductionCount = station.productionCount + 1;

    // Buffer'ları güncelle
    if (previousStationId !== 'RAW_MATERIAL') {
        stationBuffers.set(previousStationId, previousBuffer - 1);
    }
    stationBuffers.set(stationId, (stationBuffers.get(stationId) || 0) + 1);

    // Üretim zamanını güncelle
    lastProductionTime.set(stationId, now);

    // OEE hesapla
    const totalTime = now - simulationStartTime;
    const uptime = totalTime - (stationEvents.has(stationId) ? CONFIG.recoveryTime : 0);
    const newOEE = calculateOEE(newProductionCount, targetCounts[stationId], uptime, totalTime);

    await prisma.station.update({
        where: { stationId },
        data: {
            productionCount: newProductionCount,
            oee: newOEE,
        },
    });

    // Geçmişe kaydet
    await prisma.stationHistory.create({
        data: {
            stationId,
            status: 'RUNNING',
            oee: newOEE,
            productionCount: newProductionCount,
        },
    });
}

/**
 * Durum özeti yazdır
 */
async function printStatus(): Promise<void> {
    const stations = await prisma.station.findMany({
        orderBy: { stationId: 'asc' },
    });

    const time = new Date().toLocaleTimeString('tr-TR');
    console.log(`\n📊 [${time}] Üretim Hattı Durumu:`);
    console.log('─'.repeat(80));
    console.log('İstasyon  | Tip          | Durum      | OEE     | Üretim       | Buffer');
    console.log('─'.repeat(80));

    for (const station of stations) {
        const statusIcon = {
            'RUNNING': '🟢',
            'STOPPED': '🔴',
            'ERROR': '❌',
            'MAINTENANCE': '🔧',
        }[station.status] || '⚪';

        const oee = station.oee.toFixed(1).padStart(5);
        const progress = `${station.productionCount}/${station.targetCount}`;
        const buffer = stationBuffers.get(station.stationId) || 0;
        const bufferStr = station.stationId === 'ST06' ? `📦 ${buffer}` : buffer.toString();

        console.log(
            `${statusIcon} ${station.stationId}   | ${station.type.padEnd(12)} | ${station.status.padEnd(10)} | ${oee}%  | ${progress.padStart(12)} | ${bufferStr}`
        );
    }
    console.log('─'.repeat(80));

    // Toplam üretim
    const totalOutput = stationBuffers.get('ST06') || 0;
    console.log(`📦 Tamamlanan Ürünler: ${totalOutput}`);
}

/**
 * Ana simülasyon döngüsü
 */
async function runSimulation(): Promise<void> {
    console.log('═'.repeat(80));
    console.log('🏭 ÜRETİM HATTI SİMÜLASYONU');
    console.log('═'.repeat(80));
    console.log('📋 Üretim Akışı: ST01 → ST02 → ST03 → ST04 → ST05 → ST06 → 📦');
    console.log(`⚙️  Güncelleme Aralığı: ${CONFIG.updateInterval / 1000} saniye`);
    console.log(`⚙️  Hata Olasılığı: %${(CONFIG.errorProbability * 100).toFixed(1)}`);
    console.log('═'.repeat(80));
    console.log('');

    // Üretim hattını sıfırla ve başlat
    await initializeProductionLine();

    const simulationStartTime = Date.now();

    // İlk durumu yazdır
    await printStatus();

    // Simülasyon döngüsü
    let updateCount = 0;
    setInterval(async () => {
        // Tüm istasyonları sırayla güncelle
        for (const stationId of PRODUCTION_LINE) {
            await updateStation(stationId, simulationStartTime);
        }

        updateCount++;

        // Her 5 güncellemede bir durum yazdır
        if (updateCount % 5 === 0) {
            await printStatus();
        }
    }, CONFIG.updateInterval);

    console.log('\n💡 Simülasyonu durdurmak için Ctrl+C basın\n');
}

// Simülasyonu başlat
runSimulation()
    .catch((e) => {
        console.error('❌ Simülasyon hatası:', e);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Simülasyon durduruluyor...');

    // Son durumu yazdır
    await printStatus();

    await prisma.$disconnect();
    console.log('👋 Hoşça kalın!\n');
    process.exit(0);
});
