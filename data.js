/**
 * ==========================================================================
 * LINGOBEE - Data Bank & Vocabulary Modules
 * منصة لينجوبي - بنك البيانات والكلمات التعليمية للأطفال
 * ==========================================================================
 */

const ALPHABET_DATA = [
  { letter: 'A', small: 'a', word: 'Apple', arabic: 'تفاحة', emoji: '🍎', phonics: 'A says /æ/ as in Apple', color: '#FF6B6B' },
  { letter: 'B', small: 'b', word: 'Bear', arabic: 'دب', emoji: '🐻', phonics: 'B says /b/ as in Bear', color: '#4ECDC4' },
  { letter: 'C', small: 'c', word: 'Cat', arabic: 'قطة', emoji: '🐱', phonics: 'C says /k/ as in Cat', color: '#FFE66D' },
  { letter: 'D', small: 'd', word: 'Dog', arabic: 'كلب', emoji: '🐶', phonics: 'D says /d/ as in Dog', color: '#1A535C' },
  { letter: 'E', small: 'e', word: 'Elephant', arabic: 'فيل', emoji: '🐘', phonics: 'E says /e/ as in Elephant', color: '#9B5DE5' },
  { letter: 'F', small: 'f', word: 'Fish', arabic: 'سمكة', emoji: '🐟', phonics: 'F says /f/ as in Fish', color: '#F15BB5' },
  { letter: 'G', small: 'g', word: 'Giraffe', arabic: 'زرافة', emoji: '🦒', phonics: 'G says /dʒ/ as in Giraffe', color: '#FEE440' },
  { letter: 'H', small: 'h', word: 'Horse', arabic: 'حصان', emoji: '🐴', phonics: 'H says /h/ as in Horse', color: '#00BBF9' },
  { letter: 'I', small: 'i', word: 'Ice Cream', arabic: 'مثلجات', emoji: '🍦', phonics: 'I says /aɪ/ as in Ice Cream', color: '#00F5D4' },
  { letter: 'J', small: 'j', word: 'Juice', arabic: 'عصير', emoji: '🧃', phonics: 'J says /dʒ/ as in Juice', color: '#FF9F1C' },
  { letter: 'K', small: 'k', word: 'Kite', arabic: 'طائرة ورقية', emoji: '🪁', phonics: 'K says /k/ as in Kite', color: '#2EC4B6' },
  { letter: 'L', small: 'l', word: 'Lion', arabic: 'أسد', emoji: '🦁', phonics: 'L says /l/ as in Lion', color: '#E71D36' },
  { letter: 'M', small: 'm', word: 'Monkey', arabic: 'قرد', emoji: '🐵', phonics: 'M says /m/ as in Monkey', color: '#FF99C8' },
  { letter: 'N', small: 'n', word: 'Nest', arabic: 'عش', emoji: '🪺', phonics: 'N says /n/ as in Nest', color: '#FCF6BD' },
  { letter: 'O', small: 'o', word: 'Orange', arabic: 'برتقال', emoji: '🍊', phonics: 'O says /ɒ/ as in Orange', color: '#D0F4DE' },
  { letter: 'P', small: 'p', word: 'Panda', arabic: 'باندا', emoji: '🐼', phonics: 'P says /p/ as in Panda', color: '#A9DEF9' },
  { letter: 'Q', small: 'q', word: 'Queen', arabic: 'ملكة', emoji: '👑', phonics: 'Q says /kw/ as in Queen', color: '#E4C1F9' },
  { letter: 'R', small: 'r', word: 'Rabbit', arabic: 'أرنب', emoji: '🐰', phonics: 'R says /r/ as in Rabbit', color: '#FFB703' },
  { letter: 'S', small: 's', word: 'Sun', arabic: 'شمس', emoji: '☀️', phonics: 'S says /s/ as in Sun', color: '#FB8500' },
  { letter: 'T', small: 't', word: 'Tiger', arabic: 'نمر', emoji: '🐯', phonics: 'T says /t/ as in Tiger', color: '#023047' },
  { letter: 'U', small: 'u', word: 'Umbrella', arabic: 'مظلة', emoji: '☂️', phonics: 'U says /ʌ/ as in Umbrella', color: '#219EBC' },
  { letter: 'V', small: 'v', word: 'Van', arabic: 'شاحنة صغيرة', emoji: '🚐', phonics: 'V says /v/ as in Van', color: '#8ECAE6' },
  { letter: 'W', small: 'w', word: 'Whale', arabic: 'حوت', emoji: '🐋', phonics: 'W says /w/ as in Whale', color: '#4361EE' },
  { letter: 'X', small: 'x', word: 'Xylophone', arabic: 'إكسيلوفون', emoji: '🎵', phonics: 'X says /z/ as in Xylophone', color: '#3A0CA3' },
  { letter: 'Y', small: 'y', word: 'Yo-yo', arabic: 'يويو', emoji: '🪀', phonics: 'Y says /j/ as in Yo-yo', color: '#7209B7' },
  { letter: 'Z', small: 'z', word: 'Zebra', arabic: 'حمار وحشي', emoji: '🦓', phonics: 'Z says /z/ as in Zebra', color: '#F72585' }
];

