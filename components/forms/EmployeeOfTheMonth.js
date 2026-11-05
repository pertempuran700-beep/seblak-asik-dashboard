'use client';
import { useState, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Setiap Hari'];

const ICON_OPTIONS = [
  { value: 'auto', label: 'Otomatis (menyesuaikan judul hadiah)' },
  { value: 'ticket', label: '🎟️ Tiket' },
  { value: 'money', label: '💰 Uang' },
  { value: 'voucher', label: '🎫 Voucher' },
  { value: 'gift', label: '🎁 Kado / Hadiah' },
  { value: 'food', label: '🍜 Makanan' },
  { value: 'phone', label: '📱 Gadget' },
  { value: 'shirt', label: '👕 Pakaian' },
  { value: 'trophy', label: '🏆 Piala' },
];

const ICON_EMOJI = {
  ticket: '🎟️', money: '💰', voucher: '🎫', gift: '🎁',
  food: '🍜', phone: '📱', shirt: '👕', trophy: '🏆',
};

// Menebak icon dari judul hadiah (dipakai kalau pilihan icon = Otomatis)
function detectIcon(title) {
  const t = String(title || '').toLowerCase();
  if (/tiket|bioskop|cinema|konser/.test(t)) return 'ticket';
  if (/\brp\.?\s?\d|uang|cash|tunai|bonus|saldo/.test(t)) return 'money';
  if (/voucher|kupon/.test(t)) return 'voucher';
  if (/makan|seblak|traktir|kuliner|minum|kopi/.test(t)) return 'food';
  if (/\bhp\b|handphone|gadget|earphone|headset|speaker/.test(t)) return 'phone';
  if (/baju|kaos|kemeja|jaket|sepatu/.test(t)) return 'shirt';
  return 'gift';
}

function resolveEmoji(reward) {
  const key = !reward?.icon || reward.icon === 'auto' ? detectIcon(reward?.title) : reward.icon;
  return ICON_EMOJI[key] || '🎁';
}

const PODIUM = {
  1: { medal: '🥇', h: 'h-32', box: 'bg-warning/20 border-warning/50', text: 'text-warning' },
  2: { medal: '🥈', h: 'h-24', box: 'bg-white/[0.08] border-white/30', text: 'text-white' },
  3: { medal: '🥉', h: 'h-20', box: 'bg-danger/10 border-danger/30', text: 'text-danger' },
};

// ---------------------------------------------------------------------------
// FORM TAMBAH / EDIT TUGAS
// ---------------------------------------------------------------------------
function TaskForm({ task, defaultDay, onSuccess, onClose }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    task_name: task?.task_name || '',
    day: task?.day || defaultDay,
    is_active: task ? task.is_active : true,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.saveEotmTask({
        task_id: task?.task_id || '',
        task_name: form.task_name,
        day: form.day,
        is_active: form.is_active,
      });
      toast?.showToast(task ? 'Tugas berhasil diperbarui' : 'Tugas berhasil ditambahkan');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nama Tugas" required placeholder="Misal: Pel lantai"
        value={form.task_name} onChange={(e) => setForm({ ...form, task_name: e.target.value })}
      />
      <Select
        label="Untuk Hari" value={form.day}
        onChange={(e) => setForm({ ...form, day: e.target.value })}
        options={DAYS.map((d) => ({ value: d, label: d === 'Setiap Hari' ? 'Setiap Hari (muncul tiap hari)' : d }))}
      />
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox" checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Tugas aktif (tampil di checklist karyawan)
      </label>
      <Button type="submit" full disabled={submitting || !form.task_name.trim()}>
        {submitting ? 'Menyimpan...' : '💾 Simpan Tugas'}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// FORM EDIT HADIAH
// ---------------------------------------------------------------------------
function RewardForm({ reward, onSuccess, onClose }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: reward?.title || '',
    desc: reward?.desc || '',
    icon: reward?.icon || 'auto',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.saveEotmReward({ title: form.title, desc: form.desc, icon: form.icon });
      toast?.showToast('Hadiah berhasil diperbarui');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface2 rounded-card p-4 text-center border border-white/[0.05]">
        <div className="text-5xl">{resolveEmoji(form)}</div>
        <p className="text-xs text-textmuted mt-2">Pratinjau icon hadiah</p>
      </div>
      <Input
        label="Hadiah Juara 1" required placeholder="Misal: Tiket Bioskop 1 Orang atau Uang Rp 100.000"
        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <Input
        label="Keterangan (Opsional)" placeholder="Misal: Diberikan di akhir bulan"
        value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })}
      />
      <Select
        label="Icon Hadiah" value={form.icon}
        onChange={(e) => setForm({ ...form, icon: e.target.value })}
        options={ICON_OPTIONS}
      />
      <Button type="submit" full disabled={submitting || !form.title.trim()}>
        {submitting ? 'Menyimpan...' : '💾 Simpan Hadiah'}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------
