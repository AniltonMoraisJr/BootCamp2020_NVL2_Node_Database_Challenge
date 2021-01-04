import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import uploadConfig from '../config/upload';
import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Lines {
  title: string;

  value: number;

  type: 'income' | 'outcome';

  categoryName: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[] | null> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);
    // Start read csv file
    // Verify if import file exist
    const importFilePath = path.join(uploadConfig.directory, fileName)
    // Use fs.promises to verify if file exist. The stat method return the status of the file in the system.
    const importFileExists = await fs.promises.stat(importFilePath);
    // If exist, start to read it
    if(importFileExists) {
      // Create first stream of entire file
      const readCSVStream = fs.createReadStream(importFilePath);
      // Create second stream of the first, just starting from second line
      const parseStream = csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
      });
      // Transmit the streams and save a new variable
      const parseCSV = readCSVStream.pipe(parseStream);

      let lines: Lines[] = [];

      // Read file and push line in lines array
      parseCSV.on('data', line => {
        const [title, type, value, categoryName] = line;
        lines.push({title, type, value, categoryName});
      });

      // Await end reading of the file
      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      // Go through every line and create a new Transaction
      const transactions = await Promise.all(lines.map( async ({title, type, value, categoryName}) => {
        let category_id = null;
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
        const newTransaction = await transactionsRepository.create({
          title,
          value,
          type,
          category_id
        });

        return newTransaction;
      }));
      // Save and return all transactions
      return await transactionsRepository.save(transactions);
    } else {
      return null;
    }
  }
}

export default ImportTransactionsService;
