
import React, { useState } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import { AddonGroup, Addon } from '@/types';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { FiPlusCircle, FiEdit, FiTrash2, FiTag, FiPlus } from 'react-icons/fi';

const AddonGroupForm: React.FC<{
  initialData: Omit<AddonGroup, 'id'> | AddonGroup | null;
  onSave: (group: Omit<AddonGroup, 'id'> | AddonGroup) => void;
  onClose: () => void;
}> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [addons, setAddons] = useState<Array<Partial<Addon> & { localId: string }>>(
    initialData?.addons.map(a => ({ ...a, localId: a.id })) || [{ localId: `new-${Date.now()}`, name: '', price: 0 }]
  );

  const handleAddonFieldChange = (localId: string, field: 'name' | 'price', value: string) => {
    setAddons(prev => prev.map(a => a.localId === localId ? { ...a, [field]: field === 'price' ? parseFloat(value) || 0 : value } : a));
  };
  
  const handleAddAddon = () => setAddons(prev => [...prev, { localId: `new-${Date.now()}`, name: '', price: 0 }]);
  const handleRemoveAddon = (localId: string) => { if (addons.length > 1) setAddons(prev => prev.filter(a => a.localId !== localId)) };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Group name is required.');
      return;
    }
    const finalAddons = addons
      .filter(a => a.name && a.name.trim() !== '' && a.price !== undefined && a.price >= 0)
      .map(a => ({
          id: a.id && !a.id.startsWith('new-') ? a.id : `addon-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: a.name!,
          price: a.price!
      }));
      
    onSave({ ...(initialData || {}), name, addons: finalAddons });
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Group Name" value={name} onChange={e => setName(e.target.value)} required autoFocus placeholder="e.g., Toppings, Sauces"/>
        <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Add-ons in this group</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {addons.map(addon => (
                    <div key={addon.localId} className="flex items-end space-x-2">
                        <Input label="Addon Name" value={addon.name || ''} onChange={e => handleAddonFieldChange(addon.localId, 'name', e.target.value)} containerClassName="mb-0 flex-grow"/>
                        <Input label="Price" type="number" value={addon.price || ''} onChange={e => handleAddonFieldChange(addon.localId, 'price', e.target.value)} containerClassName="mb-0" step="0.01"/>
                        {addons.length > 1 && <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveAddon(addon.localId)} className="!p-2.5"><FiTrash2 size={16}/></Button>}
                    </div>
                ))}
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddAddon} leftIcon={<FiPlus/>} className="mt-2">Add Another Addon</Button>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? 'Update Group' : 'Save Group'}</Button>
        </div>
    </form>
  )
};

const ManageAddonsPage: React.FC = () => {
  const { addonGroups, addAddonGroup, updateAddonGroup, deleteAddonGroup } = useRestaurantData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);

  const handleOpenModal = (group: AddonGroup | null) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingGroup(null);
    setIsModalOpen(false);
  };

  const handleSave = (groupData: Omit<AddonGroup, 'id'> | AddonGroup) => {
    if ('id' in groupData) {
        updateAddonGroup(groupData);
    } else {
        addAddonGroup(groupData);
    }
  };

  const handleDelete = (groupId: string) => {
    if(window.confirm("Are you sure you want to delete this addon group? It will be removed from all menu items it's linked to.")) {
        deleteAddonGroup(groupId);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Manage Add-ons</h1>
        <Button onClick={() => handleOpenModal(null)} leftIcon={<FiPlusCircle size={20}/>} variant="primary">
          Add New Group
        </Button>
      </div>

      <div className="space-y-4">
        {addonGroups.length === 0 && (
            <Card>
                <div className="text-center py-10">
                    <FiTag size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No add-on groups created yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add New Group" to create groups like "Toppings" or "Extra Cheese".</p>
                </div>
            </Card>
        )}
        {addonGroups.map(group => (
          <Card key={group.id}>
            <div className="p-4">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <div className="flex space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(group)}><FiEdit/></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(group.id)}><FiTrash2/></Button>
                    </div>
                </div>
                <ul className="space-y-1">
                    {group.addons.map(addon => (
                        <li key={addon.id} className="flex justify-between text-sm p-1">
                            <span className="text-gray-600">{addon.name}</span>
                            <span className="font-medium text-gray-700">+${addon.price.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingGroup ? "Edit Addon Group" : "Create Addon Group"} size="lg">
        <AddonGroupForm initialData={editingGroup} onSave={handleSave} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default ManageAddonsPage;
