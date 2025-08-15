// 全局变量
let taskData = [];
let selectedTasks = [];
let currentUser = 'OA001'; // 当前登录用户，用于判断操作权限
let uploadedMaterials = []; // 上传的素材列表

// 模拟数据
const mockData = [
    {
        id: 1,
        createTime: '2024-01-15 10:30:00',
        expectedTime: '2024-01-20 18:00:00',
        submitter: '138****1234',
        designer: 'AIGC',
        status: 'generating',
        updateTime: '2024-01-15 11:00:00',
        generationId: 'GEN001',
        generationType: '单品多图',
        channel: '抖音',
        materialSource: 'AI生成',
        templateCategory: '服装',
        productQuantity: 1,
        materialQuantity: 3,
        materialSize: '1280x720',
        productId: 'PROD001',
        applicationScenario: '日常',
        creativeStrategyTag: '时尚',
        regenerationSuggestion: ''
    },
    {
        id: 2,
        createTime: '2024-01-15 09:15:00',
        expectedTime: '2024-01-18 18:00:00',
        submitter: '139****5678',
        designer: '',
        status: 'unassigned', // 待分配设计师
        updateTime: '2024-01-15 09:15:00',
        generationId: 'GEN002',
        generationType: '单品多视频',
        channel: '小红书',
        materialSource: '用户上传',
        templateCategory: '美妆',
        productQuantity: 2,
        materialQuantity: 5,
        materialSize: '1920x1080',
        productId: 'PROD002,PROD003',
        applicationScenario: '促销',
        creativeStrategyTag: '清新',
        regenerationSuggestion: ''
    },
    {
        id: 3,
        createTime: '2024-01-14 16:45:00',
        expectedTime: '2024-01-17 18:00:00',
        submitter: '137****9012',
        designer: 'OA001',
        status: 'pending',
        updateTime: '2024-01-14 16:45:00',
        generationId: 'GEN003',
        generationType: '单品单图',
        channel: '微信',
        materialSource: '模板库',
        templateCategory: '数码',
        productQuantity: 1,
        materialQuantity: 2,
        materialSize: '1080x1920',
        productId: 'PROD004',
        applicationScenario: '节日',
        creativeStrategyTag: '科技',
        regenerationSuggestion: '建议增加更多产品细节'
    },
    {
        id: 4,
        createTime: '2024-01-14 14:20:00',
        expectedTime: '20244-01-16 18:00:00',
        submitter: '136****3456',
        designer: '',
        status: 'unassigned', // 待分配设计师
        updateTime: '2024-01-15 08:30:00',
        generationId: 'GEN004',
        generationType: '单品单视频',
        channel: '抖音',
        materialSource: 'AI生成',
        templateCategory: '食品',
        productQuantity: 3,
        materialQuantity: 4,
        materialSize: '1280x720',
        productId: 'PROD005,PROD006,PROD007',
        applicationScenario: '日常',
        creativeStrategyTag: '美味',
        regenerationSuggestion: '需要更吸引人的视觉效果'
    },
    {
        id: 5,
        createTime: '2024-01-13 11:30:00',
        expectedTime: '2024-01-15 18:00:00',
        submitter: '135****7890',
        designer: 'AIGC',
        status: 'completed',
        updateTime: '2024-01-14 15:45:00',
        generationId: 'GEN005',
        generationType: '单品多视频',
        channel: '小红书',
        materialSource: 'AI生成',
        templateCategory: '家居',
        productQuantity: 1,
        materialQuantity: 6,
        materialSize: '1920x1080',
        productId: 'PROD008',
        applicationScenario: '促销',
        creativeStrategyTag: '温馨',
        regenerationSuggestion: '',
        subTasks: [
            { designer: 'OA001', status: 'completed', materialQuantity: 2 },
            { designer: 'OA002', status: 'completed', materialQuantity: 2 },
            { designer: 'OA003', status: 'completed', materialQuantity: 2 }
        ]
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

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    taskData = [...mockData];
    setDefaultTimeRange();
    renderTable();
});

