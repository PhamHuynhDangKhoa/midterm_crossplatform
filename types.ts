/** Strictly matches the required QLHocPhan.GiangVien schema (4 fields only). */
export interface Lecturer {
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
}

export type LecturerInput = Lecturer;

export type LecturerSortKey = 'idAsc' | 'nameAsc' | 'sumDesc';

export interface AuthResult {
  success: boolean;
  error?: string;
}
