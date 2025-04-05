// logic.js

const provider = new Web3.providers.HttpProvider('https://mainnet.conflux.validationcloud.io/v1/-IRnLxSE8r-OSt3NvVAUGK0pnUTVHF5vkCIR8Fvnpt0');
const web3 = new Web3(provider);
const BibleAddress = '0x032159631daE3397B81d5B2B39cA5A8A3dE52502';
const bibleContract = new web3.eth.Contract(ABI, BibleAddress);

// Debug: Test contract interaction
bibleContract.methods.bookCount().call()
    .then(result => console.log('bookCount:', result))
    .catch(error => console.error('bookCount error:', error));

async function getVersesFromContract(bookId, chapter) {
    try {
        const verseCount = await bibleContract.methods.getChapterInfo(bookId, chapter).call();
        const verses = [];
        for (let verse = 1; verse <= verseCount; verse++) {
            const result = await bibleContract.methods.getVerse(bookId, chapter, verse).call();
            console.log('getVerse result:', result);
            const [verseNumber, text] = [result[0], result[1]];
            console.log(`${chapter}:${verseNumber}`, text);
            verses.push({ reference: `${chapter}:${verseNumber}`, text });
        }
        return verses;
    } catch (error) {
        console.error('Error fetching verses:', error);
        throw error;
    }
}

function displayVerses(verses) {
    const container = document.getElementById('versesContainer');
    const bookSelect = document.getElementById('bookSelect');
    const bookName = bookSelect.options[bookSelect.selectedIndex].text;
    container.innerHTML = '';

    const paragraph = document.createElement('p');
    paragraph.className = 'chapter-text';

    const stitchedText = verses.map(verse => 
        `<span class="verse-reference">${verse.reference}</span> ${verse.text}`
    ).join(' ');

    paragraph.innerHTML = stitchedText;
    container.appendChild(paragraph);

    const title = document.createElement('h2');
    title.textContent = `${bookName} Chapter ${verses[0].reference.split(':')[0]}`;
    title.className = 'chapter-title';
    container.insertBefore(title, paragraph);
}

async function loadVerses() {
    const bookId = document.getElementById('bookSelect').value;
    const chapter = document.getElementById('chapterSelect').value;
    if (bookId && chapter) {
        try {
            const verses = await getVersesFromContract(bookId, chapter);
            displayVerses(verses);
        } catch (error) {
            document.getElementById('versesContainer').innerHTML = '<p>Error loading verses.</p>';
        }
    }
}

async function populateBooks() {
    const bookSelect = document.getElementById('bookSelect');
    try {
        const bookCount = await bibleContract.methods.bookCount().call();
        console.log('Raw bookCount:', bookCount);
        if (!bookCount || isNaN(Number(bookCount))) {
            throw new Error('bookCount is invalid or zero');
        }
        bookSelect.innerHTML = '<option value="">Select Book</option>';
        for (let i = 0; i < Number(bookCount); i++) {
            console.log('Calling getBookInfo for i:', i);
            const result = await bibleContract.methods.getBookInfo(i).call();
            console.log('getBookInfo result:', result);
            const { name, chapterCount } = result;
            console.log('Parsed name:', name, 'chapterCount:', chapterCount);
            const option = document.createElement('option');
            option.value = i;
            option.textContent = name;
            bookSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error populating books:', error);
        bookSelect.innerHTML = '<option value="">Error loading books</option>';
    }
}

async function populateChapters() {
    const bookId = document.getElementById('bookSelect').value;
    const chapterSelect = document.getElementById('chapterSelect');
    chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
    if (bookId !== '') {
        try {
            const result = await bibleContract.methods.getBookInfo(bookId).call();
            const { chapterCount } = result;
            for (let i = 1; i <= Number(chapterCount); i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                chapterSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error populating chapters:', error);
            chapterSelect.innerHTML = '<option value="">Error loading chapters</option>';
        }
    }
}

// Dark mode toggle functionality
const modeSwitch = document.getElementById('modeSwitch');
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    modeSwitch.textContent = isDark ? '☀️' : '🌙'; // Sun for light, moon for dark
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

// Load saved mode preference
const savedMode = localStorage.getItem('darkMode');
if (savedMode === 'enabled') {
    document.body.classList.add('dark-mode');
    modeSwitch.textContent = '☀️';
} else {
    modeSwitch.textContent = '🌙';
}

modeSwitch.addEventListener('click', toggleDarkMode);

document.getElementById('bookSelect').addEventListener('change', () => {
    populateChapters();
    loadVerses();
});
document.getElementById('chapterSelect').addEventListener('change', loadVerses);

window.onload = function() {
    populateBooks();
};