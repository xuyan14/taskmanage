/**
 * V2 任务工作台：大抽屉 + 双 Agent Mock + Valet 改图 Mock
 * 依赖：script-v2.js、skill-module-v2.js
 */

window.currentWorkbenchTaskId = null;
window.workbenchSelectedResultId = null;
window.workbenchAgentFocus = 'coach'; // coach | copilot
window.workbenchProcessing = false;
window.workbenchMessageQueue = [];

let workbenchValetTimer = null;
let workbenchValetCancelled = false;

const VALET_EDIT_API = '/api/valet/edit';
const WORKBENCH_GEMINI_ICON = 'assets/images/gemini-icon.png';

function workbenchGeminiIconHTML(extraClass = '') {
    return `<img src="${WORKBENCH_GEMINI_ICON}" alt="" class="workbench-gemini-img${extraClass ? ` ${extraClass}` : ''}" width="18" height="18">`;
}

function ensureWorkbenchState(task) {
    if (!task.workbenchState) {
        task.workbenchState = {
            messages: [],
            deliveryResultId: null,
            deliveryVersionId: null,
            localAssets: [],
            activeSkillSlug: null,
            activeSkillName: null
        };
    }
    if (!task.workbenchState.localAssets) {
        task.workbenchState.localAssets = [];
    }
    if (task.skillContext) {
        task.skillContext.results.forEach(r => {
            if (r.status === 'deleted') return;
            if (!r.versions) {
                r.versions = r.url ? [{ id: 'v0', url: r.url, label: 'Skill 原图', source: 'skill' }] : [];
                r.activeVersionId = r.versions[0]?.id || null;
            }
        });
    }
    return task.workbenchState;
}

function getActiveVersion(result) {
    if (!result?.versions?.length) return null;
    return result.versions.find(v => v.id === result.activeVersionId) || result.versions[result.versions.length - 1];
}

function syncResultUrlFromVersion(result) {
    const v = getActiveVersion(result);
    if (v) result.url = v.url;
}

/** 单条任务的 Skill / 工作台状态（用于列表图标与抽屉标题） */
function getWorkbenchTaskSkillMeta(task) {
    if (!task) return { status: 'none', label: '未执行 Skill', count: 0, total: 0 };

    const hasSkill = typeof hasSkillContext === 'function' && hasSkillContext(task);
    if (!hasSkill) {
        const localCount = task.workbenchState?.localAssets?.length || 0;
        if (localCount > 0) {
            return { status: 'local', label: `本地上传 ${localCount} 项`, count: localCount, total: localCount };
        }
        return { status: 'none', label: '未执行 Skill', count: 0, total: 0 };
    }

    const results = task.skillContext.results.filter(r => r.status !== 'deleted');
    const total = results.length;
    const ready = results.filter(r => r.status !== 'generating' && !!r.url).length;
    const generating = typeof isSkillGenerating === 'function' && isSkillGenerating(task);

    if (generating) {
        return { status: 'generating', label: `Skill 生成中 ${ready}/${total}`, count: ready, total };
    }
    if (ready > 0) {
        return { status: 'ready', label: `Skill 已产出 ${ready} 项`, count: ready, total };
    }
    return { status: 'none', label: 'Skill 暂无结果', count: 0, total };
}

/** V2 操作列：小图标进入工作台，状态因任务而异 */
function getWorkbenchInlineHTML(task) {
    if (!task || typeof isNonAigcDesigner !== 'function' || !isNonAigcDesigner(task)) return '';
    if (task.status !== 'generating' && task.status !== 're-generating') return '';

    const meta = getWorkbenchTaskSkillMeta(task);
    let iconInner;
    let btnClass = 'workbench-icon-btn';

    if (meta.status === 'generating') {
        btnClass += ' workbench-icon-btn--generating';
        iconInner = `<span class="workbench-gemini-wrap">${workbenchGeminiIconHTML()}<i class="fas fa-spinner fa-spin workbench-gemini-spinner"></i></span>`;
    } else if (meta.status === 'ready' || meta.status === 'local') {
        btnClass += ' workbench-icon-btn--ready';
        iconInner = `${workbenchGeminiIconHTML()}<span class="workbench-icon-badge">${meta.count}</span>`;
    } else {
        iconInner = workbenchGeminiIconHTML();
    }

    const title = `${task.generationId || task.id} · ${meta.label}`;

    return `<button type="button" class="${btnClass}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" onclick="openWorkbenchDrawer('${task.id}')">${iconInner}</button>`;
}

