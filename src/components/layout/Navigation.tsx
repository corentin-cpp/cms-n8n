import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  Home, 
  Upload, 
  Database, 
  Settings, 
  Play 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Import CSV', href: '/import', icon: Upload },
  { name: 'Données', href: '/data', icon: Database },
  { name: 'Automatisations', href: '/automations', icon: Play },
  { name: 'Gestion', href: '/manage', icon: Settings },
];

export function Navigation() {
  return (
    <nav className="bg-gray-900 border-r border-gray-800 w-64 min-h-screen">
      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#24B2A4] text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}