# Student Assignment Tracker

CPAN 314 - Project Development I - Project - Group 5: Bolos Bolos, Ibrahim
Hagi, Tsering Lama, Dustin Nguyen, Kaynaan Nuur, and Brandon Pagani Lozano.

CPAN 324 - Project Development II - Project - Group 1: Bolos Bolos, Dustin
Nguyen, and Kaynaan Nuur.

Student Assignment Tracker is an academic management web app that helps
students manage coursework and improve their academic grades. It aims to help
students balance deadlines, assignment weights, and grades across courses, and
to give advisors visibility into who may be falling behind. Planned features
include deadline prioritization, grade prediction, GPA tracking, course
messaging, and notifications. The app is a work in progress.

## Requirements

- Node.js 22.12 or newer
- npm

## Install and configure

From the repository root, install the dependencies:

```sh
npm install
```

Create a local environment file by copying `.env.example` to `.env`, then set
`JWT_SECRET` to a long, private random value. For example:

```sh
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

`PORT` defaults to `8001`. `VITE_API_URL` defaults to
`http://localhost:8001`. `EMAIL_USER` and `EMAIL_PASS` are optional and only
needed to send registration welcome emails; for Gmail, use an app password
rather than an account password.

## Run the app

Open two terminals at the repository root. Start the API in the first:

```sh
npm run server
```

Start the Vite development server in the second:

```sh
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The API
health endpoint is available at `http://localhost:8001/api/health`.

## Tests and build

Run the API route tests:

```sh
npm test
```

Create a production frontend build:

```sh
npm run build
```

## API routes currently wired

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/profile` | Authenticated |
| `GET` | `/api/assignments` | Authenticated |
| `GET` | `/api/assignments/:id` | Authenticated |
| `POST` | `/api/assignments` | Teacher or admin |
| `PUT` | `/api/assignments/:id` | Teacher or admin |
| `DELETE` | `/api/assignments/:id` | Teacher or admin |
| `GET` | `/api/users` | Admin |
| `GET` | `/api/users/:id` | Admin |

Send protected API requests with `Authorization: Bearer <token>`. Message,
notification, announcement, and analytics screens/routes are still works in
progress and are not part of the currently wired API server.

## Data model and persistence

The wired API currently uses in-memory JavaScript arrays; it does not connect to
a database. Data is lost whenever the server restarts. The active record shapes
are:

### User

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | string | Generated when the user registers |
| `email` | string | Used to sign in |
| `password` | string | Bcrypt hash; never returned by the API |
| `firstName` | string | Required at registration |
| `lastName` | string | Required at registration |
| `role` | string | Defaults to `student`; routes also support `teacher` and `admin` |

### Assignment

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Generated when the assignment is created |
| `title` | string | Required |
| `description` | string | Defaults to an empty string |
| `studentId` | string | Student associated with the assignment |
| `dueDate` | string/date value | Required |
| `createdBy` | string | ID of the creating teacher/admin |
| `status` | string | Starts as `assigned`; can be updated |

Some model files and UI features describe future MongoDB-backed features, but
there is no configured database connection or persistence layer in the
currently wired server.

## Phase II team submission

Each team member must complete and submit their own self-assessment form; a
task distribution sheet is not a substitute. Team members should also make
regular commits throughout the phase from their own GitHub accounts. These are
individual/team workflow requirements and cannot be completed on a member's
behalf by changing this repository.
