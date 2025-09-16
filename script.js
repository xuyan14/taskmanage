// 全局变量
let taskData = [];
let selectedTasks = [];
let currentUser = 'OA001'; // 当前登录用户，用于判断操作权限
let uploadedMaterials = []; // 上传的素材列表

// 手机号到姓名的映射
const phoneToNameMap = {
    '138****1234': '俊俊',
    '139****5678': '小美',
    '137****9012': '阿强',
    '136****3456': '丽丽',
    '135****7890': '小明',
    '134****5678': '小红',
    '13800138007': '小张'
};

// 列配置管理器
class TableColumnManager {
    constructor() {
        this.columns = this.initializeColumns();
        this.visibleColumns = this.columns.filter(col => col.visible);
        this.loadColumnConfig();
    }
    
    initializeColumns() {
        return [
            { key: 'select', label: '选择', type: 'checkbox', width: 60, visible: true, fixed: true },
            { key: 'createTime', label: '创建时间', type: 'datetime', width: 140, visible: true, sortable: true },
            { key: 'expectedTime', label: '期望交付时间', type: 'datetime', width: 140, visible: true, sortable: true },
            { key: 'taskHours', label: '任务工时', type: 'text', width: 100, visible: true, formatter: 'formatTaskHours' },
            { key: 'submitter', label: '提单人', type: 'text', width: 150, visible: true, formatter: 'formatSubmitter' },
            { key: 'designer', label: '设计师', type: 'text', width: 100, visible: true },
            { key: 'status', label: '创意状态', type: 'status', width: 120, visible: true },
            { key: 'updateTime', label: '更新时间', type: 'datetime', width: 140, visible: true },
            { key: 'generationId', label: '生成ID', type: 'text', width: 120, visible: true },
            { key: 'generationType', label: '生成类型', type: 'text', width: 120, visible: true },
            { key: 'channel', label: '渠道', type: 'text', width: 100, visible: true },
            { key: 'materialSource', label: '素材来源', type: 'text', width: 120, visible: true },
            { key: 'templateCategory', label: '模板分类', type: 'text', width: 120, visible: true },
            { key: 'productQuantity', label: '商品数量', type: 'number', width: 100, visible: true },
            { key: 'materialQuantity', label: '素材数量', type: 'number', width: 100, visible: true },
            { key: 'materialSize', label: '素材尺寸', type: 'text', width: 140, visible: true, formatter: 'formatMaterialSize' },
            { key: 'productCategory', label: '品类', type: 'text', width: 100, visible: true },
            { key: 'productId', label: '商品ID/等级', type: 'text', width: 200, visible: true },
            { key: 'priceInfo', label: '价格信息', type: 'text', width: 500, visible: true, cssClass: 'price-info-cell' },
            { key: 'applicationScenario', label: '应用场景', type: 'text', width: 100, visible: true },
            { key: 'creativeStrategyTag', label: '创意策略标签', type: 'text', width: 150, visible: true },
            { key: 'requirementNote', label: '需求备注', type: 'text', width: 150, visible: true },
            { key: 'referenceImages', label: '参考图', type: 'links', width: 120, visible: true, formatter: 'formatReferenceImages', cssClass: 'reference-images-cell' },
            { key: 'regenerationSuggestion', label: '重新生成建议', type: 'text', width: 150, visible: true },
            { key: 'operations', label: '操作', type: 'operations', width: 180, visible: true, fixed: true }
        ];
    }
    
    loadColumnConfig() {
        const saved = localStorage.getItem('tableColumnConfig');
        if (saved) {
            const savedConfig = JSON.parse(saved);
            this.columns.forEach(col => {
                const savedCol = savedConfig.find(sc => sc.key === col.key);
                if (savedCol) {
                    col.visible = savedCol.visible;
                    col.width = savedCol.width;
                }
            });
            this.visibleColumns = this.columns.filter(col => col.visible);
        }
    }
    
    saveColumnConfig() {
        const config = this.columns.map(col => ({
            key: col.key,
            visible: col.visible,
            width: col.width
        }));
        localStorage.setItem('tableColumnConfig', JSON.stringify(config));
    }
    
    toggleColumnVisibility(columnKey) {
        const col = this.columns.find(c => c.key === columnKey);
        if (col && !col.fixed) {
            col.visible = !col.visible;
            this.visibleColumns = this.columns.filter(col => col.visible);
            this.saveColumnConfig();
            renderTable();
        }
    }
    
    updateColumnWidth(columnKey, width) {
        const col = this.columns.find(c => c.key === columnKey);
        if (col) {
            col.width = width;
            this.saveColumnConfig();
            this.updateColumnStyles();
        }
    }
    
    updateColumnStyles() {
        this.visibleColumns.forEach((col, index) => {
            const cssVar = `--col-${col.key}-width`;
            document.documentElement.style.setProperty(cssVar, `${col.width}px`);
        });
    }
    
    getColumnByKey(key) {
        return this.columns.find(col => col.key === key);
    }
    
    getVisibleColumns() {
        return this.visibleColumns;
    }
}

// 初始化列管理器
const columnManager = new TableColumnManager();

// 模拟数据
const mockData = [
    {
        id: '7CrNkAAE',
        createTime: '2024-01-15 10:30:00',
        expectedTime: '2024-01-20 18:00:00',
        expectedHours: 120,
        taskHours: 35,
        submitter: '138****1234',
        designer: 'AIGC',
        status: 'generating',
        updateTime: '2024-01-15 11:00:00',
        generationId: 'GEN001',
        generationType: '单品多图',
        channel: '抖音',
        materialSource: 'AI生成',
        templateCategory: '原生图',
        productQuantity: 1,
        materialQuantity: 3,
        materialSize: '1280x720',
        productId: 'PROD001/国A级',
        productLevel: '一级',
        productCategory: '服装',
        priceInfo: '市价299|唯品199|到手159|直降40|折扣0.8|',
        applicationScenario: '日常',
        creativeStrategyTag: '突出商品',
        requirementNote: '需要突出产品质感',
        referenceImages: ['https://example.com/ref1.jpg', 'https://example.com/ref2.jpg'],
        regenerationSuggestion: ''
    },
    {
        id: '7CrNkAAF',
        createTime: '2024-01-15 09:15:00',
        expectedTime: '2024-01-18 18:00:00',
        expectedHours: 72,
        taskHours: 50,
        submitter: '139****5678',
        designer: '',
        status: 'unassigned', // 待分配设计师
        updateTime: '2024-01-15 09:15:00',
        generationId: 'GEN002',
        generationType: '单品多视频',
        channel: '小红书',
        materialSource: '用户上传',
        templateCategory: '模板图',
        productQuantity: 2,
        materialQuantity: 5,
        materialSize: '1920x1080',
        productId: 'PROD002/国B级\nPROD003/国B级',
        productLevel: '二级',
        productCategory: '美妆',
        priceInfo: '市价199|唯品129|到手99|直降30|折扣0.77|<br>市价299|唯品199|到手159|直降40|折扣0.8|',
        applicationScenario: '促销',
        creativeStrategyTag: '情绪营销',
        requirementNote: '突出产品功效',
        referenceImages: ['https://example.com/ref3.jpg'],
        regenerationSuggestion: ''
    },
    {
        id: '7CrNkAAG',
        createTime: '2024-01-14 16:45:00',
        expectedTime: '2024-01-17 18:00:00',
        expectedHours: 72,
        taskHours: 120,
        submitter: '137****9012',
        designer: 'OA001',
        status: 'pending',
        updateTime: '2024-01-14 16:45:00',
        generationId: 'GEN003',
        generationType: '单品单图',
        channel: '微信',
        materialSource: '模板库',
        templateCategory: '原生图',
        productQuantity: 1,
        materialQuantity: 2,
        materialSize: '1080x1920',
        productId: 'PROD004/国C级',
        productLevel: '三级',
        productCategory: '数码',
        priceInfo: '市价1299|唯品999|到手799|直降200|折扣0.8|',
        applicationScenario: '节日',
        creativeStrategyTag: '突出价格',
        requirementNote: '突出科技感',
        referenceImages: ['https://example.com/ref4.jpg', 'https://example.com/ref5.jpg', 'https://example.com/ref6.jpg'],
        regenerationSuggestion: '建议增加更多产品细节'
    },
    {
        id: '7CrNkAAH',
        createTime: '2024-01-14 14:20:00',
        expectedTime: '20244-01-16 18:00:00',
        expectedHours: 48,
        taskHours: 90,
        submitter: '136****3456',
        designer: '',
        status: 'unassigned', // 待分配设计师
        updateTime: '2024-01-15 08:30:00',
        generationId: 'GEN004',
        generationType: '单品单视频',
        channel: '抖音',
        materialSource: 'AI生成',
        templateCategory: '模板图',
        productQuantity: 3,
        materialQuantity: 4,
        materialSize: '1280x720',
        productId: 'PROD005/国A级\nPROD006/国A级\nPROD007/国A级',
        productLevel: '一级',
        productCategory: '食品',
        priceInfo: '市价89|唯品59|到手49|直降10|折扣0.83|<br>市价129|唯品89|到手69|直降20|折扣0.78|<br>市价199|唯品139|到手109|直降30|折扣0.78|',
        applicationScenario: '日常',
        creativeStrategyTag: '突出折扣',
        requirementNote: '突出美食诱惑',
        referenceImages: [],
        regenerationSuggestion: '需要更吸引人的视觉效果'
    },
    {
        id: '7CrNkAAI',
        createTime: '2024-01-13 11:30:00',
        expectedTime: '2024-01-15 18:00:00',
        expectedHours: 48,
        taskHours: 75,
        submitter: '135****7890',
        designer: 'AIGC',
        status: 'completed',
        updateTime: '2024-01-14 15:45:00',
        generationId: 'GEN005',
        generationType: '单品多视频',
        channel: '小红书',
        materialSource: 'AI生成',
        templateCategory: '原生图',
        productQuantity: 1,
        materialQuantity: 6,
        materialSize: '1920x1080',
        productId: 'PROD008/国B级',
        productLevel: '二级',
        productCategory: '家居',
        priceInfo: '市价599|唯品399|到手299|直降100|折扣0.75|',
        applicationScenario: '促销',
        creativeStrategyTag: '多品主题',
        requirementNote: '营造温馨氛围',
        referenceImages: ['https://example.com/ref7.jpg'],
        regenerationSuggestion: '',
        uploadedMaterials: [
            'VIP回儿童运0088291+腾讯app+竖图+回力+母婴鞋服+6920285558148105032+胡俊-9299',
            'VIP回儿童运0088292+腾讯app+横图+回力+母婴鞋服+6920285558148105033+胡俊-9300'
        ],
        subTasks: [
            { designer: 'OA001', status: 'completed', materialQuantity: 2 },
            { designer: 'OA002', status: 'completed', materialQuantity: 2 },
            { designer: 'OA003', status: 'completed', materialQuantity: 2 }
        ]
    },
    {
        id: '7CrNkAAJ',
        createTime: '2024-01-16 14:20:00',
        expectedTime: '2024-01-19 18:00:00',
        expectedHours: 72,
        taskHours: 45,
        submitter: '134****5678',
        designer: 'OA002',
        status: 'generating',
        updateTime: '2024-01-16 15:30:00',
        generationId: 'GEN006',
        generationType: '单品单图',
        channel: 'VTD',
        materialSource: 'AI生成',
        templateCategory: '原生图',
        productQuantity: 1,
        materialQuantity: 2,
        materialSize: '快手PD；网易PD；百度PD视频',
        productId: 'PROD009/国C级',
        productLevel: '三级',
        productCategory: '配饰',
        priceInfo: '市价199|唯品129|到手99|直降30|折扣0.77|',
        applicationScenario: '日常',
        creativeStrategyTag: '实拍合集-九宫格',
        requirementNote: '突出时尚感',
        referenceImages: ['https://example.com/ref8.jpg', 'https://example.com/ref9.jpg'],
        regenerationSuggestion: '',
        uploadedMaterials: [
            'VIP时尚配饰0088293+抖音+单图+时尚+配饰+6920285558148105034+李慧丹-9301'
        ]
    },
    {
        id: '7CrNkAAK',
        createTime: '2024-01-16 09:15:00',
        expectedTime: '2024-01-17 12:00:00',
        expectedHours: 27,
        taskHours: 60,
        submitter: '13800138007',
        designer: 'AIGC',
        status: 'generating',
        updateTime: '2024-01-16 10:30:00',
        generationId: 'GEN007',
        generationType: '单品单图',
        channel: 'xiaohongshu',
        materialSource: '系统生成',
        templateCategory: '模板图',
        productQuantity: 1,
        materialQuantity: 1,
        materialSize: '1080x1080',
        productId: '6920832209174221771/国A级',
        productLevel: '一级',
        productCategory: '服装',
        priceInfo: '市价399|唯品299|到手239|直降60|折扣0.8|',
        applicationScenario: '日常',
        creativeStrategyTag: '突出商品',
        requirementNote: 'ins风格穿搭推荐',
        referenceImages: ['https://example.com/ref10.jpg'],
        regenerationSuggestion: '',
        // 小红书特有字段
        xiaohongshuData: {
            topic: 'ins风辣妹穿搭推荐',
            coverText: 'ins风辣妹穿搭推荐',
            contentText: 'ins风辣妹穿搭推荐',
            searchKeywords: '小辣椒',
            referenceLink: 'www.xiaohongshu.com'
        }
    }
];

