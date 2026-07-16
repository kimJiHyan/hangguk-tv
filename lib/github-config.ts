/**
 * GitHub 配置管理工具
 * 用于从用户的 GitHub 仓库读取直播配置和播放列表
 */

import axios from 'axios';

// GitHub 配置
const GITHUB_OWNER = 'kimJiHyan'; // 用户的 GitHub 用户名
const GITHUB_REPO = 'tv-config'; // 配置仓库名称
const GITHUB_BRANCH = 'main'; // 分支名称

// GitHub API 基础 URL
const GITHUB_API_BASE = 'https://api.github.com';

// 原始内容 URL（用于获取文件内容）
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

/**
 * GitHub 配置接口
 */
export interface GitHubConfig {
  globalStatus: boolean; // 全局开关：true 表示服务开启，false 表示服务关闭
  authorizedDevices?: string[]; // 授权的设备 ID 列表（可选）
  expiryDate?: string; // 服务过期日期（可选）
  message?: string; // 管理员消息（可选）
}

/**
 * M3U 播放列表项
 */
export interface PlaylistItem {
  name: string; // 频道名称
  url: string; // 直播源 URL
  logo?: string; // 频道 logo URL（可选）
}

/**
 * 从 GitHub 获取配置文件
 * @returns 配置对象或 null（如果获取失败）
 */
export async function fetchGitHubConfig(): Promise<GitHubConfig | null> {
  try {
    const url = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/config.json`;
    const response = await axios.get<GitHubConfig>(url, {
      timeout: 10000, // 10 秒超时
    });
    return response.data;
  } catch (error) {
    console.error('[GitHub] 获取配置失败:', error);
    return null;
  }
}

/**
 * 从 GitHub 获取 M3U 播放列表
 * @param filename M3U 文件名（默认为 playlist.m3u）
 * @returns 播放列表项数组或 null（如果获取失败）
 */
export async function fetchPlaylist(filename: string = 'playlist.m3u'): Promise<PlaylistItem[] | null> {
  try {
    const url = `${GITHUB_RAW_BASE}/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filename}`;
    const response = await axios.get<string>(url, {
      timeout: 10000, // 10 秒超时
    });

    return parseM3U(response.data);
  } catch (error) {
    console.error('[GitHub] 获取播放列表失败:', error);
    return null;
  }
}

/**
 * 解析 M3U 格式的播放列表
 * @param content M3U 文件内容
 * @returns 播放列表项数组
 */
export function parseM3U(content: string): PlaylistItem[] {
  const lines = content.split('\n');
  const items: PlaylistItem[] = [];
  let currentItem: Partial<PlaylistItem> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith('#EXTM3U')) {
      continue;
    }

    // 解析 EXTINF 行（频道信息）
    if (trimmed.startsWith('#EXTINF:')) {
      // 格式: #EXTINF:-1 tvg-id="..." tvg-name="频道名称" tvg-logo="..." group-title="...",频道名称
      const match = trimmed.match(/tvg-name="([^"]+)"/);
      const nameMatch = trimmed.match(/,(.+)$/);

      currentItem = {
        name: nameMatch ? nameMatch[1].trim() : (match ? match[1] : '未知频道'),
      };

      // 提取 logo URL（可选）
      const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
      if (logoMatch) {
        currentItem.logo = logoMatch[1];
      }
    }
    // 解析 URL 行
    else if (trimmed && !trimmed.startsWith('#')) {
      if (currentItem.name) {
        currentItem.url = trimmed;
        items.push(currentItem as PlaylistItem);
        currentItem = {};
      }
    }
  }

  return items;
}

/**
 * 检查设备是否被授权
 * @param deviceId 设备 ID
 * @param config GitHub 配置
 * @returns true 表示授权有效，false 表示被拒绝
 */
export function isDeviceAuthorized(deviceId: string, config: GitHubConfig): boolean {
  // 检查全局开关
  if (!config.globalStatus) {
    return false;
  }

  // 如果指定了授权设备列表，检查设备 ID 是否在列表中
  if (config.authorizedDevices && config.authorizedDevices.length > 0) {
    return config.authorizedDevices.includes(deviceId);
  }

  // 如果没有指定授权列表，则所有设备都被授权
  return true;
}

/**
 * 检查服务是否过期
 * @param config GitHub 配置
 * @returns true 表示已过期，false 表示未过期
 */
export function isServiceExpired(config: GitHubConfig): boolean {
  if (!config.expiryDate) {
    return false; // 没有设置过期日期，表示不会过期
  }

  const expiryTime = new Date(config.expiryDate).getTime();
  const currentTime = new Date().getTime();

  return currentTime > expiryTime;
}
