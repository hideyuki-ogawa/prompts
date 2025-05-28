document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('promptForm');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('resultSection');
    const generatedPrompt = document.getElementById('generatedPrompt');
    const copyBtn = document.getElementById('copyBtn');
    const executeBtn = document.getElementById('executeBtn');
    const executionSection = document.getElementById('executionSection');
    const executionLoading = document.getElementById('executionLoading');
    const aiResponse = document.getElementById('aiResponse');
    const copyResponseBtn = document.getElementById('copyResponseBtn');
    const templateSelect = document.getElementById('templateSelect');
    const roleInput = document.getElementById('role');
    const taskTextarea = document.getElementById('task');
    const taskCheckboxes = document.getElementById('taskCheckboxes');

    const templates = {
        email: {
            role: 'あなたはビジネスライティングのプロフェッショナルです',
            tasks: [
                '初めてお会いした方への挨拶メール',
                '訪問アポイントメントの依頼',
                '質問・問い合わせメール',
                '謝罪メール',
                'お礼・感謝のメール',
                '進捗報告メール'
            ]
        },
        codeReview: {
            role: 'あなたは経験豊富なシニアエンジニアです',
            tasks: [
                'コードの品質とベストプラクティスの確認',
                'セキュリティの脆弱性チェック',
                'パフォーマンスの最適化提案',
                'コードの可読性・保守性の評価',
                'テストカバレッジの確認',
                '設計パターンの適用確認'
            ]
        },
        analysis: {
            role: 'あなたは分析と洞察に長けたコンサルタントです',
            tasks: [
                '文書の要約と重要ポイントの抽出',
                'データの傾向分析',
                '問題点の特定と改善提案',
                '競合分析・比較検討',
                'リスク評価と対策提案',
                'ROI・効果測定の分析'
            ]
        },
        presentation: {
            role: 'あなたはプレゼンテーション設計のエキスパートです',
            tasks: [
                '魅力的なタイトルとアウトラインの作成',
                'ストーリーテリング構成の設計',
                'データビジュアライゼーションの提案',
                '聴衆に響くメッセージの作成',
                'Q&A想定問答の準備',
                'スライドデザインの改善提案'
            ]
        },
        sns: {
            role: 'あなたはSNSマーケティングのスペシャリストです',
            tasks: [
                'エンゲージメントの高い投稿文作成',
                'トレンドを活用したハッシュタグ提案',
                'フォロワー増加につながるコンテンツ企画',
                'ブランド認知向上のための投稿戦略',
                'ユーザーとの交流を促進する質問投稿',
                'キャンペーン告知の魅力的な投稿',
                'ストーリー性のある連続投稿企画',
                'インフルエンサーとのコラボ投稿案'
            ]
        },
        blog: {
            role: 'あなたは企業ブログのコンテンツライターです',
            tasks: [
                'SEOに最適化された記事タイトルと構成',
                '業界の専門知識を活かした解説記事',
                '製品・サービスの魅力を伝える記事',
                '顧客事例・成功事例の紹介記事',
                '業界トレンドの分析・解説記事',
                '会社の取り組みや文化を紹介する記事',
                'ハウツー・チュートリアル記事',
                '読者の疑問に答えるQ&A記事'
            ]
        }
    };

    templateSelect.addEventListener('change', handleTemplateChange);
    generateBtn.addEventListener('click', generatePrompt);
    copyBtn.addEventListener('click', copyToClipboard);
    executeBtn.addEventListener('click', executePrompt);
    copyResponseBtn.addEventListener('click', copyAiResponse);

    function handleTemplateChange() {
        const selectedTemplate = templateSelect.value;
        
        if (selectedTemplate === 'custom') {
            roleInput.value = '';
            taskTextarea.style.display = 'block';
            taskCheckboxes.style.display = 'none';
            taskTextarea.value = '';
        } else {
            const template = templates[selectedTemplate];
            roleInput.value = template.role;
            taskTextarea.style.display = 'none';
            taskCheckboxes.style.display = 'block';
            
            taskCheckboxes.innerHTML = '';
            template.tasks.forEach((task, index) => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'checkbox-item';
                checkboxDiv.innerHTML = `
                    <input type="checkbox" id="task_${index}" name="taskOptions" value="${task}">
                    <label for="task_${index}">${task}</label>
                `;
                taskCheckboxes.appendChild(checkboxDiv);
            });
        }
    }

    function generatePrompt() {
        const formData = new FormData(form);
        const selectedTemplate = templateSelect.value;
        
        let taskContent = '';
        if (selectedTemplate === 'custom') {
            taskContent = formData.get('task').trim();
        } else {
            const checkedTasks = Array.from(document.querySelectorAll('input[name="taskOptions"]:checked'))
                .map(cb => cb.value);
            taskContent = checkedTasks.join('\n• ');
            if (taskContent) {
                taskContent = '• ' + taskContent;
            }
        }
        
        const data = {
            role: formData.get('role').trim(),
            task: taskContent,
            context: formData.get('context').trim(),
            requirements: formData.get('requirements').trim(),
            output: formData.get('output').trim()
        };

        if (!data.task) {
            alert('タスク・目的は必須です');
            return;
        }

        const prompt = buildPrompt(data);
        displayPrompt(prompt);
    }

    function buildPrompt(data) {
        let prompt = '';
        
        if (data.role) {
            prompt += `# 役割\n${data.role}\n\n`;
        }
        
        if (data.task) {
            prompt += `# タスク\n${data.task}\n\n`;
        }
        
        if (data.context) {
            prompt += `# コンテキスト\n${data.context}\n\n`;
        }
        
        if (data.requirements) {
            prompt += `# 要件・制約\n${data.requirements}\n\n`;
        }
        
        if (data.output) {
            prompt += `# 出力形式\n${data.output}\n\n`;
        }

        prompt += `上記の内容に基づいて、適切な回答をお願いします。`;
        
        return prompt;
    }

    function displayPrompt(prompt) {
        generatedPrompt.textContent = prompt;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
        // Hide execution section when new prompt is generated
        executionSection.style.display = 'none';
    }
    
    async function executePrompt() {
        const prompt = generatedPrompt.textContent.trim();
        if (!prompt) {
            alert('プロンプトを生成してから実行してください。');
            return;
        }
        
        showExecutionLoading();
        
        try {
            const response = await fetch('/api/execute-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'プロンプトの実行に失敗しました');
            }
            
            const result = await response.json();
            displayAiResponse(result.response);
            
        } catch (error) {
            console.error('Error executing prompt:', error);
            alert('エラーが発生しました: ' + error.message);
        } finally {
            hideExecutionLoading();
        }
    }
    
    function showExecutionLoading() {
        executionSection.style.display = 'block';
        executionLoading.style.display = 'block';
        aiResponse.style.display = 'none';
        copyResponseBtn.style.display = 'none';
        executionSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function hideExecutionLoading() {
        executionLoading.style.display = 'none';
    }
    
    function displayAiResponse(response) {
        aiResponse.textContent = response;
        aiResponse.style.display = 'block';
        copyResponseBtn.style.display = 'inline-block';
    }
    
    async function copyAiResponse() {
        try {
            await navigator.clipboard.writeText(aiResponse.textContent);
            
            const originalText = copyResponseBtn.textContent;
            copyResponseBtn.textContent = 'コピーしました！';
            copyResponseBtn.classList.add('copied');
            
            setTimeout(() => {
                copyResponseBtn.textContent = originalText;
                copyResponseBtn.classList.remove('copied');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = aiResponse.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = copyResponseBtn.textContent;
            copyResponseBtn.textContent = 'コピーしました！';
            copyResponseBtn.classList.add('copied');
            
            setTimeout(() => {
                copyResponseBtn.textContent = originalText;
                copyResponseBtn.classList.remove('copied');
            }, 2000);
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(generatedPrompt.textContent);
            
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'コピーしました！';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            console.error('クリップボードへのコピーに失敗しました:', err);
            
            const textArea = document.createElement('textarea');
            textArea.value = generatedPrompt.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'コピーしました！';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }
    }

    form.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            generatePrompt();
        }
    });
});