import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

export async function exportDataToCSV() {
    if (!db) return;

    try {
        // Fetch all tasks
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Fetch all teams
        const teamsSnap = await getDocs(collection(db, 'teams'));
        const teams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Fetch all users
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Create CSV Content
        let csvContent = "Type,ID,Name/Title,Status/Role,Description/Email,Date\n";

        // Add Teams
        teams.forEach(t => {
            csvContent += `Team,${t.id},"${t.name || ''}","${t.head || ''}","${t.description || ''}",\n`;
        });

        // Add Users
        users.forEach(u => {
            csvContent += `User,${u.uid},"${u.displayName || ''}","${u.role || ''}","${u.email || ''}",\n`;
        });

        // Add Tasks
        tasks.forEach(t => {
            const date = t.deadline ? format(t.deadline.toDate(), 'yyyy-MM-dd') : '';
            csvContent += `Task,${t.id},"${t.title || ''}","${t.status || ''}","${t.description || ''}",${date}\n`;
        });

        const fileName = `ideayaan_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;

        // Handle Web Platform
        if (Platform.OS === 'web') {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            return;
        }

        // Handle Native Platform (iOS/Android)
        // Cast to any to avoid type errors with expo-file-system versions
        const fileUri = (FileSystem as any).documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
            encoding: (FileSystem as any).EncodingType.UTF8
        });

        // Share file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            console.log("Sharing not available");
        }

    } catch (error) {
        console.error("Error exporting data:", error);
        throw error;
    }
}