// 状态映射
const statusMap = {
    'unassigned': { text: '待分配设计师', class: 'status-pending' },
    'pending': { text: '首次待生成', class: 'status-pending' },
    'generating': { text: '首次生成中', class: 'status-generating' },
    'completed': { text: '首次生成完成', class: 'status-completed' },
    'failed': { text: '首次生成失败', class: 'status-failed' },
    're-pending': { text: '重新待生成', class: 'status-pending' },
    're-generating': { text: '重新生成中', class: 'status-generating' },
    're-completed': { text: '重新生成完成', class: 'status-completed' },
    're-failed': { text: '重新生成失败', class: 'status-failed' }
};

// 格式化素材尺寸显示
function formatMaterialSize(materialSize, channel) {
    if (channel === 'VTD') {
        // 对于VTD渠道，只显示前7个字符，添加hover效果
        const displayText = materialSize.substring(0, 7);
        return `<span class="material-size-vtd" data-full-text="${materialSize}">${displayText}...</span>`;
    }
    return materialSize;
}

// 格式化参考图显示
function formatReferenceImages(referenceImages) {
    if (!referenceImages || referenceImages.length === 0) {
        return '-';
    }
    
    return referenceImages.map((url, index) => 
        `<a href="#" class="reference-link" onclick="openReferenceModal('${url}', ${index + 1}); return false;">参考${index + 1}</a>`
    ).join(' ');
}

// 格式化提单人显示
function formatSubmitter(phone) {
    const name = phoneToNameMap[phone];
    if (name) {
        return `${phone}（${name}）`;
    }
    return phone;
}

// 格式化任务工时显示
function formatTaskHours(hours) {
    if (!hours || hours <= 0) {
        return '-';
    }
    
    // 如果小于60分钟，显示分钟
    if (hours < 60) {
        return `${hours}min`;
    }
    
    // 如果大于等于60分钟，显示小时和分钟
    const hoursPart = Math.floor(hours / 60);
    const minutesPart = hours % 60;
    
    if (minutesPart === 0) {
        return `${hoursPart}h`;
    } else {
        return `${hoursPart}h${minutesPart}min`;
    }
}

// 计算设计师工时统计
function calculateDesignerStats() {
    const stats = {};
    let totalHours = 0;
    let designerCount = 0;
    
    taskData.forEach(task => {
        // 只统计已分配设计师且非AIGC的任务
        if (task.designer && task.designer !== 'AIGC' && task.taskHours) {
            const designer = task.designer;
            
            if (!stats[designer]) {
                stats[designer] = {
                    name: designer,
                    totalHours: 0,
                    taskCount: 0
                };
                designerCount++;
            }
            
            stats[designer].totalHours += task.taskHours;
            stats[designer].taskCount++;
            totalHours += task.taskHours;
        }
    });
    
    return {
        stats: Object.values(stats).sort((a, b) => b.totalHours - a.totalHours),
        totalHours,
        designerCount
    };
}

