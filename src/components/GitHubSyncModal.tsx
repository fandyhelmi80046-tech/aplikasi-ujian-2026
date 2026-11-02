/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, GitCommit, CheckCircle2, AlertCircle, Loader2, 
  ExternalLink, Download, KeyRound, ShieldAlert, X, RefreshCw,
  FolderArchive, ArrowUpRight
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GitHubSyncModal({ isOpen, onClose }: GitHubSyncModalProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [force, setForce] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; commit?: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/github/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setResult(null);
    }
  }, [isOpen]);

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setResult({
        success: false,
        error: 'Harap masukkan Personal Access Token (PAT) GitHub Anda.'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token.trim(),
          force
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult({
          success: true,
          message: data.message || 'Berhasil menimpa repository GitHub secara online!',
          commit: data.commit
        });
        fetchStatus();
      } else {
        setResult({
          success: false,
          error: data.error || 'Gagal melakukan git push ke GitHub.'
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Koneksi jaringan terputus saat menghubungi server push.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
              title="Tutup"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                <GitBranch size={26} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Sinkronisasi & Timpa GitHub</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  fandyhelmi80046-tech/APLIKASI-UJIAN-DAN-EVALUASI-PEMBELAJARAN
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-900 border-b border-slate-200 pb-2">
                <span className="flex items-center gap-1.5">
                  <GitCommit size={15} className="text-indigo-600" />
                  Status Commit Terbaru Siap Ditimpa
                </span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-mono text-[11px]">
                  branch: main
                </span>
              </div>
              <p className="font-mono text-slate-600 truncate">
                {status?.latestCommit || '05274c9 - Update UI: Redesign beranda CAT_SMPN5LR, portal login siswa, dan portal login guru'}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Target: GitHub &rarr; Auto-deploy Vercel</span>
                <a
                  href="https://smpn5lr-five.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  smpn5lr-five.vercel.app <ArrowUpRight size={12} />
                </a>
              </div>
            </div>

            {/* Success Result Box */}
            {result?.success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 text-xs space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  Push Berhasil Ditimpa ke GitHub!
                </div>
                <p className="leading-relaxed">
                  Semua file desain baru (Beranda, Portal Siswa, Portal Guru) telah berhasil diunggah ke branch <b>main</b>. Vercel akan secara otomatis mendeteksi perubahan ini dan men-deploy versi terbaru dalam 1-2 menit.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="https://github.com/fandyhelmi80046-tech/APLIKASI-UJIAN-DAN-EVALUASI-PEMBELAJARAN"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition"
                  >
                    Buka Repo GitHub <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://smpn5lr-five.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-medium hover:bg-emerald-100 transition"
                  >
                    Cek Website Vercel <ExternalLink size={12} />
                  </a>
                </div>
              </motion.div>
            )}

            {/* Error Result Box */}
            {result?.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-300 rounded-2xl p-4 text-red-900 text-xs space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                  <AlertCircle size={18} className="text-red-600" />
                  Gagal Menimpa Repository
                </div>
                <p className="font-mono text-[11px] leading-relaxed break-all">
                  {result.error}
                </p>
                <p className="text-red-700 text-[11px] pt-1">
                  Tips: Pastikan GitHub Personal Access Token masih aktif dan memiliki centang hak akses <b>'repo'</b>.
                </p>
              </motion.div>
            )}

            {/* Direct Online Push Form */}
            <form onSubmit={handlePush} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-indigo-600" />
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=CAT_SMPN5LR_Push"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    Buat Token di GitHub <ExternalLink size={11} />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white pr-20"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded"
                  >
                    {showToken ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Token digunakan untuk otorisasi penulisan ke repository GitHub Anda melalui HTTPS secara aman.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forcePush"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="forcePush" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Paksa timpa (Force Push <code>--force</code>) untuk memastikan update langsung diterapkan
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sedang Melakukan Git Push Online...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>🚀 Push & Timpa Repo GitHub Sekarang</span>
                  </>
                )}
              </button>
            </form>

            {/* Offline Backup Options */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cadangan Manual (Jika Diperlukan):
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/CAT_SMPN5LR_Updated_Repo.zip"
                  download="CAT_SMPN5LR_Updated_Repo.zip"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition"
                >
                  <FolderArchive size={14} className="text-indigo-600" />
                  Unduh .ZIP Repo (7 MB)
                </a>
                <a
                  href="/0001-Update-UI-Redesign-beranda-CAT_SMPN5LR-portal-login-.patch"
                  download="update_ui.patch"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition"
                >
                  <Download size={14} className="text-cyan-600" />
                  Unduh Patch Git (.patch)
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
