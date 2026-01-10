import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK initialization (Lazy Initialization)
 * 使用延遲初始化避免在 Docker 建置時因缺少環境變數而失敗
 * All Firebase operations should be done on the backend using Admin SDK
 * Do NOT use client-side Firebase SDK with security rules
 */

let app: App | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * 取得 Firebase Admin App 實例
 * 僅在首次呼叫時初始化
 *
 * 在建置階段（所有環境變數都缺失）會返回一個 mock app 以允許建置通過
 * 在運行階段則會嚴格檢查環境變數
 */
function getAdminApp(): App {
	if (app) {
		return app;
	}

	if (getApps().length) {
		app = getApps()[0];
		return app;
	}

	// 檢查必要的環境變數
	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_PRIVATE_KEY;

	// 如果所有環境變數都缺失，假設是在建置階段，返回一個 mock app
	// 這允許 Next.js 建置通過，但在實際運行時仍會檢查環境變數
	const allMissing = !projectId && !clientEmail && !privateKey;

	if (allMissing) {
		// 建置階段：建立一個 mock app（不會實際連接到 Firebase）
		console.warn(
			'[Firebase Admin] All credentials missing - assuming build time, creating mock app'
		);

		// 使用假的憑證來通過建置
		app = initializeApp({
			credential: cert({
				projectId: 'mock-project-id',
				clientEmail: 'mock@mock.com',
				privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n',
			}),
		});

		return app;
	}

	// 運行階段：嚴格檢查所有環境變數
	if (!projectId || !clientEmail || !privateKey) {
		throw new Error(
			'Missing required Firebase environment variables: ' +
				'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
		);
	}

	app = initializeApp({
		credential: cert({
			projectId,
			clientEmail,
			privateKey: privateKey.replace(/\\n/g, '\n'),
		}),
	});

	return app;
}

/**
 * 取得 Firebase Auth 實例（延遲初始化）
 */
export function getAdminAuth(): Auth {
	if (!auth) {
		auth = getAuth(getAdminApp());
	}
	return auth;
}

/**
 * 取得 Firestore 實例（延遲初始化）
 */
export function getAdminDb(): Firestore {
	if (!db) {
		db = getFirestore(getAdminApp());
	}
	return db;
}

// 為了向後相容，使用 Proxy 來延遲初始化
// 當模組被 import 時不會立即初始化，只有在實際呼叫方法時才會初始化
export const adminDb: Firestore = new Proxy({} as Firestore, {
	get(_, prop) {
		const db = getAdminDb();
		const value = (db as unknown as Record<string | symbol, unknown>)[prop];
		if (typeof value === 'function') {
			return value.bind(db);
		}
		return value;
	},
});

export const adminAuth: Auth = new Proxy({} as Auth, {
	get(_, prop) {
		const auth = getAdminAuth();
		const value = (auth as unknown as Record<string | symbol, unknown>)[prop];
		if (typeof value === 'function') {
			return value.bind(auth);
		}
		return value;
	},
});

export { getAdminApp as adminApp };
