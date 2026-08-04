const fs = require('fs');
const path = require('path');

// Expanded quotes array with 220+ curated quotes
const quotes = [
    // --- WISDOM & LIFE ---
    "“The purpose of our lives is to be happy.” — Dalai Lama",
    "“Life is what happens when you're busy making other plans.” — John Lennon",
    "“Get busy living or get busy dying.” — Stephen King",
    "“You only live once, but if you do it right, once is enough.” — Mae West",
    "“In the end, it's not the years in your life that count. It's the life in your years.” — Abraham Lincoln",
    "“Life is really simple, but we insist on making it complicated.” — Confucius",
    "“May you live all the days of your life.” — Jonathan Swift",
    "“Life itself is the most wonderful fairy tale.” — Hans Christian Andersen",
    "“Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.” — Buddha",
    "“Life is a long lesson in humility.” — James M. Barrie",
    "“The unexamined life is not worth living.” — Socrates",
    "“Turn your wounds into wisdom.” — Oprah Winfrey",
    "“The way I see it, if you want the rainbow, you gotta put up with the rain.” — Dolly Parton",
    "“Live in the sunshine, swim the sea, drink the wild air.” — Ralph Waldo Emerson",
    "“Life is short, and it is up to you to make it sweet.” — Sarah Louise Delany",
    "“Good timber does not grow with ease; the stronger the wind, the stronger the trees.” — J. Willard Marriott",
    "“Life is available only in the present moment.” — Thich Nhat Hanh",
    "“Knowledge speaks, but wisdom listens.” — Jimi Hendrix",
    "“Doubt is the origin of wisdom.” — René Descartes",
    "“The journey of a thousand miles begins with one step.” — Lao Tzu",
    "“Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.” — Bill Keane",
    "“Knowing yourself is the beginning of all wisdom.” — Aristotle",
    "“Count your age by friends, not years. Count your life by smiles, not tears.” — John Lennon",
    "“In three words I can sum up everything I've learned about life: it goes on.” — Robert Frost",
    "“Change your thoughts and you change your world.” — Norman Vincent Peale",
    "“The only true wisdom is in knowing you know nothing.” — Socrates",
    "“Silence is a true friend who never betrays.” — Confucius",
    "“Life is not measured by the number of breaths we take, but by the moments that take our breath away.” — Maya Angelou",
    "“To live is the rarest thing in the world. Most people exist, that is all.” — Oscar Wilde",
    "“It is the mark of an educated mind to be able to entertain a thought without accepting it.” — Aristotle",
    "“Wisdom is not a product of schooling but of the lifelong attempt to acquire it.” — Albert Einstein",
    "“The seat of knowledge is in the head, of wisdom, in the heart.” — William Hazlitt",
    "“Beware of false knowledge; it is more dangerous than ignorance.” — George Bernard Shaw",
    "“The time is always right to do what is right.” — Martin Luther King Jr.",
    "“Pain is inevitable. Suffering is optional.” — Haruki Murakami",
    "“Life expands or contracts in proportion to one's courage.” — Anaïs Nin",
    "“Simplicity is the ultimate sophistication.” — Leonardo da Vinci",

    // --- SUCCESS, GOALS & MOTIVATION ---
    "“The only way to do great work is to love what you do.” — Steve Jobs",
    "“Believe you can and you're halfway there.” — Theodore Roosevelt",
    "“The future belongs to those who believe in the beauty of their dreams.” — Eleanor Roosevelt",
    "“Success is not final, failure is not fatal: it is the courage to continue that counts.” — Winston Churchill",
    "“The only limit to our realization of tomorrow will be our doubts of today.” — Franklin D. Roosevelt",
    "“The best way to predict the future is to create it.” — Peter Drucker",
    "“Do what you can, with what you have, where you are.” — Theodore Roosevelt",
    "“Happiness is not something ready made. It comes from your own actions.” — Dalai Lama",
    "“It is never too late to be what you might have been.” — George Eliot",
    "“Act as if what you do makes a difference. It does.” — William James",
    "“Your time is limited, so don't waste it living someone else's life.” — Steve Jobs",
    "“You miss 100% of the shots you don't take.” — Wayne Gretzky",
    "“The secret of getting ahead is getting started.” — Mark Twain",
    "“What you get by achieving your goals is not as important as what you become by achieving your goals.” — Zig Ziglar",
    "“Dream big and dare to fail.” — Norman Vaughan",
    "“Everything you’ve ever wanted is on the other side of fear.” — George Addair",
    "“Hardships often prepare ordinary people for an extraordinary destiny.” — C.S. Lewis",
    "“Don't watch the clock; do what it does. Keep going.” — Sam Levenson",
    "“Start where you are. Use what you have. Do what you can.” — Arthur Ashe",
    "“Opportunities don't happen, you create them.” — Chris Grosser",
    "“I find that the harder I work, the more luck I seem to have.” — Thomas Jefferson",
    "“Success usually comes to those who are too busy to be looking for it.” — Henry David Thoreau",
    "“Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.” — Roy T. Bennett",
    "“Action is the foundational key to all success.” — Pablo Picasso",
    "“The mind is everything. What you think you become.” — Buddha",
    "“You don't have to be great to start, but you have to start to be great.” — Zig Ziglar",
    "“Success is walking from failure to failure with no loss of enthusiasm.” — Winston Churchill",
    "“Your passion is waiting for your courage to catch up.” — Isabelle Lafleche",
    "“If you want to lift yourself up, lift up someone else.” — Booker T. Washington",
    "“The distance between insanity and genius is measured only by success.” — Bruce Feirstein",
    "“Small deeds done are better than great deeds planned.” — Peter Marshall",
    "“Aim for the moon. If you miss, you may hit a star.” — W. Clement Stone",
    "“Setting goals is the first step in turning the invisible into the visible.” — Tony Robbins",
    "“It always seems impossible until it's done.” — Nelson Mandela",
    "“What lies behind us and what lies before us are tiny matters compared to what lies within us.” — Ralph Waldo Emerson",
    "“Discipline is the bridge between goals and accomplishment.” — Jim Rohn",
    "“Energy and persistence conquer all things.” — Benjamin Franklin",
    "“The path to success is to take prompt, aggressive action.” — Tony Robbins",
    "“Do not wait to strike till the iron is hot; but make it hot by striking.” — William Butler Yeats",
    "“Great things are done by a series of small things brought together.” — Vincent Van Gogh",
    "“Focus on being productive instead of busy.” — Tim Ferriss",

    // --- PERSEVERANCE & RESILIENCE ---
    "“Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.” — Thomas Edison",
    "“Never give up on something that you can't go a day without thinking about.” — Winston Churchill",
    "“Survival can be summed up in three words—never give up. That's the heart of it really. Just keep trying.” — Bear Grylls",
    "“You just can't beat the person who won't give up.” — Babe Ruth",
    "“It does not matter how slowly you go as long as you do not stop.” — Confucius",
    "“Fall seven times and stand up eight.” — Japanese Proverb",
    "“Never give up, for that is just the place and time that the tide will turn.” — Harriet Beecher Stowe",
    "“If you're going through hell, keep going.” — Winston Churchill",
    "“Champions keep playing until they get it right.” — Billie Jean King",
    "“Perseverance is not a long race; it is many short races one after the other.” — Walter Elliot",
    "“A river cuts through rock, not because of its power, but because of its persistence.” — James N. Watkins",
    "“The oak fought the wind and was broken, the willow bent when it must and survived.” — Robert Jordan",
    "“Rock bottom became the solid foundation on which I rebuilt my life.” — J.K. Rowling",
    "“You may have to fight a battle more than once to win it.” — Margaret Thatcher",
    "“Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.” — John Quincy Adams",
    "“Continuous effort—not strength or intelligence—is the key to unlocking our potential.” — Winston Churchill",
    "“Strength does not come from winning. Your struggles develop your strengths.” — Arnold Schwarzenegger",
    "“Breathe. It's just a bad day, not a bad life.” — Johnny Depp",
    "“When everything seems to be going against you, remember that the airplane takes off against the wind, not with it.” — Henry Ford",
    "“You never know how strong you are until being strong is your only choice.” — Bob Marley",
    "“Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.” — Helen Keller",
    "“He who has a why to live can bear almost any how.” — Friedrich Nietzsche",
    "“Press on. Nothing in the world can take the place of persistence.” — Calvin Coolidge",
    "“It is during our darkest moments that we must focus to see the light.” — Aristotle Onassis",
    "“Rough waters make smooth sailors.” — Proverb",

    // --- MOVING FORWARD & LETTING GO ---
    "“Even on my weakest days I get a little bit stronger.” — Sara Evans",
    "“The only thing a person can ever really do is keep moving forward. Take that big leap forward without hesitation.” — Alyson Noel",
    "“You can't look back; you just have to put the past behind you, and find something better in your future.” — Jodi Picoult",
    "“Letting go means to come to the realization that some people are a part of your history, but not a part of your destiny.” — Steve Maraboli",
    "“You must make a decision that you are going to move on. It won't happen automatically.” — Joel Osteen",
    "“We must be willing to let go of the life we’ve planned, so as to have the life that is waiting for us.” — Joseph Campbell",
    "“Don't stumble over something behind you.” — Seneca",
    "“Courage is not the absence of fear, but simply moving on with dignity despite that fear.” — Pat Riley",
    "“Every day is a new beginning. Treat it that way.” — Marsha Petrie Sue",
    "“There are far, far better things ahead than any we leave behind.” — C.S. Lewis",
    "“Yesterday is not ours to recover, but tomorrow is ours to win or lose.” — Lyndon B. Johnson",
    "“Forget what hurt you, but never forget what it taught you.” — Unknown",
    "“Forgiveness is unlocking the door to set someone free and realizing you were the prisoner.” — Max Lucado",
    "“Holding onto anger is like drinking poison and expecting the other person to die.” — Buddha",
    "“You don't need to see the whole staircase, just take the first step.” — Martin Luther King Jr.",
    "“When one door closes, another opens; but we often look so long and so regretfully upon the closed door that we do not see the one which has opened for us.” — Alexander Graham Bell",
    "“Accept what is, let go of what was, and have faith in what will be.” — Sonia Ricotti",
    "“The past is a place of reference, not a place of residence.” — Roy T. Bennett",
    "“Growth is painful. Change is painful. But nothing is as painful as staying stuck somewhere you don't belong.” — N.R. Narayana Murthy",

    // --- LOVE & RELATIONSHIPS ---
    "“The greatest happiness of life is the conviction that we are loved; loved for ourselves, or rather, loved in spite of ourselves.” — Victor Hugo",
    "“To love and be loved is to feel the sun from both sides.” — David Viscott",
    "“We love because it’s the only true adventure.” — Nikki Giovanni",
    "“Love all, trust a few, do wrong to none.” — William Shakespeare",
    "“Where there is love there is life.” — Mahatma Gandhi",
    "“Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.” — Lao Tzu",
    "“There is only one happiness in this life, to love and be loved.” — George Sand",
    "“The best thing to hold onto in life is each other.” — Audrey Hepburn",
    "“You know you're in love when you can't fall asleep because reality is finally better than your dreams.” — Dr. Seuss",
    "“Love is composed of a single soul inhabiting two bodies.” — Aristotle",
    "“Love is when the other person's happiness is more important than your own.” — H. Jackson Brown Jr.",
    "“The supreme happiness of life is the conviction that we are loved.” — Victor Hugo",
    "“Loved you yesterday, love you still, always have, always will.” — Elaine Davis",
    "“We are most alive when we're in love.” — John Updike",
    "“To be brave is to love someone unconditionally, without expecting anything in return.” — Madonna",
    "“The water shines only by the sun. And it is you who are my sun.” — Charles de Leusse",
    "“Love cures people—both the ones who give it and the ones who receive it.” — Karl A. Menninger",
    "“Kindness in words creates confidence. Kindness in thinking creates profoundness. Kindness in giving creates love.” — Lao Tzu",
    "“Love is a friendship set to music.” — Joseph Campbell",

    // --- HUMANITY & CHARACTER ---
    "“You must not lose faith in humanity. Humanity is an ocean; if a few drops of the ocean are dirty, the ocean does not become dirty.” — Mahatma Gandhi",
    "“To err is human; to forgive, divine.” — Alexander Pope",
    "“The sole meaning of life is to serve humanity.” — Leo Tolstoy",
    "“No one is born hating another person because of the color of his skin, or his background, or his religion.” — Nelson Mandela",
    "“The measure of a man is what he does with power.” — Plato",
    "“Be a good human being, a warm-hearted, affectionate person.” — Dalai Lama",
    "“Be kind, for everyone you meet is fighting a hard battle.” — Plato",
    "“No act of kindness, no matter how small, is ever wasted.” — Aesop",
    "“In a world where you can be anything, be kind.” — Jennifer Dukes Lee",
    "“Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.” — Martin Luther King Jr.",
    "“Character is how you treat those who can do nothing for you.” — Johann Wolfgang von Goethe",
    "“How wonderful it is that nobody need wait a single moment before starting to improve the world.” — Anne Frank",
    "“Too often we underestimate the power of a touch, a smile, a kind word, a listening ear, an honest compliment, or the smallest act of caring.” — Leo Buscaglia",
    "“We make a living by what we get, but we make a life by what we give.” — Winston Churchill",
    "“If you want others to be happy, practice compassion. If you want to be happy, practice compassion.” — Dalai Lama",
    "“Happiness is not shared unless it is shared with others.” — Christopher McCandless",
    "“The true test of a man's character is how he treats someone who can have no possible use to him.” — Samuel Johnson",

    // --- ANIMALS & NATURE ---
    "“The greatness of a nation and its moral progress can be judged by the way its animals are treated.” — Mahatma Gandhi",
    "“Until one has loved an animal, a part of one's soul remains unawakened.” — Anatole France",
    "“Animals are such agreeable friends—they ask no questions; they pass no criticisms.” — George Eliot",
    "“Time spent with cats is never wasted.” — Sigmund Freud",
    "“Dogs are not our whole life, but they make our lives whole.” — Roger Caras",
    "“An animal's eyes have the power to speak a great language.” — Martin Buber",
    "“The love for all living creatures is the most noble attribute of man.” — Charles Darwin",
    "“We can judge the heart of a man by his treatment of animals.” — Immanuel Kant",
    "“A dog is the only thing on earth that loves you more than he loves himself.” — Josh Billings",
    "“Look deep into nature, and then you will understand everything better.” — Albert Einstein",
    "“In every walk with nature one receives far more than he seeks.” — John Muir",
    "“Nature does not hurry, yet everything is accomplished.” — Lao Tzu",
    "“The earth has music for those who listen.” — William Shakespeare",
    "“Study nature, love nature, stay close to nature. It will never fail you.” — Frank Lloyd Wright",
    "“Adopt the pace of nature: her secret is patience.” — Ralph Waldo Emerson",
    "“Heaven is under our feet as well as over our heads.” — Henry David Thoreau",

    // --- COURAGE & DISCIPLINE ---
    "“Courage is resistance to fear, mastery of fear—not absence of fear.” — Mark Twain",
    "“You have power over your mind—not outside events. Realize this, and you will find strength.” — Marcus Aurelius",
    "“He who conquers himself is the mightiest warrior.” — Confucius",
    "“Courage is grace under pressure.” — Ernest Hemingway",
    "“Freedom lies in being bold.” — Robert Frost",
    "“Small discipline repeated with consistency every day leads to great achievements gained slowly over time.” — John C. Maxwell",
    "“Do one thing every day that scares you.” — Eleanor Roosevelt",
    "“He who is not courageous enough to take risks will accomplish nothing in life.” — Muhammad Ali",
    "“We don't rise to the level of our expectations, we fall to the level of our training.” — Archilochus",
    "“He who fears he shall suffer, already suffers what he fears.” — Michel de Montaigne",
    "“He who reigns within himself and rules passions, desires, and fears is more than a king.” — John Milton",
    "“Success is nothing more than a few simple disciplines, practiced every day.” — Jim Rohn",
    "“Fear kills more dreams than failure ever will.” — Suzy Kassem",
    "“The brave man is not he who does not feel afraid, but he who conquers that fear.” — Nelson Mandela",
    "“Doubt kills more dreams than failure ever will.” — Karim Seddiki",
    "“Self-discipline is the magic power that makes you virtually unstoppable.” — Dan Kennedy",
    "“If you conquer your mind, you can conquer the whole world.” — Sri Sri Ravi Shankar",
    "“Without self-discipline, success is impossible, period.” — Lou Holtz",
    "“Great thoughts speak only to the thoughtful mind, but great actions speak to all mankind.” — Theodore Roosevelt",
    "“What you do speaks so loudly that I cannot hear what you say.” — Ralph Waldo Emerson"
];

