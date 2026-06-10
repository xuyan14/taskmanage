/**
 * Skill 批量生产模块
 * 接口：GET /api/skills → 失败时回退 MOCK_SKILLS（见 PRD §10.8）
 */

const SKILL_API_BASE = '/api';
const STORYBOARD_SKILL_SLUG = 'storyboard-gen';
const STORYBOARD_EXCEL_URL = 'assets/files/分镜表汇总.xlsx';
const STORYBOARD_EXCEL_NAME = '分镜表汇总.xlsx';

const MOCK_SKILLS = [
    {
        slug: 'vip-logo-fit',
        name: '大平台logo上身版型鉴',
        channels: ['字节', '腾讯'],
        generationTypes: ['单品单图'],
        outputCount: 3
    },
    {
        slug: 'douyin-native',
        name: '抖音图文原生实拍风',
        channels: ['字节', '小红书'],
        generationTypes: ['单品单图'],
        outputCount: 2
    },
    {
        slug: 'live-video-cut',
        name: '实拍视频快剪',
        channels: ['字节', '腾讯', '小红书'],
        generationTypes: ['实拍视频'],
        outputCount: 2
    },
    {
        slug: 'vip-ad-creative',
        name: 'VIP广告创意生成器',
        channels: ['字节', '腾讯', '小红书'],
        generationTypes: ['单品单图', '实拍视频'],
        outputCount: 2
    },
    {
        slug: STORYBOARD_SKILL_SLUG,
        name: '生成故事版skill',
        channels: ['字节', '腾讯', '小红书'],
        generationTypes: ['实拍视频'],
        outputCount: 1,
        resultType: 'storyboard'
    }
];

let availableSkills = [...MOCK_SKILLS];
let selectedSkillSlug = '';
let skillLocalUploadTarget = null;

function isGeneratingStatus(task) {
    return task && (task.status === 'generating' || task.status === 're-generating');
}

function isNonAigcDesigner(task) {
    if (!task?.designer) return false;
    return task.designer !== 'AIGC';
}

/** 勾选任务中处于「生成中」的（不限设计师，用于按钮展示） */
function getSelectedGeneratingTasksRaw() {
    return selectedTasks
        .map(id => taskData.find(t => t.id === id))
        .filter(isGeneratingStatus);
}

/** 可实际执行 Skill 的「生成中」非 AIGC 任务 */
function getSelectedGeneratingTasks() {
    return getSelectedGeneratingTasksRaw().filter(isNonAigcDesigner);
}

function canUseSkillFeatures() {
    if (currentUser === 'AIGC') return false;
    const genTasks = getSelectedGeneratingTasks();
    if (genTasks.length === 0) return true;
    return genTasks.every(isNonAigcDesigner);
}

/** 任务渠道 → Skill 筛选渠道（字节 / 腾讯 / 小红书） */
function normalizeChannel(channel) {
    const map = {
        xiaohongshu: '小红书',
        抖音: '字节',
        douyin: '字节',
        微信: '腾讯',
        VTD: '腾讯',
        vtd: '腾讯'
    };
    return map[channel] || channel;
}

/** 任务生成类型 → Skill 筛选类型（单品单图 / 实拍视频） */
function normalizeGenerationType(genType) {
    const map = {
        单品单视频: '实拍视频',
        单品多视频: '实拍视频'
    };
    return map[genType] || genType;
}

function getSkillBySlug(slug) {
    return availableSkills.find(s => s.slug === slug);
}

function isStoryboardSkill(skillOrSlug) {
    const slug = typeof skillOrSlug === 'string' ? skillOrSlug : skillOrSlug?.slug;
    return slug === STORYBOARD_SKILL_SLUG;
}

function isStoryboardResult(result) {
    return result?.resultType === 'storyboard';
}

/** 从 Skills Hub 拉取 Skill 列表，失败则使用 Mock */
async function fetchSkillsFromHub() {
    const channel = document.getElementById('skillFilterChannel')?.value || '';
    const genType = document.getElementById('skillFilterGenType')?.value || '';
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    if (genType) params.set('generationType', genType);
    if (typeof currentUser !== 'undefined') params.set('orgId', currentUser);

    try {
        const res = await fetch(`${SKILL_API_BASE}/skills?${params.toString()}`, {
            headers: { Accept: 'application/json' }
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                availableSkills = data;
                return;
            }
        }
    } catch (e) {
        console.info('[Skill] 使用 Mock 数据，Hub 接口未就绪:', e.message);
    }
    availableSkills = [...MOCK_SKILLS];
}

