document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const apiKeySection = document.getElementById('api-key-section');
    const settingsSection = document.getElementById('settings-section');
    const resultSection = document.getElementById('result-section');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const changeApiKeyBtn = document.getElementById('change-api-key');
    const apiKeyStatus = document.getElementById('api-key-status');
    const promptInput = document.getElementById('prompt-input');
    const generateButton = document.getElementById('generate-button');
    const loadingContainer = document.querySelector('.loading-container');
    const resultContainer = document.querySelector('.result-container');
    const resultImage = document.getElementById('result-image');
    const saveImageBtn = document.getElementById('save-image');
    const newImageBtn = document.getElementById('new-image');
    const errorMessage = document.getElementById('error-message');
    
    // 設定値を保存する変数
    let settings = {
        apiKey: '',
        size: '1536x1024',
        quality: 'auto',
        model: 'gpt-image-1'
    };
    
    // ページ読み込み時の初期化
    initApp();
    
    // APIキー保存ボタンのイベントリスナー
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    
    // APIキー変更ボタンのイベントリスナー
    if (changeApiKeyBtn) {
        changeApiKeyBtn.addEventListener('click', showApiKeySection);
    }
    
    // タグクリックのイベントリスナー
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => addTagToPrompt(tag.dataset.tag));
    });
    
    // サイズ選択のイベントリスナー
    const sizeCards = document.querySelectorAll('.setting-group:nth-of-type(1) .option-card');
    sizeCards.forEach(card => {
        card.addEventListener('click', () => selectOption(card, 'size'));
    });
    
    // 品質選択のイベントリスナー
    const qualityCards = document.querySelectorAll('.setting-group:nth-of-type(2) .option-card');
    qualityCards.forEach(card => {
        card.addEventListener('click', () => selectOption(card, 'quality'));
    });
    
    // 画像生成ボタンのイベントリスナー
    generateButton.addEventListener('click', generateImage);
    
    // 画像保存ボタンのイベントリスナー
    saveImageBtn.addEventListener('click', saveImage);
    
    // 新しい画像生成ボタンのイベントリスナー
    newImageBtn.addEventListener('click', resetToSettings);
    
    // アプリの初期化
    function initApp() {
        // APIキーをlocalStorageから取得
        const storedApiKey = localStorage.getItem('openai_api_key');
        
        // APIキーが保存されているか確認
        if (storedApiKey) {
            settings.apiKey = storedApiKey;
            showSection(settingsSection);
            hideSection(apiKeySection);
        } else {
            showSection(apiKeySection);
            hideSection(settingsSection);
        }
        
        // デフォルト設定の選択状態を設定
        selectDefaultOptions();
    }
    
    // APIキーの保存
    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus(apiKeyStatus, 'APIキーを入力してください', 'error');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            showStatus(apiKeyStatus, 'APIキーの形式が正しくありません', 'error');
            return;
        }
        
        // APIキーをローカルストレージに保存
        localStorage.setItem('openai_api_key', apiKey);
        settings.apiKey = apiKey;
        
        // 成功メッセージの表示
        showStatus(apiKeyStatus, 'APIキーを保存しました', 'success');
        
        // 次のセクションへ進む
        setTimeout(() => {
            hideSection(apiKeySection);
            showSection(settingsSection);
        }, 1000);
    }
    
    // APIキー入力画面を表示
    function showApiKeySection() {
        hideSection(settingsSection);
        showSection(apiKeySection);
        
        // 保存されているAPIキーがあれば、入力フィールドに設定する
        if (settings.apiKey) {
            apiKeyInput.value = settings.apiKey;
        }
    }
    
    // タグをプロンプトに追加
    function addTagToPrompt(tag) {
        const currentText = promptInput.value.trim();
        
        if (currentText) {
            promptInput.value = currentText + '、' + tag;
        } else {
            promptInput.value = tag;
        }
        
        // フォーカスを戻す
        promptInput.focus();
    }
    
    // オプションの選択
    function selectOption(selectedCard, type) {
        // 同じグループの全カードから選択状態を解除
        const cards = selectedCard.parentElement.querySelectorAll('.option-card');
        cards.forEach(card => card.classList.remove('selected'));
        
        // 選択したカードを選択状態にする
        selectedCard.classList.add('selected');
        
        // 選択した値を設定に保存
        settings[type] = selectedCard.dataset.value;
    }
    
    // デフォルトオプションの選択
    function selectDefaultOptions() {
        // サイズのデフォルト選択
        const defaultSizeCard = document.querySelector(`.setting-group:nth-of-type(1) .option-card[data-value="${settings.size}"]`);
        if (defaultSizeCard) defaultSizeCard.classList.add('selected');
        
        // 品質のデフォルト選択
        const defaultQualityCard = document.querySelector(`.setting-group:nth-of-type(2) .option-card[data-value="${settings.quality}"]`);
        if (defaultQualityCard) defaultQualityCard.classList.add('selected');
    }
    
    // 画像生成
    async function generateImage() {
        // APIキーが設定されているか確認
        if (!settings.apiKey) {
            alert('APIキーが設定されていません。APIキーを入力してください。');
            showApiKeySection();
            return;
        }
        
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            alert('プロンプトを入力してください');
            promptInput.focus();
            return;
        }
        
        // 生成中の表示
        showSection(resultSection);
        hideSection(settingsSection);
        showElement(loadingContainer);
        hideElement(resultContainer);
        hideElement(errorMessage);
        
        try {
            // OpenAI API呼び出し
            const response = await fetch('https://api.openai.com/v1/images/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    prompt: prompt,
                    size: settings.size,
                    quality: settings.quality,
                    output_format: 'png',
                    response_format: 'b64_json'
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'APIエラーが発生しました');
            }
            
            // 画像の表示
            const imageData = data.data[0].b64_json;
            resultImage.src = `data:image/png;base64,${imageData}`;
            
            // 結果表示
            hideElement(loadingContainer);
            showElement(resultContainer);
        } catch (error) {
            console.error('Error generating image:', error);
            
            // APIキーが無効な場合、APIキー入力画面に戻る
            if (error.message && (
                error.message.includes('API key') || 
                error.message.includes('Authentication') || 
                error.message.includes('authorization')
            )) {
                alert('APIキーが無効です。正しいAPIキーを入力してください。');
                localStorage.removeItem('openai_api_key');
                settings.apiKey = '';
                showApiKeySection();
                return;
            }
            
            // エラーメッセージの表示
            hideElement(loadingContainer);
            errorMessage.textContent = `エラー: ${error.message}`;
            showElement(errorMessage);
        }
    }
    
    // 画像の保存
    function saveImage() {
        const image = resultImage.src;
        const link = document.createElement('a');
        
        // 現在の日時を取得してファイル名に使用
        const date = new Date();
        const fileName = `image_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}.png`;
        
        link.href = image;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // 設定画面に戻る
    function resetToSettings() {
        hideSection(resultSection);
        showSection(settingsSection);
    }
    
    // ユーティリティ関数
    function showSection(section) {
        section.classList.remove('hidden');
    }
    
    function hideSection(section) {
        section.classList.add('hidden');
    }
    
    function showElement(element) {
        element.classList.remove('hidden');
    }
    
    function hideElement(element) {
        element.classList.add('hidden');
    }
    
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = 'status-message ' + type;
    }
});