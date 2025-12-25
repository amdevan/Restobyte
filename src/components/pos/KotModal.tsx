
import React from 'react';
import { KOT, SaleItem } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { FiPrinter, FiXCircle } from 'react-icons/fi';

interface KotModalProps {
  isOpen: boolean;
  onClose: () => void;
  kotData: KOT | null;
}

const KotModal: React.FC<KotModalProps> = ({ isOpen, onClose, kotData }) => {
  if (!kotData) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('kot-print-area')?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>KOT Print</title>
              <style>
                body { 
                  font-family: 'Courier New', Courier, monospace; 
                  font-size: 14px; 
                  width: 280px; /* Typical thermal printer width */
                  margin: 0;
                  padding: 5px;
                }
                .kot-header, .kot-footer { text-align: center; }
                .kot-header h3 { margin: 0; font-size: 18px; }
                .kot-details { font-size: 12px; margin-bottom: 10px; border-bottom: 1px dashed black; padding-bottom: 5px; }
                .kot-details div { display: flex; justify-content: space-between; }
                .kot-items { margin-top: 10px; }
                .kot-item { display: flex; margin-bottom: 5px; }
                .item-qty { font-weight: bold; margin-right: 10px; min-width: 30px; text-align: right; }
                .item-name { flex-grow: 1; }
                .item-notes { font-size: 11px; padding-left: 40px; font-style: italic; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KOT Preview">
      <div className="font-mono text-gray-800">
        <div id="kot-print-area" className="p-4 bg-gray-50 border border-dashed">
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