function skillMatchesTask(skill, task) {
    return skill.channels.includes(normalizeChannel(task.channel)) &&
        skill.generationTypes.includes(normalizeGenerationType(task.generationType));
}

function getFilteredSkills() {
    const channel = document.getElementById('skillFilterChannel')?.value || '';
    const genType = document.getElementById('skillFilterGenType')?.value || '';
    const selectedGenTasks = getSelectedGeneratingTasks();

    let skills = availableSkills;

    if (selectedGenTasks.length > 0) {
        skills = skills.filter(skill =>
            selectedGenTasks.every(task => skillMatchesTask(skill, task))
        );
    }

    return skills.filter(skill => {
        if (channel && !skill.channels.includes(channel)) return false;
        if (genType && !skill.generationTypes.includes(genType)) return false;
        return true;
    });
}

function syncSkillFiltersFromSelection() {
    const tasks = getSelectedGeneratingTasks();
    const channelSelect = document.getElementById('skillFilterChannel');
    const genTypeSelect = document.getElementById('skillFilterGenType');
    if (!channelSelect || !genTypeSelect || tasks.length === 0) return;

    const channels = [...new Set(tasks.map(t => normalizeChannel(t.channel)))];
    const genTypes = [...new Set(tasks.map(t => normalizeGenerationType(t.generationType)))];

    if (channels.length === 1) {
        channelSelect.value = channels[0];
    }
    if (genTypes.length === 1) {
        genTypeSelect.value = genTypes[0];
    }
}

function renderSkillSelectOptions() {
    const select = document.getElementById('skillSelect');
    if (!select) return;

    syncSkillFiltersFromSelection();
    const skills = getFilteredSkills();
    const prev = selectedSkillSlug;

    select.innerHTML = '<option value="">请选择 Skill</option>';
    skills.forEach(skill => {
        const opt = document.createElement('option');
        opt.value = skill.slug;
        opt.textContent = skill.name;
        select.appendChild(opt);
    });

    if (prev && skills.some(s => s.slug === prev)) {
        select.value = prev;
        selectedSkillSlug = prev;
    } else {
        selectedSkillSlug = select.value;
    }
}

function onSkillFilterChange() {
    fetchSkillsFromHub().then(() => {
        renderSkillSelectOptions();
        updateSkillBatchModalUI();
        updateSkillToolbarUI();
    });
}

function onSkillSelectChange() {
    const select = document.getElementById('skillSelect');
    selectedSkillSlug = select ? select.value : '';
    updateSkillBatchModalUI();
    updateSkillToolbarUI();
}

function canOpenSkillBatchModal() {
    if (currentUser === 'AIGC') return false;
    return getSelectedGeneratingTasksRaw().length >= 1;
}

function canConfirmBatchExecuteSkill() {
    if (!canUseSkillFeatures()) return false;
    return getSelectedGeneratingTasks().length >= 1 && !!selectedSkillSlug;
}

function updateSkillBatchModalUI() {
    const summary = document.getElementById('skillBatchSummary');
    const hint = document.getElementById('skillBatchHint');
    const confirmBtn = document.getElementById('confirmBatchExecuteSkillBtn');
    const rawGenTasks = getSelectedGeneratingTasksRaw();
    const genTasks = getSelectedGeneratingTasks();
    const skills = getFilteredSkills();

    if (summary) {
        const totalSelected = typeof selectedTasks !== 'undefined' ? selectedTasks.length : 0;
        summary.innerHTML = `
            <span>已勾选 <strong>${totalSelected}</strong> 条任务，其中 <strong>${rawGenTasks.length}</strong> 条为「首次/重新生成中」，<strong>${genTasks.length}</strong> 条可执行 Skill</span>
        `;
    }

    if (hint) {
        if (rawGenTasks.length === 0) {
            hint.textContent = '当前勾选任务中没有「生成中」状态的任务';
        } else if (genTasks.length === 0) {
            hint.textContent = '所选「生成中」任务均为 AIGC 设计师任务，无法执行 Skill';
        } else if (skills.length === 0) {
            hint.textContent = '当前任务无匹配 Skill，请调整筛选条件';
        } else if (!selectedSkillSlug) {
            hint.textContent = `共 ${skills.length} 个可用 Skill，请选择后确认执行`;
        } else {
            const skill = getSkillBySlug(selectedSkillSlug);
            hint.textContent = `将对 ${genTasks.length} 条任务执行「${skill?.name || selectedSkillSlug}」`;
        }
    }

    if (confirmBtn) {
        confirmBtn.disabled = !canConfirmBatchExecuteSkill();
    }
}