function openWorkbenchDrawer(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;
    if (typeof isNonAigcDesigner === 'function' && !isNonAigcDesigner(task)) {
        showNotification('AIGC 设计师暂不支持工作台', 'warning');
        return;
    }

    const switching = window.currentWorkbenchTaskId && window.currentWorkbenchTaskId !== taskId;
    if (switching) {
        workbenchValetCancelled = true;
        if (workbenchValetTimer) {
            clearTimeout(workbenchValetTimer);
            workbenchValetTimer = null;
        }
        window.workbenchProcessing = false;
        window.workbenchMessageQueue = [];
    }

    window.currentWorkbenchTaskId = taskId;
    window.workbenchSelectedResultId = null;
    window.workbenchAgentFocus = 'coach';
    ensureWorkbenchState(task);

    const drawer = document.getElementById('workbenchDrawer');
    if (drawer) {
        drawer.classList.add('open');
        drawer.dataset.taskId = taskId;
    }
    document.body.classList.add('workbench-open');

    closeWorkbenchSkillPicker();
    renderWorkbenchAll(taskId);
    updateWorkbenchComposerUI();

    const state = task.workbenchState;
    if (state.messages.length === 0 || switching) {
        if (switching) {
            state.messages = [];
        }
        if (state.messages.length === 0) {
            pushCoachBriefing(task);
        }
    }
}

function closeWorkbench() {
    closeWorkbenchSkillPicker();
    const drawer = document.getElementById('workbenchDrawer');
    if (drawer) {
        drawer.classList.remove('open');
        delete drawer.dataset.taskId;
    }
    document.body.classList.remove('workbench-open');
    window.currentWorkbenchTaskId = null;
    window.workbenchSelectedResultId = null;
}

function renderWorkbenchAll(taskId) {
    renderWorkbenchHeader(taskId);
    renderWorkbenchCanvas(taskId);
    renderWorkbenchVersions(taskId);
    renderWorkbenchManualBar(taskId);
    renderWorkbenchChat(taskId);
    renderWorkbenchActiveSkillChip(taskId);
    updateWorkbenchDeliveryBtn(taskId);
}

function findWorkbenchAsset(task, assetId) {
    if (!task || !assetId) return null;
    const skillR = task.skillContext?.results.find(r => r.id === assetId);
    if (skillR && skillR.status !== 'deleted') return { type: 'skill', asset: skillR };
    const local = task.workbenchState?.localAssets?.find(a => a.id === assetId);
    if (local) return { type: 'local', asset: local };
    return null;
}

function updateWorkbenchDeliveryBtn(taskId) {
    const task = taskData.find(t => t.id === taskId);
    const btn = document.getElementById('workbenchConfirmDeliveryBtn');
    if (!btn) return;
    const hasDelivery = !!task?.workbenchState?.deliveryResultId;
    btn.disabled = !hasDelivery;
}

function renderWorkbenchIfOpen(taskId) {
    if (window.currentWorkbenchTaskId === taskId) {
        renderWorkbenchAll(taskId);
    }
}

function renderWorkbenchHeader(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;

    const meta = getWorkbenchTaskSkillMeta(task);
    const el = document.getElementById('workbenchTitle');
    if (el) el.textContent = `任务工作台 · ${task.generationId || taskId}`;

    const sub = document.getElementById('workbenchSubtitle');
    if (sub) {
        sub.textContent = `${normalizeChannel(task.channel)} · ${normalizeGenerationType(task.generationType || task.templateCategory)} · 需 ${task.materialQuantity || 1} 个素材 · ${meta.label}`;
    }

    const statusEl = document.getElementById('workbenchSkillStatus');
    if (statusEl) {
        statusEl.className = `workbench-skill-status workbench-skill-status--${meta.status}`;
        statusEl.textContent = meta.label;
    }
}

