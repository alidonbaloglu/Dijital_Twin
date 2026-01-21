import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Status değerleri (SQLite enum desteklemediği için string olarak)
const StationStatus = {
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
  MAINTENANCE: 'MAINTENANCE',
} as const;

// Default Station SVG template
const stationSvgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
  <rect x="0" y="0" width="140" height="100" rx="6" fill="#3f4856" stroke="#5a6978" stroke-width="2"/>
  <rect x="8" y="8" width="124" height="84" rx="3" fill="none" stroke="#4a5568" stroke-width="1" stroke-dasharray="4,2"/>
  <circle class="status-lamp" cx="70" cy="80" r="8" fill="#9ca3af" stroke="#5a6978" stroke-width="1"/>
  <text x="70" y="30" font-size="16" font-weight="700" fill="#e5e7eb" text-anchor="middle" font-family="monospace">STATION</text>
  <text x="70" y="50" font-size="10" fill="#9ca3af" text-anchor="middle" font-family="monospace">TYPE</text>
</svg>`;

// Default Conveyor SVG template
const conveyorSvgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 20">
  <rect x="0" y="6" width="110" height="8" fill="#4a5568" stroke="#6b7280" stroke-width="1"/>
  <line x1="12" y1="6" x2="12" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="24" y1="6" x2="24" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="36" y1="6" x2="36" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="48" y1="6" x2="48" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="60" y1="6" x2="60" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="72" y1="6" x2="72" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="84" y1="6" x2="84" y2="14" stroke="#2d3748" stroke-width="1"/>
  <line x1="96" y1="6" x2="96" y2="14" stroke="#2d3748" stroke-width="1"/>
</svg>`;

// Robot SVG template
const robotSvgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="35" fill="#2d3748" stroke="#60a5fa" stroke-width="2"/>
  <circle cx="40" cy="40" r="25" fill="#3f4856" stroke="#5a6978" stroke-width="1"/>
  <line x1="40" y1="15" x2="40" y2="5" stroke="#60a5fa" stroke-width="3"/>
  <circle cx="40" cy="40" r="8" fill="#60a5fa"/>
  <text x="40" y="70" font-size="10" fill="#9ca3af" text-anchor="middle" font-family="monospace">ROBOT</text>
</svg>`;

// Buffer/Storage SVG template
const bufferSvgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80">
  <rect x="5" y="5" width="50" height="70" rx="4" fill="#2d3748" stroke="#f59e0b" stroke-width="2"/>
  <rect x="10" y="10" width="40" height="15" fill="#4a5568" stroke="#5a6978" stroke-width="1"/>
  <rect x="10" y="30" width="40" height="15" fill="#4a5568" stroke="#5a6978" stroke-width="1"/>
  <rect x="10" y="50" width="40" height="15" fill="#4a5568" stroke="#5a6978" stroke-width="1"/>
  <text x="30" y="78" font-size="8" fill="#f59e0b" text-anchor="middle" font-family="monospace">BUFFER</text>
</svg>`;

// ============================================
// Layout Drawing Elements (Çizim Elemanları)
// ============================================

