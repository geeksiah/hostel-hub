import {
  mockUsers, mockTenants, mockHostels, mockRooms, mockBeds,
  mockBookings, mockPayments, mockTickets, mockPeriods,
  mockNotifications, mockWaitingList, mockGroupBookings,
  mockPricingRules, mockDiscountCodes, mockBlocks,
} from './mock-data';
import type {
  User, Tenant, Hostel, Room, Bed, Booking, Payment, Ticket,
  AcademicPeriod, Notification, WaitingListEntry, GroupBooking,
  PricingRule, DiscountCode, Block,
} from '@/types';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ========== Auth Service ==========
export const AuthService = {
  async login(email: string, _password: string): Promise<User | null> {
    await delay();
    return mockUsers.find(u => u.email === email) ?? null;
  },
  async register(data: Partial<User>): Promise<User> {
    await delay();
    return { id: `u${Date.now()}`, name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? '', role: data.role ?? 'resident', createdAt: new Date().toISOString() };
  },
  async getCurrentUser(): Promise<User> {
    await delay(100);
    return mockUsers[2]; // Sarah Mensah - resident
  },
};

// ========== Tenant Service ==========
export const TenantService = {
  async getAll(): Promise<Tenant[]> { await delay(); return mockTenants; },
  async getById(id: string): Promise<Tenant | undefined> { await delay(); return mockTenants.find(t => t.id === id); },
  async create(data: Partial<Tenant>): Promise<Tenant> { await delay(); return { id: `t${Date.now()}`, name: data.name ?? '', ownerId: data.ownerId ?? '', status: 'pending', hostels: [], createdAt: new Date().toISOString() }; },
  async updateStatus(id: string, status: Tenant['status']): Promise<void> { await delay(); console.log(`Tenant ${id} → ${status}`); },
};

// ========== Hostel Service ==========
export const HostelService = {
  async getAll(): Promise<Hostel[]> { await delay(); return mockHostels; },
  async getById(id: string): Promise<Hostel | undefined> { await delay(); return mockHostels.find(h => h.id === id); },
  async create(data: Partial<Hostel>): Promise<Hostel> { await delay(); return { id: `h${Date.now()}`, tenantId: data.tenantId ?? '', name: data.name ?? '', location: data.location ?? '', university: data.university ?? '', description: data.description ?? '', image: '', rules: [], contact: { phone: '', email: '' }, rating: 0, totalBeds: 0, availableBeds: 0 }; },
};

// ========== Block Service ==========
export const BlockService = {
  async getByHostel(hostelId: string): Promise<Block[]> { await delay(); return mockBlocks.filter(b => b.hostelId === hostelId); },
  async create(data: Partial<Block>): Promise<Block> { await delay(); return { id: `b${Date.now()}`, hostelId: data.hostelId ?? '', name: data.name ?? '', floors: data.floors ?? 1 }; },
};

// ========== Room Service ==========
export const RoomService = {
  async getAll(): Promise<Room[]> { await delay(); return mockRooms; },
  async getByHostel(hostelId: string): Promise<Room[]> { await delay(); return mockRooms.filter(r => r.hostelId === hostelId); },
  async getById(id: string): Promise<Room | undefined> { await delay(); return mockRooms.find(r => r.id === id); },
  async create(data: Partial<Room>): Promise<Room> { await delay(); return { id: `r${Date.now()}`, hostelId: data.hostelId ?? '', blockId: data.blockId ?? '', name: data.name ?? '', type: data.type ?? 'single', capacity: data.capacity ?? 1, occupancy: 0, floor: data.floor ?? 1, amenities: data.amenities ?? [], images: [], pricePerSemester: data.pricePerSemester ?? 0, pricePerYear: data.pricePerYear ?? 0, status: 'available' }; },
};

// ========== Bed Service ==========
export const BedService = {
  async getByRoom(roomId: string): Promise<Bed[]> { await delay(); return mockBeds.filter(b => b.roomId === roomId); },
  async getAvailable(roomId: string): Promise<Bed[]> { await delay(); return mockBeds.filter(b => b.roomId === roomId && b.status === 'available'); },
};

