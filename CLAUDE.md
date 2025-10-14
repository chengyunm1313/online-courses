# Online Courses Platform - Architecture Documentation

## Overview
This is a Next.js-based online courses platform with authentication and user management. The platform allows users to browse courses, enroll in them, track their learning progress, and manage their profiles.

## Implementation Status

### ✅ Phase 1 - Completed
- Authentication system with NextAuth.js v4 and Google OAuth
- Firebase Admin SDK integration
- Session management via Firestore
- Role-based type definitions (student, instructor, admin)
- Security hardening and .gitignore configuration

### ✅ Phase 2 - Completed
- **Homepage** (/) with hero section, featured courses, features, and footer
- **Courses Listing Page** (/courses) with advanced filters (search, category, level, price, sort)
- **Course Detail Page** (/courses/[id]) with full course info, syllabus, and enrollment
- **User Profile Page** (/profile) with authentication check and user info display
- **My Learning Page** (/learning) with progress tracking and enrolled courses
- **Admin Dashboard** (/admin) with KPIs, course management, and user management
- **Navigation Component** with role-based menu (admin links for admin users)
- **Type Definitions** for Course, User, Enrollment, Review, CourseFilters
- **Mock Data** with 6 complete courses in Chinese
- **Responsive UI Design** with Tailwind CSS

### 📋 Phase 3 - Pending
- Enrollment API with actual Firebase integration
- Payment integration with Stripe/PayPal
- Real-time progress tracking in database
- Course reviews and rating system
- Admin CRUD operations for courses and users
- Profile editing functionality
- Video player integration for course content
- Full-text search optimization
- Email notifications
- Certificate generation

## Core Principles

### **CRITICAL: Backend-Only Firebase Architecture**
**All Firebase operations MUST be performed on the backend using Firebase Admin SDK.**

- ✅ **DO**: Use Firebase Admin SDK in API routes and server components
- ❌ **DON'T**: Use client-side Firebase SDK with security rules
- ❌ **DON'T**: Initialize Firebase in client components
- ❌ **DON'T**: Rely on Firestore security rules for authorization

**Rationale**: This architecture provides better security control, easier testing, and centralized business logic.

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router with Turbopack)
- **Authentication**: NextAuth.js v4.24.11 (stable)
- **Database**: Firebase Firestore (via Admin SDK)
- **Auth Provider**: Google OAuth 2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Image Optimization**: Next.js Image component
- **Session Management**: Firestore Adapter for NextAuth

## Project Structure

```
/app
  /admin
    page.tsx              # Admin dashboard with KPIs and management
  /api
    /auth
      /[...nextauth]
        route.ts          # NextAuth API route handler
  /auth
    /test
      page.tsx            # Authentication test page
      SignInButton.tsx    # Client component for sign in
      SignOutButton.tsx   # Client component for sign out
  /courses
    page.tsx              # Courses listing with filters and search
    /[id]
      page.tsx            # Course detail page
      EnrollButton.tsx    # Client component for enrollment
  /learning
    page.tsx              # My learning page with progress tracking
  /profile
    page.tsx              # User profile page
  layout.tsx              # Root layout with Providers
  page.tsx                # Homepage with hero and featured courses
  providers.tsx           # SessionProvider wrapper

/components
  Navbar.tsx              # Navigation with role-based menu

/lib
  firebase-admin.ts       # Firebase Admin SDK initialization
  auth.ts                 # NextAuth v4 configuration
  mock-data.ts            # Mock courses and categories data

/types
  course.ts               # Course, Enrollment, Review types
  user.ts                 # UserProfile, LearningProgress types
  next-auth.d.ts          # NextAuth type extensions with role

/.env.local               # Environment variables (NEVER COMMIT)
```

## Authentication System

### Configuration

The authentication system uses NextAuth.js v4 (stable) with the following setup:

1. **Firebase Admin SDK** ([lib/firebase-admin.ts](lib/firebase-admin.ts))
   - Initializes Firebase Admin with service account credentials from environment variables
   - Provides `adminAuth` and `adminDb` exports for backend operations
   - All Firebase operations go through this module
   - Handles newline escaping in private key (`\\n` → `\n`)

