# Software Requirements Specification (SRS)

## Student Task Management System — Vibe Coding Practice Project

**Version:** 1.0  
**Project Type:** Full-Stack Web Application  
**Purpose:** Vibe Coding Practice Project

---

# 1. Introduction

## 1.1 Project Overview

The **Student Task Management System** is a web-based application that allows students to manage their daily academic and personal tasks.

A student should be able to:

- Create tasks
- View tasks
- Update tasks
- Delete tasks
- Mark tasks as completed
- Set task priority
- Set due dates
- Filter and search tasks
- View basic task statistics

The purpose of this project is to practice responsible AI-assisted development:

> Understand requirements → break work into modules → prompt AI → review generated code → test → debug → improve.

---

# 2. Problem Statement

Students often maintain their tasks using notebooks, messages, or multiple applications.

There is a need for a simple application where a student can maintain all academic and personal tasks in one place.

Examples:

- Complete Java assignment
- Practice 2 DSA questions
- Prepare for interview
- Complete React project
- Attend class
- Submit assignment

---

# 3. Project Objectives

1. Build a functional full-stack web application.
2. Demonstrate frontend, backend, and database integration.
3. Implement authentication and authorization.
4. Implement complete task CRUD operations.
5. Implement validation, search, filtering, and error handling.
6. Practice structured AI-assisted/vibe coding.

---

# 4. Scope

## 4.1 In Scope

- User registration
- User login
- Authentication
- Task creation
- Task listing
- Task update
- Task deletion
- Task completion
- Task priority
- Task due date
- Task search
- Task filtering
- Dashboard statistics

## 4.2 Out of Scope

- Chat system
- Social login
- Email notifications
- Push notifications
- Payment system
- AI task generation
- Team collaboration
- File uploads
- Calendar synchronization
- Mobile application

These can be added later as future enhancements.

---

# 5. Users

## Student

A student can:

- Register
- Login
- Create tasks
- View own tasks
- Update own tasks
- Delete own tasks
- Complete own tasks
- Search own tasks
- Filter own tasks
- View own statistics

A student must **not** be able to access another student's tasks.

---

# 6. Functional Requirements

## FR-01: User Registration

The system must allow a new student to create an account.

### Required fields

- Name
- Email
- Password

### Validation

- Name is required
- Email is required
- Email must have a valid format
- Password is required
- Password must contain at least 6 characters
- Email must be unique

### Expected behavior

If registration succeeds:

- User account is created
- Appropriate success response is returned

If registration fails:

- Appropriate error message is displayed

---

## FR-02: User Login

The student must be able to log in using:

- Email
- Password

### Expected behavior

If credentials are correct:

- User is authenticated
- Authentication token/session is created
- User can access protected features

If credentials are incorrect:

- Login must fail
- Appropriate error message must be displayed

---

## FR-03: Authentication

Task-related APIs must be protected.

A user must be authenticated before accessing their tasks.

The backend must identify the currently logged-in user.

The system must ensure:

> Student A cannot access Student B's tasks.

Authentication should be handled on the backend rather than relying only on frontend checks.

---

## FR-04: Create Task

A student can create a task.

### Task fields

| Field | Required | Description |
|---|---|---|
| Title | Yes | Task name |
| Description | No | Detailed information |
| Priority | Yes | LOW / MEDIUM / HIGH |
| Due Date | No | Task deadline |
| Status | Yes | TODO / IN_PROGRESS / COMPLETED |

The system should automatically associate the task with the currently authenticated student.

---

## FR-05: View Tasks

The student should be able to see all of their tasks.

Each task should display:

- Title
- Description
- Priority
- Status
- Due date
- Created date
- Updated date

Tasks belonging to other students must not appear.

---

## FR-06: Update Task

A student should be able to update their own task.

The student should be able to modify:

- Title
- Description
- Priority
- Due date
- Status

The system should update the task's updated timestamp.

---

## FR-07: Delete Task

A student should be able to delete their own task.

Before deletion, the frontend should preferably ask for confirmation.

Example:

> Are you sure you want to delete this task?

If confirmed, the task should be permanently removed.

---

