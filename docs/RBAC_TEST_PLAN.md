# RBAC Feature Verification Test Plan

## Overview
Test plan for verifying Role-Based Access Control across Student, Teacher, and Institution_Admin roles.

---

## 1. Segregation of Duty Tests

### 1.1 Student Role Restrictions
| Test ID | Description | Expected | Endpoint |
|---------|-------------|----------|----------|
| SD-001 | Student cannot access job creation | 403 Forbidden | `POST /api/jobs/` |
| SD-002 | Student cannot access institution dashboard | 403 Forbidden | `GET /institution/dashboard` |
| SD-003 | Student cannot view applicants | 403 Forbidden | `GET /api/jobs/:id/applications/` |
| SD-004 | Student cannot create courses | 403 Forbidden | `POST /api/courses/instructor/courses/` |
| SD-005 | Student CAN apply to jobs | 201 Created | `POST /api/jobs/:id/apply/` |

### 1.2 Teacher Role Restrictions
| Test ID | Description | Expected | Endpoint |
|---------|-------------|----------|----------|
| TD-001 | Teacher cannot manage institution | 403 Forbidden | `PATCH /api/institutions/:id/` |
| TD-002 | Teacher cannot view other's applicants | 403 Forbidden | `GET /api/jobs/:id/applications/` |
| TD-003 | Teacher CAN create courses | 201 Created | `POST /api/courses/instructor/courses/` |
| TD-004 | Teacher CAN apply to jobs | 201 Created | `POST /api/jobs/:id/apply/` |

### 1.3 Institution Role Restrictions
| Test ID | Description | Expected | Endpoint |
|---------|-------------|----------|----------|
| IR-001 | Institution cannot apply to jobs | 403 Forbidden | `POST /api/jobs/:id/apply/` |
| IR-002 | Institution cannot enroll in courses | 403 Forbidden | `POST /api/courses/:slug/enroll/` |
| IR-003 | Institution CAN create jobs | 201 Created | `POST /api/jobs/` |
| IR-004 | Institution CAN view their applicants | 200 OK | `GET /api/jobs/:id/applications/` |

---

## 2. Data Integrity Tests

### 2.1 Course Ownership
| Test ID | Description | Expected |
|---------|-------------|----------|
| DI-001 | Course created by Teacher A appears in marketplace | Course visible in `/api/courses/` |
| DI-002 | Course is editable only by owner (Teacher A) | 200 OK for owner, 403 for others |
| DI-003 | Other teachers cannot edit the course | 403 Forbidden |
| DI-004 | Admin can edit any course | 200 OK |

### 2.2 Job Ownership
| Test ID | Description | Expected |
|---------|-------------|----------|
| DI-005 | Job created by Institution A is editable only by them | 403 for other institutions |
| DI-006 | Applications visible only to job owner | 403 for non-owners |

---

## 3. Critical Flow Tests

### 3.1 Student Flow
```
Register -> Browse Jobs -> Apply -> Check "My Applications"
```

| Step | Action | Endpoint | Validation |
|------|--------|----------|------------|
| 1 | Register as student | `POST /api/auth/register/` | Returns tokens, user_type='TEACHER' |
| 2 | Search jobs | `GET /api/jobs/?search=teacher` | Returns job list |
| 3 | Apply to job | `POST /api/jobs/:id/apply/` | 201 Created |
| 4 | Check applications | `GET /api/jobs/my-applications/` | Applied job appears |

### 3.2 Institution Flow
```
Register -> Create Profile -> Post Job -> View Applicants
```

| Step | Action | Endpoint | Validation |
|------|--------|----------|------------|
| 1 | Register as institution | `POST /api/auth/register/` | user_type='INSTITUTION' |
| 2 | Update profile | `PATCH /api/profiles/institution/` | Profile updated |
| 3 | Post job | `POST /api/jobs/` | 201 Created, job has owner |
| 4 | View applicants | `GET /api/jobs/:id/applications/` | Returns applicant list |
| 5 | Update status | `PATCH /api/applications/:id/` | Status changed |

### 3.3 Teacher/Instructor Flow
```
Register -> Upload Demo -> Create Course -> Student Completes -> Certificate Generated
```

| Step | Action | Endpoint | Validation |
|------|--------|----------|------------|
| 1 | Register as teacher | `POST /api/auth/register/` | user_type='TEACHER' |
| 2 | Upload demo video | `PATCH /api/profiles/teacher/` | demo_video_url saved |
| 3 | Create course | `POST /api/courses/instructor/courses/` | Course created |
| 4 | Add sections/lessons | `POST /api/courses/instructor/courses/:id/sections/` | Sections added |
| 5 | Publish course | `PATCH /api/courses/instructor/courses/:id/` | is_published=true |
| 6 | Student enrolls | `POST /api/courses/:slug/enroll/` | Enrollment created |
| 7 | Student completes | `PATCH /api/courses/lesson/:id/progress/` | 100% triggers certificate |
| 8 | Certificate generated | - | Certificate record exists |

---

## 4. Navigation RBAC Tests

### 4.1 Sidebar Visibility
| Role | Should See | Should NOT See |
|------|------------|----------------|
| Student | Feed, My Learning, Jobs Hub, Events, Profile | School Dashboard, Posted Jobs, Course Studio |
| Teacher | Feed, My Learning, Jobs Hub, Events, Profile | School Dashboard, Posted Jobs |
| Instructor | Feed, My Learning, Jobs Hub, Course Studio, My Courses | School Dashboard, Posted Jobs |
| Institution | Feed, School Dashboard, Manage School, Posted Jobs, Applicants, Events, Profile | My Learning, Jobs Hub |
| Admin | Admin Dashboard, Users, Institutions, Jobs, Content | Regular user items |

---

## 5. API Security Tests

### 5.1 Authentication
| Test ID | Description | Expected |
|---------|-------------|----------|
| AS-001 | Access protected endpoint without token | 401 Unauthorized |
| AS-002 | Access with expired token | 401 Unauthorized |
| AS-003 | Token refresh works | New access token returned |

### 5.2 Authorization
| Test ID | Description | Expected |
|---------|-------------|----------|
| AZ-001 | Access resource owned by another user | 403 Forbidden |
| AZ-002 | IDOR test: Change ID in URL | 403 or 404 |

---

## Cypress Test Template

```javascript
describe('RBAC Segregation Tests', () => {
  context('Student Role', () => {
    beforeEach(() => {
      cy.login('student@test.com', 'password');
    });

    it('SD-001: Cannot create job', () => {
      cy.request({
        method: 'POST',
        url: '/api/jobs/',
        body: { title: 'Test Job' },
        failOnStatusCode: false
      }).its('status').should('eq', 403);
    });

    it('SD-005: Can apply to job', () => {
      cy.request({
        method: 'POST',
        url: '/api/jobs/1/apply/',
        body: { cover_letter: 'Test' }
      }).its('status').should('eq', 201);
    });
  });
});
```