2. **NextAuth v4 Setup** ([lib/auth.ts](lib/auth.ts))
   - Uses `NextAuthOptions` configuration pattern
   - Configured with `FirestoreAdapter` to store sessions in Firebase
   - Google OAuth provider with client credentials
   - Session callback adds user ID and role to session object
   - Debug mode enabled in development
   - Exports handler with GET and POST methods

3. **API Route** ([app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts))
   - Exports GET and POST handlers from lib/auth

4. **Session Provider** ([app/providers.tsx](app/providers.tsx))
   - Client component wrapping children with `SessionProvider`
   - Enables client-side session access via `useSession` hook

5. **Client Components**:
   - [SignInButton.tsx](app/auth/test/SignInButton.tsx): Uses `signIn("google")` from "next-auth/react"
   - [SignOutButton.tsx](app/auth/test/SignOutButton.tsx): Uses `signOut()` from "next-auth/react"

### Environment Variables

All sensitive configuration is stored in `.env.local` (ignored by git):

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# NextAuth.js
NEXTAUTH_SECRET=your-randomly-generated-secret-here
AUTH_TRUST_HOST=true       # Auto-detect host URL (recommended for NextAuth v4)

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Note**: The `NEXTAUTH_URL` variable is optional when `AUTH_TRUST_HOST=true` is set.

### Usage Examples

#### Server Component (Recommended)
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Please log in</div>;
  }

  return <div>Hello {session.user.name}</div>;
}
```

#### Client Component with Sign In/Out
```typescript
"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn("google")}>Sign in with Google</button>
    </>
  );
}
```

#### Protected Route Pattern
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  // Your protected content here
  return <div>Protected content for {session.user.name}</div>;
}
```

### Using Firebase Admin SDK

When you need to access Firebase services, always use the Admin SDK:

```typescript
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Example: Get user data
const userDoc = await adminDb.collection('users').doc(userId).get();

// Example: Verify a custom token
const decodedToken = await adminAuth.verifyIdToken(token);
```

## Security Considerations

### Protected Files (Already in .gitignore)
- `.env*` - All environment files
- `client_secret*.json` - Google OAuth credentials
- `*-firebase-adminsdk-*.json` - Firebase service account keys
- `serviceAccountKey.json` - Alternative Firebase key name

### Security Checklist
- ✅ Private keys stored in environment variables only
- ✅ All sensitive files ignored by git
- ✅ Firebase Admin SDK used exclusively (no client SDK)
- ✅ Authentication handled server-side
- ✅ Session management via Firestore
- ✅ NEXTAUTH_SECRET properly generated and secured

## Testing

### Quick Start
1. Install dependencies: `npm install`
2. Configure `.env.local` with your Firebase and Google OAuth credentials
3. Start dev server: `npm run dev`
4. Open browser to `http://localhost:3000`

### Testing All Pages

#### 1. Homepage (/)
**Test Checklist**:
- [ ] Hero section displays with gradient background
- [ ] CTA buttons are clickable ("瀏覽課程", "開始免費試用")
- [ ] Featured courses grid shows 6 courses sorted by rating
- [ ] Course cards display thumbnail, title, price, category, rating
- [ ] Features section displays three benefit cards
- [ ] Footer displays with all links
- [ ] Responsive design works on mobile/tablet/desktop

**Expected Result**: Clean, modern homepage with all sections rendering correctly.

#### 2. Authentication (/auth/test)
**Test Checklist**:
- [ ] When logged out: Shows "You are not logged in" message
- [ ] When logged out: "Sign in with Google" button is visible
- [ ] Click sign-in: Redirects to Google OAuth consent screen
- [ ] After OAuth: Returns to test page
- [ ] When logged in: Shows "You are logged in!" message
- [ ] When logged in: Displays user avatar, name, email, and ID
- [ ] "Sign Out" button works and logs user out

**Expected Result**: Successful Google OAuth flow with session persistence.

#### 3. Courses Listing (/courses)
**Test Checklist**:
- [ ] All 6 courses display in grid layout
- [ ] Search bar filters courses by title, description, tags
- [ ] Category filter (radio buttons) works correctly
- [ ] Level filter (初級/中級/高級) works correctly
- [ ] Price range filter works correctly
- [ ] Sort dropdown changes course order (popular, rating, newest, price)
- [ ] Course count updates as filters are applied
- [ ] "清除" button resets all filters
- [ ] Empty state shows when no courses match filters
- [ ] Course cards are clickable and navigate to detail page

