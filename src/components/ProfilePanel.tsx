import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { triggerToast } from '../lib/toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, 
  LogOut, 
  User as UserIcon, 
  MapPin, 
  AlignLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Lock,
  Trophy,
  Award,
  Star,
  TrendingUp,
  Sparkles,
  CheckCircle,
  X
} from 'lucide-react';

interface LevelDetails {
  level: number;
  title: string;
  nextXp: number;
  prevXp: number;
  percent: number;
}

export function getLevelDetails(xp: number): LevelDetails {
  if (xp < 100) {
    return { level: 1, title: 'Yeni Başlayan', nextXp: 100, prevXp: 0, percent: (xp / 100) * 100 };
  } else if (xp < 250) {
    return { level: 2, title: 'Fəal Könüllü', nextXp: 250, prevXp: 100, percent: ((xp - 100) / 150) * 100 };
  } else if (xp < 500) {
    return { level: 3, title: 'Təcrübəli Bələdçi', nextXp: 500, prevXp: 250, percent: ((xp - 250) / 250) * 100 };
  } else if (xp < 1000) {
    return { level: 4, title: 'Ustad Bələdçi', nextXp: 1000, prevXp: 500, percent: ((xp - 500) / 500) * 100 };
  } else {
    return { level: 5, title: 'Əfsanəvi Könüllü', nextXp: 1000, prevXp: 1000, percent: 100 };
  }
}