// 格式化工时显示（用于统计）
function formatHoursForStats(minutes) {
    if (minutes < 60) {
        return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h${remainingMinutes}min`;
    }
}

// 设计师工时统计浮窗相关函数
function toggleDesignerStats() {
    const panel = document.getElementById('designerStatsPanel');
    const isExpanded = panel.classList.contains('expanded');
    
    if (isExpanded) {
        panel.classList.remove('expanded');
    } else {
        panel.classList.add('expanded');
        renderDesignerStats();
    }
}

function renderDesignerStats() {
    const statsData = calculateDesignerStats();
    
    // 更新汇总信息
    document.getElementById('totalHours').textContent = formatHoursForStats(statsData.totalHours);
    document.getElementById('designerCount').textContent = statsData.designerCount;
    
    // 渲染设计师列表
    const designerList = document.getElementById('designerList');
    
    if (statsData.stats.length === 0) {
        designerList.innerHTML = `
            <div class="designer-item no-assignments">
                <span class="designer-name">暂无设计师分配</span>
                <span class="designer-hours">0min</span>
            </div>
        `;
        return;
    }
    
    designerList.innerHTML = statsData.stats.map(designer => `
        <div class="designer-item">
            <span class="designer-name">${designer.name}</span>
            <span class="designer-hours">${formatHoursForStats(designer.totalHours)}</span>
        </div>
    `).join('');
}

// 批量上传相关变量和函数
let bulkUploadData = {};

// 打开批量上传弹窗
function openBulkUpload() {
    if (selectedTasks.length === 0) {
        alert('请先选择要上传的任务');
        return;
    }
    
    // 初始化批量上传数据
    bulkUploadData = {};
    selectedTasks.forEach(taskId => {
        const task = taskData.find(t => t.id === taskId);
        if (task) {
            bulkUploadData[taskId] = {
                task: task,
                files: [],
                materialTags: {}
            };
        }
    });
    
    document.getElementById('selectedTaskCount').textContent = selectedTasks.length;
    renderBulkUploadTable();
    document.getElementById('bulkUploadModal').style.display = 'block';
}

// 渲染批量上传表格
function renderBulkUploadTable() {
    const tbody = document.getElementById('bulkUploadTableBody');
    tbody.innerHTML = '';
    
    selectedTasks.forEach(taskId => {
        const uploadData = bulkUploadData[taskId];
        const task = uploadData.task;
        
        const row = document.createElement('tr');
        row.className = 'bulk-upload-row';
        row.dataset.taskId = taskId;
        row.setAttribute('ondrop', `handleRowDrop(event, '${taskId}')`);
        row.setAttribute('ondragover', 'handleRowDragOver(event)');
        row.setAttribute('ondragleave', 'handleRowDragLeave(event)');
        row.innerHTML = `
            <td class="task-id-cell">
                <div class="task-id-container">
                    <button class="btn btn-sm btn-outline-primary upload-btn" 
                            onclick="triggerFileInput('${taskId}')" 
                            title="点击上传素材">
                        <i class="fas fa-upload"></i>
                    </button>
                    <span class="task-id-text">${taskId}</span>
                    <div class="uploaded-files-mini" id="uploadedFiles_${taskId}"></div>
                </div>
                <input type="file" id="fileInput_${taskId}" 
                       style="display: none;" 
                       multiple 
                       accept="image/*,video/*"
                       onchange="handleFileSelect(event, '${taskId}')">
            </td>
            <td class="task-requirements">
                <div class="requirements-horizontal">
                    <span class="requirement-badge">${task.materialQuantity || 1}个</span>
                    <span class="requirement-badge">${formatMaterialSize(task.materialSize, task.channel)}</span>
                    <span class="requirement-badge">${task.generationType}</span>
                </div>
            </td>
            <td class="material-tags-container" id="materialTags_${taskId}">
                <button class="btn btn-sm btn-outline-primary tags-expand-btn" 
                        onclick="toggleTagsExpansion('${taskId}')" 
                        id="tagsBtn_${taskId}">
                    <i class="fas fa-tags"></i> 标签
                    <span class="tags-count" id="tagsCount_${taskId}">0</span>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 触发文件选择
function triggerFileInput(taskId) {
    console.log('triggerFileInput called with taskId:', taskId);
    const fileInput = document.getElementById(`fileInput_${taskId}`);
    console.log('fileInput element:', fileInput);
    if (fileInput) {
        try {
            fileInput.click();
            console.log('File input clicked successfully');
        } catch (error) {
            console.error('Error clicking file input:', error);
        }
    } else {
        console.error('File input element not found for taskId:', taskId);
    }
}

// 处理文件选择
function handleFileSelect(event, taskId) {
    const files = Array.from(event.target.files);
    addFilesToTask(files, taskId);
}

// 处理拖拽悬停
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

// 处理拖拽离开
function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

// 处理拖拽放置
function handleDrop(event, taskId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    addFilesToTask(files, taskId);
}

// 处理任务行拖拽悬停
function handleRowDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('row-drag-over');
}

// 处理任务行拖拽离开
function handleRowDragLeave(event) {
    event.currentTarget.classList.remove('row-drag-over');
}

// 处理任务行拖拽放置
function handleRowDrop(event, taskId) {
    event.preventDefault();
    event.currentTarget.classList.remove('row-drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    addFilesToTask(files, taskId);
}

// 添加文件到任务
function addFilesToTask(files, taskId) {
    const uploadData = bulkUploadData[taskId];
    if (!uploadData) return;
    
    files.forEach(file => {
        uploadData.files.push(file);
        uploadData.materialTags[file.name] = {
            name: file.name,
            category: '',
            channel: '',
            designer: '',
            productId: '',
            textTags: ''
        };
    });
    
    renderUploadedFiles(taskId);
    renderMaterialTags(taskId);
}

// 渲染已上传文件（迷你版本）
function renderUploadedFiles(taskId) {
    const container = document.getElementById(`uploadedFiles_${taskId}`);
    const uploadData = bulkUploadData[taskId];
    
    if (uploadData.files.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = uploadData.files.map((file, index) => `
        <div class="uploaded-file-mini" title="${file.name}">
            <img src="${URL.createObjectURL(file)}" class="file-preview-mini" alt="预览">
            <span class="remove-file-mini" onclick="removeFile('${file.name}', '${taskId}')">&times;</span>
        </div>
    `).join('');
}

// 渲染素材标签
function renderMaterialTags(taskId) {
    const container = document.getElementById(`materialTags_${taskId}`);
    const uploadData = bulkUploadData[taskId];
    
    if (uploadData.files.length === 0) {
        container.innerHTML = `
            <button class="btn btn-sm btn-outline-secondary tags-expand-btn" disabled>
                <i class="fas fa-tags"></i> 标签
                <span class="tags-count">0</span>
            </button>
        `;
        return;
    }
    
    // 更新标签数量
    const tagsCount = document.getElementById(`tagsCount_${taskId}`);
    if (tagsCount) {
        tagsCount.textContent = uploadData.files.length;
    }
}

// 切换标签展开面板
function toggleTagsExpansion(taskId) {
    const panel = document.getElementById('tagsExpansionPanel');
    const title = document.getElementById('tagsPanelTitle');
    const uploadData = bulkUploadData[taskId];
    
    if (!uploadData || uploadData.files.length === 0) {
        alert('该任务暂无素材，请先上传素材');
        return;
    }
    
    title.textContent = `任务 ${taskId} - 素材标签设置`;
    renderTagsTable(taskId);
    
    // 显示面板
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 渲染标签表格
function renderTagsTable(taskId) {
    const tbody = document.getElementById('tagsTableBody');
    const uploadData = bulkUploadData[taskId];
    
    if (!uploadData || uploadData.files.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">暂无素材</td></tr>';
        return;
    }
    
    tbody.innerHTML = uploadData.files.map(file => {
        const tags = uploadData.materialTags[file.name];
        return `
            <tr class="tag-row">
                <td class="preview-cell">
                    <img src="${URL.createObjectURL(file)}" class="material-preview-table" alt="预览">
                </td>
                <td class="name-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.name}" 
                           onchange="updateMaterialName('${file.name}', this.value, '${taskId}')"
                           placeholder="素材名称">
                </td>
                <td class="category-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.category}"
                           onchange="updateMaterialTag('${file.name}', 'category', this.value, '${taskId}')"
                           placeholder="品类">
                </td>
                <td class="channel-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.channel}"
                           onchange="updateMaterialTag('${file.name}', 'channel', this.value, '${taskId}')"
                           placeholder="渠道">
                </td>
                <td class="designer-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.designer}"
                           onchange="updateMaterialTag('${file.name}', 'designer', this.value, '${taskId}')"
                           placeholder="设计师">
                </td>
                <td class="product-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.productId}"
                           onchange="updateMaterialTag('${file.name}', 'productId', this.value, '${taskId}')"
                           placeholder="商品ID">
                </td>
                <td class="text-tags-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.textTags}"
                           onchange="updateMaterialTag('${file.name}', 'textTags', this.value, '${taskId}')"
                           placeholder="文本标签">
                </td>
            </tr>
        `;
    }).join('');
}

// 关闭标签展开面板
function closeTagsExpansion() {
    document.getElementById('tagsExpansionPanel').style.display = 'none';
}

// 更新上传区域状态
function updateUploadArea(taskId) {
    const uploadArea = document.getElementById(`uploadArea_${taskId}`);
    const uploadData = bulkUploadData[taskId];
    
    if (uploadData.files.length > 0) {
        uploadArea.classList.add('has-files');
    } else {
        uploadArea.classList.remove('has-files');
    }
}

// 移除文件
function removeFile(fileName, taskId) {
    const uploadData = bulkUploadData[taskId];
    if (!uploadData) return;
    
    uploadData.files = uploadData.files.filter(file => file.name !== fileName);
    delete uploadData.materialTags[fileName];
    
    renderUploadedFiles(taskId);
    renderMaterialTags(taskId);
}

// 更新素材名称
function updateMaterialName(fileName, newName, taskId) {
    const uploadData = bulkUploadData[taskId];
    if (uploadData && uploadData.materialTags[fileName]) {
        uploadData.materialTags[fileName].name = newName;
    }
}

// 更新素材标签
function updateMaterialTag(fileName, tagType, value, taskId) {
    const uploadData = bulkUploadData[taskId];
    if (uploadData && uploadData.materialTags[fileName]) {
        uploadData.materialTags[fileName][tagType] = value;
    }
}

// 清空所有上传
function clearAllUploads() {
    if (confirm('确定要清空所有上传的素材吗？')) {
        selectedTasks.forEach(taskId => {
            const uploadData = bulkUploadData[taskId];
            if (uploadData) {
                uploadData.files = [];
                uploadData.materialTags = {};
            }
            renderUploadedFiles(taskId);
            renderMaterialTags(taskId);
            updateUploadArea(taskId);
        });
    }
}

// 确认批量上传
function confirmBulkUpload() {
    let hasFiles = false;
    let totalFiles = 0;
    
    // 检查是否有文件上传
    selectedTasks.forEach(taskId => {
        const uploadData = bulkUploadData[taskId];
        if (uploadData && uploadData.files.length > 0) {
            hasFiles = true;
            totalFiles += uploadData.files.length;
        }
    });
    
    if (!hasFiles) {
        alert('请至少为一个任务上传素材');
        return;
    }
    
    // 显示进度条
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('confirmBulkUploadBtn').disabled = true;
    
    // 模拟上传过程 - 使用更可靠的线性进度
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadDuration = 3000; // 总上传时间3秒
    const updateInterval = 50; // 每50ms更新一次
    const totalSteps = uploadDuration / updateInterval;
    let currentStep = 0;
    
    const uploadInterval = setInterval(() => {
        currentStep++;
        const progress = Math.min((currentStep / totalSteps) * 100, 100);
        
        progressFill.style.width = progress + '%';
        progressText.textContent = `上传中... ${Math.round(progress)}%`;
        
        if (currentStep >= totalSteps) {
            clearInterval(uploadInterval);
            
            // 确保进度条显示100%
            progressFill.style.width = '100%';
            progressText.textContent = '上传中... 100%';
            
            // 上传完成，更新任务状态
            selectedTasks.forEach(taskId => {
                const uploadData = bulkUploadData[taskId];
                if (uploadData && uploadData.files.length > 0) {
                    const task = taskData.find(t => t.id === taskId);
                    if (task) {
                        task.status = 'uploaded';
                        task.updateTime = new Date().toLocaleString('zh-CN');
                        task.uploadedMaterials = uploadData.files.map((file, index) => {
                            const tags = uploadData.materialTags[file.name];
                            const taskInfo = task;
                            const designer = tags.designer || taskInfo.designer || '未知设计师';
                            const category = tags.category || taskInfo.productCategory;
                            const channel = tags.channel || taskInfo.channel;
                            const productId = tags.productId || taskInfo.productId.split('\n')[0].split('/')[0];
                            const materialName = `VIP${taskId}+${channel}+${taskInfo.generationType}+${designer}+${category}+${productId}+${designer}-${9000 + index}`;
                            return materialName;
                        });
                    }
                }
            });
            
            // 重新渲染表格
            renderTable();
            
            setTimeout(() => {
                alert('批量上传完成！');
                closeModal('bulkUploadModal');
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('confirmBulkUploadBtn').disabled = false;
                progressFill.style.width = '0%';
                progressText.textContent = '上传中...';
            }, 1000);
        }
    }, updateInterval);
}

// 格式化素材名称显示
function formatMaterialName(fullName) {
    if (!fullName) return '';
    
    // 如果名称长度超过30个字符，截断并添加省略号
    if (fullName.length > 30) {
        return fullName.substring(0, 30) + '...';
    }
    return fullName;
}

// 格式化上传素材显示
function formatUploadedMaterials(materials) {
    if (!materials || materials.length === 0) {
        return '';
    }
    
    return materials.map((material, index) => {
        const displayName = formatMaterialName(material);
        return `<a href="https://e.vip.com/creative-centre.html?advId=w-7CiSRV#/?pi=1&groupId=7CrNu0Qy" 
                   target="_blank" 
                   class="material-link" 
                   title="${material}">
                   ${displayName}
                 </a>`;
    }).join('<br>');
}

// 列配置面板功能
function toggleColumnConfig() {
    const panel = document.getElementById('columnConfigPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        renderColumnConfig();
    } else {
        panel.style.display = 'none';
    }
}

function renderColumnConfig() {
    const columnList = document.getElementById('columnList');
    columnList.innerHTML = '';
    
    columnManager.columns.forEach(column => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        
        columnItem.innerHTML = `
            <label class="column-checkbox">
                <input type="checkbox" 
                       ${column.visible ? 'checked' : ''} 
                       ${column.fixed ? 'disabled' : ''} 
                       onchange="toggleColumn('${column.key}')">
                <span class="column-label">${column.label}</span>
                ${column.fixed ? '<span class="fixed-badge">固定</span>' : ''}
            </label>
        `;
        
        columnList.appendChild(columnItem);
    });
}

function toggleColumn(columnKey) {
    columnManager.toggleColumnVisibility(columnKey);
}

function showAllColumns() {
    columnManager.columns.forEach(col => {
        if (!col.fixed) {
            col.visible = true;
        }
    });
    columnManager.visibleColumns = columnManager.columns.filter(col => col.visible);
    columnManager.saveColumnConfig();
    renderTable();
    renderColumnConfig();
}

function hideAllColumns() {
    columnManager.columns.forEach(col => {
        if (!col.fixed) {
            col.visible = false;
        }
    });
    columnManager.visibleColumns = columnManager.columns.filter(col => col.visible);
    columnManager.saveColumnConfig();
    renderTable();
    renderColumnConfig();
}

function resetColumnConfig() {
    localStorage.removeItem('tableColumnConfig');
    columnManager.columns = columnManager.initializeColumns();
    columnManager.visibleColumns = columnManager.columns.filter(col => col.visible);
    renderTable();
    renderColumnConfig();
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    taskData = [...mockData];
    setDefaultTimeRange();
    renderTable();
});

// 渲染表格
function renderTable() {
    const thead = document.querySelector('#taskTable thead tr');
    const tbody = document.getElementById('taskTableBody');
    
    // 清空表格
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // 渲染表头
    renderTableHeader(thead);
    
    // 渲染表格内容
    taskData.forEach((task, index) => {
        const row = document.createElement('tr');
        row.dataset.taskId = task.id;
        
        if (selectedTasks.includes(task.id)) {
            row.classList.add('selected-row');
        }

        // 渲染表格行
        renderTableRow(row, task);
        tbody.appendChild(row);
        
        // 如果是单品多视频且有子任务，添加展开行（默认隐藏）
        if (task.generationType === '单品多视频' && task.subTasks && task.subTasks.length > 0) {
            task.subTasks.forEach((subTask, subIndex) => {
                const subRow = document.createElement('tr');
                subRow.className = 'sub-task-row';
                subRow.dataset.parentId = task.id;
                subRow.dataset.subIndex = subIndex;
                subRow.style.display = 'none';
                
                subRow.innerHTML = `
                    <td></td>
                    <td colspan="20" class="sub-task-content">
                        <div class="sub-task-info">
                            <span class="sub-task-label">设计师: ${subTask.designer}</span>
                            <span class="sub-task-status">状态: ${statusMap[subTask.status].text}</span>
                            <span class="sub-task-quantity">素材数量: ${subTask.materialQuantity}</span>
                        </div>
                        <div class="sub-task-operations">
                            ${getSubTaskOperationButtonsHTML(subTask, task.id, subIndex)}
                        </div>
                    </td>
                `;
                
                tbody.appendChild(subRow);
            });
        }
        
        // 如果是小红书任务且有小红书数据，添加展开行（默认隐藏）
        if (task.channel === 'xiaohongshu' && task.xiaohongshuData) {
            const xiaohongshuRow = document.createElement('tr');
            xiaohongshuRow.className = 'xiaohongshu-detail-row';
            xiaohongshuRow.dataset.parentId = task.id;
            xiaohongshuRow.style.display = 'none';
            
            xiaohongshuRow.innerHTML = `
                <td></td>
                <td colspan="20" class="xiaohongshu-detail-content">
                    <div class="xiaohongshu-details">
                        <div class="detail-item">
                            <span class="detail-label">选题：</span>
                            <span class="detail-value">${task.xiaohongshuData.topic}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">封面文案：</span>
                            <span class="detail-value">${task.xiaohongshuData.coverText}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">内页文案：</span>
                            <span class="detail-value">${task.xiaohongshuData.contentText}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">搜索词：</span>
                            <span class="detail-value">${task.xiaohongshuData.searchKeywords}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">参考链接：</span>
                            <span class="detail-value">
                                <a href="https://${task.xiaohongshuData.referenceLink}" target="_blank" class="reference-link">
                                    ${task.xiaohongshuData.referenceLink}
                                </a>
                            </span>
                        </div>
                    </div>
                </td>
            `;
            
            tbody.appendChild(xiaohongshuRow);
        }
    });

    updateBulkActions();
}

// 渲染表格表头
function renderTableHeader(thead) {
    const visibleColumns = columnManager.getVisibleColumns();
    
    visibleColumns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        
        if (column.cssClass) {
            th.className = column.cssClass;
        }
        
        // 设置CSS变量用于宽度
        th.style.setProperty('--column-width', `${column.width}px`);
        
        thead.appendChild(th);
    });
}

