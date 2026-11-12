import { Platform, Share } from 'react-native';
import { serializeLecturersJson } from '../services/lecturerService';
import { Lecturer } from '../types';

/** Exports GiangVien records in strict 4-field JSON format for Web download or Mobile share. */
export async function exportDatabaseJson(items: Lecturer[]): Promise<'downloaded' | 'shared'> {
  const json = serializeLecturersJson(items);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GiangVien.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  await Share.share({
    title: 'GiangVien.json',
    message: json,
  });
  return 'shared';
}
