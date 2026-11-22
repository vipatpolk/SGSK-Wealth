import { Transaction } from './transaction.model';

export interface LocalTransaction extends Transaction {
  id: string;
  fee?: number;
  employeeContribution?: number;
  employeeEarnings?: number;
  employerMatching?: number;
  employerEarnings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalCsvImportResult {
  importedCount: number;
  skippedCount: number;
  error?: string;
}
