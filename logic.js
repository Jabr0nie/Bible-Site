// logic.js

const provider = new Web3.providers.HttpProvider('https://mainnet.conflux.validationcloud.io/v1/-IRnLxSE8r-OSt3NvVAUGK0pnUTVHF5vkCIR8Fvnpt0');
const web3 = new Web3(provider);
const BibleAddress = '0x9Aa6964cddC6198AF57A9bAfbd53AedCC5Dd813B';
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
    const lastButton = document.getElementById('lastButton');
    const nextButton = document.getElementById('nextButton');

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

// Dark mode toggle
const modeSwitch = document.getElementById('modeSwitch');
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = modeSwitch.querySelector('i');
    if (isDark) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

// Load saved mode
const savedMode = localStorage.getItem('darkMode');
if (savedMode === 'disabled') {
    document.body.classList.remove('dark-mode');
    modeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    document.body.classList.add('dark-mode');
    modeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
}
modeSwitch.addEventListener('click', toggleDarkMode);

// Verse sharing
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('verse-reference')) {
        const book = e.target.dataset.book;
        const chapter = e.target.dataset.chapter;
        const verse = e.target.dataset.verse;
        const url = `https://0xbible.faith/verse?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`;

        navigator.clipboard.writeText(url)
            .then(() => {
                alert('Verse link copied! Paste to share.');
            })
            .catch(err => {
                console.error('Copy failed:', err);
                if (navigator.share) {
                    navigator.share({
                        title: `${book} ${chapter}:${verse}`,
                        text: `Read ${book} ${chapter}:${verse} on 0xBible.faith`,
                        url: url
                    }).catch(err => console.error('Share failed:', err));
                } else {
                    alert('Copy failed. Share this link: ' + url);
                }
            });
    }
});

// Load verse from URL
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const book = params.get('book');
    const chapter = params.get('chapter');
    const verse = params.get('verse');
    if (book && chapter && verse) {
        // Find bookId from book name
        bibleContract.methods.bookCount().call()
            .then(count => {
                const promises = [];
                for (let i = 0; i < Number(count); i++) {
                    promises.push(bibleContract.methods.getBookInfo(i).call());
                }
                return Promise.all(promises);
            })
            .then(books => {
                const bookInfo = books.find(b => b.name.toLowerCase() === book.toLowerCase());
                if (bookInfo) {
                    const bookId = books.indexOf(bookInfo);
                    getVersesFromContract(bookId, chapter)
                        .then(verses => {
                            displayVerses(verses, bookInfo.name, bookId, chapter);
                            // Scroll to specific verse
                            const verseEl = document.querySelector(`.verse-reference[data-verse="${verse}"]`);
                            if (verseEl) verseEl.scrollIntoView({ behavior: 'smooth' });
                        });
                }
            })
            .catch(err => console.error('URL load error:', err));
    }
});

// Event listeners
document.getElementById('bookSelect').addEventListener('change', () => {
    populateChapters();
    loadVerses();
});
document.getElementById('chapterSelect').addEventListener('change', loadVerses);

// Hamburger menu
document.querySelector('.hamburger-toggle').addEventListener('click', () => {
    const menu = document.querySelector('.hamburger-menu');
    const icon = document.querySelector('.hamburger-icon');
    const close = document.querySelector('.hamburger-close');
    menu.classList.toggle('active');
    icon.style.display = menu.classList.contains('active') ? 'none' : 'block';
    close.style.display = menu.classList.contains('active') ? 'block' : 'none';
});

document.querySelectorAll('.hamburger-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.hamburger-menu').classList.remove('active');
        document.querySelector('.hamburger-icon').style.display = 'block';
        document.querySelector('.hamburger-close').style.display = 'none';
    });
});

window.onload = function() {
    populateBooks();
};