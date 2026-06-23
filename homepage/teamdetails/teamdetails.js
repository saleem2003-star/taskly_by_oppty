const API_BASE_URL = 'https://task-manager.theoppty.com/api';

// ===== GET TEAM ID FROM URL =====
const urlParams = new URLSearchParams(window.location.search);
const TEAM_ID = urlParams.get('id');

if (!TEAM_ID) {
    window.location.href = 'teams.html';
}
// ===== LOGOUT FUNCTION =====
function handleLogout() {
    // Clear saved authentication tokens or user data if you have any
    localStorage.removeItem('token'); 
    sessionStorage.clear();

    // Redirect to the index page
    window.location.href = '../../index.html';
}
// ===== DOM REFERENCES =====
const openAddMemberBtn  = document.getElementById('openAddMemberBtn');
const closeAddMemberBtn = document.getElementById('closeAddMemberBtn');
const cancelMemberBtn   = document.getElementById('cancelMemberBtn');
const addMemberModal    = document.getElementById('addMemberModal');
const newMemberForm     = document.getElementById('newMemberForm');
const membersTableBody  = document.getElementById('membersTableBody');

const openAssignTaskBtn = document.getElementById('openAssignTaskBtn');
const closeAssignTaskBtn = document.getElementById('closeAssignTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const assignTaskModal = document.getElementById('assignTaskModal');
const newTaskForm = document.getElementById('newTaskForm');
const taskAssigneeDropdown = document.getElementById('taskAssignee');

// View Task Modal References
const viewTaskModal = document.getElementById('viewTaskModal');
const closeViewTaskBtn = document.getElementById('closeViewTaskBtn');
const cancelViewTaskBtn = document.getElementById('cancelViewTaskBtn');

// ===== MODAL CONTROLS =====
function openMemberModal() { addMemberModal.classList.add('active'); }
function closeMemberModal() { 
    addMemberModal.classList.remove('active'); 
    newMemberForm.reset(); 
}

openAddMemberBtn.addEventListener('click', openMemberModal);
closeAddMemberBtn.addEventListener('click', closeMemberModal);
cancelMemberBtn.addEventListener('click', closeMemberModal);
addMemberModal.addEventListener('click', e => { if (e.target === addMemberModal) closeMemberModal(); });

function openTaskModal() { assignTaskModal.classList.add('active'); }
function closeTaskModal() { 
    assignTaskModal.classList.remove('active'); 
    newTaskForm.reset(); 
}

openAssignTaskBtn.addEventListener('click', openTaskModal);
closeAssignTaskBtn.addEventListener('click', closeTaskModal);
cancelTaskBtn.addEventListener('click', closeTaskModal);
assignTaskModal.addEventListener('click', e => { if (e.target === assignTaskModal) closeTaskModal(); });

// View Task Modal Logic
function closeViewModal() { viewTaskModal.classList.remove('active'); }
if(closeViewTaskBtn) closeViewTaskBtn.addEventListener('click', closeViewModal);
if(cancelViewTaskBtn) cancelViewTaskBtn.addEventListener('click', closeViewModal);
if(viewTaskModal) viewTaskModal.addEventListener('click', e => { if (e.target === viewTaskModal) closeViewModal(); });

document.addEventListener('keydown', e => { 
    if (e.key === 'Escape') {
        closeMemberModal();
        closeTaskModal();
        closeViewModal();
    }
});

// ===== FETCH & RENDER TEAM DETAILS =====
async function fetchTeamDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/`);
        if (!response.ok) throw new Error('Failed to fetch team details');
        
        const team = await response.json();
        
        // Populate Header & Breadcrumb
        document.getElementById('breadcrumbTeamName').textContent = team.name;
        document.getElementById('headerTeamName').textContent = team.name;
        document.getElementById('headerTeamDept').textContent = team.department;
        document.getElementById('headerIcon').textContent = team.icon;
        
        // Populate Stats
        document.getElementById('statMembers').textContent = team.member_count;
        document.getElementById('statPending').textContent = team.pending_count;
        document.getElementById('statCompleted').textContent = team.completed_count;
        document.getElementById('statOverdue').textContent = team.overdue_count;

        // Render Members Table
        renderMembers(team.members);

    } catch (error) {
        console.error('Error loading team details:', error);
    }
}

function renderMembers(members) {
    membersTableBody.innerHTML = '';
    taskAssigneeDropdown.innerHTML = '<option value="">Select a team member...</option>';
    
    if (members.length === 0) {
        membersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">No members in this team yet. Click "+ Add Member" to start.</td></tr>`;
        return;
    }

    const activeMembers = members.filter(m => m.is_active);

    if (activeMembers.length > 0) {
        const allOption = document.createElement('option');
        allOption.value = 'ALL';
        allOption.textContent = '👥 Assign to ALL Members';
        allOption.style.fontWeight = 'bold';
        allOption.style.color = 'var(--primary-color)';
        taskAssigneeDropdown.appendChild(allOption);
    }

    members.forEach(member => {
        if (member.is_active) {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.member_name;
            taskAssigneeDropdown.appendChild(option);
        }

        const tr = document.createElement('tr');
        const statusBadge = member.is_active 
            ? `<span class="status-badge status-active">Active</span>`
            : `<span class="status-badge status-inactive">Inactive</span>`;

        tr.innerHTML = `
            <td>
                <div class="member-profile">
                    <div class="avatar">
                        ${member.initials}
                    </div>
                    <div>
                        <div style="font-weight: 500; color: #111827;">${member.member_name}</div>
                        <div class="member-email">${member.member_email}</div>
                    </div>
                </div>
            </td>
            <td style="color: #4b5563;">${member.member_role}</td>
            <td>${statusBadge}</td>
            <td style="color: #4b5563;">
                ${member.active_count} pending / ${member.done_count} done
            </td>
            <td>
                <button class="delete-btn" onclick="deleteMember(${member.id})">Remove</button>
            </td>
        `;
        membersTableBody.appendChild(tr);
    });
}

