# TIMERYX

Advanced SaaS platform for project management, time tracking, and team collaboration.

## Features

- ⏱️ **Unique Timer System** - Only one active timer at a time, automatic switching
- 📊 **Budget Tracking** - Monthly hour budgets with real-time alerts
- 👥 **Multi-tenant Workspaces** - Role-based access (Admin/Member/Client)
- 📋 **Flexible Task Views** - Table, Kanban, and Calendar views
- 💬 **Real-time Chat** - Task-specific messaging with live updates
- 🔐 **Client Portal** - Dedicated portal for external clients
- 📈 **Reports & Export** - CSV/PDF reports with custom filters

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with RLS
- **State**: Zustand, React Query
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the database schema:

- Go to your Supabase dashboard
- Navigate to SQL Editor
- Copy and paste the contents of `schema.sql`
- Execute the script

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
TIMERYX/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn components
│   ├── layout/           # Layout components
│   ├── tasks/            # Task views
│   ├── timer/            # Timer components
│   └── ...
├── lib/                   # Utilities and config
│   ├── supabase/         # Supabase clients
│   ├── stores/           # Zustand stores
│   ├── hooks/            # Custom hooks
│   └── utils/            # Utility functions
└── schema.sql            # Database schema
```

## Key Concepts

### Unique Timer Logic

The system ensures only ONE active timer per user:
- Starting a new timer automatically stops the previous one
- The `active_timer_id` in the user profile tracks the current timer
- Uses RPC functions `start_timer()` and `stop_timer()`

### Budget Tracking

Projects have monthly hour budgets:
- Real-time calculation of hours consumed
- Automatic alerts when exceeding budget
- Visual indicators (green → yellow → red)

### Role-Based Access

Three user roles with different permissions:
- **Admin**: Full access to workspace
- **Member**: Can view/edit tasks and track time
- **Client**: Read-only access to visible projects, can send messages

### Client Portal

Dedicated portal at `/portal/[project-id]`:
- Only shows projects marked as `is_client_visible`
- Read-only task view
- Chat functionality for communication
- Budget and progress overview

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

## Database Schema

The complete database schema is in `schema.sql` and includes:

- **Tables**: profiles, workspaces, workspace_members, projects, tasks, time_entries, messages, notifications
- **RLS Policies**: Role-based security at database level
- **RPC Functions**: Business logic for timer and budget calculations
- **Triggers**: Automatic notifications and timestamp updates

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
