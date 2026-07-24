// State
let currentMode = 'constructor'; // 'constructor', 'analyzer'
let trainingData = {};
let grammarData = {};

// Languages configuration
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
    { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' }
];

// Initialize
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
        console.log("Knowledge bases loaded.");
    } catch (e) {
        console.warn("Could not load JSON files. Running in fallback mode.", e);
    }
}

// UI Navigation
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const title = document.getElementById('chat-title');
    const history = document.getElementById('chat-history');
    
    history.innerHTML = ''; // Clear chat

    if (mode === 'constructor') {
        title.innerText = 'BloxdHub Post Constructor';
        addMessage('agent', "Hello! I'm ready to help you construct a highly engaging BloxdHub post based on my training notes.");
    } else if (mode === 'analyzer') {
        title.innerText = 'BloxdHub Post Analyzer';
        addMessage('agent', "Paste a draft of your BloxdHub post here, and I'll analyze it for engagement, clarity, and formatting based on community standards.");
    }
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

// Language Dropdown
function toggleLangDropdown() {
    document.getElementById('lang-dropdown').classList.toggle('show');
}

function populateLanguages() {
    const dropdown = document.getElementById('lang-dropdown');
    languages.forEach(lang => {
        const div = document.createElement('div');
        div.className = 'lang-option';
        div.innerHTML = `<span class="pixel-flag">${lang.flag}</span> ${lang.name}`;
        div.onclick = () => setLanguage(lang);
        dropdown.appendChild(div);
    });
}

function setLanguage(lang) {
    document.getElementById('current-lang').innerText = lang.name;
    document.getElementById('lang-dropdown').classList.remove('show');
    // Actual translation logic would tie into an API or local dictionary here.
    addMessage('agent', `Language changed to ${lang.name}. (Translation simulation active)`);
}

// Chat Logic
function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

function handleCodeKeyPress(e) {
    if (e.key === 'Enter') sendCodeMessage();
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';

    setTimeout(() => generateResponse(text, 'main'), 600);
}

function sendCodeMessage() {
    const input = document.getElementById('code-user-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text, 'code');
    input.value = '';

    setTimeout(() => generateResponse(text, 'code'), 600);
}

function addMessage(sender, text, target = 'main') {
    const history = target === 'main' ? document.getElementById('chat-history') : document.getElementById('code-chat-history');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    
    if (sender === 'agent') {
        div.innerHTML = `<i class="fa-solid fa-robot" style="color: var(--accent-color); font-size: 1.5rem; margin-right:15px;"></i><div>${text}</div>`;
    } else {
        div.innerText = text;
    }
    
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

// Simulated AI Logic using the JSON files
function generateResponse(userText, target) {
    let response = "";
    
    // Fallback if fetch failed
    const tone = grammarData?.tone_guidelines?.general || "professional, helpful, and concise";
    
    if (target === 'code') {
        response = `Analyzing code request based on ${tone} guidelines... Let's use the Bloxd Script API to achieve this. Open the terminal to run tests.`;
    } else if (currentMode === 'constructor') {
        const tips = trainingData?.presets?.constructor_tips || ["Use clear titles", "Add screenshots"];
        response = `Based on my training notes, here is a draft for your post: \n\n**[Title]**\n**[Content based on: "${userText}"]**\n\n*Pro tip applied: ${tips[0]}*`;
    } else if (currentMode === 'analyzer') {
        const metrics = trainingData?.presets?.analyzer_metrics || ["Formatting", "Tone"];
        response = `Analyzing your text... \n\n1. **${metrics[0]}**: Good.\n2. **${metrics[1]}**: Needs more enthusiasm.\n\nApplying grammar rules from my ENGLISH_AND_GRAMMAR.json file to suggest edits.`;
    }

    addMessage('agent', response, target);
}

// Close dropdowns if clicked outside
window.onclick = function(event) {
    if (!event.target.closest('.lang-selector')) {
        document.getElementById('lang-dropdown').classList.remove('show');
    }
}