function renderWorkbenchCanvas(taskId) {
    const task = taskData.find(t => t.id === taskId);
    const grid = document.getElementById('workbenchCanvas');
    if (!task || !grid) return;

    const ctx = task.skillContext;
    const locked = typeof isSkillResultsLocked === 'function' && isSkillResultsLocked(task);
    const state = ensureWorkbenchState(task);

    grid.innerHTML = '';

    const renderCard = (assetId, previewHTML, label, isStoryboard) => {
        const isSelected = window.workbenchSelectedResultId === assetId;
        const isDelivery = state.deliveryResultId === assetId;
        const card = document.createElement('div');
        card.className = `workbench-asset-card${isSelected ? ' selected' : ''}${isDelivery ? ' is-delivery' : ''}`;
        card.onclick = () => selectWorkbenchAsset(taskId, assetId);
        card.innerHTML = `
            ${isDelivery ? '<span class="workbench-delivery-badge"><i class="fas fa-check"></i> 交付稿</span>' : ''}
            <div class="workbench-asset-preview${isStoryboard ? ' skill-result-preview-storyboard' : ''}">${previewHTML}</div>
            <div class="workbench-asset-label">${escapeHtml(label)}</div>
        `;
        grid.appendChild(card);
    };

    if (ctx) {
    ctx.results.forEach((result, index) => {
        if (result.status === 'deleted') return;

        const isGenerating = result.status === 'generating';
        const isStoryboard = typeof isStoryboardResult === 'function' && isStoryboardResult(result);
        const activeV = getActiveVersion(result);

        let previewHTML;
        if (isGenerating) {
            previewHTML = '<div class="skill-result-skeleton"><i class="fas fa-spinner fa-spin"></i></div>';
        } else if (isStoryboard) {
            previewHTML = `
                <div class="skill-result-storyboard" onclick="event.stopPropagation(); skillResultDownloadStoryboard('${taskId}', '${result.id}')">
                    <i class="fas fa-file-excel skill-storyboard-icon"></i>
                    <span class="skill-storyboard-label">故事版</span>
                </div>
            `;
        } else {
            const url = activeV?.url || result.url;
            previewHTML = `<img src="${url}" alt="结果${index + 1}">`;
        }

        renderCard(result.id, previewHTML, activeV ? activeV.label : `结果 ${index + 1}`, isStoryboard);
    });
    }

    (state.localAssets || []).forEach((asset, index) => {
        const activeV = getActiveVersion(asset);
        const url = activeV?.url || asset.url;
        const previewHTML = `<img src="${url}" alt="${escapeHtml(asset.name || '本地素材')}">`;
        renderCard(asset.id, previewHTML, activeV?.label || asset.name || `本地 ${index + 1}`, false);
    });
}

