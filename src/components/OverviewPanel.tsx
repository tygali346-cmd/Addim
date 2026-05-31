import React from 'react';
import { motion } from 'motion/react';

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div>
      <div className="text-2xl font-exo font-black text-teal mb-1">{value}</div>
      <div className="text-[10px] text-muted-blue uppercase tracking-widest font-bold">{label}</div>
    </div>
  );
}

function PhaseProgress({ label, period, percent, color }: { label: string, period: string, percent: number, color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal',
    orange: 'bg-orange',
    muted: 'bg-muted-blue/40'
  };
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold mb-2">
        <span className={color === 'teal' ? 'text-teal' : color === 'orange' ? 'text-orange' : 'text-muted-blue'}>{label}</span>
        <span className="text-muted-blue">{period}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full rounded-full ${colorMap[color]}`}
        />
      </div>
    </div>
  );
}

export function OverviewPanel({ setActivePanel }: { setActivePanel: (p: any) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="relative bg-gradient-to-br from-teal/15 to-orange/10 border border-teal/20 rounded-[2.5rem] p-6 md:p-12 overflow-hidden">
        <div className="absolute -top-10 -right-10 font-exo font-black text-6xl md:text-[12rem] text-teal/5 select-none pointer-events-none opacity-20 md:opacity-100">
          ADDIM
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-exo font-black text-3xl md:text-5xl leading-tight mb-4 md:mb-6">
            Bir addım,<br /><span className="text-teal italic">hər kəs üçün.</span>
          </h1>
          <p className="text-muted-blue text-sm md:text-lg leading-relaxed mb-6 md:mb-8">
            Əlilliyi olan vətəndaşlar üçün rəqəmsal əlçatımlılıq platforması. Xəritə, bələdçi, könüllülük və iş imkanları — hamısı bir yerdə.
          </p>
          <div className="flex flex-wrap gap-6 md:gap-10">
            <StatItem value="600K+" label="Hədəf vətəndaş" />
            <StatItem value="4" label="Aktiv modul" />
            <StatItem value="18 ay" label="Yol xəritəsi" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { v: '10K+', l: 'Aktiv istifadəçi' },
          { v: '500+', l: 'Sertifikatlı məkan' },
          { v: '200+', l: 'Könüllü' },
          { v: '50+', l: 'Korporativ tərəfdaş' },
        ].map((s, i) => (
          <div key={i} className="card text-center py-8">
            <div className="text-3xl font-exo font-black bg-gradient-to-br from-teal to-teal-bright bg-clip-text text-transparent">{s.v}</div>
            <div className="text-[10px] text-muted-blue uppercase tracking-widest mt-1 font-bold">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4 font-exo font-bold text-lg">
            <div className="w-2 h-2 rounded-full bg-teal shadow-[0_0_8px_var(--color-teal)]" />
            Layihənin məqsədi
          </div>
          <p className="text-sm text-muted-blue leading-relaxed mb-6">
            ADDIM platforması əlilliyi olan şəxslərin sosial müdafiəsinin rəqəmsallaşdırılması və "müstəqil həyat" konsepsiyasının tətbiqi üçün nəzərdə tutulmuş çoxfunksiyalı texnoloji həlldir.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Məlumat yoxluğu', 'Fiziki maneələr', 'Sosial izolyasiya'].map((t, i) => (
              <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${i === 1 ? 'bg-orange/10 border-orange/30 text-orange' : 'bg-teal/10 border-teal/30 text-teal'}`}>
                {t.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 font-exo font-bold text-lg">
            <div className="w-2 h-2 rounded-full bg-orange shadow-[0_0_8px_var(--color-orange)]" />
            18 Aylıq Yol Xəritəsi
          </div>
          <div className="space-y-5 mt-6">
            <PhaseProgress label="FAZA 1 · MVP" period="Ay 1–6" percent={100} color="teal" />
            <PhaseProgress label="FAZA 2 · Miqyaslanma" period="Ay 7–12" percent={60} color="orange" />
            <PhaseProgress label="FAZA 3 · Milli İnteqrasiya" period="Ay 13–18" percent={20} color="muted" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default OverviewPanel;