// 渲染表格行
function renderTableRow(row, task) {
    const visibleColumns = columnManager.getVisibleColumns();
    
    visibleColumns.forEach(column => {
        const td = document.createElement('td');
        
        // 根据列类型渲染内容
        let content = '';
        switch (column.key) {
            case 'select':
                const hasExpandableContent = (task.generationType === '单品多视频' && task.subTasks && task.subTasks.length > 0) || 
                                           (task.channel === 'xiaohongshu' && task.xiaohongshuData);
                const expandButton = hasExpandableContent 
                    ? `<button class="btn btn-sm btn-secondary expand-btn" onclick="toggleExpandableContent('${task.id}')" data-expanded="false">
                         <i class="fas fa-chevron-down"></i>
                       </button>` 
                    : '';
                content = `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" 
                               onchange="toggleTaskSelection('${task.id}', this)" 
                               ${selectedTasks.includes(task.id) ? 'checked' : ''}>
                        ${expandButton}
                    </div>
                `;
                break;
            case 'taskHours':
                content = formatTaskHours(task.taskHours);
                break;
            case 'submitter':
                content = formatSubmitter(task.submitter);
                break;
            case 'status':
                content = `<span class="status-tag ${statusMap[task.status].class}">${statusMap[task.status].text}</span>`;
                break;
            case 'channel':
                content = task.channel === 'xiaohongshu' ? '小红书' : task.channel;
                break;
            case 'materialSize':
                content = formatMaterialSize(task.materialSize, task.channel);
                break;
            case 'productId':
                content = task.productId;
                td.style.whiteSpace = 'pre-line';
                break;
            case 'priceInfo':
                content = task.priceInfo;
                break;
            case 'referenceImages':
                content = formatReferenceImages(task.referenceImages);
                break;
            case 'operations':
                content = `<div class="operation-buttons">${getOperationButtonsHTML(task)}</div>`;
                break;
            default:
                content = task[column.key] || '-';
        }
        
        td.innerHTML = content;
        
        // 应用CSS类
        if (column.cssClass) {
            td.className = column.cssClass;
        }
        
        // 设置CSS变量用于宽度
        td.style.setProperty('--column-width', `${column.width}px`);
        
        row.appendChild(td);
    });
}

// 切换任务选择
function toggleTaskSelection(taskId, checkbox) {
    const row = checkbox.closest('tr');
    
    if (checkbox.checked) {
        if (!selectedTasks.includes(taskId)) {
            selectedTasks.push(taskId);
        }
        row.classList.add('selected-row');
    } else {
        selectedTasks = selectedTasks.filter(id => id !== taskId);
        row.classList.remove('selected-row');
    }

    updateBulkActions();
    updateSelectAllCheckbox();
}

// 全选/取消全选
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('#taskTableBody input[type="checkbox"]');
    
    if (selectAllCheckbox.checked) {
        selectedTasks = taskData.map(task => task.id);
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('tr').classList.add('selected-row');
        });
    } else {
        selectedTasks = [];
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('tr').classList.remove('selected-row');
        });
    }

    updateBulkActions();
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('#taskTableBody input[type="checkbox"]');
    const checkedCount = document.querySelectorAll('#taskTableBody input[type="checkbox"]:checked').length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 更新批量操作按钮
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    
    if (selectedTasks.length > 0) {
        bulkActions.style.display = 'flex';
    } else {
        bulkActions.style.display = 'none';
    }
}

// 获取操作按钮HTML
function getOperationButtonsHTML(task) {
    let buttonsHTML = '';
    let materialsHTML = '';
    
    // 如果有上传的素材，显示素材列表
    if (task.uploadedMaterials && task.uploadedMaterials.length > 0) {
        materialsHTML = `<div class="uploaded-materials">${formatUploadedMaterials(task.uploadedMaterials)}</div>`;
    }
    
    // AIGC设计师 - 无操作按钮显示
    if (task.designer === 'AIGC') {
        buttonsHTML = '';
    }
    // 待分配设计师状态 - 显示分配设计师和导出任务
    else if (task.status === 'unassigned') {
        buttonsHTML = `
            <button class="btn btn-primary" onclick="assignDesigner(${task.id})">分配设计师</button>
            <button class="btn btn-success" onclick="exportSingleTask(${task.id})">导出任务</button>
        `;
    }
    // ued设计师且空值 - 只有关闭按钮
    else if (task.designer === 'ued' && task.status === 'pending') {
        buttonsHTML = '<button class="btn btn-danger" onclick="closeTask(' + task.id + ')">关闭</button>';
    }
    // OA设计师 - 根据状态显示不同按钮
    else if (task.designer && task.designer.startsWith('OA')) {
        // 遵循有权限的流程，所有OA设计师都可以操作
        if (task.status === 'pending' || task.status === 're-pending') {
            buttonsHTML = `
                <button class="btn btn-primary" onclick="startProduction(${task.id})">开始生产</button>
                <button class="btn btn-danger" onclick="closeTask(${task.id})">关闭</button>
            `;
        }
        else if (task.status === 'generating' || task.status === 're-generating') {
            // 针对单品单图，显示上传素材、图创作、关闭三个按钮
            if (task.generationType === '单品单图') {
                buttonsHTML = `
                    <button class="btn btn-success" onclick="openUploadModal(${task.id})">上传素材</button>
                    <button class="btn btn-secondary" onclick="openImageCreation(${task.id})">图创作</button>
                    <button class="btn btn-danger" onclick="closeTask(${task.id})">关闭</button>
                `;
            } else {
                // 其他类型只显示上传素材和关闭按钮
                buttonsHTML = `
                    <button class="btn btn-success" onclick="openUploadModal(${task.id})">上传素材</button>
                    <button class="btn btn-danger" onclick="closeTask(${task.id})">关闭</button>
                `;
            }
        }
        else if (task.status === 'uploaded') {
            buttonsHTML = '<button class="btn btn-primary" onclick="syncToWeimiao(' + task.id + ')">同步唯妙</button>';
        }
    }
    // 其他情况 - 无操作按钮
    else {
        // 移除无操作选项，遵循有权限的流程
        buttonsHTML = '';
    }
    
    return buttonsHTML + materialsHTML;
}

