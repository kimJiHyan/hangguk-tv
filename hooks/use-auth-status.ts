/**
 * 授权状态管理 Hook
 * 用于检查设备的授权状态并定期更新
 */

import { useEffect, useState, useCallback } from 'react';
import { fetchGitHubConfig, isDeviceAuthorized, isServiceExpired, type GitHubConfig } from '@/lib/github-config';
import { getOrCreateDeviceId } from '@/lib/device-id';

export interface AuthStatus {
  isAuthorized: boolean; // 设备是否被授权
  isExpired: boolean; // 服务是否过期
  deviceId: string | null; // 当前设备 ID
  config: GitHubConfig | null; // GitHub 配置
  isLoading: boolean; // 是否正在加载
  error: string | null; // 错误信息
  lastUpdated: number | null; // 最后更新时间
}

const REFRESH_INTERVAL = 30000; // 每 30 秒检查一次授权状态

/**
 * 使用授权状态 Hook
 * @param autoRefresh 是否自动定期刷新（默认为 true）
 * @returns 授权状态对象
 */
export function useAuthStatus(autoRefresh: boolean = true) {
  const [status, setStatus] = useState<AuthStatus>({
    isAuthorized: false,
    isExpired: false,
    deviceId: null,
    config: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  /**
   * 检查授权状态
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

      // 获取或创建设备 ID
      const deviceId = await getOrCreateDeviceId();

      // 从 GitHub 获取配置
      const config = await fetchGitHubConfig();

      if (!config) {
        throw new Error('无法从 GitHub 获取配置');
      }

      // 检查授权状态
      const isAuthorized = isDeviceAuthorized(deviceId, config);
      const isExpired = isServiceExpired(config);

      setStatus({
        isAuthorized: isAuthorized && !isExpired,
        isExpired,
        deviceId,
        config,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('[AuthStatus] 检查授权状态失败:', errorMessage);

      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * 初始化和设置自动刷新
   */
  useEffect(() => {
    // 立即检查一次
    checkAuthStatus();

    // 设置自动刷新
    if (autoRefresh) {
      const interval = setInterval(checkAuthStatus, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [checkAuthStatus, autoRefresh]);

  return {
    ...status,
    refresh: checkAuthStatus, // 手动刷新方法
  };
}
