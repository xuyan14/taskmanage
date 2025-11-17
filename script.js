// 全局变量
let taskData = [];
let selectedTasks = [];
let currentUser = 'OA001'; // 当前登录用户，用于判断操作权限
let uploadedMaterials = []; // 上传的素材列表
let syncEnabledTags = {}; // 跟踪哪些标签列的同步功能已启用 {tagType: {checkbox, isMultiple, firstCell}}

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
            { key: 'anxinInfo', label: '安心购信息', type: 'text', width: 300, visible: true, formatter: 'formatAnxinInfo', cssClass: 'anxin-info-cell' },
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
        anxinInfo: generateRandomAnxinInfo(),
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
        anxinInfo: generateRandomAnxinInfo(),
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
        anxinInfo: generateRandomAnxinInfo(),
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
        anxinInfo: generateRandomAnxinInfo(),
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
        anxinInfo: generateRandomAnxinInfo(),
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
        anxinInfo: generateRandomAnxinInfo(),
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
        anxinInfo: generateRandomAnxinInfo(),
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

// 格式化安心购信息显示
function formatAnxinInfo(anxinInfo, productId) {
    if (!anxinInfo || anxinInfo.length === 0) {
        return '-';
    }
    
    // 如果商品ID包含多个ID（用换行符分隔），则分行显示安心购信息
    if (productId && productId.includes('\n')) {
        const productIds = productId.split('\n');
        const anxinTags = anxinInfo.map(info => `<span class="anxin-tag">${info}</span>`).join(' ');
        
        // 为每个商品ID显示相同的安心购信息，但不显示商品ID
        return productIds.map((id, index) => {
            return `<div class="anxin-product-row">
                        <div class="anxin-tags">${anxinTags}</div>
                    </div>`;
        }).join('');
    } else {
        // 单个商品ID，直接显示安心购信息
        return anxinInfo.map(info => 
            `<span class="anxin-tag">${info}</span>`
        ).join(' ');
    }
}

// 生成随机安心购信息
function generateRandomAnxinInfo() {
    const anxinOptions = [
        '奶粉无忧', '红屁屁无忧', '过敏无忧', '效期无忧', 
        '破损无忧', '正规发票', '15天质量退'
    ];
    
    // 随机选择1-5个安心购信息
    const count = Math.floor(Math.random() * 5) + 1; // 1-5个
    const shuffled = anxinOptions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 生成随机mid
function generateRandomMid() {
    // 生成格式如：6921600071816775639 的19位数字
    const base = 6920000000000000000;
    const random = Math.floor(Math.random() * 2000000000000);
    return String(base + random);
}

// 根据任务类型生成mid列表
function generateMidList(task) {
    const mids = [];
    const generationType = task.generationType || '';
    const materialQuantity = task.materialQuantity || 1;
    const productQuantity = task.productQuantity || 1;
    
    // 判断是否为多品类型
    const isMultiProduct = generationType.includes('多品');
    // 判断是否为多图类型
    const isMultiImage = generationType.includes('多图');
    
    if (isMultiProduct && isMultiImage) {
        // 多品多图：每个素材对应多个mid（每个商品一个mid）
        // 总共需要 materialQuantity * productQuantity 个mid
        const totalMids = materialQuantity * productQuantity;
        for (let i = 0; i < totalMids; i++) {
            mids.push(generateRandomMid());
        }
    } else if (isMultiProduct) {
        // 多品单图：每个商品一个mid，总共 productQuantity 个mid
        for (let i = 0; i < productQuantity; i++) {
            mids.push(generateRandomMid());
        }
    } else if (isMultiImage) {
        // 单品多图：每个素材一个mid，总共 materialQuantity 个mid
        for (let i = 0; i < materialQuantity; i++) {
            mids.push(generateRandomMid());
        }
    } else {
        // 单品单图：1个mid
        mids.push(generateRandomMid());
    }
    
    return mids;
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
    if (!panel || !panel.classList) {
        return;
    }
    
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
let allBulkFiles = []; // 统一存储所有上传的素材文件
let bulkMaterialTags = {}; // 统一存储所有素材的标签信息
let bulkUploadTagData = {}; // 存储批量上传的标签数据

// 打开批量上传弹窗
function openBulkUpload() {
    if (selectedTasks.length === 0) {
        alert('请先选择要上传的任务');
        return;
    }
    
    // 初始化批量上传数据
    bulkUploadData = {};
    allBulkFiles = [];
    bulkMaterialTags = {};
    
    selectedTasks.forEach(taskId => {
        const task = taskData.find(t => t.id === taskId);
        if (task) {
            bulkUploadData[taskId] = {
                task: task,
                assignedFiles: [] // 根据文件名自动分配的文件
            };
        }
    });
    
    document.getElementById('selectedTaskCount').textContent = selectedTasks.length;
    renderBulkUploadTable();
    document.getElementById('bulkUploadModal').style.display = 'block';
    
}


// 标签选项配置 - 根据Excel内容定义
const tagOptions = {
    productFrameShape: ['矩形', '圆形', '圆角矩形', '不规则', '椭圆', '菱形', '其他'], // 图片-商品框形状
    productDisplayForm: ['平铺', '堆叠', '悬挂', '组合', '单件', '多件', '其他'], // 图片-商品展示形态
    priceTagStyle: ['标签', '条码', '文字', '图标', '无', '其他'], // 图片-价格标签样式
    materialSource: ['拍摄', '设计', '合成', '下载', '其他'], // 图片-素材来源
    taskTags: ['新品', '促销', '热卖', '限时', '清仓', '推荐', '精选'], // 任务标签（多选）
    externalElements: ['折扣', '优惠券', '赠品', '包邮', '秒杀', '拼团', '其他'], // 图片-外推要素（单选）
    contentStrategy: ['产品展示', '场景应用', '功能说明', '对比展示', '情感营销', '其他'], // 图片-内容策略（单选）
    infoPriority: ['价格优先', '产品优先', '功能优先', '品牌优先', '其他'], // 图片-信息主次（单选）
    albumFeatures: ['系列', '套装', '单件', '组合', '其他'], // 图片-图集特征（单选）
    marketingElements: ['限时', '限量', '特价', '买赠', '满减', '其他'], // 营销元素（多选）
    valueProposition: ['性价比', '品质', '时尚', '实用', '个性', '其他'], // 价值主张（多选）
    audienceTags: ['儿童', '青年', '中年', '老年', '男性', '女性', '通用'], // 人群标签（多选）
    designer: ['AIGC', 'ued', 'OA001', 'OA002', 'OA003', '其他'], // 图片-设计师（支持修改）
    requester: ['俊俊', '小美', '阿强', '丽丽', '小明', '小红', '小张'] // 图片-需求人（下拉选择）
};

// 多选标签类型
const multiSelectTags = ['taskTags', 'marketingElements', 'valueProposition', 'audienceTags'];

// 生成下拉选择框的辅助函数
function generateSelectInput(tagType, currentValue, fileName, options, isMultiple = false) {
    const optionsList = tagOptions[tagType] || options || [];
    const currentValues = isMultiple && currentValue ? currentValue.split(',').map(v => v.trim()).filter(v => v) : [];
    
    // 对文件名进行转义，防止XSS
    const escapedFileName = fileName.replace(/'/g, "\\'");
    
    if (isMultiple) {
        // 多选标签使用自定义的多选下拉框
        const displayValue = currentValues.length > 0 ? currentValues.join(', ') : '请选择';
        const optionsHTML = optionsList.map(option => {
            const isSelected = currentValues.includes(option);
            return `<label class="multi-select-option">
                        <input type="checkbox" value="${option}" ${isSelected ? 'checked' : ''}>
                        <span>${option}</span>
                    </label>`;
        }).join('');
        
        return `<div class="multi-select-dropdown" data-file-name="${escapedFileName}" data-tag-type="${tagType}">
                    <div class="multi-select-display" onclick="toggleMultiSelectDropdown(this)">
                        <span class="multi-select-text">${displayValue}</span>
                        <span class="multi-select-arrow">▼</span>
                    </div>
                    <div class="multi-select-menu" style="display: none;">
                        ${optionsHTML}
                    </div>
                </div>`;
    } else {
        // 单选标签使用普通下拉框
        // 使用this传递select元素本身，这样可以直接比较DOM元素
        const onChangeHandler = `onchange="updateBulkMaterialTag('${escapedFileName}', '${tagType}', this.value, this)"`;
        
        let selectHTML = `<select class="form-control form-control-sm bulk-tag-input"
                                data-file-name="${escapedFileName}"
                                data-tag-type="${tagType}"
                                ${onChangeHandler}>
                            <option value="">请选择</option>`;
        
        optionsList.forEach(option => {
            const isSelected = currentValue === option;
            selectHTML += `<option value="${option}" ${isSelected ? 'selected' : ''}>${option}</option>`;
        });
        
        selectHTML += '</select>';
        return selectHTML;
    }
}

// 切换多选下拉框显示
function toggleMultiSelectDropdown(element) {
    const dropdown = element.closest('.multi-select-dropdown');
    const menu = dropdown.querySelector('.multi-select-menu');
    const isOpen = menu.style.display !== 'none';
    
    // 关闭所有其他下拉框
    document.querySelectorAll('.multi-select-menu').forEach(m => {
        if (m !== menu) {
            m.style.display = 'none';
            m.closest('.multi-select-dropdown').classList.remove('active');
        }
    });
    
    // 切换当前下拉框
    if (isOpen) {
        menu.style.display = 'none';
        dropdown.classList.remove('active');
    } else {
        menu.style.display = 'block';
        dropdown.classList.add('active');
    }
}

// 更新多选标签值
function updateMultiSelectCheckbox(element) {
    const dropdown = element.closest('.multi-select-dropdown');
    const fileName = dropdown.dataset.fileName;
    const tagType = dropdown.dataset.tagType;
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    
    const selectedValues = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value)
        .join(', ');
    
    // 更新显示文本
    const displayText = selectedValues || '请选择';
    dropdown.querySelector('.multi-select-text').textContent = displayText;
    
    // 更新标签值
    updateBulkMaterialTag(fileName, tagType, selectedValues);
    
    // 如果该标签列的同步功能已启用，且这是第一行的标签，则同步其他行
    if (syncEnabledTags[tagType]) {
        const firstDataRow = document.querySelector(`#bulkUploadTableBodyScrollable .bulk-upload-row`);
        if (firstDataRow) {
            const firstCell = firstDataRow.querySelector(`.tag-cell[data-tag-type="${tagType}"]`);
            const firstDropdown = firstCell ? firstCell.querySelector('.multi-select-dropdown') : null;
            // 如果当前下拉框是第一行的下拉框，则同步
            if (firstDropdown === dropdown) {
                setTimeout(() => {
                    syncTagColumn(tagType, true);
                }, 50);
            }
        }
    }
    
    // 重新对齐行高
    alignTableRows();
}

// 点击外部关闭所有多选下拉框（使用事件委托，在页面加载后自动生效）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiSelectEvents);
} else {
    initMultiSelectEvents();
}

function initMultiSelectEvents() {
    // 点击外部关闭所有多选下拉框
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.multi-select-dropdown')) {
            document.querySelectorAll('.multi-select-menu').forEach(menu => {
                menu.style.display = 'none';
                const dropdown = menu.closest('.multi-select-dropdown');
                if (dropdown) {
                    dropdown.classList.remove('active');
                }
            });
        }
    });

    // 多选下拉框选项点击事件处理（使用事件委托）
    document.addEventListener('change', function(event) {
        if (event.target.closest('.multi-select-dropdown input[type="checkbox"]')) {
            updateMultiSelectCheckbox(event.target);
        }
    });
}