// 获取子任务操作按钮HTML
function getSubTaskOperationButtonsHTML(subTask, parentTaskId, subIndex) {
    let buttonsHTML = '';
    
    // 单品多视频的子任务都有操作权限
    if (subTask.status === 'pending' || subTask.status === 're-pending') {
        buttonsHTML = `
            <button class="btn btn-primary" onclick="startSubTaskProduction('${parentTaskId}', ${subIndex})">开始生产</button>
            <button class="btn btn-danger" onclick="closeSubTask('${parentTaskId}', ${subIndex})">关闭</button>
        `;
    }
    else if (subTask.status === 'generating' || subTask.status === 're-generating') {
        // 子任务只显示上传素材按钮（子任务不支持图创作）
        buttonsHTML = '<button class="btn btn-success" onclick="openSubTaskUploadModal(\'' + parentTaskId + '\', ' + subIndex + ')">上传素材</button>';
    }
    else if (subTask.status === 'uploaded') {
        buttonsHTML = '<button class="btn btn-primary" onclick="syncSubTaskToWeimiao(\'' + parentTaskId + '\', ' + subIndex + ')">同步唯妙</button>';
    }
    else if (subTask.status === 'completed') {
        buttonsHTML = '<button class="btn btn-secondary btn-disabled" disabled>已完成</button>';
    }
    else if (subTask.status === 'failed') {
        buttonsHTML = '<button class="btn btn-secondary btn-disabled" disabled>已关闭</button>';
    }
    
    return buttonsHTML;
}



// 查询数据
function queryData() {
    // 获取筛选条件
    const filters = {
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        submitter: document.querySelector('input[placeholder="请输入提单人手机号"]').value,
        designer: document.querySelectorAll('select')[0].value,
        status: document.querySelectorAll('select')[1].value,
        generationId: document.querySelector('input[placeholder="请输入生成ID"]').value,
        generationType: document.querySelectorAll('select')[2].value,
        channel: document.querySelectorAll('select')[3].value,
        productId: document.querySelector('input[placeholder="请输入商品ID"]').value,
        applicationScenario: document.querySelectorAll('select')[4].value,
        productCategory: document.querySelectorAll('select')[5].value,
        assignmentStatus: document.querySelectorAll('select')[6].value,
        expectedStartTime: document.getElementById('expectedStartTime').value,
        expectedEndTime: document.getElementById('expectedEndTime').value,
        creativeStrategyTags: selectedCreativeStrategyTags
    };

    // 应用筛选
    taskData = mockData.filter(task => {
        // 时间范围筛选
        if (filters.startTime || filters.endTime) {
            const taskTime = new Date(task.createTime);
            if (filters.startTime) {
                const startTime = new Date(filters.startTime);
                if (taskTime < startTime) return false;
            }
            if (filters.endTime) {
                const endTime = new Date(filters.endTime);
                if (taskTime > endTime) return false;
            }
        }
        
        if (filters.submitter && !task.submitter.includes(filters.submitter)) return false;
        if (filters.designer && task.designer !== filters.designer) return false;
        if (filters.status && task.status !== filters.status) return false;
        if (filters.generationId && !task.generationId.includes(filters.generationId)) return false;
        if (filters.generationType && task.generationType !== filters.generationType) return false;
        if (filters.channel) {
            // 处理渠道映射
            const channelMap = {
                'douyin': '抖音',
                'xiaohongshu': '小红书',
                'wechat': '微信',
                'vtd': 'VTD'
            };
            const taskChannel = task.channel === 'xiaohongshu' ? '小红书' : task.channel;
            const filterChannel = channelMap[filters.channel] || filters.channel;
            if (taskChannel !== filterChannel) return false;
        }
        if (filters.productId && !task.productId.includes(filters.productId)) return false;
        if (filters.applicationScenario && task.applicationScenario !== filters.applicationScenario) return false;
        if (filters.productCategory && task.productCategory !== filters.productCategory) return false;
        if (filters.assignmentStatus) {
            const isAssigned = task.designer && task.designer !== '';
            if (filters.assignmentStatus === 'assigned' && !isAssigned) return false;
            if (filters.assignmentStatus === 'unassigned' && isAssigned) return false;
        }
        // 期望交付时间范围筛选
        if (filters.expectedStartTime || filters.expectedEndTime) {
            const taskExpectedTime = new Date(task.expectedTime);
            if (filters.expectedStartTime) {
                const startTime = new Date(filters.expectedStartTime);
                if (taskExpectedTime < startTime) return false;
            }
            if (filters.expectedEndTime) {
                const endTime = new Date(filters.expectedEndTime);
                if (taskExpectedTime > endTime) return false;
            }
        }
        // 创意策略标签筛选（多选）
        if (filters.creativeStrategyTags && filters.creativeStrategyTags.length > 0) {
            // 检查任务是否包含任何一个选中的标签
            const taskHasSelectedTag = filters.creativeStrategyTags.some(tag => 
                task.creativeStrategyTag && task.creativeStrategyTag.includes(tag)
            );
            if (!taskHasSelectedTag) {
                return false;
            }
        }
        return true;
    });

    selectedTasks = [];
    renderTable();
}

// 设置默认时间范围（近3日）
function setDefaultTimeRange() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    // 格式化时间为 YYYY-MM-DDTHH:mm 格式
    const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    document.getElementById('startTime').value = formatDateTime(threeDaysAgo);
    document.getElementById('endTime').value = formatDateTime(now);
}

