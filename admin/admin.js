async function handleFormSubmit(event, url, bodyData, msgElement) {
    event.preventDefault();
    msgElement.style.display = 'none';

    try {
        const response = await fetch(`http://localhost:3000${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        
        msgElement.style.display = 'block';
        if (data.success) {
            msgElement.className = 'message success';
            msgElement.innerText = data.message;
            event.target.reset();
        } else {
            msgElement.className = 'message error';
            msgElement.innerText = data.message;
        }
    } catch (error) {
        msgElement.className = 'message error';
        msgElement.innerText = 'Server connection failed.';
        msgElement.style.display = 'block';
    }
}

// 1. Register Student (Only on College Admin page)
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', (e) => {
        const body = {
            name: document.getElementById('regName').value,
            roll_no: document.getElementById('regRoll').value,
            password: document.getElementById('regPass').value,
            rfid_uid: document.getElementById('regRfid').value
        };
        handleFormSubmit(e, '/api/admin/student', body, document.getElementById('regMsg'));
    });
}

// 2. Recharge Wallet (Only on College Admin page)
const rechForm = document.getElementById('rechargeForm');
if (rechForm) {
    rechForm.addEventListener('submit', (e) => {
        const body = {
            student_id: document.getElementById('rechStudentId').value,
            amount: document.getElementById('rechAmount').value
        };
        handleFormSubmit(e, '/api/admin/recharge', body, document.getElementById('rechMsg'));
    });
}

// 3. Publish Menu (Only on Mess Admin page)
const menuForm = document.getElementById('menuForm');
if (menuForm) {
    menuForm.addEventListener('submit', (e) => {
        const body = {
            mess_name: document.getElementById('menuMess').value,
            meal_type: document.getElementById('menuMeal').value,
            meal_date: document.getElementById('menuDate').value,
            start_time: document.getElementById('menuStart').value,
            end_time: document.getElementById('menuEnd').value,
            capacity: document.getElementById('menuCap').value,
            items: document.getElementById('menuItems').value
        };
        handleFormSubmit(e, '/api/admin/menu', body, document.getElementById('menuMsg'));
    });
}
// Fetch Feedback Analytics on Mess Admin Load
document.addEventListener('DOMContentLoaded', async () => {
    const statsContainer = document.getElementById('overallStats');
    const recentContainer = document.getElementById('recentReviews');
    
    if (statsContainer && recentContainer) {
        try {
            const res = await fetch('http://localhost:3000/api/admin/feedback/stats');
            const data = await res.json();
            
            if (data.success) {
                // Render Overall Stats
                statsContainer.innerHTML = data.stats.map(stat => `
                    <div style="background: white; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #bbf7d0; text-align: center;">
                        <div style="font-weight: bold; color: #166534;">${stat.mess_name.replace('_', ' ')} Rating</div>
                        <div style="font-size: 28px; font-weight: bold; margin: 5px 0;">⭐ ${stat.avg_rating || 'N/A'}</div>
                        <div style="font-size: 12px; color: #666;">Based on ${stat.total_reviews} reviews</div>
                    </div>
                `).join('');

                // Render Recent Reviews
                if (data.recent.length > 0) {
                    recentContainer.innerHTML = data.recent.map(r => `
                        <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                            <strong>${r.name}</strong> rated <strong>${r.mess_name.replace('_', ' ')} (${r.meal_type})</strong> 
                            <span style="color: #f59e0b; font-weight: bold;">${'⭐'.repeat(r.rating)}</span>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">Date: ${r.meal_date.split('T')[0]} | Submitted via: ${r.source.toUpperCase()}</div>
                        </div>
                    `).join('');
                } else {
                    recentContainer.innerHTML = "No reviews submitted yet.";
                }
            }
        } catch (err) {
            console.error("Failed to fetch analytics");
        }
    }
});