function updateSkillToolbarUI() {
    const btn = document.getElementById('batchExecuteSkillBtn');
    if (!btn) return;

    const hasSelection = typeof selectedTasks !== 'undefined' && selectedTasks.length > 0;
    const showBtn = hasSelection && canOpenSkillBatchModal();

    btn.style.display = showBtn ? 'inline-flex' : 'none';
    btn.disabled = !showBtn;

    const modal = document.getElementById('skillBatchModal');
    if (modal && modal.style.display === 'block') {
        updateSkillBatchModalUI();
    }
}

function openSkillBatchModal() {
    if (!canOpenSkillBatchModal()) {
        showNotification('请勾选至少 1 条「首次生成中」或「重新生成中」的任务', 'warning');
        return;
    }

    selectedSkillSlug = '';
    const channelSelect = document.getElementById('skillFilterChannel');
    const genTypeSelect = document.getElementById('skillFilterGenType');
    if (channelSelect) channelSelect.value = '';
    if (genTypeSelect) genTypeSelect.value = '';

    fetchSkillsFromHub().then(() => {
        renderSkillSelectOptions();
        updateSkillBatchModalUI();
        document.getElementById('skillBatchModal').style.display = 'block';
    });
}

function confirmBatchExecuteSkill() {
    if (!canConfirmBatchExecuteSkill()) {
        showNotification('请选择 Skill', 'warning');
        return;
    }
    batchExecuteSkill();
    closeModal('skillBatchModal');
}

function initSkillModule() {
    fetchSkillsFromHub().then(() => {
        renderSkillSelectOptions();
        updateSkillToolbarUI();
    });

    const localInput = document.getElementById('skillLocalUploadInput');
    if (localInput) {
        localInput.addEventListener('change', handleSkillLocalUpload);
    }
}

function isSkillResultsLocked(task) {
    if (!task?.skillContext) return false;
    return !!task.skillContext.locked || task.status === 'uploaded' || task.status === 'completed';
}

function lockSkillResults(task) {
    if (task?.skillContext) {
        task.skillContext.locked = true;
        task.skillContext.lockedAt = new Date().toISOString();
    }
}

function createSkillContext(task, skill) {
    const storyboard = isStoryboardSkill(skill);
    const results = [];
    for (let i = 0; i < skill.outputCount; i++) {
        results.push({
            id: `${task.id}_r${i}_${Date.now()}`,
            url: '',
            status: 'generating',
            source: 'skill',
            resultType: storyboard ? 'storyboard' : 'image',
            fileName: storyboard ? STORYBOARD_EXCEL_NAME : '',
            updatedAt: new Date().toISOString()
        });
    }

    return {
        taskId: task.id,
        skillSlug: skill.slug,
        skillName: skill.name,
        expectedResultCount: skill.outputCount,
        triggeredAt: new Date().toISOString(),
        locked: false,
        results
    };
}

function mockPlaceholderImage(task, index) {
    const seed = `${task.id}-${index}`.replace(/[^a-zA-Z0-9]/g, '');
    return `https://picsum.photos/seed/${seed}/320/320`;
}