// 重置筛选
function resetFilters() {
    document.querySelectorAll('.filter-section input, .filter-section select').forEach(input => {
        if (input.type === 'datetime-local') {
            input.value = '';
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
    });
    
    // 重置创意策略标签
    selectedCreativeStrategyTags = [];
    const checkboxes = document.querySelectorAll('#creativeStrategyContent input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateCreativeStrategyDisplay();
    
    // 重置时间范围为默认值（近3日）
    setDefaultTimeRange();

    taskData = [...mockData];
    selectedTasks = [];
    renderTable();
}

// 分配设计师
function assignDesigner(taskId = null) {
    // 如果是单个任务分配，记录任务ID
    if (taskId) {
        window.currentAssignTaskId = taskId;
        const task = taskData.find(t => t.id === taskId);
        
        // 设置素材数量
        const quantityInput = document.querySelector('.material-quantity');
        if (quantityInput && task) {
            quantityInput.value = task.materialQuantity;
            
            // 根据生成类型设置是否可编辑
            if (task.generationType === '单品多视频') {
                quantityInput.removeAttribute('readonly');
                quantityInput.style.backgroundColor = '#fff';
            } else {
                quantityInput.setAttribute('readonly', true);
                quantityInput.style.backgroundColor = '#f8f9fa';
            }
        }
        
        // 根据生成类型调整弹窗内容
        if (task && task.generationType !== '单品多视频') {
            // 单品单图、单品多图、单品单视频只允许一个设计师
            const addButton = document.querySelector('.add-assignment');
            if (addButton) {
                addButton.style.display = 'none';
            }
        } else {
            // 单品多视频允许多个设计师
            const addButton = document.querySelector('.add-assignment');
            if (addButton) {
                addButton.style.display = 'block';
            }
        }
    } else {
        // 批量分配
        const selectedTaskIds = selectedTasks;
        const selectedTaskData = taskData.filter(t => selectedTaskIds.includes(t.id));
        
        // 检查是否包含单品多视频任务
        const hasMultiVideoTask = selectedTaskData.some(task => task.generationType === '单品多视频');
        
        if (hasMultiVideoTask) {
            alert('单品多视频任务不支持多选分配，请单独分配');
            return;
        }
        
        // 批量分配时只允许一个设计师，素材数量为所有任务的总和
        const totalQuantity = selectedTaskData.reduce((sum, task) => sum + task.materialQuantity, 0);
        const quantityInput = document.querySelector('.material-quantity');
        if (quantityInput) {
            quantityInput.value = totalQuantity;
            quantityInput.setAttribute('readonly', true);
            quantityInput.style.backgroundColor = '#f8f9fa';
        }
        
        const addButton = document.querySelector('.add-assignment');
        if (addButton) {
            addButton.style.display = 'none';
        }
    }
    document.getElementById('assignModal').style.display = 'block';
}

// 添加分配条目
function addAssignmentEntry() {
    const assignmentEntries = document.getElementById('assignmentEntries');
    const newEntry = document.createElement('div');
    newEntry.className = 'assignment-entry';
    
    // 获取当前任务的素材数量
    let materialQuantity = 1;
    if (window.currentAssignTaskId) {
        const task = taskData.find(t => t.id === window.currentAssignTaskId);
        if (task) {
            materialQuantity = task.materialQuantity;
        }
    }
    
    newEntry.innerHTML = `
        <div class="form-group">
            <label>选择设计师OA</label>
            <select class="designer-select">
                <option value="">(下拉选项)</option>
                <option value="AIGC">AIGC</option>
                <option value="ued">ued</option>
                <option value="OA001">OA001</option>
                <option value="OA002">OA002</option>
                <option value="OA003">OA003</option>
            </select>
        </div>
        <div class="form-group">
            <label>分配素材数量</label>
            <input type="number" class="material-quantity" value="${materialQuantity}" min="1" readonly style="background-color: #f8f9fa;">
        </div>
        <button class="btn btn-danger" onclick="removeAssignmentEntry(this)" style="margin-left: 10px;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    assignmentEntries.appendChild(newEntry);
}

// 移除分配条目
function removeAssignmentEntry(button) {
    const entry = button.closest('.assignment-entry');
    if (document.querySelectorAll('.assignment-entry').length > 1) {
        entry.remove();
    } else {
        alert('至少需要保留一个分配条目');
    }
}

// 导出单个任务
function exportSingleTask(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (task) {
        // 创建CSV内容
        let csvContent = '创意生产任务列表\n';
        csvContent += '创建时间,期望交付时间,提单人,设计师,创意状态,更新时间,生成ID,生成类型,渠道,素材来源,模板分类,商品数量,素材数量,素材尺寸,商品ID,应用场景,创意策略标签,重新生成建议\n';
        csvContent += `${task.createTime},${task.expectedTime},${task.submitter},${task.designer || '-'},${statusMap[task.status].text},${task.updateTime},${task.generationId},${task.generationType},${task.channel},${task.materialSource},${task.templateCategory},${task.productQuantity},${task.materialQuantity},${task.materialSize},${task.productId},${task.applicationScenario},${task.creativeStrategyTag},${task.regenerationSuggestion || '-'}\n`;

        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `创意生产任务_${task.generationId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 确认分配设计师
function confirmAssign() {
    const assignmentEntries = document.querySelectorAll('.assignment-entry');
    const assignments = [];
    
    // 收集所有分配信息
    assignmentEntries.forEach(entry => {
        const designer = entry.querySelector('.designer-select').value;
        const quantity = parseInt(entry.querySelector('.material-quantity').value);
        
        if (designer) {
            assignments.push({ designer, quantity });
        }
    });
    
    if (assignments.length === 0) {
        alert('请至少选择一个设计师');
        return;
    }
    
    // 验证素材数量分配
    let totalAssigned = 0;
    assignments.forEach(assignment => {
        totalAssigned += assignment.quantity;
    });
    
    // 如果是单个任务分配
    if (window.currentAssignTaskId) {
        const task = taskData.find(t => t.id === window.currentAssignTaskId);
        if (task && totalAssigned !== task.materialQuantity) {
            alert(`分配素材数量(${totalAssigned})与任务素材数量(${task.materialQuantity})不匹配`);
            return;
        }
        
        // 检查生成类型限制
        if (task.generationType !== '单品多视频' && assignments.length > 1) {
            alert(`${task.generationType}只允许分配一个设计师`);
            return;
        }
    }
    
    // 分配设计师
    if (window.currentAssignTaskId) {
        // 单个任务分配
        const task = taskData.find(t => t.id === window.currentAssignTaskId);
        if (task.generationType === '单品多视频') {
            // 单品多视频支持多个设计师
            task.subTasks = assignments.map(assignment => ({
                designer: assignment.designer,
                status: assignment.designer === 'AIGC' ? 'generating' : 'pending',
                materialQuantity: assignment.quantity
            }));
            task.designer = assignments[0].designer; // 主设计师
            task.status = 'pending';
        } else {
            // 其他类型只分配第一个设计师
            const firstAssignment = assignments[0];
            task.designer = firstAssignment.designer;
            if (firstAssignment.designer === 'AIGC') {
                task.status = 'generating';
            } else if (firstAssignment.designer === 'ued') {
                task.status = 'pending';
            } else if (firstAssignment.designer.startsWith('OA')) {
                task.status = 'pending';
            }
        }
        task.updateTime = new Date().toLocaleString('zh-CN');
        
        window.currentAssignTaskId = null;
    } else {
        // 批量分配
        const selectedTaskIds = selectedTasks;
        const selectedTaskData = taskData.filter(t => selectedTaskIds.includes(t.id));
        
        // 检查是否包含单品多视频任务
        const hasMultiVideoTask = selectedTaskData.some(task => task.generationType === '单品多视频');
        
        if (hasMultiVideoTask) {
            alert('单品多视频任务不支持多选分配，请单独分配');
            return;
        }
        
        // 批量分配所有任务给同一个设计师
        selectedTaskIds.forEach(taskId => {
            const task = taskData.find(t => t.id === taskId);
            if (task) {
                const firstAssignment = assignments[0];
                task.designer = firstAssignment.designer;
                if (firstAssignment.designer === 'AIGC') {
                    task.status = 'generating';
                } else if (firstAssignment.designer === 'ued') {
                    task.status = 'pending';
                } else if (firstAssignment.designer.startsWith('OA')) {
                    task.status = 'pending';
                }
                task.updateTime = new Date().toLocaleString('zh-CN');
            }
        });
    }

    closeModal('assignModal');
    selectedTasks = [];
    renderTable();
    alert('分配成功');
}

// 导出任务
function exportTasks() {
    const selectedTaskData = taskData.filter(task => selectedTasks.includes(task.id));
    
    // 创建CSV内容
    let csvContent = '创意生产任务列表\n';
    csvContent += '创建时间,期望交付时间,提单人,设计师,创意状态,更新时间,生成ID,生成类型,渠道,素材来源,模板分类,商品数量,素材数量,素材尺寸,商品ID,应用场景,创意策略标签,重新生成建议\n';
    
    selectedTaskData.forEach(task => {
        csvContent += `${task.createTime},${task.expectedTime},${task.submitter},${task.designer || '-'},${statusMap[task.status].text},${task.updateTime},${task.generationId},${task.generationType},${task.channel},${task.materialSource},${task.templateCategory},${task.productQuantity},${task.materialQuantity},${task.materialSize},${task.productId},${task.applicationScenario},${task.creativeStrategyTag},${task.regenerationSuggestion || '-'}\n`;
    });

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '创意生产任务列表.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 开始生产
function startProduction(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (task) {
        // 针对单品单图，开始生产后状态变为'generating'，显示上传素材、图创作、关闭按钮
        if (task.generationType === '单品单图') {
            task.status = 'generating';
            task.updateTime = new Date().toLocaleString('zh-CN');
            renderTable();
            alert('已开始生产');
        } else {
            // 其他类型保持原有逻辑
            task.status = 'generating';
            task.updateTime = new Date().toLocaleString('zh-CN');
            renderTable();
            alert('已开始生产');
        }
    }
}

// 关闭任务
function closeTask(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (task) {
        task.status = 'failed';
        task.updateTime = new Date().toLocaleString('zh-CN');
        renderTable();
        alert('任务已关闭');
    }
}

// 打开图创作
function openImageCreation(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (task) {
        // 模拟跳转到图创作平台
        alert(`跳转到图创作平台，生成ID: ${task.generationId}`);
        // 这里可以添加实际的跳转逻辑
    }
}

// 打开上传素材弹窗
function openUploadModal(taskId) {
    window.currentTaskId = taskId;
    uploadedMaterials = [];
    renderMaterialsList();
    setupUploadZone();
    
    // 重置上传模态框状态
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('materialsConfigContainer').style.display = 'none';
    document.getElementById('continueUploadSection').style.display = 'none';
    
    document.getElementById('uploadModal').style.display = 'block';
}

// 打开批量解析弹窗
function openBatchParseModal() {
    if (uploadedMaterials.length === 0) {
        alert('请先上传素材');
        return;
    }
    
    renderBatchParseTable();
    document.getElementById('batchParseModal').style.display = 'block';
}

// 渲染批量解析表格
function renderBatchParseTable() {
    const tbody = document.getElementById('batchParseTableBody');
    tbody.innerHTML = '';
    
    uploadedMaterials.forEach((material, index) => {
        const row = document.createElement('tr');
        
        // 获取已有的标签
        const existingTags = material.selectedTags || [];
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="material-name">${material.name}</td>
            <td><input type="text" class="tag-input" data-material-id="${material.id}" data-tag-index="0" placeholder="标签1" value="${existingTags[0] || ''}"></td>
            <td><input type="text" class="tag-input" data-material-id="${material.id}" data-tag-index="1" placeholder="标签2" value="${existingTags[1] || ''}"></td>
            <td><input type="text" class="tag-input" data-material-id="${material.id}" data-tag-index="2" placeholder="标签3" value="${existingTags[2] || ''}"></td>
            <td><input type="text" class="tag-input" data-material-id="${material.id}" data-tag-index="3" placeholder="标签4" value="${existingTags[3] || ''}"></td>
            <td><input type="text" class="tag-input" data-material-id="${material.id}" data-tag-index="4" placeholder="标签5" value="${existingTags[4] || ''}"></td>
            <td><input type="text" class="tag-input" data-material-id="${material.id}" data-tag-index="5" placeholder="标签6" value="${existingTags[5] || ''}"></td>
        `;
        tbody.appendChild(row);
    });
}

// 解析批量标签
function parseBatchTags() {
    const tagInputs = document.querySelectorAll('.tag-input');
    const tagData = {};
    
    // 收集所有标签数据
    tagInputs.forEach(input => {
        const materialId = input.getAttribute('data-material-id');
        const tagIndex = parseInt(input.getAttribute('data-tag-index'));
        const tagValue = input.value.trim();
        
        if (!tagData[materialId]) {
            tagData[materialId] = [];
        }
        
        if (tagValue) {
            tagData[materialId][tagIndex] = tagValue;
        }
    });
    
    // 更新素材的标签
    Object.keys(tagData).forEach(materialId => {
        const material = uploadedMaterials.find(m => m.id === materialId);
        if (material) {
            // 过滤掉空标签
            const parsedTags = tagData[materialId].filter(tag => tag && tag.trim());
            material.tags = parsedTags;
            
            // 将解析的标签添加到selectedTags中，用于显示选中状态
            parsedTags.forEach(tag => {
                if (!material.selectedTags.includes(tag)) {
                    material.selectedTags.push(tag);
                }
            });
            
            updateMaterialStatusIndicator(materialId);
        }
    });
    
    // 重新渲染素材列表
    renderMaterialsList();
    
    // 关闭弹窗
    closeModal('batchParseModal');
    
    alert('批量标签解析完成！');
}

// 创建素材导航元素
function createMaterialNavElement(material, index) {
    const div = document.createElement('div');
    div.className = 'material-nav-item';
    div.onclick = () => scrollToMaterial(index);
    
    // 获取文件尺寸信息
    const size = material.size ? formatFileSize(material.size) : '';
    const dimensions = material.dimensions || '';
    
    div.innerHTML = `
        <div class="material-status-indicator ${isMaterialConfigured(material.id) ? 'configured' : ''}"></div>
        <div class="material-nav-title">${material.name}</div>
        <div class="material-nav-info">${dimensions} ${size}</div>
    `;
    
    return div;
}

// 滚动到指定素材
function scrollToMaterial(index) {
    const materialsList = document.getElementById('materialsList');
    const materialElements = materialsList.querySelectorAll('.material-item');
    
    if (materialElements[index]) {
        materialElements[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // 添加临时高亮效果
        materialElements[index].style.backgroundColor = '#e3f2fd';
        setTimeout(() => {
            materialElements[index].style.backgroundColor = '';
        }, 2000);
        
        setActiveMaterial(index);
    }
}

// 设置活跃素材
function setActiveMaterial(index) {
    const navItems = document.querySelectorAll('.material-nav-item');
    navItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 检查素材是否已配置
function isMaterialConfigured(materialId) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (!material) return false;
    
    return (material.selectedTags && material.selectedTags.length > 0) ||
           (material.selectedProducts && material.selectedProducts.length > 0) ||
           (material.textTags && material.textTags.trim() !== '') ||
           (material.tags && material.tags.length > 0);
}

// 更新素材状态指示器
function updateMaterialStatusIndicator(materialId) {
    const navItem = document.querySelector(`.material-nav-item[onclick*="${materialId}"]`);
    if (navItem) {
        const indicator = navItem.querySelector('.material-status-indicator');
        if (indicator) {
            if (isMaterialConfigured(materialId)) {
                indicator.classList.add('configured');
            } else {
                indicator.classList.remove('configured');
            }
        }
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 创意策略标签多选下拉框功能
let selectedCreativeStrategyTags = [];

// 切换创意策略下拉框
function toggleCreativeStrategyDropdown() {
    const content = document.getElementById('creativeStrategyContent');
    const header = document.querySelector('.dropdown-header');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        header.classList.add('active');
    } else {
        content.style.display = 'none';
        header.classList.remove('active');
    }
}

// 应用创意策略筛选
function applyCreativeStrategyFilter() {
    const checkboxes = document.querySelectorAll('#creativeStrategyContent input[type="checkbox"]:checked');
    selectedCreativeStrategyTags = Array.from(checkboxes).map(cb => cb.value);
    
    updateCreativeStrategyDisplay();
    toggleCreativeStrategyDropdown();
}

// 清除创意策略筛选
function clearCreativeStrategyFilter() {
    const checkboxes = document.querySelectorAll('#creativeStrategyContent input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    selectedCreativeStrategyTags = [];
    
    updateCreativeStrategyDisplay();
    toggleCreativeStrategyDropdown();
}

// 更新创意策略显示
function updateCreativeStrategyDisplay() {
    const selectedText = document.querySelector('.selected-text');
    
    if (selectedCreativeStrategyTags.length === 0) {
        selectedText.textContent = '请选择创意策略标签';
        selectedText.classList.remove('has-selection');
    } else if (selectedCreativeStrategyTags.length === 1) {
        selectedText.textContent = selectedCreativeStrategyTags[0];
        selectedText.classList.add('has-selection');
    } else {
        selectedText.textContent = `已选择 ${selectedCreativeStrategyTags.length} 个标签`;
        selectedText.classList.add('has-selection');
    }
}

// 点击外部关闭下拉框
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('creativeStrategyDropdown');
    if (!dropdown.contains(event.target)) {
        const content = document.getElementById('creativeStrategyContent');
        const header = document.querySelector('.dropdown-header');
        content.style.display = 'none';
        header.classList.remove('active');
    }
});

// 显示上传区域
function showUploadArea() {
    document.getElementById('materialsConfigContainer').style.display = 'none';
    document.getElementById('continueUploadSection').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
}

// 设置上传区域
function setupUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('materialFiles');
    
    uploadZone.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (uploadedMaterials.length >= 20) {
                alert('最多支持20条素材');
                return;
            }
            
            // 验证文件格式和大小
            if (!validateFile(file)) {
                return;
            }
            
            addMaterial(file);
        });
        
        // 清空input，允许重复选择相同文件
        fileInput.value = '';
    };
}

// 验证文件
function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxImageSize = 500 * 1024; // 500KB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    
    if (!allowedTypes.includes(file.type)) {
        alert(`不支持的文件格式: ${file.name}`);
        return false;
    }
    
    if (file.type.startsWith('image/') && file.size > maxImageSize) {
        alert(`图片文件过大: ${file.name}，请选择小于500KB的图片`);
        return false;
    }
    
    if (file.type === 'video/mp4' && file.size > maxVideoSize) {
        alert(`视频文件过大: ${file.name}，请选择小于100MB的视频`);
        return false;
    }
    
    return true;
}

// 添加素材
function addMaterial(file) {
    const material = {
        id: Date.now() + Math.random(),
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        selectedTags: [],
        textTags: '',
        parsedTags: [],
        selectedProducts: [],
        tags: []
    };
    
    uploadedMaterials.push(material);
    renderMaterialsList();
    
    // 如果是第一个素材，切换到配置模式
    if (uploadedMaterials.length === 1) {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('materialsConfigContainer').style.display = 'flex';
        document.getElementById('continueUploadSection').style.display = 'block';
    }
}

// 渲染素材列表
function renderMaterialsList() {
    const materialsList = document.getElementById('materialsList');
    const materialNavList = document.getElementById('materialNavList');
    
    materialsList.innerHTML = '';
    materialNavList.innerHTML = '';
    
    uploadedMaterials.forEach((material, index) => {
        const materialElement = createMaterialElement(material, index);
        materialsList.appendChild(materialElement);
        
        const navElement = createMaterialNavElement(material, index);
        materialNavList.appendChild(navElement);
    });
    
    // 更新所有素材的标签按钮状态
    uploadedMaterials.forEach(material => {
        updateTagButtons(material.id);
    });
    
    // 如果有素材，设置第一个为活跃状态
    if (uploadedMaterials.length > 0) {
        setActiveMaterial(0);
    }
}

// 创建素材元素
function createMaterialElement(material, index) {
    const div = document.createElement('div');
    div.className = 'material-item';
    div.dataset.materialId = material.id;
    
    // 生成预览
    const preview = material.type.startsWith('image/') 
        ? `<img src="${URL.createObjectURL(material.file)}" alt="预览">`
        : `<video src="${URL.createObjectURL(material.file)}" controls></video>`;
    
    // 获取文件信息
    const fileInfo = getFileInfo(material.file);
    
    div.innerHTML = `
        <div class="material-header">
            <span class="material-title">素材${index + 1}</span>
            <span class="material-delete" onclick="deleteMaterial(${material.id})">删除</span>
        </div>
        <div class="material-content">
            <div class="material-preview">
                ${preview}
            </div>
            <div class="material-info">
                <div class="material-details">
                    <span>尺寸: ${fileInfo.dimensions}</span>
                    <span>比例: ${fileInfo.ratio}</span>
                    <span>大小: ${fileInfo.size}</span>
                    <span>格式: ${material.type}</span>
                </div>
                <div class="material-name">
                    <label>素材名称:</label>
                    <input type="text" value="${material.name}" onchange="updateMaterialName(${material.id}, this.value)" maxlength="200">
                    <div class="char-count">${material.name.length}/200</div>
                </div>
                <div class="material-tags">
                    <div class="tag-section">
                        <label>选择标签:</label>
                        <div class="tag-buttons">
                            <button class="tag-button" onclick="toggleTag(${material.id}, '彩色')">彩色</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '灰色')">灰色</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '黑色')">黑色</button>
                            <span class="clear-tags" onclick="clearTags(${material.id})">清除</span>
                        </div>
                    </div>
                    <div class="tag-section">
                        <label>价格标签样式:</label>
                        <div class="tag-buttons">
                            <button class="tag-button" onclick="toggleTag(${material.id}, '下滑桿式')">下滑桿式</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '标签样式')">标签样式</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '按钮')">按钮</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '优惠券')">优惠券</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '卡片')">卡片</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '无样式')">无样式</button>
                        </div>
                    </div>
                    <div class="tag-section">
                        <label>设计师:</label>
                        <div class="tag-buttons">
                            <button class="tag-button" onclick="toggleTag(${material.id}, '黄盈盈')">黄盈盈</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '邹文华')">邹文华</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '姚琳漫')">姚琳漫</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '胡员杰')">胡员杰</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '黄嘉怡')">黄嘉怡</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '代理')">代理</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, 'AIGC')">AIGC</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '胡俊')">胡俊</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '李慧丹')">李慧丹</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '宁翠莲')">宁翠莲</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '黄健明')">黄健明</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '谢嘉诚')">谢嘉诚</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '孔成')">孔成</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '林吴悠')">林吴悠</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '陆舒燕')">陆舒燕</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '张明月')">张明月</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '余巧弹')">余巧弹</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '黄雅丹')">黄雅丹</button>
                            <button class="tag-button" onclick="toggleTag(${material.id}, '欧靖丹')">欧靖丹</button>
                        </div>
                    </div>
                </div>
                <div class="product-association">
                    <label>关联商品:</label>
                    <div class="product-selector">
                        <input type="checkbox" class="product-checkbox" onchange="toggleProductSelector(${material.id})">
                        <span>选择关联商品</span>
                    </div>
                    <div class="product-list" id="productList_${material.id}" style="display: none;">
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD001')">
                            <span>时尚休闲T恤 - ¥89</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD002')">
                            <span>经典牛仔裤 - ¥199</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD003')">
                            <span>运动鞋 - ¥299</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD004')">
                            <span>休闲外套 - ¥399</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD005')">
                            <span>时尚包包 - ¥159</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD006')">
                            <span>太阳镜 - ¥89</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD007')">
                            <span>手表 - ¥599</span>
                        </div>
                        <div class="product-item">
                            <input type="checkbox" onchange="toggleProduct(${material.id}, 'PROD008')">
                            <span>香水 - ¥299</span>
                        </div>
                    </div>
                </div>
                <div class="text-tags-section">
                    <div class="text-tags-input">
                        <label>文本标签 解析:</label>
                        <textarea placeholder="输入素材的文本标签,标签之间以"-"分隔,后系统将自动读取所含标签。最多输入200个字符" onchange="updateTextTags(${material.id}, this.value)" maxlength="200">${material.textTags}</textarea>
                        <div class="char-count">${material.textTags.length}/200</div>
                    </div>
                    <div class="text-tags-parse">
                        <button class="parse-button" onclick="parseTextTags(${material.id})">解析</button>
                        <div class="parse-result">${material.parsedTags.join(', ')}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 更新标签按钮状态
    updateTagButtons(material.id);
    
    return div;
}

