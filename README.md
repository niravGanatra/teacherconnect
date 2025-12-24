# TeacherConnect

A **Teacher-Centric Professional Network & Job Board** where teachers have full privacy control and institutions can only interact with teachers who proactively apply to their listings.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (optional, SQLite used by default)

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers Pillow psycopg2-binary python-dotenv
python manage.py migrate
python manage.py createsuperuser  # Create admin user
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Seed Test Data
```bash
cd backend
source venv/bin/activate
python manage.py seed_data
```

To clear and reseed:
```bash
python manage.py seed_data --clear
```

Access the app at http://localhost:3000

---

## 🧪 Test Accounts

### Teacher Accounts
| Name | Email | Password | Specialization |
|------|-------|----------|----------------|
| Priya Sharma | `priya.sharma@email.com` | `teacher123` | Mathematics, Physics (12 yrs exp) |
| Rahul Kumar | `rahul.kumar@email.com` | `teacher123` | English Literature (8 yrs exp) |
| Ananya Gupta | `ananya.gupta@email.com` | `teacher123` | Physics, Chemistry (6 yrs exp) |
| Vikram Singh | `vikram.singh@email.com` | `teacher123` | History, Political Science (15 yrs exp) |
| Meera Nair | `meera.nair@email.com` | `teacher123` | Computer Science, AI/ML (5 yrs exp) |
| Amit Verma | `amit.verma@email.com` | `teacher123` | Economics, Business Studies (7 yrs exp) |

### Institution Accounts
| Institution | Email | Password | Type | Status |
|-------------|-------|----------|------|--------|
| Delhi Public School | `admin@delhipublic.edu` | `institution123` | School | ✅ Verified |
| St. Xavier's College | `admin@stxaviers.edu` | `institution123` | College | ✅ Verified |
| BITS Academy | `admin@bitsacademy.edu` | `institution123` | Coaching | ✅ Verified |
| Bangalore Intl. School | `admin@bangalore.edu` | `institution123` | School | ✅ Verified |
| JNV University | `admin@jnvu.edu` | `institution123` | University | ⏳ Pending |

### Seeded Data Includes
- **6 Teachers** with complete profiles (subjects, skills, education, experience)
- **5 Institutions** (4 verified, 1 pending verification)
- **8 Job Listings** (Full-time, Part-time, Remote positions)
- **18+ Applications** in various statuses (Pending, Reviewing, Shortlisted, etc.)
- **Saved Jobs** for each teacher
- **Follow Relationships** between teachers
- **15 Feed Posts** with comments and likes
- **6 Events** (Workshops, Webinars, Conferences, Meetups)

---

## 👥 User Roles

| Role | Capabilities |
|------|--------------|
| **Teacher** | Full access to Feed, Events, Job Browsing, Apply to Jobs |
| **Institution** | Profile management, Job Posting, view only their applicants |
| **Admin** | Global moderation, verification |

## 🔒 Privacy Model

- **Institutions cannot search/browse teachers globally**
- When a teacher applies to a job, an `ApplicationSnapshot` is created
- Institutions can ONLY view teacher details through these snapshots
- Teachers control their `is_searchable` visibility to other teachers

## 🛠 Tech Stack

**Backend:** Django, Django REST Framework, SimpleJWT, PostgreSQL/SQLite
**Frontend:** React, Tailwind CSS, Axios, React Router

## 📁 Project Structure

```
teacherConnect/
├── backend/
│   ├── accounts/       # Custom User, Auth, Permissions
│   ├── profiles/       # Teacher & Institution Profiles
│   ├── feed/           # Posts, Comments, Likes, Follows
│   ├── jobs/           # Job Listings, Applications, Snapshots
│   ├── events/         # Events, Attendance
│   └── config/         # Django Settings
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── context/    # Auth context
    │   ├── pages/      # Page components
    │   └── services/   # API service
    └── public/
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `GET /api/auth/me/` - Get current user

### Jobs
- `GET /api/jobs/` - List all jobs
- `GET /api/jobs/recommended/` - Get jobs matching teacher's subjects
- `POST /api/jobs/{id}/apply/` - Apply to a job (creates snapshot)
- `GET /api/jobs/my-listings/` - Institution's job listings

### Feed
- `GET /api/feed/` - Get personalized feed
- `POST /api/feed/posts/` - Create post
- `POST /api/feed/follow/{user_id}/` - Follow/unfollow user

## 🎨 Theme

Professional palette: **Navy Blue (#1e3a5f)**, **Slate Grey (#64748b)**, **White**
