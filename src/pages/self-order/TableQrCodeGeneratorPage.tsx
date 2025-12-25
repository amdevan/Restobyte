
import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Table } from '@/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import Modal from '@/components/common/Modal';
import { FiPrinter, FiDownload, FiGrid, FiMapPin, FiPackage, FiCopy, FiSettings } from 'react-icons/fi';

// Component for the print preview modal
const PrintPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  qrCodes: Record<string, string>;
}> = ({ isOpen, onClose, tables, qrCodes }) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const contentNode = printContentRef.current;
    if (contentNode) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print All QR Codes</title>');
        // Inject styles
        const style = printWindow.document.createElement('style');
        style.innerHTML = `
          @media print {
            @page { size: A4; margin: 1cm; }
            body { margin: 0; font-family: sans-serif; }
            .page-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(4, 1fr);
              gap: 20px;
              height: calc(100vh - 2cm); /* Adjust for margin */
              page-break-after: always;
            }
            .page-container:last-of-type {
                page-break-after: auto;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              border: 1px solid #eee;
              padding: 10px;
              border-radius: 8px;
              height: 100%;
              box-sizing: border-box;
            }
            img { max-width: 100%; height: auto; max-height: 120px; }
            h2 { font-size: 16px; margin: 8px 0 0 0; color: #333 }
          }
        `;
        printWindow.document.head.appendChild(style);
        printWindow.document.write('</head><body>');
        printWindow.document.write(contentNode.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { // Timeout to ensure content is loaded
            printWindow.print();
            printWindow.close();
        }, 500);
      }
    }
  };
  
  const allTables = tables.sort((a,b) => a.name.localeCompare(b.name));
  const itemsPerPage = 8;
  const pages = [];
  for (let i = 0; i < allTables.length; i += itemsPerPage) {
      pages.push(allTables.slice(i, i + itemsPerPage));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Preview" size="2xl">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          This is a preview of how your QR codes will be laid out for printing on A4 paper.
          Each page contains up to 8 tables.
        </p>
        <div className="max-h-[60vh] overflow-y-auto bg-gray-200 p-4 space-y-8 rounded">
          {pages.map((pageTables, pageIndex) => (
             // Render a scaled-down version for preview
            <div key={pageIndex} className="bg-white shadow-lg mx-auto p-4" style={{ width: '210mm', height: '297mm', transform: 'scale(0.3)', transformOrigin: 'top left', marginBottom: '-205mm' }}>
               <div className="grid grid-cols-2 grid-rows-4 gap-5 h-full">
                {pageTables.map(table => {
                    const qrCodeUrl = qrCodes[table.id];
                    return qrCodeUrl ? (
                        <div key={table.id} className="flex flex-col items-center justify-center text-center border border-gray-200 rounded p-2">
                        <img src={qrCodeUrl} alt={`QR Code for ${table.name}`} className="max-w-full h-auto max-h-[120px]" />
                        <h2 className="text-base font-semibold mt-2">{table.name}</h2>
                        </div>
                    ) : null;
                })}
               </div>
            </div>
          ))}
        </div>
        {/* Hidden div with actual print content and structure */}
        <div ref={printContentRef} style={{ display: 'none' }}>
            {pages.map((pageTables, pageIndex) => (
            <div key={`print-page-${pageIndex}`} className="page-container">
                {pageTables.map(table => {
                const qrCodeUrl = qrCodes[table.id];
                return qrCodeUrl ? (
                    <div key={`print-qr-${table.id}`} className="qr-container">
                    <img src={qrCodeUrl} alt={`QR Code for ${table.name}`} />
                    <h2>{table.name}</h2>
                    </div>
                ) : null;
                })}
            </div>
            ))}
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handlePrint} variant="primary" leftIcon={<FiPrinter />}>
            Print Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};