// ===== CREATE NEW MEMBER =====
newMemberForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const memberData = {
        member_name: document.getElementById('memberName').value.trim(),
        member_email: document.getElementById('memberEmail').value.trim(),
        member_role: document.getElementById('memberRole').value.trim(),
        is_active: document.getElementById('memberActive').checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/members/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberData)
        });

        if (response.ok) {
            fetchTeamDetails(); 
            closeMemberModal();
        } else {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                alert('Failed to add member. Check your inputs.');
            } else {
                alert(`Server Error (${response.status})`);
            }
        }
    } catch (error) {
        console.error('Error adding member:', error);
    }
});

// ===== DELETE MEMBER =====
async function deleteMember(memberId) {
    if (confirm('Are you sure you want to remove this member?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/members/${memberId}/`, {
                method: 'DELETE',
            });
            if (response.ok) fetchTeamDetails();
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    }
}

// ===== CREATE NEW TASK =====
newTaskForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const assigneeValue = document.getElementById('taskAssignee').value;
    const baseTaskData = {
        title: document.getElementById('taskTitle').value.trim(),
        due_date: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        description: document.getElementById('taskDesc').value.trim(),
        status: 'pending',
        progress_status: 'not_started',
        team: TEAM_ID
    };

    try {
        if (assigneeValue === 'ALL') {
            const allOptions = Array.from(taskAssigneeDropdown.options);
            const memberIds = allOptions
                .map(opt => opt.value)
                .filter(val => val !== '' && val !== 'ALL'); 

            const fetchPromises = memberIds.map(id => {
                const taskData = { ...baseTaskData, assigned_to: id };
                return fetch(`${API_BASE_URL}/teams/${TEAM_ID}/tasks/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
            });

            await Promise.all(fetchPromises);
            fetchTeamDetails(); 
            closeTaskModal();
        } else {
            const taskData = { ...baseTaskData, assigned_to: assigneeValue };
            const response = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/tasks/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (response.ok) {
                fetchTeamDetails(); 
                closeTaskModal();
            } else {
                alert('Failed to create single task');
            }
        }
    } catch (error) {
        console.error('Error creating task(s):', error);
        alert('There was an error saving the task.');
    }
});


// ===== VIEW ALL (TASK DETAILS POPUP) =====
// Triggers the modal to view the full details of a specific task
async function viewTaskDetails(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/teams/${TEAM_ID}/tasks/${taskId}/`);
        if (!response.ok) throw new Error('Failed to fetch task details');
        
        const task = await response.json();
        
        // 1. Populate Basic Details
        document.getElementById('viewTaskTitle').textContent = task.title;
        document.getElementById('viewTaskDesc').textContent = task.description || 'No description provided.';
        
        // 2. Populate Status
        document.getElementById('viewTaskStatus').textContent = task.display_status || task.status;
        
        // 3. Populate User Notes
        const notesContainer = document.getElementById('viewTaskNotes');
        if (task.notes && task.notes.trim() !== "") {
            notesContainer.innerHTML = `<span style="white-space: pre-wrap;">${task.notes}</span>`;
            notesContainer.style.fontStyle = "normal";
        } else {
            notesContainer.innerHTML = 'No notes provided by the user yet.';
            notesContainer.style.fontStyle = "italic";
        }
        
        // 4. Populate Attached File
        const fileContainer = document.getElementById('viewTaskFileContainer');
        if (task.attachment) {
            fileContainer.innerHTML = `
                <a href="${task.attachment}" target="_blank" style="color: #ea580c; font-weight: 600; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    View / Download Attachment
                </a>`;
        } else {
            fileContainer.innerHTML = `<span style="color: #64748b;">No file attached.</span>`;
        }
        
        // Show the modal
        viewTaskModal.classList.add('active');

    } catch (error) {
        console.error('Error fetching task:', error);
        alert('Could not load task details.');
    }
}

// Initialize page
fetchTeamDetails();