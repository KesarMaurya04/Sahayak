'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
 
type Listing = { _id: string; title: string };
type Slot = { 
  _id: string; 
  listingId: string; 
  start: string; 
  end: string; 
  capacity: number; 
  bookedCount?: number; 
  isActive: boolean;
  providerId?: string;
};
 
export default function AvailabilityPage() {
  const qc = useQueryClient();
  const [listingId, setListingId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState(30);
  const [capacity, setCapacity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  // My listings
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      try {
        const response = await apiFetch<{ items: Listing[] }>('/api/listings/mine');
        return response.items ?? [];
      } catch (error) {
        console.error('Failed to fetch listings:', error);
        return [];
      }
    },
  });
 
  // Auto-select first listing
  useEffect(() => { 
    if (!listingId && listings.length) {
      setListingId(listings[0]._id); 
    }
  }, [listings, listingId]);
 
  // Fetch slots for selected listing
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['availability-slots', listingId],
    queryFn: async () => {
      if (!listingId) return [];
 
      try {
        // Use the bulk slots endpoint which matches your backend
        const response = await apiFetch<{ items: Slot[] }>(`/api/availability/mine?listingId=${listingId}`);
        return response.items ?? [];
      } catch (error) {
        console.error('Failed to fetch slots:', error);
        return [];
      }
    },
    enabled: !!listingId,
  });
 
  // Add slot mutation using bulk creation endpoint
  const addSlotMutation = useMutation({
    mutationFn: async () => {
      if (!listingId) throw new Error('Please select a listing');
      if (!date || !time) throw new Error('Please pick date and time');
      if (!duration || duration < 15) throw new Error('Duration must be at least 15 minutes');
 
      const startDateTime = new Date(`${date}T${time}:00`);
      if (Number.isNaN(+startDateTime)) throw new Error('Invalid date/time');
 
      const endDateTime = new Date(startDateTime.getTime() + duration * 60_000);
 
      // Use the bulk creation endpoint that properly handles providerId
      const response = await apiFetch(`/api/availability/listings/${listingId}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: [{
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            capacity: Number(capacity) || 1,
          }]
        }),
      });
 
      return response;
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: (data) => {
      toast(`Successfully added slot(s)`, 'success');
      qc.invalidateQueries({ queryKey: ['availability-slots'] });
      // Reset form
      setDate('');
      setTime('12:00');
      setDuration(30);
      setCapacity(1);
    },
    onError: (error: any) => {
      console.error('Add slot error:', error);
      const message = error?.message || error?.error || 'Failed to add slot';
      toast(message, 'error');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
 
  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return await apiFetch(`/api/availability/${slotId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast('Slot deleted successfully', 'success');
      qc.invalidateQueries({ queryKey: ['availability-slots'] });
    },
    onError: (error: any) => {
      console.error('Delete slot error:', error);
      const message = error?.message || error?.error || 'Failed to delete slot';
      toast(message, 'error');
    },
  });
 
  const handleAddSlot = () => {
    addSlotMutation.mutate();
  };
 
  const handleDeleteSlot = (slotId: string) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      deleteSlotMutation.mutate(slotId);
    }
  };
 
  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0];
 
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
      </div>
 
      {/* Add Slot Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Availability Slot</h2>
 
        {loadingListings ? (
          <div className="text-gray-600">Loading your listings...</div>
        ) : listings.length === 0 ? (
          <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
            You don't have any listings yet. Create a listing first to add availability slots.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              {/* Listing Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Listing
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={listingId} 
                  onChange={(e) => setListingId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Choose a listing...</option>
                  {listings.map((listing) => (
                    <option key={listing._id} value={listing._id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              </div>
 
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  disabled={isSubmitting}
                />
              </div>
 
              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input 
                  type="time" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
 
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (min)
                </label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={15} 
                  step={15} 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 30)} 
                  placeholder="Duration"
                  disabled={isSubmitting}
                />
              </div>
 
              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={1} 
                  max={10}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value) || 1)} 
                  placeholder="Capacity"
                  disabled={isSubmitting}
                />
              </div>
            </div>
 
            <button 
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddSlot}
              disabled={isSubmitting || !listingId || !date || !time || addSlotMutation.isPending}
            >
              {addSlotMutation.isPending ? 'Adding Slot...' : 'Add Availability Slot'}
            </button>
          </>
        )}
      </div>
 
      {/* Slots List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Availability Slots</h2>
 
        {!listingId ? (
          <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
            Select a listing to view its availability slots.
          </div>
        ) : loadingSlots ? (
          <div className="text-gray-600">Loading availability slots...</div>
        ) : slots.length === 0 ? (
          <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
            No availability slots found for this listing. Add your first slot above.
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => {
              const startDate = new Date(slot.start);
              const endDate = new Date(slot.end);
              const hasBookings = (slot.bookedCount || 0) > 0;
              const availableSpots = slot.capacity - (slot.bookedCount || 0);
              const selectedListing = listings.find(l => l._id === slot.listingId);
 
              return (
                <div 
                  key={slot._id} 
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {selectedListing?.title || 'Unknown Listing'}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Date & Time:</span>{' '}
                        {startDate.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })},{' '}
                        {startDate.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {endDate.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span>Total Capacity: <strong>{slot.capacity}</strong></span>
                        <span>Bookings: <strong>{slot.bookedCount || 0}</strong></span>
                        <span>Available: <strong className={availableSpots > 0 ? 'text-green-600' : 'text-red-600'}>
                          {availableSpots}
                        </strong></span>
                        {!slot.isActive && <span className="text-red-600 font-medium">Inactive</span>}
                      </div>
                    </div>
 
                    <button
                      className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-center"
                      disabled={deleteSlotMutation.isPending || hasBookings}
                      onClick={() => handleDeleteSlot(slot._id)}
                      title={hasBookings ? 'Cannot delete slot with existing bookings' : 'Delete this availability slot'}
                    >
                      {deleteSlotMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}