class AppleMusicPlayer {
    constructor() {
        // 音频播放相关
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentSongIndex = -1;
        this.playlist = [];
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.7;
        this.isDragging = false;
        
        // 歌词相关
        this.lyrics = [];
        this.currentLyricIndex = -1;
        
        // 文件存储
        this.musicLibrary = new Map(); // 存储音乐文件 filename -> file path
        this.lyricsLibrary = new Map(); // 存储歌词文件 filename -> lyrics content
        this.coversLibrary = new Map(); // 存储封面文件 filename -> image path
        
        // 音乐文件夹路径
        this.musicFolderPath = './music/';
        
        this.init();
    }
    
    init() {
        this.setupAudioEvents();
        this.bindEvents();
        this.updateVolumeDisplay();
        this.audio.volume = this.volume;
        // 自动加载music文件夹中的音乐
        this.loadMusicFolder();
    }
    
    setupAudioEvents() {
        // 音频加载完成
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateProgress();
        });
        
        // 播放时间更新
        this.audio.addEventListener('timeupdate', () => {
            if (!this.isDragging) {
                this.currentTime = this.audio.currentTime;
                this.updateProgress();
                this.updateLyrics();
            }
        });
        
        // 播放结束
        this.audio.addEventListener('ended', () => {
            this.nextSong();
        });
        
        // 音频可以播放
        this.audio.addEventListener('canplay', () => {
            this.updateProgress();
        });
        
        // 音频错误
        this.audio.addEventListener('error', (e) => {
            console.error('音频播放错误:', e);
        });
    }
    
    bindEvents() {
        // 文件输入
        const musicFiles = document.getElementById('musicFiles');
        if (musicFiles) {
            musicFiles.addEventListener('change', (e) => this.handleFileInput(e));
        }
        
        // 播放控制按钮
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
        
        // 上一首/下一首按钮
        const prevBtn = document.querySelector('.control-btn .fa-step-backward');
        const nextBtn = document.querySelector('.control-btn .fa-step-forward');
        if (prevBtn && prevBtn.parentElement) {
            prevBtn.parentElement.addEventListener('click', () => this.previousSong());
        }
        if (nextBtn && nextBtn.parentElement) {
            nextBtn.parentElement.addEventListener('click', () => this.nextSong());
        }
        
        // 进度条事件
        this.setupProgressBar();
        
        // 音量控制事件
        this.setupVolumeControl();
        
        // 侧边栏切换
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // 搜索功能
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.search(e.target.value));
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });
    }
    
    setupProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        const progressThumb = document.querySelector('.progress-thumb');
        
        if (!progressBar || !progressThumb) return;
        
        // 点击进度条跳转
        progressBar.addEventListener('click', (e) => {
            if (this.duration > 0) {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const progress = clickX / rect.width;
                this.seekTo(progress * this.duration);
            }
        });
        
        // 拖拽进度条
        let isDragging = false;
        
        progressThumb.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.isDragging = true;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && this.duration > 0) {
                const rect = progressBar.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const progress = x / rect.width;
                const newTime = progress * this.duration;
                this.updateProgressDisplay(progress);
                this.currentTime = newTime;
                const currentTimeEl = document.getElementById('currentTime');
                if (currentTimeEl) {
                    currentTimeEl.textContent = this.formatTime(newTime);
                }
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.isDragging = false;
                this.seekTo(this.currentTime);
            }
        });
    }
    
    setupVolumeControl() {
        const volumeBar = document.querySelector('.volume-bar');
        const volumeThumb = document.querySelector('.volume-thumb');
        
        if (!volumeBar || !volumeThumb) return;
        
        // 点击音量条
        volumeBar.addEventListener('click', (e) => {
            const rect = volumeBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, clickX / rect.width));
            this.setVolume(volume);
        });
        
        // 拖拽音量条
        let isDraggingVolume = false;
        
        volumeThumb.addEventListener('mousedown', (e) => {
            isDraggingVolume = true;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDraggingVolume) {
                const rect = volumeBar.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const volume = x / rect.width;
                this.setVolume(volume);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDraggingVolume = false;
        });
    }
    
    async handleFileInput(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            const fileName = file.name;
            const baseName = this.getBaseName(fileName);
            const extension = this.getFileExtension(fileName);
            
            if (this.isAudioFile(extension)) {
                // 处理音频文件
                this.musicLibrary.set(baseName, file);
            } else if (extension === 'lrc') {
                // 处理歌词文件
                const content = await this.readTextFile(file);
                this.lyricsLibrary.set(baseName, content);
            } else if (this.isImageFile(extension)) {
                // 处理封面文件
                const imageUrl = URL.createObjectURL(file);
                this.coversLibrary.set(baseName, imageUrl);
            }
        }
        
        this.updatePlaylist();
        this.updateMusicList();
    }
    
    getBaseName(fileName) {
        return fileName.replace(/\.[^/.]+$/, '');
    }
    
    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }
    
    isAudioFile(extension) {
        return ['mp3', 'm4a', 'wav', 'ogg', 'flac', 'aac'].includes(extension);
    }
    
    isImageFile(extension) {
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
    }
    
    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file, 'utf-8');
        });
    }
    
    updatePlaylist() {
        this.playlist = Array.from(this.musicLibrary.keys()).map(baseName => {
            const musicFile = this.musicLibrary.get(baseName);
            const lyricsContent = this.lyricsLibrary.get(baseName);
            const coverUrl = this.coversLibrary.get(baseName);
            
            const songInfo = this.extractMetadataFromFilename(musicFile.name);
            
            return {
                id: baseName,
                title: songInfo.title,
                artist: songInfo.artist,
                file: musicFile,
                lyrics: lyricsContent ? this.parseLyrics(lyricsContent) : [],
                cover: coverUrl || null,
                duration: 0 // 将在播放时获取
            };
        });
    }
    
    extractMetadataFromFilename(filename) {
        const baseName = this.getBaseName(filename);
        
        // 尝试解析 "艺人 - 歌名" 格式
        if (baseName.includes(' - ')) {
            const [artist, title] = baseName.split(' - ');
            return { artist: artist.trim(), title: title.trim() };
        }
        
        // 如果没有分隔符，将整个文件名作为歌曲标题
        return { artist: '未知艺人', title: baseName };
    }
    
    parseLyrics(lrcContent) {
        const lyrics = [];
        const lines = lrcContent.split('\n');
        
        for (const line of lines) {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
            if (match) {
                const [, minutes, seconds, centiseconds, text] = match;
                const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
                if (text.trim()) {
                    lyrics.push({ time, text: text.trim() });
                }
            }
        }
        
        return lyrics.sort((a, b) => a.time - b.time);
    }
    
    updateMusicList() {
        const musicList = document.getElementById('musicList');
        const musicCount = document.getElementById('musicCount');
        
        musicCount.textContent = this.playlist.length;
        
        if (this.playlist.length === 0) {
            musicList.innerHTML = `
                <div class="empty-library">
                    <i class="fas fa-music"></i>
                    <p>还没有添加任何音乐</p>
                    <p>点击上方的"加载音乐文件"按钮添加您的音乐</p>
                </div>
            `;
            return;
        }
        
        musicList.innerHTML = this.playlist.map((song, index) => `
            <div class="music-item" data-index="${index}">
                <div class="music-cover">
                    ${song.cover 
                        ? `<img src="${song.cover}" alt="封面">` 
                        : `<div class="default-cover">♪</div>`
                    }
                </div>
                <div class="music-info">
                    <div class="music-title">${song.title}</div>
                    <div class="music-artist">${song.artist}</div>
                </div>
                <div class="music-duration">-:--</div>
                <div class="music-actions">
                    <button class="action-btn play-music-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // 绑定音乐项点击事件
        musicList.querySelectorAll('.music-item').forEach((item, index) => {
            item.addEventListener('click', () => this.playMusicByIndex(index));
        });
    }
    
    async playMusicByIndex(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        const song = this.playlist[index];
        this.currentSongIndex = index;
        
        // 更新播放状态显示
        this.updatePlayingState();
        
        try {
            // 创建音频URL
            let audioUrl;
            if (song.file.type === 'url') {
                // 自动加载的文件使用路径
                audioUrl = song.file.path;
            } else {
                // 手动上传的文件使用Blob URL
                audioUrl = URL.createObjectURL(song.file);
            }
            
            this.audio.src = audioUrl;
            
            // 更新UI
            this.updateCurrentSongInfo(song);
            this.updateLyricsDisplay(song.lyrics);
            this.showNowPlayingSection();
            
            // 开始播放
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
            
        } catch (error) {
            console.error('播放音乐失败:', error);
        }
    }
    
    updatePlayingState() {
        // 移除所有播放状态
        document.querySelectorAll('.music-item').forEach(item => {
            item.classList.remove('playing');
        });
        
        // 添加当前播放状态
        if (this.currentSongIndex >= 0) {
            const currentItem = document.querySelector(`[data-index="${this.currentSongIndex}"]`);
            if (currentItem) {
                currentItem.classList.add('playing');
            }
        }
    }
    
    updateCurrentSongInfo(song) {
        // 更新底部播放器显示
        document.getElementById('currentSongTitle').textContent = song.title;
        document.getElementById('currentSongArtist').textContent = song.artist;
        
        const coverImg = document.getElementById('currentSongCover');
        if (song.cover) {
            coverImg.src = song.cover;
        } else {
            coverImg.src = 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                    <rect width="60" height="60" fill="url(#grad)"/>
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <text x="30" y="35" text-anchor="middle" fill="white" font-size="24" font-family="Arial">♪</text>
                </svg>
            `);
        }
        
        // 更新大封面显示
        const largeCover = document.getElementById('largeCover');
        const largeSongTitle = document.getElementById('largeSongTitle');
        const largeSongArtist = document.getElementById('largeSongArtist');
        
        if (song.cover) {
            largeCover.src = song.cover;
        } else {
            largeCover.src = 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
                    <rect width="300" height="300" fill="url(#grad)"/>
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <text x="150" y="170" text-anchor="middle" fill="white" font-size="80" font-family="Arial">♪</text>
                </svg>
            `);
        }
        
        largeSongTitle.textContent = song.title;
        largeSongArtist.textContent = song.artist;
    }
    
    updateLyricsDisplay(lyrics) {
        const lyricsDisplay = document.getElementById('lyricsDisplay');
        this.lyrics = lyrics;
        
        if (lyrics && lyrics.length > 0) {
            lyricsDisplay.innerHTML = lyrics.map((lyric, index) => 
                `<div class="lyrics-line" data-time="${lyric.time}" data-index="${index}">${lyric.text}</div>`
            ).join('');
            
            // 绑定歌词点击事件
            lyricsDisplay.querySelectorAll('.lyrics-line').forEach((line, index) => {
                line.addEventListener('click', () => {
                    const time = parseFloat(line.dataset.time);
                    this.seekTo(time);
                });
            });
        } else {
            lyricsDisplay.innerHTML = '<p class="no-lyrics">暂无歌词</p>';
        }
    }
    
    showNowPlayingSection() {
        const nowPlayingSection = document.getElementById('nowPlayingSection');
        nowPlayingSection.style.display = 'block';
    }
    
    updateLyrics() {
        if (!this.lyrics || this.lyrics.length === 0) return;
        
        let currentIndex = -1;
        for (let i = 0; i < this.lyrics.length; i++) {
            if (this.currentTime >= this.lyrics[i].time) {
                currentIndex = i;
            } else {
                break;
            }
        }
        
        if (currentIndex !== this.currentLyricIndex) {
            this.currentLyricIndex = currentIndex;
            
            // 更新歌词高亮
            document.querySelectorAll('.lyrics-line').forEach((line, index) => {
                line.classList.remove('current', 'passed');
                if (index === currentIndex) {
                    line.classList.add('current');
                    // 滚动到当前歌词
                    line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (index < currentIndex) {
                    line.classList.add('passed');
                }
            });
        }
    }
    
    togglePlayPause() {
        if (this.audio.src) {
            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
            } else {
                this.audio.play();
                this.isPlaying = true;
            }
            this.updatePlayPauseButton();
        } else if (this.playlist.length > 0) {
            // 如果没有当前播放的歌曲，播放第一首
            this.playMusicByIndex(0);
        }
    }
    
    updatePlayPauseButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn.querySelector('i');
        icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
    
    previousSong() {
        if (this.playlist.length === 0) return;
        
        const newIndex = this.currentSongIndex <= 0 
            ? this.playlist.length - 1 
            : this.currentSongIndex - 1;
        
        this.playMusicByIndex(newIndex);
    }
    
    nextSong() {
        if (this.playlist.length === 0) return;
        
        const newIndex = this.currentSongIndex >= this.playlist.length - 1 
            ? 0 
            : this.currentSongIndex + 1;
        
        this.playMusicByIndex(newIndex);
    }
    
    seekTo(time) {
        this.audio.currentTime = time;
        this.currentTime = time;
        this.updateProgress();
    }
    
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressThumb = document.getElementById('progressThumb');
        const currentTimeDisplay = document.getElementById('currentTime');
        const totalTimeDisplay = document.getElementById('totalTime');
        
        if (this.duration > 0) {
            const progress = (this.currentTime / this.duration) * 100;
            this.updateProgressDisplay(progress / 100);
        }
        
        currentTimeDisplay.textContent = this.formatTime(this.currentTime);
        totalTimeDisplay.textContent = this.formatTime(this.duration);
    }
    
    updateProgressDisplay(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressThumb = document.getElementById('progressThumb');
        
        const percentage = progress * 100;
        progressFill.style.width = `${percentage}%`;
        progressThumb.style.left = `${percentage}%`;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.updateVolumeDisplay();
    }
    
    updateVolumeDisplay() {
        const volumeFill = document.querySelector('.volume-fill');
        const volumeThumb = document.querySelector('.volume-thumb');
        const volumeBtn = document.querySelector('.volume-btn i');
        
        const percentage = this.volume * 100;
        volumeFill.style.width = `${percentage}%`;
        volumeThumb.style.left = `${percentage}%`;
        
        // 更新音量图标
        if (this.volume === 0) {
            volumeBtn.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            volumeBtn.className = 'fas fa-volume-down';
        } else {
            volumeBtn.className = 'fas fa-volume-up';
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    search(query) {
        if (query.length < 2) {
            // 清除搜索高亮
            document.querySelectorAll('.music-item').forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }
        
        const searchTerm = query.toLowerCase();
        document.querySelectorAll('.music-item').forEach(item => {
            const title = item.querySelector('.music-title').textContent.toLowerCase();
            const artist = item.querySelector('.music-artist').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || artist.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // 自动加载music文件夹
    async loadMusicFolder() {
        try {
            console.log('开始自动扫描music文件夹...');
            
            // 实际的文件列表（根据当前music文件夹内容）
            const actualFiles = [
                // 音频文件
                { name: 'demo.mp3', type: 'audio' },
                { name: '石头 _ 张晓棠 - 弱水三千.ogg', type: 'audio' },
                
                // 歌词文件
                { name: 'demo.lrc', type: 'lyrics' },
                { name: '石头 _ 张晓棠 - 弱水三千.lrc', type: 'lyrics' },
                
                // 封面文件
                { name: '石头 _ 张晓棠 - 弱水三千.png', type: 'cover' }
            ];
            
            let loadedCount = 0;
            
            // 尝试加载每个文件
            for (const fileInfo of actualFiles) {
                try {
                    await this.loadFileFromPath(fileInfo.name, fileInfo.type);
                    loadedCount++;
                } catch (error) {
                    console.log(`文件 ${fileInfo.name} 不存在或无法加载:`, error.message);
                }
            }
            
            // 尝试动态扫描其他可能的文件
            await this.scanMusicDirectory();
            
            // 更新播放列表
            this.updateAutoLoadedPlaylist();
            this.updateMusicList();
            
            if (loadedCount > 0) {
                console.log(`成功加载 ${loadedCount} 个文件`);
            }
            
        } catch (error) {
            console.log('自动加载music文件夹失败:', error);
            this.showEmptyLibraryMessage();
            this.showManualLoadOption();
        }
    }
    
    async loadFileFromPath(fileName, type) {
        const filePath = this.musicFolderPath + fileName;
        const baseName = this.getBaseName(fileName);
        
        console.log(`尝试加载文件: ${fileName}, 类型: ${type}, 路径: ${filePath}`);
        
        try {
            if (type === 'audio') {
                // 验证音频文件是否存在
                const audio = new Audio(filePath);
                audio.preload = 'metadata';
                
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.error(`音频文件加载超时: ${fileName}`);
                        reject(new Error('音频文件加载超时'));
                    }, 5000);
                    
                    audio.addEventListener('loadedmetadata', () => {
                        clearTimeout(timeout);
                        this.musicLibrary.set(baseName, {
                            name: fileName,
                            path: filePath,
                            type: 'url'
                        });
                        console.log(`成功加载音频文件: ${fileName}, 时长: ${audio.duration}秒`);
                        resolve();
                    });
                    
                    audio.addEventListener('error', (e) => {
                        clearTimeout(timeout);
                        console.error(`音频文件加载失败: ${fileName}`, e);
                        reject(new Error(`音频文件无法加载: ${e.message || 'Unknown error'}`));
                    });
                    
                    console.log(`设置音频源: ${filePath}`);
                    audio.src = filePath;
                });
                
            } else if (type === 'lyrics') {
                // 加载歌词文件
                const response = await fetch(filePath);
                if (response.ok) {
                    const lyricsContent = await response.text();
                    this.lyricsLibrary.set(baseName, lyricsContent);
                    console.log(`成功加载歌词文件: ${fileName}`);
                } else {
                    throw new Error(`歌词文件响应错误: ${response.status}`);
                }
                
            } else if (type === 'cover') {
                // 验证封面图片是否存在
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        this.coversLibrary.set(baseName, filePath);
                        console.log(`成功加载封面文件: ${fileName}`);
                        resolve();
                    };
                    img.onerror = () => {
                        reject(new Error('封面图片无法加载'));
                    };
                    img.src = filePath;
                });
            }
        } catch (error) {
            throw new Error(`加载文件失败: ${error.message}`);
        }
    }
    
    async scanMusicDirectory() {
        // 尝试获取music目录的文件列表（需要服务器支持目录列表）
        try {
            const response = await fetch(this.musicFolderPath);
            const text = await response.text();
            
            // 简单的HTML解析来获取文件链接
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            for (const link of links) {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('..') && !href.startsWith('/') && href !== './') {
                    const fileName = decodeURIComponent(href);
                    const extension = this.getFileExtension(fileName);
                    
                    if (this.isAudioFile(extension)) {
                        await this.loadFileFromPath(fileName, 'audio');
                    } else if (extension === 'lrc') {
                        await this.loadFileFromPath(fileName, 'lyrics');
                    } else if (this.isImageFile(extension)) {
                        await this.loadFileFromPath(fileName, 'cover');
                    }
                }
            }
        } catch (error) {
            console.log('动态扫描目录失败，使用预定义文件列表:', error.message);
        }
    }
    
    updateAutoLoadedPlaylist() {
        this.playlist = Array.from(this.musicLibrary.keys()).map(baseName => {
            const musicFile = this.musicLibrary.get(baseName);
            const lyricsContent = this.lyricsLibrary.get(baseName);
            const coverPath = this.coversLibrary.get(baseName);
            
            // 从文件名提取歌曲信息
            const songInfo = this.extractMetadataFromFilename(musicFile.name);
            
            return {
                id: baseName,
                title: songInfo.title,
                artist: songInfo.artist,
                file: musicFile,
                lyrics: lyricsContent ? this.parseLyrics(lyricsContent) : [],
                cover: coverPath || null,
                duration: 0 // 将在播放时获取
            };
        });
        
        console.log(`成功创建播放列表，共 ${this.playlist.length} 首歌曲`);
    }
    
    showEmptyLibraryMessage() {
        const musicList = document.getElementById('musicList');
        const musicCount = document.getElementById('musicCount');
        
        musicCount.textContent = '0';
        musicList.innerHTML = `
            <div class="empty-library">
                <i class="fas fa-music"></i>
                <p>music文件夹中没有找到音乐文件</p>
                <p>请将音乐文件、歌词文件(*.lrc)和封面图片放入music文件夹中</p>
                <p>支持的音乐格式: MP3, M4A, WAV, OGG, FLAC, AAC</p>
                <p>支持的图片格式: JPG, PNG, GIF, WEBP</p>
            </div>
        `;
    }
    
    showManualLoadOption() {
        // 隐藏自动扫描状态，显示手动加载按钮
        const autoLoadStatus = document.querySelector('.auto-load-status');
        const manualLoadBtn = document.querySelector('.manual-load-btn');
        
        if (autoLoadStatus) {
            autoLoadStatus.style.display = 'none';
        }
        
        if (manualLoadBtn) {
            manualLoadBtn.style.display = 'inline-flex';
            console.log('显示手动加载按钮');
        }
    }
}

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new AppleMusicPlayer();
    
    // 添加页面加载动画
    const elements = document.querySelectorAll('.album-card, .music-item');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
    
    // 悬停效果增强
    const cards = document.querySelectorAll('.album-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // 按钮点击反馈
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});
