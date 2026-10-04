export type Slot = {
  start: Date;
  end: Date;
};

export async function getAvailableSlots(): Promise<Slot[]> {
  throw new Error("TODO: Layer 3");
}
