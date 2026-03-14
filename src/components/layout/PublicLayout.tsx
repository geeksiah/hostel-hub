import { Link } from 'react-router-dom';
import { Building2, Search, UserCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <Building2 className="h-5 w-5 text-emerald" />
            HostelHub
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground">Explore</Link>
            <Link to="/login"><Button variant="outline" size="sm">Log In</Button></Link>
            <Link to="/register"><Button variant="emerald" size="sm">Get Started</Button></Link>
          </div>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t p-4 space-y-2 animate-slide-up">
            <Link to="/explore" className="block py-2 text-sm font-medium" onClick={() => setMenuOpen(false)}>Explore Hostels</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Log In</Button></Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}><Button variant="emerald" className="w-full">Get Started</Button></Link>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 HostelHub. Modern hostel management for Africa.
        </div>
      </footer>
    </div>
  );
}