## FR-08: Complete Task

The user should have an easy way to mark a task as completed.

Example:

```text
[ ] Complete Java Assignment

        ↓

[✓] Complete Java Assignment
```

When a task is completed:

```text
status = COMPLETED
```

---

## FR-09: Search Tasks

The student should be able to search tasks by title.

Example:

Search:

```text
Java
```

Possible results:

```text
Complete Java Assignment
Practice Java Collections
Java Interview Preparation
```

Search should not expose tasks belonging to other users.

---

## FR-10: Filter Tasks

The user should be able to filter tasks by:

### Status

- All
- TODO
- IN_PROGRESS
- COMPLETED

### Priority

- All
- LOW
- MEDIUM
- HIGH

The user should be able to combine filters.

Example:

```text
Status: TODO
Priority: HIGH
```

This should display only high-priority incomplete tasks.

---

## FR-11: Dashboard

After login, the student should see a simple dashboard.

The dashboard should display:

### Total Tasks

Number of all tasks.

### Pending Tasks

Number of tasks that are not completed.

### Completed Tasks

Number of completed tasks.

### High Priority Tasks

Number of high-priority tasks.

Example:

```text
-----------------------------------------
        Student Task Dashboard
-----------------------------------------

Total Tasks       Pending       Completed
    20               12              8

High Priority: 4
-----------------------------------------
```

---

## FR-12: Task Sorting

The application should support sorting tasks.

Possible sorting options:

- Newest first
- Oldest first
- Due date
- Priority

The exact UI implementation can be decided during development.

---

# 7. Database Requirements

The application should use a relational database.

## Users Table

```text
users

id
name
email
password
created_at
updated_at
```

## Tasks Table

```text
tasks

id
user_id
title
description
priority
status
due_date
created_at
updated_at
```

### Relationship

One user can have many tasks.

```text
User
 |
 | 1
 |
 |------< Many
           |
          Task
```

The `user_id` field should establish the relationship between a task and its owner.

---

# 8. API Requirements

The backend should expose REST APIs.

## Authentication APIs

### Register

```http
POST /api/auth/register
```

### Login

```http
POST /api/auth/login
```

## Task APIs

### Get Tasks

```http
GET /api/tasks
```

### Get Single Task

```http
GET /api/tasks/:id
```

### Create Task

```http
POST /api/tasks
```

### Update Task

```http
PUT /api/tasks/:id
```

### Delete Task

```http
DELETE /api/tasks/:id
```

### Complete/Update Status

```http
PATCH /api/tasks/:id/status
```

The implementation may choose whether status changes use a dedicated endpoint or the normal update API.

---

# 9. API Response Requirements

The API should return consistent responses.

### Successful response

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {}
}
```

### Error response

```json
{
  "success": false,
  "message": "Task not found"
}
```

The exact response structure can be improved during implementation.

---

# 10. Validation Requirements

Validation must happen on the backend.

Frontend validation can also be implemented for better user experience.

Examples:

### Invalid task

```text
Title: empty
```

Expected:

```text
Title is required
```

### Invalid priority

```text
priority = VERY_HIGH
```

Expected:

```text
Invalid priority
```

### Unauthorized task access

If User A attempts to access User B's task:

```text
403 Forbidden
```

or another appropriate secure response.

---

# 11. Frontend Requirements

## 11.1 Login Page

Fields:

- Email
- Password
- Login button

Link:

```text
Don't have an account? Register
```

---

## 11.2 Registration Page

Fields:

- Name
- Email
- Password
- Confirm Password

Button:

```text
Create Account
```

---

## 11.3 Dashboard Page

The dashboard should contain:

- Navigation/header
- Statistics cards
- Task list
- Search
- Filters
- Create Task button

Example:

```text
------------------------------------------------
 Student Task Manager                         Logout
------------------------------------------------

 Total: 20     Pending: 12     Completed: 8

 [ Search tasks... ] [Status] [Priority]

                              + Create Task

------------------------------------------------
 Task                         Priority   Status
------------------------------------------------

 Complete Java Assignment     HIGH       TODO
 React Project                MEDIUM     IN_PROGRESS
 DSA Practice                 HIGH       COMPLETED
