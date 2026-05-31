/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  BookOpen, 
  Handshake, 
  Briefcase, 
  Home, 
  ArrowUpRight, 
  Send, 
  Loader2, 
  Sparkles,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  Search,
  User as UserIcon,
  LogIn,
  Filter,
  AlertTriangle,
  Info,
  Navigation,
  Map as MapIcon,
  Route as RouteIcon,
  ChevronRight,
  HelpCircle,
  Trophy,
  Car,
  Bike,
  PersonStanding,
  Plus,
  Heart,
  X,
  Menu,
  Bus,
  Train,
  Clock,
  ArrowRightCircle,
  MoveUpRight,
  Route,
  Activity,
  Milestone,
  ArrowRight,
  ShieldCheck,
  Play,
  Accessibility,
  Settings as SettingsIcon,
  Eye,
  Keyboard,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline, CircleMarker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from './lib/firebase';
import { askGemini } from './geminiService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProfilePanel } from './components/ProfilePanel';
import { AccessibilityModal } from './components/AccessibilityModal';
import { ToastItem, triggerToast } from './lib/toast';

const MAP_LOCATIONS = [
  { id:1,  name:"Bakı Dövlət Universiteti",        addr:"Z.Əliyev küç. 23, Nərimanov",    lat:40.4093, lng:49.8671, features:["rampa","lift","wc"],          rating:4.2, type:"🏛️" },
  { id:2,  name:"28 May Metro Stansiyası",          addr:"28 May küç., Nəsimi",             lat:40.3793, lng:49.8471, features:["rampa","lift"],                    rating:3.8, type:"🚇" },
  { id:3,  name:"Heydər Əliyev Mərkəzi",           addr:"Heydər Əliyev pr., Nizami",       lat:40.3953, lng:49.8671, features:["rampa","lift","wc","parking"],  rating:4.8, type:"🏛️" },
  { id:4,  name:"Dəniz Vağzalı Ticarət Mərkəzi",   addr:"Bünyad Sərdarov küç. 1, Nəsimi", lat:40.3743, lng:49.8432, features:["rampa","lift","wc","parking"],  rating:4.5, type:"🛒" },
  { id:5,  name:"Port Baku Mall",                  addr:"Neftçilər pr. 153, Xətai",        lat:40.3893, lng:49.8952, features:["rampa","lift","wc","parking"],  rating:4.6, type:"🛒" },
  { id:6,  name:"Sahil Bağı",                      addr:"Neftçilər pr., Nəsimi",           lat:40.3677, lng:49.8341, features:["rampa"],                            rating:3.5, type:"🌳" },
  { id:7,  name:"Respublika Xəstəxanası",          addr:"Əliağa Vahid küç. 1, Nərimanov",  lat:40.4093, lng:49.8721, features:["rampa","lift","wc","parking"],  rating:4.1, type:"🏥" },
  { id:8,  name:"ASAN Xidmət №1",                  addr:"Atatürk pr. 90, Nəsimi",          lat:40.3943, lng:49.8571, features:["rampa","lift","wc"],            rating:4.7, type:"🏢" },
  { id:9,  name:"Nizami Kinoteatrı",               addr:"Nizami küç. 47, Nəsimi",          lat:40.3793, lng:49.8481, features:["rampa","wc"],                   rating:3.9, type:"🎬" },
  { id:10, name:"Bakı Alışveriş Mərkəzi",         addr:"Rəşid Behbudov küç., Nəsimi",     lat:40.3843, lng:49.8501, features:["rampa","lift","parking"],           rating:4.3, type:"🛒" },
  { id:11, name:"Gənclər Evi",                    addr:"İstiqlaliyyət küç. 4, Nəsimi",    lat:40.3693, lng:49.8351, features:["rampa","wc"],                   rating:3.6, type:"🏛️" },
  { id:12, name:"Koroğlu Metro Stansiyası",        addr:"Koroğlu pr., Nərimanov",          lat:40.4143, lng:49.8721, features:["rampa","lift"],                     rating:3.7, type:"🚇" },
  { id:13, name:"İçərişəhər Metro Stansiyası",     addr:"Qala küç., Sabayıl",              lat:40.3643, lng:49.8311, features:["lift"],                             rating:3.4, type:"🚇" },
  { id:14, name:"Elmizlər Metro Stansiyası",       addr:"İstiqlaliyyət küç., Nəsimi",      lat:40.3793, lng:49.8431, features:["rampa","lift"],                     rating:3.9, type:"🚇" },
  { id:15, name:"Milli Park",                      addr:"Neftçilər pr., Nəsimi",           lat:40.3653, lng:49.8361, features:["rampa","wc","parking"],          rating:4.0, type:"🌳" },
  { id:16, name:"Bakı Olimpiya Stadionu",          addr:"Bülbül pr. 1, Nərimanov",         lat:40.4293, lng:49.9171, features:["rampa","lift","wc","parking"],   rating:4.4, type:"🏟️" },
  { id:17, name:"Baku City Circuit (Formula 1)",  addr:"Neftçilər pr., Sabayıl",           lat:40.3723, lng:49.8531, features:["rampa","lift","wc","parking"],   rating:4.2, type:"🏎️" },
  { id:18, name:"Bakı Zooparkı",                   addr:"Ağ şəhər, Xəzər",                 lat:40.3543, lng:49.8141, features:["rampa","parking"],                   rating:3.8, type:"🦁" },
  { id:19, name:"Gənclik Mall",                    addr:"Fətəli xan Xoyski küç., Nərimanov", lat:40.3996, lng:49.8519, features:["rampa","lift","wc","parking"],  rating:4.7, type:"🛒" },
  { id:20, name:"Flame Towers",                    addr:"Mehdi Hüseyn küç. 1A, Səbail",    lat:40.3598, lng:49.8272, features:["rampa","lift","parking"],           rating:4.3, type:"🏛️" },
  { id:21, name:"Ağ Şəhər Bulvarı",                addr:"Nobel pr., Xətai",                lat:40.3788, lng:49.8864, features:["rampa","parking"],                 rating:4.6, type:"🌳" },
  { id:22, name:"Bakı İdman Sarayı",                addr:"Neftçilər pr., Səbail",           lat:40.3582, lng:49.8335, features:["rampa","lift"],                    rating:4.1, type:"🏟️" },
  { id:23, name:"Hava Limanı (GYD)",               addr:"Mərdəkan şossesi, Xəzər",         lat:40.4675, lng:50.0467, features:["rampa","lift","wc","parking"],  rating:4.9, type:"✈️" },
  { id:24, name:"Crystal Hall",                    addr:"Dövlət Bayrağı Meydanı, Səbail",  lat:40.3444, lng:49.8339, features:["rampa","lift","wc","parking"],  rating:4.5, type:"🏟️" },
  { id:25, name:"Müasir İncəsənət Muzeyi",          addr:"Y.Fərzəliyev küç. 5, Xətai",      lat:40.3801, lng:49.8647, features:["rampa","lift","wc"],            rating:4.4, type:"🏛️" },
  { id:26, name:"Milli Kitabxana",                 addr:"Xaqani küç. 29, Səbail",          lat:40.3732, lng:49.8459, features:["rampa","lift","wc"],            rating:4.2, type:"📚" },
  { id:27, name:"Qız Qalası",                       addr:"İçərişəhər, Səbail",              lat:40.3662, lng:49.8372, features:[],                                   rating:4.8, type:"🏛️" },
  { id:28, name:"Şirvanşahlar Sarayı",             addr:"Qəsr döngəsi 76, Səbail",         lat:40.3661, lng:49.8335, features:["rampa"],                           rating:4.7, type:"🏛️" },
  { id:29, name:"Nərimanov Metro St.",             addr:"Təbriz küç., Nərimanov",          lat:40.4030, lng:49.8711, features:["rampa","lift"],                    rating:3.9, type:"🚇" },
  { id:30, name:"Gənclik Metro St.",               addr:"F.X.Xoyski küç., Nərimanov",      lat:40.4000, lng:49.8510, features:["rampa","lift"],                    rating:4.0, type:"🚇" },
  { id:31, name:"Memar Əcəmi Metro St.",           addr:"Cavadxan küç., Nəsimi",           lat:40.4109, lng:49.8164, features:["lift"],                            rating:3.8, type:"🚇" },
  { id:32, name:"İnşaatçılar Metro St.",           addr:"A.M.Şərifzadə küç., Yasamal",     lat:40.3891, lng:49.8028, features:["lift"],                            rating:3.6, type:"🚇" },
  { id:33, name:"20 Yanvar Metro St.",             addr:"Moskva pr., Yasamal",             lat:40.3986, lng:49.8123, features:["rampa","lift"],                    rating:3.7, type:"🚇" },
  { id:34, name:"Baku Mall",                       addr:"Zərdabi pr., Yasamal",            lat:40.3900, lng:49.8100, features:["rampa","lift","parking"],          rating:4.2, type:"🛒" },
  { id:35, name:"Metropark Mall",                  addr:"Təbriz küç., Nərimanov",          lat:40.4034, lng:49.8741, features:["rampa","lift","wc","parking"],  rating:4.3, type:"🛒" },
  { id:36, name:"Park Bulvar Mall",                addr:"Neftçilər pr., Səbail",           lat:40.3705, lng:49.8488, features:["rampa","lift","wc","parking"],  rating:4.5, type:"🛒" },
  { id:37, name:"Xətai Metro St.",                 addr:"Xocalı pr., Xətai",               lat:40.3853, lng:49.8731, features:["rampa","lift"],                    rating:3.8, type:"🚇" },
  { id:38, name:"Opera və Balet Teatrı",           addr:"Nizami küç. 95, Səbail",          lat:40.3742, lng:49.8481, features:["rampa"],                           rating:4.4, type:"🎭" },
  { id:39, name:"Dövlət Filarmoniyası",           addr:"İstiqlaliyyət küç. 10, Səbail",   lat:40.3637, lng:49.8315, features:["rampa"],                           rating:4.5, type:"🏛️" },
  { id:40, name:"ASAN Xidmət №2",                  addr:"Nobel pr. 23, Xətai",             lat:40.3800, lng:49.8700, features:["rampa","lift","wc"],           rating:4.8, type:"🏢" },
  { id:41, name:"ASAN Xidmət №3",                  addr:"A.M.Şərifzadə küç., Yasamal",     lat:40.3950, lng:49.8050, features:["rampa","lift","wc"],           rating:4.7, type:"🏢" },
  { id:42, name:"Bakı Sağlamlıq Mərkəzi",          addr:"Azadlıq pr. 102, Nəsimi",         lat:40.4050, lng:49.8400, features:["rampa","lift","wc","parking"],  rating:4.6, type:"🏥" },
  { id:43, name:"Bona Dea Hospital",               addr:"Zığ şossesi, Xətai",              lat:40.3700, lng:49.9500, features:["rampa","lift","wc","parking"],  rating:4.9, type:"🏥" },
  { id:44, name:"Mərkəzi Klinika",                 addr:"Parlament pr. 76, Səbail",        lat:40.3680, lng:49.8250, features:["rampa","lift","wc","parking"],  rating:4.7, type:"🏥" },
  { id:45, name:"Nizami Gəncəvi Parkı",           addr:"M.Müşfiq küç., Yasamal",          lat:40.3800, lng:49.8200, features:["rampa"],                           rating:4.1, type:"🌳" },
  { id:46, name:"Fəvvarələr Meydanı",             addr:"Sabir küç., Səbail",              lat:40.3708, lng:49.8369, features:["rampa"],                           rating:4.8, type:"🌳" },
  { id:47, name:"Dağüstü Park",                    addr:"Mehdi Hüseyn küç., Səbail",       lat:40.3589, lng:49.8261, features:["rampa","lift"],                    rating:4.7, type:"🌳" },
  { id:48, name:"Bakı Teleqülləsi",                addr:"Mehdi Hüseyn küç., Səbail",       lat:40.3458, lng:49.8219, features:["lift","parking"],                  rating:4.3, type:"🏛️" },
  { id:49, name:"Milli İncəsənət Muzeyi",          addr:"İstiqlaliyyət küç. 31, Səbail",   lat:40.3653, lng:49.8286, features:["rampa","lift"],                    rating:4.5, type:"🏛️" },
  { id:50, name:"Heydər Əliyev pr. Parkı",        addr:"Heydər Əliyev pr., Nizami",       lat:40.4100, lng:49.9000, features:["rampa","parking"],                 rating:4.2, type:"🌳" },
];