**Expected Result**: Fully functional filtering and sorting system.

#### 4. Course Detail (/courses/[id])
**Test URLs**:
- `/courses/1` - React 完整開發指南
- `/courses/2` - Python 數據分析實戰
- `/courses/3` - UI/UX 設計入門
- `/courses/4` - 機器學習基礎課程
- `/courses/5` - 數位行銷策略
- `/courses/6` - 專案管理實戰

**Test Checklist**:
- [ ] Breadcrumb navigation displays correctly
- [ ] Course header shows title, category, level
- [ ] Rating, student count, duration, lessons display correctly
- [ ] "What you'll learn" section lists learning outcomes
- [ ] Complete syllabus displays with all sections and lessons
- [ ] Instructor bio section displays
- [ ] Sticky sidebar shows price and enroll button
- [ ] Course features list displays in sidebar
- [ ] Enroll button redirects to login if not authenticated
- [ ] Enrolled status shows after enrollment (TODO: API integration)

**Expected Result**: Complete course information with enrollment capability.

#### 5. User Profile (/profile)
**Test Checklist**:
- [ ] When not logged in: Redirects to `/auth/test`
- [ ] When logged in: Displays user profile card
- [ ] Shows user avatar, name, email
- [ ] Displays user role badge (student/instructor/admin)
- [ ] Shows "Member since" date
- [ ] Quick links to "My Learning" and "Browse Courses" work
- [ ] Profile info matches session data

**Expected Result**: Protected page showing user information.

#### 6. My Learning (/learning)
**Test Checklist**:
- [ ] When not logged in: Redirects to `/auth/test`
- [ ] When logged in: Displays progress summary cards
- [ ] Shows total courses, completed count, hours learned
- [ ] Enrolled courses list displays (currently mock data)
- [ ] Each course card shows progress bar with percentage
- [ ] Last accessed date displays correctly
- [ ] "Continue Learning" buttons are clickable
- [ ] Empty state shows when no courses enrolled

**Expected Result**: Learning dashboard with progress tracking (using mock data).

#### 7. Admin Dashboard (/admin)
**Test Checklist**:
- [ ] When not logged in: Redirects to `/auth/test`
- [ ] When logged in as student: Shows "Access Denied" (admin only)
- [ ] When logged in as admin: Displays full dashboard
- [ ] KPI cards show: total courses, students, revenue, rating
- [ ] Recent courses table displays
- [ ] Recent users table displays
- [ ] Quick action buttons are visible
- [ ] Links to /admin/courses and /admin/users (TODO)

**Expected Result**: Admin-only dashboard with statistics and management tools.

**Note**: To test admin functionality, you need to:
1. Sign in with Google
2. Manually update the user's role in Firestore to "admin"
3. Sign out and sign in again for session to update

#### 8. Navigation (All Pages)
**Test Checklist**:
- [ ] Logo links to homepage
- [ ] "課程" link navigates to /courses
- [ ] "我的學習" link navigates to /learning
- [ ] When logged out: "登入" button shows
- [ ] When logged in: User avatar shows in header
- [ ] Avatar dropdown shows profile and sign out options
- [ ] Admin users see "管理後台" link in dropdown
- [ ] Mobile menu (hamburger) works on small screens
- [ ] Navigation is consistent across all pages

**Expected Result**: Fully functional role-based navigation.

## Platform Pages

### 1. Homepage ([app/page.tsx](app/page.tsx))
Server component featuring:
- **Hero Section**: Gradient background with CTA buttons ("瀏覽課程" and "開始免費試用")
- **Featured Courses**: Top 6 courses by rating displayed in responsive grid
- **Features Section**: Three key platform benefits with icons
- **CTA Section**: Registration prompt for new users
- **Comprehensive Footer**: Links to resources, about, support sections

### 2. Courses Listing Page ([app/courses/page.tsx](app/courses/page.tsx))
Client component with advanced filtering:
- **Search Bar**: Full-text search across title, description, and tags
- **Filter Sidebar**:
  - Category filter (程式開發, 數據科學, 設計, 人工智慧, etc.)
  - Level filter (初級, 中級, 高級)
  - Price range filter (免費, NT$ 2,000以下, 2,000-3,000, 3,000以上)
