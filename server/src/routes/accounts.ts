import type { Response } from 'express';
import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const client = getSupabaseClient();

// GET /api/v1/accounts - List available game accounts
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await client
      .from('game_accounts')
      .select('id,game_name,game_icon,account_name,server_name,rank_info,description,price_per_hour,deposit,status')
      .eq('status', 'available')
      .order('price_per_hour', { ascending: false });

    if (error) throw new Error(`查询失败: ${error.message}`);

    res.json({ accounts: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/v1/accounts/search - Search game accounts
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { game, keyword } = req.query;

    let query = client
      .from('game_accounts')
      .select('id,game_name,game_icon,account_name,server_name,rank_info,description,price_per_hour,deposit,status')
      .eq('status', 'available');

    if (game) {
      query = query.ilike('game_name', `%${game}%`);
    }
    if (keyword) {
      query = query.or(`rank_info.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const { data, error } = await query.order('price_per_hour', { ascending: false });
    if (error) throw new Error(`搜索失败: ${error.message}`);

    res.json({ accounts: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '搜索失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/v1/accounts/:id - Get account detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await client
      .from('game_accounts')
      .select('id,game_name,game_icon,account_name,server_name,rank_info,description,price_per_hour,deposit,status')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`查询失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '账号不存在' });
      return;
    }

    res.json({ account: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    res.status(500).json({ error: message });
  }
});

// POST /api/v1/accounts - Admin: Add game account
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { game_name, game_icon, account_name, account_password, server_name, rank_info, description, price_per_hour, deposit } = req.body;

    if (!game_name || !account_name || !account_password || !price_per_hour) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    const { data, error } = await client
      .from('game_accounts')
      .insert({
        game_name,
        game_icon: game_icon || null,
        account_name,
        account_password,
        server_name: server_name || null,
        rank_info: rank_info || null,
        description: description || null,
        price_per_hour,
        deposit: deposit || 0,
        status: 'available',
        owner_id: req.userId,
      })
      .select()
      .single();

    if (error) throw new Error(`创建失败: ${error.message}`);

    res.status(201).json({ message: '账号添加成功', account: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败';
    res.status(500).json({ error: message });
  }
});

// PUT /api/v1/accounts/:id - Admin: Update game account
router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await client
      .from('game_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`更新失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '账号不存在' });
      return;
    }

    res.json({ message: '更新成功', account: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败';
    res.status(500).json({ error: message });
  }
});

export default router;
