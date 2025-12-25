
import React, { useState, useMemo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { Table, TableStatus, AreaFloor } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import TableSettingsForm from '@/components/settings/TableSettingsForm';
import { FiPlusCircle, FiEdit, FiTrash2, FiGrid, FiMapPin, FiPackage } from 'react-icons/fi';

const ManageTablesSettingsPage: React.FC = () => {
  const { tables, areasFloors, addTable, updateTableSettings, deleteTable } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const handleOpenModalForAdd = () => {
    setEditingTable(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (table: Table) => {
    setEditingTable(table);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const handleDelete = (tableId: string) => {
    if (window.confirm('Are you sure you want to delete this table? This could affect existing reservations or POS operations if the table is currently in use.')) {
      deleteTable(tableId);
    }
  };
  
  const handleAddSubmit = (name: string, capacity: number, areaFloorId?: string) => {
    addTable(name, capacity, areaFloorId);
    handleCloseModal();
  };

  const handleUpdateSubmit = (tableId: string, name: string, capacity: number, areaFloorId?: string) => {
    if (editingTable) {
        updateTableSettings(tableId, name, capacity, areaFloorId);
    }
    handleCloseModal();
  };

  const tablesByArea = useMemo(() => {
    const grouped: { [areaId: string]: Table[] } = {};
    const unassigned: Table[] = [];

    tables.forEach(table => {
      if (table.areaFloorId && areasFloors.find(af => af.id === table.areaFloorId)) {
        if (!grouped[table.areaFloorId]) {
          grouped[table.areaFloorId] = [];
        }
        grouped[table.areaFloorId].push(table);
      } else {
        unassigned.push(table);
      }
    });
    return { grouped, unassigned };
  }, [tables, areasFloors]);

  const renderTableRows = (tablesToRender: Table[]) => (
    <tbody className="bg-white divide-y divide-gray-200">
      {tablesToRender.map(t => (
        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
          <td className="py-3 px-4 text-sm font-medium text-gray-800">{t.name}</td>
          <td className="py-3 px-4 text-sm text-gray-600 text-center">{t.capacity}</td>
          <td className="py-3 px-4 text-sm text-gray-600">
             <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                t.status === TableStatus.Free ? 'bg-green-100 text-green-700' :
                t.status === TableStatus.Occupied ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
             }`}>
                {t.status}
             </span>
          </td>
          <td className="py-3 px-4 text-sm">
            <div className="flex space-x-2">
              <Button onClick={() => handleOpenModalForEdit(t)} variant="secondary" size="sm" aria-label="Edit Table Settings">
                <FiEdit />
              </Button>
              <Button onClick={() => handleDelete(t.id)} variant="danger" size="sm" aria-label="Delete Table">
                <FiTrash2 />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center">
            <FiGrid className="mr-3 text-sky-600"/> Manage Tables
        </h1>
        <Button onClick={handleOpenModalForAdd} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Table
        </Button>
      </div>

      <Card>
        {tables.length === 0 ? (
          <div className="text-center py-10">
            <FiGrid size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No tables configured.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Table" to set up your restaurant's tables.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {areasFloors.map(areaFloor => {
              const tablesInArea = tablesByArea.grouped[areaFloor.id] || [];
              if (tablesInArea.length === 0 && !tablesByArea.unassigned.find(t=>!t.areaFloorId)) { // Only show area if it has tables or if there are no unassigned tables to show first
                 // To avoid showing empty area headers if all tables are unassigned.
                 // This logic might need refinement based on exact desired display order when some areas are empty
              }
              return (
                <div key={areaFloor.id}>
                  <h2 className="text-xl font-semibold text-gray-700 mb-3 py-2 border-b-2 border-sky-100 flex items-center">
                    <FiMapPin className="mr-2 text-sky-500" /> Area: {areaFloor.name}
                  </h2>
                  {tablesInArea.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                        <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Table Name</th>
                            <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Capacity</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status (Operational)</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        {renderTableRows(tablesInArea)}
                        </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 px-4 py-2">No tables assigned to {areaFloor.name}.</p>
                  )}
                </div>
              );
            })}

            {tablesByArea.unassigned.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-3 py-2 border-b-2 border-gray-100 flex items-center">
                  <FiPackage className="mr-2 text-gray-500" /> Unassigned Tables
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Table Name</th>
                        <th className="py-3 px-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Capacity</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status (Operational)</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    {renderTableRows(tablesByArea.unassigned)}
                    </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingTable ? "Edit Table Settings" : "Add New Table"}
        size="md"
      >
        <TableSettingsForm
          initialData={editingTable}
          onSubmit={handleAddSubmit}
          onUpdate={handleUpdateSubmit}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default ManageTablesSettingsPage;