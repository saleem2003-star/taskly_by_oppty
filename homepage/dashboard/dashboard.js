const API_BASE_URL = 'https://task-manager.theoppty.com/api';

// Set today's date in the header
document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
});

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/summary/`);
        if (!response.ok) throw new Error('Failed to load dashboard data');
        
        const data = await response.json();

        // 1. Update Top Stats
        document.getElementById('todayTasksCount').textContent = data.stats.today_tasks;
        document.getElementById('completedCount').textContent = data.stats.completed;
        document.getElementById('teamsCount').textContent = data.stats.teams;
        document.getElementById('overdueCount').textContent = data.stats.overdue;

        // 2. Render Today's Tasks
        renderTodayTasks(data.today_tasks);

        // 3. Render Recent Updates
        renderRecentUpdates(data.recent_updates);

        // 4. Render Teams Overview
        renderTeamsOverview(data.teams_overview);

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderTodayTasks(tasks) {
    const container = document.querySelector('.widget-today-tasks .widget-body');
    container.innerHTML = ''; // Clear hardcoded HTML

    if (tasks.length === 0) {
        container.innerHTML = '<p style="padding:1rem; color:#6b7280; text-align:center;">No tasks due today. Great job!</p>';
        return;
    }

    tasks.forEach(task => {
        // Map Django priority to your CSS classes
        const priorityClass = `priority-${task.priority}`; 
        const teamName = task.team ? `Team #${task.team}` : 'General'; // Assuming team ID is returned, adjust if you serialize team name

        container.innerHTML += `
            <div class="task-item">
                <div class="task-check">
                    <input type="checkbox" id="t_${task.id}" ${task.status === 'completed' ? 'checked' : ''} disabled>
                    <label for="t_${task.id}"></label>
                </div>
                <div class="task-details">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-team">${teamName}</span>
                        <span class="task-time">⏰ Due Today</span>
                    </div>
                </div>
                <span class="priority-badge ${priorityClass}">${task.priority}</span>
            </div>
        `;
    });
}


function handleLogout() {
    // Optional: Clear any saved authentication tokens or user data
    localStorage.removeItem('token'); 
    sessionStorage.clear();

    // Redirect to the index page
    window.location.href = '../../index.html';
}


function renderRecentUpdates(updates) {
    const container = document.querySelector('.widget-updates .widget-body');
    container.innerHTML = ''; 

    if (updates.length === 0) {
        container.innerHTML = '<p style="padding:1rem; color:#6b7280; text-align:center;">No recent activity.</p>';
        return;
    }

    updates.forEach(update => {
        const initials = update.assigned_to_initials || '??';
        const name = update.assigned_to_name || 'Someone';
        
        // Dynamically state what the status is now
        const statusText = `updated to <strong>${update.display_status}</strong>`;

        container.innerHTML += `
            <div class="update-item">
                <div class="update-avatar avatar-blue">${initials}</div>
                <div class="update-content">
                    <p><strong>${name}</strong> ${statusText} on "${update.title} Task"</p>
                    <span class="update-time" style="color: #6b7280; font-size: 0.8rem;">Recently updated</span>
                </div>
            </div>
        `;
    });
}

function renderTeamsOverview(teams) {
    const container = document.querySelector('.widget-teams .widget-body');
    container.innerHTML = '';

    teams.forEach(team => {
        // Calculate progress percentage based on pending vs total tasks (optional calculation logic)
        const totalTasks = team.pending_count + team.overdue_count + 1; // +1 prevents division by zero if you add completed tasks to the serializer later
        const progressRaw = ((1 - (team.pending_count / totalTasks)) * 100).toFixed(0);
        const progress = Math.min(Math.max(progressRaw, 0), 100); // Clamp between 0-100

        container.innerHTML += `
            <div class="team-row">
                <div class="team-icon-small">${team.icon || '👥'}</div>
                <div class="team-info-small">
                    <div class="team-name">${team.name}</div>
                    <div class="team-dept">${team.department} · ${team.member_count} members</div>
                </div>
                <div class="team-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                    <span class="progress-text">${team.pending_count > 0 ? team.pending_count + ' Pending' : 'Clear!'}</span>
                </div>
            </div>
        `;
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', loadDashboard);