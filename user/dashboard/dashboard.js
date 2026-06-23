const API_BASE_URL = 'https://task-manager.theoppty.com/api';

// 1. Authentication Check
const currentUserId = localStorage.getItem('currentUserId');
if (!currentUserId) {
    window.location.href = '../login.html'; 
}

document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();
    setDateDisplay();
    loadDashboardData();
    setupProfileDropdown();
});


function setupProfileDropdown() {
    const toggle = document.getElementById('profileDropdownToggle');
    const dropdown = document.getElementById('profileDropdown');

    // Toggle menu when clicking the profile area
    toggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the click from immediately triggering the document listener
        dropdown.classList.toggle('show');
    });

    // Close the menu if the user clicks anywhere else on the screen
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// 3. Add the Logout Function
function logoutUser() {
    // Clear the user's session data
    localStorage.removeItem('currentUserId');
    // Redirect to login screen
    window.location.href = '../../index.html'; 
}
function setDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
}

async function loadDashboardData() {
    try {
        // Fetch data using the employee dashboard endpoint
        const response = await fetch(`${API_BASE_URL}/employee/dashboard/${currentUserId}/`);
        if (!response.ok) throw new Error('Failed to load user data');
        
        const data = await response.json();
        
        // Populate Profile Info
       // NEW CODE - Inject name and role into the dropdown menu
        document.getElementById('dropdownUserName').textContent = data.user.member_name;
        document.getElementById('dropdownUserRole').textContent = data.user.member_role || 'Employee';
        document.getElementById('headerAvatar').textContent = data.user.initials;
        
        // Set dynamic welcome greeting based on time of day
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        document.getElementById('welcomeGreeting').textContent = `${greeting}, ${data.user.member_name.split(' ')[0]}!`;
        
        // Filter and Render Tasks
        renderNotStartedTasks(data.tasks);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('notStartedGrid').innerHTML = 
            `<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: red;">Failed to load data. Please check your connection.</div>`;
    }
}

function renderNotStartedTasks(allTasks) {
    const grid = document.getElementById('notStartedGrid');
    grid.innerHTML = ''; 
    
    // --- THE CRITICAL FILTER ---
    // Only keep tasks that are 'pending' AND specifically 'not_started'
    const notStartedTasks = allTasks.filter(task => 
        task.status === 'pending' && task.progress_status === 'not_started'
    );
    
    // Update counter
    document.getElementById('notStartedCount').textContent = `${notStartedTasks.length} Tasks`;
    
    if (notStartedTasks.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 3rem; text-align: center; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <i class="ph ph-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                <h3 style="color: #1e293b;">You're completely caught up!</h3>
                <p style="color: #64748b;">You have no tasks sitting in the "Not Started" queue.</p>
            </div>
        `;
        return;
    }
    
    // Build Cards
    notStartedTasks.forEach(task => {
        let priorityClass = task.priority === 'high' ? 'badge-high' : task.priority === 'medium' ? 'badge-medium' : 'badge-low';
        
        const card = document.createElement('div');
        card.className = 'dashboard-task-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
                <span style="${task.is_overdue ? 'color: var(--danger-color); font-weight: bold;' : 'color: var(--text-muted);'}">
                    <i class="ph ph-calendar"></i> ${task.due_date_display}
                </span>
            </div>
            <h3 class="card-title">${task.title}</h3>
            <p class="card-desc">${task.description || 'No detailed description provided.'}</p>
            
            <div class="card-footer">
                <button class="btn-start" onclick="startTask(${task.team}, ${task.id})">
                    <i class="ph ph-play"></i> Start Working
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Function to move task from "Not Started" to "Just Started"
async function startTask(teamId, taskId) {
    if (!confirm("Start working on this task now?")) return;

    try {
        const url = `${API_BASE_URL}/teams/${teamId}/tasks/${taskId}/`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'pending',
                progress_status: 'just_started',
                progress_percent: 5
            })
        });

        if (response.ok) {
            // Reload the dashboard data. The task will disappear from this screen 
            // because its status is no longer 'not_started'
            loadDashboardData();
        } else {
            alert('Failed to start task on the server.');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Network error.');
    }
}

// --- Sidebar Helper ---
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    menuToggle.addEventListener('click', () => sidebar.classList.add('open'));
    closeSidebar.addEventListener('click', () => sidebar.classList.remove('open'));
}