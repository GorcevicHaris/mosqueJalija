// Poznati (ustaljeni) arapski tekstovi koji se uče u hutbama i predavanjima: uvod hutbe (hutbetul-hadže),
// salavat, završne formule, česti ajeti. Whisper (-l ar) ih prepoznaje bez harakata i sa sitnim
// greškama; kad je prepoznati tekst nedvosmisleno jedan od ovih, zamjenjuje se tačnim tekstom sa
// harakatima i dobija prevod. Sve ostalo ostaje kako je whisper prepoznao (uz "provjeriti": true).
//
// Polja: ar (sa harakatima), bs (prevod, ijekavica), en (English), izvor ({ bs, en } za ajete).
// Prevodi su dijelovi rečenice, pa se uzastopni dijelovi mogu spajati u jedan segment.

/** Arapski tekst bez harakata i sa ujednačenim elifom/hemzom — za poređenje. */
export function normAr(t) {
  return String(t || '')
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '') // harakati, znakovi učenja, tatvil
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const POZNATI = [
  // ---------- uvod hutbe (hutbetul-hadže) ----------
  { kljuc: 'hamd', vrsta: 'uvod', ar: 'إِنَّ الْحَمْدَ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ', bs: 'Zaista, hvala pripada Allahu; Njega hvalimo, od Njega pomoć tražimo i od Njega oprost molimo.', en: 'Indeed, all praise belongs to Allah; we praise Him, seek His help and ask His forgiveness.' },
  { kljuc: 'hamd-b', vrsta: 'uvod', ar: 'الْحَمْدُ لِلَّهِ نَحْمَدُهُ وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ', bs: 'Hvala pripada Allahu; Njega hvalimo, od Njega pomoć tražimo i od Njega oprost molimo.', en: 'All praise belongs to Allah; we praise Him, seek His help and ask His forgiveness.' },
  { kljuc: 'hamd-t', vrsta: 'uvod', samoRucno: true, ar: 'نَحْمَدُهُ تَعَالَى وَنَسْتَعِينُهُ وَنَسْتَغْفِرُهُ', bs: 'Njega Uzvišenog hvalimo, od Njega pomoć tražimo i od Njega oprost molimo.', en: 'We praise Him, the Exalted, seek His help and ask His forgiveness.' },
  { kljuc: 'euzu', vrsta: 'uvod', ar: 'وَنَعُوذُ بِاللَّهِ مِنْ شُرُورِ أَنْفُسِنَا وَمِنْ سَيِّئَاتِ أَعْمَالِنَا', bs: 'Utječemo se Allahu od zla naših duša i od naših loših djela.', en: 'We seek refuge in Allah from the evils of our souls and from our bad deeds.' },
  { kljuc: 'uputa', vrsta: 'uvod', ar: 'مَنْ يَهْدِهِ اللَّهُ فَلَا مُضِلَّ لَهُ، وَمَنْ يُضْلِلْ فَلَا هَادِيَ لَهُ', bs: 'Koga Allah uputi, njega niko ne može zavesti, a koga On ostavi u zabludi, njega niko ne može uputiti.', en: 'Whomever Allah guides, none can lead astray, and whomever He leaves astray, none can guide.' },
  { kljuc: 'sehadet', vrsta: 'uvod', ar: 'وَأَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', bs: 'Svjedočim da nema boga osim Allaha, Jedinog, Koji nema sudruga,', en: 'I bear witness that there is no god but Allah alone, Who has no partner,' },
  { kljuc: 'sehadet-n', vrsta: 'uvod', ar: 'وَنَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ', bs: 'Svjedočimo da nema boga osim Allaha, Jedinog, Koji nema sudruga,', en: 'We bear witness that there is no god but Allah alone, Who has no partner,' },
  { kljuc: 'sehadet2', vrsta: 'uvod', ar: 'وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', bs: 'i svjedočim da je Muhammed Njegov rob i poslanik.', en: 'and I bear witness that Muhammad is His servant and messenger.' },
  { kljuc: 'sehadet2-n', vrsta: 'uvod', ar: 'وَنَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', bs: 'i svjedočimo da je Muhammed Njegov rob i poslanik.', en: 'and we bear witness that Muhammad is His servant and messenger.' },
  { kljuc: 'poslan', vrsta: 'uvod', ar: 'أَرْسَلَهُ اللَّهُ بِالْحَقِّ بَشِيرًا وَنَذِيرًا وَسِرَاجًا مُنِيرًا', bs: 'Allah ga je poslao s istinom kao donosioca radosnih vijesti, opominjača i svjetiljku koja sija,', en: 'Allah sent him with the truth as a bearer of glad tidings, a warner and a light-giving lamp,' },
  { kljuc: 'lijunzira', vrsta: 'uvod', ar: 'لِيُنْذِرَ مَنْ كَانَ حَيًّا وَيَحِقَّ الْقَوْلُ عَلَى الْكَافِرِينَ', bs: 'da opominje one čija su srca živa i da se obistini Riječ protiv nevjernika (Ja-Sin, 70).', en: 'to warn whoever is alive (of heart) and so that the Word may be fulfilled against the disbelievers (Ya-Sin 36:70).' },
  { kljuc: 'salavat-ali', vrsta: 'uvod', ar: 'صَلَّى اللَّهُ تَعَالَى عَلَيْهِ وَعَلَى آلِهِ الطَّيِّبِينَ الطَّاهِرِينَ', bs: 'Neka Uzvišeni Allah blagoslovi njega i njegovu dobru i čistu porodicu', en: 'May Allah the Exalted bless him and his good and pure family' },
  { kljuc: 'salavat-ashab', vrsta: 'uvod', ar: 'وَأَصْحَابِهِ الْكِرَامِ الْهُدَاةِ الْمُهْتَدِينَ', bs: 'i njegove plemenite ashabe, upućene koji su i druge upućivali,', en: 'and his noble companions, the rightly guided who guided others,' },
  { kljuc: 'salavat-teslim', vrsta: 'uvod', ar: 'وَسَلَّمَ تَسْلِيمًا كَثِيرًا إِلَى يَوْمِ الدِّينِ', bs: 'i neka mu podari obilan selam do Sudnjeg dana.', en: 'and grant him abundant peace until the Day of Judgement.' },
  { kljuc: 'kale', vrsta: 'uvod', ar: 'قَالَ اللَّهُ فِي كِتَابِهِ الْكَرِيمِ', bs: 'Allah kaže u Svojoj plemenitoj Knjizi:', en: 'Allah says in His noble Book:' },
  { kljuc: 'kale-t', vrsta: 'uvod', ar: 'قَالَ اللَّهُ تَعَالَى فِي كِتَابِهِ الْكَرِيمِ', bs: 'Uzvišeni Allah kaže u Svojoj plemenitoj Knjizi:', en: 'Allah the Exalted says in His noble Book:' },
  { kljuc: '3:102', vrsta: 'ajet', ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنْتُمْ مُسْلِمُونَ', bs: '„O vjernici, bojte se Allaha onako kako Ga se treba bojati i ne umirite drugačije nego kao muslimani!“ (Ali Imran, 102)', en: '“O you who believe, fear Allah as He deserves to be feared, and do not die except as Muslims.” (Al Imran 3:102)' },
  { kljuc: 'emma-bad', vrsta: 'uvod', ar: 'أَمَّا بَعْدُ', bs: 'A zatim:', en: 'To proceed:' },
  { kljuc: 'fe-emma-bad', vrsta: 'uvod', ar: 'فَأَمَّا بَعْدُ', bs: 'A zatim:', en: 'To proceed:' },
  // varijante uvoda (pojedini imami)
  { kljuc: 'hamd-jehikku', vrsta: 'uvod', ar: 'الْحَمْدُ لِلَّهِ يُحِقُّ الْحَقَّ وَيُبْطِلُ الْبَاطِلَ وَلَوْ كَرِهَ الْمُجْرِمُونَ', bs: 'Hvala Allahu, Koji istinu utvrđuje, a neistinu poništava, makar to bilo mrsko zločincima (usp. El-Enfal, 8).', en: 'Praise be to Allah, Who establishes the truth and abolishes falsehood, even if the criminals dislike it (cf. Al-Anfal 8:8).' },
  { kljuc: 'sehadet2-sejjid', vrsta: 'uvod', ar: 'وَأَشْهَدُ أَنَّ سَيِّدَنَا وَنَبِيَّنَا مُحَمَّدًا عَبْدُهُ وَحَبِيبُهُ وَرَسُولُهُ', bs: 'i svjedočim da je naš prvak i vjerovjesnik Muhammed Njegov rob, miljenik i poslanik.', en: 'and I bear witness that our master and prophet Muhammad is His servant, His beloved and His messenger.' },
  { kljuc: 'sehadet2-habib', vrsta: 'uvod', ar: 'وَنَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَحَبِيبُهُ وَصَفِيُّهُ وَخَلِيلُهُ', bs: 'i svjedočimo da je Muhammed Njegov rob, miljenik, odabranik i prijatelj.', en: 'and we bear witness that Muhammad is His servant, His beloved, His chosen one and His close friend.' },
  { kljuc: 'eda-emanet', vrsta: 'uvod', ar: 'أَدَّى الْأَمَانَةَ وَبَلَّغَ الرِّسَالَةَ وَنَصَحَ الْأُمَّةَ وَجَاهَدَ فِي سَبِيلِ اللَّهِ حَقَّ جِهَادِهِ حَتَّى أَتَاهُ الْيَقِينُ', bs: 'Izvršio je emanet, dostavio poslanicu, savjetovao ummet i borio se na Allahovom putu onako kako treba, sve dok mu nije došla smrt.', en: 'He fulfilled the trust, conveyed the message, gave sincere counsel to the ummah and strove in the way of Allah as He deserves, until certainty (death) came to him.' },
  { kljuc: 'terekena', vrsta: 'uvod', ar: 'وَتَرَكَنَا عَلَى الْمَحَجَّةِ الْبَيْضَاءِ لَيْلُهَا كَنَهَارِهَا لَا يَزِيغُ عَنْهَا بَعْدَهُ إِلَّا هَالِكٌ', bs: 'Ostavio nas je na jasnom, bijelom putu čija je noć kao dan – od njega poslije njega skreće samo onaj ko propada.', en: 'He left us upon the clear white path whose night is like its day; none strays from it after him except one who is ruined.' },
  { kljuc: 'poslan-huda', vrsta: 'uvod', ar: 'أَرْسَلَهُ اللَّهُ تَعَالَى بِالْهُدَى وَدِينِ الْحَقِّ لِيُظْهِرَهُ عَلَى الدِّينِ كُلِّهِ', bs: 'Uzvišeni Allah ga je poslao s uputom i pravom vjerom da je uzdigne iznad svih vjera,', en: 'Allah the Exalted sent him with guidance and the religion of truth to make it prevail over all religion,' },
  { kljuc: 'poslan-huda-tb', vrsta: 'uvod', ar: 'أَرْسَلَهُ اللَّهُ تَبَارَكَ وَتَعَالَى بِالْهُدَى وَدِينِ الْحَقِّ لِيُظْهِرَهُ عَلَى الدِّينِ كُلِّهِ', bs: 'Allah, Blagoslovljeni i Uzvišeni, poslao ga je s uputom i pravom vjerom da je uzdigne iznad svih vjera,', en: 'Allah, Blessed and Exalted, sent him with guidance and the religion of truth to make it prevail over all religion,' },
  { kljuc: 'kerihe-kafirun', vrsta: 'uvod', ar: 'وَلَوْ كَرِهَ الْكَافِرُونَ', bs: 'makar to bilo mrsko nevjernicima', en: 'even if the disbelievers dislike it' },
  { kljuc: 'kerihe-musrikun', vrsta: 'uvod', ar: 'وَلَوْ كَرِهَ الْمُشْرِكُونَ', bs: 'i makar to bilo mrsko mnogobošcima (usp. Et-Tevba, 33; Es-Saff, 8–9).', en: 'and even if the polytheists dislike it (cf. At-Tawbah 9:33; As-Saff 61:8–9).' },
  { kljuc: 'salavatu-rabbi', vrsta: 'uvod', ar: 'فَصَلَوَاتُ رَبِّي وَسَلَامُهُ عَلَيْهِ', bs: 'Neka su salavati i selami moga Gospodara na njega', en: 'May the blessings and peace of my Lord be upon him' },
  { kljuc: 'ala-alihit-tajjibin', vrsta: 'uvod', ar: 'وَعَلَى آلِهِ الطَّيِّبِينَ الطَّاهِرِينَ', bs: 'i na njegovu dobru i čistu porodicu', en: 'and upon his good and pure family' },
  { kljuc: 'ala-alihi-ve-sahbihi', vrsta: 'uvod', ar: 'وَعَلَى آلِهِ وَصَحْبِهِ', bs: 'i na njegovu porodicu i ashabe', en: 'and upon his family and companions' },
  { kljuc: 'men-sare', vrsta: 'uvod', ar: 'وَمَنْ سَارَ عَلَى نَهْجِهِ وَاقْتَفَى أَثَرَهُ إِلَى يَوْمِ الدِّينِ', bs: 'i na one koji idu njegovim putem i slijede njegove stope do Sudnjeg dana.', en: 'and upon those who follow his way and tread in his footsteps until the Day of Judgement.' },
  { kljuc: 'men-tebiahum', vrsta: 'uvod', ar: 'وَمَنِ اتَّبَعَهُمْ بِإِحْسَانٍ إِلَى يَوْمِ الدِّينِ', bs: 'i na one koji ih u dobru slijede do Sudnjeg dana.', en: 'and upon those who follow them in excellence until the Day of Judgement.' },
  { kljuc: 'ridvan', vrsta: 'uvod', ar: 'رِضْوَانُ اللَّهِ تَعَالَى عَلَيْنَا وَعَلَيْهِمْ أَجْمَعِينَ', bs: 'Neka je Allahovo zadovoljstvo na nama i na svima njima.', en: 'May the pleasure of Allah the Exalted be upon us and upon all of them.' },
  { kljuc: 'summe-emma-bad', vrsta: 'uvod', ar: 'ثُمَّ أَمَّا بَعْدُ', bs: 'A zatim:', en: 'To proceed:' },
  // ---------- česte kratke formule ----------
  { kljuc: 'besmela', vrsta: 'formula', ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', bs: 'U ime Allaha, Milostivog, Samilosnog.', en: 'In the name of Allah, the Most Gracious, the Most Merciful.' },
  { kljuc: 'euzubillah', vrsta: 'formula', ar: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', bs: 'Utječem se Allahu od prokletog šejtana.', en: 'I seek refuge in Allah from Satan, the accursed.' },
  { kljuc: 'sadaka', vrsta: 'formula', ar: 'صَدَقَ اللَّهُ الْعَظِيمُ', bs: 'Istinu je rekao Allah Veličanstveni.', en: 'Allah the Almighty has spoken the truth.' },
  { kljuc: 'hamd-alemin', vrsta: 'formula', ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', bs: 'Hvala Allahu, Gospodaru svjetova,', en: 'Praise be to Allah, Lord of the worlds,' },
  { kljuc: 'salat-resul', vrsta: 'formula', ar: 'وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ', bs: 'a salavat i selam na Allahovog Poslanika', en: 'and blessings and peace be upon the Messenger of Allah' },
  { kljuc: 'salat-nebijj', vrsta: 'formula', ar: 'وَالصَّلَاةُ وَالسَّلَامُ عَلَى نَبِيِّنَا مُحَمَّدٍ', bs: 'a salavat i selam na našeg Vjerovjesnika Muhammeda', en: 'and blessings and peace be upon our Prophet Muhammad' },
  { kljuc: 'ala-alihi', vrsta: 'formula', ar: 'وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ', bs: 'i na njegovu porodicu i sve njegove ashabe.', en: 'and upon his family and all his companions.' },
  { kljuc: 'ja-rabb', vrsta: 'dova', ar: 'يَا رَبَّ الْعَالَمِينَ', bs: '…o Gospodaru svjetova.', en: '…O Lord of the worlds.' },
  { kljuc: 'amin', vrsta: 'dova', ar: 'آمِينَ يَا رَبَّ الْعَالَمِينَ', bs: 'Amin, o Gospodaru svjetova.', en: 'Amen, O Lord of the worlds.' },
  { kljuc: 'selam', vrsta: 'formula', ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ', bs: 'Neka je na vas mir, Allahova milost i Njegov blagoslov.', en: 'Peace be upon you, and the mercy of Allah and His blessings.' },
  { kljuc: 'tekbir', vrsta: 'formula', ar: 'اللَّهُ أَكْبَرُ', bs: 'Allah je najveći.', en: 'Allah is the Greatest.' },
  // ---------- završetak (prve) hutbe ----------
  { kljuc: 'bareka', vrsta: 'dova', ar: 'بَارَكَ اللَّهُ لِي وَلَكُمْ فِي الْقُرْآنِ الْعَظِيمِ', bs: 'Neka Allah blagoslovi mene i vas Veličanstvenim Kur’anom', en: 'May Allah bless me and you through the Mighty Qur’an' },
  { kljuc: 'nefeani', vrsta: 'dova', ar: 'وَنَفَعَنِي وَإِيَّاكُمْ بِمَا فِيهِ مِنَ الْآيَاتِ وَالذِّكْرِ الْحَكِيمِ', bs: 'i neka mene i vas okoristi ajetima i mudrom opomenom koji su u njemu.', en: 'and benefit me and you with the verses and the wise reminder it contains.' },
  { kljuc: 'ekulu', vrsta: 'dova', ar: 'أَقُولُ قَوْلِي هَٰذَا وَأَسْتَغْفِرُ اللَّهَ لِي وَلَكُمْ', bs: 'Ovo govorim i molim Allaha za oprost i sebi i vama,', en: 'I say these words of mine and ask Allah for forgiveness for myself and for you,' },
  { kljuc: 'festagfiruhu', vrsta: 'dova', ar: 'فَاسْتَغْفِرُوهُ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ', bs: 'pa i vi od Njega oprost tražite – On je, zaista, Onaj Koji prašta i Milostiv je.', en: 'so ask Him for forgiveness; truly He is the Oft-Forgiving, the Most Merciful.' },
  { kljuc: 'ekulu-ma', vrsta: 'dova', ar: 'أَقُولُ مَا تَسْمَعُونَ وَأَسْتَغْفِرُ اللَّهَ الْعَظِيمَ لِي وَلَكُمْ', bs: 'Govorim ovo što čujete i molim Allaha Veličanstvenog za oprost i sebi i vama,', en: 'I say what you hear and ask Allah the Almighty for forgiveness for myself and for you,' },
  // ---------- česti ajeti na kraju hutbe/predavanja ----------
  { kljuc: '33:56', vrsta: 'ajet', ar: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا', bs: '„Allah i Njegovi meleki zaista blagoslivljaju Vjerovjesnika. O vjernici, i vi ga blagoslivljajte i šaljite mu selam!“ (El-Ahzab, 56)', en: '“Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and greet him with peace.” (Al-Ahzab 33:56)' },
  { kljuc: 'salli', vrsta: 'salavat', ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ', bs: 'Allahu moj, blagoslovi Muhammeda i porodicu Muhammedovu kao što si blagoslovio Ibrahima i porodicu Ibrahimovu – Ti si, zaista, Hvaljeni i Slavni.', en: 'O Allah, send blessings upon Muhammad and the family of Muhammad as You sent blessings upon Ibrahim and the family of Ibrahim; You are indeed Praiseworthy, Glorious.' },
  { kljuc: 'barik', vrsta: 'salavat', ar: 'اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ', bs: 'Allahu moj, daj berićet Muhammedu i porodici Muhammedovoj kao što si dao berićet Ibrahimu i porodici Ibrahimovoj – Ti si, zaista, Hvaljeni i Slavni.', en: 'O Allah, bless Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim; You are indeed Praiseworthy, Glorious.' },
  { kljuc: '2:201', vrsta: 'dova', ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', bs: '„Gospodaru naš, podaj nam dobro na ovome svijetu i dobro na onome svijetu, i sačuvaj nas kazne u Vatri!“ (El-Bekare, 201)', en: '“Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.” (Al-Baqarah 2:201)' },
  { kljuc: '37:180', vrsta: 'ajet', ar: 'سُبْحَانَ رَبِّكَ رَبِّ الْعِزَّةِ عَمَّا يَصِفُونَ ۝ وَسَلَامٌ عَلَى الْمُرْسَلِينَ ۝ وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', bs: '„Neka je slavljen tvoj Gospodar, Gospodar moći, iznad onoga što Mu pripisuju! I mir poslanicima! I hvala Allahu, Gospodaru svjetova!“ (Es-Saffat, 180–182)', en: '“Glory be to your Lord, the Lord of might, above what they describe! And peace be upon the messengers, and praise be to Allah, Lord of the worlds.” (As-Saffat 37:180–182)' },
];

// Česti ajeti koji se uče u namazu poslije hutbe i na predavanjima (dodaju se uz ključ u ručnoj lekturi).
POZNATI.push(
  { kljuc: 'fatiha-2-5', vrsta: 'ajet', ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', bs: '„Hvala Allahu, Gospodaru svjetova, Milostivom, Samilosnom, Vladaru Sudnjeg dana! Samo Tebe obožavamo i samo od Tebe pomoć tražimo.“ (El-Fatiha, 2–5)', en: '“Praise be to Allah, Lord of the worlds, the Most Gracious, the Most Merciful, Master of the Day of Judgement. You alone we worship and You alone we ask for help.” (Al-Fatihah 1:2–5)' },
  { kljuc: 'fatiha-6-7', vrsta: 'ajet', ar: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', bs: '„Uputi nas na Pravi put, put onih kojima si milost darovao, a ne onih na koje si se rasrdio, niti onih koji su zalutali!“ (El-Fatiha, 6–7)', en: '“Guide us to the straight path, the path of those You have blessed, not of those who have earned Your anger, nor of those who have gone astray.” (Al-Fatihah 1:6–7)' },
  { kljuc: '4:1', vrsta: 'ajet', ar: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ مِنْ نَفْسٍ وَاحِدَةٍ وَخَلَقَ مِنْهَا زَوْجَهَا وَبَثَّ مِنْهُمَا رِجَالًا كَثِيرًا وَنِسَاءً ۚ وَاتَّقُوا اللَّهَ الَّذِي تَسَاءَلُونَ بِهِ وَالْأَرْحَامَ ۚ إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا', bs: '„O ljudi, bojte se Gospodara svoga, Koji vas je od jednog čovjeka stvorio – a od njega je stvorio njegovu ženu – i od njih dvoje mnogo ljudi i žena rasijao. I bojte se Allaha, s čijim imenom jedni od drugih tražite, i čuvajte rodbinske veze, jer Allah, zaista, nad vama bdi.“ (En-Nisa, 1)', en: '“O mankind, fear your Lord, who created you from a single soul, created from it its mate and spread from both of them many men and women. And fear Allah, through whom you ask one another, and the ties of kinship. Indeed, Allah is ever watchful over you.” (An-Nisa 4:1)' },
  { kljuc: 'asdekal-kelam', vrsta: 'uvod', ar: 'أَلَا إِنَّ أَصْدَقَ الْكَلَامِ كَلَامُ اللَّهِ، وَخَيْرَ الْهَدْيِ هَدْيُ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَشَرَّ الْأُمُورِ مُحْدَثَاتُهَا', bs: 'Zaista, najistinitiji govor je Allahov govor, najbolja uputa je uputa Muhammeda, sallallahu alejhi ve sellem, a najgore stvari su novotarije (iz hadisa, Muslim).', en: 'Indeed, the truest speech is the speech of Allah, the best guidance is the guidance of Muhammad, peace be upon him, and the worst of matters are the newly invented ones (from a hadith, Muslim).' },
  { kljuc: 'jedded', vrsta: 'formula', ar: 'جَدِّدْ حَيَاةَ الْقَلْبِ بِالْقُرْآنِ كَيْ تَطْمَئِنَّ الرُّوحُ بِالْإِيمَانِ', bs: 'Obnovi život srca Kur’anom, da bi se duša smirila imanom.', en: 'Renew the life of the heart with the Qur’an, so that the soul may find peace in faith.' },
  { kljuc: '12:3', vrsta: 'ajet', ar: 'نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ بِمَا أَوْحَيْنَا إِلَيْكَ هَٰذَا الْقُرْآنَ وَإِنْ كُنْتَ مِنْ قَبْلِهِ لَمِنَ الْغَافِلِينَ', bs: '„Mi ti kazujemo najljepše kazivanje objavljujući ti ovaj Kur’an, a ti prije njega o tome nisi ništa znao.“ (Jusuf, 3)', en: '“We relate to you the best of stories in revealing to you this Qur’an, though before it you were among the unaware.” (Yusuf 12:3)' },
  { kljuc: '3:18', vrsta: 'ajet', ar: 'شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ قَائِمًا بِالْقِسْطِ ۚ لَا إِلَٰهَ إِلَّا هُوَ الْعَزِيزُ الْحَكِيمُ', bs: '„Allah svjedoči da nema boga osim Njega – a i meleki i oni koji posjeduju znanje – On pravedno upravlja; nema boga osim Njega, Silnog i Mudrog.“ (Ali Imran, 18)', en: '“Allah bears witness that there is no god but Him, as do the angels and those of knowledge, maintaining justice. There is no god but Him, the Almighty, the All-Wise.” (Al Imran 3:18)' },
);

// ---------- prepoznavanje ----------
const tok = (t) => normAr(t).split(' ').filter(Boolean);

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return m || n;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const c = [i];
    for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    p = c;
  }
  return p[n];
}
// riječ "odgovara" ako je ista ili se razlikuje u jednom slovu (duže riječi u dva)
const isti = (a, b) => a === b || lev(a, b) <= (Math.min(a.length, b.length) >= 6 ? 2 : Math.min(a.length, b.length) >= 3 ? 1 : 0);

/** Sličnost dva niza riječi: 2·LCS / (|a|+|b|); tačna riječ vrijedi 1, približna 0,9. */
export function slicnost(a, b) {
  if (!a.length || !b.length) return 0;
  const d = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const v = a[i - 1] === b[j - 1] ? 1 : isti(a[i - 1], b[j - 1]) ? 0.9 : 0;
      d[i][j] = Math.max(d[i - 1][j], d[i][j - 1], v ? d[i - 1][j - 1] + v : 0);
    }
  return (2 * d[a.length][b.length]) / (a.length + b.length);
}

// samoRucno = ne prepoznaje se automatski (lako se zamijeni sa sličnim tekstom), samo u ručnoj lekturi
const KATALOG = POZNATI.filter((p) => !p.samoRucno).map((p) => ({ ...p, t: tok(p.ar) }));

/**
 * Rastavlja prepoznati arapski tekst (niz redova whispera sa vremenima) na poznate dijelove.
 * Redovi se spajaju, pa poznati tekst može biti razbijen na više redova i obrnuto.
 * @param {{od:number, do:number, tekst:string}[] | string} redovi
 * @returns {{ dijelovi: ({ kljuc, ar, bs, en, od, do } | { nepoznato: string, od, do })[], sve: boolean }}
 *   sve = true ako je cijeli tekst pokriven poznatim dijelovima (sigurna zamjena).
 */
export function prepoznaj(redovi, prag = 0.7) {
  if (typeof redovi === 'string') redovi = [{ od: 0, do: 0, tekst: redovi }];
  const w = [];
  const vr = []; // vrijeme za svaku riječ (procjena unutar reda)
  for (const r of redovi) {
    const t = tok(r.tekst);
    t.forEach((x, i) => {
      w.push(x);
      vr.push([r.od + ((r.do - r.od) * i) / t.length, r.od + ((r.do - r.od) * (i + 1)) / t.length]);
    });
  }
  const dijelovi = [];
  let i = 0;
  let nep = [];
  const zatvoriNep = () => {
    if (!nep.length) return;
    dijelovi.push({ nepoznato: nep.map((k) => w[k]).join(' '), od: vr[nep[0]][0], do: vr[nep[nep.length - 1]][1] });
    nep = [];
  };
  while (i < w.length) {
    let naj = null;
    for (const k of KATALOG) {
      // dio mora početi prvom (ili drugom) riječju poznatog teksta — inače bi pohlepno poređenje
      // „pojelo“ kraj prethodnog, nepoznatog teksta
      if (!isti(w[i], k.t[0]) && !(k.t.length > 3 && isti(w[i], k.t[1]))) continue;
      for (let L = Math.max(1, k.t.length - 2); L <= k.t.length + 2 && i + L <= w.length; L++) {
        const s = slicnost(w.slice(i, i + L), k.t);
        // kratke formule (1–2 riječi) moraju se poklopiti potpuno
        if (s >= (k.t.length <= 2 ? 1 : prag) && (!naj || s > naj.s || (s === naj.s && L > naj.L))) naj = { k, s, L };
      }
    }
    if (naj) {
      zatvoriNep();
      dijelovi.push({ kljuc: naj.k.kljuc, ar: naj.k.ar, bs: naj.k.bs, en: naj.k.en, od: vr[i][0], do: vr[i + naj.L - 1][1] });
      i += naj.L;
    } else {
      nep.push(i);
      i++;
    }
  }
  zatvoriNep();
  return { dijelovi, sve: dijelovi.length > 0 && dijelovi.every((d) => !d.nepoznato) };
}




/** Spaja prevode uzastopnih dijelova u rečenicu: tačka ako prethodni dio nema interpunkciju, a sljedeći počinje velikim slovom. */
export function spojiPrevode(dijelovi) {
  let out = '';
  for (const d of dijelovi.filter(Boolean)) {
    if (!out) out = d;
    else if (/[.,;:!?…–“”"»]$/.test(out) || !/^[„“"(«A-ZČĆŠŽĐ]/.test(d)) out += ' ' + d;
    else out += '. ' + d;
  }
  // veliko početno slovo i završna interpunkcija
  out = out.replace(/^([„“"(«]*)(\p{Ll})/u, (_m, a, b) => a + b.toUpperCase());
  out = out.replace(/[,;]\s*$/, '.');
  return /[\p{L}\d]$/u.test(out) ? out + '.' : out;
}

export const poKljucu = new Map(POZNATI.map((p) => [p.kljuc, p]));