- **Sort Options**: Popular, rating, newest, price (low to high, high to low)
- **Responsive Grid**: 1-3 columns depending on screen size
- **Course Cards**: Thumbnail, price, category, level, rating, student count, instructor
- **Empty State**: Helpful message when no courses match filters

### 3. Course Detail Page ([app/courses/[id]/page.tsx](app/courses/[id]/page.tsx))
Server component with dynamic routing:
- **Breadcrumb Navigation**: Home → Courses → Current Course
- **Course Header**: Title, category, level badges
- **Stats Row**: Rating with stars, student count, duration, lesson count
- **Instructor Info**: Avatar and name
- **What You'll Learn**: Bulleted list of learning outcomes
- **Complete Syllabus**: Expandable curriculum sections with lesson details
- **Instructor Bio**: Full instructor profile and credentials
- **Sticky Sidebar**: Price, enroll button, course features list
- **EnrollButton Component**: Client component handling enrollment with auth check

### 4. User Profile Page ([app/profile/page.tsx](app/profile/page.tsx))
Protected server component:
- **Authentication Check**: Redirects to login if not authenticated
- **Profile Card**: User avatar, name, email, role display
- **User Information**: Read-only form with member since date
- **Quick Links**: Navigate to My Learning and Browse Courses
- Uses `getServerSession` for server-side auth check

### 5. My Learning Page ([app/learning/page.tsx](app/learning/page.tsx))
Protected server component:
- **Authentication Check**: Redirects to login if not authenticated
- **Progress Summary**: Three stat cards (total courses, completed, hours learned)
- **Enrolled Courses List**: Cards with course info and progress bars
- **Progress Tracking**: Visual progress percentage and last accessed date
- **Continue Learning**: CTA buttons for each enrolled course
- **Empty State**: Friendly prompt to browse courses if none enrolled
- Mock data simulates user's enrolled courses

### 6. Admin Dashboard ([app/admin/page.tsx](app/admin/page.tsx))
Protected server component with role check:
- **Admin Role Check**: Only accessible to users with `role: "admin"`
- **KPI Cards**: Total courses, students, revenue, average rating
- **Course Management**: Table of recent courses with status and actions
- **User Management**: Table of recent users with role and registration date
- **Quick Actions**: Buttons for adding courses and managing users
- **TODO**: Links to full CRUD pages (/admin/courses, /admin/users)

### 7. Authentication Test Page ([app/auth/test/page.tsx](app/auth/test/page.tsx))
Server component for testing authentication:
- Shows login state (logged in or logged out)
- Displays user information when authenticated
- **SignInButton**: Client component with Google sign-in
- **SignOutButton**: Client component with sign-out functionality
- Useful for testing OAuth flow

## Data Structure

### Type Definitions

#### Course Types ([types/course.ts](types/course.ts))
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
  };
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;        // Total hours
  lessons: number;         // Total lessons
  rating: number;          // 0-5
  studentsEnrolled: number;
  syllabus: CourseSyllabus[];
  tags: string[];
  whatYouWillLearn: string[];
  requirements: string[];
  features: string[];
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

interface CourseSyllabus {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
    duration: number;
    preview: boolean;
  }[];
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number;        // 0-100
  completed: boolean;
  completedAt?: Date;
  lastAccessedAt: Date;
}

interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
```

#### User Types ([types/user.ts](types/user.ts))
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  bio?: string;
  createdAt: Date;
}

interface LearningProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLesson?: string;
  totalTimeSpent: number;  // minutes
  lastAccessedAt: Date;
}
```

### Mock Data ([lib/mock-data.ts](lib/mock-data.ts))

The platform includes realistic mock data for development:
- **6 Complete Courses** with Chinese content covering various categories
- **Course Categories**: 程式開發, 數據科學, 設計, 人工智慧, 行銷, 商業管理
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Complete Syllabus**: Each course has 3-4 sections with multiple lessons
- **Instructor Profiles**: Full bio and avatar for each instructor
- **Realistic Pricing**: Range from free to NT$ 3,999

Example courses:
1. React 完整開發指南 (程式開發, Intermediate)
2. Python 數據分析實戰 (數據科學, Beginner)
3. UI/UX 設計入門 (設計, Beginner)
4. 機器學習基礎課程 (人工智慧, Advanced)
5. 數位行銷策略 (行銷, Intermediate)
6. 專案管理實戰 (商業管理, Intermediate)

