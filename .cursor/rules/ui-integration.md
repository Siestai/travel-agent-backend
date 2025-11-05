# UI Integration Guide - How the Frontend Works

## Overview
This document explains how the `travel-ui` (Next.js frontend) integrates with the backend API. Use this guide when working on backend features that need frontend integration.

## Frontend Technology Stack

### Core Technologies
- **Framework**: Next.js 16 (App Router)
- **React**: React 19
- **TypeScript**: TypeScript 5+
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth v5 (beta)
- **Package Manager**: pnpm

### Frontend Architecture
- **Pages**: Located in `src/pages/` - named export components
- **Components**: Organized in `src/components/` by atomic design:
  - `molecules/` - Small reusable components
  - `organisms/` - Complex composite components
  - `templates/` - Layout templates
  - `providers/` - Context providers
- **API Routes**: Located in `src/app/api/`
- **Types**: Located in `src/types/api/`

## Authentication Flow

### OAuth Flow
1. User clicks "Sign in with Google/Apple" on login page
2. NextAuth redirects to OAuth provider
3. User authorizes application
4. OAuth provider redirects to `/oauth/callback`
5. NextAuth creates session and stores tokens
6. Frontend calls backend `/api/auth/login` with email
7. Backend creates/returns user
8. User is redirected to home page

### Session Management
- Sessions stored in JWT (configured in `src/auth.ts`)
- Session includes: `id`, `email`, `accessToken`, `refreshToken`
- Session expiry: 30 days (default) or `OAUTH_EXPIRY_DAYS` env var
- Protected routes use `AuthGuard` component

### Backend Integration
```typescript
// Frontend calls backend after OAuth success
const response = await fetch(`${backendUrl}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: session.user.email }),
});
```

## API Communication Patterns

### Base URL Configuration
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
```

### Standard Fetch Pattern
```typescript
const response = await fetch(`${backendUrl}/api/endpoint`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || "Request failed");
}

const result = await response.json();
```

### Error Handling
- Frontend checks `response.ok` status
- Parses error response JSON: `{ code, status, message }`
- Displays error messages to user
- Handles 404, 400, 401, 500 errors appropriately

## API Endpoints Used by Frontend

### Authentication
- **POST** `/api/auth/login`
  - Called after OAuth callback
  - Body: `{ email: string }`
  - Response: User object

### User Management
- **GET** `/api/user/:email`
  - Fetches user by email
  - Used to check Drive connection status
  - Response: User object with `drive_connected`, `drive_root_folder_id`

- **POST** `/api/user/connect-drive`
  - Connects Google Drive after OAuth
  - Body: `{ email, access_token, refresh_token }`
  - Response: Updated user object

- **POST** `/api/user/exchange-drive-token`
  - Exchanges OAuth code for tokens
  - Body: `{ code, redirect_uri }`
  - Response: `{ access_token, refresh_token }`

- **POST** `/api/user/disconnect-drive`
  - Disconnects Google Drive
  - Body: `{ email }`
  - Response: Updated user object

### Travel Management
- **POST** `/api/travel`
  - Creates new travel
  - Body: `{ user_id, name, friends: string[] }`
  - Response: Travel object

- **GET** `/api/travel/user/:userId`
  - Fetches all travels for user
  - Response: `Travel[]`

- **GET** `/api/travel/:id`
  - Fetches travel by ID with documents
  - Response: Travel object with nested documents

- **PATCH** `/api/travel/:id`
  - Updates travel (e.g., sets `drive_folder_id`)
  - Body: `{ drive_folder_id?: string }`
  - Response: Updated travel object

- **GET** `/api/travel/check-name-unique`
  - Checks if travel name is unique for user
  - Query: `?user_id=xxx&name=yyy`
  - Response: `{ unique: boolean }`

- **POST** `/api/travel/create-folder`
  - Creates Google Drive folder for travel
  - Body: `{ email, travel_name }`
  - Response: `{ folder_id: string }`

### Document Management
- **POST** `/api/document/upload`
  - Uploads files (multipart/form-data)
  - Body: `files[]`, `email`, `travel_id`
  - Response: `Document[]`

- **GET** `/api/document/travel/:travelId`
  - Fetches documents for travel
  - Response: `Document[]`

- **GET** `/api/document/:id`
  - Fetches document by ID
  - Response: Document object

- **DELETE** `/api/document/:id`
  - Deletes document
  - Response: Success/error

## Frontend Type Definitions

### Type Creation Pattern
Frontend creates TypeScript types from backend DTOs:

```typescript
// Backend DTO
export class CreateTravelDto {
  @IsString() @IsNotEmpty() user_id: string;
  @IsString() @IsNotEmpty() name: string;
  @IsArray() @IsNotEmpty() friends: string[];
}

// Frontend Type
export interface CreateTravelRequest {
  user_id: string;
  name: string;
  friends: string[];
}

export interface Travel {
  id: string;
  user_id: string;
  name: string;
  friends: string[];
  start_date?: string;
  end_date?: string;
  drive_folder_id?: string;
  created: string;
  updated: string;
  documents?: Document[];
}
```

### Type Organization
- Types stored in `src/types/api/{feature}.ts`
- Separate request/response types
- Use `interface` for object shapes
- Dates are strings (ISO format) in API responses

## Page Components