// 渲染表格
function renderTable() {
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';

    taskData.forEach((task, index) => {
        const row = document.createElement('tr');
        row.dataset.taskId = task.id;
        
        if (selectedTasks.includes(task.id)) {
            row.classList.add('selected-row');
        }

        // 添加展开/收起按钮
        const expandButton = task.generationType === '单品多视频' && task.subTasks && task.subTasks.length > 0 
            ? `<button class="btn btn-sm btn-secondary expand-btn" onclick="toggleSubTasks(${task.id})" data-expanded="false">
                 <i class="fas fa-chevron-down"></i>
               </button>` 
            : '';

        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="checkbox" 
                           onchange="toggleTaskSelection(${task.id}, this)" 
                           ${selectedTasks.includes(task.id) ? 'checked' : ''}>
                    ${expandButton}
                </div>
            </td>
            <td>${task.createTime}</td>
            <td>${task.expectedTime}</td>
            <td>${task.submitter}</td>
            <td>${task.designer || '-'}</td>
            <td><span class="status-tag ${statusMap[task.status].class}">${statusMap[task.status].text}</span></td>
            <td>${task.updateTime}</td>
            <td>${task.generationId}</td>
            <td>${task.generationType}</td>
            <td>${task.channel}</td>
            <td>${task.materialSource}</td>
            <td>${task.templateCategory}</td>
            <td>${task.productQuantity}</td>
            <td>${task.materialQuantity}</td>
            <td>${task.materialSize}</td>
            <td>${task.productId}</td>
            <td>${task.applicationScenario}</td>
            <td>${task.creativeStrategyTag}</td>
            <td>${task.regenerationSuggestion || '-'}</td>
            <td>
                <div class="operation-buttons">
                    ${getOperationButtonsHTML(task)}
                </div>
            </td>
        `;

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
                    <td colspan="19" class="sub-task-content">
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
    });

    updateBulkActions();
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
    
    // AIGC设计师 - 无按钮可操作
    if (task.designer === 'AIGC') {
        buttonsHTML = '<button class="btn btn-secondary btn-disabled" disabled>AIGC自动处理中</button>';
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
    
    return buttonsHTML;
}

// 获取子任务操作按钮HTML
function getSubTaskOperationButtonsHTML(subTask, parentTaskId, subIndex) {
    let buttonsHTML = '';
    
    // 单品多视频的子任务都有操作权限
    if (subTask.status === 'pending' || subTask.status === 're-pending') {
        buttonsHTML = `
            <button class="btn btn-primary" onclick="startSubTaskProduction(${parentTaskId}, ${subIndex})">开始生产</button>
            <button class="btn btn-danger" onclick="closeSubTask(${parentTaskId}, ${subIndex})">关闭</button>
        `;
    }
    else if (subTask.status === 'generating' || subTask.status === 're-generating') {
        // 子任务只显示上传素材按钮（子任务不支持图创作）
        buttonsHTML = '<button class="btn btn-success" onclick="openSubTaskUploadModal(' + parentTaskId + ', ' + subIndex + ')">上传素材</button>';
    }
    else if (subTask.status === 'uploaded') {
        buttonsHTML = '<button class="btn btn-primary" onclick="syncSubTaskToWeimiao(' + parentTaskId + ', ' + subIndex + ')">同步唯妙</button>';
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
        designer: document.querySelector('select option:checked').value,
        status: document.querySelectorAll('select')[1].value,
        generationId: document.querySelector('input[placeholder="请输入生成ID"]').value,
        generationType: document.querySelectorAll('select')[2].value,
        channel: document.querySelectorAll('select')[3].value,
        productId: document.querySelector('input[placeholder="请输入商品ID"]').value,
        applicationScenario: document.querySelectorAll('select')[4].value
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
        if (filters.channel && task.channel !== filters.channel) return false;
        if (filters.productId && !task.productId.includes(filters.productId)) return false;
        if (filters.applicationScenario && task.applicationScenario !== filters.applicationScenario) return false;
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
        // 批量分配时显示添加按钮
        const addButton = document.querySelector('.add-assignment');
        if (addButton) {
            addButton.style.display = 'block';
        }
    }
    document.getElementById('assignModal').style.display = 'block';
}

// 添加分配条目
function addAssignmentEntry() {
    const assignmentEntries = document.getElementById('assignmentEntries');
    const newEntry = document.createElement('div');
    newEntry.className = 'assignment-entry';
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
            <input type="number" class="material-quantity" value="1" min="1">
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
        
        // 分配设计师
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
        selectedTasks.forEach(taskId => {
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
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('uploadModal').dataset.taskId = taskId;
    uploadedMaterials = []; // 清空素材列表
    renderMaterialsList();
    setupUploadZone();
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
        selectedProducts: []
    };
    
    uploadedMaterials.push(material);
    renderMaterialsList();
}

// 渲染素材列表
function renderMaterialsList() {
    const materialsList = document.getElementById('materialsList');
    materialsList.innerHTML = '';
    
    uploadedMaterials.forEach((material, index) => {
        const materialElement = createMaterialElement(material, index);
        materialsList.appendChild(materialElement);
    });
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

    // 更新任务状态
    if (task) {
        task.status = 'uploaded';
        task.updateTime = new Date().toLocaleString('zh-CN');
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

// 关闭弹窗
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'uploadModal') {
        document.getElementById('materialFiles').value = '';
        document.getElementById('uploadPreview').innerHTML = '';
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
                    <input type="number" class="material-quantity" value="1" min="1">
                </div>
            </div>
        `;
        window.currentAssignTaskId = null;
        
        // 重置添加按钮显示状态
        const addButton = document.querySelector('.add-assignment');
        if (addButton) {
            addButton.style.display = 'block';
        }
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
function toggleSubTasks(taskId) {
    const button = document.querySelector(`[onclick="toggleSubTasks(${taskId})"]`);
    const isExpanded = button.getAttribute('data-expanded') === 'true';
    const subRows = document.querySelectorAll(`tr[data-parent-id="${taskId}"]`);
    
    if (isExpanded) {
        // 收起
        subRows.forEach(row => row.style.display = 'none');
        button.setAttribute('data-expanded', 'false');
        button.innerHTML = '<i class="fas fa-chevron-down"></i>';
    } else {
        // 展开
        subRows.forEach(row => row.style.display = 'table-row');
        button.setAttribute('data-expanded', 'true');
        button.innerHTML = '<i class="fas fa-chevron-up"></i>';
    }
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


