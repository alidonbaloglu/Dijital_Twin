/**
 * DXF to SVG Converter Utility
 * Simple parser for common DXF entities: LINE, LWPOLYLINE, CIRCLE, ARC
 */

// Point interface removed as it was unused

interface DxfEntity {
    type: string;
    layer: string;
    [key: string]: any;
}

export interface DxfParseResult {
    svg: string;
    width: number;
    height: number;
    viewBox: string;
    stats: {
        totalEntities: number;
        processed: number;
        skipped: number;
        skippedTypes: Record<string, number>;
    };
}

/**
 * Parses a DXF string and returns SVG content with dimensions
 */
export const dxfToSvg = (dxfContent: string): DxfParseResult => {
    // Basic limit check to prevent massive files from crashing
    if (dxfContent.length > 50 * 1024 * 1024) { // 50MB limit text length
        throw new Error('Dosya boyutu çok yüksek (50MB+). Lütfen daha küçük/basit bir dosya kullanın.');
    }

    const lines = dxfContent.split(/\r?\n/);
    const entities: DxfEntity[] = [];
    let currentEntity: DxfEntity | null = null;
    let section = '';

    const stats = {
        totalEntities: 0,
        processed: 0,
        skipped: 0,
        skippedTypes: {} as Record<string, number>
    };

    // Helper to get group code and value
    const getGroup = (index: number) => {
        if (index >= lines.length - 1) return null;
        return {
            code: parseInt(lines[index].trim()),
            value: lines[index + 1].trim()
        };
    };

    // 1. Parse Entities
    for (let i = 0; i < lines.length; i += 2) {
        const group = getGroup(i);
        if (!group) break;

        if (group.code === 0 && group.value === 'SECTION') {
            const nextGroup = getGroup(i + 2);
            if (nextGroup && nextGroup.code === 2) {
                section = nextGroup.value;
            }
        }

        if (section === 'ENTITIES') {
            if (group.code === 0) {
                // New Entity Start
                if (currentEntity) {
                    entities.push(currentEntity);
                    stats.processed++;
                }

                const type = group.value;
                if (['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'POLYLINE'].includes(type)) {
                    currentEntity = { type, layer: '0' };
                    stats.totalEntities++;
                } else if (type !== 'SECTION' && type !== 'ENDSEC' && type !== 'ENTITIES') {
                    // Track unsupported entities
                    stats.skipped++;
                    stats.skippedTypes[type] = (stats.skippedTypes[type] || 0) + 1;
                    currentEntity = null;
                } else {
                    currentEntity = null;
                }
            } else if (currentEntity) {
                // Add properties to current entity
                switch (group.code) {
                    case 8: currentEntity.layer = group.value; break;
                    case 10: currentEntity.x = parseFloat(group.value); break; // Start X / Center X
                    case 20: currentEntity.y = parseFloat(group.value); break; // Start Y / Center Y
                    case 11: currentEntity.x2 = parseFloat(group.value); break; // End X
                    case 21: currentEntity.y2 = parseFloat(group.value); break; // End Y
                    case 40: currentEntity.radius = parseFloat(group.value); break; // Radius
                    case 50: currentEntity.startAngle = parseFloat(group.value); break; // Start Angle
                    case 51: currentEntity.endAngle = parseFloat(group.value); break; // End Angle
                    // LWPOLYLINE specific
                    case 90: currentEntity.count = parseInt(group.value); currentEntity.points = []; break;
                }

                // Polyline vertices handling (simplified)
                if (currentEntity.type === 'LWPOLYLINE' && (group.code === 10 || group.code === 20)) {
                    if (!currentEntity.points) currentEntity.points = [];
                    if (group.code === 10) currentEntity.lastX = parseFloat(group.value);
                    if (group.code === 20 && currentEntity.lastX !== undefined) {
                        currentEntity.points.push({ x: currentEntity.lastX, y: parseFloat(group.value) });
                    }
                }
            }
        }
    }
    // Push last entity
    if (currentEntity) {
        entities.push(currentEntity);
        stats.processed++;
    }

    // 2. Convert to SVG Paths & Calculate Bounds
    let paths: string[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const updateBounds = (x: number, y: number) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    };

    const updateBoundsCircle = (cx: number, cy: number, r: number) => {
        updateBounds(cx - r, cy - r);
        updateBounds(cx + r, cy + r);
    };

    entities.forEach(ent => {
        let d = '';
        try {
            switch (ent.type) {
                case 'LINE':
                    if (isNaN(ent.x) || isNaN(ent.y) || isNaN(ent.x2) || isNaN(ent.y2)) break;
                    d = `M ${ent.x} ${-ent.y} L ${ent.x2} ${-ent.y2}`; // Flip Y for SVG
                    updateBounds(ent.x, -ent.y);
                    updateBounds(ent.x2, -ent.y2);
                    break;
                case 'LWPOLYLINE':
                case 'POLYLINE':
                    if (ent.points && ent.points.length > 0) {
                        d = `M ${ent.points[0].x} ${-ent.points[0].y}`;
                        updateBounds(ent.points[0].x, -ent.points[0].y);
                        for (let k = 1; k < ent.points.length; k++) {
                            d += ` L ${ent.points[k].x} ${-ent.points[k].y}`;
                            updateBounds(ent.points[k].x, -ent.points[k].y);
                        }
                        // TODO: Check for closed polyline flag (Group 70)
                    }
                    break;
                case 'CIRCLE':
                    if (isNaN(ent.x) || isNaN(ent.y) || isNaN(ent.radius)) break;
                    // Convert circle to path or use circle tag. Components use paths often but <circle> is fine inside SVG.
                    // For bounding box we use path approximation or just math.
                    // Let's us <circle> logic but return string. Actually better to use paths for consistency everything is a path
                    // M cx-r cy A r r 0 1 0 cx+r cy A r r 0 1 0 cx-r cy
                    // Simpler: <circle cx="..." cy="..." r="..." />
                    // But we want to return a single SVG string or logic. 
                    // Let's just create raw SVG strings.

                    // Actually, simple strings are easier.
                    paths.push(`<circle cx="${ent.x}" cy="${-ent.y}" r="${ent.radius}" fill="none" stroke="currentColor" stroke-width="1" />`);
                    updateBoundsCircle(ent.x, -ent.y, ent.radius);
                    return; // Skip default push
                case 'ARC':
                    if (isNaN(ent.x) || isNaN(ent.y) || isNaN(ent.radius)) break;
                    // Arc is tricky in SVG. A rx ry x-axis-rotation large-arc-flag sweep-flag x y
                    // Need to calculate start/end points from angles.
                    const startRad = (ent.startAngle * Math.PI) / 180;
                    const endRad = (ent.endAngle * Math.PI) / 180;
                    const x1 = ent.x + ent.radius * Math.cos(startRad);
                    const y1 = -ent.y - ent.radius * Math.sin(startRad); // Flip Y
                    const x2 = ent.x + ent.radius * Math.cos(endRad);
                    const y2 = -ent.y - ent.radius * Math.sin(endRad);

                    const largeArc = (ent.endAngle - ent.startAngle + 360) % 360 > 180 ? 1 : 0;
                    // DXF angles are CCW. SVG arc visual sweep depends on coordinate system.
                    // With Y-flip, CCW becomes CW visually? 
                    // Let's try sweep-flag 0.

                    d = `M ${x1} ${y1} A ${ent.radius} ${ent.radius} 0 ${largeArc} 0 ${x2} ${y2}`;
                    updateBounds(x1, y1);
                    updateBounds(x2, y2);
                    // Also check extreme points if they lie within the arc angle
                    break;
            }
        } catch (e) {
            console.warn('Error parsing entity', ent);
        }

        if (d) {
            paths.push(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" />`);
        }
    });

    if (paths.length === 0) {
        return { svg: '', width: 100, height: 100, viewBox: '0 0 100 100', stats };
    }

    // Add padding
    const padding = Math.max((maxX - minX), (maxY - minY)) * 0.05 || 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = Math.abs(maxX - minX) || 100;
    const height = Math.abs(maxY - minY) || 100;

    // Construct final SVG content (inner content)
    // We wrap in a group to handle the translation to 0,0 if needed, or rely on ViewBox

    // DXF coordinates can be anywhere (e.g. huge numbers). ViewBox handles this.
    const viewBox = `${minX} ${minY} ${width} ${height}`;

    return {
        svg: paths.join('\n'),
        width,
        height,
        viewBox,
        stats
    };
};