function simulateSkillResultReturn(task, resultIndex, delayMs) {
    setTimeout(() => {
        const ctx = task.skillContext;
        if (!ctx || ctx.locked) return;
        const result = ctx.results[resultIndex];
        if (!result || result.status === 'deleted') return;

        if (isStoryboardSkill(ctx.skillSlug)) {
            result.resultType = 'storyboard';
            result.url = STORYBOARD_EXCEL_URL;
            result.fileName = STORYBOARD_EXCEL_NAME;
        } else {
            result.resultType = 'image';
            result.url = mockPlaceholderImage(task, resultIndex);
        }
        if (result.status === 'generating') {
            result.status = 'pending';
        }
        result.updatedAt = new Date().toISOString();

        if (typeof updateSkillToolbarUI === 'function') updateSkillToolbarUI();
        if (typeof renderTable === 'function') renderTable();
        if (window.currentSkillResultTaskId === task.id) {
            renderSkillResultModal(task.id);
        }
    }, delayMs);
}

async function batchExecuteSkill() {
    if (!canConfirmBatchExecuteSkill()) {
        showNotification('请勾选至少 1 条「生成中」任务并选择 Skill', 'warning');
        return;
    }

    const skill = getSkillBySlug(selectedSkillSlug);
    if (!skill) return;

    const tasks = getSelectedGeneratingTasks();

    tasks.forEach(task => {
        task.skillContext = createSkillContext(task, skill);
        task.status = 'generating';
        task.updateTime = new Date().toLocaleString('zh-CN');

        task.skillContext.results.forEach((_, idx) => {
            simulateSkillResultReturn(task, idx, 800 + idx * 600 + Math.random() * 400);
        });
    });

    showNotification(`已对 ${tasks.length} 条任务发起 Skill 批量生成`, 'success');
    if (typeof renderTable === 'function') renderTable();
    updateSkillToolbarUI();
}

function isSkillGenerating(task) {
    const ctx = task.skillContext;
    if (!ctx || ctx.locked) return false;
    if (isSkillGenerationComplete(task)) return false;
    return ctx.results.some(r => r.status === 'generating');
}

function getSkillActionableCount(task) {
    const ctx = task.skillContext;
    if (!ctx) return 0;
    return ctx.results.filter(r => ['pending', 'replaced', 'confirmed'].includes(r.status)).length;
}

function hasSkillContext(task) {
    return !!(task.skillContext && task.skillContext.results.length > 0);
}

/** Skill 全部结果已返回（无生成中、未删除的图均有 url） */
function isSkillGenerationComplete(task) {
    if (!task?.skillContext) return false;
    const results = task.skillContext.results.filter(r => r.status !== 'deleted');
    if (results.length === 0) return false;
    return results.every(r => r.status !== 'generating' && !!r.url);
}

/** 操作列内联 Skill 入口：紧挨「关闭」右侧，loading 或「查看结果」 */
function getSkillInlineActionHTML(task) {
    if (!hasSkillContext(task) || !isNonAigcDesigner(task)) return '';

    const locked = isSkillResultsLocked(task);
    const complete = isSkillGenerationComplete(task);
    const loading = isSkillGenerating(task);
    const actionable = getSkillActionableCount(task);

    if (locked || complete || (actionable > 0 && !loading)) {
        return `<button type="button" class="btn btn-sm btn-link skill-inline-view" onclick="openSkillResultModal('${task.id}')">查看结果</button>`;
    }

    if (loading) {
        return `<span class="skill-inline-loading" title="Skill 生成中"><i class="fas fa-spinner fa-spin"></i></span>`;
    }

    return '';
}

function getSkillResultEntryHTML(task) {
    return getSkillInlineActionHTML(task);
}

function openSkillResultModal(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task || !task.skillContext) return;

    window.currentSkillResultTaskId = taskId;
    renderSkillResultModal(taskId);
    document.getElementById('skillResultModal').style.display = 'block';
}

