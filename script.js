let currentMode = 'general';
let currentLangCode = 'en';
let trainingData = {};
let grammarData = {};
let selectedModel = 'standard';
let attachedFile = null;
let recognition = null;
let deviceColorScheme = null;

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'fr-CA', name: 'French (Canadian)', flag: '🇨🇦' },
    { code: 'pt', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' }
];

const modelSettings = {
    standard: {
        image: 'standard-model.png',
        notes: './TRAINING_NOTES.json'
    },
    'model-2': {
        image: 'model-2.png',
        notes: './TRAINING_NOTES_MODEL_2.json'
    },
    'model-3': {
        image: 'model-3.png',
        notes: './TRAINING_NOTES_MODEL_3.json'
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    populateLanguages();
    initializePreferences();
    deviceColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    deviceColorScheme.addEventListener('change', updateDeviceAppearance);
    await loadKnowledgeBases();
});

async function loadKnowledgeBases() {
    try {
        const grammarResponse = await fetch('./ENGLISH_AND_GRAMMAR.json');
        if (grammarResponse.ok) {
            grammarData = await grammarResponse.json();
        }
    } catch (error) {
        grammarData = {};
    }

    trainingData = await loadModelNotes('standard');
}

async function loadModelNotes(model) {
    const notesPath = modelSettings[model].notes;

    try {
        const response = await fetch(notesPath);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        return null;
    }
}

function initializePreferences() {
    const displayMode = localStorage.getItem('displayMode') || 'device';
    const textTheme = localStorage.getItem('textTheme') || 'default';
    const backgroundTheme = localStorage.getItem('backgroundTheme') || 'default';
    const agentIcon = localStorage.getItem('agentIcon') || 'robot';
    const accentColor = localStorage.getItem('accentColor') || '#0b57d0';

    document.getElementById('display-mode').value = displayMode;
    document.getElementById('text-theme').value = textTheme;
    document.getElementById('background-theme').value = backgroundTheme;
    document.getElementById('agent-icon-select').value = agentIcon;

    setDisplayMode(displayMode, false);
    setTextTheme(textTheme, false);
    setBackgroundTheme(backgroundTheme, false);
    setAgentIcon(agentIcon, false);
    document.documentElement.style.setProperty('--accent-color', accentColor);

    document.querySelectorAll('.theme-btn').forEach(button => {
        button.classList.toggle('active', button.getAttribute('onclick').includes(accentColor));
    });
}

function setDisplayMode(mode, save = true) {
    document.body.classList.remove('dark-mode', 'device-dark');

    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (mode === 'device') {
        updateDeviceAppearance();
    }

    if (save) {
        localStorage.setItem('displayMode', mode);
    }
}

function updateDeviceAppearance() {
    if (document.getElementById('display-mode').value === 'device') {
        document.body.classList.toggle('device-dark', Boolean(deviceColorScheme?.matches));
    }
}

function setTextTheme(theme, save = true) {
    document.body.classList.remove('text-serif', 'text-mono', 'text-rounded');

    if (theme !== 'default') {
        document.body.classList.add(`text-${theme}`);
    }

    if (save) {
        localStorage.setItem('textTheme', theme);
    }
}

function setBackgroundTheme(theme, save = true) {
    document.body.classList.remove('background-slate', 'background-forest', 'background-dusk');

    if (theme !== 'default') {
        document.body.classList.add(`background-${theme}`);
    }

    if (save) {
        localStorage.setItem('backgroundTheme', theme);
    }
}

function setAgentIcon(icon, save = true) {
    document.querySelectorAll('[data-agent-icon]').forEach(element => {
        element.className = 'agent-icon';
        element.removeAttribute('src');

        if (icon === 'computer') {
            element.classList.add('fa-solid', 'fa-computer');
        } else if (icon === 'logo') {
            element.className = 'agent-icon-image';
            element.src = 'agent-icon.png';
            element.alt = 'Agent logo';
            element.onerror = () => {
                element.className = 'fa-solid fa-robot agent-icon';
                element.removeAttribute('src');
            };
        } else {
            element.classList.add('fa-solid', 'fa-robot');
        }
    });

    if (save) {
        localStorage.setItem('agentIcon', icon);
    }
}

