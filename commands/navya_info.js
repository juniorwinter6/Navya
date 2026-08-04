const fs = require('fs');
const path = require('path');

module.exports = {
    name: "navya",
    async execute(sock, msg) {
        const remoteJid = msg.key.remoteJid;

        // Extract the sender's details for a personalized greeting
        const senderJid = msg.key.participant || remoteJid;
        const cleanSenderNumber = senderJid.split("@")[0].split(":")[0];

        // Resolve the absolute path to your local image asset safely
        const localImagePath = path.join(__dirname, '../assets/menu.jpg');

        // A curated list of beautiful, meaningful quotes about life
        const lifeQuotes = [
            "“The purpose of our lives is to be happy.” — Dalai Lama",
            "“Life is what happens when you're busy making other plans.” — John Lennon",
            "“Get busy living or get busy dying.” — Stephen King",
            "“You only live once, but if you do it right, once is enough.” — Mae West",
            "“In the end, it's not the years in your life that count. It's the life in your years.” — Abraham Lincoln",
            "“Life is really simple, but we insist on making it complicated.” — Confucius",
            "“Your time is limited, so don't waste it living someone else's life.” — Steve Jobs",
            "“The biggest adventure you can take is to live the life of your dreams.” — Oprah Winfrey",
            "“Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.” — Buddha",
            "“Life is a succession of lessons which must be lived to be understood.” — Ralph Waldo Emerson",

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

            "“The greatest happiness of life is the conviction that we are loved; loved for ourselves, or rather, loved in spite of ourselves.” — Victor Hugo",
            "“To love and be loved is to feel the sun from both sides.” — David Viscott",
            "“We love because it’s the only true adventure.” — Nikki Giovanni",
            "“Love all, trust a few, do wrong to none.” — William Shakespeare",
            "“Where there is love there is life.” — Mahatma Gandhi",
            "“Love looks not with the eyes, but with the mind, and therefore is winged Cupid painted blind.” — William Shakespeare",
            "“Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.” — Lao Tzu",
            "“There is only one happiness in this life, to love and be loved.” — George Sand",
            "“The best thing to hold onto in life is each other.” — Audrey Hepburn",
            "“You know you're in love when you can't fall asleep because reality is finally better than your dreams.” — Dr. Seuss",
            "“Love is a canvas furnished by nature and embroidered by imagination.” — Voltaire",
            "“If I know what love is, it is because of you.” — Hermann Hesse",
            "“The art of love is largely the art of persistence.” — Albert Ellis",
            "“We are shaped and fashioned by what we love.” — Johann Wolfgang von Goethe",
            "“Love is composed of a single soul inhabiting two bodies.” — Aristotle",

            "“Even on my weakest days I get a little bit stronger.” — Sara Evans",
            "“The only thing a person can ever really do is keep moving forward. Take that big leap forward without hesitation, without once looking back.” — Alyson Noel",
            "“You can't look back; you just have to put the past behind you, and find something better in your future.” — Jodi Picoult",
            "“Letting go means to come to the realization that some people are a part of your history, but not a part of your destiny.” — Steve Maraboli",
            "“Cry me a river, build a bridge, and get over it.” — Justin Timberlake",
            "“You must make a decision that you are going to move on. It won't happen automatically.” — Joel Osteen",
            "“We must be willing to let go of the life we’ve planned, so as to have the life that is waiting for us.” — Joseph Campbell",
            "“Don't stumble over something behind you.” — Seneca",
            "“Courage is not the absence of fear, but simply moving on with dignity despite that fear.” — Pat Riley",
            "“Every day is a new beginning. Treat it that way. Stay away from what might have been, and look at what can be.” — Marsha Petrie Sue",
            "“There are far, far better things ahead than any we leave behind.” — C.S. Lewis",
            "“The great courageous act that we must all do, is to have the courage to step out of our history and past so that we can live our dreams.” — Oprah Winfrey",
            "“Yesterday is not ours to recover, but tomorrow is ours to win or lose.” — Lyndon B. Johnson",
            "“The truth is, unless you let go, unless you forgive yourself, unless you forgive the situation, unless you realize that the situation is over, you cannot move forward.” — Steve Maraboli",

            "“It always seems impossible until it's done.” — Nelson Mandela",
            "“Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.” — Thomas A. Edison",
            "“Never give up on something that you can't go a day without thinking about.” — Winston Churchill",
            "“Survival can be summed up in three words—never give up. That's the heart of it really. Just keep trying.” — Bear Grylls",
            "“You just can't beat the person who won't give up.” — Babe Ruth",
            "“It does not matter how slowly you go as long as you do not stop.” — Confucius",
            "“Fall seven times and stand up eight.” — Japanese Proverb",
            "“Never give up, for that is just the place and time that the tide will turn.” — Harriet Beecher Stowe",
            "“Success is failing successive times without loss of enthusiasm.” — Winston Churchill",
            "“The presentation of a hero is not that they never fail, but that they never quit.” — Unknown",
            "“Difficult things take a long time, impossible things a little longer.” — André訊息",
            "“If you're going through hell, keep going.” — Winston Churchill",
            "“Champions keep playing until they get it right.” — Billie Jean King",
            "“Perseverance is not a long race; it is many short races one after the other.” — Walter Elliot",

            "“You must not lose faith in humanity. Humanity is an ocean; if a few drops of the ocean are dirty, the ocean does not become dirty.” — Mahatma Gandhi",
            "“To err is human; to forgive, divine.” — Alexander Pope",
            "“The sole meaning of life is to serve humanity.” — Leo Tolstoy",
            "“Man is the only animal whose desires increase as they are fed.” — Henry George",
            "“We are all human beings, and we all have a vice, or a virtue.” — Miguel de Cervantes",
            "“Humanity has the stars, and should not lose the sight of them.” — Unknown",
            "“Be a good human being, a warm-hearted, affectionate person.” — Dalai Lama",
            "“The modern human is a paradox.” — Unknown",
            "“Every human is an artist of their own life.” — Unknown",
            "“No one is born hating another person because of the color of his skin, or his background, or his religion.” — Nelson Mandela",
            "“The measure of a man is what he does with power.” — Plato",
            "“What a piece of work is a man! How noble in reason, how infinite in faculty!” — William Shakespeare",
            "“An unexamined life is one not worth living for a human.” — Socrates",

            "“The greatness of a nation and its moral progress can be judged by the way its animals are treated.” — Mahatma Gandhi",
            "“Until one has loved an animal, a part of one's soul remains unawakened.” — Anatole France",
            "“Animals are such agreeable friends—they ask no questions; they pass no criticisms.” — George Eliot",
            "“Our perfect companions never have fewer than four feet.” — Colette",
            "“Time spent with cats is never wasted.” — Sigmund Freud",
            "“Dogs are not our whole life, but they make our lives whole.” — Roger Caras",
            "“An animal's eyes have the power to speak a great language.” — Martin Buber",
            "“The love for all living creatures is the most noble attribute of man.” — Charles Darwin",
            "“Animals are born who they are, accept it, and that is that. They live with greater peace than people do.” — Gregory Maguire",
            "“If having a soul means being able to feel love and loyalty and gratitude, then animals are better off than a lot of humans.” — James Herriot",
            "“We can judge the heart of a man by his treatment of animals.” — Immanuel Kant",
            "“A dog is the only thing on earth that loves you more than he loves himself.” — Josh Billings",

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
            "“We do not remember days, we remember moments.” — Cesare Pavese",
            "“Everything you’ve ever wanted is on the other side of fear.” — George Addair"
        ];

        // Pick a random quote from the array
        const randomQuote = lifeQuotes[Math.floor(Math.random() * lifeQuotes.length)];

        // Construct a highly readable, elegant mobile presentation layout
        const introMessage = `🌸 *Meet Navya* 🌸

Hey @${cleanSenderNumber} I'm right here. Allow me to introduce myself:

✨ *ABOUT ME*
I am a sweet, supportive, and highly capable WhatsApp assistant. My goal is to make your chat rooms brighter, smarter, and a lot more fun! Whether you need an answer to a tough question or just a friendly chat, I've got your back.

💖 *MY CREATOR*
I was crafted with a lot of love, dedication, and code by the brilliant mind of *Rise*. I owe all my smart capabilities and warm personality to him!


🌱 *TODAY'S INSPIRATION FOR YOU*
${randomQuote}


                                                                              *© Rise*`;

        try {
            // Check if the file actually exists before trying to send it
            if (fs.existsSync(localImagePath)) {
                await sock.sendMessage(remoteJid, {
                    image: { url: localImagePath }, // Baileys can resolve local paths via url field too!
                    caption: introMessage,
                    mentions: [senderJid]
                }, { quoted: msg });
            } else {
                // If the path resolving missed, try reading it directly as a buffer payload
                const imageBuffer = fs.readFileSync(path.join(process.cwd(), 'assets/menu.jpg'));
                await sock.sendMessage(remoteJid, {
                    image: imageBuffer,
                    caption: introMessage,
                    mentions: [senderJid]
                }, { quoted: msg });
            }
        } catch (error) {
            console.error("Error reading local Navya image:", error);

            // Ultimate fallback to clean text output if the file reading hits any permission snags
            try {
                await sock.sendMessage(remoteJid, {
                    text: introMessage,
                    mentions: [senderJid]
                }, { quoted: msg });
            } catch (fallbackError) {
                console.error("Navya Text Fallback failed:", fallbackError);
            }
        }
    }
};