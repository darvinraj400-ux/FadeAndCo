export type BookingIntent = {
  service?: string;
  barber?: string;
  date?: string;
  time?: string;
};

export async function parseBookingIntent(
  _input: string
): Promise<BookingIntent> {
  throw new Error("TODO: Layer 3");
}