function setTheme(color, buttonElement) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.querySelectorAll('.theme-btn').forEach(button => button.classList.remove('active'));
    buttonElement.classList.add('active');
    localStorage.setItem('accentColor', color);
}

function switchMode(mode, navItem) {
    currentMode = mode;
    document.querySelectorAll('.nav-item').forEach(element => element.classList.remove('active'));

    if (navItem) {
        navItem.classList.add('active');
    }

    const title = document.getElementById('chat-title');
    const history = document.getElementById('chat-history');
    const input = document.getElementById('user-input');
    history.innerHTML = '';

    let welcomeText = '';

    if (mode === 'general') {
        title.innerText = 'General Agent';
        welcomeText = 'Hello! I am Bloxd Agent Blue. Ask me anything about Bloxd.io, survival strategies, or general mechanics!';
        input.placeholder = 'Ask anything...';
    } else if (mode === 'constructor') {
        title.innerText = 'BloxdHub Post Constructor';
        welcomeText = "Hello! I'm ready to help you construct a highly engaging BloxdHub post.";
        input.placeholder = 'Topic for your post...';
    } else if (mode === 'analyzer') {
        title.innerText = 'BloxdHub Post Analyzer';
        welcomeText = "Paste a draft of your BloxdHub post here, and I'll analyze it for engagement and clarity.";
        input.placeholder = 'Paste draft here...';
    }

    translateAndAppend(welcomeText, 'agent', 'main');
}

function openCodingEnv() {
    document.getElementById('coding-env').style.display = 'flex';
}

function closeCodingEnv() {
    document.getElementById('coding-env').style.display = 'none';
}

function toggleRightSidebar() {
    const sidebar = document.getElementById('right-sidebar');
    const showButton = document.getElementById('show-sidebar-btn');
    const isCollapsed = sidebar.classList.toggle('collapsed');
    showButton.style.display = isCollapsed ? 'block' : 'none';
}

function openSettings() {
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function setThemeFromPreference(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.querySelectorAll('.theme-btn').forEach(button => {
        button.classList.toggle('active', button.getAttribute('onclick').includes(color));
    });
}

function toggleLangDropdown() {
    document.getElementById('lang-dropdown').classList.toggle('show');
}

function populateLanguages() {
    const dropdown = document.getElementById('lang-dropdown');

    languages.forEach(language => {
        const option = document.createElement('div');
        option.className = 'lang-option';
        option.innerHTML = `<span>${language.flag}</span> ${language.name}`;
        option.onclick = () => setLanguage(language);
        dropdown.appendChild(option);
    });
}

async function setLanguage(language) {
    currentLangCode = language.code;
    document.getElementById('current-lang').innerText = language.name;
    document.getElementById('lang-dropdown').classList.remove('show');
    translateAndAppend(`Language successfully changed to ${language.name}. How can I help you?`, 'agent', 'main');
}

async function translateText(text, targetLang) {
    if (targetLang === 'en') {
        return text;
    }

    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        const data = await response.json();
        return data.responseData.translatedText;
    } catch (error) {
        return `${text} [Translation Failed]`;
    }
}

function selectModel(model) {
    selectedModel = model;
    const image = document.getElementById('model-image');
    image.style.display = '';
    image.src = modelSettings[model].image;
    image.alt = `${document.getElementById('model-select').selectedOptions[0].text} image`;
    image.onerror = () => {
        image.style.display = 'none';
    };
    localStorage.setItem('selectedModel', model);
}

