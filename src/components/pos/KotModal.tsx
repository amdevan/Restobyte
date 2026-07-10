
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
  const { printers, printKot } = useRestaurantData();
  const kotRef = useRef<HTMLDivElement>(null);

  const generatePlainTextKot = (): string => {
    let kotText = `
----------------------------------------
KITCHEN ORDER TICKET
----------------------------------------

KOT No: ${kotData.kotNumber}
Table: ${kotData.table || 'N/A'}
Waiter: ${kotData.waiter || 'N/A'}
Time: ${kotData.timestamp}

----------------------------------------
Items:
----------------------------------------
`;
    kotData.items.forEach(item => {
      kotText += `${item.quantity}x ${item.name}\n`;
      if (item.notes) {
        kotText += `  Notes: ${item.notes}\n`;
      }
      kotText += `\n`;
    });
    kotText += `----------------------------------------
Powered by RestoByte
----------------------------------------
`;
    return kotText;
  };

  // Auto-print KOT if configured
  useEffect(() => {
    if (isOpen && kotData) {
      const autoPrintPrinters = printers.filter(p => 
        p.type === PrinterType.KOT && p.autoPrintKot && p.isActive
      );
      if (autoPrintPrinters.length > 0) {
        const timer = setTimeout(() => {
          const content = generatePlainTextKot();
          autoPrintPrinters.forEach(printer => printKot(printer.id, content));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, kotData, printers, printKot]);

  if (!kotData) return null;

  const handlePrint = () => {
    // Find active KOT printers
    const activeKotPrinters = printers.filter(p => 
      p.type === PrinterType.KOT && p.isActive
    );
    
    if (activeKotPrinters.length === 0) {
      // Fallback to browser print if no printers configured
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
    } else {
      // Use our backend print function
      const content = generatePlainTextKot();
      activeKotPrinters.forEach(printer => printKot(printer.id, content));
    }
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
                  <div className="item-qty font-bold mr-3">{item.quantity}x</div>
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