------------------------------------------------
```

---

## 11.4 Create/Edit Task UI

The form should contain:

- Title
- Description
- Priority dropdown
- Status dropdown
- Due date
- Save button
- Cancel button

The same form can be reused for creating and editing tasks.

---

# 12. Loading States

The frontend must show a loading state when waiting for an API response.

Example:

```text
Loading tasks...
```

or a spinner/skeleton.

The application should not appear frozen while waiting for the backend.

---

# 13. Error Handling

The application must handle common errors.

Examples:

### Network error

```text
Unable to connect to server.
Please try again.
```

### Unauthorized

```text
Your session has expired.
Please login again.
```

### Task not found

```text
Task not found.
```

### Validation error

```text
Please check the entered information.
```

---

# 14. Security Requirements

The application should follow basic security practices.

### Password

Passwords must never be stored as plain text.

Passwords should be securely hashed.

### Authentication

Protected APIs must require authentication.

### Authorization

A user can only access their own tasks.

### Input Validation

User input must be validated on the backend.

### Sensitive Information

Passwords and authentication secrets must not be exposed in API responses.

---

# 15. Project Architecture

The project should be separated into logical layers.

Example:

```text
Frontend
   |
   | HTTP/API
   ↓
Backend
   |
   ├── Routes
   ├── Controllers
   ├── Services
   ├── Validation
   └── Database Layer
          |
          ↓
       Database
```

The exact architecture is intentionally not prescribed.

Students should decide how to organize the code and discuss their decision with the instructor.

---

# 16. Environment Configuration

Sensitive configuration should not be hardcoded.

Examples:

```text
DATABASE_URL
JWT_SECRET
API_URL
PORT
```

These should be stored using environment variables.

An example environment file should be provided:

```text
.env.example
```

Actual secrets must not be committed to Git.

---

# 17. Git Requirements

Students should use Git.

Suggested commits:

```text
Initial project setup
Add authentication
Add task APIs
Add task UI
Add search and filters
Add dashboard
Add validation
Fix authentication issues
Improve UI
```

Students should avoid putting the entire project into one giant commit.

---

# 18. Testing Requirements

Students should test the application manually and/or using automated tests.

## Authentication

- Register successfully
- Register with existing email
- Login successfully
- Login with incorrect password

## Tasks

- Create task
- View tasks
- Update task
- Delete task
- Complete task

## Authorization

- User cannot access another user's task

## Validation

- Empty title
- Invalid email
- Short password
- Invalid priority
- Invalid status

## Search

- Search existing task
- Search non-existing task

## Filters

- Filter by status
- Filter by priority
- Combine filters

---

# 19. Acceptance Criteria

The project will be considered complete when:

- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Authentication works
- [ ] User can create tasks
- [ ] User can view tasks
- [ ] User can update tasks
- [ ] User can delete tasks
- [ ] User can complete tasks
- [ ] Search works
- [ ] Status filter works
- [ ] Priority filter works
- [ ] Dashboard statistics work
- [ ] Backend validates requests
- [ ] User cannot access another user's tasks
- [ ] Passwords are securely stored
- [ ] Errors are handled properly
- [ ] Loading states are implemented
- [ ] Environment variables are used
- [ ] Code is organized
- [ ] Project runs successfully from a clean setup

---

# 20. UI Expectations

The UI should be:

- Clean
- Responsive
- Easy to understand
- Consistent
- Mobile-friendly
- Accessible where practical

Avoid unnecessary animations and complicated design.

The primary goal is functionality and maintainable code.

---

# 21. Recommended Technology Stack

Students may use the following stack:

| Layer | Recommended Options |
|---|---|
| Frontend | React, JavaScript/TypeScript, CSS/Tailwind/Material UI |
| Backend | Node.js + Express / Java + Spring Boot / Go + Gin |
| Database | PostgreSQL / MySQL |
| Authentication | JWT / Secure sessions |
| Version Control | Git + GitHub |

Students should understand the technology they choose rather than blindly copying AI-generated code.

---

# 22. Vibe Coding Rules

This project is specifically designed to practice responsible AI-assisted development.

Students should **NOT** start with:

```text
"Build the complete application for me."
```

Instead, they should break the project into smaller tasks.

Example:

```text
I need to build a student task management system.

