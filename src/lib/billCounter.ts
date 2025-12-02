// Simple bill counter storage using localStorage

export function getLastBillNumber(): string {
  const last = localStorage.getItem("lastBillNumber");
  if (!last) return "01";
  return last;
}

export function setLastBillNumber(num: string) {
  localStorage.setItem("lastBillNumber", num);
}
