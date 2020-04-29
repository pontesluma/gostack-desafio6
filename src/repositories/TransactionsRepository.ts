import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // TODO
    const transactions = await this.find();

    // const sumValueOutcome = transactions
    //   .filter(transaction => transaction.type === 'outcome')
    //   .map(transaction => transaction.value)
    //   .reduce((sumTotalOutcome, outcome) => sumTotalOutcome + outcome, 0);

    // const sumValueIncome = transactions
    //   .filter(transaction => transaction.type === 'income')
    //   .map(transaction => transaction.value)
    //   .reduce((sumTotalIncome, income) => sumTotalIncome + income, 0);

    const sumValueOutcome = transactions.reduce(function sumOutcome(
      acumulador,
      atual,
    ) {
      if (atual.type === 'outcome') {
        return acumulador + atual.value;
      }
      return acumulador;
    },
    0);

    const sumValueIncome = transactions.reduce(function sumIncome(
      acumulador,
      atual,
    ) {
      if (atual.type === 'income') {
        return acumulador + atual.value;
      }
      return acumulador;
    },
    0);

    const balance: Balance = {
      income: sumValueIncome,
      outcome: sumValueOutcome,
      total: sumValueIncome - sumValueOutcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
