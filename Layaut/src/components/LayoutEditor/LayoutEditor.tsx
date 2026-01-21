import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    ProductionLine,
    ComponentTemplate,
    getLayoutById,
    addLayoutComponent,
    updateLayoutComponent,
    deleteLayoutComponent,
    addLayoutConnection,
    deleteLayoutConnection,
} from '../../services/layoutApi';
import ComponentPalette from './ComponentPalette';
import ComponentRenderer from './ComponentRenderer';
import ConnectionRenderer from './ConnectionRenderer';
import Factory3DLayout from '../Factory3DLayout';
import './LayoutEditor.css';

interface LayoutEditorProps {
    layoutId: string;
    readOnly?: boolean;
}

interface DragState {
    isDragging: boolean;
    componentId?: string;
    templateId?: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
}

interface ConnectionState {
    isConnecting: boolean;
    fromComponentId?: string;
    fromPointId?: string;
}

const LayoutEditor: React.FC<LayoutEditorProps> = ({ layoutId, readOnly = false }) => {
    const [layout, setLayout] = useState<ProductionLine | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
    });
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        isConnecting: false,
    });
    const [showPalette, setShowPalette] = useState(true);
    const [is3DMode, setIs3DMode] = useState(false);

    // Resize State
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(280);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle Resize Logic
    useEffect(() => {
        const handleMouseMoveGlobal = (e: MouseEvent) => {
            if (isResizingLeft) {
                setLeftSidebarWidth(Math.max(200, Math.min(500, e.clientX)));
            } else if (isResizingRight) {
                setRightSidebarWidth(Math.max(200, Math.min(500, window.innerWidth - e.clientX)));
            }
        };

        const handleMouseUpGlobal = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
        };

        if (isResizingLeft || isResizingRight) {
            window.addEventListener('mousemove', handleMouseMoveGlobal);
            window.addEventListener('mouseup', handleMouseUpGlobal);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
            window.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }, [isResizingLeft, isResizingRight]);

    // Get SVG coordinates from screen coordinates (NEW implementation for infinite canvas)
    const getSvgPoint = useCallback(
        (clientX: number, clientY: number) => {
            if (!svgRef.current) return { x: 0, y: 0 };
            // Adjust for pan and zoom
            const rect = svgRef.current.getBoundingClientRect();
            const x = (clientX - rect.left - pan.x) / zoom;
            const y = (clientY - rect.top - pan.y) / zoom;
            return { x, y };
        },
        [pan, zoom]
    );

    // Load layout
    useEffect(() => {
        const loadLayout = async () => {
            try {
                setLoading(true);
                const data = await getLayoutById(layoutId);
                setLayout(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Layout yüklenemedi');
            } finally {
                setLoading(false);
            }
        };
        loadLayout();
    }, [layoutId]);



    // Handle dropping a template from palette
    const handleTemplateDrop = useCallback(
        async (template: ComponentTemplate, x: number, y: number) => {
            if (!layout || readOnly) return;

            try {
                // Generate instance name
                const existingNames = layout.components.map((c) => c.instanceName);
                let counter = 1;
                let instanceName = `${template.type}-${String(counter).padStart(2, '0')}`;
                while (existingNames.includes(instanceName)) {
                    counter++;
                    instanceName = `${template.type}-${String(counter).padStart(2, '0')}`;
                }

                // Determine zIndex based on component type/category
                // FLOOR types or floors category should always be at the back (negative zIndex)
                let zIndex = 0;
                const isFloor = template.type === 'FLOOR' || template.category === 'floors';

                if (isFloor) {
                    // Find the minimum zIndex and go lower
                    const minZIndex = layout.components.length > 0
                        ? Math.min(...layout.components.map(c => c.zIndex))
                        : 0;
                    zIndex = Math.min(minZIndex - 1, -10);
                } else {
                    // Normal components get positive zIndex
                    const maxZIndex = layout.components.length > 0
                        ? Math.max(...layout.components.map(c => c.zIndex))
                        : 0;
                    zIndex = maxZIndex + 1;
                }

                const newComponent = await addLayoutComponent(layout.id, {
                    templateId: template.id,
                    instanceName,
                    x: x - template.width / 2, // Center the component
                    y: y - template.height / 2,
                    zIndex,
                });

                setLayout((prev) =>
                    prev
                        ? {
                            ...prev,
                            components: [...prev.components, newComponent],
                        }
                        : null
                );
                setSelectedComponentId(newComponent.id);
            } catch (err) {
                console.error('Error adding component:', err);
            }
        },
        [layout, readOnly]
    );

    // Handle component drag start
    const handleComponentDragStart = useCallback(
        (componentId: string, e: React.MouseEvent) => {
            if (readOnly) return;

            const component = layout?.components.find((c) => c.id === componentId);
            if (!component || component.isLocked) return;

            const point = getSvgPoint(e.clientX, e.clientY);
            setDragState({
                isDragging: true,
                componentId,
                startX: point.x,
                startY: point.y,
                offsetX: point.x - component.x,
                offsetY: point.y - component.y,
            });
            setSelectedComponentId(componentId);
        },
        [layout, readOnly, getSvgPoint]
    );

    // Handle component drag
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isPanning) {
                const dx = e.clientX - panStart.x;
                const dy = e.clientY - panStart.y;
                setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                setPanStart({ x: e.clientX, y: e.clientY });
                return;
            }

            if (!dragState.isDragging || !dragState.componentId || !layout) return;

            const point = getSvgPoint(e.clientX, e.clientY);
            const newX = point.x - dragState.offsetX;
            const newY = point.y - dragState.offsetY;

            // Snap to grid
            const gridSize = layout.gridSize;
            const snappedX = Math.round(newX / gridSize) * gridSize;
            const snappedY = Math.round(newY / gridSize) * gridSize;

            // Update local state immediately for smooth dragging
            setLayout((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    components: prev.components.map((c) =>
                        c.id === dragState.componentId ? { ...c, x: snappedX, y: snappedY } : c
                    ),
                };
            });
        },
        [dragState, layout, isPanning, panStart, getSvgPoint]
    );

    // Handle component drag end
    const handleMouseUp = useCallback(async () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (!dragState.isDragging || !dragState.componentId || !layout) {
            setDragState({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
            return;
        }

        const component = layout.components.find((c) => c.id === dragState.componentId);
        if (component) {
            try {
                await updateLayoutComponent(layout.id, component.id, {
                    x: component.x,
                    y: component.y,
                });
            } catch (err) {
                console.error('Error updating component position:', err);
            }
        }

        setDragState({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
    }, [dragState, layout, isPanning]);

    // Handle connection point click
    const handleConnectionPointClick = useCallback(
        async (componentId: string, pointId: string) => {
            if (readOnly || !layout) return;

            if (!connectionState.isConnecting) {
                // Start connection
                setConnectionState({
                    isConnecting: true,
                    fromComponentId: componentId,
                    fromPointId: pointId,
                });
            } else {
                // Complete connection
                if (
                    connectionState.fromComponentId &&
                    connectionState.fromPointId &&
                    componentId !== connectionState.fromComponentId
                ) {
                    try {
                        const newConnection = await addLayoutConnection(layout.id, {
                            fromComponentId: connectionState.fromComponentId,
                            toComponentId: componentId,
                            fromPointId: connectionState.fromPointId,
                            toPointId: pointId,
                        });

                        setLayout((prev) =>
                            prev
                                ? {
                                    ...prev,
                                    connections: [...prev.connections, newConnection],
                                }
                                : null
                        );
                    } catch (err) {
                        console.error('Error adding connection:', err);
                    }
                }
                setConnectionState({ isConnecting: false });
            }
        },
        [connectionState, layout, readOnly]
    );

    // Handle component delete
    const handleDeleteComponent = useCallback(
        async (componentId: string) => {
            if (readOnly || !layout) return;

            try {
                await deleteLayoutComponent(layout.id, componentId);
                setLayout((prev) =>
                    prev
                        ? {
                            ...prev,
                            components: prev.components.filter((c) => c.id !== componentId),
                            connections: prev.connections.filter(
                                (conn) => conn.fromComponentId !== componentId && conn.toComponentId !== componentId
                            ),
                        }
                        : null
                );
                setSelectedComponentId(null);
            } catch (err) {
                console.error('Error deleting component:', err);
            }
        },
        [layout, readOnly]
    );

    // Handle connection delete
    const handleDeleteConnection = useCallback(
        async (connectionId: string) => {
            if (readOnly || !layout) return;

            try {
                await deleteLayoutConnection(layout.id, connectionId);
                setLayout((prev) =>
                    prev
                        ? {
                            ...prev,
                            connections: prev.connections.filter((c) => c.id !== connectionId),
                        }
                        : null
                );
            } catch (err) {
                console.error('Error deleting connection:', err);
            }
        },
        [layout, readOnly]
    );

    // Handle zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        // Reduced sensitivity for smoother zooming
        const delta = e.deltaY > 0 ? 0.98 : 1.02;
        setZoom((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
    }, []);

    // Handle pan start
    const handlePanStart = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle mouse or Alt+Left click
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (readOnly) return;

            if (e.key === 'Delete' && selectedComponentId) {
                handleDeleteComponent(selectedComponentId);
            } else if (e.key === 'Escape') {
                setSelectedComponentId(null);
                setConnectionState({ isConnecting: false });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedComponentId, readOnly, handleDeleteComponent]);




    // State for transform operations (resize/rotate)
    const [transformState, setTransformState] = useState<{
        mode: 'resize' | 'rotate';
        componentId: string;
        initialX: number;
        initialY: number;
        initialRotation: number;
        initialScaleX: number;
        initialScaleY: number;
        startX: number;
        startY: number;
        handle?: string;
        centerX?: number;
        centerY?: number;
    } | null>(null);





    // Handle Resize Start
    const handleResizeStart = (e: React.MouseEvent, componentId: string, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        const component = layout?.components.find((c) => c.id === componentId);
        if (!component || !component.template) return;

        const { width, height } = component.template;
        const cx = component.x + (width * component.scaleX) / 2;
        const cy = component.y + (height * component.scaleY) / 2;

        setTransformState({
            mode: 'resize',
            componentId,
            initialX: component.x,
            initialY: component.y,
            initialScaleX: component.scaleX,
            initialScaleY: component.scaleY,
            initialRotation: component.rotation,
            startX: e.clientX,
            startY: e.clientY,
            handle,
            centerX: cx,
            centerY: cy,
        });
    };

    // Handle Rotate Start
    const handleRotateStart = (e: React.MouseEvent, componentId: string) => {
        e.stopPropagation();
        e.preventDefault();
        const component = layout?.components.find((c) => c.id === componentId);
        if (!component || !component.template) return;

        const { width, height } = component.template;
        // Center in transformed coordinates
        // Actually center is just x + width/2 * scale... mostly
        // For rotation we need screen coordinates of the center to calculate angle

        // Let's use getSvgPoint logic loosely but we work with screen diffs

        // Calculate center point in SVG space
        const cx = component.x + (width * component.scaleX) / 2;
        const cy = component.y + (height * component.scaleY) / 2;

        setTransformState({
            mode: 'rotate',
            componentId,
            initialX: component.x,
            initialY: component.y,
            initialScaleX: component.scaleX,
            initialScaleY: component.scaleY,
            initialRotation: component.rotation,
            startX: e.clientX,
            startY: e.clientY,
            centerX: cx,
            centerY: cy,
        });
    };

    // Updated Mouse Move Wrapper
    const handleMouseMoveWrapper = (e: React.MouseEvent) => {
        handleMouseMove(e); // Existing pan logic

        if (!transformState || !layout) return;

        if (transformState.mode === 'rotate') {
            const component = layout.components.find(c => c.id === transformState.componentId);
            if (!component || !component.template) return;

            // Calculate angle using client coordinates directly (assuming uniform zoom/pan)
            // Need center in screen coordinates
            // ScreenX = svgX * zoom + panX + containerLeft
            if (!svgRef.current) return;
            const rect = svgRef.current.getBoundingClientRect();

            const screenCx = (transformState.centerX! * zoom) + pan.x + rect.left;
            const screenCy = (transformState.centerY! * zoom) + pan.y + rect.top;

            const angle = Math.atan2(e.clientY - screenCy, e.clientX - screenCx) * (180 / Math.PI);
            // Snap to 15 degrees if Shift is pressed
            let rotation = angle + 90; // Adjust because handle is at top (-90 degrees)

            if (e.shiftKey) {
                rotation = Math.round(rotation / 15) * 15;
            }

            // Normalization
            rotation = (rotation + 360) % 360;

            // Optimistic Update
            const updatedComponents = layout.components.map(c =>
                c.id === component.id ? { ...c, rotation } : c
            );
            setLayout({ ...layout, components: updatedComponents });
        } else if (transformState.mode === 'resize') {
            const component = layout.components.find(c => c.id === transformState.componentId);
            if (!component || !component.template) return;

            // Delta in SVG units
            // NOTE: This simple implementation assumes unrotated resize for simplicity first.
            // Supporting rotated resize properly requires projecting delta onto component axes.
            // For now, let's implement axis-aligned resize.
            // If component is rotated, this will feel weird. 
            // TODO: Add proper rotated resize math if needed.

            const deltaX = (e.clientX - transformState.startX) / zoom;
            const deltaY = (e.clientY - transformState.startY) / zoom;

            let newScaleX = transformState.initialScaleX;
            let newScaleY = transformState.initialScaleY;

            const { width, height } = component.template;

            // Simple resize logic (ignoring rotation for calculation simplicity, but visual will distort if rotated)
            // Ideally we project delta onto the rotation vector.

            // Project delta onto local axes
            const rad = -(transformState.initialRotation * Math.PI) / 180; // Negative to convert to standard coord system
            const localDeltaX = deltaX * Math.cos(rad) - deltaY * Math.sin(rad);
            const localDeltaY = deltaX * Math.sin(rad) + deltaY * Math.cos(rad);

            const handle = transformState.handle;

            if (handle?.includes('e')) {
                newScaleX += localDeltaX / width;
            } else if (handle?.includes('w')) {
                newScaleX -= localDeltaX / width;
                // Position adjustment for left-side resize is tricky with center-transform
                // For now, simpler implementation: scaling affects width only. 
                // BUT transforming origin helps.
            }

            if (handle?.includes('s')) {
                newScaleY += localDeltaY / height;
            } else if (handle?.includes('n')) {
                newScaleY -= localDeltaY / height;
            }

            // Limit min scale
            newScaleX = Math.max(0.1, newScaleX);
            newScaleY = Math.max(0.1, newScaleY);

            const updatedComponents = layout.components.map(c =>
                c.id === component.id ? { ...c, scaleX: newScaleX, scaleY: newScaleY } : c
            );
            setLayout({ ...layout, components: updatedComponents });
        }
    };

    // Updated Mouse Up Wrapper
    const handleMouseUpWrapper = async () => {
        handleMouseUp(); // Existing pan end logic

        if (!transformState) return;

        const component = layout?.components.find(c => c.id === transformState.componentId);
        if (component) {
            try {
                await updateLayoutComponent(layoutId, component.id, {
                    x: component.x, // x/y might not change in current simple resize
                    y: component.y,
                    rotation: component.rotation,
                    scaleX: component.scaleX,
                    scaleY: component.scaleY
                });
            } catch (err) {
                console.error("Update failed", err);
                // Revert? Reload layout?
                const original = await getLayoutById(layoutId);
                setLayout(original);
            }
        }
        setTransformState(null);
    };



    if (loading) {
        return (
            <div className="layout-editor layout-editor--loading">
                <div className="layout-editor__loader">Layout yükleniyor...</div>
            </div>
        );
    }

    if (error || !layout) {
        return (
            <div className="layout-editor layout-editor--error">
                <div className="layout-editor__error">
                    <p>{error || 'Layout bulunamadı'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="layout-editor" ref={containerRef}>
            {/* Toolbar */}
            <div className="layout-editor__toolbar">
                <div className="layout-editor__toolbar-left">
                    <h2 className="layout-editor__title">{layout!.name}</h2>
                    {!readOnly && (
                        <button
                            className={`layout-editor__btn ${showPalette ? 'active' : ''}`}
                            onClick={() => setShowPalette(!showPalette)}
                        >
                            📦 Bileşenler
                        </button>
                    )}
                </div>
                <div className="layout-editor__toolbar-center">
                    <button className="layout-editor__btn" onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}>
                        🔍+
                    </button>
                    <span className="layout-editor__zoom-label">{Math.round(zoom * 100)}%</span>
                    <button className="layout-editor__btn" onClick={() => setZoom((z) => Math.max(z * 0.8, 0.1))}>
                        🔍-
                    </button>
                    <button className="layout-editor__btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                        ⟲ Reset
                    </button>
                </div>
                <div className="layout-editor__toolbar-right">
                    {connectionState.isConnecting && (
                        <span className="layout-editor__status">🔗 Bağlantı noktası seçin...</span>
                    )}
                    <button
                        className={`layout-editor__btn ${is3DMode ? 'layout-editor__btn--primary' : ''}`}
                        onClick={() => setIs3DMode(!is3DMode)}
                    >
                        {is3DMode ? '↩ 2D Görünüm' : '🧊 3D Görünüm'}
                    </button>

                </div>
            </div>

            <div className="layout-editor__content">
                {/* LEFT SIDEBAR: Palette */}
                {!readOnly && showPalette && (
                    <div className="layout-editor__sidebar sidebar-left" style={{ width: leftSidebarWidth }}>
                        <ComponentPalette
                            onTemplateDrop={(template) => {
                                // Drop location: Center of current view
                                if (!svgRef.current) return;
                                const rect = svgRef.current.getBoundingClientRect();
                                const centerX = rect.width / 2;
                                const centerY = rect.height / 2;
                                const p = getSvgPoint(rect.left + centerX, rect.top + centerY);
                                handleTemplateDrop(template, p.x, p.y);
                            }}
                        />
                        <div
                            className="resize-handle resize-handle-right"
                            onMouseDown={() => setIsResizingLeft(true)}
                        />
                    </div>
                )}
                {/* CENTER: Canvas */}
                <div className="layout-editor__canvas">
                    {is3DMode ? (
                        <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
                            <Factory3DLayout components={layout?.components || []} />
                        </div>
                    ) : (
                        <div
                            className="layout-editor__svg-container"
                            onMouseDown={handlePanStart}
                            onMouseMove={handleMouseMoveWrapper}
                            onMouseUp={handleMouseUpWrapper}
                            onMouseLeave={handleMouseUpWrapper}
                            onWheel={handleWheel}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const templateData = e.dataTransfer.getData('application/json');
                                if (templateData) {
                                    try {
                                        const template = JSON.parse(templateData);
                                        const point = getSvgPoint(e.clientX, e.clientY);
                                        handleTemplateDrop(template, point.x, point.y);
                                    } catch (err) {
                                        console.error('Error parsing template data:', err);
                                    }
                                }
                            }}
                            style={{ width: '100%', height: '100%', cursor: isPanning ? 'grabbing' : 'grab' }}
                        >
                            <svg
                                ref={svgRef}
                                width="100%"
                                height="100%"
                                style={{ display: 'block' }}
                            >
                                <defs>
                                    <pattern id="editor-grid" width={layout!.gridSize} height={layout!.gridSize} patternUnits="userSpaceOnUse">
                                        <path d={`M ${layout!.gridSize} 0 L 0 0 0 ${layout!.gridSize}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                                    </pattern>
                                    {/* Arrow marker for connections */}
                                    <marker
                                        id="arrowhead"
                                        markerWidth="12"
                                        markerHeight="12"
                                        refX="10"
                                        refY="4"
                                        orient="auto"
                                        markerUnits="userSpaceOnUse"
                                    >
                                        <polygon points="0 0, 12 4, 0 8" fill="#60a5fa" />
                                    </marker>
                                </defs>

                                {/* Infinite Canvas Group */}
                                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                                    {/* Infinite Background */}
                                    <rect
                                        x="-50000"
                                        y="-50000"
                                        width="100000"
                                        height="100000"
                                        fill={layout!.backgroundColor}
                                    />
                                    <rect
                                        x="-50000"
                                        y="-50000"
                                        width="100000"
                                        height="100000"
                                        fill="url(#editor-grid)"
                                    />

                                    {/* Connections */}
                                    {layout!.connections.map((connection) => (
                                        <ConnectionRenderer
                                            key={connection.id}
                                            connection={connection}
                                            components={layout!.components}
                                            onClick={() => handleDeleteConnection(connection.id)}
                                            readOnly={readOnly}
                                        />
                                    ))}

                                    {/* Components */}
                                    {layout!.components
                                        .sort((a, b) => a.zIndex - b.zIndex)
                                        .map((component) => (
                                            <ComponentRenderer
                                                key={component.id}
                                                component={component}
                                                isSelected={selectedComponentId === component.id}
                                                isConnecting={connectionState.isConnecting}
                                                onDragStart={(e) => handleComponentDragStart(component.id, e)}
                                                onClick={() => setSelectedComponentId(component.id)}
                                                onConnectionPointClick={(pointId) => handleConnectionPointClick(component.id, pointId)}
                                                onResizeStart={(e, handle) => handleResizeStart(e, component.id, handle)}
                                                onRotateStart={(e) => handleRotateStart(e, component.id)}
                                                readOnly={readOnly}
                                            />
                                        ))}
                                </g>
                            </svg>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR: Properties */}
                {!readOnly && selectedComponentId && (
                    <div className="layout-editor__sidebar sidebar-right" style={{ width: rightSidebarWidth, borderLeft: '1px solid #374151', borderRight: 'none' }}>
                        <div
                            className="resize-handle resize-handle-left"
                            onMouseDown={() => setIsResizingRight(true)}
                        />
                        <div className="layout-editor__properties">
                            <div className="layout-editor__properties-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Bileşen Özellikleri</h3>
                                {(() => {
                                    const component = layout!.components.find((c) => c.id === selectedComponentId);
                                    if (!component) return null;
                                    return (
                                        <button
                                            className="layout-editor__btn layout-editor__btn--danger"
                                            onClick={() => handleDeleteComponent(component.id)}
                                            style={{ padding: '4px 10px', fontSize: '13px' }}
                                            title="Bileşeni Sil"
                                        >
                                            🗑️ Sil
                                        </button>
                                    );
                                })()}
                            </div>
                            <div className="layout-editor__properties-content">
                                {(() => {
                                    const component = layout!.components.find((c) => c.id === selectedComponentId);
                                    if (!component) return null;

                                    // Handler to update component property
                                    const handlePropertyChange = async (field: string, value: any) => {
                                        // Update local state immediately
                                        setLayout((prev) => {
                                            if (!prev) return null;
                                            return {
                                                ...prev,
                                                components: prev.components.map((c) =>
                                                    c.id === component.id ? { ...c, [field]: value } : c
                                                ),
                                            };
                                        });

                                        // Save to backend
                                        try {
                                            await updateLayoutComponent(layoutId, component.id, { [field]: value });
                                        } catch (err) {
                                            console.error('Error updating component property:', err);
                                        }
                                    };

                                    return (
                                        <>
                                            {/* İsim */}
                                            <div className="property-row">
                                                <label>İsim:</label>
                                                <input
                                                    type="text"
                                                    value={component.instanceName}
                                                    onChange={(e) => handlePropertyChange('instanceName', e.target.value)}
                                                    className="property-input"
                                                />
                                            </div>

                                            {/* Tip (readonly) */}
                                            <div className="property-row">
                                                <label>Tip:</label>
                                                <span className="property-value">{component.template?.type}</span>
                                            </div>

                                            {/* Pozisyon X */}
                                            <div className="property-row">
                                                <label>Pozisyon X:</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(component.x)}
                                                    onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value) || 0)}
                                                    className="property-input property-input--number"
                                                />
                                            </div>

                                            {/* Pozisyon Y */}
                                            <div className="property-row">
                                                <label>Pozisyon Y:</label>
                                                <input
                                                    type="number"
                                                    value={Math.round(component.y)}
                                                    onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value) || 0)}
                                                    className="property-input property-input--number"
                                                />
                                            </div>

                                            {/* Katman (Z-Index) */}
                                            <div className="property-row">
                                                <label>Katman (Z):</label>
                                                <input
                                                    type="number"
                                                    value={component.zIndex}
                                                    onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value) || 0)}
                                                    className="property-input property-input--number"
                                                />
                                            </div>

                                            {/* Açı */}
                                            <div className="property-row">
                                                <label>Açı:</label>
                                                <div className="property-input-group">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="360"
                                                        value={Math.round(component.rotation)}
                                                        onChange={(e) => handlePropertyChange('rotation', (parseFloat(e.target.value) || 0) % 360)}
                                                        className="property-input property-input--number"
                                                    />
                                                    <span className="property-unit">°</span>
                                                </div>
                                            </div>

                                            {/* Boyut X */}
                                            <div className="property-row">
                                                <label>Boyut X:</label>
                                                <div className="property-input-group">
                                                    <input
                                                        type="number"
                                                        min="10"
                                                        max="500"
                                                        value={Math.round(component.scaleX * 100)}
                                                        onChange={(e) => handlePropertyChange('scaleX', Math.max(0.1, (parseFloat(e.target.value) || 100) / 100))}
                                                        className="property-input property-input--number"
                                                    />
                                                    <span className="property-unit">%</span>
                                                </div>
                                            </div>

                                            {/* Boyut Y */}
                                            <div className="property-row">
                                                <label>Boyut Y:</label>
                                                <div className="property-input-group">
                                                    <input
                                                        type="number"
                                                        min="10"
                                                        max="500"
                                                        value={Math.round(component.scaleY * 100)}
                                                        onChange={(e) => handlePropertyChange('scaleY', Math.max(0.1, (parseFloat(e.target.value) || 100) / 100))}
                                                        className="property-input property-input--number"
                                                    />
                                                    <span className="property-unit">%</span>
                                                </div>
                                            </div>

                                            {/* Kilitli */}
                                            <div className="property-row">
                                                <label>Kilitli:</label>
                                                <label className="property-toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={component.isLocked}
                                                        onChange={(e) => handlePropertyChange('isLocked', e.target.checked)}
                                                    />
                                                    <span className="property-toggle__slider"></span>
                                                    <span className="property-toggle__label">
                                                        {component.isLocked ? '🔒 Kilitli' : '🔓 Açık'}
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Katman Sırası */}
                                            <div className="property-row">
                                                <label>Katman (zIndex):</label>
                                                <span className="property-value">{component.zIndex}</span>
                                            </div>

                                            {/* Katman Kontrolleri */}
                                            <div className="property-row" style={{ gap: '8px' }}>
                                                <button
                                                    className="palette-btn"
                                                    style={{ flex: 1, fontSize: '11px' }}
                                                    onClick={() => {
                                                        const minZ = Math.min(...layout!.components.map(c => c.zIndex));
                                                        handlePropertyChange('zIndex', minZ - 1);
                                                    }}
                                                    title="En arkaya gönder"
                                                >
                                                    ⬇️ Arkaya
                                                </button>
                                                <button
                                                    className="palette-btn"
                                                    style={{ flex: 1, fontSize: '11px' }}
                                                    onClick={() => {
                                                        const maxZ = Math.max(...layout!.components.map(c => c.zIndex));
                                                        handlePropertyChange('zIndex', maxZ + 1);
                                                    }}
                                                    title="En öne getir"
                                                >
                                                    ⬆️ Öne
                                                </button>
                                            </div>

                                            {/* 3D Renk Seçimi - Sadece belirli kategoriler veya hepsi için */}
                                            <div className="property-row">
                                                <label>3D Rengi:</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="color"
                                                        value={component.customData?.color || '#3b82f6'}
                                                        onChange={(e) => {
                                                            const newCustomData = { ...component.customData, color: e.target.value };
                                                            handlePropertyChange('customData', newCustomData);
                                                        }}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            padding: '0',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            backgroundColor: 'transparent'
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af' }}>
                                                        {component.customData?.color?.toUpperCase() || '#3B82F6'}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}


            </div>

        </div >
    );
};

export default LayoutEditor;
