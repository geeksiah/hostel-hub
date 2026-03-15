import type { AppDatabase, ExploreFilters } from "@/types";

export function filterHostels(database: AppDatabase, filters: ExploreFilters) {
  return database.hostels
    .map((hostel) => {
      const rooms = database.rooms.filter((room) => room.hostelId === hostel.id);
      const availableBeds = database.beds.filter((bed) => rooms.some((room) => room.id === bed.roomId) && bed.status === "available").length;
      const lowestPrice = rooms.length > 0 ? Math.min(...rooms.map((room) => room.pricePerSemester)) : 0;
      const activePeriod =
        database.periods.find((period) => period.hostelId === hostel.id && period.isActive) ??
        database.periods.find((period) => period.hostelId === hostel.id);
      return { hostel, rooms, availableBeds, lowestPrice, activePeriod };
    })
    .filter(({ hostel, rooms, availableBeds, lowestPrice, activePeriod }) => {
      const search = filters.search.toLowerCase().trim();
      const matchesSearch =
        search.length === 0 ||
        hostel.name.toLowerCase().includes(search) ||
        hostel.location.toLowerCase().includes(search) ||
        hostel.university.toLowerCase().includes(search);
      const matchesUniversity = filters.university === "All Universities" || hostel.university === filters.university;
      const matchesRoomType = filters.roomType === "all" || rooms.some((room) => room.type === filters.roomType);
      const matchesGender =
        filters.genderPolicy === "all" ||
        hostel.genderPolicy === filters.genderPolicy ||
        rooms.some((room) => room.genderPolicy === filters.genderPolicy);
      const matchesAvailability = filters.availabilityOnly ? availableBeds > 0 : true;
      const matchesPrice = lowestPrice >= filters.priceRange[0] && lowestPrice <= filters.priceRange[1];
      const matchesDuration = filters.duration === "all" || activePeriod?.type === filters.duration;
      return matchesSearch && matchesUniversity && matchesRoomType && matchesGender && matchesAvailability && matchesPrice && matchesDuration;
    })
    .sort((left, right) => {
      if (filters.sort === "price_asc") return left.lowestPrice - right.lowestPrice;
      if (filters.sort === "price_desc") return right.lowestPrice - left.lowestPrice;
      if (filters.sort === "beds_desc") return right.availableBeds - left.availableBeds;
      return right.hostel.rating - left.hostel.rating;
    });
}

export function getHostelView(database: AppDatabase, hostelId: string) {
  const hostel = database.hostels.find((item) => item.id === hostelId);
  const rooms = database.rooms.filter((room) => room.hostelId === hostelId);
  const periods = database.periods.filter((period) => period.hostelId === hostelId);
  const activePeriod = periods.find((period) => period.isActive) ?? periods[0];
  return { hostel, rooms, periods, activePeriod };
}

export function getRoomView(database: AppDatabase, roomId: string) {
  const room = database.rooms.find((item) => item.id === roomId);
  const hostel = room ? database.hostels.find((item) => item.id === room.hostelId) : undefined;
  const beds = room ? database.beds.filter((bed) => bed.roomId === room.id) : [];
  const periods = hostel ? database.periods.filter((period) => period.hostelId === hostel.id) : [];
  const discountCodes = hostel ? database.discountCodes.filter((code) => code.hostelId === hostel.id && code.active) : [];
  return { room, hostel, beds, periods, discountCodes };
}
