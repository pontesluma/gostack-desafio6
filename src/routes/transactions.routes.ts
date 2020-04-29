import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository, getRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';

const upload = multer(uploadConfig);

interface TransactionWithCategory {
  id: string;
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: Category | undefined;
  created_at: Date;
  updated_at: Date;
}

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const categoriesRepository = getRepository(Category);

  const transactions = await transactionsRepository.find();
  const categories = await categoriesRepository.find();

  function assembleTransactionsAndCategories(
    transaction: Transaction,
  ): TransactionWithCategory {
    const matchedCategory = categories.find(
      category => category.id === transaction.category_id,
    );

    const transactionWithCategory: TransactionWithCategory = {
      id: transaction.id,
      title: transaction.title,
      type: transaction.type,
      value: transaction.value,
      category: matchedCategory,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };

    return transactionWithCategory;
  }

  const transactionsAndCategories = transactions.map(transaction =>
    assembleTransactionsAndCategories(transaction),
  );

  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions: transactionsAndCategories, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;

  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category_title: category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();
  await deleteTransaction.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();

    const transactions = await importTransactions.execute(request.file.path);

    return response.json(transactions);
  },
);

export default transactionsRouter;
