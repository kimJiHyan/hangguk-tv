/**
 * 主屏幕 - 直播播放器
 * 集成 GitHub 配置、设备授权、播放列表加载和视频播放
 */

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ScreenContainer } from '@/components/screen-container';
import { PaymentQRModal } from '@/components/payment-qr-modal';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { usePlaylist } from '@/hooks/use-playlist';
import { useColors } from '@/hooks/use-colors';
import * as FileSystem from 'expo-file-system/legacy';

export default function HomeScreen() {
  const colors = useColors();
  const authStatus = useAuthStatus(true); // 自动刷新授权状态
  const playlistState = usePlaylist('playlist.m3u', false); // 不自动刷新播放列表
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [qrCodePath, setQrCodePath] = useState<string | null>(null);

  // 获取当前选中的播放项
  const currentItem = playlistState.items[selectedItemIndex];

  // 创建视频播放器
  const player = useVideoPlayer(currentItem?.url || '', (player) => {
    // 播放器初始化回调
  });

  /**
   * 加载支付二维码
   */
  useEffect(() => {
    const loadQRCode = async () => {
      try {
        // 尝试从 upload 目录加载用户的微信收款码
        const qrPath = (FileSystem.documentDirectory || '') + 'qrcode.jpg';
        const fileInfo = await FileSystem.getInfoAsync(qrPath);

        if (fileInfo.exists) {
          setQrCodePath(qrPath);
        } else {
          // 如果本地没有，尝试从 assets 加载
          // 没有找到收款码
          setQrCodePath(null);
        }
      } catch (error) {
        console.error('[HomeScreen] 加载二维码失败:', error);
      }
    };

    loadQRCode();
  }, []);

  /**
   * 当授权状态改变时，更新支付模态框的显示状态
   */
  useEffect(() => {
    if (!authStatus.isAuthorized) {
      setShowPaymentModal(true);
    } else {
      setShowPaymentModal(false);
    }
  }, [authStatus.isAuthorized]);

  /**
   * 处理重试按钮
   */
  const handleRetry = async () => {
    await authStatus.refresh();
  };

  /**
   * 处理关闭模态框
   */
  const handleCloseModal = () => {
    setShowPaymentModal(false);
  };

  /**
   * 处理播放列表项选择
   */
  const handleSelectItem = (index: number) => {
    setSelectedItemIndex(index);
  };

  // 如果正在加载授权状态，显示加载界面
  if (authStatus.isLoading && !authStatus.config) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">正在验证授权...</Text>
      </ScreenContainer>
    );
  }

  // 如果授权失败，显示支付模态框
  if (!authStatus.isAuthorized) {
    return (
      <ScreenContainer className="justify-center items-center">
        <PaymentQRModal
          visible={showPaymentModal}
          qrCodeUri={qrCodePath || ''}
          title={authStatus.isExpired ? '服务已过期' : '访问被拒绝'}
          message={
            authStatus.isExpired
              ? '您的服务已过期，请扫描二维码续费'
              : '该设备未被授权，请扫描二维码进行支付'
          }
          onRetry={handleRetry}
          onClose={handleCloseModal}
          isLoading={authStatus.isLoading}
        />
      </ScreenContainer>
    );
  }

  // 如果播放列表为空，显示加载状态
  if (playlistState.items.length === 0) {
    return (
      <ScreenContainer className="justify-center items-center gap-4">
        {playlistState.isLoading ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-foreground">正在加载播放列表...</Text>
          </>
        ) : (
          <>
            <Text className="text-error text-lg font-bold">播放列表加载失败</Text>
            <Text className="text-muted text-center">{playlistState.error || '未知错误'}</Text>
            <TouchableOpacity
              onPress={() => playlistState.refresh()}
              style={{ backgroundColor: colors.primary }}
              className="px-6 py-3 rounded-lg"
            >
              <Text className="text-background font-semibold">重试</Text>
            </TouchableOpacity>
          </>
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* 视频播放器 */}
        <View className="w-full bg-black rounded-lg overflow-hidden mb-6" style={{ aspectRatio: 16 / 9 }}>
          {currentItem ? (
            <VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              allowsFullscreen
              allowsPictureInPicture
            />
          ) : (
            <View className="flex-1 justify-center items-center bg-black">
              <Text className="text-white">无可用直播源</Text>
            </View>
          )}
        </View>

        {/* 当前播放信息 */}
        {currentItem && (
          <View className="px-4 mb-6">
            <Text className="text-2xl font-bold text-foreground mb-2">{currentItem.name}</Text>
            <Text className="text-muted text-sm">设备 ID: {authStatus.deviceId}</Text>
          </View>
        )}

        {/* 播放列表 */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">播放列表</Text>
          <View className="gap-2">
            {playlistState.items.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectItem(index)}
                style={{
                  backgroundColor: selectedItemIndex === index ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="p-4 rounded-lg"
              >
                <View className="flex-row items-center gap-3">
                  {item.logo && (
                    <Image
                      source={{ uri: item.logo }}
                      style={{ width: 40, height: 40, borderRadius: 4 }}
                      resizeMode="cover"
                    />
                  )}
                  <Text
                    className="flex-1 font-semibold"
                    style={{
                      color: selectedItemIndex === index ? colors.background : colors.foreground,
                    }}
                  >
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 设备信息 */}
        <View className="px-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-sm font-bold text-foreground mb-2">设备信息</Text>
          <Text className="text-xs text-muted mb-1">设备 ID: {authStatus.deviceId}</Text>
          <Text className="text-xs text-muted mb-1">
            授权状态: {authStatus.isAuthorized ? '已授权' : '未授权'}
          </Text>
          <Text className="text-xs text-muted">
            最后更新: {authStatus.lastUpdated ? new Date(authStatus.lastUpdated).toLocaleTimeString() : '未更新'}
          </Text>
        </View>
      </ScrollView>

      {/* 支付模态框 */}
      <PaymentQRModal
        visible={showPaymentModal}
        qrCodeUri={qrCodePath || ''}
        title={authStatus.isExpired ? '服务已过期' : '访问被拒绝'}
        message={
          authStatus.isExpired
            ? '您的服务已过期，请扫描二维码续费'
            : '该设备未被授权，请扫描二维码进行支付'
        }
        onRetry={handleRetry}
        onClose={handleCloseModal}
        isLoading={authStatus.isLoading}
      />
    </ScreenContainer>
  );
}
