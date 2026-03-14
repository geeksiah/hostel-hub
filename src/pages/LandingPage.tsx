import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, BedDouble, UserCheck, Building2, MapPin, Star } from 'lucide-react';
import heroImage from '@/assets/hostel-hero.jpg';
import { mockHostels } from '@/services/mock-data';
import { RatingStars } from '@/components/shared/RatingStars';
import roomImage from '@/assets/room-single.jpg';

const steps = [
  { icon: Search, title: 'Discover', desc: 'Browse available rooms near your campus' },
  { icon: BedDouble, title: 'Reserve Bed', desc: 'Select your preferred room and bed' },
  { icon: UserCheck, title: 'Move In', desc: 'Complete payment and check in' },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container py-12 sm:py-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              Modern Hostel<br />Management Platform
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto lg:mx-0">
              Manage rooms, bookings, payments, and residents from one simple platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link to="/register">
                <Button variant="hero" size="lg">Start Free</Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg">Explore Hostels ×</Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 max-w-xl">
            <img src={heroImage} alt="Modern hostel building in Ghana" className="rounded-xl shadow-2xl w-full" />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-card border-y py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-center mb-8">Explore Hostels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {steps.map(step => (
              <div key={step.title} className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hostels */}
      <section className="py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-center mb-8">Explore Hostels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockHostels.map(hostel => (
              <Link key={hostel.id} to={`/explore/${hostel.id}`} className="group">
                <div className="bg-card rounded-xl border overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={roomImage} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-display font-semibold">{hostel.name}</h3>
                      <RatingStars rating={hostel.rating} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {hostel.university}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-emerald">GHS {mockHostels[0].totalBeds > 0 ? '1,420' : '—'}</span>
                      <span className="text-xs text-muted-foreground">{hostel.availableBeds} beds available</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Universities CTA */}
      <section className="bg-primary py-12">
        <div className="container text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-primary-foreground">Find Hostels Near Your Campus</h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto">Browse hostels near University of Ghana, KNUST, UCC, and more.</p>
          <Link to="/explore">
            <Button variant="emerald" size="lg">Browse All Hostels</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
