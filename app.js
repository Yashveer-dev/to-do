document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const isAuthPage = path.includes('auth.html');
    const isDashboard = path.includes('dashboard.html');
    const isAdmin = path.includes('admin.html');
    const isIndex = path.endsWith('/') || path.endsWith('index.html');

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!isAuthPage && !isIndex && !currentUser) {
        window.location.href = 'auth.html';
        return;
    }

    if ((isAuthPage || isIndex) && currentUser) {
        if (currentUser.role === 'Admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    if (isAdmin && currentUser && currentUser.role !== 'Admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
        });
    }

    if (isAuthPage) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const loginSection = document.getElementById('loginSection');
        const registerSection = document.getElementById('registerSection');

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginSection.classList.add('hidden');
                registerSection.classList.remove('hidden');
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('regUsername').value;
                const role = document.getElementById('regRole').value;
                const pass = document.getElementById('regPassword').value;
                
                const users = JSON.parse(localStorage.getItem('users')) || [];
                if (users.find(u => u.username === username)) {
                    alert('Username already exists');
                    return;
                }
                
                const newUser = { username, role, pass };
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                
                window.location.href = role === 'Admin' ? 'admin.html' : 'dashboard.html';
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('loginUsername').value;
                const pass = document.getElementById('loginPassword').value;
                
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.username === username && u.pass === pass);
                
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.location.href = user.role === 'Admin' ? 'admin.html' : 'dashboard.html';
                } else {
                    alert('Invalid credentials');
                }
            });
        }
    }

    if (isDashboard || isAdmin) {
        const taskList = document.getElementById('taskList');
        const taskModal = document.getElementById('taskModal');
        const deleteModal = document.getElementById('deleteModal');
        const taskForm = document.getElementById('taskForm');
        const showAddTaskModalBtn = document.getElementById('showAddTaskModal');
        const closeTaskModalBtn = document.getElementById('closeTaskModal');
        const cancelDeleteModalBtn = document.getElementById('cancelDeleteModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const modalTitle = document.getElementById('modalTitle');
        
        const searchInput = document.getElementById('searchInput');
        const filterCategory = document.getElementById('filterCategory');
        const filterPriority = document.getElementById('filterPriority');
        const filterStatus = document.getElementById('filterStatus');
        
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let editingTaskId = null;
        let deletingTaskId = null;

        const saveTasks = () => {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        };

        const renderTasks = () => {
            if (!taskList) return;
            taskList.innerHTML = '';
            
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const catFilter = filterCategory ? filterCategory.value : '';
            const prioFilter = filterPriority ? filterPriority.value : '';
            const statFilter = filterStatus ? filterStatus.value : '';

            let userTasks = tasks;
            if (!isAdmin) {
                userTasks = tasks.filter(t => t.owner === currentUser.username);
            }

            const filteredTasks = userTasks.filter(t => {
                const matchSearch = t.title.toLowerCase().includes(searchTerm) || t.desc.toLowerCase().includes(searchTerm);
                const matchCat = catFilter ? t.category === catFilter : true;
                const matchPrio = prioFilter ? t.priority === prioFilter : true;
                const matchStat = statFilter ? t.status === statFilter : true;
                return matchSearch && matchCat && matchPrio && matchStat;
            });

            filteredTasks.forEach(task => {
                const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
                const el = document.createElement('div');
                el.className = `task-item ${isOverdue ? 'overdue' : ''}`;
                
                const prioClass = task.priority === 'High' ? 'badge-high' : task.priority === 'Medium' ? 'badge-medium' : 'badge-low';

                el.innerHTML = `
                    <div class="task-header">
                        <h3 class="task-title">${task.title}</h3>
                        <span class="badge ${prioClass}">${task.priority}</span>
                    </div>
                    <p style="font-size: 0.875rem; color: var(--text-muted);">${task.desc}</p>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
                        <div><strong>Status:</strong> ${task.status}</div>
                        <div><strong>Category:</strong> ${task.category}</div>
                        <div><strong>Deadline:</strong> ${task.deadline}</div>
                        ${isAdmin ? `<div><strong>Owner:</strong> ${task.owner}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="editTask('${task.id}')">Edit</button>
                        <button class="btn btn-danger" style="flex: 1;" onclick="requestDeleteTask('${task.id}')">Delete</button>
                    </div>
                `;
                taskList.appendChild(el);
            });

            updateProgress(userTasks);
        };

        const updateProgress = (userTasks) => {
            const taskProgress = document.getElementById('taskProgress');
            const progressText = document.getElementById('progressText');
            if (taskProgress && progressText) {
                const total = userTasks.length;
                const completed = userTasks.filter(t => t.status === 'Completed').length;
                const pct = total === 0 ? 0 : (completed / total) * 100;
                taskProgress.style.width = `${pct}%`;
                progressText.innerText = `${completed} / ${total} Completed`;
            }
        };

        window.editTask = (id) => {
            editingTaskId = id;
            const task = tasks.find(t => t.id === id);
            if (task && taskForm) {
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDesc').value = task.desc;
                document.getElementById('taskCategory').value = task.category;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDeadline').value = task.deadline;
                document.getElementById('taskStatus').value = task.status;
                modalTitle.innerText = 'Edit Task';
                taskModal.classList.add('active');
            }
        };

        window.requestDeleteTask = (id) => {
            deletingTaskId = id;
            if (deleteModal) deleteModal.classList.add('active');
        };

        if (showAddTaskModalBtn) {
            showAddTaskModalBtn.addEventListener('click', () => {
                editingTaskId = null;
                taskForm.reset();
                modalTitle.innerText = 'Add Task';
                taskModal.classList.add('active');
            });
        }

        if (closeTaskModalBtn) {
            closeTaskModalBtn.addEventListener('click', () => {
                taskModal.classList.remove('active');
            });
        }

        if (cancelDeleteModalBtn) {
            cancelDeleteModalBtn.addEventListener('click', () => {
                deleteModal.classList.remove('active');
                deletingTaskId = null;
            });
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                if (deletingTaskId) {
                    tasks = tasks.filter(t => t.id !== deletingTaskId);
                    saveTasks();
                    renderTasks();
                    deleteModal.classList.remove('active');
                    deletingTaskId = null;
                }
            });
        }

        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const task = {
                    id: editingTaskId || Date.now().toString(),
                    owner: editingTaskId ? tasks.find(t => t.id === editingTaskId).owner : currentUser.username,
                    title: document.getElementById('taskTitle').value,
                    desc: document.getElementById('taskDesc').value,
                    category: document.getElementById('taskCategory').value,
                    priority: document.getElementById('taskPriority').value,
                    deadline: document.getElementById('taskDeadline').value,
                    status: document.getElementById('taskStatus').value
                };

                if (editingTaskId) {
                    tasks = tasks.map(t => t.id === editingTaskId ? task : t);
                } else {
                    tasks.push(task);
                }

                saveTasks();
                renderTasks();
                taskModal.classList.remove('active');
            });
        }

        if (searchInput) searchInput.addEventListener('input', renderTasks);
        if (filterCategory) filterCategory.addEventListener('change', renderTasks);
        if (filterPriority) filterPriority.addEventListener('change', renderTasks);
        if (filterStatus) filterStatus.addEventListener('change', renderTasks);

        renderTasks();
    }
});
