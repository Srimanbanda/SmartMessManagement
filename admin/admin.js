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