import { apiClient } from '../api/client';

export interface UploadSignResponse {
  assetId: string;
  key: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
}

export const uploadFileToR2 = async (fileUri: string, fileName: string, contentType: string, assetType?: string): Promise<string> => {
  try {
    // 1. Xin URL upload tạm thời (Signed URL) từ Backend
    const signRes = await apiClient.post('/uploads/sign', {
      fileName,
      contentType,
      // contentLength: Optional if we don't calculate it beforehand
      assetType
    });
    
    if (!signRes.data?.success || !signRes.data?.data) {
      throw new Error('Failed to get upload signature');
    }

    const { uploadUrl, key, requiredHeaders } = signRes.data.data as UploadSignResponse;

    // 2. Fetch nội dung file từ URI thiết bị để chuyển thành blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // 3. Upload bytes thẳng lên R2 thông qua Signed URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...requiredHeaders, // Các header quan trọng (Content-Type) mà R2 yêu cầu
      },
      body: blob
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status: ${uploadRes.status}`);
    }

    // Trả về key object để lưu vào db
    return key;
  } catch (error) {
    console.error('uploadFileToR2 error:', error);
    throw error;
  }
};
