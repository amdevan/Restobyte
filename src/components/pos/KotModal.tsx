
import React, { useEffect, useRef } from 'react';
import { KOT, PrinterType } from '../../types';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { FiPrinter, FiXCircle } from 'react-icons/fi';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { clampCharsPerLine, getEscPosBottomFeed, getEscPosEmphasizedTitle } from '../../utils/printSettings';

interface KotModalProps {
  isOpen: boolean;
  onClose: () => void;
  kotData: KOT | null;
}

const KotModal: React.FC<KotModalProps> = ({ isOpen, onClose, kotData }) => {
  const { printers, printKot, applicationSettings } = useRestaurantData();
  const kotRef = useRef<HTMLDivElement>(null);

  if (!kotData) return null;

  const generatePlainTextKot = (): string => {
    const lineWidth = clampCharsPerLine(applicationSettings?.kotCharactersPerLine, applicationSettings?.kotPaperSize);
    const serialWidth = 4;
    const columnGap = 1;
    const qtyWidth = 4;
    const nameWidth = lineWidth - serialWidth - columnGap - qtyWidth;
    const divider = '-'.repeat(lineWidth);
    const centerText = (value: string) => {
      const text = value.trim();
      if (!text) return '';
      if (text.length >= lineWidth) return text;
      const leftPad = Math.floor((lineWidth - text.length) / 2);
      return `${' '.repeat(leftPad)}${text}`;
    };
    const formatTwoCol = (left: string, right: string) => {
      const spaces = Math.max(1, lineWidth - left.length - right.length);
      return `${left}${' '.repeat(spaces)}${right}`;
    };
    const wrapText = (value: string, width: number) => {
      const words = value.trim().split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = '';

      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= width) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });

      if (current) lines.push(current);
      return lines.length > 0 ? lines : [''];
    };
    const lines: string[] = [];
    const formatLabelLine = (label: string, value: string) => {
      const prefix = `${label} : `;
      const wrapped = wrapText(value, Math.max(8, lineWidth - prefix.length));
      lines.push(`${prefix}${wrapped[0]}`);
      wrapped.slice(1).forEach((line) => {
        lines.push(`${' '.repeat(prefix.length)}${line}`);
      });
    };

    lines.push(getEscPosEmphasizedTitle('KOT', lineWidth) || centerText('KOT'));
    lines.push(formatTwoCol(kotData.kotNumber, kotData.timestamp));
    lines.push(divider);
    formatLabelLine('Customer', kotData.customer || 'Walk-in Customer');
    formatLabelLine('Table No.', kotData.table || 'N/A');
    if (kotData.waiter) {
      formatLabelLine('Waiter', kotData.waiter);
    }
    lines.push(divider);
    lines.push(`${'Sl'.padEnd(serialWidth)}${' '.repeat(columnGap)}${'Item Name'.padEnd(nameWidth)}${'Qty.'.padStart(qtyWidth)}`);
    lines.push(divider);

    kotData.items.forEach((item, index) => {
      const serial = String(index + 1).padEnd(serialWidth);
      const nameLines = wrapText(item.name, nameWidth);
      const qty = String(item.quantity).padStart(qtyWidth);
      lines.push(`${serial}${' '.repeat(columnGap)}${nameLines[0].padEnd(nameWidth)}${qty}`);
      nameLines.slice(1).forEach((line) => {
        lines.push(`${' '.repeat(serialWidth + columnGap)}${line}`);
      });
      if (item.notes) {
        wrapText(`Note: ${item.notes}`, nameWidth).forEach((line) => {
          lines.push(`${' '.repeat(serialWidth + columnGap)}${line}`);
        });
      }
    });

    lines.push(divider);
    lines.push(centerText(`Total Items : ${kotData.items.length}`));
    lines.push(divider);

    return `${lines.join('\r\n')}\r\n${getEscPosBottomFeed(12)}`;
  };

  const kotPrinters = printers.filter(
    (printer) => printer.type === PrinterType.KOT || printer.autoPrintKOT
  );
  const directKotPrinters = kotPrinters.filter((printer) => printer.isActive);
  const kotPrintersToUse = directKotPrinters.length > 0 ? directKotPrinters : kotPrinters;

  // Auto-print KOT if configured
  useEffect(() => {
    if (isOpen && kotData) {
      const autoPrintPrinters = kotPrintersToUse.filter((printer) => printer.autoPrintKOT);
      if (autoPrintPrinters.length > 0) {
        const timer = setTimeout(() => {
          const content = generatePlainTextKot();
          autoPrintPrinters.forEach((printer) => printKot(printer.id, content));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, kotData, kotPrintersToUse, printKot]);

  const handlePrint = () => {
    if (kotPrintersToUse.length === 0) {
      // Fallback to browser print if no printers configured
      if (!kotRef.current) return;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups to print KOTs');
        return;
      }
      
      const paperWidth = '80mm';
      
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
              .border-b { border-bottom: 1px solid #000; margin: 8px 0; padding-bottom: 8px; }
              .mt-2 { margin-top: 8px; }
              .font-bold { font-weight: bold; }
              .text-xl { font-size: 18px; }
              .item-notes { font-size: 10px; padding-left: 28px; font-style: italic; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 2px 0; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              @media print {
                body { margin: 0; padding: 5mm; }
                @page { margin: 0; size: 80mm auto; }
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
      kotPrintersToUse.forEach((printer) => printKot(printer.id, content));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KOT Preview">
      <div className="font-mono text-gray-800">
        <div ref={kotRef} id="kot-print-area" className="mx-auto w-full max-w-[300px] bg-white p-4 border border-gray-300">
          <div className="kot-header text-center mb-3">
            <h3 className="text-5xl font-black tracking-[0.2em]">KOT</h3>
          </div>
          <div className="mb-3 flex justify-between text-sm">
            <span>{kotData.kotNumber}</span>
            <span>{kotData.timestamp}</span>
          </div>
          <div className="border-t border-b border-black py-3 text-sm space-y-2">
            <div className="break-words"><span className="font-medium">Customer :</span> <span>{kotData.customer || 'Walk-in Customer'}</span></div>
            <div className="break-words"><span className="font-medium">Table No. :</span> <span>{kotData.table || 'N/A'}</span></div>
            {kotData.waiter && <div className="break-words"><span className="font-medium">Waiter :</span> <span>{kotData.waiter}</span></div>}
          </div>
          <div className="mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black">
                  <th className="py-2 text-left font-medium">Sl.No</th>
                  <th className="py-2 text-left font-medium">Item Name</th>
                  <th className="py-2 text-right font-medium">Qty.</th>
                </tr>
              </thead>
              <tbody>
                {kotData.items.map((item, index) => (
                  <React.Fragment key={`${item.id}-${index}`}>
                    <tr>
                      <td className="py-1 align-top">{index + 1}</td>
                      <td className="py-1 align-top break-words">{item.name}</td>
                      <td className="py-1 text-right align-top">{item.quantity}</td>
                    </tr>
                    {item.notes && (
                      <tr>
                        <td />
                        <td className="pb-1 text-sm italic text-gray-600">Note: {item.notes}</td>
                        <td />
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 border-t border-b border-black py-2 text-right text-lg font-bold">
            Total Items : {kotData.items.length}
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
