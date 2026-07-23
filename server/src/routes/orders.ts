import type { Response } from 'express';
import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { performSecurityCheck } from '../utils/security.js';

const router = Router();
const client = getSupabaseClient();

// Generate order number
function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SL${dateStr}${random}`;
}

// POST /api/v1/orders/create - Create order (start renting)
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { account_id, duration_hours, device_fingerprint, device_model, os_version, is_rooted, is_emulator, has_overlay } = req.body;

    if (!account_id || !duration_hours || !device_fingerprint) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }

    // 1. Check account availability
    const { data: account, error: accError } = await client
      .from('game_accounts')
      .select('id,account_name,account_password,price_per_hour,deposit,status')
      .eq('id', account_id)
      .eq('status', 'available')
      .maybeSingle();

    if (accError) throw new Error(`账号查询失败: ${accError.message}`);
    if (!account) {
      res.status(404).json({ error: '该账号不可用或已被租用' });
      return;
    }

    // 2. Perform security check
    const securityResult = await performSecurityCheck(
      device_fingerprint,
      req.userId!,
      req.ip
    );

    if (!securityResult.passed) {
      // Log the denied attempt
      await client.from('security_logs').insert({
        user_id: req.userId,
        event_type: 'order_denied',
        event_desc: `安全检测未通过: ${securityResult.risks.join('; ')}`,
        risk_level: 'high',
        device_fingerprint,
        ip_address: req.ip || null,
        action_taken: 'denied',
      });

      res.status(403).json({
        error: '安全检测未通过，无法租用',
        risks: securityResult.risks,
        riskScore: securityResult.riskScore,
      });
      return;
    }

    // 3. Check user balance
    const { data: user, error: userError } = await client
      .from('users')
      .select('id,balance')
      .eq('id', req.userId!)
      .maybeSingle();

    if (userError) throw new Error(`用户查询失败: ${userError.message}`);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const totalPrice = account.price_per_hour * duration_hours + account.deposit;
    if (user.balance < totalPrice) {
      res.status(400).json({ error: '余额不足', required: totalPrice, balance: user.balance });
      return;
    }

    // 4. Create order
    const orderNo = generateOrderNo();
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: req.userId,
        account_id,
        status: 'active',
        total_price: totalPrice,
        duration_hours,
        started_at: new Date().toISOString(),
        device_fingerprint,
        security_status: securityResult.action === 'review' ? 'warning' : 'normal',
        risk_score: securityResult.riskScore,
      })
      .select()
      .single();

    if (orderError) throw new Error(`订单创建失败: ${orderError.message}`);

    // 5. Update account status to rented
    await client
      .from('game_accounts')
      .update({ status: 'rented' })
      .eq('id', account_id);

    // 6. Deduct user balance
    await client
      .from('users')
      .update({ balance: user.balance - totalPrice })
      .eq('id', req.userId!);

    // 7. Register/update device
    await client.from('devices').upsert({
      user_id: req.userId,
      device_fingerprint,
      device_model: device_model || null,
      os_version: os_version || null,
      is_rooted: is_rooted || false,
      is_emulator: is_emulator || false,
      has_overlay: has_overlay || false,
      risk_level: securityResult.riskScore >= 40 ? 'high' : 'low',
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'device_fingerprint' });

    // 8. Log order creation
    await client.from('security_logs').insert({
      user_id: req.userId,
      order_id: order.id,
      event_type: 'order_created',
      event_desc: `订单创建成功: ${orderNo}, 风险评分: ${securityResult.riskScore}`,
      risk_level: securityResult.riskScore >= 40 ? 'medium' : 'low',
      device_fingerprint,
      action_taken: 'allowed',
    });

    res.status(201).json({
      message: '上号成功',
      order,
      account: {
        account_name: account.account_name,
        account_password: account.account_password,
        server_name: null,
      },
      security: {
        riskScore: securityResult.riskScore,
        risks: securityResult.risks,
        status: securityResult.action,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '订单创建失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/v1/orders/my - Get current user's orders
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await client
      .from('orders')
      .select('id,order_no,account_id,status,total_price,duration_hours,started_at,ended_at,security_status,risk_score,created_at')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询失败: ${error.message}`);

    // Get account details for each order
    const accountIds = (data || []).map(o => o.account_id);
    let accounts: Record<number, { game_name: string; game_icon: string | null; server_name: string | null; rank_info: string | null }> = {};

    if (accountIds.length > 0) {
      const { data: accData, error: accError } = await client
        .from('game_accounts')
        .select('id,game_name,game_icon,server_name,rank_info')
        .in('id', accountIds);

      if (accError) throw new Error(`账号查询失败: ${accError.message}`);
      if (accData) {
        accounts = Object.fromEntries(accData.map(a => [a.id, {
          game_name: a.game_name,
          game_icon: a.game_icon,
          server_name: a.server_name,
          rank_info: a.rank_info,
        }]));
      }
    }

    const orders = (data || []).map(o => ({
      ...o,
      account: accounts[o.account_id] || null,
    }));

    res.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    res.status(500).json({ error: message });
  }
});

// POST /api/v1/orders/:id/end - End order (return account)
router.post('/:id/end', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id,account_id,user_id,status')
      .eq('id', id)
      .eq('user_id', req.userId!)
      .maybeSingle();

    if (orderError) throw new Error(`查询失败: ${orderError.message}`);
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }

    if (order.status !== 'active') {
      res.status(400).json({ error: '订单已结束' });
      return;
    }

    // Update order status
    await client
      .from('orders')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', id);

    // Release account
    await client
      .from('game_accounts')
      .update({ status: 'available' })
      .eq('id', order.account_id);

    // Log
    await client.from('security_logs').insert({
      user_id: req.userId,
      order_id: Number(id),
      event_type: 'order_ended',
      event_desc: '订单正常结束',
      risk_level: 'low',
      action_taken: 'allowed',
    });

    res.json({ message: '已归还账号' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败';
    res.status(500).json({ error: message });
  }
});

// POST /api/v1/orders/security-check - Re-check security during active session
router.post('/security-check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { device_fingerprint, order_id } = req.body;

    if (!device_fingerprint) {
      res.status(400).json({ error: '缺少设备指纹' });
      return;
    }

    const result = await performSecurityCheck(device_fingerprint, req.userId!, req.ip);

    // If security check fails during active session, terminate the order
    if (!result.passed && order_id) {
      await client
        .from('orders')
        .update({
          status: 'terminated',
          ended_at: new Date().toISOString(),
          security_status: 'terminated',
        })
        .eq('id', order_id);

      // Release the account
      const { data: order } = await client
        .from('orders')
        .select('account_id')
        .eq('id', order_id)
        .maybeSingle();

      if (order) {
        await client
          .from('game_accounts')
          .update({ status: 'available' })
          .eq('id', order.account_id);
      }

      await client.from('security_logs').insert({
        user_id: req.userId,
        order_id,
        event_type: 'session_terminated',
        event_desc: `会话因安全风险被终止: ${result.risks.join('; ')}`,
        risk_level: 'high',
        device_fingerprint,
        action_taken: 'terminated',
      });
    }

    res.json({
      passed: result.passed,
      riskScore: result.riskScore,
      risks: result.risks,
      action: result.action,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '安全检测失败';
    res.status(500).json({ error: message });
  }
});

export default router;
