document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication Check
    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const coinBalance = document.getElementById('coinBalance');
    const bookingForm = document.getElementById('bookingForm');
    const bookingMsg = document.getElementById('bookingMsg');
    
    const bookingDateInput = document.getElementById('bookingDate');
    const mealSelect = document.getElementById('mealSelect');
    const messHidden = document.getElementById('messSelect');
    
    // Custom Dropdown Elements
    const messSelected = document.getElementById('messSelected');
    const messOptions = document.getElementById('messOptions');
    const hoverCardA = document.getElementById('hoverCardA');
    const hoverCardB = document.getElementById('hoverCardB');

    let dailyMenus = []; 

    // 2. Future Booking Logic (Midnight Cutoff)
    // By setting the minimum date to 'tomorrow', the UI naturally handles the 12 AM cutoff.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    bookingDateInput.value = tomorrowStr;
    bookingDateInput.min = tomorrowStr; 

    // 3. Fetch Initial Dashboard Data
    try {
        const response = await fetch(`http://localhost:3000/api/student/dashboard/${studentId}`);
        const data = await response.json();
        if (data.success) {
            welcomeMessage.innerText = `Welcome, ${data.student.name.split(' ')[0]}`;
            coinBalance.innerText = data.student.coins;
        }
        await fetchMenusForDate(tomorrowStr);
    } catch (error) {
        console.error('Data load error:', error);
    }

    // 4. Fetch Menus Function
    async function fetchMenusForDate(dateStr) {
        try {
            const response = await fetch(`http://localhost:3000/api/student/menus/${dateStr}`);
            const data = await response.json();
            if (data.success) {
                dailyMenus = data.menus;
                updateHoverCards(); 
            }
        } catch (error) {
            console.error('Menu fetch error:', error);
        }
    }

    // Fetch menus when the user changes the calendar date
    bookingDateInput.addEventListener('change', (e) => {
        fetchMenusForDate(e.target.value); 
    });

    // ... (Keep the rest of the file exactly the same: updateHoverCards, custom dropdown, logout, booking form, etc.) ...

    // 6. Update Hover Cards based on Selected Meal Time
    function updateHoverCards() {
        const selectedMeal = mealSelect.value;
        if (!selectedMeal) return;

        // Find Menu for Mess A
        const menuA = dailyMenus.find(m => m.mess_name === 'Mess_A' && m.meal_type === selectedMeal);
        if (menuA) {
            hoverCardA.innerHTML = `<strong>Mess A - ${menuA.start_time} to ${menuA.end_time}</strong><br><br>${menuA.items}`;
        } else {
            hoverCardA.innerHTML = `No menu published for ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} yet.`;
        }

        // Find Menu for Mess B
        const menuB = dailyMenus.find(m => m.mess_name === 'Mess_B' && m.meal_type === selectedMeal);
        if (menuB) {
            hoverCardB.innerHTML = `<strong>Mess B - ${menuB.start_time} to ${menuB.end_time}</strong><br><br>${menuB.items}`;
        } else {
            hoverCardB.innerHTML = `No menu published for ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} yet.`;
        }
    }

    // Trigger hover card updates when the Meal Time changes
    mealSelect.addEventListener('change', updateHoverCards);

    // 7. Custom Dropdown Logic
    messSelected.addEventListener('click', () => {
        messOptions.style.display = messOptions.style.display === 'block' ? 'none' : 'block';
    });

    document.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent bubbling
            messHidden.value = this.getAttribute('data-value'); // Set hidden input
            messSelected.innerText = this.childNodes[0].textContent.trim(); // Update text
            messOptions.style.display = 'none'; // Close dropdown
        });
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (e) => {
        const messDropdown = document.getElementById('messDropdown');
        if (messDropdown && !messDropdown.contains(e.target)) {
            messOptions.style.display = 'none';
        }
    });

    // 8. Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // 9. Booking Submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const messName = messHidden.value;
        const mealType = mealSelect.value;
        const selectedDate = bookingDateInput.value;
        const bookBtn = document.getElementById('bookBtn');
        
        if (!messName) {
            bookingMsg.className = 'message error';
            bookingMsg.innerText = 'Please select a Mess location.';
            bookingMsg.style.display = 'block';
            return;
        }

        bookingMsg.style.display = 'none';
        bookBtn.innerText = 'Processing...';
        bookBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/api/booking/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    mess_name: messName,    // Fixed property name to match backend
                    meal_type: mealType,
                    meal_date: selectedDate
                })
            });

            const data = await response.json();

            if (data.success) {
                bookingMsg.className = 'message success';
                bookingMsg.innerText = data.message;
                const currentCoins = parseInt(coinBalance.innerText);
                coinBalance.innerText = currentCoins - 50;
            } else {
                bookingMsg.className = 'message error';
                bookingMsg.innerText = data.message;
            }
        } catch (error) {
            bookingMsg.className = 'message error';
            bookingMsg.innerText = 'Server error during booking.';
        } finally {
            bookingMsg.style.display = 'block';
            bookBtn.innerText = 'Pay 50 Coins & Book';
            bookBtn.disabled = false;
        }
    });

    // 10. Fetch & Render Pending Feedback
    async function loadPendingFeedback() {
        const feedbackContainer = document.getElementById('feedbackContainer');
        if (!feedbackContainer) return; // Safety check

        try {
            const response = await fetch(`http://localhost:3000/api/student/feedback/pending/${studentId}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.pending.length > 0) {
                    feedbackContainer.innerHTML = data.pending.map(item => `
                        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${item.mess_name.replace('_', ' ')} - <span style="text-transform: capitalize;">${item.meal_type}</span></strong><br>
                                <span style="font-size: 13px; color: #6b7280;">Date: ${item.meal_date.split('T')[0]}</span>
                            </div>
                            <div>
                                <select id="rating-${item.booking_id}" style="padding: 5px; border-radius: 4px;">
                                    <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                                    <option value="4">⭐⭐⭐⭐ (Good)</option>
                                    <option value="3">⭐⭐⭐ (Average)</option>
                                    <option value="2">⭐⭐ (Poor)</option>
                                    <option value="1">⭐ (Terrible)</option>
                                </select>
                                <button onclick="submitFeedback('${item.mess_name}', '${item.meal_date.split('T')[0]}', '${item.meal_type}', ${item.booking_id})" style="padding: 5px 10px; background: #10b981; margin-left: 10px; border: none; color: white; border-radius: 4px; cursor: pointer;">Submit</button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    // Success, but no pending meals!
                    feedbackContainer.innerHTML = '<p>You have no pending meals to rate. Enjoy your food!</p>';
                }
            } else {
                // The backend returned an error (e.g., SQL column missing)
                feedbackContainer.innerHTML = `<p style="color:red;">Backend Error: ${data.message}</p>`;
            }
        } catch (error) {
            // The server is offline or unreachable
            feedbackContainer.innerHTML = '<p style="color:red;">Network Error: Failed to connect to server.</p>';
            console.error("Fetch error:", error);
        }
    }

    // Attach function to global window object so inline HTML onclick can access it
    window.submitFeedback = async (mess_name, meal_date, meal_type, booking_id) => {
        const rating = document.getElementById(`rating-${booking_id}`).value;
        try {
            const res = await fetch('http://localhost:3000/api/student/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId, mess_name, meal_date, meal_type, rating: parseInt(rating) })
            });
            const data = await res.json();
            if (data.success) {
                alert('Thank you for your feedback!');
                loadPendingFeedback(); // Reload the list
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Error submitting feedback.');
        }
    };

    // MAKE SURE THIS LINE IS HERE TO ACTUALLY RUN THE FUNCTION ON PAGE LOAD
    loadPendingFeedback();
});