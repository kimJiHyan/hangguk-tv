/**
 * 播放列表管理 Hook
 * 用于加载和管理 M3U 播放列表
 */

import { useEffect, useState, useCallback } from 'react';
import { fetchPlaylist, type PlaylistItem } from '@/lib/github-config';

export interface PlaylistState {
  items: PlaylistItem[]; // 播放列表项
  isLoading: boolean; // 是否正在加载
  error: string | null; // 错误信息
  lastUpdated: number | null; // 最后更新时间
}

/**
 * 使用播放列表 Hook
 * @param filename M3U 文件名（默认为 playlist.m3u）
 * @param autoRefresh 是否自动定期刷新（默认为 false）
 * @returns 播放列表状态对象
 */
export function usePlaylist(filename: string = 'playlist.m3u', autoRefresh: boolean = false) {
  const [state, setState] = useState<PlaylistState>({
    items: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  /**
   * 加载播放列表
   */
  const loadPlaylist = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const items = await fetchPlaylist(filename);

      if (!items) {
        throw new Error('无法加载播放列表');
      }

      setState({
        items,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('[Playlist] 加载播放列表失败:', errorMessage);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [filename]);

  /**
   * 初始化和设置自动刷新
   */
  useEffect(() => {
    loadPlaylist();

    if (autoRefresh) {
      const interval = setInterval(loadPlaylist, 60000); // 每 60 秒刷新一次
      return () => clearInterval(interval);
    }
  }, [loadPlaylist, autoRefresh]);

  return {
    ...state,
    refresh: loadPlaylist, // 手动刷新方法
  };
}
