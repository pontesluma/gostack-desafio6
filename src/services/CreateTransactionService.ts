import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_title: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category_title,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid transaction type.');
    }

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('Outcome transaction not possible.', 401);
    }

    let category = await categoryRepository.findOne({
      where: { title: category_title },
    });

    if (!category) {
      category = categoryRepository.create({ title: category_title });
      await categoryRepository.save(category);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: category.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
