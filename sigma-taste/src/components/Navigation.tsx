'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  GitCompare,
  Network,
  AlertTriangle,
  Sliders,
  Download,
  BarChart3
} from 'lucide-react';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import { createExport, downloadJson } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/clusters', label: 'Clusters', icon: Network },
  { href: '/adversarial', label: 'Adversarial', icon: AlertTriangle },
  { href: '/calibrate', label: 'Calibrate', icon: Sliders },
];

export default function Navigation() {
  const pathname = usePathname();
  const { comparisons, clusterCorrections, hiddenVariables, weights } = useSigmaTasteStore();
  
  const handleExport = () => {
    const exportData = createExport(comparisons, clusterCorrections, hiddenVariables, weights);
    const filename = `sigma-taste-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadJson(exportData, filename);
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              σTaste
            </span>
          </Link>
          
          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Export */}
          <button 
            onClick={handleExport}
            disabled={comparisons.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 
                       disabled:bg-zinc-900 disabled:text-zinc-600 rounded-lg text-sm 
                       text-zinc-300 transition-all"
            title={comparisons.length === 0 ? 'No data to export' : 'Export all data'}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
