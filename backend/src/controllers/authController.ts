
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

    const token = jwt.sign({ userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, user: { id: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  const fs = await import('fs');
  fs.appendFileSync('debug_activity.log', `[${new Date().toISOString()}] Login attempt for ${username}\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.log(`Login failed: User ${username} not found`);
      res.status(400).json({ message: 'Invalid credentials (User not found)' });
      return;
    }

    console.log(`Debug Login: Username=${username}`);
    console.log(`Debug Login: Input Password="${password}" (Length: ${password?.length})`);
    console.log(`Debug Login: DB Password Hash="${user.password}"`);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Debug Login: isMatch=${isMatch}`);

    if (!isMatch) {
      // Return debug info in response for browser agent to see
      res.status(400).json({
        message: 'Invalid credentials (Password mismatch)',
        debug: {
          inputPasswordLength: password?.length,
          inputPasswordPreview: password?.substring(0, 3) + '...',
          dbHashPreview: user.password.substring(0, 10) + '...'
        }
      });
      return;
    }

    const token = jwt.sign({ userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: { id: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin }, message: 'Login successful' });

  } catch (error) {
    console.error("Login Controller Error:", error);
    const fs = await import('fs');
    try {
      fs.appendFileSync('error.log', `[${new Date().toISOString()}] Login Error: ${error instanceof Error ? error.stack : String(error)}\n`);
    } catch (e) {
      console.error("Logging failed", e);
    }

    // Provide detailed error in response for debugging during deployment
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    res.status(500).json({
      message: 'Server error during login',
      error: errorMessage,
      stack: process.env.NODE_ENV !== 'production' ? errorStack : undefined,
      hint: 'Check DATABASE_URL and database connectivity in Coolify logs.'
    });
  }
};