function handleAttachment(event) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    const isImage = file.type.startsWith('image/');
    const isTextFile = /\.(txt|csv)$/i.test(file.name);

    if (!isImage && !isTextFile) {
        alert('Choose one image, .txt file, or .csv file.');
        event.target.value = '';
        return;
    }

    attachedFile = file;
    document.getElementById('attachment-name').textContent = file.name;
    document.getElementById('attachment-preview').classList.add('visible');
}

function clearAttachment() {
    attachedFile = null;
    document.getElementById('attachment-input').value = '';
    document.getElementById('attachment-preview').classList.remove('visible');
    document.getElementById('attachment-name').textContent = '';
}

async function toggleDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert('Voice dictation is not supported in this browser.');
        return;
    }

    const button = document.getElementById('microphone-button');

    if (recognition) {
        recognition.stop();
        recognition = null;
        button.classList.remove('recording');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = currentLangCode;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = event => {
        const input = document.getElementById('user-input');
        input.value = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ');
    };

    recognition.onerror = () => {
        button.classList.remove('recording');
        recognition = null;
    };

    recognition.onend = () => {
        button.classList.remove('recording');
        recognition = null;
    };

    button.classList.add('recording');

    try {
        recognition.start();
    } catch (error) {
        button.classList.remove('recording');
        recognition = null;
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function handleCodeKeyPress(event) {
    if (event.key === 'Enter') {
        sendCodeMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();

    if (!text && !attachedFile) {
        return;
    }

    const file = attachedFile;
    let messageText = text;

    if (file && !file.type.startsWith('image/')) {
        const fileContent = await file.text();
        messageText = `${messageText}${messageText ? '\n\n' : ''}${file.name}:\n${fileContent}`;
    }

    appendUserMessage(messageText, file);
    input.value = '';
    clearAttachment();
    showTypingIndicator('main');
    setTimeout(() => generateResponse(messageText, 'main'), 800);
}

function appendUserMessage(text, file) {
    const history = document.getElementById('chat-history');
    const message = document.createElement('div');
    message.className = 'message user';
    message.textContent = text || (file ? file.name : '');

    if (file?.type.startsWith('image/')) {
        const attachment = document.createElement('div');
        attachment.className = 'message-attachment';
        const image = document.createElement('img');
        image.src = URL.createObjectURL(file);
        image.alt = file.name;
        attachment.appendChild(image);
        message.appendChild(attachment);
    } else if (file) {
        const attachment = document.createElement('div');
        attachment.className = 'message-attachment';
        attachment.textContent = file.name;
        message.appendChild(attachment);
    }

    history.appendChild(message);
    history.scrollTop = history.scrollHeight;
}

function sendCodeMessage() {
    const input = document.getElementById('code-user-input');
    const text = input.value.trim();

    if (!text) {
        return;
    }

    appendRawMessage('user', text, 'code');
    input.value = '';
    showTypingIndicator('code');
    setTimeout(() => generateResponse(text, 'code'), 800);
}

function appendRawMessage(sender, text, target) {
    const history = target === 'main'
        ? document.getElementById('chat-history')
        : document.getElementById('code-chat-history');
    const message = document.createElement('div');
    message.className = `message ${sender}`;

    if (sender === 'agent') {
        const iconColor = target === 'code' ? '#4af626' : 'var(--accent-color)';
        const iconMarkup = target === 'code'
            ? '<i class="fa-solid fa-robot" style="color:#4af626;font-size:1.5rem;margin-top:3px;"></i>'
            : getAgentIconMarkup();
        const content = document.createElement('div');
        content.innerHTML = formatMessageText(text);
        message.innerHTML = iconMarkup;
        message.appendChild(content);

        if (target === 'code') {
            message.querySelector('i').style.color = iconColor;
        }
    } else {
        message.textContent = text;
    }

    history.appendChild(message);
    history.scrollTop = history.scrollHeight;
}

function getAgentIconMarkup() {
    const icon = localStorage.getItem('agentIcon') || 'robot';

    if (icon === 'computer') {
        return '<i class="fa-solid fa-computer agent-icon" data-agent-icon></i>';
    }

    if (icon === 'logo') {
        return '<img class="agent-icon-image" data-agent-icon src="agent-icon.png" alt="Agent logo" onerror="this.outerHTML=\'<i class=&quot;fa-solid fa-robot agent-icon&quot; data-agent-icon></i>\'">';
    }

    return '<i class="fa-solid fa-robot agent-icon" data-agent-icon></i>';
}

function formatMessageText(text) {
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    return escapedText
        .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\n/g, '<br>');
}

async function translateAndAppend(englishText, sender, target) {
    const history = target === 'main'
        ? document.getElementById('chat-history')
        : document.getElementById('code-chat-history');
    const indicator = history.querySelector('.typing-indicator');

    if (indicator) {
        indicator.remove();
    }

    const translated = await translateText(englishText, currentLangCode);
    appendRawMessage(sender, translated, target);
}

function showTypingIndicator(target) {
    const history = target === 'main'
        ? document.getElementById('chat-history')
        : document.getElementById('code-chat-history');
    const indicator = document.createElement('div');
    indicator.className = 'message agent typing-indicator';
    indicator.innerHTML = '<i class="fa-solid fa-robot" style="color:var(--text-secondary);margin-right:15px;"></i> Agent is thinking...';
    history.appendChild(indicator);
    history.scrollTop = history.scrollHeight;
}

async function generateResponse(userText, target) {
    const query = userText.toLowerCase();
    let response = '';
    const style = grammarData?.language_rules?.vocabulary_complexity || 'Advanced';
    const notes = target === 'code' && selectedModel === 'standard'
        ? trainingData
        : await loadModelNotes(selectedModel);

    if (!notes) {
        response = `The selected model's training notes are not available yet. Add the file ${modelSettings[selectedModel].notes.replace('./', '')} to enable this model.`;
    } else if (target === 'code') {
        const codeNotes = notes.submissions?.filter(submission => submission.category === 'Coding') || [];
        const match = codeNotes.find(submission =>
            submission.keywords?.some(keyword => query.includes(keyword.toLowerCase()))
        );

        response = match
            ? `Here is what I found in my documentation:\n\n${match.content}`
            : 'I can help with the Bloxd.io Code API. Ask about health, spawning, callbacks, or messages, or check the [Official Code API](https://github.com/Bloxdy/code-api).';
    } else if (currentMode === 'general') {
        const submissions = notes.submissions || [];
        const match = submissions.find(submission =>
            submission.keywords?.some(keyword => query.includes(keyword.toLowerCase()))
        );

        response = match
            ? match.content
            : `That is an interesting question about Bloxd. As a highly intelligent agent using ${style} vocabulary, I can tell you that mechanics vary by server. Try asking about Bedwars, Greenville, Moonstone, or crafting!`;
    } else if (currentMode === 'constructor') {
        response = `Drafting post...\n\n**Title: The Ultimate Guide to ${userText}**\n\nHey Bloxd community! Today I want to share my thoughts on this topic. Make sure to use proper defenses and always communicate with your team.\n\n#Bloxd #Gameplay`;
    } else if (currentMode === 'analyzer') {
        response = 'Analysis Complete:\n- **Readability**: Excellent.\n- **Engagement**: Try asking a question at the end to generate comments.\n- **Grammar Check**: Checked against my strict English rules. Looking good!';
    }

    await translateAndAppend(response, 'agent', target);
}

window.onclick = event => {
    if (!event.target.closest('.lang-selector')) {
        document.getElementById('lang-dropdown').classList.remove('show');
    }

    if (event.target.id === 'settings-modal') {
        closeSettings();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    const selectedModelPreference = localStorage.getItem('selectedModel') || 'standard';
    document.getElementById('model-select').value = selectedModelPreference;
    selectModel(selectedModelPreference);
});
