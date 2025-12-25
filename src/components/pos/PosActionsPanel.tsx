import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { FiActivity, FiCalendar, FiBell, FiClock, FiGrid, FiUser, FiTrendingUp, FiArchive, FiSearch, FiHome, FiMonitor, FiTv } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import TodaySummaryModal from '../dashboard/TodaySummaryModal';
import RegisterDetailsModal from '../dashboard/RegisterDetailsModal';


const timeSince = (dateString?: string) => {
    if (!dateString) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};


interface PosActionsPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};


const PosActionsPanel: React.FC<PosActionsPanelProps> = ({ searchTerm, onSearchChange }) => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    
    const { sales, reservations, tables, resolveTableAssistance } = useRestaurantData();
    const navigate = useNavigate();

    const runningOrders = useMemo(() => sales.filter(s => s.assignedTableId && !s.isSettled).sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()), [sales]);
    
    const todaysReservations = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return reservations.filter(r => new Date(r.dateTime) >= today).sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }, [reservations]);

    const assistanceRequests = useMemo(() => tables.filter(t => t.assistanceRequested).sort((a,b) => new Date(b.assistanceRequestedAt!).getTime() - new Date(a.assistanceRequestedAt!).getTime()), [tables]);

    const tabs = [
        { key: 'orders',       label: 'Running Orders',    icon: FiActivity,   notificationCount: runningOrders.length },
        { key: 'reservations', label: 'Reservations',      icon: FiCalendar,   notificationCount: todaysReservations.length },
        { key: 'requests',     label: 'Waiter Requests',   icon: FiBell,       notificationCount: assistanceRequests.length },
        { key: 'summary',      label: "Today's Summary",   icon: FiTrendingUp, notificationCount: 0 },
        { key: 'register',     label: 'Register Details',  icon: FiArchive,    notificationCount: 0 },
    ] as const;
    
    const actionTabs = useMemo(() => tabs.slice(0, 3), [runningOrders.length, todaysReservations.length, assistanceRequests.length]);
    const infoTabs = useMemo(() => tabs.slice(3), []);
    

    return (
        <>
            {/* Modals */}
            <Modal isOpen={activeModal === 'orders'} onClose={() => setActiveModal(null)} title="Active Running Orders" size="lg">
                 <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {runningOrders.length > 0 ? (
                        <ul className="space-y-2">
                            {runningOrders.map(order => (
                                <li key={order.id}>
                                    <Link
                                        to={`/app/panel/pos/${order.assignedTableId}`}
                                        onClick={() => setActiveModal(null)}
                                        className="block p-4 rounded-lg hover:bg-gray-100 transition-colors border"
                                    >
                                        <div className="flex justify-between items-center text-base">
                                            <span className="font-semibold flex items-center text-gray-800"><FiGrid size={15} className="mr-2"/>{order.assignedTableName}</span>
                                            <span className="font-bold text-sky-700 text-lg">${order.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="text-gray-500 flex items-center justify-between text-sm mt-1 pl-7">
                                            <span><FiUser size={13} className="inline mr-1.5"/>{order.customerName || 'Walk-in'}</span>
                                            <span><FiClock size={13} className="inline mr-1.5"/>{timeSince(order.saleDate)}</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-10">No active orders at the moment.</p>
                    )}
                 </div>
            </Modal>
            
            <Modal isOpen={activeModal === 'reservations'} onClose={() => setActiveModal(null)} title="Upcoming Reservations" size="md">
                 <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {todaysReservations.length > 0 ? (
                        <ul className="space-y-2">
                            {todaysReservations.map(res => (
                                <li key={res.id} className="p-3 rounded-lg hover:bg-gray-100 border cursor-pointer" onClick={() => {navigate('/app/reservations'); setActiveModal(null);}}>
                                    <div className="flex justify-between items-center text-base">
                                        <span className="font-semibold flex items-center text-gray-800"><FiUser size={15} className="mr-2"/>{res.customerName} (pax: {res.partySize})</span>
                                    </div>
                                    <div className="text-gray-500 flex items-center text-sm mt-1 pl-7">
                                        <FiClock size={13} className="inline mr-1.5"/>{new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-gray-500 py-10">No upcoming reservations.</p> }
                 </div>
            </Modal>

            <Modal isOpen={activeModal === 'requests'} onClose={() => setActiveModal(null)} title="Waiter Requests" size="md">
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {assistanceRequests.length > 0 ? (
                        <ul className="space-y-2">
                            {assistanceRequests.map(table => (
                                <li key={table.id} className="p-3 rounded-lg hover:bg-gray-100 border">
                                    <div className="flex justify-between items-center text-base">
                                        <span className="font-semibold flex items-center text-gray-800"><FiGrid size={15} className="mr-2"/>{table.name}</span>
                                        <Button size="sm" className="!text-sm !py-1 !px-2" onClick={() => { resolveTableAssistance(table.id); if (assistanceRequests.length === 1) setActiveModal(null); }}>Resolve</Button>
                                    </div>
                                    <div className="text-gray-500 flex items-center text-sm mt-1 pl-7">
                                        <FiClock size={13} className="inline mr-1.5"/>{timeSince(table.assistanceRequestedAt)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-gray-500 py-10">No active requests.</p>}
                </div>
            </Modal>

            <TodaySummaryModal isOpen={activeModal === 'summary'} onClose={() => setActiveModal(null)} />
            <RegisterDetailsModal isOpen={activeModal === 'register'} onClose={() => setActiveModal(null)} />
            
            {/* Main Component Render */}
            <div className="w-full bg-white border-b px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Left: Nav actions */}
                    <div className="flex items-center space-x-2">
                        <Link to="/app/home" title="Home" className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-sky-600"><FiHome size={24}/></Link>
                        <Link to="/app/tables" title="Table Status" className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-sky-600"><FiGrid size={24}/></Link>
                        <Link to="/app/panel/kitchen-display" title="Kitchen Display" className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-sky-600"><FiMonitor size={24}/></Link>
                        <button onClick={() => openInNewTab('#/app/panel/customer-display')} title="Open Customer Display" className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-sky-600">
                            <FiTv size={24}/>
                        </button>
                    </div>

                    {/* Center: Search */}
                    <div className="flex-1 px-8">
                         <Input
                            placeholder="Search menu items..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            leftIcon={<FiSearch className="h-6 w-6" />}
                            containerClassName="mb-0 max-w-md mx-auto"
                            className="h-12 !pl-11 !rounded-full bg-gray-100 border-transparent focus:ring-2 focus:ring-sky-500 focus:border-transparent text-base"
                        />
                    </div>

                    {/* Right: Modal actions */}
                    <div className="flex items-center space-x-1">
                        {actionTabs.map(tab => (
                            <div key={tab.key} className="relative">
                                <button title={tab.label} onClick={() => setActiveModal(tab.key)} className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-sky-600">
                                    <tab.icon size={24}/>
                                </button>
                                {tab.notificationCount > 0 && <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
                            </div>
                        ))}
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        {infoTabs.map(tab => (
                             <button key={tab.key} title={tab.label} onClick={() => setActiveModal(tab.key)} className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-sky-600">
                                <tab.icon size={24}/>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PosActionsPanel;