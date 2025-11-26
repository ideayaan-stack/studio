import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export const exportDataToExcel = async () => {
    const { db } = initializeFirebase();
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

        // Create Maps for easy lookup
        const teamMap = new Map<string, string>();
        teamsSnap.docs.forEach(doc => {
            teamMap.set(doc.id, doc.data().name);
        });

        const userMap = new Map<string, string>();
        usersSnap.docs.forEach(doc => {
            userMap.set(doc.data().uid, doc.data().displayName);
        });

        // Helper to get team name
        const getTeamName = (teamId?: string) => {
            if (!teamId) return 'Unassigned';
            return teamMap.get(teamId) || 'Unknown Team';
        };

        // Helper to get user name
        const getUserName = (uid?: string) => {
            if (!uid) return 'Unknown User';
            return userMap.get(uid) || uid; // Fallback to UID if name not found
        };

        // 2. Summary Sheet
        const totalUsers = usersSnap.size;
        const totalTeams = teamsSnap.size;
        const totalTasks = tasksSnap.size;
        const completedTasks = tasksSnap.docs.filter(d => d.data().status === 'Completed').length;
        const totalFiles = filesSnap.size;

        const summaryData = [
            { Metric: 'Export Date', Value: new Date().toLocaleString() },
            { Metric: 'Total Users', Value: totalUsers },
            { Metric: 'Total Teams', Value: totalTeams },
            { Metric: 'Total Tasks', Value: totalTasks },
            { Metric: 'Completed Tasks', Value: completedTasks },
            { Metric: 'Task Completion Rate', Value: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%' },
            { Metric: 'Total Files', Value: totalFiles },
            { Metric: 'Total Meetings', Value: meetingsSnap.size },
        ];
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

        // 3. Users Sheet
        const usersData = usersSnap.docs.map(doc => {
            const data = doc.data();
            const teamNames = data.teamIds
                ? data.teamIds.map((id: string) => teamMap.get(id) || id).join(', ')
                : getTeamName(data.teamId);

            return {
                Name: data.displayName,
                Email: data.email,
                Role: data.role,
                PrimaryTeam: getTeamName(data.teamId),
                AllTeams: teamNames,
                UID: data.uid // Keep UID for reference but at the end
            };
        });
        const usersWs = XLSX.utils.json_to_sheet(usersData);
        XLSX.utils.book_append_sheet(wb, usersWs, "Users");

        // 4. Teams Sheet
        const teamsData = teamsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                Name: data.name,
                Description: data.description,
                Head: getUserName(data.head), // Map head UID to name
                HeadEmail: data.headEmail || 'N/A',
                MemberCount: data.members?.length || 0
            };
        });
        const teamsWs = XLSX.utils.json_to_sheet(teamsData);
        XLSX.utils.book_append_sheet(wb, teamsWs, "Teams");

        // 5. Tasks Sheet
        const tasksData = tasksSnap.docs.map(doc => {
            const data = doc.data();
            return {
                Title: data.title,
                Description: data.description,
                Status: data.status,
                Priority: data.priority || 'Normal',
                Assignee: data.assignee?.name || 'Unassigned',
                Team: getTeamName(data.teamId),
                Deadline: data.deadline?.toDate ? data.deadline.toDate().toLocaleString() : 'N/A',
                Created: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : 'N/A',
                CompletionReport: data.completionReport || 'N/A'
            };
        });
        const tasksWs = XLSX.utils.json_to_sheet(tasksData);
        XLSX.utils.book_append_sheet(wb, tasksWs, "Tasks");

        // 6. Files Sheet
        const filesData = filesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                Name: data.name,
                Type: data.type,
                UploadedBy: getUserName(data.uploadedBy),
                Team: getTeamName(data.teamId),
                URL: data.url,
                UploadDate: data.uploadDate?.toDate ? data.uploadDate.toDate().toLocaleString() : 'N/A'
            };
        });
        const filesWs = XLSX.utils.json_to_sheet(filesData);
        XLSX.utils.book_append_sheet(wb, filesWs, "Files");

        // 7. Meetings Sheet
        const meetingsData = meetingsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                Title: data.title,
                Date: data.date?.toDate ? data.date.toDate().toLocaleDateString() : 'N/A',
                Time: data.time,
                Team: getTeamName(data.teamId),
                CreatedBy: getUserName(data.createdBy)
            };
        });
        const meetingsWs = XLSX.utils.json_to_sheet(meetingsData);
        XLSX.utils.book_append_sheet(wb, meetingsWs, "Meetings");

        // Write file
        XLSX.writeFile(wb, `Ideayaan_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        return true;
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};