First help me design the backend architecture.
Do not write code yet.

Explain:
1. Modules
2. Database tables
3. API structure
4. Authentication flow
5. Folder structure

Wait for my confirmation before generating code.
```

---

# 23. AI Interaction Guidelines

When using AI, students should follow this cycle:

```text
Requirement
    ↓
Understand
    ↓
Break into Task
    ↓
Prompt AI
    ↓
Generate
    ↓
Read the Code
    ↓
Run
    ↓
Test
    ↓
Debug
    ↓
Review
    ↓
Improve
```

The AI should be treated as a development assistant, not as a replacement for understanding.

---

# 24. Example Vibe Coding Task Breakdown

## Step 1 — Understand the SRS

```text
Analyze the SRS and identify the backend modules.
Do not write code.
```

## Step 2 — Database Design

```text
Design the database schema for users and tasks.

Explain:
1. Tables
2. Columns
3. Relationships
4. Constraints
5. Indexes that may be useful

Do not generate application code.
```

## Step 3 — Authentication

```text
Create the authentication module.

First explain the implementation plan.
Then generate the code.

Use the existing project architecture.
Do not modify unrelated modules.
```

## Step 4 — Task APIs

```text
Implement task CRUD APIs.

Use the existing authentication architecture.
A user must only access their own tasks.

Do not modify unrelated modules.
```

## Step 5 — Frontend

```text
Create the task dashboard UI.

Use the existing task APIs.
Keep the UI responsive.

First explain the component structure.
Then implement it.
```

## Step 6 — Code Review

```text
Review the current implementation for:

1. Security problems
2. Authorization problems
3. Validation issues
4. Error handling issues
5. Performance problems
6. Code quality issues

Do not change the code yet.
List the issues first.
```

## Step 7 — Fix

```text
Fix only the issues identified above.

Do not refactor unrelated code.
Explain what was changed and why.
```

---

# 25. Important Vibe Coding Principle

> **AI-generated code is not automatically correct code.**

For every generated feature, students should ask:

```text
What problem does this code solve?

Why is this approach being used?

What assumptions does this code make?

What can go wrong?

How can I test it?

What happens in an edge case?
```

---

# 26. Final Deliverables

Each student must submit:

## 1. Source Code

GitHub repository containing:

```text
frontend/
backend/
README.md
.env.example
```

## 2. README

The README should explain:

- Project overview
- Features
- Technology stack
- Installation
- Environment variables
- Database setup
- How to run frontend
- How to run backend
- API overview

## 3. API Documentation

Document:

- Endpoint
- HTTP method
- Request body
- Authentication requirement
- Response
- Possible errors

## 4. Screenshots

Provide screenshots of:

- Login
- Registration
- Dashboard
- Create task
- Edit task
- Filters
- Completed task

## 5. Short Demo

Student should demonstrate:

```text
Register
   ↓
Login
   ↓
Create Task
   ↓
View Task
   ↓
Update Task
   ↓
Filter/Search
   ↓
Complete Task
   ↓
Dashboard Statistics
```

---

# 27. Future Enhancements

After completing Version 1, students can optionally add:

- Email reminders
- Recurring tasks
- Calendar integration
- Task categories
- Tags
- Dark mode
- Notifications
- Admin dashboard
- Team tasks
- AI task suggestions
- AI-generated task summaries
- Mobile application

These features are intentionally outside the first version.

---

# 28. Final Goal

The purpose of this project is **not simply to finish an application using AI**.

The student should learn how to:

1. Read an SRS.
2. Convert requirements into technical tasks.
3. Break a large problem into small problems.
4. Communicate effectively with AI.
5. Review AI-generated code.
6. Understand generated code.
7. Test the implementation.
8. Debug failures.
9. Improve architecture.
10. Deliver a working software product.

The final question every student should be able to answer is:

> **"If the AI disappeared, could I explain and maintain the code I built?"**

If the answer is yes, the student is practicing **good vibe coding**.
