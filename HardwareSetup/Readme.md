# 📡 Smart Mess Management System – System Analysis

## 🧠 Overview
This project implements an **offline-first, dual-node meal verification and feedback system** using a single ESP32.  
It manages two independent dining halls:

- 🍽️ **Mess_A**
- 🍽️ **Mess_B**

Students interact with the system using **RFID cards**:
- First tap → Meal consumption verification  
- Second tap → Provide feedback (⭐ 1–5 rating)

---

## ⚙️ Core Features

### ⏱️ Time-Shifted Simulation
- Uses a **21-minute accelerated cycle** to simulate a full day.
- Dynamically determines the current meal using `detectMeal()`.
- Supports:
  - Breakfast
  - Lunch
  - Snacks
  - Dinner

---

### 🔄 State Machine Architecture
Each mess operates independently using a `MessController` structure.

#### States:
- `IDLE` → Waiting for RFID input  
- `SHOWING_MSG` → Displaying verification/status messages  
- `AWAITING_RATING` → Waiting for user feedback  

✔ Ensures smooth, non-blocking flow for both mess units.

---

### 🌐 Offline-First Resilience
- Fetches approved RFID users via **HTTP GET** when Wi-Fi is available.
- If Wi-Fi fails:
  - Uses **locally stored data** for verification
  - Queues:
    - Meal consumption logs
    - Feedback ratings

#### 💾 Data Persistence:
- Uses **LittleFS (Flash Memory)** to:
  - Store queued data
  - Survive power loss or system reboot

---

### 🔀 Cross-Mess Verification
- Detects if a student taps at the **wrong mess**.
- Automatically:
  - Identifies assigned mess
  - Displays redirection message

✔ Prevents misuse and ensures proper allocation.

---

### 🔁 Non-Blocking Hardware Polling
- Main `loop()` continuously monitors:
  - 📶 Wi-Fi status  
  - 🪪 RFID scans  
  - 🔘 Button inputs  

✔ Avoids `delay()` (except during initialization)  
✔ Ensures **real-time responsiveness** for both readers

---

## 🧩 Key Components

- **ESP32 Microcontroller**
- **RFID Readers (Dual Setup)**
- **Wi-Fi Module**
- **LittleFS (Flash Storage)**
- **Buttons / Input Interface**
- **Buzzer (for alerts/feedback)**

---

## 🚀 Highlights

- ✅ Dual mess handling on a single controller  
- ✅ Offline-first architecture  
- ✅ Fault-tolerant data storage  
- ✅ Real-time, non-blocking system  
- ✅ Integrated feedback mechanism  

---

## 📌 Use Case

Designed for:
- College hostels 🏫  
- Mess automation systems 🍛  
- Smart campus infrastructure 🌐  

---

## 🔮 Future Improvements

- 📊 Cloud dashboard for analytics  
- 📱 Mobile app integration  
- 🤖 AI-based meal preference prediction  
- 🔔 Smart notifications  

---






stateDiagram
    
    
    [*] --> IDLE
    
    IDLE --> IDLE : No Card / Break Time
    IDLE --> SHOWING_MSG : Admin Card (Refresh Sync)
    IDLE --> AWAITING_RATING : Tap 2 (Already Consumed)
    
    state Entry_Validation {
        direction LR
        Valid_Tap --> Grant_Access
        Invalid_Tap --> Wrong_Mess_Or_Denied
    }
    
    IDLE --> Entry_Validation : Tap 1 (Not Consumed)
    Entry_Validation --> SHOWING_MSG
    
    SHOWING_MSG --> IDLE : Timer Expired (2.5s - 3.5s)
    
    AWAITING_RATING --> SHOWING_MSG : Rating Button Pressed (Save & Flush)
    AWAITING_RATING --> IDLE : Timeout (5s)