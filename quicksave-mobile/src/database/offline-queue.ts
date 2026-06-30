import * as SQLite from 'expo-sqlite';
import 'react-native-get-random-values'; // Required for uuid in React Native
import { v4 as uuidv4 } from 'uuid';

// Synchronously open the local database
const db = SQLite.openDatabaseSync('ajo_offline.db');

export interface OfflineContribution {
  id: string;
  groupId: string;
  amount: number;
  status: 'PENDING';
  createdAt: string;
}

export const initOfflineDB = () => {
  // Create the table if it doesn't exist
  db.execSync(`
    CREATE TABLE IF NOT EXISTS offline_contributions (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      createdAt TEXT NOT NULL
    );
  `);
};

export const saveOfflineContribution = async (groupId: string, amount: number): Promise<OfflineContribution> => {
  const newRecord: OfflineContribution = {
    id: uuidv4(),
    groupId,
    amount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await db.runAsync(
    'INSERT INTO offline_contributions (id, groupId, amount, status, createdAt) VALUES (?, ?, ?, ?, ?)',
    [newRecord.id, newRecord.groupId, newRecord.amount, newRecord.status, newRecord.createdAt]
  );

  return newRecord;
};

export const getOfflineContributions = async (): Promise<OfflineContribution[]> => {
  const allRows = await db.getAllAsync<OfflineContribution>('SELECT * FROM offline_contributions WHERE status = "PENDING" ORDER BY createdAt DESC');
  return allRows;
};

export const removeOfflineContribution = async (id: string) => {
  await db.runAsync('DELETE FROM offline_contributions WHERE id = ?', [id]);
};