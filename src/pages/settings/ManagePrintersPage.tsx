
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Printer, PrinterType, PrinterInterfaceType } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import PrinterForm from '@/components/settings/PrinterForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiPrinter as FiPrinterIcon, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';
import { detectQzTrayPrinters } from '@/utils/qzTray';

interface SystemPrinter {
  name: string;
  model?: string;
  port?: string;
  status?: string;
  description?: string;
  usbPath?: string;
  interfaceType?: PrinterInterfaceType;
  source?: 'server' | 'qz';
}

const ManagePrintersPage: React.FC = () => {
    const { printers, addPrinter, updatePrinter, deletePrinter, printTest, printBot, printDelivery } = useRestaurantData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
    const [systemPrinters, setSystemPrinters] = useState<SystemPrinter[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isDetectingQz, setIsDetectingQz] = useState(false);
    const [isDetectingAgent, setIsDetectingAgent] = useState(false);
    const [agentStatus, setAgentStatus] = useState<{ available: boolean; agents: any[]; agentCount: number } | null>(null);
    const [showSystemPrintersModal, setShowSystemPrintersModal] = useState(false);

    const handleOpenModalForAdd = () => {
        setEditingPrinter(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (printer: Printer) => {
        setEditingPrinter(printer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPrinter(null);
    };

    const handleDelete = async (printerId: string) => {
        if (window.confirm('Are you sure you want to delete this printer configuration?')) {
            await deletePrinter(printerId);
        }
    };
    
    const handleAddSubmit = async (printerData: Omit<Printer, 'id'>) => {
        await addPrinter(printerData);
        handleCloseModal();
    };

    const handleUpdateSubmit = async (updatedPrinter: Printer) => {
        await updatePrinter(updatedPrinter);
        handleCloseModal();
    };

    const handleDetectPrinters = async () => {
        setIsDetecting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/printers/system`);
            if (!response.ok) throw new Error('Failed to fetch system printers');
            const data = await response.json();
            setSystemPrinters((data.printers || []).map((printer: SystemPrinter) => ({
                ...printer,
                interfaceType: printer.usbPath ? PrinterInterfaceType.USB : PrinterInterfaceType.Network,
                source: 'server',
            })));
            setShowSystemPrintersModal(true);
        } catch (error) {
            console.error('Error detecting printers:', error);
            alert('Failed to detect system printers');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleDetectQzPrinters = async () => {
        setIsDetectingQz(true);
        try {
            const printerNames = await detectQzTrayPrinters();
            setSystemPrinters(printerNames.map((printerName) => ({
                name: printerName,
                model: 'Browser / QZ Tray',
                interfaceType: PrinterInterfaceType.QZTray,
                source: 'qz',
            })));
            setShowSystemPrintersModal(true);
        } catch (error) {
            console.error('Error detecting QZ Tray printers:', error);
            alert('QZ Tray printer detection failed. Make sure QZ Tray is installed and running on this PC.');
        } finally {
            setIsDetectingQz(false);
        }
    };

    const handleDetectAgentPrinters = async () => {
        setIsDetectingAgent(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Check if a Print Agent is connected
            const statusRes = await fetch(`${API_BASE_URL}/print-agent/status`, { headers });
            if (!statusRes.ok) {
                throw new Error('Failed to check Print Agent status');
            }
            const statusData = await statusRes.json();
            setAgentStatus(statusData);

            if (!statusData.available) {
                alert('No Print Agent is currently connected. Please make sure the RestoByte Print Agent is installed and running on the computer connected to your printers.');
                return;
            }

            // Get printers detected by the Print Agent
            const printersRes = await fetch(`${API_BASE_URL}/print-agent/printers`, { headers });
            if (!printersRes.ok) {
                throw new Error('Failed to fetch Print Agent printers');
            }
            const printersData = await printersRes.json();
            const agentPrinters: SystemPrinter[] = (printersData.printers || []).map((p: any) => ({
                name: p.name,
                model: p.printerModel || p.type,
                port: p.ipAddress ? `${p.ipAddress}:${p.port || 9100}` : undefined,
                status: p.status,
                description: `Detected by Print Agent (${p.interfaceType})`,
                usbPath: p.usbPath,
                interfaceType: p.interfaceType === 'usb' ? PrinterInterfaceType.USB :
                              p.interfaceType === 'bluetooth' ? PrinterInterfaceType.Bluetooth :
                              p.interfaceType === 'serial' ? PrinterInterfaceType.Serial :
                              p.interfaceType === 'network' ? PrinterInterfaceType.Network :
                              PrinterInterfaceType.PrintAgent,
                source: 'server',
            }));

            setSystemPrinters(agentPrinters);
            setShowSystemPrintersModal(true);
        } catch (error) {
            console.error('Error detecting Print Agent printers:', error);
            alert('Print Agent detection failed. Please ensure the Print Agent is running and connected to the backend.');
        } finally {
            setIsDetectingAgent(false);
        }
    };

    const handleAddSystemPrinter = async (systemPrinter: SystemPrinter) => {
        const resolvedInterfaceType = systemPrinter.interfaceType || (systemPrinter.usbPath ? PrinterInterfaceType.USB : PrinterInterfaceType.Network);
        const newPrinter: Omit<Printer, 'id'> = {
            name: systemPrinter.name,
            type: PrinterType.Receipt,
            interfaceType: resolvedInterfaceType,
            isActive: true,
            printerModel: systemPrinter.model,
            usbPath: resolvedInterfaceType === PrinterInterfaceType.USB ? systemPrinter.usbPath : undefined,
        };
        await addPrinter(newPrinter);
        setShowSystemPrintersModal(false);
    };

    const getConnectionDetails = (printer: Printer): string => {
        if (printer.interfaceType === PrinterInterfaceType.Network) {
            return `${printer.ipAddress || 'N/A'}:${printer.port || 'N/A'}`;
        }
        if (printer.interfaceType === PrinterInterfaceType.USB) {
            return printer.usbPath || 'USB';
        }
        if (printer.interfaceType === PrinterInterfaceType.Bluetooth) {
            return printer.bluetoothMac || 'Bluetooth';
        }
        if (printer.interfaceType === PrinterInterfaceType.Serial) {
            return printer.serialPort ? `${printer.serialPort} @ ${printer.baudRate}` : 'Serial';
        }
        if (printer.interfaceType === PrinterInterfaceType.QZTray) {
            return 'Browser -> QZ Tray';
        }
        if (printer.interfaceType === PrinterInterfaceType.PrintAgent) {
            return 'Print Agent (local)';
        }
        return printer.interfaceType;
    };

    const handleTestPrint = (printer: Printer) => {
        let testContent = '';
        if (printer.type === PrinterType.Receipt) {
            testContent = `
----------------------------------------
|        RESTOBYTE TEST RECEIPT        |
----------------------------------------
Date: ${new Date().toLocaleString()}

Item 1                  $10.00
Item 2                  $15.50

----------------------------------------
TOTAL                   $25.50
----------------------------------------

Thank you for using RestoByte!
`;
        } else if (printer.type === PrinterType.KOT || printer.type === 'Kitchen Order Ticket (KOT)') {
            testContent = `
----------------------------------------
|         RESTOBYTE TEST KOT           |
----------------------------------------
Date: ${new Date().toLocaleString()}

2x Cheeseburger (Medium)
1x Fries (Large)

Notes: Extra ketchup!
`;
        } else if (printer.type === PrinterType.BOT || printer.type === 'Bar Order Ticket (BOT)') {
            testContent = `
----------------------------------------
|         RESTOBYTE TEST BOT           |
----------------------------------------
Date: ${new Date().toLocaleString()}

2x Beer (Large)
1x Cocktail
1x Nachos

Notes: Extra lime!
`;
        } else if (printer.type === PrinterType.Label) {
            testContent = `
RESTOBYTE TEST LABEL
${new Date().toLocaleString()}
`;
        }
        
        // Find the active printer of the same type to use, or use the selected printer
        const activePrinter = printers.find(p => 
            p.type === printer.type && 
            p.isActive
        ) || printer;
        
        printTest(activePrinter.id, testContent);
    };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiPrinterIcon className="mr-3 text-sky-600"/> Manage Printers
        </h1>
      </div>

      {/* QZ Tray Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <h3 className="font-semibold text-blue-800 mb-2">QZ Tray Setup (Browser Printing)</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Download & install QZ Tray from <a href="https://qz.io/download" target="_blank" rel="noopener noreferrer" className="underline font-medium">https://qz.io/download</a></li>
            <li>Ensure QZ Tray is running (check system tray for QZ icon)</li>
            <li>Click <strong>"Detect QZ Tray"</strong> below to find your printers</li>
            <li>Add the detected printer and set it as active</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">QZ Tray enables silent printing directly from your browser without print dialogs.</p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-3">
          <Button 
            onClick={handleDetectPrinters} 
            leftIcon={<FiRefreshCw size={20} className={isDetecting ? 'animate-spin' : ''}/>} 
            variant="secondary"
            disabled={isDetecting}
          >
            {isDetecting ? 'Detecting...' : 'Detect Server Printers'}
          </Button>
          <Button
            onClick={handleDetectQzPrinters}
            leftIcon={<FiRefreshCw size={20} className={isDetectingQz ? 'animate-spin' : ''}/>}
            variant="secondary"
            disabled={isDetectingQz}
          >
            {isDetectingQz ? 'Detecting...' : 'Detect QZ Tray'}
          </Button>
          <Button
            onClick={handleDetectAgentPrinters}
            leftIcon={<FiRefreshCw size={20} className={isDetectingAgent ? 'animate-spin' : ''}/>}
            variant="secondary"
            disabled={isDetectingAgent}
          >
            {isDetectingAgent ? 'Detecting...' : 'Detect Print Agent'}
          </Button>
          <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
            Add New Printer
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        {agentStatus && (
          <div className={`p-4 mb-4 rounded-lg border ${
            agentStatus.available
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                agentStatus.available ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                {agentStatus.available
                  ? `Print Agent connected (${agentStatus.agentCount} agent(s))`
                  : 'No Print Agent connected'}
              </span>
            </div>
            {agentStatus.available && agentStatus.agents && (
              <div className="mt-2 text-sm">
                {agentStatus.agents.map((agent: any, i: number) => (
                  <div key={i} className="mt-1">
                    • {agent.hostname} v{agent.version} • {agent.platform}
                  </div>
                ))}
              </div>
            )}
            {!agentStatus.available && (
              <div className="mt-2 text-sm">
                Download and install the RestoByte Print Agent to enable silent printing without browser dialogs.
              </div>
            )}
          </div>
        )}
        {printers.length === 0 ? (
          <div className="text-center py-10">
            <FiPrinterIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No printers configured.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Printer" to set up KOT or Receipt printers.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Connection Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Paper Size</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Auto-Print</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {printers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.type}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <>
                          <FiCheckCircle className="text-green-500" />
                          <span className="text-green-700 font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-red-500" />
                          <span className="text-red-700 font-medium">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getConnectionDetails(p)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.paperSize || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {[
                      p.autoPrintReceipt && 'Receipts',
                      p.autoPrintKOT && 'KOTs',
                      p.autoPrintBOT && 'BOTs',
                      p.autoPrintDelivery && 'Delivery',
                      p.autoPrintLabel && 'Labels'
                    ].filter(Boolean).join(', ') || 'None'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <Button onClick={() => handleTestPrint(p)} variant="secondary" size="sm" aria-label="Test Printer">
                        <FiPrinterIcon />
                      </Button>
                      <Button onClick={() => handleOpenModalForEdit(p)} variant="secondary" size="sm" aria-label="Edit Printer">
                        <FiEdit />
                      </Button>
                      <Button onClick={() => handleDelete(p.id)} variant="danger" size="sm" aria-label="Delete Printer">
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingPrinter ? "Edit Printer" : "Add New Printer"}
        size="2xl"
      >
        <PrinterForm
          initialData={editingPrinter}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>

      <Modal 
        isOpen={showSystemPrintersModal} 
        onClose={() => setShowSystemPrintersModal(false)} 
        title="Detected System Printers"
        size="xl"
      >
        <div className="space-y-4">
          {systemPrinters.length === 0 ? (
            <div className="text-center py-8">
              <FiPrinterIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No printers detected on this system.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {systemPrinters.map((printer, index) => (
                <Card key={index} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{printer.name}</p>
                    <p className="text-sm text-gray-500">
                      {printer.model ? `Model: ${printer.model}` : ''}
                      {printer.status ? ` • Status: ${printer.status}` : ''}
                      {printer.interfaceType ? ` • ${printer.interfaceType}` : ''}
                      {printer.source === 'qz' ? ' • Detected in browser' : ''}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleAddSystemPrinter(printer)} 
                    variant="primary" 
                    size="sm"
                  >
                    Add
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagePrintersPage;
