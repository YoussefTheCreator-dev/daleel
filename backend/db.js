const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'daleel.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    initials      TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('fresh','senior')),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seniors (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER REFERENCES users(id),
    major     TEXT NOT NULL,
    year      TEXT NOT NULL,
    gpa       TEXT NOT NULL,
    available INTEGER DEFAULT 1,
    bio       TEXT,
    color     TEXT DEFAULT '#3d6b4f',
    topics    TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    freshman_id    INTEGER REFERENCES users(id),
    senior_id      INTEGER REFERENCES seniors(id),
    type           TEXT NOT NULL CHECK(type IN ('call','meet')),
    slot           TEXT NOT NULL,
    location       TEXT,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('card','cash')),
    status         TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','completed','cancelled')),
    topic          TEXT,
    earned         INTEGER DEFAULT 10,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    senior_id   INTEGER REFERENCES seniors(id),
    amount      INTEGER NOT NULL,
    destination TEXT NOT NULL CHECK(destination IN ('bank','uni')),
    status      TEXT DEFAULT 'pending',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('password123', 10);

  const SENIORS = [
    { email:'sara.almansouri@university.ac.ae',   name:'Sara Al Mansouri',  initials:'SM', color:'#3d6b4f', major:'IT',                        year:'4th Year', gpa:'3.8', available:1, bio:"Hey! I went through the IT curriculum and can help you pick courses, find internships, and build your first real projects. Always happy to chat 😊",                                                              topics:['Courses','Internships','Projects','Study tips'] },
    { email:'ahmed.alrashidi@university.ac.ae',   name:'Ahmed Al Rashidi',  initials:'AR', color:'#6b3d6b', major:'Computer Engineering',        year:'4th Year', gpa:'3.6', available:1, bio:"CompEng is tough but so worth it. I can walk you through the hard modules, lab reports, and how to manage the workload without burning out.",                                                                   topics:['Lab Reports','Study Plan','Programming','Hardware'] },
    { email:'fatima.alzaabi@university.ac.ae',    name:'Fatima Al Zaabi',   initials:'FZ', color:'#3d5a6b', major:'Biomedical Engineering',       year:'3rd Year', gpa:'3.9', available:0, bio:"Biomed combines biology and engineering in a really interesting way. I'll help you understand how to plan electives and get into research early.",                                                               topics:['Electives','Research','Biology','Lab Work'] },
    { email:'khalid.alhamdan@university.ac.ae',   name:'Khalid Al Hamdan',  initials:'KH', color:'#6b4f3d', major:'Architecture',                 year:'4th Year', gpa:'3.7', available:1, bio:"Studio life is intense but amazing. I can help you prep for design crits, pick up the tools, and balance the studio hours like a pro.",                                                                       topics:['Design Reviews','AutoCAD','Portfolio','Studio Life'] },
    { email:'maryam.alnuaimi@university.ac.ae',   name:'Maryam Al Nuaimi', initials:'MN', color:'#3d6b6b', major:'Public Relations',              year:'3rd Year', gpa:'3.5', available:1, bio:"PR is all about communication. I'll help you navigate the major, find campus events to join, and sharpen your writing skills.",                                                                               topics:['Networking','Events','Writing','Personal Brand'] },
    { email:'omar.alketbi@university.ac.ae',      name:'Omar Al Ketbi',     initials:'OK', color:'#6b6b3d', major:'Public Health',                year:'4th Year', gpa:'3.6', available:0, bio:"Public health changed how I see the world. I can guide you through research methods, community fieldwork, and the most valuable electives.",                                                                   topics:['Research','Fieldwork','Electives','Community Work'] },
    { email:'noura.alshamsi@university.ac.ae',    name:'Noura Al Shamsi',   initials:'NS', color:'#4f3d6b', major:'Cybersecurity Engineering',    year:'4th Year', gpa:'3.8', available:1, bio:"Cyber is one of the fastest-growing fields right now. I'll help you plan your specialization, get into CTFs, and understand what employers look for.",                                                       topics:['Specialization','CTF Prep','Certifications','Career'] },
    { email:'saeed.almansoori@university.ac.ae',  name:'Saeed Al Mansoori', initials:'SM', color:'#6b3d3d', major:'Civil Engineering',             year:'3rd Year', gpa:'3.5', available:1, bio:"Civil gives you real-world skills from early on. I'll help with the math-heavy modules and finding site internships in Abu Dhabi.",                                                                         topics:['Internships','Structural Maths','CAD','Field Work'] },
    { email:'reem.aldhaheri@university.ac.ae',    name:'Reem Al Dhaheri',   initials:'RD', color:'#3d6b4a', major:'Mechanical Engineering',        year:'4th Year', gpa:'3.7', available:0, bio:"MechE has some of the best labs on campus. I went through all the major modules and can share the study approach that actually works.",                                                                       topics:['Thermodynamics','Lab Reports','GPA Tips','Internships'] },
    { email:'hessa.almazrouei@university.ac.ae',  name:'Hessa Al Mazrouei', initials:'HM', color:'#5a6b3d', major:'Psychology',                   year:'3rd Year', gpa:'3.9', available:1, bio:"Psychology opens so many doors. I can help you understand the research side, which courses to prioritize, and how to use the degree creatively.",                                                             topics:['Research','Counseling Track','Electives','Career Options'] },
  ];

  const insUser   = db.prepare('INSERT INTO users (email, password_hash, name, initials, role) VALUES (?,?,?,?,?)');
  const insSenior = db.prepare('INSERT INTO seniors (user_id, major, year, gpa, available, bio, color, topics) VALUES (?,?,?,?,?,?,?,?)');
  const insBk     = db.prepare('INSERT INTO bookings (freshman_id, senior_id, type, slot, payment_method, status, topic, earned) VALUES (?,?,?,?,?,?,?,?)');

  db.transaction(() => {
    // freshman seed
    const freshId = insUser.run('yousef@university.ac.ae', hash, 'Yousef Ahmed', 'YA', 'fresh').lastInsertRowid;

    for (const s of SENIORS) {
      const uid = insUser.run(s.email, hash, s.name, s.initials, 'senior').lastInsertRowid;
      const sid = insSenior.run(uid, s.major, s.year, s.gpa, s.available, s.bio, s.color, JSON.stringify(s.topics)).lastInsertRowid;

      // seed 3 past + 2 upcoming for first senior only
      if (s.email === 'sara.almansouri@university.ac.ae') {
        insBk.run(freshId, sid, 'call', 'Mon 9:00 AM', 'card', 'completed', 'Study tips', 10);
        insBk.run(freshId, sid, 'meet', 'Tue 3:30 PM', 'cash', 'completed', 'Electives guidance', 10);
        insBk.run(freshId, sid, 'call', 'Wed 11:00 AM', 'card', 'completed', 'Career paths', 10);
        insBk.run(freshId, sid, 'call', 'Mon 2:00 PM', 'card', 'upcoming', 'Course planning', 10);
        insBk.run(freshId, sid, 'meet', 'Thu 1:00 PM', 'cash', 'upcoming', 'Internship advice', 10);
      }
    }
  })();

  console.log('Database seeded');
}

module.exports = db;
