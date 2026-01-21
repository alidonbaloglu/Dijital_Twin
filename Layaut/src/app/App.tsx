import { useState } from "react";
import FactoryLayout from "../components/FactoryLayout";
import { LayoutEditor, ImportDialog } from "../components/LayoutEditor";
import { ComponentTemplate } from "../services/layoutApi";

type AppMode = 'view' | 'edit';

export default function App() {
  const [mode, setMode] = useState<AppMode>('view');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [layoutId, setLayoutId] = useState<string>('default-production-line');

  const handleStationClick = (stationId: string) => {
    console.log(`Station ${stationId} clicked`);
  };

  const handleImportComplete = (template: ComponentTemplate) => {
    console.log('Template imported:', template);
    setShowImportDialog(false);
  };

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: '#1a1d24',
        borderBottom: '1px solid #3d4454',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#e5e7eb', fontWeight: 600 }}>
            🏭 Digital Twin
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMode('view')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: mode === 'view' ? '#60a5fa' : '#9ca3af',
                backgroundColor: mode === 'view' ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                border: mode === 'view' ? '1px solid #60a5fa' : '1px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              👁️ İzleme
            </button>
            <button
              onClick={() => setMode('edit')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: mode === 'edit' ? '#60a5fa' : '#9ca3af',
                backgroundColor: mode === 'edit' ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                border: mode === 'edit' ? '1px solid #60a5fa' : '1px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ✏️ Düzenle
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {mode === 'edit' && (
            <button
              onClick={() => setShowImportDialog(true)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              📥 Import SVG
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'view' ? (
          <FactoryLayout onStationClick={handleStationClick} layoutId={layoutId} />
        ) : (
          <LayoutEditor layoutId={layoutId} readOnly={false} />
        )}
      </div>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}