🎓 Sobat Stemanika — Backend

Official backend for the Student Council (OSIS) & MPK Election System of SMKN 1 Majalengka — also known as Sobat Stemanika.

This backend powers the website used by students to view candidates, read visions & missions, and cast their official vote online.
It ensures a secure, fast, and transparent digital election process.

🚀 What Is Sobat Stemanika?

Sobat Stemanika is a modern digital voting platform that replaces manual ballot-based elections.
The system is designed to make the election of OSIS & MPK:

More transparent

More efficient

Free from vote manipulation

Easy to access for all students

The backend provides:

Student authentication

Candidate listing

One-vote-per-category validation

Real-time vote counting

Admin tools for managing candidates

🔧 Technologies Used

Node.js + Express — REST API

Supabase Auth — User authentication

Supabase Database — Candidates, votes, extracurriculars

JWT — Secure authorization

🗳️ Key Features
🔐 1. Student Authentication

Students log in using their Supabase email + password.
Account roles include student or admin.

🧑‍🎓 2. Anti–Double Voting System

Each student can vote only once per election category
(example: ketua_osis, ketua_mpk).

Any second vote attempt is blocked with 409 Conflict.

Votes are saved instantly and counted automatically.

🧑‍🏫 3. Candidate Management (Admin)

Admins are able to:

Create new candidates

Delete candidates

Update candidate information (optional)

Candidate data includes photo, vision, mission, and more.

📊 4. Real-Time Election Results

A public endpoint provides aggregated vote results.
Perfect for displaying live dashboards during election day.

📁 Project Structure (Simplified)
server/
│── routes/         # API endpoints
│── middleware/     # Auth protection
│── services/       # Supabase + business logic
│── utils/          # Helpers
│── server.js       # Entry point
│── swagger.js      # Optional documentation
.env
package.json

⚙️ How to Run
npm install
npm run dev


Server runs at:

http://localhost:3000


Configure your Supabase credentials in .env.

🌐 Deployment

You can deploy this backend to:

Railway / Render / Fly.io — easiest for Express

Vercel (serverless) — requires minor adjustments

Docker — for enterprise or production environments

👑 Admin Access

Admins are created manually via Supabase dashboard.

🙌 About This Project

Sobat Stemanika was built to support the digital transformation of student elections at SMKN 1 Majalengka.
This system ensures elections that are:

modern

secure

fair

transparent

real-time monitored