# Nexus Platform Issues Fix TODO

## Tasks
- [x] Update backend/src/services/socketService.js to import Message model and save messages to database on send_message event
- [x] Ensure saved message is emitted to clients with correct data
- [x] Update mark_read event to update database when messages are marked as read
- [x] Add missing message API endpoints to frontend configuration
- [x] Fix EntrepreneursPage.tsx undefined 'entrepreneurs' variable by adding data fetching
- [x] Fix CORS issue for avatar images by updating Cross-Origin-Resource-Policy headers
- [x] Restart backend server to apply CORS header changes
- [ ] Test avatar image loading and messaging functionality

## Progress
- Analyzed messaging functionality and identified issue: messages not persisted to database
- Plan approved by user
- Updated send_message handler to save messages to database and emit saved message
- Updated mark_read handler to update database when messages are marked as read
- Added messageAPI endpoints to src/config/api.ts for conversation fetching, unread counts, etc.
- Fixed EntrepreneursPage.tsx by adding entrepreneurs state, useEffect for data fetching, and loading/error handling
- Fixed CORS issue for avatar images by overriding security headers for /uploads route
- Backend server needs restart to apply the new CORS headers
