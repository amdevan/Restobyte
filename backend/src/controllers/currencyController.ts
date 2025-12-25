import type { Request, Response } from 'express';
import type { Currency } from '@prisma/client/index.js';
import prisma from '../db/prisma.js';


export const getCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const currencies = await prisma.currency.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(currencies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCurrency = async (req: Request, res: Response): Promise<void> => {
  const { name, code, symbol, exchangeRate, isDefault } = req.body;

  try {
    // If setting as default, unset others
    if (isDefault) {
      await prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const currency = await prisma.currency.create({
      data: {
        name,
        code,
        symbol,
        exchangeRate: isDefault ? 1.0 : exchangeRate,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(currency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCurrency = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id?: string };
  if (!id) {
    res.status(400).json({ message: 'Missing currency id' });
    return;
  }
  const { name, code, symbol, exchangeRate, isDefault } = req.body;

  try {
    if (isDefault) {
      await prisma.currency.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const currency = await prisma.currency.update({
      where: { id },
      data: {
        name,
        code,
        symbol,
        exchangeRate: isDefault ? 1.0 : exchangeRate,
        isDefault,
      },
    });

    res.json(currency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCurrency = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id?: string };
  if (!id) {
    res.status(400).json({ message: 'Missing currency id' });
    return;
  }

  try {
    const currency = await prisma.currency.findUnique({ where: { id } });
    if (currency?.isDefault) {
       res.status(400).json({ message: 'Cannot delete default currency' });
       return;
    }

    await prisma.currency.delete({ where: { id } });
    res.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const setDefaultCurrency = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id?: string };
  if (!id) {
    res.status(400).json({ message: 'Missing currency id' });
    return;
  }

  try {
    const newDefault = await prisma.currency.findUnique({ where: { id } });
    if (!newDefault) {
      res.status(404).json({ message: 'Currency not found' });
      return;
    }

    const baseRate = newDefault.exchangeRate;
    if (baseRate === 0) {
        res.status(400).json({ message: 'Cannot set currency with 0 exchange rate as default' });
        return;
    }

    const allCurrencies = await prisma.currency.findMany();

    // Prepare updates to recalculate all exchange rates relative to the new default
    const updates = allCurrencies.map((currency: Currency) => {
      return prisma.currency.update({
        where: { id: currency.id },
        data: {
          exchangeRate: currency.exchangeRate / baseRate,
          isDefault: currency.id === id,
        },
      });
    });

    await prisma.$transaction(updates);

    const updatedCurrency = await prisma.currency.findUnique({ where: { id } });
    res.json(updatedCurrency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
