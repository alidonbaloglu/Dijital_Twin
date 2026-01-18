import FactoryLayout from "../components/FactoryLayout";

export default function App() {
  const handleStationClick = (stationId: string) => {
    console.log(`Station ${stationId} clicked`);
    // Future: Open detail panel, show station info, etc.
  };

  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <FactoryLayout onStationClick={handleStationClick} />
    </div>
  );
}