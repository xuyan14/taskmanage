/**
 * V1.1 小红书素材：下单字段展示 + 笔记库上传
 * 依赖：script.js（taskData、showNotification、tagOptions）
 */

const XHS_MOCK_UPLOAD_USER = { id: 'u-oa001', name: 'OA001' };

let noteLibraryMaterials = [];
let noteLibraryTaskId = null;

function isXiaohongshuTask(task) {
    if (!task) return false;
    const c = task.channel;
    return c === '小红书' || c === 'xiaohongshu';
}

function getXiaohongshuOrder(task) {
    if (!task) return null;
    if (task.xiaohongshuOrder) return task.xiaohongshuOrder;

    const legacy = task.xiaohongshuData;
    if (!legacy) return null;

    return {
        projectNames: ['日常'],
        contentName: legacy.topic || '—',
        noteType: '合作笔记',
        contentModel: 'OOTD',
        contentDirection: '场景',
        wordType: legacy.wordType || null,
        topic: legacy.topic || '',
        referenceLink: legacy.referenceLink || '',
        requirementNote: '',
        coverRequirement: legacy.coverText || '',
        innerPageRequirement: legacy.contentText || '',
        titleCopy: (legacy.coverText || '').slice(0, 20),
        bodyCopy: legacy.contentText || '',
        searchKeywords: legacy.searchKeywords || '',
        referenceImages: [],
        uploadAccount: task.submitter || ''
    };
}

function hasXiaohongshuOrderDetail(task) {
    return isXiaohongshuTask(task) && !!getXiaohongshuOrder(task);
}

function escapeXhsHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeXhsAttr(str) {
    if (str == null) return '';
    return escapeXhsHtml(str).replace(/'/g, '&#39;');
}

/** 操作列前插入的小红书下单字段列 */
function getXiaohongshuTableColumns() {
    return [
        { key: 'xhs_projectNames', label: '项目名称', type: 'xhs', width: 110, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_contentName', label: '内容名称', type: 'xhs', width: 120, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_noteType', label: '笔记类型', type: 'xhs', width: 100, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_contentModel', label: '内容模型', type: 'xhs', width: 100, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_contentDirection', label: '内容方向', type: 'xhs', width: 100, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_wordType', label: '词性', type: 'xhs', width: 90, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_topic', label: '选题', type: 'xhs', width: 140, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_referenceLink', label: '参考链接', type: 'xhs', width: 120, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_requirementNote', label: '下单备注', type: 'xhs', width: 130, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_coverRequirement', label: '封面需求', type: 'xhs', width: 130, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_innerPageRequirement', label: '内页需求', type: 'xhs', width: 130, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_titleCopy', label: '标题文案', type: 'xhs', width: 120, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_bodyCopy', label: '正文文案', type: 'xhs', width: 140, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_searchKeywords', label: '搜索词', type: 'xhs', width: 110, visible: true, cssClass: 'col-xhs' },
        { key: 'xhs_referenceImages', label: '参考图', type: 'xhs', width: 100, visible: true, cssClass: 'col-xhs col-xhs-ref' }
    ];
}

function formatXhsEmptyCell() {
    return '<span class="xhs-cell-empty">—</span>';
}

function formatXhsTruncatedCell(text) {
    if (text == null || !String(text).trim()) return formatXhsEmptyCell();
    const plain = String(text).trim();
    return `<span class="xhs-truncate-cell" data-xhs-full="${escapeXhsAttr(plain)}">
        <span class="xhs-truncate-text">${escapeXhsHtml(plain)}</span>
    </span>`;
}

function renderXhsReferenceImagesCell(images) {
    const list = (images || []).filter(Boolean);
    if (!list.length) return formatXhsEmptyCell();

    const preview = list.slice(0, 2).map((url, i) => `
        <span class="xhs-col-ref-thumb-wrap" data-preview-url="${escapeXhsAttr(url)}">
            <img src="${escapeXhsHtml(url)}" alt="参考图${i + 1}" class="xhs-col-ref-thumb" loading="lazy">
        </span>
    `).join('');
    const more = list.length > 2 ? `<span class="xhs-col-ref-more">+${list.length - 2}</span>` : '';

    return `<span class="xhs-ref-cell" data-xhs-ref-urls="${escapeXhsAttr(JSON.stringify(list))}">
        ${preview}${more}
    </span>`;
}

function renderXhsTableCell(task, columnKey) {
    if (!isXiaohongshuTask(task)) return formatXhsEmptyCell();

    const order = getXiaohongshuOrder(task);
    if (!order) return formatXhsEmptyCell();

    switch (columnKey) {
        case 'xhs_projectNames':
            return formatXhsTruncatedCell((order.projectNames || []).join('、'));
        case 'xhs_contentName':
            return formatXhsTruncatedCell(order.contentName);
        case 'xhs_noteType':
            return formatXhsTruncatedCell(order.noteType);
        case 'xhs_contentModel':
            return formatXhsTruncatedCell(order.contentModel);
        case 'xhs_contentDirection':
            return formatXhsTruncatedCell(order.contentDirection);
        case 'xhs_wordType':
            return order.wordType
                ? formatXhsTruncatedCell(order.wordType)
                : '<span class="xhs-placeholder">请选择词性</span>';
        case 'xhs_topic':
            return formatXhsTruncatedCell(order.topic);
        case 'xhs_referenceLink': {
            if (!order.referenceLink) return formatXhsEmptyCell();
            const href = /^https?:\/\//i.test(order.referenceLink)
                ? order.referenceLink
                : `https://${order.referenceLink}`;
            const plain = order.referenceLink;
            return `<span class="xhs-truncate-cell" data-xhs-full="${escapeXhsAttr(plain)}">
                <a href="${escapeXhsHtml(href)}" target="_blank" rel="noopener" class="xhs-truncate-link xhs-truncate-text" onclick="event.stopPropagation()">${escapeXhsHtml(plain)}</a>
            </span>`;
        }
        case 'xhs_requirementNote':
            return formatXhsTruncatedCell(order.requirementNote);
        case 'xhs_coverRequirement':
            return formatXhsTruncatedCell(order.coverRequirement);
        case 'xhs_innerPageRequirement':
            return formatXhsTruncatedCell(order.innerPageRequirement);
        case 'xhs_titleCopy':
            return formatXhsTruncatedCell(order.titleCopy);
        case 'xhs_bodyCopy':
            return formatXhsTruncatedCell(order.bodyCopy);
        case 'xhs_searchKeywords':
            return formatXhsTruncatedCell(order.searchKeywords);
        case 'xhs_referenceImages':
            return renderXhsReferenceImagesCell(order.referenceImages);
        default:
            return formatXhsEmptyCell();
    }
}

let xhsFloatingPopover = null;
let xhsPopoverHideTimer = null;

function getXhsFloatingPopover() {
    if (!xhsFloatingPopover) {
        xhsFloatingPopover = document.createElement('div');
        xhsFloatingPopover.id = 'xhsFloatingPopover';
        xhsFloatingPopover.className = 'xhs-floating-popover';
        xhsFloatingPopover.hidden = true;
        document.body.appendChild(xhsFloatingPopover);

        xhsFloatingPopover.addEventListener('mouseenter', () => {
            if (xhsPopoverHideTimer) {
                clearTimeout(xhsPopoverHideTimer);
                xhsPopoverHideTimer = null;
            }
        });
        xhsFloatingPopover.addEventListener('mouseleave', hideXhsFloatingPopover);
    }
    return xhsFloatingPopover;
}

function positionXhsFloatingPopover(anchorEl) {
    const pop = getXhsFloatingPopover();
    pop.hidden = false;
    const rect = anchorEl.getBoundingClientRect();
    const margin = 8;
    let left = rect.left;
    let top = rect.bottom + margin;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;

    const popRect = pop.getBoundingClientRect();
    if (left + popRect.width > window.innerWidth - margin) {
        left = window.innerWidth - popRect.width - margin;
    }
    if (left < margin) left = margin;
    if (top + popRect.height > window.innerHeight - margin) {
        top = rect.top - popRect.height - margin;
    }
    if (top < margin) top = margin;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
}

function showXhsTextPopover(anchorEl, text) {
    const pop = getXhsFloatingPopover();
    pop.className = 'xhs-floating-popover xhs-floating-popover--text';
    pop.textContent = text;
    positionXhsFloatingPopover(anchorEl);
}

function showXhsHtmlPopover(anchorEl, html) {
    const pop = getXhsFloatingPopover();
    pop.className = 'xhs-floating-popover xhs-floating-popover--html';
    pop.innerHTML = html;
    positionXhsFloatingPopover(anchorEl);
}

function hideXhsFloatingPopover() {
    if (xhsFloatingPopover) xhsFloatingPopover.hidden = true;
}

function scheduleHideXhsPopover() {
    if (xhsPopoverHideTimer) clearTimeout(xhsPopoverHideTimer);
    xhsPopoverHideTimer = setTimeout(hideXhsFloatingPopover, 120);
}

function initXhsTableInteractions() {
    const tbody = document.getElementById('taskTableBody');
    if (!tbody || tbody.dataset.xhsInteractionsBound) return;
    tbody.dataset.xhsInteractionsBound = '1';

    tbody.addEventListener('mouseover', (e) => {
        const truncateCell = e.target.closest('.xhs-truncate-cell[data-xhs-full]');
        if (truncateCell) {
            const textEl = truncateCell.querySelector('.xhs-truncate-text');
            if (textEl && textEl.scrollWidth <= textEl.clientWidth + 1) return;
            if (xhsPopoverHideTimer) {
                clearTimeout(xhsPopoverHideTimer);
                xhsPopoverHideTimer = null;
            }
            showXhsTextPopover(truncateCell, truncateCell.dataset.xhsFull);
            return;
        }

        const refCell = e.target.closest('.xhs-ref-cell[data-xhs-ref-urls]');
        if (refCell) {
            if (xhsPopoverHideTimer) {
                clearTimeout(xhsPopoverHideTimer);
                xhsPopoverHideTimer = null;
            }
            let urls = [];
            try {
                urls = JSON.parse(refCell.dataset.xhsRefUrls);
            } catch (err) {
                urls = [];
            }
            const html = `<div class="xhs-popover-ref-grid">${urls.map((url, i) =>
                `<img src="${escapeXhsHtml(url)}" alt="参考图${i + 1}" class="xhs-popover-ref-img" loading="lazy">`
            ).join('')}</div>`;
            showXhsHtmlPopover(refCell, html);
            return;
        }

        const thumb = e.target.closest('.xhs-col-ref-thumb-wrap[data-preview-url]');
        if (thumb) {
            if (xhsPopoverHideTimer) {
                clearTimeout(xhsPopoverHideTimer);
                xhsPopoverHideTimer = null;
            }
            const url = thumb.dataset.previewUrl;
            showXhsHtmlPopover(thumb, `<img src="${escapeXhsHtml(url)}" alt="" class="xhs-popover-ref-single">`);
        }
    });

    tbody.addEventListener('mouseout', (e) => {
        const related = e.relatedTarget;
        if (related && (related.closest('.xhs-truncate-cell') || related.closest('.xhs-ref-cell') || related.closest('.xhs-col-ref-thumb-wrap') || related.closest('#xhsFloatingPopover'))) {
            return;
        }
        scheduleHideXhsPopover();
    });
}

function renderNoteLibraryOrderSummary(task) {
    const el = document.getElementById('noteLibraryOrderSummary');
    if (!el) return;

    const order = getXiaohongshuOrder(task);
    if (!order) {
        el.innerHTML = '';
        return;
    }

    const projects = (order.projectNames || []).join('、') || '—';
    el.innerHTML = `
        <div class="note-library-summary-title">下单信息（只读）</div>
        <div class="note-library-summary-grid">
            <span><b>内容名称</b> ${escapeXhsHtml(order.contentName)}</span>
            <span><b>项目名称</b> ${escapeXhsHtml(projects)}</span>
            <span><b>笔记类型</b> ${escapeXhsHtml(order.noteType)}</span>
            <span><b>内容模型</b> ${escapeXhsHtml(order.contentModel)}</span>
            <span><b>内容方向</b> ${escapeXhsHtml(order.contentDirection)}</span>
            <span><b>词性</b> ${order.wordType ? escapeXhsHtml(order.wordType) : '—'}</span>
            <span><b>上传账户</b> ${escapeXhsHtml(order.uploadAccount || '—')}</span>
        </div>
    `;
}

function renderNoteLibraryMaterialsList() {
    const list = document.getElementById('noteLibraryMaterialsList');
    if (!list) return;

    if (noteLibraryMaterials.length === 0) {
        list.innerHTML = '<p class="note-library-empty-hint">请上传笔记配图（一条笔记可包含多图）</p>';
        return;
    }

    list.innerHTML = noteLibraryMaterials.map((m, index) => `
        <div class="note-library-material-item" data-id="${m.id}">
            <span class="note-library-sort">${index + 1}</span>
            <img src="${escapeXhsHtml(m.url)}" alt="" class="note-library-thumb">
            <span class="note-library-mat-name">${escapeXhsHtml(m.name)}</span>
            <div class="note-library-mat-actions">
                <button type="button" class="btn btn-sm btn-outline" onclick="moveNoteLibraryMaterial('${m.id}', -1)" ${index === 0 ? 'disabled' : ''} title="上移">↑</button>
                <button type="button" class="btn btn-sm btn-outline" onclick="moveNoteLibraryMaterial('${m.id}', 1)" ${index === noteLibraryMaterials.length - 1 ? 'disabled' : ''} title="下移">↓</button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="removeNoteLibraryMaterial('${m.id}')" title="删除">删除</button>
            </div>
        </div>
    `).join('');
}

function populateNoteLibraryTagSelects() {
    const producer = document.getElementById('noteProducer');
    const orderer = document.getElementById('noteOrderer');
    const designers = (typeof tagOptions !== 'undefined' && tagOptions.designer) || [];
    const requesters = (typeof tagOptions !== 'undefined' && tagOptions.requester) || [];

    if (producer) {
        producer.innerHTML = '<option value="">请选择</option>' +
            designers.map(d => `<option value="${escapeXhsHtml(d)}">${escapeXhsHtml(d)}</option>`).join('');
    }
    if (orderer) {
        orderer.innerHTML = '<option value="">请选择</option>' +
            requesters.map(r => `<option value="${escapeXhsHtml(r)}">${escapeXhsHtml(r)}</option>`).join('');
    }
}

function setupNoteLibraryUploadZone() {
    const zone = document.getElementById('noteLibraryUploadZone');
    const input = document.getElementById('noteLibraryFileInput');
    if (!zone || !input || zone.dataset.bound) return;
    zone.dataset.bound = '1';

    zone.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        input.click();
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        addNoteLibraryFiles(e.dataTransfer.files);
    });

    input.addEventListener('change', (e) => {
        addNoteLibraryFiles(e.target.files);
        e.target.value = '';
    });
}