const TableQrCodeGeneratorPage: React.FC = () => {
    const { tables, areasFloors } = useRestaurantData();
    const [qrCodes, setQrCodes] = useState<Record<string, Record<string, string>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [qrColor, setQrColor] = useState('#0284c7'); // Default: sky-600
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Group and sort tables for display
    const tablesByArea = useMemo(() => {
        const grouped: { [areaId: string]: { name: string, tables: Table[] } } = {};
        const unassigned: Table[] = [];
        const sortedTables = [...tables].sort((a,b) => a.name.localeCompare(b.name));

        sortedTables.forEach(table => {
            if (table.areaFloorId && areasFloors.find(af => af.id === table.areaFloorId)) {
                const area = areasFloors.find(af => af.id === table.areaFloorId)!;
                if (!grouped[area.id]) {
                    grouped[area.id] = { name: area.name, tables: [] };
                }
                grouped[area.id].tables.push(table);
            } else {
                unassigned.push(table);
            }
        });
        return { grouped: Object.values(grouped).sort((a,b) => a.name.localeCompare(b.name)), unassigned };
    }, [tables, areasFloors]);

    // Set initial selected table
    useEffect(() => {
        if (!selectedTableId && tables.length > 0) {
            const firstTableId = tablesByArea.grouped[0]?.tables[0]?.id || tablesByArea.unassigned[0]?.id;
            setSelectedTableId(firstTableId);
        }
    }, [tables.length, tablesByArea, selectedTableId]);
    
    // Generate all QR codes on mount and color change
    useEffect(() => {
        const generateAllQrCodes = async () => {
            if (tables.length === 0) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const promises = tables.map(async (table) => {
                const url = `${window.location.origin}${window.location.pathname}#/self-order/place-order/${table.id}`;
                try {
                    const dataUrl = await QRCode.toDataURL(url, {
                        errorCorrectionLevel: 'H',
                        width: 300,
                        color: { dark: qrColor, light: '#FFFFFF' }
                    });
                    return { id: table.id, url: dataUrl };
                } catch (err) {
                    console.error(`Failed to generate QR code for table ${table.id}`, err);
                    return { id: table.id, url: null };
                }
            });

            const results = await Promise.all(promises);
            const newQrCodes: Record<string, string> = {};
            results.forEach(result => {
                if (result.url) newQrCodes[result.id] = result.url;
            });

            setQrCodes(prev => ({ ...prev, [qrColor]: newQrCodes }));
            setIsLoading(false);
        };
        
        // Only generate if we don't have this color cached
        if (!qrCodes[qrColor]) {
             generateAllQrCodes();
        }
    }, [tables, qrColor, qrCodes]);

    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [selectedTableId, tables]);

    const handleCopyUrl = () => {
        if (!selectedTable) return;
        const url = `${window.location.origin}${window.location.pathname}#/self-order/place-order/${selectedTable.id}`;
        navigator.clipboard.writeText(url)
            .then(() => alert(`URL for ${selectedTable.name} copied to clipboard!`))
            .catch(err => console.error('Failed to copy URL: ', err));
    };
    
    const handleDownload = () => {
        if (!selectedTable || !qrCodes[qrColor]?.[selectedTable.id]) return;
        const link = document.createElement('a');
        link.href = qrCodes[qrColor][selectedTable.id];
        link.download = `table-${selectedTable.name.replace(/\s+/g, '-')}-qrcode.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintSelected = () => {
        if (!selectedTable || !qrCodes[qrColor]?.[selectedTable.id]) return;
        const qrCodeUrl = qrCodes[qrColor][selectedTable.id];
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html><head><title>Print QR Code - ${selectedTable.name}</title>
                <style>
                    body { font-family: sans-serif; text-align: center; padding-top: 50px; }
                    .qr-container { display: inline-block; page-break-inside: avoid; }
                    img { width: 300px; height: 300px; } h2 { font-size: 32px; margin-top: 15px; }
                </style></head>
                <body>
                    <div class="qr-container">
                        <img src="${qrCodeUrl}" alt="QR Code for ${selectedTable.name}" />
                        <h2>${selectedTable.name}</h2>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                    </script>
                </body></html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {isPrintModalOpen && (
                <PrintPreviewModal
                    isOpen={isPrintModalOpen}
                    onClose={() => setIsPrintModalOpen(false)}
                    tables={tables}
                    qrCodes={qrCodes[qrColor] || {}}
                />
            )}
            <header className="p-4 sm:p-6 border-b bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
                        <FiGrid className="mr-3 text-sky-600" /> Table QR Code Generator
                    </h1>
                    <Button onClick={() => setIsPrintModalOpen(true)} variant="primary" leftIcon={<FiPrinter />} disabled={isLoading || tables.length === 0}>
                        Print All
                    </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Select a table from the list to view, customize, and print its unique QR code.
                </p>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Table List */}
                <aside className="w-1/3 lg:w-1/4 bg-white border-r overflow-y-auto custom-scrollbar p-3">
                    {isLoading ? <div className="flex justify-center items-center h-full"><Spinner /></div> : (
                        <nav className="space-y-4">
                            {tablesByArea.grouped.map(areaData => (
                                <div key={areaData.name}>
                                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1 flex items-center">
                                        <FiMapPin size={12} className="mr-1.5" /> {areaData.name}
                                    </h2>
                                    <ul className="space-y-1">
                                        {areaData.tables.map(table => (
                                            <li key={table.id}>
                                                <button onClick={() => setSelectedTableId(table.id)} className={`w-full text-left text-sm p-2.5 rounded-lg transition-colors flex items-center ${selectedTableId === table.id ? 'bg-sky-100 text-sky-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                                    <FiGrid size={15} className="mr-2.5 flex-shrink-0" />
                                                    {table.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                             {tablesByArea.unassigned.length > 0 && (
                                 <div>
                                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1 flex items-center">
                                        <FiPackage size={12} className="mr-1.5" /> Unassigned
                                    </h2>
                                    <ul className="space-y-1">
                                        {tablesByArea.unassigned.map(table => (
                                            <li key={table.id}>
                                                <button onClick={() => setSelectedTableId(table.id)} className={`w-full text-left text-sm p-2.5 rounded-lg transition-colors flex items-center ${selectedTableId === table.id ? 'bg-sky-100 text-sky-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                                    <FiGrid size={15} className="mr-2.5 flex-shrink-0" />
                                                    {table.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {tables.length === 0 && <p className="p-4 text-center text-sm text-gray-500">No tables configured.</p>}
                        </nav>
                    )}
                </aside>

                {/* Right Panel - QR Code Display */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {!selectedTable ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                             <p>Select a table from the list to view its QR code.</p>
                        </div>
                    ) : (
                        <div className="max-w-lg mx-auto">
                             <Card>
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedTable.name}</h2>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-500">Color</span>
                                            <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer"/>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-6">Capacity: {selectedTable.capacity}</p>

                                    <div className="flex justify-center items-center my-6 p-4 bg-gray-100 rounded-lg">
                                        {(!qrCodes[qrColor] || !qrCodes[qrColor][selectedTableId]) ? <Spinner/> :
                                            <img src={qrCodes[qrColor][selectedTableId]} alt={`QR Code for ${selectedTable.name}`} className="w-64 h-64 border-4 border-white shadow-md rounded-lg"/>
                                        }
                                    </div>
                                    
                                    <div className="mb-6">
                                        <label className="text-xs font-semibold text-gray-500">QR Code URL</label>
                                        <div className="flex items-center mt-1">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${window.location.origin}${window.location.pathname}#/self-order/place-order/${selectedTable.id}`}
                                                className="w-full text-xs p-2 border border-gray-300 rounded-l-md bg-gray-50 font-mono"
                                            />
                                            <Button onClick={handleCopyUrl} variant="secondary" className="rounded-l-none px-3" aria-label="Copy URL"><FiCopy/></Button>
                                        </div>
                                    </div>

                                    <div className="flex justify-center space-x-3">
                                        <Button onClick={handlePrintSelected} variant="secondary" leftIcon={<FiPrinter />}>Print this Code</Button>
                                        <Button onClick={handleDownload} variant="outline" leftIcon={<FiDownload />}>Download PNG</Button>
                                    </div>
                                </div>
                             </Card>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TableQrCodeGeneratorPage;
