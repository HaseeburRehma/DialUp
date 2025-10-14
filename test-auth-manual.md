# Authentication Testing Guide

## Manual Testing Instructions

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Sign-up Endpoint

Use curl or a tool like Postman to test the signup endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "username": "testuser123",
    "password": "testpassword123",
    "email": "test@example.com"
  }'
```

**Expected Response:**
- Status: 201 Created
- Sets session cookie
- Returns success response

### 3. Test Sign-in Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "testpassword123"
  }'
```

**Expected Response:**
- Status: 200 OK
- Sets session cookie
- Returns: `{"status": 200, "message": "Sign in successful"}`

### 4. Test Duplicate Sign-up (Should Fail)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User 2",
    "username": "testuser123",
    "password": "differentpassword",
    "email": "different@example.com"
  }'
```

**Expected Response:**
- Status: 400 Bad Request
- Message: "Username unavailable. Please try a different one."

### 5. Test Invalid Sign-in

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
- Status: 401 Unauthorized
- Message: "Invalid username or password."

## Browser Testing

1. Navigate to your application in the browser
2. Use the sign-up form to create a new account
3. Use the sign-in form to log in
4. Verify that sessions are maintained across page refreshes

## Issues Resolved

✅ **Database Schema Synchronization**: Fixed unique constraint conflicts between schema definition and actual database state

✅ **Missing Imports**: Added missing H3 imports (`createError`, `defineEventHandler`, `readValidatedBody`, `setResponseStatus`)

✅ **Error Handling**: Updated error handling to work with both SQLite and D1 database error formats

✅ **Unique Constraints**: Properly configured unique constraints for username and email fields

✅ **Password Hashing**: Authentication utilities (`hashPassword`, `verifyPassword`, `setUserSession`) are properly imported from `nuxt-auth-utils`

## Common Issues and Solutions

### 1. "UNIQUE constraint failed" Error
- **Cause**: Trying to register with an existing username or email
- **Solution**: Use different credentials or implement proper error handling

### 2. Session Not Persisting
- **Cause**: Cookie settings or session configuration
- **Solution**: Check `nuxt-auth-utils` configuration

### 3. Database Connection Issues
- **Cause**: Database file locked or permissions
- **Solution**: Restart dev server, check file permissions

### 4. Schema Mismatch Errors
- **Cause**: Database schema doesn't match code schema
- **Solution**: Run database repair script or regenerate migrations
