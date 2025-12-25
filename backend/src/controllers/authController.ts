import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password, roleId, outletId, isSuperAdmin, name, mobile, address } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId,
        outletId,
        isSuperAdmin: isSuperAdmin || false,
      },
    });

    // In a real app, you might create a Customer or Employee record linked to this user here
    // based on the 'name', 'mobile', 'address' fields provided.
    // For now, we just create the User login credential.

    const token = jwt.sign({ userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, user: { id: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