const ALL_BADGES = [
  { id: 'onboarding', title: 'İşə Başlama', desc: 'Sertifikatlı könüllülüyə ilk addım', icon: '🎯', color: 'border-teal/30 bg-teal/5 text-teal text-teal-accent' },
  { id: 'first_verify', title: 'İlk Bələdçi', desc: 'Məkanın əlçatımlılığını təsdiq etdiniz', icon: '🔍', color: 'border-orange/30 bg-orange/5 text-orange' },
  { id: 'defender', title: 'Müdafiəçi', desc: '3+ məkan xüsusiyyətini müvəffəqiyyətlə yoxladınız', icon: '🛡️', color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
  { id: 'master', title: 'Ustad Könüllü', desc: '8+ məkan xüsusiyyəti yoxlaması tamamlandı', icon: '👑', color: 'border-yellow/30 bg-yellow/5 text-yellow' }
];

const INITIAL_MISSIONS = [
  { id: 'mission_1', title: 'Avtobus dayanacağının testi', xp: 100, desc: 'Yaxınlıqdakı avtobus dayanacağının əlillər üçün rampa detallarını xəritədə yoxlayın.' },
  { id: 'mission_2', title: 'Təhsil müəssisəsi əlçatımlılığı', xp: 120, desc: 'Filiallardan birində liftdən istifadə imkanlarını bələdçiyə əsasən qiymətləndirin.' },
  { id: 'mission_3', title: 'Davranış Qanunnamə sualları', xp: 80, desc: 'Əlilliyi olan şəxslərlə düzgün və nəzakətli rəftar suallarını uğurla tamamlayın.' }
];

export function ProfilePanel() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [is2FAEnabled, setIs2FAEnabled] = useState(profile?.is2FAEnabled || false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  // Volunteer stats states
  const [xp, setXp] = useState(profile?.xp || 0);
  const [badges, setBadges] = useState<string[]>(profile?.badges || []);
  const [verifiedCount, setVerifiedCount] = useState(profile?.verifiedCount || 0);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setIs2FAEnabled(profile.is2FAEnabled || false);
      setXp(profile.xp || 0);
      setBadges(profile.badges || []);
      setVerifiedCount(profile.verifiedCount || 0);
      setCompletedMissions(profile.completedMissions || []);
    } else {
      // Local storage fallback for seamless playability
      try {
        const stored = localStorage.getItem('accessbaku_local_volunteer_stats');
        if (stored) {
          const parsed = JSON.parse(stored);
          setXp(parsed.xp || 0);
          setBadges(parsed.badges || []);
          setVerifiedCount(parsed.verifiedCount || 0);
          setCompletedMissions(parsed.completedMissions || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [profile]);

  if (!user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        displayName,
        bio,
        location,
        is2FAEnabled,
        updatedAt: new Date().toISOString()
      };
      if (is2FAEnabled && pin) {
        updates.twoFactorPIN = pin;
      }
      await updateDoc(userRef, updates);
      await refreshProfile();
      setIsEditing(false);
      setPin('');
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMission = async (missionId: string, missionXp: number, title: string) => {
    const newXp = xp + missionXp;
    setXp(newXp);
    
    const nextCompleted = [...completedMissions, missionId];
    setCompletedMissions(nextCompleted);

    const earnedBadges = [...badges];
    let newBadge = false;

    // Award onboarding badge upon answering behavior mission
    if (missionId === 'mission_3' && !earnedBadges.includes('onboarding')) {
      earnedBadges.push('onboarding');
      newBadge = true;
    }

    // Award first verify badge upon submitting verification mission
    if ((missionId === 'mission_1' || missionId === 'mission_2') && !earnedBadges.includes('first_verify')) {
      earnedBadges.push('first_verify');
      newBadge = true;
    }

    // Award defender badge if 2 missions are completed and they have first_verify
    if (nextCompleted.length >= 2 && !earnedBadges.includes('defender')) {
      earnedBadges.push('defender');
      newBadge = true;
    }

    // Award master badge if all 3 missions are completed
    if (nextCompleted.length === 3 && !earnedBadges.includes('master')) {
      earnedBadges.push('master');
      newBadge = true;
    }

    setBadges(earnedBadges);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          xp: newXp,
          badges: earnedBadges,
          completedMissions: nextCompleted
        });
        await refreshProfile();
      } catch (err) {
        console.error("Firestore update points issue:", err);
      }
    } else {
      try {
        const payload = {
          xp: newXp,
          badges: earnedBadges,
          verifiedCount,
          completedMissions: nextCompleted
        };
        localStorage.setItem('accessbaku_local_volunteer_stats', JSON.stringify(payload));
      } catch (err) {
        console.error(err);
      }
    }

    setToastMsg(`${title} tapşırığı bitirildi! +${missionXp} XP qazanıldı.`);
    if (newBadge) {
      setTimeout(() => {
        setToastMsg(`Yeni nailiyyət nişanı açıldı! 🎉`);
      }, 2100);
    }
  };

  const lvlDetails = getLevelDetails(xp);

  return (
    <div className="space-y-6 relative pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight">İstifadəçi Profili</h2>
          <p className="text-sm text-muted-blue">Şəxsi məlumatlarınızı idarə edin</p>
        </div>
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Çıxış
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-dense flex flex-col items-center text-center p-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal to-orange flex items-center justify-center text-white mb-4 shadow-xl shadow-teal/20 relative">
             <UserIcon className="w-10 h-10" />
             <div className="absolute bottom-1 right-1 w-6 h-6 bg-navy rounded-full border-2 border-teal flex items-center justify-center">
                <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
             </div>
          </div>
          <h3 className="text-xl font-bold">{profile?.displayName || 'Adsız İstifadəçi'}</h3>
          <p className="text-xs text-muted-blue mt-1">{user.email}</p>
          
          <div className="flex flex-col gap-2 mt-4 w-full">
            <div className={`px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${profile?.is2FAEnabled ? 'bg-teal/5 border-teal/30 text-teal' : 'bg-orange/5 border-orange/30 text-orange'}`}>
              <div className="flex items-center gap-2">
                {profile?.is2FAEnabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase">2FA: {profile?.is2FAEnabled ? 'Aktiv' : 'Passiv'}</span>
              </div>
              {!profile?.is2FAEnabled && <div className="w-2 h-2 bg-orange rounded-full animate-pulse" />}
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-muted-blue uppercase tracking-widest text-center">
              {profile?.role || 'Könüllü'}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 card-dense">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label-xs">Görünən Ad</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className="input-field-dense w-full pl-10 disabled:opacity-50"
                  />
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label-xs">Məkan</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isEditing}
                    className="input-field-dense w-full pl-10 disabled:opacity-50"
                    placeholder="Məs: Bakı, Azərbaycan"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-xs">Bioqrafiya</label>
              <div className="relative">
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="input-field-dense w-full pl-10 resize-none disabled:opacity-50"
                  placeholder="Özünüz haqqında qısa məlumat..."
                />
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-teal" />
              </div>
            </div>

            <div className="pt-6 border-t border-teal/10">
              <div className={`p-5 rounded-2xl border transition-all ${is2FAEnabled ? 'bg-teal/5 border-teal/30' : 'bg-navy-lighter/30 border-white/5'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${is2FAEnabled ? 'bg-teal/10 border-teal/30 text-teal shadow-[0_0_15px_rgba(45,212,191,0.2)]' : 'bg-white/5 border-white/10 text-muted-blue'}`}>
                      {is2FAEnabled ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">Hesabın Təhlükəsizliyi (2FA)</h4>
                      <p className="text-[10px] text-muted-blue max-w-[200px]">Giriş zamanı 6 rəqəmli təhlükəsizlik kodunun (PIN) tələb olunması.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => isEditing && setIs2FAEnabled(!is2FAEnabled)}
                    disabled={!isEditing}
                    className={`w-14 h-7 rounded-full relative transition-all ${!isEditing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} ${is2FAEnabled ? 'bg-teal' : 'bg-navy-lighter border border-white/10'}`}
                  >
                    <motion.div 
                      layout
                      animate={{ x: is2FAEnabled ? 28 : 4 }}
                      className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
                
                {is2FAEnabled && isEditing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 p-5 bg-orange/10 border border-orange/30 rounded-xl space-y-4 shadow-inner"
                  >
                    <div className="flex items-center gap-2 text-orange">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Yeni Təhlükəsizlik PIN-i:</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-navy/50 border-2 border-orange/20 rounded-lg px-4 py-3 text-center tracking-[1.5em] font-black text-2xl text-orange focus:border-orange outline-none transition-all placeholder:text-orange/20"
                        placeholder="••••••"
                      />
                    </div>
                    <p className="text-[9px] text-orange/70 italic flex items-start gap-1">
                      <span className="shrink-0 font-bold">⚠️ DİQQƏT:</span> 
                      Daxil etməsəniz mövcud PIN qüvvədə qalacak. Əgər ilk dəfədirsə, mütləq təyin edin.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              {isEditing ? (
                <>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary-dense flex-grow flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yadda Saxla'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                        setIsEditing(false);
                        setDisplayName(profile?.displayName || '');
                        setBio(profile?.bio || '');
                        setLocation(profile?.location || '');
                    }}
                    className="px-6 py-2 border border-teal/20 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-white/5"
                  >
                    Ləğv Et
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="btn-primary-dense w-full"
                >
                  Məlumatları Yenilə
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Könüllü Nailiyyətləri & Bal Sistemi */}
      <div className="pt-8 border-t border-teal/10 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-center text-teal shadow-[0_0_15px_rgba(45,212,191,0.1)]">
            <Trophy className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tight">Könüllülük Nailiyyətləri</h3>
            <p className="text-xs text-muted-blue">Əlçatımlılıq fəaliyyətiniz, qazandığınız ballar və bədclər</p>
          </div>
        </div>

        {/* Level & Points Dashboard Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-4 card-dense bg-gradient-to-br from-navy-light to-teal/10 flex flex-col justify-between p-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal">Cari Reytinq Rütbəniz</span>
                <h4 className="text-xl font-black mt-1 text-white uppercase italic leading-tight">{lvlDetails.title}</h4>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal border border-teal/30 flex items-center justify-center text-navy font-black text-xs font-exo italic tracking-tighter shrink-0">
                LVL {lvlDetails.level}
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-xs font-bold text-white-soft">
                <span className="text-teal font-black text-sm">{xp} XP</span>
                {lvlDetails.level < 5 ? (
                  <span className="text-[10px] text-muted-blue uppercase">Növbəti: {lvlDetails.nextXp} XP</span>
                ) : (
                  <span className="text-yellow font-black text-[10px] uppercase">Maksimum Səviyyə 🎉</span>
                )}
              </div>
              <div className="w-full bg-navy/50 h-3 rounded-full border border-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal to-orange rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${lvlDetails.percent}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-blue uppercase tracking-widest text-right mt-1">
                {lvlDetails.level < 5 ? `Növbəti rütbəyə ${lvlDetails.nextXp - xp} XP qalıb` : 'Siz platformanın əlçatımlılıq qəhrəmanısınız!'}
              </p>
            </div>
          </div>

          {/* Badges Display Column */}
          <div className="lg:col-span-8 card-dense p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange" /> Sizin Könüllülük Nişanlarınız
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ALL_BADGES.map((badge) => {
                const isEarned = badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center relative group transition-all duration-300 ${
                      isEarned 
                        ? `${badge.color} scale-100 hover:scale-105 shadow-lg shadow-teal/5` 
                        : 'border-white/5 bg-navy/40 opacity-30 grayscale'
                    }`}
                  >
                    <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">{badge.icon}</div>
                    <div className="text-xs font-black uppercase tracking-tight text-white mb-1 leading-none">{badge.title}</div>
                    <div className="text-[8px] text-muted-blue leading-tight uppercase px-1">{badge.desc}</div>
                    
                    {isEarned && (
                      <div className="absolute top-1 right-1 w-4.5 h-4.5 bg-teal text-navy rounded-full flex items-center justify-center text-[10px] font-black">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Missions Section */}
        <div className="card border border-teal/10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-orange flex items-center gap-2">
                <Star className="w-4 h-4 animate-spin-slow" /> Cari Könüllü Missiyaları
              </h4>
              <p className="text-[10px] text-muted-blue uppercase tracking-wider mt-1">Sizə uyğun missiyaları tamamlayaraq sertifikatlı rütbənizi yüksəldin</p>
            </div>
            <div className="px-4 py-2 bg-teal/10 border border-teal/20 rounded-xl text-xs font-bold text-teal flex items-center gap-2 self-start sm:self-auto">
              <TrendingUp className="w-4 h-4" /> Cari Məkan Təsdiqləriniz: <span className="font-exo font-black text-sm">{verifiedCount} məkan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INITIAL_MISSIONS.map((mission) => {
              const isCompleted = completedMissions.includes(mission.id);
              return (
                <div 
                  key={mission.id} 
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                    isCompleted 
                      ? 'border-teal/20 bg-teal/5 opacity-80 shadow-inner' 
                      : 'border-white/5 bg-navy-lighter/20 hover:border-orange/20 hover:bg-navy-lighter/30'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h5 className="text-sm font-black text-white uppercase tracking-tight leading-snug">{mission.title}</h5>
                      <span className={`text-[10px] shrink-0 font-black px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-teal/20 text-teal border border-teal/30' : 'bg-orange/20 text-orange border border-orange/30'
                      }`}>
                        +{mission.xp} XP
                      </span>
                    </div>
                    <p className="text-xs text-muted-blue leading-relaxed mb-6">{mission.desc}</p>
                  </div>

                  {isCompleted ? (
                    <div className="w-full py-2 border border-teal/20 bg-teal/5 rounded-xl text-teal text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal" /> TAMAMLANDI
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCompleteMission(mission.id, mission.xp, mission.title)}
                      className="w-full py-2.5 bg-orange hover:bg-orange/90 active:scale-95 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange/15 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> MİSSİYANI TAMAMLA
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification Simulator Section - Perfect for live demos */}
        <div className="card mt-6 border border-orange/15 bg-navy/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange/10 border border-orange/30 flex items-center justify-center text-orange shrink-0">
              <Sparkles className="w-4 h-4 text-orange" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-orange flex items-center gap-1.5 leading-none">
                BİLDİRİŞ SİMULYASİYASI (TƏQDİMAT ÜÇÜN)
              </span>
              <p className="text-[9px] text-muted-blue font-bold uppercase tracking-wider mt-1">Real vaxt rejimində fərqli bildirişləri test edin</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => triggerToast("Bakı Dövlət Universiteti ətrafı əlçatımlı elan edildi! +30 XP", "success", "Məkan Təsdiqləndi")}
              className="p-3 bg-teal/10 hover:bg-teal/20 text-teal border border-teal/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-lg">📍</span>
              Məkan Təsdiqi
            </button>
            <button
              type="button"
              onClick={() => triggerToast("28 May metrosu yaxınlığındakı pandusun yoxlanışı missiyası sizə təyin edildi!", "mission", "Yeni Missiya")}
              className="p-3 bg-orange/10 hover:bg-orange/20 text-orange border border-orange/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-lg">🎯</span>
              Yeni Missiya
            </button>
            <button
              type="button"
              onClick={() => triggerToast("Siz uğurla 3 məkan yoxlayaraq 'Müdafiəçi' nailiyyətini qazandınız! 🎉", "badge", "Nailiyyət Qazanıldı")}
              className="p-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow border border-yellow-500/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-lg">🏆</span>
              Nailiyyət Bədci
            </button>
          </div>
        </div>
      </div>

      {/* Floating Sparkles Toast Message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[9999] bg-gradient-to-r from-orange to-yellow text-navy min-w-[320px] px-6 py-4 rounded-2xl shadow-2xl border border-orange/30 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-navy animate-bounce shrink-0" />
              <div>
                <span className="text-[9px] uppercase tracking-widest text-navy/60 font-black">XAL VƏ NALİYYƏT</span>
                <p className="text-xs font-black leading-tight mt-0.5">{toastMsg}</p>
              </div>
            </div>
            <button 
              onClick={() => setToastMsg(null)}
              className="text-navy/60 hover:text-navy cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
