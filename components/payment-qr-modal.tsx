/**
 * 收款码展示模态框
 * 用于显示支付二维码和授权提示
 */

import { View, Text, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface PaymentQRModalProps {
  visible: boolean; // 是否显示
  qrCodeUri: string; // 二维码图片 URI（本地路径或 URL）
  title?: string; // 标题
  message?: string; // 提示信息
  onRetry?: () => void; // 重试按钮回调
  onClose?: () => void; // 关闭按钮回调
  isLoading?: boolean; // 是否正在加载
}

export function PaymentQRModal({
  visible,
  qrCodeUri,
  title = '访问已过期',
  message = '请扫描二维码进行支付，支付后请点击"重试"按钮',
  onRetry,
  onClose,
  isLoading = false,
}: PaymentQRModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 半透明背景 */}
      <View
        className="flex-1 bg-black/80 justify-center items-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      >
        {/* 模态框内容 */}
        <View
          className="bg-surface rounded-2xl p-8 max-w-sm w-11/12"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 标题 */}
            <Text
              className="text-2xl font-bold text-center mb-4"
              style={{ color: colors.error }}
            >
              {title}
            </Text>

            {/* 提示信息 */}
            <Text
              className="text-base text-center mb-6 leading-relaxed"
              style={{ color: colors.foreground }}
            >
              {message}
            </Text>

            {/* 二维码 */}
            {qrCodeUri ? (
              <View className="items-center mb-6">
                <Image
                  source={{ uri: qrCodeUri }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 8,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View
                className="items-center justify-center mb-6 rounded-lg"
                style={{
                  width: 200,
                  height: 200,
                  alignSelf: 'center',
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.muted }}>二维码加载中...</Text>
              </View>
            )}

            {/* 按钮组 */}
            <View className="gap-3">
              {/* 重试按钮 */}
              <TouchableOpacity
                onPress={onRetry}
                disabled={isLoading}
                style={{
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.6 : 1,
                }}
                className="py-3 px-4 rounded-lg items-center"
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.background }}
                >
                  {isLoading ? '检查中...' : '支付完成，点击重试'}
                </Text>
              </TouchableOpacity>

              {/* 关闭按钮 */}
              <TouchableOpacity
                onPress={onClose}
                disabled={isLoading}
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: isLoading ? 0.6 : 1,
                }}
                className="py-3 px-4 rounded-lg items-center"
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.foreground }}
                >
                  关闭
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