// 渲染批量上传表格
function renderBulkUploadTable() {
    const tbodyFixed = document.getElementById('bulkUploadTableBodyFixed');
    const tbodyScrollable = document.getElementById('bulkUploadTableBodyScrollable');
    
    tbodyFixed.innerHTML = '';
    tbodyScrollable.innerHTML = '';
    
    // 添加固定列表格头部行
    const headerRowFixed = document.createElement('tr');
    headerRowFixed.className = 'bulk-upload-header-row';
    headerRowFixed.innerHTML = `
        <th width="120">任务ID</th>
        <th width="300">任务要求</th>
        <th width="180">需求mid</th>
        <th width="250">素材名</th>
    `;
    tbodyFixed.appendChild(headerRowFixed);
    
    // 添加可滚动列表格头部行 - 按照Excel结构：14个标签列
    const headerRowScrollable = document.createElement('tr');
    headerRowScrollable.className = 'bulk-upload-header-row';
    
    // 定义标签列配置（标签类型，标签名称，是否多选）
    const tagColumns = [
        { type: 'productFrameShape', label: '图片-商品框形状', isMultiple: false },
        { type: 'productDisplayForm', label: '图片-商品展示形态', isMultiple: false },
        { type: 'priceTagStyle', label: '图片-价格标签样式', isMultiple: false },
        { type: 'materialSource', label: '图片-素材来源', isMultiple: false },
        { type: 'taskTags', label: '任务标签（多选）', isMultiple: true },
        { type: 'externalElements', label: '图片-外推要素（单选）', isMultiple: false },
        { type: 'contentStrategy', label: '图片-内容策略（单选）', isMultiple: false },
        { type: 'infoPriority', label: '图片-信息主次（单选）', isMultiple: false },
        { type: 'albumFeatures', label: '图片-图集特征（单选）', isMultiple: false },
        { type: 'marketingElements', label: '营销元素（多选）', isMultiple: true },
        { type: 'valueProposition', label: '价值主张（多选）', isMultiple: true },
        { type: 'audienceTags', label: '人群标签（多选）', isMultiple: true },
        { type: 'designer', label: '图片-设计师（支持修改）', isMultiple: false },
        { type: 'requester', label: '图片-需求人', isMultiple: false }
    ];
    
    headerRowScrollable.innerHTML = tagColumns.map(col => `
        <th width="130" class="tag-header-cell" data-tag-type="${col.type}">
            <div class="tag-header-content">
                <input type="checkbox" class="tag-header-checkbox" 
                       data-tag-type="${col.type}" 
                       onchange="handleTagHeaderCheckbox(this, '${col.type}', ${col.isMultiple})"
                       title="勾选后，该列所有标签将跟随第一行的值">
                <span class="tag-header-label">${col.label}</span>
            </div>
        </th>
    `).join('');
    
    tbodyScrollable.appendChild(headerRowScrollable);
    
    // 添加任务列表 - 合并相同任务ID和任务要求的显示
    selectedTasks.forEach(taskId => {
        const uploadData = bulkUploadData[taskId];
        const task = uploadData.task;
        
        // 获取该任务的素材列表（确保类型一致）
        const taskFiles = allBulkFiles.filter(file => {
            // 确保比较时类型一致（都转为字符串）
            const fileTaskId = String(file.taskId || '');
            const currentTaskId = String(taskId || '');
            return fileTaskId === currentTaskId;
        });
        
        // 生成该任务的mid列表
        const taskMids = generateMidList(task);
        
        if (taskFiles.length > 0) {
            // 如果有素材，为每个素材创建一行，但合并任务ID和任务要求
            taskFiles.forEach((file, index) => {
                // 根据任务类型和素材索引确定显示的mid
                const generationType = task.generationType || '';
                const isMultiProduct = generationType.includes('多品');
                const isMultiImage = generationType.includes('多图');
                const productQuantity = task.productQuantity || 1;
                
                let midForThisRow = '';
                if (isMultiProduct && isMultiImage) {
                    // 多品多图：每个素材行显示多个mid（每个商品一个mid）
                    const startIndex = index * productQuantity;
                    const endIndex = Math.min(startIndex + productQuantity, taskMids.length);
                    midForThisRow = taskMids.slice(startIndex, endIndex).join('<br>');
                } else if (isMultiProduct) {
                    // 多品单图：所有mid显示在同一行（每个商品一个mid）
                    if (index === 0) {
                        midForThisRow = taskMids.join('<br>');
                    } else {
                        midForThisRow = ''; // 其他行不显示mid
                    }
                } else if (isMultiImage) {
                    // 单品多图：每个素材行显示一个mid
                    if (index < taskMids.length) {
                        midForThisRow = taskMids[index];
                    }
                } else {
                    // 单品单图：只显示一个mid
                    if (index === 0 && taskMids.length > 0) {
                        midForThisRow = taskMids[0];
                    }
                }
                // 创建固定列行
                const rowFixed = document.createElement('tr');
                rowFixed.className = 'bulk-upload-row';
                rowFixed.dataset.taskId = taskId;
                rowFixed.dataset.fileIndex = index;
                
                // 创建可滚动列行
                const rowScrollable = document.createElement('tr');
                rowScrollable.className = 'bulk-upload-row';
                rowScrollable.dataset.taskId = taskId;
                rowScrollable.dataset.fileIndex = index;
                
                // 提取素材名称（优先使用存储的名称，否则从文件名中提取）
                let materialName = '';
                if (bulkMaterialTags[file.name] && bulkMaterialTags[file.name].name) {
                    // 如果存储的素材名不是完整文件名，使用存储的名称
                    const storedName = bulkMaterialTags[file.name].name;
                    // 如果存储的名称不是完整文件名（即已经去掉了任务ID前缀），直接使用
                    if (storedName !== file.name) {
                        materialName = storedName;
                    } else {
                        // 如果存储的是完整文件名，尝试去掉任务ID前缀（支持多种分隔符）
                        materialName = storedName;
                        // 支持的分隔符：_、-、.、空格、+
                        const separators = ['_', '-', '.', ' ', '+'];
                        for (const sep of separators) {
                            const prefix = `${taskId}${sep}`;
                            if (materialName.startsWith(prefix)) {
                                materialName = materialName.substring(prefix.length);
                                break;
                            }
                        }
                    }
                }
                
                // 如果还是没有素材名，从文件名中提取（去掉任务ID前缀，支持多种分隔符）
                if (!materialName || materialName === file.name) {
                    materialName = file.name;
                    // 支持的分隔符：_、-、.、空格、+
                    const separators = ['_', '-', '.', ' ', '+'];
                    for (const sep of separators) {
                        const prefix = `${taskId}${sep}`;
                        if (materialName.startsWith(prefix)) {
                            materialName = materialName.substring(prefix.length);
                            break;
                        }
                    }
                }
                
                // 如果仍然为空，使用完整文件名
                if (!materialName || materialName.trim() === '') {
                    materialName = file.name;
                }
                
                // 生成素材缩略图预览URL
                const thumbnailURL = URL.createObjectURL(file);
                const isImageFile = file.type.startsWith('image/');
                
                // 获取素材标签数据
                const tags = bulkMaterialTags[file.name] || {
                    productFrameShape: '',        // 图片-商品框形状
                    productDisplayForm: '',       // 图片-商品展示形态
                    priceTagStyle: '',            // 图片-价格标签样式
                    materialSource: task.materialSource || '', // 图片-素材来源
                    taskTags: '',                 // 任务标签（多选）
                    externalElements: '',         // 图片-外推要素（单选）
                    contentStrategy: '',          // 图片-内容策略（单选）
                    infoPriority: '',             // 图片-信息主次（单选）
                    albumFeatures: '',            // 图片-图集特征（单选）
                    marketingElements: '',        // 营销元素（多选）
                    valueProposition: '',         // 价值主张（多选）
                    audienceTags: '',             // 人群标签（多选）
                    designer: task.designer || '', // 图片-设计师（支持修改）
                    requester: task.submitter || '' // 图片-需求人
                };
                
                // 生成标签输入单元格 - 按照Excel结构（14个标签列），全部改为下拉选择
                const tagInputs = `
                    <td class="tag-cell" data-tag-type="productFrameShape">${generateSelectInput('productFrameShape', tags.productFrameShape || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="productDisplayForm">${generateSelectInput('productDisplayForm', tags.productDisplayForm || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="priceTagStyle">${generateSelectInput('priceTagStyle', tags.priceTagStyle || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="materialSource">${generateSelectInput('materialSource', tags.materialSource || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="taskTags">${generateSelectInput('taskTags', tags.taskTags || '', file.name, [], true)}</td>
                    <td class="tag-cell" data-tag-type="externalElements">${generateSelectInput('externalElements', tags.externalElements || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="contentStrategy">${generateSelectInput('contentStrategy', tags.contentStrategy || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="infoPriority">${generateSelectInput('infoPriority', tags.infoPriority || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="albumFeatures">${generateSelectInput('albumFeatures', tags.albumFeatures || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="marketingElements">${generateSelectInput('marketingElements', tags.marketingElements || '', file.name, [], true)}</td>
                    <td class="tag-cell" data-tag-type="valueProposition">${generateSelectInput('valueProposition', tags.valueProposition || '', file.name, [], true)}</td>
                    <td class="tag-cell" data-tag-type="audienceTags">${generateSelectInput('audienceTags', tags.audienceTags || '', file.name, [], true)}</td>
                    <td class="tag-cell" data-tag-type="designer">${generateSelectInput('designer', tags.designer || '', file.name, [], false)}</td>
                    <td class="tag-cell" data-tag-type="requester">${generateSelectInput('requester', tags.requester || '', file.name, [], false)}</td>
                    `;
                
                // 计算mid列的行跨度（用于单品单图和多品单图）
                let midRowspan = 0;
                let showMidInFirstRow = false;
                
                if (isMultiProduct && isMultiImage) {
                    // 多品多图：每个素材行都显示mid，不使用rowspan
                    showMidInFirstRow = false;
                } else if (isMultiProduct) {
                    // 多品单图：只在第一行显示mid，使用rowspan
                    midRowspan = index === 0 ? taskFiles.length : 0;
                    showMidInFirstRow = index === 0;
                } else if (isMultiImage) {
                    // 单品多图：每个素材行显示一个mid，不使用rowspan
                    showMidInFirstRow = false;
                } else {
                    // 单品单图：只在第一行显示mid，使用rowspan
                    midRowspan = index === 0 ? taskFiles.length : 0;
                    showMidInFirstRow = index === 0;
                }
                
                // 如果是第一个素材，显示任务ID、任务要求和mid
                if (index === 0) {
                    rowFixed.innerHTML = `
                        <td class="task-id-cell" rowspan="${taskFiles.length}">
                            <span class="task-id-text">${taskId}</span>
                        </td>
                        <td class="task-requirements" rowspan="${taskFiles.length}">
                            <div class="requirements-horizontal">
                                <span class="requirement-badge">${task.materialQuantity || 1}个</span>
                                <span class="requirement-badge">${formatMaterialSize(task.materialSize, task.channel)}</span>
                                <span class="requirement-badge">${task.generationType}</span>
                            </div>
                        </td>
                        <td class="mid-cell" ${midRowspan > 0 ? `rowspan="${midRowspan}"` : ''}>
                            ${midForThisRow}
                        </td>
                        <td class="material-name-cell">
                            <div class="material-name-with-thumbnail">
                                ${isImageFile 
                                    ? `<img src="${thumbnailURL}" alt="${materialName}" class="material-thumbnail" onerror="this.onerror=null; this.style.display='none';">
                                       <span class="material-name-text">${materialName}</span>`
                                    : `<div class="material-thumbnail material-thumbnail-placeholder">
                                         <i class="fas fa-file"></i>
                                       </div>
                                       <span class="material-name-text">${materialName}</span>`
                                }
                            </div>
                        </td>
                    `;
                } else {
                    // 其他素材行：如果是多品多图或单品多图，显示mid；否则不显示（使用rowspan）
                    const midCell = (isMultiProduct && isMultiImage) || (isMultiImage && !isMultiProduct) 
                        ? `<td class="mid-cell">${midForThisRow}</td>` 
                        : '';
                    
                    rowFixed.innerHTML = `
                        ${midCell}
                        <td class="material-name-cell">
                            <div class="material-name-with-thumbnail">
                                ${isImageFile 
                                    ? `<img src="${thumbnailURL}" alt="${materialName}" class="material-thumbnail" onerror="this.onerror=null; this.style.display='none';">
                                       <span class="material-name-text">${materialName}</span>`
                                    : `<div class="material-thumbnail material-thumbnail-placeholder">
                                         <i class="fas fa-file"></i>
                                       </div>
                                       <span class="material-name-text">${materialName}</span>`
                                }
                            </div>
                        </td>
                    `;
                }
                
                // 可滚动列显示标签输入框
                rowScrollable.innerHTML = tagInputs;
                
                tbodyFixed.appendChild(rowFixed);
                tbodyScrollable.appendChild(rowScrollable);
            });
        } else {
            // 如果没有素材，显示任务信息但素材名为空
            const rowFixed = document.createElement('tr');
            rowFixed.className = 'bulk-upload-row';
            rowFixed.dataset.taskId = taskId;
            
            const rowScrollable = document.createElement('tr');
            rowScrollable.className = 'bulk-upload-row';
            rowScrollable.dataset.taskId = taskId;
            
            // 生成mid显示（即使没有素材也显示mid）
            const taskMids = generateMidList(task);
            const midDisplay = taskMids.join('<br>');
            
            // 生成空标签单元格 - 按照Excel结构（14个标签列），全部改为下拉选择
            const emptyTagInputs = `
                <td class="tag-cell" data-tag-type="productFrameShape">${generateSelectInput('productFrameShape', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="productDisplayForm">${generateSelectInput('productDisplayForm', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="priceTagStyle">${generateSelectInput('priceTagStyle', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="materialSource">${generateSelectInput('materialSource', task.materialSource || '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="taskTags">${generateSelectInput('taskTags', '', '', [], true)}</td>
                <td class="tag-cell" data-tag-type="externalElements">${generateSelectInput('externalElements', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="contentStrategy">${generateSelectInput('contentStrategy', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="infoPriority">${generateSelectInput('infoPriority', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="albumFeatures">${generateSelectInput('albumFeatures', '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="marketingElements">${generateSelectInput('marketingElements', '', '', [], true)}</td>
                <td class="tag-cell" data-tag-type="valueProposition">${generateSelectInput('valueProposition', '', '', [], true)}</td>
                <td class="tag-cell" data-tag-type="audienceTags">${generateSelectInput('audienceTags', '', '', [], true)}</td>
                <td class="tag-cell" data-tag-type="designer">${generateSelectInput('designer', task.designer || '', '', [], false)}</td>
                <td class="tag-cell" data-tag-type="requester">${generateSelectInput('requester', task.submitter || '', '', [], false)}</td>
            `;
            
            rowFixed.innerHTML = `
                <td class="task-id-cell">
                    <span class="task-id-text">${taskId}</span>
                </td>
                <td class="task-requirements">
                    <div class="requirements-horizontal">
                        <span class="requirement-badge">${task.materialQuantity || 1}个</span>
                        <span class="requirement-badge">${formatMaterialSize(task.materialSize, task.channel)}</span>
                        <span class="requirement-badge">${task.generationType}</span>
                    </div>
                </td>
                <td class="mid-cell">
                    ${midDisplay}
                </td>
                <td class="material-name-cell">
                    <span class="material-name-text" style="color: #999;">暂无素材</span>
                </td>
            `;
            
            rowScrollable.innerHTML = emptyTagInputs;
            
            tbodyFixed.appendChild(rowFixed);
            tbodyScrollable.appendChild(rowScrollable);
        }
    });
    
    // 如果有上传的素材，显示批量解析按钮和确认上传按钮
    if (allBulkFiles.length > 0) {
        document.getElementById('bulkParseBtn').style.display = 'inline-block';
        document.getElementById('confirmUploadBtn').style.display = 'inline-block';
    } else {
        document.getElementById('bulkParseBtn').style.display = 'none';
        document.getElementById('confirmUploadBtn').style.display = 'none';
    }
    
    // 同步固定列表格和可滚动列表格的垂直滚动
    syncTableScroll();
    
    // 确保固定列和可滚动列的行高对齐
    alignTableRows();
}

