# Rota System

A full-stack Progressive Web App for managing employee work rotas (schedules). Built for small businesses to handle shift scheduling, holiday requests, shift swaps, and team management across Manager and Employee roles.

## Live Demo

**https://gfrsoftware.app**

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | `demo-manager@demo.app` | `demoapp123` |
| Employee | `employee1@demo.app` | `demoapp123` |
| Employee | `employee2@demo.app` | `demoapp123` |
| Employee | `employee3@demo.app` | `demoapp123` |

## Features

### Manager
- **Rota Builder**: Create and publish weekly rotas with a drag-and-drop grid interface
- **Employee Management**: Add, edit, activate/deactivate employees and manage store locations
- **Dashboard**: View labour hours, staffing overview, and pending requests at a glance
- **Shifts to Cover**: Review and reassign uncovered shifts
- **Holiday Approvals**: Approve or reject employee holiday requests
- **Reports**: View hours worked per employee with date range filtering

### Employee
- **Dashboard**: See upcoming shifts and quick links to key actions
- **Calendar**: Monthly view of all assigned shifts, colour-coded by status
- **My Shifts**: List of upcoming and past shifts with details
- **Shift Pot**: Claim available shifts or pick up swapped shifts
- **Holidays**: Request time off and track approval status
- **Notifications**: Stay updated on schedule changes and request outcomes

### General
- **PWA**: Installable on mobile devices with home screen icon support
- **Responsive Design**: Sliding sidebar on mobile, fixed sidebar on desktop
- **Real-time Polling**: Automatic notification updates every 30 seconds

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS v4
- **State Management**: Zustand (auth/UI) + TanStack Query (server state)
- **Routing**: React Router v6
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT access/refresh tokens
- **Deployment**: Vercel (frontend), Railway (backend)
