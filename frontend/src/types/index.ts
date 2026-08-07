export type Role = "SYSTEM_ADMIN" | "MANAGER" | "EMPLOYEE";

export type RotaStatus = "DRAFT" | "PUBLISHED";

export type ShiftStatus =
  | "ASSIGNED"
  | "ADDITIONAL"
  | "AVAILABLE";

export type HolidayStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Location {
  id: string;
  name: string;
  businessId?: string;
  _count?: { users: number };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  businessId: string | null;
  locationId: string | null;
  location?: { id: string; name: string } | null;
  active?: boolean;
}

export interface Business {
  id: string;
  name: string;
}

export interface Rota {
  id: string;
  businessId: string;
  locationId: string | null;
  location?: { id: string; name: string } | null;
  name: string | null;
  startDate: string;
  endDate: string;
  status: RotaStatus;
  shifts?: Shift[];
}

export interface Shift {
  id: string;
  rotaId: string;
  userId: string | null;
  user?: User;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
  status: ShiftStatus;
}

export interface HolidayRequest {
  id: string;
  userId: string;
  user?: User;
  shiftId: string | null;
  shift?: Shift;
  date: string;
  reason: string | null;
  status: HolidayStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: Array<{ field: string; message: string }>;
  };
}