// 同步标签列的所有行（基于第一行的值）
function syncTagColumn(tagType, isMultiple) {
    console.log(`开始同步标签列: ${tagType}, isMultiple: ${isMultiple}`);
    
    // 设置同步标记，避免在同步过程中触发其他同步
    if (syncEnabledTags[tagType]) {
        syncEnabledTags[tagType]._syncing = true;
    }
    
    // 获取所有该标签类型的单元格
    const tagCells = document.querySelectorAll(`.tag-cell[data-tag-type="${tagType}"]`);
    console.log(`找到 ${tagCells.length} 个标签单元格`);
    
    if (tagCells.length === 0) {
        console.log('未找到标签单元格，退出同步');
        if (syncEnabledTags[tagType]) {
            delete syncEnabledTags[tagType]._syncing;
        }
        return;
    }
    
    // 获取第一行的单元格
    const firstDataRow = document.querySelector(`#bulkUploadTableBodyScrollable .bulk-upload-row`);
    if (!firstDataRow) {
        console.log('未找到第一行数据，退出同步');
        if (syncEnabledTags[tagType]) {
            delete syncEnabledTags[tagType]._syncing;
        }
        return;
    }
    
    const firstCell = firstDataRow.querySelector(`.tag-cell[data-tag-type="${tagType}"]`);
    if (!firstCell) {
        console.log(`未找到第一行的标签单元格: ${tagType}`);
        if (syncEnabledTags[tagType]) {
            delete syncEnabledTags[tagType]._syncing;
        }
        return;
    }
    
    // 获取第一行的值
    let firstValue = '';
    
    if (isMultiple) {
        // 多选标签：从多选下拉框获取选中的值
        const firstDropdown = firstCell.querySelector('.multi-select-dropdown');
        if (firstDropdown) {
            const checkboxes = firstDropdown.querySelectorAll('input[type="checkbox"]:checked');
            firstValue = Array.from(checkboxes).map(cb => cb.value).join(', ');
        }
    } else {
        // 单选标签：从select获取值
        const firstSelect = firstCell.querySelector('select');
        if (firstSelect) {
            firstValue = firstSelect.value || '';
        }
    }
    
    console.log(`第一行的值: "${firstValue}"`);
    
    // 填充所有行的值（跳过第一行）
    let updatedCount = 0;
    tagCells.forEach((cell, index) => {
        // 跳过第一行（已经是我们参考的值）
        if (cell === firstCell) {
            console.log(`跳过第一行 (索引 ${index})`);
            return;
        }
        
        if (isMultiple) {
            // 多选标签：设置多选下拉框的值
            const dropdown = cell.querySelector('.multi-select-dropdown');
            if (dropdown) {
                const fileName = dropdown.dataset.fileName || dropdown.getAttribute('data-file-name');
                
                // 更新UI显示（无条件更新，即使没有fileName也要同步显示）
                const selectedValues = firstValue ? firstValue.split(',').map(v => v.trim()).filter(v => v) : [];
                const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = selectedValues.includes(cb.value);
                });
                
                // 更新显示文本
                const displayText = firstValue || '请选择';
                const displaySpan = dropdown.querySelector('.multi-select-text');
                if (displaySpan) {
                    displaySpan.textContent = displayText;
                }
                updatedCount++;
                
                // 如果有fileName，同时更新数据存储
                if (fileName) {
                    // 更新标签数据（不触发同步，因为已设置_syncing标记）
                    if (bulkMaterialTags[fileName]) {
                        bulkMaterialTags[fileName][tagType] = firstValue;
                    }
                    console.log(`更新多选标签: ${fileName}, 值: ${firstValue}`);
                } else {
                    // 即使没有fileName，也更新了UI显示
                    console.log(`更新多选标签 (无fileName): 值: ${firstValue}`);
                }
            }
        } else {
            // 单选标签：设置select的值
            const select = cell.querySelector('select');
            if (select) {
                const fileName = select.dataset.fileName || select.getAttribute('data-file-name');
                
                // 更新UI显示（无条件更新，即使没有fileName也要同步显示）
                select.value = firstValue;
                updatedCount++;
                
                // 如果有fileName，同时更新数据存储
                if (fileName) {
                    // 更新标签数据（不触发同步，因为已设置_syncing标记）
                    if (bulkMaterialTags[fileName]) {
                        bulkMaterialTags[fileName][tagType] = firstValue;
                    }
                    console.log(`更新单选标签 (行 ${index}): ${fileName}, 值: ${firstValue}`);
                } else {
                    // 即使没有fileName，也更新了UI显示
                    console.log(`更新单选标签 (行 ${index}, 无fileName): 值: ${firstValue}`);
                }
            } else {
                console.log(`行 ${index} 的单元格中没有找到select元素`);
            }
        }
    });
    
    console.log(`同步完成，共更新 ${updatedCount} 行`);
    
    // 清除同步标记
    if (syncEnabledTags[tagType]) {
        delete syncEnabledTags[tagType]._syncing;
    }
    
    // 重新对齐行高
    alignTableRows();
}