const NUMBERS_DATA = [
  { num: 1, word: 'One', arabic: 'واحد', emoji: '⭐', count: 1 },
  { num: 2, word: 'Two', arabic: 'اثنان', emoji: '🎈', count: 2 },
  { num: 3, word: 'Three', arabic: 'ثلاثة', emoji: '🍎', count: 3 },
  { num: 4, word: 'Four', arabic: 'أربعة', emoji: '🚗', count: 4 },
  { num: 5, word: 'Five', arabic: 'خمسة', emoji: '🐱', count: 5 },
  { num: 6, word: 'Six', arabic: 'ستة', emoji: '🌸', count: 6 },
  { num: 7, word: 'Seven', arabic: 'سبعة', emoji: '🍓', count: 7 },
  { num: 8, word: 'Eight', arabic: 'ثمانية', emoji: '⚽', count: 8 },
  { num: 9, word: 'Nine', arabic: 'تسعة', emoji: '🦋', count: 9 },
  { num: 10, word: 'Ten', arabic: 'عشرة', emoji: '🌟', count: 10 },
  { num: 11, word: 'Eleven', arabic: 'أحد عشر', emoji: '🍭', count: 11 },
  { num: 12, word: 'Twelve', arabic: 'اثنا عشر', emoji: '🎁', count: 12 },
  { num: 13, word: 'Thirteen', arabic: 'ثلاثة عشر', emoji: '🍩', count: 13 },
  { num: 14, word: 'Fourteen', arabic: 'أربعة عشر', emoji: '🚀', count: 14 },
  { num: 15, word: 'Fifteen', arabic: 'خمسة عشر', emoji: '🧁', count: 15 },
  { num: 16, word: 'Sixteen', arabic: 'ستة عشر', emoji: '🍇', count: 16 },
  { num: 17, word: 'Seventeen', arabic: 'سبعة عشر', emoji: '🧸', count: 17 },
  { num: 18, word: 'Eighteen', arabic: 'ثمانية عشر', emoji: '🍉', count: 18 },
  { num: 19, word: 'Nineteen', arabic: 'تسعة عشر', emoji: '🌈', count: 19 },
  { num: 20, word: 'Twenty', arabic: 'عشرون', emoji: '👑', count: 20 }
];

