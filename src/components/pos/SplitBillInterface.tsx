
import React, { useState, useMemo } from 'react';
import { SaleItem, SaleTaxDetail, Split, PartialPayment } from '../../types';
import Button from '../common/Button';
import { FiClipboard, FiPlusCircle, FiCheckCircle, FiDivideSquare } from 'react-icons/fi';
import ItemSplitView from './split-views/ItemSplitView';
import EqualSplitView from './split-views/EqualSplitView';
import CustomSplitView from './split-views/CustomSplitView';

interface SplitBillInterfaceProps {
    orderItems: SaleItem[];
    subTotal: number;
    taxes: SaleTaxDetail[];
    grandTotal: number;
    onFinalize: (splits: Split[]) => void;
    onClose: () => void;
}

interface SplitTypeCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}

const SplitTypeCard: React.FC<SplitTypeCardProps> = ({ icon, title, subtitle, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center p-6 space-y-2 bg-white rounded-lg border-2 border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={disabled}
  >
    <div className="text-sky-600">{icon}</div>
    <h4 className="font-semibold text-gray-800">{title}</h4>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </button>
);


const SplitBillInterface: React.FC<SplitBillInterfaceProps> = (props) => {
    const [splitMode, setSplitMode] = useState<'chooser' | 'items' | 'equal' | 'custom'>('chooser');
    
    const { grandTotal } = props;

    if (splitMode === 'chooser') {
      const totalBill = grandTotal;
      return (
        <div className="flex flex-col h-full" style={{minHeight: '50vh'}}>
          <h2 className="text-xl font-semibold text-center mb-6 text-gray-700">Split Bill</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SplitTypeCard
              icon={<FiPlusCircle size={28} />}
              title="Equal Split"
              subtitle="Split equally"
              onClick={() => setSplitMode('equal')}
            />
            <SplitTypeCard
              icon={<FiDivideSquare size={28} />}
              title="Custom Split"
              subtitle="Split by amount"
              onClick={() => setSplitMode('custom')}
            />
            <SplitTypeCard
              icon={<FiClipboard size={28} />}
              title="Split by Items"
              subtitle="Split by dishes"
              onClick={() => setSplitMode('items')}
            />
          </div>
          
          <div className="mt-auto pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-gray-600">Total Bill</span>
              <span className="text-gray-800">${totalBill.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
            <Button variant="primary" disabled>Complete Payment</Button>
          </div>
        </div>
      );
    }
    
    if (splitMode === 'equal') {
        return <EqualSplitView onBack={() => setSplitMode('chooser')} grandTotal={grandTotal} onFinalize={props.onFinalize} />;
    }
    
    if (splitMode === 'custom') {
        return <CustomSplitView onBack={() => setSplitMode('chooser')} grandTotal={grandTotal} onFinalize={props.onFinalize} />;
    }

    if (splitMode === 'items') {
        return <ItemSplitView {...props} onBack={() => setSplitMode('chooser')} />;
    }
    
    return null; // Should not be reached
};

export default SplitBillInterface;
