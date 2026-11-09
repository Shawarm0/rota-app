export type Role = "SYSTEM_ADMIN" | "OWNER" | "MANAGER" | "EMPLOYEE";

// People who work shifts: employees (including assistant managers) and store managers
export const STAFF_ROLES = "EMPLOYEE,MANAGER";

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

// Each category belongs to one store. Staff the viewer can't see the category for come back without one
// (assistant managers get only the colour, with an empty name).
export interface Category {
  id: string;
  name: string;
  color: string;
  businessId?: string;
  locationId?: string | null;
  location?: { id: string; name: string } | null;
  _count?: { users: number };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isAssistantManager?: boolean;
  businessId: string | null;
  locationId: string | null;
  location?: { id: string; name: string } | null;
  categoryId: string | null;
  category?: { id: string; name: string; color: string } | null;
  active?: boolean;
  // Other stores the owner lets a store manager see, and whether they can edit them
  storeAccess?: { locationId: string; canEdit: boolean }[];
  // Stores the signed-in person can change; null means every store (from /auth/me)
  editableStores?: { id: string; name: string }[] | null;
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
  // Included on team calendar shifts; a shift without its own store belongs to its rota's
  rota?: { id: string; location?: { name: string } | null };
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
  // Whether the signed-in manager can approve/reject this request
  canDecide?: boolean;
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
