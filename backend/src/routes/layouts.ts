import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// PRODUCTION LINES CRUD
// ============================================

// GET /api/layouts - Tüm üretim hatlarını getir
router.get('/', async (req, res) => {
    try {
        const layouts = await prisma.productionLine.findMany({
            include: {
                components: {
                    include: {
                        template: true,
                    },
                    orderBy: { zIndex: 'asc' },
                },
                connections: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(layouts);
    } catch (error) {
        console.error('Error fetching layouts:', error);
        res.status(500).json({ error: 'Layout listesi alınamadı' });
    }
});

// GET /api/layouts/:id - Belirli bir üretim hattını getir
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const layout = await prisma.productionLine.findUnique({
            where: { id },
            include: {
                components: {
                    include: {
                        template: true,
                    },
                    orderBy: { zIndex: 'asc' },
                },
                connections: true,
            },
        });

        if (!layout) {
            return res.status(404).json({ error: 'Layout bulunamadı' });
        }

        res.json(layout);
    } catch (error) {
        console.error('Error fetching layout:', error);
        res.status(500).json({ error: 'Layout alınamadı' });
    }
});

// POST /api/layouts - Yeni üretim hattı oluştur
router.post('/', async (req, res) => {
    try {
        const { name, description, viewBox, gridSize, backgroundColor } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'İsim zorunludur' });
        }

        const layout = await prisma.productionLine.create({
            data: {
                name,
                description,
                viewBox: viewBox || '0 0 1600 600',
                gridSize: gridSize || 20,
                backgroundColor: backgroundColor || '#2a2e38',
            },
        });

        res.status(201).json(layout);
    } catch (error) {
        console.error('Error creating layout:', error);
        res.status(500).json({ error: 'Layout oluşturulamadı' });
    }
});

// PUT /api/layouts/:id - Üretim hattını güncelle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive, viewBox, gridSize, backgroundColor } = req.body;

        const layout = await prisma.productionLine.update({
            where: { id },
            data: {
                name,
                description,
                isActive,
                viewBox,
                gridSize,
                backgroundColor,
            },
        });

        res.json(layout);
    } catch (error) {
        console.error('Error updating layout:', error);
        res.status(500).json({ error: 'Layout güncellenemedi' });
    }
});

// DELETE /api/layouts/:id - Üretim hattını sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.productionLine.delete({
            where: { id },
        });

        res.json({ message: 'Layout silindi' });
    } catch (error) {
        console.error('Error deleting layout:', error);
        res.status(500).json({ error: 'Layout silinemedi' });
    }
});

// ============================================
// LAYOUT COMPONENTS
// ============================================

// POST /api/layouts/:id/components - Bileşen ekle
router.post('/:id/components', async (req, res) => {
    try {
        const { id: productionLineId } = req.params;
        const { templateId, instanceName, x, y, rotation, scaleX, scaleY, zIndex, customData } = req.body;

        if (!templateId || !instanceName) {
            return res.status(400).json({ error: 'templateId ve instanceName zorunludur' });
        }

        const component = await prisma.layoutComponent.create({
            data: {
                productionLineId,
                templateId,
                instanceName,
                x: x || 0,
                y: y || 0,
                rotation: rotation || 0,
                scaleX: scaleX || 1,
                scaleY: scaleY || 1,
                zIndex: zIndex || 0,
                customData: customData ? JSON.stringify(customData) : '{}',
            },
            include: {
                template: true,
            },
        });

        res.status(201).json(component);
    } catch (error) {
        console.error('Error adding component:', error);
        res.status(500).json({ error: 'Bileşen eklenemedi' });
    }
});

// PUT /api/layouts/:layoutId/components/:componentId - Bileşeni güncelle
router.put('/:layoutId/components/:componentId', async (req, res) => {
    try {
        const { componentId } = req.params;
        const { instanceName, x, y, rotation, scaleX, scaleY, zIndex, isLocked, customData } = req.body;

        const component = await prisma.layoutComponent.update({
            where: { id: componentId },
            data: {
                instanceName,
                x,
                y,
                rotation,
                scaleX,
                scaleY,
                zIndex,
                isLocked,
                customData: customData ? JSON.stringify(customData) : undefined,
            },
            include: {
                template: true,
            },
        });

        res.json(component);
    } catch (error) {
        console.error('Error updating component:', error);
        res.status(500).json({ error: 'Bileşen güncellenemedi' });
    }
});

// DELETE /api/layouts/:layoutId/components/:componentId - Bileşeni sil
router.delete('/:layoutId/components/:componentId', async (req, res) => {
    try {
        const { componentId } = req.params;

        await prisma.layoutComponent.delete({
            where: { id: componentId },
        });

        res.json({ message: 'Bileşen silindi' });
    } catch (error) {
        console.error('Error deleting component:', error);
        res.status(500).json({ error: 'Bileşen silinemedi' });
    }
});

// ============================================
// LAYOUT CONNECTIONS
// ============================================

// POST /api/layouts/:id/connections - Bağlantı ekle
router.post('/:id/connections', async (req, res) => {
    try {
        const { id: productionLineId } = req.params;
        const { fromComponentId, toComponentId, fromPointId, toPointId, connectionType, pathStyle, color, animated } = req.body;

        if (!fromComponentId || !toComponentId || !fromPointId || !toPointId) {
            return res.status(400).json({ error: 'Bağlantı noktaları zorunludur' });
        }

        const connection = await prisma.layoutConnection.create({
            data: {
                productionLineId,
                fromComponentId,
                toComponentId,
                fromPointId,
                toPointId,
                connectionType: connectionType || 'material',
                pathStyle: pathStyle || 'bezier',
                color: color || '#60a5fa',
                animated: animated !== false,
            },
        });

        res.status(201).json(connection);
    } catch (error) {
        console.error('Error adding connection:', error);
        res.status(500).json({ error: 'Bağlantı eklenemedi' });
    }
});

// DELETE /api/layouts/:layoutId/connections/:connectionId - Bağlantıyı sil
router.delete('/:layoutId/connections/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;

        await prisma.layoutConnection.delete({
            where: { id: connectionId },
        });

        res.json({ message: 'Bağlantı silindi' });
    } catch (error) {
        console.error('Error deleting connection:', error);
        res.status(500).json({ error: 'Bağlantı silinemedi' });
    }
});

export default router;
