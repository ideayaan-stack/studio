import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export const exportDataToExcel = async () => {
    const { db } = initializeFirebase();
    if (!db) throw new Error("Database not initialized");

    try {
        const wb = XLSX.utils.book_new();

        // 1. Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(doc => {
            const data = doc.data();
            return {
                UID: data.uid,
                Name: data.displayName,
                Email: data.email,
                Role: data.role,
                TeamID: data.teamId || 'N/A'
            };
        });
        const usersWs = XLSX.utils.json_to_sheet(usersData);
        XLSX.utils.book_append_sheet(wb, usersWs, "Users");

        // 2. Teams
        const teamsSnap = await getDocs(collection(db, 'teams'));
        const teamsData = teamsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                ID: doc.id,
                Name: data.name,
                Description: data.description,
                HeadEmail: data.headEmail || 'N/A',
                MemberCount: data.members?.length || 0
            };
        });
        const teamsWs = XLSX.utils.json_to_sheet(teamsData);
        XLSX.utils.book_append_sheet(wb, teamsWs, "Teams");

        // 3. Tasks
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        const tasksData = tasksSnap.docs.map(doc => {
            const data = doc.data();
            return {
                ID: doc.id,
                Title: data.title,
                Description: data.description,
                Status: data.status,
                Priority: data.priority,
                Assignee: data.assignee?.name || 'Unassigned',
                TeamID: data.teamId,
                Deadline: data.deadline?.toDate ? data.deadline.toDate().toISOString() : 'N/A'
            };
        });
        const tasksWs = XLSX.utils.json_to_sheet(tasksData);
        XLSX.utils.book_append_sheet(wb, tasksWs, "Tasks");

        // 4. Files
        const filesSnap = await getDocs(collection(db, 'files'));
        const filesData = filesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                ID: doc.id,
                Name: data.name,
                Type: data.type,
                UploadedBy: data.uploadedBy,
                TeamID: data.teamId,
                URL: data.url,
                UploadDate: data.uploadDate?.toDate ? data.uploadDate.toDate().toISOString() : 'N/A'
            };
        });
        const filesWs = XLSX.utils.json_to_sheet(filesData);
        XLSX.utils.book_append_sheet(wb, filesWs, "Files");

        // Write file
        XLSX.writeFile(wb, `Ideayaan_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};
