# Apple Music 播放器使用指南

## 项目概述

这是一个仿照Apple Music界面设计的本地音乐播放器，支持音乐文件播放、歌词显示、封面展示以及完整的播放控制功能。

## 主要功能

### 🎵 音乐播放
- 支持多种音频格式：MP3, M4A, WAV, OGG, FLAC, AAC
- 自动识别并播放music文件夹中的音乐文件
- 手动上传音乐文件功能
- 完整的播放控制（播放/暂停、上一首/下一首、随机播放等）

### 🎤 歌词支持
- 支持LRC格式歌词文件
- 实时歌词滚动高亮显示
- 点击歌词可跳转到对应时间点
- 歌词文件通过文件名自动匹配音乐文件

### 🎨 封面显示
- 支持JPG、PNG、GIF、WEBP格式的封面图片
- 推荐尺寸：128x128 或 64x64 像素的正方形图片
- 封面文件通过文件名自动匹配音乐文件
- 无封面时显示优雅的默认占位图

### 🎛️ 高级控制
- **可拖拽进度条**：支持鼠标拖拽和点击跳转
- **可拖拽音量条**：支持鼠标拖拽和点击调节
- 实时显示播放进度和剩余时间
- 音量图标根据当前音量动态变化

### 🔍 其他功能
- 实时搜索功能（按歌曲名称或艺人搜索）
- 响应式设计，支持不同屏幕尺寸
- 键盘快捷键支持（空格键播放/暂停）
- 侧边栏展开/收起功能

## 文件结构

```
music/
├── index.html          # 主页面文件
├── script.js           # JavaScript功能代码
├── styles.css          # 样式表
├── 使用指南.md         # 本使用指南
└── music/              # 音乐文件夹
    ├── [歌曲文件].mp3     # 音频文件
    ├── [歌曲文件].lrc     # 对应的歌词文件
    └── [歌曲文件].jpg     # 对应的封面图片
```

## 使用方法

### 1. 基础设置
1. 将所有文件放在同一个文件夹中
2. 创建一个名为 `music` 的子文件夹
3. 打开 `index.html` 文件即可使用

### 2. 添加音乐
有两种方式添加音乐：

#### 方式一：自动加载（推荐）
1. 将音乐文件放入 `music` 文件夹
2. 歌词和封面文件放在同一文件夹中
3. 确保文件名匹配（见文件命名规则）
4. 刷新页面，播放器会自动扫描并加载

#### 方式二：手动上传
1. 点击页面中的"手动加载音乐文件"按钮
2. 选择音乐文件、歌词文件和封面图片
3. 播放器会自动组织和匹配文件

### 3. 文件命名规则

为了确保歌词和封面正确匹配音乐文件，请遵循以下命名规则：

#### 音乐文件
```
艺人 - 歌曲名.mp3
或
歌曲名.mp3
```

#### 歌词文件
```
艺人 - 歌曲名.lrc  (与音乐文件同名，仅扩展名不同)
```

#### 封面图片
```
艺人 - 歌曲名.jpg  (与音乐文件同名，仅扩展名不同)
```

#### 示例
```
music/
├── 周杰伦 - 青花瓷.mp3
├── 周杰伦 - 青花瓷.lrc
├── 周杰伦 - 青花瓷.jpg
├── Taylor Swift - Love Story.mp3
├── Taylor Swift - Love Story.lrc
└── Taylor Swift - Love Story.png
```

### 4. 歌词格式

支持标准LRC格式歌词，示例：
```
[00:12.50]青花瓷 - 周杰伦
[00:15.20]词：方文山
[00:18.10]曲：周杰伦
[00:21.30]
[00:24.60]素胚勾勒出青花笔锋浓转淡
[00:29.80]瓶身描绘的牡丹一如你初妆
```

## 播放器操作

### 基础播放控制
- **播放/暂停**：点击中央的播放按钮或按空格键
- **上一首/下一首**：点击对应的箭头按钮
- **进度控制**：拖拽或点击进度条
- **音量控制**：拖拽或点击音量条

### 歌词交互
- **查看歌词**：播放音乐时，歌词会在右侧显示
- **跳转播放**：点击任意歌词行可跳转到对应时间点
- **自动滚动**：当前播放的歌词会自动高亮并居中显示

### 音乐库管理
- **搜索音乐**：在顶部搜索框输入歌曲名或艺人名
- **浏览音乐**：在主界面查看所有已加载的音乐
- **播放列表**：点击任意歌曲开始播放

## 技术特性

- **现代化UI设计**：仿照Apple Music的界面风格
- **响应式布局**：适配不同屏幕尺寸
- **流畅的动画效果**：包含悬停效果、过渡动画等
- **高效的文件处理**：支持大量音乐文件的管理
- **无需服务器**：纯前端实现，双击即可使用

## 浏览器兼容性

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE11及以下不支持

## 常见问题

### Q: 为什么音乐无法自动加载？
A: 由于浏览器安全限制，可能无法直接扫描本地文件夹。请使用手动上传功能或通过本地服务器运行。

### Q: 歌词不显示怎么办？
A: 确保歌词文件格式为LRC，文件名与音乐文件匹配，且编码为UTF-8。

### Q: 封面图片不显示？
A: 检查图片文件名是否与音乐文件匹配，支持的格式为JPG、PNG、GIF、WEBP。

### Q: 如何设置本地服务器？
A: 可以使用Python的http.server模块：
```bash
cd 播放器文件夹
python -m http.server 8000
```
然后访问 `http://localhost:8000`

## 更新日志

### v1.0.0 (当前版本)
- ✨ 基础音乐播放功能
- ✨ LRC歌词支持
- ✨ 封面图片显示
- ✨ 可拖拽的进度条和音量条
- ✨ 搜索和过滤功能
- ✨ 响应式设计
- ✨ 自动文件匹配系统

## 技术支持

如果在使用过程中遇到问题，请检查：
1. 文件命名是否正确
2. 浏览器是否为最新版本
3. 文件格式是否支持
4. 浏览器控制台是否有错误信息

---

**享受你的音乐时光！** 🎵
