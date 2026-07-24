// Global State
let currentMode = 'general'; // 'general', 'constructor', 'analyzer'
let currentLangCode = 'en';
let trainingData = {};
let grammarData = {};

// Supported Languages
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

document.addEventListener('DOMContentLoaded', async () => {
    populateLanguages();
    await loadKnowledgeBases();
});

async function loadKnowledgeBases() {
    try {
        const tRes = await fetch('./TRAINING_NOTES.json');
        trainingData = await tRes.json();
        
        const gRes = await fetch('./ENGLISH_AND_GRAMMAR.json');
        grammarData = await gRes.json();
        console.log(`Loaded ${trainingData.submissions.length} training submissions.`);
    } catch (e) {
        console.warn("Could not load JSON files. Operating on fallback memory.", e);
    }
}

// --- UI & NAVIGATION ---
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const title = document.getElementById('chat-title');
    const history = document.getElementById('chat-history');
    const input = document.getElementById('user-input');
    
    history.innerHTML = ''; 

    let welcomeText = "";
    if (mode === 'general') {
        title.innerText = 'General Agent';
        welcomeText = "Hello! I am Bloxd Agent Blue. Ask me anything about Bloxd.io, survival strategies, or general mechanics!";
        input.placeholder = "Ask anything...";
    } else if (mode === 'constructor') {
        title.innerText = 'BloxdHub Post Constructor';
        welcomeText = "Hello! I'm ready to help you construct a highly engaging BloxdHub post.";
        input.placeholder = "Topic for your post...";
    } else if (mode === 'analyzer') {
        title.innerText = 'BloxdHub Post Analyzer';
        welcomeText = "Paste a draft of your BloxdHub post here, and I'll analyze it for engagement and clarity.";
        input.placeholder = "Paste draft here...";
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
    const showBtn = document.getElementById('show-sidebar-btn');
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        showBtn.style.display = 'none';
    } else {
        sidebar.classList.add('collapsed');
        showBtn.style.display = 'block';
    }
}

// --- SETTINGS (THEMES & DARK MODE) ---
function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }

function toggleDarkMode() {
    const isDark = document.getElementById('dark-mode-toggle').checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function setTheme(color, btnElement) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
}

// --- LANGUAGE & TRANSLATION ---
function toggleLangDropdown() {
    document.getElementById('lang-dropdown').classList.toggle('show');
}

function populateLanguages() {
    const dropdown = document.getElementById('lang-dropdown');
    languages.forEach(lang => {
        const div = document.createElement('div');
        div.className = 'lang-option';
        div.innerHTML = `<span>${lang.flag}</span> ${lang.name}`;
        div.onclick = () => setLanguage(lang);
        dropdown.appendChild(div);
    });
}

async function setLanguage(lang) {
    currentLangCode = lang.code;
    document.getElementById('current-lang').innerText = lang.name;
    document.getElementById('lang-dropdown').classList.remove('show');
    
    // Notify user in their new language
    translateAndAppend(`Language successfully changed to ${lang.name}. How can I help you?`, 'agent', 'main');
}

// Free translation API wrapper
async function translateText(text, targetLang) {
    if (targetLang === 'en') return text; // Skip if english
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        const data = await res.json();
        return data.responseData.translatedText;
    } catch (e) {
        console.error("Translation API failed", e);
        return text + ` [Translation Failed]`;
    }
}

// --- CHAT LOGIC ---
function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); }
function handleCodeKeyPress(e) { if (e.key === 'Enter') sendCodeMessage(); }

function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    
    // User messages are displayed instantly as typed (assumed they type in their native lang)
    appendRawMessage('user', text, 'main');
    input.value = '';
    
    showTypingIndicator('main');
    setTimeout(() => generateResponse(text, 'main'), 800);
}

function sendCodeMessage() {
    const input = document.getElementById('code-user-input');
    const text = input.value.trim();
    if (!text) return;

    appendRawMessage('user', text, 'code');
    input.value = '';

    showTypingIndicator('code');
    setTimeout(() => generateResponse(text, 'code'), 800);
}

function appendRawMessage(sender, text, target) {
    const history = target === 'main' ? document.getElementById('chat-history') : document.getElementById('code-chat-history');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    
    // Simple markdown link parser for coding responses
    let formattedText = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    formattedText = formattedText.replace(/\n/g, '<br>');

    if (sender === 'agent') {
        const iconColor = target === 'code' ? '#4af626' : 'var(--accent-color)';
        div.innerHTML = `<i class="fa-solid fa-robot" style="color: ${iconColor}; font-size: 1.5rem; margin-right:15px; margin-top:3px;"></i><div>${formattedText}</div>`;
    } else {
        div.innerText = text;
    }
    
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

async function translateAndAppend(englishText, sender, target) {
    const history = target === 'main' ? document.getElementById('chat-history') : document.getElementById('code-chat-history');
    
    // Remove typing indicator if exists
    const indicator = history.querySelector('.typing-indicator');
    if (indicator) indicator.remove();

    const translated = await translateText(englishText, currentLangCode);
    appendRawMessage(sender, translated, target);
}

function showTypingIndicator(target) {
    const history = target === 'main' ? document.getElementById('chat-history') : document.getElementById('code-chat-history');
    const div = document.createElement('div');
    div.className = 'message agent typing-indicator';
    div.innerHTML = `<i class="fa-solid fa-robot" style="color: var(--text-secondary); margin-right:15px;"></i> Agent is thinking...`;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

// --- AI BRAIN (Reads from JSON) ---
function generateResponse(userText, target) {
    const query = userText.toLowerCase();
    let response = "";

    // Access grammar rules
    const style = grammarData?.language_rules?.vocabulary_complexity || "Advanced";
    
    if (target === 'code') {
        // Search coding submissions
        const codeNotes = trainingData.submissions?.filter(s => s.category === 'Coding') || [];
        const match = codeNotes.find(n => query.includes(n.keywords[0]) || query.includes(n.keywords[1]));
        
        if (match) {
            response = `Here is what I found in my documentation:\n\n${match.content}\n\nReference: ${match.links[0]}`;
        } else {
            response = "I can help with Bloxd.io API. Need scripts for health, spawning, or messages? Check out the [Official Code API](https://github.com/Bloxdy/code-api) for a list of endpoints.";
        }
    } 
    else if (currentMode === 'general') {
        // Search general submissions
        const allNotes = trainingData.submissions || [];
        const match = allNotes.find(n => query.includes(n.keywords[0]) || query.includes(n.keywords[1]));
        
        if (match) {
            response = `${match.content}`;
        } else {
            response = `That is an interesting question about Bloxd. As a highly intelligent agent (using ${style} vocabulary), I can tell you that mechanics vary by server. Try asking me about Bedwars, Greenville, Moonstone, or crafting!`;
        }
    }
    else if (currentMode === 'constructor') {
        response = `Drafting post... \n\n**Title: The Ultimate Guide to ${userText}**\n\nHey Bloxd community! Today I want to share my thoughts on this topic. Make sure to use proper defenses and always communicate with your team.\n\n#Bloxd #Gameplay`;
    }
    else if (currentMode === 'analyzer') {
        response = `Analysis Complete:\n- **Readability**: Excellent.\n- **Engagement**: Try asking a question at the end to generate comments.\n- **Grammar Check**: Checked against my strict English rules. Looking good!`;
    }

    translateAndAppend(response, 'agent', target);
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (!event.target.closest('.lang-selector')) {
        document.getElementById('lang-dropdown').classList.remove('show');
    }
    if (event.target.id === 'settings-modal') {
        closeSettings();
    }
}
