import express from 'express';
import { getSystemPrinters } from '../controllers/printerController.js';

const router = express.Router();

router.get('/system', getSystemPrinters);

export default router;
