class BusinessCardProcessor {
    constructor() {
        this.apiKey = null;
        this.db = null;
        this.currentImageFile = null;
        this.currentImageUrl = null;
        this.currentExtractedData = null;
        
        this.initializeElements();
        this.initializeDatabase();
        this.bindEvents();
        this.loadSavedRecords();
        this.loadApiKey();
    }
    
    async loadApiKey() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                this.apiKey = config.openaiApiKey;
                console.log('API key loaded successfully');
            } else {
                const error = await response.json();
                console.error('Failed to load API key:', error.error);
                this.showApiKeyModal();
            }
        } catch (error) {
            console.error('Failed to fetch API configuration:', error);
            this.showApiKeyModal();
        }
    }
    
    initializeElements() {
        this.elements = {
            fileInput: document.getElementById('businessCardImage'),
            uploadZone: document.getElementById('uploadZone'),
            imagePreview: document.getElementById('imagePreview'),
            previewImage: document.getElementById('previewImage'),
            removeImageBtn: document.getElementById('removeImage'),
            processImageBtn: document.getElementById('processImage'),
            processingSection: document.getElementById('processingSection'),
            resultSection: document.getElementById('resultSection'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            copyBtns: document.querySelectorAll('.copy-btn'),
            saveBtn: document.getElementById('saveToDatabase'),
            downloadJsonBtn: document.getElementById('downloadJson'),
            downloadCsvBtn: document.getElementById('downloadCsv'),
            recordsList: document.getElementById('recordsList'),
            apiKeyModal: document.getElementById('apiKeyModal'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            cancelApiKeyBtn: document.getElementById('cancelApiKey')
        };
    }
    
    async initializeDatabase() {
        // Initialize SQLite database using sql.js
        if (typeof initSqlJs !== 'undefined') {
            const SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });
            
            // Check database version
            const dbVersion = localStorage.getItem('business_cards_db_version');
            const currentVersion = '3'; // Updated version with image_url column
            
            // Try to load existing database from localStorage
            const data = localStorage.getItem('business_cards_db');
            if (data && dbVersion === currentVersion) {
                try {
                    const uInt8Array = new Uint8Array(JSON.parse(data));
                    this.db = new SQL.Database(uInt8Array);
                    this.createTables(); // Ensure schema is up to date
                } catch (error) {
                    console.log('Failed to load existing database, creating new one...');
                    this.createNewDatabase(SQL);
                }
            } else {
                console.log('Database version mismatch or no database found, creating new one...');
                this.createNewDatabase(SQL);
            }
        }
    }
    
    createNewDatabase(SQL) {
        this.db = new SQL.Database();
        this.createTables();
        localStorage.setItem('business_cards_db_version', '3');
    }
    
    createTables() {
        if (!this.db) return;
        
        // Drop existing table if it exists to ensure clean schema
        try {
            this.db.run("DROP TABLE IF EXISTS business_cards");
        } catch (error) {
            console.log('No existing table to drop');
        }
        
        const createTableSQL = `
            CREATE TABLE business_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                company TEXT,
                department TEXT,
                position TEXT,
                phone TEXT,
                email TEXT,
                address TEXT,
                image_url TEXT,
                raw_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        this.db.run(createTableSQL);
        console.log('Database table created with image_url column');
        this.saveDatabase();
    }
    
    saveDatabase() {
        if (!this.db) return;
        
        const data = this.db.export();
        const buffer = new Uint8Array(data);
        localStorage.setItem('business_cards_db', JSON.stringify(Array.from(buffer)));
    }
    
    bindEvents() {
        // File upload events
        this.elements.uploadZone.addEventListener('click', () => {
            this.elements.fileInput.click();
        });
        
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });
        
        // Drag and drop events
        this.elements.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadZone.classList.add('dragover');
        });
        
        this.elements.uploadZone.addEventListener('dragleave', () => {
            this.elements.uploadZone.classList.remove('dragover');
        });
        
        this.elements.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadZone.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files[0]);
        });
        
        // Image controls
        this.elements.removeImageBtn.addEventListener('click', () => {
            this.resetUpload();
        });
        
        this.elements.processImageBtn.addEventListener('click', () => {
            this.processImage();
        });
        
        // Tab switching
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Copy buttons
        this.elements.copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.copyToClipboard(e.target.dataset.target);
            });
        });
        
        // Action buttons
        this.elements.saveBtn.addEventListener('click', () => {
            this.saveToDatabase();
        });
        
        this.elements.downloadJsonBtn.addEventListener('click', () => {
            this.downloadData('json');
        });
        
        this.elements.downloadCsvBtn.addEventListener('click', () => {
            this.downloadData('csv');
        });
        
        // API Key modal
        this.elements.cancelApiKeyBtn.addEventListener('click', () => {
            this.hideApiKeyModal();
        });
    }
    
    handleFileSelect(file) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください。');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('ファイルサイズは10MB以下にしてください。');
            return;
        }
        
        this.currentImageFile = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.previewImage.src = e.target.result;
            this.elements.uploadZone.style.display = 'none';
            this.elements.imagePreview.style.display = 'block';
            this.hideResultSection();
        };
        reader.readAsDataURL(file);
    }
    
    resetUpload() {
        this.currentImageFile = null;
        this.currentImageUrl = null;
        this.currentExtractedData = null;
        this.elements.fileInput.value = '';
        this.elements.uploadZone.style.display = 'flex';
        this.elements.imagePreview.style.display = 'none';
        this.hideResultSection();
        this.hideProcessingSection();
    }
    
    async processImage() {
        if (!this.currentImageFile) {
            alert('画像を選択してください。');
            return;
        }
        
        if (!this.apiKey) {
            this.showApiKeyModal();
            return;
        }
        
        this.showProcessingSection();
        
        try {
            // First upload the image to server
            const uploadResult = await this.uploadImageToServer();
            this.currentImageUrl = uploadResult.imageUrl;
            
            // Then process with OpenAI API
            const imageDataUrl = await this.fileToDataURL(this.currentImageFile);
            const extractedData = await this.callOpenAIAPI(imageDataUrl);
            this.currentExtractedData = extractedData;
            this.displayResults(extractedData);
            this.hideProcessingSection();
            this.showResultSection();
        } catch (error) {
            console.error('Error processing image:', error);
            alert('画像の処理中にエラーが発生しました: ' + error.message);
            this.hideProcessingSection();
        }
    }
    
    async uploadImageToServer() {
        const formData = new FormData();
        formData.append('image', this.currentImageFile);
        
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload image');
        }
        
        return await response.json();
    }
    
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    async callOpenAIAPI(imageData) {
        const base64Image = imageData.split(',')[1];
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `この名刺画像から以下の情報を抽出して、必ずJSON形式のみで返してください。

抽出する情報：
- name: 氏名
- company: 会社名  
- department: 部署名
- position: 役職
- phone: 電話番号
- email: メールアドレス
- address: 住所

重要：
- 情報が見つからない場合は空文字列("")を使用
- 説明文や追加テキストは一切含めない
- 以下の形式で回答:

{
  "name": "抽出された氏名",
  "company": "抽出された会社名",
  "department": "抽出された部署名", 
  "position": "抽出された役職",
  "phone": "抽出された電話番号",
  "email": "抽出されたメールアドレス",
  "address": "抽出された住所"
}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageData
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }
        
        const result = await response.json();
        const content = result.choices[0].message.content;
        
        console.log('Raw API response:', content);
        
        try {
            // First try to parse as direct JSON
            return JSON.parse(content);
        } catch (parseError) {
            console.log('Direct JSON parse failed, trying to extract JSON...');
            
            // Try to extract JSON from markdown code blocks
            let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                console.log('Found JSON in code block:', jsonMatch[1]);
                try {
                    return JSON.parse(jsonMatch[1].trim());
                } catch (e) {
                    console.log('Code block JSON parse failed:', e);
                }
            }
            
            // Try to extract JSON object from text
            jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                console.log('Found JSON object:', jsonMatch[0]);
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.log('Extracted JSON parse failed:', e);
                }
            }
            
            // If all else fails, try to create JSON from structured text
            console.log('Attempting to parse structured text...');
            return this.parseStructuredText(content);
        }
    }
    
    parseStructuredText(content) {
        // Fallback parser for non-JSON responses
        const data = {
            name: '',
            company: '',
            department: '',
            position: '',
            phone: '',
            email: '',
            address: ''
        };
        
        // Try to extract information from text
        const lines = content.split('\\n');
        for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.includes('名前') || lower.includes('氏名') || lower.includes('name')) {
                data.name = this.extractValue(line);
            } else if (lower.includes('会社') || lower.includes('company')) {
                data.company = this.extractValue(line);
            } else if (lower.includes('部署') || lower.includes('department')) {
                data.department = this.extractValue(line);
            } else if (lower.includes('役職') || lower.includes('position') || lower.includes('title')) {
                data.position = this.extractValue(line);
            } else if (lower.includes('電話') || lower.includes('phone') || lower.includes('tel')) {
                data.phone = this.extractValue(line);
            } else if (lower.includes('メール') || lower.includes('email') || lower.includes('mail')) {
                data.email = this.extractValue(line);
            } else if (lower.includes('住所') || lower.includes('address')) {
                data.address = this.extractValue(line);
            }
        }
        
        return data;
    }
    
    extractValue(line) {
        // Extract value after colon or other separators
        const separators = [':', '：', '=', '→', '-'];
        for (const sep of separators) {
            if (line.includes(sep)) {
                return line.split(sep)[1]?.trim().replace(/['"]/g, '') || '';
            }
        }
        return '';
    }
    
    displayResults(data) {
        // Update structured view
        document.getElementById('extractedName').textContent = data.name || '-';
        document.getElementById('extractedCompany').textContent = data.company || '-';
        document.getElementById('extractedDepartment').textContent = data.department || '-';
        document.getElementById('extractedPosition').textContent = data.position || '-';
        document.getElementById('extractedPhone').textContent = data.phone || '-';
        document.getElementById('extractedEmail').textContent = data.email || '-';
        document.getElementById('extractedAddress').textContent = data.address || '-';
        
        // Update JSON view
        document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);
        
        // Update CSV view
        const csvData = this.convertToCSV(data);
        document.getElementById('csvOutput').textContent = csvData;
    }
    
    convertToCSV(data) {
        const headers = ['name', 'company', 'department', 'position', 'phone', 'email', 'address'];
        const csvHeaders = ['氏名', '会社名', '部署', '役職', '電話番号', 'メールアドレス', '住所'];
        
        let csv = csvHeaders.join(',') + '\\n';
        const values = headers.map(header => `"${(data[header] || '').replace(/"/g, '""')}"`);
        csv += values.join(',');
        
        return csv;
    }
    
    switchTab(tabName) {
        this.elements.tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        this.elements.tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    async copyToClipboard(targetId) {
        const text = document.getElementById(targetId).textContent;
        try {
            await navigator.clipboard.writeText(text);
            
            const btn = document.querySelector(`[data-target="${targetId}"]`);
            const originalText = btn.textContent;
            btn.textContent = 'コピーしました！';
            
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }
    
    saveToDatabase() {
        if (!this.currentExtractedData || !this.db) {
            alert('保存するデータがありません。');
            return;
        }
        
        const data = this.currentExtractedData;
        const stmt = this.db.prepare(`
            INSERT INTO business_cards (name, company, department, position, phone, email, address, image_url, raw_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            data.name || '',
            data.company || '',
            data.department || '',
            data.position || '',
            data.phone || '',
            data.email || '',
            data.address || '',
            this.currentImageUrl || '',
            JSON.stringify(data)
        ]);
        
        stmt.free();
        this.saveDatabase();
        this.loadSavedRecords();
        
        alert('データベースに保存しました。');
    }
    
    loadSavedRecords() {
        if (!this.db) return;
        
        const stmt = this.db.prepare('SELECT * FROM business_cards ORDER BY created_at DESC LIMIT 20');
        const records = [];
        
        while (stmt.step()) {
            records.push(stmt.getAsObject());
        }
        stmt.free();
        
        this.displaySavedRecords(records);
    }
    
    displaySavedRecords(records) {
        const container = this.elements.recordsList;
        container.innerHTML = '';
        
        if (records.length === 0) {
            container.innerHTML = '<p>保存されたデータはありません。</p>';
            return;
        }
        
        records.forEach(record => {
            const card = document.createElement('div');
            card.className = 'record-card';
            
            const imageHtml = record.image_url ? 
                `<div class="record-image">
                    <img src="${record.image_url}" alt="名刺画像" onclick="this.parentElement.parentElement.querySelector('.record-image-full').style.display='block'">
                </div>
                <div class="record-image-full" style="display: none;" onclick="this.style.display='none'">
                    <img src="${record.image_url}" alt="名刺画像（拡大）">
                </div>` : '';
            
            card.innerHTML = `
                ${imageHtml}
                <div class="record-info">
                    <h4>${record.name || '氏名不明'}</h4>
                    <p><strong>会社:</strong> ${record.company || '-'}</p>
                    <p><strong>部署:</strong> ${record.department || '-'}</p>
                    <p><strong>役職:</strong> ${record.position || '-'}</p>
                    <p><strong>電話:</strong> ${record.phone || '-'}</p>
                    <p><strong>メール:</strong> ${record.email || '-'}</p>
                    <div class="record-date">保存日時: ${new Date(record.created_at).toLocaleString('ja-JP')}</div>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    downloadData(format) {
        if (!this.currentExtractedData) {
            alert('ダウンロードするデータがありません。');
            return;
        }
        
        let content, filename, mimeType;
        
        if (format === 'json') {
            content = JSON.stringify(this.currentExtractedData, null, 2);
            filename = `business_card_${Date.now()}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            content = this.convertToCSV(this.currentExtractedData);
            filename = `business_card_${Date.now()}.csv`;
            mimeType = 'text/csv';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showApiKeyModal() {
        this.elements.apiKeyModal.style.display = 'flex';
    }
    
    hideApiKeyModal() {
        this.elements.apiKeyModal.style.display = 'none';
    }
    
    saveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        if (!apiKey) {
            alert('APIキーを入力してください。');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            alert('有効なOpenAI APIキーを入力してください。');
            return;
        }
        
        alert('APIキーは.envファイルに設定してください。\n\n手順:\n1. .env.exampleを.envにコピー\n2. OPENAI_API_KEY=your-key-here を設定\n3. サーバーを再起動');
        this.hideApiKeyModal();
        this.elements.apiKeyInput.value = '';
    }
    
    showProcessingSection() {
        this.elements.processingSection.style.display = 'block';
    }
    
    hideProcessingSection() {
        this.elements.processingSection.style.display = 'none';
    }
    
    showResultSection() {
        this.elements.resultSection.style.display = 'block';
    }
    
    hideResultSection() {
        this.elements.resultSection.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load sql.js library
    const script = document.createElement('script');
    script.src = 'https://sql.js.org/dist/sql-wasm.js';
    script.onload = () => {
        new BusinessCardProcessor();
    };
    document.head.appendChild(script);
});