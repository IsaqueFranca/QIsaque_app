/**
 * QIsaque Vanilla JS Logic
 * Simulates React State, Zustand Store, and Routing
 */

// --- Utilities ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatDate = (date) => date.toISOString().split('T')[0];

// --- Initial State ---
const defaultState = {
    settings: {
        userName: 'Estudante',
        healthDegree: 'Medicine',
        finalGoal: 'Aprovação na Residência',
        monthlyGoalHours: 40,
        pomodoroDuration: 25
    },
    months: [],
    subjects: [],
    sessions: []
};

// --- Store (Mini Redux/Zustand) ---
const store = {
    state: JSON.parse(localStorage.getItem('qisaqueState')) || defaultState,
    
    save() {
        localStorage.setItem('qisaqueState', JSON.stringify(this.state));
        app.render(); // Re-render on state change
    },

    // Actions
    updateSettings(newSettings) {
        this.state.settings = { ...this.state.settings, ...newSettings };
        this.save();
    },
    
    addMonth(name) {
        this.state.months.push({ id: generateId(), name });
        this.save();
    },
    
    deleteMonth(id) {
        this.state.months = this.state.months.filter(m => m.id !== id);
        this.state.subjects = this.state.subjects.filter(s => s.monthId !== id);
        this.save();
    },

    addSubject(title, monthId, tag, goal) {
        this.state.subjects.push({
            id: generateId(),
            title, monthId, tag, weeklyGoal: goal,
            subtopics: []
        });
        this.save();
    },

    deleteSubject(id) {
        this.state.subjects = this.state.subjects.filter(s => s.id !== id);
        this.save();
    },

    addSubtopic(subjectId, title) {
        const sub = this.state.subjects.find(s => s.id === subjectId);
        if(sub) {
            sub.subtopics.push({ id: generateId(), title, isCompleted: false });
            this.save();
        }
    },

    toggleSubtopic(subjectId, subId) {
        const sub = this.state.subjects.find(s => s.id === subjectId);
        const topic = sub.subtopics.find(t => t.id === subId);
        if(topic) {
            topic.isCompleted = !topic.isCompleted;
            this.save();
        }
    },

    addSession(session) {
        this.state.sessions.push({ ...session, id: generateId() });
        this.save();
    },

    // Getters
    getStreak() {
        // Simplified streak logic for demo
        const dates = new Set(this.state.sessions.map(s => s.date));
        return dates.size; 
    }
};

