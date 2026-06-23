const API_BASE_URL = 'https://task-manager.theoppty.com/api';

// ===== DOM REFERENCES =====
const openModalBtn   = document.getElementById('openModalBtn');
const closeModalBtn  = document.getElementById('closeModalBtn');
const cancelBtn      = document.getElementById('cancelBtn');
const modalOverlay   = document.getElementById('modalOverlay');
const newTeamForm    = document.getElementById('newTeamForm');
const teamsGrid      = document.getElementById('teamsGrid');
const totalTeamsStat = document.getElementById('totalTeams');

let teamCount = 0;

// ===== MODAL CONTROLS =====
openModalBtn.addEventListener('click', () => modalOverlay.classList.add('active'));

function closeModal() {
    modalOverlay.classList.remove('active');
    newTeamForm.reset();
}

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });


// ===== FETCH TEAMS FROM BACKEND =====
async function fetchTeams() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams/`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const teams = await response.json();
        
        teamsGrid.innerHTML = '';
        teamCount = 0;
        
        teams.forEach(team => {
            addTeamCard(team.id, team.name, team.department, team.icon, team.description);
            teamCount++;
        });
        
        totalTeamsStat.textContent = teamCount;
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

// ===== CREATE NEW TEAM =====
newTeamForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const teamData = {
        name: document.getElementById('teamName').value.trim(),
        department: document.getElementById('teamDept').value.trim(),
        icon: document.getElementById('teamEmoji').value.trim() || '👥',
        description: document.getElementById('teamDesc').value.trim()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/teams/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData)
        });

        if (response.ok) {
            fetchTeams(); 
            closeModal();
        }
    } catch (error) {
        console.error('Error creating team:', error);
    }
});

// ===== BUILD TEAM CARD HTML =====
function addTeamCard(id, name, department, icon, description) {
    const colors = [
        { bg: '#e0e7ff', color: '#2563eb' },
        { bg: '#fef9c3', color: '#ca8a04' },
        { bg: '#fce7f3', color: '#db2777' },
        { bg: '#dcfce7', color: '#16a34a' },
        { bg: '#ede9fe', color: '#7c3aed' },
        { bg: '#ffedd5', color: '#ea580c' },
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const card = document.createElement('div');
    card.classList.add('team-card');

    card.innerHTML = `
        <div class="team-card-header">
            <div class="team-icon" style="background:${randomColor.bg}; color:${randomColor.color};">
                ${icon}
            </div>
            <div class="team-info">
                <h3>${name}</h3>
                <span class="team-dept">${department}</span>
            </div>
            <div class="team-options" onclick="toggleDropdown(this)">
                ⋮
                <div class="dropdown-menu">
                    <a href="teamdetails.html?id=${id}">View Team</a>
                    <a href="#" class="delete-option" onclick="deleteTeam(this, ${id})">Delete Team</a>
                </div>
            </div>
        </div>

        <p class="team-description">${description}</p>

        <div class="team-card-footer">
            <span class="task-count">🗂 Tasks</span>
            <button class="view-team-btn" onclick="window.location.href='../teamdetails/teamdetails.html?id=${id}'">View Team</button>
        </div>
    `;

    teamsGrid.append(card);
}

// ===== LOGOUT FUNCTION =====
function handleLogout() {
    // Clear saved authentication tokens or user data if you have any
    localStorage.removeItem('token'); 
    sessionStorage.clear();

    // Redirect to the index page
    window.location.href = '../../index.html';
}

// ===== DELETE TEAM =====
async function deleteTeam(element, id) {
    const card = element.closest('.team-card');

    if (confirm('Are you sure you want to delete this team?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/teams/${id}/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';

                setTimeout(() => {
                    card.remove();
                    teamCount--;
                    totalTeamsStat.textContent = teamCount;
                }, 300);
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
        }
    }
}

// ===== DROPDOWN TOGGLE =====
function toggleDropdown(element) {
    document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
        if (menu !== element.querySelector('.dropdown-menu')) menu.classList.remove('open');
    });
    const menu = element.querySelector('.dropdown-menu');
    menu.classList.toggle('open');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.team-options')) {
        document.querySelectorAll('.dropdown-menu.open').forEach(menu => menu.classList.remove('open'));
    }
});

// Initialize the grid on page load
fetchTeams();