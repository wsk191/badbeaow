import { ref, set } from 'firebase/database';
import { db } from './firebase';
import { COURTS } from './appConfig';
import { notifySuperAdminOfAdminRequest } from './emailNotify';

// adminRequests/{uid} is write-once for the applicant (see database.rules.json),
// so an email can only ever request one court.
export async function submitAdminRequest(user, courtId) {
  const createdAt = Date.now();
  await set(ref(db, `adminRequests/${user.uid}`), { email: user.email, courtId, status: 'pending', createdAt });
  const courtName = COURTS.find(court => court.id === courtId)?.name || courtId;
  try {
    return { emailed: await notifySuperAdminOfAdminRequest({ applicantEmail: user.email, courtName, requestedAt: createdAt }) };
  } catch {
    return { emailed: false };
  }
}
