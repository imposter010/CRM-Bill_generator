/**
 * Convert numbers into words using the Indian numbering system (Lakhs, Crores, Rupees, Paise)
 */
export function getAmountInWords(numberInput: number | string | null | undefined): string {
  if (numberInput === null || numberInput === undefined || numberInput === '' || Number.isNaN(Number(numberInput))) {
    return 'Zero Rupees Only';
  }

  const num = Math.round(Number(numberInput) * 100) / 100;
  if (num === 0) {
    return 'Zero Rupees Only';
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const words: Record<number, string> = {
    0: '', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six',
    7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve',
    13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen',
    18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty', 30: 'Thirty', 40: 'Forty',
    50: 'Fifty', 60: 'Sixty', 70: 'Seventy', 80: 'Eighty', 90: 'Ninety'
  };

  const digits = ['', 'Hundred', 'Thousand', 'Lakh', 'Crore'];
  const str: (string | null)[] = [];
  let no = integerPart;
  const digitsLength = no.toString().length;
  let i = 0;

  while (i < digitsLength) {
    const divider = i === 2 ? 10 : 100;
    const currentNum = Math.floor(no % divider);
    no = Math.floor(no / divider);
    i += i === 10 ? 1 : (divider === 10 ? 1 : 2);

    if (currentNum > 0) {
      const counter = str.length;
      const hundred = (counter === 1 && str[0]) ? ' and ' : '';

      if (currentNum < 21) {
        str.push(`${words[currentNum]} ${digits[counter] || ''} ${hundred}`);
      } else {
        const tens = Math.floor(currentNum / 10) * 10;
        const units = currentNum % 10;
        str.push(`${words[tens]} ${words[units]} ${digits[counter] || ''} ${hundred}`);
      }
    } else {
      str.push(null);
    }
  }

  const rupees = str
    .filter((part): part is string => Boolean(part))
    .reverse()
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  let paiseWords = '';
  if (decimalPart > 0) {
    if (decimalPart < 21) {
      paiseWords = words[decimalPart];
    } else {
      const tens = Math.floor(decimalPart / 10) * 10;
      const units = decimalPart % 10;
      paiseWords = `${words[tens]} ${words[units]}`.trim();
    }
    paiseWords = ` and ${paiseWords} Paise`;
  }

  const finalStr = `${rupees ? `${rupees} Rupees` : ''}${paiseWords} Only`.trim();
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
}
