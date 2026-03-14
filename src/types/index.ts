// ========== Core Types ==========

export type UserRole = 'platform_owner' | 'tenant_admin' | 'resident' | 'group_organizer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerId: string;
  status: 'active' | 'suspended' | 'pending';
  hostels: string[];
  createdAt: string;
}

export interface Hostel {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  university: string;
  description: string;
  image: string;
  rules: string[];
  contact: { phone: string; email: string };
  rating: number;
  totalBeds: number;
  availableBeds: number;
}

export interface Block {
  id: string;
  hostelId: string;
  name: string;
  floors: number;
}

export interface Room {
  id: string;
  hostelId: string;
  blockId: string;
  name: string;
  type: 'single' | 'double' | 'triple' | 'quad';
  capacity: number;
  occupancy: number;
  floor: number;
  amenities: string[];
  images: string[];
  pricePerSemester: number;
  pricePerYear: number;
  status: 'available' | 'full' | 'maintenance';
}

export interface Bed {
  id: string;
  roomId: string;
  label: string;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  residentId?: string;
}

export interface AcademicPeriod {
  id: string;
  hostelId: string;
  name: string;
  type: 'semester' | 'year' | 'vacation';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  residentId: string;
  roomId: string;
  bedId: string;
  hostelId: string;
  periodId: string;
  status: 'pending' | 'reserved' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out';
  amount: number;
  createdAt: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface GroupBooking {
  id: string;
  organizerId: string;
  hostelId: string;
  groupName: string;
  bedsRequired: number;
  bedsAllocated: number;
  periodId: string;
  status: 'requested' | 'reviewing' | 'allocated' | 'confirmed' | 'cancelled';
  amount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  residentId: string;
  amount: number;
  method: 'momo' | 'card' | 'cash' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'verified';
  reference: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  residentId: string;
  hostelId: string;
  category: 'maintenance' | 'room_change' | 'general';
  subject: string;
  description: string;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  images?: string[];
}

export interface WaitingListEntry {
  id: string;
  residentId: string;
  hostelId: string;
  roomType: Room['type'];
  position: number;
  status: 'waiting' | 'notified' | 'expired';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'ticket' | 'system';
  channel: 'email' | 'sms' | 'in_app';
  read: boolean;
  createdAt: string;
}

export interface PricingRule {
  id: string;
  hostelId: string;
  roomType: Room['type'];
  periodType: AcademicPeriod['type'];
  price: number;
  currency: string;
}

export interface DiscountCode {
  id: string;
  hostelId: string;
  code: string;
  percentage: number;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
}

export type BookingStatus = Booking['status'];
export type PaymentStatus = Payment['status'];
export type TicketStatus = Ticket['status'];
export type PaymentMethod = Payment['method'];
