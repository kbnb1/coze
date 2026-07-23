import type { Request, Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const client = getSupabaseClient();

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, phone } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    // Check if username exists
    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: '用户名已存在' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await client
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        phone: phone || null,
        role: 'user',
        status: 'active',
        balance: 0,
      })
      .select('id,username,phone,role,status,balance,created_at')
      .single();

    if (error) throw new Error(`注册失败: ${error.message}`);

    const token = generateToken(data.id, data.role);

    res.status(201).json({
      message: '注册成功',
      token,
      user: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '注册失败';
    res.status(500).json({ error: message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const { data: user, error } = await client
      .from('users')
      .select('id,username,password_hash,phone,role,status,balance,created_at')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new Error(`查询失败: ${error.message}`);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: '账号已被禁用' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken(user.id, user.role);

    // Log login event
    await client.from('security_logs').insert({
      user_id: user.id,
      event_type: 'login',
      event_desc: '用户登录成功',
      risk_level: 'low',
      ip_address: req.ip || null,
      action_taken: 'allowed',
    });

    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    res.json({
      message: '登录成功',
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await client
      .from('users')
      .select('id,username,phone,role,status,balance,created_at')
      .eq('id', req.userId!)
      .maybeSingle();

    if (error) throw new Error(`查询失败: ${error.message}`);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    res.status(500).json({ error: message });
  }
});

export default router;
