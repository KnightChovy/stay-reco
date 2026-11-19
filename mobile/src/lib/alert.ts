import { Alert, Platform, type AlertButton } from 'react-native';

/** `Alert.alert` chạy cả trên web: react-native-web để hàm này trống nên nút trong hộp thoại không bao giờ được bấm. */
export function alert(title: string, message?: string, buttons: AlertButton[] = []) {
  if (Platform.OS !== 'web') return Alert.alert(title, message, buttons);
  const text = [title, message].filter(Boolean).join('\n\n');
  const cancel = buttons.find((b) => b.style === 'cancel');
  const action = buttons.find((b) => b !== cancel);
  // Có nút hủy thì là câu hỏi (confirm), không thì chỉ là thông báo.
  if (cancel ? window.confirm(text) : (window.alert(text), true)) action?.onPress?.();
  else cancel?.onPress?.();
}