// Floor/Ground Templates (Zemin Şablonları)
const factoryFloorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#374151" stroke="#4b5563" stroke-width="3"/>
  <defs>
    <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4b5563" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="400" height="300" fill="url(#floor-grid)"/>
</svg>`;

const warehouseFloorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#44403c" stroke="#78716c" stroke-width="3"/>
  <defs>
    <pattern id="warehouse-grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#57534e" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="400" height="300" fill="url(#warehouse-grid)"/>
</svg>`;

const officeFloorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
  <rect x="0" y="0" width="300" height="200" fill="#1e3a5f" stroke="#3b82f6" stroke-width="2"/>
  <defs>
    <pattern id="office-grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e40af" stroke-width="0.3"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="300" height="200" fill="url(#office-grid)"/>
</svg>`;

const assemblyFloorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
  <rect x="0" y="0" width="500" height="400" fill="#1f2937" stroke="#60a5fa" stroke-width="4"/>
  <defs>
    <pattern id="assembly-grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="500" height="400" fill="url(#assembly-grid)"/>
</svg>`;

// Pedestrian Walkway (Yürüme Yolu) - Horizontal
const pedestrianPathHSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40">
  <rect x="0" y="5" width="200" height="30" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="2" stroke-dasharray="10,5"/>
  <line x1="20" y1="20" x2="180" y2="20" stroke="#22c55e" stroke-width="1" stroke-dasharray="5,10"/>
  <text x="100" y="24" font-size="10" fill="#22c55e" text-anchor="middle" font-family="monospace">YÜRÜME YOLU</text>
</svg>`;

// Pedestrian Walkway (Yürüme Yolu) - Vertical
const pedestrianPathVSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 200">
  <rect x="5" y="0" width="30" height="200" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="2" stroke-dasharray="10,5"/>
  <line x1="20" y1="20" x2="20" y2="180" stroke="#22c55e" stroke-width="1" stroke-dasharray="5,10"/>
</svg>`;

// Forklift Path (Forklift Yolu) - Horizontal
const forkliftPathHSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
  <rect x="0" y="5" width="200" height="40" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="3"/>
  <line x1="10" y1="25" x2="40" y2="25" stroke="#f59e0b" stroke-width="2"/>
  <polygon points="40,20 50,25 40,30" fill="#f59e0b"/>
  <line x1="160" y1="25" x2="190" y2="25" stroke="#f59e0b" stroke-width="2"/>
  <polygon points="160,20 150,25 160,30" fill="#f59e0b"/>
  <text x="100" y="29" font-size="10" fill="#f59e0b" text-anchor="middle" font-family="monospace">FORKLİFT</text>
</svg>`;

// Forklift Path (Forklift Yolu) - Vertical
const forkliftPathVSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 200">
  <rect x="5" y="0" width="40" height="200" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="3"/>
  <line x1="25" y1="10" x2="25" y2="40" stroke="#f59e0b" stroke-width="2"/>
  <polygon points="20,40 25,50 30,40" fill="#f59e0b"/>
  <line x1="25" y1="160" x2="25" y2="190" stroke="#f59e0b" stroke-width="2"/>
  <polygon points="20,160 25,150 30,160" fill="#f59e0b"/>
</svg>`;

// Production Zone Boundary (Üretim Alanı Sınırı)
const productionZoneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
  <rect x="5" y="5" width="290" height="190" fill="#3b82f6" fill-opacity="0.05" stroke="#3b82f6" stroke-width="3" stroke-dasharray="15,5" rx="8"/>
  <rect x="10" y="10" width="80" height="20" fill="#3b82f6" fill-opacity="0.8" rx="4"/>
  <text x="50" y="24" font-size="10" fill="#fff" text-anchor="middle" font-family="monospace">ÜRETİM ALANI</text>
</svg>`;

// Safety Zone (Güvenlik Bölgesi)
const safetyZoneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">
  <rect x="5" y="5" width="140" height="140" fill="#ef4444" fill-opacity="0.1" stroke="#ef4444" stroke-width="3" rx="4"/>
  <line x1="5" y1="5" x2="145" y2="145" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,4"/>
  <line x1="145" y1="5" x2="5" y2="145" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,4"/>
  <rect x="45" y="60" width="60" height="30" fill="#ef4444" rx="4"/>
  <text x="75" y="80" font-size="10" fill="#fff" text-anchor="middle" font-family="monospace">TEHLİKE</text>
</svg>`;

// Floor Line Marking (Zemin Çizgisi) - Horizontal
const floorLineHSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 10">
  <rect x="0" y="2" width="200" height="6" fill="#fbbf24"/>
</svg>`;

// Floor Line Marking (Zemin Çizgisi) - Vertical
const floorLineVSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 200">
  <rect x="2" y="0" width="6" height="200" fill="#fbbf24"/>
</svg>`;

// Dashed Floor Line (Kesikli Zemin Çizgisi) - Horizontal
const dashedLineHSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 10">
  <line x1="0" y1="5" x2="200" y2="5" stroke="#fbbf24" stroke-width="4" stroke-dasharray="15,10"/>
</svg>`;

// Barrier/Fence (Bariyer/Çit)
const barrierSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 30">
  <rect x="0" y="10" width="200" height="10" fill="#dc2626"/>
  <rect x="10" y="0" width="8" height="30" fill="#6b7280"/>
  <rect x="50" y="0" width="8" height="30" fill="#6b7280"/>
  <rect x="90" y="0" width="8" height="30" fill="#6b7280"/>
  <rect x="130" y="0" width="8" height="30" fill="#6b7280"/>
  <rect x="170" y="0" width="8" height="30" fill="#6b7280"/>
</svg>`;

// Column/Pillar (Kolon)
const columnSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <rect x="5" y="5" width="30" height="30" fill="#4a5568" stroke="#6b7280" stroke-width="2"/>
  <line x1="5" y1="5" x2="35" y2="35" stroke="#6b7280" stroke-width="1"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#6b7280" stroke-width="1"/>
</svg>`;

// Zone Label (Alan Etiketi)
const zoneLabelSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect x="0" y="5" width="120" height="30" fill="#6366f1" rx="6"/>
  <text x="60" y="26" font-size="14" fill="#fff" text-anchor="middle" font-family="monospace" font-weight="bold">ALAN A</text>
</svg>`;

// Arrow Direction Marker (Yön Oku)
const arrowMarkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
  <polygon points="10,20 40,5 40,15 60,15 60,25 40,25 40,35" fill="#60a5fa"/>
</svg>`;

// Emergency Exit (Acil Çıkış)
const emergencyExitSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60">
  <rect x="0" y="0" width="80" height="60" fill="#22c55e" rx="4"/>
  <rect x="5" y="5" width="70" height="50" fill="none" stroke="#fff" stroke-width="2"/>
  <polygon points="25,30 40,15 40,25 55,25 55,35 40,35 40,45" fill="#fff"/>
  <text x="40" y="55" font-size="8" fill="#fff" text-anchor="middle" font-family="monospace">EXIT</text>
</svg>`;

// Fire Extinguisher Location (Yangın Söndürücü Yeri)
const fireExtinguisherSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50">
  <circle cx="20" cy="25" r="18" fill="#dc2626"/>
  <rect x="15" y="8" width="10" height="8" fill="#991b1b" rx="2"/>
  <rect x="18" y="3" width="4" height="6" fill="#6b7280"/>
  <text x="20" y="30" font-size="14" fill="#fff" text-anchor="middle" font-family="sans-serif" font-weight="bold">🧯</text>
</svg>`;

// Work Table (Çalışma Masası)
const workTableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
  <rect x="5" y="5" width="90" height="50" fill="#4a5568" stroke="#6b7280" stroke-width="2" rx="4"/>
  <rect x="10" y="10" width="80" height="40" fill="#374151" stroke="#5a6978" stroke-width="1"/>
</svg>`;

// Storage Rack (Raf)
const storageRackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
  <rect x="5" y="5" width="70" height="90" fill="none" stroke="#6b7280" stroke-width="3"/>
  <line x1="5" y1="30" x2="75" y2="30" stroke="#6b7280" stroke-width="2"/>
  <line x1="5" y1="55" x2="75" y2="55" stroke="#6b7280" stroke-width="2"/>
  <line x1="5" y1="80" x2="75" y2="80" stroke="#6b7280" stroke-width="2"/>
  <rect x="10" y="10" width="25" height="15" fill="#4a5568"/>
  <rect x="40" y="10" width="30" height="15" fill="#4a5568"/>
  <rect x="10" y="35" width="55" height="15" fill="#4a5568"/>
</svg>`;


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

  // ============================================
  // Component Templates (Varsayılan Şablonlar)
  // ============================================
  console.log('\n📦 Seeding component templates...');

  const stationTemplate = await prisma.componentTemplate.upsert({
    where: { id: 'default-station-template' },
    update: {},
    create: {
      id: 'default-station-template',
      name: 'Standart İstasyon',
      type: 'STATION',
      category: 'stations',
      svgContent: stationSvgTemplate,
      width: 140,
      height: 100,
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 50, direction: 'left' },
        { id: 'right', x: 140, y: 50, direction: 'right' },
        { id: 'top', x: 70, y: 0, direction: 'top' },
        { id: 'bottom', x: 70, y: 100, direction: 'bottom' },
      ]),
      metadata: JSON.stringify({ cycleTime: 30, capacity: 1 }),
      isDefault: true,
    },
  });
  console.log('✅ Station template created');

  const conveyorTemplate = await prisma.componentTemplate.upsert({
    where: { id: 'default-conveyor-template' },
    update: {},
    create: {
      id: 'default-conveyor-template',
      name: 'Standart Konveyör',
      type: 'CONVEYOR',
      category: 'conveyors',
      svgContent: conveyorSvgTemplate,
      width: 110,
      height: 20,
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 10, direction: 'left' },
        { id: 'right', x: 110, y: 10, direction: 'right' },
      ]),
      metadata: JSON.stringify({ speed: 1.5, length: 1 }),
      isDefault: true,
    },
  });
  console.log('✅ Conveyor template created');

  const robotTemplate = await prisma.componentTemplate.upsert({
    where: { id: 'default-robot-template' },
    update: {},
    create: {
      id: 'default-robot-template',
      name: 'Endüstriyel Robot',
      type: 'ROBOT',
      category: 'robots',
      svgContent: robotSvgTemplate,
      width: 80,
      height: 80,
      connectionPoints: JSON.stringify([
        { id: 'north', x: 40, y: 0, direction: 'top' },
        { id: 'south', x: 40, y: 80, direction: 'bottom' },
        { id: 'east', x: 80, y: 40, direction: 'right' },
        { id: 'west', x: 0, y: 40, direction: 'left' },
      ]),
      metadata: JSON.stringify({ reach: 2.5, payload: 10 }),
      isDefault: true,
    },
  });
  console.log('✅ Robot template created');

  const bufferTemplate = await prisma.componentTemplate.upsert({
    where: { id: 'default-buffer-template' },
    update: {},
    create: {
      id: 'default-buffer-template',
      name: 'Buffer/Depo',
      type: 'BUFFER',
      category: 'storage',
      svgContent: bufferSvgTemplate,
      width: 60,
      height: 80,
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 40, direction: 'left' },
        { id: 'right', x: 60, y: 40, direction: 'right' },
      ]),
      metadata: JSON.stringify({ capacity: 50, type: 'FIFO' }),
      isDefault: true,
    },
  });
  console.log('✅ Buffer template created');

  // ============================================
  // Layout Drawing Element Templates
  // ============================================
  console.log('\n🛤️ Seeding layout drawing element templates...');

  // ============================================
  // Floor Templates (Zemin Şablonları)
  // ============================================
  await prisma.componentTemplate.upsert({
    where: { id: 'factory-floor' },
    update: {},
    create: {
      id: 'factory-floor',
      name: 'Fabrika Zemini',
      type: 'FLOOR',
      category: 'floors',
      svgContent: factoryFloorSvg,
      width: 400,
      height: 300,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ floorType: 'factory', zIndex: -10 }),
      isDefault: true,
    },
  });

  await prisma.componentTemplate.upsert({
    where: { id: 'warehouse-floor' },
    update: {},
    create: {
      id: 'warehouse-floor',
      name: 'Depo Zemini',
      type: 'FLOOR',
      category: 'floors',
      svgContent: warehouseFloorSvg,
      width: 400,
      height: 300,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ floorType: 'warehouse', zIndex: -10 }),
      isDefault: true,
    },
  });

  await prisma.componentTemplate.upsert({
    where: { id: 'office-floor' },
    update: {},
    create: {
      id: 'office-floor',
      name: 'Ofis Zemini',
      type: 'FLOOR',
      category: 'floors',
      svgContent: officeFloorSvg,
      width: 300,
      height: 200,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ floorType: 'office', zIndex: -10 }),
      isDefault: true,
    },
  });

  await prisma.componentTemplate.upsert({
    where: { id: 'assembly-floor' },
    update: {},
    create: {
      id: 'assembly-floor',
      name: 'Montaj Hattı Zemini',
      type: 'FLOOR',
      category: 'floors',
      svgContent: assemblyFloorSvg,
      width: 500,
      height: 400,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ floorType: 'assembly', zIndex: -10 }),
      isDefault: true,
    },
  });
  console.log('✅ 4 floor templates created');

  // ============================================
  // Path Templates with Connection Points
  // ============================================

  // Pedestrian Walkway - Horizontal (with connection points)
  await prisma.componentTemplate.upsert({
    where: { id: 'pedestrian-path-h' },
    update: {
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 20, direction: 'left' },
        { id: 'right', x: 200, y: 20, direction: 'right' },
      ]),
    },
    create: {
      id: 'pedestrian-path-h',
      name: 'Yürüme Yolu (Yatay)',
      type: 'PATH',
      category: 'paths',
      svgContent: pedestrianPathHSvg,
      width: 200,
      height: 40,
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 20, direction: 'left' },
        { id: 'right', x: 200, y: 20, direction: 'right' },
      ]),
      metadata: JSON.stringify({ pathType: 'pedestrian', orientation: 'horizontal' }),
      isDefault: true,
    },
  });

  // Pedestrian Walkway - Vertical (with connection points)
  await prisma.componentTemplate.upsert({
    where: { id: 'pedestrian-path-v' },
    update: {
      connectionPoints: JSON.stringify([
        { id: 'top', x: 20, y: 0, direction: 'top' },
        { id: 'bottom', x: 20, y: 200, direction: 'bottom' },
      ]),
    },
    create: {
      id: 'pedestrian-path-v',
      name: 'Yürüme Yolu (Dikey)',
      type: 'PATH',
      category: 'paths',
      svgContent: pedestrianPathVSvg,
      width: 40,
      height: 200,
      connectionPoints: JSON.stringify([
        { id: 'top', x: 20, y: 0, direction: 'top' },
        { id: 'bottom', x: 20, y: 200, direction: 'bottom' },
      ]),
      metadata: JSON.stringify({ pathType: 'pedestrian', orientation: 'vertical' }),
      isDefault: true,
    },
  });

  // Forklift Path - Horizontal (with connection points)
  await prisma.componentTemplate.upsert({
    where: { id: 'forklift-path-h' },
    update: {
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 25, direction: 'left' },
        { id: 'right', x: 200, y: 25, direction: 'right' },
      ]),
    },
    create: {
      id: 'forklift-path-h',
      name: 'Forklift Yolu (Yatay)',
      type: 'PATH',
      category: 'paths',
      svgContent: forkliftPathHSvg,
      width: 200,
      height: 50,
      connectionPoints: JSON.stringify([
        { id: 'left', x: 0, y: 25, direction: 'left' },
        { id: 'right', x: 200, y: 25, direction: 'right' },
      ]),
      metadata: JSON.stringify({ pathType: 'forklift', orientation: 'horizontal' }),
      isDefault: true,
    },
  });

  // Forklift Path - Vertical (with connection points)
  await prisma.componentTemplate.upsert({
    where: { id: 'forklift-path-v' },
    update: {
      connectionPoints: JSON.stringify([
        { id: 'top', x: 25, y: 0, direction: 'top' },
        { id: 'bottom', x: 25, y: 200, direction: 'bottom' },
      ]),
    },
    create: {
      id: 'forklift-path-v',
      name: 'Forklift Yolu (Dikey)',
      type: 'PATH',
      category: 'paths',
      svgContent: forkliftPathVSvg,
      width: 50,
      height: 200,
      connectionPoints: JSON.stringify([
        { id: 'top', x: 25, y: 0, direction: 'top' },
        { id: 'bottom', x: 25, y: 200, direction: 'bottom' },
      ]),
      metadata: JSON.stringify({ pathType: 'forklift', orientation: 'vertical' }),
      isDefault: true,
    },
  });

  // Production Zone
  await prisma.componentTemplate.upsert({
    where: { id: 'production-zone' },
    update: {},
    create: {
      id: 'production-zone',
      name: 'Üretim Alanı',
      type: 'ZONE',
      category: 'zones',
      svgContent: productionZoneSvg,
      width: 300,
      height: 200,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ zoneType: 'production' }),
      isDefault: true,
    },
  });

  // Safety Zone
  await prisma.componentTemplate.upsert({
    where: { id: 'safety-zone' },
    update: {},
    create: {
      id: 'safety-zone',
      name: 'Güvenlik Bölgesi',
      type: 'ZONE',
      category: 'zones',
      svgContent: safetyZoneSvg,
      width: 150,
      height: 150,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ zoneType: 'safety', restricted: true }),
      isDefault: true,
    },
  });

  // Floor Line - Horizontal
  await prisma.componentTemplate.upsert({
    where: { id: 'floor-line-h' },
    update: {},
    create: {
      id: 'floor-line-h',
      name: 'Zemin Çizgisi (Yatay)',
      type: 'LINE',
      category: 'markings',
      svgContent: floorLineHSvg,
      width: 200,
      height: 10,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ lineType: 'solid', orientation: 'horizontal' }),
      isDefault: true,
    },
  });

  // Floor Line - Vertical
  await prisma.componentTemplate.upsert({
    where: { id: 'floor-line-v' },
    update: {},
    create: {
      id: 'floor-line-v',
      name: 'Zemin Çizgisi (Dikey)',
      type: 'LINE',
      category: 'markings',
      svgContent: floorLineVSvg,
      width: 10,
      height: 200,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ lineType: 'solid', orientation: 'vertical' }),
      isDefault: true,
    },
  });

  // Dashed Line - Horizontal
  await prisma.componentTemplate.upsert({
    where: { id: 'dashed-line-h' },
    update: {},
    create: {
      id: 'dashed-line-h',
      name: 'Kesikli Çizgi (Yatay)',
      type: 'LINE',
      category: 'markings',
      svgContent: dashedLineHSvg,
      width: 200,
      height: 10,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ lineType: 'dashed', orientation: 'horizontal' }),
      isDefault: true,
    },
  });

  // Barrier/Fence
  await prisma.componentTemplate.upsert({
    where: { id: 'barrier' },
    update: {},
    create: {
      id: 'barrier',
      name: 'Bariyer/Çit',
      type: 'BARRIER',
      category: 'safety',
      svgContent: barrierSvg,
      width: 200,
      height: 30,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ barrierType: 'fence' }),
      isDefault: true,
    },
  });

  // Column/Pillar
  await prisma.componentTemplate.upsert({
    where: { id: 'column' },
    update: {},
    create: {
      id: 'column',
      name: 'Kolon',
      type: 'STRUCTURE',
      category: 'structures',
      svgContent: columnSvg,
      width: 40,
      height: 40,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ structureType: 'column' }),
      isDefault: true,
    },
  });

  // Zone Label
  await prisma.componentTemplate.upsert({
    where: { id: 'zone-label' },
    update: {},
    create: {
      id: 'zone-label',
      name: 'Alan Etiketi',
      type: 'LABEL',
      category: 'labels',
      svgContent: zoneLabelSvg,
      width: 120,
      height: 40,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ labelType: 'zone' }),
      isDefault: true,
    },
  });

  // Arrow Direction Marker
  await prisma.componentTemplate.upsert({
    where: { id: 'arrow-marker' },
    update: {},
    create: {
      id: 'arrow-marker',
      name: 'Yön Oku',
      type: 'MARKER',
      category: 'markings',
      svgContent: arrowMarkerSvg,
      width: 60,
      height: 40,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ markerType: 'direction' }),
      isDefault: true,
    },
  });

  // Emergency Exit
  await prisma.componentTemplate.upsert({
    where: { id: 'emergency-exit' },
    update: {},
    create: {
      id: 'emergency-exit',
      name: 'Acil Çıkış',
      type: 'SAFETY',
      category: 'safety',
      svgContent: emergencyExitSvg,
      width: 80,
      height: 60,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ safetyType: 'exit' }),
      isDefault: true,
    },
  });

  // Fire Extinguisher
  await prisma.componentTemplate.upsert({
    where: { id: 'fire-extinguisher' },
    update: {},
    create: {
      id: 'fire-extinguisher',
      name: 'Yangın Söndürücü',
      type: 'SAFETY',
      category: 'safety',
      svgContent: fireExtinguisherSvg,
      width: 40,
      height: 50,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ safetyType: 'fire' }),
      isDefault: true,
    },
  });

  // Work Table
  await prisma.componentTemplate.upsert({
    where: { id: 'work-table' },
    update: {},
    create: {
      id: 'work-table',
      name: 'Çalışma Masası',
      type: 'FURNITURE',
      category: 'furniture',
      svgContent: workTableSvg,
      width: 100,
      height: 60,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ furnitureType: 'table' }),
      isDefault: true,
    },
  });

  // Storage Rack
  await prisma.componentTemplate.upsert({
    where: { id: 'storage-rack' },
    update: {},
    create: {
      id: 'storage-rack',
      name: 'Depo Rafı',
      type: 'STORAGE',
      category: 'storage',
      svgContent: storageRackSvg,
      width: 80,
      height: 100,
      connectionPoints: JSON.stringify([]),
      metadata: JSON.stringify({ storageType: 'rack' }),
      isDefault: true,
    },
  });

  console.log('✅ 18 layout drawing element templates created');

  // ============================================
  // Production Line (Varsayılan Üretim Hattı)
  // ============================================
  console.log('\n🏭 Seeding production line...');

  const productionLine = await prisma.productionLine.upsert({
    where: { id: 'default-production-line' },
    update: {},
    create: {
      id: 'default-production-line',
      name: 'Ana Üretim Hattı',
      description: 'Otomotiv montaj üretim hattı - 6 istasyonlu',
      isActive: true,
      viewBox: '0 0 1600 600',
      gridSize: 20,
      backgroundColor: '#2a2e38',
    },
  });
  console.log('✅ Production line created');

  // ============================================
  // Layout Components (Varsayılan Yerleşim)
  // ============================================
  console.log('\n📍 Seeding layout components...');

  const stationPositions = [
    { id: 'layout-st01', instanceName: 'ST01', x: 80, y: 200 },
    { id: 'layout-st02', instanceName: 'ST02', x: 330, y: 200 },
    { id: 'layout-st03', instanceName: 'ST03', x: 580, y: 200 },
    { id: 'layout-st04', instanceName: 'ST04', x: 830, y: 200 },
    { id: 'layout-st05', instanceName: 'ST05', x: 1080, y: 200 },
    { id: 'layout-st06', instanceName: 'ST06', x: 1330, y: 200 },
  ];

  for (const pos of stationPositions) {
    await prisma.layoutComponent.upsert({
      where: { id: pos.id },
      update: { x: pos.x, y: pos.y },
      create: {
        id: pos.id,
        productionLineId: productionLine.id,
        templateId: stationTemplate.id,
        instanceName: pos.instanceName,
        x: pos.x,
        y: pos.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 1,
      },
    });
    console.log(`✅ Layout component ${pos.instanceName} created`);
  }

  // Konveyör pozisyonları
  const conveyorPositions = [
    { id: 'layout-conv01', instanceName: 'CONV-01', x: 220, y: 240 },
    { id: 'layout-conv02', instanceName: 'CONV-02', x: 470, y: 240 },
    { id: 'layout-conv03', instanceName: 'CONV-03', x: 720, y: 240 },
    { id: 'layout-conv04', instanceName: 'CONV-04', x: 970, y: 240 },
    { id: 'layout-conv05', instanceName: 'CONV-05', x: 1220, y: 240 },
  ];

  for (const pos of conveyorPositions) {
    await prisma.layoutComponent.upsert({
      where: { id: pos.id },
      update: { x: pos.x, y: pos.y },
      create: {
        id: pos.id,
        productionLineId: productionLine.id,
        templateId: conveyorTemplate.id,
        instanceName: pos.instanceName,
        x: pos.x,
        y: pos.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 0,
      },
    });
    console.log(`✅ Layout component ${pos.instanceName} created`);
  }

  // ============================================
  // Layout Connections (Bağlantılar)
  // ============================================
  console.log('\n🔗 Seeding layout connections...');

  const connections = [
    { id: 'conn-01', from: 'layout-st01', to: 'layout-conv01', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-02', from: 'layout-conv01', to: 'layout-st02', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-03', from: 'layout-st02', to: 'layout-conv02', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-04', from: 'layout-conv02', to: 'layout-st03', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-05', from: 'layout-st03', to: 'layout-conv03', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-06', from: 'layout-conv03', to: 'layout-st04', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-07', from: 'layout-st04', to: 'layout-conv04', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-08', from: 'layout-conv04', to: 'layout-st05', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-09', from: 'layout-st05', to: 'layout-conv05', fromPoint: 'right', toPoint: 'left' },
    { id: 'conn-10', from: 'layout-conv05', to: 'layout-st06', fromPoint: 'right', toPoint: 'left' },
  ];

  for (const conn of connections) {
    await prisma.layoutConnection.upsert({
      where: { id: conn.id },
      update: {},
      create: {
        id: conn.id,
        productionLineId: productionLine.id,
        fromComponentId: conn.from,
        toComponentId: conn.to,
        fromPointId: conn.fromPoint,
        toPointId: conn.toPoint,
        connectionType: 'material',
        pathStyle: 'straight',
        color: '#60a5fa',
        animated: true,
      },
    });
  }
  console.log('✅ 10 connections created');

  console.log('\n✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