// 处理表头复选框勾选事件
function handleTagHeaderCheckbox(checkbox, tagType, isMultiple) {
    // 获取第一行的单元格
    const firstDataRow = document.querySelector(`#bulkUploadTableBodyScrollable .bulk-upload-row`);
    if (!firstDataRow) {
        showNotification('未找到数据行', 'warning');
        checkbox.checked = false;
        return;
    }
    
    const firstCell = firstDataRow.querySelector(`.tag-cell[data-tag-type="${tagType}"]`);
    if (!firstCell) {
        showNotification('未找到第一行的标签单元格', 'warning');
        checkbox.checked = false;
        return;
    }
    
    if (checkbox.checked) {
        // 勾选：启用同步功能
        // 获取第一行的值
        let firstValue = '';
        
        if (isMultiple) {
            const firstDropdown = firstCell.querySelector('.multi-select-dropdown');
            if (firstDropdown) {
                const checkboxes = firstDropdown.querySelectorAll('input[type="checkbox"]:checked');
                firstValue = Array.from(checkboxes).map(cb => cb.value).join(', ');
            }
        } else {
            const firstSelect = firstCell.querySelector('select');
            if (firstSelect) {
                firstValue = firstSelect.value || '';
            }
        }
        
        if (!firstValue) {
            showNotification('第一行的标签值为空，无法启用同步', 'warning');
            checkbox.checked = false;
            return;
        }
        
        // 保存同步状态
        syncEnabledTags[tagType] = {
            checkbox: checkbox,
            isMultiple: isMultiple,
            firstCell: firstCell
        };
        
        // 先执行一次填充
        syncTagColumn(tagType, isMultiple);
        showNotification(`已启用同步：该列所有行的标签将跟随第一行变化`, 'success');
        
        // 注意：动态同步通过updateBulkMaterialTag和updateMultiSelectCheckbox函数处理
        // 单选标签：通过updateBulkMaterialTag中的逻辑自动同步
        // 多选标签：通过updateMultiSelectCheckbox中的逻辑自动同步
    } else {
        // 取消勾选：禁用同步功能
        delete syncEnabledTags[tagType];
    }
}

// 对齐固定列和可滚动列的行高
function alignTableRows() {
    // 使用setTimeout确保DOM已完全渲染
    setTimeout(() => {
        const fixedRows = document.querySelectorAll('#bulkUploadTableBodyFixed .bulk-upload-row');
        const scrollableRows = document.querySelectorAll('#bulkUploadTableBodyScrollable .bulk-upload-row');
        
        if (fixedRows.length !== scrollableRows.length) {
            console.warn('固定列和可滚动列的行数不匹配:', fixedRows.length, 'vs', scrollableRows.length);
            return;
        }
        
        // 对齐表头行
        const fixedHeader = document.querySelector('#bulkUploadTableBodyFixed .bulk-upload-header-row');
        const scrollableHeader = document.querySelector('#bulkUploadTableBodyScrollable .bulk-upload-header-row');
        if (fixedHeader && scrollableHeader) {
            const fixedHeaderHeight = fixedHeader.offsetHeight;
            const scrollableHeaderHeight = scrollableHeader.offsetHeight;
            const maxHeaderHeight = Math.max(fixedHeaderHeight, scrollableHeaderHeight);
            if (maxHeaderHeight > 0) {
                fixedHeader.style.height = maxHeaderHeight + 'px';
                scrollableHeader.style.height = maxHeaderHeight + 'px';
            }
        }
        
        // 为每一对数据行设置相同的高度
        fixedRows.forEach((fixedRow, index) => {
            const scrollableRow = scrollableRows[index];
            if (scrollableRow) {
                // 获取两个行的实际高度，取较大值
                const fixedHeight = fixedRow.offsetHeight;
                const scrollableHeight = scrollableRow.offsetHeight;
                const maxHeight = Math.max(fixedHeight, scrollableHeight);
                
                // 设置相同的高度
                if (maxHeight > 0) {
                    fixedRow.style.height = maxHeight + 'px';
                    scrollableRow.style.height = maxHeight + 'px';
                }
            }
        });
    }, 50);
}

// 同步固定列表格和可滚动列表格的垂直滚动
function syncTableScroll() {
    const fixedContainer = document.querySelector('.fixed-columns-container');
    const scrollableContainer = document.querySelector('.scrollable-columns-container');
    
    if (!fixedContainer || !scrollableContainer) {
        return;
    }
    
    // 移除之前的事件监听器（如果存在）
    if (fixedContainer._scrollSyncHandler) {
        fixedContainer.removeEventListener('scroll', fixedContainer._scrollSyncHandler);
    }
    if (scrollableContainer._scrollSyncHandler) {
        scrollableContainer.removeEventListener('scroll', scrollableContainer._scrollSyncHandler);
    }
    
    // 固定列表格滚动时，同步可滚动列表格
    fixedContainer._scrollSyncHandler = function() {
        if (!fixedContainer._isScrolling) {
            scrollableContainer._isScrolling = true;
            scrollableContainer.scrollTop = fixedContainer.scrollTop;
            setTimeout(() => {
                scrollableContainer._isScrolling = false;
            }, 50);
        }
    };
    
    // 可滚动列表格滚动时，同步固定列表格
    scrollableContainer._scrollSyncHandler = function() {
        if (!scrollableContainer._isScrolling) {
            fixedContainer._isScrolling = true;
            fixedContainer.scrollTop = scrollableContainer.scrollTop;
            setTimeout(() => {
                fixedContainer._isScrolling = false;
            }, 50);
        }
    };
    
    fixedContainer.addEventListener('scroll', fixedContainer._scrollSyncHandler);
    scrollableContainer.addEventListener('scroll', scrollableContainer._scrollSyncHandler);
    
    // 监听窗口大小变化，重新对齐行
    window.addEventListener('resize', function() {
        setTimeout(alignTableRows, 100);
    });
}

// 添加标签列功能
function addTagColumn() {
    // 获取当前标签列数
    const currentTagCount = document.querySelectorAll('.scrollable-columns-table th:not(.add-tag-column-header)').length;
    const newTagIndex = currentTagCount + 1;
    
    // 在"添加标签列"按钮前插入新的标签列标题
    const headerRow = document.querySelector('.scrollable-columns-table .bulk-upload-header-row');
    const addButtonTh = headerRow.querySelector('.add-tag-column-header');
    const newHeaderTh = document.createElement('th');
    newHeaderTh.width = '100';
    newHeaderTh.textContent = `标签${newTagIndex}`;
    headerRow.insertBefore(newHeaderTh, addButtonTh);
    
    // 为所有数据行添加新的标签输入框
    const dataRows = document.querySelectorAll('.scrollable-columns-table .bulk-upload-row');
    dataRows.forEach(row => {
        const addButtonCell = row.querySelector('.add-tag-column-cell');
        const newTagCell = document.createElement('td');
        newTagCell.className = 'tag-cell';
        
        // 获取任务ID和文件索引
        const taskId = row.dataset.taskId;
        const fileIndex = row.dataset.fileIndex || '0';
        
        newTagCell.setAttribute('contenteditable', 'true');
        newTagCell.setAttribute('data-task-id', taskId);
        newTagCell.setAttribute('data-file-index', fileIndex);
        newTagCell.setAttribute('data-tag-index', newTagIndex);
        newTagCell.setAttribute('data-placeholder', `标签${newTagIndex}`);
        
        row.insertBefore(newTagCell, addButtonCell);
    });
}

// 为标签单元格添加事件监听
function addTagCellEventListeners() {
    // 为所有标签单元格添加事件监听
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-cell')) {
            e.target.focus();
        }
    });
    
    // 处理标签单元格的输入事件
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('tag-cell')) {
            // 可以在这里添加实时保存或其他处理逻辑
            console.log('标签更新:', e.target.textContent);
        }
    });
    
    // 处理标签单元格的失焦事件
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('tag-cell')) {
            // 可以在这里添加保存逻辑
            console.log('标签保存:', e.target.textContent);
        }
    }, true);
}

// 页面加载完成后添加事件监听
document.addEventListener('DOMContentLoaded', function() {
    addTagCellEventListeners();
});

// 打开批量上传批量解析模态框
function openBulkUploadBatchParseModal() {
    // 检查是否有上传的素材
    if (allBulkFiles.length === 0) {
        showNotification('请先上传素材文件', 'warning');
        return;
    }
    
    // 渲染批量解析表格
    renderBulkUploadBatchParseTable();
    
    document.getElementById('bulkUploadBatchParseModal').style.display = 'block';
}

// 渲染批量上传批量解析表格
function renderBulkUploadBatchParseTable() {
    const tbody = document.getElementById('bulkUploadBatchParseTableBody');
    tbody.innerHTML = '';
    
    // 按任务ID分组显示素材
    selectedTasks.forEach(taskId => {
        const taskFiles = allBulkFiles.filter(file => file.taskId === taskId);
        
        taskFiles.forEach((file, index) => {
            const row = document.createElement('tr');
            
            // 提取素材名称（优先使用存储的名称，否则从文件名中提取）
            let materialName = '';
            if (bulkMaterialTags[file.name] && bulkMaterialTags[file.name].name) {
                const storedName = bulkMaterialTags[file.name].name;
                if (storedName !== file.name) {
                    materialName = storedName;
                } else {
                    // 如果存储的是完整文件名，尝试去掉任务ID前缀（支持多种分隔符）
                    materialName = storedName;
                    const separators = ['_', '-', '.', ' ', '+'];
                    for (const sep of separators) {
                        const prefix = `${taskId}${sep}`;
                        if (materialName.startsWith(prefix)) {
                            materialName = materialName.substring(prefix.length);
                            break;
                        }
                    }
                }
            }
            
            if (!materialName || materialName === file.name) {
                // 从文件名中提取（去掉任务ID前缀，支持多种分隔符）
                materialName = file.name;
                const separators = ['_', '-', '.', ' ', '+'];
                for (const sep of separators) {
                    const prefix = `${taskId}${sep}`;
                    if (materialName.startsWith(prefix)) {
                        materialName = materialName.substring(prefix.length);
                        break;
                    }
                }
            }
            
            if (!materialName || materialName.trim() === '') {
                materialName = file.name;
            }
            
            // 获取已有的标签数据
            const existingTags = getBulkUploadTagData(taskId, index) || [];
            
            row.innerHTML = `
                <td>${tbody.children.length + 1}</td>
                <td class="material-name">${materialName}</td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="1" placeholder="标签1" value="${existingTags[0] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="2" placeholder="标签2" value="${existingTags[1] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="3" placeholder="标签3" value="${existingTags[2] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="4" placeholder="标签4" value="${existingTags[3] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="5" placeholder="标签5" value="${existingTags[4] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="6" placeholder="标签6" value="${existingTags[5] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="7" placeholder="标签7" value="${existingTags[6] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="8" placeholder="标签8" value="${existingTags[7] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="9" placeholder="标签9" value="${existingTags[8] || ''}"></td>
                <td><input type="text" class="bulk-upload-tag-input" data-task-id="${taskId}" data-file-index="${index}" data-tag-index="10" placeholder="标签10" value="${existingTags[9] || ''}"></td>
            `;
            tbody.appendChild(row);
        });
    });
}

// 获取批量上传标签数据
function getBulkUploadTagData(taskId, fileIndex) {
    const key = `${taskId}_${fileIndex}`;
    return bulkUploadTagData[key] || [];
}

// 设置批量上传标签数据
function setBulkUploadTagData(taskId, fileIndex, tagIndex, value) {
    const key = `${taskId}_${fileIndex}`;
    if (!bulkUploadTagData[key]) {
        bulkUploadTagData[key] = [];
    }
    bulkUploadTagData[key][tagIndex - 1] = value;
}

