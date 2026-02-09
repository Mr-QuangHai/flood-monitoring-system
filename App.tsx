import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Banner from './components/Banner';
import Sidebar from './components/Sidebar';
import StatusCard from './components/StatusCard';
import HistoryChart from './components/HistoryChart';
import Footer from './components/Footer';

import { SensorData } from './types';
import { MOCK_INTERVAL_MS, MAX_HISTORY_POINTS } from './constants';

import { database } from './firebase';
import { ref, onValue, off } from 'firebase/database';

const App: React.FC = () => {
  /* ===================== STATE ===================== */
  const [data, setData] = useState<SensorData[]>([]);
  const [showF1, setShowF1] = useState(true);
  const [showR1, setShowR1] = useState(true);

  const [currentF1, setCurrentF1] = useState<number>(0);
  const [currentR1, setCurrentR1] = useState<number>(0);

  // Connection status
  const [isOnline, setIsOnline] = useState<boolean>(false);

  /* ===================== REFS ===================== */
  // Latest values for chart interval
  const latestValues = useRef({ f1: 0, r1: 0 });

  // Auto-increment ID for chart X-axis
  const idCounter = useRef(0);

  // Last Firebase update timestamp (watchdog)
  const lastUpdateRef = useRef<number>(0);

  /* =================================================
     1. FIREBASE REALTIME LISTENER
     ================================================= */
  useEffect(() => {
    const dbRef = ref(database, 'waterlevel');

    const handleValueChange = (snapshot: any) => {
      const val = snapshot.val();
      if (!val) return;

      // Mark system as online
      lastUpdateRef.current = Date.now();
      setIsOnline(true);

      // Parse Firebase structure:
      // waterlevel: { F1: { value }, R1: { value } }
      const f1Val = Number(val.F1?.value ?? 0);
      const r1Val = Number(val.R1?.value ?? 0);

      // Update realtime cards
      setCurrentF1(f1Val);
      setCurrentR1(r1Val);

      // Update values for chart recorder
      latestValues.current = { f1: f1Val, r1: r1Val };
    };

    onValue(dbRef, handleValueChange);

    // Cleanup
    return () => off(dbRef, 'value', handleValueChange);
  }, []);

  /* =================================================
     2. WATCHDOG – ONLINE / OFFLINE DETECTION
     ================================================= */
  useEffect(() => {
    const TIMEOUT_MS = 10_000;

    const watchdog = setInterval(() => {
      if (
        lastUpdateRef.current !== 0 &&
        Date.now() - lastUpdateRef.current > TIMEOUT_MS
      ) {
        setIsOnline(false);
      }
    }, 1000);

    return () => clearInterval(watchdog);
  }, []);

  /* =================================================
     3. STRIP-CHART RECORDER (HISTORY)
     ================================================= */
  useEffect(() => {
    const interval = setInterval(() => {
      // Do not record data before first Firebase update
      if (lastUpdateRef.current === 0) return;

      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      idCounter.current += 1;

      const newPoint: SensorData = {
        id: idCounter.current,
        time: timeString,
        f1: latestValues.current.f1,
        r1: latestValues.current.r1,
      };

      setData(prev => {
        const updated = [...prev, newPoint];
        if (updated.length > MAX_HISTORY_POINTS) {
          updated.shift();
        }
        return updated;
      });
    }, MOCK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header isOnline={isOnline} />

      <main className="max-w-7xl mx-auto p-4 lg:p-6 w-full flex-grow">
        <Banner />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="flex-shrink-0">
            <Sidebar
              showF1={showF1}
              setShowF1={setShowF1}
              showR1={showR1}
              setShowR1={setShowR1}
            />
          </div>

          {/* Main Content */}
          <div className="flex-grow min-w-0">
            {/* Realtime Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatusCard label="Cột F1" subLabel="F1" value={currentF1} />
              <StatusCard label="Cột R1" subLabel="R1" value={currentR1} />
            </div>

            {/* History Chart */}
            <HistoryChart
              data={data}
              showF1={showF1}
              showR1={showR1}
              onToggleF1={setShowF1}
              onToggleR1={setShowR1}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
