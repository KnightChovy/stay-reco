import * as ImagePicker from 'expo-image-picker';

/** Chọn một ảnh từ thư viện, trả FormData (field `file`) cho các API multipart; null khi người dùng hủy. */
export async function pickImageForm() {
  // quality < 1 nén lại thành JPEG, giữ ảnh dưới giới hạn 10MB của backend.
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const form = new FormData();
  // Web có File thật; native gửi mô tả { uri, name, type } để React Native tự đọc file.
  form.append(
    'file',
    asset.file ?? ({ uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob),
  );
  return form;
}
