import React, { useMemo, useState, useEffect, useRef } from 'react';
// FIX: Switched to namespace import to resolve potential module resolution issues.
import * as ReactRouterDom from 'react-router-dom';
import TableCard from '@/components/tables/TableCard';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Table, TableStatus } from '../types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { FiMapPin, FiPackage, FiGrid, FiSearch, FiShoppingCart, FiCalendar, FiMonitor, FiHome, FiBell } from 'react-icons/fi';
import Input from '@/components/common/Input';


// --- Sound Utilities ---
// A generic function to play a sound using the Web Audio API
// FIX: Added explicit 'void' return type to resolve a potential type inference issue.
const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void => {
    try {
        const saved = localStorage.getItem('restoByteSoundSettings');
        if (saved && JSON.parse(saved).soundsEnabled === false) {
            return;
        }
    } catch (e) { /* ignore */ }

    try {
        // FIX: Corrected typo from AudioAudioContext to AudioContext.
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (context.state === 'suspended') {
            context.resume();
        }
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.02);
        oscillator.start(context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + duration);
        oscillator.stop(context.currentTime + duration);
    } catch (e) {
        console.error("Could not play sound:", e);
    }
};

// Specific sound for assistance requests
// FIX: Added explicit 'void' return type.
const playAssistanceSound = (): void => {
    playSound(1000, 0.2, 'triangle');
    setTimeout(() => playSound(1200, 0.2, 'triangle'), 150);
};

// Specific sound for when food is ready
// FIX: Added explicit 'void' return type.
const playFoodReadySound = (): void => {
    playSound(600, 0.1, 'sawtooth');
    setTimeout(() => playSound(600, 0.1, 'sawtooth'), 150);
    setTimeout(() => playSound(600, 0.1, 'sawtooth'), 300);
};
// --- End Sound Utilities ---


// Custom hook to get the previous value of a prop or state
const usePrevious = <T,>(value: T): T | undefined => {
    // FIX: Provide an explicit `undefined` initial value to `useRef`. When a generic type is provided, `useRef` expects an initial value argument.
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

const TablesPage: React.FC = () => {
  const { tables, updateTableStatus, areasFloors } = useRestaurantData();
  // FIX: Switched to namespace import for react-router-dom to resolve potential module resolution issues causing typing errors.
  const navigate = ReactRouterDom.useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'All'>('All');

  const prevTables = usePrevious(tables);

  // Effect to play notification sounds for table status changes
  useEffect(() => {
      if (!prevTables || prevTables.length !== tables.length) return;

      tables.forEach(table => {
          const prevTable = prevTables.find(pt => pt.id === table.id);
          if (prevTable) {
              // Check for new assistance request
              if (table.assistanceRequested && !prevTable.assistanceRequested) {
                  playAssistanceSound();
              }
              // Check for new food ready notification
              if (table.foodReady && !prevTable.foodReady) {
                  playFoodReadySound();
              }
          }
      });

  }, [tables, prevTables]);


  const handleStatusChange = (tableId: string, newStatus: TableStatus) => {
    updateTableStatus(tableId, newStatus);
  };

  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesStatus = statusFilter === 'All' || table.status === statusFilter;
      const matchesSearch = !searchTerm.trim() || table.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tables, searchTerm, statusFilter]);

  const tablesByArea = useMemo(() => {
    const grouped: { [areaId: string]: { name: string, tables: Table[] } } = {};
    const unassigned: Table[] = [];

    filteredTables.forEach(table => {
      if (table.areaFloorId) {
        const area = areasFloors.find(af => af.id === table.areaFloorId);
        if (area) {
          if (!grouped[table.areaFloorId]) {
            grouped[table.areaFloorId] = { name: area.name, tables: [] };
          }
          grouped[table.areaFloorId].tables.push(table);
        } else {
          unassigned.push(table);
        }
      } else {
        unassigned.push(table);
      }
    });
    return { grouped, unassigned };
  }, [filteredTables, areasFloors]);
  
  const statusFilters: { label: string; value: TableStatus | 'All'; color: string; activeTextColor: string }[] = [
    { label: 'All', value: 'All', color: 'bg-gray-600', activeTextColor: 'text-white' },
    { label: 'Free', value: TableStatus.Free, color: 'bg-green-500', activeTextColor: 'text-white' },
    { label: 'Occupied', value: TableStatus.Occupied, color: 'bg-red-500', activeTextColor: 'text-white' },
    { label: 'Reserved', value: TableStatus.Reserved, color: 'bg-amber-500', activeTextColor: 'text-white' },
  ];

  const renderTableGrid = (tablesToRender: Table[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {tablesToRender.map(table => (
        <TableCard 
          key={table.id} 
          table={table} 
          onStatusChange={handleStatusChange} 
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-20 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center">
          <FiGrid className="mr-3 text-sky-600" />Table Status Overview
        </h1>
        
        <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
                <Button size="sm" variant="secondary" onClick={() => navigate('/app/home')} title="Go Home" leftIcon={<FiHome size={14}/>}>Home</Button>
                <Button size="sm" onClick={() => navigate('/app/panel/pos')} title="Go to POS" leftIcon={<FiShoppingCart size={14}/>}>POS</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/app/reservations')} title="Reservations" leftIcon={<FiCalendar size={14}/>}>Reservations</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/app/panel/kitchen-display')} title="Kitchen Display" leftIcon={<FiMonitor size={14}/>}>KDS</Button>
                <div className="relative">
                    <Button variant="outline" size="sm" className="!p-2.5 rounded-full" title="Notifications">
                        <FiBell size={16} />
                    </Button>
                    <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
                </div>
            </div>

            <Input 
                placeholder="Search tables..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                leftIcon={<FiSearch/>}
                containerClassName="mb-0"
                className={`h-9 !rounded-md bg-gray-100 border-transparent focus:ring-2 focus:ring-sky-500 focus:border-transparent w-40 md:w-52`}
            />
            
            <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>

            <div className="hidden lg:flex items-center space-x-1 bg-gray-200/70 p-1 rounded-full">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 flex items-center space-x-2 ${
                    statusFilter === filter.value
                      ? `${filter.color} ${filter.activeTextColor} shadow-sm`
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative">
        {tables.length === 0 ? (
            <Card>
              <p className="text-gray-500 text-center py-10">No tables configured. Please add tables in Settings &rarr; Table.</p>
            </Card>
        ) : filteredTables.length === 0 ? (
            <Card>
              <p className="text-gray-500 text-center py-10">No tables found matching the current filters.</p>
            </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(tablesByArea.grouped).map(([areaId, areaData]) => (
              areaData.tables.length > 0 && (
                <Card key={areaId} title="">
                  <div className="p-0">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 px-5 pt-5 flex items-center">
                      <FiMapPin className="mr-2 text-sky-500" /> Area: {areaData.name}
                    </h2>
                    <div className="px-5 pb-5">
                      {renderTableGrid(areaData.tables)}
                    </div>
                  </div>
                </Card>
              )
            ))}

            {tablesByArea.unassigned.length > 0 && (
              <Card title="">
                 <div className="p-0">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4 px-5 pt-5 flex items-center">
                      <FiPackage className="mr-2 text-gray-500" /> Unassigned Tables
                  </h2>
                  <div className="px-5 pb-5">
                      {renderTableGrid(tablesByArea.unassigned)}
                    </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TablesPage;