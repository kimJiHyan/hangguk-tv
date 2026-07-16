/**
 * 设备 ID 管理工具
 * 用于生成、存储和检索设备的唯一标识符
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 简单的随机十六进制字符串生成函数
function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const DEVICE_ID_KEY = 'private_tv_device_id';

/**
 * 生成唯一的设备 ID
 * 基于当前时间戳和随机值的组合
 * @returns 设备 ID 字符串
 */
export async function generateDeviceId(): Promise<string> {
  // 生成随机值
  const randomHex = generateRandomHex(32);

  // 结合时间戳
  const timestamp = Date.now().toString(36);
  const deviceId = `${timestamp}-${randomHex}`;

  return deviceId;
}

/**
 * 获取或创建设备 ID
 * 如果设备 ID 已存在，返回现有的 ID
 * 如果不存在，生成新的 ID 并保存
 * @returns 设备 ID 字符串
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // 尝试从本地存储获取现有的设备 ID
    const existingId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (existingId) {
      console.log('[DeviceID] 使用现有设备 ID:', existingId);
      return existingId;
    }

    // 生成新的设备 ID
    const newId = await generateDeviceId();

    // 保存到本地存储
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    console.log('[DeviceID] 生成新设备 ID:', newId);

    return newId;
  } catch (error) {
    console.error('[DeviceID] 获取或创建设备 ID 失败:', error);
    // 如果出错，返回一个临时 ID（基于时间戳）
    return `temp-${Date.now()}`;
  }
}

/**
 * 重置设备 ID（用于测试或重新授权）
 * @returns 新的设备 ID
 */
export async function resetDeviceId(): Promise<string> {
  try {
    // 删除现有的设备 ID
    await AsyncStorage.removeItem(DEVICE_ID_KEY);

    // 生成新的设备 ID
    const newId = await generateDeviceId();

    // 保存到本地存储
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    console.log('[DeviceID] 重置设备 ID:', newId);

    return newId;
  } catch (error) {
    console.error('[DeviceID] 重置设备 ID 失败:', error);
    throw error;
  }
}

/**
 * 获取当前设备 ID（不创建新的）
 * @returns 设备 ID 字符串或 null
 */
export async function getDeviceId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('[DeviceID] 获取设备 ID 失败:', error);
    return null;
  }
}
