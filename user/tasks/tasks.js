const API_BASE_URL = 'https://task-manager.theoppty.com/api';

// 1. Authentication Check
const currentUserId = localStorage.getItem('currentUserId');
if (!currentUserId) {
    // If no one is logged in, redirect to login page immediately
    window.location.href = '../login.html'; 
}

// Global state for updates
let currentEditingTaskId = null;
let currentEditingTeamId = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // --- UI Setup ---
    setupSidebar();
    setupModals();
    setupProfileDropdown()
    // --- Load Data ---
    loadEmployeeData();
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
async function loadEmployeeData() {
    try {
        const response = await fetch(`${API_BASE_URL}/employee/dashboard/${currentUserId}/`);
        if (!response.ok) throw new Error('Failed to load user data');
        
        const data = await response.json();
        
        // Populate Profile Header
        document.getElementById('dropdownUserName').textContent = data.user.member_name;
        document.getElementById('dropdownUserRole').textContent = data.user.member_role || 'Employee';
        document.getElementById('headerAvatar').textContent = data.user.initials;
        // Populate Stats
        const statValues = document.querySelectorAll('.stat-value');
        statValues[0].textContent = data.stats.active;
        statValues[1].textContent = data.stats.pending_review;
        statValues[2].textContent = data.stats.completed;
        statValues[3].textContent = data.stats.overdue;
        
        // Render Tasks Table
        renderTasksTable(data.tasks);
        
    } catch (error) {
        console.error('Error loading workspace:', error);
    }
}

function renderTasksTable(tasks) {
    const tbody = document.querySelector('.data-table tbody');
    tbody.innerHTML = ''; // Clear hardcoded HTML
    
    if (tasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#6b7280;">No tasks assigned to you yet.</td></tr>`;
        return;
    }
    
    tasks.forEach(task => {
        // Build Priority Badge
        let priorityClass = task.priority === 'high' ? 'badge-high' : task.priority === 'medium' ? 'badge-medium' : 'badge-low';
        
        // Build Status Badge
        let statusClass = 'status-active';
        if (task.status === 'completed') statusClass = 'status-completed';
        else if (task.progress_status === 'in_review') statusClass = 'status-pending';
        else if (task.is_overdue) statusClass = 'status-overdue';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-medium task-name-link" style="cursor: pointer; color: var(--primary-color);" 
                data-task="${task.title}" 
                data-req="${task.description}">
                ${task.title}
            </td>
            <td>Oppty HRMS</td>
            <td><span class="badge ${priorityClass}">${task.priority}</span></td>
            <td><span class="status ${statusClass}">${task.display_status}</span></td>
            <td style="${task.is_overdue ? 'color: var(--danger-color); font-weight: bold;' : ''}">${task.due_date_display}</td>
            <td>
                ${task.status !== 'completed' ? 
                    `<button class="btn-action action-update" 
                        data-taskid="${task.id}" 
                        data-teamid="${task.team}" 
                        data-title="${task.title}">Update Progress</button>` 
                    : '<span style="color: #10b981; font-weight: 500;">✓ Done</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Re-attach event listeners to the newly created dynamic buttons
    attachDynamicEventListeners();
}

// --- UPDATE PROGRESS LOGIC ---
document.getElementById('saveUpdateBtn').addEventListener('click', async () => {
    const selectedOption = document.getElementById('statusSelect').value;
    const notes = document.getElementById('updateNotes').value;
    
    // Map dropdown text to backend database variables
    let updatePayload = {
        status: 'pending',
        progress_status: 'in_progress',
        progress_percent: 0
    };
    
    if (selectedOption === 'Task Started') {
        updatePayload.progress_status = 'just_started';
        updatePayload.progress_percent = 5;
    } else if (selectedOption.includes('%')) {
        updatePayload.progress_percent = parseInt(selectedOption);
        if (updatePayload.progress_percent === 100) {
            updatePayload.status = 'completed';
        }
    } else if (selectedOption === 'Pending Review') {
        updatePayload.progress_status = 'in_review';
        updatePayload.progress_percent = 90;
    } else if (selectedOption === 'Task Completed') {
        updatePayload.status = 'completed';
        updatePayload.progress_percent = 100;
    }

    // Send update to server
    const btn = document.getElementById('saveUpdateBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const url = `${API_BASE_URL}/teams/${currentEditingTeamId}/tasks/${currentEditingTaskId}/`;
        console.log(`Sending update to: ${url}`);
        console.log(`Payload:`, updatePayload);

        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
            closeAllModals();
            loadEmployeeData(); // Refresh table and stats
        } else {
            // --- DIAGNOSTIC ERROR CATCHER ---
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                alert(`Django says Bad Request (400):\n${JSON.stringify(errorData, null, 2)}`);
            } else {
                alert(`Django says Error ${response.status}:\nThe task couldn't be found on Team #${currentEditingTeamId}. Check your backend serializer!`);
            }
        }
    } catch (error) {
        console.error('Update error:', error);
        alert(`Network Error: ${error.message}`);
    } finally {
        btn.textContent = 'Save Changes';
        btn.disabled = false;
        document.getElementById('updateNotes').value = ''; // Clear notes
    }
});

// --- HELPER FUNCTIONS ---
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');

    menuToggle.addEventListener('click', () => sidebar.classList.add('open'));
    closeSidebar.addEventListener('click', () => sidebar.classList.remove('open'));

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function setupModals() {
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });
}

function closeAllModals() {
    document.getElementById('reqModal').classList.remove('active');
    document.getElementById('updateModal').classList.remove('active');
    currentEditingTaskId = null;
    currentEditingTeamId = null;
}

function attachDynamicEventListeners() {
    // Requirements Modal
    document.querySelectorAll('.task-name-link').forEach(link => {
        link.addEventListener('click', (e) => {
            document.getElementById('reqModalTitle').textContent = `${e.target.getAttribute('data-task')} - Requirements`;
            document.getElementById('reqModalContent').textContent = e.target.getAttribute('data-req') || 'No description provided.';
            document.getElementById('reqModal').classList.add('active');
        });
    });

    // Update Modal
    document.querySelectorAll('.action-update').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentEditingTaskId = e.target.getAttribute('data-taskid');
            currentEditingTeamId = e.target.getAttribute('data-teamid');
            
            document.getElementById('updateModalTitle').textContent = e.target.getAttribute('data-title');
            document.getElementById('updateModal').classList.add('active');
        });
    });
}