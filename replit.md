# Overview

This is a full-stack web application for managing guild/legion boss timers and member rosters in what appears to be a gaming context. The application tracks boss spawns, respawn timers, member information, and provides notifications for upcoming boss spawns. It's built as a modern single-page application with a RESTful API backend.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a dark theme configuration
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: Custom toast system and browser push notifications

The frontend follows a component-based architecture with pages organized by feature (dashboard, bosses, members, history, settings). Components are split between UI components (in components/ui) and feature-specific components. The app uses a layout wrapper that provides navigation and shared functionality.

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with conventional HTTP methods
- **Data Storage**: In-memory storage with an interface-based design for easy database swapping
- **Development**: Vite middleware integration for hot reloading in development
- **Error Handling**: Centralized error handling middleware

The backend uses a repository pattern with a storage interface that currently implements in-memory storage but can be easily swapped for a database implementation. Routes are organized by resource type (bosses, members, activities).

## Data Models
The application manages three main entities:
- **Bosses**: Boss information including name, level, location, respawn times, status, and visual customization
- **Members**: Guild member data with name, level, class, role, and online status
- **Activities**: Event log for tracking boss kills, spawns, and member changes

All models use UUID identifiers and include timestamp tracking for activities.

## Real-time Features
- **Timer Updates**: Client-side timers that update every second for boss respawn countdowns
- **Progress Tracking**: Visual progress bars showing boss respawn progress
- **Browser Notifications**: Push notifications for imminent boss spawns
- **Auto-refresh**: Periodic data fetching to keep information current

## External Dependencies

### Database
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect configured
- **PostgreSQL**: Primary database (configured but not currently used - app uses in-memory storage)
- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)

### UI and Styling
- **Radix UI**: Comprehensive set of accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for building variant-based component APIs

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Static type checking across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment integration with cartographer and error overlay plugins

### Utilities
- **Date-fns**: Date manipulation and formatting
- **Zod**: Runtime type validation and schema definition
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management with caching and synchronization