## Components

### Navbar ([components/Navbar.tsx](components/Navbar.tsx))
Responsive navigation component featuring:
- **Logo and Brand**: Links to homepage
- **Main Navigation**: Home, Courses, My Learning
- **Admin Menu**: Additional "管理後台" link visible only to admin users
- **User Menu**:
  - When logged out: "登入" button
  - When logged in: User avatar with dropdown (profile, admin, sign out)
- **Mobile Responsive**: Hamburger menu for small screens
- **Role-Based Display**: Checks session for user role
- Uses `useSession` hook from "next-auth/react"

## Image Configuration

Next.js is configured to allow images from:
- `lh3.googleusercontent.com` (Google profile pictures)
- `images.unsplash.com` (Course thumbnails)
- `api.dicebear.com` (Generated avatars)

Configure in [next.config.ts](next.config.ts) under `images.remotePatterns`.

## Future Extensions

This architecture is designed to be modular and extensible:

### Adding New Auth Providers
Edit [lib/auth.ts](lib/auth.ts) and add providers:
```typescript
import GitHub from "next-auth/providers/github";

providers: [
  Google({ ... }),
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }),
]
```

### Adding Custom User Data
1. Create API routes in `/app/api/` to handle data operations
2. Use `adminDb` from `lib/firebase-admin.ts`
3. Always validate the session before performing operations:
```typescript
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Perform Firebase operations here
  const data = await adminDb.collection('courses').get();
  return Response.json(data);
}
```

### Adding Role-Based Access Control
Extend the session callback in [lib/auth.ts](lib/auth.ts):
```typescript
callbacks: {
  async session({ session, user }) {
    // Fetch user role from Firestore
    const userDoc = await adminDb.collection('users').doc(user.id).get();
    const userData = userDoc.data();

    session.user.id = user.id;
    session.user.role = userData?.role || 'user';
    return session;
  },
}
```

## Important Reminders

1. **Never use client-side Firebase SDK** - All Firebase operations must go through Admin SDK
2. **Never commit `.env.local`** - It contains sensitive credentials
3. **Never commit service account JSON files** - They provide full admin access
4. **Always validate sessions** - Check user authentication before performing operations
5. **Use server components and server actions** - Keep authentication logic on the server

## Troubleshooting

### Authentication Issues

#### "UnknownAction" Error
**Solution**: This was resolved by downgrading from NextAuth v5 beta to v4 stable (v4.24.11). If you encounter this error, ensure you're using NextAuth v4 and not the v5 beta.

#### UntrustedHost Error
**Solution**: Set `AUTH_TRUST_HOST=true` in `.env.local`. This allows NextAuth to auto-detect the correct host URL, which is especially useful during development.

#### Session Not Persisting
**Possible Causes**:
- Browser cookies are blocked or cleared
- Firestore collections not created properly by the adapter
- NEXTAUTH_SECRET is missing or changed

**Solutions**:
1. Clear browser cookies and try again
2. Check Firestore console for `users`, `accounts`, `sessions` collections
3. Verify NEXTAUTH_SECRET is set in `.env.local`
4. Check browser console for detailed error messages

#### Google OAuth Redirect Issues
**Possible Causes**:
- Incorrect redirect URI in Google Cloud Console
- NEXTAUTH_URL mismatch

**Solutions**:
1. In Google Cloud Console, ensure authorized redirect URIs include:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
2. Remove `NEXTAUTH_URL` from `.env.local` if using `AUTH_TRUST_HOST=true`

### Image Loading Issues

#### Images Not Loading
Ensure the domain is added to [next.config.ts](next.config.ts) under `images.remotePatterns`:
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '**' },
    { protocol: 'https', hostname: 'images.unsplash.com', pathname: '**' },
    { protocol: 'https', hostname: 'api.dicebear.com', pathname: '**' },
  ],
}
```

### Firebase Connection Issues

#### "Firebase Admin SDK not initialized"
**Possible Causes**:
- Environment variables not set correctly
- Private key format issues

**Solutions**:
1. Verify all Firebase environment variables are set in `.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
2. Ensure private key has proper escaping: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
3. Check that the service account has the correct permissions in Firebase Console

