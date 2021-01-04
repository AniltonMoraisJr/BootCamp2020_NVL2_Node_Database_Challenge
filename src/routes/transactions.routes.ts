import { Router } from 'express';
import multer from 'multer';
import uploadConfig from '../config/upload';
import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request: Request, response:Response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find({
    relations: ['category']
  });
  const balance = await transactionsRepository.getBalance();
  return response.status(200).json({
    transactions: transactions.map(({category_id, ...transactionWithoutCategoryId}) => transactionWithoutCategoryId),
    balance
  });
});

transactionsRouter.post('/', async (request: Request, response:Response) => {
  const {title, value, type, category} = request.body;
  const createTransactionService = new CreateTransactionService();
  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    categoryName: category
  });

  return response.status(201).json(transaction);
});

transactionsRouter.delete('/:id', async (request: Request, response:Response) => {
  const {id} = request.params;
  const deleteTransactionService = new DeleteTransactionService();
  await deleteTransactionService.execute(id);
  return response.status(204).json({});
});

transactionsRouter.post('/import', upload.single('file'), async (request: Request, response:Response) => {
  const file = request.file;
  const importTransactionsService = new ImportTransactionsService();
  const transactions = await importTransactionsService.execute(file.filename);
  return response.status(200).json(transactions);
});

export default transactionsRouter;
