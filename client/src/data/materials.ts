export interface Material {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string;
  content: string[];
}

export const categories = [
  { id: "hayvonlar", name: "Hayvonlar", icon: "🐾", color: "from-amber-500 to-orange-600" },
  { id: "matematika", name: "Matematika", icon: "🔢", color: "from-blue-500 to-indigo-600" },
  { id: "mantiq", name: "Mantiq", icon: "🧩", color: "from-purple-500 to-violet-600" },
  { id: "tabiat", name: "Tabiat", icon: "🌿", color: "from-green-500 to-emerald-600" },
  { id: "fan", name: "Fan", icon: "🔬", color: "from-cyan-500 to-teal-600" },
  { id: "ijodkorlik", name: "Ijodkorlik", icon: "🎨", color: "from-pink-500 to-rose-600" },
];

export const materials: Material[] = [
  // Hayvonlar
  {
    id: "h1",
    category: "hayvonlar",
    title: "Quyonlar haqida qiziqarli ma'lumotlar",
    description: "Quyonlarning turmush tarzi, ovqatlanishi va xulq-atvori haqida.",
    image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop",
    content: [
      "Quyonlar — sut emizuvchilar sinfiga mansub hayvonlar bo'lib, ular tabiatda eng tez ko'payadigan hayvonlardan biridir. Quyonlarning 30 dan ortiq turi mavjud bo'lib, ular dunyoning deyarli barcha qit'alarida tarqalgan.",
      "Quyonlarning quloqlari juda uzun bo'lib, ular tovushlarni uzoqdan eshitish imkoniyatiga ega. Bu xususiyat ularga yirtqich hayvonlardan o'zlarini himoya qilishda yordam beradi. Quyonlar sekundiga 70 km tezlikda yugura oladi.",
      "Quyonlar o'txo'r hayvonlardir. Ular asosan o't-o'lan, sabzavotlar va mevalar bilan ovqatlanadi. Quyonlarning tishlari umr bo'yi o'sib turadi, shuning uchun ular doimo nimadir kemirishi kerak.",
      "Uy quyonlari aqlli va o'rgatilishi mumkin bo'lgan hayvonlardir. Ular o'z ismlarini bilishadi va oddiy buyruqlarni tushunishadi. Quyonlar ijtimoiy hayvonlar bo'lib, ular guruhda yashashni yaxshi ko'rishadi."
    ],
  },
  {
    id: "h2",
    category: "hayvonlar",
    title: "Delfinlar — dengizning aqlli hayvonlari",
    description: "Delfinlarning aql-zakovati va ularning ajoyib qobiliyatlari.",
    image: "https://images.unsplash.com/photo-1607153333879-c174d265f1d2?w=400&h=300&fit=crop",
    content: [
      "Delfinlar — sut emizuvchilar orasida eng aqlli hayvonlardan biri hisoblanadi. Ular murakkab ijtimoiy tizimga ega bo'lib, bir-birlari bilan muloqot qilish uchun maxsus tovushlardan foydalanadi.",
      "Delfinlar uxlash uchun miyasining faqat yarmini o'chiradi. Bu ularga hatto uxlab yotganda ham nafas olish va xavfdan qochish imkonini beradi. Bu hodisa 'unihemisferik uyqu' deb ataladi.",
      "Delfinlar o'z aksini ko'zguda taniy oladi — bu xususiyat faqat bir nechta hayvon turiga xos. Bu ularning o'z-o'zini anglash darajasi yuqori ekanligini ko'rsatadi.",
    ],
  },
  {
    id: "h3",
    category: "hayvonlar",
    title: "Burgutlar — osmonning hukmdorlari",
    description: "Burgutlarning ov qilish mahorati va ajoyib ko'rish qobiliyati.",
    image: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=400&h=300&fit=crop",
    content: [
      "Burgutlar yirtqich qushlar oilasiga mansub bo'lib, ular osmonning eng kuchli va tezkor ovchilaridir. Burgutlar 320 km/soat tezlikda sho'ng'ish imkoniyatiga ega.",
      "Burgutning ko'rish qobiliyati odamnikidan 4-8 baravar kuchliroq. Ular 3 km masofadan quyonni ko'ra oladi. Bu qobiliyat ularga baland parvoz paytida ham ovni aniq ko'rishga yordam beradi.",
      "Burgutlar bir juftlik bo'lib umr bo'yi birga yashaydi. Ular har yili bir xil uyada bola ochadi va bu uya yillar davomida kattlalashib boradi. Ba'zi burgut uyalari 2 tonna og'irlikka yetishi mumkin.",
    ],
  },

  // Matematika
  {
    id: "m1",
    category: "matematika",
    title: "Fibonachchi sonlari va tabiatdagi naqshlar",
    description: "Fibonachchi ketma-ketligi tabiatda qanday namoyon bo'ladi.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop",
    content: [
      "Fibonachchi ketma-ketligi — 0 va 1 dan boshlanadigan son qatori bo'lib, har bir keyingi son oldingi ikkita sonning yig'indisiga teng: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...",
      "Bu ketma-ketlik tabiatda ko'p uchraydi. Masalan, kungaboqar gulining urug'lari spiral shaklida joylashgan bo'lib, bu spirallar soni doimo Fibonachchi sonlariga teng.",
      "Qiziqarli fakt: Fibonachchi sonlarining nisbati (har bir sonni oldingi songa bo'lganda) 'oltin nisbat' ga yaqinlashadi — bu 1.618... sonidir. Bu nisbat san'at, arxitektura va tabiatda ko'p uchraydi.",
    ],
  },
  {
    id: "m2",
    category: "matematika",
    title: "Ehtimollar nazariyasi kundalik hayotda",
    description: "Ehtimollik qanday hisoblanadi va hayotda qanday ishlatiladi.",
    image: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400&h=300&fit=crop",
    content: [
      "Ehtimollar nazariyasi — hodisaning sodir bo'lish imkoniyatini o'lchaydigan matematika bo'limi. Ehtimollik 0 dan 1 gacha bo'lgan son bilan ifodalanadi, bu yerda 0 — imkonsiz hodisa, 1 — aniq hodisa.",
      "Masalan, tanga tashlanganda 'bosh' tushish ehtimoli 1/2 (50%). Zar tashlanganda 6 tushish ehtimoli 1/6 (taxminan 16.7%).",
      "Ehtimollar nazariyasi ob-havo prognozida, tibbiyotda, sug'urtada va sport o'yinlarida keng qo'llaniladi. Masalan, ob-havo prognozi '80% yomg'ir yog'adi' deganda, bu ehtimollik hisobiga asoslanadi.",
    ],
  },

  // Mantiq
  {
    id: "l1",
    category: "mantiq",
    title: "Mantiqiy fikrlash nima va uni qanday rivojlantirish mumkin?",
    description: "Mantiqiy fikrlashning asoslari va uni mashq qilish usullari.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop",
    content: [
      "Mantiqiy fikrlash — bu ma'lumotlarni tahlil qilish, sabab-natija aloqalarini topish va to'g'ri xulosa chiqarish qobiliyatidir. Bu ko'nikma maktabda, ishda va kundalik hayotda juda muhim.",
      "Mantiqiy fikrlashni rivojlantirish uchun boshqotirmalar, sudoku, shaxmat va mantiqiy masalalar yechish foydali. Shuningdek, kitob o'qish va munozaralarda qatnashish ham yordam beradi.",
      "Deduktiv mantiq — umumiy qoidadan xususiy xulosaga kelish. Masalan: 'Barcha odamlar o'ladi. Sokrat odam. Demak, Sokrat o'ladi.' Induktiv mantiq — xususiy holatlardan umumiy xulosaga kelish.",
    ],
  },
  {
    id: "l2",
    category: "mantiq",
    title: "Tanqidiy fikrlash — haqiqatni yolg'ondan ajratish",
    description: "Tanqidiy fikrlash nima va uni qanday o'rganish mumkin.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop",
    content: [
      "Tanqidiy fikrlash — bu ma'lumotni shunchaki qabul qilmasdan, uni tahlil qilish, baholash va tekshirish qobiliyatidir. Bu ko'nikma ayniqsa internet davrida juda muhim.",
      "Tanqidiy fikrlovchi inson har doim so'raydi: 'Bu ma'lumotning manbasi ishonarlimi?', 'Boshqa nuqtai nazarlar bormi?', 'Bu da'voning dalillari qanday?'",
      "Tanqidiy fikrlashni rivojlantirish uchun: turli manbalardan ma'lumot oling, o'z fikrizzni doimo tekshiring, boshqalar bilan munozara qiling va xatolardan o'rganing.",
    ],
  },

  // Tabiat
  {
    id: "t1",
    category: "tabiat",
    title: "Yomg'ir o'rmanlari — Yerning o'pkalari",
    description: "Tropik o'rmonlarning ekotizimga ta'siri va ahamiyati.",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop",
    content: [
      "Tropik yomg'ir o'rmanlari Yer yuzasining atigi 6% ini egallasa-da, barcha tirik organizm turlarining 50% dan ortig'iga uy bo'lib xizmat qiladi. Shuning uchun ular 'Yerning o'pkalari' deb ataladi.",
      "Bu o'rmonlar atmosferaga kislorod chiqaradi va karbonat angidridni yutadi. Har bir daraxt yiliga o'rtacha 22 kg karbonat angidridni yutadi.",
      "Afsuski, har daqiqada futbol maydoniga teng yomg'ir o'rmoni kesilmoqda. Bu iqlim o'zgarishi, biologik xilma-xillikning yo'qolishi va tuproq eroziyasiga olib keladi.",
    ],
  },
  {
    id: "t2",
    category: "tabiat",
    title: "Suv — hayot manbai",
    description: "Suvning tabiatdagi aylanishi va uning ahamiyati.",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop",
    content: [
      "Yer yuzasining 71% ini suv qoplaydi, lekin ichimlik suvining ulushi atigi 2.5%. Bu suvning ko'p qismi muzliklarda va yer osti suvlarida saqlanadi.",
      "Suv aylanishi — tabiatdagi eng muhim jarayonlardan biri. Suv bug'lanadi, bulutlarga aylanadi, yomg'ir yoki qor bo'lib yog'adi va daryolar orqali okeanga qaytadi. Bu jarayon milliardlab yillardan beri davom etmoqda.",
      "Inson tanasining 60-70% suvdan iborat. Biz har kuni kamida 2 litr suv ichishimiz kerak. Suvni tejash va ifloslantirilmaslik har birimizning burchimizdir.",
    ],
  },

  // Fan
  {
    id: "f1",
    category: "fan",
    title: "Quyosh tizimi va sayyoralar",
    description: "Quyosh tizimidagi sayyoralar va ularning xususiyatlari.",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop",
    content: [
      "Quyosh tizimida 8 ta sayyora mavjud: Merkuriy, Venera, Yer, Mars, Yupiter, Saturn, Uran va Neptun. Pluto 2006-yilda 'mitti sayyora' deb qayta tasniflangan.",
      "Yupiter — Quyosh tizimidagi eng katta sayyora. Uning hajmi Yernikidan 1300 marta katta. Yupiterning mashhur 'Katta Qizil Dog'' — bu 400 yildan ortiq davom etayotgan ulkan bo'ron.",
      "Yer — hayot mavjud bo'lgan yagona ma'lum sayyora. Yerning atmosferasi, suvi va Quyoshdan maqbul masofasi hayot uchun ideal sharoit yaratadi.",
    ],
  },
  {
    id: "f2",
    category: "fan",
    title: "Atom — moddaning eng kichik zarrasi",
    description: "Atomning tuzilishi va uning kashfiyoti tarixi.",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
    content: [
      "Atom — kimyoviy elementning xossalarini saqlaydigan eng kichik zarradir. Atom yadrosi (protonlar va neytronlar) va elektron bulutidan iborat.",
      "Agar atomni futbol stadiongacha kattalashtirganingizda, uning yadrosi stadion markazidagi kichik no'xatdek bo'lar edi. Atomning ko'p qismi bo'sh fazodur.",
      "Barcha moddalar atomlardan tashkil topgan. Inson tanasida taxminan 7 oktillion (7×10²⁷) atom bor. Eng keng tarqalgan elementlar: vodorod, kislorod va uglerod.",
    ],
  },

  // Ijodkorlik
  {
    id: "i1",
    category: "ijodkorlik",
    title: "Ijodiy fikrlash — g'oyalarni qanday topish mumkin?",
    description: "Ijodiy fikrlashning asoslari va uni rivojlantirish usullari.",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
    content: [
      "Ijodiy fikrlash — bu muammolarga yangicha yondashish, noodatiy g'oyalar yaratish va ularni amalga oshirish qobiliyatidir. Bu ko'nikma har bir sohada kerak.",
      "Ijodiy fikrlashni rivojlantirish usullari: 'Aqliy hujum' (brainstorming) — imkon qadar ko'p g'oyalar yozish; 'Mind map' — g'oyalarni vizual tarzda bog'lash; 'SCAMPER' — mavjud narsalarni o'zgartirish orqali yangi g'oya topish.",
      "Ijodkorlik faqat san'atda emas, fanda, texnologiyada va biznesda ham muhim. Masalan, Steve Jobs, Elon Musk kabi innovatorlar ijodiy fikrlash orqali dunyoni o'zgartirgan.",
    ],
  },
  {
    id: "i2",
    category: "ijodkorlik",
    title: "Ranglar psixologiyasi — ranglar qanday ta'sir qiladi?",
    description: "Ranglarning insonning kayfiyati va xulq-atvoriga ta'siri.",
    image: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=400&h=300&fit=crop",
    content: [
      "Ranglar insonning kayfiyati, his-tuyg'ulari va xulq-atvoriga kuchli ta'sir ko'rsatadi. Bu hodisa 'ranglar psixologiyasi' deb ataladi va marketing, dizayn va san'atda keng qo'llaniladi.",
      "Qizil rang — energiya, ehtiros va xavfni bildiradi. Ko'k rang — xotirjamlik, ishonch va professionallikni ifodalaydi. Yashil rang — tabiat, tinchlik va o'sishni anglatadi. Sariq rang — quvonch, optimizm va diqqatni tortadi.",
      "Kompaniyalar o'z logolari uchun ranglarni puxta tanlaydi. Masalan, Facebook ko'k rangni ishlatadi (ishonch), Coca-Cola qizil rangni (energiya), Starbucks yashil rangni (tabiat) tanlagan.",
    ],
  },
];