function renderWorkbenchVersions(taskId) {
    const task = taskData.find(t => t.id === taskId);
    const el = document.getElementById('workbenchVersions');
    if (!el) return;

    const resultId = window.workbenchSelectedResultId;
    if (!task || !resultId) {
        el.innerHTML = '<p class="workbench-versions-hint">选中一张图片查看版本历史</p>';
        return;
    }

    const found = findWorkbenchAsset(task, resultId);
    const result = found?.asset;
    if (!result || !result.versions?.length) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
        <span class="workbench-versions-title">版本</span>
        ${result.versions.map(v => `
            <button type="button" class="workbench-version-chip${v.id === result.activeVersionId ? ' active' : ''}"
                onclick="switchWorkbenchVersion('${taskId}', '${resultId}', '${v.id}')">${escapeHtml(v.label)}</button>
        `).join('')}
    `;
}

function renderWorkbenchManualBar(taskId) {
    const task = taskData.find(t => t.id === taskId);
    const el = document.getElementById('workbenchManualBar');
    if (!el) return;

    const resultId = window.workbenchSelectedResultId;
    if (!task || !resultId) {
        el.innerHTML = '<span class="text-muted">选中素材后可使用手动操作（V1 路径）</span>';
        return;
    }

    const found = findWorkbenchAsset(task, resultId);
    if (!found) return;

    const locked = typeof isSkillResultsLocked === 'function' && isSkillResultsLocked(task);

    if (found.type === 'local') {
        const asset = found.asset;
        el.innerHTML = locked
            ? `<button class="btn btn-sm btn-outline" onclick="workbenchDownloadLocal('${asset.id}')"><i class="fas fa-download"></i> 下载</button>`
            : `
                <button class="btn btn-sm btn-outline" onclick="workbenchDownloadLocal('${asset.id}')"><i class="fas fa-download"></i> 下载</button>
                <button class="btn btn-sm btn-secondary" onclick="workbenchDeleteLocal('${taskId}', '${asset.id}')">删除</button>
                <button class="btn btn-sm btn-success" onclick="workbenchSetDeliveryFromBar('${taskId}', '${asset.id}')">设为交付稿</button>
            `;
        return;
    }

    el.innerHTML = typeof buildSkillResultActionsHTML === 'function'
        ? buildSkillResultActionsHTML(taskId, found.asset, locked)
        : '';
}

function renderWorkbenchChat(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;

    const focusEl = document.getElementById('workbenchAgentFocus');
    const isCopilot = window.workbenchAgentFocus === 'copilot' && window.workbenchSelectedResultId;
    if (focusEl) {
        focusEl.textContent = isCopilot ? '素材协作者' : '任务教练';
        focusEl.className = `workbench-agent-badge ${isCopilot ? 'copilot' : 'coach'}`;
    }

    const list = document.getElementById('workbenchChatMessages');
    if (!list) return;

    const state = ensureWorkbenchState(task);
    list.innerHTML = state.messages.map(m => {
        if (m.role === 'skill_context') {
            return `
                <div class="workbench-msg workbench-msg-skill-context">
                    <span class="workbench-skill-mention">@${escapeHtml(m.skillName || '')}</span>
                    <span class="workbench-skill-context-label">基于此 Skill 对话</span>
                </div>
            `;
        }
        const skillTag = m.skillName
            ? `<span class="workbench-skill-mention workbench-skill-mention--inline">@${escapeHtml(m.skillName)}</span> `
            : '';
        return `
            <div class="workbench-msg workbench-msg-${m.role}">
                <div class="workbench-msg-meta">${m.agent ? `<span class="workbench-msg-agent">${m.agent}</span>` : ''}</div>
                <div class="workbench-msg-body">${skillTag}${formatChatBody(m.text)}</div>
            </div>
        `;
    }).join('');

    list.scrollTop = list.scrollHeight;
}

function selectWorkbenchAsset(taskId, resultId) {
    window.workbenchSelectedResultId = resultId;
    window.workbenchAgentFocus = 'copilot';

    const task = taskData.find(t => t.id === taskId);
    const found = findWorkbenchAsset(task, resultId);
    if (found && !(found.type === 'skill' && isStoryboardResult(found.asset))) {
        appendMessage(task, 'copilot', '素材协作者', `已选中「${getActiveVersion(found.asset)?.label || '当前图'}」。描述你想修改的内容，我将通过 Valet 为你改图。`);
    }

    renderWorkbenchAll(taskId);
}

function workbenchFocusCoach() {
    window.workbenchAgentFocus = 'coach';
    const taskId = window.currentWorkbenchTaskId;
    if (taskId) renderWorkbenchChat(taskId);
}

function switchWorkbenchVersion(taskId, resultId, versionId) {
    const task = taskData.find(t => t.id === taskId);
    const found = findWorkbenchAsset(task, resultId);
    const result = found?.asset;
    if (!result) return;
    result.activeVersionId = versionId;
    syncResultUrlFromVersion(result);
    renderWorkbenchCanvas(taskId);
    renderWorkbenchVersions(taskId);
}

function pushCoachBriefing(task) {
    const channel = normalizeChannel(task.channel);
    const genType = normalizeGenerationType(task.generationType || task.templateCategory);
    const qty = task.materialQuantity || 1;
    const meta = getWorkbenchTaskSkillMeta(task);
    const gid = task.generationId || task.id;

    let skillHint;
    if (meta.status === 'none') {
        skillHint = '**尚未执行 Skill**，点击下方 **拼图图标** 选择 Skill，对话中将展示 **@Skill 名称** 作为上下文。';
    } else if (meta.status === 'generating') {
        skillHint = `**Skill「${task.skillContext.skillName}」生成中**（${meta.count}/${meta.total} 已返回），请稍候。`;
    } else if (meta.status === 'ready') {
        skillHint = `**Skill「${task.skillContext.skillName}」已产出 ${meta.count} 项**，请在左侧画布查看。`;
    } else {
        skillHint = `当前有 **${meta.count}** 项本地上传素材。`;
    }

    appendMessage(task, 'assistant', '任务教练',
        `任务 **${gid}** · ${channel} · ${genType}，需交付 **${qty}** 个素材。\n\n${skillHint}\n\n` +
        `选中图片后可对话改图（Valet），或使用中栏手动操作。`
    );
}

function triggerWorkbenchFileUpload() {
    document.getElementById('workbenchFileInput')?.click();
}

function handleWorkbenchFileUpload(event) {
    const files = Array.from(event.target.files || []);
    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    if (!task || files.length === 0) return;

    const state = ensureWorkbenchState(task);
    let added = 0;

    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            showNotification(`不支持的文件: ${file.name}`, 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const url = e.target.result;
            state.localAssets.push({
                id,
                name: file.name,
                url,
                versions: [{ id: 'v0', url, label: file.name, source: 'local' }],
                activeVersionId: 'v0',
                status: 'pending'
            });
            added += 1;
            appendMessage(task, 'assistant', '任务教练', `已添加本地素材「${file.name}」。可选中进行 Valet 改图或设为交付稿。`);
            renderWorkbenchAll(taskId);
            if (typeof renderTable === 'function') renderTable();
        };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

function workbenchDeleteLocal(taskId, assetId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task?.workbenchState) return;
    task.workbenchState.localAssets = task.workbenchState.localAssets.filter(a => a.id !== assetId);
    if (window.workbenchSelectedResultId === assetId) {
        window.workbenchSelectedResultId = null;
    }
    if (task.workbenchState.deliveryResultId === assetId) {
        task.workbenchState.deliveryResultId = null;
    }
    renderWorkbenchAll(taskId);
}

function workbenchDownloadLocal(assetId) {
    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    const asset = task?.workbenchState?.localAssets?.find(a => a.id === assetId);
    const url = getActiveVersion(asset)?.url || asset?.url;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = asset.name || 'local.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function workbenchSetDeliveryFromBar(taskId, assetId) {
    setDeliveryAsset(taskData.find(t => t.id === taskId), assetId);
    renderWorkbenchAll(taskId);
    showNotification('已设为交付稿', 'success');
}

function appendMessage(task, role, agent, text, extra = {}) {
    const state = ensureWorkbenchState(task);
    state.messages.push({ role, agent, text, at: Date.now(), ...extra });
}

function appendSkillContextMessage(task, skill) {
    const state = ensureWorkbenchState(task);
    state.activeSkillSlug = skill.slug;
    state.activeSkillName = skill.name;
    state.messages.push({
        role: 'skill_context',
        skillSlug: skill.slug,
        skillName: skill.name,
        at: Date.now()
    });
}

function renderWorkbenchActiveSkillChip(taskId) {
    const task = taskData.find(t => t.id === taskId);
    const bar = document.getElementById('workbenchActiveSkillBar');
    const label = document.getElementById('workbenchActiveSkillLabel');
    if (!bar || !label) return;

    const name = task ? ensureWorkbenchState(task).activeSkillName : null;
    if (name) {
        bar.hidden = false;
        label.textContent = `@${name}`;
    } else {
        bar.hidden = true;
        label.textContent = '';
    }
}

function clearWorkbenchActiveSkill() {
    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;

    const state = ensureWorkbenchState(task);
    if (!state.activeSkillName) return;

    state.activeSkillSlug = null;
    state.activeSkillName = null;
    renderWorkbenchActiveSkillChip(taskId);
}

function updateWorkbenchComposerUI() {
    const processing = window.workbenchProcessing;
    const composer = document.getElementById('workbenchComposer');
    const spinner = document.getElementById('workbenchComposerSpinner');
    const stopBtn = document.getElementById('workbenchComposerStop');
    const sendBtn = document.getElementById('workbenchComposerSend');

    if (composer) composer.classList.toggle('is-processing', processing);
    if (spinner) spinner.style.display = processing ? 'flex' : 'none';
    if (stopBtn) stopBtn.style.display = processing ? 'flex' : 'none';
    if (sendBtn) sendBtn.disabled = processing;
}

function setWorkbenchProcessing(active) {
    window.workbenchProcessing = active;
    updateWorkbenchComposerUI();
}

function stopWorkbenchProcessing() {
    workbenchValetCancelled = true;
    if (workbenchValetTimer) {
        clearTimeout(workbenchValetTimer);
        workbenchValetTimer = null;
    }
    setWorkbenchProcessing(false);

    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    if (task) {
        appendMessage(task, 'assistant', '素材协作者', '已停止当前改图任务。');
        renderWorkbenchChat(taskId);
    }
    flushWorkbenchMessageQueue();
}

function flushWorkbenchMessageQueue() {
    if (window.workbenchProcessing || window.workbenchMessageQueue.length === 0) return;

    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;

    const text = window.workbenchMessageQueue.shift();
    dispatchWorkbenchMessage(task, text);
}

function dispatchWorkbenchMessage(task, text) {
    const taskId = task.id;
    const isCopilot = window.workbenchAgentFocus === 'copilot' && window.workbenchSelectedResultId;

    if (isCopilot && /改|换|调|色|背景|logo|大|小/.test(text)) {
        mockValetEdit(task, window.workbenchSelectedResultId, text);
        return;
    }

    if (isCopilot) {
        handleCopilotMessage(task, text);
    } else {
        handleCoachMessage(task, text);
    }

    renderWorkbenchChat(taskId);
    if (!window.workbenchProcessing) {
        flushWorkbenchMessageQueue();
    }
}

function sendWorkbenchMessage() {
    const input = document.getElementById('workbenchChatInput');
    const text = input?.value?.trim();
    if (!text) return;

    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;

    const state = ensureWorkbenchState(task);
    appendMessage(task, 'user', null, text, {
        skillSlug: state.activeSkillSlug || null,
        skillName: state.activeSkillName || null
    });
    input.value = '';
    renderWorkbenchChat(taskId);

    if (window.workbenchProcessing) {
        window.workbenchMessageQueue.push(text);
        appendMessage(task, 'assistant', '任务教练', '已加入队列，将在当前任务完成后自动发送。');
        renderWorkbenchChat(taskId);
        return;
    }

    dispatchWorkbenchMessage(task, text);
}

function toggleWorkbenchComposerExpand() {
    document.getElementById('workbenchComposer')?.classList.toggle('expanded');
}

let workbenchSkillPickerCategory = 'all';

function toggleWorkbenchSkillPicker(event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById('workbenchSkillPicker');
    const btn = document.getElementById('workbenchSkillPickerBtn');
    if (!panel) return;

    const willOpen = panel.hidden;
    if (willOpen) {
        openWorkbenchSkillPicker();
    } else {
        closeWorkbenchSkillPicker();
    }
    if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

function openWorkbenchSkillPicker() {
    const panel = document.getElementById('workbenchSkillPicker');
    if (!panel) return;

    panel.hidden = false;
    workbenchSkillPickerCategory = 'all';
    const search = document.getElementById('workbenchSkillSearch');
    if (search) search.value = '';

    document.querySelectorAll('.skill-cat-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.cat === 'all');
    });

    const load = typeof fetchSkillsFromHub === 'function'
        ? fetchSkillsFromHub()
        : Promise.resolve();

    load.then(() => renderWorkbenchSkillPickerList());
}

function closeWorkbenchSkillPicker() {
    const panel = document.getElementById('workbenchSkillPicker');
    const btn = document.getElementById('workbenchSkillPickerBtn');
    if (panel) panel.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
}

function setWorkbenchSkillCategory(cat) {
    workbenchSkillPickerCategory = cat;
    document.querySelectorAll('.skill-cat-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.cat === cat);
    });
    renderWorkbenchSkillPickerList();
}

function onWorkbenchSkillSearch() {
    renderWorkbenchSkillPickerList();
}

function getWorkbenchSkillPickerItems() {
    const taskId = window.currentWorkbenchTaskId;
    const task = taskData.find(t => t.id === taskId);
    const query = (document.getElementById('workbenchSkillSearch')?.value || '').trim().toLowerCase();
    const cat = workbenchSkillPickerCategory;

    let skills = typeof availableSkills !== 'undefined' ? [...availableSkills] : [];

    if (task && typeof skillMatchesTask === 'function') {
        skills = skills.sort((a, b) => {
            const am = skillMatchesTask(a, task) ? 0 : 1;
            const bm = skillMatchesTask(b, task) ? 0 : 1;
            return am - bm;
        });
    }

    if (cat && cat !== 'all') {
        skills = skills.filter(s => (s.generationTypes || []).includes(cat));
    }

    if (query) {
        skills = skills.filter(s => {
            const desc = typeof getSkillDescription === 'function' ? getSkillDescription(s) : '';
            return (s.name || '').toLowerCase().includes(query)
                || (s.slug || '').toLowerCase().includes(query)
                || (s.channels || []).some(c => c.toLowerCase().includes(query))
                || desc.toLowerCase().includes(query);
        });
    }

    return { task, skills };
}

function getSkillPickerIconClass(skill) {
    if (typeof isStoryboardSkill === 'function' && isStoryboardSkill(skill)) {
        return 'fa-file-excel';
    }
    if ((skill.generationTypes || []).includes('实拍视频')) {
        return 'fa-play';
    }
    return 'fa-image';
}

function renderWorkbenchSkillPickerList() {
    const list = document.getElementById('workbenchSkillPickerList');
    if (!list) return;

    const { task, skills } = getWorkbenchSkillPickerItems();

    if (skills.length === 0) {
        list.innerHTML = '<p class="workbench-skill-picker-empty">未找到匹配的 Skill</p>';
        return;
    }

    list.innerHTML = skills.map(skill => {
        const matched = task && typeof skillMatchesTask === 'function' && skillMatchesTask(skill, task);
        const desc = typeof getSkillDescription === 'function' ? getSkillDescription(skill) : '';
        const icon = getSkillPickerIconClass(skill);
        const disabled = task && !matched;

        return `
            <button type="button" class="workbench-skill-item${disabled ? ' disabled' : ''}"
                ${disabled ? 'disabled' : ''}
                onclick="selectWorkbenchSkill('${skill.slug}')"
                title="${disabled ? '与当前任务渠道/类型不匹配' : escapeHtml(skill.name)}">
                <span class="workbench-skill-item-icon"><i class="fas ${icon}"></i></span>
                <span class="workbench-skill-item-text">
                    <span class="workbench-skill-item-name">${escapeHtml(skill.name)}</span>
                    <span class="workbench-skill-item-desc">${escapeHtml(desc)}</span>
                </span>
            </button>
        `;
    }).join('');
}

function selectWorkbenchSkill(skillSlug) {
    const taskId = window.currentWorkbenchTaskId;
    if (!taskId) return;

    const task = taskData.find(t => t.id === taskId);
    const skill = typeof getSkillBySlug === 'function' ? getSkillBySlug(skillSlug) : null;
    if (!task || !skill) return;

    if (typeof skillMatchesTask === 'function' && !skillMatchesTask(skill, task)) {
        showNotification('该 Skill 与当前任务渠道/生成类型不匹配', 'warning');
        return;
    }

    closeWorkbenchSkillPicker();
    appendSkillContextMessage(task, skill);
    renderWorkbenchChat(taskId);
    renderWorkbenchActiveSkillChip(taskId);
}

function workbenchOpenSkill() {
    openWorkbenchSkillPicker();
}

function handleCoachMessage(task, text) {
    const lower = text.toLowerCase();
    const state = ensureWorkbenchState(task);

    if (state.activeSkillSlug && /开始执行|执行 skill|开始生成|触发生产/.test(lower)) {
        if (typeof executeSkillOnTask === 'function') {
            const ok = executeSkillOnTask(task.id, state.activeSkillSlug);
            if (ok) {
                appendMessage(task, 'assistant', '任务教练',
                    `正在基于 **@${state.activeSkillName}** 执行 Skill，结果将显示在左侧画布。`);
                renderWorkbenchHeader(task.id);
            }
        }
        return;
    }

    if (/推荐|skill|技能/.test(lower)) {
        appendMessage(task, 'assistant', '任务教练',
            '点击下方 **拼图图标** 打开 Skill 列表，选择后将在对话中展示 **@Skill 名称**，后续消息均基于该 Skill 上下文。');
        return;
    }

    if (state.activeSkillName) {
        appendMessage(task, 'assistant', '任务教练',
            `好的，我已理解你在 **@${state.activeSkillName}** 下的需求。继续补充说明，或发送「开始执行」触发生产。`);
        return;
    }

    if (/上传|交付|可以吗|能交/.test(lower)) {
        const state = task.workbenchState;
        if (state.deliveryResultId) {
            appendMessage(task, 'assistant', '任务教练', '交付稿已选，请点击底栏「确认交付」进入打标上传。');
        } else {
            appendMessage(task, 'assistant', '任务教练', '请先选中满意的图片，说「设为交付稿」或在中栏手动确认。');
        }
        return;
    }

    appendMessage(task, 'assistant', '任务教练',
        '我已记录。你可以选中一张图进行 Valet 改图，或使用手动操作。需要 Skill 推荐请说「推荐 Skill」。');
}

function handleCopilotMessage(task, text) {
    const resultId = window.workbenchSelectedResultId;
    const found = findWorkbenchAsset(task, resultId);
    const result = found?.asset;
    if (!result) return;

    const lower = text.toLowerCase();

    if (/设为交付|交付稿|就用这张/.test(lower)) {
        setDeliveryAsset(task, resultId);
        appendMessage(task, 'assistant', '素材协作者', '已设为交付稿。可在底栏确认交付。');
        renderWorkbenchAll(task.id);
        return;
    }

    if (/对比|上一版/.test(lower)) {
        const versions = result.versions || [];
        if (versions.length < 2) {
            appendMessage(task, 'assistant', '素材协作者', '目前只有一个版本。');
            return;
        }
        const prev = versions[versions.length - 2];
        const cur = getActiveVersion(result);
        appendMessage(task, 'assistant', '素材协作者', `对比：${prev.label} vs ${cur.label}。请在中栏切换版本查看。`);
        return;
    }

    if (/回到原图|v0/.test(lower)) {
        switchWorkbenchVersion(task.id, resultId, 'v0');
        appendMessage(task, 'assistant', '素材协作者', '已切回 Skill 原图。');
        renderWorkbenchChat(task.id);
        return;
    }

    if (window.workbenchProcessing) {
        window.workbenchMessageQueue.push(text);
        appendMessage(task, 'assistant', '素材协作者', '已加入队列，将在当前改图完成后自动执行。');
        renderWorkbenchChat(task.id);
        return;
    }
    mockValetEdit(task, resultId, text);
}

function setDeliveryAsset(task, resultId) {
    if (!task) return;
    const state = ensureWorkbenchState(task);
    const found = findWorkbenchAsset(task, resultId);
    state.deliveryResultId = resultId;
    state.deliveryVersionId = found?.asset?.activeVersionId || null;
}

/** Mock：封装 Valet 改图 API */
async function mockValetEdit(task, resultId, instruction) {
    const found = findWorkbenchAsset(task, resultId);
    const result = found?.asset;
    if (!result || !getActiveVersion(result)) return;

    appendMessage(task, 'assistant', '素材协作者', `正在通过 Valet 处理：「${instruction}」…`);

    const taskId = task.id;
    renderWorkbenchChat(taskId);

    try {
        const baseUrl = getActiveVersion(result).url;
        const newUrl = await callValetEditMock({
            taskId,
            assetId: resultId,
            baseVersionId: result.activeVersionId,
            instruction,
            imageUrl: baseUrl
        });

        const versionNum = result.versions.length;
        const newId = `v${versionNum}`;
        result.versions.push({
            id: newId,
            url: newUrl,
            label: `Valet · ${instruction.slice(0, 12)}${instruction.length > 12 ? '…' : ''}`,
            source: 'valet'
        });
        result.activeVersionId = newId;
        syncResultUrlFromVersion(result);
        if (found.type === 'skill') {
            result.status = 'replaced';
            result.updatedAt = new Date().toISOString();
        }

        appendMessage(task, 'assistant', '素材协作者',
            `改图完成，已生成 **${newId}**。可说「对比上一版」「设为交付稿」，或继续描述修改。`);
    } catch (e) {
        if (e.message !== '已取消') {
            appendMessage(task, 'assistant', '素材协作者',
                `Valet 改图失败：${e.message}。请使用手动「重新生成」或「本地上传」。`);
        }
    } finally {
        setWorkbenchProcessing(false);
        renderWorkbenchAll(taskId);
        flushWorkbenchMessageQueue();
    }
}

function callValetEditMock(payload) {
    return new Promise((resolve, reject) => {
        workbenchValetCancelled = false;
        setWorkbenchProcessing(true);

        workbenchValetTimer = setTimeout(() => {
            workbenchValetTimer = null;

            if (workbenchValetCancelled) {
                reject(new Error('已取消'));
                return;
            }
            if (Math.random() < 0.05) {
                reject(new Error('Valet 服务繁忙'));
                return;
            }
            const seed = encodeURIComponent(payload.instruction.slice(0, 20));
            const base = payload.imageUrl;
            if (base.startsWith('data:') || base.startsWith('http')) {
                resolve(base.includes('?') ? `${base}&valet=${Date.now()}` : `${base}?valet=${Date.now()}&q=${seed}`);
            } else {
                resolve(`https://picsum.photos/seed/${Date.now()}/400/300`);
            }
        }, 1500);
    });
}

