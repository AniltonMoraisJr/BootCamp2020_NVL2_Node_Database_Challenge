import { EntityRepository,  Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance | null> {

    const transactions = await this.find();

    const income = transactions.length > 0 ? transactions.filter(t => t.type === 'income').reduce((total, t) =>  total + t.value, 0) : 0;
    const outcome = transactions.length > 0 ? transactions.filter(t => t.type === 'outcome').reduce((total, t) =>  total + t.value, 0) : 0;
    const total = income - outcome;

    return {
      income,
      outcome,
      total
    };
  }
}

export default TransactionsRepository;
