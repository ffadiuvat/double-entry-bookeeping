import { Doc } from 'fyo/model/doc';
import { FormulaMap } from 'fyo/model/types';
import { Money } from 'pesa';

export class TaxSummary extends Doc {
  account?: string;
  rate?: number;
  amount?: Money;
  baseAmount?: Money;

  formulas: FormulaMap = {
    baseAmount: {
      formula: async () => {
        const amount = this.amount as Money;
        const exchangeRate = (this.parentdoc?.exchangeRate ?? 1) as number;
        return amount.mul(exchangeRate);
      },
      dependsOn: ['amount'],
    },
  };
}