function buildSkillResultActionsHTML(taskId, result, locked) {
    if (result.status === 'generating') {
        return '<span class="skill-action-hint">生成中...</span>';
    }

    const id = result.id;

    if (isStoryboardResult(result)) {
        let html = `<button class="btn btn-sm btn-primary" onclick="skillResultDownloadStoryboard('${taskId}', '${id}')"><i class="fas fa-file-excel"></i> 下载故事版 Excel</button>`;
        if (locked) return html;
        html += `
            <button class="btn btn-sm btn-secondary" onclick="skillResultDelete('${taskId}', '${id}')">删除</button>
            <button class="btn btn-sm btn-success" onclick="skillResultRegenerate('${taskId}', '${id}')">重新生成</button>
        `;
        return html;
    }

    let html = `<button class="btn btn-sm btn-outline" onclick="skillResultDownload('${taskId}', '${id}')"><i class="fas fa-download"></i> 下载</button>`;

    if (locked) {
        return html;
    }

    html += `
        <button class="btn btn-sm btn-secondary" onclick="skillResultDelete('${taskId}', '${id}')">删除</button>
        <button class="btn btn-sm btn-info" onclick="skillResultLocalUpload('${taskId}', '${id}')">本地上传</button>
        <button class="btn btn-sm btn-success" onclick="skillResultRegenerate('${taskId}', '${id}')">重新生成</button>
    `;
    return html;
}

function renderSkillResultModal(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task || !task.skillContext) return;

    const ctx = task.skillContext;
    const locked = isSkillResultsLocked(task);
    const title = document.getElementById('skillResultModalTitle');
    const meta = document.getElementById('skillResultMeta');
    const grid = document.getElementById('skillResultGrid');

    if (title) title.textContent = `Skill 生成结果 - ${task.generationId}`;
    if (meta) {
        const storyboard = isStoryboardSkill(ctx.skillSlug);
        const hint = locked
            ? '已上传唯妙，结果已锁定不可编辑'
            : storyboard
                ? '点击故事版卡片可下载分镜表示例 Excel'
                : '处理完成后通过「上传素材」打标上传唯妙';
        meta.innerHTML = `
            <span><strong>Skill：</strong>${ctx.skillName}</span>
            <span><strong>触发时间：</strong>${new Date(ctx.triggeredAt).toLocaleString('zh-CN')}</span>
            <span class="skill-meta-hint">${hint}</span>
        `;
    }

    if (!grid) return;
    grid.innerHTML = '';

    ctx.results.forEach((result, index) => {
        if (result.status === 'deleted') return;

        const card = document.createElement('div');
        card.className = `skill-result-card skill-result-${result.status}${locked ? ' skill-result-card-locked' : ''}`;

        const isGenerating = result.status === 'generating';
        const isStoryboard = isStoryboardResult(result);

        let previewHTML;
        if (isGenerating) {
            previewHTML = '<div class="skill-result-skeleton"><i class="fas fa-spinner fa-spin"></i></div>';
        } else if (isStoryboard) {
            previewHTML = `
                <div class="skill-result-storyboard" onclick="skillResultDownloadStoryboard('${taskId}', '${result.id}')" title="点击下载故事版示例 Excel">
                    <i class="fas fa-file-excel skill-storyboard-icon"></i>
                    <span class="skill-storyboard-label">故事版示例</span>
                    <span class="skill-storyboard-filename">${result.fileName || STORYBOARD_EXCEL_NAME}</span>
                </div>
            `;
        } else {
            previewHTML = `<img src="${result.url}" alt="结果图${index + 1}">`;
        }

        card.innerHTML = `
            <div class="skill-result-preview${isStoryboard ? ' skill-result-preview-storyboard' : ''}">
                ${previewHTML}
            </div>
            <div class="skill-result-actions">
                ${buildSkillResultActionsHTML(taskId, result, locked)}
            </div>
        `;
        grid.appendChild(card);
    });
}

function guardSkillMutation(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (isSkillResultsLocked(task)) {
        showNotification('该任务已上传唯妙，Skill 结果已锁定', 'warning');
        return false;
    }
    return true;
}

function skillResultDelete(taskId, resultId) {
    if (!guardSkillMutation(taskId)) return;
    const task = taskData.find(t => t.id === taskId);
    const result = task?.skillContext?.results.find(r => r.id === resultId);
    if (!result) return;
    result.status = 'deleted';
    result.updatedAt = new Date().toISOString();
    renderSkillResultModal(taskId);
    renderTable();
}