const ANIMALS_DATA = [
  { word: 'Lion', arabic: 'أسد', emoji: '🦁', category: 'Wild', sound: 'Roar!', bg: '#FFE8D6' },
  { word: 'Elephant', arabic: 'فيل', emoji: '🐘', category: 'Wild', sound: 'Pawoo!', bg: '#E8E8E4' },
  { word: 'Monkey', arabic: 'قرد', emoji: '🐵', category: 'Wild', sound: 'Ooh ooh aah aah!', bg: '#D8E2DC' },
  { word: 'Giraffe', arabic: 'زرافة', emoji: '🦒', category: 'Wild', sound: 'Tall and quiet!', bg: '#FFF1E6' },
  { word: 'Tiger', arabic: 'نمر', emoji: '🐯', category: 'Wild', sound: 'Growl!', bg: '#FFD7BA' },
  { word: 'Bear', arabic: 'دب', emoji: '🐻', category: 'Wild', sound: 'Grrr!', bg: '#FCD5CE' },
  { word: 'Zebra', arabic: 'حمار وحشي', emoji: '🦓', category: 'Wild', sound: 'Neigh!', bg: '#E2E2E2' },
  { word: 'Dog', arabic: 'كلب', emoji: '🐶', category: 'Farm', sound: 'Woof woof!', bg: '#F8EDEB' },
  { word: 'Cat', arabic: 'قطة', emoji: '🐱', category: 'Farm', sound: 'Meow meow!', bg: '#FFE5EC' },
  { word: 'Rabbit', arabic: 'أرنب', emoji: '🐰', category: 'Farm', sound: 'Hop hop!', bg: '#F0E6EF' },
  { word: 'Cow', arabic: 'بقرة', emoji: '🐮', category: 'Farm', sound: 'Moo moo!', bg: '#E7ECEF' },
  { word: 'Sheep', arabic: 'خروف', emoji: '🐑', category: 'Farm', sound: 'Baa baa!', bg: '#E9ECEF' },
  { word: 'Horse', arabic: 'حصان', emoji: '🐴', category: 'Farm', sound: 'Neigh neigh!', bg: '#FDE2E4' },
  { word: 'Duck', arabic: 'بطة', emoji: '🦆', category: 'Farm', sound: 'Quack quack!', bg: '#FFF0F5' },
  { word: 'Dolphin', arabic: 'دلفين', emoji: '🐬', category: 'Sea', sound: 'Click click!', bg: '#E0FAFF' },
  { word: 'Whale', arabic: 'حوت', emoji: '🐋', category: 'Sea', sound: 'Singing in the ocean!', bg: '#D0F0FD' },
  { word: 'Fish', arabic: 'سمكة', emoji: '🐟', category: 'Sea', sound: 'Blub blub!', bg: '#CAF0F8' },
  { word: 'Penguin', arabic: 'بطريق', emoji: '🐧', category: 'Sea', sound: 'Waddle waddle!', bg: '#EDF2F4' },
  { word: 'Butterfly', arabic: 'فراشة', emoji: '🦋', category: 'Insects', sound: 'Flutter flutter!', bg: '#E8DFF5' },
  { word: 'Bee', arabic: 'نحلة', emoji: '🐝', category: 'Insects', sound: 'Buzzz buzzz!', bg: '#FCF6BD' }
];

const COLORS_DATA = [
  { word: 'Red', arabic: 'أحمر', hex: '#EF476F', emoji: '🍓', example: 'Red Strawberry' },
  { word: 'Blue', arabic: 'أزرق', hex: '#118AB2', emoji: '🌊', example: 'Blue Ocean' },
  { word: 'Green', arabic: 'أخضر', hex: '#06D6A0', emoji: '🍃', example: 'Green Leaf' },
  { word: 'Yellow', arabic: 'أصفر', hex: '#FFD166', emoji: '☀️', example: 'Yellow Sun' },
  { word: 'Orange', arabic: 'برتقالي', hex: '#F77F00', emoji: '🍊', example: 'Orange Fruit' },
  { word: 'Purple', arabic: 'بنفسجي', hex: '#7209B7', emoji: '🍇', example: 'Purple Grapes' },
  { word: 'Pink', arabic: 'وردي', hex: '#F72585', emoji: '🌸', example: 'Pink Flower' },
  { word: 'Brown', arabic: 'بني', hex: '#7F4F24', emoji: '🐻', example: 'Brown Bear' },
  { word: 'Black', arabic: 'أسود', hex: '#212529', emoji: '🐈‍⬛', example: 'Black Cat' },
  { word: 'White', arabic: 'أبيض', hex: '#F8F9FA', border: '#CED4DA', emoji: '🐑', example: 'White Sheep' }
];

const SHAPES_DATA = [
  { word: 'Circle', arabic: 'دائرة', emoji: '⭕', desc: 'Round and smooth like the sun' },
  { word: 'Square', arabic: 'مربع', emoji: '⏹️', desc: 'Four equal sides' },
  { word: 'Triangle', arabic: 'مثلث', emoji: '🔺', desc: 'Three pointy corners' },
  { word: 'Star', arabic: 'نجمة', emoji: '⭐', desc: 'Twinkling in the night sky' },
  { word: 'Heart', arabic: 'قلب', emoji: '❤️', desc: 'Symbol of love and kindness' },
  { word: 'Rectangle', arabic: 'مستطيل', emoji: '🚪', desc: 'Shaped like a tall door' },
  { word: 'Diamond', arabic: 'معين / ماسة', emoji: '💎', desc: 'Shining like a kite' },
  { word: 'Oval', arabic: 'بيضاوي', emoji: '🥚', desc: 'Shaped like an egg' }
];

