import React from 'react';
import { motion } from 'motion/react';
import { Accessibility, Sparkles, Eye, Filter, X } from 'lucide-react';

interface AccessibilityModalProps {
  onClose: () => void;
  settings: {
    fontSize: number;
    contrast: string;
    colorBlindness: string;
  };
  setSettings: (settings: any) => void;
}

export function AccessibilityModal({ onClose, settings, setSettings }: AccessibilityModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-navy/90 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-lg card overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-teal/10 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal/20 text-teal flex items-center justify-center">
              <Accessibility className="w-6 h-6" />
            </div>
            <h3 className="font-exo font-black text-2xl uppercase italic text-white leading-none">Əlçatanlıq Ayarları</h3>
          </div>
          <p className="text-muted-blue text-sm">Platformanı ehtiyaclarınıza uyğun tənzimləyin.</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Font Size */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-blue uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-teal" /> Şrift Ölçüsü
            </label>
            <div className="flex gap-2">
              {[100, 125, 150].map((size) => (
                <button 
                  key={size}
                  onClick={() => setSettings({ ...settings, fontSize: size })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all
                    ${settings.fontSize === size 
                      ? 'bg-teal/10 border-teal text-teal' 
                      : 'bg-navy-lighter border-white/10 text-muted-blue hover:border-teal/20'}`}
                >
                  {size}%
                </button>
              ))}
            </div>
          </div>

          {/* Contrast */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-blue uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-3 h-3 text-teal" /> Kontrast
            </label>
            <div className="flex gap-2">
              {['normal', 'high'].map((c) => (
                <button 
                  key={c}
                  onClick={() => setSettings({ ...settings, contrast: c })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all
                    ${settings.contrast === c 
                      ? 'bg-teal/10 border-teal text-teal' 
                      : 'bg-navy-lighter border-white/10 text-muted-blue hover:border-teal/20'}`}
                >
                  {c === 'normal' ? 'Normal' : 'Yüksək'}
                </button>
              ))}
            </div>
          </div>

          {/* Color Blindness */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-blue uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3 text-teal" /> Rəng Filtrləri
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'none', label: 'Yoxdur' },
                { id: 'grayscale', label: 'Ağ-Qara' },
                { id: 'protanopia', label: 'Protanopiya' },
                { id: 'deuteranopia', label: 'Deuteranopiya' },
                { id: 'tritanopia', label: 'Tritanopiya' },
              ].map((filter) => (
                <button 
                  key={filter.id}
                  onClick={() => setSettings({ ...settings, colorBlindness: filter.id })}
                  className={`py-3 rounded-xl border text-[11px] font-bold uppercase transition-all
                    ${settings.colorBlindness === filter.id 
                      ? 'bg-teal/10 border-teal text-teal' 
                      : 'bg-navy-lighter border-white/10 text-muted-blue hover:border-teal/20'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-navy-lighter/50 border-t border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-teal text-navy font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-teal/20"
          >
            Tətbiq Et
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-blue hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    </motion.div>
  );
}
