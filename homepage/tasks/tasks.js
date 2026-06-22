const API_BASE_URL = 'https://task-manager.theoppty.com/api';
        
        let allGlobalTasks = { pending: [], overdue: [], completed: [] };
        let currentTab = 'pending';
        let currentTeamFilter = 'ALL';

        document.addEventListener('DOMContentLoaded', () => {
            setupTabs();
            // setupModal();
            fetchAllData();
            
            document.getElementById('teamSelectDropdown').addEventListener('change', (e) => {
                currentTeamFilter = e.target.value;
                renderTasks();
            });
        });

        function setupTabs() {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    currentTab = tab.getAttribute('data-tab');
                    renderTasks();
                });
            });
        }

        // Modal Controls
        const viewModal = document.getElementById('viewTaskModal');
        function closeModal() { viewModal.classList.remove('active'); }
        document.getElementById('closeViewTaskBtn').addEventListener('click', closeModal);
        document.getElementById('cancelViewTaskBtn').addEventListener('click', closeModal);
        viewModal.addEventListener('click', e => { if (e.target === viewModal) closeModal(); });

        async function fetchAllData() {
            try {
                // 1. Fetch all teams
                const teamsRes = await fetch(`${API_BASE_URL}/teams/`);
                const teams = await teamsRes.json();
                
                // Populate Dropdown
                const dropdown = document.getElementById('teamSelectDropdown');
                teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.id;
                    option.textContent = team.name;
                    dropdown.appendChild(option);
                });

                // 2. Fetch tasks for EVERY team and merge them
                let rawPending = [];
                let rawOverdue = [];
                let rawCompleted = [];

                for (let team of teams) {
                    const tasksRes = await fetch(`${API_BASE_URL}/teams/${team.id}/tasks/`);
                    const tasksData = await tasksRes.json();
                    
                    // Attach the team info to each task so we know where it came from
                    const injectTeam = (tasksArray) => tasksArray.map(t => ({...t, team_name: team.name, team_id: team.id}));
                    
                    rawPending.push(...injectTeam(tasksData.pending || []));
                    rawOverdue.push(...injectTeam(tasksData.overdue || []));
                    rawCompleted.push(...injectTeam(tasksData.completed || []));
                }

                allGlobalTasks.pending = rawPending;
                allGlobalTasks.overdue = rawOverdue;
                allGlobalTasks.completed = rawCompleted;

                renderTasks();

            } catch (error) {
                console.error("Error fetching global tasks:", error);
                document.getElementById('tasksContainer').innerHTML = `<div style="color:red; padding: 40px; text-align: center;">Failed to load tasks. Ensure backend is running.</div>`;
            }
        }

        function renderTasks() {
            const container = document.getElementById('tasksContainer');
            container.innerHTML = '';

            // 1. Filter counts based on the team dropdown
            const filterByTeam = (tasksArray) => currentTeamFilter === 'ALL' ? tasksArray : tasksArray.filter(t => t.team_id.toString() === currentTeamFilter.toString());
            
            const filteredPending = filterByTeam(allGlobalTasks.pending);
            const filteredOverdue = filterByTeam(allGlobalTasks.overdue);
            const filteredCompleted = filterByTeam(allGlobalTasks.completed);

            // Update Tab Badges
            document.getElementById('countPending').textContent = filteredPending.length;
            document.getElementById('countOverdue').textContent = filteredOverdue.length;
            document.getElementById('countCompleted').textContent = filteredCompleted.length;

            // Select active array
            let activeArray = [];
            if (currentTab === 'pending') activeArray = filteredPending;
            else if (currentTab === 'overdue') activeArray = filteredOverdue;
            else if (currentTab === 'completed') activeArray = filteredCompleted;

            if (activeArray.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: 8px; border: 1px dashed var(--border-color);">No tasks found in this category.</div>`;
                return;
            }

            activeArray.forEach(task => {
                // Determine styling based on priority
                let borderClass = 'border-medium';
                let dotClass = 'medium';
                let progressColor = 'var(--med-priority)';
                
                if (task.priority === 'high') { borderClass = 'border-high'; dotClass = 'high'; progressColor = 'var(--high-priority)'; }
                if (task.priority === 'low') { borderClass = 'border-low'; dotClass = 'low'; progressColor = 'var(--low-priority)'; }

                // Determine buttons to show
                const actionButtons = task.status !== 'completed' 
                    ? `<button class="btn btn-view" onclick="viewTaskDetails(${task.team_id}, ${task.id})">👁️ View</button>
                       <button class="btn btn-done" onclick="markTaskDone(${task.team_id}, ${task.id})">✓ Mark Done</button>`
                    : `<button class="btn btn-view" onclick="viewTaskDetails(${task.team_id}, ${task.id})">👁️ View</button>`;

                const card = document.createElement('div');
                card.className = `task-card ${borderClass}`;
                card.innerHTML = `
                    <div class="card-header">
                        <div>
                            <div class="card-title-row">
                                <span class="task-title">${task.title}</span>
                                <span class="team-badge">${task.team_name}</span>
                                <span class="priority-indicator"><div class="dot ${dotClass}"></div> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
                            </div>
                            <p class="task-desc">${task.description || 'No description provided.'}</p>
                        </div>
                    </div>

                    <div class="task-meta">
                        <div class="meta-item"><i class="ph ph-user"></i> Assignee: ${task.assigned_to_name}</div>
                        <div class="meta-item"><i class="ph ph-calendar"></i> Due Date: ${task.due_date_display}</div>
                        <div class="meta-item"><i class="ph ph-arrows-clockwise"></i> Progression: ${task.display_status}</div>
                    </div>

                    <div class="card-footer">
                        <div class="progress-section">
                            <div class="progress-header">
                                <span>Progress</span>
                                <span>${task.progress_percent || 0}%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-fill" style="width: ${task.progress_percent || 0}%; background-color: ${progressColor};"></div>
                            </div>
                        </div>
                        <div class="action-buttons">
                            ${actionButtons}
                            <button class="btn btn-delete" onclick="deleteTask(${task.team_id}, ${task.id})"><i class="ph ph-trash" style="font-size: 1.1rem;"></i></button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // ===== VIEW TASK DETAILS POPUP =====
       async function viewTaskDetails(teamId, taskId) {
    try {
        const res = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks/${taskId}/`);
        if (!res.ok) throw new Error('Failed to fetch task');
        const task = await res.json();

        document.getElementById('viewTaskTitle').textContent = task.title;
        document.getElementById('viewTaskDesc').textContent  = task.description || 'No description provided.';

        // Status badge
        const statusEl = document.getElementById('viewTaskStatus');
        statusEl.textContent = task.display_status;
        const s = (task.display_status || '').toLowerCase();
        if (s.includes('completed'))     { statusEl.style.background='#f0fdf4'; statusEl.style.color='#16a34a'; }
        else if (s.includes('overdue'))  { statusEl.style.background='#fef2f2'; statusEl.style.color='#dc2626'; }
        else if (s.includes('progress')) { statusEl.style.background='#fefce8'; statusEl.style.color='#ca8a04'; }
        else if (s.includes('review'))   { statusEl.style.background='#fdf4ff'; statusEl.style.color='#9333ea'; }
        else                             { statusEl.style.background='#eff6ff'; statusEl.style.color='#2563eb'; }

        // Notes
        const notesEl = document.getElementById('viewTaskNotes');
        if (task.notes && task.notes.trim() !== '') {
            notesEl.innerHTML = `<div style="white-space:pre-wrap; line-height:1.6;">${task.notes}</div>`;
        } else {
            notesEl.innerHTML = '<em style="color:#94a3b8;">No notes provided yet.</em>';
        }

        // Attachment
        const fileEl = document.getElementById('viewTaskFileContainer');
        if (task.attachment_url) {
            const fileName = task.attachment_url.split('/').pop();
            const isImage  = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
            if (isImage) {
                fileEl.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                        <img src="${task.attachment_url}" style="max-width:100%; max-height:300px; border-radius:8px;">
                        <a href="${task.attachment_url}" target="_blank" download style="color:#ea580c; font-weight:600; text-decoration:none;">📥 Download ${fileName}</a>
                    </div>`;
            } else {
                fileEl.innerHTML = `<a href="${task.attachment_url}" target="_blank" download style="color:#ea580c; font-weight:600; text-decoration:none;">📎 ${fileName}</a>`;
            }
        } else {
            fileEl.innerHTML = `<span style="color:#64748b;">No file attached.</span>`;
        }

        viewModal.classList.add('active');
    } catch (err) {
        console.error(err);
        alert('Could not load task details.');
    }
}