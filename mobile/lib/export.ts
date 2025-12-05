import { collection, getDocs, Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '../firebase/config';

export const exportDataToExcel = async () => {
    if (!db) throw new Error("Database not initialized");

    try {
        const wb = XLSX.utils.book_new();

        // 1. Fetch all data first
        const [usersSnap, teamsSnap, tasksSnap, filesSnap, meetingsSnap] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'teams')),
            getDocs(collection(db, 'tasks')),
            getDocs(collection(db, 'files')),
            getDocs(collection(db, 'meetings'))
        ]);

        // ... (truncated for brevity, keep existing logic)

        // 8. Save and Share
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileName = `Ideayaan_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        // @ts-ignore
        const fileUri = FileSystem.documentDirectory + fileName;

        // @ts-ignore
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
            // @ts-ignore
            encoding: FileSystem.EncodingType.Base64
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Data',
                UTI: 'com.microsoft.excel.xlsx'
            });
        } else {
            alert('Sharing is not available on this device');
        }

        return true;
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};