// 解析批量上传标签
function parseBulkUploadBatchTags() {
    const tagInputs = document.querySelectorAll('.bulk-upload-tag-input');
    let updatedCount = 0;
    
    // 收集所有标签数据
    tagInputs.forEach(input => {
        const taskId = input.getAttribute('data-task-id');
        const fileIndex = parseInt(input.getAttribute('data-file-index'));
        const tagIndex = parseInt(input.getAttribute('data-tag-index'));
        const tagValue = input.value.trim();
        
        if (taskId && fileIndex !== null && tagIndex !== null) {
            setBulkUploadTagData(taskId, fileIndex, tagIndex, tagValue);
            updatedCount++;
        }
    });
    
    // 更新主表格中的标签显示
    updateBulkUploadTableTags();
    
    // 关闭弹窗
    closeModal('bulkUploadBatchParseModal');
    
    showNotification(`批量标签解析完成！已更新 ${updatedCount} 个标签`, 'success');
}

// 更新批量上传表格中的标签显示
function updateBulkUploadTableTags() {
    // 更新所有标签单元格的内容
    Object.keys(bulkUploadTagData).forEach(key => {
        const [taskId, fileIndex] = key.split('_');
        const tags = bulkUploadTagData[key];
        
        // 更新对应的标签单元格
        tags.forEach((tag, index) => {
            if (tag) {
                const cell = document.querySelector(`.tag-cell[data-task-id="${taskId}"][data-file-index="${fileIndex}"][data-tag-index="${index + 1}"]`);
                if (cell) {
                    cell.textContent = tag;
                }
            }
        });
    });
}

// 确认批量上传
function confirmBulkUpload() {
    // 检查是否有上传的素材
    if (allBulkFiles.length === 0) {
        showNotification('请先上传素材文件', 'warning');
        return;
    }
    
    // 统计信息
    const totalFiles = allBulkFiles.length;
    const totalTasks = selectedTasks.length;
    
    // 直接显示简单的确认对话框
    if (confirm(`确认上传 ${totalFiles} 个素材文件到 ${totalTasks} 个任务吗？\n\n点击"确定"开始上传，点击"取消"返回编辑。`)) {
        executeBulkUpload();
    }
}

// 复杂的确认对话框已删除，现在使用简单的confirm对话框

// 执行批量上传
function executeBulkUpload() {
    // 这里可以添加实际的上传逻辑
    // 例如：发送数据到服务器、更新数据库等
    
    // 显示上传进度通知
    showNotification('开始上传素材和标签...', 'info');
    
    // 模拟上传过程
    setTimeout(() => {
        // 上传完成，直接清空数据并关闭页面
        allBulkFiles = [];
        bulkMaterialTags = {};
        bulkUploadTagData = {};
        
        // 清空所有任务的分配文件
        selectedTasks.forEach(taskId => {
            const uploadData = bulkUploadData[taskId];
            if (uploadData) {
                uploadData.assignedFiles = [];
            }
        });
        
        // 关闭批量上传页面
        closeModal('bulkUploadModal');
        
        // 显示成功通知
        showNotification('批量上传完成！所有素材和标签已成功提交', 'success');
    }, 2000);
}

// 添加标签功能
function addTag(taskId, fileIndex) {
    const input = document.querySelector(`input[data-task-id="${taskId}"][data-file-index="${fileIndex}"]`);
    const tagValue = input.value.trim();
    
    if (tagValue) {
        // 这里可以添加标签到对应的素材
        console.log(`为任务 ${taskId} 的素材 ${fileIndex} 添加标签: ${tagValue}`);
        
        // 清空输入框
        input.value = '';
        
        // 可以在这里添加标签显示逻辑
        showNotification(`已为素材添加标签: ${tagValue}`, 'success');
    } else {
        showNotification('请输入标签内容', 'warning');
    }
}

