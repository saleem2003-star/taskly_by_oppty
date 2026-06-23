document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const adminModal = document.getElementById('adminModal');
    const openAdminModalBtn = document.getElementById('openAdminModalBtn');
    const closeAdminModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    
    const employeeLoginForm = document.getElementById('employeeLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');

    // Open Modal
    openAdminModalBtn.addEventListener('click', () => {
        adminModal.classList.add('active');
    });

    // Close Modal Logic
    const closeModal = () => {
        adminModal.classList.remove('active');
        // Reset form upon closing
        setTimeout(() => adminLoginForm.reset(), 300);
    };

    closeAdminModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            closeModal();
        }
    });

    // Handle Employee Login Submission
    // Handle Employee Login Submission
employeeLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get values from the form
    const email = document.getElementById('empEmail').value;
    // Note: Make sure your HTML password input has id="empPassword"
    const password = document.getElementById('empPassword').value; 
    
    // UI Loading state
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner-gap"></i> Authenticating...';
    
    try {
        // Send data to your Django API
        // Update this URL if your login route is named differently in urls.py
        const response = await fetch('https://task-manager.theoppty.com/api/user/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email, 
                password: password 
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Optional: Save the user ID to local storage so you know who is logged in across pages
            localStorage.setItem('currentUserId', data.user_id);
            
            // Redirect to the dashboard!
            window.location.href = '../user/tasks/tasks.html';
        } else {
            // Handle 401 Unauthorized or other errors
            const errorData = await response.json();
            alert(errorData.message || 'Invalid credentials. Please try again.');
            btn.innerHTML = originalText; // Reset button
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Server connection failed. Please try again later.');
        btn.innerHTML = originalText; // Reset button
    }
});
    // Handle Admin Login Submission (2FA logic removed)
    // Handle Admin Login Submission
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get values from the form
        const adminEmail = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        // UI Loading state
        const btn = document.querySelector('button[form="adminLoginForm"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner-gap"></i> Authenticating...';
        
        try {
            // Send data to your Django Admin API
            const response = await fetch('https://task-manager.theoppty.com/api/admin/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Assuming your backend expects the key 'email' rather than 'adminEmail'
                body: JSON.stringify({ 
                    email: adminEmail, 
                    password: password 
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Optional: Save the admin ID to local storage (if your backend sends it back)
                // This keeps admin and employee sessions separate
                if (data.admin_id) {
                    localStorage.setItem('currentAdminId', data.admin_id);
                }
                
                // Redirect to the Admin Dashboard
                window.location.href = '../homepage/dashboard/dashboard.html';
                
            } else {
                // Handle 401 Unauthorized or other errors
                const errorData = await response.json();
                alert(errorData.message || 'Invalid admin credentials. Please try again.');
                btn.innerHTML = originalText; // Reset button
            }
        } catch (error) {
            console.error('Admin login error:', error);
            alert('Server connection failed. Please try again later.');
            btn.innerHTML = originalText; // Reset button
        }
    });
});
