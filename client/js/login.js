// Wait for the HTML to fully load before attaching events
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const loginBtn = document.getElementById('loginBtn');

    // Attach event listener to the form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stops the page from refreshing

        const rollNo = document.getElementById('rollNo').value.trim();
        const password = document.getElementById('password').value;

        // Set UI to loading state
        errorMsg.style.display = 'none';
        loginBtn.innerText = 'Signing in...';
        loginBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/api/student/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roll_no: rollNo, password: password })
            });

            const data = await response.json();

            if (data.success) {
                // Save the student ID to localStorage for the dashboard to use
                localStorage.setItem('student_id', data.student.id);
                // Redirect
                window.location.href = 'dashboard.html';
            } else {
                showError(data.message);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            showError('Unable to connect to the server. Is your backend running?');
        } finally {
            // Revert UI from loading state
            loginBtn.innerText = 'Sign In';
            loginBtn.disabled = false;
        }
    });

    function showError(message) {
        errorMsg.innerText = message;
        errorMsg.style.display = 'block';
    }
});