const FRUITS_DATA = [
  { word: 'Apple', arabic: 'تفاحة', emoji: '🍎', color: '#FF4D6D' },
  { word: 'Banana', arabic: 'موز', emoji: '🍌', color: '#FFE169' },
  { word: 'Orange', arabic: 'برتقال', emoji: '🍊', color: '#FF9F1C' },
  { word: 'Strawberry', arabic: 'فراولة', emoji: '🍓', color: '#E63946' },
  { word: 'Watermelon', arabic: 'بطيخ', emoji: '🍉', color: '#38B000' },
  { word: 'Grapes', arabic: 'عنب', emoji: '🍇', color: '#7B2CBF' },
  { word: 'Pineapple', arabic: 'أناناس', emoji: '🍍', color: '#FFB703' },
  { word: 'Mango', arabic: 'مانجو', emoji: '🥭', color: '#FB8500' },
  { word: 'Peach', arabic: 'خوخ', emoji: '🍑', color: '#F4A261' },
  { word: 'Cherry', arabic: 'كرز', emoji: '🍒', color: '#D90429' },
  { word: 'Lemon', arabic: 'ليمون', emoji: '🍋', color: '#E9D8A6' },
  { word: 'Kiwi', arabic: 'كيوي', emoji: '🥝', color: '#55A630' }
];

const SPELLING_WORDS = [
  { word: 'CAT', arabic: 'قطة', emoji: '🐱', hint: 'Cute little pet that purrs' },
  { word: 'DOG', arabic: 'كلب', emoji: '🐶', hint: 'Man\'s best friend' },
  { word: 'SUN', arabic: 'شمس', emoji: '☀️', hint: 'Shines bright in the sky' },
  { word: 'BEE', arabic: 'نحلة', emoji: '🐝', hint: 'Makes sweet honey' },
  { word: 'CAR', arabic: 'سيارة', emoji: '🚗', hint: 'Drives on the road' },
  { word: 'HAT', arabic: 'قبعة', emoji: '🎩', hint: 'You wear it on your head' },
  { word: 'PEN', arabic: 'قلم', emoji: '🖊️', hint: 'Used for writing' },
  { word: 'FOX', arabic: 'ثعلب', emoji: '🦊', hint: 'Clever wild animal' },
  { word: 'PIG', arabic: 'خنزير وردي', emoji: '🐷', hint: 'Farm animal that says oink' },
  { word: 'BUS', arabic: 'حافلة', emoji: '🚌', hint: 'Big yellow school vehicle' },
  { word: 'BAT', arabic: 'خفاش', emoji: '🦇', hint: 'Flies at night' },
  { word: 'OWL', arabic: 'بومة', emoji: '🦉', hint: 'Wise bird with big eyes' }
];

