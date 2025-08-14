# GitHub Pages 部署指南

## 步骤1: 创建GitHub仓库

1. 访问 [GitHub](https://github.com) 并登录您的账户
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `taskmanage` (或您喜欢的名称)
   - Description: `创意生产任务管理系统`
   - 选择 "Public" (GitHub Pages 需要公开仓库)
   - 不要勾选 "Add a README file" (我们已经有了)
4. 点击 "Create repository"

## 步骤2: 推送代码到GitHub

在本地终端中执行以下命令（替换 `YOUR_USERNAME` 为您的GitHub用户名）：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/taskmanage.git

# 推送代码到GitHub
git branch -M main
git push -u origin main
```

## 步骤3: 启用GitHub Pages

1. 在GitHub仓库页面，点击 "Settings" 标签
2. 在左侧菜单中找到 "Pages"
3. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch 选择 "main"
   - Folder 选择 "/ (root)"
4. 点击 "Save"

## 步骤4: 访问您的网站

几分钟后，您的网站将在以下地址可用：
`https://YOUR_USERNAME.github.io/taskmanage/`

## 文件结构

```
taskmanage/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # JavaScript逻辑
├── README.md           # 项目说明
├── .gitignore          # Git忽略文件
└── DEPLOYMENT.md       # 部署说明
```

## 功能特性

- ✅ 任务筛选和搜索
- ✅ 多选和批量操作
- ✅ 设计师分配功能
- ✅ 上传素材管理
- ✅ 标签选择和文本解析
- ✅ 商品关联功能
- ✅ 响应式设计

## 注意事项

1. 确保仓库为公开仓库
2. 首次部署可能需要几分钟时间
3. 如果修改代码，需要重新推送：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```
