# Blood Bank Management System

A full-stack Blood Bank Management System for managing donors, hospitals, blood laboratories, blood inventory, blood requests, approvals, and blood transfers through a role-based web application.

## Features

* Donor registration and authentication
* Donor profile and donation history
* Hospital registration and admin approval
* Blood-lab registration and admin approval
* Role-based authentication and authorization
* Admin dashboard and facility management
* Blood-lab blood inventory management
* Hospital blood requests
* Blood request approval and processing
* Blood stock transfer from blood lab to hospital
* Blood availability and blood search
* Donor search
* Donation camp management
* Protected API routes using JWT authentication
* MongoDB database with Mongoose
* Swagger/OpenAPI API documentation

## User Roles

### Donor

Donors can:

* Register and log in
* Manage their profile
* View eligibility information
* View donation history
* View available donation camps

### Hospital

Approved hospitals can:

* Manage their profile
* View blood availability
* Search donors
* View approved blood laboratories
* Submit blood requests
* Manage hospital blood inventory

### Blood Lab

Approved blood laboratories can:

* Manage blood stock
* Search donors
* Manage donation camps
* View hospital blood requests
* Accept or reject blood requests
* Transfer available blood stock to approved hospitals

### Admin

Administrators can:

* Access the admin dashboard
* View system statistics
* Manage hospitals and blood laboratories
* Approve or reject facility registrations
* Manage donor information
* Monitor system activity

## Main Workflow

1. A donor registers directly in the system.
2. A hospital or blood laboratory registers with a pending status.
3. An administrator reviews the facility registration.
4. The administrator approves or rejects the facility.
5. Approved blood laboratories add and manage blood inventory.
6. Approved hospitals search for available blood.
7. A hospital submits a blood request to an approved blood laboratory.
8. The blood laboratory reviews and accepts or rejects the request.
9. When accepted, available blood stock is transferred from the laboratory to the hospital.
10. Authorized users can access role-specific dashboards and functionality.

## Authentication & Authorization

The application uses JWT-based authentication and role-based authorization.

* JWT tokens are generated after successful authentication.
* Authenticated requests use the `Authorization: Bearer <token>` header.
* Protected backend routes validate the JWT.
* Role-based middleware restricts access to appropriate resources.
* Admin routes require administrator authorization.
* Hospital routes require an approved hospital account.
* Blood-lab routes require an approved blood-lab account.
* Facility accounts cannot access the system until approved by an administrator.
* Unauthorized users receive appropriate authentication or authorization responses.

## Technology Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Fetch API
* Tailwind CSS
* Framer Motion
* Lucide React
* React Hot Toast
* React Toastify

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token (`jsonwebtoken`)
* bcryptjs
* CORS
* Swagger UI
* swagger-jsdoc

## Project Structure

```text
blood-bank-management-system/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── openapi/
│   ├── scripts/
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── utils/
│
├── docker-compose.yml
├── LICENSE
├── CONTRIBUTING.md
├── .gitignore
└── README.md
```

## Screenshots

Screenshots of the deployed application will be added after deployment.

## Local Setup

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git
* MongoDB or MongoDB Atlas

### Clone the Repository

```bash
git clone https://github.com/ShivamBraja123/blood-bank-management-system.git
cd blood-bank-management-system
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory.

Configure the required environment variables, including your MongoDB connection string and JWT secret.

Start the backend:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

### Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

If an explicit API URL is required, create:

```text
frontend/.env
```

and configure:

```text
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Environment Variables

Never commit environment variables or credentials to GitHub.

Typical backend configuration includes:

```text
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Use the environment variables required by the actual backend configuration.

For production deployment, configure secrets through the hosting platform rather than committing them to the repository.

## Development Admin

The project includes a development-only admin seed setup for local testing.

Configure the development admin credentials locally and run the available admin seed command from the `backend` directory.

Example:

```bash
npm run seed:admin
```

Development administrator credentials must remain private and must never be committed to GitHub or exposed in a public deployment.

## API Overview

The backend provides REST API route groups for the main application functionality.

| Route            | Purpose                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| `/api/auth`      | Registration, login, and authenticated profile                                |
| `/api/donor`     | Donor profile, statistics, camps, and donation history                        |
| `/api/facility`  | Facility profile, dashboard, and approved laboratory lookup                   |
| `/api/hospital`  | Hospital inventory, donor access, and blood requests                          |
| `/api/blood-lab` | Blood-lab dashboard, camps, inventory, donor search, and request processing   |
| `/api/admin`     | Admin dashboard, facility approval, facility management, and donor management |
| `/api/doc`       | Swagger UI and API documentation                                              |

Protected endpoints require a valid JWT bearer token.

Hospital and blood-lab endpoints additionally require an approved facility with the correct facility type.

## Database

The application uses MongoDB with Mongoose.

MongoDB can be hosted locally or through MongoDB Atlas.

Configure the database connection using the backend environment variables.

Example:

```text
MONGO_URI=your_mongodb_connection_string
```

Database credentials and connection strings must never be committed to the repository.

## Security

The application includes:

* JWT authentication
* Password hashing using bcryptjs
* Protected API routes
* Role-based authorization
* Facility approval workflow
* Admin-only routes
* Hospital-specific authorization
* Blood-lab-specific authorization
* Environment-based secret management

For production deployment:

* Use HTTPS.
* Use strong JWT secrets.
* Store credentials using deployment-platform environment variables.
* Never expose MongoDB credentials.
* Never expose development administrator credentials.
* Keep role-based authorization enabled.

## Testing & Verification

The application has been verified through the following end-to-end flows:

* Donor registration and login
* Donor dashboard and session persistence
* Hospital registration and admin approval
* Hospital login and dashboard
* Blood-lab registration and admin approval
* Blood-lab login and dashboard
* Admin login and dashboard
* Blood search
* Blood availability
* Blood inventory management
* Hospital blood requests
* Blood-lab request approval
* Blood stock transfer
* JWT authentication
* Protected routes
* Role-based authorization
* Logout and session persistence

A complete hospital-to-blood-lab blood request workflow was also verified, including transfer of blood stock from the laboratory to the hospital.

## Future Improvements

Possible future improvements include:

* Automated frontend and backend test suites
* Advanced search and filtering
* Pagination for larger datasets
* Detailed admin reports
* Audit logs
* Notifications for blood requests
* Improved transaction handling for concurrent inventory updates
* Production monitoring and logging
* Automated CI/CD deployment

## License

This project is distributed under the MIT License.

See the [LICENSE](LICENSE) file for details.

## Author

**Shivam Bhudhiraja**

GitHub: [ShivamBraja123](https://github.com/ShivamBraja123)

Repository: [Blood Bank Management System](https://github.com/ShivamBraja123/blood-bank-management-system)