const DAILY_PHRASES_DATA = [
  // 1. Greetings & Farewells (التحيات والوداع)
  { phrase: 'Hello!', arabic: 'مرحباً!', emoji: '👋', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#3A86FF', pronunciation: 'هَلُو' },
  { phrase: 'Good morning!', arabic: 'صباح الخير!', emoji: '🌅', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#FFB703', pronunciation: 'جُودْ مُورْنِنْغ' },
  { phrase: 'Good afternoon!', arabic: 'مساء الخير (بعد الظهر)!', emoji: '☀️', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#FB8500', pronunciation: 'جُودْ آفْتَرْنُون' },
  { phrase: 'Good evening!', arabic: 'مساء النور والسرور!', emoji: '🌆', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#8338EC', pronunciation: 'جُودْ إِيفْنِنْغ' },
  { phrase: 'Good night!', arabic: 'تصبح على خير!', emoji: '🌙', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#3A0CA3', pronunciation: 'جُودْ نَايْت' },
  { phrase: 'Goodbye!', arabic: 'مع السلامة / وداعاً!', emoji: '🙋‍♂️', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#FF006E', pronunciation: 'جُودْ بَاي' },
  { phrase: 'See you later!', arabic: 'أراك لاحقاً!', emoji: '🏃', category: 'greetings', categoryAr: 'التحيات والوداع', color: '#06D6A0', pronunciation: 'سِي يُو لِيتَر' },

  // 2. Manners & Magic Words (الكلمات السحرية والتهذيب)
  { phrase: 'Please', arabic: 'من فضلك / لو سمحت', emoji: '🙏', category: 'manners', categoryAr: 'الكلمات السحرية', color: '#4CC9F0', pronunciation: 'بْلِيز' },
  { phrase: 'Thank you!', arabic: 'شكراً جزيلاً لك!', emoji: '💖', category: 'manners', categoryAr: 'الكلمات السحرية', color: '#FF4D6D', pronunciation: 'ثَانْك يُو' },
  { phrase: "You're welcome!", arabic: 'عفواً / على الرحب والسعة!', emoji: '🤗', category: 'manners', categoryAr: 'الكلمات السحرية', color: '#06D6A0', pronunciation: 'يُورْ وِيلْكَام' },
  { phrase: 'Excuse me!', arabic: 'عذراً / اسمح لي!', emoji: '✋', category: 'manners', categoryAr: 'الكلمات السحرية', color: '#FB5607', pronunciation: 'إِكْسْكْيُوزْ مِي' },
  { phrase: "I'm sorry!", arabic: 'أنا آسف جداً!', emoji: '🥺', category: 'manners', categoryAr: 'الكلمات السحرية', color: '#7209B7', pronunciation: 'آيْمْ سُورِي' },
  { phrase: 'Nice to meet you!', arabic: 'سعيد بلقائك ومعرفتك!', emoji: '🤝', category: 'manners', categoryAr: 'الكلمات السحرية', color: '#3A86FF', pronunciation: 'نَايْسْ تُو مِيتْ يُو' },

  // 3. Feelings & State (المشاعر والأحوال)
  { phrase: 'How are you?', arabic: 'كيف حالك اليوم؟', emoji: '🤔', category: 'feelings', categoryAr: 'المشاعر والأحوال', color: '#FFB703', pronunciation: 'هَاوْ آرْ يُو' },
  { phrase: 'I am happy!', arabic: 'أنا سعيد ومبتهج!', emoji: '😄', category: 'feelings', categoryAr: 'المشاعر والأحوال', color: '#FF006E', pronunciation: 'آيْ آمْ هَابِي' },
  { phrase: 'I am excited!', arabic: 'أنا متحمس ومستعد!', emoji: '🤩', category: 'feelings', categoryAr: 'المشاعر والأحوال', color: '#8338EC', pronunciation: 'آيْ آمْ إِكْسَايْتِد' },
  { phrase: 'I am hungry!', arabic: 'أنا جائع!', emoji: '🍕', category: 'feelings', categoryAr: 'المشاعر والأحوال', color: '#FB5607', pronunciation: 'آيْ آمْ هَنْغْرِي' },
  { phrase: 'I am thirsty!', arabic: 'أنا عطشان!', emoji: '🥤', category: 'feelings', categoryAr: 'المشاعر والأحوال', color: '#00BBF9', pronunciation: 'آيْ آمْ ثِرْسْتِي' },
  { phrase: 'I love my family!', arabic: 'أنا أحب عائلتي!', emoji: '👨‍👩‍👧‍👦', category: 'feelings', categoryAr: 'المشاعر والأحوال', color: '#FF4D6D', pronunciation: 'آيْ لَفْ مَايْ فَامِلِي' },

  // 4. Conversation & Daily Life (التعارف والأسئلة)
  { phrase: 'What is your name?', arabic: 'ما هو اسمك؟', emoji: '❓', category: 'conversation', categoryAr: 'التعارف والأسئلة', color: '#3A86FF', pronunciation: 'وَاتْ إِزْ يُورْ نِيم' },
  { phrase: 'My name is...', arabic: 'اسمي هو...', emoji: '🏷️', category: 'conversation', categoryAr: 'التعارف والأسئلة', color: '#06D6A0', pronunciation: 'مَايْ نِيمْ إِز' },
  { phrase: 'How old are you?', arabic: 'كم عمرك؟', emoji: '🎂', category: 'conversation', categoryAr: 'التعارف والأسئلة', color: '#FB8500', pronunciation: 'هَاوْ أُولْدْ آرْ يُو' },
  { phrase: 'Where are you from?', arabic: 'من أي بلد أنت؟', emoji: '🌍', category: 'conversation', categoryAr: 'التعارف والأسئلة', color: '#4CC9F0', pronunciation: 'وِيرْ آرْ يُو فْرُوم' },
  { phrase: "Let's play together!", arabic: 'دعنا نلعب ونمرح معاً!', emoji: '⚽', category: 'conversation', categoryAr: 'التعارف والأسئلة', color: '#FF006E', pronunciation: 'لِيتْسْ بْلِي تُوغِيذَر' },
  { phrase: 'I love English!', arabic: 'أنا أحب تعلم الإنجليزية!', emoji: '🌟', category: 'conversation', categoryAr: 'التعارف والأسئلة', color: '#FFB703', pronunciation: 'آيْ لَفْ إِنْغْلِيش' }
];

const VIDEOS_DATA = [
  {
    id: 'hq3yfQnllfQ',
    titleAr: 'أنشودة الحروف الإنجليزية اللطيفة (ABC Song)',
    titleEn: 'ABC Song with Phonics',
    category: 'alphabet',
    categoryAr: 'الحروف الهجائية 🔤',
    duration: '3:24',
    emoji: '🔤',
    desc: 'تعلم نطق أصوات الحروف من A إلى Z مع لحن ممتع ورسوم مبهجة'
  },
  {
    id: 'FFE-TVZ37Sk',
    titleAr: 'أنشودة كلمتين لكل حرف (Phonics Song)',
    titleEn: 'Phonics Song with Two Words',
    category: 'alphabet',
    categoryAr: 'الحروف الهجائية 🔤',
    duration: '3:50',
    emoji: '🅰️',
    desc: 'تعلم مفردات ونطق الحروف مع كلمتين مصورتين لكل حرف'
  },
  {
    id: '0VLxWIHRD4E',
    titleAr: 'أنشودة الأرقام والعد من 1 إلى 20',
    titleEn: 'Numbers Song 1 to 20',
    category: 'numbers',
    categoryAr: 'الأرقام والعد 🔢',
    duration: '2:45',
    emoji: '🔢',
    desc: 'أنشودة مبهجة لتعلم العد الإنجليزي من 1 حتى 20 بسهولة'
  },
  {
    id: 'b0NHrFNZWh0',
    titleAr: 'القردة الخمسة يقفزون على السرير',
    titleEn: 'Five Little Monkeys Jumping on Bed',
    category: 'numbers',
    categoryAr: 'الأرقام والعد 🔢',
    duration: '2:15',
    emoji: '🐵',
    desc: 'الأغنية الإنجليزية الأشهر لعد الأرقام باللعب والمرح'
  },
  {
    id: 'SLZcWGQQsmg',
    titleAr: 'أنشودة الألوان الجميلة للأطفال',
    titleEn: 'Color Song for Children',
    category: 'colors',
    categoryAr: 'الألوان والأشكال 🎨',
    duration: '3:12',
    emoji: '🎨',
    desc: 'استكشف الأحمر، الأزرق، الأخضر، والأصفر مع رسوم كرتونية ساحرة'
  },
  {
    id: 'WTeqUejf3D0',
    titleAr: 'أنشودة الأشكال الهندسية المرحة',
    titleEn: 'The Shapes Song',
    category: 'colors',
    categoryAr: 'الألوان والأشكال 🎨',
    duration: '2:50',
    emoji: '🔺',
    desc: 'دائرة، مربع، مثلث، ونجمة.. تعرف على أشكال العالم حولك'
  },
  {
    id: '_6HzoUcx3eo',
    titleAr: 'مزرعة ماكدونالد وأصوات الحيوانات',
    titleEn: 'Old MacDonald Had a Farm',
    category: 'animals',
    categoryAr: 'مملكة الحيوانات 🦁',
    duration: '3:05',
    emoji: '🐮',
    desc: 'تعرف على البقرة، الحصان، الخروف، والبطة وأصواتها بالإنجليزية'
  },
  {
    id: '3v1Zkyr7-40',
    titleAr: 'أنشودة كائنات وأسماك البحر',
    titleEn: 'Animals in the Ocean',
    category: 'animals',
    categoryAr: 'مملكة الحيوانات 🦁',
    duration: '2:35',
    emoji: '🐬',
    desc: 'رحلة بحرية ممتعة لاكتشاف الحوت، الدولفين، والأسماك اللطيفة'
  },
  {
    id: 'tVlcKp3bWH8',
    titleAr: 'أنشودة التحية: كيف حالك اليوم؟',
    titleEn: 'Hello, Hello! How Are You?',
    category: 'phrases',
    categoryAr: 'العبارات والتحيات 💬',
    duration: '2:10',
    emoji: '👋',
    desc: 'تعلم كيف تحيي أصدقاءك بالإنجليزية كل صباح بابتسامة وثقة'
  },
  {
    id: 'ANChOA4SyL0',
    titleAr: 'أنشودة الكلمات السحرية: شكراً ومن فضلك',
    titleEn: 'Please and Thank You Song',
    category: 'phrases',
    categoryAr: 'العبارات والتحيات 💬',
    duration: '2:25',
    emoji: '🙏',
    desc: 'تعلم أهم عبارات الأدب واللطف باللغة الإنجليزية في حياتنا اليومية'
  }
];