// 获取文件信息
function getFileInfo(file) {
    const size = file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(0)}KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)}MB`;
    
    // 模拟文件信息（实际项目中需要读取真实信息）
    return {
        dimensions: '1280*720',
        ratio: '16:9',
        size: size
    };
}

// 删除素材
function deleteMaterial(materialId) {
    uploadedMaterials = uploadedMaterials.filter(m => m.id !== materialId);
    renderMaterialsList();
    
    // 如果没有素材了，显示上传区域
    if (uploadedMaterials.length === 0) {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('materialsConfigContainer').style.display = 'none';
        document.getElementById('continueUploadSection').style.display = 'none';
    } else {
        // 设置第一个素材为活跃状态
        setActiveMaterial(0);
    }
}

// 更新素材名称
function updateMaterialName(materialId, name) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (material) {
        material.name = name;
        updateCharCount(materialId, 'name', name.length);
    }
}

// 切换标签
function toggleTag(materialId, tag) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (material) {
        const index = material.selectedTags.indexOf(tag);
        if (index > -1) {
            material.selectedTags.splice(index, 1);
        } else {
            material.selectedTags.push(tag);
        }
        updateTagButtons(materialId);
        updateMaterialStatusIndicator(materialId);
    }
}

// 清除标签
function clearTags(materialId) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (material) {
        material.selectedTags = [];
        updateTagButtons(materialId);
    }
}

// 更新标签按钮状态
function updateTagButtons(materialId) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (!material) return;
    
    const materialElement = document.querySelector(`[data-material-id="${materialId}"]`);
    if (!materialElement) return;
    
    const buttons = materialElement.querySelectorAll('.tag-button');
    buttons.forEach(button => {
        const tag = button.textContent;
        if (material.selectedTags.includes(tag)) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
}

// 更新文本标签
function updateTextTags(materialId, text) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (material) {
        material.textTags = text;
        updateCharCount(materialId, 'text', text.length);
        updateMaterialStatusIndicator(materialId);
    }
}

// 解析文本标签
function parseTextTags(materialId) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (material && material.textTags) {
        // 简单的标签解析逻辑
        const tags = material.textTags.split('-').map(tag => tag.trim()).filter(tag => tag);
        material.parsedTags = tags;
        
        // 更新显示
        const materialElement = document.querySelector(`[data-material-id="${materialId}"]`);
        if (materialElement) {
            const parseResult = materialElement.querySelector('.parse-result');
            if (parseResult) {
                parseResult.textContent = tags.join(', ');
            }
        }
    }
}

// 更新字符计数
function updateCharCount(materialId, type, length) {
    const materialElement = document.querySelector(`[data-material-id="${materialId}"]`);
    if (!materialElement) return;
    
    const charCount = materialElement.querySelector(`.${type === 'name' ? 'material-name' : 'text-tags-input'} .char-count`);
    if (charCount) {
        charCount.textContent = `${length}/200`;
    }
}

// 切换商品选择器显示
function toggleProductSelector(materialId) {
    const productList = document.getElementById(`productList_${materialId}`);
    if (productList) {
        productList.style.display = productList.style.display === 'none' ? 'flex' : 'none';
    }
}

// 切换商品选择
function toggleProduct(materialId, productId) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (material) {
        const index = material.selectedProducts.indexOf(productId);
        if (index > -1) {
            material.selectedProducts.splice(index, 1);
        } else {
            material.selectedProducts.push(productId);
        }
        updateProductItems(materialId);
        updateMaterialStatusIndicator(materialId);
    }
}

// 更新商品项状态
function updateProductItems(materialId) {
    const material = uploadedMaterials.find(m => m.id === materialId);
    if (!material) return;
    
    const materialElement = document.querySelector(`[data-material-id="${materialId}"]`);
    if (!materialElement) return;
    
    const productItems = materialElement.querySelectorAll('.product-item');
    productItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const productId = checkbox.getAttribute('onchange').match(/PROD\d+/)[0];
        
        if (material.selectedProducts.includes(productId)) {
            item.classList.add('selected');
            checkbox.checked = true;
        } else {
            item.classList.remove('selected');
            checkbox.checked = false;
        }
    });
}

// 确认上传
function confirmUpload() {
    const taskId = parseInt(document.getElementById('uploadModal').dataset.taskId);
    const task = taskData.find(t => t.id === taskId);
    
    if (uploadedMaterials.length === 0) {
        alert('请至少上传一个素材');
        return;
    }
    
    if (task && uploadedMaterials.length !== task.materialQuantity) {
        alert(`上传素材数量与任务素材数量不匹配，需要${task.materialQuantity}个素材`);
        return;
    }

    // 更新任务状态和素材信息
    if (task) {
        task.status = 'uploaded';
        task.updateTime = new Date().toLocaleString('zh-CN');
        
        // 模拟生成素材名称（实际项目中应该从上传接口获取）
        task.uploadedMaterials = uploadedMaterials.map((material, index) => {
            const taskInfo = task;
            const designer = taskInfo.designer || '未知设计师';
            const productId = taskInfo.productId.split('\n')[0].split('/')[0]; // 获取第一个商品ID
            const category = taskInfo.productCategory;
            const generationType = taskInfo.generationType;
            const channel = taskInfo.channel;
            
            // 生成素材名称：VIP + 任务ID + 渠道 + 类型 + 设计师 + 品类 + 商品ID + 设计师姓名 + 序号
            const materialName = `VIP${String(taskId).padStart(6, '0')}+${channel}+${generationType}+${designer}+${category}+${productId}+${designer}-${9000 + index}`;
            return materialName;
        });
    }

    closeModal('uploadModal');
    renderTable();
    alert('素材上传成功');
}

// 同步到唯妙
function syncToWeimiao(taskId) {
    const task = taskData.find(t => t.id === taskId);
    if (task) {
        // 模拟同步过程
        alert('正在同步到唯妙平台...');
        setTimeout(() => {
            task.status = 'completed';
            task.updateTime = new Date().toLocaleString('zh-CN');
            renderTable();
            alert('同步成功');
        }, 2000);
    }
}

// 打开参考图弹窗
function openReferenceModal(imageUrl, referenceNumber) {
    document.getElementById('referenceImage').src = imageUrl;
    document.getElementById('referenceNumber').textContent = referenceNumber;
    document.getElementById('referenceUrl').textContent = imageUrl;
    window.currentReferenceUrl = imageUrl;
    document.getElementById('referenceModal').style.display = 'block';
}

// 在新标签页打开图片
function openImageInNewTab() {
    if (window.currentReferenceUrl) {
        window.open(window.currentReferenceUrl, '_blank');
    }
}

// 关闭弹窗
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'uploadModal') {
        document.getElementById('materialFiles').value = '';
        document.getElementById('uploadPreview').innerHTML = '';
        // 重置上传模态框状态
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('materialsConfigContainer').style.display = 'none';
        document.getElementById('continueUploadSection').style.display = 'none';
    } else if (modalId === 'assignModal') {
        // 重置分配设计师弹窗
        const assignmentEntries = document.getElementById('assignmentEntries');
        assignmentEntries.innerHTML = `
            <div class="assignment-entry">
                <div class="form-group">
                    <label>选择设计师OA</label>
                    <select class="designer-select">
                        <option value="">(下拉选项)</option>
                        <option value="AIGC">AIGC</option>
                        <option value="ued">ued</option>
                        <option value="OA001">OA001</option>
                        <option value="OA002">OA002</option>
                        <option value="OA003">OA003</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>分配素材数量</label>
                    <input type="number" class="material-quantity" value="1" min="1" readonly>
                </div>
            </div>
        `;
        window.currentAssignTaskId = null;
        
        // 重置添加按钮显示状态
        const addButton = document.querySelector('.add-assignment');
        if (addButton) {
            addButton.style.display = 'block';
        }
    } else if (modalId === 'referenceModal') {
        // 重置参考图弹窗
        window.currentReferenceUrl = null;
    }
}



// 点击弹窗外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 切换子任务展开/收起
// 切换展开内容显示（支持子任务和小红书详情）
function toggleExpandableContent(taskId) {
    const button = document.querySelector(`[onclick="toggleExpandableContent('${taskId}')"]`);
    const isExpanded = button.getAttribute('data-expanded') === 'true';
    
    // 切换子任务行
    const subRows = document.querySelectorAll(`tr[data-parent-id='${taskId}'].sub-task-row`);
    // 切换小红书详情行
    const xiaohongshuRows = document.querySelectorAll(`tr[data-parent-id='${taskId}'].xiaohongshu-detail-row`);
    
    if (isExpanded) {
        // 收起
        subRows.forEach(row => row.style.display = 'none');
        xiaohongshuRows.forEach(row => row.style.display = 'none');
        button.setAttribute('data-expanded', 'false');
        button.innerHTML = '<i class="fas fa-chevron-down"></i>';
    } else {
        // 展开
        subRows.forEach(row => row.style.display = 'table-row');
        xiaohongshuRows.forEach(row => row.style.display = 'table-row');
        button.setAttribute('data-expanded', 'true');
        button.innerHTML = '<i class="fas fa-chevron-up"></i>';
    }
}

// 兼容旧的子任务切换函数
function toggleSubTasks(taskId) {
    toggleExpandableContent(taskId);
}

// 子任务操作函数
function startSubTaskProduction(parentTaskId, subIndex) {
    const task = taskData.find(t => t.id === parentTaskId);
    if (task && task.subTasks && task.subTasks[subIndex]) {
        task.subTasks[subIndex].status = 'generating';
        task.updateTime = new Date().toLocaleString('zh-CN');
        renderTable();
        alert('子任务已开始生产');
    }
}

function closeSubTask(parentTaskId, subIndex) {
    const task = taskData.find(t => t.id === parentTaskId);
    if (task && task.subTasks && task.subTasks[subIndex]) {
        task.subTasks[subIndex].status = 'failed';
        task.updateTime = new Date().toLocaleString('zh-CN');
        renderTable();
        alert('子任务已关闭');
    }
}

function openSubTaskImageCreation(parentTaskId, subIndex) {
    const task = taskData.find(t => t.id === parentTaskId);
    if (task && task.subTasks && task.subTasks[subIndex]) {
        alert(`跳转到图创作平台，生成ID: ${task.generationId}，子任务索引: ${subIndex}`);
    }
}

function openSubTaskUploadModal(parentTaskId, subIndex) {
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('uploadModal').dataset.parentTaskId = parentTaskId;
    document.getElementById('uploadModal').dataset.subIndex = subIndex;
}

function syncSubTaskToWeimiao(parentTaskId, subIndex) {
    const task = taskData.find(t => t.id === parentTaskId);
    if (task && task.subTasks && task.subTasks[subIndex]) {
        alert('正在同步子任务到唯妙平台...');
        setTimeout(() => {
            task.subTasks[subIndex].status = 'completed';
            task.updateTime = new Date().toLocaleString('zh-CN');
            renderTable();
            alert('子任务同步成功');
        }, 2000);
    }
}


