// Rozvrh a předměty - zdrojová data (InSIS, osobní rozvrh Adam Mareš)

const TIME_SLOTS = [
    '08:15-09:00',
    '09:15-10:00',
    '10:00-10:45',
    '11:00-11:45',
    '11:45-12:30',
    '12:45-13:30',
    '13:30-14:15',
    '14:30-15:15',
    '15:15-16:00',
    '16:15-17:00',
    '17:00-17:45',
    '18:00-18:45',
    '18:45-19:30'
];

const DAYS = [
    { id: 'po', short: 'Po', name: 'Pondělí', dow: 1 },
    { id: 'ut', short: 'Út', name: 'Úterý', dow: 2 },
    { id: 'st', short: 'St', name: 'Středa', dow: 3 },
    { id: 'ct', short: 'Čt', name: 'Čtvrtek', dow: 4 },
    { id: 'pa', short: 'Pá', name: 'Pátek', dow: 5 }
];

// type: 'prednaska' (zeleně) | 'cviceni' (modře, čárkovaně) - podle barvy v InSIS
// note: číslo v horním indexu u názvu v InSIS (odkaz na poznámku rozvrhu)
const COURSES = [
    {
        id: '1DP049',
        code: '1DP049',
        name: 'Cvičná firma',
        teacher: 'K. Berková',
        icon: '🏢',
        color: '#0ea5e9'
    },
    {
        id: '3PO310',
        code: '3PO310',
        name: 'Freelancing a digitální nomádství',
        teacher: 'M. Hrubošová',
        icon: '🌍',
        color: '#8b5cf6'
    },
    {
        id: '2RO106',
        code: '2RO106',
        name: 'Francouzština pro ekonomy – středně pokročilá úroveň 2 (B1)',
        teacher: 'F. M. Baudy',
        icon: '🇫🇷',
        color: '#ec4899'
    },
    {
        id: '3MG300',
        code: '3MG300',
        name: 'Sociální média a PR',
        teacher: 'J. Kovářová',
        icon: '📣',
        color: '#f59e0b'
    },
    {
        id: '3MG303',
        code: '3MG303',
        name: 'Umělá inteligence v marketingu a komunikaci firem',
        teacher: 'V. Klement',
        icon: '🤖',
        color: '#10b981'
    },
    {
        id: '3MG322',
        code: '3MG322',
        name: 'Marketing malých a středních podniků',
        teacher: 'M. Procházková',
        icon: '📈',
        color: '#ef4444'
    },
    {
        id: '5FI404',
        code: '5FI404',
        name: 'Kognitivní věda',
        teacher: 'M. Vacura',
        icon: '🧠',
        color: '#6366f1'
    }
];

// from/to = index prvního a posledního bloku v TIME_SLOTS (včetně)
const SCHEDULE = [
    { courseId: '1DP049', day: 'ut', from: 1,  to: 2,  room: 'SB 105', type: 'cviceni',   note: 1 },
    { courseId: '3PO310', day: 'ut', from: 7,  to: 8,  room: 'RB 107', type: 'cviceni',   note: 1 },
    { courseId: '2RO106', day: 'ut', from: 9,  to: 10, room: 'SB 328', type: 'cviceni',   note: 1 },
    { courseId: '3MG300', day: 'ut', from: 11, to: 12, room: 'NB A',   type: 'prednaska', note: 1 },
    { courseId: '3MG303', day: 'st', from: 1,  to: 2,  room: 'NB B',   type: 'prednaska', note: 2 },
    { courseId: '3MG322', day: 'st', from: 3,  to: 4,  room: 'SB 412', type: 'prednaska', note: 2 },
    { courseId: '3MG322', day: 'st', from: 5,  to: 6,  room: 'SB 412', type: 'cviceni',   note: 2 },
    { courseId: '5FI404', day: 'st', from: 9,  to: 12, room: 'SB 236', type: 'prednaska', note: 2 }
];