### HomePage (`src/pages/HomePage.tsx`)
- Displays user's travels
- Shows Drive connection status
- Redirects to login if not authenticated

### CreateTravelPage (`src/pages/CreateTravelPage.tsx`)
- Multi-step travel creation flow
- Creates Google Drive folder (optional)
- Validates travel name uniqueness
- Creates travel in backend

### DocumentsPage (`src/pages/DocumentsPage.tsx`)
- Lists travels (requires Drive connection)
- Shows documents for selected travel
- File upload functionality
- Delete document functionality

### TravelHistoryPage (`src/pages/TravelHistoryPage.tsx`)
- Lists all user's travels
- Shows travel dates and duration
- Links to travel details

### TravelDetailsPage (`src/pages/TravelDetailsPage.tsx`)
- Shows travel details
- Lists associated documents
- Can update travel dates

### DocumentDetailsPage (`src/pages/DocumentDetailsPage.tsx`)
- Shows document details
- Displays document metadata
- Delete document functionality

## Component Patterns

### Session Usage
```typescript
"use client";
import { useSession } from "next-auth/react";

export function Component() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Please sign in</div>;
  
  const email = session?.user?.email;
  // Use email for API calls
}
```

### API Call Pattern
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`${backendUrl}/api/endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Request failed");
    }
    
    const result = await response.json();
    // Handle success
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
};
```

## Google Drive Integration

### OAuth Flow
1. User clicks "Connect Google Drive"
2. Frontend redirects to Google OAuth consent screen
3. User authorizes application
4. Google redirects to `/oauth/drive/callback`
5. Frontend exchanges code for tokens via backend
6. Backend stores tokens and creates Drive folder
7. Frontend updates UI to show Drive connected

### Drive Folder Structure
- Root: "Siestai Travel" folder (created on first connection)
- Subfolders: One folder per travel (named after travel)

### File Upload Flow
1. User selects files in UI
2. Files sent to `/api/document/upload` as multipart/form-data
3. Backend uploads to Google Drive
4. Backend creates document records
5. Frontend refreshes document list

## Error Handling Patterns

### Backend Error Format
```json
{
  "code": "NOT_FOUND",
  "status": 404,
  "message": "User not found"
}
```

### Frontend Error Handling
```typescript
try {
  const response = await fetch(url);
  
  if (!response.ok) {
    // Handle client errors (400-499)
    if (response.status >= 400 && response.status < 500) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Client error");
    }
    
    // Handle server errors (500+)
    if (response.status >= 500) {
      const errorData = await response.json();
      console.error("Server error:", errorData);
      throw new Error(errorData.message || "Server error");
    }
  }
  
  return await response.json();
} catch (error) {
  console.error("API error:", error);
  // Display error to user
}
```

## State Management

### React Context
- `AuthProvider` - Wraps app with NextAuth SessionProvider
- `SidebarContext` - Manages sidebar collapse state
- Custom hooks: `useSidebar()`, `useSession()`

### Local State
- `useState` for component-specific state
- `useEffect` for data fetching
- Session storage for multi-step flows (e.g., travel creation)

## Routing

### Next.js App Router
- Pages: `src/app/{route}/page.tsx`
- API Routes: `src/app/api/{route}/route.ts`
- Layouts: `src/app/layout.tsx`

### Protected Routes
- Uses `AuthGuard` component
- Redirects to `/login` if not authenticated
- Checks session before rendering content

## Environment Variables

Frontend requires:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: `http://localhost:4000`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `APPLE_ID` - Apple OAuth client ID
- `APPLE_SECRET` - Apple OAuth client secret
- `AUTH_SECRET` - NextAuth session encryption secret

## Development Considerations

### CORS
- Backend must have CORS enabled (configured in `main.ts`)
- Frontend runs on different port (default: 3000)
- Backend runs on port 4000

### API Response Format
- Backend returns JSON for all endpoints
- Success responses: 200-299 status codes
- Error responses: `{ code, status, message }` format

### Date Handling
- Backend sends dates as ISO strings
- Frontend can parse to Date objects when needed
- Display dates using `toLocaleDateString()` or date libraries

### File Upload
- Frontend uses `FormData` for file uploads
- Backend uses `FilesInterceptor` with Multer
- Support multiple files: `FilesInterceptor('files', 10)`

## Best Practices for Backend Development

When adding new backend features:

1. **Follow RESTful conventions** - Use appropriate HTTP methods
2. **Validate input** - Use DTOs with class-validator
3. **Return consistent formats** - Use DTOs for responses
4. **Handle errors properly** - Use AppError with standard codes
5. **Add logging** - Log important operations
6. **Document endpoints** - Update this guide if needed
7. **Test with frontend** - Ensure frontend can consume API
8. **Consider CORS** - Ensure endpoints are accessible from frontend
9. **Use appropriate status codes** - 200, 201, 400, 401, 404, 500
10. **Include relations** - Use `relations` option when frontend needs nested data

## Common Frontend Requests

### Pagination
- Currently not implemented
- Consider adding pagination for list endpoints

### Filtering/Sorting
- Currently not implemented
- Consider adding query parameters for filtering

### Real-time Updates
- Currently not implemented
- Consider WebSockets or polling for updates

### Batch Operations
- File upload supports multiple files
- Consider batch create/update/delete endpoints

