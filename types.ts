
export enum EnrollmentType {
  GRADE_1 = "Lớp 1",
  TRANSFER_IN = "Chuyển đến",
  TRANSFER_OUT = "Chuyển đi",
}

export enum ApplicationStatus {
  SUBMITTED = "Đã nộp",
  REVIEWING = "Đang xét duyệt",
  APPROVED = "Đã trúng tuyển",
  REJECTED = "Bị từ chối",
  ASSIGNED = "Đã phân lớp",
}

export enum EnrollmentRoute {
    IN_ROUTE = "Đúng tuyến",
    OUT_OF_ROUTE = "Trái tuyến",
}

export interface Application {
  id: string;
  studentName: string;
  studentDob: string;
  studentGender: 'Nam' | 'Nữ';
  parentName: string;
  parentPhone: string;
  address: string;
  enrollmentType: EnrollmentType;
  enrollmentRoute: EnrollmentRoute;
  isPriority: boolean;
  status: ApplicationStatus;
  submittedAt: Date;
  birthCertUrl?: string;
  residenceProofUrl?: string;
  rejectionReason?: string;
  classId?: string;
}

export interface SchoolClass {
    id: string;
    name: string;
    maxSize: number;
}

export interface AnnouncementDetail {
  label: string;
  value: string;
}

export interface Announcement {
  title: string;
  details: AnnouncementDetail[];
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface Guideline {
  id: string;
  text: string;
}