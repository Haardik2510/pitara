export interface Screening {
  id: string; title: string; description: string; director?: string;
  language: string; duration_minutes: number; date: string; time: string;
  venue_name: string; venue_address: string; city: string;
  price: number; capacity: number; booked_count: number;
  poster_url?: string; genre?: string; is_published: boolean;
  created_at: string; updated_at: string;
}
export interface Booking {
  id: string; user_id: string; screening_id: string;
  booking_reference: string; amount_paid: number;
  razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string;
  payment_payer_name?: string; payment_payer_email?: string;
  payment_transaction_id?: string; payment_notes?: string; payment_screenshot_url?: string;
  status: 'pending'|'confirmed'|'cancelled'|'refunded';
  phone_number?: string; attended: boolean; created_at: string;
  screening?: Screening; user?: UserProfile;
}
export interface UserProfile {
  id: string; email: string; name: string;
  avatar_url?: string; is_admin: boolean; created_at: string;
}
export interface TicketData {
  booking_reference: string; screening_title: string; date: string;
  time: string; venue: string; city: string; amount_paid: number;
  user_name: string; user_email: string; qr_code: string;
}
export interface ManualBookingResponse {
  amount: number
  bookingRef: string
  bookingId: string
  status: 'pending'
  message: string
}

export interface SubmissionSettings {
  id: number
  submissions_enabled: boolean
  fee_required: boolean
  fee_amount: number
  updated_at: string
}

export interface FilmSubmission {
  id: string
  title: string
  runtime_minutes: number
  genres: string[]
  director_name: string
  writer_name: string
  cast_members: string
  release_year?: number
  synopsis: string
  additional_notes: string
  poster_url?: string
  gallery_urls: string[]
  screening_link: string
  trailer_link?: string
  submitter_name: string
  submitter_email: string
  submitter_phone?: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  razorpay_order_id?: string
  razorpay_payment_id?: string
  payment_payer_name?: string
  payment_payer_email?: string
  payment_transaction_id?: string
  payment_notes?: string
  payment_screenshot_url?: string
  fee_paid: number
  created_at: string
  updated_at: string
}