// 触发批量文件选择
function triggerBulkFileInput() {
    const fileInput = document.getElementById('bulkFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// 处理批量文件选择
function handleBulkFileSelect(event) {
    console.log('handleBulkFileSelect called with files:', event.target.files);
    const files = Array.from(event.target.files);
    console.log('Files array:', files);
    
    if (files.length === 0) {
        console.log('No files selected');
        return;
    }
    
    // 处理每个文件
    files.forEach(file => {
        console.log('Processing file:', file.name, 'type:', file.type);
        
        // 验证文件
        if (!validateBulkFile(file)) {
            console.log('File validation failed for:', file.name);
            return;
        }
        
        // 从文件名中提取任务ID
        const taskId = extractTaskIdFromFileName(file.name);
        if (taskId) {
            file.taskId = taskId;
            console.log('Extracted task ID:', taskId, 'from file:', file.name);
        } else {
            console.log('Could not extract task ID from file:', file.name);
            return;
        }
        
        // 如果任务ID不在selectedTasks中，自动添加
        if (!selectedTasks.includes(taskId)) {
            selectedTasks.push(taskId);
            console.log('Auto-added task ID to selectedTasks:', taskId);
            
            // 初始化bulkUploadData
            const task = taskData.find(t => t.id === taskId);
            if (task && !bulkUploadData[taskId]) {
                bulkUploadData[taskId] = {
                    task: task,
                    assignedFiles: []
                };
                console.log('Initialized bulkUploadData for task:', taskId);
            }
        }
        
        // 添加到全局文件列表
        allBulkFiles.push(file);
        console.log('File added to allBulkFiles:', file.name);
        
        // 获取任务信息，用于初始化标签
        const task = taskData.find(t => t.id === taskId);
        
        // 初始化标签信息，使用任务信息作为默认值 - 使用新的14个标签结构
        bulkMaterialTags[file.name] = {
            name: file.name,
            productFrameShape: '',        // 图片-商品框形状
            productDisplayForm: '',       // 图片-商品展示形态
            priceTagStyle: '',            // 图片-价格标签样式
            materialSource: task ? (task.materialSource || '') : '', // 图片-素材来源
            taskTags: '',                 // 任务标签（多选）
            externalElements: '',         // 图片-外推要素（单选）
            contentStrategy: '',          // 图片-内容策略（单选）
            infoPriority: '',             // 图片-信息主次（单选）
            albumFeatures: '',            // 图片-图集特征（单选）
            marketingElements: '',        // 营销元素（多选）
            valueProposition: '',         // 价值主张（多选）
            audienceTags: '',             // 人群标签（多选）
            designer: task ? (task.designer || '') : '', // 图片-设计师（支持修改）
            requester: task ? (task.submitter || '') : '' // 图片-需求人
        };
    });
    
    console.log('Total files in allBulkFiles:', allBulkFiles.length);
    console.log('Selected tasks:', selectedTasks);
    
    // 更新选中任务数量显示
    const selectedTaskCountEl = document.getElementById('selectedTaskCount');
    if (selectedTaskCountEl) {
        selectedTaskCountEl.textContent = selectedTasks.length;
    }
    
    // 重新渲染表格以显示新上传的素材
    renderBulkUploadTable();
    
    // 显示通知
    showNotification(`成功上传 ${files.length} 个文件`, 'success');
    
    // 清空文件输入
    event.target.value = '';
}

// 从文件名中提取任务ID
function extractTaskIdFromFileName(fileName) {
    // 文件名格式支持多种分隔符：
    // 1. 任务ID_素材名称（如：7CrNkAAF_202509031.jpg）
    // 2. 任务ID+素材名称（如：7CrNkAAF+6920001524674067000+1）
    // 3. 任务ID-素材名称
    // 4. 任务ID.素材名称
    // 5. 任务ID 素材名称（空格）
    const patterns = [
        /^([^_]+)_/,      // 下划线分隔
        /^([^+]+)\+/,     // 加号分隔
        /^([^-]+)-/,      // 减号分隔
        /^([^\.]+)\./,    // 点号分隔
        /^([^\s]+)\s/     // 空格分隔
    ];
    
    for (const pattern of patterns) {
        const match = fileName.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// 处理批量拖拽悬停
function handleBulkDragOver(event) {
    event.preventDefault();
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.add('drag-over');
    }
}

// 处理批量拖拽离开
function handleBulkDragLeave(event) {
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.remove('drag-over');
    }
}

// 处理批量拖拽放置
function handleBulkDrop(event) {
    event.preventDefault();
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.remove('drag-over');
    }
    
    const files = Array.from(event.dataTransfer.files);
    console.log('Files dropped:', files);
    
    if (files.length === 0) {
        console.log('No files dropped');
        return;
    }
    
    // 直接处理文件
    files.forEach(file => {
        console.log('Processing dropped file:', file.name, 'type:', file.type);
        
        // 验证文件
        if (!validateBulkFile(file)) {
            console.log('File validation failed for:', file.name);
            return;
        }
        
        // 从文件名中提取任务ID
        const taskId = extractTaskIdFromFileName(file.name);
        if (taskId) {
            file.taskId = taskId;
            
            // 如果任务ID不在selectedTasks中，自动添加
            if (!selectedTasks.includes(taskId)) {
                selectedTasks.push(taskId);
                console.log('Auto-added task ID to selectedTasks (drop):', taskId);
                
                // 初始化bulkUploadData
                const task = taskData.find(t => t.id === taskId);
                if (task && !bulkUploadData[taskId]) {
                    bulkUploadData[taskId] = {
                        task: task,
                        assignedFiles: []
                    };
                    console.log('Initialized bulkUploadData for task (drop):', taskId);
                }
            }
        }
        
        // 添加到全局文件列表
        allBulkFiles.push(file);
        console.log('Dropped file added to allBulkFiles:', file.name);
        
        // 获取任务信息，用于初始化标签
        const task = taskId ? taskData.find(t => t.id === taskId) : null;
        
        // 初始化标签信息，使用任务信息作为默认值 - 使用新的14个标签结构
        bulkMaterialTags[file.name] = {
            name: file.name,
            productFrameShape: '',        // 图片-商品框形状
            productDisplayForm: '',       // 图片-商品展示形态
            priceTagStyle: '',            // 图片-价格标签样式
            materialSource: task ? (task.materialSource || '') : '', // 图片-素材来源
            taskTags: '',                 // 任务标签（多选）
            externalElements: '',         // 图片-外推要素（单选）
            contentStrategy: '',          // 图片-内容策略（单选）
            infoPriority: '',             // 图片-信息主次（单选）
            albumFeatures: '',            // 图片-图集特征（单选）
            marketingElements: '',        // 营销元素（多选）
            valueProposition: '',         // 价值主张（多选）
            audienceTags: '',             // 人群标签（多选）
            designer: task ? (task.designer || '') : '', // 图片-设计师（支持修改）
            requester: task ? (task.submitter || '') : '' // 图片-需求人
        };
    });
    
    console.log('Total files in allBulkFiles after drop:', allBulkFiles.length);
    console.log('Selected tasks after drop:', selectedTasks);
    
    // 更新选中任务数量显示
    const selectedTaskCountEl = document.getElementById('selectedTaskCount');
    if (selectedTaskCountEl) {
        selectedTaskCountEl.textContent = selectedTasks.length;
    }
    
    // 自动分配文件到任务
    autoAssignFilesToTasks();
    
    // 渲染界面
    renderBulkUploadTable(); // 渲染批量上传表格
    renderBulkUploadedFiles();
    renderAssignedFiles();
    
    // 显示通知
    showNotification(`成功拖拽上传 ${files.length} 个文件`, 'success');
}

// 添加批量文件 - 优化版本
function addBulkFiles(files) {
    console.log('addBulkFiles called with:', files);
    const validFiles = [];
    
    files.forEach(file => {
        console.log('Processing file:', file.name, 'type:', file.type);
        // 验证文件
        if (!validateBulkFile(file)) {
            console.log('File validation failed for:', file.name);
            return;
        }
        
        // 从文件名中提取任务ID
        const taskId = extractTaskIdFromFileName(file.name);
        if (taskId) {
            file.taskId = taskId;
            
            // 如果任务ID不在selectedTasks中，自动添加
            if (!selectedTasks.includes(taskId)) {
                selectedTasks.push(taskId);
                console.log('Auto-added task ID to selectedTasks (addBulkFiles):', taskId);
                
                // 初始化bulkUploadData
                const task = taskData.find(t => t.id === taskId);
                if (task && !bulkUploadData[taskId]) {
                    bulkUploadData[taskId] = {
                        task: task,
                        assignedFiles: []
                    };
                    console.log('Initialized bulkUploadData for task (addBulkFiles):', taskId);
                }
            }
        }
        
        allBulkFiles.push(file);
        validFiles.push(file);
        console.log('File added to allBulkFiles:', file.name);
        
        // 获取任务信息，用于初始化标签
        const task = taskId ? taskData.find(t => t.id === taskId) : null;
        
        // 初始化标签信息，使用任务信息作为默认值 - 使用新的14个标签结构
        bulkMaterialTags[file.name] = {
            name: file.name,
            productFrameShape: '',        // 图片-商品框形状
            productDisplayForm: '',       // 图片-商品展示形态
            priceTagStyle: '',            // 图片-价格标签样式
            materialSource: task ? (task.materialSource || '') : '', // 图片-素材来源
            taskTags: '',                 // 任务标签（多选）
            externalElements: '',         // 图片-外推要素（单选）
            contentStrategy: '',          // 图片-内容策略（单选）
            infoPriority: '',             // 图片-信息主次（单选）
            albumFeatures: '',            // 图片-图集特征（单选）
            marketingElements: '',        // 营销元素（多选）
            valueProposition: '',         // 价值主张（多选）
            audienceTags: '',             // 人群标签（多选）
            designer: task ? (task.designer || '') : '', // 图片-设计师（支持修改）
            requester: task ? (task.submitter || '') : '' // 图片-需求人
        };
    });
    
    console.log('Valid files count:', validFiles.length);
    console.log('Total allBulkFiles count:', allBulkFiles.length);
    
    if (validFiles.length === 0) {
        alert('没有有效的文件可以上传');
        return;
    }
    
    // 自动分配文件到任务
    autoAssignFilesToTasks();
    
    // 渲染界面
    renderBulkUploadedFiles();
    renderAssignedFiles();
    
    // 显示分配结果提示
    showAssignmentResult(validFiles);
}

// 显示文件分配结果
function showAssignmentResult(files) {
    let assignedCount = 0;
    let unassignedFiles = [];
    
    files.forEach(file => {
        let isAssigned = false;
        selectedTasks.forEach(taskId => {
            if (bulkUploadData[taskId].assignedFiles.some(f => f.name === file.name)) {
                isAssigned = true;
                assignedCount++;
            }
        });
        if (!isAssigned) {
            unassignedFiles.push(file.name);
        }
    });
    
    // 显示分配结果
    if (assignedCount === files.length) {
        // 所有文件都已分配
        showNotification(`成功上传 ${files.length} 个文件，已自动分配到对应任务`, 'success');
    } else if (assignedCount > 0) {
        // 部分文件已分配
        showNotification(`成功上传 ${files.length} 个文件，其中 ${assignedCount} 个已自动分配，${unassignedFiles.length} 个未分配`, 'warning');
        if (unassignedFiles.length > 0) {
            console.log('未分配的文件：', unassignedFiles);
        }
    } else {
        // 没有文件被分配
        showNotification(`成功上传 ${files.length} 个文件，但未找到匹配的任务ID，请检查文件名格式`, 'error');
    }
}

// 显示通知消息
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        if (notification && notification.classList) {
            notification.classList.add('show');
        }
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        if (notification && notification.classList) {
            notification.classList.remove('show');
        }
        setTimeout(() => {
            if (notification && document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 验证批量文件
function validateBulkFile(file) {
    console.log('Validating file:', file.name, 'type:', file.type);
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'image/jpg'];
    
    // 更宽松的文件类型检查
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
        console.log('File type not allowed:', file.type);
        alert(`不支持的文件格式: ${file.name}`);
        return false;
    }
    
    console.log('File validation passed for:', file.name);
    return true;
}

// 自动分配文件到任务 - 优化版本
function autoAssignFilesToTasks() {
    // 清空之前的分配
    selectedTasks.forEach(taskId => {
        bulkUploadData[taskId].assignedFiles = [];
    });
    
    // 根据文件名分配文件
    allBulkFiles.forEach(file => {
        const fileName = file.name;
        let assigned = false;
        
        // 检查文件名是否包含任务ID（支持多种格式）
        selectedTasks.forEach(taskId => {
            // 支持多种文件名格式：
            // 1. 任务ID_素材名称
            // 2. 任务ID-素材名称  
            // 3. 任务ID.素材名称
            // 4. 任务ID 素材名称
            const patterns = [
                new RegExp(`^${taskId}[_\\-\\.]`, 'i'),  // 开头匹配，转义特殊字符
                new RegExp(`[_\\-\\.]${taskId}[_\\-\\.]`, 'i'), // 中间匹配
                new RegExp(`[_\\-\\.]${taskId}$`, 'i')   // 结尾匹配
            ];
            
            if (patterns.some(pattern => pattern.test(fileName))) {
                bulkUploadData[taskId].assignedFiles.push(file);
                assigned = true;
                console.log(`文件 ${fileName} 已分配到任务 ${taskId}`);
            }
        });
        
        // 如果没有匹配到任务ID，显示提示
        if (!assigned) {
            console.warn(`文件 ${fileName} 未匹配到任何任务ID，请检查文件名格式`);
            // 可以选择将未分配的文件显示在界面上供用户手动分配
        }
    });
    
    // 更新界面显示
    renderAssignedFiles();
}

// 渲染批量上传的文件
function renderBulkUploadedFiles() {
    console.log('renderBulkUploadedFiles called, allBulkFiles length:', allBulkFiles.length);
    const container = document.getElementById('bulkUploadedFiles');
    const grid = document.getElementById('bulkFilesGrid');
    
    console.log('Container element:', container);
    console.log('Grid element:', grid);
    
    if (allBulkFiles.length === 0) {
        if (container) {
            container.style.display = 'none';
        }
        return;
    }
    
    if (container) {
        container.style.display = 'block';
        const h5 = container.querySelector('h5');
        if (h5) {
            h5.textContent = `已上传素材 (${allBulkFiles.length}个)`;
        }
    }
    
    if (grid) {
        grid.innerHTML = allBulkFiles.map((file, index) => `
            <div class="bulk-file-item" data-file-name="${file.name}">
                <div class="bulk-file-preview">
                    ${file.type.startsWith('image/') 
                        ? `<img src="${URL.createObjectURL(file)}" alt="预览">`
                        : `<video src="${URL.createObjectURL(file)}" muted></video>`
                    }
                </div>
                <div class="bulk-file-info">
                    <div class="bulk-file-name" title="${file.name}">${file.name}</div>
                    <div class="bulk-file-assignment">
                        ${getFileAssignmentInfo(file.name)}
                    </div>
                </div>
                <button class="bulk-file-remove" onclick="removeBulkFile('${file.name}')" title="移除文件">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        console.log('Grid innerHTML updated');
    } else {
        console.error('Grid element not found!');
    }
}

// 获取文件分配信息
function getFileAssignmentInfo(fileName) {
    let assignmentInfo = '未分配';
    
    selectedTasks.forEach(taskId => {
        const assignedFiles = bulkUploadData[taskId].assignedFiles;
        if (assignedFiles.some(file => file.name === fileName)) {
            assignmentInfo = `已分配到任务 ${taskId}`;
        }
    });
    
    return assignmentInfo;
}

// 渲染已分配的文件
function renderAssignedFiles() {
    selectedTasks.forEach(taskId => {
        const container = document.getElementById(`assignedFiles_${taskId}`);
        const assignedFiles = bulkUploadData[taskId].assignedFiles;
        
        // 更新迷你预览
        if (assignedFiles.length === 0) {
            container.innerHTML = '';
        } else {
            container.innerHTML = assignedFiles.map(file => `
                <div class="assigned-file-mini" title="${file.name}">
                    <img src="${URL.createObjectURL(file)}" class="file-preview-mini" alt="预览">
                </div>
            `).join('');
        }
        
        // 更新已上传素材展示区域
        updateUploadedMaterialsDisplay(taskId, assignedFiles);
        
        // 更新标签按钮状态
        const tagsBtn = document.getElementById(`tagsBtn_${taskId}`);
        const tagsCount = document.getElementById(`tagsCount_${taskId}`);
        if (tagsBtn && tagsCount) {
            tagsCount.textContent = assignedFiles.length;
            tagsBtn.disabled = assignedFiles.length === 0;
        }
    });
}

// 更新已上传素材展示
function updateUploadedMaterialsDisplay(taskId, assignedFiles) {
    const materialsSection = document.getElementById(`uploadedMaterials_${taskId}`);
    const materialsCount = document.getElementById(`materialsCount_${taskId}`);
    const materialsList = document.getElementById(`materialsList_${taskId}`);
    
    if (!materialsSection || !materialsCount || !materialsList) {
        return;
    }
    
    if (assignedFiles.length === 0) {
        materialsSection.style.display = 'none';
        return;
    }
    
    // 显示素材区域
    materialsSection.style.display = 'block';
    materialsCount.textContent = `${assignedFiles.length}个`;
    
    // 渲染素材列表
          materialsList.innerHTML = assignedFiles.map((file, index) => {
              const tags = bulkMaterialTags[file.name] || {};
              return `
                  <div class="material-batch-row" data-file-name="${file.name}">
                      <div class="material-batch-content">
                          <div class="material-batch-info">
                              <span class="task-id-label">${taskId}</span>
                              <span class="material-name-batch">${tags.name || file.name}</span>
                          </div>
                          <div class="material-batch-tags">
                              <input type="text" value="${tags.category || ''}" 
                                     data-file-name="${file.name}" data-tag-type="category"
                                     placeholder="品类" class="batch-tag-input">
                              <input type="text" value="${tags.channel || ''}" 
                                     data-file-name="${file.name}" data-tag-type="channel"
                                     placeholder="渠道" class="batch-tag-input">
                              <input type="text" value="${tags.designer || ''}" 
                                     data-file-name="${file.name}" data-tag-type="designer"
                                     placeholder="设计师" class="batch-tag-input">
                              <input type="text" value="${tags.productId || ''}" 
                                     data-file-name="${file.name}" data-tag-type="productId"
                                     placeholder="商品ID" class="batch-tag-input">
                              <input type="text" value="${tags.textTags || ''}" 
                                     data-file-name="${file.name}" data-tag-type="textTags"
                                     placeholder="文本标签" class="batch-tag-input">
                          </div>
                          <div class="material-batch-actions">
                              <button class="btn btn-sm btn-danger" onclick="removeAssignedFile('${file.name}', '${taskId}')" title="移除素材">
                                  <i class="fas fa-trash"></i>
                              </button>
                          </div>
                      </div>
                  </div>
              `;
          }).join('');
}

// 更新素材标签
function updateMaterialTag(fileName, tagType, value) {
    if (!bulkMaterialTags[fileName]) {
        bulkMaterialTags[fileName] = {};
    }
    bulkMaterialTags[fileName][tagType] = value;
    console.log(`Updated ${fileName} ${tagType}:`, value);
}

// 粘贴多列数据到素材标签
function pasteTagsToRow(fileName) {
    const pasteModal = document.createElement('div');
    pasteModal.className = 'modal fade';
    pasteModal.id = 'pasteTagsModal';
    pasteModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">粘贴标签数据 - ${fileName}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">粘贴多列数据（支持制表符分隔）</label>
                        <textarea class="form-control" id="pasteData" rows="6" 
                                  placeholder="请粘贴多列数据，每列用制表符分隔，例如：&#10;服装&#9;淘宝&#9;张三&#9;SKU001&#9;春季新品&#10;鞋类&#9;京东&#9;李四&#9;SKU002&#9;运动鞋"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">数据格式说明：</label>
                        <div class="alert alert-info">
                            <small>
                                <strong>支持的格式：</strong><br>
                                • 制表符分隔：品类\t渠道\t设计师\t商品ID\t文本标签<br>
                                • 逗号分隔：品类,渠道,设计师,商品ID,文本标签<br>
                                • 分号分隔：品类;渠道;设计师;商品ID;文本标签<br>
                                <strong>注意：</strong>只处理第一行数据，多行数据将忽略
                            </small>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" class="btn btn-primary" onclick="processPastedTags('${fileName}')">应用数据</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(pasteModal);
    const modal = new bootstrap.Modal(pasteModal);
    modal.show();
    
    // 监听模态框关闭事件
    pasteModal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(pasteModal);
    });
}

// 处理粘贴的标签数据
function processPastedTags(fileName) {
    const pasteData = document.getElementById('pasteData').value.trim();
    if (!pasteData) {
        showNotification('请输入要粘贴的数据', 'warning');
        return;
    }
    
    // 解析数据（支持制表符、逗号、分号分隔）
    let columns = [];
    if (pasteData.includes('\t')) {
        columns = pasteData.split('\t');
    } else if (pasteData.includes(',')) {
        columns = pasteData.split(',');
    } else if (pasteData.includes(';')) {
        columns = pasteData.split(';');
    } else {
        showNotification('请使用制表符、逗号或分号分隔多列数据', 'warning');
        return;
    }
    
    // 确保有足够的列
    if (columns.length < 5) {
        showNotification('数据列数不足，需要5列：品类、渠道、设计师、商品ID、文本标签', 'warning');
        return;
    }
    
    // 更新标签数据
    const tagFields = ['category', 'channel', 'designer', 'productId', 'textTags'];
    tagFields.forEach((field, index) => {
        if (columns[index]) {
            updateMaterialTag(fileName, field, columns[index].trim());
        }
    });
    
    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('pasteTagsModal'));
    modal.hide();
    
    // 重新渲染素材显示
    const taskId = findTaskIdByFileName(fileName);
    if (taskId) {
        const assignedFiles = bulkUploadData[taskId].assignedFiles;
        updateUploadedMaterialsDisplay(taskId, assignedFiles);
    }
    
    showNotification(`已成功应用标签数据到 ${fileName}`, 'success');
}

// 根据文件名查找任务ID
function findTaskIdByFileName(fileName) {
    for (const taskId in bulkUploadData) {
        if (bulkUploadData[taskId].assignedFiles.some(file => file.name === fileName)) {
            return taskId;
        }
    }
    return null;
}

// 清空素材标签
function clearTagsForFile(fileName) {
    if (confirm(`确定要清空 ${fileName} 的所有标签吗？`)) {
        if (bulkMaterialTags[fileName]) {
            const tagFields = ['category', 'channel', 'designer', 'productId', 'textTags'];
            tagFields.forEach(field => {
                bulkMaterialTags[fileName][field] = '';
            });
        }
        
        // 重新渲染素材显示
        const taskId = findTaskIdByFileName(fileName);
        if (taskId) {
            const assignedFiles = bulkUploadData[taskId].assignedFiles;
            updateUploadedMaterialsDisplay(taskId, assignedFiles);
        }
        
        showNotification(`已清空 ${fileName} 的标签`, 'info');
    }
}

// 打开批量解析模态框
function openBulkBatchParseModal() {
    if (allBulkFiles.length === 0) {
        showNotification('请先上传素材', 'warning');
        return;
    }
    
    renderBulkBatchParseTable();
    document.getElementById('bulkBatchParseModal').style.display = 'block';
}

// 渲染批量解析表格
function renderBulkBatchParseTable() {
    const tbody = document.getElementById('bulkBatchParseTableBody');
    tbody.innerHTML = '';
    
    allBulkFiles.forEach((file, index) => {
        const tags = bulkMaterialTags[file.name] || {};
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="material-name">${file.name}</td>
            <td><input type="text" class="bulk-tag-input" data-file-name="${file.name}" data-tag-type="category" placeholder="品类" value="${tags.category || ''}"></td>
            <td><input type="text" class="bulk-tag-input" data-file-name="${file.name}" data-tag-type="channel" placeholder="渠道" value="${tags.channel || ''}"></td>
            <td><input type="text" class="bulk-tag-input" data-file-name="${file.name}" data-tag-type="designer" placeholder="设计师" value="${tags.designer || ''}"></td>
            <td><input type="text" class="bulk-tag-input" data-file-name="${file.name}" data-tag-type="productId" placeholder="商品ID" value="${tags.productId || ''}"></td>
            <td><input type="text" class="bulk-tag-input" data-file-name="${file.name}" data-tag-type="textTags" placeholder="文本标签" value="${tags.textTags || ''}"></td>
        `;
        tbody.appendChild(row);
    });
}

// 解析批量标签
function parseBulkBatchTags() {
    const tagInputs = document.querySelectorAll('.bulk-tag-input');
    let updatedCount = 0;
    
    // 收集所有标签数据
    tagInputs.forEach(input => {
        const fileName = input.getAttribute('data-file-name');
        const tagType = input.getAttribute('data-tag-type');
        const tagValue = input.value.trim();
        
        if (fileName && tagType) {
            if (!bulkMaterialTags[fileName]) {
                bulkMaterialTags[fileName] = {};
            }
            
            bulkMaterialTags[fileName][tagType] = tagValue;
            updatedCount++;
        }
    });
    
    // 重新渲染所有任务的素材显示
    selectedTasks.forEach(taskId => {
        const assignedFiles = bulkUploadData[taskId].assignedFiles;
        updateUploadedMaterialsDisplay(taskId, assignedFiles);
    });
    
    // 关闭弹窗
    closeModal('bulkBatchParseModal');
    
    showNotification(`批量标签解析完成！已更新 ${updatedCount} 个标签`, 'success');
}

// 移除已分配的素材
function removeAssignedFile(fileName, taskId) {
    // 从任务分配列表中移除
    bulkUploadData[taskId].assignedFiles = bulkUploadData[taskId].assignedFiles.filter(file => file.name !== fileName);
    
    // 从全局文件列表中移除
    allBulkFiles = allBulkFiles.filter(file => file.name !== fileName);
    
    // 从标签信息中移除
    delete bulkMaterialTags[fileName];
    
    // 重新渲染界面
    renderBulkUploadedFiles();
    renderAssignedFiles();
    
    showNotification(`已移除素材 ${fileName}`, 'info');
}

// 调试函数：检查DOM元素状态
function debugDOMState() {
    console.log('=== DOM状态调试 ===');
    console.log('bulkUploadZone:', document.getElementById('bulkUploadZone'));
    console.log('bulkFileInput:', document.getElementById('bulkFileInput'));
    console.log('bulkUploadedFiles:', document.getElementById('bulkUploadedFiles'));
    console.log('bulkFilesGrid:', document.getElementById('bulkFilesGrid'));
    console.log('selectedTasks:', selectedTasks);
    console.log('bulkUploadData:', bulkUploadData);
    console.log('allBulkFiles:', allBulkFiles);
}

// 移除批量文件
function removeBulkFile(fileName) {
    // 从全局文件列表中移除
    allBulkFiles = allBulkFiles.filter(file => file.name !== fileName);
    
    // 从所有任务的分配列表中移除
    selectedTasks.forEach(taskId => {
        bulkUploadData[taskId].assignedFiles = bulkUploadData[taskId].assignedFiles.filter(file => file.name !== fileName);
    });
    
    // 从标签信息中移除
    delete bulkMaterialTags[fileName];
    
    // 重新渲染界面
    renderBulkUploadedFiles();
    renderAssignedFiles();
}

// 处理文件选择
function handleFileSelect(event, taskId) {
    const files = Array.from(event.target.files);
    addFilesToTask(files, taskId);
}

// 处理拖拽悬停
function handleDragOver(event) {
    event.preventDefault();
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.add('drag-over');
    }
}

// 处理拖拽离开
function handleDragLeave(event) {
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.remove('drag-over');
    }
}

