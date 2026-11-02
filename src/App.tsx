/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, User, BookOpen, AlertCircle, Sparkles, CheckCircle, 
  Info, ShieldCheck, Lock, Activity, ArrowRight, Printer, Zap, Mail, GitBranch
} from 'lucide-react';
import { Exam, StudentSession, Teacher, CheatLog, RegistrationSettings } from './types';
import { INITIAL_EXAMS, INITIAL_STUDENT_SESSIONS, INITIAL_TEACHERS, INITIAL_CHEAT_LOGS, SCHOOL_CLASSES } from './data';
import PortalGuru from './components/PortalGuru';
import PortalSiswa from './components/PortalSiswa';
import GitHubSyncModal from './components/GitHubSyncModal';
import {
  isFirebaseEnabled,
  dbGetExams, dbSaveExams, dbSubscribeExams,
  dbGetStudentSessions, dbSaveStudentSessions, dbSubscribeStudentSessions,
  dbGetTeachers, dbSaveTeachers, dbSubscribeTeachers,
  dbGetCheatLogs, dbSaveCheatLogs, dbSubscribeCheatLogs,
  dbGetClasses, dbSaveClasses, dbSubscribeClasses,
  dbGetRegistrationSettings, dbSaveRegistrationSettings, dbSubscribeRegistrationSettings
} from './lib/firebase';

