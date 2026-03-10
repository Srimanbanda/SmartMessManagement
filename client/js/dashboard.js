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

    let dailyMenus = []; // Store fetched menus here

    // 2. Future Booking Logic (Unlock the calendar)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    bookingDateInput.value = tomorrowStr;
    bookingDateInput.min = tomorrowStr;
    // Notice: We removed bookingDateInput.max so students can book indefinitely into the future

    // 3. Dynamic 12 PM Breakfast Cutoff Logic
    function checkBreakfastCutoff() {
        const selectedDate = bookingDateInput.value;
        const now = new Date();
        const currentHour = now.getHours(); 
        
        const breakfastOption = mealSelect.querySelector('option[value="breakfast"]');
        
        if (breakfastOption) {
            // If they picked EXACTLY tomorrow AND it is currently 12 PM (Noon) or later
            if (selectedDate === tomorrowStr && currentHour >= 12) {
                breakfastOption.disabled = true;
                breakfastOption.innerText = "Breakfast (Closed at 12 PM)";
                
                // If they previously had breakfast selected, clear it so they can't force a submission
                if (mealSelect.value === 'breakfast') {
                    mealSelect.value = '';
                }
            } else {
                // If they pick day-after-tomorrow, or it's before 12 PM, keep it open!
                breakfastOption.disabled = false;
                breakfastOption.innerText = "Breakfast";
            }
        }
    }

    // Run the cutoff check immediately on page load
    checkBreakfastCutoff();

    // 4. Fetch Initial Dashboard Data
    try {
        const response = await fetch(`http://localhost:3000/api/student/dashboard/${studentId}`);
        const data = await response.json();
        if (data.success) {
            welcomeMessage.innerText = `Welcome, ${data.student.name.split(' ')[0]}`;
            coinBalance.innerText = data.student.coins;
        }
        // Fetch menus for tomorrow silently in the background
        await fetchMenusForDate(tomorrowStr);
    } catch (error) {
        console.error('Data load error:', error);
    }

    // 5. Fetch Menus Function
    async function fetchMenusForDate(dateStr) {
        try {
            const response = await fetch(`http://localhost:3000/api/student/menus/${dateStr}`);
            const data = await response.json();
            if (data.success) {
                dailyMenus = data.menus;
                updateHoverCards(); // Update cards if a meal is already selected
            }
        } catch (error) {
            console.error('Menu fetch error:', error);
        }
    }

    // Re-run the cutoff check and fetch menus every time the user changes the calendar date
    bookingDateInput.addEventListener('change', (e) => {
        checkBreakfastCutoff();
        fetchMenusForDate(e.target.value); 
    });

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
                    messName: messName,    // Ensure this matches backend expectation
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
});