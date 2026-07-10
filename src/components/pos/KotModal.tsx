
import React, { useEffect, useRef } from 'react';
import { KOT, SaleItem, Printer, PrinterType } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { FiPrinter, FiXCircle } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';

interface KotModalProps {
  isOpen: boolean;
  onClose: () => void;
  kotData: KOT | null;
}

const KotModal: React.FC<KotModalProps> = ({ isOpen, onClose, kotData }) => {
  const { printers } = useRestaurantData();
  const kotRef = useRef<HTMLDivElement>(null);
  
  // Auto-print KOT if configured
  useEffect(() => {
    if (isOpen && kotData && printers.some(p => p.type === PrinterType.KOT && p.autoPrintKOT && p.isActive)) {
      const timer = setTimeout(() => handlePrint(), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, kotData, printers]);

  if (!kotData) return null;

  const handlePrint = () => {
    if (!kotRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print KOTs');
      return;
    }
    
    const activeKotPrinter = printers.find(p => p.type === PrinterType.KOT && p.isActive);
    const paperWidth = activeKotPrinter?.paperSize === '58mm' ? '58mm' : '80mm';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT ${kotData.kotNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Courier New', Courier, monospace;
            }
            body { 
              width: ${paperWidth};
              padding: 5mm;
              font-size: 12px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #000; margin: 8px 0; padding-bottom: 8px; }
            .mt-2 { margin-top: 8px; }
            .font-bold { font-weight: bold; }
            .text-xl { font-size: 16px; }
            .item-notes { font-size: 10px; padding-left: 40px; font-style: italic; }
            @media print {
              body { margin: 0; padding: 5mm; }
              @page { margin: 0; size: auto; }
            }
          </style>
        </head>
        <body>
          ${kotRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KOT Preview">
      <div className="font-mono text-gray-800">
        <div ref={kotRef} id="kot-print-area" className="p-4 bg-gray-50 border border-dashed">
          <div className="kot-header text-center mb-4">
            <h3 className="text-xl font-bold">KITCHEN ORDER TICKET</h3>
            <p className="text-sm">{kotData.kotNumber}</p>
          </div>
          <div className="kot-details text-sm border-b border-dashed pb-2 mb-2">
            <div className="flex justify-between"><span>Table:</span> <span className="font-semibold">{kotData.table || 'N/A'}</span></div>
            <div className="flex justify-between"><span>Waiter:</span> <span className="font-semibold">{kotData.waiter || 'N/A'}</span></div>
            <div className="flex justify-between"><span>Time:</span> <span className="font-semibold">{kotData.timestamp}</span></div>
          </div>
          <div className="kot-items mt-2">
            {kotData.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="mb-2">
                <div className="kot-item flex items-start text-lg">
                  <div className="item-qty font-bold mr-3">{item.quantity} x</div>
                  <div className="item-name font-semibold">{item.name}</div>
                </div>
                {item.notes && (
                  <div className="item-notes text-sm text-gray-600 pl-10">
                    &raquo; {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
            <Button onClick={onClose} variant="secondary" leftIcon={<FiXCircle/>}>Close</Button>
            <Button onClick={handlePrint} variant="primary" leftIcon={<FiPrinter/>}>Print KOT</Button>
        </div>
      </div>
    </Modal>
  );
};

export default KotModal;
