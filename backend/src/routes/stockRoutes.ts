import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
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
router.get('/items', getStockItems);
router.post('/items', createStockItem);
router.put('/items/bulk', bulkUpsertStockItems);
router.put('/items/:id', updateStockItem);
router.delete('/items/:id', deleteStockItem);

// Stock Entries
router.get('/entries', getStockEntries);
router.post('/entries', createStockEntry);
router.delete('/entries/:id', deleteStockEntry);

// Stock Adjustments
router.get('/adjustments', getStockAdjustments);
router.post('/adjustments', createStockAdjustment);

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Recipes
router.get('/recipes', getRecipes);
router.post('/recipes', upsertRecipe);
router.delete('/recipes/:id', deleteRecipe);

export default router;
