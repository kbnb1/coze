import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

export interface SecurityCheckResult {
  passed: boolean;
  riskScore: number;
  risks: string[];
  action: 'allow' | 'deny' | 'review';
}

export async function performSecurityCheck(
  deviceFingerprint: string,
  userId: number,
  ipAddress?: string
): Promise<SecurityCheckResult> {
  const risks: string[] = [];
  let riskScore = 0;

  // 1. Check device history
  const { data: device, error: deviceError } = await client
    .from('devices')
    .select('is_rooted,is_emulator,has_overlay,risk_level')
    .eq('device_fingerprint', deviceFingerprint)
    .maybeSingle();

  if (deviceError) throw new Error(`设备查询失败: ${deviceError.message}`);

  if (device) {
    if (device.is_rooted) {
      risks.push('设备已Root/越狱');
      riskScore += 40;
    }
    if (device.is_emulator) {
      risks.push('检测到模拟器环境');
      riskScore += 50;
    }
    if (device.has_overlay) {
      risks.push('检测到悬浮窗/覆盖层');
      riskScore += 35;
    }
    if (device.risk_level === 'high') {
      risks.push('设备历史风险等级为高');
      riskScore += 20;
    }
  }

  // 2. Check if device is associated with banned users
  const { data: bannedDevices, error: bannedError } = await client
    .from('security_logs')
    .select('id')
    .eq('device_fingerprint', deviceFingerprint)
    .eq('action_taken', 'banned')
    .limit(1);

  if (bannedError) throw new Error(`安全日志查询失败: ${bannedError.message}`);

  if (bannedDevices && bannedDevices.length > 0) {
    risks.push('该设备曾被封禁');
    riskScore += 60;
  }

  // 3. Check login frequency (rapid login attempts)
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count: recentLogins, error: loginError } = await client
    .from('security_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'login')
    .gte('created_at', oneHourAgo);

  if (loginError) throw new Error(`登录记录查询失败: ${loginError.message}`);

  if ((recentLogins || 0) > 5) {
    risks.push('短时间内频繁登录');
    riskScore += 15;
  }

  // 4. Check multiple accounts on same device
  const { data: deviceUsers, error: duError } = await client
    .from('devices')
    .select('user_id')
    .eq('device_fingerprint', deviceFingerprint);

  if (duError) throw new Error(`设备用户查询失败: ${duError.message}`);

  if (deviceUsers && deviceUsers.length > 3) {
    risks.push('同一设备登录过多账号');
    riskScore += 25;
  }

  // Determine action
  let action: 'allow' | 'deny' | 'review' = 'allow';
  if (riskScore >= 70) {
    action = 'deny';
  } else if (riskScore >= 40) {
    action = 'review';
  }

  // Log the security check
  await client.from('security_logs').insert({
    user_id: userId,
    event_type: 'security_check',
    event_desc: `风险评分: ${riskScore}, 风险项: ${risks.join('; ') || '无'}`,
    risk_level: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
    device_fingerprint: deviceFingerprint,
    ip_address: ipAddress || null,
    action_taken: action === 'deny' ? 'denied' : action === 'review' ? 'flagged' : 'allowed',
  });

  return {
    passed: action !== 'deny',
    riskScore,
    risks,
    action,
  };
}
