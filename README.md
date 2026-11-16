# Student Assignment Tracker
CPAN 314 - Project Development I - Student Assignment Tracker - Project - By Group 5 - Bolos Bolos, Ibrahim Hagi, Tsering Lama, Dustin Nguyen, Kaynaan Nuur, and Brandon Pagani Lozano

CPAN 324 - Project Development II - Student Assignment Tracker - Project - By Group 1 - Bolos Bolos, Dustin Nguyen, and Kaynaan Nuur

This project expands on where it left off from CPAN 314 - Project Development I.

Student Assignment Tracker is an academic management web application that helps students manage coursework and improve on their academic grades. Students struggle to balance deadlines, especially with weights and grades spanning across many courses, and most advisors have little to no visibility into who is falling behind. This system lets students add and track assignments for their courses, adds deadline prioritization, grade prediction, GPA tracking, course messaging, notifications, and improves outcomes. 

Currently in a work in progress.

## Installation Guide 

#### Login/Registration authentication page and adding and tracking student assignments

Run the frontend with `npm run dev` and the API with `npm run server`. Vite + React frontend will show a link for frontend work with `http://localhost:5173`.  The API
defaults to `http://localhost:8001` for backend; set `VITE_API_URL` if it is hosted elsewhere.

You will now be directed to the login/register authentication page or the home page if successfully signed in or registered.

Students as users can register or sign in from the login and register account page screen. A successful authentication stores the returned JWT and user profile in browser
`localStorage` as `token` and `user`. Signing out removes both values. User
accounts (including bcrypt-hashed passwords) are saved locally in
`server/data/users.json` so they remain available after an API restart.

Authenticated students can create assignments through `POST /api/assignments`.
The API for Student Assigent Tracker stores the title, course, weight, due date, status, and grade, and
associates the assignment with the student ID from the verified JWT rather than
trusting a client-supplied owner ID. Assignment data is currently stored in the MongoDB database for the back-end. 

#### Testing Plan 

Run `npm test` to execute both test layers - 1. Vitest and React component tests and 2. Express API tests.
Run `npm run test:unit` for Vitest unit and React component tests in jsdom; 
Run `npm run test:integration` for Express API tests against an in-memory MongoDB, without requiring a local database. 
The API tests for Student Assignment Tracker cover registration/login, assignment validation and ownership, and dashboard responses.
The frontend tests cover grade/priority calculations, API request behavior, and assignment-card rendering.

## Deployment Plan 
We will deploy our project using GitHub Pages:
Our deployed project site is: 
`https://bolosbolosgithub416.github.io/StudentAssignmentTracker/`


