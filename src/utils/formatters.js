export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(amount);
}