function addNoteLibraryFiles(fileList) {
    Array.from(fileList || []).forEach(file => {
        if (!file.type.startsWith('image/')) {
            if (typeof showNotification === 'function') {
                showNotification(`不支持的文件: ${file.name}`, 'warning');
            }
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            noteLibraryMaterials.push({
                id: `nl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: file.name,
                url: ev.target.result,
                sortOrder: noteLibraryMaterials.length + 1
            });
            renderNoteLibraryMaterialsList();
        };
        reader.readAsDataURL(file);
    });
}

function moveNoteLibraryMaterial(id, delta) {
    const idx = noteLibraryMaterials.findIndex(m => m.id === id);
    if (idx < 0) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= noteLibraryMaterials.length) return;
    const [item] = noteLibraryMaterials.splice(idx, 1);
    noteLibraryMaterials.splice(newIdx, 0, item);
    renderNoteLibraryMaterialsList();
}

function removeNoteLibraryMaterial(id) {
    noteLibraryMaterials = noteLibraryMaterials.filter(m => m.id !== id);
    renderNoteLibraryMaterialsList();
}

function buildNoteLibraryPayload(task) {
    const order = getXiaohongshuOrder(task);
    const producer = document.getElementById('noteProducer')?.value?.trim() || '';
    const orderer = document.getElementById('noteOrderer')?.value?.trim() || '';

    return {
        taskId: task.id,
        generationId: task.generationId,
        noteRecord: 'single',
        contentName: order?.contentName,
        projectNames: order?.projectNames || [],
        noteType: order?.noteType,
        contentModel: order?.contentModel,
        contentDirection: order?.contentDirection,
        wordType: order?.wordType,
        uploadUser: XHS_MOCK_UPLOAD_USER,
        uploadAccount: order?.uploadAccount,
        noteProducer: producer,
        noteOrderer: orderer,
        materials: noteLibraryMaterials.map((m, i) => ({
            url: m.url,
            name: m.name,
            sortOrder: i + 1
        }))
    };
}

function openNoteLibraryUploadModal(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!task || !isXiaohongshuTask(task)) return;

    noteLibraryTaskId = taskId;
    noteLibraryMaterials = [];

    const modal = document.getElementById('noteLibraryUploadModal');
    if (!modal) return;

    modal.dataset.taskId = taskId;
    renderNoteLibraryOrderSummary(task);
    renderNoteLibraryMaterialsList();
    populateNoteLibraryTagSelects();
    setupNoteLibraryUploadZone();

    const title = modal.querySelector('.note-library-modal-title');
    if (title) title.textContent = '上传素材 · 笔记库';

    modal.style.display = 'block';
}

function closeNoteLibraryUploadModal() {
    const modal = document.getElementById('noteLibraryUploadModal');
    if (modal) modal.style.display = 'none';
    noteLibraryTaskId = null;
    noteLibraryMaterials = [];
}

function confirmNoteLibraryUpload() {
    const taskId = noteLibraryTaskId || document.getElementById('noteLibraryUploadModal')?.dataset?.taskId;
    const task = taskData.find(t => t.id === taskId);
    if (!task) return;

    if (noteLibraryMaterials.length === 0) {
        alert('请至少上传一张笔记配图');
        return;
    }

    const payload = buildNoteLibraryPayload(task);
    console.log('[V1.1 Mock] 笔记库上抛', payload);

    task.status = 'uploaded';
    task.updateTime = new Date().toLocaleString('zh-CN');
    task.noteLibraryUploaded = true;
    task.uploadedMaterials = noteLibraryMaterials.map((m, i) =>
        `笔记库|${task.generationId || task.id}|图${i + 1}|${m.name}`
    );

    closeNoteLibraryUploadModal();

    if (typeof renderTable === 'function') renderTable();

    if (typeof showNotification === 'function') {
        showNotification('已上传至笔记库并同步唯妙', 'success');
    } else {
        alert('已上传至笔记库并同步唯妙');
    }

    if (typeof syncToWeimiao === 'function') {
        setTimeout(() => syncToWeimiao(taskId), 300);
    }
}

function initV11XiaohongshuHint() {
    // 顶部引导条已移除
}

function scrollToXiaohongshuDemo() {
    const demo = taskData.find(t => t.generationId === 'GEN007') || taskData.find(t => hasXiaohongshuOrderDetail(t));
    if (!demo) return;
    const row = document.querySelector(`#taskTableBody tr[data-task-id="${demo.id}"]`);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('xhs-row-highlight');
        setTimeout(() => row.classList.remove('xhs-row-highlight'), 2500);
        const firstXhsCol = row.querySelector('.col-xhs');
        if (firstXhsCol) {
            firstXhsCol.classList.add('xhs-col-highlight');
            setTimeout(() => firstXhsCol.classList.remove('xhs-col-highlight'), 2500);
        }
    }
}

/** 供 script.js openUploadModal 分流 */
function openXiaohongshuUploadIfNeeded(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (!isXiaohongshuTask(task)) return false;
    openNoteLibraryUploadModal(taskId);
    return true;
}