const customIcon = (color: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 0 10px ${color}88,0 2px 6px rgba(0,0,0,0.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

type Panel = 'overview' | 'map' | 'guide' | 'volunteer' | 'jobs' | 'profile';

function AppContent() {
  const [activePanel, setActivePanel] = useState<Panel>('overview');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [accSettings, setAccSettings] = useState({
    fontSize: 100,
    contrast: 'normal',
    colorBlindness: 'none'
  });
  
  const { user, profile, is2FAVerified, loading: authLoading } = useAuth();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: 'success' | 'mission' | 'badge' | 'info'; title?: string }>;
      const { message, type, title } = customEvent.detail;
      const newToast: ToastItem = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        title
      };
      // Keep only up to 2 active toasts to look extremely clean and avoid clutter
      setToasts(prev => [...prev.slice(-1), newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4500);
    };

    window.addEventListener('addim-toast', handleToastEvent);
    return () => window.removeEventListener('addim-toast', handleToastEvent);
  }, []);

  useEffect(() => {
    if (user && profile?.is2FAEnabled && !is2FAVerified) {
      setIsAuthModalOpen(true);
    }
  }, [user, profile, is2FAVerified]);

  useEffect(() => {
    // Apply Root Font Size
    document.documentElement.style.fontSize = accSettings.fontSize === 100 ? '16px' : accSettings.fontSize === 125 ? '18px' : '20px';
    
    // Apply Contrast Class
    if (accSettings.contrast === 'high') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Apply Color Blindness Filter
    const filter = accSettings.colorBlindness === 'grayscale' ? 'grayscale(1)' : 
                   accSettings.colorBlindness === 'protanopia' ? 'url(#protanopia-filter)' :
                   accSettings.colorBlindness === 'deuteranopia' ? 'url(#deuteranopia-filter)' :
                   accSettings.colorBlindness === 'tritanopia' ? 'url(#tritanopia-filter)' : 'none';
    document.documentElement.style.filter = filter;
  }, [accSettings]);

  useEffect(() => {
    const handleContext = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+U, Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'u' || e.key === 's')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim()) return;

    setAiLoading(true);
    setAiResponse(null);
    
    const contextMap = {
      overview: "Ümumi layihə haqqında sual.",
      map: "Əlçatanlıq xəritəsi və fiziki maneələr haqqında.",
      guide: "Xidmətlər və bələdçilər haqqında.",
      volunteer: "Könüllülük proqramı haqqında.",
      jobs: "Məşğulluq və əmək bazarı haqqında."
    };

    const response = await askGemini(aiInput, contextMap[activePanel as keyof typeof contextMap] || "Ümumi profil sualı.");
    setAiResponse(response);
    setAiLoading(false);
  };

  return (
    <div 
      className={`relative z-10 min-h-screen flex flex-col bg-navy transition-all duration-300 ${accSettings.contrast === 'high' ? 'contrast-125 saturate-150 brightness-110' : ''}`}
      style={{ 
        fontSize: accSettings.fontSize === 100 ? '16px' : accSettings.fontSize === 125 ? '18px' : '20px',
        filter: accSettings.colorBlindness === 'grayscale' ? 'grayscale(1)' : 
               accSettings.colorBlindness === 'protanopia' ? 'url(#protanopia-filter)' :
               accSettings.colorBlindness === 'deuteranopia' ? 'url(#deuteranopia-filter)' :
               accSettings.colorBlindness === 'tritanopia' ? 'url(#tritanopia-filter)' : 'none'
      }}
    >
      {/* Color Blindness SVG Filters */}
      <svg className="hidden">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      {/* HEADER */}
      <header className="relative z-50 bg-navy/90 border-b border-teal/20 backdrop-blur-md h-auto min-h-16 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-0 shrink-0 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            className="flex items-center gap-3 group cursor-pointer" 
            onClick={() => user ? setActivePanel('profile') : setIsAuthModalOpen(true)}
            title={user ? "Profilə keçid" : "Giriş et"}
          >
            <div className="w-[42px] h-[42px] shrink-0 overflow-hidden rounded-xl border border-teal/20 shadow-[0_0_15px_rgba(0,184,169,0.3)] transition-transform group-hover:rotate-6 bg-[#0f172a] relative">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M50 20 L25 80 L38 80 L43 65 L61 65 L66 80 L79 80 Z" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M50 35 L46 53 L58 53 Z" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M22 75 C 38 60, 48 68, 76 38" stroke="url(#gold)" strokeWidth="7" strokeLinecap="round" fill="none" />
                <path d="M68 36 L83 30 L76 45 Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight leading-none uppercase italic">ADD<span className="text-teal">IM</span></h1>
              <p className="text-[9px] md:text-[10px] text-muted-blue tracking-widest uppercase">Əlçatanlıq Platforması</p>
            </div>
          </div>
          
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={() => setIsAccessibilityModalOpen(true)}
              className="w-8 h-8 rounded-full bg-navy-lighter border border-teal/20 flex items-center justify-center text-teal"
            >
              <Accessibility className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-navy-lighter border border-teal/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse"></span>
              <span className="text-[9px] font-medium text-teal uppercase tracking-tighter">AI</span>
            </div>
          </div>
        </div>
        
        <nav className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide no-scrollbar snap-x snap-mandatory">
          <TabButton active={activePanel === 'overview'} onClick={() => setActivePanel('overview')} label="İCMAL" />
          <TabButton active={activePanel === 'map'} onClick={() => setActivePanel('map')} label="XƏRİTƏ" />
          <TabButton active={activePanel === 'guide'} onClick={() => setActivePanel('guide')} label="BƏLƏDÇİ" />
          <TabButton active={activePanel === 'volunteer'} onClick={() => setActivePanel('volunteer')} label="KÖNÜLLÜ" />
          <TabButton active={activePanel === 'jobs'} onClick={() => setActivePanel('jobs')} label="İŞ" />
          {user && <TabButton active={activePanel === 'profile'} onClick={() => setActivePanel('profile')} label="PROFİL" />}
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => setIsAccessibilityModalOpen(true)}
            className="w-10 h-10 rounded-full bg-navy-lighter border border-teal/20 flex items-center justify-center text-teal hover:bg-teal/10 transition-all group relative"
            title="Əlçatanlıq Ayarları"
          >
            <Accessibility className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal rounded-full border border-navy animate-pulse" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-navy-lighter border border-teal/20 rounded-full">
            <span className="w-2 h-2 bg-teal rounded-full animate-pulse shadow-[0_0_8px_var(--color-teal)]"></span>
            <span className="text-[11px] font-medium text-teal uppercase tracking-tighter">AI ONLINE</span>
          </div>
          {user ? (
            <div className="relative group">
              <button 
                onClick={() => setActivePanel('profile')}
                className={`w-9 h-9 rounded-full bg-gradient-to-br from-teal to-orange flex items-center justify-center text-white font-black text-xs border-2 transition-all ${activePanel === 'profile' ? 'border-white scale-110' : 'border-teal/20 hover:scale-105'}`}
              >
                <UserIcon className="w-5 h-5" />
              </button>
              {profile?.is2FAEnabled && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-navy rounded-full border border-teal flex items-center justify-center">
                  <ShieldCheck className="w-2.5 h-2.5 text-teal" />
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal text-navy rounded-lg font-exo font-black text-[10px] tracking-widest uppercase hover:scale-105 transition-transform"
            >
              <LogIn className="w-4 h-4" />
              Giriş
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AnimatePresence>
        {isAccessibilityModalOpen && (
          <AccessibilityModal 
            onClose={() => setIsAccessibilityModalOpen(false)} 
            settings={accSettings}
            setSettings={setAccSettings}
          />
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow p-4 md:p-6 relative overflow-y-auto z-20">
        <AnimatePresence mode="wait">
          {activePanel === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5"
            >
              {/* Left Column: Metrics & Roadmap */}
              <section className="md:col-span-3 flex flex-col gap-4">
                <div className="card-dense order-2 md:order-1">
                  <h3 className="label-xs mb-4">Sistem Statistikası</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-navy/60 rounded-lg border border-teal/10">
                      <div className="stat-val-small">600K</div>
                      <div className="label-xs text-[8px] mt-1">Hədəf Vətəndaş</div>
                    </div>
                    <div className="p-3 bg-navy/60 rounded-lg border border-teal/10">
                      <div className="stat-val-small text-orange">512</div>
                      <div className="label-xs text-[8px] mt-1">Sertifikatlı Yer</div>
                    </div>
                  </div>
                </div>

                <div className="card-dense order-3 md:order-2">
                  <h3 className="label-xs mb-4">Yol Xəritəsi (18 Ay)</h3>
                  <div className="space-y-4">
                    <DenseProgress label="Faza 1: MVP" percent={100} color="teal" />
                    <DenseProgress label="Faza 2: Miqyas" percent={64} color="orange" />
                    <DenseProgress label="Faza 3: Milli" percent={12} color="muted" />
                  </div>
                  <div className="mt-6 pt-4 border-t border-teal/10 hidden md:block">
                    <p className="text-[11px] leading-relaxed text-muted-blue">
                      ADDIM platforması əlilliyi olan şəxslərin sosial müdafiəsinin rəqəmsallaşdırılması üçün nəzərdə tutulub.
                    </p>
                  </div>
                </div>
              </section>

              {/* Middle Column: Hero & AI */}
              <section className="md:col-span-6 flex flex-col gap-4 order-1 md:order-2">
                <div className="h-[250px] md:h-3/5 bg-navy-lighter/80 border border-teal/20 rounded-xl relative overflow-hidden min-h-[250px]">
                  <div className="absolute inset-0 bg-navy/40 flex items-center justify-center">
                    <div className="w-full h-full p-6 md:p-8 relative">
                      <div className="absolute top-1/4 left-1/3 w-2.5 h-2.5 bg-teal rounded-full shadow-[0_0_12px_var(--color-teal)] animate-ping"></div>
                      <div className="absolute top-1/2 left-2/3 w-2.5 h-2.5 bg-orange rounded-full shadow-[0_0_12px_var(--color-orange)] animate-pulse"></div>
                      <div className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-teal rounded-full shadow-[0_0_12px_var(--color-teal)]"></div>
                      <div className="flex flex-col items-center justify-center h-full opacity-30 select-none text-center">
                        <div className="text-4xl md:text-5xl lg:text-7xl font-black text-teal/20 italic tracking-tighter uppercase mb-1">Baku Grid</div>
                        <div className="text-[9px] md:text-xs text-teal/30 font-bold tracking-[0.2em] md:tracking-[0.3em]">ACCESSIBILITY LAYER</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-navy/60 backdrop-blur p-2 rounded-lg border border-white/5">
                     <div className="px-2 py-1 bg-navy/80 border border-teal/40 rounded text-[9px] font-bold">
                       📍 2.4K NÖQTƏ
                     </div>
                     <button onClick={() => setActivePanel('map')} className="btn-primary-dense px-3 py-1.5 hover:scale-105">XƏRİTƏNİ AÇ</button>
                  </div>
                </div>

                <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 md:p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-teal rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-teal uppercase tracking-widest">ADDIM AI ASSISTANT</span>
                  </div>
                  <div className="text-xs leading-relaxed text-white-soft/80 italic px-2 border-l-2 border-teal/40 mb-4 h-fit md:max-h-[100px] overflow-auto">
                    {aiResponse || "Salam! Mən sizə yaxınlıqdakı əlçatan məkanları tapmaqda və ya iş tapmaqda kömək edə bilərəm."}
                  </div>
                  <form onSubmit={handleAskAI} className="flex gap-2">
                    <input 
                      type="text" 
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Sualınızı bura yazın..." 
                      className="flex-grow bg-navy border border-teal/20 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-teal min-w-0" 
                    />
                    <button type="submit" className="p-2 bg-teal text-navy rounded-lg hover:scale-105 transition-transform shrink-0">
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              </section>

              {/* Right Column: Volunteers & Jobs */}
              <section className="md:col-span-3 flex flex-col gap-4 order-4 md:order-3">
                <div className="card-dense">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="label-xs">Yaxınlıqda Könüllülər</h3>
                     <span className="text-[10px] text-teal font-bold tracking-tight">+24</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                    <DenseListItem name="Anar M." loc="Bakı, 1.2km" initials="AM" gradient="from-teal-500 to-blue-600" />
                    <DenseListItem name="Səbinə Q." loc="Sumqayıt, 0.5km" initials="SQ" gradient="from-orange-400 to-red-500" />
                    <div className="hidden md:block">
                      <DenseListItem name="Rəşad E." loc="Bakı, 3.8km" initials="RE" gradient="from-purple-500 to-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="card-dense">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="label-xs">Son İş Elanları</h3>
                     <span className="text-[10px] text-orange font-bold font-exo italic uppercase">YENİ</span>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <DenseJobItem title="Məlumat Mərkəzi" company="Kapital Bank" />
                    <DenseJobItem title="UI/UX Dizayner" company="Pasha Travel" />
                  </div>
                  <button onClick={() => setActivePanel('jobs')} className="w-full mt-3 text-[10px] font-black text-teal uppercase tracking-widest hover:underline text-center">Hamısına bax</button>
                </div>
              </section>
            </motion.div>
          )}

          {activePanel !== 'overview' && (
            <motion.div 
              key={activePanel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-5xl mx-auto pb-10"
            >
              {activePanel === 'map' && <MapPanel />}
              {activePanel === 'guide' && <GuidePanel />}
              {activePanel === 'volunteer' && <VolunteerPanel />}
              {activePanel === 'jobs' && <JobsPanel />}
              {activePanel === 'profile' && <ProfilePanel />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Toast Stack */}
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 md:px-0 pointer-events-auto">
          <AnimatePresence>
            {toasts.map((toast) => {
              const colors = {
                success: { bg: 'from-[#0f172a] to-teal-950/40 border-teal/40 text-teal', icon: '📍', titleColor: 'text-teal' },
                mission: { bg: 'from-[#0f172a] to-orange-950/40 border-orange/40 text-orange', icon: '🎯', titleColor: 'text-orange' },
                badge: { bg: 'from-[#0f172a] to-yellow-950/40 border-yellow/40 text-yellow', icon: '🏆', titleColor: 'text-yellow' },
                info: { bg: 'from-[#0f172a] to-sky-950/40 border-sky/40 text-sky', icon: 'ℹ️', titleColor: 'text-sky' }
              }[toast.type] || { bg: 'from-[#0f172a] to-teal-950/40 border-teal/40 text-teal', icon: '📍', titleColor: 'text-teal' };

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 50, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
                  layout
                  className={`p-4 bg-gradient-to-r ${colors.bg} rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 relative overflow-hidden group`}
                >
                  <div className={`absolute top-0 bottom-0 left-0 w-1 bg-current`} />
                  <div className="text-2xl mt-0.5 shrink-0 group-hover:scale-110 transition-transform">{colors.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${colors.titleColor}`}>
                      {toast.title || "Yenilik"}
                    </h4>
                    <p className="text-xs font-bold text-white leading-relaxed">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="text-white/40 hover:text-white transition-colors shrink-0 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* Visual Footer Decor */}
      <div className="h-1 bg-gradient-to-r from-transparent via-teal to-transparent opacity-20 shrink-0"></div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 md:px-5 py-2.5 md:py-2 text-[11px] font-bold transition-all rounded-md border snap-center
        ${active ? 'bg-teal/10 text-teal border-teal/30' : 'text-muted-blue border-transparent hover:text-white-soft'}`}
    >
      {label}
    </button>
  );
}

function DenseProgress({ label, percent, color }: { label: string, percent: number, color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal',
    orange: 'bg-gradient-to-r from-orange to-orange-light',
    muted: 'bg-muted-blue/40'
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
        <span className={color === 'teal' ? 'text-teal' : color === 'orange' ? 'text-orange' : 'text-muted-blue'}>{label}</span>
        <span className="text-white">{percent}%</span>
      </div>
      <div className="h-1.5 w-full bg-navy rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1 }}
          className={`h-full ${colorMap[color]}`}
        />
      </div>
    </div>
  );
}

function DenseListItem({ name, loc, initials, gradient }: { name: string, loc: string, initials: string, gradient: string }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-navy/40 border border-white/5 rounded-lg hover:border-teal/20 transition-colors">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-[10px] font-bold text-white`}>
        {initials}
      </div>
      <div>
        <div className="text-[11px] font-bold text-white-soft">{name}</div>
        <div className="text-[9px] text-teal font-medium">{loc}</div>
      </div>
    </div>
  );
}

function DenseJobItem({ title, company }: { title: string, company: string }) {
  return (
    <div className="p-3 bg-navy/40 border-l-2 border-orange rounded-r-lg group hover:bg-navy/60 transition-colors cursor-pointer">
      <div className="text-[11px] font-bold text-white/90 group-hover:text-orange transition-colors">{title}</div>
      <div className="text-[9px] text-muted-blue mt-1">{company}</div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-4 flex items-center gap-2 font-exo font-semibold text-xs tracking-wide uppercase transition-all border-b-2 whitespace-nowrap
        ${active ? 'text-teal border-teal' : 'text-muted-blue border-transparent hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  );
}

import { OverviewPanel } from './components/OverviewPanel';

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

function MapPanel() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoc, setSelectedLoc] = useState<any>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifText, setNotifText] = useState("Məlumat Təsdiqləndi");
  const { user, profile, refreshProfile } = useAuth();
  
  // Local storage for map locations and verifications
  const [mapLocations, setMapLocations] = useState(() => {
    try {
      const cached = localStorage.getItem('accessbaku_locations');
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = [...MAP_LOCATIONS];
        const mapLocIds = new Set(MAP_LOCATIONS.map(l => l.id));
        parsed.forEach((ploc: any) => {
          if (!mapLocIds.has(ploc.id)) {
            merged.push(ploc);
          }
        });
        return merged;
      }
      return MAP_LOCATIONS;
    } catch {
      return MAP_LOCATIONS;
    }
  });

  const [verifications, setVerifications] = useState<Record<number, Record<string, number>>>(() => {
    try {
      const cached = localStorage.getItem('accessbaku_verifications');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [navMode, setNavMode] = useState(false);
  const [navTarget, setNavTarget] = useState<any>(null);
  const [transportMode, setTransportMode] = useState<'walking' | 'car' | 'public'>('walking');
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    localStorage.setItem('accessbaku_locations', JSON.stringify(mapLocations));
  }, [mapLocations]);

  useEffect(() => {
    localStorage.setItem('accessbaku_verifications', JSON.stringify(verifications));
  }, [verifications]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const userPos: [number, number] = [40.3725, 49.8433];

  const handleStartNav = (loc: any) => {
    setNavTarget(loc);
    setNavMode(true);
    setSelectedLoc(loc);
  };

  const handleVerify = async (locId: number, feature: string) => {
    // Increment local verifications state for temporary map pin UI increment
    setVerifications(prev => ({
      ...prev,
      [locId]: {
        ...(prev[locId] || {}),
        [feature]: (prev[locId]?.[feature] || 0) + 1
      }
    }));

    const addXp = 30;
    let finalMsg = "Təşəkkür edirik! +30 XP qazandınız.";

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const currentXp = profile?.xp || 0;
        const currentVerifiedCount = (profile?.verifiedCount || 0) + 1;
        const earnedBadges = [...(profile?.badges || [])];

        // First verification badge
        if (!earnedBadges.includes('first_verify')) {
          earnedBadges.push('first_verify');
          finalMsg = "İlk Bələdçi nişanı qazanıldı! 🔍 +30 XP";
        }

        // Defender badge if verified count >= 3
        if (currentVerifiedCount >= 3 && !earnedBadges.includes('defender')) {
          earnedBadges.push('defender');
          finalMsg = "Müdafiəçi nişanı qazanıldı! 🛡️ +30 XP";
        }

        // Master badge if verified count >= 8
        if (currentVerifiedCount >= 8 && !earnedBadges.includes('master')) {
          earnedBadges.push('master');
          finalMsg = "Ustad Könüllü nişanı qazanıldı! 👑 +30 XP";
        }

        await updateDoc(userRef, {
          xp: currentXp + addXp,
          verifiedCount: currentVerifiedCount,
          badges: earnedBadges
        });
        await refreshProfile();
      } catch (err) {
        console.error("Firestore verification points update failed:", err);
      }
    } else {
      // Local storage fallback for guest mode / testing
      try {
        const stored = localStorage.getItem('accessbaku_local_volunteer_stats');
        const parsed = stored ? JSON.parse(stored) : { xp: 0, badges: [], verifiedCount: 0, completedMissions: [] };

        parsed.xp += addXp;
        parsed.verifiedCount += 1;

        if (!parsed.badges.includes('first_verify')) {
          parsed.badges.push('first_verify');
          finalMsg = "İlk Bələdçi nişanı qazanıldı! 🔍 +30 XP";
        }
        if (parsed.verifiedCount >= 3 && !parsed.badges.includes('defender')) {
          parsed.badges.push('defender');
          finalMsg = "Müdafiəçi nişanı qazanıldı! 🛡️ +30 XP";
        }
        if (parsed.verifiedCount >= 8 && !parsed.badges.includes('master')) {
          parsed.badges.push('master');
          finalMsg = "Ustad Könüllü nişanı qazanıldı! 👑 +30 XP";
        }

        localStorage.setItem('accessbaku_local_volunteer_stats', JSON.stringify(parsed));
      } catch (err) {
        console.error("Local storage verification points error:", err);
      }
    }

    setNotifText(finalMsg);
    setShowNotif(true);
    setTimeout(() => setShowNotif(false), 2500);
  };

  const visibleLocations = mapLocations.filter((loc: any) => {
    const matchesFilters = activeFilters.length === 0 || activeFilters.some(f => loc.features.includes(f));
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || loc.addr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilters && matchesSearch;
  });

  const getResponsiveColor = (locFeatures: string[]) => {
    if (activeFilters.length > 0) {
      const primaryActive = activeFilters.find(f => locFeatures.includes(f));
      if (primaryActive) {
        if (primaryActive === "lift") return "#f97316";
        if (primaryActive === "wc") return "#a78bfa";
        if (primaryActive === "rampa") return "#2dd4bf";
        if (primaryActive === "parking") return "#fbbf24";
      }
    }
    if (locFeatures.includes("rampa")) return "#2dd4bf";
    if (locFeatures.includes("lift")) return "#f97316";
    if (locFeatures.includes("wc")) return "#a78bfa";
    if (locFeatures.includes("parking")) return "#fbbf24";
    return "#64748b";
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] border border-white/10 rounded-3xl overflow-hidden bg-navy-light shadow-2xl relative"
    >
      <AnimatePresence>
        {showNotif && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[9999] bg-gradient-to-r from-teal to-orange text-navy px-6 py-3.5 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-wider flex items-center gap-3 border border-teal/20"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {notifText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Toggle */}
      <div className="md:hidden flex bg-navy border-b border-white/5 p-3 gap-2">
        <button 
          onClick={() => setMobileView('list')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mobileView === 'list' ? 'bg-teal text-navy' : 'bg-navy-lighter text-muted-blue'}`}
        >
          Siyahı
        </button>
        <button 
          onClick={() => setMobileView('map')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mobileView === 'map' ? 'bg-teal text-navy' : 'bg-navy-lighter text-muted-blue'}`}
        >
          Xəritə
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`w-full md:w-[400px] lg:w-[450px] bg-navy/95 border-r border-white/5 flex flex-col z-20 ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-6 border-b border-white/5 bg-gradient-to-b from-navy-lighter to-transparent">
            <h2 className="text-2xl font-exo font-black text-white italic mb-2 uppercase flex items-center justify-between">
              <div className="flex items-center gap-3">
                Xəritə 
                {isOffline && (
                  <span className="text-[9px] px-2 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-full font-sans not-italic flex items-center gap-1 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> OFFLINE
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsSuggestModalOpen(true)}
                className="w-8 h-8 rounded-full bg-orange/20 text-orange flex items-center justify-center hover:bg-orange hover:text-white transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </h2>
            <p className="text-xs text-muted-blue mb-6">Məkan axtar, marşrut qur, maneələri gör.</p>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-blue" />
              <input 
                type="text" 
                placeholder="Məkan, küçə, obyekt axarış..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-medium placeholder:text-muted-blue/50"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
              {[
                { id: 'rampa', label: 'Rampa', icon: '🚶' },
                { id: 'lift', label: 'Lift', icon: '🛗' },
                { id: 'wc', label: 'WC', icon: '🚻' },
                { id: 'parking', label: 'Parking', icon: '🅿️' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => {
                    setActiveFilters(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])
                  }}
                  className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all shadow-sm
                    ${activeFilters.includes(f.id) 
                      ? 'bg-teal border-teal text-navy' 
                      : 'bg-navy-lighter border-white/10 text-muted-blue hover:text-white'}`}
                >
                  <span className="text-sm">{f.icon}</span> {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 relative scroll-smooth">
            <AnimatePresence mode="wait">
              {navMode && navTarget ? (
                <motion.div 
                  key="nav"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-teal/5 border border-teal/20 rounded-2xl p-5 mb-4 shadow-xl"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-teal flex items-center gap-2"><Route className="w-4 h-4 animate-pulse" /> Naviqasiya Rejimi</span>
                    <button 
                      onClick={() => setNavMode(false)}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-500 flex items-center justify-center transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-navy rounded-xl p-3 border border-white/5 mb-4 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-teal">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase text-white truncate max-w-[200px]">{navTarget.name}</div>
                        <div className="text-[10px] text-muted-blue truncate max-w-[200px]">{navTarget.addr}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex bg-navy rounded-lg p-1 border border-white/5 gap-1 mb-4 shadow-sm">
                    {['walking', 'car', 'public'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setTransportMode(mode as any)}
                        className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2
                          ${transportMode === mode ? 'bg-teal text-navy shadow-md' : 'text-muted-blue hover:text-white'}`}
                      >
                        {mode === 'walking' && <PersonStanding className="w-3 h-3" />}
                        {mode === 'car' && <Car className="w-3 h-3" />}
                        {mode === 'public' && <Bus className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                  <div className="h-[2px] bg-white/5 rounded-full mb-4 relative overflow-hidden">
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-teal" 
                      initial={{ width: "0%" }}
                      animate={{ width: "40%" }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-blue leading-relaxed font-medium">Bütün marşrut əlçatanlıq standartlarına uyğun hesablanır.</p>
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {visibleLocations.length > 0 ? (
                    visibleLocations.map((loc) => (
                      <div 
                        key={loc.id} 
                        onClick={() => setSelectedLoc(loc)}
                        className={`bg-navy-lighter/60 p-4 border rounded-2xl mb-4 cursor-pointer transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl group
                          ${selectedLoc?.id === loc.id ? 'border-teal/50 bg-teal/5 shadow-teal/10' : 'border-white/5 hover:border-white/20'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-md">{loc.type}</span>
                            <div>
                              <h3 className="text-sm font-black text-white uppercase group-hover:text-teal transition-colors tracking-tight">{loc.name}</h3>
                              <p className="text-[10px] text-muted-blue opacity-80 mt-0.5">📍 {loc.addr}</p>
                            </div>
                          </div>
                          <div className="bg-navy rounded-lg p-1.5 border border-white/5 flex items-center justify-center text-yellow font-black text-[10px]">
                            {loc.rating} ★
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {loc.features.map((f: string) => (
                            <span key={f} className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border tracking-tighter
                              ${activeFilters.includes(f) ? `border-teal text-teal bg-teal/10` : 'border-white/10 text-muted-blue bg-navy/50'}`}>
                              {f}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleStartNav(loc); }}
                             className="flex-1 bg-white/5 hover:bg-teal hover:text-navy text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                           >
                             <Navigation className="w-3.5 h-3.5" /> Marşrut
                           </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50 px-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-muted-blue" />
                      </div>
                      <p className="text-sm font-bold text-white mb-2">Heç nə tapılmadı</p>
                      <p className="text-[10px] text-muted-blue leading-relaxed">Seçdiyiniz filtrlərə uyğun məkan tapılmadı. Filtrləri silib yenidən yoxlayın.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Map Container */}
        <div className={`flex-1 bg-navy relative ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
          <MapContainer 
            center={[40.4093, 49.8671]} 
            zoom={12} 
            style={{ height: '100%', width: '100%', zIndex: 10 }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            {visibleLocations.map(loc => (
              <Marker 
                key={loc.id} 
                position={[loc.lat, loc.lng]} 
                icon={customIcon(selectedLoc?.id === loc.id ? "#ffffff" : getResponsiveColor(loc.features))}
                eventHandlers={{ click: () => setSelectedLoc(loc) }}
              >
                <Popup className="custom-popup" minWidth={280}>
                  <div className="p-4 bg-navy-light relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                    <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 transform rotate-12 select-none pointer-events-none">{loc.type}</div>
                    <h3 className="font-outfit font-black text-lg text-white uppercase mb-1 drop-shadow pr-8">{loc.name}</h3>
                    <p className="text-[10px] text-teal font-bold tracking-widest uppercase mb-4 opacity-80">{loc.addr}</p>
                    
                    <div className="space-y-2 mb-4">
                      {loc.features.map((f: string) => (
                        <div key={f} className="flex justify-between items-center p-2 rounded-lg bg-navy border border-white/5 hover:border-teal/30 transition-colors group">
                           <span className="text-[10px] font-bold uppercase tracking-tight text-white-soft">{f}</span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleVerify(loc.id, f); }}
                             className="text-[9px] bg-teal/10 text-teal hover:bg-teal hover:text-navy px-3 py-1.5 rounded text-black transition-colors flex items-center gap-1 font-black shadow-inner"
                           >
                             Təsdiqlə ({verifications[loc.id]?.[f] || 0})
                           </button>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => handleStartNav(loc)}
                      className="w-full bg-gradient-to-r from-teal to-teal/80 text-navy font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-teal/20"
                    >
                      Bura Get
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {navMode && navTarget && (
              <>
                <Polyline 
                  positions={[userPos, [navTarget.lat, navTarget.lng]]} 
                  color={transportMode === 'public' ? "#a78bfa" : "#2dd4bf"} 
                  weight={5} 
                  dashArray={transportMode === 'walking' ? "10, 10" : "1"} 
                  opacity={0.8}
                />
                <CircleMarker center={userPos} radius={8} color="#2dd4bf" fillColor="#2dd4bf" fillOpacity={1}>
                  <Tooltip permanent direction="top">Sən</Tooltip>
                </CircleMarker>
                <CircleMarker center={[navTarget.lat, navTarget.lng]} radius={10} color="#f97316" fillColor="#f97316" fillOpacity={0.6}>
                  <Tooltip permanent direction="top">Hədəf</Tooltip>
                </CircleMarker>
              </>
            )}
            <MapHandler 
              center={selectedLoc ? [selectedLoc.lat, selectedLoc.lng] : null} 
              trigger={mobileView}
            />
          </MapContainer>

          <div className="absolute bottom-6 right-6 z-[90] bg-navy-light/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 pointer-events-auto">
            <h4 className="text-[10px] font-black text-muted-blue uppercase tracking-widest mb-1 border-b border-white/5 pb-2">Göstəricilər</h4>
            <LegendItem color="#2dd4bf" label="Rampa" />
            <LegendItem color="#f97316" label="Lift" />
            <LegendItem color="#a78bfa" label="WC" />
            <LegendItem color="#fbbf24" label="Parking" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSuggestModalOpen && <SuggestLocationModal onClose={() => setIsSuggestModalOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function SuggestLocationModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    addr: '',
    features: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Zəhmət olmasa daxil olun.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'suggested_locations'), {
        ...formData,
        status: 'pending',
        suggestedBy: user.uid,
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(onClose, 2500);
    } catch (err: any) {
      console.error("Suggestion error:", err);
      setError("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFeature = (f: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(f) 
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f]
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-navy/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card max-w-lg w-full relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-blue hover:text-white"><X className="w-5 h-5"/></button>
        
        {isSuccess ? (
          <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-teal/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-teal" />
            </div>
            <h3 className="font-exo font-black text-2xl text-white mb-2">Təşəkkür edirik!</h3>
            <p className="text-muted-blue text-sm">Məkan modulyasiyaya göndərildi. Təsdiqləndikdən sonra xəritədə görünəcək.</p>
          </div>
        ) : (
          <>
            <h2 className="font-exo font-black text-2xl mb-2 flex items-center gap-3">
              <Plus className="w-6 h-6 text-orange" /> Yeni Məkan Təklif Et
            </h2>
            <p className="text-xs text-muted-blue mb-8 uppercase tracking-widest font-black">MODERASİYA MƏRHƏLƏSİ</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase font-black text-center rounded-xl">{error}</div>}
              {!user && <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] uppercase font-black text-center rounded-xl">Məkan əlavə etmək üçün daxil olmalısınız</div>}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-blue uppercase tracking-widest">Məkanın Adı</label>
                <input 
                  required
                  type="text" 
                  className="input-field" 
                  placeholder="Məsələn: Nizami Gəncəvi Muzeyi"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-blue uppercase tracking-widest">Tam Ünvan</label>
                <input 
                  required
                  type="text" 
                  className="input-field" 
                  placeholder="Küçə, bina, rayon..."
                  value={formData.addr}
                  onChange={e => setFormData({ ...formData, addr: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-blue uppercase tracking-widest">Əlçatanlıq Xüsusiyyətləri</label>
                <div className="grid grid-cols-2 gap-2">
                  {['rampa', 'lift', 'wc', 'parking'].map(f => (
                    <button 
                      type="button"
                      key={f}
                      onClick={() => toggleFeature(f)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all
                        ${formData.features.includes(f) ? 'bg-orange/10 border-orange text-orange' : 'bg-navy-light/40 border-white/5 text-muted-blue'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{f}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                className="btn-orange w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'TƏKLİFİ GÖNDƏR'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function NavigationStep({ icon, text, type }: { icon: string, text: string, type: 'success' | 'primary' | 'finish' }) {
  const colors = {
    success: 'bg-teal/20 text-teal border-teal/20',
    primary: 'bg-orange/20 text-orange border-orange/20',
    finish: 'bg-purple/20 text-purple border-purple/20'
  };
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${colors[type]}`}>
      <div className="text-lg">{icon}</div>
      <div className="text-[10px] font-bold leading-tight">{text}</div>
    </div>
  );
}
function MapHandler({ center, trigger }: { center: [number, number] | null, trigger?: any }) {
  const map = useMap();
  useEffect(() => {
    // Ensuring map recalculates its dimensions after a short delay
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250); // Slightly longer delay to be safe
    
    if (center) {
      map.setView(center, 18, { animate: true });
    }
    return () => clearTimeout(timer);
  }, [center, map, trigger]);
  return null;
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] font-bold text-muted-blue uppercase tracking-tight">{label}</span>
    </div>
  );
}

function GuidePanel() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const guides = [
    { title: 'Təhsil Müəssisələri', desc: 'Universitet və məktəblərin əlçatımlılıq standartları.', icon: <BookOpen />, status: 'updated' },
    { title: 'Səhiyyə Xidmətləri', desc: 'Xəstəxanalar üçün xüsusi növbə və giriş qaydaları.', icon: <Building />, status: 'new' },
    { title: 'Nəqliyyat Bələdçisi', desc: 'İctimai nəqliyyatda güzəştlər və xüsusi servislar.', icon: <MapPin />, status: 'available' },
    { title: 'Hüquqi Dəstək', desc: 'Əlillik dərəcəsinin təyini və hüquqlarınız.', icon: <Users />, status: 'available' },
  ];

  const videoTutorials = [
    { 
      id: 1, 
      title: 'İctimai Nəqliyyatda Maneəsiz Hərəkət', 
      desc: 'Avtobus və metrolarda rampa mexanizmlərinin işlədilməsi haqqında vizual təlimat.', 
      thumbnail: 'https://picsum.photos/seed/subway/400/225', 
      url: 'https://vjs.zencdn.net/v/oceans.mp4' 
    },
    { 
      id: 2, 
      title: 'Rəqəmsal Əlçatımlılıq Texnologiyaları', 
      desc: 'Smartfonlarda "TalkBack" və "VoiceOver" funksiyalarının aktivləşdirilməsi.', 
      thumbnail: 'https://picsum.photos/seed/accessibility/400/225', 
      url: 'https://media.w3.org/2010/05/sintel/trailer.mp4' 
    },
    { 
      id: 3, 
      title: 'Könüllü ilə Ünsiyyət Qaydaları', 
      desc: 'Eşitmə və görmə məhdudiyyətli şəxslərlə düzgün kommunikasiya etikası.', 
      thumbnail: 'https://picsum.photos/seed/volunteer-help/400/225', 
      url: 'https://www.w3schools.com/html/mov_bbb.mp4' 
    }
  ];

  const assistiveFeatures = [
    { 
      title: 'Ekran Oxuyucuları (Screen Readers)', 
      desc: 'Görmə məhdudiyyətli istifadəçilər üçün mətni səsə çevirən texnologiyalar (NVDA, JAWS, VoiceOver).', 
      icon: <Eye />, 
      link: 'https://www.w3.org/WAI/perspective-videos/voice/'
    },
    { 
      title: 'Klaviatura Naviqasiyası', 
      desc: 'Siçan istifadə etmədən yalnız "Tab" və ox düymələri ilə tam idarəetmə qaydaları.', 
      icon: <Keyboard />, 
      link: 'https://webaim.org/techniques/keyboard/'
    },
    { 
      title: 'Səsli İdarəetmə (Voice Control)', 
      desc: 'Səs əmrləri vasitəsilə naviqasiya və formaların doldurulması üçün assistentlər.', 
      icon: <Mic />, 
      link: 'https://support.google.com/accessibility/android/answer/6151848'
    },
    { 
      title: 'Fərdiləşdirilmiş Parametrlər', 
      desc: 'Şrift ölçüsü, kontrast və rəng filtrlərini profil bölməsindən tənzimləyin.', 
      icon: <SettingsIcon />, 
      link: '#'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      <div className="space-y-6">
        <SectionHeader 
          title="Xidmət Bələdçisi" 
          badge="BİLGİ" 
          desc="Bütün dövlət və özəl xidmətlər haqqında aydın, strukturlaşdırılmış məlumat bazası."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((g, i) => (
            <div key={i} className="card flex gap-6 items-start group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-navy transition-colors">
                {g.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-exo font-bold text-lg">{g.title}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${g.status === 'new' ? 'bg-orange text-white' : g.status === 'updated' ? 'bg-teal text-navy' : 'bg-white/5 text-muted-blue'}`}>
                    {g.status}
                  </span>
                </div>
                <p className="text-sm text-muted-blue leading-relaxed">{g.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-teal text-xs font-bold cursor-pointer hover:underline">
                  Daha ətraflı oxu <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader 
          title="Video Təlimatlar" 
          badge="MULTİMEDİA" 
          desc="Vizual dərsliklər vasitəsilə əlçatımlılıq funksiyalarından istifadəni öyrənin."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videoTutorials.map((v) => (
            <div key={v.id} className="card-dense group cursor-pointer overflow-hidden" onClick={() => setSelectedVideo(v)}>
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-white/10">
                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-navy/40 group-hover:bg-navy/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-teal rounded-full flex items-center justify-center text-navy shadow-lg shadow-teal/20 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>
              </div>
              <h4 className="font-bold text-white mb-2 group-hover:text-teal transition-colors">{v.title}</h4>
              <p className="text-[11px] text-muted-blue leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader 
          title="Əlçatımlılıq Funksiyaları" 
          badge="TEXNOLOGİYA" 
          desc="Platformamızda və cihazlarınızda mövcud olan köməkçi vasitələr haqqında məlumat."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assistiveFeatures.map((f, i) => (
            <div key={i} className="card flex gap-6 items-start group hover:border-teal/30 transition-all border-white/5">
              <div className="w-12 h-12 rounded-xl bg-navy-lighter flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-navy transition-colors shrink-0">
                {f.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-2 text-base group-hover:text-teal transition-colors">{f.title}</h4>
                <p className="text-[11px] text-muted-blue leading-relaxed mb-4">{f.desc}</p>
                <a 
                  href={f.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal hover:underline"
                >
                  Təlimata Bax <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-navy/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl card relative p-2 md:p-4"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-12 right-0 md:-right-12 text-white hover:text-teal transition-colors"
                title="Bağla"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                <video 
                  controls 
                  autoPlay 
                  className="w-full h-full"
                  src={selectedVideo.url}
                />
              </div>
              <div className="mt-6 px-2">
                <h3 className="font-exo font-black text-2xl text-white mb-2 italic tracking-tight">{selectedVideo.title}</h3>
                <p className="text-muted-blue text-sm leading-relaxed">{selectedVideo.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VolunteerPanel() {
  const [showQuest, setShowQuest] = useState(false);
  
  const volunteers = [
    { name: 'Aynur M.', skill: 'İşarət dili mütəxəssisi', dist: '1.2 km', char: 'A' },
    { name: 'Elvin Q.', skill: 'Fiziki kömək / Daşıma', dist: '2.5 km', char: 'E' },
    { name: 'Nigar S.', skill: 'Hüquqi məsləhət', dist: '4.0 km', char: 'N' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <SectionHeader 
        title="Sosial Könüllülük" 
        badge="DƏSTƏK" 
        desc="Kömək lazımdır? Yaxınlıqdakı könüllülərə müraciət edin və ya icmamıza qoşulun."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Call to Action */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="p-8 bg-gradient-to-br from-orange/20 to-navy-lighter border border-orange/30 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <Heart className="w-48 h-48 text-orange" />
            </div>
            <h3 className="font-exo font-black text-3xl mb-4 leading-tight">İnsanların həyatını <br/><span className="text-orange italic">birgə dəyişək.</span></h3>
            <p className="text-muted-blue text-sm mb-8 leading-relaxed">
              Sizin bir neçə saatiniz kimsə üçün müstəqillik deməkdir. Könüllülük proqramımıza qoşulun və real sosial təsir yaradın.
            </p>
            <button 
              onClick={() => setShowQuest(true)}
              className="px-8 py-4 bg-orange text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-orange/30 hover:scale-105 transition-all flex items-center gap-3"
            >
              KÖNÜLLÜ OL <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-dense flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow" />
              <div>
                <div className="text-xl font-black text-white">450+</div>
                <div className="text-[8px] text-muted-blue uppercase font-bold tracking-widest">Sertifikatlı könüllü</div>
              </div>
            </div>
            <div className="card-dense flex items-center gap-3">
              <Heart className="w-8 h-8 text-orange" />
              <div>
                <div className="text-xl font-black text-white">2.1K</div>
                <div className="text-[8px] text-muted-blue uppercase font-bold tracking-widest">Uğurlu kömək missiyası</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active List */}
        <div className="card">
          <h4 className="font-exo font-bold text-lg mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal" /> Top Könüllülər
          </h4>
          <div className="space-y-4">
            {volunteers.map((v, i) => (
              <div key={i} className="bg-navy-light/40 border border-white/5 rounded-2xl p-4 flex gap-4 items-center group hover:border-teal/30 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-navy flex items-center justify-center font-exo font-black text-xl border-2 border-teal/20 text-white">
                  {v.char}
                </div>
                <div>
                  <div className="font-exo font-bold text-sm text-white-soft">{v.name}</div>
                  <div className="text-xs text-muted-blue">{v.skill}</div>
                  <div className="text-[10px] text-teal mt-1 font-bold">{v.dist} yaxınlıqda</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQuest && <VolunteerQuest onClose={() => setShowQuest(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function VolunteerQuest({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const { user, profile, refreshProfile } = useAuth();

  const questions = [
    {
      id: 'motivation',
      q: "Sizi könüllü olmağa ən çox nə motivasiya edir?",
      options: [
        { val: 'social', text: 'Sosial dəyişikliyin bir hissəsi olmaq', icon: '🌍' },
        { val: 'exp', text: 'Yeni təcrübələr və biliklər qazanmaq', icon: '📈' },
        { val: 'cert', text: 'Sertifikat və tövsiyə naməsi əldə etmək', icon: '📜' }
      ]
    },
    {
      id: 'skills',
      q: "Hansı sahədə daha faydalı ola biləcəyinizi düşünürsünüz?",
      options: [
        { val: 'physical', text: 'Fiziki yardım (Nəqliyyat, daşıma)', icon: '💪' },
        { val: 'intel', text: 'İntellektual dəstək (Tərcümə, Hüquq)', icon: '🧠' },
        { val: 'chat', text: 'Psixoloji və mənəvi dəstək', icon: '💬' }
      ]
    },
    {
      id: 'time',
      q: "Həftəlik nə qədər vaxt ayıra bilərsiniz?",
      options: [
        { val: 'low', text: '1-3 saat (Yüngül dəstək)', icon: '⏱️' },
        { val: 'mid', text: '5-10 saat (Aktiv iştirak)', icon: '🚀' },
        { val: 'full', text: 'Hər zaman hazıram (Kordinator)', icon: '🌟' }
      ]
    }
  ];

  useEffect(() => {
    if (step === questions.length) {
      const addXp = 100;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const currentXp = profile?.xp || 0;
        const currentBadges = [...(profile?.badges || [])];
        if (!currentBadges.includes('onboarding')) {
          currentBadges.push('onboarding');
        }
        updateDoc(userRef, {
          xp: currentXp + addXp,
          badges: currentBadges,
          isVolunteer: true
        }).then(() => refreshProfile()).catch(err => console.error(err));
      } else {
        try {
          const stored = localStorage.getItem('accessbaku_local_volunteer_stats');
          const parsed = stored ? JSON.parse(stored) : { xp: 0, badges: [], verifiedCount: 0, completedMissions: [] };
          parsed.xp += addXp;
          parsed.isVolunteer = true;
          if (!parsed.badges.includes('onboarding')) {
            parsed.badges.push('onboarding');
          }
          localStorage.setItem('accessbaku_local_volunteer_stats', JSON.stringify(parsed));
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [step, user, profile, questions.length]);

  const benefits = [
    { title: 'Beynəlxalq Sertifikat', icon: '📜' },
    { title: 'Peşəkar Təlimlər', icon: '🎓' },
    { title: 'Ekspert Şəbəkəsi', icon: '🤝' },
    { title: 'Hədiyyə Bal Sistemi', icon: '💎' }
  ];

  const handleNext = (val: string) => {
    setAnswers({ ...answers, [questions[step].id]: val });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(step + 1); // Success state
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-navy/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto"
    >
      <div className="absolute top-3 right-3 md:top-6 md:right-6 z-50">
        <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
      </div>

      <div className="max-w-4xl w-full my-auto py-4">
        {step < questions.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            {/* Sidebar with search engine vibe */}
            <div className="lg:col-span-5 space-y-4 lg:space-y-6">
              <div className="flex items-center gap-3 mb-2 lg:mb-8">
                <div className="w-9 h-9 bg-orange rounded-lg flex items-center justify-center text-white"><Search className="w-4.5 h-4.5" /></div>
                <h3 className="font-exo font-black text-lg lg:text-xl text-white uppercase tracking-tighter">VOLUNTEER<span className="text-orange">QUEST</span></h3>
              </div>
              
              <div className="space-y-2 lg:space-y-4">
                 <div className="text-[9px] lg:text-[10px] font-black tracking-widest text-orange uppercase">ÜSTÜNLÜKLƏRİNİZ:</div>
                 <div className="flex md:grid md:grid-cols-2 gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    {benefits.map((b, i) => (
                      <div key={i} className="p-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2 shrink-0 md:shrink">
                        <span className="text-sm shrink-0">{b.icon}</span>
                        <span className="text-[9px] lg:text-[10px] font-black text-white-soft uppercase leading-none tracking-wide">{b.title}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="p-4 bg-orange/10 border border-orange/20 rounded-2xl hidden lg:block">
                 <p className="text-xs italic text-orange-light leading-relaxed">
                   "Könüllülük sadəcə kömək etmək deyil, həm də dünyaya yeni bir gözlə baxmaqdır."
                 </p>
              </div>
            </div>

            {/* Questions area */}
            <div className="lg:col-span-7">
              <motion.div 
                key={step}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-4 lg:space-y-6"
              >
                <div className="flex items-center gap-4 text-orange mb-2">
                   <div className="text-2xl lg:text-3xl font-black opacity-20">0{step + 1}</div>
                   <div className="h-0.5 flex-grow bg-orange/20"></div>
                </div>
                <h2 className="font-exo font-bold text-base md:text-xl text-white leading-snug line-clamp-2">
                  {questions[step].q}
                </h2>
                <div className="space-y-2 max-h-[290px] md:max-h-none overflow-y-auto pr-1">
                  {questions[step].options.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleNext(opt.val)}
                      className="w-full p-3 md:p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-orange/10 hover:border-orange/30 group transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">{opt.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white group-hover:text-orange transition-colors truncate">{opt.text}</div>
                        <div className="text-[8px] md:text-[9px] text-muted-blue mt-0.5 uppercase tracking-widest leading-none">Seçmək üçün toxun</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-blue shrink-0 group-hover:text-orange" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-32 h-32 bg-orange/20 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-orange/20">
               <Sparkles className="w-16 h-16 text-orange animate-pulse" />
            </div>
            <h2 className="font-exo font-black text-5xl text-white">Təbriklər!</h2>
            <p className="text-xl text-muted-blue max-w-xl mx-auto">
              Müraciətiniz uğurla göndərildi. Növbəti addımlar üçün koordinatorumuzun zəngini və ya mesajını gözləyin
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={onClose} className="px-10 py-4 bg-orange text-white font-black text-sm rounded-2xl hover:scale-105 transition-transform uppercase tracking-widest shadow-xl shadow-orange/20">ANA SƏHİFƏYƏ QAYIT</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function JobsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [maxDistance, setMaxDistance] = useState(999);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const jobs = [
    { 
      id: 1,
      title: 'Frontend Developer (React)', 
      company: 'AzDoc Solutions', 
      type: 'Məsafəli', 
      distance: 0, 
      skills: ['React', 'JavaScript', 'Dizayn'],
      salary: '1200 - 1800 AZN',
      color: 'teal',
      desc: 'Əlil arabası və digər fiziki məhdudiyyətləri olan şəxslər üçün tam uzaqdan (məsafəli) iş imkanı. React və müasir interfeys texnologiyaları üzrə biliklər tələb olunur.',
      benefits: ['100% Məsafəli iş', 'Sərbəst qrafik', 'Avadanlıq dəstəyi'],
      accessibility: ['Evdən iş', 'Səsli zəngsiz']
    },
    { 
      id: 2,
      title: 'Müştəri Xidmətləri Təmsilçisi', 
      company: 'Pasha Bank', 
      type: 'Hibrid', 
      distance: 4, 
      skills: ['Müştəri xidmətləri', 'Ünsiyyət'],
      salary: '600 - 800 AZN',
      color: 'orange',
      desc: 'Həftədə 2 gün ofis, 3 gün uzaqdan işləmək imkanı. Ofisimiz Port Baku yaxınlığında yerləşir, tam əlçatımlıdır (rampa, adaptiv lift və geniş keçidlər mövcuddur).',
      benefits: ['Sağlamlıq sığortası', 'Metropolitenə yaxın coğrafiya', 'Fərdi mentor dəstəyi'],
      accessibility: ['Rampalı bina', 'Lift', 'Xüsusi sanitar qovşaq']
    },
    { 
      id: 3,
      title: 'Data Analitik', 
      company: 'Global Tech', 
      type: 'Məsafəli', 
      distance: 0, 
      skills: ['Excel', 'SQL'],
      salary: '1000 - 1500 AZN',
      color: 'teal',
      desc: 'Böyük data massivləri ilə iş və hesabatların hazırlanması. Eşitmə və ya hərəkət məhdudiyyəti olan namizədlər üçün tam uzaqdan qoşulma üstünlükləri.',
      benefits: ['Biznes təlimlər', 'Sərbəst iş saatları', 'Noutbuk təminatı'],
      accessibility: ['Evdən iş', 'Yazılı kommunikasiya']
    },
    { 
      id: 4,
      title: 'Qrafik Dizayner', 
      company: 'Creative Space', 
      type: 'Ofis', 
      distance: 12, 
      skills: ['Dizayn', 'Photoshop'],
      salary: '800 - 1200 AZN',
      color: 'orange',
      desc: 'Şirkət ofisində kreativ dizaynların yerinə yetirilməsi. Ofisimiz Bakı Dövlət Universiteti yaxınlığındadır, əlilliyi olan şəxslər üçün xüsusi sanitar qovşaq və lift xidmətinə malikdir.',
      benefits: ['Yüksək performanslı PC', 'Nahor şirkətdən', 'Ödənişli kurslar'],
      accessibility: ['Rampalı giriş', 'Adaptiv qapılar']
    },
    { 
      id: 5,
      title: 'Kopyrayter & SMM Menecer', 
      company: 'Baku Media Group', 
      type: 'Məsafəli', 
      distance: 0, 
      skills: ['Sosial Media', 'Ünsiyyət'],
      salary: '500 - 700 AZN',
      color: 'teal',
      desc: 'Sosial media profillərinin idarə olunması. İş saatları tamamilə sərbəstdir və evdən rahat idarə edilə bilər. Qayğıkeş icma və onlayn komanda rəhbərliyi.',
      benefits: ['Onlayn fitnes', 'Ay sonu bonusları', 'Limitsiz internet'],
      accessibility: ['Evdən iş', 'Sərbəst cədvəl']
    },
    { 
      id: 6,
      title: 'Maliyyə Köməkçisi', 
      company: 'Kapital Bank', 
      type: 'Ofis', 
      distance: 3, 
      skills: ['Excel', 'Finans'],
      salary: '700 - 900 AZN',
      color: 'orange',
      desc: 'İlkin maliyyə sənədlərinin Excel cədvəllərinə daxil edilməsi. Ofis Nərimanov rayonunda, metroya cəmi 50 metr məsafədə və ideal şəkildə təchiz edilmiş rampalı binadadır.',
      benefits: ['Tibbi sığorta', 'Məkanın metrosaniyaya yaxınlığı (50m)', 'Xüsusi parkinq'],
      accessibility: ['Rampa', 'Geniş lift', 'Səsli bildiriş sistemi']
    },
    { 
      id: 7,
      title: 'IT Texniki Dəstək Operatoru', 
      company: 'CyberNet', 
      type: 'Hibrid', 
      distance: 18, 
      skills: ['Texniki dəstək', 'SQL'],
      salary: '800 - 1000 AZN',
      color: 'teal',
      desc: 'Müştərilərin texniki suallarının onlayn şəkildə cavablandırılması və sistem problemlərinin həlli. Həftədə cəmi 1 gün planlaşdırma görüşü üçün ofisə gəliş.',
      benefits: ['Sertifikasiya sığortası', 'Daimi onlayn dəstək', 'İnkişaf imkanları'],
      accessibility: ['Məsafəli günlər', 'Səsli dəstək avadanlığı']
    },
    { 
      id: 8,
      title: 'Xarici Dil Tərcüməçisi (İngilis dili)', 
      company: 'TransLink Azerbaijan', 
      type: 'Məsafəli', 
      distance: 0, 
      skills: ['İngilis dili', 'Tərcümə'],
      salary: '900 - 1300 AZN',
      color: 'orange',
      desc: 'Hüquqi və bədii mətnlərin İngilis dilindən Azərbaycan dilinə tərcüməsi. Audio zəng tələb olunmur, tamamilə mətnyönümlüdür. Eşitmə məhdudiyyətli şəxslər üçün xüsusilə əlverişlidir.',
      benefits: ['Hər tərcüməyə görə bonus', 'Geniş onlayn kitabxana', 'Yenilikçi proqram rəhbərliyi'],
      accessibility: ['Mətnyönümlü', '100% Onlayn']
    },
    { 
      id: 9,
      title: 'HR Koordinator', 
      company: 'Velo Services', 
      type: 'Ofis', 
      distance: 25, 
      skills: ['HR', 'Ünsiyyət'],
      salary: '700 - 1100 AZN',
      color: 'teal',
      desc: 'Namizədlərlə ilkin onlayn müsahibələrin təşkili və CV-lərin qeydiyyatı. Ofisimiz lift, geniş koridorlar, xüsusi sanitar qovşaq və əlçatımlı parkinq ilə tam təchiz olunub.',
      benefits: ['Sürətli CV verilənlər bazası', 'İllik sığorta paketi', 'Geniş ofis yeməkxanası'],
      accessibility: ['Lift', 'Əlçatımlı sanitar qovşaq', 'Rampalı giriş']
    }
  ];

  // Extract all unique skills across all jobs
  const allSkills = Array.from(new Set(jobs.flatMap(j => j.skills)));

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    // 1. Text Search MATCH
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Workplace Type MATCH
    const matchesType = selectedType === 'all' || job.type === selectedType;
    
    // 3. Distance Match
    const matchesDistance = maxDistance === 999 || 
                            job.type === 'Məsafəli' || 
                            job.distance <= maxDistance;
    
    // 4. Skills Match (Must possess any of the selected filters)
    const matchesSkills = selectedSkills.length === 0 || 
                          selectedSkills.some(skill => job.skills.includes(skill));

    return matchesSearch && matchesType && matchesDistance && matchesSkills;
  });

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleApply = (job: any) => {
    triggerToast(
      `Müraciətiniz müvəffəqiyyətlə qəbul edildi! ${job.company} qısa zamanda sizinlə əlaqə saxlayacaq.`, 
      "success", 
      "Uğurlu Müraciət"
    );
    setSelectedJob(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <SectionHeader 
        title="Vakansiyalar və İş İmkanları" 
        badge="İŞ" 
        desc="Sosial inteqrasiya və iqtisadi müstəqilliyiniz üçün əlçatımlı müəssisələrin təklif etdiyi aktiv iş elanları."
      />

      {/* Advanced Filter Box */}
      <div className="card border border-teal/15 p-6 bg-navy-light/30">
        <div className="flex flex-col gap-6">
          {/* Row 1: Search & Reset */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-blue" />
              <input
                type="text"
                placeholder="Vakansiya adı və ya şirket üzrə axtarış..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-white placeholder-navy-light focus:outline-none focus:ring-1 focus:ring-teal/50"
              />
            </div>
            {(selectedType !== 'all' || maxDistance !== 999 || selectedSkills.length > 0 || searchQuery !== '') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setMaxDistance(999);
                  setSelectedSkills([]);
                }}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-center rounded-xl text-muted-blue hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                Filtrləri təmizlə
              </button>
            )}
          </div>

          {/* Row 2: Type, Distance & Skills layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            {/* Filter by Type */}
            <div className="space-y-2">
              <span className="text-[9px] font-black tracking-widest uppercase text-teal">İş Növü</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Hamısı' },
                  { value: 'Məsafəli', label: 'Məsafəli' },
                  { value: 'Ofis', label: 'Ofis' },
                  { value: 'Hibrid', label: 'Hibrid' }
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedType(item.value)}
                    className={`px-3 py-2 text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                      selectedType === item.value 
                        ? 'bg-teal text-navy shadow-lg shadow-teal/15 font-black' 
                        : 'bg-white/5 border border-white/5 text-muted-blue hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Distance */}
            <div className="space-y-2">
              <span className="text-[9px] font-black tracking-widest uppercase text-orange">Məsafə (Ofis/Hibrid üçün)</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 999, label: 'Bütün Məsafələr' },
                  { value: 5, label: '< 5 km' },
                  { value: 15, label: '< 15 km' },
                  { value: 30, label: '< 30 km' }
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setMaxDistance(item.value)}
                    className={`px-3 py-2 text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                      maxDistance === item.value 
                        ? 'bg-orange text-navy shadow-lg shadow-orange/15 font-black' 
                        : 'bg-white/5 border border-white/5 text-muted-blue hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Skills Filter Board */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <span className="text-[9px] font-black tracking-widest uppercase text-white-soft">Bacarıqlara Görə süzgəc:</span>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              {allSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-orange/20 border-orange text-orange font-black' 
                        : 'bg-navy/40 border-white/5 text-muted-blue hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {skill} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Count Indicator */}
      <div className="flex justify-between items-center text-xs font-bold text-muted-blue uppercase tracking-widest px-1">
        <span>Axtarışa uyğun: <span className="font-exo font-black text-teal text-sm">{filteredJobs.length} vakansiya</span></span>
        {filteredJobs.length === 0 && <span className="text-orange text-[10px] animate-pulse">Süzgəcləri təmizləməyi sınayın</span>}
      </div>

      {/* Grid of Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((j) => (
          <div 
            key={j.id} 
            onClick={() => setSelectedJob(j)}
            className="job-card card group hover:border-orange-500/30 bg-navy-light/10 hover:bg-navy-light/30 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden rounded-3xl border border-white/5 shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.99]"
          >
            {/* Subtle glow highlight on top right corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="p-5 md:p-6 pb-2">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className={`p-2.5 rounded-xl bg-white/5 text-teal border border-white/10 flex items-center justify-center shrink-0 group-hover:text-orange group-hover:bg-orange/10 group-hover:border-orange/20 transition-all`}>
                  <Briefcase className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {j.type === 'Məsafəli' ? (
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider leading-none flex items-center gap-1.5 shadow-sm shadow-emerald-500/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      Məsafəli
                    </span>
                  ) : j.type === 'Ofis' ? (
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-orange/10 text-orange-light border border-orange/25 uppercase tracking-wider leading-none flex items-center gap-1.5 shadow-sm shadow-orange/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      Ofis
                    </span>
                  ) : (
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/25 uppercase tracking-wider leading-none flex items-center gap-1.5 shadow-sm shadow-sky-500/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                      Hibrid
                    </span>
                  )}
                  {j.type !== 'Məsafəli' && (
                    <span className="text-[8px] font-black text-rose-400/80 uppercase tracking-widest bg-rose-500/5 border border-rose-500/10 px-1.5 py-0.5 rounded-md">
                      📍 {j.distance} km
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-exo font-black text-base md:text-lg mb-1 group-hover:text-orange-light transition-colors leading-snug">{j.title}</h4>
              <p className="text-[10px] text-muted-blue uppercase tracking-widest mb-3 font-extrabold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-teal" />
                {j.company}
              </p>
              
              <p className="text-xs text-white-soft leading-relaxed line-clamp-3 mb-4 font-medium opacity-90">{j.desc}</p>
              
              {/* Job Skills Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {j.skills.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[8px] text-muted-blue uppercase font-bold group-hover:border-white/10 transition-colors">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 md:p-6 pt-3 flex justify-between items-center text-xs font-bold border-t border-white/5 mt-auto">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-muted-blue leading-none mb-1">Əmək haqqı</span>
                <span className="text-teal font-black text-[12px] font-exo tracking-tight">{j.salary}</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange font-black text-[10px] uppercase tracking-wider group-hover:translate-x-1.5 transition-transform">
                Ətraflı Bax <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full card border-dashed border-white/10 bg-navy/20 flex flex-col items-center justify-center text-center p-12">
            <Filter className="w-10 h-10 text-muted-blue mb-3 opacity-30 animate-pulse" />
            <div className="font-exo font-bold text-base text-white uppercase">Axtarışa uyğun vakansiya tapılmadı</div>
            <p className="text-xs text-muted-blue max-w-sm mt-2">
              Seçdiyiniz filtrlərə uyğun heç bir iş elanı tapılmadı. Zəhmət olmasa filtrləri təmizləyin və ya fərqli parametrlərdən istifadə edin.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setMaxDistance(999);
                setSelectedSkills([]);
              }}
              className="mt-4 px-5 py-2.5 bg-teal text-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              Bütün elanları göstər
            </button>
          </div>
        )}
      </div>

      {/* Drawer / Modal Detail for applying to Jobs */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJob(null)}
            className="fixed inset-0 z-[1100] bg-navy/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl card relative p-6 md:p-8 space-y-6"
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black px-2.5 py-1 rounded bg-teal/10 text-teal border border-teal/20 uppercase tracking-widest w-fit block">
                  {selectedJob.type}
                </span>
                <h3 className="font-exo font-black text-2xl text-white pt-2 leading-snug">{selectedJob.title}</h3>
                <p className="text-sm text-orange font-black uppercase tracking-widest">{selectedJob.company}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-blue block">Əmək haqqı</span>
                  <span className="text-sm font-black text-white font-exo">{selectedJob.salary}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-blue block">Sizə olan məsafə</span>
                  <span className="text-sm font-black text-white">
                    {selectedJob.type === 'Məsafəli' ? 'Tamamilə Uzaqdan' : `Təxminən ${selectedJob.distance} km`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-teal">İşin Təsviri</h4>
                <p className="text-xs text-white-soft leading-relaxed">{selectedJob.desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Benefits list */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange">Sosial Təminatlar</h4>
                  <ul className="space-y-1">
                    {selectedJob.benefits.map((b: string, idx: number) => (
                      <li key={idx} className="text-[10px] text-white-soft font-bold flex items-center gap-1.5">
                        <span className="text-orange">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Accessibility status */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-teal">Əlçatımlılıq Göstəriciləri</h4>
                  <ul className="space-y-1">
                    {selectedJob.accessibility.map((a: string, idx: number) => (
                      <li key={idx} className="text-[10px] text-teal font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all text-center cursor-pointer border border-white/5"
                >
                  Bağla
                </button>
                <button 
                  onClick={() => handleApply(selectedJob)}
                  className="flex-1 py-3.5 bg-orange hover:bg-orange/90 active:scale-95 text-navy font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Müraciət et <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionHeader({ title, badge, desc }: { title: string, badge: string, desc: string }) {
  return (
    <div className="mb-6 md:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 md:mb-3">
        <h2 className="font-exo font-black text-xl md:text-3xl tracking-tight leading-loose md:leading-none">{title}</h2>
        <span className="w-fit bg-gradient-to-br from-teal to-teal-bright text-navy font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-teal/20">
          {badge}
        </span>
      </div>
      <p className="text-muted-blue text-[11px] md:text-base max-w-2xl leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
