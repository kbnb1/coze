import type { Response } from 'express';
import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
const client = getSupabaseClient();

// POST /api/v1/security/report-device - Report device info for security analysis
router.post('/report-device', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { device_fingerprint, device_model, os_version, is_rooted, is_emulator, has_overlay, suspicious_processes } = req.body;

    if (!device_fingerprint) {
      res.status(400).json({ error: '缺少设备指纹' });
      return;
    }

    let riskLevel = 'low';
    let riskScore = 0;
    const risks: string[] = [];

    if (is_rooted) {
      risks.push('设备已Root/越狱');
      riskScore += 40;
    }
    if (is_emulator) {
      risks.push('模拟器环境');
      riskScore += 50;
    }
    if (has_overlay) {
      risks.push('检测到悬浮窗');
      riskScore += 35;
    }
    if (suspicious_processes && suspicious_processes.length > 0) {
      risks.push(`可疑进程: ${suspicious_processes.join(', ')}`);
      riskScore += 45;
    }

    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';

    // Upsert device
    await client.from('devices').upsert({
      user_id: req.userId,
      device_fingerprint,
      device_model: device_model || null,
      os_version: os_version || null,
      is_rooted: is_rooted || false,
      is_emulator: is_emulator || false,
      has_overlay: has_overlay || false,
      risk_level: riskLevel,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'device_fingerprint' });

    // Log security event
    if (risks.length > 0) {
      await client.from('security_logs').insert({
        user_id: req.userId,
        event_type: 'device_report',
        event_desc: `设备安全报告: ${risks.join('; ')}`,
        risk_level: riskLevel,
        device_fingerprint,
        action_taken: riskLevel === 'high' ? 'flagged' : 'logged',
      });
    }

    res.json({
      riskLevel,
      riskScore,
      risks,
      message: riskLevel === 'high' ? '设备存在高风险，部分功能可能受限' : '设备安全',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '上报失败';
    res.status(500).json({ error: message });
  }
});

// POST /api/v1/security/security-check - Quick security check for device
router.post('/security-check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { device_fingerprint, is_rooted, is_emulator, has_overlay, suspicious_processes } = req.body;

    let riskLevel = 'low';
    let riskScore = 0;
    const risks: string[] = [];

    if (is_rooted) { risks.push('设备已Root/越狱'); riskScore += 40; }
    if (is_emulator) { risks.push('模拟器环境'); riskScore += 50; }
    if (has_overlay) { risks.push('检测到悬浮窗/覆盖层'); riskScore += 30; }
    if (suspicious_processes && suspicious_processes.length > 0) {
      risks.push(`可疑进程: ${suspicious_processes.join(', ')}`);
      riskScore += 25;
    }

    if (riskScore >= 60) riskLevel = 'critical';
    else if (riskScore >= 30) riskLevel = 'high';
    else if (riskScore >= 10) riskLevel = 'medium';

    res.json({
      risk_level: riskLevel,
      risk_score: riskScore,
      risks,
      allowed: riskLevel !== 'critical' && riskLevel !== 'high',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '检测失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/v1/security/logs - Get user's security logs
router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await client
      .from('security_logs')
      .select('id,event_type,event_desc,risk_level,action_taken,created_at')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(`查询失败: ${error.message}`);

    res.json({ logs: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    res.status(500).json({ error: message });
  }
});

// GET /api/v1/security/stats - Admin: Get security statistics
router.get('/stats', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const { count: totalOrders } = await client
      .from('orders').select('*', { count: 'exact', head: true });

    const { count: activeOrders } = await client
      .from('orders').select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: deniedAttempts } = await client
      .from('security_logs').select('*', { count: 'exact', head: true })
      .eq('action_taken', 'denied');

    const { count: highRiskDevices } = await client
      .from('devices').select('*', { count: 'exact', head: true })
      .eq('risk_level', 'high');

    res.json({
      stats: {
        totalOrders: totalOrders || 0,
        activeOrders: activeOrders || 0,
        deniedAttempts: deniedAttempts || 0,
        highRiskDevices: highRiskDevices || 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败';
    res.status(500).json({ error: message });
  }
});

export default router;
