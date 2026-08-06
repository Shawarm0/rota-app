import client from "./client";
import type { Location } from "../types";

export async function listLocations(): Promise<Location[]> {
  const { data } = await client.get<Location[]>("/locations");
  return data;
}

export async function createLocation(name: string): Promise<Location> {
  const { data } = await client.post<Location>("/locations", { name });
  return data;
}

export async function updateLocation(id: string, name: string): Promise<Location> {
  const { data } = await client.patch<Location>(`/locations/${id}`, { name });
  return data;
}

export async function deleteLocation(id: string) {
  await client.delete(`/locations/${id}`);
}
