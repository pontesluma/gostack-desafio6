import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParser from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionRequest {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_title: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const startReadingFromLine2 = csvParser({
      from_line: 2,
    });

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const fileReadStrem = fs.createReadStream(filePath);

    const pipeCsv = fileReadStrem.pipe(startReadingFromLine2);
    const transactionsRequest: TransactionRequest[] = [];
    const categories: string[] = [];

    await new Promise((resolve, reject) => {
      pipeCsv.on('data', row => {
        const [title, type, value, category] = row.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value) return;

        transactionsRequest.push({
          title,
          type,
          value,
          category_title: category,
        });

        categories.push(category);
      });

      pipeCsv.on('end', async () => {
        await fs.promises.unlink(filePath);
        resolve(transactionsRequest);
      });

      pipeCsv.on('error', error => reject(error));
    });

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactionsRequest.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category_title,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
