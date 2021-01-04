import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;

  value: number;

  type: 'income' | 'outcome';

  categoryName: string;
}

class CreateTransactionService {
  public async execute({title, value, type, categoryName}: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    let category_id = null;

    const balance = await transactionsRepository.getBalance();

    // Verify and validate the outcome value

    if(type === 'outcome' && balance !== null && balance?.total < value){
      throw new AppError('Invalid outcome. The value is greater than total balance.', 400);
    }

    // Verify if already exist the category. If not, create than

    const checkIfCategoryExist = await categoriesRepository.findOne({ where: {
      title: categoryName
    }});

    if (!checkIfCategoryExist) {
      // Create the new category
      const newCategory = await categoriesRepository.create({
        title: categoryName
      });
      // Save the new category
      const savedCategory = await categoriesRepository.save(newCategory);
      // Set the category_id of the transaction with the newCategory's id
      category_id = savedCategory.id;
    } else {
      category_id = checkIfCategoryExist.id;
    }

    // Create the new transaction
    const newTransaction = await transactionsRepository.create({
      title,
      value,
      type,
      category_id
    });
    return await transactionsRepository.save(newTransaction);
  }
}

export default CreateTransactionService;