// ========== Booking Service ==========
export const BookingService = {
  async getAll(): Promise<Booking[]> { await delay(); return mockBookings; },
  async getByResident(residentId: string): Promise<Booking[]> { await delay(); return mockBookings.filter(b => b.residentId === residentId); },
  async create(data: Partial<Booking>): Promise<Booking> { await delay(); return { id: `bk${Date.now()}`, residentId: data.residentId ?? '', roomId: data.roomId ?? '', bedId: data.bedId ?? '', hostelId: data.hostelId ?? '', periodId: data.periodId ?? '', status: 'pending', amount: data.amount ?? 0, createdAt: new Date().toISOString() }; },
  async updateStatus(id: string, status: Booking['status']): Promise<void> { await delay(); console.log(`Booking ${id} → ${status}`); },
};

// ========== Group Booking Service ==========
export const GroupBookingService = {
  async getAll(): Promise<GroupBooking[]> { await delay(); return mockGroupBookings; },
  async create(data: Partial<GroupBooking>): Promise<GroupBooking> { await delay(); return { id: `gb${Date.now()}`, organizerId: data.organizerId ?? '', hostelId: data.hostelId ?? '', groupName: data.groupName ?? '', bedsRequired: data.bedsRequired ?? 0, bedsAllocated: 0, periodId: data.periodId ?? '', status: 'requested', amount: 0, createdAt: new Date().toISOString() }; },
};

// ========== Payment Service ==========
export const PaymentService = {
  async getAll(): Promise<Payment[]> { await delay(); return mockPayments; },
  async getByResident(residentId: string): Promise<Payment[]> { await delay(); return mockPayments.filter(p => p.residentId === residentId); },
  async create(data: Partial<Payment>): Promise<Payment> { await delay(); return { id: `pay${Date.now()}`, bookingId: data.bookingId ?? '', residentId: data.residentId ?? '', amount: data.amount ?? 0, method: data.method ?? 'momo', status: 'pending', reference: `REF-${Date.now()}`, createdAt: new Date().toISOString() }; },
  async verify(id: string): Promise<void> { await delay(); console.log(`Payment ${id} verified`); },
};

// ========== Ticket Service ==========
export const TicketService = {
  async getAll(): Promise<Ticket[]> { await delay(); return mockTickets; },
  async getByResident(residentId: string): Promise<Ticket[]> { await delay(); return mockTickets.filter(t => t.residentId === residentId); },
  async create(data: Partial<Ticket>): Promise<Ticket> { await delay(); return { id: `tk${Date.now()}`, residentId: data.residentId ?? '', hostelId: data.hostelId ?? '', category: data.category ?? 'general', subject: data.subject ?? '', description: data.description ?? '', status: 'open', priority: data.priority ?? 'medium', createdAt: new Date().toISOString() }; },
  async updateStatus(id: string, status: Ticket['status']): Promise<void> { await delay(); console.log(`Ticket ${id} → ${status}`); },
};

// ========== Period Service ==========
export const PeriodService = {
  async getByHostel(hostelId: string): Promise<AcademicPeriod[]> { await delay(); return mockPeriods.filter(p => p.hostelId === hostelId); },
  async create(data: Partial<AcademicPeriod>): Promise<AcademicPeriod> { await delay(); return { id: `p${Date.now()}`, hostelId: data.hostelId ?? '', name: data.name ?? '', type: data.type ?? 'semester', startDate: data.startDate ?? '', endDate: data.endDate ?? '', isActive: false }; },
};

// ========== Notification Service ==========
export const NotificationService = {
  async getByUser(userId: string): Promise<Notification[]> { await delay(); return mockNotifications.filter(n => n.userId === userId); },
  async markRead(id: string): Promise<void> { await delay(); console.log(`Notification ${id} read`); },
};

// ========== Waiting List Service ==========
export const WaitingListService = {
  async getByHostel(hostelId: string): Promise<WaitingListEntry[]> { await delay(); return mockWaitingList.filter(w => w.hostelId === hostelId); },
  async join(data: Partial<WaitingListEntry>): Promise<WaitingListEntry> { await delay(); return { id: `w${Date.now()}`, residentId: data.residentId ?? '', hostelId: data.hostelId ?? '', roomType: data.roomType ?? 'single', position: 1, status: 'waiting', createdAt: new Date().toISOString() }; },
};

// ========== Pricing Service ==========
export const PricingService = {
  async getByHostel(hostelId: string): Promise<PricingRule[]> { await delay(); return mockPricingRules.filter(p => p.hostelId === hostelId); },
  async getDiscountCodes(hostelId: string): Promise<DiscountCode[]> { await delay(); return mockDiscountCodes.filter(d => d.hostelId === hostelId); },
};
