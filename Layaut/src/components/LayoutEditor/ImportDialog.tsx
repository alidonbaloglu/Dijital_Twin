import React, { useState, useRef, useCallback } from 'react';
import { ComponentTemplate, createComponentTemplate, ConnectionPoint } from '../../services/layoutApi';
import { stripSvgTags, extractViewBox } from '../../utils/svgUtils';
import { dxfToSvg } from '../../utils/dxfUtils';
import './LayoutEditor.css';

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (template: ComponentTemplate) => void;
}

const COMPONENT_TYPES = [
    { value: 'STATION', label: 'İstasyon' },
    { value: 'CONVEYOR', label: 'Konveyör' },
    { value: 'ROBOT', label: 'Robot' },
    { value: 'BUFFER', label: 'Buffer/Depo' },
    { value: 'AGV', label: 'AGV' },
    { value: 'SENSOR', label: 'Sensör' },
    { value: 'OTHER', label: 'Diğer' },
    { value: 'FLOOR', label: 'Zemin/Yapı' },
];

const importDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, onImportComplete }) => {
    const [svgContent, setSvgContent] = useState<string>('');
    const [viewBox, setViewBox] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('STATION');
    const [category, setCategory] = useState('custom');
    const [width, setWidth] = useState<number>(100);
    const [height, setHeight] = useState<number>(100);
    const [connectionPoints, setConnectionPoints] = useState<ConnectionPoint[]>([
        { id: 'left', x: 0, y: 50, direction: 'left' },
        { id: 'right', x: 100, y: 50, direction: 'right' },
    ]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }, []);

    // Handle file select
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, []);

    // Process uploaded file
    const processFile = (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'dwg') {
            setError('DWG dosyaları doğrudan tarayıcıda açılamaz. Lütfen dosyanızı DXF formatında kaydedip tekrar deneyin.');
            return;
        }

        if (extension === 'step' || extension === 'stp') {
            setError('STEP dosyaları 3D formatındadır. Bu editör 2D çalıştığı için lütfen CAD programınızdan "2D DXF" veya "SVG" formatında çıktı alıp yükleyin.');
            return;
        }

        if (extension !== 'svg' && extension !== 'dxf') {
            setError('Lütfen .svg, .dxf, .dwg veya .step uzantılı bir dosya yükleyin.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const fileName = file.name.replace(/\.(svg|dxf)$/i, '');
            setName(fileName);
            setError(null);

            if (extension === 'dxf') {
                setIsLoading(true);
                // Wrap in setTimeout to allow UI to update loading state
                setTimeout(() => {
                    try {
                        const result = dxfToSvg(content);

                        if (!result.svg && result.stats.processed === 0) {
                            setError(`DXF dosyası okunamadı. Desteklenen eleman bulunamadı. (Atlanan: ${result.stats.skipped} adet - ${Object.keys(result.stats.skippedTypes).join(', ')})`);
                            setIsLoading(false);
                            return;
                        }

                        // Check for skipped entities warning
                        if (result.stats.skipped > 0) {
                            const skipped = Object.entries(result.stats.skippedTypes)
                                .map(([k, v]) => `${k} (${v})`)
                                .join(', ');
                            console.warn(`DXF Import Warning: Skipped ${result.stats.skipped} entities: ${skipped}`);
                            // Optional: Show warning to user? For now just log.
                        }

                        setSvgContent(result.svg);
                        setViewBox(result.viewBox);
                        setWidth(Math.round(result.width));
                        setHeight(Math.round(result.height));

                        // Default connection points for DXF geometry
                        setConnectionPoints([
                            { id: 'left', x: 0, y: result.height / 2, direction: 'left' },
                            { id: 'right', x: result.width, y: result.height / 2, direction: 'right' },
                        ]);

                        // Auto-detect floor type if large dimensions
                        if (result.width > 500 || result.height > 500) {
                            setType('FLOOR');
                            setCategory('floors');
                        }
                    } catch (err) {
                        console.error(err);
                        setError(err instanceof Error ? err.message : 'DXF dönüştürme hatası.');
                    } finally {
                        setIsLoading(false);
                    }
                }, 100);
            } else {
                // Handle SVG
                const cleanedContent = stripSvgTags(content);
                const extractedViewBox = extractViewBox(content);

                setSvgContent(cleanedContent);
                setViewBox(extractedViewBox);

                // Extract dimensions from SVG
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'image/svg+xml');
                const svgElement = doc.querySelector('svg');

                if (svgElement) {
                    let w = 100;
                    let h = 100;

                    if (extractedViewBox) {
                        const parts = extractedViewBox.split(/\s+/).map(Number);
                        if (parts.length >= 4) {
                            w = parts[2];
                            h = parts[3];
                        }
                    } else {
                        w = parseFloat(svgElement.getAttribute('width') || '100');
                        h = parseFloat(svgElement.getAttribute('height') || '100');
                    }

                    setWidth(w);
                    setHeight(h);

                    setConnectionPoints([
                        { id: 'left', x: 0, y: h / 2, direction: 'left' },
                        { id: 'right', x: w, y: h / 2, direction: 'right' },
                    ]);
                }
            }
        };
        reader.readAsText(file);
    };

    // Handle connection point update
    const updateConnectionPoint = (index: number, field: keyof ConnectionPoint, value: any) => {
        setConnectionPoints((prev) =>
            prev.map((point, i) => (i === index ? { ...point, [field]: value } : point))
        );
    };

    // Add connection point
    const addConnectionPoint = () => {
        const id = `point-${Date.now()}`;
        setConnectionPoints((prev) => [
            ...prev,
            { id, x: width / 2, y: height / 2, direction: 'right' },
        ]);
    };

    // Remove connection point
    const removeConnectionPoint = (index: number) => {
        setConnectionPoints((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle import
    const handleImport = async () => {
        if (!svgContent || !name) {
            setError('Lütfen SVG dosyası ve isim girin');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Re-wrap content in SVG tag with correct viewBox for storage
            const vBox = viewBox || `0 0 ${width} ${height}`;
            const finalSvgContent = `<svg viewBox="${vBox}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;

            const template = await createComponentTemplate({
                name,
                type,
                category,
                svgContent: finalSvgContent,
                width,
                height,
                connectionPoints,
            });

            onImportComplete(template);
            handleReset();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import başarısız');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setSvgContent('');
        setName('');
        setType('STATION');
        setCategory('custom');
        setWidth(100);
        setHeight(100);
        setConnectionPoints([
            { id: 'left', x: 0, y: 50, direction: 'left' },
            { id: 'right', x: 100, y: 50, direction: 'right' },
        ]);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="import-dialog-overlay" onClick={onClose}>
            <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="import-dialog__header">
                    <h2>📥 SVG Bileşen Import</h2>
                    <button className="import-dialog__close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="import-dialog__content">
                    {/* Dropzone */}
                    {!svgContent && (
                        <div
                            className={`import-dialog__dropzone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="import-dialog__dropzone-icon">📁</div>
                            <div className="import-dialog__dropzone-text">
                                SVG dosyasını sürükleyin veya tıklayın
                            </div>
                            <div className="import-dialog__dropzone-hint">
                                Desteklenenler: .svg, .dxf (DWG/STEP için dönüştürme uyarısı verilir)
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".svg,image/svg+xml,.dxf,.dwg,.step,.stp"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </div>
                    )}


                    {/* Preview */}
                    {svgContent && (
                        <>
                            <div className="import-dialog__preview">
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox={viewBox || `0 0 ${width} ${height}`}
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                                >
                                    <g dangerouslySetInnerHTML={{ __html: svgContent }} />
                                </svg>
                            </div>

                            {/* Form */}
                            <div className="import-dialog__form">
                                <div className="import-dialog__form-group">
                                    <label>Bileşen Adı *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Örn: Kaynak İstasyonu"
                                    />
                                </div>

                                <div className="import-dialog__form-group">
                                    <label>Bileşen Tipi *</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)}>
                                        {COMPONENT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="import-dialog__form-group">
                                    <label>Kategori</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Örn: custom, stations, robots"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div className="import-dialog__form-group" style={{ flex: 1 }}>
                                        <label>Genişlik (px)</label>
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="import-dialog__form-group" style={{ flex: 1 }}>
                                        <label>Yükseklik (px)</label>
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Connection Points */}
                                <div className="import-dialog__form-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Bağlantı Noktaları</span>
                                        <button
                                            type="button"
                                            className="layout-editor__btn"
                                            style={{ padding: '4px 8px', fontSize: '12px' }}
                                            onClick={addConnectionPoint}
                                        >
                                            + Ekle
                                        </button>
                                    </label>
                                    {connectionPoints.map((point, index) => (
                                        <div
                                            key={point.id}
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginTop: '8px',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={point.id}
                                                onChange={(e) => updateConnectionPoint(index, 'id', e.target.value)}
                                                placeholder="ID"
                                                style={{ width: '80px' }}
                                            />
                                            <input
                                                type="number"
                                                value={point.x}
                                                onChange={(e) => updateConnectionPoint(index, 'x', Number(e.target.value))}
                                                placeholder="X"
                                                style={{ width: '60px' }}
                                            />
                                            <input
                                                type="number"
                                                value={point.y}
                                                onChange={(e) => updateConnectionPoint(index, 'y', Number(e.target.value))}
                                                placeholder="Y"
                                                style={{ width: '60px' }}
                                            />
                                            <select
                                                value={point.direction}
                                                onChange={(e) =>
                                                    updateConnectionPoint(index, 'direction', e.target.value)
                                                }
                                                style={{ width: '80px' }}
                                            >
                                                <option value="left">Sol</option>
                                                <option value="right">Sağ</option>
                                                <option value="top">Üst</option>
                                                <option value="bottom">Alt</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => removeConnectionPoint(index)}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: '#dc2626',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {error && (
                        <div style={{ color: '#ef4444', marginTop: '12px', fontSize: '14px' }}>{error}</div>
                    )}
                </div>

                <div className="import-dialog__footer">
                    {svgContent && (
                        <button className="layout-editor__btn" onClick={handleReset}>
                            🔄 Sıfırla
                        </button>
                    )}
                    <button className="layout-editor__btn" onClick={onClose}>
                        İptal
                    </button>
                    {svgContent && (
                        <button
                            className="layout-editor__btn layout-editor__btn--primary"
                            onClick={handleImport}
                            disabled={isLoading || !name}
                        >
                            {isLoading ? '⏳ Yükleniyor...' : '✓ Import Et'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default importDialog;
