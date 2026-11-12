import { Alert, Platform } from 'react-native';

export function showNotice(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void | Promise<void>
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
