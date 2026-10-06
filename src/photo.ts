/** Simpan foto avatar ke direktori dokumen agar persist antar sesi. */
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'gallery';

/** Batas ukuran foto sumber agar tidak penuhi sandbox (5 MB). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export async function pickAndPersistPhoto(
  source: PhotoSource,
): Promise<{ uri?: string; denied?: boolean; error?: string }> {
  try {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { denied: true };
    const launcher =
      source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
    const result = await launcher({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return {};
    const srcUri = result.assets[0].uri;
    if (!srcUri.startsWith('file://') && !srcUri.startsWith('content://')) return {};
    const info = await FileSystem.getInfoAsync(srcUri).catch(() => null);
    if (info?.exists && typeof info.size === 'number' && info.size > MAX_PHOTO_BYTES) {
      return { error: 'Foto terlalu besar. Maksimal 5 MB.' };
    }
    const fileName = `avatar-${Date.now()}.jpg`;
    const destUri = `${FileSystem.documentDirectory}avatars/${fileName}`;
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}avatars`, {
      intermediates: true,
    }).catch(() => undefined);
    await FileSystem.copyAsync({ from: srcUri, to: destUri });
    return { uri: destUri };
  } catch {
    return { error: 'Gagal menyimpan foto. Coba lagi.' };
  }
}
