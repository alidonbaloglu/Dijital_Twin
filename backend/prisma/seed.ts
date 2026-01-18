import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Status değerleri (SQLite enum desteklemediği için string olarak)
const StationStatus = {
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
  MAINTENANCE: 'MAINTENANCE',
} as const;

async function main() {
  console.log('🌱 Seeding database...');

  // İstasyonları oluştur
  const stations = [
    {
      stationId: 'ST01',
      type: 'WELDING',
      status: StationStatus.RUNNING,
      oee: 87.5,
      productionCount: 1247,
      targetCount: 1425,
      cycleTime: 42,
      operator: 'OP-1',
    },
    {
      stationId: 'ST02',
      type: 'ASSEMBLY',
      status: StationStatus.ERROR,
      oee: 0,
      productionCount: 892,
      targetCount: 1200,
      cycleTime: 38,
      operator: 'OP-2',
    },
    {
      stationId: 'ST03',
      type: 'PAINTING',
      status: StationStatus.STOPPED,
      oee: 0,
      productionCount: 1056,
      targetCount: 1350,
      cycleTime: 35,
      operator: 'OP-3',
    },
    {
      stationId: 'ST04',
      type: 'INSPECTION',
      status: StationStatus.RUNNING,
      oee: 92.3,
      productionCount: 1389,
      targetCount: 1500,
      cycleTime: 28,
      operator: 'OP-4',
    },
    {
      stationId: 'ST05',
      type: 'TESTING',
      status: StationStatus.MAINTENANCE,
      oee: 25,
      productionCount: 1123,
      targetCount: 1400,
      cycleTime: 45,
      operator: 'OP-5',
    },
    {
      stationId: 'ST06',
      type: 'PACKAGING',
      status: StationStatus.RUNNING,
      oee: 89.1,
      productionCount: 1334,
      targetCount: 1500,
      cycleTime: 32,
      operator: 'OP-6',
    },
  ];

  for (const station of stations) {
    await prisma.station.upsert({
      where: { stationId: station.stationId },
      update: station,
      create: station,
    });
    console.log(`✅ Station ${station.stationId} seeded`);
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