// --- Application Logic ---
const app = {
    currentView: 'months',
    selectedMonthId: null,
    timerInterval: null,
    timerSeconds: 0,
    isTimerRunning: false,

    init() {
        this.router.navigate('months');
        this.renderHeader();
        // Add event listeners for modals
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if(e.target.id === 'modal-overlay') app.ui.closeModal();
        });
    },

    router: {
        navigate(view, params = {}) {
            app.currentView = view;
            if(params.monthId) app.selectedMonthId = params.monthId;
            else if(view === 'months') app.selectedMonthId = null;
            
            // Update sidebar active state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === view);
            });

            app.render();
        }
    },

    render() {
        this.renderHeader();
        const container = document.getElementById('view-container');
        container.innerHTML = '';

        switch(this.currentView) {
            case 'months':
                container.appendChild(this.views.months());
                break;
            case 'subjects':
                container.appendChild(this.views.subjects());
                break;
            case 'study':
                container.appendChild(this.views.study());
                break;
            case 'statistics':
                container.appendChild(this.views.statistics());
                break;
            case 'settings':
                container.appendChild(this.views.settings());
                break;
        }
    },

    renderHeader() {
        const s = store.state.settings;
        document.getElementById('user-name-display').textContent = s.userName;
        document.getElementById('header-goal').innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> ${s.finalGoal}`;
        
        const emojiMap = { 'Medicine': '⚕️', 'Pharmacy': '💊', 'Nursing': '✚', 'Dentistry': '🦷' };
        document.getElementById('degree-emoji').textContent = emojiMap[s.healthDegree] || '🎓';
        
        // Streak
        const streak = store.getStreak();
        document.getElementById('header-streak-count').textContent = streak;
    },

    views: {
        months() {
            const div = document.createElement('div');
            const months = store.state.months;
            
            let html = `
                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
                    <h2>Meus Meses</h2>
                    <button class="btn btn-primary" onclick="app.ui.openAddMonthModal()">+ Novo Mês</button>
                </div>
                <div class="grid-months">
            `;

            if(months.length === 0) html += `<p style="color:var(--muted)">Nenhum mês criado.</p>`;

            months.forEach(m => {
                // Calc progress
                const subjects = store.state.subjects.filter(s => s.monthId === m.id);
                let total = 0, completed = 0;
                subjects.forEach(s => {
                    total += s.subtopics.length;
                    completed += s.subtopics.filter(st => st.isCompleted).length;
                });
                const pct = total === 0 ? 0 : Math.round((completed/total)*100);

                html += `
                    <div class="card" onclick="app.router.navigate('subjects', {monthId: '${m.id}'})" style="cursor:pointer">
                        <div style="display:flex; justify-content:space-between;">
                            <h3>${m.name}</h3>
                            <button class="btn-ghost" onclick="event.stopPropagation(); store.deleteMonth('${m.id}')">🗑️</button>
                        </div>
                        <p style="font-size:0.8rem; color:var(--muted); margin-top:0.5rem;">${subjects.length} assuntos</p>
                        <div style="margin-top:1rem;">
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                                <span>Progresso</span>
                                <span>${pct}%</span>
                            </div>
                            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            div.innerHTML = html;
            return div;
        },

        subjects() {
            const div = document.createElement('div');
            const monthId = app.selectedMonthId;
            const subjects = store.state.subjects.filter(s => s.monthId === monthId);
            
            div.innerHTML = `
                <div style="margin-bottom:1rem;">
                    <button class="btn btn-ghost" onclick="app.router.navigate('months')">← Voltar</button>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
                    <h2>Assuntos</h2>
                    <button class="btn btn-primary" onclick="app.ui.openAddSubjectModal('${monthId}')">+ Adicionar Assunto</button>
                </div>
                <div id="subject-list"></div>
            `;

            const list = div.querySelector('#subject-list');
            if(subjects.length === 0) list.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--muted)">Nenhum assunto neste mês.</p>`;

            subjects.forEach(s => {
                const total = s.subtopics.length;
                const completed = s.subtopics.filter(t => t.isCompleted).length;
                const pct = total === 0 ? 0 : Math.round((completed/total)*100);

                const el = document.createElement('div');
                el.className = 'subject-item';
                el.innerHTML = `
                    <div class="subject-header" onclick="this.nextElementSibling.classList.toggle('open')">
                        <div style="flex:1">
                            <h3 style="font-size:1rem;">${s.title}</h3>
                            <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
                                ${s.tag ? `<span style="font-size:0.7rem; background:rgba(14,165,233,0.1); color:var(--primary); padding:2px 6px; border-radius:4px;">${s.tag}</span>` : ''}
                            </div>
                            <div class="progress-bar" style="height:4px; margin-top:0.5rem; width:100px;"><div class="progress-fill" style="width:${pct}%"></div></div>
                        </div>
                        <button class="btn-ghost" onclick="event.stopPropagation(); store.deleteSubject('${s.id}')">🗑️</button>
                    </div>
                    <div class="subtopic-list">
                        ${s.subtopics.map(t => `
                            <div class="subtopic-item">
                                <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="store.toggleSubtopic('${s.id}', '${t.id}')">
                                <span style="${t.isCompleted ? 'text-decoration:line-through; color:var(--muted)' : ''}">${t.title}</span>
                            </div>
                        `).join('')}
                        <form onsubmit="event.preventDefault(); store.addSubtopic('${s.id}', this.elements.title.value); this.reset();" style="display:flex; gap:0.5rem; margin-top:0.75rem;">
                            <input name="title" class="input" placeholder="Novo subtópico..." style="margin-bottom:0;" required>
                            <button type="submit" class="btn btn-outline">+</button>
                        </form>
                    </div>
                `;
                list.appendChild(el);
            });

            return div;
        },

        study() {
            const div = document.createElement('div');
            // Check if timer is running to restore state
            const isRunning = app.isTimerRunning;
            
            div.innerHTML = `
                <h2>Iniciar Estudos</h2>
                <div class="card timer-container">
                    <div class="timer-display" id="timer-display">${app.utils.formatTime(app.timerSeconds || store.state.settings.pomodoroDuration * 60)}</div>
                    <p id="timer-status" style="color:var(--primary); letter-spacing:2px; font-weight:600; text-transform:uppercase; margin-bottom:1.5rem;">${isRunning ? 'FOCANDO' : 'PRONTO'}</p>
                    
                    <div style="display:grid; gap:0.5rem;">
                        ${!isRunning ? `<button class="btn btn-primary" onclick="app.logic.startTimer()" style="height:3rem; font-size:1.1rem;">PLAY</button>` : 
                        `<button class="btn btn-outline" onclick="app.logic.pauseTimer()" style="height:3rem;">PAUSAR</button>`}
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                            <button class="btn btn-danger" onclick="app.logic.stopTimer('incomplete')">ABANDONAR</button>
                            <button class="btn btn-success" style="background:#22c55e; color:white;" onclick="app.logic.stopTimer('completed')">FINALIZAR</button>
                        </div>
                    </div>

                    <button class="btn btn-outline" style="margin-top:1.5rem; width:100%; border-color:var(--primary); color:var(--primary);" onclick="document.getElementById('chat-drawer').classList.add('open')">
                        ✨ AI Assist
                    </button>
                </div>

                <!-- Chat Drawer -->
                <div id="chat-drawer" class="chat-drawer">
                    <div style="padding:1rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <h3>IA Tutor</h3>
                        <button class="btn-ghost" onclick="document.getElementById('chat-drawer').classList.remove('open')">✕</button>
                    </div>
                    <div class="chat-messages" id="chat-history">
                        <div class="message msg-ai">Olá! Sou seu tutor. O que vamos estudar hoje?</div>
                    </div>
                    <div style="padding:1rem; border-top:1px solid var(--border);">
                        <form onsubmit="event.preventDefault(); app.logic.sendMessage(this.elements.msg.value); this.reset();" style="display:flex; gap:0.5rem;">
                            <input name="msg" class="input" placeholder="Pergunte..." style="margin-bottom:0;" required>
                            <button type="submit" class="btn btn-primary">></button>
                        </form>
                    </div>
                </div>
            `;
            return div;
        },

        statistics() {
            const div = document.createElement('div');
            
            // Generate Heatmap Data
            let daysHtml = '';
            for(let i=0; i<365; i++) {
                // Simulating random data for visual, in real app map store.sessions
                const r = Math.random();
                const lvl = r > 0.9 ? 4 : r > 0.8 ? 3 : r > 0.7 ? 2 : r > 0.6 ? 1 : 0;
                daysHtml += `<div class="day-cell day-l${lvl}" title="Dia ${i}"></div>`;
            }

            // Calculate total hours
            const totalSec = store.state.sessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0);
            const hours = Math.floor(totalSec / 3600);

            div.innerHTML = `
                <h2>Estatísticas</h2>
                
                <div class="card" style="margin-top:1rem;">
                    <h3>Histórico Anual</h3>
                    <div class="heatmap-container" style="margin-top:1rem;">
                        <div class="heatmap-grid">
                            ${daysHtml}
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:4px; font-size:0.75rem; margin-top:0.5rem; color:var(--muted);">
                        <span>Menos</span>
                        <div class="day-cell day-l0"></div>
                        <div class="day-cell day-l1"></div>
                        <div class="day-cell day-l2"></div>
                        <div class="day-cell day-l3"></div>
                        <div class="day-cell day-l4"></div>
                        <span>Mais</span>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-top:1rem;">
                    <div class="card">
                        <p style="text-transform:uppercase; font-size:0.75rem; color:var(--muted); font-weight:700;">Horas Totais</p>
                        <p style="font-size:2.5rem; font-weight:800; color:var(--primary);">${hours}h</p>
                    </div>
                     <div class="card">
                        <p style="text-transform:uppercase; font-size:0.75rem; color:var(--muted); font-weight:700;">Sessões</p>
                        <p style="font-size:2.5rem; font-weight:800; color:var(--foreground);">${store.state.sessions.length}</p>
                    </div>
                </div>
            `;
            return div;
        },

        settings() {
            const s = store.state.settings;
            const div = document.createElement('div');
            div.innerHTML = `
                <h2>Configurações</h2>
                <div class="card" style="max-width:600px; margin-top:1rem;">
                    <form onsubmit="event.preventDefault(); app.logic.saveSettings(this);">
                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Nome</label>
                        <input name="userName" class="input" value="${s.userName}">

                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Área (Degree)</label>
                        <select name="healthDegree" class="input">
                            <option value="Medicine" ${s.healthDegree === 'Medicine' ? 'selected' : ''}>Medicina</option>
                            <option value="Pharmacy" ${s.healthDegree === 'Pharmacy' ? 'selected' : ''}>Farmácia</option>
                            <option value="Nursing" ${s.healthDegree === 'Nursing' ? 'selected' : ''}>Enfermagem</option>
                            <option value="Dentistry" ${s.healthDegree === 'Dentistry' ? 'selected' : ''}>Odontologia</option>
                        </select>

                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Meta Final</label>
                        <input name="finalGoal" class="input" value="${s.finalGoal}">

                        <label style="display:block; margin-bottom:0.5rem; font-weight:500;">Duração Pomodoro (min)</label>
                        <input name="pomodoroDuration" type="number" class="input" value="${s.pomodoroDuration}">

                        <button type="submit" class="btn btn-primary" style="margin-top:1rem;">Salvar</button>
                    </form>
                </div>
            `;
            return div;
        }
    },

    ui: {
        toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        },
        openAddMonthModal() {
            const html = `
                <h3>Novo Mês</h3>
                <form onsubmit="event.preventDefault(); store.addMonth(this.elements.name.value); app.ui.closeModal();">
                    <input name="name" class="input" placeholder="Ex: Janeiro - Cardiologia" required style="margin-top:1rem;">
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="btn btn-ghost" onclick="app.ui.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Criar</button>
                    </div>
                </form>
            `;
            this.showModal(html);
        },
        openAddSubjectModal(monthId) {
            const html = `
                <h3>Novo Assunto</h3>
                <form onsubmit="event.preventDefault(); store.addSubject(this.elements.title.value, '${monthId}', this.elements.tag.value, 0); app.ui.closeModal();">
                    <input name="title" class="input" placeholder="Título" required style="margin-top:1rem;">
                    <input name="tag" class="input" placeholder="Tag (Opcional)">
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="btn btn-ghost" onclick="app.ui.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>
            `;
            this.showModal(html);
        },
        showModal(html) {
            const overlay = document.getElementById('modal-overlay');
            const content = document.getElementById('modal-content');
            content.innerHTML = html;
            overlay.classList.remove('hidden');
        },
        closeModal() {
            document.getElementById('modal-overlay').classList.add('hidden');
        }
    },

    logic: {
        saveSettings(form) {
            const formData = new FormData(form);
            const updates = {};
            formData.forEach((value, key) => updates[key] = value);
            // Handle number conversion
            updates.pomodoroDuration = parseInt(updates.pomodoroDuration);
            store.updateSettings(updates);
            alert('Configurações salvas!');
        },

        startTimer() {
            if(!app.isTimerRunning) {
                if(app.timerSeconds === 0) app.timerSeconds = store.state.settings.pomodoroDuration * 60;
                app.isTimerRunning = true;
                app.render(); // update UI to Pause button
                
                app.timerInterval = setInterval(() => {
                    app.timerSeconds--;
                    const display = document.getElementById('timer-display');
                    if(display) display.textContent = app.utils.formatTime(app.timerSeconds);
                    
                    if(app.timerSeconds <= 0) {
                        this.stopTimer('completed');
                        alert('Pomodoro Finalizado!');
                    }
                }, 1000);
            }
        },

        pauseTimer() {
            clearInterval(app.timerInterval);
            app.isTimerRunning = false;
            app.render();
        },

        stopTimer(status) {
            clearInterval(app.timerInterval);
            
            // Record session if > 1 min
            const totalTime = (store.state.settings.pomodoroDuration * 60) - app.timerSeconds;
            if(totalTime > 60) {
                store.addSession({
                    date: formatDate(new Date()),
                    duration: totalTime,
                    startTime: Date.now(),
                    status: status,
                    subjectId: 'generic' // Simplified for demo
                });
            }

            app.isTimerRunning = false;
            app.timerSeconds = 0;
            app.render();
        },

        async sendMessage(text) {
            const history = document.getElementById('chat-history');
            
            // User Msg
            const userDiv = document.createElement('div');
            userDiv.className = 'message msg-user';
            userDiv.textContent = text;
            history.appendChild(userDiv);

            // Mock AI Response or Fetch if Key exists
            let responseText = "Configure sua API Key nas configurações para falar comigo de verdade!";
            
            const apiKey = process.env.API_KEY;
            if(apiKey) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'message msg-ai';
                loadingDiv.textContent = '...';
                history.appendChild(loadingDiv);
                
                try {
                    // Simple fetch to Gemini API REST endpoint
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `You are a study tutor for ${store.state.settings.healthDegree}. User says: ${text}` }] }]
                        })
                    });
                    const data = await res.json();
                    responseText = data.candidates[0].content.parts[0].text;
                    loadingDiv.remove();
                } catch(e) {
                    responseText = "Erro ao conectar com a IA.";
                    if(loadingDiv) loadingDiv.remove();
                }
            }

            const aiDiv = document.createElement('div');
            aiDiv.className = 'message msg-ai';
            aiDiv.textContent = responseText;
            history.appendChild(aiDiv);
            history.scrollTop = history.scrollHeight;
        }
    },

    utils: {
        formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }
    }
};

// Start
app.init();