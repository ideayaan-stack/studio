import { config } from 'dotenv';
config({ path: '.env.local' });



import { initializeFirebaseAdmin } from './src/firebase/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const admin = initializeFirebaseAdmin();
const db = getFirestore(admin);

async function migrateUsers() {
    console.log('Migrating users...');
    const usersSnap = await db.collection('users').get();
    const batch = db.batch();
    let count = 0;

    usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.teamId && (!data.teamIds || data.teamIds.length === 0)) {
            console.log(`Migrating user: ${doc.id}, Team: ${data.teamId}`);
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                teamIds: [data.teamId]
            });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Migrated ${count} users.`);
    } else {
        console.log('No users needed migration.');
    }
}

migrateUsers();
