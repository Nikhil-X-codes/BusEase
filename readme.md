# 🚌 BusEase – Your Easy Bus Booking Companion

**BusEase** is a MERN-stack bus ticket booking web application that allows users to search buses, select seats, and simulate payments using debit card details. The system includes authentication, bus search, seat selection, payment form (UI only), and a booking confirmation page. 

**Note:** This version does **not** handle real payments.
---

## 🚀 Key Features

- **User Authentication** – Sign up & Login with JWT.
- **Bus Search** – Filter by origin, destination, and date.
- **Bus Listing** – View available buses with details.
- **Seat Selection** – Interactive visual seat map.
- **Payment Simulation** – Debit card UI 
- **Booking Confirmation** – Summary of booking with masked card number.
- **Responsive UI** – Works on desktop and mobile devices.
- **Form Validation** – Basic input validation for better user experience.

---

## 🛠 Tech Stack

- MongoDb (Mongoose)
- React(Vite)
- Express.js
- Node.js
---

## 📦 Key Libraries

### 👉 **Dependencies (For production)**
| Package         | Description                           |
|-----------------|---------------------------------------|
| `bcrypt`        | Password hashing                      |
| `cloudinary`    | Cloud storage for video/image assets  |
| `cookie-parser` | Parses cookies in request headers     |
| `dotenv`        | Loads environment variables           |
| `jsonwebtoken`  | JWT-based user authentication         |
| `mongoose`      | ODM for MongoDB                       |
| `multer`        | Middleware for file uploads           |
|  `axios`        | Connects frontend and backend         |


## 📁 Project Structure

```
BusEase/
├── client/            # React Frontend
├── server/            # Node + Express Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── utils/
├── .env               # Environment variables
├── .gitignore
└── README.md

```
# Step 1: Clone the repository
git clone https://github.com/Nikhil-X-codes/BusEase.git

# Step 2: Backend setup
cd BusEase/server
npm install
touch .env   # Add environment variables here

# Step 3: Frontend setup
cd ../client
npm install

# Step 4: Run the app

# Start backend
cd ../server
npm run dev

# Start frontend
cd ../client
npm start

```