#### Firestore Permission Denied
**Possible Causes**:
- Using client-side Firebase SDK (not allowed in this architecture)
- Admin SDK credentials are incorrect

**Solutions**:
1. Ensure you're using `adminDb` from `lib/firebase-admin.ts`, NOT client SDK
2. Verify service account has "Firebase Admin SDK Administrator Service Agent" role
3. Check Firebase Console for any security rules that might interfere

### Build Issues

#### "Module not found" Errors
**Solution**: Run `npm install` to ensure all dependencies are installed:
```bash
npm install
```

#### TypeScript Errors
**Solution**: Ensure all type definition files are in place:
- `types/course.ts`
- `types/user.ts`
- `types/next-auth.d.ts`

### Development Server Issues

#### Port Already in Use
**Solution**: Kill existing processes or use a different port:
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill

# Or use a different port
npm run dev -- -p 3001
```

## Build Status

### Latest Build
**Date**: 2025-10-14
**Status**: ✅ Success

```
Route (app)                         Size     First Load JS
┌ ○ /                               0 B           132 kB
├ ○ /_not-found                     0 B           123 kB
├ ƒ /admin                          0 B           132 kB
├ ƒ /api/auth/[...nextauth]         0 B             0 B
├ ƒ /auth/test                   6.06 kB          129 kB
├ ○ /courses                     4.72 kB          137 kB
├ ƒ /courses/[id]                 576 B           133 kB
├ ƒ /learning                       0 B           132 kB
└ ƒ /profile                        0 B           132 kB

○ (Static)   - prerendered as static content
ƒ (Dynamic)  - server-rendered on demand
```

**Total Pages**: 9
**Build Time**: ~8-10 seconds
**Warnings**: None (2 minor unused variable warnings resolved)

### Development Server
- **Command**: `npm run dev`
- **Port**: 3000 (configurable)
- **Turbopack**: Enabled for faster compilation
- **Hot Reload**: Working correctly

## Next Steps (Phase 3)

### High Priority
1. **Enrollment API**
   - Create `/api/enrollments` route
   - Implement enrollment logic with Firebase
   - Update EnrollButton to call API
   - Store enrollments in Firestore

2. **User Data Integration**
   - Replace mock learning progress with real Firebase queries
   - Implement user profile editing
   - Save user preferences

3. **Role Management**
   - Create admin interface for role assignment
   - Implement role-based access control middleware
   - Add instructor role functionality

### Medium Priority
4. **Course Management**
   - Create `/admin/courses` CRUD pages
   - Add course creation form
   - Implement course editing and deletion
   - File upload for course thumbnails

5. **User Management**
   - Create `/admin/users` management page
   - Implement user search and filtering
   - Add role assignment interface
   - User statistics and activity logs

6. **Reviews System**
   - Create reviews component
   - Add review submission form
   - Display reviews on course detail page
   - Calculate and update course ratings

### Low Priority
7. **Payment Integration**
   - Integrate Stripe/PayPal
   - Create checkout flow
   - Implement payment webhooks
   - Generate invoices

8. **Video Player**
   - Integrate video player (Video.js or custom)
   - Implement lesson viewing
   - Track video progress
   - Add video controls

9. **Advanced Features**
   - Email notifications (using SendGrid or similar)
   - Certificate generation upon completion
   - Course recommendations based on user interests
   - Full-text search with Algolia or Meilisearch
   - Analytics dashboard for instructors

## Development Workflow

### Making Changes
1. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test locally:
   ```bash
   npm run dev
   ```

3. **Build to check for errors**:
   ```bash
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style
- Use TypeScript for all new files
- Follow existing component structure
- Use Tailwind CSS for styling
- Keep components small and focused
- Write server components by default (use "use client" only when necessary)
- Always use Firebase Admin SDK (never client SDK)

### Testing Checklist Before Committing
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings (or justified)
- [ ] Tested in browser (all affected pages)
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Authentication still works
- [ ] No console errors
- [ ] `.env.local` not committed

## Resources

- [NextAuth.js v4 Documentation](https://next-auth.js.org/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For issues or questions:
1. Check this documentation first
2. Review the [Troubleshooting](#troubleshooting) section
3. Check browser console for errors
4. Review Firebase Console for data issues
5. Create an issue in the repository
