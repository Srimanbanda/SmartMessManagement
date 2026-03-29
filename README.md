# 🎓 Smart Mess Management System

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS%20%7C%20Node.js%20%7C%20MySQL-orange)

A modern, professional, and comprehensive **Mess Management Solution** designed for academic institutions and universities. This system streamlines college cafeteria operations, offering distinct portals for robust administration and seamless student experiences. The UI guarantees a premium, glassmorphic aesthetic employing an institutional blue-gray palette.

---

## ✨ Features

### 🧑‍🎓 Client (Student) Portal
- **Secure Authentication**: Dedicated login for students using university credentials.
- **Dynamic Dashboard**: View real-time wallet balance (Coins) and personalized greetings.
- **Meal Planning**: Book 'Next Day' meals (Breakfast, Lunch, Snacks, Dinner) at specific mess halls.
- **Feedback System**: Interactive section to leave targeted feedback for recent meals.

### 🏛️ Admin Portal
- **Role-Based Access Control**: Differentiates between `College_Admin` (Registrations) and `Mess_Admin` (Menus/Bookings).
- **College Administration**:
  - Register new student accounts & assign secure RFID profiles.
  - Recharge and manage live student wallet balances.
- **Mess Administration**:
  - Publish distinct daily menus for multiple mess locations.
  - View, fetch, and analyze daily student bookings.
  - Monitor real-time feedback analytics.

---

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Glassmorphism, CSS Grid/Flexbox), Vanilla JavaScript.
- **Backend Environment**: Node.js (v18+ recommended)
- **API Framework**: Express.js
- **Database**: MySQL2
- **Other Tools**: `cors` for cross-origin requests, `dotenv` for environment management.

---

## 📁 Project Structure

```text
📦 SmartMessManagementTECHFEST
 ┣ 📂 admin               # Admin Portal Frontend
 ┃ ┣ 📜 admin.css         # Professional Academic CSS theme for admin
 ┃ ┣ 📜 admin.js          # Admin logic & API integration
 ┃ ┣ 📜 college-admin.html# College specific admin controls
 ┃ ┣ 📜 index.html        # Mess specific admin dashboard
 ┃ ┗ 📜 login.html        # Secure role-based admin login
 ┣ 📂 client              # Student/Client Portal Frontend
 ┃ ┣ 📂 css
 ┃ ┃ ┣ 📜 dashboard.css   # Glassmorphic student dashboard styles
 ┃ ┃ ┗ 📜 style.css       # Client login styling
 ┃ ┣ 📂 js
 ┃ ┃ ┣ 📜 dashboard.js    # Client dashboard interaction logic
 ┃ ┃ ┗ 📜 login.js        # Client authentication logic
 ┃ ┣ 📜 dashboard.html    # Student interactive dashboard
 ┃ ┗ 📜 index.html        # Student login page
 ┣ 📂 server              # Node.js backend environment
 ┃ ┣ 📂 config            # DB connectivity and configuration
 ┃ ┣ 📂 routes            # Express API route controllers
 ┃ ┣ 📜 app.js            # Main backend entry point
 ┃ ┗ 📜 package.json      # Backend dependency manifest
 ┣ 📜 .gitignore          # Git exclusion rules
 ┗ 📜 README.md           # Project documentation (You are here)
```

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

You will need the following installed on your local machine:
1. **[Node.js](https://nodejs.org/)** (v18.0.0 or higher)
2. **[MySQL](https://www.mysql.com/)** Server (v8.0+)
3. Git

### 1. Clone the repository
```bash
git clone https://github.com/Srimanbanda/SmartMessManagement
cd smart-mess-management
```

### 2. Configure the Database
- Create a MySQL database (e.g., `smart_mess_db`).
- Execute the SQL schema (located in your local setup/docs, if applicable) to provision the required tables (`students`, `admins`, `menus`, `bookings`, `feedback`).

### 3. Setup Backend Environment
- Navigate into the `server` directory:
  ```bash
  cd server
  ```
- Install backend dependencies:
  ```bash
  npm install
  ```
- Create a `.env` file in the `server` directory with your database credentials:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=your_mysql_password
  DB_NAME=smart_mess_db
  PORT=3000
  ```

### 4. Start the Application
- **Start the Server**:
  ```bash
  npm start
  ```
  *(The server will run on `http://localhost:3000`)*

- **Start the Frontend**:
  Since this uses Vanilla HTML/CSS/JS, you can simply spin up a local live server using tools like VSCode's **Live Server** extension or Python's `http.server`:
  ```bash
  # From the root directory:
  npx serve .
  ```
  - Access the Client Portal: `http://localhost:5000/client/index.html`
  - Access the Admin Portal: `http://localhost:5000/admin/login.html`

---

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the [issues page](https://github.com/your-username/smart-mess-management/issues).

---

<div align="center">
  <i>Developed for professional institutional efficiency by the Smart Mess Team.</i>
</div>
