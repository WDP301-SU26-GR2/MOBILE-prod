export const SERIES_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  IN_REVIEW: 'Đang chờ duyệt',
  PROPOSAL_REVISION: 'Cần sửa đề xuất',
  ABANDONED: 'Đã huỷ bởi tác giả',
  WITHDRAWN: 'Bị từ chối',
  SERIALIZED: 'Đang xuất bản',
  HIATUS: 'Tạm ngưng',
  COMPLETING: 'Đang kết thúc',
  CANCELLING: 'Đang bị huỷ',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã huỷ',
};

export const CHAPTER_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  IN_PROGRESS: 'Đang thực hiện',
  IN_PRODUCTION: 'Đang sản xuất',
  READY_FOR_PRINT: 'Sẵn sàng xuất bản',
  PUBLISHED: 'Đã xuất bản',
  REVISION_REQUIRED: 'Cần chỉnh sửa',
  ARCHIVED: 'Đã lưu trữ',
  CANCELLED: 'Đã huỷ',
};

export const CONTRACT_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_SIGNATURES: 'Đang chờ ký',
  ACTIVE: 'Đang có hiệu lực',
  FULLY_EXECUTED: 'Đã ký kết',
  REJECTED_BY_MANGAKA: 'Tác giả từ chối',
  EXPIRED: 'Đã hết hạn',
  TERMINATED: 'Đã chấm dứt',
  CANCELLED: 'Đã huỷ',
};

export const CONTRACT_TYPE_MAP: Record<string, string> = {
  FULL_BUYOUT: 'Mua đứt',
  REVENUE_SHARE: 'Chia sẻ doanh thu',
};

export const STAGE_CODE_MAP: Record<string, string> = {
  STORYBOARD: 'Kịch bản',
  INKING: 'Đi nét',
  DETAILING: 'Chi tiết',
  LETTERING: 'Lồng chữ',
  FINAL_CHECK: 'Kiểm duyệt',
};

export const PAYMENT_STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  MISSED: 'Trượt mốc',
  CANCELLED: 'Đã huỷ',
  TRIGGERED: 'Đã chốt',
  APPROVED: 'Đã duyệt',
};

export const PAYMENT_TYPE_MAP: Record<string, string> = {
  RECURRING_CHAPTER: 'Thù lao mỗi chương',
  ROYALTY: 'Nhuận bút',
  ADVANCE: 'Tạm ứng',
  ONETIME_BONUS: 'Thưởng một lần',
  MILESTONE_BONUS: 'Thưởng đạt mốc',
  PENALTY: 'Phạt vi phạm',
  SUBSCRIPTION_SHARE: 'Chia sẻ doanh thu',
};

export const TASK_STATUS_MAP: Record<string, string> = {
  PENDING: 'Đang chờ',
  ASSIGNED: 'Đã giao',
  IN_PROGRESS: 'Đang làm',
  SUBMITTED: 'Đã nộp',
  REVISION_REQUESTED: 'Yêu cầu sửa',
  APPROVED: 'Đã duyệt',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã huỷ',
};

export const PAGE_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING: 'Đang chờ',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Đã hoàn thành',
  REVISION_REQUIRED: 'Cần chỉnh sửa',
  APPROVED: 'Đã duyệt',
};

export const CONDITION_STATUS_MAP: Record<string, string> = {
  PENDING: 'Đang chờ',
  MET: 'Đã đạt',
  CANCELLED: 'Đã huỷ',
};

export const SPECIALIZATION_MAP: Record<string, string> = {
  BACKGROUND: 'Vẽ nền',
  SCREENTONE: 'Dán tone',
  EFFECT_LINES: 'Hiệu ứng đường',
  COLORING: 'Tô màu',
  LETTERING: 'Chèn thoại',
  INKING: 'Đi nét',
};

export const REQUEST_STATUS_MAP: Record<string, string> = {
  PENDING: 'Đang chờ duyệt',
  ACCEPTED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã huỷ',
};

export const STORYBOARD_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING: 'Đang chờ duyệt',
  PENDING_REVIEW: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

export const COLLABORATOR_STATUS_MAP: Record<string, string> = {
  PENDING: 'Đang chờ',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  ACTIVE: 'Đang hoạt động',
  TERMINATED: 'Đã chấm dứt',
  CANCELLED: 'Đã huỷ',
};

export const translateSeriesStatus = (status: string | undefined | null) => status ? (SERIES_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateChapterStatus = (status: string | undefined | null) => status ? (CHAPTER_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateContractStatus = (status: string | undefined | null) => status ? (CONTRACT_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateContractType = (type: string | undefined | null) => type ? (CONTRACT_TYPE_MAP[type] || type) : 'Chưa rõ';
export const translateStageCode = (code: string | undefined | null) => code ? (STAGE_CODE_MAP[code] || code) : 'Chưa rõ';
export const translatePaymentStatus = (status: string | undefined | null) => status ? (PAYMENT_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateTaskStatus = (status: string | undefined | null) => status ? (TASK_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateRequestStatus = (status: string | undefined | null) => status ? (REQUEST_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateStoryboardStatus = (status: string | undefined | null) => status ? (STORYBOARD_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateCollaboratorStatus = (status: string | undefined | null) => status ? (COLLABORATOR_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translatePageStatus = (status: string | undefined | null) => status ? (PAGE_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateConditionStatus = (status: string | undefined | null) => status ? (CONDITION_STATUS_MAP[status] || status) : 'Chưa rõ';
export const translateSpecialization = (spec: string | undefined | null) => spec ? (SPECIALIZATION_MAP[spec] || spec) : 'Chưa rõ';
export const translatePaymentType = (type: string | undefined | null) => type ? (PAYMENT_TYPE_MAP[type] || type) : 'Chưa rõ';
