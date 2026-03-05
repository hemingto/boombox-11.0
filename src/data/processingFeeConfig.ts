export const PROCESSING_FEE_RATE = 0.029;
export const PROCESSING_FEE_LABEL = 'Processing fee';

export function calculateProcessingFee(subtotal: number): number {
  return Math.round(subtotal * PROCESSING_FEE_RATE * 100) / 100;
}
