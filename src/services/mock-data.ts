import type { User, Tenant, Hostel, Room, Bed, Booking, Payment, Ticket, AcademicPeriod, Notification, WaitingListEntry, GroupBooking, PricingRule, DiscountCode, Block } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Kwame Asante', email: 'kwame@hostelhub.com', phone: '+233201234567', role: 'platform_owner', createdAt: '2024-01-01' },
  { id: 'u2', name: 'Ama Serwaa', email: 'ama@dreamland.com', phone: '+233209876543', role: 'tenant_admin', createdAt: '2024-02-15' },
  { id: 'u3', name: 'Sarah Mensah', email: 'sarah@uog.edu.gh', phone: '+233241112233', role: 'resident', avatar: '', createdAt: '2024-06-01' },
  { id: 'u4', name: 'Kofi Boateng', email: 'kofi@uog.edu.gh', phone: '+233244556677', role: 'resident', createdAt: '2024-06-10' },
  { id: 'u5', name: 'Grace Adjei', email: 'grace@church.org', phone: '+233247778899', role: 'group_organizer', createdAt: '2024-07-01' },
];

export const mockTenants: Tenant[] = [
  { id: 't1', name: 'Dreamland Hostels Ltd', ownerId: 'u2', status: 'active', hostels: ['h1', 'h2'], createdAt: '2024-02-15' },
  { id: 't2', name: 'GreenView Properties', ownerId: 'u2', status: 'active', hostels: ['h3'], createdAt: '2024-03-20' },
  { id: 't3', name: 'CampusLiving Ghana', ownerId: 'u2', status: 'pending', hostels: [], createdAt: '2024-08-01' },
];

export const mockHostels: Hostel[] = [
  {
    id: 'h1', tenantId: 't1', name: 'Dreamland Hostel', location: 'East Legon, Accra',
    university: 'University of Ghana', description: 'Premium student accommodation near campus with modern facilities.',
    image: '', rules: ['No loud music after 10pm', 'No cooking in rooms', 'Visitors must leave by 8pm'],
    contact: { phone: '+233201234567', email: 'info@dreamland.com' }, rating: 4.5,
    totalBeds: 200, availableBeds: 34,
  },
  {
    id: 'h2', tenantId: 't1', name: 'Dreamland Annex', location: 'Madina, Accra',
    university: 'University of Ghana', description: 'Affordable hostel with great transport links.',
    image: '', rules: ['Keep premises clean', 'No pets'], contact: { phone: '+233201234568', email: 'annex@dreamland.com' },
    rating: 4.0, totalBeds: 120, availableBeds: 18,
  },
  {
    id: 'h3', tenantId: 't2', name: 'GreenView Residence', location: 'Kumasi',
    university: 'KNUST', description: 'Eco-friendly student housing with solar power.',
    image: '', rules: ['Conserve energy', 'Recycle waste'], contact: { phone: '+233301234567', email: 'info@greenview.com' },
    rating: 4.2, totalBeds: 150, availableBeds: 42,
  },
];

export const mockBlocks: Block[] = [
  { id: 'b1', hostelId: 'h1', name: 'Block A', floors: 3 },
  { id: 'b2', hostelId: 'h1', name: 'Block B', floors: 4 },
  { id: 'b3', hostelId: 'h2', name: 'Main Block', floors: 2 },
];

export const mockRooms: Room[] = [
  { id: 'r1', hostelId: 'h1', blockId: 'b1', name: 'A302', type: 'single', capacity: 1, occupancy: 0, floor: 3, amenities: ['WiFi', 'AC', 'Desk'], images: [], pricePerSemester: 3500, pricePerYear: 6000, status: 'available' },
  { id: 'r2', hostelId: 'h1', blockId: 'b1', name: 'A201', type: 'double', capacity: 2, occupancy: 1, floor: 2, amenities: ['WiFi', 'Fan', 'Desk'], images: [], pricePerSemester: 2800, pricePerYear: 5000, status: 'available' },
  { id: 'r3', hostelId: 'h1', blockId: 'b2', name: 'B101', type: 'quad', capacity: 4, occupancy: 4, floor: 1, amenities: ['WiFi', 'Fan'], images: [], pricePerSemester: 1420, pricePerYear: 2500, status: 'full' },
  { id: 'r4', hostelId: 'h1', blockId: 'b2', name: 'B203', type: 'triple', capacity: 3, occupancy: 0, floor: 2, amenities: ['WiFi', 'Fan', 'Wardrobe'], images: [], pricePerSemester: 2000, pricePerYear: 3600, status: 'available' },
  { id: 'r5', hostelId: 'h2', blockId: 'b3', name: 'M105', type: 'double', capacity: 2, occupancy: 0, floor: 1, amenities: ['WiFi', 'Desk'], images: [], pricePerSemester: 2200, pricePerYear: 4000, status: 'available' },
  { id: 'r6', hostelId: 'h3', blockId: 'b1', name: 'G301', type: 'single', capacity: 1, occupancy: 1, floor: 3, amenities: ['WiFi', 'AC', 'Solar'], images: [], pricePerSemester: 4000, pricePerYear: 7200, status: 'full' },
];