export default function App() {
  // Application Master States
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentSessions, setStudentSessions] = useState<StudentSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [cheatLogs, setCheatLogs] = useState<CheatLog[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [registrationSettings, setRegistrationSettings] = useState<RegistrationSettings>({
    currentCode: 'GURU-8B3K',
    history: []
  });

  // Current active view: 'home' | 'siswa' | 'guru'
  const [currentView, setCurrentView] = useState<'home' | 'siswa' | 'guru'>('home');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Load master data on mount & subscribe to real-time changes
  useEffect(() => {
    let unsubExams: () => void = () => {};
    let unsubSessions: () => void = () => {};
    let unsubTeachers: () => void = () => {};
    let unsubCheatLogs: () => void = () => {};
    let unsubClasses: () => void = () => {};
    let unsubReg: () => void = () => {};

    async function loadData() {
      // 1. Classes
      let finalClasses = SCHOOL_CLASSES;
      const dbClasses = await dbGetClasses();
      if (dbClasses && dbClasses.length > 0) {
        finalClasses = dbClasses;
      } else {
        const savedClasses = localStorage.getItem('classes_data');
        if (savedClasses) {
          try { finalClasses = JSON.parse(savedClasses); } catch (e) {}
        }
        if (isFirebaseEnabled) {
          await dbSaveClasses(finalClasses);
        }
      }
      setClasses(finalClasses);
      localStorage.setItem('classes_data', JSON.stringify(finalClasses));

      // 2. Exams
      let finalExams = INITIAL_EXAMS;
      const savedExamsStr = localStorage.getItem('exams_data');
      const examsInitialized = localStorage.getItem('exams_initialized');

      const dbExams = await dbGetExams();
      if (dbExams !== null) {
        if (dbExams.length > 0 || examsInitialized === 'true' || savedExamsStr !== null) {
          finalExams = dbExams;
        } else {
          finalExams = INITIAL_EXAMS;
          if (isFirebaseEnabled) await dbSaveExams(finalExams);
        }
      } else if (savedExamsStr !== null) {
        try { finalExams = JSON.parse(savedExamsStr); } catch (e) { finalExams = INITIAL_EXAMS; }
      } else {
        finalExams = INITIAL_EXAMS;
        if (isFirebaseEnabled) await dbSaveExams(finalExams);
      }
      setExams(finalExams);
      localStorage.setItem('exams_data', JSON.stringify(finalExams));
      localStorage.setItem('exams_initialized', 'true');

      // 3. Student Sessions
      let finalSessions = INITIAL_STUDENT_SESSIONS;
      const dbSessions = await dbGetStudentSessions();
      if (dbSessions && dbSessions.length > 0) {
        finalSessions = dbSessions;
      } else {
        const savedSessions = localStorage.getItem('student_sessions');
        if (savedSessions) {
          try { finalSessions = JSON.parse(savedSessions); } catch (e) {}
        }
        if (isFirebaseEnabled) {
          await dbSaveStudentSessions(finalSessions);
        }
      }
      setStudentSessions(finalSessions);
      localStorage.setItem('student_sessions', JSON.stringify(finalSessions));

      // 4. Teachers
      let finalTeachers = INITIAL_TEACHERS;
      const dbTeachers = await dbGetTeachers();
      if (dbTeachers && dbTeachers.length > 0) {
        finalTeachers = dbTeachers;
      } else {
        const savedTeachers = localStorage.getItem('teachers_data');
        if (savedTeachers) {
          try { finalTeachers = JSON.parse(savedTeachers); } catch (e) {}
        }
        if (isFirebaseEnabled) {
          await dbSaveTeachers(finalTeachers);
        }
      }
      setTeachers(finalTeachers);
      localStorage.setItem('teachers_data', JSON.stringify(finalTeachers));

      // 5. Cheat Logs
      let finalCheatLogs = INITIAL_CHEAT_LOGS;
      const savedCheatLogsStr = localStorage.getItem('cheat_logs');
      const cheatLogsInitialized = localStorage.getItem('cheat_logs_initialized');

      const dbCheatLogs = await dbGetCheatLogs();
      if (dbCheatLogs !== null) {
        if (dbCheatLogs.length > 0 || cheatLogsInitialized === 'true' || savedCheatLogsStr !== null) {
          finalCheatLogs = dbCheatLogs;
        } else {
          finalCheatLogs = INITIAL_CHEAT_LOGS;
          if (isFirebaseEnabled) await dbSaveCheatLogs(finalCheatLogs);
        }
      } else if (savedCheatLogsStr !== null) {
        try { finalCheatLogs = JSON.parse(savedCheatLogsStr); } catch (e) { finalCheatLogs = INITIAL_CHEAT_LOGS; }
      } else {
        finalCheatLogs = INITIAL_CHEAT_LOGS;
        if (isFirebaseEnabled) await dbSaveCheatLogs(finalCheatLogs);
      }
      setCheatLogs(finalCheatLogs);
      localStorage.setItem('cheat_logs', JSON.stringify(finalCheatLogs));
      localStorage.setItem('cheat_logs_initialized', 'true');

      // 6. Registration Settings
      let finalRegSettings: RegistrationSettings = {
        currentCode: 'GURU-8B3K',
        history: []
      };
      const dbReg = await dbGetRegistrationSettings();
      if (dbReg && dbReg.currentCode) {
        finalRegSettings = dbReg;
      } else {
        const savedReg = localStorage.getItem('registration_settings');
        if (savedReg) {
          try { finalRegSettings = JSON.parse(savedReg); } catch (e) {}
        }
        if (isFirebaseEnabled) {
          await dbSaveRegistrationSettings(finalRegSettings);
        }
      }
      setRegistrationSettings(finalRegSettings);
      localStorage.setItem('registration_settings', JSON.stringify(finalRegSettings));

      // Attach Real-Time Firestore listeners
      if (isFirebaseEnabled) {
        unsubExams = dbSubscribeExams((updatedExams) => {
          if (updatedExams && updatedExams.length > 0) {
            setExams(updatedExams);
            localStorage.setItem('exams_data', JSON.stringify(updatedExams));
          }
        });
        unsubSessions = dbSubscribeStudentSessions((updatedSessions) => {
          if (updatedSessions) {
            setStudentSessions(updatedSessions);
            localStorage.setItem('student_sessions', JSON.stringify(updatedSessions));
          }
        });
        unsubTeachers = dbSubscribeTeachers((updatedTeachers) => {
          if (updatedTeachers && updatedTeachers.length > 0) {
            setTeachers(updatedTeachers);
            localStorage.setItem('teachers_data', JSON.stringify(updatedTeachers));
          }
        });
        unsubCheatLogs = dbSubscribeCheatLogs((updatedLogs) => {
          if (updatedLogs) {
            setCheatLogs(updatedLogs);
            localStorage.setItem('cheat_logs', JSON.stringify(updatedLogs));
          }
        });
        unsubClasses = dbSubscribeClasses((updatedClasses) => {
          if (updatedClasses && updatedClasses.length > 0) {
            setClasses(updatedClasses);
            localStorage.setItem('classes_data', JSON.stringify(updatedClasses));
          }
        });
        unsubReg = dbSubscribeRegistrationSettings((updatedReg) => {
          if (updatedReg && updatedReg.currentCode) {
            setRegistrationSettings(updatedReg);
            localStorage.setItem('registration_settings', JSON.stringify(updatedReg));
          }
        });
      }
    }

    loadData();

    return () => {
      unsubExams();
      unsubSessions();
      unsubTeachers();
      unsubCheatLogs();
      unsubClasses();
      unsubReg();
    };
  }, []);

  // Sync back to localStorage & Firestore on any state modification
  const handleSetExams: React.Dispatch<React.SetStateAction<Exam[]>> = (value) => {
    setExams(prev => {
      const computed = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('exams_data', JSON.stringify(computed));
      dbSaveExams(computed);
      return computed;
    });
  };

  const handleSetStudentSessions: React.Dispatch<React.SetStateAction<StudentSession[]>> = (value) => {
    setStudentSessions(prev => {
      const computed = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('student_sessions', JSON.stringify(computed));
      dbSaveStudentSessions(computed);
      return computed;
    });
  };

  const handleSetTeachers: React.Dispatch<React.SetStateAction<Teacher[]>> = (value) => {
    setTeachers(prev => {
      const computed = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('teachers_data', JSON.stringify(computed));
      dbSaveTeachers(computed);
      return computed;
    });
  };

  const handleSetCheatLogs: React.Dispatch<React.SetStateAction<CheatLog[]>> = (value) => {
    setCheatLogs(prev => {
      const computed = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('cheat_logs', JSON.stringify(computed));
      dbSaveCheatLogs(computed);
      return computed;
    });
  };

  const handleSetClasses: React.Dispatch<React.SetStateAction<string[]>> = (value) => {
    setClasses(prev => {
      const computed = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('classes_data', JSON.stringify(computed));
      dbSaveClasses(computed);
      return computed;
    });
  };

  const handleSetRegistrationSettings: React.Dispatch<React.SetStateAction<RegistrationSettings>> = (value) => {
    setRegistrationSettings(prev => {
      const computed = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('registration_settings', JSON.stringify(computed));
      dbSaveRegistrationSettings(computed);
      return computed;
    });
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        currentView === 'home'
          ? 'bg-gradient-to-r from-[#0051e0] via-[#1a23dc] to-[#6306d8] relative overflow-hidden'
          : 'bg-[#f8fafc]'
      } text-slate-800 selection:bg-purple-500 selection:text-white flex flex-col justify-between`}
      id="app-root"
    >
      {/* Dynamic Views container */}
      <div className="flex-1 relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* VIEW A: LANDING PAGE (MATCHING MOCKUP IMAGE) */}
          {currentView === 'home' && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden"
            >
              {/* Top Header Controls: GitHub Online Sync */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
                <button
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full text-xs font-bold shadow-lg shadow-indigo-900/20 border border-white/60 backdrop-blur-md transition-all hover:scale-105 cursor-pointer group"
                  title="Push dan Timpa Repo GitHub Secara Online"
                >
                  <GitBranch size={14} className="text-indigo-600 group-hover:rotate-12 transition-transform" />
                  <span>Timpa Repo GitHub</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </button>
              </div>

              {/* Background Glows & Ambience */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-400/20 blur-[130px] rounded-full" />
                <div className="absolute top-1/3 left-10 w-96 h-96 bg-cyan-400/20 blur-[120px] rounded-full" />
                <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-500/25 blur-[120px] rounded-full" />
              </div>

              {/* Decorative 3D Artwork (Left: Toga & Glowing Books) - Desktop */}
              <div className="hidden lg:block absolute left-0 xl:left-2 2xl:left-8 top-[48%] -translate-y-1/2 w-[340px] xl:w-[410px] 2xl:w-[460px] pointer-events-none select-none z-0">
                <img
                  src="/assets/aistudio/hero_left_artwork.png"
                  alt="CAT SMPN 5 LR Education Artwork"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_45px_rgba(0,80,255,0.45)] [mask-image:linear-gradient(to_right,black_75%,transparent)]"
                />
              </div>

              {/* Decorative 3D Artwork (Right: Trophy & Laptop Checklist) - Desktop */}
              <div className="hidden lg:block absolute right-0 xl:right-2 2xl:right-8 top-[48%] -translate-y-1/2 w-[350px] xl:w-[430px] 2xl:w-[480px] pointer-events-none select-none z-0">
                <img
                  src="/assets/aistudio/hero_right_artwork.png"
                  alt="CAT SMPN 5 LR Evaluation Trophy"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_45px_rgba(130,40,255,0.45)] [mask-image:linear-gradient(to_left,black_75%,transparent)]"
                />
              </div>

              {/* Sparkle Stars (4-Point Stars matching image) */}
              <div className="absolute top-16 left-1/4 pointer-events-none select-none opacity-80 hidden md:block">
                <svg className="w-4 h-4 text-cyan-200 fill-current animate-pulse" viewBox="0 0 24 24">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                </svg>
              </div>
              <div className="absolute top-24 right-1/4 pointer-events-none select-none opacity-80 hidden md:block">
                <svg className="w-5 h-5 text-amber-200 fill-current animate-pulse" viewBox="0 0 24 24">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                </svg>
              </div>
              <div className="absolute top-64 right-[28%] pointer-events-none select-none opacity-60 hidden xl:block">
                <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                </svg>
              </div>

              {/* Center Main Content Container */}
              <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-6 flex flex-col items-center justify-center my-auto">
                
                {/* 1. Top Pill Badge: SISTEM VERSI 2.4.6-PRO */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0b1764]/85 text-white rounded-full text-xs font-bold border border-blue-400/40 mb-4 font-mono shadow-[0_4px_18px_rgba(0,30,120,0.4)] backdrop-blur-md">
                  <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="tracking-wide">SISTEM VERSI 2.4.6-PRO</span>
                </div>

                {/* 2. Number 5 Rounded Square Badge */}
                <div className="w-13 h-13 md:w-14 md:h-14 bg-white rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.25)] flex items-center justify-center mx-auto mb-3 border border-white/90">
                  <span className="text-3xl font-black text-[#5811d4]">5</span>
                </div>

                {/* 3. Main Title Header: CAT_SMPN5LR */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-sans tracking-tight text-white leading-tight drop-shadow-[0_4px_24px_rgba(255,255,255,0.45)] text-center">
                  CAT_SMPN5LR
                </h1>

                {/* 4. Capsule Description */}
                <div className="mt-4 md:mt-5 max-w-2xl md:max-w-3xl mx-auto px-5 md:px-8 py-3.5 bg-[#0a1854]/80 backdrop-blur-md border border-blue-400/30 rounded-2xl md:rounded-full shadow-2xl text-center">
                  <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                    Sistem Evaluasi Ujian Akhir Sekolah Mandiri yang dirancang khusus untuk memfasilitasi integrasi portal guru dan siswa SMP Negeri 5 Langke Rembong secara akurat, transparan, dan aman.
                  </p>
                </div>

                {/* 5. The Two Action Cards: Portal Siswa & Portal Guru */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 w-full max-w-4xl mt-7 md:mt-9">
                  
                  {/* Card 1: Portal Siswa */}
                  <motion.div
                    id="nav-to-siswa-btn"
                    role="button"
                    tabIndex={0}
                    onClick={() => setCurrentView('siswa')}
                    onKeyDown={(e) => { if (e.key === 'Enter') setCurrentView('siswa'); }}
                    whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(6,182,212,0.3)' }}
                    className="bg-white rounded-3xl p-7 md:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.2)] text-left cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[260px] md:min-h-[280px]"
                  >
                    {/* Top Content */}
                    <div className="space-y-4 relative z-10">
                      <div className="w-13 h-13 rounded-2xl bg-[#edf4ff] text-[#1a73e8] flex items-center justify-center border border-blue-100 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                        <User size={24} className="stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          Portal Siswa
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                          Masuk sesuai rombel kelas Anda, kerjakan soal CAT dengan navigasi nomor, timer interaktif, dan status ragu-ragu.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Link */}
                    <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-blue-600 mt-6 relative z-10 group-hover:gap-3 transition-all">
                      <span>Mulai Ujian Sekarang</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Bottom-Right Organic Wave Gradient (matching cyan wave in image) */}
                    <div className="absolute -bottom-1 -right-1 w-32 h-24 pointer-events-none select-none overflow-hidden rounded-br-3xl">
                      <svg viewBox="0 0 130 95" fill="none" className="w-full h-full">
                        <path
                          d="M130 0C100 12 55 18 35 50C15 82 5 90 0 95H130V0Z"
                          fill="url(#siswa-cyan-wave)"
                          opacity="0.9"
                        />
                        <defs>
                          <linearGradient id="siswa-cyan-wave" x1="0" y1="95" x2="130" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#38bdf8" />
                            <stop offset="1" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </motion.div>

                  {/* Card 2: Portal Guru & Pengawas */}
                  <motion.div
                    id="nav-to-guru-btn"
                    role="button"
                    tabIndex={0}
                    onClick={() => setCurrentView('guru')}
                    onKeyDown={(e) => { if (e.key === 'Enter') setCurrentView('guru'); }}
                    whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(168,85,247,0.3)' }}
                    className="bg-white rounded-3xl p-7 md:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.2)] text-left cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[260px] md:min-h-[280px]"
                  >
                    {/* Top Content */}
                    <div className="space-y-4 relative z-10">
                      <div className="w-13 h-13 rounded-2xl bg-[#f4ebff] text-[#7c3aed] flex items-center justify-center border border-purple-100 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                        <Mail size={24} className="stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                          Portal Guru & Pengawas
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                          Mendaftarkan ujian baru, menyusun 5 jenis soal, menentukan KKM, koreksi manual esai, membandingkan kondisi, dan mencetak laporan hasil.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Link */}
                    <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-purple-600 mt-6 relative z-10 group-hover:gap-3 transition-all">
                      <span>Akses Portal Evaluasi</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>

                    {/* Bottom-Right Organic Wave Gradient (matching purple wave in image) */}
                    <div className="absolute -bottom-1 -right-1 w-32 h-24 pointer-events-none select-none overflow-hidden rounded-br-3xl">
                      <svg viewBox="0 0 130 95" fill="none" className="w-full h-full">
                        <path
                          d="M130 0C100 12 55 18 35 50C15 82 5 90 0 95H130V0Z"
                          fill="url(#guru-purple-wave)"
                          opacity="0.9"
                        />
                        <defs>
                          <linearGradient id="guru-purple-wave" x1="0" y1="95" x2="130" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#c084fc" />
                            <stop offset="1" stopColor="#9333ea" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </motion.div>

                </div>
              </div>

              {/* Bottom Decorative Ribbons across screen width */}
              <div className="relative w-full h-12 overflow-hidden pointer-events-none select-none mt-auto">
                <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <path
                    d="M0,25 C300,50 600,0 900,30 C1200,60 1350,15 1440,35 L1440,60 L0,60 Z"
                    fill="url(#bottom-wave-yellow)"
                    opacity="0.6"
                  />
                  <path
                    d="M0,35 C360,5 720,55 1080,20 C1260,5 1380,45 1440,25 L1440,60 L0,60 Z"
                    fill="url(#bottom-wave-cyan)"
                    opacity="0.7"
                  />
                  <path
                    d="M0,45 C240,20 480,50 720,35 C960,20 1200,50 1440,40 L1440,60 L0,60 Z"
                    fill="url(#bottom-wave-magenta)"
                    opacity="0.8"
                  />
                  <defs>
                    <linearGradient id="bottom-wave-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="bottom-wave-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="bottom-wave-magenta" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Footer matching mockup exactly */}
              <footer className="w-full text-center py-4 text-white select-none print:hidden relative z-10">
                <div className="max-w-2xl mx-auto px-4 py-2.5 bg-[#091550]/70 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                  <p className="text-xs sm:text-[13px] font-semibold text-white/95">
                    © 2026 CAT_SMPN5LR • SMP Negeri 5 Langke Rembong, Hak Cipta Dilindungi Undang-Undang.
                  </p>
                  <p className="text-[11px] text-white/75 italic mt-0.5">
                    pilihan untuk Sistem Penilaian Terstandarisasi & Profesional
                  </p>
                </div>
              </footer>

            </motion.div>
          )}

          {/* VIEW B: PORTAL GURU */}
          {currentView === 'guru' && (
            <motion.div
              key="guru-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PortalGuru
                exams={exams}
                setExams={handleSetExams}
                studentSessions={studentSessions}
                setStudentSessions={handleSetStudentSessions}
                teachers={teachers}
                setTeachers={handleSetTeachers}
                cheatLogs={cheatLogs}
                setCheatLogs={handleSetCheatLogs}
                classes={classes}
                setClasses={handleSetClasses}
                registrationSettings={registrationSettings}
                setRegistrationSettings={handleSetRegistrationSettings}
                onLogout={() => setCurrentView('home')}
              />
            </motion.div>
          )}

          {/* VIEW C: PORTAL SISWA */}
          {currentView === 'siswa' && (
            <motion.div
              key="siswa-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PortalSiswa
                exams={exams}
                studentSessions={studentSessions}
                setStudentSessions={handleSetStudentSessions}
                cheatLogs={cheatLogs}
                setCheatLogs={handleSetCheatLogs}
                classes={classes}
                onBackToMain={() => setCurrentView('home')}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FOOTER BAR FOR SUB-VIEWS ONLY (GURU / SISWA PORTALS) */}
      {currentView !== 'home' && currentView !== 'siswa' && (
        <footer className="bg-white border-t border-gray-200 text-gray-500 py-6 text-center text-xs select-none print:hidden relative z-10">
          <p>© {new Date().getFullYear()} CAT_SMPN5LR • SMP Negeri 5 Langke Rembong. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="text-gray-400 text-[10px] mt-1">Dikembangkan untuk Sistem Penilaian Terstandarisasi & Profesional</p>
        </footer>
      )}

      {/* GitHub Online Push & Overwrite Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

    </div>
  );
}
