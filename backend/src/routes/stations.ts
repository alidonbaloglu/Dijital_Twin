import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { StationStatus } from '@prisma/client';

const router = Router();

// GET /api/stations - Tüm istasyonları getir
router.get('/', async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      orderBy: {
        stationId: 'asc',
      },
    });

    // Prisma enum'ını frontend formatına çevir
    const formattedStations = stations.map((station) => ({
      id: station.stationId,
      status: station.status as StationStatus,
      type: station.type,
      oee: station.oee,
      productionCount: station.productionCount,
      targetCount: station.targetCount,
      cycleTime: station.cycleTime,
      operator: station.operator,
      lastUpdate: station.updatedAt.toLocaleTimeString('tr-TR'),
    }));

    res.json(formattedStations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'İstasyonlar getirilirken hata oluştu' });
  }
});

// GET /api/stations/:id - Belirli bir istasyonu getir
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const station = await prisma.station.findUnique({
        where: { stationId: id },
      });

      if (!station) {
        return res.status(404).json({ error: 'İstasyon bulunamadı' });
      }

      res.json({
        id: station.stationId,
        status: station.status as StationStatus,
        type: station.type,
        oee: station.oee,
        productionCount: station.productionCount,
        targetCount: station.targetCount,
        cycleTime: station.cycleTime,
        operator: station.operator,
        lastUpdate: station.updatedAt.toLocaleTimeString('tr-TR'),
      });
    } catch (error) {
      console.error('Error fetching station:', error);
      res.status(500).json({ error: 'İstasyon getirilirken hata oluştu' });
    }
  }
);

// PUT /api/stations/:id/status - İstasyon durumunu güncelle
router.put(
  '/:id/status',
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['RUNNING', 'STOPPED', 'ERROR', 'MAINTENANCE']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      const station = await prisma.station.update({
        where: { stationId: id },
        data: { status: status as StationStatus },
      });

      // Geçmişe kaydet
      await prisma.stationHistory.create({
        data: {
          stationId: id,
          status: status as StationStatus,
          oee: station.oee,
          productionCount: station.productionCount,
        },
      });

      res.json({
        id: station.stationId,
        status: station.status as StationStatus,
        message: 'İstasyon durumu güncellendi',
      });
    } catch (error) {
      console.error('Error updating station status:', error);
      res.status(500).json({ error: 'İstasyon durumu güncellenirken hata oluştu' });
    }
  }
);

// PUT /api/stations/:id - İstasyon bilgilerini güncelle
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('oee').optional().isFloat({ min: 0, max: 100 }),
    body('productionCount').optional().isInt({ min: 0 }),
    body('targetCount').optional().isInt({ min: 0 }),
    body('cycleTime').optional().isInt({ min: 0 }),
    body('operator').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      const station = await prisma.station.update({
        where: { stationId: id },
        data: updateData,
      });

      res.json({
        id: station.stationId,
        status: station.status as StationStatus,
        type: station.type,
        oee: station.oee,
        productionCount: station.productionCount,
        targetCount: station.targetCount,
        cycleTime: station.cycleTime,
        operator: station.operator,
        lastUpdate: station.updatedAt.toLocaleTimeString('tr-TR'),
      });
    } catch (error) {
      console.error('Error updating station:', error);
      res.status(500).json({ error: 'İstasyon güncellenirken hata oluştu' });
    }
  }
);

// GET /api/stations/:id/history - İstasyon geçmişini getir
router.get(
  '/:id/history',
  [param('id').isString().notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { limit = '100' } = req.query;

      const history = await prisma.stationHistory.findMany({
        where: { stationId: id },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
      });

      res.json(history);
    } catch (error) {
      console.error('Error fetching station history:', error);
      res.status(500).json({ error: 'İstasyon geçmişi getirilirken hata oluştu' });
    }
  }
);

export default router;
