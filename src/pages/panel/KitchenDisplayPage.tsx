import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import KitchenDisplayCard from '@/components/panel/KitchenDisplayCard';
import { FiHardDrive, FiChevronDown, FiMaximize, FiMinimize } from 'react-icons/fi';
import { Sale } from '@/types';

const playNotificationSound = () => {
    try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (context.state === 'suspended') {
            context.resume();
        }
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.6, context.currentTime + 0.05);
        oscillator.start(context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);
        oscillator.stop(context.currentTime + 0.3);
    } catch (e) {
        console.error("Could not play sound:", e);
    }
};


const KitchenColumn: React.FC<{ title: string; count: number; children: React.ReactNode; color: string }> = ({ title, count, children, color }) => (
    <div className="flex flex-col bg-gray-800/50 rounded-lg h-full overflow-hidden">
        <h2 className={`text-lg font-bold p-3 border-b-2 ${color} flex justify-between items-center`}>
            <span>{title}</span>
            <span className="text-sm bg-gray-700 px-2 py-0.5 rounded-full">{count}</span>
        </h2>
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            {children}
        </div>
    </div>
);


const KitchenDisplayPage: React.FC = () => {
    const { sales, getSingleActiveOutlet, updateKdsOrderStatus } = useRestaurantData();
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Sound notification logic
    const newOrderCountRef = useRef(0);
    const hasPlayedSoundForOrder = useRef<Set<string>>(new Set());

    const pendingOrders = useMemo(() => {
        return sales
            .filter(sale => sale.kdsStatus === 'new' || sale.kdsStatus === 'on-hold')
            .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
    }, [sales]);

    const ongoingOrders = useMemo(() => {
        return sales
            .filter(sale => sale.kdsStatus === 'in-progress')
            .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
    }, [sales]);

    const readyOrders = useMemo(() => {
        return sales
            .filter(sale => sale.kdsStatus === 'ready')
            .sort((a, b) => new Date(b.kdsReadyTimestamp || b.saleDate).getTime() - new Date(a.kdsReadyTimestamp || a.saleDate).getTime());
    }, [sales]);

    useEffect(() => {
        const newOrders = pendingOrders.filter(o => o.kdsStatus === 'new');
        newOrders.forEach(order => {
            if (!hasPlayedSoundForOrder.current.has(order.id)) {
                playNotificationSound();
                hasPlayedSoundForOrder.current.add(order.id);
            }
        });
    }, [pendingOrders]);
    
    const outlet = getSingleActiveOutlet();

    const handleKdsAction = (orderId: string, status: 'new' | 'ready' | 'served' | 'in-progress' | 'on-hold') => {
        updateKdsOrderStatus(orderId, status);
    };
    
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

     useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-[#343a40] text-white font-sans">
            {/* Header */}
            <header className="bg-[#212529] p-3 flex justify-between items-center shadow-md flex-shrink-0 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <FiHardDrive size={24} />
                    <h1 className="text-xl font-bold">KITCHEN</h1>
                    <div className="h-6 w-px bg-gray-600"></div>
                    <button className="flex items-center space-x-2 p-2 rounded-md bg-gray-700/50 hover:bg-gray-600/50">
                        <span>POINT OF SALE</span>
                        <FiChevronDown size={16} />
                    </button>
                     <span className="text-sm text-gray-300">{outlet?.name || 'All Outlets'}</span>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={toggleFullscreen} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                    {/* Pending Column */}
                    <KitchenColumn title="PENDING" count={pendingOrders.length} color="border-amber-400">
                         {pendingOrders.length === 0 ? <p className="text-center text-gray-500 mt-10">No new orders.</p> :
                            pendingOrders.map(order => (
                                <KitchenDisplayCard key={order.id} order={order} onAction={handleKdsAction} />
                            ))
                        }
                    </KitchenColumn>
                     {/* Ongoing Column */}
                    <KitchenColumn title="ONGOING" count={ongoingOrders.length} color="border-sky-400">
                        {ongoingOrders.length === 0 ? <p className="text-center text-gray-500 mt-10">No orders in progress.</p> :
                           ongoingOrders.map(order => (
                                <KitchenDisplayCard key={order.id} order={order} onAction={handleKdsAction} />
                           ))
                        }
                    </KitchenColumn>
                     {/* Ready Column */}
                    <KitchenColumn title="READY FOR PICKUP" count={readyOrders.length} color="border-green-400">
                        {readyOrders.length === 0 ? <p className="text-center text-gray-500 mt-10">No orders are ready.</p> :
                            readyOrders.map(order => (
                                <KitchenDisplayCard key={order.id} order={order} onAction={handleKdsAction} />
                            ))
                        }
                    </KitchenColumn>
                </div>
            </main>

        </div>
    );
};

export default KitchenDisplayPage;