export const mockBeds: Bed[] = [
  { id: 'bed1', roomId: 'r1', label: 'Bed A', status: 'available' },
  { id: 'bed2', roomId: 'r2', label: 'Bed A', status: 'occupied', residentId: 'u4' },
  { id: 'bed3', roomId: 'r2', label: 'Bed B', status: 'available' },
  { id: 'bed4', roomId: 'r3', label: 'Bed A', status: 'occupied', residentId: 'u3' },
  { id: 'bed5', roomId: 'r3', label: 'Bed B', status: 'occupied' },
  { id: 'bed6', roomId: 'r3', label: 'Bed C', status: 'occupied' },
  { id: 'bed7', roomId: 'r3', label: 'Bed D', status: 'occupied' },
  { id: 'bed8', roomId: 'r4', label: 'Bed A', status: 'available' },
  { id: 'bed9', roomId: 'r4', label: 'Bed B', status: 'available' },
  { id: 'bed10', roomId: 'r4', label: 'Bed C', status: 'available' },
  { id: 'bed11', roomId: 'r5', label: 'Bed A', status: 'available' },
  { id: 'bed12', roomId: 'r5', label: 'Bed B', status: 'available' },
];

export const mockBookings: Booking[] = [
  { id: 'bk1', residentId: 'u3', roomId: 'r3', bedId: 'bed4', hostelId: 'h1', periodId: 'p1', status: 'confirmed', amount: 1420, createdAt: '2024-08-15', checkInDate: '2024-08-18' },
  { id: 'bk2', residentId: 'u4', roomId: 'r2', bedId: 'bed2', hostelId: 'h1', periodId: 'p1', status: 'checked_in', amount: 2800, createdAt: '2024-08-10', checkInDate: '2024-08-18' },
  { id: 'bk3', residentId: 'u3', roomId: 'r1', bedId: 'bed1', hostelId: 'h1', periodId: 'p2', status: 'pending', amount: 3500, createdAt: '2024-11-01' },
];

export const mockPayments: Payment[] = [
  { id: 'pay1', bookingId: 'bk1', residentId: 'u3', amount: 1420, method: 'momo', status: 'completed', reference: 'MOMO-2024-001', createdAt: '2024-08-15' },
  { id: 'pay2', bookingId: 'bk2', residentId: 'u4', amount: 2800, method: 'card', status: 'completed', reference: 'CARD-2024-002', createdAt: '2024-08-10' },
  { id: 'pay3', bookingId: 'bk3', residentId: 'u3', amount: 3500, method: 'momo', status: 'pending', reference: 'MOMO-2024-003', createdAt: '2024-11-01' },
];

export const mockTickets: Ticket[] = [
  { id: 'tk1', residentId: 'u3', hostelId: 'h1', category: 'maintenance', subject: 'Broken shower head', description: 'The shower head in Room B101 is leaking constantly.', status: 'open', priority: 'high', createdAt: '2024-09-15', images: [] },
  { id: 'tk2', residentId: 'u4', hostelId: 'h1', category: 'room_change', subject: 'Room change request', description: 'I would like to move to a single room for next semester.', status: 'assigned', priority: 'medium', createdAt: '2024-10-01' },
  { id: 'tk3', residentId: 'u3', hostelId: 'h1', category: 'general', subject: 'WiFi connectivity', description: 'WiFi has been very slow on the 3rd floor for the past week.', status: 'resolved', priority: 'medium', createdAt: '2024-09-20' },
];

export const mockPeriods: AcademicPeriod[] = [
  { id: 'p1', hostelId: 'h1', name: 'Semester 1, 2024/2025', type: 'semester', startDate: '2024-08-18', endDate: '2024-12-15', isActive: true },
  { id: 'p2', hostelId: 'h1', name: 'Semester 2, 2024/2025', type: 'semester', startDate: '2025-01-15', endDate: '2025-06-03', isActive: false },
  { id: 'p3', hostelId: 'h1', name: 'Vacation Stay 2025', type: 'vacation', startDate: '2025-06-10', endDate: '2025-08-15', isActive: false },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u3', title: 'Booking Confirmed', message: 'Your booking for Room B101 has been confirmed.', type: 'booking', channel: 'in_app', read: false, createdAt: '2024-08-16' },
  { id: 'n2', userId: 'u3', title: 'Payment Received', message: 'Payment of GHS 1,420 received via MoMo.', type: 'payment', channel: 'in_app', read: true, createdAt: '2024-08-15' },
  { id: 'n3', userId: 'u4', title: 'Check-in Reminder', message: 'Please check in at the front desk by Aug 18.', type: 'system', channel: 'sms', read: false, createdAt: '2024-08-17' },
];

export const mockWaitingList: WaitingListEntry[] = [
  { id: 'w1', residentId: 'u3', hostelId: 'h1', roomType: 'single', position: 1, status: 'waiting', createdAt: '2024-09-01' },
];

export const mockGroupBookings: GroupBooking[] = [
  { id: 'gb1', organizerId: 'u5', hostelId: 'h1', groupName: 'Church Youth Group', bedsRequired: 15, bedsAllocated: 0, periodId: 'p3', status: 'requested', amount: 0, createdAt: '2024-10-15' },
];

export const mockPricingRules: PricingRule[] = [
  { id: 'pr1', hostelId: 'h1', roomType: 'single', periodType: 'semester', price: 3500, currency: 'GHS' },
  { id: 'pr2', hostelId: 'h1', roomType: 'double', periodType: 'semester', price: 2800, currency: 'GHS' },
  { id: 'pr3', hostelId: 'h1', roomType: 'triple', periodType: 'semester', price: 2000, currency: 'GHS' },
  { id: 'pr4', hostelId: 'h1', roomType: 'quad', periodType: 'semester', price: 1420, currency: 'GHS' },
];

export const mockDiscountCodes: DiscountCode[] = [
  { id: 'dc1', hostelId: 'h1', code: 'EARLY2025', percentage: 10, validUntil: '2025-01-10', usageLimit: 50, usedCount: 12 },
  { id: 'dc2', hostelId: 'h1', code: 'GROUP15', percentage: 15, validUntil: '2025-06-30', usageLimit: 20, usedCount: 3 },
];
