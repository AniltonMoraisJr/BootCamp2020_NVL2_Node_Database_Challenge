import AppError from '../errors/AppError';

import { getRepository } from "typeorm";
import Transaction from "../models/Transaction";

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const checkIfTransactionExist = await transactionsRepository.findOne(id);

    if(!checkIfTransactionExist){
      throw new AppError('Transaction not founded', 404)
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