export default function EmployeeOfTheMonth({ user, isManagement, period }) {
  const toast = useToast();
  const [modal, setModal] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filterDay, setFilterDay] = useState(DAYS[(new Date().getDay() + 6) % 7]);
  const [busyId, setBusyId] = useState(null);

  const { data: today, loading: todayLoading, refetch: refetchToday } = useData(() => api.getEotmToday(), []);
  const { data: board, loading: boardLoading, refetch: refetchBoard } = useData(() => api.getEotmDashboard(period), [period]);
  const { data: templates, refetch: refetchTemplates } = useData(
    () => (isManagement ? api.listEotmTasks() : Promise.resolve([])),
    [isManagement]
  );

  // Auto-refresh tiap 30 detik supaya real count terasa "hidup"
  const refreshRef = useRef(null);
  refreshRef.current = () => { refetchToday?.(); refetchBoard?.(); };
  useEffect(() => {
    const timer = setInterval(() => refreshRef.current?.(), 30000);
    return () => clearInterval(timer);
  }, []);

  async function handleToggle(task, isOther) {
    if (isOther && !confirm(`Batalkan centang milik ${task.done_by_name}?`)) return;
    setBusyId(task.task_id);
    try {
      const res = await api.toggleEotmTask(task.task_id);
      toast?.showToast(res?.done ? 'Tugas dicentang! +1 poin 🎉' : 'Centang dibatalkan');
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setBusyId(null);
      refetchToday?.();
      refetchBoard?.();
    }
  }

  async function handleDeleteTask(task) {
    if (!confirm(`Hapus tugas "${task.task_name}"?`)) return;
    try {
      await api.deleteEotmTask(task.task_id);
      toast?.showToast('Tugas dihapus');
      refetchTemplates?.();
      refetchToday?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    }
  }

  const monthLabel = (() => {
    const [y, m] = String(period).split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  })();

  const leaderboard = board?.leaderboard || [];
  const top = leaderboard.filter((e) => e.count > 0).slice(0, 3);
  const maxCount = Math.max(1, ...leaderboard.map((e) => e.count));
  const reward = board?.reward;
  const hasReward = Boolean(reward?.title);
  const myId = user?.employee_id;

  const filteredTemplates = (templates || []).filter((t) => t.day === filterDay);

  return (
    <div className="space-y-6">
      {/* ===================== BANNER HADIAH ===================== */}
      <div className="rounded-card border border-warning/40 bg-gradient-to-r from-warning/20 to-primary/20 p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className={`text-6xl ${hasReward ? 'animate-bounce' : 'opacity-40'}`}>
          {hasReward ? resolveEmoji(reward) : '🎁'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[10px] tracking-widest uppercase text-warning font-bold">
            🏆 Hadiah Juara 1 — {monthLabel}
          </p>
          {hasReward ? (
            <>
              <p className="text-xl font-black text-white">{reward.title}</p>
              {reward.desc && <p className="text-xs text-textmuted mt-1">{reward.desc}</p>}
            </>
          ) : (
            <p className="text-sm text-textmuted">
              {isManagement ? 'Belum ada hadiah. Klik "Edit Hadiah" untuk menentukan.' : 'Hadiah bulan ini akan segera diumumkan!'}
            </p>
          )}
        </div>
        {isManagement && (
          <Button variant="ghost" onClick={() => setModal('reward')}>✏️ Edit Hadiah</Button>
        )}
      </div>

      {/* ===================== PAPAN PERINGKAT ===================== */}
      <Card title={`Papan Peringkat — ${monthLabel}`}>
        {boardLoading && !board ? (
          <p className="text-center py-8">Memuat peringkat...</p>
        ) : (
          <>
            {top.length === 0 ? (
              <p className="text-center py-6 text-sm text-textmuted">
                Belum ada yang mengumpulkan poin bulan ini. Jadilah yang pertama! 🚀
              </p>
            ) : (
              <div className="flex items-end justify-center gap-2 md:gap-4 pt-2 pb-4">
                {[2, 1, 3].map((place) => {
                  const e = top[place - 1];
                  const c = PODIUM[place];
                  if (!e) return <div key={place} className="flex-1 max-w-[9rem]" />;
                  return (
                    <div key={place} className="flex-1 max-w-[9rem] flex flex-col items-center">
                      <div className={place === 1 ? 'text-5xl animate-bounce' : 'text-3xl'}>{c.medal}</div>
                      <p className={`mt-1 text-sm font-bold truncate max-w-full ${e.employee_id === myId ? 'text-primary' : 'text-white'}`}>
                        {String(e.name).split(' ')[0]}
                      </p>
                      <div className={`w-full ${c.h} mt-2 rounded-t-lg border ${c.box} flex flex-col items-center justify-center`}>
                        <p className={`text-3xl font-black ${c.text}`}>{e.count}</p>
                        <p className="text-[10px] uppercase text-textmuted">poin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 mt-2">
              {leaderboard.map((e) => (
                <div
                  key={e.employee_id}
                  className={`rounded-card px-3 py-2 border ${e.employee_id === myId ? 'border-primary/50 bg-primary/10' : 'border-white/[0.05] bg-surface2'}`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2">
                      <span className="font-bold mr-2 text-textmuted">#{e.rank}</span>
                      {e.name}
                      {e.employee_id === myId && <span className="text-[10px] text-primary ml-2">(Anda)</span>}
                    </span>
                    <span className="font-bold">{e.count} poin</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded mt-2 overflow-hidden">
                    <div className="h-full bg-primary rounded" style={{ width: `${(e.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-textmuted mt-3">
              Total {board?.total_done || 0} tugas selesai bulan ini. Poin seri dimenangkan yang lebih dulu mencapainya. Data diperbarui otomatis.
            </p>
          </>
        )}
      </Card>

      {/* ===================== CHECKLIST HARI INI ===================== */}
      <Card title={`Tugas Hari Ini${today?.day_name ? ` — ${today.day_name}` : ''}`}>
        {todayLoading && !today ? (
          <p className="text-center py-8">Memuat tugas...</p>
        ) : !today || today.tasks.length === 0 ? (
          <p className="text-center py-6 text-sm text-textmuted">
            Belum ada tugas untuk hari ini.{isManagement ? ' Tambahkan di bagian "Kelola Daftar Tugas" di bawah.' : ''}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-textmuted mb-3">
              <span>Centang tugas yang sudah Anda kerjakan. Tugas yang sudah dicentang orang lain tidak bisa diambil.</span>
              <span className="font-bold text-white whitespace-nowrap ml-3">{today.done_count}/{today.total}</span>
            </div>
            <div className="space-y-2">
              {today.tasks.map((task) => {
                const mine = task.done && task.done_by_id === myId;
                const other = task.done && !mine;
                const locked = other && !isManagement;
                const busy = busyId === task.task_id;
                return (
                  <button
                    key={task.task_id} type="button" disabled={locked || busy}
                    onClick={() => handleToggle(task, other)}
                    className={`w-full flex items-center gap-3 text-left px-3 py-3 rounded-card border transition-colors ${
                      mine ? 'bg-success/20 border-success/40'
                        : other ? 'bg-white/[0.03] border-white/[0.05] opacity-60'
                        : 'bg-surface2 border-white/[0.05] hover:border-primary/50'
                    } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`w-6 h-6 shrink-0 rounded border-2 flex items-center justify-center text-xs font-bold ${
                      task.done ? 'bg-success border-success text-white' : 'border-white/30'
                    }`}>
                      {task.done ? '✓' : ''}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm ${task.done ? 'line-through opacity-80' : ''}`}>{task.task_name}</span>
                      {task.done && (
                        <span className="block text-[10px] text-textmuted">
                          {mine ? 'Dikerjakan oleh Anda' : `Dikerjakan oleh ${task.done_by_name}`}
                        </span>
                      )}
                    </span>
                    {task.day === 'Setiap Hari' && <span className="text-[10px] text-textmuted">Harian</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* ===================== KELOLA TUGAS (OWNER & SUPERVISOR) ===================== */}
      {isManagement && (
        <Card title="Kelola Daftar Tugas">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
            <div className="flex-1">
              <Select
                label="Filter Hari" value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                options={DAYS.map((d) => ({ value: d, label: d }))}
              />
            </div>
            <Button onClick={() => { setEditingTask(null); setModal('task'); }}>+ Tambah Tugas</Button>
          </div>

          {filteredTemplates.length === 0 ? (
            <p className="text-center py-4 text-sm text-textmuted">Belum ada tugas untuk "{filterDay}".</p>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((t) => (
                <div key={t.task_id} className="flex items-center justify-between bg-surface2 rounded-card px-3 py-2 border border-white/[0.05]">
                  <span className={`text-sm truncate pr-2 ${t.is_active ? '' : 'opacity-50 line-through'}`}>
                    {t.task_name}
                    {!t.is_active && <span className="text-[10px] ml-2 no-underline">(nonaktif)</span>}
                  </span>
                  <span className="flex gap-1 shrink-0">
                    <Button variant="ghost" onClick={() => { setEditingTask(t); setModal('task'); }}>Edit</Button>
                    <Button variant="ghost" onClick={() => handleDeleteTask(t)}>Hapus</Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ===================== MODAL ===================== */}
      <Modal open={modal === 'task'} onClose={() => setModal(null)} title={editingTask ? 'Edit Tugas' : 'Tambah Tugas'}>
        <TaskForm
          key={editingTask?.task_id || `new-${filterDay}`}
          task={editingTask} defaultDay={filterDay}
          onSuccess={() => { refetchTemplates?.(); refetchToday?.(); }}
          onClose={() => setModal(null)}
        />
      </Modal>
      <Modal open={modal === 'reward'} onClose={() => setModal(null)} title="Edit Hadiah Juara 1">
        <RewardForm
          key={`${reward?.title || ''}-${reward?.icon || ''}`}
          reward={reward}
          onSuccess={() => refetchBoard?.()}
          onClose={() => setModal(null)}
        />
      </Modal>
    </div>
  );
}
