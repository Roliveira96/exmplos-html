const ICONS_LIST = ['🚀', '🛠️', '🎯', '📊', '⚡', '✨', '🐛', '📝', '🔥', '💡'];

const TEAMS = {
    'Sem equipe': { icon: '👥', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.22)' },
    'Desenvolvimento': { icon: '💻', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.22)' },
    'Design UX/UI': { icon: '🎨', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.22)' },
    'Suporte técnico': { icon: '🛠️', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.22)' },
    'Gerenciamento': { icon: '📋', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.22)' }
};

const USERS = [
    { name: 'Ana Silva', team: 'Design UX/UI', initials: 'AS', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80' },
    { name: 'Bruno Souza', team: 'Desenvolvimento', initials: 'BS', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80' },
    { name: 'Carlos Santos', team: 'Desenvolvimento', initials: 'CS', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80' },
    { name: 'Daniel Rocha', team: 'Suporte técnico', initials: 'DR', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80' },
    { name: 'Elisa Costa', team: 'Gerenciamento', initials: 'EC', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80' }
];

let currentAssigneeTab = 'times';
let assigneeSearchQuery = '';

// Default initial state
const DEFAULT_STATE = [
    {
        id: 'phase-1',
        name: 'Desenvolvimento Inicial',
        icon: '🚀',
        activities: [
            {
                id: 'act-1',
                title: 'Planejar Arquitetura do Banco de Dados',
                description: 'Estruturar tabelas, chaves primárias e relacionamentos primordiais do sistema.',
                assignee: { type: 'team', name: 'Desenvolvimento' },
                priority: 'Alta',
                status: 'Em andamento',
                timeEstimate: '6h',
                tags: ['Database', 'Setup'],
                attachments: ['schema_diagram.pdf'],
                subActivities: [
                    {
                        id: 'act-1-sub-1',
                        title: 'Criar Script de Migração Inicial',
                        description: 'Escrever as queries DDL estruturadas em SQL para automação de ambiente.',
                        assignee: { type: 'team', name: 'Desenvolvimento' },
                        priority: 'Média',
                        status: 'A fazer',
                        timeEstimate: '2h',
                        tags: ['SQL'],
                        attachments: [],
                        subActivities: []
                    }
                ]
            },
            {
                id: 'act-2',
                title: 'Desenhar Mockups de Alta Fidelidade',
                description: 'Prototipar telas utilizando as diretrizes do Design System corporativo.',
                assignee: { type: 'team', name: 'Design UX/UI' },
                priority: 'Média',
                status: 'A fazer',
                timeEstimate: '12h',
                tags: ['Figma', 'UI'],
                attachments: [],
                subActivities: []
            }
        ]
    }
];

let state = [];
let expandedActivities = new Set();
let activeTabs = {};

let activeEditingActivityId = null;
let activeSubActivityCreatorId = null;
let currentModalAttachments = [];
let draggedActivityId = null;
let draggedPhaseId = null;
let isDraggingAllowed = false;

// LocalStorage helpers
function normalizeAssignee(activities) {
    if (!activities) return;
    activities.forEach(act => {
        if (!act.assignee) {
            if (act.team) {
                if (TEAMS[act.team]) {
                    act.assignee = { type: 'team', name: act.team };
                } else {
                    const user = USERS.find(u => u.name === act.team);
                    if (user) {
                        act.assignee = { type: 'user', name: user.name };
                    } else {
                        act.assignee = { type: 'team', name: 'Sem equipe' };
                    }
                }
            } else {
                act.assignee = { type: 'team', name: 'Sem equipe' };
            }
        }
        delete act.team;
        if (act.subActivities && act.subActivities.length > 0) {
            normalizeAssignee(act.subActivities);
        }
    });
}

function loadState() {
    try {
        const storedState = localStorage.getItem('aruna_planejador_state');
        if (storedState) {
            state = JSON.parse(storedState);
        } else {
            state = DEFAULT_STATE;
        }
        state.forEach(p => normalizeAssignee(p.activities));

        const storedExpanded = localStorage.getItem('aruna_expanded_activities');
        if (storedExpanded) {
            expandedActivities = new Set(JSON.parse(storedExpanded));
        }

        const storedTabs = localStorage.getItem('aruna_active_tabs');
        if (storedTabs) {
            activeTabs = JSON.parse(storedTabs);
        }
    } catch (e) {
        console.error("Erro ao carregar estado do localStorage:", e);
        state = DEFAULT_STATE;
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('aruna_planejador_state', JSON.stringify(state));
        localStorage.setItem('aruna_expanded_activities', JSON.stringify(Array.from(expandedActivities)));
        localStorage.setItem('aruna_active_tabs', JSON.stringify(activeTabs));
    } catch (e) {
        console.error("Erro ao salvar estado no localStorage:", e);
    }
}

function saveAndRefresh() {
    saveToLocalStorage();
    updateStats();
    render();
}

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${
        isError 
        ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
        : 'bg-slate-900/95 border-slate-800 text-slate-200'
    }`;
    
    toast.innerHTML = `
        <span class="flex-shrink-0">
            ${isError ? 
            `<svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>` : 
            `<svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`}
        </span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Stats Dashboard
function countStats(activities, stats) {
    activities.forEach(act => {
        stats.total++;
        if (act.status === 'Concluído') stats.completed++;
        else if (act.status === 'Em andamento') stats.inProgress++;
        else if (act.status === 'Impedimento') stats.impediment++;
        else stats.todo++;
        
        if (act.subActivities && act.subActivities.length > 0) {
            countStats(act.subActivities, stats);
        }
    });
}

function updateStats() {
    const stats = { total: 0, completed: 0, inProgress: 0, impediment: 0, todo: 0 };
    state.forEach(phase => countStats(phase.activities, stats));
    
    const container = document.getElementById('stats-dashboard');
    if (!container) return;
    
    const percentCompleted = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const progressVal = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    
    container.innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-6">
            <div class="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-800/80">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Atividades</span>
                <div class="flex items-baseline gap-2 mt-2">
                    <span class="text-3xl font-bold text-white font-outfit">${stats.total}</span>
                    <span class="text-xs text-indigo-400 font-semibold font-outfit">100%</span>
                </div>
            </div>
            <div class="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-800/80">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Concluídas</span>
                <div class="flex items-baseline gap-2 mt-2">
                    <span class="text-3xl font-bold text-emerald-400 font-outfit">${stats.completed}</span>
                    <span class="text-xs text-emerald-500 font-semibold font-outfit">${percentCompleted}%</span>
                </div>
            </div>
            <div class="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-800/80">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Em Andamento</span>
                <div class="flex items-baseline gap-2 mt-2">
                    <span class="text-3xl font-bold text-indigo-400 font-outfit">${stats.inProgress}</span>
                    <span class="text-xs text-indigo-500 font-semibold font-outfit">${stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%</span>
                </div>
            </div>
            <div class="glass-panel rounded-2xl p-4 flex flex-col justify-between border border-slate-800/80 relative overflow-hidden ${stats.impediment > 0 ? 'pulse-impediment border-amber-500/50' : ''}">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Impedimentos</span>
                <div class="flex items-baseline gap-2 mt-2">
                    <span class="text-3xl font-bold ${stats.impediment > 0 ? 'text-amber-400' : 'text-slate-500'} font-outfit">${stats.impediment}</span>
                    <span class="text-xs ${stats.impediment > 0 ? 'text-amber-500' : 'text-slate-500'} font-semibold font-outfit">${stats.total > 0 ? Math.round((stats.impediment / stats.total) * 100) : 0}%</span>
                </div>
            </div>
        </div>
        
        <div class="max-w-5xl mx-auto mb-6 px-1">
            <div class="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                <span>Progresso Geral do Projeto</span>
                <span class="font-bold text-slate-200">${percentCompleted}% (${stats.completed}/${stats.total})</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div class="bg-indigo-600 h-2 rounded-full transition-all duration-500" style="width: ${progressVal}%"></div>
            </div>
        </div>
    `;
}

function render() {
    const container = document.getElementById('phases-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (state.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 border-2 border-dashed border-slate-800/80 rounded-2xl">
                <svg class="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5M5 19V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v5m-6 0h6m-3-3v6m-9-6h.01M19 19h.01"></path></svg>
                <h3 class="text-slate-300 font-semibold">Nenhuma fase criada</h3>
                <p class="text-xs text-slate-500 mt-1">Clique em "Adicionar Fase" no topo para iniciar seu fluxo.</p>
            </div>
        `;
        return;
    }

    state.forEach((phase) => {
        const phaseEl = document.createElement('div');
        phaseEl.className = 'glass-panel rounded-2xl p-6 shadow-xl space-y-6 border border-slate-800/80';
        
        let iconOptionsHtml = ICONS_LIST.map(ic => 
            `<button onclick="updatePhaseIcon('${phase.id}', '${ic}')" class="p-1.5 hover:bg-slate-800 rounded transition-colors ${phase.icon === ic ? 'bg-indigo-600/30 border border-indigo-500' : ''}">${ic}</button>`
        ).join('');

        phaseEl.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <div class="relative group">
                        <button class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl transition-all border border-slate-700/50">
                            ${phase.icon}
                        </button>
                        <div class="absolute top-12 left-0 bg-slate-900 border border-slate-800 p-2 rounded-xl grid grid-cols-5 gap-1 shadow-2xl opacity-0 scale-95 pointer-events-none group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto transition-all z-20">
                            ${iconOptionsHtml}
                        </div>
                    </div>
                    <input type="text" value="${phase.name}" onchange="updatePhaseName('${phase.id}', this.value)" class="bg-transparent text-white font-bold text-lg focus:outline-none focus:border-b focus:border-indigo-500 px-1 py-0.5 w-full sm:w-64" placeholder="Título da fase">
                </div>
                <div class="flex items-center gap-2 ml-auto sm:ml-0">
                    <button onclick="deletePhase('${phase.id}')" class="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-950/20 transition-all" title="Excluir fase inteira">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>

            <div class="space-y-3">
                <div id="activities-container-${phase.id}" class="space-y-3 min-h-[40px]" ondragover="handleRootContainerDragOver(event)" ondrop="handleRootContainerDrop(event, '${phase.id}')">
                    ${renderActivitiesList(phase.activities, phase.id, 1)}
                </div>

                <div class="pt-4 border-t border-slate-800/40">
                    <div class="flex items-center gap-2 max-w-xl">
                        <div class="relative flex-1">
                            <input type="text" id="quick-add-input-${phase.id}" onkeydown="handleQuickAddKey(event, '${phase.id}')" placeholder="Nome da nova atividade..." class="w-full bg-slate-950 border border-slate-800/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 transition-all">
                            <span class="absolute left-3.5 top-3.5 text-slate-500">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            </span>
                        </div>
                        <button onclick="addActivity('${phase.id}')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(phaseEl);
    });
}

function renderActivitiesList(activities, phaseId, depth) {
    if (!activities || activities.length === 0) {
        return '';
    }

    return activities.map((activity, index) => {
        const hasChildren = activity.subActivities && activity.subActivities.length > 0;
        const isExpanded = expandedActivities.has(activity.id);
        const currentTab = activeTabs[activity.id] || 'descricao';
        
        let priorityColor = 'bg-slate-800 text-slate-400 border border-slate-700/50';
        if (activity.priority === 'Alta') priorityColor = 'bg-amber-950/60 text-amber-400 border border-amber-850/50';
        if (activity.priority === 'Crítica') priorityColor = 'bg-rose-950/80 text-rose-400 border border-rose-800/50';
        if (activity.priority === 'Baixa') priorityColor = 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30';

        let priorityLabel = activity.priority || 'Média';
        if (priorityLabel === 'Crítica') priorityLabel = 'Urgente';

        const statusVal = activity.status || 'A fazer';
        let statusColor = 'bg-slate-950/80 border border-slate-800 text-slate-400';
        if (statusVal === 'Em andamento') statusColor = 'bg-indigo-950/50 border border-indigo-900/50 text-indigo-300';
        if (statusVal === 'Impedimento') statusColor = 'bg-amber-950/50 border border-amber-900/50 text-amber-300';
        if (statusVal === 'Concluído') statusColor = 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-300';

        // Obter time e cor de fundo correspondente
        const assignee = activity.assignee || { type: 'team', name: 'Sem equipe' };
        let teamName = 'Sem equipe';
        if (assignee.type === 'team') {
            teamName = assignee.name;
        } else {
            const user = USERS.find(u => u.name === assignee.name);
            if (user) {
                teamName = user.team;
            }
        }
        const teamInfo = TEAMS[teamName] || TEAMS['Sem equipe'];
        const cardBgColor = teamInfo.bg;

        // Determinar cor da borda com base na prioridade
        let cardBorderColor = 'rgba(100, 116, 139, 0.4)'; // Cinza para nenhuma prioridade
        if (activity.priority === 'Baixa') {
            cardBorderColor = 'rgba(16, 185, 129, 0.6)'; // Verde para baixa
        } else if (activity.priority === 'Média') {
            cardBorderColor = 'rgba(59, 130, 246, 0.6)'; // Azul para média
        } else if (activity.priority === 'Alta') {
            cardBorderColor = 'rgba(234, 179, 8, 0.6)'; // Amarela para alta
        } else if (activity.priority === 'Crítica' || activity.priority === 'Urgente') {
            cardBorderColor = 'rgba(239, 68, 68, 0.7)'; // Vermelha para urgente
        }

        const isCreatorActive = activeSubActivityCreatorId === activity.id;

        return `
            <div class="tree-node-wrapper animate-slide-in">
                <div draggable="true" 
                     id="activity-card-${activity.id}"
                     ondragstart="handleDragStart(event, '${phaseId}', '${activity.id}')"
                     ondragover="handleDragOver(event, '${phaseId}', '${activity.id}')"
                     ondragleave="handleDragLeave(event, '${activity.id}')"
                     ondragend="handleDragEnd(event, '${activity.id}')"
                     ondrop="handleDrop(event, '${phaseId}', '${activity.id}')"
                     ondblclick="openEditModal('${phaseId}', '${activity.id}')" 
                     class="tree-node flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl p-4 gap-4 transition-all cursor-default select-none relative ${statusVal === 'Concluído' ? 'status-concluido' : ''}"
                     style="background-color: ${cardBgColor}; border-color: ${cardBorderColor};">
                    
                    <div class="card-left-indicator pointer-events-none" style="background-color: ${getDepthColor(depth)}"></div>

                    <!-- Ícone de Arrastar (Drag Handle) -->
                    <div class="flex items-center justify-center w-5 h-5 text-slate-500 hover:text-indigo-400 flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors pl-1"
                         onmousedown="isDraggingAllowed = true"
                         onmouseup="isDraggingAllowed = false"
                         onmouseleave="isDraggingAllowed = false">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </div>

                    <!-- Conteúdo do card -->
                    <div class="flex items-center gap-3 flex-1 min-w-0 pl-1 pointer-events-none">
                        <div class="flex items-center justify-center w-6 h-5.5 rounded bg-slate-850 text-[10px] font-bold text-indigo-400 flex-shrink-0">
                            N${depth}
                        </div>
                        
                        <!-- Elemento de Responsável Expandível (Time/Membro) -->
                        ${renderAssigneeBadge(activity.assignee, phaseId, activity.id)}

                        <div class="flex flex-wrap items-center gap-2 min-w-0">
                            <span class="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-md ${statusVal === 'Concluído' ? 'line-through text-slate-500' : ''}">${activity.title}</span>
                            
                            <!-- Status Badge -->
                            <span onclick="openQuickSelect(event, '${phaseId}', '${activity.id}', 'status')" 
                                  class="text-[10px] font-bold px-2 py-0.5 rounded-full hover:scale-105 transition-transform pointer-events-auto cursor-pointer ${statusColor}"
                                  title="Alterar status">
                                ${statusVal}
                            </span>
                            
                            <!-- Priority Badge -->
                            <span onclick="openQuickSelect(event, '${phaseId}', '${activity.id}', 'priority')" 
                                  class="text-[10px] font-bold px-2 py-0.5 rounded-full hover:scale-105 transition-transform pointer-events-auto cursor-pointer ${priorityColor}"
                                  title="Alterar prioridade">
                                ${priorityLabel}
                            </span>

                            ${activity.timeEstimate ? `<span class="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>${activity.timeEstimate}</span>` : ''}
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 ml-auto sm:ml-0" onclick="event.stopPropagation();">
                        <button onclick="toggleDetails('${activity.id}')" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-indigo-300 hover:text-white transition-colors">
                            <span>Detalhes</span>
                            <svg class="w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        
                        <button onclick="toggleSubActivityCreator('${activity.id}')" class="p-1.5 hover:bg-slate-800 text-sky-400 hover:text-white rounded-lg transition-colors" title="Adicionar sub-atividade">
                            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        
                        <button onclick="openEditModal('${phaseId}', '${activity.id}')" class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors" title="Editar campos">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        
                        <button onclick="deleteActivity('${phaseId}', '${activity.id}')" class="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors" title="Excluir">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>

                ${isExpanded ? `
                    <div class="bg-slate-900/50 border border-slate-800/60 rounded-xl p-5 mt-1.5 space-y-4 shadow-inner">
                        <div class="flex border-b border-slate-800 gap-1 overflow-x-auto">
                            <button onclick="setActivityTab('${activity.id}', 'descricao')" class="pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${currentTab === 'descricao' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}">Descrição</button>
                            <button onclick="setActivityTab('${activity.id}', 'anexos')" class="pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${currentTab === 'anexos' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}">Anexos (${activity.attachments ? activity.attachments.length : 0})</button>
                            <button onclick="setActivityTab('${activity.id}', 'kanban')" class="pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${currentTab === 'kanban' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}">Status/Kanban</button>
                            <button onclick="setActivityTab('${activity.id}', 'prioridade')" class="pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${currentTab === 'prioridade' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}">Prioridade</button>
                        </div>

                        <div class="pt-2">
                            ${currentTab === 'descricao' ? `
                                <div class="space-y-1.5">
                                    <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-lg border border-slate-850">
                                        ${activity.description ? activity.description : '<span class="text-slate-500 italic">Nenhuma descrição informada para esta atividade.</span>'}
                                    </p>
                                </div>
                            ` : ''}

                            ${currentTab === 'anexos' ? `
                                <div class="space-y-3">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        ${activity.attachments && activity.attachments.length > 0 ? activity.attachments.map((att, attIdx) => `
                                            <div class="flex items-center justify-between bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-xs">
                                                <span class="text-slate-300 truncate max-w-[180px]">${att}</span>
                                                <div class="flex items-center gap-1">
                                                    <a href="#" onclick="event.preventDefault(); showToast('Fazendo download do arquivo: ' + '${att}')" class="p-1 text-slate-400 hover:text-indigo-400 transition-colors" title="Download">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    </a>
                                                    <button onclick="removeAttachmentFromTab('${phaseId}', '${activity.id}', ${attIdx})" class="p-1 text-slate-500 hover:text-rose-400 transition-colors" title="Remover">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('') : '<div class="col-span-2 text-center text-xs text-slate-500 py-3 italic">Nenhum arquivo anexado.</div>'}
                                    </div>
                                    <div class="border border-dashed border-slate-800 rounded-lg p-3 text-center cursor-pointer hover:border-indigo-500 transition-colors bg-slate-950/40 relative">
                                        <input type="file" onchange="uploadAttachmentFromTab(event, '${phaseId}', '${activity.id}')" class="absolute inset-0 opacity-0 cursor-pointer">
                                        <span class="text-xs text-slate-400 block">Clique para simular e adicionar novo anexo</span>
                                    </div>
                                </div>
                            ` : ''}

                            ${currentTab === 'kanban' ? `
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    ${['A fazer', 'Em andamento', 'Impedimento', 'Concluído'].map(st => {
                                        let activeStyle = 'bg-slate-950/30 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300';
                                        if (statusVal === st) {
                                            if (st === 'A fazer') activeStyle = 'bg-slate-800 border-slate-650 text-white';
                                            if (st === 'Em andamento') activeStyle = 'bg-indigo-950 border-indigo-500 text-indigo-300';
                                            if (st === 'Impedimento') activeStyle = 'bg-amber-950 border-amber-500 text-amber-350';
                                            if (st === 'Concluído') activeStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300';
                                        }
                                        return `
                                            <button onclick="updateActivityStatus('${phaseId}', '${activity.id}', '${st}')" class="flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${activeStyle}">
                                                <span class="mb-1">${getStatusEmoji(st)}</span>
                                                <span>${st}</span>
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            ` : ''}

                            ${currentTab === 'prioridade' ? `
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    ${['Baixa', 'Média', 'Alta', 'Crítica'].map(pr => {
                                        let activeStyle = 'bg-slate-950/30 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300';
                                        if (activity.priority === pr) {
                                            if (pr === 'Baixa') activeStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300';
                                            if (pr === 'Média') activeStyle = 'bg-slate-800 border-slate-650 text-white';
                                            if (pr === 'Alta') activeStyle = 'bg-amber-950 border-amber-500 text-amber-300';
                                            if (pr === 'Crítica') activeStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                                        }
                                        return `
                                            <button onclick="updateActivityPriorityDirect('${phaseId}', '${activity.id}', '${pr}')" class="p-3 rounded-xl border text-xs font-semibold transition-all ${activeStyle}">
                                                ${pr}
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${isCreatorActive ? `
                    <div class="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 mt-2 flex flex-col sm:flex-row items-center gap-2 ml-6">
                        <input type="text" id="sub-activity-input-${activity.id}" placeholder="Nome da sub-atividade para o nível ${depth + 1}..." class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" onkeydown="handleSubActivityKey(event, '${phaseId}', '${activity.id}', ${depth})">
                        <div class="flex gap-1.5 w-full sm:w-auto justify-end">
                            <button onclick="cancelSubActivityCreator()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all">
                                Cancelar
                            </button>
                            <button onclick="saveSubActivity('${phaseId}', '${activity.id}', ${depth})" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all whitespace-nowrap">
                                Adicionar
                            </button>
                        </div>
                    </div>
                ` : ''}

                ${activity.subActivities && activity.subActivities.length > 0 ? `
                    <div class="sub-activities-container mt-1.5 space-y-1.5 pl-6 ml-3 border-l border-slate-800/80">
                        ${renderActivitiesList(activity.subActivities, phaseId, depth + 1)}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getStatusEmoji(status) {
    if (status === 'Em andamento') return '⚡';
    if (status === 'Impedimento') return '🛑';
    if (status === 'Concluído') return '✅';
    return '📋';
}

function toggleDetails(activityId) {
    if (expandedActivities.has(activityId)) {
        expandedActivities.delete(activityId);
    } else {
        expandedActivities.add(activityId);
        if (!activeTabs[activityId]) {
            activeTabs[activityId] = 'descricao';
        }
    }
    saveAndRefresh();
}

function setActivityTab(activityId, tabName) {
    activeTabs[activityId] = tabName;
    saveAndRefresh();
}

function updateActivityStatus(phaseId, activityId, newStatus) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (meta) {
        meta.activity.status = newStatus;
        saveAndRefresh();
        showToast(`Status atualizado para: ${newStatus}`);
    }
}

function updateActivityPriorityDirect(phaseId, activityId, newPriority) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (meta) {
        meta.activity.priority = newPriority;
        saveAndRefresh();
        showToast(`Prioridade atualizada para: ${newPriority}`);
    }
}

function removeAttachmentFromTab(phaseId, activityId, index) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (meta && meta.activity.attachments) {
        meta.activity.attachments.splice(index, 1);
        saveAndRefresh();
        showToast('Anexo removido.');
    }
}

function uploadAttachmentFromTab(event, phaseId, activityId) {
    const file = event.target.files[0];
    if (!file) return;
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (meta) {
        if (!meta.activity.attachments) {
            meta.activity.attachments = [];
        }
        meta.activity.attachments.push(file.name);
        saveAndRefresh();
        showToast('Arquivo anexado com sucesso.');
    }
}

function getDepthColor(depth) {
    const colors = {
        1: '#6366f1',
        2: '#3b82f6',
        3: '#06b6d4',
        4: '#10b981',
        5: '#eab308',
        6: '#f97316',
        7: '#ef4444'
    };
    return colors[depth] || '#94a3b8';
}

function addPhase() {
    const id = 'phase-' + Date.now();
    const newPhase = {
        id: id,
        name: 'Nova Fase ' + (state.length + 1),
        icon: ICONS_LIST[0],
        activities: []
    };
    state.push(newPhase);
    saveAndRefresh();
    showToast('Fase criada com sucesso!');
}

function updatePhaseName(phaseId, value) {
    const phase = state.find(p => p.id === phaseId);
    if (phase) {
        phase.name = value;
        saveToLocalStorage();
        showToast('Nome da fase atualizado.');
    }
}

function updatePhaseIcon(phaseId, icon) {
    const phase = state.find(p => p.id === phaseId);
    if (phase) {
        phase.icon = icon;
        saveAndRefresh();
        showToast('Ícone da fase atualizado.');
    }
}

function deletePhase(phaseId) {
    state = state.filter(p => p.id !== phaseId);
    saveAndRefresh();
    showToast('Fase removida.');
}

function addActivity(phaseId) {
    const input = document.getElementById(`quick-add-input-${phaseId}`);
    if (!input) return;
    const title = input.value.trim();
    if (!title) {
        showToast('Por favor, digite um título para a atividade.', true);
        return;
    }
    const phase = state.find(p => p.id === phaseId);
    if (phase) {
        const newActivity = {
            id: 'act-' + Date.now(),
            title: title,
            description: '',
            team: 'Sem equipe',
            priority: 'Média',
            status: 'A fazer',
            timeEstimate: '',
            tags: [],
            attachments: [],
            subActivities: []
        };
        phase.activities.push(newActivity);
        input.value = '';
        saveAndRefresh();
        showToast('Atividade adicionada com sucesso!');
    }
}

function handleQuickAddKey(event, phaseId) {
    if (event.key === 'Enter') {
        addActivity(phaseId);
    }
}

function toggleSubActivityCreator(activityId) {
    activeSubActivityCreatorId = activeSubActivityCreatorId === activityId ? null : activityId;
    render();
}

function cancelSubActivityCreator() {
    activeSubActivityCreatorId = null;
    render();
}

function handleSubActivityKey(event, phaseId, parentId, currentDepth) {
    if (event.key === 'Enter') {
        saveSubActivity(phaseId, parentId, currentDepth);
    }
}

function saveSubActivity(phaseId, parentId, currentDepth) {
    const input = document.getElementById(`sub-activity-input-${parentId}`);
    if (!input) return;
    const title = input.value.trim();
    if (!title) {
        showToast('Por favor, digite o título da sub-atividade.', true);
        return;
    }
    if (currentDepth >= 7) {
        showToast('Limite máximo de 7 níveis atingido!', true);
        return;
    }
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;

    const newSub = {
        id: 'act-' + Date.now(),
        title: title,
        description: '',
        team: 'Sem equipe',
        priority: 'Média',
        status: 'A fazer',
        timeEstimate: '',
        tags: [],
        attachments: [],
        subActivities: []
    };

    function insertRecursive(list) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === parentId) {
                if (!list[i].subActivities) {
                    list[i].subActivities = [];
                }
                list[i].subActivities.push(newSub);
                return true;
            }
            if (list[i].subActivities && list[i].subActivities.length > 0) {
                const found = insertRecursive(list[i].subActivities);
                if (found) return true;
            }
        }
        return false;
    }

    insertRecursive(phase.activities);
    activeSubActivityCreatorId = null;
    saveAndRefresh();
    showToast('Sub-atividade adicionada!');
}

function deleteActivity(phaseId, activityId) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;

    function removeRecursive(list) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === activityId) {
                list.splice(i, 1);
                return true;
            }
            if (list[i].subActivities && list[i].subActivities.length > 0) {
                const found = removeRecursive(list[i].subActivities);
                if (found) return true;
            }
        }
        return false;
    }

    removeRecursive(phase.activities);
    saveAndRefresh();
    showToast('Atividade excluída.');
}

function findAndGetActivityWithMeta(activities, targetId, depth = 1, parentList = null) {
    for (let i = 0; i < activities.length; i++) {
        if (activities[i].id === targetId) {
            return {
                activity: activities[i],
                parentList: parentList || activities,
                index: i,
                depth: depth
            };
        }
        if (activities[i].subActivities && activities[i].subActivities.length > 0) {
            const result = findAndGetActivityWithMeta(activities[i].subActivities, targetId, depth + 1, activities[i].subActivities);
            if (result) return result;
        }
    }
    return null;
}

function openEditModal(phaseId, activityId) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;

    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;

    activeEditingActivityId = { phaseId, activityId };

    document.getElementById('modal-title').value = meta.activity.title || '';
    
    // Obter time correspondente da atribuição
    const assignee = meta.activity.assignee || { type: 'team', name: 'Sem equipe' };
    let teamVal = 'Sem equipe';
    if (assignee.type === 'team') {
        teamVal = assignee.name;
    } else {
        const user = USERS.find(u => u.name === assignee.name);
        if (user) teamVal = user.team;
    }
    document.getElementById('modal-team').value = teamVal;

    document.getElementById('modal-priority').value = meta.activity.priority || 'Média';
    document.getElementById('modal-time').value = meta.activity.timeEstimate || '';
    document.getElementById('modal-description').value = meta.activity.description || '';
    document.getElementById('modal-tags').value = (meta.activity.tags || []).join(', ');
    
    currentModalAttachments = [...(meta.activity.attachments || [])];
    renderModalAttachments();

    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    activeEditingActivityId = null;
}

function handleMockUpload(event) {
    const file = event.target.files[0];
    if (file) {
        currentModalAttachments.push(file.name);
        renderModalAttachments();
        showToast('Arquivo anexado com sucesso.');
    }
}

function removeAttachment(index) {
    currentModalAttachments.splice(index, 1);
    renderModalAttachments();
}

function renderModalAttachments() {
    const listContainer = document.getElementById('modal-attachments-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (currentModalAttachments.length === 0) {
        listContainer.innerHTML = '<span class="text-xs text-slate-500">Nenhum arquivo anexado.</span>';
        return;
    }

    currentModalAttachments.forEach((name, idx) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-xs';
        item.innerHTML = `
            <span class="text-slate-300 truncate max-w-[250px]">${name}</span>
            <button onclick="removeAttachment(${idx})" class="text-slate-500 hover:text-rose-400 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        listContainer.appendChild(item);
    });
}

function saveModalChanges() {
    if (!activeEditingActivityId) return;

    const { phaseId, activityId } = activeEditingActivityId;
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;

    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;

    const title = document.getElementById('modal-title').value.trim();
    if (!title) {
        showToast('O título não pode ficar em branco.', true);
        return;
    }

    meta.activity.title = title;
    
    // Atualizar atribuição baseada no time selecionado do modal
    const selectedTeam = document.getElementById('modal-team').value;
    const currentAssignee = meta.activity.assignee || { type: 'team', name: 'Sem equipe' };
    if (currentAssignee.type === 'user') {
        const user = USERS.find(u => u.name === currentAssignee.name);
        if (!user || user.team !== selectedTeam) {
            meta.activity.assignee = { type: 'team', name: selectedTeam };
        }
    } else {
        meta.activity.assignee = { type: 'team', name: selectedTeam };
    }

    meta.activity.priority = document.getElementById('modal-priority').value;
    meta.activity.timeEstimate = document.getElementById('modal-time').value.trim();
    meta.activity.description = document.getElementById('modal-description').value.trim();
    
    const rawTags = document.getElementById('modal-tags').value;
    meta.activity.tags = rawTags.split(',')
                                .map(t => t.trim())
                                .filter(t => t.length > 0);
    
    meta.activity.attachments = [...currentModalAttachments];

    saveAndRefresh();
    closeModal();
    showToast('Alterações salvas com sucesso!');
}

function handleDragStart(event, phaseId, activityId) {
    if (!isDraggingAllowed) {
        event.preventDefault();
        return;
    }
    draggedActivityId = activityId;
    draggedPhaseId = phaseId;
    event.dataTransfer.effectAllowed = 'move';
    
    const element = document.getElementById(`activity-card-${activityId}`);
    if (element) {
        setTimeout(() => {
            element.classList.add('dragging-active');
        }, 0);
    }
}

function handleDragOver(event, phaseId, activityId) {
    event.preventDefault();
    if (draggedActivityId === activityId) return;

    const element = document.getElementById(`activity-card-${activityId}`);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    
    element.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');

    if (relativeY < rect.height * 0.25) {
        element.classList.add('drag-over-before');
    } else if (relativeY > rect.height * 0.75) {
        element.classList.add('drag-over-after');
    } else {
        element.classList.add('drag-over-inside');
    }
}

function handleDragLeave(event, activityId) {
    const element = document.getElementById(`activity-card-${activityId}`);
    if (element) {
        element.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');
    }
}

function handleDragEnd(event, activityId) {
    const element = document.getElementById(`activity-card-${activityId}`);
    if (element) {
        element.classList.remove('dragging-active');
    }
    cleanupDragClasses();
    isDraggingAllowed = false;
}

function cleanupDragClasses() {
    document.querySelectorAll('[id^="activity-card-"]').forEach(el => {
        el.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-inside');
    });
}

function findSubtreeDepth(activity) {
    if (!activity.subActivities || activity.subActivities.length === 0) {
        return 1;
    }
    return 1 + Math.max(...activity.subActivities.map(findSubtreeDepth));
}

function handleDrop(event, phaseId, activityId) {
    event.preventDefault();
    cleanupDragClasses();

    if (!draggedActivityId || draggedActivityId === activityId) return;

    const targetElement = document.getElementById(`activity-card-${activityId}`);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    
    let position = 'INSIDE';
    if (relativeY < rect.height * 0.25) {
        position = 'BEFORE';
    } else if (relativeY > rect.height * 0.75) {
        position = 'AFTER';
    }

    executeMove(draggedPhaseId, draggedActivityId, phaseId, activityId, position);
}

function handleRootContainerDragOver(event) {
    event.preventDefault();
}

function handleRootContainerDrop(event, phaseId) {
    event.preventDefault();
    if (event.target.id && event.target.id.startsWith('activities-container-')) {
        if (!draggedActivityId) return;
        executeMoveToRoot(draggedPhaseId, draggedActivityId, phaseId);
    }
}

function checkIsDescendant(parent, targetId) {
    if (!parent.subActivities) return false;
    for (let sub of parent.subActivities) {
        if (sub.id === targetId) return true;
        if (checkIsDescendant(sub, targetId)) return true;
    }
    return false;
}

function executeMove(sourcePhaseId, sourceActId, targetPhaseId, targetActId, position) {
    const sourcePhase = state.find(p => p.id === sourcePhaseId);
    const targetPhase = state.find(p => p.id === targetPhaseId);
    if (!sourcePhase || !targetPhase) return;

    const sourceMeta = findAndGetActivityWithMeta(sourcePhase.activities, sourceActId);
    const targetMeta = findAndGetActivityWithMeta(targetPhase.activities, targetActId);
    if (!sourceMeta || !targetMeta) return;

    if (checkIsDescendant(sourceMeta.activity, targetActId)) {
        showToast('Não é permitido mover uma atividade pai para dentro de um de seus próprios filhos!', true);
        return;
    }

    const sourceSubtreeDepth = findSubtreeDepth(sourceMeta.activity);

    if (position === 'INSIDE') {
        if (sourceMeta.activity.subActivities && sourceMeta.activity.subActivities.length > 0) {
            showToast('Atividades que possuem sub-atividades não podem ser movidas para dentro de outras!', true);
            return;
        }

        const newDepth = targetMeta.depth + 1;
        if (newDepth > 7) {
            showToast('Mover para esta posição ultrapassaria o limite permitido de 7 níveis!', true);
            return;
        }

        sourceMeta.parentList.splice(sourceMeta.index, 1);
        if (!targetMeta.activity.subActivities) {
            targetMeta.activity.subActivities = [];
        }
        targetMeta.activity.subActivities.push(sourceMeta.activity);
        showToast('Atividade aninhada com sucesso!');

    } else {
        const targetParentDepth = targetMeta.depth - 1;
        if (targetParentDepth + sourceSubtreeDepth > 7) {
            showToast('O limite de 7 níveis seria excedido se movido para cá!', true);
            return;
        }

        sourceMeta.parentList.splice(sourceMeta.index, 1);

        const realTargetMeta = findAndGetActivityWithMeta(targetPhase.activities, targetActId);
        if (position === 'BEFORE') {
            realTargetMeta.parentList.splice(realTargetMeta.index, 0, sourceMeta.activity);
        } else {
            realTargetMeta.parentList.splice(realTargetMeta.index + 1, 0, sourceMeta.activity);
        }
        showToast('Atividade reordenada.');
    }

    saveAndRefresh();
}

function executeMoveToRoot(sourcePhaseId, sourceActId, targetPhaseId) {
    const sourcePhase = state.find(p => p.id === sourcePhaseId);
    const targetPhase = state.find(p => p.id === targetPhaseId);
    if (!sourcePhase || !targetPhase) return;

    const sourceMeta = findAndGetActivityWithMeta(sourcePhase.activities, sourceActId);
    if (!sourceMeta) return;

    const sourceSubtreeDepth = findSubtreeDepth(sourceMeta.activity);
    if (sourceSubtreeDepth > 7) {
        showToast('A estrutura desta atividade excede 7 níveis e não pode ser movida para cá.', true);
        return;
    }

    sourceMeta.parentList.splice(sourceMeta.index, 1);
    targetPhase.activities.push(sourceMeta.activity);
    
    saveAndRefresh();
    showToast('Atividade movida para a raiz da fase!');
}

window.onload = function() {
    loadState();
    updateStats();
    render();
}

// Quick Select Popover Logic
function openQuickSelect(event, phaseId, activityId, field) {
    event.stopPropagation();
    event.preventDefault();
    
    const target = event.currentTarget;
    const popover = document.getElementById('quick-select-popover');
    if (!popover) return;
    
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;
    const activity = meta.activity;
    
    let options = [];
    let currentValue = '';
    
    if (field === 'status') {
        options = ['A fazer', 'Em andamento', 'Impedimento', 'Concluído'];
        currentValue = activity.status || 'A fazer';
    } else if (field === 'priority') {
        options = ['Baixa', 'Média', 'Alta', 'Crítica'];
        currentValue = activity.priority || 'Média';
    }
    
    let html = `<div class="p-1 space-y-0.5">`;
    options.forEach(opt => {
        const isSelected = opt === currentValue;
        let label = opt;
        if (field === 'priority' && opt === 'Crítica') label = 'Urgente';
        
        html += `
            <button onclick="selectQuickOption('${phaseId}', '${activityId}', '${field}', '${opt}')" class="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600/20 hover:text-white transition-all flex items-center justify-between text-slate-300 ${isSelected ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : ''}">
                <span>${label}</span>
                ${isSelected ? `
                    <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                ` : ''}
            </button>
        `;
    });
    html += `</div>`;
    
    popover.innerHTML = html;
    popover.classList.remove('hidden');
    
    // Position popover relative to viewport
    const rect = target.getBoundingClientRect();
    const popoverWidth = 160;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 16;
    }
    
    // Position below the element, checking if it goes off bottom
    let top = rect.bottom + 6;
    const popoverHeight = options.length * 32 + 10;
    if (top + popoverHeight > window.innerHeight) {
        top = rect.top - popoverHeight - 6;
    }
    
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    
    // Listen for click events to close the popover
    setTimeout(() => {
        document.addEventListener('click', closeQuickSelect);
    }, 0);
}

function closeQuickSelect(event) {
    const popover = document.getElementById('quick-select-popover');
    if (!popover) return;
    
    if (!popover.contains(event.target)) {
        popover.classList.add('hidden');
        document.removeEventListener('click', closeQuickSelect);
    }
}

function selectQuickOption(phaseId, activityId, field, value) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;
    
    if (field === 'status') {
        meta.activity.status = value;
        showToast(`Status atualizado para: ${value}`);
    } else if (field === 'priority') {
        meta.activity.priority = value;
        let displayVal = value === 'Crítica' ? 'Urgente' : value;
        showToast(`Prioridade atualizada para: ${displayVal}`);
    }
    
    saveAndRefresh();
    
    const popover = document.getElementById('quick-select-popover');
    if (popover) {
        popover.classList.add('hidden');
    }
    document.removeEventListener('click', closeQuickSelect);
}

// Assignee expandable badge HTML renderer
function renderAssigneeBadge(assignee, phaseId, activityId) {
    if (!assignee) assignee = { type: 'team', name: 'Sem equipe' };
    
    let iconHtml = '';
    let color = '';
    let bg = '';
    let border = '';
    let name = assignee.name;
    
    if (assignee.type === 'team') {
        const teamInfo = TEAMS[assignee.name] || TEAMS['Sem equipe'];
        iconHtml = `<div class="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold bg-slate-950/40 flex-shrink-0">${teamInfo.icon}</div>`;
        color = teamInfo.color;
        bg = teamInfo.bg;
        border = teamInfo.border;
    } else {
        // User
        const user = USERS.find(u => u.name === assignee.name);
        const teamName = user ? user.team : 'Sem equipe';
        const teamInfo = TEAMS[teamName] || TEAMS['Sem equipe'];
        
        if (user && user.avatar) {
            iconHtml = `<img src="${user.avatar}" class="w-4.5 h-4.5 rounded-full flex-shrink-0 object-cover border border-slate-750/30">`;
        } else {
            const initials = user ? user.initials : '👤';
            iconHtml = `<div class="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold bg-slate-950/40 flex-shrink-0">${initials}</div>`;
        }
        color = teamInfo.color;
        bg = teamInfo.bg;
        border = teamInfo.border;
    }
    
    return `
        <div onclick="openAssigneeQuickSelect(event, '${phaseId}', '${activityId}')"
             class="assignee-badge-expandable flex items-center justify-start h-6 rounded-full border px-1 pointer-events-auto select-none group/badge"
             style="background-color: ${bg}; border-color: ${border}; color: ${color};"
             title="Atribuído a: ${name}">
            ${iconHtml}
            <span class="assignee-badge-text text-[9px] font-semibold text-slate-300">
                ${name}
            </span>
        </div>
    `;
}

// Team / Member Assignee popover logic
function openAssigneeQuickSelect(event, phaseId, activityId) {
    event.stopPropagation();
    event.preventDefault();
    
    const target = event.currentTarget;
    const popover = document.getElementById('quick-select-popover');
    if (!popover) return;
    
    assigneeSearchQuery = ''; // Reset query
    
    renderAssigneePopoverContents(phaseId, activityId);
    popover.classList.remove('hidden');
    
    // Position popover
    const rect = target.getBoundingClientRect();
    const popoverWidth = 180;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 16;
    }
    
    let top = rect.bottom + 6;
    // Set fixed width and position
    popover.style.width = '180px';
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    
    // Focus search input after a frame
    setTimeout(() => {
        const searchInput = document.getElementById('assignee-search');
        if (searchInput) searchInput.focus();
    }, 50);
    
    // Register global click to close
    setTimeout(() => {
        document.addEventListener('click', closeQuickSelect);
    }, 0);
}

function handleAssigneeSearch(event, phaseId, activityId) {
    assigneeSearchQuery = event.target.value;
    renderAssigneePopoverContents(phaseId, activityId, true);
}

function setAssigneeTab(event, phaseId, activityId, tab) {
    event.stopPropagation();
    currentAssigneeTab = tab;
    renderAssigneePopoverContents(phaseId, activityId);
}

function renderAssigneePopoverContents(phaseId, activityId, keepFocus = false) {
    const popover = document.getElementById('quick-select-popover');
    if (!popover) return;
    
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;
    const activity = meta.activity;
    
    const currentAssignee = activity.assignee || { type: 'team', name: 'Sem equipe' };
    let searchVal = assigneeSearchQuery;
    
    let html = `
        <div class="px-2 py-1.5 border-b border-slate-800/80">
            <input type="text" id="assignee-search" value="${searchVal}" oninput="handleAssigneeSearch(event, '${phaseId}', '${activityId}')" placeholder="Pesquisar..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors">
        </div>
    `;
    
    const query = searchVal.toLowerCase().trim();
    
    if (query !== '') {
        // Search view: Mixed list
        const filteredTeams = Object.keys(TEAMS).filter(name => name !== 'Sem equipe' && name.toLowerCase().includes(query));
        const filteredUsers = USERS.filter(user => user.name.toLowerCase().includes(query));
        
        html += `<div class="max-h-[220px] overflow-y-auto p-1.5 space-y-2">`;
        
        if (filteredTeams.length > 0) {
            html += `<div>`;
            html += `<div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 select-none mb-1">Times</div>`;
            html += `<div class="space-y-0.5">`;
            filteredTeams.forEach(teamName => {
                const teamInfo = TEAMS[teamName];
                const isSelected = currentAssignee.type === 'team' && currentAssignee.name === teamName;
                html += `
                    <button onclick="selectAssignee('${phaseId}', '${activityId}', 'team', '${teamName}')" class="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-indigo-600/20 hover:text-white transition-all flex items-center justify-between text-slate-300 ${isSelected ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : ''}">
                        <div class="flex items-center gap-2">
                            <span class="text-xs" style="color: ${teamInfo.color}">${teamInfo.icon}</span>
                            <span>${teamName}</span>
                        </div>
                        ${isSelected ? `<svg class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>` : ''}
                    </button>
                `;
            });
            html += `</div></div>`;
        }
        
        if (filteredUsers.length > 0) {
            html += `<div>`;
            html += `<div class="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 select-none mb-1 mt-1">Usuários</div>`;
            html += `<div class="space-y-0.5">`;
            filteredUsers.forEach(user => {
                const teamInfo = TEAMS[user.team] || TEAMS['Sem equipe'];
                const isSelected = currentAssignee.type === 'user' && currentAssignee.name === user.name;
                html += `
                    <button onclick="selectAssignee('${phaseId}', '${activityId}', 'user', '${user.name}')" 
                            class="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between border hover:brightness-110 active:scale-[0.98] ${isSelected ? 'font-semibold ring-1 ring-indigo-500/50' : ''}"
                            style="background-color: ${teamInfo.bg}; border-color: ${teamInfo.border}; color: ${teamInfo.color};"
                            title="Equipe: ${user.team}">
                        <div class="flex items-center gap-2">
                            <img src="${user.avatar}" class="w-5 h-5 rounded-full flex-shrink-0 object-cover border border-slate-750/30">
                            <span class="text-slate-200 font-medium">${user.name}</span>
                        </div>
                        ${isSelected ? `<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${teamInfo.color}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>` : ''}
                    </button>
                `;
            });
            html += `</div></div>`;
        }
        
        if (filteredTeams.length === 0 && filteredUsers.length === 0) {
            html += `<div class="text-center text-xs text-slate-500 py-6 italic select-none">Nenhum resultado</div>`;
        }
        
        html += `</div>`;
    } else {
        // Tabbed view: Times or Usuários
        html += `
            <div class="flex border-b border-slate-800/80 text-[10px] font-semibold">
                <button onclick="setAssigneeTab(event, '${phaseId}', '${activityId}', 'times')" class="flex-1 py-1.5 text-center border-b-2 transition-all ${currentAssigneeTab === 'times' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'} font-outfit">Times</button>
                <button onclick="setAssigneeTab(event, '${phaseId}', '${activityId}', 'usuarios')" class="flex-1 py-1.5 text-center border-b-2 transition-all ${currentAssigneeTab === 'usuarios' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'} font-outfit">Usuários</button>
            </div>
        `;
        
        html += `<div class="max-h-[220px] overflow-y-auto p-1.5 space-y-0.5">`;
        
        if (currentAssigneeTab === 'times') {
            Object.keys(TEAMS).forEach(teamName => {
                const teamInfo = TEAMS[teamName];
                const isSelected = currentAssignee.type === 'team' && currentAssignee.name === teamName;
                html += `
                    <button onclick="selectAssignee('${phaseId}', '${activityId}', 'team', '${teamName}')" class="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-indigo-600/20 hover:text-white transition-all flex items-center justify-between text-slate-300 ${isSelected ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : ''}">
                        <div class="flex items-center gap-2">
                            <span class="text-xs" style="color: ${teamInfo.color}">${teamInfo.icon}</span>
                            <span>${teamName}</span>
                        </div>
                        ${isSelected ? `<svg class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` : ''}
                    </button>
                `;
            });
        } else {
            USERS.forEach(user => {
                const teamInfo = TEAMS[user.team] || TEAMS['Sem equipe'];
                const isSelected = currentAssignee.type === 'user' && currentAssignee.name === user.name;
                html += `
                    <button onclick="selectAssignee('${phaseId}', '${activityId}', 'user', '${user.name}')" 
                            class="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between border hover:brightness-110 active:scale-[0.98] ${isSelected ? 'font-semibold ring-1 ring-indigo-500/50' : ''}"
                            style="background-color: ${teamInfo.bg}; border-color: ${teamInfo.border}; color: ${teamInfo.color};"
                            title="Equipe: ${user.team}">
                        <div class="flex items-center gap-2">
                            <img src="${user.avatar}" class="w-5 h-5 rounded-full flex-shrink-0 object-cover border border-slate-750/30">
                            <span class="text-slate-200 font-medium">${user.name}</span>
                        </div>
                        ${isSelected ? `<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${teamInfo.color}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>` : ''}
                    </button>
                `;
            });
        }
        
        html += `</div>`;
    }
    
    popover.innerHTML = html;
    
    if (keepFocus) {
        const searchInput = document.getElementById('assignee-search');
        if (searchInput) {
            searchInput.focus();
            const len = searchInput.value.length;
            searchInput.setSelectionRange(len, len);
        }
    }
}

function selectAssignee(phaseId, activityId, type, name) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;
    
    meta.activity.assignee = { type, name };
    let displayName = name;
    if (type === 'user') {
        const user = USERS.find(u => u.name === name);
        displayName = user ? `${user.name} (${user.team})` : name;
    }
    showToast(`Atribuição definida para: ${displayName}`);
    
    saveAndRefresh();
    
    const popover = document.getElementById('quick-select-popover');
    if (popover) {
        popover.classList.add('hidden');
    }
    document.removeEventListener('click', closeQuickSelect);
}

// Quick Select Popover Logic
function openQuickSelect(event, phaseId, activityId, field) {
    event.stopPropagation();
    event.preventDefault();
    
    const target = event.currentTarget;
    const popover = document.getElementById('quick-select-popover');
    if (!popover) return;
    
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;
    const activity = meta.activity;
    
    let options = [];
    let currentValue = '';
    
    if (field === 'status') {
        options = ['A fazer', 'Em andamento', 'Impedimento', 'Concluído'];
        currentValue = activity.status || 'A fazer';
    } else if (field === 'priority') {
        options = ['Baixa', 'Média', 'Alta', 'Crítica'];
        currentValue = activity.priority || 'Média';
    } else if (field === 'team') {
        options = ['Sem equipe', 'Suporte técnico', 'Desenvolvimento', 'Design UX/UI', 'Gerenciamento'];
        currentValue = activity.team || 'Sem equipe';
    }
    
    let html = `<div class="p-1 space-y-0.5">`;
    options.forEach(opt => {
        const isSelected = opt === currentValue;
        let label = opt;
        if (field === 'priority' && opt === 'Crítica') label = 'Urgente';
        
        html += `
            <button onclick="selectQuickOption('${phaseId}', '${activityId}', '${field}', '${opt}')" class="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600/20 hover:text-white transition-all flex items-center justify-between text-slate-300 ${isSelected ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : ''}">
                <span>${label}</span>
                ${isSelected ? `
                    <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                ` : ''}
            </button>
        `;
    });
    html += `</div>`;
    
    popover.innerHTML = html;
    popover.classList.remove('hidden');
    
    // Position popover relative to viewport
    const rect = target.getBoundingClientRect();
    const popoverWidth = 160;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 16;
    }
    
    // Position below the element, checking if it goes off bottom
    let top = rect.bottom + 6;
    const popoverHeight = options.length * 32 + 10;
    if (top + popoverHeight > window.innerHeight) {
        top = rect.top - popoverHeight - 6;
    }
    
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    
    // Listen for click events to close the popover
    setTimeout(() => {
        document.addEventListener('click', closeQuickSelect);
    }, 0);
}

function closeQuickSelect(event) {
    const popover = document.getElementById('quick-select-popover');
    if (!popover) return;
    
    if (!popover.contains(event.target)) {
        popover.classList.add('hidden');
        document.removeEventListener('click', closeQuickSelect);
    }
}

function selectQuickOption(phaseId, activityId, field, value) {
    const phase = state.find(p => p.id === phaseId);
    if (!phase) return;
    const meta = findAndGetActivityWithMeta(phase.activities, activityId);
    if (!meta) return;
    
    if (field === 'status') {
        meta.activity.status = value;
        showToast(`Status atualizado para: ${value}`);
    } else if (field === 'priority') {
        meta.activity.priority = value;
        let displayVal = value === 'Crítica' ? 'Urgente' : value;
        showToast(`Prioridade atualizada para: ${displayVal}`);
    } else if (field === 'team') {
        meta.activity.team = value;
        showToast(`Responsável atualizado para: ${value}`);
    }
    
    saveAndRefresh();
    
    const popover = document.getElementById('quick-select-popover');
    if (popover) {
        popover.classList.add('hidden');
    }
    document.removeEventListener('click', closeQuickSelect);
}
