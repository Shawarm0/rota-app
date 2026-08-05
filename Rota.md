# Rota Management Progressive Web App (PWA)

You are a senior full-stack software architect and engineer. Your job is to design and build a complete production-ready application, not just provide examples.

Whenever there are implementation decisions to make, choose the option that makes the application simpler, scalable and easier to maintain. Explain important architectural decisions briefly, but prioritise writing code over discussion.

---

# Project Overview

Build a modern Progressive Web App (PWA) that works beautifully on:

- iPhone (iOS)
- Android
- Desktop browsers

The app should be installable from the browser ("Add to Home Screen") and behave like a native mobile app.

The application consists of:

- Frontend (PWA)
- REST API backend
- Database
- Push notification service

The frontend and backend must be completely independent.

Backend will be deployed on Railway.

Frontend should be deployable on Vercel, Netlify or Cloudflare Pages without modification.

---

# Tech Stack

Use modern technologies unless there is a very good reason not to.

Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- TanStack Query
- React Hook Form
- Zustand (or similar lightweight state management)

Backend

- Node.js
- Express (or Fastify if preferred)
- TypeScript

Database

PostgreSQL

ORM

Prisma

Authentication

JWT with refresh tokens

Password hashing using bcrypt

Notifications

Web Push API

Firebase Cloud Messaging if required for Android support

PWA

- installable
- offline support where sensible
- service worker
- app manifest

UI

Create a modern, clean mobile-first design.

Use rounded cards, smooth animations, proper spacing and a professional colour palette.

Do not make it look like a typical admin template.

---

# Application Purpose

This is an internal rota management system for a small business.

The business manager creates employee rotas every two weeks.

Employees simply need to:

- view shifts
- request leave
- request shift swaps
- accept available shifts

The manager has complete control over schedules.

---

# User Roles

## System Admin

Very limited.

Responsibilities:

- create managers
- create businesses
- maintenance

The system admin is us (developers).

---

## Manager

Managers can:

Create employees

Disable employees

Reset passwords

Create rotas

Edit rotas

Delete rotas

Approve holidays

Reject holidays

View swap requests

Approve completed swaps

See statistics

See notifications

Assign shifts

View shift history

See all available shifts

View who accepted which shifts

See total shifts worked

See additional shifts

See swapped shifts

Export rota to PDF

Export rota to CSV

---

## Employee

Employees can:

Login

View rota

View upcoming shifts

View future rotas

Request holiday

Cancel holiday request

Request shift swap

Accept available shifts

Receive notifications

Edit their own profile

Change password

View previous shifts

---

# Authentication

Secure login.

JWT authentication.

Refresh tokens.

Role-based authorisation.

Protected API routes.

Rate limiting.

Validation.

Audit logging for manager actions.

---

# Rota System

Rotas are published every two weeks.

Managers should be able to create future rotas months ahead.

Employees only see published rotas.

Draft rotas are hidden.

Once a rota is published:

Every employee receives a push notification.

Example:

"Your rota for 14 Aug - 28 Aug has been published."

---

# Shift Structure

Each shift should contain:

Date

Start time

Finish time

Location (optional)

Notes

Employee

Status

Statuses include:

Assigned

Additional Shift

Swap Shift

Holiday

Requested Holiday

Available

Cancelled

These should all have distinct colours.

---

# Holiday Requests

Employee requests holiday.

Manager receives notification.

Manager dashboard shows pending requests.

Manager can:

Approve

Reject

When approved:

The employee's calendar marks that day as Holiday.

The original shift (if one exists) becomes Available.

Available shifts appear in a Shift Pot.

Everyone except the employee can claim it.

When claimed:

The employee who accepted receives an Additional Shift.

The manager sees this instantly.

Both users receive notifications.

---

# Shift Swap Requests

Employee requests to swap one of their assigned shifts.

That shift enters the Swap Pool.

Another employee can accept it.

When accepted:

The original employee loses that shift.

The accepting employee receives it.

The shift should be labelled as:

Swap Shift

Manager receives notification.

Manager can optionally approve swaps before becoming final (design this so approval can easily be enabled or disabled via configuration).

---

# Shift Pot

The shift pot displays:

Available shifts

Swap shifts

Date

Time

Location

Notes

Claim button

Prevent users from claiming their own shift.

Prevent duplicate claims.

Prevent conflicts with existing shifts.

---

# Manager Dashboard

Dashboard should include:

Pending holiday requests

Pending swap requests

Upcoming rota releases

Staff availability

Weekly staffing overview

Shifts needing cover

Additional shifts

Swap statistics

Holiday statistics

Total shifts worked

Hours worked

Employee summary cards

Recent activity

Notification centre

---

# Calendar

Employees should have a clean calendar view.

Colour coding:

Blue = Assigned

Green = Additional

Purple = Swapped

Yellow = Holiday Requested

Red = Holiday Approved

Grey = Available Shift

Clicking a shift opens full details.

---

# Notifications

Push notifications should be sent for:

Rota published

Holiday approved

Holiday rejected

Shift accepted

Shift available

Swap accepted

Swap completed

Manager receives notifications for:

Holiday requests

Swap requests

Shift claims

---

# Database Design

Design a proper relational schema including:

Users

Roles

Businesses

Rotas

Shifts

Holiday Requests

Swap Requests

Notifications

Push Tokens

Audit Logs

Sessions

Use Prisma migrations.

---

# API

Build a REST API.

Include:

Authentication

User management

Shift management

Holiday endpoints

Swap endpoints

Notification endpoints

Dashboard endpoints

Statistics endpoints

Use proper HTTP status codes.

Include OpenAPI documentation.

---

# Frontend

Use responsive layouts.

Bottom navigation on mobile.

Sidebar on desktop.

Pages should include:

Login

Dashboard

Calendar

My Shifts

Available Shifts

Holiday Requests

Notifications

Settings

Manager Dashboard

Employees

Rota Builder

Reports

---

# Rota Builder

The rota builder should be extremely easy to use.

Requirements:

Drag-and-drop assignment

Copy previous rota

Duplicate week

Bulk assign shifts

Templates

Warnings for understaffing

Warnings for overlapping shifts

Warnings for employee holidays

Publish button

Draft mode

Undo support where practical.

---

# Reporting

Manager can view:

Hours per employee

Additional shifts

Swap count

Holiday usage

Monthly reports

CSV export

PDF export

---

# Security

Use:

Helmet

CORS

Rate limiting

Validation

Parameterized queries via Prisma

Secure JWT storage

Refresh tokens

Password hashing

Role checks

Audit logging

Environment variables

Do not expose secrets.

---

# Deployment

Backend:

Railway

Frontend:

Should work without modification on:

- Vercel
- Netlify
- Cloudflare Pages

Provide:

Dockerfile

docker-compose

Railway configuration

Environment variable examples

---

# Code Quality

Requirements:

Strict TypeScript

ESLint

Prettier

Modular architecture

Reusable components

Repository pattern where appropriate

Unit tests

Integration tests

Clean folder structure

Avoid unnecessary complexity.

---

# Deliverables

Build the project incrementally.

1. Design the architecture.

2. Create the database schema.

3. Build backend.

4. Build frontend.

5. Build authentication.

6. Build rota management.

7. Build notifications.

8. Build reporting.

9. Build deployment configuration.

Do not stop after scaffolding.

Continue implementing until the application is production-ready.

Whenever possible, generate complete code rather than pseudocode.

If assumptions are needed, make sensible engineering decisions rather than asking unnecessary questions.