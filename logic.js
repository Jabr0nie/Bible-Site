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
            console.log('getVersesFromContract - BookId:', bookId, 'Chapter:', chapter, 'VerseCount:', verseCount); // Debug log
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

    async function displayVerses(verses, bookName, bookId, chapter) {
        const container = document.getElementById('versesContainer');
        if (!container) {
            console.error('versesContainer element not found');
            return;
        }
    
        container.innerHTML = '';
    
        const paragraph = document.createElement('p');
        paragraph.className = 'chapter-text';
    
        const stitchedText = verses.map(verse => {
            const [ch, vs] = verse.reference.split(':');
            console.log('displayVerses - Verse:', verse.reference, 'Book:', bookName, 'BookId:', bookId, 'Chapter:', ch, 'Verse:', vs); // Debug log
            return `<span class="verse-reference" data-book="${bookName}" data-book-id="${bookId}" data-chapter="${ch}" data-verse="${vs}">${verse.reference}</span> ${verse.text}`;
        }).join(' ');
    
        paragraph.innerHTML = stitchedText;
        container.appendChild(paragraph);
    
        const title = document.createElement('h2');
        title.textContent = `${bookName} Chapter ${chapter}`;
        title.className = 'chapter-title';
        container.insertBefore(title, paragraph);
    }
    async function loadVerses() {
        const bookSelect = document.getElementById('bookSelect');
        const chapterSelect = document.getElementById('chapterSelect');
    
        if (!bookSelect || !chapterSelect) {
            console.error('Missing bookSelect or chapterSelect elements');
            return;
        }
    
        const bookId = bookSelect.value;
        const bookName = bookSelect.options[bookSelect.selectedIndex]?.text || '';
        const chapter = chapterSelect.value;
    
        console.log('loadVerses - BookId:', bookId, 'BookName:', bookName, 'Chapter:', chapter); // Debug log
    
        if (bookId && chapter && bookName) {
            try {
                const verses = await getVersesFromContract(bookId, chapter);
                await displayVerses(verses, bookName, bookId, chapter);
            } catch (error) {
                document.getElementById('versesContainer').innerHTML = '<p>Error loading verses.</p>';
                console.error('Load verses error:', error);
            }
        } else {
            console.error('Missing required values:', { bookId, bookName, chapter });
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

// Verse sharing - Post verse text directly to X with line break
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('verse-reference')) {
        const book = e.target.dataset.book;
        const bookId = e.target.dataset.bookId;
        const chapter = e.target.dataset.chapter;
        const verse = e.target.dataset.verse;

        // Debug log
        console.log('Verse clicked - Book:', book, 'BookId:', bookId, 'Chapter:', chapter, 'Verse:', verse);

        // Validate data attributes
        if (!book || !bookId || !chapter || !verse || book === 'undefined' || bookId === 'undefined' || chapter === 'undefined' || verse === 'undefined') {
            console.error('Invalid verse data attributes:', { book, bookId, chapter, verse });
            alert('Unable to share verse: Invalid data. Please try again or refresh the page.');
            return;
        }

        try {
            // Fetch the verse text from the contract
            const result = await bibleContract.methods.getVerse(bookId, chapter, verse).call();
            const [verseNumber, text] = [result[0], result[1]];
            console.log('Fetched verse text:', text);

            // Construct the tweet with the verse text, adding a line break
            const verseReference = `${book} ${chapter}:${verse}`;
            const url = 'https://0xbible.faith'; // Link to base URL for preview
            const tweetText = `"${text}" - ${verseReference}%0A#blockchainBible #Conflux ${url}`;
            const tweetUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}`;

            // Debug log
            console.log('Tweet Text:', tweetText);

            // Open the X post in a new tab/window
            window.open(tweetUrl, '_blank');
        } catch (error) {
            console.error('Error fetching verse text:', error);
            alert('Unable to fetch verse text. Please try again.');
        }
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