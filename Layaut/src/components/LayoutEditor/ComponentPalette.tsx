import React, { useState, useEffect, useMemo } from 'react';
import { ComponentTemplate, getComponentTemplates, deleteComponentTemplate } from '../../services/layoutApi';
import ImportDialog from './ImportDialog';

interface ComponentPaletteProps {
    onTemplateDrop: (template: ComponentTemplate) => void;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onTemplateDrop }) => {
    const [templates, setTemplates] = useState<ComponentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await getComponentTemplates();
            setTemplates(data);
            // Expand all categories by default
            const cats = new Set(data.map((t: ComponentTemplate) => t.category));
            setExpandedCategories(cats);
        } catch (err) {
            console.error('Error loading templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (template: ComponentTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`"${template.name}" bileşenini silmek istediğinize emin misiniz?`)) {
            try {
                await deleteComponentTemplate(template.id);
                loadTemplates();
            } catch (err) {
                console.error('Error deleting template:', err);
                alert('Bileşen silinemedi. Kullanımda olabilir.');
            }
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    // Get unique categories with counts
    const categoriesWithCounts = useMemo(() => {
        const catMap = new Map<string, number>();
        templates.forEach((t) => {
            catMap.set(t.category, (catMap.get(t.category) || 0) + 1);
        });
        return Array.from(catMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [templates]);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        if (searchQuery === '') return templates;
        return templates.filter((t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [templates, searchQuery]);

    // Group templates by category
    const groupedTemplates = useMemo(() => {
        const groups = new Map<string, ComponentTemplate[]>();
        filteredTemplates.forEach((t) => {
            if (!groups.has(t.category)) {
                groups.set(t.category, []);
            }
            groups.get(t.category)!.push(t);
        });
        return groups;
    }, [filteredTemplates]);

    // Get icon for component type
    const getTypeIcon = (type: string) => {
        switch (type.toUpperCase()) {
            case 'STATION': return '🏭';
            case 'CONVEYOR': return '➡️';
            case 'ROBOT': return '🤖';
            case 'BUFFER': return '📦';
            case 'AGV': return '🚗';
            case 'SENSOR': return '📡';
            default: return '🔧';
        }
    };

    // Get category icon
    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'stations': return '🏭';
            case 'conveyors': return '➡️';
            case 'robots': return '🤖';
            case 'storage': return '📦';
            case 'custom': return '✨';
            default: return '📁';
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedCategories(new Set(categoriesWithCounts.map(([cat]) => cat)));
    };

    const collapseAll = () => {
        setExpandedCategories(new Set());
    };

    if (loading && templates.length === 0) {
        return (
            <div className="component-palette">
                <div className="component-palette__loading">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="component-palette">
            {/* Header */}
            <div className="component-palette__header">
                <h3>Bileşenler</h3>
                <div className="component-palette__header-actions">
                    <button
                        className="palette-btn palette-btn--icon"
                        onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                        title={viewMode === 'list' ? 'Izgara Görünümü' : 'Liste Görünümü'}
                    >
                        {viewMode === 'list' ? '⊞' : '☰'}
                    </button>
                    <button
                        className="palette-btn palette-btn--primary"
                        onClick={() => setShowImportDialog(true)}
                        title="Yeni Bileşen Ekle"
                    >
                        + Ekle
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="component-palette__search">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Bileşen ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="component-palette__quick-actions">
                <button onClick={expandAll} className="quick-action-btn">Tümünü Aç</button>
                <button onClick={collapseAll} className="quick-action-btn">Tümünü Kapat</button>
                <span className="template-count">{filteredTemplates.length} bileşen</span>
            </div>

            {/* Categories Accordion */}
            <div className="component-palette__categories-accordion">
                {Array.from(groupedTemplates.entries()).map(([category, categoryTemplates]) => (
                    <div key={category} className="category-section">
                        {/* Category Header */}
                        <button
                            className={`category-header ${expandedCategories.has(category) ? 'expanded' : ''}`}
                            onClick={() => toggleCategory(category)}
                        >
                            <span className="category-icon">{getCategoryIcon(category)}</span>
                            <span className="category-name">{category}</span>
                            <span className="category-count">{categoryTemplates.length}</span>
                            <span className="category-chevron">{expandedCategories.has(category) ? '▼' : '▶'}</span>
                        </button>

                        {/* Category Content */}
                        {expandedCategories.has(category) && (
                            <div className={`category-content ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                                {categoryTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`template-item ${viewMode === 'grid' ? 'template-item--grid' : 'template-item--list'}`}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/json', JSON.stringify(template));
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        onClick={() => onTemplateDrop(template)}
                                        title={`${template.name}\nTip: ${template.type}\nBoyut: ${template.width}x${template.height}\n\nSürükleyip bırakın veya tıklayın`}
                                    >
                                        {/* Preview */}
                                        <div className="template-preview">
                                            {template.thumbnail ? (
                                                <img src={template.thumbnail} alt={template.name} />
                                            ) : (
                                                <div
                                                    className="template-svg"
                                                    dangerouslySetInnerHTML={{ __html: template.svgContent }}
                                                />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="template-info">
                                            <span className="template-icon">{getTypeIcon(template.type)}</span>
                                            <span className="template-name">{template.name}</span>
                                            {template.isDefault && (
                                                <span className="template-badge">Varsayılan</span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {!template.isDefault && (
                                            <button
                                                className="template-delete"
                                                onClick={(e) => handleDeleteTemplate(template, e)}
                                                title="Bileşeni Sil"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="component-palette__empty">
                    <p>🔍 Bileşen bulunamadı</p>
                    {searchQuery && <p className="empty-hint">Arama terimini değiştirmeyi deneyin</p>}
                </div>
            )}

            <ImportDialog
                isOpen={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                onImportComplete={(template) => {
                    setShowImportDialog(false);
                    loadTemplates();
                }}
            />
        </div>
    );
};

export default ComponentPalette;