function skillResultRegenerate(taskId, resultId) {
    if (!guardSkillMutation(taskId)) return;
    const task = taskData.find(t => t.id === taskId);
    const result = task?.skillContext?.results.find(r => r.id === resultId);
    if (!task?.skillContext || !result) return;

    const storyboard = isStoryboardResult(result);
    result.status = 'generating';
    result.url = '';
    result.source = 'skill';
    if (storyboard) {
        result.resultType = 'storyboard';
        result.fileName = STORYBOARD_EXCEL_NAME;
    }
    result.updatedAt = new Date().toISOString();

    const idx = task.skillContext.results.findIndex(r => r.id === resultId);
    simulateSkillResultReturn(task, idx, 1000 + Math.random() * 800);

    showNotification('正在重新生成，沿用上次 Skill', 'info');
    renderSkillResultModal(taskId);
    renderTable();
}

function skillResultLocalUpload(taskId, resultId) {
    if (!guardSkillMutation(taskId)) return;
    skillLocalUploadTarget = { taskId, resultId };
    const input = document.getElementById('skillLocalUploadInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

function handleSkillLocalUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !skillLocalUploadTarget) return;

    const { taskId, resultId } = skillLocalUploadTarget;
    if (!guardSkillMutation(taskId)) return;

    const task = taskData.find(t => t.id === taskId);
    const result = task?.skillContext?.results.find(r => r.id === resultId);
    if (!result) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        result.url = e.target.result;
        result.source = 'local';
        result.status = 'replaced';
        result.updatedAt = new Date().toISOString();
        skillLocalUploadTarget = null;
        renderSkillResultModal(taskId);
        renderTable();
        showNotification('本地上传已替换该张结果图', 'success');
    };
    reader.readAsDataURL(file);
}

function skillResultDownloadStoryboard(taskId, resultId) {
    const task = taskData.find(t => t.id === taskId);
    const result = task?.skillContext?.results.find(r => r.id === resultId);
    if (!result || result.status === 'generating') {
        showNotification('故事版生成中，请稍候', 'warning');
        return;
    }

    const link = document.createElement('a');
    link.href = result.url || STORYBOARD_EXCEL_URL;
    link.download = result.fileName || STORYBOARD_EXCEL_NAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('已开始下载故事版示例 Excel', 'success');
}

function skillResultDownload(taskId, resultId) {
    const task = taskData.find(t => t.id === taskId);
    const result = task?.skillContext?.results.find(r => r.id === resultId);
    if (isStoryboardResult(result)) {
        skillResultDownloadStoryboard(taskId, resultId);
        return;
    }
    if (!result?.url) {
        showNotification('暂无可下载的图片', 'warning');
        return;
    }

    const link = document.createElement('a');
    link.href = result.url;
    link.download = `skill_${task.generationId}_${resultId}.jpg`;
    if (result.url.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noopener';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('已开始下载', 'success');
}

/** Skill 结果中的可上传图片（不含故事版 Excel 等非图片结果） */
function getConfirmedSkillMaterials(task) {
    if (!task?.skillContext) return [];
    return task.skillContext.results
        .filter(r => {
            if (!['pending', 'replaced', 'confirmed'].includes(r.status) || !r.url) return false;
            if (isStoryboardResult(r)) return false;
            if (r.resultType && r.resultType !== 'image') return false;
            return !/\.xlsx$/i.test(r.url);
        })
        .map((r, index) => ({
            id: r.id,
            name: `skill_${task.generationId}_${index + 1}.jpg`,
            file: null,
            preview: r.url,
            url: r.url,
            type: 'image/jpeg',
            size: 0,
            dimensions: '',
            selectedTags: [],
            tags: [],
            textTags: '',
            parsedTags: [],
            selectedProducts: [],
            fromSkill: true
        }));
}

function batchStartProduction() {
    if (selectedTasks.length === 0) {
        showNotification('请先勾选任务', 'warning');
        return;
    }

    const eligible = selectedTasks.filter(id => {
        const t = taskData.find(x => x.id === id);
        return t && (t.status === 'pending' || t.status === 're-pending') && isNonAigcDesigner(t);
    });

    if (eligible.length === 0) {
        showNotification('所选任务中没有可「开始生产」的条目', 'warning');
        return;
    }

    eligible.forEach(id => {
        if (typeof startProduction === 'function') startProduction(id);
    });
    showNotification(`已对 ${eligible.length} 条任务批量开始生产`, 'success');
}
