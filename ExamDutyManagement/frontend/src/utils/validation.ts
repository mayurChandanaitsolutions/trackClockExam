/**
 * Detects whether a string of numbers contains a continuous sequence of digits
 * such as 6 or more consecutive ascending (e.g. 123456, 234567),
 * descending (e.g. 654321, 987654), or repeated identical digits (e.g. 111111).
 *
 * @param val - The input string containing numbers
 * @param minLength - Minimum length of consecutive sequence to consider invalid (default: 6)
 * @returns boolean - true if a continuous sequence is found
 */
export const hasContinuousSequence = (val: string, minLength: number = 6): boolean => {
  const digits = val.replace(/\D/g, '');
  if (digits.length < minLength) return false;

  let incCount = 1;
  let decCount = 1;
  let repCount = 1;

  for (let i = 1; i < digits.length; i++) {
    const prev = parseInt(digits[i - 1], 10);
    const curr = parseInt(digits[i], 10);

    // Consecutive ascending (e.g., 1, 2, 3, 4, 5, 6)
    if (curr === prev + 1) {
      incCount++;
      if (incCount >= minLength) return true;
    } else {
      incCount = 1;
    }

    // Consecutive descending (e.g., 6, 5, 4, 3, 2, 1)
    if (curr === prev - 1) {
      decCount++;
      if (decCount >= minLength) return true;
    } else {
      decCount = 1;
    }

    // Consecutive identical (e.g., 1, 1, 1, 1, 1, 1)
    if (curr === prev) {
      repCount++;
      if (repCount >= minLength) return true;
    } else {
      repCount = 1;
    }
  }

  return false;
};
