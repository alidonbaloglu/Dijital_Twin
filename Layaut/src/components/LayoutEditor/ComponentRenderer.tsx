import React, { useMemo } from 'react';
import { LayoutComponent, ConnectionPoint } from '../../services/layoutApi';
import { stripSvgTags, extractViewBox } from '../../utils/svgUtils';

interface ComponentRendererProps {
    component: LayoutComponent;
    isSelected: boolean;
    isConnecting: boolean;
    onDragStart: (e: React.MouseEvent) => void;
    onResizeStart: (e: React.MouseEvent, handle: string) => void;
    onRotateStart: (e: React.MouseEvent) => void;
    onClick: () => void;
    onConnectionPointClick: (pointId: string) => void;
    readOnly: boolean;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
    component,
    isSelected,
    isConnecting,
    onDragStart,
    onResizeStart,
    onRotateStart,
    onClick,
    onConnectionPointClick,
    readOnly,
}) => {
    const template = component.template;

    // Parse connection points
    const connectionPoints: ConnectionPoint[] = useMemo(() => {
        if (!template) return [];
        if (typeof template.connectionPoints === 'string') {
            try {
                return JSON.parse(template.connectionPoints);
            } catch {
                return [];
            }
        }
        return template.connectionPoints || [];
    }, [template]);

    // Extract inner SVG content and viewBox
    const { innerSvgContent, viewBox } = useMemo(() => {
        if (!template?.svgContent) return { innerSvgContent: '', viewBox: null };
        const inner = stripSvgTags(template.svgContent);
        const vb = extractViewBox(template.svgContent);
        return { innerSvgContent: inner, viewBox: vb };
    }, [template?.svgContent]);

    if (!template) return null;

    const { x, y, rotation, scaleX, scaleY } = component;
    const { width, height } = template;

    // Calculate scaled dimensions
    const scaledWidth = width * scaleX;
    const scaledHeight = height * scaleY;

    // Create transform string - position and rotate only, no scale
    const transform = `translate(${x}, ${y}) rotate(${rotation}, ${scaledWidth / 2}, ${scaledHeight / 2})`;

    // Inverse scale for elements that should not scale (text, controls)
    const inverseScale = `scale(${1 / scaleX}, ${1 / scaleY})`;

    // Create unique class for this component instance to scope styles
    const uniqueClass = `comp-${component.id.replace(/[^a-zA-Z0-9-_]/g, '_')}`;

    return (
        <g
            className={`layout-component ${isSelected ? 'selected' : ''} ${component.isLocked ? 'locked' : ''}`}
            transform={transform}
            onMouseDown={!readOnly ? onDragStart : undefined}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            style={{ cursor: readOnly || component.isLocked ? 'default' : 'move' }}
        >
            {/* Component SVG - scaled via dimensions */}
            {/* For floors, text scales normally. For other components, text stays fixed. */}
            <svg
                x="0"
                y="0"
                width={scaledWidth}
                height={scaledHeight}
                viewBox={viewBox || `0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className={`component-svg-content ${uniqueClass} ${template.category === 'floors' ? 'floor-component' : 'non-floor-component'}`}
            >
                {/* For floors: hide text. For others: apply inverse scaling to keep text fixed */}
                <style>
                    {template.category === 'floors'
                        ? `.${uniqueClass}.floor-component text, .${uniqueClass}.floor-component rect[rx] { display: none; }`
                        : `.${uniqueClass}.non-floor-component text {
                            transform-origin: center;
                            transform: scale(${1 / scaleX}, ${1 / scaleY});
                        }`
                    }
                </style>
                <g dangerouslySetInnerHTML={{ __html: innerSvgContent }} />
            </svg>

            {/* Instance Name Label - fixed size, positioned based on scaled dimensions */}
            <g transform={`translate(${scaledWidth / 2}, -8)`}>
                <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#e5e7eb"
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                >
                    {component.instanceName}
                </text>
            </g>

            {/* Selection Border */}
            {isSelected && (
                <rect
                    x={-4}
                    y={-4}
                    width={scaledWidth + 8}
                    height={scaledHeight + 8}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    rx="4"
                />
            )}

            {/* Lock Indicator */}
            {component.isLocked && (
                <text
                    x={scaledWidth - 12}
                    y={16}
                    fontSize="14"
                    fill="#f59e0b"
                    style={{ pointerEvents: 'none' }}
                >
                    🔒
                </text>
            )}

            {/* Transform Controls (Resize & Rotate) */}
            {isSelected && !readOnly && !component.isLocked && (
                <g className="transform-controls">
                    {/* Rotate Handle */}
                    <line
                        x1={scaledWidth / 2}
                        y1={-5}
                        x2={scaledWidth / 2}
                        y2={-25}
                        stroke="#60a5fa"
                        strokeWidth="1"
                    />
                    <circle
                        cx={scaledWidth / 2}
                        cy={-25}
                        r="5"
                        fill="#ffffff"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        className="rotate-handle"
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            onRotateStart(e);
                        }}
                    />

                    {/* Resize Handles */}
                    {[
                        { id: 'nw', x: -4, y: -4, cursor: 'nw-resize' },
                        { id: 'ne', x: scaledWidth + 4, y: -4, cursor: 'ne-resize' },
                        { id: 'se', x: scaledWidth + 4, y: scaledHeight + 4, cursor: 'se-resize' },
                        { id: 'sw', x: -4, y: scaledHeight + 4, cursor: 'sw-resize' },
                    ].map((handle) => (
                        <rect
                            key={handle.id}
                            x={handle.x - 4}
                            y={handle.y - 4}
                            width={8}
                            height={8}
                            fill="#ffffff"
                            stroke="#60a5fa"
                            strokeWidth="2"
                            className={`resize-handle ${handle.id}`}
                            style={{ cursor: handle.cursor }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                onResizeStart(e, handle.id);
                            }}
                        />
                    ))}
                </g>
            )}

            {/* Connection Points */}
            {(isSelected || isConnecting) &&
                connectionPoints.map((point) => {
                    // Scale connection point positions
                    const scaledPointX = point.x * scaleX;
                    const scaledPointY = point.y * scaleY;

                    return (
                        <g
                            key={point.id}
                            className="connection-point"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!readOnly) onConnectionPointClick(point.id);
                            }}
                            style={{ cursor: readOnly ? 'default' : 'crosshair' }}
                        >
                            {/* Outer circle (hover area) */}
                            <circle
                                cx={scaledPointX}
                                cy={scaledPointY}
                                r="10"
                                fill="transparent"
                                className="connection-point-hover"
                            />
                            {/* Inner circle (visible) */}
                            <circle
                                cx={scaledPointX}
                                cy={scaledPointY}
                                r="6"
                                fill={isConnecting ? '#22c55e' : '#60a5fa'}
                                stroke="#1e293b"
                                strokeWidth="2"
                                className="connection-point-dot"
                            />
                            {/* Direction indicator */}
                            {point.direction === 'left' && (
                                <polygon
                                    points={`${scaledPointX - 10},${scaledPointY} ${scaledPointX - 6},${scaledPointY - 4} ${scaledPointX - 6},${scaledPointY + 4}`}
                                    fill={isConnecting ? '#22c55e' : '#60a5fa'}
                                />
                            )}
                            {point.direction === 'right' && (
                                <polygon
                                    points={`${scaledPointX + 10},${scaledPointY} ${scaledPointX + 6},${scaledPointY - 4} ${scaledPointX + 6},${scaledPointY + 4}`}
                                    fill={isConnecting ? '#22c55e' : '#60a5fa'}
                                />
                            )}
                            {point.direction === 'top' && (
                                <polygon
                                    points={`${scaledPointX},${scaledPointY - 10} ${scaledPointX - 4},${scaledPointY - 6} ${scaledPointX + 4},${scaledPointY - 6}`}
                                    fill={isConnecting ? '#22c55e' : '#60a5fa'}
                                />
                            )}
                            {point.direction === 'bottom' && (
                                <polygon
                                    points={`${scaledPointX},${scaledPointY + 10} ${scaledPointX - 4},${scaledPointY + 6} ${scaledPointX + 4},${scaledPointY + 6}`}
                                    fill={isConnecting ? '#22c55e' : '#60a5fa'}
                                />
                            )}
                        </g>
                    );
                })}
        </g>
    );
};

export default ComponentRenderer;
