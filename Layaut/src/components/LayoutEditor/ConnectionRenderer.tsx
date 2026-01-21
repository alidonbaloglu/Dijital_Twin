import React, { useMemo } from 'react';
import { LayoutConnection, LayoutComponent, ConnectionPoint } from '../../services/layoutApi';

interface ConnectionRendererProps {
    connection: LayoutConnection;
    components: LayoutComponent[];
    onClick: () => void;
    readOnly: boolean;
}

const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
    connection,
    components,
    onClick,
    readOnly,
}) => {
    // Find connected components
    const fromComponent = components.find((c) => c.id === connection.fromComponentId);
    const toComponent = components.find((c) => c.id === connection.toComponentId);

    // Calculate connection path
    const path = useMemo(() => {
        if (!fromComponent || !toComponent) return null;

        const fromTemplate = fromComponent.template;
        const toTemplate = toComponent.template;
        if (!fromTemplate || !toTemplate) return null;

        // Parse connection points
        const parsePoints = (points: any): ConnectionPoint[] => {
            if (typeof points === 'string') {
                try {
                    return JSON.parse(points);
                } catch {
                    return [];
                }
            }
            return points || [];
        };

        const fromPoints = parsePoints(fromTemplate.connectionPoints);
        const toPoints = parsePoints(toTemplate.connectionPoints);

        const fromPoint = fromPoints.find((p) => p.id === connection.fromPointId);
        const toPoint = toPoints.find((p) => p.id === connection.toPointId);

        if (!fromPoint || !toPoint) return null;

        // Helper to transform point based on component state
        const getTransformedPoint = (component: LayoutComponent, point: { x: number; y: number }) => {
            const { x, y, rotation, scaleX, scaleY, template } = component;
            if (!template) return { x: component.x + point.x, y: component.y + point.y };

            const { width, height } = template;

            // 1. Scale (ComponentRenderer applies scale first)
            const scaledX = point.x * scaleX;
            const scaledY = point.y * scaleY;

            // 2. Rotate (ComponentRenderer rotates around unscaled center w/2, h/2)
            const cx = width / 2;
            const cy = height / 2;
            const rad = (rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const rotatedX = cos * (scaledX - cx) - sin * (scaledY - cy) + cx;
            const rotatedY = sin * (scaledX - cx) + cos * (scaledY - cy) + cy;

            // 3. Translate
            return {
                x: x + rotatedX,
                y: y + rotatedY,
            };
        };

        // Calculate actual positions
        const startPos = getTransformedPoint(fromComponent, fromPoint);
        const endPos = getTransformedPoint(toComponent, toPoint);

        const startX = startPos.x;
        const startY = startPos.y;
        const endX = endPos.x;
        const endY = endPos.y;

        // Generate path based on style
        if (connection.pathStyle === 'straight') {
            return `M ${startX} ${startY} L ${endX} ${endY}`;
        } else if (connection.pathStyle === 'orthogonal') {
            // L-shaped path
            const midX = (startX + endX) / 2;
            return `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
        } else {
            // Default: Bezier curve
            const dx = Math.abs(endX - startX);
            const controlOffset = Math.max(dx * 0.3, 30);

            let cp1x = startX,
                cp1y = startY,
                cp2x = endX,
                cp2y = endY;

            // Adjust control points based on direction
            if (fromPoint.direction === 'right') cp1x = startX + controlOffset;
            else if (fromPoint.direction === 'left') cp1x = startX - controlOffset;
            else if (fromPoint.direction === 'bottom') cp1y = startY + controlOffset;
            else if (fromPoint.direction === 'top') cp1y = startY - controlOffset;

            if (toPoint.direction === 'right') cp2x = endX + controlOffset;
            else if (toPoint.direction === 'left') cp2x = endX - controlOffset;
            else if (toPoint.direction === 'bottom') cp2y = endY + controlOffset;
            else if (toPoint.direction === 'top') cp2y = endY - controlOffset;

            return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
        }
    }, [connection, fromComponent, toComponent]);

    if (!path) return null;

    // Get color based on connection type
    const getColor = () => {
        if (connection.color) return connection.color;
        switch (connection.connectionType) {
            case 'material':
                return '#60a5fa';
            case 'electrical':
                return '#f59e0b';
            case 'data':
                return '#22c55e';
            case 'pneumatic':
                return '#a855f7';
            default:
                return '#60a5fa';
        }
    };

    const color = getColor();

    return (
        <g
            className={`layout-connection ${connection.connectionType}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!readOnly) onClick();
            }}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
            {/* Invisible wider path for easier clicking */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
                className="connection-hit-area"
            />

            {/* Main connection line */}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                markerEnd="url(#connection-arrow)"
                className="connection-line"
            />

            {/* Animated flow indicator */}
            {connection.animated && (
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="10,15"
                    className="connection-flow"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        values="0;-25"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </path>
            )}

            {/* Connection type indicator */}
            {connection.connectionType !== 'material' && (
                <text
                    x={
                        (fromComponent!.x +
                            toComponent!.x +
                            (fromComponent!.template?.width || 0) / 2 +
                            (toComponent!.template?.width || 0) / 2) /
                        2
                    }
                    y={
                        (fromComponent!.y + toComponent!.y + (fromComponent!.template?.height || 0) / 2) / 2 -
                        10
                    }
                    fontSize="10"
                    fill={color}
                    textAnchor="middle"
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                >
                    {connection.connectionType === 'electrical' && '⚡'}
                    {connection.connectionType === 'data' && '📡'}
                    {connection.connectionType === 'pneumatic' && '💨'}
                </text>
            )}
        </g>
    );
};

export default ConnectionRenderer;
