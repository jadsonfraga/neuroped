interface SeatSnapshot {
  contracted: number | null;
  activeMembers: number | null;
}

function validSeatCount(value: number | null): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 1;
}

export function checkoutSeatsForSolo(input: SeatSnapshot): number {
  return Math.max(
    1,
    validSeatCount(input.contracted),
    validSeatCount(input.activeMembers),
  );
}

export function isMultiSeatTenant(input: SeatSnapshot): boolean {
  return validSeatCount(input.contracted) > 1 || validSeatCount(input.activeMembers) > 1;
}
