
import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Printer, PrinterType, PrinterInterfaceType } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import PrinterForm from '@/components/settings/PrinterForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiPrinter as FiPrinterIcon, FiCheckCircle, FiXCircle, FiRefreshCw, FiInfo } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface SystemPrinter {
  name: string;
  model?: string;
  port?: string;
  status?: string;
  description?: string;
  usbPath?: string;
  sources?: string[];
}

interface PrinterDetectionMeta {
  detectionHost?: string;
  platform?: string;
  message?: string;
}

interface UsbBridgeSetupData {
  outletId: string;
  configured: boolean;
  tokenPreview?: string | null;
  createdAt?: string | null;
  rotatedAt?: string | null;
  lastHeartbeatAt?: string | null;
  lastHost?: string | null;
  lastVersion?: string | null;
  lastSeenPrinters?: string[];
  lastError?: string | null;
  pendingJobs: number;
  usbPrinters: Array<{
    id: string;
    name: string;
    usbPath?: string | null;
    printerModel?: string | null;
  }>;
}

const ManagePrintersPage: React.FC = () => {
    const { printers, addPrinter, updatePrinter, deletePrinter, printTest, activeOutletIds } = useRestaurantData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
    const [systemPrinters, setSystemPrinters] = useState<SystemPrinter[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [showSystemPrintersModal, setShowSystemPrintersModal] = useState(false);
    const [detectionMeta, setDetectionMeta] = useState<PrinterDetectionMeta>({});
    const [usbBridgeSetup, setUsbBridgeSetup] = useState<UsbBridgeSetupData | null>(null);
    const [isLoadingUsbBridge, setIsLoadingUsbBridge] = useState(false);
    const [isRotatingUsbBridgeToken, setIsRotatingUsbBridgeToken] = useState(false);
    const [latestUsbBridgeToken, setLatestUsbBridgeToken] = useState<string>('');

    const selectedOutletId = activeOutletIds.length === 1 ? activeOutletIds[0] : undefined;
    const usbPrinters = useMemo(
        () => printers.filter((printer) => printer.interfaceType === PrinterInterfaceType.USB),
        [printers]
    );

    const getUsbBridgeEnvBlock = (tokenOverride?: string) => {
        const token = tokenOverride || latestUsbBridgeToken;
        const apiRoot = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
        return [
            `RESTOBYTE_API_URL=${apiRoot}`,
            `RESTOBYTE_OUTLET_ID=${selectedOutletId || '<outlet-id>'}`,
            `RESTOBYTE_BRIDGE_TOKEN=${token || '<paste-generated-token>'}`,
            'npm run usb-bridge'
        ].join('\n');
    };

    const loadUsbBridgeSetup = async () => {
        if (!selectedOutletId) {
            setUsbBridgeSetup(null);
            return;
        }

        setIsLoadingUsbBridge(true);
        try {
            const response = await fetch(`${API_BASE_URL}/printers/bridge/setup?outletId=${encodeURIComponent(selectedOutletId)}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (!response.ok) {
                throw new Error('Failed to load USB bridge setup');
            }
            const data = await response.json();
            setUsbBridgeSetup(data);
        } catch (error) {
            console.error('Error loading USB bridge setup:', error);
        } finally {
            setIsLoadingUsbBridge(false);
        }
    };

    useEffect(() => {
        void loadUsbBridgeSetup();
    }, [selectedOutletId]);

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
            setSystemPrinters(data.printers || []);
            setDetectionMeta({
                detectionHost: data.detectionHost,
                platform: data.platform,
                message: data.message,
            });
            setShowSystemPrintersModal(true);
        } catch (error) {
            console.error('Error detecting printers:', error);
            alert('Failed to detect system printers');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleAddSystemPrinter = async (systemPrinter: SystemPrinter) => {
        const isUsbPrinter = !!systemPrinter.usbPath;
        const newPrinter: Omit<Printer, 'id'> = {
            name: systemPrinter.name,
            type: PrinterType.Receipt,
            interfaceType: isUsbPrinter ? PrinterInterfaceType.USB : PrinterInterfaceType.Network,
            isActive: true,
            printerModel: systemPrinter.model,
            usbPath: systemPrinter.usbPath,
        };
        await addPrinter(newPrinter);
        setShowSystemPrintersModal(false);
        if (isUsbPrinter) {
            void loadUsbBridgeSetup();
        }
    };

    const handleRotateUsbBridgeToken = async () => {
        if (!selectedOutletId) {
            alert('Please select a single outlet before configuring the USB bridge.');
            return;
        }

        setIsRotatingUsbBridgeToken(true);
        try {
            const response = await fetch(`${API_BASE_URL}/printers/bridge/token?outletId=${encodeURIComponent(selectedOutletId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            if (!response.ok) {
                const error = await response.json().catch(() => null);
                throw new Error(error?.message || 'Failed to generate USB bridge token');
            }

            const data = await response.json();
            setLatestUsbBridgeToken(data.token || '');
            await navigator.clipboard.writeText(getUsbBridgeEnvBlock(data.token || ''));
            alert('USB bridge token generated and the setup command was copied to your clipboard.');
            await loadUsbBridgeSetup();
        } catch (error) {
            console.error('Error generating USB bridge token:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate USB bridge token');
        } finally {
            setIsRotatingUsbBridgeToken(false);
        }
    };

    const handleCopyUsbBridgeCommand = async () => {
        try {
            await navigator.clipboard.writeText(getUsbBridgeEnvBlock());
            alert('USB bridge setup command copied to clipboard.');
        } catch (error) {
            console.error('Failed to copy USB bridge setup command:', error);
            alert('Failed to copy the USB bridge setup command.');
        }
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
        } else if (printer.type === PrinterType.KOT) {
            testContent = `
----------------------------------------
|         RESTOBYTE TEST KOT           |
----------------------------------------
Date: ${new Date().toLocaleString()}

2x Cheeseburger (Medium)
1x Fries (Large)

Notes: Extra ketchup!
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
        <div className="flex gap-3">
          <Button 
            onClick={handleDetectPrinters} 
            leftIcon={<FiRefreshCw size={20} className={isDetecting ? 'animate-spin' : ''}/>} 
            variant="secondary"
            disabled={isDetecting}
          >
            {isDetecting ? 'Detecting...' : 'Detect Printers'}
          </Button>
          <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
            Add New Printer
          </Button>
        </div>
      </div>

      <Card className="p-4 border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3">
          <FiInfo className="mt-0.5 text-amber-600 shrink-0" size={18} />
          <div className="text-sm text-amber-900 space-y-1">
            <p className="font-medium">Printer detection runs on the backend machine.</p>
            <p>
              On a live or cloud server, your local POS USB/system printers usually will not appear here.
              For production use, add a <span className="font-medium">Network (IP/Ethernet)</span> printer with its LAN IP and port,
              or run the backend on the same machine or local network as the printer.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 border border-sky-200 bg-sky-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-sky-900">USB Print Bridge</h2>
            <p className="text-sm text-sky-800 mt-1">
              Use this when the printer is connected by USB to a local cashier machine while your RestoByte backend is hosted remotely.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void loadUsbBridgeSetup()} disabled={isLoadingUsbBridge || !selectedOutletId}>
              {isLoadingUsbBridge ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleRotateUsbBridgeToken} disabled={isRotatingUsbBridgeToken || !selectedOutletId}>
              {usbBridgeSetup?.configured ? 'Rotate Token' : 'Generate Token'}
            </Button>
          </div>
        </div>

        {!selectedOutletId ? (
          <p className="text-sm text-sky-900">Select exactly one outlet to configure the USB print bridge.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <div className="text-gray-500">USB Printers</div>
                <div className="text-lg font-semibold text-gray-900">{usbPrinters.length}</div>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <div className="text-gray-500">Bridge Token</div>
                <div className="text-lg font-semibold text-gray-900">{usbBridgeSetup?.configured ? 'Configured' : 'Not Set'}</div>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <div className="text-gray-500">Pending Jobs</div>
                <div className="text-lg font-semibold text-gray-900">{usbBridgeSetup?.pendingJobs ?? 0}</div>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-3">
                <div className="text-gray-500">Last Heartbeat</div>
                <div className="text-sm font-semibold text-gray-900">{usbBridgeSetup?.lastHeartbeatAt ? new Date(usbBridgeSetup.lastHeartbeatAt).toLocaleString() : 'No bridge online yet'}</div>
              </div>
            </div>

            <div className="rounded-lg border border-sky-200 bg-white p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900">Setup on the cashier PC</p>
              <p className="text-gray-600">
                1. Install the USB printer on that machine and make sure it prints from the OS.
                2. Open this project’s `backend` folder on that machine.
                3. Run the command below and keep the bridge running.
              </p>
              <div className="rounded-md bg-slate-950 text-slate-100 p-3 overflow-x-auto">
                <pre className="text-xs whitespace-pre-wrap">{getUsbBridgeEnvBlock()}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopyUsbBridgeCommand} disabled={!latestUsbBridgeToken}>
                  Copy Setup Block
                </Button>
              </div>
              {!latestUsbBridgeToken ? (
                <p className="text-xs text-amber-700">Generate or rotate the token to copy a fresh setup block. For safety, the full token is only shown once.</p>
              ) : null}
              {usbBridgeSetup?.tokenPreview ? (
                <p className="text-xs text-gray-500">Current token: {usbBridgeSetup.tokenPreview}</p>
              ) : null}
              {usbBridgeSetup?.lastHost ? (
                <p className="text-xs text-gray-500">Last bridge host: {usbBridgeSetup.lastHost}{usbBridgeSetup.lastVersion ? ` • version ${usbBridgeSetup.lastVersion}` : ''}</p>
              ) : null}
              {usbBridgeSetup?.lastSeenPrinters?.length ? (
                <p className="text-xs text-gray-500">Last printers seen: {usbBridgeSetup.lastSeenPrinters.join(', ')}</p>
              ) : null}
              {usbBridgeSetup?.lastError ? (
                <p className="text-xs text-red-600">Last bridge error: {usbBridgeSetup.lastError}</p>
              ) : null}
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-x-auto">
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
          {(detectionMeta.detectionHost || detectionMeta.platform) && (
            <div className="text-xs text-gray-500">
              Checked on: {detectionMeta.detectionHost || 'unknown host'}
              {detectionMeta.platform ? ` (${detectionMeta.platform})` : ''}
            </div>
          )}
          {systemPrinters.length === 0 ? (
            <div className="text-center py-8">
              <FiPrinterIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No printers detected on this system.</p>
              <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
                {detectionMeta.message || 'If this is a hosted live server, it can only detect printers installed on that server, not printers connected to your local cashier device.'}
              </p>
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
                    </p>
                    {printer.sources?.length ? (
                      <p className="text-xs text-gray-400 mt-1">Detected via: {printer.sources.join(', ')}</p>
                    ) : null}
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