function workbenchConfirmDelivery(taskId) {
    const task = taskData.find(t => t.id === taskId);
    const state = task?.workbenchState;
    if (!state?.deliveryResultId) {
        showNotification('请先设为交付稿', 'warning');
        return;
    }

    const found = findWorkbenchAsset(task, state.deliveryResultId);
    if (found?.type === 'skill' && found.asset) {
        syncResultUrlFromVersion(found.asset);
        found.asset.status = 'confirmed';
    }

    closeWorkbench();

    if (found?.type === 'local') {
        const v = getActiveVersion(found.asset);
        uploadedMaterials = [{
            id: found.asset.id,
            name: found.asset.name || 'local.jpg',
            file: null,
            preview: v.url,
            url: v.url,
            type: 'image/jpeg',
            size: 0,
            selectedTags: [],
            tags: [],
            textTags: '',
            parsedTags: [],
            selectedProducts: [],
            fromSkill: false
        }];
        window.currentTaskId = taskId;
        const uploadModal = document.getElementById('uploadModal');
        uploadModal.dataset.taskId = taskId;
        setupUploadZone();
        renderMaterialsList();
        setUploadModalView('tagging', { skillMode: false });
        uploadModal.style.display = 'block';
    } else {
        openUploadModal(taskId);
    }

    showNotification('请完成打标并确认上传唯妙', 'info');
}

function workbenchChatKeydown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendWorkbenchMessage();
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatChatBody(text) {
    return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!document.getElementById('workbenchSkillPicker')?.hidden) {
            closeWorkbenchSkillPicker();
            return;
        }
        if (document.getElementById('workbenchDrawer')?.classList.contains('open')) {
            closeWorkbench();
        }
    }
});

document.addEventListener('click', (e) => {
    const panel = document.getElementById('workbenchSkillPicker');
    const anchor = document.querySelector('.workbench-skill-picker-anchor');
    if (!panel || panel.hidden) return;
    if (anchor && !anchor.contains(e.target)) {
        closeWorkbenchSkillPicker();
    }
});