// 处理拖拽放置
function handleDrop(event, taskId) {
    event.preventDefault();
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.remove('drag-over');
    }
    
    const files = Array.from(event.dataTransfer.files);
    addFilesToTask(files, taskId);
}

// 处理任务行拖拽悬停
function handleRowDragOver(event) {
    event.preventDefault();
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.add('row-drag-over');
    }
}

// 处理任务行拖拽离开
function handleRowDragLeave(event) {
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.remove('row-drag-over');
    }
}

// 处理任务行拖拽放置
function handleRowDrop(event, taskId) {
    event.preventDefault();
    if (event.currentTarget && event.currentTarget.classList) {
        event.currentTarget.classList.remove('row-drag-over');
    }
    
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

// 切换批量标签展开面板
function toggleBulkTagsExpansion(taskId) {
    const panel = document.getElementById('tagsExpansionPanel');
    const title = document.getElementById('tagsPanelTitle');
    const uploadData = bulkUploadData[taskId];
    
    if (!uploadData || uploadData.assignedFiles.length === 0) {
        alert('该任务暂无素材，请先上传素材');
        return;
    }
    
    title.textContent = `任务 ${taskId} - 素材标签设置`;
    renderBulkTagsTable(taskId);
    
    // 显示面板
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 渲染批量标签表格
function renderBulkTagsTable(taskId) {
    const tbody = document.getElementById('tagsTableBody');
    const uploadData = bulkUploadData[taskId];
    
    if (!uploadData || uploadData.assignedFiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">暂无素材</td></tr>';
        return;
    }
    
    tbody.innerHTML = uploadData.assignedFiles.map(file => {
        const tags = bulkMaterialTags[file.name];
        return `
            <tr class="tag-row">
                <td class="preview-cell">
                    ${file.type.startsWith('image/') 
                        ? `<img src="${URL.createObjectURL(file)}" class="material-preview-table" alt="预览">`
                        : `<video src="${URL.createObjectURL(file)}" class="material-preview-table" muted></video>`
                    }
                </td>
                <td class="name-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.name}" 
                           onchange="updateBulkMaterialName('${file.name}', this.value)"
                           placeholder="素材名称">
                </td>
                <td class="category-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.category}"
                           onchange="updateBulkMaterialTag('${file.name}', 'category', this.value)"
                           placeholder="品类">
                </td>
                <td class="channel-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.channel}"
                           onchange="updateBulkMaterialTag('${file.name}', 'channel', this.value)"
                           placeholder="渠道">
                </td>
                <td class="designer-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.designer}"
                           onchange="updateBulkMaterialTag('${file.name}', 'designer', this.value)"
                           placeholder="设计师">
                </td>
                <td class="product-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.productId}"
                           onchange="updateBulkMaterialTag('${file.name}', 'productId', this.value)"
                           placeholder="商品ID">
                </td>
                <td class="text-tags-cell">
                    <input type="text" class="form-control form-control-sm" 
                           value="${tags.textTags}"
                           onchange="updateBulkMaterialTag('${file.name}', 'textTags', this.value)"
                           placeholder="文本标签">
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染标签表格（保留原有函数以兼容）
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
    
    if (uploadArea && uploadArea.classList && uploadData) {
        if (uploadData.files && uploadData.files.length > 0) {
            uploadArea.classList.add('has-files');
        } else {
            uploadArea.classList.remove('has-files');
        }
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

// 更新批量素材名称
function updateBulkMaterialName(fileName, newName) {
    if (bulkMaterialTags[fileName]) {
        bulkMaterialTags[fileName].name = newName;
    }
}

// 更新批量素材标签
function updateBulkMaterialTag(fileName, tagType, value, selectElement) {
    if (bulkMaterialTags[fileName]) {
        bulkMaterialTags[fileName][tagType] = value;
    }
    
    // 如果该标签列的同步功能已启用，且这是第一行的标签，则同步其他行
    if (syncEnabledTags[tagType] && !syncEnabledTags[tagType]._syncing) {
        // 跳过多选标签，因为多选标签由updateMultiSelectCheckbox处理
        if (syncEnabledTags[tagType].isMultiple) {
            // 多选标签的同步由updateMultiSelectCheckbox处理，这里不做处理
        } else {
            // 单选标签：检查是否是第一行的标签
            // 如果有传入selectElement，直接检查它是否是第一行的select（这是最可靠的方法）
            if (selectElement) {
                const firstDataRow = document.querySelector(`#bulkUploadTableBodyScrollable .bulk-upload-row`);
                if (firstDataRow) {
                    const firstCell = firstDataRow.querySelector(`.tag-cell[data-tag-type="${tagType}"]`);
                    if (firstCell) {
                        const firstSelect = firstCell.querySelector('select');
                        // 直接比较DOM元素引用，这是最可靠的方法
                        if (firstSelect === selectElement) {
                            // 如果当前更新的标签是第一行的标签，则同步其他行
                            console.log(`同步标签列: ${tagType}, 值: ${value}`);
                            setTimeout(() => {
                                syncTagColumn(tagType, false);
                            }, 50);
                        }
                    }
                }
            } else {
                // 备用方法：通过比较fileName判断（如果selectElement未传入）
                const firstDataRow = document.querySelector(`#bulkUploadTableBodyScrollable .bulk-upload-row`);
                if (firstDataRow) {
                    const firstCell = firstDataRow.querySelector(`.tag-cell[data-tag-type="${tagType}"]`);
                    if (firstCell) {
                        const firstSelect = firstCell.querySelector('select');
                        if (firstSelect) {
                            // 获取第一行的fileName
                            let firstFileName = firstSelect.dataset.fileName || firstSelect.getAttribute('data-file-name');
                            // 比较时处理转义字符
                            const normalize = (str) => str ? str.replace(/\\'/g, "'").replace(/'/g, "'") : '';
                            if (normalize(firstFileName) === normalize(fileName)) {
                                console.log(`同步标签列(备用方法): ${tagType}, 值: ${value}`);
                                setTimeout(() => {
                                    syncTagColumn(tagType, false);
                                }, 50);
                            }
                        }
                    }
                }
            }
        }
    } else {
        // 调试信息
        if (!syncEnabledTags[tagType]) {
            console.log(`标签 ${tagType} 的同步功能未启用`);
        } else if (syncEnabledTags[tagType]._syncing) {
            console.log(`标签 ${tagType} 正在同步中，跳过`);
        }
    }
    
    // 标签更新后重新对齐行高
    alignTableRows();
}

// 更新素材名称（保留原有函数以兼容）
function updateMaterialName(fileName, newName, taskId) {
    const uploadData = bulkUploadData[taskId];
    if (uploadData && uploadData.materialTags[fileName]) {
        uploadData.materialTags[fileName].name = newName;
    }
}

// 更新素材标签（保留原有函数以兼容）
function updateMaterialTag(fileName, tagType, value, taskId) {
    const uploadData = bulkUploadData[taskId];
    if (uploadData && uploadData.materialTags[fileName]) {
        uploadData.materialTags[fileName][tagType] = value;
    }
}

// 清空所有上传
function clearAllUploads() {
    if (confirm('确定要清空所有上传的素材吗？')) {
        // 清空全局文件列表
        allBulkFiles = [];
        bulkMaterialTags = {};
        bulkUploadTagData = {}; // 清空标签数据
        
        // 清空所有任务的分配文件
        selectedTasks.forEach(taskId => {
            const uploadData = bulkUploadData[taskId];
            if (uploadData) {
                uploadData.assignedFiles = [];
            }
        });
        
        // 重新渲染界面
        renderBulkUploadTable();
        
        // 隐藏按钮
        document.getElementById('bulkParseBtn').style.display = 'none';
        document.getElementById('confirmUploadBtn').style.display = 'none';
    }
}

// 重复的函数定义已删除

// 处理批量上传完成后的逻辑
function handleBulkUploadComplete() {
    console.log('批量上传完成，开始处理后续逻辑...');
    
    // 统计上传结果
    let totalUploaded = 0;
    let taskUploadSummary = {};
    
    selectedTasks.forEach(taskId => {
        const uploadData = bulkUploadData[taskId];
        if (uploadData && uploadData.assignedFiles.length > 0) {
            totalUploaded += uploadData.assignedFiles.length;
            taskUploadSummary[taskId] = {
                count: uploadData.assignedFiles.length,
                files: uploadData.assignedFiles.map(f => f.name)
            };
        }
    });
    
    console.log('上传统计:', {
        totalFiles: totalUploaded,
        taskSummary: taskUploadSummary
    });
    
    // 更新任务数据（模拟）
    selectedTasks.forEach(taskId => {
        const task = taskData.find(t => t.id === taskId);
        if (task) {
            const uploadData = bulkUploadData[taskId];
            if (uploadData && uploadData.assignedFiles.length > 0) {
                // 更新任务状态为"首次生成中"
                task.status = 'generating';
                task.updateTime = new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).replace(/\//g, '-');
                
                // 添加素材信息到任务
                if (!task.uploadedMaterials) {
                    task.uploadedMaterials = [];
                }
                
                uploadData.assignedFiles.forEach(file => {
                    const materialInfo = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        uploadTime: new Date().toLocaleString('zh-CN'),
                        tags: bulkMaterialTags[file.name] || {}
                    };
                    task.uploadedMaterials.push(materialInfo);
                });
                
                console.log(`任务 ${taskId} 已更新，状态: ${task.status}, 素材数量: ${uploadData.assignedFiles.length}`);
            }
        }
    });
    
    // 重新渲染表格以显示更新后的状态
    renderTable();
    
    // 清空批量上传数据
    bulkUploadData = {};
    allBulkFiles = [];
    bulkMaterialTags = {};
    selectedTasks = [];
    
    // 更新全选状态
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    
    // 更新批量操作按钮状态
    updateBulkActions();
    
    console.log('批量上传后续处理完成');
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

// 调试函数
function debugColumns() {
    console.log('当前列配置:', columnManager.columns);
    console.log('可见列:', columnManager.visibleColumns);
    
    // 查找安心购信息列
    const anxinColumn = columnManager.columns.find(col => col.key === 'anxinInfo');
    console.log('安心购信息列:', anxinColumn);
    
    alert(`安心购信息列状态: ${anxinColumn ? '存在' : '不存在'}\n可见性: ${anxinColumn ? anxinColumn.visible : 'N/A'}`);
}

function resetColumns() {
    localStorage.removeItem('tableColumnConfig');
    columnManager.columns = columnManager.initializeColumns();
    columnManager.visibleColumns = columnManager.columns.filter(col => col.visible);
    renderTable();
    alert('列配置已重置');
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    taskData = [...mockData];
    setDefaultTimeRange();
    
    // 强制重置列配置以确保安心购信息列显示
    localStorage.removeItem('tableColumnConfig');
    columnManager.columns = columnManager.initializeColumns();
    columnManager.visibleColumns = columnManager.columns.filter(col => col.visible);
    
    // 调试：检查列配置
    console.log('当前列配置:', columnManager.columns);
    console.log('可见列:', columnManager.visibleColumns);
    
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
                            <span class="sub-task-status">状态: ${statusMap[subTask.status]?.text || subTask.status || '未知状态'}</span>
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
                const statusInfo = statusMap[task.status] || { text: task.status || '未知状态', class: 'status-pending' };
                content = `<span class="status-tag ${statusInfo.class}">${statusInfo.text}</span>`;
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
            case 'anxinInfo':
                content = formatAnxinInfo(task.anxinInfo, task.productId);
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
        csvContent += `${task.createTime},${task.expectedTime},${task.submitter},${task.designer || '-'},${statusMap[task.status]?.text || task.status || '未知状态'},${task.updateTime},${task.generationId},${task.generationType},${task.channel},${task.materialSource},${task.templateCategory},${task.productQuantity},${task.materialQuantity},${task.materialSize},${task.productId},${task.applicationScenario},${task.creativeStrategyTag},${task.regenerationSuggestion || '-'}\n`;

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
        csvContent += `${task.createTime},${task.expectedTime},${task.submitter},${task.designer || '-'},${statusMap[task.status]?.text || task.status || '未知状态'},${task.updateTime},${task.generationId},${task.generationType},${task.channel},${task.materialSource},${task.templateCategory},${task.productQuantity},${task.materialQuantity},${task.materialSize},${task.productId},${task.applicationScenario},${task.creativeStrategyTag},${task.regenerationSuggestion || '-'}\n`;
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
    
    if (!allowedTypes.includes(file.type)) {
        alert(`不支持的文件格式: ${file.name}`);
        return false;
    }
    
    // 移除文件大小限制
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


