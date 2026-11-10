import type { Role } from "@prisma/client";

export interface Store {
  id: string;
  name: string;
}

// People who work shifts: employees (including assistant managers) and store managers
export const STAFF_ROLES: Role[] = ["EMPLOYEE", "MANAGER"];

// Staff who work at any of these stores: their home store, or a store they also work at
export function staffAtStores(locationIds: string[]) {
  return { OR: [{ locationId: { in: locationIds } }, { workStores: { some: { locationId: { in: locationIds } } } }] };
}

// A shift belongs to a store by its own location, or by its rota's store when it has none
export function shiftsAtStore(store: Store) {
  return shiftsAtStores([store]);
}

export function shiftsAtStores(stores: Store[]) {
  return {
    OR: stores.flatMap((store) => [{ location: store.name }, { location: null, rota: { locationId: store.id } }]),
  };
}
