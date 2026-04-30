import { motion } from 'framer-motion';
import { TAB_LIST, type TabKey } from './SidebarNav';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function MobileNav({ active, onChange }: MobileNavProps) {
  return (
    <nav className="lg:hidden sticky top-16 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="flex overflow-x-auto px-4 mask-fade-r">
        {TAB_LIST.map((tab) => {
          const isActive = active === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                'relative flex items-center gap-2 py-3 px-4 text-sm whitespace-nowrap transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-pulse rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
