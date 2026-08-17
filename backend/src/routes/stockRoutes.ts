import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import {
  getStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  bulkUpsertStockItems,
  getStockEntries,
  createStockEntry,
  deleteStockEntry,
  getStockAdjustments,
  createStockAdjustment,
  deleteStockAdjustment,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getRecipes,
  upsertRecipe,
  deleteRecipe,
} from '../controllers/stockController.js';

const router = Router();

router.use(authenticate);

// Stock Items
router.get('/items', requirePermission('inventory.view'), getStockItems);
router.post('/items', requirePermission('inventory.create'), createStockItem);
router.put('/items/bulk', requirePermission('inventory.edit'), bulkUpsertStockItems);
router.put('/items/:id', requirePermission('inventory.edit'), updateStockItem);
router.delete('/items/:id', requirePermission('inventory.delete'), deleteStockItem);

// Stock Entries
router.get('/entries', requirePermission('inventory.view'), getStockEntries);
router.post('/entries', requirePermission('inventory.create'), createStockEntry);
router.delete('/entries/:id', requirePermission('inventory.delete'), deleteStockEntry);

// Stock Adjustments
router.get('/adjustments', requirePermission('inventory.view'), getStockAdjustments);
router.post('/adjustments', requirePermission('inventory.edit'), createStockAdjustment);
router.delete('/adjustments/:id', requirePermission('inventory.delete'), deleteStockAdjustment);

// Suppliers
router.get('/suppliers', requirePermission('inventory.view'), getSuppliers);
router.post('/suppliers', requirePermission('inventory.create'), createSupplier);
router.put('/suppliers/:id', requirePermission('inventory.edit'), updateSupplier);
router.delete('/suppliers/:id', requirePermission('inventory.delete'), deleteSupplier);

// Recipes
router.get('/recipes', requirePermission('inventory.view'), getRecipes);
router.post('/recipes', requirePermission('inventory.create'), upsertRecipe);
router.delete('/recipes/:id', requirePermission('inventory.delete'), deleteRecipe);

export default router;
