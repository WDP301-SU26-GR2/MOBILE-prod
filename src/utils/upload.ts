import { apiClient } from '../api/client';

export interface UploadSignResponse {
  assetId: string;
  key: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
}

/**
 * Upload a local asset through the backend's presigned-R2 flow.
 *
 * The API validates `contentLength` as part of the signature, so the local
 * blob is deliberately read before requesting the upload URL.
 */
export const uploadFileToR2 = async (
  fileUri: string,
  fileName: string,
  contentType: string,
  assetType?: string,
): Promise<string> => {
  const source = await fetch(fileUri);
  const blob = await source.blob();

  if (!blob.size) {
    throw new Error('Không thể đọc dữ liệu tệp đã chọn.');
  }

  const signResponse = await apiClient.post('/uploads/sign', {
    fileName,
    contentType,
    contentLength: blob.size,
    assetType,
  });

  const signed = signResponse.data?.data as UploadSignResponse | undefined;
  if (!signed?.uploadUrl || !signed.key) {
    throw new Error('Không thể tạo đường dẫn tải tệp lên.');
  }

  const uploadResponse = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: signed.requiredHeaders,
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Tải tệp lên thất bại (${uploadResponse.status}).`);
  }

  return signed.key;
};
