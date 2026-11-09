export interface Store {
  id: string;
  name: string;
}

// A shift belongs to a store by its own location, or by its rota's store when it has none
export function shiftsAtStore(store: Store) {
  return { OR: [{ location: store.name }, { location: null, rota: { locationId: store.id } }] };
}
