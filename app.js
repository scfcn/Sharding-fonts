class FontGallery {
    constructor() {
        this.fonts = [];
        this.loadedFonts = new Set();
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadFonts();
        this.renderFonts();
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const filterBtns = document.querySelectorAll('.filter-btn');

        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderFonts();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderFonts();
            });
        });
    }

    async loadFonts() {
        const fontDefinitions = [
            {
                id: 'zhuque-fangsong',
                name: '朱雀仿宋',
                englishName: 'Zhuque Fangsong',
                type: 'chinese',
                fontFamily: '"Zhuque Fangsong (technical preview)"',
                cssPath: './ZhuqueFangsong-Regular/result.css',
                reporterPath: './ZhuqueFangsong-Regular/reporter.json',
                sampleText: {
                    chinese: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。',
                    english: 'The quick brown fox jumps over the lazy dog.'
                }
            },
            {
                id: 'yozai-medium',
                name: '悠哉字体',
                englishName: 'Yozai Medium',
                type: 'chinese',
                fontFamily: '"Yozai Medium"',
                cssPath: './Yozai-Medium/result.css',
                reporterPath: './Yozai-Medium/reporter.json',
                sampleText: {
                    chinese: '海内存知己，天涯若比邻。',
                    english: 'Design is intelligence made visible.'
                }
            },
            {
                id: 'lxgw-wenkai',
                name: '霞鹜文楷',
                englishName: 'LXGW WenKai',
                type: 'chinese',
                fontFamily: '"LXGW WenKai"',
                cssPath: './LXGWWenKai-Regular/result.css',
                reporterPath: './LXGWWenKai-Regular/reporter.json',
                sampleText: {
                    chinese: '落霞与孤鹜齐飞，秋水共长天一色。',
                    english: 'Simplicity is the ultimate sophistication.'
                }
            },
            {
                id: 'jinghua-laosong',
                name: '京华老宋',
                englishName: 'JingHua LaoSong',
                type: 'chinese',
                fontFamily: '"JingHua LaoSong"',
                cssPath: './JingHuaLaoSong/result.css',
                sampleText: {
                    chinese: '千里之行，始于足下。',
                    english: 'A journey of a thousand miles begins with a single step.'
                }
            },
            {
                id: 'guankiap-tsingkhai',
                name: '关甲青海',
                englishName: 'GuanKiap TsingKhai',
                type: 'chinese',
                fontFamily: '"GuanKiap TsingKhai"',
                cssPath: './GuanKiapTsingKhai/result.css',
                sampleText: {
                    chinese: '学而时习之，不亦说乎？',
                    english: 'Learning without thought is labor lost.'
                }
            },
            {
                id: 'inter',
                name: 'Inter',
                englishName: 'Inter',
                type: 'english',
                fontFamily: '"Inter", sans-serif',
                cssPath: './inter/inter.css',
                sampleText: {
                    chinese: 'Inter is a variable font family carefully crafted & designed for computer screens.',
                    english: 'The quick brown fox jumps over the lazy dog. 0123456789'
                }
            }
        ];

        for (const fontDef of fontDefinitions) {
            try {
                await this.loadFont(fontDef);
            } catch (error) {
                console.error(`Failed to load font ${fontDef.name}:`, error);
                this.fonts.push({
                    ...fontDef,
                    loadStatus: 'error',
                    errorMessage: error.message
                });
            }
        }

        this.hideLoadingIndicator();
    }

    async loadFont(fontDef) {
        if (fontDef.reporterPath) {
            try {
                const response = await fetch(fontDef.reporterPath);
                if (response.ok) {
                    const data = await response.json();
                    const fontInfo = data.message?.windows || data.message?.macintosh || {};
                    
                    this.fonts.push({
                        ...fontDef,
                        loadStatus: 'loaded',
                        metadata: {
                            version: fontInfo.version?.en || 'Unknown',
                            designer: fontInfo.designer?.en || 'Unknown',
                            license: fontInfo.license?.en || 'Unknown',
                            totalSize: data.data ? this.calculateTotalSize(data.data) : null,
                            charCount: data.data ? this.calculateCharCount(data.data) : null
                        }
                    });
                    
                    this.loadFontCSS(fontDef.cssPath);
                    return;
                }
            } catch (error) {
                console.warn(`Could not load reporter for ${fontDef.name}, using fallback`);
            }
        }

        this.fonts.push({
            ...fontDef,
            loadStatus: 'loaded',
            metadata: {
                version: 'Unknown',
                designer: 'Unknown',
                license: 'Unknown'
            }
        });

        this.loadFontCSS(fontDef.cssPath);
    }

    loadFontCSS(cssPath) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        link.onload = () => {
            console.log(`Font CSS loaded: ${cssPath}`);
        };
        link.onerror = (error) => {
            console.error(`Failed to load font CSS: ${cssPath}`, error);
        };
        document.head.appendChild(link);
    }

    calculateTotalSize(data) {
        return data.reduce((total, item) => total + item.size, 0);
    }

    calculateCharCount(data) {
        return data.reduce((total, item) => {
            if (item.chars) {
                const ranges = item.chars.split(',').map(s => s.trim());
                ranges.forEach(range => {
                    if (range.startsWith('U+')) {
                        const match = range.match(/U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?/);
                        if (match) {
                            const start = parseInt(match[1], 16);
                            const end = match[2] ? parseInt(match[2], 16) : start;
                            total += (end - start + 1);
                        }
                    } else {
                        total += 1;
                    }
                });
            }
            return total;
        }, 0);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    filterFonts() {
        return this.fonts.filter(font => {
            const matchesFilter = this.currentFilter === 'all' || font.type === this.currentFilter;
            const matchesSearch = this.searchQuery === '' || 
                font.name.toLowerCase().includes(this.searchQuery) ||
                font.englishName.toLowerCase().includes(this.searchQuery);
            return matchesFilter && matchesSearch;
        });
    }

    renderFonts() {
        const fontGrid = document.getElementById('fontGrid');
        const emptyState = document.getElementById('emptyState');
        const filteredFonts = this.filterFonts();

        if (filteredFonts.length === 0) {
            fontGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        fontGrid.innerHTML = filteredFonts.map(font => this.createFontCard(font)).join('');
    }

    createFontCard(font) {
        const statusClass = font.loadStatus === 'error' ? 'error' : '';
        const statusText = font.loadStatus === 'error' ? '加载失败' : '已加载';
        const metadata = font.metadata || {};
        
        return `
            <div class="font-card" data-font-id="${font.id}">
                <div class="font-header">
                    <div>
                        <h3 class="font-name">${font.name}</h3>
                        <p class="font-meta">${font.englishName}</p>
                    </div>
                    <span class="font-badge ${font.type}">${font.type === 'chinese' ? '中文' : '英文'}</span>
                </div>
                
                <div class="font-preview">
                    <div class="preview-section">
                        <span class="preview-label">中文示例</span>
                        <p class="preview-text large" style="font-family: ${font.fontFamily}">${font.sampleText.chinese}</p>
                    </div>
                    <div class="preview-section">
                        <span class="preview-label">英文示例</span>
                        <p class="preview-text small" style="font-family: ${font.fontFamily}">${font.sampleText.english}</p>
                    </div>
                </div>
                
                <div class="font-stats">
                    <div class="stat">
                        <span class="stat-label">版本</span>
                        <span class="stat-value">${metadata.version || 'N/A'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">设计师</span>
                        <span class="stat-value">${metadata.designer || 'N/A'}</span>
                    </div>
                    ${metadata.totalSize ? `
                    <div class="stat">
                        <span class="stat-label">总大小</span>
                        <span class="stat-value">${this.formatBytes(metadata.totalSize)}</span>
                    </div>
                    ` : ''}
                    ${metadata.charCount ? `
                    <div class="stat">
                        <span class="stat-label">字符数</span>
                        <span class="stat-value">${metadata.charCount.toLocaleString()}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="load-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FontGallery();
});
