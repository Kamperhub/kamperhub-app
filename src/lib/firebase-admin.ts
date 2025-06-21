
import admin, { type App as AdminApp } from 'firebase-admin';

let app: AdminApp | undefined = undefined;
let firestore: admin.firestore.Firestore | undefined = undefined;

try {
  // In a managed environment like Google Cloud Run (which App Hosting uses),
  // the Admin SDK can initialize without any parameters. It automatically
  // discovers the service account credentials from the environment.
  // This is the most robust method.
  if (admin.apps.length > 0) {
    app = admin.app();
    console.log('[Firebase Admin] SDK re-used existing instance.');
  } else {
    app = admin.initializeApp();
    console.log('[Firebase Admin] SDK initialized successfully with default credentials.');
  }

  if (app) {
    firestore = admin.firestore(app);
  } else {
    console.error('[Firebase Admin] CRITICAL: Firebase Admin App was NOT initialized. Firestore client will be undefined.');
  }

} catch (initializationError: any) {
  console.error('[Firebase Admin] CRITICAL ERROR during Firebase Admin SDK initialization:', {
    message: initializationError.message,
    stack: initializationError.stack,
  });
  // app and firestore will remain undefined
}

export { app as adminApp, firestore as adminFirestore, admin };
