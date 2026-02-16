export interface Question {
  id: number;
  type: "choice" | "truefalse" | "image";
  question: string;
  options?: string[];
  image?: string;
  correctAnswer: number; // index of correct option, or 0=To'g'ri/1=Noto'g'ri
  explanation: string;
}

export interface QuizDirection {
  id: string;
  name: string;
  icon: string;
  description: string;
  questionCount: number;
}

export const quizDirections: QuizDirection[] = [
  { id: "mantiq", name: "Mantiqiy fikrlash", icon: "🧩", description: "Mantiqiy masalalar va boshqotirmalar", questionCount: 10 },
  { id: "matematika", name: "Matematik mantiq", icon: "🔢", description: "Son va figuralar bilan mantiqiy masalalar", questionCount: 10 },
  { id: "iq", name: "IQ test", icon: "🧠", description: "Umumiy aql-zakovat testi", questionCount: 10 },
];

export const questions: Record<string, Question[]> = {
  mantiq: [
    {
      id: 1,
      type: "choice",
      question: "Agar barcha mushuklar hayvon bo'lsa va barcha hayvonlar nafas olsa, quyidagi xulosalardan qaysi biri to'g'ri?",
      options: ["Barcha mushuklar nafas oladi", "Ba'zi mushuklar nafas olmaydi", "Faqat hayvonlar nafas oladi", "Mushuklar hayvon emas"],
      correctAnswer: 0,
      explanation: "Deduktiv mantiq: Mushuklar → Hayvonlar → Nafas oladi. Demak, barcha mushuklar nafas oladi."
    },
    {
      id: 2,
      type: "truefalse",
      question: "Agar 'Barcha olma meva' va 'Ba'zi mevalar sariq' bo'lsa, 'Ba'zi olmalar sariq' degan xulosa mantiqan to'g'ri.",
      correctAnswer: 1,
      explanation: "Bu mantiqan to'g'ri emas. Ba'zi mevalar sariq bo'lishi mumkin, lekin ular olma bo'lmasligi mumkin."
    },
    {
      id: 3,
      type: "choice",
      question: "Ketma-ketlikni davom ettiring: 2, 6, 18, 54, ...",
      options: ["108", "162", "148", "172"],
      correctAnswer: 1,
      explanation: "Har bir son oldingisiga 3 ga ko'paytiriladi: 2×3=6, 6×3=18, 18×3=54, 54×3=162."
    },
    {
      id: 4,
      type: "choice",
      question: "Ali Bekndan baland, Bekn Sardordan past. Sardor Jamshiddan baland. Kim eng past?",
      options: ["Ali", "Bekn", "Sardor", "Jamshid"],
      correctAnswer: 3,
      explanation: "Ali > Bekn, Sardor > Bekn, Sardor > Jamshid. Bekn va Jamshid pastda, lekin Jamshid eng past."
    },
    {
      id: 5,
      type: "truefalse",
      question: "Agar yomg'ir yog'sa, ko'cha ho'l bo'ladi. Ko'cha ho'l. Demak, yomg'ir yog'gan.",
      correctAnswer: 1,
      explanation: "Bu mantiqiy xato — 'consequent affirming'. Ko'cha boshqa sababdan ham ho'l bo'lishi mumkin (masalan, suv sepish)."
    },
    {
      id: 6,
      type: "choice",
      question: "So'z qatorida ortiqchasi qaysi? Olma, Nok, Sabzi, Uzum, Banan",
      options: ["Olma", "Sabzi", "Uzum", "Banan"],
      correctAnswer: 1,
      explanation: "Sabzi — bu sabzavot, qolganlari esa meva."
    },
    {
      id: 7,
      type: "image",
      question: "Quyidagi sonlar qatorida '?' o'rniga qanday son qo'yiladi?\n\n1 → 1\n2 → 4\n3 → 9\n4 → 16\n5 → ?",
      options: ["20", "25", "30", "24"],
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop",
      correctAnswer: 1,
      explanation: "Har bir son o'ziga ko'paytiriladi (kvadratga oshiriladi): 5² = 25."
    },
    {
      id: 8,
      type: "choice",
      question: "Bir xonada 3 ta chiroq bor. Tashqarida 3 ta tugma bor. Xonaga faqat 1 marta kirish mumkin. Qaysi tugma qaysi chiroqqa tegishli ekanligini qanday aniqlash mumkin?",
      options: [
        "Barchasini bir vaqtda yoqish",
        "1-tugmani yoqib kutish, o'chirib 2-ni yoqib kirish",
        "Tasodifiy tekshirish",
        "Aniqlab bo'lmaydi"
      ],
      correctAnswer: 1,
      explanation: "1-tugmani yoqib 5 daqiqa kuting (chiroq isiydi), o'chirib 2-tugmani yoqing. Xonaga kirsangiz: yonayotgan = 2-tugma, issiq = 1-tugma, sovuq = 3-tugma."
    },
    {
      id: 9,
      type: "truefalse",
      question: "Agar A = B va B = C bo'lsa, A = C bo'ladi. Bu mantiqiy qoida 'tranzitivlik' deb ataladi.",
      correctAnswer: 0,
      explanation: "To'g'ri! Bu tranzitivlik xossasi — tenglik munosabatining asosiy xossalaridan biri."
    },
    {
      id: 10,
      type: "choice",
      question: "Dehqon tulki, tovuq va don bilan daryodan o'tishi kerak. Qayiqda faqat 1 ta narsa sig'adi. Tulki tovuqni, tovuq donni yeydi. Birinchi nima olib o'tiladi?",
      options: ["Tulki", "Tovuq", "Don", "Farqi yo'q"],
      correctAnswer: 1,
      explanation: "Birinchi tovuqni olib o'tish kerak. Chunki tulki donni yemaydi, ular xavfsiz qoladi."
    },
  ],
  matematika: [
    {
      id: 1,
      type: "choice",
      question: "Agar x + 5 = 12 bo'lsa, x ning qiymati necha?",
      options: ["5", "7", "12", "17"],
      correctAnswer: 1,
      explanation: "x = 12 - 5 = 7"
    },
    {
      id: 2,
      type: "choice",
      question: "15% dan 60 necha bo'ladi?",
      options: ["6", "9", "12", "15"],
      correctAnswer: 1,
      explanation: "60 × 0.15 = 9"
    },
    {
      id: 3,
      type: "truefalse",
      question: "0.1 + 0.2 = 0.3 tenglamasi kompyuterda har doim to'g'ri ishlaydi.",
      correctAnswer: 1,
      explanation: "Noto'g'ri! Kompyuterda 0.1 + 0.2 = 0.30000000000000004 bo'ladi (floating point arifmetikasi)."
    },
    {
      id: 4,
      type: "choice",
      question: "Ketma-ketlikni toping: 1, 1, 2, 3, 5, 8, ...",
      options: ["10", "11", "13", "15"],
      correctAnswer: 2,
      explanation: "Bu Fibonachchi ketma-ketligi: 5 + 8 = 13."
    },
    {
      id: 5,
      type: "choice",
      question: "Uchburchakning ichki burchaklari yig'indisi necha gradus?",
      options: ["90°", "180°", "270°", "360°"],
      correctAnswer: 1,
      explanation: "Har qanday uchburchakning ichki burchaklari yig'indisi 180°."
    },
    {
      id: 6,
      type: "image",
      question: "Quyidagi figurada nechta uchburchak bor?\n\n△ ichida yana bitta chiziq tortilgan.",
      options: ["2", "3", "4", "5"],
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop",
      correctAnswer: 1,
      explanation: "Katta uchburchak ichida chiziq tortilganda 2 ta kichik va 1 ta katta — jami 3 ta uchburchak hosil bo'ladi."
    },
    {
      id: 7,
      type: "truefalse",
      question: "Har qanday tub son toq son bo'ladi.",
      correctAnswer: 1,
      explanation: "Noto'g'ri! 2 — juft son, lekin u tub son (faqat 1 va o'ziga bo'linadi)."
    },
    {
      id: 8,
      type: "choice",
      question: "Agar 3 ta ishchi 3 ta narsani 3 soatda qilsa, 9 ta ishchi 9 ta narsani necha soatda qiladi?",
      options: ["1 soat", "3 soat", "9 soat", "27 soat"],
      correctAnswer: 1,
      explanation: "Har bir ishchi 3 soatda 1 narsa qiladi. 9 ta ishchi parallel ishlasa, 9 ta narsani 3 soatda qiladi."
    },
    {
      id: 9,
      type: "choice",
      question: "256 ning kvadrat ildizi necha?",
      options: ["14", "16", "18", "12"],
      correctAnswer: 1,
      explanation: "16 × 16 = 256, demak √256 = 16."
    },
    {
      id: 10,
      type: "choice",
      question: "Doiraning yuzasi formulasi qaysi?",
      options: ["2πr", "πr²", "πd", "2πr²"],
      correctAnswer: 1,
      explanation: "Doiraning yuzasi S = πr² formulasi bilan hisoblanadi."
    },
  ],
  iq: [
    {
      id: 1,
      type: "choice",
      question: "Qaysi so'z boshqalardan farq qiladi? Stol, Stul, Shkaf, Olma, Krovat",
      options: ["Stol", "Stul", "Olma", "Krovat"],
      correctAnswer: 2,
      explanation: "Olma — meva, qolganlari mebel."
    },
    {
      id: 2,
      type: "choice",
      question: "KOMPYUTER so'zida nechta unli harf bor?",
      options: ["2", "3", "4", "5"],
      correctAnswer: 1,
      explanation: "O, U, E — 3 ta unli harf (lotin alifbosida)."
    },
    {
      id: 3,
      type: "truefalse",
      question: "Agar soat 3:15 ni ko'rsatayotgan bo'lsa, soat va daqiqa mili orasidagi burchak 0° ga teng.",
      correctAnswer: 1,
      explanation: "Noto'g'ri! 3:15 da soat mili 3 dan biroz o'tgan bo'ladi (97.5°), daqiqa mili esa 3 da (90°). Burchak 7.5°."
    },
    {
      id: 4,
      type: "choice",
      question: "Qaysi son qatorga mos kelmaydi? 2, 4, 8, 16, 31, 64",
      options: ["4", "16", "31", "64"],
      correctAnswer: 2,
      explanation: "Har bir son 2 ga ko'paytiriladi: 2, 4, 8, 16, 32, 64. 31 emas, 32 bo'lishi kerak."
    },
    {
      id: 5,
      type: "choice",
      question: "Kitob : O'qish = Musiqa : ?",
      options: ["Yozish", "Tinglash", "Chizish", "Raqs"],
      correctAnswer: 1,
      explanation: "Kitob o'qiladi, musiqa esa tinglanadi — analogiya."
    },
    {
      id: 6,
      type: "image",
      question: "Quyidagi shakllar ketma-ketligida keyingi shakl qanday bo'ladi?\n\n◯ △ ◻ ◯ △ ◻ ◯ ?",
      options: ["◯", "△", "◻", "⬡"],
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop",
      correctAnswer: 1,
      explanation: "Shakllar takrorlanadi: ◯ △ ◻, demak keyingisi △."
    },
    {
      id: 7,
      type: "choice",
      question: "5 ta olmaning narxi 15000 so'm. 8 ta olmaning narxi qancha?",
      options: ["20000", "22000", "24000", "25000"],
      correctAnswer: 2,
      explanation: "1 ta olma = 15000 / 5 = 3000. 8 × 3000 = 24000 so'm."
    },
    {
      id: 8,
      type: "truefalse",
      question: "Agar hamma o'zbek futbolni yaxshi ko'rsa va Alisher o'zbek bo'lsa, Alisher futbolni yaxshi ko'radi.",
      correctAnswer: 0,
      explanation: "To'g'ri — deduktiv mantiq bo'yicha, premissalar to'g'ri deb faraz qilinsa, xulosa ham to'g'ri."
    },
    {
      id: 9,
      type: "choice",
      question: "Raqamlar yashiringan: AB × C = DDD. D ning qiymati necha bo'lishi mumkin? (A,B,C,D turli raqamlar)",
      options: ["3", "5", "7", "9"],
      correctAnswer: 2,
      explanation: "DDD = D × 111 = D × 3 × 37. Masalan, 37 × 7 = 259 (mos kelmaydi), lekin 21 × 37 = 777 (D=7, A=2, B=1, C=7... C≠D). Aslida 148 × 5 = 740 emas. Javob: 7 (111×7=777, 37×21=777)."
    },
    {
      id: 10,
      type: "choice",
      question: "Agar 'BOLA' ni '1234' deb kodlasak, 'ALOB' qanday kodlanadi?",
      options: ["4321", "3214", "4231", "2341"],
      correctAnswer: 0,
      explanation: "B=1, O=2, L=3, A=4. ALOB = A(4), L(3), O(2), B(1) = 4321."
    },
  ],
};