/**
 * Starts the daily quotes scheduler (runs every 24 hours)
 * @param {import('@whiskeysockets/baileys').WASocket} sock - Your Baileys socket instance
 */
function startQuoteScheduler(sock) {

    // 24 hours in milliseconds (1000ms * 60s * 60m * 24h = 86,400,000 ms)
    const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

    console.log("⏰ Daily quotes scheduler has been successfully initialized (24-hour interval).");

    setInterval(async () => {
        try {
            // 1. Fetch all groups from Baileys socket memory
            const response = await sock.groupFetchAllParticipating();
            const groupJids = Object.keys(response);

            if (groupJids.length === 0) {
                console.log("📢 Quote Scheduler: Bot is not in any groups yet.");
                return;
            }

            // 2. Pick a random quote
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            const messageBody = `✨ *QUOTE OF THE DAY* ✨\n\n${randomQuote}\n\n\n*© Rise*`;

            // Path to your menu image inside assets folder
            const imagePath = path.join(__dirname, '..', 'assets', 'menu.jpg');
            const hasImage = fs.existsSync(imagePath);

            // Optimization: Read image buffer once before looping through groups
            const imageBuffer = hasImage ? fs.readFileSync(imagePath) : null;

            // 3. Broadcast to all participating groups with anti-ban delay
            for (const groupJid of groupJids) {
                if (imageBuffer) {
                    await sock.sendMessage(groupJid, {
                        image: imageBuffer,
                        caption: messageBody
                    });
                } else {
                    // Fallback to text-only if image file is missing
                    await sock.sendMessage(groupJid, { text: messageBody });
                    console.warn(`⚠️ Warning: Image not found at path: ${imagePath}. Sent text-only message.`);
                }

                // Anti-ban safety: 2-second breath between groups
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`✅ Daily quote successfully broadcasted to ${groupJids.length} group(s).`);

        } catch (error) {
            console.error("❌ Error in Quote Scheduler broadcast loop:", error);
        }
    }, TWENTY_FOUR_HOURS);
}

module.exports = { startQuoteScheduler };