import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// COMPONENT TEMPLATES CRUD
// ============================================

// GET /api/components/templates - Tüm bileşen şablonlarını getir
router.get('/templates', async (req, res) => {
    try {
        const { type, category } = req.query;

        const where: any = {};
        if (type) where.type = type;
        if (category) where.category = category;

        const templates = await prisma.componentTemplate.findMany({
            where,
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });

        // JSON alanlarını parse et
        const parsedTemplates = templates.map((t) => ({
            ...t,
            connectionPoints: JSON.parse(t.connectionPoints),
            metadata: JSON.parse(t.metadata),
        }));

        res.json(parsedTemplates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Şablonlar alınamadı' });
    }
});

// GET /api/components/templates/:id - Belirli bir şablonu getir
router.get('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await prisma.componentTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ error: 'Şablon bulunamadı' });
        }

        res.json({
            ...template,
            connectionPoints: JSON.parse(template.connectionPoints),
            metadata: JSON.parse(template.metadata),
        });
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Şablon alınamadı' });
    }
});

// POST /api/components/templates - Yeni şablon oluştur (SVG import)
router.post('/templates', async (req, res) => {
    try {
        const { name, type, category, svgContent, width, height, connectionPoints, metadata } = req.body;

        if (!name || !type || !svgContent) {
            return res.status(400).json({ error: 'name, type ve svgContent zorunludur' });
        }

        // SVG boyutlarını hesapla (eğer belirtilmemişse)
        let parsedWidth = width || 100;
        let parsedHeight = height || 100;

        // SVG'den viewBox veya width/height çıkarmayı dene
        const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
        if (viewBoxMatch && (!width || !height)) {
            const [, , , vbWidth, vbHeight] = viewBoxMatch[1].split(/\s+/).map(Number);
            if (!width && vbWidth) parsedWidth = vbWidth;
            if (!height && vbHeight) parsedHeight = vbHeight;
        }

        const template = await prisma.componentTemplate.create({
            data: {
                name,
                type: type.toUpperCase(),
                category: category || 'custom',
                svgContent,
                width: parsedWidth,
                height: parsedHeight,
                connectionPoints: connectionPoints ? JSON.stringify(connectionPoints) : '[]',
                metadata: metadata ? JSON.stringify(metadata) : '{}',
                isDefault: false,
            },
        });

        res.status(201).json({
            ...template,
            connectionPoints: JSON.parse(template.connectionPoints),
            metadata: JSON.parse(template.metadata),
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Şablon oluşturulamadı' });
    }
});

// PUT /api/components/templates/:id - Şablonu güncelle
router.put('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, category, svgContent, width, height, connectionPoints, metadata } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (type) updateData.type = type.toUpperCase();
        if (category) updateData.category = category;
        if (svgContent) updateData.svgContent = svgContent;
        if (width) updateData.width = width;
        if (height) updateData.height = height;
        if (connectionPoints) updateData.connectionPoints = JSON.stringify(connectionPoints);
        if (metadata) updateData.metadata = JSON.stringify(metadata);

        const template = await prisma.componentTemplate.update({
            where: { id },
            data: updateData,
        });

        res.json({
            ...template,
            connectionPoints: JSON.parse(template.connectionPoints),
            metadata: JSON.parse(template.metadata),
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Şablon güncellenemedi' });
    }
});

// DELETE /api/components/templates/:id - Şablonu sil
router.delete('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Varsayılan şablonların silinmesini engelle
        const template = await prisma.componentTemplate.findUnique({
            where: { id },
        });

        if (template?.isDefault) {
            return res.status(400).json({ error: 'Varsayılan şablonlar silinemez' });
        }

        await prisma.componentTemplate.delete({
            where: { id },
        });

        res.json({ message: 'Şablon silindi' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Şablon silinemedi' });
    }
});

// ============================================
// COMPONENT TYPES/CATEGORIES
// ============================================

// GET /api/components/types - Tüm bileşen tiplerini getir
router.get('/types', async (req, res) => {
    try {
        const types = await prisma.componentTemplate.groupBy({
            by: ['type'],
            _count: { type: true },
        });

        const result = types.map((t) => ({
            type: t.type,
            count: t._count.type,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching types:', error);
        res.status(500).json({ error: 'Tipler alınamadı' });
    }
});

// GET /api/components/categories - Tüm kategorileri getir
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.componentTemplate.groupBy({
            by: ['category'],
            _count: { category: true },
        });

        const result = categories.map((c) => ({
            category: c.category,
            count: c._count.category,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Kategoriler alınamadı' });
    }
});

export default router;
